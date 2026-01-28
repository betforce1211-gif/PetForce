-- Data Quality Monitoring: User Sync Integrity
-- Purpose: Monitor and alert on discrepancies between auth.users and public.users
-- Owner: Buck (Data Engineering) + Isabel (Infrastructure)
-- Date: 2026-01-27
-- Priority: P0 - Critical data quality issue

-- ============================================================================
-- DATA QUALITY CHECK FUNCTIONS
-- ============================================================================

-- Function: Check for ghost users (auth.users without public.users)
CREATE OR REPLACE FUNCTION check_ghost_users()
RETURNS TABLE(
  auth_user_id UUID,
  email VARCHAR(255),
  created_at TIMESTAMPTZ,
  days_since_creation INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id as auth_user_id,
    au.email,
    au.created_at,
    EXTRACT(DAY FROM (NOW() - au.created_at))::INTEGER as days_since_creation
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_ghost_users() IS
  'Identifies users in auth.users who lack a corresponding public.users record. These are "ghost users" who can authenticate but have no profile.';

-- Function: Check for orphaned profiles (public.users without auth.users)
CREATE OR REPLACE FUNCTION check_orphaned_profiles()
RETURNS TABLE(
  user_id UUID,
  email VARCHAR(255),
  created_at TIMESTAMPTZ,
  days_since_creation INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pu.id as user_id,
    pu.email,
    pu.created_at,
    EXTRACT(DAY FROM (NOW() - pu.created_at))::INTEGER as days_since_creation
  FROM public.users pu
  LEFT JOIN auth.users au ON pu.id = au.id
  WHERE au.id IS NULL
  ORDER BY pu.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_orphaned_profiles() IS
  'Identifies public.users records without a corresponding auth.users record. This should never happen in normal operation.';

-- Function: Get user sync statistics
CREATE OR REPLACE FUNCTION get_user_sync_stats()
RETURNS TABLE(
  metric VARCHAR(100),
  value BIGINT,
  status VARCHAR(50),
  last_checked TIMESTAMPTZ
) AS $$
DECLARE
  auth_count BIGINT;
  public_count BIGINT;
  ghost_count BIGINT;
  orphan_count BIGINT;
BEGIN
  -- Count users in auth.users
  SELECT COUNT(*) INTO auth_count FROM auth.users;

  -- Count users in public.users
  SELECT COUNT(*) INTO public_count FROM public.users;

  -- Count ghost users
  SELECT COUNT(*) INTO ghost_count
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;

  -- Count orphaned profiles
  SELECT COUNT(*) INTO orphan_count
  FROM public.users pu
  LEFT JOIN auth.users au ON pu.id = au.id
  WHERE au.id IS NULL;

  -- Return metrics
  RETURN QUERY
  SELECT 'auth_users_total'::VARCHAR(100), auth_count, 'ok'::VARCHAR(50), NOW()
  UNION ALL
  SELECT 'public_users_total'::VARCHAR(100), public_count, 'ok'::VARCHAR(50), NOW()
  UNION ALL
  SELECT 'ghost_users'::VARCHAR(100), ghost_count,
    CASE WHEN ghost_count = 0 THEN 'ok' ELSE 'error' END::VARCHAR(50), NOW()
  UNION ALL
  SELECT 'orphaned_profiles'::VARCHAR(100), orphan_count,
    CASE WHEN orphan_count = 0 THEN 'ok' ELSE 'warning' END::VARCHAR(50), NOW()
  UNION ALL
  SELECT 'sync_discrepancy'::VARCHAR(100), ABS(auth_count - public_count),
    CASE WHEN auth_count = public_count THEN 'ok' ELSE 'error' END::VARCHAR(50), NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_sync_stats() IS
  'Returns comprehensive user sync statistics. Use for monitoring dashboards and alerting.';

-- Function: Daily user sync quality check
CREATE OR REPLACE FUNCTION run_user_sync_quality_check()
RETURNS TABLE(
  check_name VARCHAR(100),
  passed BOOLEAN,
  issue_count BIGINT,
  severity VARCHAR(50),
  message TEXT
) AS $$
DECLARE
  ghost_count BIGINT;
  orphan_count BIGINT;
  auth_count BIGINT;
  public_count BIGINT;
BEGIN
  -- Check 1: Ghost users (critical)
  SELECT COUNT(*) INTO ghost_count
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;

  RETURN QUERY SELECT
    'ghost_users_check'::VARCHAR(100),
    ghost_count = 0,
    ghost_count,
    'critical'::VARCHAR(50),
    CASE
      WHEN ghost_count = 0 THEN 'No ghost users detected'
      ELSE format('%s users in auth.users lack public.users record', ghost_count)
    END::TEXT;

  -- Check 2: Orphaned profiles (warning)
  SELECT COUNT(*) INTO orphan_count
  FROM public.users pu
  LEFT JOIN auth.users au ON pu.id = au.id
  WHERE au.id IS NULL;

  RETURN QUERY SELECT
    'orphaned_profiles_check'::VARCHAR(100),
    orphan_count = 0,
    orphan_count,
    'warning'::VARCHAR(50),
    CASE
      WHEN orphan_count = 0 THEN 'No orphaned profiles detected'
      ELSE format('%s profiles in public.users lack auth.users record', orphan_count)
    END::TEXT;

  -- Check 3: Count parity (critical)
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO public_count FROM public.users;

  RETURN QUERY SELECT
    'count_parity_check'::VARCHAR(100),
    auth_count = public_count,
    ABS(auth_count - public_count),
    'critical'::VARCHAR(50),
    CASE
      WHEN auth_count = public_count THEN format('User counts match: %s', auth_count)
      ELSE format('Count mismatch - auth: %s, public: %s (diff: %s)',
                  auth_count, public_count, ABS(auth_count - public_count))
    END::TEXT;

  -- Check 4: Trigger existence
  RETURN QUERY SELECT
    'trigger_exists_check'::VARCHAR(100),
    EXISTS(
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'on_auth_user_created' AND tgenabled = 'O'
    ),
    CASE
      WHEN EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND tgenabled = 'O')
      THEN 0::BIGINT
      ELSE 1::BIGINT
    END,
    'critical'::VARCHAR(50),
    CASE
      WHEN EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND tgenabled = 'O')
      THEN 'User sync trigger is active'
      ELSE 'CRITICAL: User sync trigger is missing or disabled!'
    END::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_user_sync_quality_check() IS
  'Runs comprehensive data quality checks for user sync. Schedule daily via Edge Function.';

