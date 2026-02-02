-- Staging: Join requests
-- Purpose: Clean join request data for funnel analysis

{{
    config(
        materialized='view',
        tags=['staging', 'household', 'funnel']
    )
}}

WITH source AS (
    SELECT * FROM {{ source('petforce', 'household_join_requests') }}
),

renamed AS (
    SELECT
        id AS request_id,
        household_id,
        user_id AS requester_id,
        status,
        requested_at,
        responded_at,
        responded_by AS responder_id,
        -- Calculate response time
        CASE
            WHEN responded_at IS NOT NULL THEN
                EXTRACT(EPOCH FROM (responded_at - requested_at)) / 3600  -- Hours
            ELSE NULL
        END AS response_time_hours,
        -- Status flags
        CASE WHEN status = 'approved' THEN TRUE ELSE FALSE END AS is_approved,
        CASE WHEN status = 'rejected' THEN TRUE ELSE FALSE END AS is_rejected,
        CASE WHEN status = 'pending' THEN TRUE ELSE FALSE END AS is_pending,
        CASE WHEN status = 'expired' THEN TRUE ELSE FALSE END AS is_expired

    FROM source
)

SELECT * FROM renamed
