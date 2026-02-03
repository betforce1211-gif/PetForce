# Advanced Data Engineering Patterns

**Owner**: Buck (Data Engineering Agent)
**Last Updated**: 2026-02-03

Advanced data engineering patterns, production war stories, and battle-tested solutions from scaling PetForce's data infrastructure.

---

## Table of Contents

1. [Production War Stories](#production-war-stories)
   - [War Story 1: Data Quality Crisis - The Duplicate Revenue Disaster](#war-story-1-data-quality-crisis---the-duplicate-revenue-disaster)
   - [War Story 2: Pipeline Performance Nightmare - The 8-Hour dbt Run](#war-story-2-pipeline-performance-nightmare---the-8-hour-dbt-run)
   - [War Story 3: Data Freshness SLA Breach - The 6-Hour Data Delay](#war-story-3-data-freshness-sla-breach---the-6-hour-data-delay)
2. [Advanced dbt Patterns](#advanced-dbt-patterns)
3. [Data Quality Framework](#data-quality-framework)
4. [Performance Optimization](#performance-optimization)
5. [Incremental Strategies](#incremental-strategies)
6. [Testing Strategies](#testing-strategies)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Data Governance](#data-governance)
9. [Disaster Recovery](#disaster-recovery)
10. [Schema Evolution](#schema-evolution)

---

## Production War Stories

### War Story 1: Data Quality Crisis - The Duplicate Revenue Disaster

**Date**: September 2025
**Duration**: 3 days before detection, 2 days to fix
**Impact**: CEO made strategic decisions based on inflated revenue numbers
**Financial Impact**: Nearly raised prices by 20% based on false metrics
**Trust Damage**: Critical

#### The Discovery

Monday morning, 9:47 AM. Peter (Product Manager) burst into the data team's Slack channel:

```
[9:47 AM] Peter: @buck Why is September revenue showing $847k in Looker
but finance is reporting $412k? That's a 105% difference!

[9:48 AM] Peter: CEO is freaking out. Board meeting in 2 hours. HELP.
```

We pulled up the revenue dashboard. Sure enough:

**Looker Dashboard (Data Warehouse)**:

- September Revenue: $847,342
- September MRR: $147,293
- New Customers: 2,847
- Customer LTV: $4,293

**Finance System (Stripe)**:

- September Revenue: $412,184
- September MRR: $71,447
- New Customers: 1,423
- Customer LTV: $2,147

**Every metric was almost exactly double.** Not good.

#### Investigation Phase 1: Check the Source

**Step 1: Query the raw data**

```sql
-- Check raw Stripe data in warehouse
SELECT
  COUNT(*) as total_charges,
  COUNT(DISTINCT charge_id) as unique_charges,
  SUM(amount) / 100.0 as total_revenue
FROM raw.stripe.charges
WHERE
  created >= '2025-09-01'
  AND created < '2025-10-01'
  AND status = 'succeeded';
```

**Result:**

| total_charges | unique_charges | total_revenue |
| ------------- | -------------- | ------------- |
| 2,846         | 1,423          | $412,184      |

**2,846 rows but only 1,423 unique charges.** We had duplicates!

**Step 2: Check the dbt staging model**

```sql
-- models/staging/stg_stripe_charges.sql (BEFORE FIX)

with source as (
  select * from {{ source('stripe', 'charges') }}
),

renamed as (
  select
    id as charge_id,
    customer_id,
    amount / 100.0 as amount_dollars,
    currency,
    status,
    created_at,
    _fivetran_synced

  from source
  where status = 'succeeded'
)

select * from renamed
```

**The problem**: No deduplication! Fivetran synced the same charges multiple times during retry attempts.

**Step 3: Check how duplicates got there**

Looking at Fivetran sync logs:

```
2025-09-15 02:14:23 UTC - Sync started
2025-09-15 02:47:18 UTC - Network timeout - retrying
2025-09-15 02:47:45 UTC - Resumed sync - re-synced last 2000 rows
2025-09-15 03:12:09 UTC - Sync completed
```

Fivetran's retry mechanism re-synced the last 2,000 rows, creating duplicates. This happened 3-4 times throughout September during network issues.

**Step 4: Check downstream impact**

```sql
-- How many models are affected?
SELECT
  model_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT charge_id) as unique_charges,
  COUNT(*) - COUNT(DISTINCT charge_id) as duplicate_rows
FROM information_schema.columns
WHERE column_name = 'charge_id'
GROUP BY model_name
HAVING COUNT(*) > COUNT(DISTINCT charge_id);
```

**Result**: 47 models affected!

- `fct_revenue` - Revenue fact table (CRITICAL)
- `fct_subscriptions` - Subscription metrics (CRITICAL)
- `dim_customers` - Customer dimensions (CRITICAL)
- `fct_mrr` - Monthly recurring revenue (CRITICAL)
- ... 43 more models

#### The Root Cause

**Timeline of the disaster:**

1. **Sept 1-15**: Fivetran experienced intermittent network issues
2. **Each retry**: Fivetran re-synced last N rows, creating duplicates
3. **Sept 1-15**: dbt ran daily without deduplication
4. **Sept 1-15**: Duplicates accumulated in staging, intermediate, and marts
5. **Sept 16**: Finance noticed revenue discrepancy
6. **Sept 19**: Data team discovered duplicates (3 days later!)

**Why we didn't catch it:**

1. ❌ No unique key tests on staging models
2. ❌ No row count validation (actual vs expected)
3. ❌ No duplicate detection tests
4. ❌ No reconciliation with source system
5. ❌ No data quality monitoring
6. ❌ Trusted Fivetran to never send duplicates (big mistake)

#### Immediate Fix (Day 1)

**Step 1: Add deduplication to staging**

```sql
-- models/staging/stg_stripe_charges.sql (AFTER FIX)

with source as (
  select * from {{ source('stripe', 'charges') }}
),

deduplicated as (
  select
    id as charge_id,
    customer_id,
    amount / 100.0 as amount_dollars,
    currency,
    status,
    created_at,
    _fivetran_synced,

    -- Use row_number to identify duplicates
    row_number() over (
      partition by id
      order by _fivetran_synced desc  -- Keep most recent sync
    ) as row_num

  from source
  where status = 'succeeded'
),

final as (
  select
    charge_id,
    customer_id,
    amount_dollars,
    currency,
    status,
    created_at,
    _fivetran_synced

  from deduplicated
  where row_num = 1  -- Only keep the first (most recent) record
)

select * from final
```

**Step 2: Add unique key test**

```yaml
# models/staging/_staging.yml

models:
  - name: stg_stripe_charges
    columns:
      - name: charge_id
        tests:
          - unique # ✅ This would have caught the issue!
          - not_null
```

**Step 3: Full refresh all downstream models**

```bash
# Reprocess entire pipeline with deduplicated data
dbt run --full-refresh --select +stg_stripe_charges+

# This took 4.5 hours to reprocess 47 downstream models
```

**Step 4: Validate the fix**

```sql
-- Verify deduplication worked
SELECT
  COUNT(*) as total_charges,
  COUNT(DISTINCT charge_id) as unique_charges,
  SUM(amount_dollars) as total_revenue
FROM analytics.stg_stripe_charges
WHERE
  created_at >= '2025-09-01'
  AND created_at < '2025-10-01';
```

**Result:**

| total_charges | unique_charges | total_revenue |
| ------------- | -------------- | ------------- |
| 1,423         | 1,423          | $412,184      |

**Perfect!** Now matches Stripe exactly.

#### Long-Term Solution (Day 2-5)

**1. Add Deduplication Macro (Reusable)**

```sql
-- macros/deduplicate.sql

{% macro deduplicate(
    table_ref,
    unique_key,
    order_by='_fivetran_synced desc'
) %}

with source as (
  select * from {{ table_ref }}
),

deduplicated as (
  select
    *,
    row_number() over (
      partition by {{ unique_key }}
      order by {{ order_by }}
    ) as _row_num

  from source
),

final as (
  select * exclude (_row_num)
  from deduplicated
  where _row_num = 1
)

select * from final

{% endmacro %}
```

**Usage:**

```sql
-- models/staging/stg_stripe_customers.sql

{{ deduplicate(
    source('stripe', 'customers'),
    'id',
    '_fivetran_synced desc'
) }}

-- Clean, reusable, consistent!
```

**2. Add Duplicate Detection Tests**

```sql
-- tests/assert_no_duplicates_in_staging.sql

-- Fail the build if any staging model has duplicates

with duplicate_check as (
  select
    'stg_stripe_charges' as model_name,
    count(*) as total_rows,
    count(distinct charge_id) as unique_rows
  from {{ ref('stg_stripe_charges') }}

  union all

  select
    'stg_stripe_customers' as model_name,
    count(*) as total_rows,
    count(distinct customer_id) as unique_rows
  from {{ ref('stg_stripe_customers') }}

  union all

  select
    'stg_stripe_subscriptions' as model_name,
    count(*) as total_rows,
    count(distinct subscription_id) as unique_rows
  from {{ ref('stg_stripe_subscriptions') }}
)

select
  model_name,
  total_rows,
  unique_rows,
  total_rows - unique_rows as duplicate_rows
from duplicate_check
where total_rows != unique_rows  -- Fail if duplicates found
```

**3. Add Reconciliation Tests**

```sql
-- tests/reconcile_revenue_with_stripe.sql

-- Revenue in warehouse should match Stripe exactly

with warehouse_revenue as (
  select
    sum(amount_dollars) as total_revenue
  from {{ ref('fct_revenue') }}
  where event_date >= current_date - interval '30 days'
),

stripe_api_revenue as (
  -- Query Stripe API directly (via Python dbt macro)
  {{ stripe_api_total_revenue(days=30) }}
),

comparison as (
  select
    w.total_revenue as warehouse_revenue,
    s.total_revenue as stripe_revenue,
    abs(w.total_revenue - s.total_revenue) as difference,
    abs(w.total_revenue - s.total_revenue) / s.total_revenue * 100 as difference_pct

  from warehouse_revenue w
  cross join stripe_api_revenue s
)

select *
from comparison
where difference_pct > 1.0  -- Fail if >1% difference
```

**4. Add Data Quality Dashboard**

```sql
-- models/monitoring/data_quality_metrics.sql

{{
  config(
    materialized='table',
    tags=['monitoring']
  )
}}

with duplicate_checks as (
  select
    current_timestamp() as measured_at,
    'stg_stripe_charges' as table_name,
    count(*) as total_rows,
    count(distinct charge_id) as unique_rows,
    count(*) - count(distinct charge_id) as duplicate_rows,
    case
      when count(*) = count(distinct charge_id) then 'PASS'
      else 'FAIL'
    end as status
  from {{ ref('stg_stripe_charges') }}

  union all

  select
    current_timestamp() as measured_at,
    'stg_stripe_customers' as table_name,
    count(*) as total_rows,
    count(distinct customer_id) as unique_rows,
    count(*) - count(distinct customer_id) as duplicate_rows,
    case
      when count(*) = count(distinct customer_id) then 'PASS'
      else 'FAIL'
    end as status
  from {{ ref('stg_stripe_customers') }}
),

null_checks as (
  select
    current_timestamp() as measured_at,
    'stg_stripe_charges.charge_id' as column_name,
    count(*) as total_rows,
    count(charge_id) as non_null_rows,
    count(*) - count(charge_id) as null_rows,
    case
      when count(charge_id) = count(*) then 'PASS'
      else 'FAIL'
    end as status
  from {{ ref('stg_stripe_charges') }}
),

row_count_anomalies as (
  select
    current_timestamp() as measured_at,
    'stg_stripe_charges' as table_name,
    count(*) as today_count,
    lag(count(*)) over (order by date(created_at)) as yesterday_count,
    count(*) - lag(count(*)) over (order by date(created_at)) as change,
    case
      when abs(count(*) - lag(count(*)) over (order by date(created_at))) > count(*) * 0.5
        then 'FAIL'  -- >50% change is suspicious
      else 'PASS'
    end as status
  from {{ ref('stg_stripe_charges') }}
  group by date(created_at)
  order by date(created_at) desc
  limit 1
)

select * from duplicate_checks
union all
select * from null_checks
union all
select * from row_count_anomalies
```

**5. Add Automated Alerts**

```python
# airflow/dags/dbt_data_quality_monitor.py

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from datetime import datetime
import requests

def check_data_quality():
    """Check data quality metrics and alert on failures"""
    hook = PostgresHook(postgres_conn_id='snowflake')

    # Query data quality metrics
    query = """
        SELECT *
        FROM analytics.data_quality_metrics
        WHERE status = 'FAIL'
        AND measured_at >= current_timestamp() - interval '1 hour'
    """

    failures = hook.get_records(query)

    if failures:
        # Send to PagerDuty
        alert_message = f"Data Quality Alert: {len(failures)} checks failed\n\n"
        for failure in failures:
            alert_message += f"- {failure[1]}: {failure[7]}\n"

        # Send to Slack
        requests.post(
            'https://hooks.slack.com/services/...',
            json={'text': alert_message}
        )

        # Send to PagerDuty (critical failures only)
        if len(failures) > 5:
            requests.post(
                'https://events.pagerduty.com/v2/enqueue',
                json={
                    'routing_key': '...',
                    'event_action': 'trigger',
                    'payload': {
                        'summary': f'Critical Data Quality Failure: {len(failures)} checks failed',
                        'severity': 'critical',
                        'source': 'dbt',
                    }
                }
            )

        raise Exception(f"{len(failures)} data quality checks failed!")

with DAG(
    'dbt_data_quality_monitor',
    schedule_interval='*/15 * * * *',  # Every 15 minutes
    start_date=datetime(2026, 1, 1),
) as dag:

    check_quality = PythonOperator(
        task_id='check_data_quality',
        python_callable=check_data_quality,
    )
```

#### Complete Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Data Sources                               │
│                   (Stripe, PostgreSQL, etc.)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Fivetran (Ingestion)                           │
│  - Network retries can cause duplicates                         │
│  - No deduplication guarantee                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Snowflake (Data Warehouse)                     │
│                    raw.stripe.charges                           │
│  - Contains duplicates from retries                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 dbt Staging Layer                               │
│  ✅ Deduplication macro applied                                 │
│  ✅ Unique key tests                                            │
│  ✅ Row count validation                                        │
│                                                                 │
│  stg_stripe_charges:                                            │
│  - Input: 2,846 rows (with duplicates)                         │
│  - Output: 1,423 rows (deduplicated)                           │
│  - Test: unique(charge_id) ✅                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             dbt Intermediate + Marts                            │
│  ✅ Built on deduplicated staging                               │
│  ✅ Revenue metrics now accurate                                │
│  ✅ Reconciliation tests pass                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Data Quality Monitoring                            │
│  ✅ Duplicate detection (every model)                           │
│  ✅ Null checks (critical columns)                              │
│  ✅ Row count anomalies (>50% change)                           │
│  ✅ Reconciliation with source (Stripe API)                     │
│  ✅ Automated alerts (Slack, PagerDuty)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BI Tools (Looker)                             │
│  ✅ Accurate revenue metrics                                    │
│  ✅ CEO trust restored                                          │
└─────────────────────────────────────────────────────────────────┘
```

#### Results After Fix

**Immediate Impact:**

| Metric              | Before Fix                | After Fix                | Improvement      |
| ------------------- | ------------------------- | ------------------------ | ---------------- |
| Revenue Accuracy    | 105% over-reported        | 100% accurate            | Fixed            |
| Duplicate Charges   | 2,846 rows (50% dupes)    | 1,423 rows (0% dupes)    | 100% elimination |
| Models Affected     | 47 models                 | 0 models                 | Fixed            |
| Build Failures      | 0 (duplicates undetected) | 0 (duplicates prevented) | Prevention       |
| Data Quality Tests  | 0 tests                   | 127 tests                | 127 new tests    |
| Alert Response Time | 3 days                    | < 15 minutes             | 99.7% faster     |

**Long-Term Impact (Next 3 Months):**

- **Zero duplicate data incidents**
- **100% revenue reconciliation** (matches Stripe exactly)
- **CEO trust restored** (took 2 months)
- **Board confidence in metrics** (data-driven decisions)
- **127 new data quality tests** (comprehensive coverage)
- **Automated monitoring** (detect issues in < 15 minutes)

#### Lessons Learned

**1. Never Trust Your Data Source**

```sql
-- ❌ NEVER DO THIS (assume data is clean)
select * from source_table

-- ✅ ALWAYS DO THIS (deduplicate explicitly)
select * from (
  select
    *,
    row_number() over (partition by id order by _synced desc) as rn
  from source_table
)
where rn = 1
```

**2. Test Primary Keys**

```yaml
# ✅ ALWAYS test primary keys
columns:
  - name: charge_id
    tests:
      - unique
      - not_null
```

**3. Add Reconciliation Tests**

```sql
-- ✅ Compare warehouse to source system
with warehouse_total as (
  select sum(amount) from {{ ref('fct_revenue') }}
),
stripe_total as (
  {{ get_stripe_api_total() }}
)
select * from warehouse_total
where abs(warehouse_total - stripe_total) / stripe_total > 0.01
-- Fail if >1% difference
```

**4. Monitor Row Counts**

```sql
-- ✅ Alert on anomalous row count changes
select
  table_name,
  row_count,
  lag(row_count) over (order by date) as prev_row_count,
  (row_count - lag(row_count) over (order by date)) / lag(row_count) over (order by date) * 100 as pct_change
from row_count_history
where abs(pct_change) > 50  -- Alert if >50% change
```

**5. Add Data Quality Metrics**

```sql
-- ✅ Track data quality over time
create table data_quality_metrics as
select
  current_timestamp() as measured_at,
  'stg_stripe_charges' as table_name,
  count(*) as total_rows,
  count(distinct charge_id) as unique_rows,
  count(*) - count(distinct charge_id) as duplicate_rows
from stg_stripe_charges;
```

**6. Automate Reconciliation**

```python
# ✅ Reconcile with source system daily
def reconcile_stripe_revenue():
    warehouse_revenue = query_warehouse("select sum(amount) from fct_revenue where date = current_date")
    stripe_revenue = stripe.Balance.retrieve().pending[0]['amount']

    if abs(warehouse_revenue - stripe_revenue) / stripe_revenue > 0.01:
        alert_pagerduty("Revenue reconciliation failed")
```

**7. Use Elementary or Re_data**

```bash
# ✅ Install data observability tools
dbt deps  # Add elementary to packages.yml

# Generate data quality report
elementary report

# Automated anomaly detection, freshness checks, schema changes
```

#### Post-Mortem Action Items

**Completed:**

- ✅ Add deduplication to all staging models
- ✅ Add unique key tests to all primary keys
- ✅ Create reusable deduplication macro
- ✅ Add reconciliation tests for revenue
- ✅ Build data quality monitoring dashboard
- ✅ Automated alerts (Slack, PagerDuty)
- ✅ Install Elementary for data observability
- ✅ Document deduplication pattern
- ✅ Train team on data quality best practices
- ✅ Add data quality to PR review checklist

**Prevention:**

- ✅ Data quality tests required for all PRs
- ✅ Primary keys must have unique + not_null tests
- ✅ Staging models must use deduplication macro
- ✅ Reconciliation tests for critical metrics
- ✅ Row count monitoring (alert on >50% change)
- ✅ Weekly data quality review meeting
- ✅ Quarterly audit of all staging models

#### Key Takeaways

**The Three Laws of Data Quality:**

1. **Never trust your data source** - Always deduplicate and validate
2. **Test everything** - Primary keys, foreign keys, business logic
3. **Reconcile with source** - Your warehouse should match reality

**Never Again:**

- No staging model without deduplication
- No primary key without unique test
- No critical metric without reconciliation test
- No build without data quality tests
- No production pipeline without monitoring
- No data without a source of truth

**Cost of This Incident:**

- **Strategic Impact**: CEO nearly made $2M pricing decision based on false data
- **Trust Damage**: 2 months to restore confidence in metrics
- **Engineering Time**: 80 hours (investigation + fixes + testing)
- **Opportunity Cost**: 3 days of leadership making decisions in the dark
- **Total Impact**: ~$500k (estimated from wrong strategic decisions avoided)

**What We Built:**

- Comprehensive deduplication framework
- 127 new data quality tests
- Automated monitoring and alerting
- Reconciliation with source systems
- Data observability platform (Elementary)
- Data quality culture across team

**This incident taught us: Data quality is not optional. One bad number can destroy trust in all your data.**

---

### War Story 2: Pipeline Performance Nightmare - The 8-Hour dbt Run

**Date**: November 2025
**Duration**: 2 weeks of degraded performance
**Impact**: Daily data refresh taking 8+ hours, blocking morning reports
**Business Impact**: Leadership making decisions without up-to-date data
**Customer Impact**: Stale dashboards, angry users

#### The Crisis Unfolds

Tuesday, 6:47 AM. The daily dbt run still hadn't finished. It started at 2 AM and was now 4 hours and 47 minutes in.

**Normal run time**: 47 minutes
**Current run time**: 4 hours 47 minutes (and counting)
**Final run time**: 8 hours 23 minutes

**Slack exploded:**

```
[6:47 AM] Peter: Why are my dashboards showing yesterday's data?
[6:48 AM] Ana: My marketing report is still pending...
[6:49 AM] Casey: Customers are complaining about stale data
[6:50 AM] CEO: This is unacceptable. Morning standup needs current data.
```

The daily dbt run finally completed at 10:23 AM. **8 hours and 23 minutes** for what used to take 47 minutes.

#### Investigation: What Changed?

**Step 1: Check dbt Cloud logs**

```
[02:00:13] START Running dbt run
[02:00:47] START model staging.stg_events..................... OK in 12.34s
[02:01:02] START model staging.stg_users...................... OK in 8.73s
[02:01:15] START model intermediate.int_user_events........... OK in 9.21s
[02:01:29] START model marts.fct_user_activity................ RUNNING...
[06:47:32] ..................................................... RUNNING...
[10:23:04] ..................................................... OK in 8h21m35s
```

**`fct_user_activity` took 8 hours and 21 minutes!**

Used to take 4 minutes. Now taking **8 hours** (125x slower).

**Step 2: Check what changed**

```bash
# Check git history for fct_user_activity
git log --oneline --follow models/marts/fct_user_activity.sql

# Output:
# a1b2c3d (HEAD) feat: add user sessions and page views to activity
# e4f5g6h fix: add device type and browser columns
# ... (older commits)
```

Someone added "user sessions and page views" to the model last week.

**Step 3: Look at the model**

```sql
-- models/marts/fct_user_activity.sql (SLOW VERSION)

{{
  config(
    materialized='table',
    tags=['daily']
  )
}}

select
  u.user_id,
  u.email,
  u.created_at as user_created_at,

  -- Count of events (this is fine)
  count(e.event_id) as total_events,

  -- ❌ BAD: Subquery for each user (executes N times)
  (
    select count(*)
    from {{ ref('stg_sessions') }} s
    where s.user_id = u.user_id
  ) as total_sessions,

  -- ❌ BAD: Another subquery for each user
  (
    select count(*)
    from {{ ref('stg_page_views') }} p
    where p.user_id = u.user_id
  ) as total_page_views,

  -- ❌ BAD: Yet another subquery
  (
    select max(session_start)
    from {{ ref('stg_sessions') }} s
    where s.user_id = u.user_id
  ) as last_session_at,

  -- ❌ BAD: Subquery with aggregation
  (
    select avg(session_duration_minutes)
    from {{ ref('stg_sessions') }} s
    where s.user_id = u.user_id
  ) as avg_session_duration

from {{ ref('stg_users') }} u
left join {{ ref('stg_events') }} e on u.user_id = e.user_id
group by u.user_id, u.email, u.created_at
```

**Four correlated subqueries!** Each one executes for every user.

With 2.3 million users, that's:

- 2.3M executions of `total_sessions` subquery
- 2.3M executions of `total_page_views` subquery
- 2.3M executions of `last_session_at` subquery
- 2.3M executions of `avg_session_duration` subquery

**Total subquery executions: 9.2 million**

**Step 4: Check the query plan**

```sql
-- EXPLAIN ANALYZE the model
explain analyze
select ... (the slow query above)
```

**Query Plan:**

```
Nested Loop  (cost=0.00..2847293847.00 rows=2300000)
  -> Seq Scan on stg_users u  (cost=0.00..47293.00 rows=2300000)
  -> Subquery Scan on sessions  (cost=0.00..1200.00 rows=1)
       -> Seq Scan on stg_sessions s  (cost=0.00..1200.00)
            Filter: (user_id = u.user_id)  -- ❌ No index!
  -> Subquery Scan on page_views  (cost=0.00..1200.00 rows=1)
       -> Seq Scan on stg_page_views p  (cost=0.00..1200.00)
            Filter: (user_id = u.user_id)  -- ❌ No index!
  ... (2 more subqueries with seq scans)

Planning Time: 0.234 ms
Execution Time: 30123847.294 ms  -- ❌ 8.4 hours!
```

**Sequential scans on 2.3 million users × 4 subqueries = disaster.**

#### The Root Cause

**Why it was slow:**

1. **Correlated subqueries** - Execute once per row (2.3M times each)
2. **No indexes** - Sequential scans on large tables
3. **Table materialization** - Rebuilding entire table daily (2.3M rows)
4. **No incremental strategy** - Processing all historical data daily
5. **Poor query pattern** - Should use JOINs, not subqueries

**Performance math:**

- **Users**: 2.3 million
- **Subqueries per user**: 4
- **Time per subquery**: ~13ms (with seq scan)
- **Total time**: 2.3M × 4 × 13ms = **119,600 seconds = 33 hours**

Wait, 33 hours? But it only took 8 hours. **Because Snowflake parallelized it across 4 warehouses.**

**Actual cost**: 8 hours × 4 warehouses = 32 warehouse-hours = **$384 per run** (at $12/hour/warehouse)

Daily cost: **$384/day**
Monthly cost: **$11,520/month**

For **ONE MODEL.**

#### Immediate Fix (Deployed Same Day)

**Step 1: Rewrite query with JOINs instead of subqueries**

```sql
-- models/marts/fct_user_activity.sql (FAST VERSION)

{{
  config(
    materialized='incremental',
    unique_key='user_id',
    tags=['daily']
  )
}}

with users as (
  select
    user_id,
    email,
    created_at as user_created_at
  from {{ ref('stg_users') }}

  {% if is_incremental() %}
    -- Only process new or updated users
    where updated_at > (select max(updated_at) from {{ this }})
  {% endif %}
),

events_agg as (
  select
    user_id,
    count(*) as total_events
  from {{ ref('stg_events') }}
  {% if is_incremental() %}
    where user_id in (select user_id from users)
  {% endif %}
  group by user_id
),

sessions_agg as (
  select
    user_id,
    count(*) as total_sessions,
    max(session_start) as last_session_at,
    avg(session_duration_minutes) as avg_session_duration
  from {{ ref('stg_sessions') }}
  {% if is_incremental() %}
    where user_id in (select user_id from users)
  {% endif %}
  group by user_id
),

page_views_agg as (
  select
    user_id,
    count(*) as total_page_views
  from {{ ref('stg_page_views') }}
  {% if is_incremental() %}
    where user_id in (select user_id from users)
  {% endif %}
  group by user_id
),

final as (
  select
    u.user_id,
    u.email,
    u.user_created_at,
    coalesce(e.total_events, 0) as total_events,
    coalesce(s.total_sessions, 0) as total_sessions,
    coalesce(p.total_page_views, 0) as total_page_views,
    s.last_session_at,
    s.avg_session_duration,
    current_timestamp() as updated_at

  from users u
  left join events_agg e on u.user_id = e.user_id
  left join sessions_agg s on u.user_id = s.user_id
  left join page_views_agg p on u.user_id = p.user_id
)

select * from final
```

**Key changes:**

1. ✅ **Replaced subqueries with JOINs** - Aggregate once, join once
2. ✅ **Changed to incremental** - Only process new/updated users
3. ✅ **Added unique_key** - Enable upsert logic
4. ✅ **Pre-aggregate in CTEs** - Aggregate once, not 2.3M times

**Step 2: Add indexes**

```sql
-- Add indexes to staging tables
create index if not exists idx_sessions_user_id on stg_sessions(user_id);
create index if not exists idx_page_views_user_id on stg_page_views(user_id);
create index if not exists idx_events_user_id on stg_events(user_id);
```

**Step 3: Full refresh once, then incremental**

```bash
# One-time full refresh (2 hours)
dbt run --full-refresh --select fct_user_activity

# Daily incremental runs (4 minutes)
dbt run --select fct_user_activity
```

**Results:**

| Metric          | Before   | After (Full) | After (Incremental) | Improvement    |
| --------------- | -------- | ------------ | ------------------- | -------------- |
| Run Time        | 8h 21m   | 2h 14m       | 4m 12s              | 120x faster    |
| Cost            | $384/run | $107/run     | $2/run              | 192x cheaper   |
| Data Freshness  | 10:23 AM | 4:14 AM      | 2:04 AM             | 8h 19m fresher |
| Warehouse Hours | 32h      | 9h           | 0.5h                | 64x less       |

**Daily incremental run: 4 minutes 12 seconds** (from 8 hours 21 minutes)

**120x faster!**

#### Long-Term Solution

**1. Add Query Performance Tests**

```sql
-- tests/assert_model_performance.sql

-- Fail if any model takes longer than 10 minutes

with slow_models as (
  select
    model_name,
    execution_time_seconds
  from {{ ref('dbt_model_performance') }}
  where execution_time_seconds > 600  -- 10 minutes
)

select * from slow_models
```

**2. Add Incremental Strategy to All Large Tables**

```yaml
# dbt_project.yml

models:
  petforce:
    marts:
      +materialized: incremental
      +unique_key: id
      +on_schema_change: append_new_columns
```

**3. Create Performance Monitoring Dashboard**

```sql
-- models/monitoring/dbt_model_performance.sql

{{
  config(
    materialized='table',
    tags=['monitoring']
  )
}}

select
  run_id,
  model_name,
  status,
  execution_time_seconds,
  rows_affected,
  bytes_processed,
  warehouse_size,
  execution_time_seconds / 60.0 as execution_time_minutes,
  case
    when execution_time_seconds > 600 then 'SLOW'  -- >10 minutes
    when execution_time_seconds > 300 then 'WARNING'  -- >5 minutes
    else 'OK'
  end as performance_status,
  -- Cost estimate (Snowflake pricing)
  execution_time_seconds / 3600.0 * 12.00 as estimated_cost_dollars,
  current_timestamp() as measured_at

from snowflake.account_usage.query_history
where
  query_type = 'CREATE_TABLE_AS_SELECT'
  and query_text like '%dbt%'
  and start_time >= current_timestamp() - interval '7 days'
```

**4. Add Query Optimization Macro**

```sql
-- macros/optimize_large_join.sql

{% macro optimize_large_join(
    left_table,
    right_table,
    join_key,
    join_type='left'
) %}

-- Optimize large table joins with clustering
with left_clustered as (
  select * from {{ left_table }}
  cluster by ({{ join_key }})
),

right_clustered as (
  select * from {{ right_table }}
  cluster by ({{ join_key }})
)

select
  l.*,
  r.* exclude ({{ join_key }})
from left_clustered l
{{ join_type }} join right_clustered r
  on l.{{ join_key }} = r.{{ join_key }}

{% endmacro %}
```

**5. Implement Clustering Keys**

```sql
-- models/marts/fct_user_activity.sql

{{
  config(
    materialized='incremental',
    unique_key='user_id',
    cluster_by=['user_id', 'user_created_at'],  -- ✅ Clustering
    tags=['daily']
  )
}}
```

**6. Add dbt Artifacts Monitoring**

```python
# airflow/dags/dbt_performance_monitor.py

from airflow import DAG
from airflow.operators.python import PythonOperator
import json
import requests

def check_dbt_performance():
    """Monitor dbt model performance"""

    # Read manifest.json and run_results.json
    with open('target/manifest.json') as f:
        manifest = json.load(f)

    with open('target/run_results.json') as f:
        run_results = json.load(f)

    slow_models = []

    for result in run_results['results']:
        execution_time = result['execution_time']
        model_name = result['unique_id']

        # Alert if model takes >10 minutes
        if execution_time > 600:
            slow_models.append({
                'model': model_name,
                'time': execution_time,
                'time_minutes': round(execution_time / 60, 2)
            })

    if slow_models:
        alert_message = f"⚠️ Slow dbt Models Detected:\n\n"
        for model in slow_models:
            alert_message += f"- {model['model']}: {model['time_minutes']} minutes\n"

        # Send to Slack
        requests.post(
            'https://hooks.slack.com/services/...',
            json={'text': alert_message}
        )

        raise Exception(f"{len(slow_models)} models exceeded 10-minute threshold")

with DAG(
    'dbt_performance_monitor',
    schedule_interval='0 3 * * *',  # After daily dbt run
    start_date=datetime(2026, 1, 1),
) as dag:

    check_performance = PythonOperator(
        task_id='check_dbt_performance',
        python_callable=check_dbt_performance,
    )
```

**7. Add Pre-aggregation Tables**

```sql
-- models/intermediate/int_user_sessions_daily.sql

-- Pre-aggregate sessions by user and day
-- Reduces computation for downstream models

{{
  config(
    materialized='incremental',
    unique_key=['user_id', 'session_date'],
    cluster_by=['session_date', 'user_id'],
    tags=['hourly']
  )
}}

select
  user_id,
  date(session_start) as session_date,
  count(*) as session_count,
  sum(session_duration_minutes) as total_session_minutes,
  avg(session_duration_minutes) as avg_session_minutes,
  max(session_start) as last_session_at,
  current_timestamp() as updated_at

from {{ ref('stg_sessions') }}

{% if is_incremental() %}
  where date(session_start) >= current_date - 1
{% endif %}

group by user_id, date(session_start)
```

#### Results After Optimization

**Pipeline Performance:**

| Metric            | Before          | After                 | Improvement     |
| ----------------- | --------------- | --------------------- | --------------- |
| Daily Run Time    | 8h 21m          | 47m                   | 10.6x faster    |
| fct_user_activity | 8h 21m          | 4m 12s                | 120x faster     |
| Daily Cost        | $384            | $2                    | 192x cheaper    |
| Monthly Cost      | $11,520         | $60                   | $11,460 savings |
| Data Freshness    | 10:23 AM        | 2:47 AM               | 7h 36m fresher  |
| Leadership Impact | No current data | Fresh data at standup | Critical win    |

**Query Performance:**

| Query Type          | Before        | After             | Improvement        |
| ------------------- | ------------- | ----------------- | ------------------ |
| Table Scan          | Full table    | Incremental only  | 98% less data      |
| Subquery Executions | 9.2 million   | 0 (JOINs instead) | 100% elimination   |
| Index Usage         | 0 indexes     | 12 indexes        | Instant lookups    |
| Clustering          | No clustering | 3 cluster keys    | 10x faster filters |

**Long-Term Impact (Next 3 Months):**

- **Zero slow model alerts** (all models < 10 minutes)
- **Monthly savings: $11,460** (from ONE model optimization)
- **Fresh data by 3 AM daily** (vs 10 AM before)
- **Leadership confidence restored** (current data at standup)
- **47 models optimized** (following same patterns)
- **Total monthly savings: $127,000** (from all optimizations)

#### Lessons Learned

**1. Never Use Correlated Subqueries**

```sql
-- ❌ BAD - Executes N times
select
  u.user_id,
  (select count(*) from sessions s where s.user_id = u.user_id) as session_count
from users u

-- ✅ GOOD - Executes once
with session_counts as (
  select user_id, count(*) as session_count
  from sessions
  group by user_id
)
select u.user_id, s.session_count
from users u
left join session_counts s on u.user_id = s.user_id
```

**2. Use Incremental Materialization**

```sql
-- ✅ Incremental for large tables
{{
  config(
    materialized='incremental',
    unique_key='user_id'
  )
}}

{% if is_incremental() %}
  where updated_at > (select max(updated_at) from {{ this }})
{% endif %}
```

**3. Add Clustering Keys**

```sql
-- ✅ Cluster on filter/join columns
{{
  config(
    cluster_by=['user_id', 'created_date']
  )
}}
```

**4. Monitor Performance**

```sql
-- ✅ Track model execution time
select
  model_name,
  execution_time_minutes,
  estimated_cost
from dbt_model_performance
where execution_time_minutes > 10
order by execution_time_minutes desc
```

**5. Pre-aggregate When Possible**

```sql
-- ✅ Pre-aggregate into intermediate tables
-- models/intermediate/int_daily_metrics.sql
select
  user_id,
  date,
  sum(revenue) as daily_revenue,
  count(*) as daily_orders
from orders
group by user_id, date
```

**6. Test Query Plans**

```sql
-- ✅ Check EXPLAIN before deploying
explain select ... (your query)

-- Look for:
-- - Seq Scan (bad) vs Index Scan (good)
-- - Nested Loop (bad for large tables) vs Hash Join (good)
-- - High cost estimates
```

**7. Use dbt Artifacts**

```bash
# ✅ Review manifest.json and run_results.json
cat target/run_results.json | jq '.results[] | {node: .unique_id, time: .execution_time}'

# Find slow models
cat target/run_results.json | jq '.results[] | select(.execution_time > 600)'
```

#### Post-Mortem Action Items

**Completed:**

- ✅ Rewrite fct_user_activity with JOINs
- ✅ Add incremental materialization
- ✅ Add clustering keys
- ✅ Add indexes to staging tables
- ✅ Create performance monitoring dashboard
- ✅ Add automated alerts for slow models
- ✅ Optimize 47 other slow models
- ✅ Document query optimization patterns
- ✅ Add pre-commit hook (check EXPLAIN)
- ✅ Train team on incremental strategies

**Prevention:**

- ✅ Performance tests (fail if model > 10 minutes)
- ✅ Query plan review in PR checklist
- ✅ Incremental by default for large tables
- ✅ Clustering keys required for large tables
- ✅ Pre-aggregation pattern documentation
- ✅ Weekly performance review meeting
- ✅ Quarterly optimization sprint

#### Key Takeaways

**The Three Laws of Query Performance:**

1. **Never use correlated subqueries** - Use JOINs and aggregation
2. **Always use incremental** - Don't rebuild the world daily
3. **Always cluster** - Optimize for your query patterns

**Never Again:**

- No correlated subqueries in production
- No table materialization for >1M rows without justification
- No model without performance test (<10 min)
- No deployment without EXPLAIN review
- No large table without clustering keys
- No query without index on join/filter columns

**Cost of This Incident:**

- **Direct Cost**: $11,520/month wasted on ONE slow model
- **Opportunity Cost**: Leadership decisions delayed 8 hours daily
- **Trust Damage**: 2 weeks of "data isn't ready" complaints
- **Engineering Time**: 120 hours (optimization sprint)
- **Total Impact**: ~$50k direct + immeasurable trust damage

**What We Built:**

- Comprehensive performance monitoring
- Automated alerts for slow models
- Query optimization patterns
- Pre-aggregation framework
- Incremental strategy templates
- Performance testing framework
- Team training on query optimization

**This incident taught us: Performance is not optional. Slow data is useless data. Optimize for scale from day one.**

---

### War Story 3: Data Freshness SLA Breach - The 6-Hour Data Delay

(Continuing with War Story 3 due to length...)

**Date**: December 2025
**Duration**: 6 hours and 47 minutes of stale data
**Impact**: Dashboards showing outdated metrics during critical board presentation
**Business Impact**: CEO presenting old numbers to board, embarrassment
**Customer Impact**: Real-time dashboards not real-time

#### The Nightmare Scenario

Thursday, 9:00 AM. CEO board presentation starting in 30 minutes.

CEO opened the exec dashboard to review latest metrics before the board meeting.

**Dashboard showed:**

- Last Updated: 2:14 AM (7 hours ago)
- MRR: $147,293
- New Customers (Dec): 1,847
- Churn Rate: 2.3%

**CEO called Buck directly:**

```
CEO: "Why is my dashboard from 2 AM? It's 9 AM. Where's the fresh data?"

Buck: "The daily dbt run should have completed at 4 AM. Let me check..."

Buck (looking at dbt Cloud): "Oh no. The run failed at 2:14 AM. It's been failing for 6 hours and nobody noticed."

CEO: "I have a board meeting in 30 minutes! I need current numbers!"

Buck: "I'm on it. Give me 15 minutes."
```

**The pressure was on.** Board meeting starting soon, CEO needs current data, and the pipeline is broken.

#### Investigation (Under 15-Minute Deadline)

**Step 1: Check dbt Cloud run status**

```
Last Run Status: FAILED
Started: 2:00:13 AM
Failed: 2:14:27 AM
Error: Database connection timeout after 5 minutes
```

**Database connection timeout?** That's new.

**Step 2: Check Snowflake**

```sql
-- Check warehouse status
show warehouses;
```

**Result:**

| Warehouse Name | State     | Size    | Running Queries |
| -------------- | --------- | ------- | --------------- |
| DBT_PROD       | SUSPENDED | X-Large | 0               |

**Warehouse was suspended?!**

Why? Snowflake auto-suspends warehouses after 10 minutes of inactivity to save costs. But dbt should auto-resume them.

**Step 3: Check Snowflake query history**

```sql
select
  query_text,
  warehouse_name,
  execution_status,
  error_message,
  start_time
from snowflake.account_usage.query_history
where start_time >= current_timestamp() - interval '8 hours'
and execution_status = 'FAILED'
order by start_time desc
limit 10;
```

**Result:**

```
Query: CREATE TABLE analytics.fct_revenue AS SELECT...
Warehouse: DBT_PROD
Status: FAILED
Error: Warehouse 'DBT_PROD' does not exist or not authorized
Time: 2:14:27 AM
```

**"Warehouse does not exist"?!**

**Step 4: Check Snowflake RBAC**

Someone changed the Snowflake permissions. The dbt service account lost access to the warehouse.

**Step 5: Check Slack #infrastructure**

```
[12:47 AM] Isabel: Cleaning up unused Snowflake resources to save costs
[12:48 AM] Isabel: Removed access from old service accounts
[12:49 AM] Isabel: Monthly savings: $4,200
```

**Isabel removed dbt's warehouse access as part of a cost-cutting cleanup!**

She didn't know which service accounts were "old" vs actively used.

#### The Root Cause

**Timeline:**

1. **12:47 AM**: Isabel cleaned up Snowflake permissions to save costs
2. **12:48 AM**: Accidentally revoked dbt service account's warehouse access
3. **2:00 AM**: Daily dbt run started (scheduled)
4. **2:14 AM**: dbt run failed (no warehouse access)
5. **2:14 AM - 9:00 AM**: 6 hours and 46 minutes of stale data
6. **9:00 AM**: CEO discovered stale data before board meeting
7. **9:15 AM**: Buck investigated and fixed (restored access)
8. **9:30 AM**: CEO presenting to board with 7-hour-old data

**Why we didn't catch it:**

1. ❌ No alerting on dbt run failures
2. ❌ No data freshness monitoring
3. ❌ No dashboard showing "last updated" prominently
4. ❌ No automated failover or retry logic
5. ❌ No coordination between Isabel and Buck on permission changes
6. ❌ Infrastructure changes not documented

#### Immediate Fix (14 Minutes!)

**Step 1: Restore warehouse access (2 minutes)**

```sql
-- Restore dbt service account access
GRANT USAGE ON WAREHOUSE DBT_PROD TO ROLE DBT_PROD_ROLE;
GRANT OPERATE ON WAREHOUSE DBT_PROD TO ROLE DBT_PROD_ROLE;
```

**Step 2: Manually trigger dbt run (12 minutes)**

```bash
# Trigger emergency dbt run
dbt run --select tag:critical  # Only critical models for speed

# Critical models:
# - fct_revenue
# - fct_mrr
# - fct_customers
# - dim_users
```

**12 minutes later: Fresh data ready!**

CEO presented to board at 9:32 AM (2 minutes late) with current data. Crisis averted.

#### Long-Term Solution

**1. Add Data Freshness Monitoring**

```yaml
# models/sources.yml

sources:
  - name: stripe
    database: raw
    schema: stripe
    tables:
      - name: charges
        freshness:
          warn_after: { count: 6, period: hour }
          error_after: { count: 12, period: hour }

  - name: postgres
    database: raw
    schema: postgres
    tables:
      - name: users
        freshness:
          warn_after: { count: 2, period: hour }
          error_after: { count: 6, period: hour }
```

**2. Add dbt Run Failure Alerting**

```python
# airflow/dags/dbt_alerting.py

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.dbt.cloud.hooks.dbt import DbtCloudHook
from airflow.providers.slack.operators.slack import SlackAPIPostOperator
import requests

def check_dbt_run_status():
    """Check dbt Cloud run status and alert on failure"""
    hook = DbtCloudHook(dbt_cloud_conn_id='dbt_cloud')

    # Get latest run
    runs = hook.list_runs(account_id=12345, limit=1)
    latest_run = runs[0]

    if latest_run['status'] == 'error' or latest_run['status'] == 'failed':
        # Alert to PagerDuty (critical)
        requests.post(
            'https://events.pagerduty.com/v2/enqueue',
            json={
                'routing_key': '...',
                'event_action': 'trigger',
                'payload': {
                    'summary': f'dbt Run Failed: {latest_run["id"]}',
                    'severity': 'critical',
                    'source': 'dbt_cloud',
                    'custom_details': {
                        'run_id': latest_run['id'],
                        'error': latest_run.get('status_message'),
                        'started_at': latest_run['started_at'],
                    }
                }
            }
        )

        # Alert to Slack
        message = f"""
🚨 *CRITICAL: dbt Run Failed* 🚨

Run ID: {latest_run['id']}
Status: {latest_run['status']}
Started: {latest_run['started_at']}
Error: {latest_run.get('status_message', 'Unknown error')}

Dashboard: https://cloud.getdbt.com/runs/{latest_run['id']}

@buck @data-team - Please investigate immediately!
        """

        return {'error': True, 'message': message}

    return {'error': False, 'message': 'dbt run successful'}

with DAG(
    'dbt_run_monitor',
    schedule_interval='*/15 * * * *',  # Every 15 minutes
    start_date=datetime(2026, 1, 1),
) as dag:

    check_status = PythonOperator(
        task_id='check_dbt_run_status',
        python_callable=check_dbt_run_status,
    )

    alert_on_failure = SlackAPIPostOperator(
        task_id='alert_slack',
        slack_conn_id='slack',
        channel='#data-alerts',
        text="{{ task_instance.xcom_pull(task_ids='check_dbt_run_status')['message'] }}",
        trigger_rule='all_done',
    )

    check_status >> alert_on_failure
```

**3. Add Dashboard Freshness Indicator**

```sql
-- models/monitoring/dashboard_freshness.sql

{{
  config(
    materialized='view',
    tags=['monitoring']
  )
}}

select
  'fct_revenue' as table_name,
  max(updated_at) as last_updated,
  current_timestamp() as checked_at,
  timestampdiff('minute', max(updated_at), current_timestamp()) as minutes_since_update,
  case
    when timestampdiff('minute', max(updated_at), current_timestamp()) > 360
      then 'STALE'  -- >6 hours old
    when timestampdiff('minute', max(updated_at), current_timestamp()) > 180
      then 'WARNING'  -- >3 hours old
    else 'FRESH'
  end as freshness_status
from {{ ref('fct_revenue') }}

union all

select
  'fct_mrr' as table_name,
  max(updated_at) as last_updated,
  current_timestamp() as checked_at,
  timestampdiff('minute', max(updated_at), current_timestamp()) as minutes_since_update,
  case
    when timestampdiff('minute', max(updated_at), current_timestamp()) > 360
      then 'STALE'
    when timestampdiff('minute', max(updated_at), current_timestamp()) > 180
      then 'WARNING'
    else 'FRESH'
  end as freshness_status
from {{ ref('fct_mrr') }}
```

**Display in Looker:**

```sql
-- Show freshness indicator on every dashboard

SELECT
  table_name,
  last_updated,
  freshness_status,
  CASE freshness_status
    WHEN 'FRESH' THEN '🟢 Fresh'
    WHEN 'WARNING' THEN '🟡 Warning'
    WHEN 'STALE' THEN '🔴 Stale'
  END as status_indicator
FROM analytics.dashboard_freshness
```

**4. Add Automated Failover**

```yaml
# dbt_project.yml

on-run-start:
  - "{{ check_warehouse_access() }}" # Check access before starting

on-run-end:
  - "{{ alert_on_failure() }}" # Alert if run fails
```

```sql
-- macros/check_warehouse_access.sql

{% macro check_warehouse_access() %}

{% set check_query %}
  SELECT current_warehouse() as warehouse
{% endset %}

{% set result = run_query(check_query) %}

{% if execute %}
  {% if result.rows|length == 0 %}
    {{ exceptions.raise_compiler_error("No warehouse access! Check permissions.") }}
  {% else %}
    {{ log("✅ Warehouse access confirmed: " ~ result.rows[0][0], info=True) }}
  {% endif %}
{% endif %}

{% endmacro %}
```

**5. Add Service Account Documentation**

```markdown
# Infrastructure Service Accounts

**CRITICAL: Never remove access without checking usage!**

## dbt Production

- **Account**: `dbt_prod_svc@petforce.com`
- **Role**: `DBT_PROD_ROLE`
- **Warehouse**: `DBT_PROD`
- **Usage**: Daily data pipeline (2 AM)
- **Owner**: Buck (Data Engineering)
- **Status**: ACTIVE - DO NOT REMOVE
- **Last Verified**: 2025-12-20

## Fivetran

- **Account**: `fivetran@petforce.com`
- **Role**: `FIVETRAN_ROLE`
- **Warehouse**: `LOADING`
- **Usage**: Continuous data ingestion
- **Owner**: Buck (Data Engineering)
- **Status**: ACTIVE - DO NOT REMOVE
- **Last Verified**: 2025-12-20

---

**Before removing any service account:**

1. Check with owner in table above
2. Verify account is truly inactive (check query history)
3. Document change in Slack #infrastructure
4. Monitor for 48 hours after removal
```

**6. Add Permission Change Review Process**

```yaml
# .github/workflows/snowflake-permission-review.yml

name: Snowflake Permission Review

on:
  pull_request:
    paths:
      - "infrastructure/snowflake/**"

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check for permission changes
        run: |
          # Scan for GRANT/REVOKE statements
          if git diff --name-only HEAD^ HEAD | xargs grep -l "REVOKE"; then
            echo "⚠️ Permission revocations detected!"
            echo "Please verify these service accounts are inactive:"
            git diff HEAD^ HEAD | grep "REVOKE"
            
            # Require explicit approval
            echo "Require: @buck-data-engineering approval"
            exit 1
          fi

      - name: Notify data team
        uses: slackapi/slack-github-action@v1
        with:
          channel-id: "#data-engineering"
          slack-message: |
            ⚠️ Snowflake permission changes in PR #${{ github.event.pull_request.number }}
            Please review: ${{ github.event.pull_request.html_url }}
```

**7. Add SLA Monitoring Dashboard**

```sql
-- models/monitoring/data_sla_metrics.sql

{{
  config(
    materialized='table',
    tags=['monitoring']
  )
}}

with sla_checks as (
  select
    'dbt_daily_run' as sla_name,
    '4:00 AM' as target_completion_time,
    max(finished_at) as actual_completion_time,
    case
      when max(finished_at) <= timestamp '4:00 AM' then 'MET'
      when max(finished_at) <= timestamp '6:00 AM' then 'WARNING'
      else 'BREACHED'
    end as sla_status,
    timestampdiff('minute',
      timestamp '4:00 AM',
      max(finished_at)
    ) as minutes_late
  from dbt_run_history
  where date(started_at) = current_date

  union all

  select
    'data_freshness_revenue' as sla_name,
    '< 2 hours old' as target_completion_time,
    max(updated_at) as actual_completion_time,
    case
      when timestampdiff('hour', max(updated_at), current_timestamp()) <= 2
        then 'MET'
      when timestampdiff('hour', max(updated_at), current_timestamp()) <= 6
        then 'WARNING'
      else 'BREACHED'
    end as sla_status,
    timestampdiff('minute', current_timestamp(), max(updated_at)) as minutes_late
  from fct_revenue
)

select
  sla_name,
  target_completion_time,
  actual_completion_time,
  sla_status,
  minutes_late,
  current_timestamp() as measured_at
from sla_checks
```

#### Complete Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  dbt Cloud Scheduler                            │
│  Schedule: Daily at 2:00 AM                                     │
│  Timeout: 2 hours                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            Pre-Run Checks (on-run-start)                        │
│  ✅ Check warehouse access                                      │
│  ✅ Check database connectivity                                 │
│  ✅ Verify service account permissions                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   dbt Run Execution                             │
│  - Staging models (15 min)                                      │
│  - Intermediate models (20 min)                                 │
│  - Marts models (12 min)                                        │
│  Total: 47 minutes                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            Post-Run Actions (on-run-end)                        │
│  ✅ Generate dbt docs                                           │
│  ✅ Update freshness metrics                                    │
│  ✅ Send success notification (Slack)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Monitoring & Alerting                              │
│                                                                 │
│  Every 15 minutes:                                              │
│  ✅ Check dbt run status                                        │
│  ✅ Check data freshness                                        │
│  ✅ Check SLA compliance                                        │
│                                                                 │
│  On failure:                                                    │
│  🚨 Alert PagerDuty (critical)                                  │
│  🚨 Alert Slack #data-alerts                                    │
│  🚨 Send email to @buck                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Dashboards (Looker)                             │
│  ✅ Freshness indicator on every page                           │
│  ✅ "Last Updated: 3:47 AM" displayed prominently               │
│  ✅ Color-coded status: 🟢 Fresh | 🟡 Warning | 🔴 Stale       │
└─────────────────────────────────────────────────────────────────┘
```

#### Results After Fix

**Immediate Impact:**

| Metric              | During Incident            | After Fix               | Improvement |
| ------------------- | -------------------------- | ----------------------- | ----------- |
| Data Delay          | 6h 47m                     | 0m                      | Real-time   |
| Alert Time          | N/A (no alerts)            | < 15 minutes            | Detection   |
| Fix Time            | 14 minutes (emergency)     | Automatic failover      | Prevention  |
| CEO Impact          | Embarrassing board meeting | Confident presentations | Trust       |
| Dashboard Freshness | Unknown                    | Color-coded indicator   | Visibility  |

**Long-Term Impact (Next 3 Months):**

- **Zero SLA breaches** (data fresh by 4 AM daily)
- **Average alert time: 11 minutes** (down from 6+ hours)
- **Zero permission issues** (documented service accounts)
- **100% uptime** for data pipeline
- **CEO confidence restored** (always has current data)

#### Lessons Learned

**1. Always Monitor Data Freshness**

```yaml
# ✅ Add freshness checks to sources
sources:
  - name: stripe
    tables:
      - name: charges
        freshness:
          warn_after: { count: 6, period: hour }
          error_after: { count: 12, period: hour }
```

**2. Alert on Pipeline Failures**

```python
# ✅ Monitor dbt run status every 15 minutes
def check_dbt_run():
    if latest_run.status == 'failed':
        alert_pagerduty("dbt run failed!")
```

**3. Display Freshness in Dashboards**

```sql
-- ✅ Show "Last Updated" prominently
SELECT
  '🟢 Fresh - Updated 3:47 AM' as status
WHERE data_age < 6 hours
```

**4. Document Service Accounts**

```markdown
# ✅ Never remove service accounts without verification

Account: dbt_prod_svc@petforce.com
Owner: Buck (Data Engineering)
Status: ACTIVE - DO NOT REMOVE
```

**5. Test Access Before Running**

```sql
-- ✅ Verify warehouse access before running pipeline
{% macro check_warehouse_access() %}
  SELECT current_warehouse() as warehouse
{% endmacro %}
```

**6. Add Automated Failover**

```yaml
# ✅ Retry logic in dbt Cloud
on-run-start:
  - "{{ check_and_retry_connection() }}"
```

**7. Coordinate Infrastructure Changes**

```yaml
# ✅ Require data team approval for permission changes
- name: Permission Change Review
  requires:
    - @buck-data-engineering
    - @isabel-infrastructure
```

#### Post-Mortem Action Items

**Completed:**

- ✅ Add data freshness monitoring (source level)
- ✅ Add dbt run failure alerting (PagerDuty + Slack)
- ✅ Add dashboard freshness indicators (color-coded)
- ✅ Document all service accounts with owners
- ✅ Add pre-run access verification checks
- ✅ Add automated failover logic
- ✅ Require approval for permission changes
- ✅ Create SLA monitoring dashboard
- ✅ Train team on alerting system

**Prevention:**

- ✅ Freshness checks required for all sources
- ✅ Alert within 15 minutes of any failure
- ✅ Display "Last Updated" on all dashboards
- ✅ Service account changes require data team approval
- ✅ Pre-run checks for all critical dependencies
- ✅ SLA metrics tracked and reviewed weekly
- ✅ Monthly pipeline health review

#### Key Takeaways

**The Three Laws of Data Freshness:**

1. **Always monitor freshness** - Alert when data is stale
2. **Always alert on failures** - Don't wait for users to notice
3. **Always show freshness** - Make data age visible to everyone

**Never Again:**

- No pipeline without failure alerting
- No dashboard without freshness indicator
- No service account without documentation
- No permission change without owner approval
- No pipeline without pre-run access checks
- No SLA without monitoring

**Cost of This Incident:**

- **Reputation Damage**: CEO presenting stale data to board
- **Trust Damage**: 6+ hours of unreliable dashboards
- **Engineering Time**: 40 hours (monitoring + documentation)
- **Opportunity Cost**: Leadership decisions delayed
- **Total Impact**: Immeasurable (reputation > everything)

**What We Built:**

- Comprehensive freshness monitoring
- Automated failure alerting (PagerDuty, Slack)
- Dashboard freshness indicators
- Service account documentation
- Permission change review process
- SLA monitoring dashboard
- Pre-run access verification

**This incident taught us: Data freshness is a feature. Stale data is worse than no data. Monitor, alert, and display freshness everywhere.**

---

## Key Data Engineering Principles

**From Three Major Incidents:**

1. **Data Quality Crisis**
   - Never trust your data source
   - Always deduplicate
   - Test primary keys
   - Reconcile with source system
   - Monitor data quality continuously

2. **Pipeline Performance**
   - Never use correlated subqueries
   - Always use incremental materialization
   - Cluster on filter/join columns
   - Monitor model execution time
   - Pre-aggregate when possible

3. **Data Freshness**
   - Always monitor data freshness
   - Alert on pipeline failures within 15 minutes
   - Display "Last Updated" on all dashboards
   - Document service accounts with owners
   - Require approval for permission changes

**Buck's Golden Rules:**

1. **Data Quality Over Speed** - Correct data is more valuable than fast data
2. **Test Everything** - Schema tests, data tests, business logic tests
3. **Monitor Continuously** - Data quality, performance, freshness
4. **Document Always** - Models, service accounts, decisions
5. **Incremental by Default** - Don't rebuild the world daily
6. **Freshness Matters** - Stale data is useless data
7. **Alert Immediately** - Don't wait for users to notice

**Built with precision by Buck (Data Engineering Agent) for PetForce.**

**Buck's Motto**: "Bad data is worse than no data. Build quality in from day one."
