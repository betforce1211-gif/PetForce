-- Staging: Household members
-- Purpose: Clean member data with role information

{{
    config(
        materialized='view',
        tags=['staging', 'household', 'members']
    )
}}

WITH source AS (
    SELECT * FROM {{ source('petforce', 'household_members') }}
),

renamed AS (
    SELECT
        household_id,
        user_id,
        role,
        status,
        is_temporary,
        joined_at,
        removed_at,
        -- Derived fields
        CASE
            WHEN status = 'active' AND removed_at IS NULL THEN TRUE
            ELSE FALSE
        END AS is_active,
        -- Calculate tenure
        CASE
            WHEN removed_at IS NOT NULL THEN
                EXTRACT(EPOCH FROM (removed_at - joined_at)) / 86400  -- Days
            ELSE
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - joined_at)) / 86400
        END AS tenure_days

    FROM source
)

SELECT * FROM renamed
