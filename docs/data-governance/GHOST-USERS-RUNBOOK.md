# Ghost Users Incident Runbook

**Priority:** P0 - Critical
**On-Call:** Isabel (Infrastructure), Buck (Data Engineering)
**Last Updated:** 2026-01-27

## Quick Reference

**Ghost User:** User exists in `auth.users` but NOT in `public.users`
**Impact:** User can authenticate but cannot use application
**Root Cause:** User sync trigger failure or disabled

## Incident Detection

### Automated Alerts

You'll receive an alert if:
- Daily monitoring detects ghost users (runs 2 AM UTC)
- User sync status changes to "critical"
- Manual quality check reports ghost users > 0

### Manual Check

```sql
-- Quick check for ghost users (returns count)
SELECT COUNT(*)
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

**Expected:** 0
**If > 0:** Follow this runbook

## Incident Response (10-Minute Checklist)

### Step 1: Assess Impact (2 mins)

```sql
-- Get ghost user details
SELECT
  au.id,
  au.email,
  au.created_at,
  EXTRACT(DAY FROM (NOW() - au.created_at))::INTEGER as days_old
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;
```

**Questions:**
- How many ghost users? __________
- When were they created? __________
- Are they recent (< 1 hour) or old (> 1 day)? __________

**Severity:**
- 1-5 users, recent: P1 (respond within 1 hour)
- > 5 users, recent: P0 (respond immediately)
- Any users > 1 day old: P0 (respond immediately)

### Step 2: Check Trigger Status (1 min)

```sql
-- Verify trigger is enabled
SELECT tgname, tgenabled, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

**Expected Output:**
```
tgname                | tgenabled | tgrelid
----------------------|-----------|---------
on_auth_user_created  | O         | auth.users
```

**If trigger is missing or disabled:**
- ✗ `tgenabled != 'O'`: Trigger is disabled → Go to Step 3A
- ✗ No rows returned: Trigger doesn't exist → Go to Step 3B

**If trigger is enabled:**
- ✓ Trigger exists and is enabled → Go to Step 3C

### Step 3A: Trigger is Disabled (HIGH PRIORITY)

**Why:** Someone manually disabled it or a deployment removed it

**Fix:**
```sql
-- Re-enable trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

**Verify:**
```sql
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Expected:** `tgenabled = 'O'`

**Then:** Go to Step 4 (Backfill)

### Step 3B: Trigger Doesn't Exist (CRITICAL)

**Why:** Migration was rolled back or never ran

**Fix:**
```sql
-- Re-run trigger creation migration
-- In production, use Supabase CLI:
-- supabase db reset --db-url <production-url>
-- OR manually run migration file
```

**Command:**
```bash
# From project root
supabase migration up --db-url $DATABASE_URL \
  --file supabase/migrations/20260127000001_create_user_sync_trigger.sql
```

**Verify:**
```sql
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

**Expected:**
- Trigger exists with `tgenabled = 'O'`
- Function exists

**Then:** Go to Step 4 (Backfill)

### Step 3C: Trigger Exists but Still Failing (INVESTIGATE)

**Possible Causes:**
1. Function has a bug
2. Permissions issue
3. Database constraint violation

**Investigate:**
```sql
-- Check recent database errors
SELECT * FROM pg_stat_database_conflicts;

-- Check function exists and permissions
SELECT
  p.proname,
  pg_get_functiondef(p.oid) as definition,
  array_agg(acl.privilege_type) as privileges
FROM pg_proc p
LEFT JOIN LATERAL aclexplode(p.proacl) acl ON true
WHERE p.proname = 'handle_new_user'
GROUP BY p.proname, p.oid;
```

**Escalate:**
- Slack: @isabel @buck "Ghost users detected, trigger exists but failing. Need help debugging."
- Include: Ghost user count, time range, error logs

**Then:** Go to Step 4 (Backfill) while investigation continues

### Step 4: Backfill Ghost Users (3 mins)

**Purpose:** Create missing public.users records for affected users

**Safety Check:**
```sql
-- Preview what will be created
SELECT
  au.id,
  au.email,
  COALESCE(au.email_confirmed_at IS NOT NULL, false) as email_verified,
  COALESCE(au.created_at, NOW()) as created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

**Backfill Command:**
```sql
-- Backfill ghost users
INSERT INTO public.users (
  id,
  email,
  email_verified,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(au.email_confirmed_at IS NOT NULL, false) as email_verified,
  COALESCE(au.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

**Verify:**
```sql
-- Should return 0
SELECT COUNT(*)
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

**Expected:** 0 ghost users

**Log the Backfill:**
```sql
-- Log to audit log
SELECT log_cleanup_job(
  'emergency_ghost_user_backfill',
  'one_time',
  'completed',
  <number_of_users_backfilled>,  -- GET DIAGNOSTICS ROW_COUNT from INSERT
  0,
  'Incident response: Backfilled ghost users due to <root_cause>'
);
```

### Step 5: Verify Fix (2 mins)

**Run Quality Check:**
```sql
SELECT * FROM run_user_sync_quality_check();
```

**Expected:**
```
check_name               | passed | issue_count | severity  | message
-------------------------|--------|-------------|-----------|---------------------------
ghost_users_check        | t      | 0           | critical  | No ghost users detected
orphaned_profiles_check  | t      | 0           | warning   | No orphaned profiles...
count_parity_check       | t      | 0           | critical  | User counts match: 1,234
trigger_exists_check     | t      | 0           | critical  | User sync trigger is active
```

**All checks should pass (passed = t)**

**Test New Signup:**
```bash
# Test that new signups work correctly
# In staging or production (use test email)
curl -X POST https://your-app.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test-ghost-fix@example.com","password":"TestPassword123!"}'
```

