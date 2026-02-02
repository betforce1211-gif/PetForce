-- Data Quality Checks for Household Analytics Data
-- Purpose: Validate data integrity and completeness
-- Run: Daily after ETL pipeline

-- ============================================================================
-- DIMENSION TABLE CHECKS
-- ============================================================================

-- Check 1: No NULL household IDs in dimension
SELECT
    'DIM_HOUSEHOLD_NULL_ID' AS check_name,
    'CRITICAL' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM dim_household
WHERE household_id IS NULL;

-- Check 2: No NULL user IDs in dimension
SELECT
    'DIM_USER_NULL_ID' AS check_name,
    'CRITICAL' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM dim_user
WHERE user_id IS NULL;

-- Check 3: Unique current household records (SCD Type 2 integrity)
SELECT
    'DIM_HOUSEHOLD_SCD_INTEGRITY' AS check_name,
    'CRITICAL' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
    SELECT household_id, COUNT(*) AS current_count
    FROM dim_household
    WHERE is_current = TRUE
    GROUP BY household_id
    HAVING COUNT(*) > 1
) violations;

-- Check 4: SCD end dates are after start dates
SELECT
    'DIM_HOUSEHOLD_SCD_DATE_ORDER' AS check_name,
    'WARNING' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM dim_household
WHERE scd_end_date IS NOT NULL AND scd_end_date < scd_start_date;

-- Check 5: Date dimension completeness (should have dates for current year + next year)
SELECT
    'DIM_DATE_COMPLETENESS' AS check_name,
    'WARNING' AS severity,
    365 * 2 - COUNT(*) AS missing_days,
    CASE WHEN COUNT(*) >= 365 * 2 THEN 'PASS' ELSE 'FAIL' END AS status
FROM dim_date
WHERE year IN (EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE) + 1);

-- ============================================================================
-- FACT TABLE CHECKS
-- ============================================================================

-- Check 6: No orphan household events (referential integrity)
SELECT
    'FACT_EVENTS_ORPHAN_HOUSEHOLD' AS check_name,
    'CRITICAL' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM fact_household_events e
LEFT JOIN dim_household h ON e.household_key = h.household_key
WHERE h.household_key IS NULL;

-- Check 7: No orphan join requests
SELECT
    'FACT_REQUESTS_ORPHAN_HOUSEHOLD' AS check_name,
    'CRITICAL' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM fact_join_requests jr
LEFT JOIN dim_household h ON jr.household_key = h.household_key
WHERE h.household_key IS NULL;

-- Check 8: Join request status values are valid
SELECT
    'FACT_REQUESTS_INVALID_STATUS' AS check_name,
    'WARNING' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM fact_join_requests
WHERE status NOT IN ('pending', 'approved', 'rejected', 'expired');

-- Check 9: Response time is positive for responded requests
SELECT
    'FACT_REQUESTS_NEGATIVE_RESPONSE_TIME' AS check_name,
    'WARNING' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM fact_join_requests
WHERE responded_date_key IS NOT NULL AND time_to_respond_hours < 0;

-- Check 10: Event timestamps are reasonable (not in future, not too old)
SELECT
    'FACT_EVENTS_UNREASONABLE_TIMESTAMP' AS check_name,
    'WARNING' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM fact_household_events
WHERE event_timestamp > NOW() + INTERVAL '1 hour'
   OR event_timestamp < NOW() - INTERVAL '2 years';

-- ============================================================================
-- AGGREGATE TABLE CHECKS
-- ============================================================================

-- Check 11: Member count within realistic bounds (0-100)
SELECT
    'AGG_DAILY_INVALID_MEMBER_COUNT' AS check_name,
    'WARNING' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM agg_household_metrics_daily
WHERE active_member_count < 0 OR active_member_count > 100;

-- Check 12: Approval time is reasonable (<720 hours = 30 days)
SELECT
    'AGG_DAILY_UNREASONABLE_APPROVAL_TIME' AS check_name,
    'INFO' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM agg_household_metrics_daily
WHERE avg_approval_time_hours > 720;

-- Check 13: No negative counts in aggregates
SELECT
    'AGG_DAILY_NEGATIVE_COUNTS' AS check_name,
    'CRITICAL' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM agg_household_metrics_daily
WHERE active_member_count < 0
   OR join_requests_submitted < 0
   OR join_requests_approved < 0
   OR join_requests_rejected < 0
   OR total_events < 0;

