-- EMERGENCY FIX: User sync not working in production
-- Date: 2026-01-28
-- Priority: P0 - CRITICAL
--
-- Problem: Users are being created in auth.users but not syncing to public.users
-- Solution: Recreate trigger with better error handling and backfill existing users

-- ============================================================================
-- STEP 1: Ensure public.users table exists with correct schema
-- ============================================================================

-- Check if table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE TABLE public.users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE,
      hashed_password VARCHAR(255),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      profile_photo_url TEXT,
      auth_methods TEXT[] DEFAULT ARRAY['email_password']::TEXT[],
      preferred_auth_method VARCHAR(50) DEFAULT 'email_password',
      two_factor_enabled BOOLEAN DEFAULT FALSE,
      two_factor_secret TEXT,
      two_factor_backup_codes TEXT[],
      account_locked_until TIMESTAMP WITH TIME ZONE,
      failed_login_attempts INTEGER DEFAULT 0,
      last_login_at TIMESTAMP WITH TIME ZONE,
      last_login_ip INET,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    RAISE NOTICE 'Created public.users table';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop and recreate trigger function with better error handling
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_error_message TEXT;
  v_error_detail TEXT;
BEGIN
  BEGIN
    -- Log the attempt
    RAISE NOTICE 'Syncing new user: id=%, email=%', NEW.id, NEW.email;

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
      COALESCE(NEW.created_at, NOW()),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      email_verified = EXCLUDED.email_verified,
      updated_at = NOW();

    RAISE NOTICE 'Successfully synced user: %', NEW.email;

  EXCEPTION WHEN OTHERS THEN
    -- Capture error details
    GET STACKED DIAGNOSTICS
      v_error_message = MESSAGE_TEXT,
      v_error_detail = PG_EXCEPTION_DETAIL;

    -- Log error (this will appear in Supabase logs)
    RAISE WARNING 'Failed to sync user % to public.users: % - %',
      NEW.email, v_error_message, v_error_detail;

    -- Don't fail the auth.users insert, just log the error
    -- This prevents blocking user registration
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Syncs auth.users to public.users with comprehensive error handling and logging';

-- ============================================================================
-- STEP 3: Create trigger
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Automatically syncs new auth.users records to public.users table';

-- ============================================================================
-- STEP 4: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================================================
-- STEP 5: Backfill existing auth.users to public.users
-- ============================================================================

DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting backfill of existing auth.users to public.users...';

  FOR v_user IN
    SELECT
      u.id,
      u.email,
      u.email_confirmed_at,
      u.created_at
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users pu WHERE pu.id = u.id
    )
  LOOP
    BEGIN
      INSERT INTO public.users (
        id,
        email,
        email_verified,
        created_at,
        updated_at
      ) VALUES (
        v_user.id,
        v_user.email,
        COALESCE(v_user.email_confirmed_at IS NOT NULL, false),
        COALESCE(v_user.created_at, NOW()),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;

      v_count := v_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE WARNING 'Failed to backfill user %: %', v_user.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % users synced, % errors', v_count, v_errors;
END $$;

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================

DO $$
DECLARE
  v_auth_count INTEGER;
  v_public_count INTEGER;
  v_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_auth_count FROM auth.users;
  SELECT COUNT(*) INTO v_public_count FROM public.users;
  v_missing := v_auth_count - v_public_count;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'VERIFICATION RESULTS:';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Auth users count: %', v_auth_count;
  RAISE NOTICE 'Public users count: %', v_public_count;
  RAISE NOTICE 'Missing users: %', v_missing;

  IF v_missing > 0 THEN
    RAISE WARNING 'WARNING: % users in auth.users are not in public.users!', v_missing;
  ELSE
    RAISE NOTICE 'SUCCESS: All auth users are synced to public.users';
  END IF;
  RAISE NOTICE '============================================';
END $$;
