-- Automated Data Cleanup Functions
-- Purpose: Implements automated cleanup of expired tokens, sessions, and old data
-- Based on: Data Retention Policy v1.0
-- Owner: Infrastructure Team (Isabel) with Data Engineering (Buck)
-- Created: 2026-01-25

-- ============================================================================
-- DAILY CLEANUP FUNCTIONS
-- ============================================================================

-- Function: Cleanup expired email verification tokens
CREATE OR REPLACE FUNCTION cleanup_expired_email_verifications()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  row_count BIGINT;
BEGIN
  DELETE FROM email_verifications WHERE expires_at < NOW();
  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_email_verifications() IS
  'Deletes email verification tokens that have expired. Run daily.';

-- Function: Cleanup expired password reset tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_resets()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  row_count BIGINT;
BEGIN
  DELETE FROM password_resets WHERE expires_at < NOW();
  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_password_resets() IS
  'Deletes password reset tokens that have expired. Run daily.';

-- Function: Cleanup expired magic link tokens
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  row_count BIGINT;
BEGIN
  DELETE FROM magic_links WHERE expires_at < NOW();
  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_magic_links() IS
  'Deletes magic link tokens that have expired. Run daily.';

-- Function: Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  row_count BIGINT;
BEGIN
  DELETE FROM sessions WHERE refresh_token_expires_at < NOW();
  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_sessions() IS
  'Deletes sessions with expired refresh tokens. Run daily.';

-- Function: Cleanup old rate limit records (from existing function)
-- Already exists in 20260125000001_create_rate_limit_table.sql
-- cleanup_old_rate_limits() - Removes records older than 24 hours

-- Function: Master daily cleanup (runs all daily cleanup tasks)
CREATE OR REPLACE FUNCTION run_daily_cleanup()
RETURNS TABLE(
  task VARCHAR(100),
  deleted_count BIGINT,
  execution_time_ms BIGINT
) AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  count BIGINT;
BEGIN
  -- Cleanup email verifications
  start_time := clock_timestamp();
  SELECT * INTO count FROM cleanup_expired_email_verifications();
  end_time := clock_timestamp();
  RETURN QUERY SELECT
    'email_verifications'::VARCHAR(100),
    count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::BIGINT;

  -- Cleanup password resets
  start_time := clock_timestamp();
  SELECT * INTO count FROM cleanup_expired_password_resets();
  end_time := clock_timestamp();
  RETURN QUERY SELECT
    'password_resets'::VARCHAR(100),
    count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::BIGINT;

  -- Cleanup magic links
  start_time := clock_timestamp();
  SELECT * INTO count FROM cleanup_expired_magic_links();
  end_time := clock_timestamp();
  RETURN QUERY SELECT
    'magic_links'::VARCHAR(100),
    count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::BIGINT;

  -- Cleanup expired sessions
  start_time := clock_timestamp();
  SELECT * INTO count FROM cleanup_expired_sessions();
  end_time := clock_timestamp();
  RETURN QUERY SELECT
    'sessions'::VARCHAR(100),
    count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::BIGINT;

  -- Cleanup old rate limits
  start_time := clock_timestamp();
  PERFORM cleanup_old_rate_limits();
  GET DIAGNOSTICS count = ROW_COUNT;
  end_time := clock_timestamp();
  RETURN QUERY SELECT
    'rate_limits'::VARCHAR(100),
    count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_daily_cleanup() IS
  'Runs all daily cleanup tasks and returns metrics. Schedule at 2 AM UTC.';

-- ============================================================================
-- WEEKLY CLEANUP FUNCTIONS
-- ============================================================================

-- Function: Hard delete soft-deleted users (>30 days)
CREATE OR REPLACE FUNCTION cleanup_soft_deleted_users()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  row_count BIGINT;
BEGIN
  -- Hard delete users that were soft-deleted more than 30 days ago
  -- Cascade will handle related records (sessions, email_verifications, etc.)
  DELETE FROM users
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_soft_deleted_users() IS
  'Hard deletes users who were soft-deleted more than 30 days ago. Run weekly.';

-- Function: Delete old session metadata (>90 days)
CREATE OR REPLACE FUNCTION cleanup_old_session_metadata()
RETURNS TABLE(updated_count BIGINT) AS $$
DECLARE
  row_count BIGINT;
BEGIN
  -- Remove PII from old session records (keep session for audit, remove metadata)
  UPDATE sessions
  SET
    ip_address = NULL,
    user_agent = NULL,
    device_os = NULL,
    device_browser = NULL
  WHERE last_activity_at < NOW() - INTERVAL '90 days'
    AND ip_address IS NOT NULL; -- Only update if metadata still exists

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_session_metadata() IS
  'Removes PII from session metadata older than 90 days. Run weekly.';

