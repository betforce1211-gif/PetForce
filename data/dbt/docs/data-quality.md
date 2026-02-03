# Data Quality Guide

**Owner**: Buck (Data Engineering Agent)
**Last Updated**: 2026-02-03

This guide provides comprehensive data quality testing and monitoring practices for PetForce.

---

## Table of Contents

1. [Data Quality Philosophy](#data-quality-philosophy)
2. [dbt Testing Framework](#dbt-testing-framework)
3. [Test Categories](#test-categories)
4. [Custom Tests](#custom-tests)
5. [Data Validation Patterns](#data-validation-patterns)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Incident Response](#incident-response)

---

## Data Quality Philosophy

### The Data Quality Pyramid

```
                    ┌─────────────────┐
                    │  Business Logic │ (Custom Tests)
                    │   "Revenue > 0" │
                    └─────────────────┘
                           ▲
                ┌──────────┴──────────┐
                │   Referential       │ (Relationship Tests)
                │   Integrity         │
                └─────────────────────┘
                           ▲
              ┌────────────┴────────────┐
              │   Data Completeness     │ (Not Null Tests)
              └─────────────────────────┘
                           ▲
            ┌──────────────┴──────────────┐
            │     Data Uniqueness         │ (Unique Tests)
            └─────────────────────────────┘
                           ▲
       ┌───────────────────┴───────────────────┐
       │        Schema Validation              │ (Type Tests)
       └───────────────────────────────────────┘
```

**Test at Every Layer**:

1. **Schema** - Are columns the right data type?
2. **Uniqueness** - Are primary keys unique?
3. **Completeness** - Are required fields populated?
4. **Referential Integrity** - Do foreign keys exist in parent tables?
5. **Business Logic** - Do values make business sense?

### The Cost of Bad Data

**Example: Bad email causes $10,000 in wasted marketing spend**:

```sql
-- Bad data: Invalid email
INSERT INTO users VALUES ('u_123', 'john.doe@gmail,com');  -- Comma instead of dot

-- Marketing campaign sends to invalid email
-- $0.10 per email × 100,000 users = $10,000 wasted
-- But only 99,999 valid emails (1 bounced)
-- Customer support tickets: "Why didn't I get the email?"
-- Lost revenue from customer who couldn't access promo code
```

**Prevention**:

```yaml
# tests/schema.yml
models:
  - name: stg_users
    columns:
      - name: email
        tests:
          - not_null
          - unique
          - dbt_expectations.expect_column_values_to_match_regex:
              regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
```

---

## dbt Testing Framework

### Built-In Tests

**1. Unique Test**:

```yaml
models:
  - name: stg_households
    columns:
      - name: household_id
        tests:
          - unique
```

**Generated SQL**:

```sql
SELECT
  household_id,
  COUNT(*) AS n_records
FROM analytics.stg_households
GROUP BY household_id
HAVING COUNT(*) > 1
```

**2. Not Null Test**:

```yaml
models:
  - name: stg_households
    columns:
      - name: household_name
        tests:
          - not_null
```

**Generated SQL**:

```sql
SELECT *
FROM analytics.stg_households
WHERE household_name IS NULL
```

**3. Accepted Values Test**:

```yaml
models:
  - name: stg_subscriptions
    columns:
      - name: subscription_plan
        tests:
          - accepted_values:
              values: ["Free", "Premium", "Enterprise"]
```

**Generated SQL**:

```sql
SELECT *
FROM analytics.stg_subscriptions
WHERE subscription_plan NOT IN ('Free', 'Premium', 'Enterprise')
```

**4. Relationships Test**:

```yaml
models:
  - name: stg_tasks
    columns:
      - name: household_id
        tests:
          - relationships:
              to: ref('stg_households')
              field: household_id
```

**Generated SQL**:

```sql
SELECT *
FROM analytics.stg_tasks
WHERE household_id NOT IN (
  SELECT household_id FROM analytics.stg_households
)
```

### Running Tests

```bash
# Run all tests
dbt test

# Run tests for specific model
dbt test --select stg_households

# Run tests for specific tag
dbt test --select tag:critical

# Run specific test
dbt test --select test_name:unique_stg_households_household_id

# Fail on warnings (treat warnings as errors)
dbt test --warn-error

# Store test results
dbt test --store-failures
```

---

## Test Categories

### Critical vs Non-Critical Tests

**Critical Tests** (must pass):

```yaml
models:
  - name: fct_revenue
    tests:
      - dbt_utils.expression_is_true:
          expression: "revenue >= 0"
          config:
            severity: error # Fail build if test fails
            tags: ["critical"]

    columns:
      - name: revenue_id
        tests:
          - unique:
              config:
                severity: error
                tags: ["critical"]
          - not_null:
              config:
                severity: error
                tags: ["critical"]
```

**Non-Critical Tests** (warn only):

```yaml
models:
  - name: stg_users
    columns:
      - name: phone_number
        tests:
          - not_null:
              config:
                severity: warn # Don't fail build, just warn
                tags: ["data-quality"]
```

### Test Execution Strategy

```yaml
# dbt_project.yml
tests:
  petforce:
    # Critical tests always error
    +severity: error
    +tags: ["critical"]

    # Data quality tests warn
    data_quality:
      +severity: warn
      +tags: ["data-quality"]
```

**Run Critical Tests in CI/CD**:

```bash
# In CI pipeline, only fail on critical tests
dbt test --select tag:critical
```

---

## Custom Tests

### Generic Tests (Reusable)

**tests/generic/test_not_null_where.sql**:

```sql
{% test not_null_where(model, column_name, where_clause) %}

SELECT *
FROM {{ model }}
WHERE {{ column_name }} IS NULL
  AND {{ where_clause }}

{% endtest %}
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

**Another Example - test_row_count_between.sql**:

```sql
{% test row_count_between(model, min_value, max_value) %}

WITH row_count AS (
  SELECT COUNT(*) AS n_rows
  FROM {{ model }}
)

SELECT *
FROM row_count
WHERE n_rows < {{ min_value }}
   OR n_rows > {{ max_value }}

{% endtest %}
```

**Usage**:

```yaml
models:
  - name: fct_daily_metrics
    tests:
      - row_count_between:
          min_value: 1
          max_value: 10000
```

### Singular Tests (One-Off)

**tests/assert_positive_revenue.sql**:

```sql
-- Tests that all revenue is positive
SELECT
  household_id,
  revenue_date,
  SUM(revenue) AS total_revenue
FROM {{ ref('fct_household_revenue') }}
GROUP BY household_id, revenue_date
HAVING SUM(revenue) < 0
```

**tests/assert_no_future_dates.sql**:

```sql
-- Tests that no dates are in the future
SELECT *
FROM {{ ref('fct_task_completions') }}
WHERE completed_at > CURRENT_TIMESTAMP
```

**tests/assert_retention_cohort_logic.sql**:

```sql
-- Tests that retention cohort logic is correct
WITH expected AS (
  SELECT
    cohort_month,
    month_number,
    CASE
      WHEN month_number = 0 THEN 1.0  -- 100% in month 0
      WHEN month_number = 1 THEN 0.6  -- 60% in month 1
      WHEN month_number = 2 THEN 0.4  -- 40% in month 2
      ELSE 0.3
    END AS expected_min_retention
  FROM {{ ref('fct_retention_cohorts') }}
),

actual AS (
  SELECT
    cohort_month,
    month_number,
    retention_rate
  FROM {{ ref('fct_retention_cohorts') }}
)

SELECT
  e.cohort_month,
  e.month_number,
  a.retention_rate,
  e.expected_min_retention
FROM expected e
JOIN actual a
  ON e.cohort_month = a.cohort_month
  AND e.month_number = a.month_number
WHERE a.retention_rate < e.expected_min_retention
```

---

## Data Validation Patterns

### Pattern 1: Cross-Model Consistency

**Ensure aggregations match between models**.

**tests/assert_revenue_consistency.sql**:

```sql
-- Revenue in fct_daily_revenue should equal sum of fct_transactions
WITH daily_revenue AS (
  SELECT
    revenue_date,
    SUM(revenue) AS total_revenue
  FROM {{ ref('fct_daily_revenue') }}
  GROUP BY revenue_date
),

transaction_revenue AS (
  SELECT
    DATE(transaction_timestamp) AS revenue_date,
    SUM(amount) AS total_revenue
  FROM {{ ref('fct_transactions') }}
  GROUP BY DATE(transaction_timestamp)
)

SELECT
  d.revenue_date,
  d.total_revenue AS daily_revenue,
  t.total_revenue AS transaction_revenue,
  ABS(d.total_revenue - t.total_revenue) AS difference
FROM daily_revenue d
FULL OUTER JOIN transaction_revenue t ON d.revenue_date = t.revenue_date
WHERE ABS(COALESCE(d.total_revenue, 0) - COALESCE(t.total_revenue, 0)) > 0.01  -- Allow 1 cent rounding error
```

### Pattern 2: Historical Consistency

**Ensure historical data doesn't change unexpectedly**.

**tests/assert_historical_stability.sql**:

```sql
-- Test that old data hasn't changed
-- (Important for incremental models)

WITH yesterday AS (
  SELECT COUNT(*) AS row_count
  FROM {{ ref('fct_daily_metrics') }}
  WHERE metric_date = CURRENT_DATE - INTERVAL '1 day'
),

today AS (
  SELECT COUNT(*) AS row_count
  FROM {{ ref('fct_daily_metrics') }}
  WHERE metric_date = CURRENT_DATE - INTERVAL '1 day'
)

SELECT
  y.row_count AS yesterday_count,
  t.row_count AS today_count,
  ABS(y.row_count - t.row_count) AS difference
FROM yesterday y
CROSS JOIN today t
WHERE y.row_count != t.row_count
```

### Pattern 3: Completeness Checks

**Ensure all expected records are present**.

**tests/assert_daily_metrics_complete.sql**:

```sql
-- Test that we have metrics for every day in the last 30 days
WITH expected_dates AS (
  SELECT DATE(date_day) AS expected_date
  FROM {{ ref('dim_date') }}
  WHERE date_day >= CURRENT_DATE - INTERVAL '30 days'
    AND date_day < CURRENT_DATE
),

actual_dates AS (
  SELECT DISTINCT metric_date AS actual_date
  FROM {{ ref('fct_daily_metrics') }}
  WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
)

SELECT e.expected_date
FROM expected_dates e
LEFT JOIN actual_dates a ON e.expected_date = a.actual_date
WHERE a.actual_date IS NULL
```

### Pattern 4: Anomaly Detection

**Detect unusual values**.

**tests/assert_no_anomalies_revenue.sql**:

```sql
-- Test that daily revenue isn't more than 3 standard deviations from mean
WITH revenue_stats AS (
  SELECT
    AVG(daily_revenue) AS mean_revenue,
    STDDEV(daily_revenue) AS stddev_revenue
  FROM {{ ref('fct_daily_revenue') }}
  WHERE revenue_date >= CURRENT_DATE - INTERVAL '90 days'
    AND revenue_date < CURRENT_DATE  -- Exclude today (incomplete)
),

recent_revenue AS (
  SELECT
    revenue_date,
    daily_revenue
  FROM {{ ref('fct_daily_revenue') }}
  WHERE revenue_date >= CURRENT_DATE - INTERVAL '7 days'
)

SELECT
  r.revenue_date,
  r.daily_revenue,
  s.mean_revenue,
  s.stddev_revenue,
  ABS(r.daily_revenue - s.mean_revenue) / s.stddev_revenue AS z_score
FROM recent_revenue r
CROSS JOIN revenue_stats s
WHERE ABS(r.daily_revenue - s.mean_revenue) > 3 * s.stddev_revenue
```

### Pattern 5: dbt Expectations

**Use dbt-expectations package for advanced tests**.

**Install**:

```yaml
# packages.yml
packages:
  - package: calogica/dbt_expectations
    version: 0.10.0
```

**Usage**:

```yaml
models:
  - name: fct_task_completions
    tests:
      # Row count in range
      - dbt_expectations.expect_table_row_count_to_be_between:
          min_value: 100
          max_value: 1000000

      # No duplicate combinations
      - dbt_expectations.expect_compound_columns_to_be_unique:
          column_list: ["household_id", "task_id", "completed_at"]

    columns:
      - name: task_duration_minutes
        tests:
          # Value in range
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              max_value: 1440 # 24 hours

          # No negative durations
          - dbt_expectations.expect_column_values_to_be_in_type_list:
              column_type_list: ["number", "integer", "float"]

      - name: email
        tests:
          # Regex pattern match
          - dbt_expectations.expect_column_values_to_match_regex:
              regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"

      - name: created_at
        tests:
          # No future dates
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: "'1970-01-01'"
              max_value: "current_date"

      - name: household_id
        tests:
          # All values exist in parent table
          - dbt_expectations.expect_column_values_to_be_in_set:
              value_set:
                - query: "SELECT household_id FROM {{ ref('dim_households') }}"
```

---

## Monitoring & Alerting

### Source Freshness Monitoring

**models/staging/\_sources.yml**:

```yaml
version: 2

sources:
  - name: petforce
    description: PetForce production database
    database: petforce_production
    schema: public

    # Default freshness (applies to all tables)
    freshness:
      warn_after: { count: 12, period: hour }
      error_after: { count: 24, period: hour }

    loaded_at_field: _ingested_at

    tables:
      # Critical tables (stricter freshness)
      - name: households
        freshness:
          warn_after: { count: 6, period: hour }
          error_after: { count: 12, period: hour }

      - name: users
        freshness:
          warn_after: { count: 6, period: hour }
          error_after: { count: 12, period: hour }

      # Non-critical tables (relaxed freshness)
      - name: activity_logs
        freshness:
          warn_after: { count: 24, period: hour }
          error_after: { count: 48, period: hour }
```

**Check Freshness**:

```bash
# Check all sources
dbt source freshness

# Check specific source
dbt source freshness --select source:petforce

# Output:
# 1 of 3 WARN freshness of petforce.households (8 hours old)
# 2 of 3 PASS freshness of petforce.users (2 hours old)
# 3 of 3 ERROR freshness of petforce.activity_logs (36 hours old)
```

### Test Result Monitoring

**Store test failures**:

```yaml
# dbt_project.yml
tests:
  +store_failures: true
  +store_failures_as: table
  +schema: test_failures
```

**Query test failures**:

```sql
-- View recent test failures
SELECT
  test_name,
  model_name,
  column_name,
  COUNT(*) AS failure_count,
  MAX(run_started_at) AS last_failure
FROM test_failures.unique_stg_households_household_id
GROUP BY test_name, model_name, column_name
ORDER BY last_failure DESC
```

### Alerting Setup

**Slack Alerts via Airflow**:

```python
from airflow.providers.slack.operators.slack_webhook import SlackWebhookOperator

# After dbt test task
slack_alert = SlackWebhookOperator(
    task_id='slack_test_failures',
    http_conn_id='slack_webhook',
    message="""
    ❌ dbt test failures detected!

    Failed tests: {{ ti.xcom_pull(task_ids='dbt_test', key='failed_tests') }}

    View details: {{ ti.xcom_pull(task_ids='dbt_test', key='log_url') }}
    """,
    channel='#data-quality',
    trigger_rule='one_failed',
)
```

**PagerDuty Alerts for Critical Failures**:

```python
from airflow.providers.pagerduty.operators.pagerduty import PagerDutyCreateEventOperator

# Critical test failure
pagerduty_alert = PagerDutyCreateEventOperator(
    task_id='pagerduty_critical_failure',
    integration_key='{{ var.value.pagerduty_integration_key }}',
    summary='Critical dbt test failure',
    severity='critical',
    source='Airflow - dbt pipeline',
    action='trigger',
    trigger_rule='one_failed',
)
```

### Monitoring Dashboard

**Looker/Metabase Dashboard**:

```sql
-- Test Failure Rate Over Time
SELECT
  DATE(run_started_at) AS test_date,
  COUNT(*) AS total_tests,
  SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) AS failed_tests,
  ROUND(100.0 * SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) / COUNT(*), 2) AS failure_rate
FROM dbt_run_results.test_results
WHERE run_started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(run_started_at)
ORDER BY test_date DESC
```

**Freshness Over Time**:

```sql
SELECT
  source_name,
  table_name,
  MAX(max_loaded_at) AS last_loaded_at,
  DATEDIFF('hour', MAX(max_loaded_at), CURRENT_TIMESTAMP) AS hours_since_load
FROM dbt_run_results.source_freshness_results
GROUP BY source_name, table_name
ORDER BY hours_since_load DESC
```

---

## Incident Response

### Runbook: Test Failure

**Scenario**: Critical test fails during production run.

**1. Triage (5 minutes)**:

```bash
# Identify failing test
dbt test --select tag:critical

# Output:
# FAIL 1 unique_stg_households_household_id ...................... [FAIL 5 in 0.23s]
```

**2. Investigate (10 minutes)**:

```sql
-- Query stored failures
SELECT *
FROM test_failures.unique_stg_households_household_id
LIMIT 100;

-- Result:
-- household_id | n_records
-- h_abc123     | 2  (duplicate!)
```

**3. Root Cause Analysis**:

```sql
-- Find duplicates in source
SELECT
  household_id,
  COUNT(*) AS n_records,
  STRING_AGG(id::TEXT, ', ') AS duplicate_ids
FROM petforce.households
GROUP BY household_id
HAVING COUNT(*) > 1;

-- Cause: Application bug created duplicate household_id
```

**4. Fix**:

```sql
-- Option 1: Deduplicate in staging model
-- stg_households.sql
WITH source AS (
  SELECT * FROM {{ source('petforce', 'households') }}
),

deduped AS (
  SELECT *
  FROM (
    SELECT
      *,
      ROW_NUMBER() OVER (PARTITION BY household_id ORDER BY updated_at DESC) AS rn
    FROM source
  )
  WHERE rn = 1
)

SELECT * FROM deduped
```

**5. Prevent**:

```yaml
# Add source test
sources:
  - name: petforce
    tables:
      - name: households
        columns:
          - name: household_id
            tests:
              - unique # Test source data
```

**6. Document**:

```markdown
# Incident Report: Duplicate Household IDs

**Date**: 2026-02-03
**Severity**: P1 (High)
**Duration**: 45 minutes

**What Happened**:

- dbt test failed on unique_stg_households_household_id
- 5 duplicate household_id values found

**Root Cause**:

- Application bug in household creation endpoint
- Race condition allowed duplicate IDs

**Resolution**:

- Added deduplication logic to stg_households
- Fixed application bug
- Added source-level unique test

**Prevention**:

- Application-level unique constraint on database
- Pre-deployment integration tests
```

---

**Related Documentation**:

- [Data Engineering Guide](./README.md)
- [Data Modeling Guide](./data-modeling.md)
- [Analytics Dashboards](../../docs/analytics/dashboards.md)
