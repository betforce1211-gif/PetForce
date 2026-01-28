-- ============================================================================
-- EMERGENCY FIX: Run this SQL in Supabase SQL Editor NOW
-- ============================================================================
-- This will immediately fix user registration and backfill existing users
-- GO TO: Supabase Dashboard > SQL Editor > New Query > Paste this > Run
-- ============================================================================

-- 1. Recreate trigger function with error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 2. Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;

-- 4. Backfill existing users RIGHT NOW
INSERT INTO public.users (id, email, email_verified, created_at, updated_at)
SELECT
  id,
  email,
  COALESCE(email_confirmed_at IS NOT NULL, false) as email_verified,
  COALESCE(created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE public.users.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;

-- 5. Verify fix
SELECT
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count,
  (SELECT COUNT(*) FROM auth.users WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE public.users.id = auth.users.id
  )) as missing_users_count;

-- If missing_users_count is 0, you're all set!
-- If not, contact support immediately.