-- Function: Master weekly cleanup
CREATE OR REPLACE FUNCTION run_weekly_cleanup()
RETURNS TABLE(
  task VARCHAR(100),
  affected_count BIGINT,
  execution_time_ms BIGINT
) AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  count BIGINT;
BEGIN
  -- Hard delete soft-deleted users
  start_time := clock_timestamp();
  SELECT * INTO count FROM cleanup_soft_deleted_users();
  end_time := clock_timestamp();
  RETURN QUERY SELECT
    'soft_deleted_users'::VARCHAR(100),
    count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::BIGINT;

  -- Cleanup old session metadata
  start_time := clock_timestamp();
  SELECT * INTO count FROM cleanup_old_session_metadata();
  end_time := clock_timestamp();
  RETURN QUERY SELECT
    'session_metadata'::VARCHAR(100),
    count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_weekly_cleanup() IS
  'Runs all weekly cleanup tasks. Schedule Sunday at 3 AM UTC.';

-- ============================================================================
-- MONTHLY CLEANUP FUNCTIONS
-- ============================================================================

-- Function: Soft delete inactive users (>2 years no login)
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS TABLE(
  warned_count BIGINT,
  soft_deleted_count BIGINT
) AS $$
DECLARE
  warn_count BIGINT;
  delete_count BIGINT;
BEGIN
  -- Note: This function identifies inactive users but doesn't send emails
  -- Email warnings should be sent by the application layer

  -- Soft delete users inactive for 2+ years
  UPDATE users
  SET
    deleted_at = NOW(),
    deletion_reason = 'inactivity'
  WHERE last_login_at < NOW() - INTERVAL '2 years'
    AND deleted_at IS NULL;

  GET DIAGNOSTICS delete_count = ROW_COUNT;

  -- Count users approaching inactivity (18 months) - for monitoring
  SELECT COUNT(*) INTO warn_count
  FROM users
  WHERE last_login_at < NOW() - INTERVAL '18 months'
    AND last_login_at >= NOW() - INTERVAL '2 years'
    AND deleted_at IS NULL;

  RETURN QUERY SELECT warn_count, delete_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_inactive_users() IS
  'Soft deletes users inactive for 2+ years. Returns warning count and deleted count. Run monthly.';

-- Function: Master monthly cleanup
CREATE OR REPLACE FUNCTION run_monthly_cleanup()
RETURNS TABLE(
  task VARCHAR(100),
  affected_count BIGINT,
  execution_time_ms BIGINT
) AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  warn_count BIGINT;
  delete_count BIGINT;
BEGIN
  -- Cleanup inactive users
  start_time := clock_timestamp();
  SELECT * INTO warn_count, delete_count FROM cleanup_inactive_users();
  end_time := clock_timestamp();

  RETURN QUERY SELECT
    'inactive_users_warned'::VARCHAR(100),
    warn_count,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::BIGINT;

  RETURN QUERY SELECT
    'inactive_users_deleted'::VARCHAR(100),
    delete_count,
    0::BIGINT; -- Same operation, no additional time
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_monthly_cleanup() IS
  'Runs all monthly cleanup tasks. Schedule 1st of month at 4 AM UTC.';

-- ============================================================================
-- MONITORING AND AUDIT FUNCTIONS
-- ============================================================================

-- Function: Generate retention compliance report
CREATE OR REPLACE FUNCTION generate_retention_report()
RETURNS TABLE(
  table_name VARCHAR(100),
  total_records BIGINT,
  oldest_record TIMESTAMPTZ,
  newest_record TIMESTAMPTZ,
  records_over_retention BIGINT,
  retention_threshold VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'users'::VARCHAR(100),
    COUNT(*)::BIGINT,
    MIN(created_at),
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '2 years' AND deleted_at IS NULL)::BIGINT,
    '2 years (inactive)'::VARCHAR(50)
  FROM users

  UNION ALL

  SELECT
    'sessions'::VARCHAR(100),
    COUNT(*)::BIGINT,
    MIN(created_at),
    MAX(created_at),
    COUNT(*) FILTER (WHERE refresh_token_expires_at < NOW())::BIGINT,
    '30 days (expired)'::VARCHAR(50)
  FROM sessions

  UNION ALL

  SELECT
    'email_verifications'::VARCHAR(100),
    COUNT(*)::BIGINT,
    MIN(created_at),
    MAX(created_at),
    COUNT(*) FILTER (WHERE expires_at < NOW())::BIGINT,
    '1 hour (expired)'::VARCHAR(50)
  FROM email_verifications

  UNION ALL

  SELECT
    'password_resets'::VARCHAR(100),
    COUNT(*)::BIGINT,
    MIN(created_at),
    MAX(created_at),
    COUNT(*) FILTER (WHERE expires_at < NOW())::BIGINT,
    '1 hour (expired)'::VARCHAR(50)
  FROM password_resets

  UNION ALL

  SELECT
    'magic_links'::VARCHAR(100),
    COUNT(*)::BIGINT,
    MIN(created_at),
    MAX(created_at),
    COUNT(*) FILTER (WHERE expires_at < NOW())::BIGINT,
    '15 minutes (expired)'::VARCHAR(50)
  FROM magic_links

  UNION ALL

  SELECT
    'rate_limits'::VARCHAR(100),
    COUNT(*)::BIGINT,
    MIN(attempted_at),
    MAX(attempted_at),
    COUNT(*) FILTER (WHERE attempted_at < NOW() - INTERVAL '24 hours')::BIGINT,
    '24 hours (old)'::VARCHAR(50)
  FROM auth_rate_limits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_retention_report() IS
  'Generates data retention compliance report. Run monthly or on-demand.';

