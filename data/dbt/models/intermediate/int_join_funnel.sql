-- Intermediate: Join request funnel metrics
-- Purpose: Calculate conversion rates and response times per household

{{
    config(
        materialized='table',
        tags=['intermediate', 'household', 'funnel']
    )
}}

WITH requests AS (
    SELECT * FROM {{ ref('stg_join_requests') }}
),

funnel_metrics AS (
    SELECT
        household_id,
        COUNT(*) AS total_requests,
        SUM(CASE WHEN is_approved THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN is_rejected THEN 1 ELSE 0 END) AS rejected_count,
        SUM(CASE WHEN is_pending THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN is_expired THEN 1 ELSE 0 END) AS expired_count,
        -- Response time metrics (only for responded requests)
        AVG(response_time_hours) FILTER (WHERE response_time_hours IS NOT NULL) AS avg_response_time_hours,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_hours) FILTER (WHERE response_time_hours IS NOT NULL) AS median_response_time_hours,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_hours) FILTER (WHERE response_time_hours IS NOT NULL) AS p95_response_time_hours,
        MIN(response_time_hours) FILTER (WHERE response_time_hours IS NOT NULL) AS min_response_time_hours,
        MAX(response_time_hours) FILTER (WHERE response_time_hours IS NOT NULL) AS max_response_time_hours

    FROM requests
    GROUP BY household_id
),

with_conversion_rates AS (
    SELECT
        *,
        -- Conversion rates (as percentages)
        ROUND(100.0 * approved_count / NULLIF(total_requests, 0), 2) AS approval_rate_pct,
        ROUND(100.0 * rejected_count / NULLIF(total_requests, 0), 2) AS rejection_rate_pct,
        ROUND(100.0 * pending_count / NULLIF(total_requests, 0), 2) AS pending_rate_pct,
        ROUND(100.0 * expired_count / NULLIF(total_requests, 0), 2) AS expiration_rate_pct,
        -- Funnel health score (0-100)
        CASE
            WHEN total_requests = 0 THEN NULL
            ELSE LEAST(
                ROUND(
                    (approved_count::DECIMAL / total_requests) * 60 +  -- 60% weight on approvals
                    (1 - (expired_count::DECIMAL / NULLIF(total_requests, 0))) * 20 +  -- 20% weight on low expiration
                    CASE WHEN avg_response_time_hours <= 24 THEN 20 ELSE 10 END,  -- 20% weight on fast response
                    2
                ),
                100
            )
        END AS funnel_health_score

    FROM funnel_metrics
)

SELECT * FROM with_conversion_rates
