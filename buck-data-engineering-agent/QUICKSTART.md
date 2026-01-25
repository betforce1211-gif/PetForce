# Buck Data Engineering Agent - Quick Start Guide

Set up a modern data pipeline in 15 minutes.

## Prerequisites

- Python 3.8+
- Access to a data warehouse (Snowflake, BigQuery, or Redshift)
- dbt installed (`pip install dbt-snowflake` or equivalent)

---

## Step 1: Initialize dbt Project

```bash
# Create new dbt project
dbt init analytics

# Navigate to project
cd analytics

# Verify structure
ls -la
```

Expected structure:
```
analytics/
├── dbt_project.yml
├── models/
├── seeds/
├── tests/
├── macros/
└── analyses/
```

---

## Step 2: Configure Connection

Create `~/.dbt/profiles.yml`:

```yaml
# Snowflake example
analytics:
  target: dev
  outputs:
    dev:
      type: snowflake
      account: your-account
      user: "{{ env_var('DBT_USER') }}"
      password: "{{ env_var('DBT_PASSWORD') }}"
      role: transformer
      database: analytics
      warehouse: transforming_wh
      schema: dev_{{ env_var('USER') }}
      threads: 4
      
    prod:
      type: snowflake
      account: your-account
      user: "{{ env_var('DBT_USER') }}"
      password: "{{ env_var('DBT_PASSWORD') }}"
      role: transformer
      database: analytics
      warehouse: transforming_wh
      schema: prod
      threads: 8
```

Test connection:
```bash
dbt debug
```

---

## Step 3: Set Up Sources

Create `models/staging/_sources.yml`:

```yaml
version: 2

sources:
  - name: raw
    database: analytics
    schema: raw
    description: "Raw data loaded by Airbyte"
    
    tables:
      - name: orders
        description: "Raw orders from application database"
        columns:
          - name: id
            description: "Primary key"
        loaded_at_field: _airbyte_loaded_at
        freshness:
          warn_after: {count: 12, period: hour}
          error_after: {count: 24, period: hour}
          
      - name: customers
        description: "Raw customer data"
        
      - name: products
        description: "Raw product catalog"
```

---

## Step 4: Create Staging Models

Create `models/staging/stg_orders.sql`:

```sql
{{
  config(
    materialized='view',
    schema='staging'
  )
}}

with source as (
    select * from {{ source('raw', 'orders') }}
),

renamed as (
    select
        -- IDs
        id as order_id,
        customer_id,
        
        -- Order details
        status as order_status,
        
        -- Amounts (convert cents to dollars)
        amount_cents / 100.0 as amount,
        tax_cents / 100.0 as tax,
        
        -- Timestamps
        created_at as ordered_at,
        updated_at,
        
        -- Metadata
        _airbyte_loaded_at as loaded_at
        
    from source
    where id is not null
)

select * from renamed
```

Create `models/staging/stg_customers.sql`:

```sql
{{
  config(
    materialized='view',
    schema='staging'
  )
}}

with source as (
    select * from {{ source('raw', 'customers') }}
),

renamed as (
    select
        id as customer_id,
        trim(name) as customer_name,
        lower(email) as email,
        segment as customer_segment,
        created_at as customer_created_at
    from source
    where id is not null
)

select * from renamed
```

---

## Step 5: Create Intermediate Models

Create `models/intermediate/int_orders_enriched.sql`:

```sql
{{
  config(
    materialized='ephemeral'
  )
}}

with orders as (
    select * from {{ ref('stg_orders') }}
),

customers as (
    select * from {{ ref('stg_customers') }}
),

enriched as (
    select
        o.*,
        c.customer_name,
        c.customer_segment,
        c.email,
        
        -- Calculate order tier
        case
            when o.amount >= 1000 then 'high'
            when o.amount >= 100 then 'medium'
            else 'low'
        end as order_tier
        
    from orders o
    left join customers c using (customer_id)
)

select * from enriched
```

---

## Step 6: Create Mart Models

Create `models/marts/core/fct_orders.sql`:

```sql
{{
  config(
    materialized='incremental',
    unique_key='order_id',
    schema='marts'
  )
}}

with orders as (
    select * from {{ ref('int_orders_enriched') }}
    
    {% if is_incremental() %}
    where updated_at > (select max(updated_at) from {{ this }})
    {% endif %}
)

select
    -- Keys
    {{ dbt_utils.generate_surrogate_key(['order_id']) }} as order_key,
    order_id,
    customer_id,
    
    -- Attributes
    order_status,
    order_tier,
    customer_segment,
    
    -- Measures
    amount,
    tax,
    amount + tax as total_amount,
    
    -- Timestamps
    ordered_at,
    updated_at,
    
    -- Metadata
    current_timestamp() as dbt_updated_at
    
from orders
```

