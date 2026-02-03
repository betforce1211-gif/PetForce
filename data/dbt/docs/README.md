# Data Engineering Guide

**Owner**: Buck (Data Engineering Agent)
**Last Updated**: 2026-02-03

This guide provides comprehensive data engineering practices for PetForce. Buck ensures our data is reliable, accessible, and actionable.

---

## Table of Contents

1. [Data Engineering Philosophy](#data-engineering-philosophy)
2. [Data Pipeline Architecture](#data-pipeline-architecture)
3. [dbt Best Practices](#dbt-best-practices)
4. [Data Quality](#data-quality)
5. [Analytics Data Modeling](#analytics-data-modeling)
6. [Data Orchestration](#data-orchestration)
7. [Data Governance](#data-governance)
8. [Performance Optimization](#performance-optimization)
9. [Data Engineering Checklist](#data-engineering-checklist)

---

## Data Engineering Philosophy

### Core Principles

1. **Data Quality Over Speed** - Correct data is more valuable than fast data
2. **Build for the Next Data Engineer** - Clear, documented, testable code
3. **Test Everything** - Schema tests, data tests, business logic tests
4. **Modularity** - Small, reusable models that do one thing well
5. **Version Control** - All transformations in Git, no manual SQL
6. **Idempotency** - Run the same pipeline twice, get the same result
7. **Observability** - Monitor pipeline runs, data freshness, and quality

### The Analytics Engineering Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Sources                            │
│  (PostgreSQL, External APIs, CSV uploads, Event Streams)    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Ingestion Layer (Fivetran/Airbyte)         │
│              Extract → Load into Data Warehouse             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Warehouse (Snowflake/BigQuery)        │
│                    Raw Data (Bronze Layer)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Transformation Layer (dbt)                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Staging (Silver Layer)                             │   │
│  │  - Clean raw data                                   │   │
│  │  - Type casting                                     │   │
│  │  - Deduplication                                    │   │
│  │  - Basic renaming                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Intermediate (Silver Layer)                        │   │
│  │  - Business logic                                   │   │
│  │  - Joins                                            │   │
│  │  - Aggregations                                     │   │
│  │  - Complex transformations                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Marts (Gold Layer)                                 │   │
│  │  - Denormalized tables for reporting                │   │
│  │  - Business-friendly names                          │   │
│  │  - Optimized for BI tools                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Analytics & BI Layer (Looker/Metabase)         │
│              Dashboards, Reports, Ad-hoc Queries            │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Pipeline Architecture

### The Medallion Architecture (Bronze → Silver → Gold)

**Bronze Layer (Raw)**:

- Exact copy of source data
- No transformations (preserves auditability)
- Append-only (never delete)
- Includes metadata (ingested_at, source_file)

**Silver Layer (Staging + Intermediate)**:

- Cleaned and validated data
- Type casting, deduplication
- Business logic applied
- Joined with related tables

**Gold Layer (Marts)**:

- Business-friendly aggregated views
- Denormalized for query performance
- Ready for BI tools and analysts

### Example Pipeline: Household Activity

```sql
-- BRONZE: Raw data from production database
-- Location: raw/petforce/households.sql
SELECT
  id,
  name,
  created_at,
  updated_at,
  invite_code,
  owner_user_id,
  _ingested_at,
  _source_file
FROM {{ source('petforce', 'households') }}

-- SILVER: Staging - Clean and standardize
-- Location: staging/stg_households.sql
WITH source AS (
  SELECT * FROM {{ source('petforce', 'households') }}
),

cleaned AS (
  SELECT
    id AS household_id,
    TRIM(name) AS household_name,
    UPPER(invite_code) AS invite_code,
    owner_user_id,
    created_at AS household_created_at,
    updated_at AS household_updated_at,
    _ingested_at
  FROM source
  WHERE deleted_at IS NULL
)

SELECT * FROM cleaned

-- SILVER: Intermediate - Add business logic
-- Location: intermediate/int_households_enriched.sql
WITH households AS (
  SELECT * FROM {{ ref('stg_households') }}
),

members AS (
  SELECT
    household_id,
    COUNT(*) AS member_count,
    MAX(joined_at) AS last_member_joined_at
  FROM {{ ref('stg_household_members') }}
  GROUP BY household_id
),

pets AS (
  SELECT
    household_id,
    COUNT(*) AS pet_count,
    COUNT(CASE WHEN species = 'dog' THEN 1 END) AS dog_count,
    COUNT(CASE WHEN species = 'cat' THEN 1 END) AS cat_count
  FROM {{ ref('stg_pets') }}
  GROUP BY household_id
),

tasks AS (
  SELECT
    household_id,
    COUNT(*) AS total_tasks,
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) AS completed_tasks
  FROM {{ ref('stg_tasks') }}
  GROUP BY household_id
)

SELECT
  h.household_id,
  h.household_name,
  h.invite_code,
  h.owner_user_id,
  h.household_created_at,
  COALESCE(m.member_count, 0) AS member_count,
  COALESCE(p.pet_count, 0) AS pet_count,
  COALESCE(p.dog_count, 0) AS dog_count,
  COALESCE(p.cat_count, 0) AS cat_count,
  COALESCE(t.total_tasks, 0) AS total_tasks,
  COALESCE(t.completed_tasks, 0) AS completed_tasks,
  CASE
    WHEN t.total_tasks > 0
    THEN ROUND(100.0 * t.completed_tasks / t.total_tasks, 2)
    ELSE 0
  END AS task_completion_rate
FROM households h
LEFT JOIN members m ON h.household_id = m.household_id
LEFT JOIN pets p ON h.household_id = p.household_id
LEFT JOIN tasks t ON h.household_id = t.household_id

-- GOLD: Mart - Business-ready fact table
-- Location: marts/fct_household_activity.sql
WITH households AS (
  SELECT * FROM {{ ref('int_households_enriched') }}
),

activity_metrics AS (
  SELECT
    household_id,
    DATE_TRUNC('day', activity_timestamp) AS activity_date,
    COUNT(*) AS daily_activities,
    COUNT(DISTINCT user_id) AS active_users
  FROM {{ ref('stg_activity_logs') }}
  WHERE activity_timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY household_id, DATE_TRUNC('day', activity_timestamp)
),

final AS (
  SELECT
    h.household_id,
    h.household_name,
    h.member_count,
    h.pet_count,
    h.dog_count,
    h.cat_count,
    h.total_tasks,
    h.completed_tasks,
    h.task_completion_rate,
    DATE_DIFF('day', h.household_created_at, CURRENT_TIMESTAMP) AS household_age_days,
    COALESCE(SUM(a.daily_activities), 0) AS activities_last_30_days,
    COALESCE(AVG(a.active_users), 0) AS avg_daily_active_users,
    CASE
      WHEN COALESCE(SUM(a.daily_activities), 0) = 0 THEN 'Inactive'
      WHEN COALESCE(SUM(a.daily_activities), 0) < 10 THEN 'Low Activity'
      WHEN COALESCE(SUM(a.daily_activities), 0) < 50 THEN 'Medium Activity'
      ELSE 'High Activity'
    END AS activity_level
  FROM households h
  LEFT JOIN activity_metrics a ON h.household_id = a.household_id
  GROUP BY
    h.household_id,
    h.household_name,
    h.member_count,
    h.pet_count,
    h.dog_count,
    h.cat_count,
    h.total_tasks,
    h.completed_tasks,
    h.task_completion_rate,
    h.household_created_at
)

SELECT * FROM final
```

### Directory Structure

```
data/dbt/
├── models/
│   ├── staging/           # Silver layer (stg_)
│   │   ├── _staging.yml   # Source definitions
│   │   ├── stg_households.sql
│   │   ├── stg_users.sql
│   │   ├── stg_pets.sql
│   │   ├── stg_tasks.sql
│   │   └── stg_activity_logs.sql
│   │
│   ├── intermediate/      # Silver layer (int_)
│   │   ├── int_households_enriched.sql
│   │   ├── int_user_engagement.sql
│   │   └── int_task_metrics.sql
│   │
│   └── marts/             # Gold layer (fct_, dim_)
│       ├── core/          # Core business entities
│       │   ├── fct_household_activity.sql
│       │   ├── dim_households.sql
│       │   └── dim_users.sql
│       │
│       ├── analytics/     # Analytics aggregations
│       │   ├── fct_daily_metrics.sql
│       │   └── fct_user_retention.sql
│       │
│       └── marketing/     # Marketing-specific views
│           ├── fct_user_acquisition.sql
│           └── fct_growth_metrics.sql
│
├── macros/                # Reusable SQL functions
│   ├── cents_to_dollars.sql
│   ├── generate_schema_name.sql
│   └── test_not_null_where.sql
│
├── tests/                 # Custom data tests
│   ├── assert_positive_revenue.sql
│   └── assert_valid_email.sql
│
├── snapshots/             # Type-2 slowly changing dimensions
│   └── snap_households.sql
│
├── seeds/                 # Static reference data (CSV)
│   ├── country_codes.csv
│   └── pet_species.csv
│
└── analyses/              # Ad-hoc analyses (not built)
    └── user_cohort_analysis.sql
```

---

## dbt Best Practices

### Model Naming Conventions

**Staging Models** (`stg_`):

- One model per source table
- Light transformations only (rename, cast, dedupe)
- Never join in staging
- Naming: `stg_<source>_<table>.sql`

```sql
-- stg_petforce_households.sql
SELECT
  id AS household_id,
  name AS household_name,
  created_at AS household_created_at
FROM {{ source('petforce', 'households') }}
```

**Intermediate Models** (`int_`):

- Business logic and joins
- Complex transformations
- Not exposed to end users
- Naming: `int_<entity>_<verb>.sql`

```sql
-- int_households_enriched.sql
-- int_users_with_activity.sql
```

**Fact Tables** (`fct_`):

- Event or transaction data
- Metrics and measures
- Many rows (millions+)
- Naming: `fct_<event_type>.sql`

```sql
-- fct_household_activity.sql
-- fct_task_completions.sql
-- fct_user_logins.sql
```

**Dimension Tables** (`dim_`):

- Descriptive attributes
- Fewer rows (thousands)
- Slowly changing dimensions
- Naming: `dim_<entity>.sql`

```sql
-- dim_households.sql
-- dim_users.sql
-- dim_pets.sql
```

### dbt Project Configuration

**dbt_project.yml**:

```yaml
name: "petforce"
version: "1.0.0"
config-version: 2

profile: "petforce"

model-paths: ["models"]
analysis-paths: ["analyses"]
test-paths: ["tests"]
seed-paths: ["seeds"]
macro-paths: ["macros"]
snapshot-paths: ["snapshots"]

target-path: "target"
clean-targets:
  - "target"
  - "dbt_packages"

models:
  petforce:
    # Staging models
    staging:
      +materialized: view
      +schema: staging
      +tags: ["staging"]

    # Intermediate models
    intermediate:
      +materialized: ephemeral # Not materialized, inlined in downstream queries
      +tags: ["intermediate"]

    # Marts
    marts:
      +materialized: table
      +schema: marts
      +tags: ["marts"]

      core:
        +tags: ["core"]

      analytics:
        +tags: ["analytics"]

      marketing:
        +tags: ["marketing"]

seeds:
  petforce:
    +schema: seeds
    +tags: ["seeds"]

snapshots:
  petforce:
    +schema: snapshots
    +tags: ["snapshots"]
    +target_schema: snapshots
```

### Materialization Strategies

**View** (staging models):

```sql
{{ config(materialized='view') }}

-- Pros: Always fresh, no storage cost
-- Cons: Slower queries, recomputed on every query
```

**Table** (marts):

```sql
{{ config(materialized='table') }}

-- Pros: Fast queries, pre-computed
-- Cons: Stale until next run, storage cost
```

**Incremental** (large fact tables):

```sql
{{ config(
  materialized='incremental',
  unique_key='household_id',
  on_schema_change='append_new_columns'
) }}

SELECT
  household_id,
  activity_timestamp,
  activity_type
FROM {{ source('petforce', 'activity_logs') }}

{% if is_incremental() %}
  WHERE activity_timestamp > (SELECT MAX(activity_timestamp) FROM {{ this }})
{% endif %}

-- Pros: Fast builds (only new data), efficient storage
-- Cons: More complex, requires unique_key and incremental logic
```

**Ephemeral** (intermediate models):

```sql
{{ config(materialized='ephemeral') }}

-- Pros: No storage, inlined in downstream queries
-- Cons: Recomputed in every downstream model
```

### CTEs Over Subqueries

**Bad** (subquery):

```sql
SELECT
  h.household_id,
  (SELECT COUNT(*) FROM pets WHERE household_id = h.household_id) AS pet_count
FROM households h
```

**Good** (CTE):

```sql
WITH households AS (
  SELECT * FROM {{ ref('stg_households') }}
),

pets AS (
  SELECT
    household_id,
    COUNT(*) AS pet_count
  FROM {{ ref('stg_pets') }}
  GROUP BY household_id
)

SELECT
  h.household_id,
  COALESCE(p.pet_count, 0) AS pet_count
FROM households h
LEFT JOIN pets p ON h.household_id = p.household_id
```

### Documentation

**models/staging/\_staging.yml**:

```yaml
version: 2

sources:
  - name: petforce
    description: PetForce production database
    database: petforce_production
    schema: public

    tables:
      - name: households
        description: Core household entity
        columns:
          - name: id
            description: Primary key
            tests:
              - unique
              - not_null

          - name: name
            description: Household display name
            tests:
              - not_null

          - name: invite_code
            description: Unique invite code for joining
            tests:
              - unique
              - not_null

models:
  - name: stg_households
    description: Staging model for households
    columns:
      - name: household_id
        description: Primary key
        tests:
          - unique
          - not_null

      - name: household_name
        description: Display name (trimmed and validated)
        tests:
          - not_null

      - name: invite_code
        description: Uppercase invite code
        tests:
          - unique
          - not_null
          - accepted_values:
              values: ["ALPHA", "BRAVO", "CHARLIE"] # Example
```

**Generate Docs**:

```bash
# Generate documentation site
dbt docs generate

# Serve documentation locally
dbt docs serve --port 8080

# Open http://localhost:8080
```

---

## Data Quality

### The dbt Testing Hierarchy

**1. Schema Tests** (built-in):

```yaml
models:
  - name: stg_households
    columns:
      - name: household_id
        tests:
          - unique
          - not_null

      - name: household_name
        tests:
          - not_null

      - name: invite_code
        tests:
          - unique
          - not_null
          - accepted_values:
              values: ["ACTIVE", "PENDING", "DISABLED"]

      - name: owner_user_id
        tests:
          - relationships:
              to: ref('stg_users')
              field: user_id
```

**2. Data Tests** (custom SQL):

```sql
-- tests/assert_positive_revenue.sql
SELECT
  household_id,
  SUM(revenue) AS total_revenue
FROM {{ ref('fct_household_revenue') }}
GROUP BY household_id
HAVING SUM(revenue) < 0
```

**3. dbt Expectations** (great_expectations integration):

```yaml
models:
  - name: fct_task_completions
    tests:
      - dbt_expectations.expect_table_row_count_to_be_between:
          min_value: 1000
          max_value: 1000000

      - dbt_expectations.expect_column_values_to_be_between:
          column_name: task_duration_minutes
          min_value: 0
          max_value: 1440 # 24 hours

      - dbt_expectations.expect_column_values_to_match_regex:
          column_name: email
          regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
```

### Data Freshness Checks

**sources.yml**:

```yaml
sources:
  - name: petforce
    freshness:
      warn_after: { count: 12, period: hour }
      error_after: { count: 24, period: hour }

    loaded_at_field: _ingested_at

    tables:
      - name: households
        freshness:
          warn_after: { count: 6, period: hour }
          error_after: { count: 12, period: hour }
```

**Check Freshness**:

```bash
dbt source freshness

# Output:
# 1 of 1 WARN freshness of petforce.households (12 hours old)
```

### Custom Macros for Testing

**macros/test_not_null_where.sql**:

```sql
{% macro test_not_null_where(model, column_name, where_clause) %}

SELECT COUNT(*) AS failures
FROM {{ model }}
WHERE {{ column_name }} IS NULL
  AND {{ where_clause }}

{% endmacro %}
```

**Usage**:

```yaml
models:
  - name: stg_tasks
    columns:
      - name: completed_at
        tests:
          - not_null_where:
              where_clause: "status = 'completed'"
```

### Data Quality Monitoring

**Set up alerts**:

```bash
# Run tests and fail if any test fails
dbt test

# Run specific tests
dbt test --select tag:critical

# Run tests and continue on failure
dbt test --warn-error
```

**Integrate with Airflow**:

```python
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'buck',
    'depends_on_past': False,
    'start_date': datetime(2026, 1, 1),
    'email': ['alerts@petforce.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'petforce_dbt_pipeline',
    default_args=default_args,
    schedule_interval='0 2 * * *',  # 2 AM daily
    catchup=False,
)

dbt_run = BashOperator(
    task_id='dbt_run',
    bash_command='cd /opt/airflow/dbt && dbt run --profiles-dir .',
    dag=dag,
)

dbt_test = BashOperator(
    task_id='dbt_test',
    bash_command='cd /opt/airflow/dbt && dbt test --profiles-dir .',
    dag=dag,
)

dbt_run >> dbt_test
```

---

## Analytics Data Modeling

### Dimensional Modeling (Star Schema)

**Fact Table** (fct_task_completions):

```sql
-- Many rows, narrow table, metrics and foreign keys
SELECT
  task_completion_id,        -- Surrogate key
  household_id,              -- Foreign key to dim_households
  user_id,                   -- Foreign key to dim_users
  pet_id,                    -- Foreign key to dim_pets
  task_type_id,              -- Foreign key to dim_task_types
  completion_date_id,        -- Foreign key to dim_date

  -- Metrics
  task_duration_minutes,
  quality_score,
  points_earned
FROM ...
```

**Dimension Table** (dim_households):

```sql
-- Fewer rows, wide table, descriptive attributes
SELECT
  household_id,              -- Primary key
  household_name,
  household_plan,            -- Free, Premium, Enterprise
  household_status,          -- Active, Suspended, Churned
  member_count,
  pet_count,
  created_at,
  first_task_completed_at,

  -- Slowly changing dimension (Type 2)
  effective_from,
  effective_to,
  is_current
FROM ...
```

**Query Performance** (star schema enables fast aggregations):

```sql
-- Fast query: Pre-joined dimension table
SELECT
  d.household_plan,
  COUNT(*) AS total_completions,
  AVG(f.task_duration_minutes) AS avg_duration
FROM fct_task_completions f
JOIN dim_households d ON f.household_id = d.household_id
WHERE d.is_current = TRUE
GROUP BY d.household_plan
```

### Date Dimension

**dim_date.sql**:

```sql
WITH date_spine AS (
  {{ dbt_utils.date_spine(
    datepart="day",
    start_date="cast('2020-01-01' as date)",
    end_date="cast('2030-12-31' as date)"
  ) }}
),

final AS (
  SELECT
    DATE(date_day) AS date_id,
    date_day,
    EXTRACT(YEAR FROM date_day) AS year,
    EXTRACT(MONTH FROM date_day) AS month,
    EXTRACT(DAY FROM date_day) AS day,
    EXTRACT(QUARTER FROM date_day) AS quarter,
    EXTRACT(DAYOFWEEK FROM date_day) AS day_of_week,
    EXTRACT(WEEK FROM date_day) AS week_of_year,
    FORMAT_DATE('%A', date_day) AS day_name,
    FORMAT_DATE('%B', date_day) AS month_name,
    CASE WHEN EXTRACT(DAYOFWEEK FROM date_day) IN (1, 7) THEN TRUE ELSE FALSE END AS is_weekend,
    CASE
      WHEN date_day IN (
        '2026-01-01',  -- New Year's Day
        '2026-07-04',  -- Independence Day
        '2026-12-25'   -- Christmas
      ) THEN TRUE
      ELSE FALSE
    END AS is_holiday
  FROM date_spine
)

SELECT * FROM final
```

### Slowly Changing Dimensions (Type 2)

**snapshots/snap_households.sql**:

```sql
{% snapshot snap_households %}

{{
  config(
    target_schema='snapshots',
    unique_key='household_id',
    strategy='timestamp',
    updated_at='updated_at',
  )
}}

SELECT * FROM {{ source('petforce', 'households') }}

{% endsnapshot %}
```

**What This Does**:

- Tracks historical changes to household records
- Each change creates a new row with `dbt_valid_from` and `dbt_valid_to`
- Can query "What did household X look like on date Y?"

**Query Historical Data**:

```sql
SELECT
  household_id,
  household_name,
  household_plan,
  dbt_valid_from,
  dbt_valid_to
FROM snapshots.snap_households
WHERE household_id = 'h_abc123'
ORDER BY dbt_valid_from DESC

-- Output:
-- household_id | household_name | household_plan | dbt_valid_from | dbt_valid_to
-- h_abc123     | Zeder House    | Enterprise     | 2026-02-01     | NULL (current)
-- h_abc123     | Zeder House    | Premium        | 2025-01-01     | 2026-02-01
-- h_abc123     | Zeder House    | Free           | 2024-01-01     | 2025-01-01
```

### Metric Definitions

**Create reusable metrics**:

**macros/metrics.sql**:

```sql
{% macro monthly_recurring_revenue() %}
  SUM(
    CASE
      WHEN subscription_plan = 'Free' THEN 0
      WHEN subscription_plan = 'Premium' THEN 9.99
      WHEN subscription_plan = 'Enterprise' THEN 49.99
      ELSE 0
    END
  )
{% endmacro %}

{% macro active_household_count() %}
  COUNT(DISTINCT CASE WHEN last_activity_date >= CURRENT_DATE - INTERVAL '30 days' THEN household_id END)
{% endmacro %}
```

**Use in models**:

```sql
-- marts/analytics/fct_monthly_metrics.sql
SELECT
  DATE_TRUNC('month', metric_date) AS month,
  {{ monthly_recurring_revenue() }} AS mrr,
  {{ active_household_count() }} AS active_households,
  {{ monthly_recurring_revenue() }} / NULLIF({{ active_household_count() }}, 0) AS arpu
FROM {{ ref('int_household_subscriptions') }}
GROUP BY DATE_TRUNC('month', metric_date)
```

---

## Data Orchestration

### Airflow DAG for dbt

**dags/dbt_petforce_pipeline.py**:

```python
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.providers.slack.operators.slack_webhook import SlackWebhookOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'buck',
    'depends_on_past': False,
    'start_date': datetime(2026, 1, 1),
    'email': ['buck@petforce.com'],
    'email_on_failure': True,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'petforce_dbt_daily',
    default_args=default_args,
    description='Daily dbt pipeline for PetForce analytics',
    schedule_interval='0 2 * * *',  # 2 AM daily
    catchup=False,
    tags=['dbt', 'analytics'],
)

# dbt deps (install packages)
dbt_deps = BashOperator(
    task_id='dbt_deps',
    bash_command='cd /opt/airflow/dbt/petforce && dbt deps',
    dag=dag,
)

# dbt seed (load CSV reference data)
dbt_seed = BashOperator(
    task_id='dbt_seed',
    bash_command='cd /opt/airflow/dbt/petforce && dbt seed',
    dag=dag,
)

# dbt snapshot (capture slowly changing dimensions)
dbt_snapshot = BashOperator(
    task_id='dbt_snapshot',
    bash_command='cd /opt/airflow/dbt/petforce && dbt snapshot',
    dag=dag,
)

# dbt run staging
dbt_run_staging = BashOperator(
    task_id='dbt_run_staging',
    bash_command='cd /opt/airflow/dbt/petforce && dbt run --models tag:staging',
    dag=dag,
)

# dbt test staging
dbt_test_staging = BashOperator(
    task_id='dbt_test_staging',
    bash_command='cd /opt/airflow/dbt/petforce && dbt test --models tag:staging',
    dag=dag,
)

# dbt run intermediate
dbt_run_intermediate = BashOperator(
    task_id='dbt_run_intermediate',
    bash_command='cd /opt/airflow/dbt/petforce && dbt run --models tag:intermediate',
    dag=dag,
)

# dbt run marts
dbt_run_marts = BashOperator(
    task_id='dbt_run_marts',
    bash_command='cd /opt/airflow/dbt/petforce && dbt run --models tag:marts',
    dag=dag,
)

# dbt test all
dbt_test_all = BashOperator(
    task_id='dbt_test_all',
    bash_command='cd /opt/airflow/dbt/petforce && dbt test',
    dag=dag,
)

# dbt source freshness
dbt_source_freshness = BashOperator(
    task_id='dbt_source_freshness',
    bash_command='cd /opt/airflow/dbt/petforce && dbt source freshness',
    dag=dag,
)

# Slack notification on success
slack_success = SlackWebhookOperator(
    task_id='slack_success',
    http_conn_id='slack_webhook',
    message='✅ dbt pipeline completed successfully',
    channel='#data-engineering',
    dag=dag,
    trigger_rule='all_success',
)

# Slack notification on failure
slack_failure = SlackWebhookOperator(
    task_id='slack_failure',
    http_conn_id='slack_webhook',
    message='❌ dbt pipeline failed',
    channel='#data-engineering',
    dag=dag,
    trigger_rule='one_failed',
)

# Define dependencies
dbt_deps >> dbt_seed >> dbt_snapshot
dbt_snapshot >> dbt_source_freshness
dbt_source_freshness >> dbt_run_staging >> dbt_test_staging
dbt_test_staging >> dbt_run_intermediate >> dbt_run_marts
dbt_run_marts >> dbt_test_all
dbt_test_all >> [slack_success, slack_failure]
```

### Incremental Processing Pattern

**models/marts/fct_daily_metrics.sql**:

```sql
{{
  config(
    materialized='incremental',
    unique_key='metric_date',
    on_schema_change='append_new_columns'
  )
}}

WITH daily_aggregations AS (
  SELECT
    DATE(activity_timestamp) AS metric_date,
    COUNT(DISTINCT household_id) AS active_households,
    COUNT(DISTINCT user_id) AS active_users,
    COUNT(*) AS total_activities
  FROM {{ ref('stg_activity_logs') }}

  {% if is_incremental() %}
    WHERE DATE(activity_timestamp) > (SELECT MAX(metric_date) FROM {{ this }})
  {% endif %}

  GROUP BY DATE(activity_timestamp)
)

SELECT * FROM daily_aggregations
```

**Performance Benefit**:

- First run: Process all historical data (slow)
- Subsequent runs: Only process new data since last run (fast)
- Example: Instead of processing 365 days of data daily, only process 1 day

---

## Data Governance

### Data Lineage

**dbt automatically tracks lineage**:

```bash
# Generate lineage graph
dbt docs generate

# View lineage in UI
dbt docs serve
```

**Lineage Example**:

```
source('petforce', 'households')
  └─> stg_households
       └─> int_households_enriched
            ├─> fct_household_activity
            └─> dim_households
```

### Data Catalog

**Describe every model**:

```yaml
models:
  - name: fct_household_activity
    description: |
      Daily household activity metrics.

      **Grain**: One row per household per day

      **Refresh**: Daily at 2 AM UTC

      **Owner**: Buck (Data Engineering)

      **Business Questions**:
      - How many households are active?
      - What is the average task completion rate?
      - Which households are at risk of churn?

    columns:
      - name: household_id
        description: Unique household identifier

      - name: activity_date
        description: Date of activity (YYYY-MM-DD)

      - name: task_completion_rate
        description: |
          Percentage of tasks completed vs total tasks.
          Formula: (completed_tasks / total_tasks) * 100
```

### PII and Privacy

**Tag sensitive columns**:

```yaml
models:
  - name: dim_users
    columns:
      - name: email
        description: User email address
        tags: ["pii"]
        meta:
          privacy_classification: "PII"
          retention_policy: "7 years"

      - name: phone_number
        description: User phone number
        tags: ["pii"]
        meta:
          privacy_classification: "PII"
          retention_policy: "7 years"
```

**Mask PII in non-production**:

```sql
-- macros/mask_pii.sql
{% macro mask_pii(column_name) %}
  CASE
    WHEN '{{ target.name }}' = 'prod' THEN {{ column_name }}
    ELSE '***MASKED***'
  END
{% endmacro %}
```

**Usage**:

```sql
SELECT
  user_id,
  {{ mask_pii('email') }} AS email,
  {{ mask_pii('phone_number') }} AS phone_number
FROM {{ ref('stg_users') }}
```

---

## Performance Optimization

### Query Optimization

**Partition Large Tables** (BigQuery example):

```sql
{{
  config(
    materialized='incremental',
    partition_by={
      "field": "activity_date",
      "data_type": "date",
      "granularity": "day"
    },
    cluster_by=["household_id", "user_id"]
  )
}}

SELECT
  household_id,
  user_id,
  activity_date,
  activity_type
FROM {{ ref('stg_activity_logs') }}
```

**Benefits**:

- Query only scans relevant partitions (faster, cheaper)
- Example: Query for last 7 days only scans 7 partitions, not entire table

**Cluster for Common Filters**:

```sql
{{
  config(
    cluster_by=["household_id", "activity_date"]
  )
}}
```

**Query**:

```sql
-- Fast (uses clustering)
SELECT * FROM fct_activity
WHERE household_id = 'h_abc123'
  AND activity_date >= '2026-01-01'

-- Slow (doesn't use clustering)
SELECT * FROM fct_activity
WHERE user_id = 'u_xyz789'
```

### Incremental Strategies

**Merge Strategy** (upsert):

```sql
{{
  config(
    materialized='incremental',
    unique_key='household_id',
    incremental_strategy='merge'
  )
}}

-- Updates existing rows, inserts new rows
```

**Append Strategy** (insert only):

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='append'
  )
}}

-- Only inserts, never updates (for immutable events)
```

**Delete+Insert Strategy**:

```sql
{{
  config(
    materialized='incremental',
    unique_key='activity_date',
    incremental_strategy='delete+insert'
  )
}}

-- Deletes rows with matching key, then inserts
-- Useful for daily aggregations where you want to replace entire day
```

---

## Data Engineering Checklist

Buck uses this checklist for every data pipeline:

### Before You Build

- [ ] Understand the business question
- [ ] Identify source data and freshness requirements
- [ ] Define grain (one row per what?)
- [ ] Sketch data flow (source → staging → intermediate → mart)
- [ ] Check for existing models you can reuse

### Model Development

- [ ] Follow naming conventions (stg*, int*, fct*, dim*)
- [ ] Use CTEs over subqueries
- [ ] Add model description and column descriptions
- [ ] Use proper materialization (view, table, incremental, ephemeral)
- [ ] Add tests (unique, not_null, relationships, accepted_values)
- [ ] Avoid `SELECT *` in final models

### Testing & Quality

- [ ] Run `dbt compile` (check SQL compiles)
- [ ] Run `dbt run --select <model>` (build model)
- [ ] Run `dbt test --select <model>` (run tests)
- [ ] Verify row counts are reasonable
- [ ] Spot-check data in BI tool or SQL editor
- [ ] Add custom data tests for business logic

### Documentation

- [ ] Add model description (what, why, grain, refresh)
- [ ] Add column descriptions
- [ ] Add metadata (owner, tags, lineage)
- [ ] Generate docs (`dbt docs generate`)
- [ ] Review lineage graph

### Deployment

- [ ] Test in dev environment
- [ ] Review SQL in PR
- [ ] Deploy to production
- [ ] Monitor first run for errors
- [ ] Set up freshness checks and alerts
- [ ] Update runbooks if needed

---

## Summary

**Data Engineering Excellence Requires**:

1. **Modular Models** - Small, reusable, well-tested
2. **Testing at Every Layer** - Schema tests, data tests, freshness checks
3. **Clear Documentation** - Every model and column documented
4. **Performance Optimization** - Incremental models, partitioning, clustering
5. **Data Quality Monitoring** - Alerts on failures, freshness, and anomalies
6. **Governance** - Lineage, cataloging, PII management

**Buck's Motto**:

> "Garbage in, garbage out. Test your data like you test your code. Document like the next person reading this is a serial killer who knows where you live."

---

**Related Documentation**:

- [Data Modeling Best Practices](./data-modeling.md)
- [Data Quality Guide](./data-quality.md)
- [Analytics Event Taxonomy](../../docs/analytics/event-taxonomy.md)
- [Dashboard Best Practices](../../docs/analytics/dashboards.md)
