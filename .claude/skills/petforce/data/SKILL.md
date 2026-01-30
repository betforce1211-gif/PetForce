# Data Engineering Best Practices for PetForce

## Data Quality Rules

### Required Checks
```
COMPLETENESS:
□ Row count vs source
□ Not null on required fields
□ All expected partitions present

UNIQUENESS:
□ Primary key unique
□ No duplicate business keys
□ Deduplication applied

VALIDITY:
□ Values in expected ranges
□ Dates are valid
□ Enums have valid values

ACCURACY:
□ Totals match source
□ Calculations are correct
□ Referential integrity
```

### Freshness Thresholds
```
REAL-TIME:     < 5 minutes
NEAR REAL-TIME: < 1 hour
DAILY:         < 24 hours
WEEKLY:        < 7 days
```

## Data Pipeline Checklist

### Pipeline Design & Idempotency
- [ ] Pipeline designed for idempotency (safe to re-run)
- [ ] Incremental processing implemented where possible
- [ ] Staging layer created before marts
- [ ] Data lineage documented (source → staging → mart)

### Data Quality & Testing
- [ ] Data quality tests added to every model
- [ ] Not null tests on primary keys
- [ ] Uniqueness tests on primary keys
- [ ] Relationship tests for foreign keys
- [ ] Accepted values tests for enums/status fields

### Documentation & Naming
- [ ] Consistent naming conventions used (stg_, fct_, dim_, mart_)
- [ ] Column descriptions documented
- [ ] Business logic documented in model
- [ ] Grain clearly defined (one row per...)

### Performance & Optimization
- [ ] Large tables partitioned appropriately
- [ ] Clustering keys defined for warehouse optimization
- [ ] Query patterns optimized (no SELECT *)
- [ ] Backfill strategy documented

### Monitoring & Freshness
- [ ] Freshness checks configured
- [ ] Row count monitoring enabled
- [ ] Schedule and SLA defined
- [ ] Alert thresholds set for failures

### Schema Design
- [ ] Schema optimized for Ana's query patterns
- [ ] Pre-aggregation considered where beneficial
- [ ] Version control applied to all pipeline code

## dbt Best Practices

### Model Naming
```
LAYER PREFIX:
• raw_     → Raw source data (bronze)
• stg_     → Staging models (silver)
• int_     → Intermediate models
• fct_     → Fact tables (gold)
• dim_     → Dimension tables (gold)
• mart_    → Business-specific marts
• rpt_     → Report tables

EXAMPLES:
• stg_stripe__payments
• int_orders__enriched
• fct_orders
• dim_customers
• mart_marketing__campaigns
```

### Model Materialization
```yaml
# By layer
staging:     materialized: view
intermediate: materialized: ephemeral
marts:       materialized: table

# When to use incremental
incremental:
  - Large fact tables (>1M rows)
  - Append-only data
  - Time-series data
  - When full refresh is too slow
```

### Testing Strategy
```yaml
# Minimum tests for every model
- not_null on primary key
- unique on primary key
- not_null on required foreign keys
- relationships for foreign keys
- accepted_values for enums/status

# Additional tests for marts
- row_count anomaly detection
- freshness checks
- custom business logic tests
```