-- ============================================================================
-- CLEANUP AUDIT LOG
-- ============================================================================

-- Table to track cleanup job execution
CREATE TABLE IF NOT EXISTS cleanup_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name VARCHAR(100) NOT NULL,
  job_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed'
  records_affected BIGINT DEFAULT 0,
  execution_time_ms BIGINT,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent jobs
CREATE INDEX idx_cleanup_audit_log_started_at ON cleanup_audit_log(started_at DESC);
CREATE INDEX idx_cleanup_audit_log_job_name ON cleanup_audit_log(job_name);

COMMENT ON TABLE cleanup_audit_log IS
  'Audit log for automated cleanup job execution. Tracks success/failure and metrics.';

-- Function: Log cleanup job execution
CREATE OR REPLACE FUNCTION log_cleanup_job(
  p_job_name VARCHAR(100),
  p_job_type VARCHAR(50),
  p_status VARCHAR(50),
  p_records_affected BIGINT DEFAULT 0,
  p_execution_time_ms BIGINT DEFAULT 0,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  job_id UUID;
BEGIN
  INSERT INTO cleanup_audit_log (
    job_name,
    job_type,
    started_at,
    completed_at,
    status,
    records_affected,
    execution_time_ms,
    error_message
  ) VALUES (
    p_job_name,
    p_job_type,
    NOW(),
    CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE NULL END,
    p_status,
    p_records_affected,
    p_execution_time_ms,
    p_error_message
  )
  RETURNING id INTO job_id;

  RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_cleanup_job IS
  'Logs cleanup job execution to audit log. Returns job ID.';

-- ============================================================================
-- GRANTS (Restrict to service role only)
-- ============================================================================

-- Revoke public access
REVOKE ALL ON FUNCTION cleanup_expired_email_verifications() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_expired_password_resets() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_expired_magic_links() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_expired_sessions() FROM PUBLIC;
REVOKE ALL ON FUNCTION run_daily_cleanup() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_soft_deleted_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_old_session_metadata() FROM PUBLIC;
REVOKE ALL ON FUNCTION run_weekly_cleanup() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_inactive_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION run_monthly_cleanup() FROM PUBLIC;
REVOKE ALL ON FUNCTION generate_retention_report() FROM PUBLIC;
REVOKE ALL ON FUNCTION log_cleanup_job FROM PUBLIC;

-- Grant to service_role only (used by Edge Functions)
GRANT EXECUTE ON FUNCTION cleanup_expired_email_verifications() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_password_resets() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_magic_links() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION run_daily_cleanup() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_soft_deleted_users() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_session_metadata() TO service_role;
GRANT EXECUTE ON FUNCTION run_weekly_cleanup() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO service_role;
GRANT EXECUTE ON FUNCTION run_monthly_cleanup() TO service_role;
GRANT EXECUTE ON FUNCTION generate_retention_report() TO service_role;
GRANT EXECUTE ON FUNCTION log_cleanup_job TO service_role;

-- Enable RLS on audit log
ALTER TABLE cleanup_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role can access audit log
CREATE POLICY "Service role can manage cleanup audit log" ON cleanup_audit_log
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Run daily cleanup manually (for testing)
-- SELECT * FROM run_daily_cleanup();

-- Run weekly cleanup manually
-- SELECT * FROM run_weekly_cleanup();

-- Run monthly cleanup manually
-- SELECT * FROM run_monthly_cleanup();

-- Generate retention compliance report
-- SELECT * FROM generate_retention_report();

-- View cleanup audit log
-- SELECT * FROM cleanup_audit_log ORDER BY started_at DESC LIMIT 10;
