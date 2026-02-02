-- Household Analytics Data Warehouse Schema
-- Data Engineering: Buck
-- Purpose: Dimensional model for household management analytics

-- ============================================================================
-- DIMENSION TABLES
-- ============================================================================

-- Dimension: Date (for temporal analysis)
CREATE TABLE IF NOT EXISTS dim_date (
  date_id INT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  year INT NOT NULL,
  quarter INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  week INT NOT NULL CHECK (week BETWEEN 1 AND 53),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INT NOT NULL,
  day_of_year INT NOT NULL,
  is_weekend BOOLEAN NOT NULL,
  is_holiday BOOLEAN DEFAULT FALSE,
  month_name VARCHAR(20),
  day_name VARCHAR(20)
);

CREATE INDEX idx_dim_date_date ON dim_date(date);
CREATE INDEX idx_dim_date_year_month ON dim_date(year, month);

COMMENT ON TABLE dim_date IS 'Date dimension for temporal analysis';

-- Dimension: Household (SCD Type 2 for historical tracking)
CREATE TABLE IF NOT EXISTS dim_household (
  household_key SERIAL PRIMARY KEY,
  household_id UUID NOT NULL,
  household_name TEXT,
  household_description TEXT,
  invite_code_format TEXT,
  leader_id UUID,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ,
  -- SCD Type 2 fields
  scd_start_date DATE NOT NULL,
  scd_end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_dim_household_id ON dim_household(household_id);
CREATE INDEX idx_dim_household_current ON dim_household(household_id, is_current);
CREATE INDEX idx_dim_household_leader ON dim_household(leader_id);

COMMENT ON TABLE dim_household IS 'Household dimension with slowly changing dimension (SCD Type 2) tracking';
COMMENT ON COLUMN dim_household.scd_start_date IS 'Start date of this version of the household record';
COMMENT ON COLUMN dim_household.scd_end_date IS 'End date of this version (NULL for current)';

-- Dimension: User
CREATE TABLE IF NOT EXISTS dim_user (
  user_key SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  user_email TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  account_status TEXT,
  -- SCD Type 1 (just track current state)
  last_active_at TIMESTAMPTZ,
  total_households_joined INT DEFAULT 0
);

CREATE INDEX idx_dim_user_id ON dim_user(user_id);
CREATE INDEX idx_dim_user_email ON dim_user(user_email);

COMMENT ON TABLE dim_user IS 'User dimension (SCD Type 1)';

-- Dimension: Member Role
CREATE TABLE IF NOT EXISTS dim_member_role (
  role_key SERIAL PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  role_description TEXT,
  permission_level INT,
  can_manage_members BOOLEAN,
  can_remove_members BOOLEAN,
  can_approve_requests BOOLEAN
);

INSERT INTO dim_member_role (role_name, role_description, permission_level, can_manage_members, can_remove_members, can_approve_requests)
VALUES
  ('leader', 'Household leader with full permissions', 100, TRUE, TRUE, TRUE),
  ('member', 'Regular household member', 50, FALSE, FALSE, FALSE),
  ('temporary', 'Temporary member (e.g., pet sitter)', 25, FALSE, FALSE, FALSE)
ON CONFLICT (role_name) DO NOTHING;

COMMENT ON TABLE dim_member_role IS 'Member role dimension (lookup table)';

-- ============================================================================
-- FACT TABLES
-- ============================================================================

-- Fact: Household Events (granular event tracking)
CREATE TABLE IF NOT EXISTS fact_household_events (
  event_id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  household_key INT REFERENCES dim_household(household_key),
  user_key INT REFERENCES dim_user(user_key),
  date_key INT REFERENCES dim_date(date_id),
  event_timestamp TIMESTAMPTZ NOT NULL,
  event_metadata JSONB,
  -- Measures
  duration_seconds INT,
  error_occurred BOOLEAN DEFAULT FALSE,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_fact_events_household ON fact_household_events(household_key);
CREATE INDEX idx_fact_events_user ON fact_household_events(user_key);
CREATE INDEX idx_fact_events_date ON fact_household_events(date_key);
CREATE INDEX idx_fact_events_timestamp ON fact_household_events(event_timestamp DESC);
CREATE INDEX idx_fact_events_type ON fact_household_events(event_type);
CREATE INDEX idx_fact_events_metadata ON fact_household_events USING gin(event_metadata);

COMMENT ON TABLE fact_household_events IS 'Granular event tracking for household activities';

-- Fact: Join Requests (request funnel analysis)
CREATE TABLE IF NOT EXISTS fact_join_requests (
  request_id BIGSERIAL PRIMARY KEY,
  household_key INT REFERENCES dim_household(household_key),
  requester_key INT REFERENCES dim_user(user_key),
  responder_key INT REFERENCES dim_user(user_key),
  requested_date_key INT REFERENCES dim_date(date_id),
  responded_date_key INT REFERENCES dim_date(date_id),
  requested_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  -- Dimensions
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  request_method TEXT, -- 'invite_code', 'qr_code', 'deep_link'
  -- Measures
  time_to_respond_hours DECIMAL(10,2),
  auto_approved BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT
);

CREATE INDEX idx_fact_requests_household ON fact_join_requests(household_key);
CREATE INDEX idx_fact_requests_requester ON fact_join_requests(requester_key);
CREATE INDEX idx_fact_requests_status ON fact_join_requests(status);
CREATE INDEX idx_fact_requests_requested_date ON fact_join_requests(requested_date_key);

COMMENT ON TABLE fact_join_requests IS 'Join request funnel for conversion analysis';

-- Fact: Member Activity (daily member metrics)
CREATE TABLE IF NOT EXISTS fact_member_activity (
  activity_id BIGSERIAL PRIMARY KEY,
  household_key INT REFERENCES dim_household(household_key),
  user_key INT REFERENCES dim_user(user_key),
  date_key INT REFERENCES dim_date(date_id),
  role_key INT REFERENCES dim_member_role(role_key),
  -- Measures
  days_in_household INT,
  is_active BOOLEAN,
  actions_count INT DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  UNIQUE(household_key, user_key, date_key)
);

CREATE INDEX idx_fact_activity_household ON fact_member_activity(household_key);
CREATE INDEX idx_fact_activity_user ON fact_member_activity(user_key);
CREATE INDEX idx_fact_activity_date ON fact_member_activity(date_key);

COMMENT ON TABLE fact_member_activity IS 'Daily snapshot of member activity';

-- ============================================================================
-- AGGREGATE TABLES (Pre-computed for performance)
-- ============================================================================

-- Aggregate: Household Metrics (Daily)
CREATE TABLE IF NOT EXISTS agg_household_metrics_daily (
  household_key INT REFERENCES dim_household(household_key),
  date_key INT REFERENCES dim_date(date_id),
  -- Member metrics
  active_member_count INT DEFAULT 0,
  temporary_member_count INT DEFAULT 0,
  members_joined_today INT DEFAULT 0,
  members_removed_today INT DEFAULT 0,
  -- Join request metrics
  join_requests_submitted INT DEFAULT 0,
  join_requests_approved INT DEFAULT 0,
  join_requests_rejected INT DEFAULT 0,
  join_requests_pending INT DEFAULT 0,
  avg_approval_time_hours DECIMAL(10,2),
  -- Activity metrics
  total_events INT DEFAULT 0,
  error_events INT DEFAULT 0,
  -- Invite code metrics
  invite_code_regenerations INT DEFAULT 0,
  invite_code_uses INT DEFAULT 0,
  qr_code_scans INT DEFAULT 0,
  PRIMARY KEY (household_key, date_key)
);

CREATE INDEX idx_agg_daily_date ON agg_household_metrics_daily(date_key);

COMMENT ON TABLE agg_household_metrics_daily IS 'Daily aggregated household metrics for fast queries';

-- Aggregate: User Engagement (Weekly)
CREATE TABLE IF NOT EXISTS agg_user_engagement_weekly (
  user_key INT REFERENCES dim_user(user_key),
  week_start_date DATE,
  -- Engagement metrics
  households_active_in INT DEFAULT 0,
  total_actions INT DEFAULT 0,
  days_active INT DEFAULT 0,
  avg_daily_actions DECIMAL(10,2),
  -- Contribution metrics
  join_requests_responded INT DEFAULT 0,
  members_invited INT DEFAULT 0,
  PRIMARY KEY (user_key, week_start_date)
);

CREATE INDEX idx_agg_weekly_date ON agg_user_engagement_weekly(week_start_date);

COMMENT ON TABLE agg_user_engagement_weekly IS 'Weekly user engagement rollup';

-- Aggregate: Join Funnel (Daily)
CREATE TABLE IF NOT EXISTS agg_join_funnel_daily (
  date_key INT REFERENCES dim_date(date_id) PRIMARY KEY,
  -- Funnel stages
  total_requests INT DEFAULT 0,
  approved_requests INT DEFAULT 0,
  rejected_requests INT DEFAULT 0,
  expired_requests INT DEFAULT 0,
  pending_requests INT DEFAULT 0,
  -- Conversion rates
  approval_rate_pct DECIMAL(5,2),
  rejection_rate_pct DECIMAL(5,2),
  -- Timing metrics
  avg_response_time_hours DECIMAL(10,2),
  median_response_time_hours DECIMAL(10,2),
  p95_response_time_hours DECIMAL(10,2)
);

COMMENT ON TABLE agg_join_funnel_daily IS 'Daily join funnel conversion metrics';

-- ============================================================================
-- MATERIALIZED VIEWS (For complex queries)
-- ============================================================================

-- View: Current Household State
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_household_current_state AS
SELECT
  h.household_id,
  h.household_name,
  h.leader_id,
  h.created_at,
  COUNT(DISTINCT ma.user_key) FILTER (WHERE ma.is_active = TRUE) AS active_members,
  COUNT(DISTINCT ma.user_key) FILTER (WHERE ma.is_active = TRUE AND r.role_name = 'temporary') AS temporary_members,
  MAX(ma.last_seen_at) AS last_activity_at,
  COUNT(DISTINCT jr.request_id) FILTER (WHERE jr.status = 'pending') AS pending_requests
FROM dim_household h
LEFT JOIN fact_member_activity ma ON h.household_key = ma.household_key
LEFT JOIN dim_member_role r ON ma.role_key = r.role_key
LEFT JOIN fact_join_requests jr ON h.household_key = jr.household_key
WHERE h.is_current = TRUE
GROUP BY h.household_id, h.household_name, h.leader_id, h.created_at;

CREATE UNIQUE INDEX idx_mv_household_id ON mv_household_current_state(household_id);

COMMENT ON MATERIALIZED VIEW mv_household_current_state IS 'Current state of all households (refresh hourly)';

-- View: User Household Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_household_summary AS
SELECT
  u.user_id,
  u.user_email,
  COUNT(DISTINCT ma.household_key) AS total_households,
  COUNT(DISTINCT ma.household_key) FILTER (WHERE ma.is_active = TRUE) AS active_households,
  MAX(ma.last_seen_at) AS last_active_at,
  SUM(ma.actions_count) AS total_actions
FROM dim_user u
LEFT JOIN fact_member_activity ma ON u.user_key = ma.user_key
GROUP BY u.user_id, u.user_email;

CREATE UNIQUE INDEX idx_mv_user_id ON mv_user_household_summary(user_id);

COMMENT ON MATERIALIZED VIEW mv_user_household_summary IS 'User household participation summary';

-- ============================================================================
-- DATA QUALITY CONSTRAINTS
-- ============================================================================

-- Ensure referential integrity
ALTER TABLE fact_household_events ADD CONSTRAINT fk_events_household
  FOREIGN KEY (household_key) REFERENCES dim_household(household_key) ON DELETE CASCADE;

ALTER TABLE fact_household_events ADD CONSTRAINT fk_events_user
  FOREIGN KEY (user_key) REFERENCES dim_user(user_key) ON DELETE CASCADE;

ALTER TABLE fact_join_requests ADD CONSTRAINT fk_requests_household
  FOREIGN KEY (household_key) REFERENCES dim_household(household_key) ON DELETE CASCADE;

-- ============================================================================
-- REFRESH FUNCTIONS
-- ============================================================================

-- Function: Refresh materialized views
CREATE OR REPLACE FUNCTION refresh_household_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_household_current_state;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_household_summary;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_household_analytics IS 'Refresh all materialized views (run hourly)';

-- ============================================================================
-- ANALYTICS HELPER FUNCTIONS
-- ============================================================================

-- Function: Calculate household health score
CREATE OR REPLACE FUNCTION calculate_household_health_score(p_household_key INT)
RETURNS INT AS $$
DECLARE
  v_score INT := 0;
  v_member_count INT;
  v_activity_count INT;
  v_approval_rate DECIMAL;
BEGIN
  -- Score based on member count (0-40 points)
  SELECT active_member_count INTO v_member_count
  FROM agg_household_metrics_daily
  WHERE household_key = p_household_key
  ORDER BY date_key DESC
  LIMIT 1;

  v_score := v_score + LEAST(v_member_count * 10, 40);

  -- Score based on recent activity (0-30 points)
  SELECT SUM(total_events) INTO v_activity_count
  FROM agg_household_metrics_daily
  WHERE household_key = p_household_key
    AND date_key >= (SELECT date_id FROM dim_date WHERE date = CURRENT_DATE - INTERVAL '7 days')
  ORDER BY date_key DESC;

  v_score := v_score + LEAST(v_activity_count / 10, 30);

  -- Score based on join approval rate (0-30 points)
  SELECT
    CASE
      WHEN (join_requests_approved + join_requests_rejected) > 0
      THEN (join_requests_approved::DECIMAL / (join_requests_approved + join_requests_rejected)) * 30
      ELSE 15
    END INTO v_approval_rate
  FROM agg_household_metrics_daily
  WHERE household_key = p_household_key
  ORDER BY date_key DESC
  LIMIT 7;

  v_score := v_score + COALESCE(v_approval_rate, 15);

  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_household_health_score IS 'Calculate health score (0-100) for a household';

-- ============================================================================
-- SAMPLE DATA POPULATION (for development/testing)
-- ============================================================================

-- Populate dim_date for 2 years (2025-2026)
INSERT INTO dim_date (date_id, date, year, quarter, month, week, day_of_week, day_of_month, day_of_year, is_weekend, month_name, day_name)
SELECT
  TO_CHAR(d, 'YYYYMMDD')::INT,
  d::DATE,
  EXTRACT(YEAR FROM d)::INT,
  EXTRACT(QUARTER FROM d)::INT,
  EXTRACT(MONTH FROM d)::INT,
  EXTRACT(WEEK FROM d)::INT,
  EXTRACT(DOW FROM d)::INT,
  EXTRACT(DAY FROM d)::INT,
  EXTRACT(DOY FROM d)::INT,
  EXTRACT(DOW FROM d) IN (0, 6),
  TO_CHAR(d, 'Month'),
  TO_CHAR(d, 'Day')
FROM generate_series('2025-01-01'::DATE, '2026-12-31'::DATE, '1 day'::INTERVAL) AS d
ON CONFLICT (date_id) DO NOTHING;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agg_daily_household_date ON agg_household_metrics_daily(household_key, date_key DESC);
CREATE INDEX IF NOT EXISTS idx_fact_events_household_time ON fact_household_events(household_key, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fact_requests_household_status ON fact_join_requests(household_key, status, requested_at DESC);

-- ============================================================================
-- GRANTS (adjust based on your security model)
-- ============================================================================

-- Grant read-only access to analytics role
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_role;
-- GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO analytics_role;

-- Grant read-write access to ETL role
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO etl_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO etl_role;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description)
VALUES (1, 'Initial household analytics warehouse schema')
ON CONFLICT (version) DO NOTHING;
