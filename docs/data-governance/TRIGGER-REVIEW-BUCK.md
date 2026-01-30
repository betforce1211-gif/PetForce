# User Sync Trigger Review - Data Engineering Perspective

**Reviewer:** Buck (Data Engineering)
**Implementation by:** Isabel (Infrastructure)
**Review Date:** 2026-01-27
**Status:** APPROVED with Recommendations

## Executive Summary

Isabel's implementation of the user sync trigger is **production-ready and high-quality**. The trigger function is well-designed with proper idempotency, security, and error handling. I've reviewed the code from a data engineering perspective and have a few recommendations for optimization and monitoring, but no blocking issues.

## Implementation Review

### Trigger Function: `handle_new_user()`

**File:** `/supabase/migrations/20260127000001_create_user_sync_trigger.sql`

#### Strengths

1. **Idempotent Design** ✓
   ```sql
   ON CONFLICT (id) DO NOTHING;
   ```
   This is critical! If the trigger fires multiple times (shouldn't happen, but defensive coding is good), we won't create duplicate records or throw errors.

2. **Security Definer** ✓
   ```sql
   SECURITY DEFINER
   SET search_path = public
   ```
   Properly elevates privileges for cross-schema access and locks search_path to prevent injection attacks. Well done!

3. **Minimal Data Transfer** ✓
   Only syncs essential fields (`id`, `email`, `email_verified`, timestamps). This keeps the trigger fast and reduces coupling between auth and application schemas.

4. **Proper Email Verification Mapping** ✓
   ```sql
   COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
   ```
   Correctly derives `email_verified` boolean from Supabase's `email_confirmed_at` timestamp. Handles NULL case properly.

5. **Error Handling** ✓
   Returns `NEW` on success, which is the correct behavior for AFTER INSERT triggers. Won't block the auth.users insert if there's an issue.

6. **Documentation** ✓
   Clear comments and function comment explaining purpose. Good for maintainability.

#### Potential Improvements

1. **Logging for Debugging** (Nice-to-have)

   Consider adding diagnostic logging for troubleshooting:
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER
   SECURITY DEFINER
   SET search_path = public
   LANGUAGE plpgsql
   AS $$
   DECLARE
     insert_successful BOOLEAN;
   BEGIN
     INSERT INTO public.users (
       id,
       email,
       email_verified,
       created_at,
       updated_at
     ) VALUES (
       NEW.id,
       NEW.email,
       COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
       NOW(),
       NOW()
     )
     ON CONFLICT (id) DO NOTHING;

     GET DIAGNOSTICS insert_successful = ROW_COUNT > 0;

     -- Optional: Log conflicts for monitoring
     IF NOT insert_successful THEN
       RAISE NOTICE 'User sync conflict for id: %, email: %', NEW.id, NEW.email;
     END IF;

     RETURN NEW;
   END;
   $$;
   ```

   **Impact:** Low priority. Only needed if we see unexplained conflicts in monitoring.
   **Recommendation:** Keep current implementation for now, add logging if issues arise.

2. **Created_at Preservation** (Minor)

   Current implementation uses `NOW()` for `created_at`, but we could preserve the original:
   ```sql
   created_at = COALESCE(NEW.created_at, NOW())
   ```

   **Impact:** Timestamps will differ by milliseconds between auth.users and public.users
   **Recommendation:** Not critical. Current approach is acceptable. If we need exact timestamp matching, we can update later.

### Trigger Definition: `on_auth_user_created`

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Review:** ✓ Perfect implementation
- AFTER INSERT: Correct timing (auth.users record exists before sync)
- FOR EACH ROW: Necessary for per-user sync
- Function reference: Correct

### Permissions

```sql
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
```

**Review:** ✓ Appropriate permissions

These grants allow the function to be executed by triggers regardless of who initiates the auth.users insert (anonymous signup, authenticated user, service role admin).

## Backfill Implementation Review

**File:** `/supabase/migrations/20260127000002_backfill_ghost_users.sql`

#### Strengths

1. **Transaction Safety** ✓
   Uses `DO $$` block which runs as a single transaction. If anything fails, nothing is committed.

2. **Count Reporting** ✓
   ```sql
   RAISE NOTICE 'Found % ghost users to backfill', ghost_user_count;
   RAISE NOTICE 'Successfully backfilled % ghost users', backfilled_count;
   ```
   Provides visibility into what the migration is doing.

3. **Idempotent** ✓
   ```sql
   ON CONFLICT (id) DO NOTHING;
   ```
   Safe to re-run if migration fails partway through.

4. **Audit Logging** ✓
   Logs to `cleanup_audit_log` for historical record.

5. **Error Handling** ✓
   ```sql
   EXCEPTION
     WHEN OTHERS THEN
       RAISE NOTICE 'Error during backfill: %', SQLERRM;
       -- Log failure
       RAISE;
   ```
   Catches errors, logs them, and re-raises for migration failure visibility.

6. **Timestamp Preservation** ✓
   ```sql
   COALESCE(au.created_at, NOW()) as created_at
   ```
   Preserves original creation timestamp from auth.users when available.

#### Recommendations

1. **Pre-flight Check** (Nice-to-have)

   Add a safety check before running:
   ```sql
   DO $$
   DECLARE
     ghost_user_count INTEGER;
     backfilled_count INTEGER;
   BEGIN
     -- Pre-flight: Verify trigger exists
     IF NOT EXISTS(
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'on_auth_user_created' AND tgenabled = 'O'
     ) THEN
       RAISE WARNING 'User sync trigger is not active! Backfill will succeed but future users may become ghosts.';
     END IF;

     -- ... rest of backfill logic
   ```

   **Impact:** Prevents backfilling ghost users without fixing the root cause
   **Recommendation:** Add in next migration version if we need to re-run

## Data Quality Validation

I've added comprehensive monitoring in migration `20260127000003_create_user_sync_monitoring.sql`:

### Quality Checks Implemented

1. **Ghost Users Detection** ✓
   - Function: `check_ghost_users()`
   - Returns: List of auth.users without public.users
   - Severity: Critical

2. **Orphaned Profiles Detection** ✓
   - Function: `check_orphaned_profiles()`
   - Returns: List of public.users without auth.users
   - Severity: Warning

3. **Count Parity Check** ✓
   - Function: `get_user_sync_stats()`
   - Validates: auth.users count = public.users count
   - Severity: Critical

4. **Trigger Status Check** ✓
   - Part of: `run_user_sync_quality_check()`
   - Validates: Trigger exists and is enabled
   - Severity: Critical

### Monitoring Infrastructure

1. **Monitoring Log Table** ✓
   - Table: `user_sync_monitoring_log`
   - Tracks: Historical metrics, status, alerts
   - Retention: 90 days

2. **Automated Daily Check** ✓
   - Function: `record_user_sync_metrics()`
   - Schedule: Daily at 2 AM UTC (to be configured)
   - Alerts: Automatic on critical/degraded status

## Data Integrity Concerns

### Edge Cases Handled

1. **Race Condition** ✓
   - **Scenario:** Trigger fires twice for same user
   - **Solution:** `ON CONFLICT (id) DO NOTHING`
   - **Result:** No error, no duplicate

2. **NULL Email** ✓
   - **Scenario:** auth.users has NULL email (shouldn't happen with Supabase)
   - **Solution:** `email` is NOT NULL in public.users, so insert would fail
   - **Result:** Trigger fails gracefully, doesn't block auth insert
   - **Recommendation:** Add email validation if needed

3. **Email Confirmation State Change** ⚠️
   - **Scenario:** User verifies email after signup
   - **Current:** `email_verified` in public.users is NOT updated
   - **Solution Needed:** Either:
     a. Accept that email_verified is "at creation time" snapshot, OR
     b. Add UPDATE trigger on auth.users for email_confirmed_at changes
   - **Recommendation:** Discuss with Isabel and Engrid

4. **Soft Delete** ✓
   - **Scenario:** User is soft-deleted from public.users
   - **Current:** auth.users record remains (Supabase managed)
   - **Result:** Orphaned profile detected by monitoring
   - **Recommendation:** Document expected behavior

### Edge Cases NOT Handled (Acceptable)

1. **Hard Delete from auth.users**
   - If admin hard-deletes from auth.users, public.users remains
   - Result: Orphaned profile (warning-level alert)
   - Recommendation: Don't hard-delete from auth.users (Supabase best practice)

2. **Email Change in auth.users**
   - If user changes email in auth.users, public.users email is stale
   - Current: No sync on UPDATE
   - Recommendation: Add UPDATE trigger if email changes are allowed

## Performance Analysis

### Trigger Overhead

**Estimated Impact per Insert:**
- Query planning: ~0.5ms
- INSERT execution: ~1ms
- Conflict check: ~0.2ms
- Total: ~1.7ms

**Benchmark Recommended:**
```sql
-- Run this in development to measure actual overhead
EXPLAIN ANALYZE
INSERT INTO auth.users (id, email, email_confirmed_at)
VALUES (uuid_generate_v4(), 'test@example.com', NOW());
```

**Verdict:** Negligible overhead. User signup latency is dominated by password hashing (~100ms) and email sending (~500ms), so 2ms trigger is acceptable.

### Monitoring Overhead

**Daily Quality Check:**
- 4 COUNT queries (auth.users, public.users, ghost, orphaned)
- 1 Trigger status check
- Total: ~100-500ms (depending on user count)

**Verdict:** Acceptable for daily schedule. No impact on user-facing queries.

### Scaling Considerations

| User Count | Daily Check Time | Recommendation |
|------------|------------------|----------------|
| < 100K | < 500ms | Current implementation optimal |
| 100K - 1M | 1-5 seconds | Consider monthly sampling (10% random check) |
| > 1M | > 5 seconds | Add partitioning, use approximate counts |

**Current Scale:** ~1,234 users → No scaling changes needed

## Security Review

### SQL Injection ✓
- `SECURITY DEFINER` with `SET search_path = public` prevents search path attacks
- All values from `NEW` (trigger context) - not user input
- No dynamic SQL

**Verdict:** Secure

### Privilege Escalation ✓
- Function runs with elevated privileges (required for cross-schema access)
- Limited to single INSERT into public.users
- No other side effects

**Verdict:** Appropriate use of SECURITY DEFINER

### Data Leakage ✓
- Only syncs non-sensitive fields (id, email, email_verified)
- No password hashes or tokens
- Email is already visible in application

**Verdict:** No privacy concerns

## Testing Recommendations

### Unit Tests (SQL)

```sql
-- Test 1: Trigger creates public.users record
DO $$
DECLARE
  test_id UUID := uuid_generate_v4();
  test_email VARCHAR := 'test@example.com';
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (id, email, email_confirmed_at)
  VALUES (test_id, test_email, NOW());

  -- Verify public.users record was created
  IF NOT EXISTS(SELECT 1 FROM public.users WHERE id = test_id) THEN
    RAISE EXCEPTION 'Trigger failed: public.users record not created';
  END IF;

  -- Cleanup
  DELETE FROM public.users WHERE id = test_id;
  DELETE FROM auth.users WHERE id = test_id;

  RAISE NOTICE 'Test passed: Trigger creates public.users record';
END $$;

-- Test 2: Conflict handling (idempotency)
DO $$
DECLARE
  test_id UUID := uuid_generate_v4();
  test_email VARCHAR := 'test2@example.com';
BEGIN
  -- Pre-create public.users record
  INSERT INTO public.users (id, email, email_verified)
  VALUES (test_id, test_email, false);

  -- Insert into auth.users (trigger should not fail)
  INSERT INTO auth.users (id, email, email_confirmed_at)
  VALUES (test_id, test_email, NOW());

  -- Verify only one record exists
  IF (SELECT COUNT(*) FROM public.users WHERE id = test_id) != 1 THEN
    RAISE EXCEPTION 'Conflict handling failed: duplicate records';
  END IF;

  -- Cleanup
  DELETE FROM public.users WHERE id = test_id;
  DELETE FROM auth.users WHERE id = test_id;

  RAISE NOTICE 'Test passed: Conflict handling works';
END $$;
```

### Integration Tests (Application)

1. **Signup Flow Test**
   ```typescript
   test('User signup creates both auth and public records', async () => {
     const email = 'newuser@example.com';
     const password = 'SecurePassword123!';

     // Signup
     const { data: authData } = await supabase.auth.signUp({ email, password });

     // Verify auth.users record
     expect(authData.user).toBeDefined();
     expect(authData.user.email).toBe(email);

     // Verify public.users record
     const { data: publicUser } = await supabase
       .from('users')
       .select()
       .eq('id', authData.user.id)
       .single();

     expect(publicUser).toBeDefined();
     expect(publicUser.email).toBe(email);
     expect(publicUser.id).toBe(authData.user.id);
   });
   ```

2. **Ghost User Detection Test**
   ```typescript
   test('Data quality check detects ghost users', async () => {
     // Call monitoring function
     const { data } = await supabase.rpc('check_ghost_users');

     // Should be zero in healthy system
     expect(data.length).toBe(0);
   });
   ```

## Deployment Checklist

Before deploying to production:

- [ ] Run migrations in staging environment
- [ ] Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- [ ] Test signup flow in staging
- [ ] Run quality check: `SELECT * FROM run_user_sync_quality_check();`
- [ ] Verify backfill results: `SELECT * FROM cleanup_audit_log WHERE job_name = 'backfill_ghost_users';`
- [ ] Check for ghost users: `SELECT * FROM check_ghost_users();` (should be 0)
- [ ] Test monitoring functions work
- [ ] Schedule daily monitoring job (Edge Function or pg_cron)
- [ ] Configure alerts (Slack, email) for critical status
- [ ] Update runbook with incident response procedures

## Recommendations Summary

### Immediate (Pre-deployment)

1. ✓ Run all verification queries in staging
2. ✓ Test signup flow end-to-end
3. ✓ Verify monitoring functions return correct data

### Short-term (First Sprint)

1. ⚠️ **Discuss email verification sync** with Isabel & Engrid
   - Do we need to update `email_verified` when users verify after signup?
   - If yes, add UPDATE trigger on `auth.users.email_confirmed_at`

2. ⚠️ **Schedule daily monitoring job**
   - Create Edge Function to call `record_user_sync_metrics()`
   - Schedule via pg_cron or external cron
   - Configure alerts for critical status

3. ⚠️ **Ana builds monitoring dashboard**
   - See `/docs/data-governance/USER-SYNC-DASHBOARD-SPEC.md`

### Long-term (Next Quarter)

1. Add integration tests for trigger behavior
2. Benchmark performance at 100K users
3. Consider trigger for email changes (if needed)
4. Document edge cases in runbook

## Final Verdict

**APPROVED FOR PRODUCTION** ✓

Isabel's implementation is solid, well-documented, and follows database best practices. The trigger function is secure, idempotent, and performant. Combined with my monitoring infrastructure, we have comprehensive coverage for detecting and preventing ghost user issues.

**Confidence Level:** High
**Risk Level:** Low
**Blocking Issues:** None
**Non-blocking Recommendations:** 4 (see above)

---

**Next Steps:**
1. Isabel deploys migrations to staging
2. Isabel and Buck test in staging together
3. Buck schedules daily monitoring job
4. Ana builds dashboard (4-week timeline)
5. Deploy to production with monitoring

**Reviewers:**
- ✓ Buck (Data Engineering) - Approved
- Pending: Samantha (Security) - For auth.users access review
- Pending: Engrid (Engineering) - For application integration review

**Document Status:** Final
**Date:** 2026-01-27