-- ============================================================================
-- MONITORING TABLE
-- ============================================================================

-- Table: User sync monitoring log
CREATE TABLE IF NOT EXISTS user_sync_monitoring_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Metrics
  auth_users_count BIGINT NOT NULL,
  public_users_count BIGINT NOT NULL,
  ghost_users_count BIGINT NOT NULL,
  orphaned_profiles_count BIGINT NOT NULL,
  discrepancy_count BIGINT NOT NULL,

  -- Status
  sync_status VARCHAR(50) NOT NULL, -- 'healthy', 'degraded', 'critical'
  trigger_enabled BOOLEAN NOT NULL,

  -- Alerts
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_reason TEXT,

  -- Metadata
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for time-series queries
CREATE INDEX idx_user_sync_monitoring_log_checked_at
  ON user_sync_monitoring_log(checked_at DESC);

-- Index for alert queries
CREATE INDEX idx_user_sync_monitoring_log_sync_status
  ON user_sync_monitoring_log(sync_status);

COMMENT ON TABLE user_sync_monitoring_log IS
  'Time-series log of user sync monitoring metrics. Used for dashboards and alerting.';

-- ============================================================================
-- AUTOMATED MONITORING FUNCTION
-- ============================================================================

-- Function: Record user sync metrics (call this daily)
CREATE OR REPLACE FUNCTION record_user_sync_metrics()
RETURNS UUID AS $$
DECLARE
  auth_count BIGINT;
  public_count BIGINT;
  ghost_count BIGINT;
  orphan_count BIGINT;
  discrepancy BIGINT;
  trigger_active BOOLEAN;
  status VARCHAR(50);
  alert_needed BOOLEAN DEFAULT FALSE;
  alert_msg TEXT;
  log_id UUID;
