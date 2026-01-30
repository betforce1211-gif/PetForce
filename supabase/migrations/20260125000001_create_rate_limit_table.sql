-- Create rate limiting table for email operations
-- This supports rate limiting for resend confirmation emails

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  operation text NOT NULL,
  attempted_at timestamptz DEFAULT now() NOT NULL,
  ip_address inet,
  user_agent text,
  
  -- Index for fast lookups
  CONSTRAINT rate_limit_email_operation_unique UNIQUE (email, operation, attempted_at)
);

-- Index for efficient rate limit checks
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_email_operation_time 
  ON auth_rate_limits(email, operation, attempted_at DESC);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_attempted_at 
  ON auth_rate_limits(attempted_at);

-- Enable RLS
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role only" ON auth_rate_limits
  FOR ALL
  TO service_role
  USING (true);

-- Function to clean up old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_rate_limits
  WHERE attempted_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension in production)
-- For local development, this will need to be run manually or via cron
COMMENT ON FUNCTION cleanup_old_rate_limits() IS 
  'Removes rate limit records older than 24 hours. Run via pg_cron or manual cleanup.';
