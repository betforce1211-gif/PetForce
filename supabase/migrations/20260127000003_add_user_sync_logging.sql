-- Add Comprehensive Logging for User Sync Trigger
-- Purpose: Track when public.users records are created from auth.users
-- This logging is CRITICAL to detect ghost users bug and sync failures
-- Date: 2026-01-27

-- ============================================================================
-- LOGGING TABLE: user_sync_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User identification
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  email_hash TEXT, -- Hashed email for privacy
  
  -- Event tracking
  event_type TEXT NOT NULL, -- 'user_created', 'sync_success', 'sync_failure'
  source TEXT NOT NULL DEFAULT 'database_trigger', -- 'database_trigger', 'manual', 'backfill'
  
  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_code TEXT,
  error_message TEXT,
  
  -- Context
  email_verified BOOLEAN,
  user_metadata JSONB,
  
  -- Correlation
  request_id UUID, -- For correlating with application logs
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sync_logs_user_id ON public.user_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sync_logs_created_at ON public.user_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sync_logs_event_type ON public.user_sync_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_user_sync_logs_success ON public.user_sync_logs(success) WHERE success = false;

COMMENT ON TABLE public.user_sync_logs IS 'Audit log for auth.users to public.users synchronization - CRITICAL for detecting ghost users';

-- ============================================================================
-- HELPER FUNCTION: Simple hash for email (privacy)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.simple_hash(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  hash_val BIGINT := 5381;
  char_val INT;
  i INT;
BEGIN
  -- Simple DJB2 hash algorithm (deterministic, fast)
  FOR i IN 1..length(input_text) LOOP
    char_val := ascii(substring(input_text from i for 1));
    hash_val := ((hash_val * 33) + char_val) % 2147483647;
  END LOOP;
  
  RETURN 'hash:' || to_hex(hash_val);
END;
$$;

COMMENT ON FUNCTION public.simple_hash(TEXT) IS 'Simple hash function for privacy compliance in logs';

-- ============================================================================
-- ENHANCED TRIGGER FUNCTION: handle_new_user (with logging)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_email_hash TEXT;
  v_email_verified BOOLEAN;
  v_sync_success BOOLEAN := false;
  v_error_code TEXT;
  v_error_message TEXT;
BEGIN
  -- Hash email for privacy in logs
  v_email_hash := public.simple_hash(LOWER(NEW.email));
  v_email_verified := NEW.email_confirmed_at IS NOT NULL;
  
  BEGIN
    -- Insert corresponding record into public.users
    INSERT INTO public.users (
      id,
      email,
      email_verified,
      first_name,
      last_name,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      v_email_verified,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NOW(),
      NOW()
    )
    -- Handle race condition: if user already exists, do nothing
    ON CONFLICT (id) DO UPDATE SET
      email_verified = EXCLUDED.email_verified,
      updated_at = NOW();
    
    v_sync_success := true;
    
    -- CRITICAL LOG: User successfully created in public.users
    INSERT INTO public.user_sync_logs (
      user_id,
      email,
      email_hash,
      event_type,
      source,
      success,
      email_verified,
      user_metadata,
      created_at
    ) VALUES (
      NEW.id,
      NEW.email,
      v_email_hash,
      'user_created_in_public_db',
      'database_trigger',
      true,
      v_email_verified,
      NEW.raw_user_meta_data,
      NOW()
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log sync failure (CRITICAL - this indicates ghost user bug!)
    v_sync_success := false;
    v_error_code := SQLSTATE;
    v_error_message := SQLERRM;
    
    INSERT INTO public.user_sync_logs (
      user_id,
      email,
      email_hash,
      event_type,
      source,
      success,
      error_code,
      error_message,
      email_verified,
      user_metadata,
      created_at
    ) VALUES (
      NEW.id,
      NEW.email,
      v_email_hash,
      'user_sync_failed',
      'database_trigger',
      false,
      v_error_code,
      v_error_message,
      v_email_verified,
      NEW.raw_user_meta_data,
      NOW()
    );
    
    -- Re-raise the exception so the auth.users insert also fails
    -- This prevents ghost users (user in auth.users but not public.users)
    RAISE;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a public.users record when a user signs up via Supabase Auth. Logs all sync events for auditing. Prevents ghost users.';

-- ============================================================================
-- METRICS VIEW: User Sync Health
-- ============================================================================

CREATE OR REPLACE VIEW public.user_sync_metrics AS
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS total_syncs,
  COUNT(*) FILTER (WHERE success = true) AS successful_syncs,
  COUNT(*) FILTER (WHERE success = false) AS failed_syncs,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE success = true) / NULLIF(COUNT(*), 0),
    2
  ) AS success_rate_percent,
  COUNT(DISTINCT user_id) AS unique_users
FROM public.user_sync_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

COMMENT ON VIEW public.user_sync_metrics IS 'Hourly metrics for user sync health monitoring';

-- ============================================================================
-- ALERT QUERY: Detect Ghost Users
-- ============================================================================

CREATE OR REPLACE VIEW public.ghost_users_alert AS
SELECT
  au.id AS user_id,
  au.email,
  au.created_at AS auth_created_at,
  au.email_confirmed_at,
  CASE 
    WHEN pu.id IS NULL THEN 'GHOST_USER'
    WHEN usl.id IS NULL THEN 'MISSING_LOG'
    WHEN usl.success = false THEN 'SYNC_FAILED'
    ELSE 'OK'
  END AS status,
  usl.error_code,
  usl.error_message
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.user_sync_logs usl ON au.id = usl.user_id
WHERE 
  pu.id IS NULL -- User exists in auth.users but not public.users
  OR usl.success = false -- Sync explicitly failed
ORDER BY au.created_at DESC;

COMMENT ON VIEW public.ghost_users_alert IS 'Detects ghost users (in auth.users but not public.users) - should ALWAYS be empty';

-- ============================================================================
-- SECURITY
-- ============================================================================

-- Grant permissions
GRANT SELECT ON public.user_sync_logs TO authenticated;
GRANT SELECT ON public.user_sync_metrics TO authenticated;
GRANT SELECT ON public.ghost_users_alert TO authenticated;

-- Service role needs insert for the trigger
GRANT INSERT ON public.user_sync_logs TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify:
--
-- 1. Check recent sync logs:
-- SELECT * FROM public.user_sync_logs ORDER BY created_at DESC LIMIT 10;
--
-- 2. Check sync metrics:
-- SELECT * FROM public.user_sync_metrics LIMIT 24;
--
-- 3. Check for ghost users (should be empty!):
-- SELECT * FROM public.ghost_users_alert WHERE status != 'OK';
--
-- 4. Test the trigger with a new user:
-- -- This will be done automatically on next registration

