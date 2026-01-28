-- Verification Script: User Sync Monitoring
-- Purpose: Test all monitoring functions and verify installation
-- Run this after deploying migrations 20260127000001-20260127000003
-- Date: 2026-01-27
-- Owner: Buck (Data Engineering)

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

DO $$
DECLARE
  test_count INTEGER := 0;
  pass_count INTEGER := 0;
  fail_count INTEGER := 0;
  test_name TEXT;
  test_result BOOLEAN;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User Sync Monitoring Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Test 1: Trigger exists and is enabled
  test_name := 'Trigger on_auth_user_created exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created' AND tgenabled = 'O'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  -- Test 2: Trigger function exists
  test_name := 'Function handle_new_user() exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  -- Test 3: check_ghost_users() function exists
  test_name := 'Function check_ghost_users() exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'check_ghost_users'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  -- Test 4: check_orphaned_profiles() function exists
  test_name := 'Function check_orphaned_profiles() exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'check_orphaned_profiles'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  -- Test 5: get_user_sync_stats() function exists
  test_name := 'Function get_user_sync_stats() exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_sync_stats'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  -- Test 6: run_user_sync_quality_check() function exists
  test_name := 'Function run_user_sync_quality_check() exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'run_user_sync_quality_check'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  -- Test 7: record_user_sync_metrics() function exists
  test_name := 'Function record_user_sync_metrics() exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'record_user_sync_metrics'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  -- Test 8: get_latest_sync_status() function exists
  test_name := 'Function get_latest_sync_status() exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'get_latest_sync_status'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  -- Test 9: get_sync_status_history() function exists
  test_name := 'Function get_sync_status_history() exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'get_sync_status_history'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  -- Test 10: user_sync_monitoring_log table exists
  test_name := 'Table user_sync_monitoring_log exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_tables WHERE tablename = 'user_sync_monitoring_log'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  -- Test 11: cleanup_audit_log table exists (from earlier migration)
  test_name := 'Table cleanup_audit_log exists';
  test_count := test_count + 1;

  SELECT EXISTS(
    SELECT 1 FROM pg_tables WHERE tablename = 'cleanup_audit_log'
  ) INTO test_result;

  IF test_result THEN
    pass_count := pass_count + 1;
    RAISE NOTICE '✓ Test %: % - PASSED', test_count, test_name;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE '✗ Test %: % - FAILED', test_count, test_name;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Results';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Tests: %', test_count;
  RAISE NOTICE 'Passed: %', pass_count;
  RAISE NOTICE 'Failed: %', fail_count;
  RAISE NOTICE '';

  IF fail_count > 0 THEN
    RAISE NOTICE 'Status: VERIFICATION FAILED';
    RAISE NOTICE 'Action: Review failed tests above and re-run migrations';
  ELSE
    RAISE NOTICE 'Status: ✓ ALL TESTS PASSED';
    RAISE NOTICE 'Action: Proceed with functional testing';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FUNCTIONAL TESTS (Run these queries manually)
-- ============================================================================

-- Query 1: Check current sync statistics
-- Expected: Returns 5 rows with metrics
COMMENT ON FUNCTION get_user_sync_stats() IS 'TEST: SELECT * FROM get_user_sync_stats();';

-- Query 2: Run quality checks
-- Expected: Returns 4 rows (ghost_users_check, orphaned_profiles_check, count_parity_check, trigger_exists_check)
COMMENT ON FUNCTION run_user_sync_quality_check() IS 'TEST: SELECT * FROM run_user_sync_quality_check();';

-- Query 3: Check for ghost users
-- Expected: Returns 0 rows (no ghost users after backfill)
COMMENT ON FUNCTION check_ghost_users() IS 'TEST: SELECT * FROM check_ghost_users();';

-- Query 4: Check for orphaned profiles
-- Expected: Returns 0 rows (no orphaned profiles)
COMMENT ON FUNCTION check_orphaned_profiles() IS 'TEST: SELECT * FROM check_orphaned_profiles();';

-- Query 5: Record initial metrics
-- Expected: Returns UUID of new monitoring log entry
COMMENT ON FUNCTION record_user_sync_metrics() IS 'TEST: SELECT record_user_sync_metrics();';

-- Query 6: Get latest sync status
-- Expected: Returns 1 row with current status
COMMENT ON FUNCTION get_latest_sync_status() IS 'TEST: SELECT * FROM get_latest_sync_status();';

-- Query 7: Get sync history (last 7 days)
-- Expected: Returns historical metrics (may be 0 rows if just deployed)
COMMENT ON FUNCTION get_sync_status_history IS 'TEST: SELECT * FROM get_sync_status_history(7);';

-- ============================================================================
-- MANUAL FUNCTIONAL TEST QUERIES
-- ============================================================================

-- Copy and run these queries after the verification script completes

-- Test 1: Current sync statistics
-- Expected: 5 rows showing user counts and discrepancies
-- SELECT * FROM get_user_sync_stats();

-- Test 2: Quality check
-- Expected: 4 rows, all with passed = true
-- SELECT * FROM run_user_sync_quality_check();

