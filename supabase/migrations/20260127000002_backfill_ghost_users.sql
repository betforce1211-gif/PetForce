-- Critical Fix: Backfill Ghost Users
-- Purpose: Create public.users records for existing auth.users who don't have profiles
-- This fixes users who registered before the sync trigger was in place
-- Date: 2026-01-27
-- Priority: P0 - Production blocking bug

-- ============================================================================
-- BACKFILL GHOST USERS
-- ============================================================================

DO $$
DECLARE
  ghost_user_count INTEGER;
  backfilled_count INTEGER;
BEGIN
  -- Count ghost users (users in auth.users but not in public.users)
  SELECT COUNT(*)
  INTO ghost_user_count
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;

  RAISE NOTICE 'Found % ghost users to backfill', ghost_user_count;

  -- Backfill missing users
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

  GET DIAGNOSTICS backfilled_count = ROW_COUNT;

  RAISE NOTICE 'Successfully backfilled % ghost users', backfilled_count;

  -- Log the backfill operation
  INSERT INTO cleanup_audit_log (
    job_name,
    job_type,
    status,
    records_affected,
    started_at,
    completed_at
  ) VALUES (
    'backfill_ghost_users',
    'one_time',
    'completed',
    backfilled_count,
    NOW(),
    NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during backfill: %', SQLERRM;

    -- Log the failure
    INSERT INTO cleanup_audit_log (
      job_name,
      job_type,
      status,
      records_affected,
      started_at,
      completed_at,
      error_message
    ) VALUES (
      'backfill_ghost_users',
      'one_time',
      'failed',
      0,
      NOW(),
      NOW(),
      SQLERRM
    );

    RAISE;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify:
--
-- 1. Check for remaining ghost users (should be 0):
-- SELECT COUNT(*)
-- FROM auth.users au
-- LEFT JOIN public.users pu ON au.id = pu.id
-- WHERE pu.id IS NULL;
--
-- 2. Verify user counts match:
-- SELECT
--   (SELECT COUNT(*) FROM auth.users) as auth_users_count,
--   (SELECT COUNT(*) FROM public.users) as public_users_count;
--
-- 3. View backfill audit log:
-- SELECT * FROM cleanup_audit_log
-- WHERE job_name = 'backfill_ghost_users'
-- ORDER BY started_at DESC;