Create `models/marts/core/dim_customers.sql`:

```sql
{{
  config(
    materialized='table',
    schema='marts'
  )
}}

with customers as (
    select * from {{ ref('stg_customers') }}
),

orders as (
    select
        customer_id,
        count(*) as total_orders,
        sum(total_amount) as lifetime_value,
        min(ordered_at) as first_order_at,
        max(ordered_at) as last_order_at
    from {{ ref('fct_orders') }}
    group by 1
),

final as (
    select
        {{ dbt_utils.generate_surrogate_key(['c.customer_id']) }} as customer_key,
        c.customer_id,
        c.customer_name,
        c.email,
        c.customer_segment,
        c.customer_created_at,
        
        coalesce(o.total_orders, 0) as total_orders,
        coalesce(o.lifetime_value, 0) as lifetime_value,
        o.first_order_at,
        o.last_order_at,
        
        case
            when o.lifetime_value >= 10000 then 'vip'
            when o.lifetime_value >= 1000 then 'regular'
            else 'new'
        end as customer_tier
        
    from customers c
    left join orders o using (customer_id)
)

select * from final
```

---

## Step 7: Add Tests

Create `models/marts/core/_core.yml`:

```yaml
version: 2

models:
  - name: fct_orders
    description: "Order fact table"
    columns:
      - name: order_key
        tests:
          - unique
          - not_null
      - name: order_id
        tests:
          - unique
          - not_null
      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('dim_customers')
              field: customer_id
      - name: total_amount
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              
  - name: dim_customers
    description: "Customer dimension"
    columns:
      - name: customer_key
        tests:
          - unique
          - not_null
      - name: customer_id
        tests:
          - unique
          - not_null
      - name: email
        tests:
          - unique
```

---

## Step 8: Run the Pipeline

```bash
# Run all models
dbt run

# Run specific model
dbt run --select fct_orders

# Run with dependencies
dbt run --select +fct_orders

# Run tests
dbt test

# Generate docs
dbt docs generate
dbt docs serve
```

---

## Step 9: Set Up Orchestration (Airflow)

Create `dags/daily_elt.py`:

```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator

default_args = {
    'owner': 'buck',
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'daily_elt',
    default_args=default_args,
    schedule_interval='0 6 * * *',
    start_date=datetime(2024, 1, 1),
    catchup=False,
) as dag:
    
    dbt_run = BashOperator(
        task_id='dbt_run',
        bash_command='cd /path/to/dbt && dbt run',
    )
    
    dbt_test = BashOperator(
        task_id='dbt_test',
        bash_command='cd /path/to/dbt && dbt test',
    )
    
    dbt_run >> dbt_test
```

---

## Project Structure (Final)

```
analytics/
├── dbt_project.yml
├── models/
│   ├── staging/
│   │   ├── _sources.yml
│   │   ├── _staging.yml
│   │   ├── stg_orders.sql
│   │   └── stg_customers.sql
│   ├── intermediate/
│   │   └── int_orders_enriched.sql
│   └── marts/
│       └── core/
│           ├── _core.yml
│           ├── fct_orders.sql
│           └── dim_customers.sql
├── tests/
├── macros/
└── dags/
    └── daily_elt.py
```

---

## Quick Reference

### Model Naming
| Prefix | Layer | Example |
|--------|-------|---------|
| `stg_` | Staging (Silver) | `stg_orders` |
| `int_` | Intermediate | `int_orders_enriched` |
| `fct_` | Fact (Gold) | `fct_orders` |
| `dim_` | Dimension (Gold) | `dim_customers` |
| `mart_` | Business Mart | `mart_sales_summary` |

### Materialization
| Type | When to Use |
|------|-------------|
| `view` | Staging models, small tables |
| `table` | Dimensions, small facts |
| `incremental` | Large facts, time-series |
| `ephemeral` | Intermediate logic |

### Common dbt Commands
```bash
dbt run                    # Run all models
dbt run -s staging         # Run staging only
dbt run -s +fct_orders     # Run with upstream
dbt run -s fct_orders+     # Run with downstream
dbt test                   # Run all tests
dbt docs generate          # Generate docs
dbt docs serve             # Serve docs locally
dbt source freshness       # Check source freshness
```

---

## Next Steps

1. 📖 Read the full [BUCK.md](./BUCK.md) documentation
2. 🔧 Add more sources (Stripe, HubSpot, etc.)
3. 📊 Create marts for Ana's dashboards
4. 🧪 Add more data quality tests
5. 📈 Set up monitoring & alerting

---

*Buck: Bad data is worse than no data. Good pipelines make good data.* 🔄
