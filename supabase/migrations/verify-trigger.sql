-- Verification Script for Ghost Users Fix
-- Run this after deploying migrations to verify everything is working

-- ============================================================================
-- 1. CHECK FOR GHOST USERS
-- ============================================================================

SELECT
  'Ghost Users Check' as test_name,
  COUNT(*) as ghost_users,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Ghost users still exist!'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- ============================================================================
-- 2. VERIFY USER COUNTS
-- ============================================================================

SELECT
  'User Count Sync' as test_name,
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.users WHERE deleted_at IS NULL) as public_users,
  CASE
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.users WHERE deleted_at IS NULL)
    THEN '✅ PASS'
    ELSE '⚠️  WARNING - Counts do not match (may include soft-deleted users)'
  END as status;

-- ============================================================================
-- 3. VERIFY TRIGGER EXISTS
-- ============================================================================

SELECT
  'Trigger Exists' as test_name,
  tgname as trigger_name,
  tgenabled as enabled,
  tgrelid::regclass as table_name,
  CASE
    WHEN tgenabled = 'O' THEN '✅ PASS'
    ELSE '❌ FAIL - Trigger not enabled!'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- ============================================================================
-- 4. VERIFY FUNCTION EXISTS
-- ============================================================================

SELECT
  'Function Exists' as test_name,
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  CASE
    WHEN proname IS NOT NULL THEN '✅ PASS'
    ELSE '❌ FAIL - Function not found!'
  END as status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================================================
-- 5. CHECK BACKFILL AUDIT LOG
-- ============================================================================

SELECT
  'Backfill Audit' as test_name,
  job_name,
  status,
  records_affected,
  completed_at,
  CASE
    WHEN status = 'completed' THEN '✅ PASS'
    WHEN status = 'failed' THEN '❌ FAIL - Backfill failed!'
    ELSE '⚠️  WARNING - Backfill status unknown'
  END as test_status
FROM cleanup_audit_log
WHERE job_name = 'backfill_ghost_users'
ORDER BY started_at DESC
LIMIT 1;

-- ============================================================================
-- 6. SAMPLE USER DATA (First 5 users)
-- ============================================================================

SELECT
  'Sample User Data' as test_name,
  au.id,
  au.email,
  au.created_at as auth_created,
  pu.id IS NOT NULL as has_profile,
  pu.email_verified,
  pu.created_at as profile_created
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 5;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT
  '═══════════════════════════════════════════' as summary,
  'VERIFICATION COMPLETE' as message,
  NOW() as verified_at;
