-- Critical Fix: Sync auth.users to public.users
-- Purpose: Automatically create public.users record when auth.users record is created
-- This prevents "ghost users" who can authenticate but have no profile
-- Date: 2026-01-27
-- Priority: P0 - Production blocking bug

-- ============================================================================
-- TRIGGER FUNCTION: handle_new_user
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert corresponding record into public.users
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
  -- Handle race condition: if user already exists, do nothing
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a public.users record when a user signs up via Supabase Auth. Prevents ghost users.';

-- ============================================================================
-- TRIGGER: on_auth_user_created
-- ============================================================================

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to fire after INSERT on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Syncs new auth.users records to public.users table automatically';

-- ============================================================================
-- SECURITY
-- ============================================================================

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify:
--
-- 1. Check trigger exists:
-- SELECT tgname, tgenabled
-- FROM pg_trigger
-- WHERE tgname = 'on_auth_user_created';
--
-- 2. Check function exists:
-- SELECT proname, prosrc
-- FROM pg_proc
-- WHERE proname = 'handle_new_user';