-- Test 3: Ghost users
-- Expected: 0 rows (no ghost users after backfill)
-- SELECT * FROM check_ghost_users();

-- Test 4: Orphaned profiles
-- Expected: 0 rows (no orphaned profiles)
-- SELECT * FROM check_orphaned_profiles();

-- Test 5: Record metrics (creates monitoring log entry)
-- Expected: Returns UUID
-- SELECT record_user_sync_metrics();

-- Test 6: Latest sync status
-- Expected: 1 row with status = 'healthy' (if no issues)
-- SELECT * FROM get_latest_sync_status();

-- Test 7: Sync history (last 7 days)
-- Expected: Historical rows (may be empty if just deployed)
-- SELECT * FROM get_sync_status_history(7);

-- Test 8: Verify trigger
-- Expected: 1 row with tgenabled = 'O'
-- SELECT tgname, tgenabled, tgrelid::regclass
-- FROM pg_trigger
-- WHERE tgname = 'on_auth_user_created';

-- Test 9: Check backfill audit log
-- Expected: 1 row showing backfill results
-- SELECT * FROM cleanup_audit_log
-- WHERE job_name = 'backfill_ghost_users'
-- ORDER BY started_at DESC;

-- Test 10: Check monitoring log
-- Expected: Rows from record_user_sync_metrics() calls
-- SELECT * FROM user_sync_monitoring_log
-- ORDER BY checked_at DESC
-- LIMIT 10;

-- ============================================================================
-- INTEGRATION TEST (Full signup flow)
-- ============================================================================

-- WARNING: Only run in staging/development, NOT production!
-- This creates a test user to verify the trigger works end-to-end

-- DO $$
-- DECLARE
--   test_user_id UUID := uuid_generate_v4();
--   test_email VARCHAR := 'verification-test@example.com';
--   auth_record_exists BOOLEAN;
--   public_record_exists BOOLEAN;
-- BEGIN
--   RAISE NOTICE '========================================';
--   RAISE NOTICE 'Integration Test: User Sync Trigger';
--   RAISE NOTICE '========================================';
--
--   -- Step 1: Insert into auth.users (simulates signup)
--   RAISE NOTICE 'Step 1: Creating auth.users record...';
--   INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
--   VALUES (test_user_id, test_email, NOW(), NOW(), NOW());
--   RAISE NOTICE '✓ Auth user created: % (%)', test_email, test_user_id;
--
--   -- Step 2: Wait a moment for trigger to fire
--   PERFORM pg_sleep(0.1);
--
--   -- Step 3: Check if public.users record was created
--   RAISE NOTICE 'Step 2: Checking if trigger created public.users record...';
--
--   SELECT EXISTS(
--     SELECT 1 FROM auth.users WHERE id = test_user_id
--   ) INTO auth_record_exists;
--
--   SELECT EXISTS(
--     SELECT 1 FROM public.users WHERE id = test_user_id
--   ) INTO public_record_exists;
--
--   IF auth_record_exists AND public_record_exists THEN
--     RAISE NOTICE '✓ INTEGRATION TEST PASSED';
--     RAISE NOTICE '  - Auth record: ✓ exists';
--     RAISE NOTICE '  - Public record: ✓ exists (trigger worked!)';
--   ELSIF auth_record_exists AND NOT public_record_exists THEN
--     RAISE NOTICE '✗ INTEGRATION TEST FAILED';
--     RAISE NOTICE '  - Auth record: ✓ exists';
--     RAISE NOTICE '  - Public record: ✗ missing (trigger did not fire!)';
--   ELSE
--     RAISE NOTICE '✗ INTEGRATION TEST ERROR';
--     RAISE NOTICE '  - Could not complete test';
--   END IF;
--
--   -- Cleanup
--   RAISE NOTICE 'Cleaning up test data...';
--   DELETE FROM public.users WHERE id = test_user_id;
--   DELETE FROM auth.users WHERE id = test_user_id;
--   RAISE NOTICE '✓ Test data cleaned up';
--
--   RAISE NOTICE '========================================';
-- END $$;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

-- After running this verification script:
--
-- 1. Review test results above
--    - All 11 tests should PASS
--    - If any tests FAIL, review and re-run migrations
--
-- 2. Run functional tests manually
--    - Copy queries from "MANUAL FUNCTIONAL TEST QUERIES" section
--    - Verify each function returns expected results
--
-- 3. Run integration test (staging only)
--    - Uncomment the integration test block above
--    - Verify trigger creates public.users record automatically
--
-- 4. Schedule daily monitoring
--    - Create Edge Function to call record_user_sync_metrics()
--    - Schedule at 2 AM UTC daily
--
-- 5. Configure alerts
--    - Set up Slack webhook for critical alerts
--    - Configure email notifications for on-call team
--
-- 6. Monitor in production
--    - Check dashboard daily (once Ana builds it)
--    - Review weekly metrics
--    - Monthly data quality report
--
-- For questions or issues, contact:
-- - Buck (Data Engineering)
-- - Isabel (Infrastructure)
