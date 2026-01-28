# User Data Pipeline Documentation

**Owner:** Buck (Data Engineering) + Isabel (Infrastructure)
**Last Updated:** 2026-01-27
**Status:** Production
**Priority:** P0 - Critical

## Overview

This document describes the user data pipeline that syncs authentication data from `auth.users` (Supabase managed) to `public.users` (application table). This pipeline is critical for preventing "ghost users" - users who can authenticate but lack application profiles.

## Problem Statement

### Ghost Users Bug

Before the implementation of this pipeline, users were created in `auth.users` during signup, but corresponding records in `public.users` were not always created. This led to:

- Users who could authenticate but couldn't use the application
- Data inconsistencies between auth and application layers
- Failed queries expecting user profile data
- Poor user experience (authentication succeeds, app fails)

### Root Cause

The application relied on manual creation of `public.users` records after authentication. This created race conditions and failure points where:

1. User signs up → `auth.users` record created
2. Application attempts to create `public.users` record
3. If step 2 fails (network issue, timeout, error), user becomes a "ghost"

## Solution Architecture

### Data Flow

```
User Signup
    ↓
auth.users INSERT
    ↓
[TRIGGER] on_auth_user_created
    ↓
handle_new_user() function
    ↓
public.users INSERT (with conflict handling)
    ↓
User has complete profile
```

### Components

#### 1. Source: `auth.users` (Supabase Managed)

**Schema:**
```sql
id                  UUID PRIMARY KEY
email               VARCHAR(255) UNIQUE
email_confirmed_at  TIMESTAMPTZ
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
...
```

**Ownership:** Supabase Auth Service
**Access:** Read-only for application
**Refresh:** Real-time (managed by Supabase)

#### 2. Trigger: `on_auth_user_created`

**Type:** AFTER INSERT
**Table:** `auth.users`
**Function:** `public.handle_new_user()`
**Timing:** Fires immediately after user creation

**Definition:**
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Migration:** `/supabase/migrations/20260127000001_create_user_sync_trigger.sql`

#### 3. Transform: `handle_new_user()` Function

**Purpose:** Sync new auth.users to public.users
**Type:** PL/pgSQL Trigger Function
**Security:** SECURITY DEFINER (runs with elevated privileges)

