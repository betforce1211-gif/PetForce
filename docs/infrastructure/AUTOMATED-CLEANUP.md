# Automated Data Cleanup Infrastructure

**Purpose**: Self-maintaining database that automatically cleans up expired sessions, tokens, and old data according to the Data Retention Policy.

**Owner**: Infrastructure (Isabel) + Data Engineering (Buck)
**Created**: 2026-01-25
**Status**: IMPLEMENTED
**Related**: Data Retention Policy v1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Cleanup Schedules](#cleanup-schedules)
4. [Database Functions](#database-functions)
5. [Deployment](#deployment)
6. [Monitoring](#monitoring)
7. [Manual Operations](#manual-operations)
8. [Troubleshooting](#troubleshooting)

---

## Overview

PetForce implements automated cleanup to:

1. **Maintain database performance** - Remove expired tokens and sessions
2. **Comply with data retention policies** - Delete old data according to GDPR/CCPA
3. **Reduce storage costs** - Archive or delete data no longer needed
4. **Protect user privacy** - Remove PII when no longer necessary

### Design Philosophy

> "Infrastructure as code. Reliability as culture. Scale as needed."

This automation follows Isabel's principles:
- **Self-maintaining** - Database cleans itself without manual intervention
- **Observable** - All cleanup jobs are logged and monitored
- **Reliable** - Failures are detected and alerted
- **Cost-effective** - Reduces storage costs by removing old data

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                  GitHub Actions Scheduler                    │
│  - Daily: 2 AM UTC                                          │
│  - Weekly: Sunday 3 AM UTC                                  │
│  - Monthly: 1st of month 4 AM UTC                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Function                         │
│  /functions/scheduled-cleanup                               │
│  - Authenticates with service role                          │
│  - Calls database cleanup functions                         │
│  - Logs results to audit table                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           PostgreSQL Cleanup Functions                      │
│  - run_daily_cleanup()                                      │
│  - run_weekly_cleanup()                                     │
│  - run_monthly_cleanup()                                    │
│  - Deletes expired/old records                              │
│  - Returns metrics (count, execution time)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Cleanup Audit Log                            │
│  Table: cleanup_audit_log                                   │
│  - Tracks job execution                                     │
│  - Success/failure status                                   │
│  - Records affected                                         │
│  - Execution time                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Database Layer (PostgreSQL Functions)

All cleanup logic resides in PostgreSQL functions for:
- **Security** - Functions run with SECURITY DEFINER (elevated privileges)
- **Atomicity** - Deletes happen in transactions
- **Performance** - Database-native operations are faster than application code
- **Testability** - Can run functions manually for testing

**Location**: `/supabase/migrations/20260125000002_create_cleanup_functions.sql`

### Edge Function Layer (Supabase Functions)

Supabase Edge Function acts as scheduler trigger:
- **Stateless** - No state between invocations
- **Authenticated** - Requires service role key
- **Observable** - Logs results to audit table
- **Idempotent** - Safe to run multiple times

**Location**: `/supabase/functions/scheduled-cleanup/index.ts`

### Scheduler Layer (GitHub Actions)

GitHub Actions provides reliable scheduling:
- **Free** - Included with GitHub
- **Reliable** - 99.9% uptime SLA
- **Observable** - Logs visible in Actions tab
- **Flexible** - Can trigger manually for testing

**Location**: `/.github/workflows/scheduled-cleanup.yml`

---

## Cleanup Schedules

### Daily Cleanup (2 AM UTC)

**Frequency**: Every day at 2 AM UTC

**Tasks**:
1. Delete expired email verification tokens (>1 hour old)
2. Delete expired password reset tokens (>1 hour old)
3. Delete expired magic link tokens (>15 minutes old)
4. Delete expired sessions (>30 days old)
5. Delete old rate limit records (>24 hours old)

**Expected Volume**: 10-100 records/day (light traffic)

**Execution Time**: <1 second

**SQL Function**: `run_daily_cleanup()`

### Weekly Cleanup (Sunday 3 AM UTC)

**Frequency**: Every Sunday at 3 AM UTC

**Tasks**:
1. Hard delete soft-deleted users (>30 days in soft-delete state)
2. Remove PII from old session metadata (>90 days old)

**Expected Volume**: 0-10 users/week (early stage)

**Execution Time**: <5 seconds

**SQL Function**: `run_weekly_cleanup()`

### Monthly Cleanup (1st of Month 4 AM UTC)

**Frequency**: 1st of each month at 4 AM UTC

**Tasks**:
1. Soft delete inactive users (>2 years no login)
2. Generate data retention compliance report

**Expected Volume**: 0-5 users/month (early stage)

**Execution Time**: <10 seconds

**SQL Function**: `run_monthly_cleanup()`

---

## Database Functions

### Daily Cleanup Functions

#### `cleanup_expired_email_verifications()`
Deletes email verification tokens that have expired.

```sql
-- Run manually
SELECT * FROM cleanup_expired_email_verifications();
-- Returns: deleted_count
```

#### `cleanup_expired_password_resets()`
Deletes password reset tokens that have expired.

```sql
SELECT * FROM cleanup_expired_password_resets();
-- Returns: deleted_count
```

#### `cleanup_expired_magic_links()`
Deletes magic link tokens that have expired.

```sql
SELECT * FROM cleanup_expired_magic_links();
-- Returns: deleted_count
```

#### `cleanup_expired_sessions()`
Deletes sessions with expired refresh tokens.

```sql
SELECT * FROM cleanup_expired_sessions();
-- Returns: deleted_count
```

#### `run_daily_cleanup()`
Master function that runs all daily cleanup tasks.

```sql
SELECT * FROM run_daily_cleanup();
-- Returns:
-- task                 | deleted_count | execution_time_ms
-- email_verifications  | 15            | 12
-- password_resets      | 3             | 8
-- magic_links          | 0             | 5
-- sessions             | 42            | 35
-- rate_limits          | 127           | 18
```

### Weekly Cleanup Functions

#### `cleanup_soft_deleted_users()`
Hard deletes users who were soft-deleted more than 30 days ago.

**Cascade Behavior**: Deletes related records via foreign key cascades:
- Sessions
- Email verifications
- Password resets
- OAuth connections
- Biometric devices

```sql
SELECT * FROM cleanup_soft_deleted_users();
-- Returns: deleted_count
```

#### `cleanup_old_session_metadata()`
Removes PII from session metadata older than 90 days (keeps session for audit, removes metadata).

```sql
SELECT * FROM cleanup_old_session_metadata();
-- Returns: updated_count
```

#### `run_weekly_cleanup()`
Master function for weekly cleanup tasks.

```sql
SELECT * FROM run_weekly_cleanup();
-- Returns:
-- task                  | affected_count | execution_time_ms
-- soft_deleted_users    | 2              | 45
-- session_metadata      | 15             | 28
```

### Monthly Cleanup Functions

#### `cleanup_inactive_users()`
Soft deletes users who haven't logged in for 2+ years.

**Warnings**: Returns count of users approaching inactivity (18 months) for monitoring.

```sql
SELECT * FROM cleanup_inactive_users();
-- Returns: (warned_count, soft_deleted_count)
-- Example: (5, 1) - 5 users warned, 1 user soft-deleted
```

#### `run_monthly_cleanup()`
Master function for monthly cleanup tasks.

```sql
SELECT * FROM run_monthly_cleanup();
-- Returns:
-- task                      | affected_count | execution_time_ms
-- inactive_users_warned     | 5              | 65
-- inactive_users_deleted    | 1              | 0
```

### Monitoring Functions

#### `generate_retention_report()`
Generates data retention compliance report showing records exceeding retention thresholds.

```sql
SELECT * FROM generate_retention_report();
-- Returns:
-- table_name           | total_records | oldest_record | newest_record | records_over_retention | retention_threshold
-- users                | 1523          | 2024-01-01    | 2026-01-25    | 3                      | 2 years (inactive)
-- sessions             | 456           | 2025-12-01    | 2026-01-25    | 12                     | 30 days (expired)
-- email_verifications  | 89            | 2026-01-24    | 2026-01-25    | 0                      | 1 hour (expired)
```

---

## Deployment

### Initial Setup

1. **Apply database migration**:
   ```bash
   # Local development
   cd supabase
   supabase migration up

   # Production (Supabase Dashboard)
   # Go to Database > Migrations > Run migration
   ```

2. **Deploy Edge Function**:
   ```bash
   # Deploy to Supabase
   supabase functions deploy scheduled-cleanup

   # Set environment variables (if not already set)
   supabase secrets set SUPABASE_URL=https://your-project.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Configure GitHub Secrets**:
   ```bash
   # In GitHub repo settings > Secrets and variables > Actions
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Enable GitHub Actions workflow**:
   - Workflow is located at `/.github/workflows/scheduled-cleanup.yml`
   - Automatically enabled when file is committed to main branch
   - Verify in GitHub > Actions tab

### Testing Before Production

Test cleanup functions manually before enabling automation:

```sql
-- 1. Check current data
SELECT * FROM generate_retention_report();

-- 2. Run daily cleanup (safe - only deletes expired records)
SELECT * FROM run_daily_cleanup();

-- 3. Verify no issues
SELECT * FROM cleanup_audit_log ORDER BY started_at DESC LIMIT 5;

-- 4. Test weekly cleanup (more aggressive)
SELECT * FROM run_weekly_cleanup();

-- 5. Test monthly cleanup (most aggressive)
SELECT * FROM run_monthly_cleanup();
```

### Manual Trigger (GitHub Actions)

Trigger cleanup jobs manually for testing:

1. Go to GitHub > Actions tab
2. Select "Scheduled Data Cleanup" workflow
3. Click "Run workflow"
4. Select job type (daily, weekly, or monthly)
5. Click "Run workflow" button

---

## Monitoring

### Cleanup Audit Log

All cleanup job executions are logged to `cleanup_audit_log` table.

**View recent jobs**:
```sql
SELECT
  job_name,
  job_type,
  started_at,
  status,
  records_affected,
  execution_time_ms,
  error_message
FROM cleanup_audit_log
ORDER BY started_at DESC
LIMIT 10;
```

**Detect failures**:
```sql
SELECT * FROM cleanup_audit_log
WHERE status = 'failed'
ORDER BY started_at DESC;
```

**Calculate success rate**:
```sql
SELECT
  job_type,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_runs,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*), 2) as success_rate_pct
FROM cleanup_audit_log
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY job_type;
```

### GitHub Actions Monitoring

- **View job history**: GitHub > Actions > "Scheduled Data Cleanup"
- **Email notifications**: Enable in GitHub repo settings (failures only)
- **Logs**: Click on individual job runs to view detailed logs

### Alerts (Future Enhancement)

When monitoring service is set up (Datadog, Sentry, etc.):

**Critical Alerts**:
- Cleanup job failure (3 consecutive failures)
- Cleanup execution time >60 seconds (performance degradation)
- Records exceeding retention policy by >7 days (compliance risk)

**Warning Alerts**:
- Cleanup job skipped (GitHub Actions issue)
- Cleanup deleted 0 records when >0 expected (logic issue)
- High volume of inactive users (18+ months) approaching deletion

---

## Manual Operations

### Force Cleanup Now

Run cleanup immediately without waiting for schedule:

**Via GitHub Actions**:
1. Go to GitHub > Actions > "Scheduled Data Cleanup"
2. Click "Run workflow"
3. Select job type
4. Click "Run workflow" button

**Via SQL (Database Access)**:
```sql
-- Daily cleanup
SELECT * FROM run_daily_cleanup();

-- Weekly cleanup
SELECT * FROM run_weekly_cleanup();

-- Monthly cleanup
SELECT * FROM run_monthly_cleanup();
```

**Via API (cURL)**:
```bash
# Daily cleanup
curl -X POST \
  "https://your-project.supabase.co/functions/v1/scheduled-cleanup?type=daily" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"

# Weekly cleanup
curl -X POST \
  "https://your-project.supabase.co/functions/v1/scheduled-cleanup?type=weekly" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# Monthly cleanup
curl -X POST \
  "https://your-project.supabase.co/functions/v1/scheduled-cleanup?type=monthly" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Disable Cleanup Temporarily

If cleanup jobs are causing issues:

**Option 1: Disable GitHub Actions workflow**:
```yaml
# In .github/workflows/scheduled-cleanup.yml
# Comment out or remove the schedule section
# on:
#   schedule:
#     - cron: '0 2 * * *'  # DISABLED
```

**Option 2: Revoke function permissions** (emergency):
```sql
-- Revoke execute permissions (prevents Edge Function from running)
REVOKE EXECUTE ON FUNCTION run_daily_cleanup() FROM service_role;
REVOKE EXECUTE ON FUNCTION run_weekly_cleanup() FROM service_role;
REVOKE EXECUTE ON FUNCTION run_monthly_cleanup() FROM service_role;

-- Re-enable later
GRANT EXECUTE ON FUNCTION run_daily_cleanup() TO service_role;
GRANT EXECUTE ON FUNCTION run_weekly_cleanup() TO service_role;
GRANT EXECUTE ON FUNCTION run_monthly_cleanup() TO service_role;
```

### Generate Compliance Report

Generate data retention compliance report on-demand:

```sql
-- Full report
SELECT * FROM generate_retention_report();

-- Export to CSV (via Supabase Dashboard or psql)
\copy (SELECT * FROM generate_retention_report()) TO '/tmp/retention_report.csv' CSV HEADER;
```

---

## Troubleshooting

### Cleanup Job Failed

**Symptoms**: GitHub Actions shows red X, or `cleanup_audit_log` shows `status = 'failed'`

**Diagnosis**:
1. Check GitHub Actions logs for error message
2. Query audit log:
   ```sql
   SELECT * FROM cleanup_audit_log WHERE status = 'failed' ORDER BY started_at DESC LIMIT 1;
   ```

**Common Causes**:
- **Database connection timeout**: Increase function timeout
- **Foreign key constraint violation**: Orphaned records (investigate data integrity)
- **Insufficient permissions**: Check service role grants

**Resolution**:
```sql
-- Check for orphaned records
SELECT * FROM sessions WHERE user_id NOT IN (SELECT id FROM users);

-- Fix orphaned records
DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users);

-- Re-run cleanup
SELECT * FROM run_daily_cleanup();
```

### Cleanup Deleted Too Many Records

**Symptoms**: `records_affected` is unexpectedly high

**Diagnosis**:
```sql
-- Check recent cleanup
SELECT * FROM cleanup_audit_log ORDER BY started_at DESC LIMIT 5;

-- Verify retention report
SELECT * FROM generate_retention_report();
```

**Common Causes**:
- **Clock skew**: Server time is incorrect (check `NOW()`)
- **Bulk user deletion**: Many users deleted accounts simultaneously
- **Test data cleanup**: Cleanup ran on test data

**Resolution**:
- Review data retention policy thresholds
- Adjust retention periods if needed
- Restore from backup if accidental deletion

### Cleanup Execution Time Too Long

**Symptoms**: `execution_time_ms` >10 seconds (daily), >30 seconds (weekly), >60 seconds (monthly)

**Diagnosis**:
```sql
-- Check execution time trend
SELECT
  job_name,
  AVG(execution_time_ms) as avg_time_ms,
  MAX(execution_time_ms) as max_time_ms
FROM cleanup_audit_log
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY job_name;
```

**Common Causes**:
- **Database under load**: Other queries slowing down cleanup
- **Large data volume**: Many expired records to delete
- **Missing indexes**: Queries doing full table scans

**Resolution**:
```sql
-- Check for missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN ('sessions', 'email_verifications', 'password_resets', 'magic_links');

-- Optimize queries with EXPLAIN ANALYZE
EXPLAIN ANALYZE DELETE FROM sessions WHERE refresh_token_expires_at < NOW();
```

### Records Not Being Deleted

**Symptoms**: `generate_retention_report()` shows `records_over_retention > 0` even after cleanup

**Diagnosis**:
```sql
-- Check if cleanup is running
SELECT * FROM cleanup_audit_log ORDER BY started_at DESC LIMIT 5;

-- Check if records meet deletion criteria
SELECT COUNT(*) FROM sessions WHERE refresh_token_expires_at < NOW();
```

**Common Causes**:
- **Cleanup not running**: GitHub Actions disabled or failing
- **Logic error**: Deletion criteria incorrect
- **Permissions issue**: Service role can't delete records

**Resolution**:
```sql
-- Test individual cleanup functions
SELECT * FROM cleanup_expired_sessions();

-- Check function permissions
SELECT has_function_privilege('service_role', 'cleanup_expired_sessions()', 'EXECUTE');

-- Manually delete if needed
DELETE FROM sessions WHERE refresh_token_expires_at < NOW();
```

---

## Cost Optimization

### Storage Cost Savings

Automated cleanup reduces database storage costs:

**Assumptions**:
- 10,000 users
- 500 expired sessions/day
- 100 expired tokens/day
- Average row size: 1 KB

**Without Cleanup**:
- Sessions: 500 rows/day × 365 days = 182,500 rows/year × 1 KB = **182 MB/year**
- Tokens: 100 rows/day × 365 days = 36,500 rows/year × 1 KB = **36 MB/year**
- Total: **218 MB/year** × $0.10/GB/month = **$2.62/year**

**With Cleanup**:
- Sessions: 0 expired rows (deleted daily)
- Tokens: 0 expired rows (deleted daily)
- Total: **$0/year**

**Savings**: **$2.62/year** (small now, scales with user growth)

### Performance Benefits

Smaller tables = faster queries:

**Query Performance**:
- Index lookups: O(log n) - smaller index = faster lookup
- Table scans: O(n) - fewer rows = faster scan
- Joins: O(n × m) - smaller tables = faster joins

**Example**:
- **Without cleanup**: 182,500 session rows → 200ms query time
- **With cleanup**: 5,000 active session rows → 50ms query time
- **Improvement**: 75% faster queries

---

## Future Enhancements

### Phase 1: Cold Storage Archive (Q2 2026)

Archive old transaction data to S3 Glacier for long-term retention:

```sql
-- Archive transactions older than 1 year
CREATE OR REPLACE FUNCTION archive_old_transactions()
RETURNS TABLE(archived_count BIGINT) AS $$
BEGIN
  -- Export to S3 Glacier
  -- Delete from primary database
  -- Return count
END;
$$ LANGUAGE plpgsql;
```

**Savings**: 96% storage cost reduction (see Data Retention Policy)

### Phase 2: Intelligent Cleanup Scheduling (Q3 2026)

Adjust cleanup frequency based on data volume:

- Low traffic: Run daily cleanup every 6 hours
- High traffic: Run daily cleanup every hour
- Adaptive thresholds based on growth rate

### Phase 3: Self-Healing (Q4 2026)

Detect and fix data integrity issues automatically:

- Orphaned records detection
- Broken foreign key cleanup
- Duplicate record removal
- Index rebuilding

---

## References

- [Data Retention Policy v1.0](/docs/data-governance/DATA-RETENTION-POLICY.md)
- [Data Retention Lifecycle](/docs/data-governance/DATA-RETENTION-LIFECYCLE.md)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [GitHub Actions Scheduled Workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

---

## Approval & Review

| Role | Name | Approval Date | Status |
|------|------|---------------|--------|
| Infrastructure (Isabel) | Isabel | 2026-01-25 | ✅ Implemented |
| Data Engineering (Buck) | Buck | 2026-01-25 | ✅ Approved |
| Security (Samantha) | Samantha | TBD | Pending review |

**Next Review Date**: 2026-02-25 (Monthly)

**Change Log**:
- 2026-01-25: Initial implementation (Isabel + Buck)

---

**Document Version**: 1.0
**Status**: ACTIVE - Cleanup automation is live
