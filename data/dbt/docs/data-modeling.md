# Data Modeling Best Practices

**Owner**: Buck (Data Engineering Agent)
**Last Updated**: 2026-02-03

This guide provides comprehensive data modeling patterns for PetForce analytics.

---

## Table of Contents

1. [Dimensional Modeling Fundamentals](#dimensional-modeling-fundamentals)
2. [Fact Table Design](#fact-table-design)
3. [Dimension Table Design](#dimension-table-design)
4. [Slowly Changing Dimensions](#slowly-changing-dimensions)
5. [Advanced Patterns](#advanced-patterns)
6. [Anti-Patterns](#anti-patterns)

---

## Dimensional Modeling Fundamentals

### Star Schema Architecture

```
              ┌──────────────────┐
              │   dim_date       │
              │ (Date dimension) │
              └─────────┬────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
┌────────▼────────┐     │     ┌────────▼────────┐
│  dim_households │     │     │   dim_users     │
│  (Who)          │     │     │   (Who)         │
└────────┬────────┘     │     └────────┬────────┘
         │              │              │
         │    ┌─────────▼──────────┐   │
         └───>│                    │<──┘
              │  fct_task_         │
              │  completions       │
              │  (Fact Table)      │
              │                    │
         ┌───>│                    │<──┐
         │    └─────────▲──────────┘   │
         │              │              │
         │              │              │
┌────────┴────────┐     │     ┌────────┴────────┐
│    dim_pets     │     │     │  dim_task_types │
│    (What)       │     │     │  (What)         │
└─────────────────┘     │     └─────────────────┘
                        │
              ┌─────────┴────────┐
              │   dim_location   │
              │   (Where)        │
              └──────────────────┘
```

**Why Star Schema?**

- **Simple** - Easy to understand and query
- **Fast** - Optimized for aggregations
- **Flexible** - Add dimensions without changing fact table
- **BI Tool Friendly** - Looker, Tableau, Metabase work best with star schemas

### Fact vs Dimension

**Fact Table** (measurements, events):

- Many rows (millions to billions)
- Narrow (few columns)
- Foreign keys + metrics
- Immutable events or aggregated snapshots

**Dimension Table** (context, attributes):

- Fewer rows (thousands to millions)
- Wide (many columns)
- Descriptive attributes
- Can change over time (slowly changing dimensions)

---

## Fact Table Design

### Transaction Fact Tables

**One row per event** (immutable, append-only).

**Example: fct_task_completions.sql**:

```sql
{{
  config(
    materialized='incremental',
    unique_key='task_completion_id',
    partition_by={'field': 'completed_at', 'data_type': 'timestamp'},
    cluster_by=['household_id', 'user_id']
  )
}}

WITH tasks AS (
  SELECT * FROM {{ ref('stg_tasks') }}
  WHERE completed_at IS NOT NULL
),

enriched AS (
  SELECT
    -- Surrogate key
    {{ dbt_utils.generate_surrogate_key(['task_id', 'completed_at']) }} AS task_completion_id,

    -- Foreign keys to dimensions
    t.household_id,
    t.user_id,
    t.pet_id,
    t.task_type_id,
    DATE(t.completed_at) AS completion_date_id,  -- Join to dim_date

    -- Degenerate dimensions (low cardinality attributes stored in fact)
    t.task_name,
    t.priority,

    -- Metrics (additive)
    t.task_duration_minutes,
    t.points_earned,
    t.quality_score,

    -- Timestamps
    t.completed_at,
    t.created_at

  FROM tasks t

  {% if is_incremental() %}
    WHERE t.completed_at > (SELECT MAX(completed_at) FROM {{ this }})
  {% endif %}
)

SELECT * FROM enriched
```

**Key Characteristics**:

- **Grain**: One row per task completion
- **Additive Metrics**: Can sum across all dimensions (SUM, AVG)
- **Immutable**: Never update, only insert
- **Incremental**: Only process new completions

### Periodic Snapshot Fact Tables

**One row per time period** (daily, weekly, monthly aggregations).

**Example: fct_household_daily_metrics.sql**:

```sql
{{
  config(
    materialized='incremental',
    unique_key=['household_id', 'metric_date'],
    partition_by={'field': 'metric_date', 'data_type': 'date'},
    cluster_by=['household_id']
  )
}}

WITH daily_activity AS (
  SELECT
    household_id,
    DATE(activity_timestamp) AS metric_date,
    COUNT(*) AS total_activities,
    COUNT(DISTINCT user_id) AS active_users,
    COUNT(DISTINCT CASE WHEN activity_type = 'task_completion' THEN activity_id END) AS tasks_completed
  FROM {{ ref('stg_activity_logs') }}

  {% if is_incremental() %}
    WHERE DATE(activity_timestamp) > (SELECT MAX(metric_date) FROM {{ this }})
  {% endif %}

  GROUP BY household_id, DATE(activity_timestamp)
),

household_state AS (
  SELECT
    household_id,
    metric_date,
    member_count,
    pet_count,
    subscription_plan,
    subscription_mrr
  FROM {{ ref('int_household_daily_snapshots') }}

  {% if is_incremental() %}
    WHERE metric_date > (SELECT MAX(metric_date) FROM {{ this }})
  {% endif %}
),

final AS (
  SELECT
    h.household_id,
    h.metric_date,

    -- Semi-additive (can't sum across time)
    h.member_count,
    h.pet_count,
    h.subscription_mrr,

    -- Additive (can sum)
    COALESCE(a.total_activities, 0) AS total_activities,
    COALESCE(a.active_users, 0) AS active_users,
    COALESCE(a.tasks_completed, 0) AS tasks_completed,

    -- Derived metrics
    CASE
      WHEN COALESCE(a.total_activities, 0) = 0 THEN 'Inactive'
      WHEN COALESCE(a.total_activities, 0) < 5 THEN 'Low Activity'
      WHEN COALESCE(a.total_activities, 0) < 20 THEN 'Medium Activity'
      ELSE 'High Activity'
    END AS activity_level

  FROM household_state h
  LEFT JOIN daily_activity a
    ON h.household_id = a.household_id
    AND h.metric_date = a.metric_date
)

SELECT * FROM final
```

**Key Characteristics**:

- **Grain**: One row per household per day
- **Semi-Additive Metrics**: Can sum across households, NOT across time (member_count, mrr)
- **Snapshot**: Captures state at end of day
- **Incremental**: Only process new days

### Accumulating Snapshot Fact Tables

**One row per entity, updated as it progresses through stages**.

**Example: fct_household_lifecycle.sql**:

```sql
{{
  config(
    materialized='table',  -- Full refresh (updates existing rows)
    unique_key='household_id'
  )
}}

WITH households AS (
  SELECT * FROM {{ ref('stg_households') }}
),

first_task AS (
  SELECT
    household_id,
    MIN(completed_at) AS first_task_completed_at
  FROM {{ ref('stg_tasks') }}
  WHERE completed_at IS NOT NULL
  GROUP BY household_id
),

first_upgrade AS (
  SELECT
    household_id,
    MIN(upgraded_at) AS first_upgraded_at
  FROM {{ ref('stg_subscriptions') }}
  WHERE subscription_plan != 'Free'
  GROUP BY household_id
),

first_churn AS (
  SELECT
    household_id,
    MIN(churned_at) AS first_churned_at
  FROM {{ ref('stg_subscriptions') }}
  WHERE status = 'churned'
  GROUP BY household_id
),

final AS (
  SELECT
    h.household_id,

    -- Stage 1: Created
    h.created_at,
    DATE(h.created_at) AS created_date_id,

    -- Stage 2: First Task Completed (activation)
    t.first_task_completed_at,
    DATE(t.first_task_completed_at) AS first_task_date_id,
    DATEDIFF('day', h.created_at, t.first_task_completed_at) AS days_to_first_task,

    -- Stage 3: First Upgrade (monetization)
    u.first_upgraded_at,
    DATE(u.first_upgraded_at) AS first_upgrade_date_id,
    DATEDIFF('day', h.created_at, u.first_upgraded_at) AS days_to_upgrade,

    -- Stage 4: First Churn
    c.first_churned_at,
    DATE(c.first_churned_at) AS first_churn_date_id,
    DATEDIFF('day', u.first_upgraded_at, c.first_churned_at) AS days_to_churn,

    -- Lifecycle stage
    CASE
      WHEN c.first_churned_at IS NOT NULL THEN 'Churned'
      WHEN u.first_upgraded_at IS NOT NULL THEN 'Paying Customer'
      WHEN t.first_task_completed_at IS NOT NULL THEN 'Activated'
      ELSE 'Registered'
    END AS current_lifecycle_stage

  FROM households h
  LEFT JOIN first_task t ON h.household_id = t.household_id
  LEFT JOIN first_upgrade u ON h.household_id = u.household_id
  LEFT JOIN first_churn c ON h.household_id = c.household_id
)

SELECT * FROM final
```

**Key Characteristics**:

- **Grain**: One row per household (updated as it progresses)
- **Multiple Date Stamps**: Tracks progress through stages
- **Duration Metrics**: Time between stages (days_to_first_task, days_to_upgrade)
- **Current State**: Current lifecycle stage
- **Not Incremental**: Full refresh (need to update existing rows)

---

## Dimension Table Design

### Conformed Dimensions

**Shared across multiple fact tables** (dim_households, dim_users, dim_date).

**Example: dim_households.sql**:

```sql
{{
  config(
    materialized='table'
  )
}}

WITH households AS (
  SELECT * FROM {{ ref('int_households_enriched') }}
),

latest_activity AS (
  SELECT
    household_id,
    MAX(activity_timestamp) AS last_activity_at
  FROM {{ ref('stg_activity_logs') }}
  GROUP BY household_id
),

subscription_info AS (
  SELECT
    household_id,
    subscription_plan,
    subscription_status,
    subscription_mrr,
    subscription_started_at
  FROM {{ ref('int_subscriptions_current') }}
),

final AS (
  SELECT
    -- Primary key
    h.household_id,

    -- Attributes
    h.household_name,
    h.invite_code,
    h.owner_user_id,

    -- Counts
    h.member_count,
    h.pet_count,
    h.dog_count,
    h.cat_count,

    -- Subscription
    COALESCE(s.subscription_plan, 'Free') AS subscription_plan,
    COALESCE(s.subscription_status, 'Active') AS subscription_status,
    COALESCE(s.subscription_mrr, 0) AS subscription_mrr,
    s.subscription_started_at,

    -- Activity
    a.last_activity_at,
    DATEDIFF('day', a.last_activity_at, CURRENT_TIMESTAMP) AS days_since_last_activity,

    -- Flags
    CASE WHEN a.last_activity_at >= CURRENT_DATE - INTERVAL '30 days' THEN TRUE ELSE FALSE END AS is_active_30d,
    CASE WHEN h.member_count >= 3 THEN TRUE ELSE FALSE END AS is_multi_member,
    CASE WHEN h.pet_count >= 3 THEN TRUE ELSE FALSE END AS is_multi_pet,

    -- Categories
    CASE
      WHEN h.pet_count = 0 THEN 'No Pets'
      WHEN h.pet_count = 1 THEN '1 Pet'
      WHEN h.pet_count <= 3 THEN '2-3 Pets'
      WHEN h.pet_count <= 5 THEN '4-5 Pets'
      ELSE '6+ Pets'
    END AS pet_count_bucket,

    -- Timestamps
    h.created_at AS household_created_at,
    h.updated_at AS household_updated_at

  FROM households h
  LEFT JOIN latest_activity a ON h.household_id = a.household_id
  LEFT JOIN subscription_info s ON h.household_id = s.household_id
)

SELECT * FROM final
```

**Key Characteristics**:

- **Descriptive Attributes** - Name, plan, status
- **Derived Attributes** - Flags, categories, buckets
- **Current State** - Always reflects current state (no history)
- **Denormalized** - Pre-joined for query performance

### Junk Dimensions

**Low-cardinality flags and indicators** (avoid sparse fact tables).

**Example: dim_task_attributes.sql**:

```sql
{{
  config(
    materialized='table'
  )
}}

WITH attribute_combinations AS (
  SELECT DISTINCT
    priority,
    difficulty,
    is_recurring,
    requires_photo,
    is_team_task
  FROM {{ ref('stg_tasks') }}
)

SELECT
  {{ dbt_utils.generate_surrogate_key([
    'priority',
    'difficulty',
    'is_recurring',
    'requires_photo',
    'is_team_task'
  ]) }} AS task_attribute_id,

  priority,
  difficulty,
  is_recurring,
  requires_photo,
  is_team_task,

  -- Derived flags
  CASE
    WHEN priority = 'High' AND difficulty = 'Hard' THEN TRUE
    ELSE FALSE
  END AS is_challenging_task

FROM attribute_combinations
```

**Usage in Fact Table**:

```sql
-- fct_task_completions.sql
SELECT
  task_completion_id,
  household_id,
  user_id,

  -- Junk dimension instead of 5 separate columns
  {{ dbt_utils.generate_surrogate_key([
    'priority',
    'difficulty',
    'is_recurring',
    'requires_photo',
    'is_team_task'
  ]) }} AS task_attribute_id,

  task_duration_minutes,
  points_earned

FROM ...
```

**Benefits**:

- Reduces fact table width
- Groups related attributes
- Easier to add new attributes

---

## Slowly Changing Dimensions

### Type 0 (No Changes)

**Never changes** (e.g., birth date, original creation date).

```sql
SELECT
  user_id,
  birth_date,  -- Never changes
  account_created_at  -- Never changes
FROM ...
```

### Type 1 (Overwrite)

**Update in place, no history**.

```sql
-- dim_users.sql (Type 1)
SELECT
  user_id,
  email,           -- Overwrites on change
  phone_number,    -- Overwrites on change
  display_name     -- Overwrites on change
FROM {{ ref('stg_users') }}
```

**Use Case**: Attributes where history doesn't matter (email corrections, typos).

### Type 2 (Add Row with History)

**Add new row for each change, track effective dates**.

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

SELECT
  household_id,
  household_name,
  subscription_plan,
  subscription_mrr,
  updated_at
FROM {{ source('petforce', 'households') }}

{% endsnapshot %}
```

**Result**:

```sql
SELECT * FROM snapshots.snap_households
WHERE household_id = 'h_abc123'
ORDER BY dbt_valid_from

-- household_id | subscription_plan | dbt_valid_from | dbt_valid_to | dbt_is_current
-- h_abc123     | Free              | 2025-01-01     | 2025-06-01   | FALSE
-- h_abc123     | Premium           | 2025-06-01     | 2026-01-01   | FALSE
-- h_abc123     | Enterprise        | 2026-01-01     | NULL         | TRUE
```

**Query Historical Data**:

```sql
-- What was household's plan on a specific date?
SELECT
  household_id,
  subscription_plan
FROM snapshots.snap_households
WHERE household_id = 'h_abc123'
  AND '2025-08-15' BETWEEN dbt_valid_from AND COALESCE(dbt_valid_to, '9999-12-31')

-- Result: Premium
```

**Use Case**: Subscription plan changes, status changes (need historical analysis).

### Type 3 (Add Column for Previous Value)

**Store current + previous value**.

```sql
SELECT
  household_id,
  current_plan,
  previous_plan,
  plan_changed_at
FROM ...
```

**Use Case**: Limited history (only need "current" and "previous").

### Type 4 (Mini-Dimension)

**Separate rapidly changing attributes into a mini-dimension**.

**dim_users.sql** (slowly changing):

```sql
SELECT
  user_id,
  email,
  display_name,
  created_at
FROM ...
```

**dim_user_profile.sql** (rapidly changing):

```sql
SELECT
  user_profile_id,
  user_id,
  profile_picture_url,  -- Changes frequently
  bio,                  -- Changes frequently
  status,               -- Changes frequently
  last_updated_at
FROM ...
```

**Use Case**: Avoid bloating main dimension with frequent changes.

---

## Advanced Patterns

### Role-Playing Dimensions

**Same dimension used multiple times in a fact table**.

**Example: dim_date used for multiple dates**:

```sql
-- fct_task_completions.sql
SELECT
  task_completion_id,
  household_id,

  -- Role-playing dimension (same dim_date table, different roles)
  DATE(created_at) AS created_date_id,
  DATE(started_at) AS started_date_id,
  DATE(completed_at) AS completed_date_id,

  task_duration_minutes
FROM ...
```

**Query**:

```sql
SELECT
  created_date.year AS created_year,
  completed_date.month AS completed_month,
  COUNT(*) AS task_count
FROM fct_task_completions f
JOIN dim_date AS created_date ON f.created_date_id = created_date.date_id
JOIN dim_date AS completed_date ON f.completed_date_id = completed_date.date_id
GROUP BY created_date.year, completed_date.month
```

### Outrigger Dimensions

**Dimension linked to another dimension** (not the fact table).

```
┌──────────────────┐
│  dim_users       │
│  (Main)          │
│                  │
│  country_code ───┼───> dim_countries (Outrigger)
└──────────────────┘
```

**dim_users.sql**:

```sql
SELECT
  user_id,
  email,
  country_code  -- Foreign key to dim_countries
FROM ...
```

**dim_countries.sql** (Outrigger):

```sql
SELECT
  country_code,
  country_name,
  continent,
  region
FROM {{ ref('seed_countries') }}
```

**Query**:

```sql
SELECT
  c.continent,
  COUNT(DISTINCT u.user_id) AS user_count
FROM dim_users u
JOIN dim_countries c ON u.country_code = c.country_code
GROUP BY c.continent
```

### Bridge Tables (Many-to-Many)

**Handle many-to-many relationships**.

**Example: Households have multiple members**:

```
dim_households ←→ bridge_household_members ←→ dim_users
```

**bridge_household_members.sql**:

```sql
SELECT
  household_id,
  user_id,
  role,                 -- 'Owner', 'Admin', 'Member', 'Viewer'
  joined_at,
  allocation_weight     -- For weighted aggregations
FROM {{ ref('stg_household_members') }}
```

**Query with Bridge**:

```sql
-- Count users per household
SELECT
  h.household_name,
  COUNT(DISTINCT b.user_id) AS member_count
FROM dim_households h
JOIN bridge_household_members b ON h.household_id = b.household_id
GROUP BY h.household_name

-- Weighted aggregation (e.g., split household revenue across members)
SELECT
  u.user_id,
  SUM(f.revenue * b.allocation_weight) AS allocated_revenue
FROM fct_household_revenue f
JOIN bridge_household_members b ON f.household_id = b.household_id
JOIN dim_users u ON b.user_id = u.user_id
GROUP BY u.user_id
```

---

## Anti-Patterns

### ❌ Anti-Pattern 1: Too Many Foreign Keys in Fact Table

**Bad**:

```sql
-- 20+ foreign keys (hard to query, slow joins)
SELECT
  task_id,
  household_id,
  user_id,
  pet_id,
  task_type_id,
  priority_id,
  difficulty_id,
  category_id,
  subcategory_id,
  location_id,
  device_id,
  platform_id,
  app_version_id,
  -- ... 10 more ...
FROM fct_tasks
```

**Good** (use junk dimension):

```sql
SELECT
  task_id,
  household_id,
  user_id,
  pet_id,
  task_type_id,
  task_attribute_id,  -- Junk dimension (combines priority, difficulty, category, etc.)
  device_attribute_id  -- Junk dimension (combines device, platform, app version)
FROM fct_tasks
```

### ❌ Anti-Pattern 2: Storing Attributes in Fact Table

**Bad**:

```sql
-- Denormalized attributes in fact table (repeats data)
SELECT
  task_completion_id,
  household_id,
  household_name,        -- ❌ Belongs in dim_households
  household_plan,        -- ❌ Belongs in dim_households
  user_id,
  user_email,            -- ❌ Belongs in dim_users
  task_duration_minutes  -- ✅ Metric
FROM fct_task_completions
```

**Good**:

```sql
-- Keep fact table narrow
SELECT
  task_completion_id,
  household_id,          -- Foreign key
  user_id,               -- Foreign key
  task_duration_minutes  -- Metric
FROM fct_task_completions

-- Join to dimensions for attributes
SELECT
  f.task_completion_id,
  h.household_name,
  h.household_plan,
  u.user_email,
  f.task_duration_minutes
FROM fct_task_completions f
JOIN dim_households h ON f.household_id = h.household_id
JOIN dim_users u ON f.user_id = u.user_id
```

### ❌ Anti-Pattern 3: NULL Foreign Keys

**Bad**:

```sql
-- NULL foreign keys break star schema
SELECT
  task_completion_id,
  household_id,
  user_id,
  pet_id  -- NULL if task not associated with a pet
FROM fct_task_completions
```

**Good** (use placeholder):

```sql
-- dim_pets includes a 'No Pet' record
INSERT INTO dim_pets VALUES ('no_pet', 'No Pet', NULL, NULL, NULL)

-- Fact table uses placeholder instead of NULL
SELECT
  task_completion_id,
  household_id,
  user_id,
  COALESCE(pet_id, 'no_pet') AS pet_id  -- Always has a value
FROM fct_task_completions
```

### ❌ Anti-Pattern 4: Smart Keys (Business Logic in Keys)

**Bad**:

```sql
-- Smart key encodes meaning (fragile, hard to change)
household_id = 'US-CA-2025-001'  -- Country-State-Year-Sequence
```

**Good** (surrogate key):

```sql
-- Surrogate key (meaningless, stable)
household_id = 'h_abc123def456'

-- Store attributes in dimension
SELECT
  household_id,
  country_code,
  state_code,
  created_year
FROM dim_households
```

### ❌ Anti-Pattern 5: Over-Normalization

**Bad** (snowflake schema):

```
fct_tasks → dim_households → dim_cities → dim_states → dim_countries
```

**Query**:

```sql
-- 4 joins to get country (slow)
SELECT
  t.task_id,
  cn.country_name
FROM fct_tasks t
JOIN dim_households h ON t.household_id = h.household_id
JOIN dim_cities c ON h.city_id = c.city_id
JOIN dim_states s ON c.state_id = s.state_id
JOIN dim_countries cn ON s.country_id = cn.country_id
```

**Good** (star schema):

```
fct_tasks → dim_households (includes city, state, country)
```

**Query**:

```sql
-- 1 join to get country (fast)
SELECT
  t.task_id,
  h.country_name
FROM fct_tasks t
JOIN dim_households h ON t.household_id = h.household_id
```

---

**Related Documentation**:

- [Data Engineering Guide](./README.md)
- [Data Quality Guide](./data-quality.md)
- [Analytics Dashboards](../../docs/analytics/dashboards.md)
