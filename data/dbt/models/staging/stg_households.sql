-- Staging: Raw household data
-- Purpose: Clean and standardize household data from source

{{
    config(
        materialized='view',
        tags=['staging', 'household']
    )
}}

WITH source AS (
    SELECT * FROM {{ source('petforce', 'households') }}
),

renamed AS (
    SELECT
        id AS household_id,
        name AS household_name,
        description AS household_description,
        invite_code,
        invite_code_expires_at,
        leader_id,
        created_at,
        updated_at,
        -- Data quality flags
        CASE
            WHEN name IS NULL OR TRIM(name) = '' THEN TRUE
            ELSE FALSE
        END AS has_quality_issues

    FROM source
    WHERE deleted_at IS NULL  -- Exclude soft-deleted records
)

SELECT * FROM renamed