**Logic:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (
    id,                  -- Same UUID as auth.users
    email,               -- Email address
    email_verified,      -- Derived from email_confirmed_at
    created_at,          -- Timestamp
    updated_at           -- Timestamp
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Idempotency: prevents duplicates

  RETURN NEW;
END;
$$;
```

**Key Features:**
- **Idempotent:** `ON CONFLICT DO NOTHING` handles race conditions
- **Minimal data:** Only syncs essential fields
- **Secure:** SECURITY DEFINER with restricted search_path
- **Error handling:** Returns NEW on success, doesn't block auth.users insert

**Migration:** `/supabase/migrations/20260127000001_create_user_sync_trigger.sql`

#### 4. Destination: `public.users` (Application Table)

**Schema:**
```sql
id                 UUID PRIMARY KEY
email              VARCHAR(255) UNIQUE NOT NULL
email_verified     BOOLEAN DEFAULT FALSE
first_name         VARCHAR(100)
last_name          VARCHAR(100)
profile_photo_url  TEXT
created_at         TIMESTAMPTZ DEFAULT NOW()
updated_at         TIMESTAMPTZ DEFAULT NOW()
...
```

**Ownership:** Application
**Access:** Read/Write via RLS policies
**Refresh:** Real-time (via trigger)

**Grain:** One row per user
**Primary Key:** `id` (matches `auth.users.id`)
**Unique Constraint:** `email` (matches `auth.users.email`)

## Data Quality Checks

### Automated Daily Checks

**Function:** `run_user_sync_quality_check()`
**Schedule:** Daily at 2:00 AM UTC
**Migration:** `/supabase/migrations/20260127000003_create_user_sync_monitoring.sql`

#### Check 1: Ghost Users (CRITICAL)

**Query:**
```sql
SELECT COUNT(*) as ghost_users
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

**Expected:** 0
**Alert Threshold:** > 0
**Severity:** Critical

**Meaning:** Users in `auth.users` without `public.users` record

#### Check 2: Orphaned Profiles (WARNING)

**Query:**
```sql
SELECT COUNT(*) as orphaned_profiles
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;
```

**Expected:** 0
**Alert Threshold:** > 0
**Severity:** Warning

**Meaning:** Profiles in `public.users` without `auth.users` record (should never happen)

#### Check 3: Count Parity (CRITICAL)

**Query:**
```sql
SELECT
  (SELECT COUNT(*) FROM auth.users) as auth_count,
  (SELECT COUNT(*) FROM public.users) as public_count;
```

**Expected:** `auth_count = public_count`
**Alert Threshold:** `auth_count != public_count`
**Severity:** Critical

#### Check 4: Trigger Status (CRITICAL)

**Query:**
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

**Expected:** `tgenabled = 'O'` (enabled)
**Alert Threshold:** Missing or disabled
**Severity:** Critical

### Manual Diagnostic Queries

#### Find Ghost Users

```sql
SELECT * FROM check_ghost_users();
```

Returns:
- `auth_user_id`: ID of ghost user
- `email`: Email address
- `created_at`: When user was created
- `days_since_creation`: Age of ghost user

#### Find Orphaned Profiles

```sql
SELECT * FROM check_orphaned_profiles();
```

Returns:
- `user_id`: ID of orphaned profile
- `email`: Email address
- `created_at`: When profile was created
- `days_since_creation`: Age of profile

#### Get Sync Statistics

```sql
SELECT * FROM get_user_sync_stats();
```

Returns:
- `auth_users_total`: Count in auth.users
- `public_users_total`: Count in public.users
- `ghost_users`: Count of ghost users
- `orphaned_profiles`: Count of orphaned profiles
- `sync_discrepancy`: Absolute difference in counts

#### View Monitoring History

```sql
SELECT * FROM get_sync_status_history(30);  -- Last 30 days
```

Returns time-series data for charts:
- `date`: Calendar date
- `auth_users_count`: Users in auth.users
- `public_users_count`: Users in public.users
- `ghost_users_count`: Ghost users detected
- `orphaned_profiles_count`: Orphaned profiles
- `sync_status`: 'healthy', 'degraded', or 'critical'

## Monitoring & Alerting

### Monitoring Table

**Table:** `user_sync_monitoring_log`
**Purpose:** Time-series log of sync metrics
**Retention:** 90 days (configurable)

**Metrics Tracked:**
- User counts (auth, public, ghost, orphaned)
- Sync status (healthy/degraded/critical)
- Trigger status (enabled/disabled)
- Alert triggers and reasons
- Timestamp of check

### Daily Monitoring Job

**Function:** `record_user_sync_metrics()`
**Schedule:** Daily at 2:00 AM UTC
**Executor:** Edge Function (scheduled via pg_cron or external scheduler)

**Actions:**
1. Collect metrics from both tables
2. Run quality checks
3. Determine sync status
4. Record to monitoring log
5. Trigger alerts if needed

### Alert Conditions

| Condition | Severity | Alert Channel | Recipient |
|-----------|----------|---------------|-----------|
| Ghost users > 0 | Critical | Email + Slack | On-call engineer, Buck, Isabel |
| Orphaned profiles > 0 | Warning | Slack | Buck, Isabel |
| Trigger disabled | Critical | Email + Slack + PagerDuty | On-call engineer, Isabel |
| Count discrepancy | Critical | Email + Slack | Buck, Isabel, Casey |

### Dashboard Metrics

For Ana's admin dashboard:

```sql
-- Latest status (real-time)
SELECT * FROM get_latest_sync_status();

-- 30-day trend chart
SELECT * FROM get_sync_status_history(30);

-- Current statistics
SELECT * FROM get_user_sync_stats();
```

**Suggested Visualizations:**
1. **Status Card:** Current sync status (healthy/degraded/critical) with counts
2. **Line Chart:** User counts over time (auth.users vs public.users)
3. **Alert Log:** Recent alerts with reasons and timestamps
4. **Health Check:** Trigger status and last check time

## Backfill Process

### Initial Backfill

**Purpose:** Fix existing ghost users before trigger was implemented
**Migration:** `/supabase/migrations/20260127000002_backfill_ghost_users.sql`
**Status:** One-time migration (already run)

**Process:**
1. Identify ghost users: `SELECT * FROM check_ghost_users();`
2. Count affected users
3. Insert missing records into `public.users`
4. Verify no data loss
5. Log results to `cleanup_audit_log`

**Verification:**
```sql
-- Should return 0
SELECT COUNT(*)
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

### Future Backfills

If ghost users appear despite the trigger:

1. **Identify root cause:**
   - Check trigger status: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
   - Check for errors in logs
   - Review recent deployments

2. **Run diagnostic:**
   ```sql
   SELECT * FROM run_user_sync_quality_check();
   SELECT * FROM check_ghost_users();
   ```

3. **Manual backfill (if safe):**
   ```sql
   INSERT INTO public.users (id, email, email_verified, created_at, updated_at)
   SELECT
     au.id,
     au.email,
     COALESCE(au.email_confirmed_at IS NOT NULL, false),
     COALESCE(au.created_at, NOW()),
     NOW()
   FROM auth.users au
   LEFT JOIN public.users pu ON au.id = pu.id
   WHERE pu.id IS NULL
   ON CONFLICT (id) DO NOTHING;
   ```

4. **Verify:**
   ```sql
   SELECT * FROM get_user_sync_stats();
   ```

5. **Log:**
   ```sql
   SELECT log_cleanup_job(
     'manual_ghost_user_backfill',
     'one_time',
     'completed',
     <row_count>,
     0,
     'Backfilled ghost users due to <reason>'
   );
   ```

## Troubleshooting Guide

### Issue: Ghost Users Detected

**Symptoms:**
- `check_ghost_users()` returns rows
- `get_user_sync_stats()` shows `ghost_users > 0`
- Users report "profile not found" errors after signup

**Investigation:**
1. Check trigger status:
   ```sql
   SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Check trigger function:
   ```sql
   SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. Review recent ghost users:
   ```sql
   SELECT * FROM check_ghost_users() ORDER BY created_at DESC LIMIT 10;
   ```

4. Check database logs for errors

**Resolution:**
1. If trigger is disabled: Re-enable it
2. If trigger is missing: Re-run migration `20260127000001_create_user_sync_trigger.sql`
3. If function has errors: Fix function and re-deploy
4. Run backfill for affected users (see Backfill Process above)

### Issue: Orphaned Profiles Detected

**Symptoms:**
- `check_orphaned_profiles()` returns rows
- Users exist in `public.users` but not `auth.users`

**Investigation:**
1. Identify orphaned profiles:
   ```sql
   SELECT * FROM check_orphaned_profiles();
   ```

2. Check if profiles were manually created or migrated

3. Check if auth.users records were deleted (soft delete issue)

**Resolution:**
- **If profiles are valid:** This indicates users were hard-deleted from auth.users. Consider soft-delete policy.
- **If profiles are invalid:** Remove orphaned profiles (carefully, with backup)

### Issue: Trigger Not Firing

**Symptoms:**
- New signups don't create `public.users` records
- Trigger exists but ghost users still appear

**Investigation:**
1. Test trigger manually:
   ```sql
   -- In development environment only!
   INSERT INTO auth.users (id, email, email_confirmed_at)
   VALUES (uuid_generate_v4(), 'test@example.com', NOW());

   -- Check if public.users record was created
   SELECT * FROM public.users WHERE email = 'test@example.com';
   ```

2. Check function permissions:
   ```sql
   SELECT * FROM information_schema.routine_privileges
   WHERE routine_name = 'handle_new_user';
   ```

**Resolution:**
1. Re-run migration to recreate trigger
2. Grant necessary permissions to trigger function
3. Check for conflicting triggers or constraints

### Issue: Count Discrepancy

**Symptoms:**
- `auth.users` count ≠ `public.users` count
- No ghost users or orphaned profiles detected

**Investigation:**
1. Get detailed counts:
   ```sql
   SELECT * FROM get_user_sync_stats();
   ```

2. Check for deleted users:
   ```sql
   SELECT COUNT(*) FROM users WHERE deleted_at IS NOT NULL;
   ```

3. Check for soft-deleted auth users:
   ```sql
   SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NOT NULL;
   ```

**Resolution:**
- If due to soft deletes: This is expected behavior, update monitoring to exclude soft-deleted users
- If due to other reasons: Investigate and run backfill if needed

## Performance Considerations

### Trigger Overhead

**Impact:** ~1-2ms per user signup
**Acceptable:** Yes, critical for data integrity
**Optimization:** Trigger is optimized with:
- Single INSERT operation
- No complex logic or joins
- ON CONFLICT for idempotency (no duplicate checks needed)

### Monitoring Overhead

**Daily check:** ~100-500ms (depends on user count)
**Impact:** Negligible (runs at 2 AM UTC)
**Retention:** 90 days of monitoring logs (~1KB per day)

### Scaling Considerations

- **< 100K users:** Current architecture is optimal
- **100K - 1M users:** Consider partitioning monitoring logs by month
- **> 1M users:** Consider sampling strategy for daily checks (check random 10% of users)

## Migration Files

1. **Trigger Creation:** `/supabase/migrations/20260127000001_create_user_sync_trigger.sql`
   - Creates `handle_new_user()` function
   - Creates `on_auth_user_created` trigger
   - Grants permissions

2. **Backfill:** `/supabase/migrations/20260127000002_backfill_ghost_users.sql`
   - One-time backfill of existing ghost users
   - Logs to `cleanup_audit_log`

3. **Monitoring:** `/supabase/migrations/20260127000003_create_user_sync_monitoring.sql`
   - Creates monitoring functions
   - Creates `user_sync_monitoring_log` table
   - Sets up quality checks

## Related Documentation

- [Data Retention Policy](/docs/data-governance/DATA-RETENTION-POLICY.md)
- [Data Warehouse Architecture](/docs/data-governance/DATA-WAREHOUSE-ARCHITECTURE.md)
- [Auth Architecture](/docs/auth/ARCHITECTURE.md)
- [Monitoring Service](/docs/MONITORING.md)

## Runbook Summary

### Daily Operations

1. **Automated monitoring runs at 2 AM UTC**
   - Checks sync status
   - Records metrics
   - Sends alerts if issues detected

2. **Review dashboard daily**
   - Check sync status card (should be "healthy")
   - Review any alerts from past 24 hours

### Weekly Operations

1. **Review monitoring history**
   ```sql
   SELECT * FROM get_sync_status_history(7);
   ```

2. **Verify trigger status**
   ```sql
   SELECT * FROM run_user_sync_quality_check();
   ```

### Monthly Operations

1. **Generate data quality report**
   ```sql
   SELECT * FROM get_sync_status_history(30);
   SELECT * FROM generate_retention_report();  -- From cleanup functions
   ```

2. **Review and clean old monitoring logs**
   ```sql
   DELETE FROM user_sync_monitoring_log
   WHERE checked_at < NOW() - INTERVAL '90 days';
   ```

### Incident Response

**Priority:** P0 - Critical
**On-Call:** Isabel (Infrastructure), Buck (Data Engineering)

**If ghost users detected:**
1. Run diagnostic: `SELECT * FROM check_ghost_users();`
2. Check trigger: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
3. Notify affected users (coordinate with Casey)
4. Run backfill (see Backfill Process)
5. Fix root cause
6. Document incident in post-mortem

---

**Document Status:** Production
**Next Review:** 2026-02-27
**Owner:** Buck (Data Engineering)
**Reviewers:** Isabel (Infrastructure), Ana (Analytics), Casey (Customer Success)