## Data Warehouse Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                  DATA WAREHOUSE LAYERS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LAYER          PURPOSE                    NAMING CONVENTION    │
│  ─────          ───────                    ─────────────────    │
│                                                                  │
│  📥 RAW         Source data as-is          raw_<source>_<table> │
│                 No transformations         raw_stripe_charges   │
│                 Append-only / CDC          raw_salesforce_leads │
│                                                                  │
│  🔧 STAGING     Light transformations      stg_<source>_<table> │
│                 Deduplication              stg_stripe_charges   │
│                 Type casting               stg_salesforce_leads │
│                 Column renaming                                  │
│                                                                  │
│  🔨 INTERMEDIATE Business logic            int_<entity>_<verb>  │
│                 Joins across sources       int_users_enriched   │
│                 Complex calculations       int_orders_with_items│
│                                                                  │
│  📊 MARTS       Ready for analytics        <domain>_<entity>    │
│                 Fact & dimension tables    sales_orders         │
│                 Aggregations               marketing_campaigns  │
│                 Business metrics           finance_revenue      │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  EXAMPLE FLOW:                                                  │
│                                                                  │
│  raw_stripe_charges                                             │
│         │                                                        │
│         ▼                                                        │
│  stg_stripe_charges  (dedupe, cast types, rename cols)          │
│         │                                                        │
│         ▼                                                        │
│  int_payments_enriched  (join with users, add calculations)     │
│         │                                                        │
│         ▼                                                        │
│  finance_payments  (final fact table for Ana's dashboards)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Schema Templates

### Staging Model Template

```sql
-- =============================================================================
-- Buck's dbt Staging Model Template
-- =============================================================================
--
-- Staging models are the SILVER layer:
-- • Clean and standardize raw data
-- • No business logic yet
-- • One-to-one with source tables
-- • Materialized as views (lightweight)
--
-- Naming: stg_<source>__<table>
-- Example: stg_stripe__charges
-- =============================================================================

{{
  config(
    materialized='view',
    schema='staging'
  )
}}

with source as (
    -- Reference the raw source table
    select * from {{ source('{{SOURCE_NAME}}', '{{TABLE_NAME}}') }}
),

renamed as (
    select
        -- PRIMARY KEY
        id as {{TABLE_NAME}}_id,

        -- FOREIGN KEYS
        -- customer_id,
        -- product_id,

        -- STRINGS (Trim whitespace, lowercase where appropriate)
        -- trim(name) as name,
        -- lower(email) as email,

        -- NUMERICS (Convert cents to dollars, handle nulls)
        -- coalesce(amount_cents, 0) / 100.0 as amount,

        -- DATES & TIMESTAMPS
        -- cast(created_at as timestamp) as created_at,

        -- METADATA
        _airbyte_extracted_at as _extracted_at,
        _airbyte_loaded_at as _loaded_at

    from source

    -- BASIC FILTERING (Remove obviously bad records)
    where id is not null
)

select * from renamed
```

### Fact Model Template

```sql
-- =============================================================================
-- Buck's dbt Fact Model Template
-- =============================================================================
--
-- Fact models are the GOLD layer:
-- • Business-ready data
-- • Contains measures (quantities, amounts)
-- • References dimension tables
-- • Often incremental for large tables
--
-- Naming: fct_<business_process>
-- Example: fct_orders, fct_payments, fct_sessions
-- =============================================================================

{{
  config(
    materialized='incremental',
    unique_key='{{TABLE_NAME}}_key',
    schema='marts',

    -- Partitioning (BigQuery)
    partition_by={
      "field": "created_at",
      "data_type": "timestamp",
      "granularity": "day"
    },

    -- Clustering for query performance
    cluster_by=['customer_id', 'created_at'],

    -- Incremental strategy
    incremental_strategy='merge',

    -- Tags for selective runs
    tags=['daily', 'core']
  )
}}

-- Import staging data
with staging_data as (
    select * from {{ ref('stg_{{SOURCE_NAME}}__{{TABLE_NAME}}') }}

    {% if is_incremental() %}
    -- Only process new/updated records
    where updated_at > (select max(updated_at) from {{ this }})
    {% endif %}
),

-- Reference dimension tables
dim_customers as (
    select * from {{ ref('dim_customers') }}
),

-- Enrich with business logic
enriched as (
    select
        s.*,
        c.customer_segment,
        c.customer_tier
    from staging_data s
    left join dim_customers c on s.customer_id = c.customer_id
),

-- Calculate derived measures
final as (
    select
        -- Surrogate key
        {{ dbt_utils.generate_surrogate_key(['{{TABLE_NAME}}_id']) }} as {{TABLE_NAME}}_key,

        -- Natural key
        {{TABLE_NAME}}_id,

        -- Foreign keys
        customer_id,

        -- Measures
        quantity,
        unit_price,
        quantity * unit_price as gross_amount,

        -- Timestamps
        created_at,

        -- Metadata
        current_timestamp() as dbt_updated_at

    from enriched
)

select * from final
```

## Warehouse Optimization

### Snowflake
```sql
-- Clustering for large tables
ALTER TABLE fct_orders
CLUSTER BY (ordered_at, customer_id);

-- Partition by date
CREATE TABLE fct_orders (...)
PARTITION BY (DATE(ordered_at));
```

### BigQuery
```sql
-- Partition and cluster
CREATE TABLE fct_orders
PARTITION BY DATE(ordered_at)
CLUSTER BY customer_id, product_id
AS SELECT * FROM staging.orders;
```

### Query Patterns
```sql
-- Always filter on partition key
WHERE ordered_at >= '2024-01-01'
  AND ordered_at < '2024-02-01'

-- Avoid SELECT *
SELECT order_id, customer_id, amount
FROM fct_orders

-- Filter early in CTEs
WITH recent_orders AS (
  SELECT * FROM fct_orders
  WHERE ordered_at >= CURRENT_DATE - 30
)
```

## Privacy & Security

### PII Handling
- Encrypt PII in raw layer
- Implement column-level masking in marts
- Apply row-level security by team
- Audit all query access to sensitive data
- Define and enforce data retention policies

### Best Practices
- Never log PII
- Hash sensitive identifiers where possible
- Use secure views for PII columns
- Implement least privilege access
- Monitor for unusual query patterns

## Core Directives

### Always Do
1. Design for idempotency (safe to re-run)
2. Implement incremental processing where possible
3. Add data quality tests to every model
4. Document column descriptions and business logic
5. Use consistent naming conventions
6. Partition large tables appropriately
7. Monitor freshness and row counts
8. Create staging layer before marts
9. Version control all pipeline code
10. Design schemas for Ana's query patterns

### Never Do
1. Load data without validation
2. Skip the staging layer
3. Use `SELECT *` in production models
4. Hard-code dates or credentials
5. Create circular dependencies
6. Ignore data quality failures
7. Build models without tests
8. Over-engineer for edge cases
9. Forget about backfill strategy
10. Leave undocumented columns
