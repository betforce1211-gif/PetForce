# Session Cleanup Automation

**Purpose**: Automated procedures for cleaning up expired sessions, tokens, and authentication data to maintain database health and enforce data retention policies.

**Owner**: Data Engineering (Buck) + Infrastructure (Isabel)
**Last Updated**: 2026-01-25
**Status**: READY FOR IMPLEMENTATION

---

## Table of Contents

1. [Overview](#overview)
2. [Cleanup Targets](#cleanup-targets)
3. [Automation Strategy](#automation-strategy)
4. [Implementation Options](#implementation-options)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Testing Procedures](#testing-procedures)
7. [Rollout Plan](#rollout-plan)

---

## Overview

PetForce authentication system generates short-lived tokens and sessions that must be cleaned up regularly to:

- **Maintain database performance** - Remove expired records that slow down queries
- **Enforce retention policies** - Comply with GDPR/CCPA data retention requirements
- **Reduce storage costs** - Free up disk space from stale data
- **Improve security** - Remove old tokens that could be attack vectors

### Current State

Manual cleanup is NOT in place. Database tables grow indefinitely with expired records:
- `sessions` table: Expired sessions accumulate (refresh tokens expired > 30 days)
- `email_verifications` table: Old verification tokens (expired > 1 hour)
- `password_resets` table: Old reset tokens (expired > 1 hour)
- `magic_links` table: Old magic links (expired > 15 minutes)
- `auth_rate_limits` table: Old rate limit records (> 24 hours)

### Target State

Automated cleanup jobs run on schedule with:
- Daily cleanup for short-lived tokens
- Weekly cleanup for sessions and metadata
- Monthly cleanup for soft-deleted users
- Monitoring and alerting for job failures

---

## Cleanup Targets

### 1. Expired Tokens (Daily)

**Email Verification Tokens**
- Retention: 1 hour (after expiration)
- Expected volume: ~100/day (assuming 10 signups/day * 10% resend rate)
- Query:
  ```sql
  DELETE FROM email_verifications
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  ```

**Password Reset Tokens**
- Retention: 1 hour (after expiration)
- Expected volume: ~50/day (assuming 5 resets/day)
- Query:
  ```sql
  DELETE FROM password_resets
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  ```

**Magic Link Tokens**
- Retention: 15 minutes (after expiration)
- Expected volume: ~20/day (assuming low magic link usage initially)
- Query:
  ```sql
  DELETE FROM magic_links
  WHERE expires_at < NOW() - INTERVAL '15 minutes';
  ```

**Rate Limit Records**
- Retention: 24 hours
- Expected volume: ~500/day (assuming moderate rate limiting)
- Query:
  ```sql
  DELETE FROM auth_rate_limits
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
  ```

### 2. Expired Sessions (Weekly)

**Refresh Tokens**
- Retention: 30 days expiration + 7 days grace period
- Expected volume: ~1000/week (assuming 100 active users * 10 sessions each)
- Query:
  ```sql
  DELETE FROM sessions
  WHERE refresh_token_expires_at < NOW() - INTERVAL '7 days';
  ```

**Session Metadata (PII Removal)**
- Retention: 90 days for IP/user-agent
- Expected volume: ~100 updates/week
- Query:
  ```sql
  UPDATE sessions
  SET
    ip_address = NULL,
    user_agent = NULL,
    device_os = NULL,
    device_browser = NULL
  WHERE last_activity_at < NOW() - INTERVAL '90 days'
    AND ip_address IS NOT NULL;
  ```

### 3. Soft-Deleted Users (Monthly)

**User Hard Deletion**
- Retention: 30 days after soft delete
- Expected volume: ~10/month (low churn initially)
- Query:
  ```sql
  -- Hard delete users past 30-day grace period
  DELETE FROM users
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
  ```

  **Note**: This cascades to:
  - `sessions` (via ON DELETE CASCADE)
  - `email_verifications` (via ON DELETE CASCADE)
  - `password_resets` (via ON DELETE CASCADE)
  - `oauth_connections` (via ON DELETE CASCADE)
  - `biometric_devices` (via ON DELETE CASCADE)

### 4. Inactive User Soft Deletion (Monthly)

**Inactivity-Based Soft Delete**
- Inactivity threshold: 2 years (no login)
- Warning emails: 18 months, 23 months (future)
- Query:
  ```sql
  UPDATE users
  SET
    deleted_at = NOW(),
    deletion_reason = 'inactivity',
    email = 'deleted_' || TO_CHAR(NOW(), 'YYYYMMDD') || '@deleted.local'
  WHERE last_login_at < NOW() - INTERVAL '2 years'
    AND deleted_at IS NULL;
  ```

---

## Automation Strategy

### Option 1: Supabase Database Functions + pg_cron (RECOMMENDED)

**Pros**:
- Native PostgreSQL solution (no external dependencies)
- Runs directly in database (fast, secure)
- Can be version-controlled in migrations
- No additional infrastructure needed

**Cons**:
- Requires pg_cron extension (available on Supabase Pro plan)
- Limited monitoring/alerting (need external observability)
- Harder to debug failures

**Implementation**:

```sql
-- Create cleanup functions
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS TABLE(deleted_verifications BIGINT, deleted_resets BIGINT, deleted_magic_links BIGINT, deleted_rate_limits BIGINT) AS $$
DECLARE
  v_deleted_verifications BIGINT;
  v_deleted_resets BIGINT;
  v_deleted_magic_links BIGINT;
  v_deleted_rate_limits BIGINT;
BEGIN
  -- Delete expired email verifications
  DELETE FROM email_verifications
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS v_deleted_verifications = ROW_COUNT;

  -- Delete expired password resets
  DELETE FROM password_resets
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS v_deleted_resets = ROW_COUNT;

  -- Delete expired magic links
  DELETE FROM magic_links
  WHERE expires_at < NOW() - INTERVAL '15 minutes';
  GET DIAGNOSTICS v_deleted_magic_links = ROW_COUNT;

  -- Delete old rate limit records
  DELETE FROM auth_rate_limits
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS v_deleted_rate_limits = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_verifications, v_deleted_resets, v_deleted_magic_links, v_deleted_rate_limits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule daily cleanup at 2 AM UTC
SELECT cron.schedule(
  'cleanup-expired-tokens',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$SELECT * FROM cleanup_expired_tokens();$$
);
```

### Option 2: GitHub Actions Workflow

**Pros**:
- Easy to monitor (GitHub Actions UI)
- Easy to debug (logs in GitHub)
- No pg_cron extension needed
- Can integrate with Slack/Discord notifications

**Cons**:
- Requires database credentials in GitHub Secrets
- Adds external dependency (GitHub)
- Slightly slower (network roundtrip)

**Implementation**:

```yaml
# .github/workflows/cleanup-sessions.yml
name: Database Cleanup

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup expired tokens
        run: |
          psql "$DATABASE_URL" <<EOF
            DELETE FROM email_verifications WHERE expires_at < NOW() - INTERVAL '1 hour';
            DELETE FROM password_resets WHERE expires_at < NOW() - INTERVAL '1 hour';
            DELETE FROM magic_links WHERE expires_at < NOW() - INTERVAL '15 minutes';
            DELETE FROM auth_rate_limits WHERE attempted_at < NOW() - INTERVAL '24 hours';
          EOF
        env:
          DATABASE_URL: ${{ secrets.SUPABASE_DB_URL }}
```

### Option 3: Supabase Edge Functions (Future)

**Pros**:
- TypeScript-based (matches codebase)
- Can include complex logic (metrics, logging, alerting)
- Integrates with Supabase ecosystem

**Cons**:
- More complex to maintain
- Higher latency (HTTP request overhead)
- Requires edge function deployment

**When to use**: If cleanup logic becomes complex (e.g., archival to S3, custom notifications).

---

## Recommended Implementation Plan

### Phase 1: Basic Cleanup (Week 1)

Use **pg_cron** for simplicity:

1. Create database migration:
   ```sql
   -- Migration: 20260125000002_session_cleanup_automation.sql

   -- Enable pg_cron extension (Supabase Pro required)
   CREATE EXTENSION IF NOT EXISTS pg_cron;

   -- Daily cleanup function
   CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
   RETURNS TABLE(
     deleted_verifications BIGINT,
     deleted_resets BIGINT,
     deleted_magic_links BIGINT,
     deleted_rate_limits BIGINT,
     executed_at TIMESTAMPTZ
   ) AS $$
   DECLARE
     v_deleted_verifications BIGINT;
     v_deleted_resets BIGINT;
     v_deleted_magic_links BIGINT;
     v_deleted_rate_limits BIGINT;
   BEGIN
     -- Email verifications
     DELETE FROM email_verifications
     WHERE expires_at < NOW() - INTERVAL '1 hour';
     GET DIAGNOSTICS v_deleted_verifications = ROW_COUNT;

     -- Password resets
     DELETE FROM password_resets
     WHERE expires_at < NOW() - INTERVAL '1 hour';
     GET DIAGNOSTICS v_deleted_resets = ROW_COUNT;

     -- Magic links
     DELETE FROM magic_links
     WHERE expires_at < NOW() - INTERVAL '15 minutes';
     GET DIAGNOSTICS v_deleted_magic_links = ROW_COUNT;

     -- Rate limits
     DELETE FROM auth_rate_limits
     WHERE attempted_at < NOW() - INTERVAL '24 hours';
     GET DIAGNOSTICS v_deleted_rate_limits = ROW_COUNT;

     RETURN QUERY SELECT
       v_deleted_verifications,
       v_deleted_resets,
       v_deleted_magic_links,
       v_deleted_rate_limits,
       NOW();
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Weekly cleanup function
   CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
   RETURNS TABLE(
     deleted_sessions BIGINT,
     anonymized_sessions BIGINT,
     executed_at TIMESTAMPTZ
   ) AS $$
   DECLARE
     v_deleted_sessions BIGINT;
     v_anonymized_sessions BIGINT;
   BEGIN
     -- Delete expired sessions
     DELETE FROM sessions
     WHERE refresh_token_expires_at < NOW() - INTERVAL '7 days';
     GET DIAGNOSTICS v_deleted_sessions = ROW_COUNT;

     -- Anonymize old session metadata
     UPDATE sessions
     SET
       ip_address = NULL,
       user_agent = NULL,
       device_os = NULL,
       device_browser = NULL
     WHERE last_activity_at < NOW() - INTERVAL '90 days'
       AND ip_address IS NOT NULL;
     GET DIAGNOSTICS v_anonymized_sessions = ROW_COUNT;

     RETURN QUERY SELECT v_deleted_sessions, v_anonymized_sessions, NOW();
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Monthly cleanup function
   CREATE OR REPLACE FUNCTION cleanup_deleted_users()
   RETURNS TABLE(
     hard_deleted_users BIGINT,
     soft_deleted_inactive BIGINT,
     executed_at TIMESTAMPTZ
   ) AS $$
   DECLARE
     v_hard_deleted BIGINT;
     v_soft_deleted BIGINT;
   BEGIN
     -- Hard delete users past 30-day grace period
     DELETE FROM users
     WHERE deleted_at IS NOT NULL
       AND deleted_at < NOW() - INTERVAL '30 days';
     GET DIAGNOSTICS v_hard_deleted = ROW_COUNT;

     -- Soft delete inactive users (2 years no login)
     UPDATE users
     SET
       deleted_at = NOW(),
       deletion_reason = 'inactivity',
       email = 'deleted_' || TO_CHAR(NOW(), 'YYYYMMDD') || '@deleted.local'
     WHERE last_login_at < NOW() - INTERVAL '2 years'
       AND deleted_at IS NULL;
     GET DIAGNOSTICS v_soft_deleted = ROW_COUNT;

     RETURN QUERY SELECT v_hard_deleted, v_soft_deleted, NOW();
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Schedule cleanup jobs
   SELECT cron.schedule(
     'cleanup-expired-tokens',
     '0 2 * * *', -- Daily at 2 AM UTC
     $$SELECT * FROM cleanup_expired_tokens();$$
   );

   SELECT cron.schedule(
     'cleanup-expired-sessions',
     '0 3 * * 0', -- Weekly on Sunday at 3 AM UTC
     $$SELECT * FROM cleanup_expired_sessions();$$
   );

   SELECT cron.schedule(
     'cleanup-deleted-users',
     '0 4 1 * *', -- Monthly on 1st at 4 AM UTC
     $$SELECT * FROM cleanup_deleted_users();$$
   );

   COMMENT ON FUNCTION cleanup_expired_tokens() IS
     'Daily cleanup of expired authentication tokens (email verifications, password resets, magic links, rate limits)';
   COMMENT ON FUNCTION cleanup_expired_sessions() IS
     'Weekly cleanup of expired sessions and anonymization of old session metadata';
   COMMENT ON FUNCTION cleanup_deleted_users() IS
     'Monthly hard deletion of soft-deleted users and soft deletion of inactive users';
   ```

2. Apply migration:
   ```bash
   supabase db push
   ```

3. Verify cron jobs are scheduled:
   ```sql
   SELECT * FROM cron.job;
   ```

### Phase 2: Monitoring (Week 2)

Add monitoring to track cleanup job success:

1. Create cleanup log table:
   ```sql
   CREATE TABLE cleanup_logs (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     job_name VARCHAR(100) NOT NULL,
     executed_at TIMESTAMPTZ DEFAULT NOW(),
     records_deleted BIGINT NOT NULL,
     execution_time_ms INTEGER,
     status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed'
     error_message TEXT
   );

   CREATE INDEX idx_cleanup_logs_executed_at ON cleanup_logs(executed_at DESC);
   CREATE INDEX idx_cleanup_logs_job_name ON cleanup_logs(job_name);
   ```

2. Update cleanup functions to log results:
   ```sql
   -- Insert log after each cleanup
   INSERT INTO cleanup_logs (job_name, records_deleted, execution_time_ms)
   VALUES ('cleanup_expired_tokens', v_deleted_verifications + v_deleted_resets,
           EXTRACT(MILLISECONDS FROM NOW() - v_start_time));
   ```

3. Create monitoring view:
   ```sql
   CREATE VIEW cleanup_stats AS
   SELECT
     job_name,
     COUNT(*) as total_runs,
     SUM(records_deleted) as total_deleted,
     AVG(records_deleted) as avg_deleted_per_run,
     MAX(executed_at) as last_run_at,
     AVG(execution_time_ms) as avg_execution_time_ms,
     COUNT(*) FILTER (WHERE status = 'failed') as failed_runs
   FROM cleanup_logs
   WHERE executed_at > NOW() - INTERVAL '30 days'
   GROUP BY job_name;
   ```

### Phase 3: Alerting (Week 3)

Integrate with monitoring service (Datadog/Prometheus):

1. Export metrics via API endpoint (future Edge Function)
2. Create alerts:
   - Cleanup job failure (critical)
   - Cleanup job not running (warning)
   - Unusual deletion volume (warning)
   - Database size growth (warning)

---

## Monitoring & Alerting

### Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Cleanup job success rate | 100% | Alert if <99% |
| Records deleted per day | ~100-500 | Alert if >10,000 (anomaly) |
| Database size growth | <1GB/month | Alert if >5GB/month |
| Oldest expired token age | <24 hours | Alert if >48 hours |
| Job execution time | <5 seconds | Alert if >30 seconds |

### Dashboard Metrics

Create Datadog/Grafana dashboard with:
- Cleanup job execution timeline (last 30 days)
- Records deleted by table (bar chart)
- Database size over time (line chart)
- Cleanup job duration (line chart)
- Failed job count (number)

### Alerts

**Critical Alerts**:
- Cleanup job failed 3 times in a row → Page on-call engineer
- Database size >80% of allocated storage → Page DBA

**Warning Alerts**:
- Cleanup job skipped (didn't run on schedule) → Slack notification
- Unusual deletion volume (>10x normal) → Slack notification
- Oldest expired token >48 hours → Slack notification

---

## Testing Procedures

### Pre-Deployment Testing

1. **Test cleanup functions in dev environment**:
   ```sql
   -- Insert test expired records
   INSERT INTO email_verifications (user_id, email, token_hash, expires_at)
   VALUES (
     '00000000-0000-0000-0000-000000000000',
     'test@example.com',
     'expired_token_hash',
     NOW() - INTERVAL '2 hours'
   );

   -- Run cleanup function
   SELECT * FROM cleanup_expired_tokens();

   -- Verify record was deleted
   SELECT COUNT(*) FROM email_verifications WHERE token_hash = 'expired_token_hash';
   -- Expected: 0
   ```

2. **Test cron schedule parsing**:
   ```sql
   SELECT cron.schedule(
     'test-cleanup',
     '0 2 * * *',
     $$SELECT 1;$$
   );

   SELECT * FROM cron.job WHERE jobname = 'test-cleanup';

   -- Unschedule test job
   SELECT cron.unschedule('test-cleanup');
   ```

3. **Test cascading deletes**:
   ```sql
   -- Create test user with sessions
   INSERT INTO users (id, email) VALUES ('test-user-id', 'test@example.com');
   INSERT INTO sessions (user_id, refresh_token_hash, access_token_expires_at, refresh_token_expires_at)
   VALUES ('test-user-id', 'test-token-hash', NOW(), NOW() - INTERVAL '8 days');

   -- Run cleanup
   SELECT * FROM cleanup_expired_sessions();

   -- Verify session was deleted
   SELECT COUNT(*) FROM sessions WHERE user_id = 'test-user-id';
   -- Expected: 0
   ```

### Post-Deployment Verification

1. **Verify cron jobs are scheduled**:
   ```sql
   SELECT jobname, schedule, command
   FROM cron.job
   WHERE jobname LIKE 'cleanup-%';
   ```

2. **Monitor first execution**:
   ```sql
   -- Check cron run history
   SELECT * FROM cron.job_run_details
   WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE 'cleanup-%')
   ORDER BY start_time DESC
   LIMIT 10;
   ```

3. **Verify cleanup logs**:
   ```sql
   SELECT * FROM cleanup_logs
   ORDER BY executed_at DESC
   LIMIT 10;
   ```

---

## Rollout Plan

### Week 1: Development & Testing
- [ ] Create database migration with cleanup functions
- [ ] Test cleanup functions in local dev environment
- [ ] Create cleanup logs table
- [ ] Test cron scheduling (local Supabase)

### Week 2: Staging Deployment
- [ ] Deploy migration to staging environment
- [ ] Verify cron jobs are scheduled
- [ ] Monitor first 3 days of cleanup executions
- [ ] Fix any issues

### Week 3: Production Deployment
- [ ] Deploy migration to production (low-traffic window)
- [ ] Verify cron jobs are scheduled
- [ ] Monitor first 7 days of executions
- [ ] Document any anomalies

### Week 4: Monitoring & Alerting
- [ ] Create Datadog/Grafana dashboard
- [ ] Set up alerts (Slack, PagerDuty)
- [ ] Write runbook for troubleshooting failures
- [ ] Train team on monitoring tools

---

## Troubleshooting Guide

### Issue: Cleanup job not running

**Symptoms**: No new entries in `cleanup_logs`, cron.job_run_details shows no executions

**Diagnosis**:
```sql
-- Check if job is scheduled
SELECT * FROM cron.job WHERE jobname LIKE 'cleanup-%';

-- Check recent runs
SELECT * FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE 'cleanup-%')
ORDER BY start_time DESC LIMIT 10;
```

**Solution**:
1. Verify pg_cron extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Check Supabase plan supports pg_cron (Pro tier required)
3. Re-schedule job if missing: `SELECT cron.schedule(...);`

### Issue: Cleanup job failing

**Symptoms**: `cron.job_run_details` shows `status = 'failed'`

**Diagnosis**:
```sql
-- Check error details
SELECT jobid, start_time, status, return_message
FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 5;
```

**Solution**:
1. Check error message for SQL syntax errors
2. Verify table structure hasn't changed
3. Check database locks (cleanup may timeout if tables locked)
4. Manually run cleanup function to debug: `SELECT * FROM cleanup_expired_tokens();`

### Issue: Too many records deleted

**Symptoms**: Cleanup job deletes >10,000 records (unusually high)

**Diagnosis**:
```sql
-- Check recent deletion volumes
SELECT job_name, executed_at, records_deleted
FROM cleanup_logs
WHERE records_deleted > 1000
ORDER BY executed_at DESC;

-- Check table sizes
SELECT
  'email_verifications' as table_name, COUNT(*) as record_count
FROM email_verifications
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'password_resets', COUNT(*) FROM password_resets;
```

**Solution**:
1. If legitimate backlog (e.g., cleanup was disabled), this is expected
2. If recurring, investigate why so many expired records are accumulating
3. May indicate rate limiting or token generation issues

---

## References

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pgcron)
- [Data Retention Policy](./DATA-RETENTION-POLICY.md)
- [PostgreSQL pg_cron Extension](https://github.com/citusdata/pg_cron)

---

## Approval & Next Steps

| Task | Owner | Status | Target Date |
|------|-------|--------|-------------|
| Create migration | Buck | TODO | Week 1 |
| Test in dev | Buck | TODO | Week 1 |
| Deploy to staging | Buck + Isabel | TODO | Week 2 |
| Deploy to production | Buck + Isabel | TODO | Week 3 |
| Set up monitoring | Buck + Larry | TODO | Week 4 |

**Document Version**: 1.0
**Status**: READY FOR IMPLEMENTATION