**Verify both records created:**
```sql
-- Should return 2 rows (one from each table)
SELECT 'auth.users' as source, id, email FROM auth.users
WHERE email = 'test-ghost-fix@example.com'
UNION ALL
SELECT 'public.users' as source, id, email FROM public.users
WHERE email = 'test-ghost-fix@example.com';
```

**Expected:** 2 rows with matching IDs

### Step 6: Notify Affected Users (5 mins)

**Get Affected User List:**
```sql
-- Export emails of users who were ghost users
-- Run this BEFORE backfill in Step 4
SELECT
  au.email,
  au.created_at,
  EXTRACT(DAY FROM (NOW() - au.created_at))::INTEGER as days_affected
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at;
```

**Notify Casey (Customer Success):**
- Slack: @casey "Ghost user incident affected X users. List: [attach CSV]"
- Casey will reach out to affected users
- Template: "We've resolved a technical issue that may have prevented you from accessing your account. Please try logging in again. If you experience any issues, reply to this email."

### Step 7: Post-Incident Tasks (After Resolution)

1. **Update Monitoring:**
   ```sql
   -- Record incident metrics
   SELECT record_user_sync_metrics();
   ```

2. **Document Incident:**
   - Create post-mortem doc in `/docs/incidents/`
   - Include: Root cause, detection time, resolution time, affected users
   - Action items to prevent recurrence

3. **Review Alerts:**
   - Did automated monitoring catch this? If not, why?
   - Update alert thresholds if needed

4. **Communicate:**
   - Slack #engineering: "Ghost user incident resolved. X users affected. Root cause: [explain]. Fix: [explain]."
   - Include link to post-mortem

## Common Scenarios

### Scenario 1: Single Ghost User (Recent)

**Context:** 1 user created in last hour, ghost user detected

**Likely Cause:** Transient database issue (timeout, network blip)

**Action:**
1. Backfill the single user (Step 4)
2. Monitor for recurrence (30 mins)
3. If no recurrence: Close incident as transient
4. If recurrence: Escalate to investigate trigger

**Severity:** P1

### Scenario 2: Multiple Ghost Users (Recent)

**Context:** 5+ users created in last hour, all ghost users

**Likely Cause:** Trigger disabled or function broken

**Action:**
1. Check trigger status (Step 2)
2. Fix trigger (Step 3A/3B)
3. Backfill users (Step 4)
4. Test new signup (Step 5)
5. Escalate if root cause unknown

**Severity:** P0

### Scenario 3: Old Ghost Users Discovered

**Context:** Ghost users from days/weeks ago just discovered

**Likely Cause:** Monitoring wasn't running, trigger was disabled in past

**Action:**
1. Backfill all ghost users (Step 4)
2. Verify trigger is now enabled (Step 2)
3. Review monitoring history to find when it broke
4. Post-mortem: Why didn't we detect this sooner?

**Severity:** P0 (historical data quality issue)

### Scenario 4: Orphaned Profiles (Reverse Problem)

**Context:** public.users records without auth.users

**Likely Cause:** Admin hard-deleted from auth.users

**Action:**
1. Identify orphaned profiles:
   ```sql
   SELECT * FROM check_orphaned_profiles();
   ```
2. Investigate: Were these users deleted intentionally?
3. If yes: Soft-delete from public.users
   ```sql
   UPDATE users
   SET deleted_at = NOW()
   WHERE id IN (SELECT user_id FROM check_orphaned_profiles());
   ```
4. If no: Escalate to understand why auth.users records disappeared

**Severity:** P2 (warning, not critical)

## Useful Queries

### Check Current Sync Status

```sql
SELECT * FROM get_latest_sync_status();
```

### View Last 7 Days of Monitoring

```sql
SELECT * FROM get_sync_status_history(7);
```

### Full Data Quality Report

```sql
SELECT * FROM run_user_sync_quality_check();
```

### Get Metrics for Dashboard

```sql
SELECT * FROM get_user_sync_stats();
```

## Escalation Path

| Severity | First Response | Escalate To | Escalate If |
|----------|----------------|-------------|-------------|
| P0 (> 5 users) | On-call engineer | Buck, Isabel | Not resolved in 15 mins |
| P1 (1-5 users) | On-call engineer | Buck, Isabel | Not resolved in 1 hour |
| P2 (orphaned) | Buck (async) | Isabel | Pattern of deletions |

**Slack Channels:**
- `#incidents` - All P0/P1 incidents
- `#data-quality` - Data quality discussions
- `#engineering` - General engineering

**On-Call:**
- Primary: Isabel (Infrastructure)
- Secondary: Buck (Data Engineering)
- Escalation: Engineering Manager

## Prevention Checklist

To prevent ghost user incidents:

- [ ] Daily monitoring runs at 2 AM UTC
- [ ] Alerts configured for critical status
- [ ] Trigger status checked in health checks
- [ ] Backup trigger (application-level) as failsafe?
- [ ] Integration tests for signup flow
- [ ] Regular review of monitoring history
- [ ] Post-deployment verification of trigger

## Related Documents

- [User Data Pipeline Documentation](/docs/data-governance/USER-DATA-PIPELINE.md)
- [Trigger Review (Buck)](/docs/data-governance/TRIGGER-REVIEW-BUCK.md)
- [Dashboard Spec (Ana)](/docs/data-governance/USER-SYNC-DASHBOARD-SPEC.md)
- [Data Retention Policy](/docs/data-governance/DATA-RETENTION-POLICY.md)

---

**Document Status:** Production Runbook
**Review Frequency:** After each incident
**Owner:** Buck (Data Engineering), Isabel (Infrastructure)
**Last Incident:** [None yet - new system]
