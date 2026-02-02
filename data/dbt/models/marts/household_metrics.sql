-- Mart: Comprehensive household health metrics
-- Purpose: Production-ready household analytics dashboard

{{
    config(
        materialized='table',
        tags=['mart', 'household', 'dashboard']
    )
}}

WITH households AS (
    SELECT * FROM {{ ref('stg_households') }}
),

members AS (
    SELECT
        household_id,
        COUNT(*) FILTER (WHERE is_active = TRUE) AS active_member_count,
        COUNT(*) FILTER (WHERE is_active = TRUE AND is_temporary = TRUE) AS temp_member_count,
        COUNT(*) FILTER (WHERE is_active = TRUE AND role = 'leader') AS leader_count,
        MIN(joined_at) FILTER (WHERE is_active = TRUE) AS oldest_member_join_date,
        MAX(joined_at) FILTER (WHERE is_active = TRUE) AS newest_member_join_date,
        AVG(tenure_days) FILTER (WHERE is_active = TRUE) AS avg_member_tenure_days,
        -- Member churn
        COUNT(*) FILTER (WHERE removed_at IS NOT NULL) AS total_members_removed,
        COUNT(*) AS total_members_ever

    FROM {{ ref('stg_household_members') }}
    GROUP BY household_id
),

funnel AS (
    SELECT * FROM {{ ref('int_join_funnel') }}
),

final AS (
    SELECT
        h.household_id,
        h.household_name,
        h.household_description,
        h.leader_id,
        h.created_at AS household_created_at,
        h.updated_at AS household_updated_at,

        -- Member metrics
        COALESCE(m.active_member_count, 0) AS active_members,
        COALESCE(m.temp_member_count, 0) AS temporary_members,
        COALESCE(m.leader_count, 0) AS leader_count,
        m.oldest_member_join_date,
        m.newest_member_join_date,
        ROUND(COALESCE(m.avg_member_tenure_days, 0), 1) AS avg_member_tenure_days,

        -- Churn metrics
        COALESCE(m.total_members_removed, 0) AS total_members_removed,
        COALESCE(m.total_members_ever, 0) AS total_members_ever,
        CASE
            WHEN COALESCE(m.total_members_ever, 0) > 0
            THEN ROUND(100.0 * COALESCE(m.total_members_removed, 0) / m.total_members_ever, 2)
            ELSE 0
        END AS churn_rate_pct,

        -- Join funnel metrics
        COALESCE(f.total_requests, 0) AS total_join_requests,
        COALESCE(f.approved_count, 0) AS approved_requests,
        COALESCE(f.rejected_count, 0) AS rejected_requests,
        COALESCE(f.pending_count, 0) AS pending_requests,
        COALESCE(f.approval_rate_pct, 0) AS join_approval_rate,
        COALESCE(f.avg_response_time_hours, 0) AS avg_join_response_hours,
        COALESCE(f.funnel_health_score, 0) AS funnel_health_score,

        -- Household age
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - h.created_at)) / 86400 AS household_age_days,

        -- Household health score (0-100)
        CASE
            WHEN COALESCE(m.active_member_count, 0) = 0 THEN 0  -- No members = 0 score
            ELSE LEAST(
                ROUND(
                    -- 40 points: Member count (1-10 members)
                    LEAST(COALESCE(m.active_member_count, 0) * 4, 40) +
                    -- 30 points: Join approval rate
                    (COALESCE(f.approval_rate_pct, 0) * 0.3) +
                    -- 20 points: Low churn (inverse)
                    (20 * (1 - (COALESCE(m.total_members_removed, 0)::DECIMAL / NULLIF(COALESCE(m.total_members_ever, 1), 0)))) +
                    -- 10 points: Fast response time (<24h)
                    CASE WHEN COALESCE(f.avg_response_time_hours, 999) <= 24 THEN 10 ELSE 5 END,
                    2
                ),
                100
            )
        END AS household_health_score,

        -- Data quality flag
        h.has_quality_issues,

        -- Timestamps
        CURRENT_TIMESTAMP AS metric_calculated_at

    FROM households h
    LEFT JOIN members m ON h.household_id = m.household_id
    LEFT JOIN funnel f ON h.household_id = f.household_id
)

SELECT * FROM final
ORDER BY household_health_score DESC, active_members DESC
