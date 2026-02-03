# Data Engineering Guide

**Owner**: Buck (Data Engineering Agent)
**Last Updated**: 2026-02-03

Comprehensive guide to building production-quality data pipelines for PetForce using dbt, modern data stack, and analytics engineering best practices.

---

## Table of Contents

1. [Buck's Data Engineering Philosophy](#bucks-data-engineering-philosophy)
2. [Modern Data Stack](#modern-data-stack)
3. [dbt Fundamentals](#dbt-fundamentals)
4. [Data Modeling](#data-modeling)
5. [Data Quality](#data-quality)
6. [Pipeline Orchestration](#pipeline-orchestration)
7. [Testing Strategy](#testing-strategy)
8. [Performance Optimization](#performance-optimization)
9. [Data Governance](#data-governance)
10. [Best Practices Checklist](#best-practices-checklist)

---

## Buck's Data Engineering Philosophy

**Core Principles:**

1. **Data Quality Over Speed** - Correct data is more valuable than fast data
2. **Build for the Next Engineer** - Clear, documented, testable code
3. **Test Everything** - Schema tests, data tests, business logic tests
4. **Modularity** - Small, reusable models that do one thing well
5. **Version Control** - All transformations in Git, no manual SQL
6. **Idempotency** - Run the same pipeline twice, get the same result
7. **Observability** - Monitor pipeline runs, data freshness, and quality

**Buck's Motto**: "Bad data is worse than no data. Build quality in from day one."

---

## Modern Data Stack

### The Analytics Engineering Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Sources                            │
│  (PostgreSQL, External APIs, CSV uploads, Event Streams)    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            Ingestion Layer (Fivetran/Airbyte)               │
│              Extract → Load into Data Warehouse             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          Data Warehouse (Snowflake/BigQuery)                │
│                Raw Data (Bronze Layer)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│             Transformation Layer (dbt)                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Staging (Silver Layer)                             │   │
│  │  - Clean raw data                                   │   │
│  │  - Type casting                                     │   │
│  │  │  - Deduplication                                   │   │
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
│        Analytics & BI Layer (Looker/Metabase)               │
│        Dashboards, Reports, Ad-hoc Queries                  │
└─────────────────────────────────────────────────────────────┘
```

---

## dbt Fundamentals

### Project Structure

```
data/dbt/
├── dbt_project.yml          # Project configuration
├── packages.yml             # dbt package dependencies
├── profiles.yml             # Database connections
├── macros/                  # Reusable SQL functions
├── models/
│   ├── staging/            # Bronze → Silver (source data cleaning)
│   │   ├── _staging.yml    # Source definitions
│   │   ├── stg_households.sql
│   │   ├── stg_pets.sql
│   │   └── stg_users.sql
│   ├── intermediate/       # Silver (business logic)
│   │   ├── int_household_members.sql
│   │   └── int_pet_ownership.sql
│   └── marts/              # Gold (analytics ready)
│       ├── analytics/
│       │   ├── fct_households.sql
│       │   ├── fct_pets.sql
│       │   └── dim_users.sql
│       └── marketing/
│           └── fct_user_cohorts.sql
├── tests/                   # Custom data tests
└── snapshots/              # Type-2 SCD tables
```

### Basic dbt Model

```sql
-- models/staging/stg_pets.sql

{{
  config(
    materialized='view',
    tags=['daily', 'staging']
  )
}}

with source as (
  select * from {{ source('petforce', 'pets') }}
),

renamed as (
  select
    -- Primary key
    id as pet_id,

    -- Foreign keys
    household_id,
    owner_id,

    -- Attributes
    name as pet_name,
    type as pet_type,
    breed,
    age_years,
    weight_pounds,

    -- Metadata
    created_at,
    updated_at,
    deleted_at,

    -- Data quality
    _fivetran_synced

  from source
  where deleted_at is null  -- Filter soft-deleted records
)

select * from renamed
```

### dbt Tests

```yaml
# models/staging/_staging.yml

version: 2

models:
  - name: stg_pets
    description: Staged pet data from production database
    columns:
      - name: pet_id
        description: Primary key for pets
        tests:
          - unique
          - not_null

      - name: household_id
        description: Foreign key to households
        tests:
          - not_null
          - relationships:
              to: ref('stg_households')
              field: household_id

      - name: pet_type
        description: Type of pet (dog, cat, bird, etc.)
        tests:
          - accepted_values:
              values: ["dog", "cat", "bird", "fish", "reptile", "other"]

      - name: age_years
        description: Age of pet in years
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0 and <= 50"
```

---

## Data Modeling

### The Medallion Architecture

**Bronze Layer (Raw)**:

- Exact copy of source data
- No transformations
- Immutable
- Stored in `raw` schema

**Silver Layer (Staged)**:

- Cleaned and conformed
- Type casting
- Deduplication
- Basic business logic
- Stored in `staging` schema

**Gold Layer (Marts)**:

- Business-ready tables
- Denormalized for performance
- Optimized for BI tools
- Stored in `analytics`, `marketing`, etc. schemas

### Dimensional Modeling

**Fact Tables** (events, transactions, measurements):

```sql
-- models/marts/analytics/fct_pet_checkups.sql

{{
  config(
    materialized='incremental',
    unique_key='checkup_id',
    tags=['hourly', 'facts']
  )
}}

select
  -- Primary key
  checkup_id,

  -- Foreign keys (dimensions)
  pet_id,
  household_id,
  vet_id,

  -- Degenerate dimensions
  checkup_type,
  checkup_reason,

  -- Metrics
  weight_pounds,
  temperature_f,
  heart_rate_bpm,
  cost_dollars,

  -- Timestamps
  checkup_date,
  checkup_datetime

from {{ ref('stg_checkups') }}

{% if is_incremental() %}
  where checkup_datetime > (select max(checkup_datetime) from {{ this }})
{% endif %}
```

**Dimension Tables** (attributes, descriptive data):

```sql
-- models/marts/analytics/dim_pets.sql

{{
  config(
    materialized='table',
    tags=['daily', 'dimensions']
  )
}}

select
  -- Primary key
  pet_id,

  -- Attributes
  pet_name,
  pet_type,
  breed,
  age_years,
  weight_pounds,
  is_neutered,
  is_vaccinated,

  -- SCD Type 2 (track changes over time)
  valid_from,
  valid_to,
  is_current,

  -- Metadata
  created_at,
  updated_at

from {{ ref('stg_pets') }}
```

---

## Data Quality

### dbt Tests

**1. Schema Tests** (built-in):

```yaml
tests:
  - unique
  - not_null
  - accepted_values:
      values: ["dog", "cat", "bird"]
  - relationships:
      to: ref('stg_households')
      field: household_id
```

**2. Data Tests** (custom SQL):

```sql
-- tests/assert_pet_age_reasonable.sql

-- Pets should not be older than 50 years or younger than 0
select *
from {{ ref('fct_pets') }}
where age_years < 0 or age_years > 50
```

**3. dbt Expectations** (Great Expectations in dbt):

```yaml
- dbt_expectations.expect_column_values_to_be_between:
    min_value: 0
    max_value: 50

- dbt_expectations.expect_column_values_to_match_regex:
    regex: "^[A-Za-z0-9-]+$"
```

### Data Quality Monitors

```sql
-- models/monitoring/data_quality_dashboard.sql

with row_counts as (
  select
    'stg_pets' as table_name,
    count(*) as row_count,
    count(distinct pet_id) as unique_ids,
    current_timestamp() as measured_at
  from {{ ref('stg_pets') }}
),

null_checks as (
  select
    'stg_pets.pet_name' as column_name,
    count(*) as total_rows,
    count(pet_name) as non_null_rows,
    count(*) - count(pet_name) as null_rows,
    (count(*) - count(pet_name)) / count(*) * 100 as null_percentage
  from {{ ref('stg_pets') }}
)

select * from row_counts
union all
select * from null_checks
```

---

## Pipeline Orchestration

### dbt Cloud Scheduling

```yaml
# .dbt/jobs/daily_refresh.yml

jobs:
  - name: Daily Full Refresh
    schedule: "0 2 * * *" # 2 AM daily
    commands:
      - dbt deps
      - dbt seed
      - dbt run --full-refresh
      - dbt test
      - dbt docs generate

  - name: Hourly Incremental
    schedule: "0 * * * *" # Hourly
    commands:
      - dbt run --select tag:hourly
      - dbt test --select tag:hourly
```

### Airflow DAG

```python
# dags/dbt_petforce.py

from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'buck',
    'depends_on_past': False,
    'email': ['data@petforce.com'],
    'email_on_failure': True,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'dbt_petforce_daily',
    default_args=default_args,
    description='Daily dbt run for PetForce',
    schedule_interval='0 2 * * *',
    start_date=datetime(2026, 1, 1),
    catchup=False,
) as dag:

    dbt_deps = BashOperator(
        task_id='dbt_deps',
        bash_command='cd /opt/dbt/petforce && dbt deps',
    )

    dbt_seed = BashOperator(
        task_id='dbt_seed',
        bash_command='cd /opt/dbt/petforce && dbt seed',
    )

    dbt_run = BashOperator(
        task_id='dbt_run',
        bash_command='cd /opt/dbt/petforce && dbt run',
    )

    dbt_test = BashOperator(
        task_id='dbt_test',
        bash_command='cd /opt/dbt/petforce && dbt test',
    )

    dbt_docs = BashOperator(
        task_id='dbt_docs',
        bash_command='cd /opt/dbt/petforce && dbt docs generate',
    )

    # Define dependencies
    dbt_deps >> dbt_seed >> dbt_run >> dbt_test >> dbt_docs
```

---

## Testing Strategy

### The Testing Pyramid

```
         ┌─────────────────┐
         │   E2E Tests     │  Dashboard tests (Selenium)
         │   (Few)         │
         └─────────────────┘
              │
    ┌─────────────────────────┐
    │  Integration Tests      │  Cross-model tests
    │  (Some)                 │  Freshness tests
    └─────────────────────────┘
              │
┌─────────────────────────────────┐
│   Unit Tests                    │  Schema tests
│   (Many)                        │  Not null, unique
│                                 │  Accepted values
└─────────────────────────────────┘
```

### Example Tests

```yaml
# models/marts/_marts.yml

models:
  - name: fct_pet_ownership
    description: Fact table for pet ownership events
    tests:
      # Row count should match source
      - dbt_utils.equal_rowcount:
          compare_model: ref('stg_pets')

      # Should have at least 1000 rows
      - dbt_utils.expression_is_true:
          expression: "(select count(*) from fct_pet_ownership) >= 1000"

    columns:
      - name: ownership_days
        description: Days of pet ownership
        tests:
          # Should be positive
          - dbt_utils.expression_is_true:
              expression: ">= 0"

          # Should not exceed 10,000 days (27 years)
          - dbt_utils.expression_is_true:
              expression: "<= 10000"
```

---

## Performance Optimization

### Incremental Models

```sql
-- models/marts/fct_events.sql

{{
  config(
    materialized='incremental',
    unique_key='event_id',
    on_schema_change='append_new_columns',
    tags=['hourly']
  )
}}

select
  event_id,
  user_id,
  event_type,
  event_timestamp,
  properties

from {{ ref('stg_events') }}

{% if is_incremental() %}
  -- Only process new events
  where event_timestamp > (select max(event_timestamp) from {{ this }})
{% endif %}
```

### Partitioning

```sql
-- Snowflake partitioning
{{
  config(
    materialized='incremental',
    unique_key='event_id',
    cluster_by=['event_date', 'event_type']
  )
}}
```

### Indexes

```sql
-- PostgreSQL indexes
{{
  config(
    materialized='table',
    indexes=[
      {'columns': ['pet_id']},
      {'columns': ['household_id', 'created_at']},
    ]
  )
}}
```

---

## Data Governance

### Lineage

dbt automatically generates lineage graphs showing:

- Source tables
- Model dependencies
- Downstream impacts

```bash
# Generate documentation with lineage
dbt docs generate
dbt docs serve
```

### Documentation

```yaml
# models/_models.yml

models:
  - name: fct_households
    description: |
      Fact table for household metrics.

      **Business Logic**:
      - One row per household per day
      - Aggregates pet counts, member counts
      - Includes household lifetime metrics

      **Refresh Schedule**: Daily at 2 AM UTC
      **Owner**: Buck (Data Engineering)
      **Stakeholders**: Ana (Analytics), Peter (Product)

    columns:
      - name: household_id
        description: Unique identifier for household
        meta:
          dimension:
            type: primary_key
            label: Household ID
```

---

## Best Practices Checklist

Before shipping any dbt model:

### Code Quality

- [ ] Model follows naming conventions (`stg_`, `int_`, `fct_`, `dim_`)
- [ ] SQL is formatted consistently
- [ ] CTEs are used for readability
- [ ] Complex logic is commented
- [ ] No `SELECT *` in production models

### Testing

- [ ] Primary keys tested (unique + not_null)
- [ ] Foreign keys tested (relationships)
- [ ] Accepted values tested for categorical columns
- [ ] Custom business logic tests added
- [ ] Row counts validated

### Performance

- [ ] Incremental strategy used for large tables
- [ ] Appropriate materialization (view, table, incremental)
- [ ] Partitioning/clustering configured
- [ ] Query execution time < 5 minutes

### Documentation

- [ ] Model description added
- [ ] Column descriptions added for key fields
- [ ] Business logic documented
- [ ] Dependencies documented
- [ ] Refresh schedule documented

### Governance

- [ ] Data lineage clear
- [ ] PII/sensitive data handled correctly
- [ ] Retention policy defined
- [ ] Access controls configured

---

## Tools & Resources

### Development Tools

- **dbt** - Data transformation framework
- **dbt Cloud** - Managed dbt with scheduling
- **SQL Workbench** - Query development
- **VS Code + dbt Power User** - IDE with dbt support

### Data Quality

- **dbt-expectations** - Great Expectations for dbt
- **elementary** - dbt-native data observability
- **re_data** - Data quality monitoring

### Orchestration

- **Airflow** - Workflow orchestration
- **Dagster** - Modern data orchestrator
- **Prefect** - Python-based orchestration

### Warehouses

- **Snowflake** - Cloud data warehouse (recommended)
- **BigQuery** - Google's data warehouse
- **Redshift** - AWS data warehouse
- **Databricks** - Lakehouse platform

---

## Related Documentation

- [Advanced Data Engineering Patterns](./advanced-patterns.md) - Production patterns and war stories
- [Data Modeling Best Practices](../../data/dbt/docs/data-modeling.md) - Dimensional modeling
- [Data Quality Guide](../../data/dbt/docs/data-quality.md) - Testing and validation

---

Built with precision by **Buck (Data Engineering Agent)** for PetForce.

**Buck's Motto**: "Bad data is worse than no data. Build quality in from day one."