BEGIN
  -- Collect metrics
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO public_count FROM public.users;

  SELECT COUNT(*) INTO ghost_count
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;

  SELECT COUNT(*) INTO orphan_count
  FROM public.users pu
  LEFT JOIN auth.users au ON pu.id = au.id
  WHERE au.id IS NULL;

  discrepancy := ABS(auth_count - public_count);

  -- Check trigger status
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created' AND tgenabled = 'O'
  ) INTO trigger_active;

  -- Determine status and alert conditions
  IF NOT trigger_active THEN
    status := 'critical';
    alert_needed := TRUE;
    alert_msg := 'CRITICAL: User sync trigger is disabled or missing!';
  ELSIF ghost_count > 0 OR discrepancy > 0 THEN
    status := 'critical';
    alert_needed := TRUE;
    alert_msg := format('Data quality issue: %s ghost users, %s discrepancy',
                       ghost_count, discrepancy);
  ELSIF orphan_count > 0 THEN
    status := 'degraded';
    alert_needed := TRUE;
    alert_msg := format('Warning: %s orphaned profiles detected', orphan_count);
  ELSE
    status := 'healthy';
  END IF;

  -- Insert monitoring record
  INSERT INTO user_sync_monitoring_log (
    auth_users_count,
    public_users_count,
    ghost_users_count,
    orphaned_profiles_count,
    discrepancy_count,
    sync_status,
    trigger_enabled,
    alert_sent,
    alert_reason,
    checked_at
  ) VALUES (
    auth_count,
    public_count,
    ghost_count,
    orphan_count,
    discrepancy,
    status,
    trigger_active,
    alert_needed,
    alert_msg,
    NOW()
  )
  RETURNING id INTO log_id;

  -- Log to cleanup_audit_log for consistency
  PERFORM log_cleanup_job(
    'user_sync_monitoring',
    'daily',
    CASE WHEN status = 'healthy' THEN 'completed' ELSE 'failed' END,
    ghost_count + orphan_count,
    0,
    alert_msg
  );

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_user_sync_metrics() IS
  'Records user sync metrics to monitoring log. Call daily via scheduled Edge Function.';

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function: Get latest sync status
CREATE OR REPLACE FUNCTION get_latest_sync_status()
RETURNS TABLE(
  status VARCHAR(50),
  auth_count BIGINT,
  public_count BIGINT,
  ghost_count BIGINT,
  orphan_count BIGINT,
  trigger_enabled BOOLEAN,
  checked_at TIMESTAMPTZ,
  alert_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sync_status,
    auth_users_count,
    public_users_count,
    ghost_users_count,
    orphaned_profiles_count,
    trigger_enabled,
    checked_at,
    alert_reason
  FROM user_sync_monitoring_log
  ORDER BY checked_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_latest_sync_status() IS
  'Returns the most recent user sync status. Use for health checks and dashboards.';

-- Function: Get sync status history (for charts)
CREATE OR REPLACE FUNCTION get_sync_status_history(days INTEGER DEFAULT 30)
RETURNS TABLE(
  date DATE,
  auth_users_count BIGINT,
  public_users_count BIGINT,
  ghost_users_count BIGINT,
  orphaned_profiles_count BIGINT,
  sync_status VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    checked_at::DATE as date,
    auth_users_count,
    public_users_count,
    ghost_users_count,
    orphaned_profiles_count,
    sync_status
  FROM user_sync_monitoring_log
  WHERE checked_at >= NOW() - (days || ' days')::INTERVAL
  ORDER BY checked_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_sync_status_history(INTEGER) IS
  'Returns historical user sync metrics for time-series charts. Default 30 days.';

-- ============================================================================
-- GRANTS (Service role only for automated jobs, authenticated for reads)
-- ============================================================================

-- Grant execute to service_role for automated monitoring
GRANT EXECUTE ON FUNCTION check_ghost_users() TO service_role;
GRANT EXECUTE ON FUNCTION check_orphaned_profiles() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_sync_stats() TO service_role;
GRANT EXECUTE ON FUNCTION run_user_sync_quality_check() TO service_role;
GRANT EXECUTE ON FUNCTION record_user_sync_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION get_latest_sync_status() TO service_role;
GRANT EXECUTE ON FUNCTION get_sync_status_history(INTEGER) TO service_role;

-- Grant read access to authenticated users (for admin dashboard)
GRANT EXECUTE ON FUNCTION get_user_sync_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_sync_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_sync_status_history(INTEGER) TO authenticated;

-- Enable RLS on monitoring log
ALTER TABLE user_sync_monitoring_log ENABLE ROW LEVEL SECURITY;

-- Service role can manage monitoring log
CREATE POLICY "Service role can manage user sync monitoring log"
  ON user_sync_monitoring_log
  FOR ALL
  TO service_role
  USING (true);

-- Authenticated users can read monitoring log (for dashboards)
CREATE POLICY "Authenticated users can read sync monitoring log"
  ON user_sync_monitoring_log
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify:
--
-- 1. Check current sync status:
-- SELECT * FROM get_latest_sync_status();
--
-- 2. Run quality check:
-- SELECT * FROM run_user_sync_quality_check();
--
-- 3. Get sync statistics:
-- SELECT * FROM get_user_sync_stats();
--
-- 4. Check for ghost users:
-- SELECT * FROM check_ghost_users();
--
-- 5. Check for orphaned profiles:
-- SELECT * FROM check_orphaned_profiles();
--
-- 6. View historical metrics:
-- SELECT * FROM get_sync_status_history(7);
--
-- 7. Record initial metrics:
-- SELECT record_user_sync_metrics();