-- ============================================================================
-- BUSINESS LOGIC CHECKS
-- ============================================================================

-- Check 14: Every household has exactly one current leader
SELECT
    'BUSINESS_MULTIPLE_LEADERS' AS check_name,
    'CRITICAL' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
    SELECT household_key, COUNT(*) AS leader_count
    FROM fact_member_activity ma
    JOIN dim_member_role r ON ma.role_key = r.role_key
    WHERE r.role_name = 'leader' AND ma.is_active = TRUE
    GROUP BY household_key
    HAVING COUNT(*) != 1
) violations;

-- Check 15: Temporary members don't exceed reasonable limits
SELECT
    'BUSINESS_EXCESSIVE_TEMP_MEMBERS' AS check_name,
    'WARNING' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM agg_household_metrics_daily
WHERE temporary_member_count > active_member_count;  -- More temp than regular members

-- Check 16: Join approval rate is within reasonable bounds (0-100%)
SELECT
    'BUSINESS_INVALID_APPROVAL_RATE' AS check_name,
    'INFO' AS severity,
    COUNT(*) AS failure_count,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM agg_join_funnel_daily
WHERE approval_rate_pct < 0 OR approval_rate_pct > 100;

-- ============================================================================
-- COMPLETENESS CHECKS
-- ============================================================================

-- Check 17: Daily aggregates are up-to-date (within 2 days)
SELECT
    'COMPLETENESS_DAILY_AGG_STALENESS' AS check_name,
    'WARNING' AS severity,
    EXTRACT(DAY FROM (CURRENT_DATE - MAX(d.date))) AS days_behind,
    CASE
        WHEN EXTRACT(DAY FROM (CURRENT_DATE - MAX(d.date))) <= 2 THEN 'PASS'
        ELSE 'FAIL'
    END AS status
FROM agg_household_metrics_daily a
JOIN dim_date d ON a.date_key = d.date_id;

-- Check 18: No gaps in daily aggregates for active households
SELECT
    'COMPLETENESS_DAILY_AGG_GAPS' AS check_name,
    'INFO' AS severity,
    COUNT(*) AS missing_days,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END AS status
FROM (
    SELECT h.household_key, d.date
    FROM dim_household h
    CROSS JOIN dim_date d
    WHERE h.is_current = TRUE
      AND d.date >= h.created_at::DATE
      AND d.date < CURRENT_DATE
      AND d.date >= CURRENT_DATE - INTERVAL '30 days'
    EXCEPT
    SELECT household_key, d.date
    FROM agg_household_metrics_daily a
    JOIN dim_date d ON a.date_key = d.date_id
) missing_aggregates;

-- Check 19: User dimension has all users from fact tables
SELECT
    'COMPLETENESS_USER_DIMENSION' AS check_name,
    'WARNING' AS severity,
    COUNT(DISTINCT e.user_key) AS missing_users,
    CASE WHEN COUNT(DISTINCT e.user_key) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM fact_household_events e
LEFT JOIN dim_user u ON e.user_key = u.user_key
WHERE u.user_key IS NULL;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

-- Generate summary report (run this last)
SELECT
    CURRENT_TIMESTAMP AS check_run_at,
    COUNT(*) AS total_checks,
    SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) AS passed,
    SUM(CASE WHEN status = 'FAIL' THEN 1 ELSE 0 END) AS failed,
    SUM(CASE WHEN status = 'WARNING' THEN 1 ELSE 0 END) AS warnings,
    ROUND(100.0 * SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) / COUNT(*), 2) AS pass_rate_pct
FROM (
    -- Union all check results (abbreviated for example)
    SELECT 'PASS' AS status
    UNION ALL SELECT 'FAIL'
) all_checks;

-- ============================================================================
-- AUTOMATED ALERTING
-- ============================================================================

-- Critical failures should trigger immediate alerts
DO $$
DECLARE
    critical_failures INT;
BEGIN
    SELECT COUNT(*) INTO critical_failures
    FROM (
        -- Re-run all CRITICAL checks here
        SELECT COUNT(*) FROM dim_household WHERE household_id IS NULL
        UNION ALL
        SELECT COUNT(*) FROM dim_user WHERE user_id IS NULL
        -- etc.
    ) checks
    WHERE count > 0;

    IF critical_failures > 0 THEN
        RAISE WARNING 'CRITICAL: % data quality checks failed!', critical_failures;
        -- In production, this would trigger PagerDuty/Slack alert
    END IF;
END $$;
