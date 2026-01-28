# PetForce Data Warehouse Architecture

**Purpose**: Design scalable data warehouse architecture for analytics, reporting, and data-driven decision making that supports proactive pet care and privacy-first principles.

**Owner**: Data Engineering (Buck)
**Collaborators**: Analytics (Ana), Infrastructure (Isabel), Security (Samantha)
**Last Updated**: 2026-01-25
**Status**: PLANNING

---

## Table of Contents

1. [Vision & Philosophy](#vision--philosophy)
2. [Architecture Overview](#architecture-overview)
3. [Data Layers](#data-layers)
4. [Data Models](#data-models)
5. [Technology Stack](#technology-stack)
6. [Privacy & Security](#privacy--security)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Cost Planning](#cost-planning)

---

## Vision & Philosophy

### Product Philosophy Alignment

> "Pets are part of the family, so let's take care of them as simply as we can."

**Data Warehouse Mission**: Build a data architecture that enables proactive pet care through trustworthy insights while protecting pet family privacy.

**Core Principles**:

1. **Privacy-First Data Architecture**
   - All PII encrypted, masked, or hashed
   - Row-level security enforces data access
   - Pet health data treated as family data
   - No data sharing without explicit consent

2. **Data Quality for Prevention**
   - Clean, accurate data powers proactive alerts
   - Vaccine reminders, weight trends, medication schedules
   - Data quality tests prevent bad data from reaching analytics
   - Monitoring ensures data freshness

3. **Simple, Reliable Pipelines**
   - Over-engineered systems fail; keep architectures simple
   - Maintain pipelines reliably so teams can support them
   - Document data lineage clearly
   - Prefer batch over streaming (unless real-time required)

4. **Trustworthy Insights**
   - Ana's dashboards are only as good as Buck's data
   - Quality tests and monitoring ensure pet families trust insights
   - Data models answer business questions clearly

---

## Architecture Overview

### High-Level Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                             │
├──────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL  │  Third-Party APIs  │  Event Streams  │
│  (Operational DB)     │  (Future)          │  (Future)       │
└───────────┬───────────────────┬──────────────────┬───────────┘
            │                   │                  │
            │ Extraction (Daily)│                  │
            ▼                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      RAW LAYER                               │
├──────────────────────────────────────────────────────────────┤
│  Append-only, immutable, full historical data               │
│  No transformations, exactly as extracted                    │
│  Schema: raw_<source>_<table>                                │
└───────────┬──────────────────────────────────────────────────┘
            │
            │ Transformation (dbt)
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    STAGING LAYER                             │
├──────────────────────────────────────────────────────────────┤
│  Cleaned, typed, deduplicated                                │
│  PII hashed or masked                                        │
│  Schema: stg_<source>_<table>                                │
└───────────┬──────────────────────────────────────────────────┘
            │
            │ Business Logic (dbt)
            ▼
┌─────────────────────────────────────────────────────────────┐
│                     MARTS LAYER                              │
├──────────────────────────────────────────────────────────────┤
│  Dimensional models (fact + dimension tables)                │
│  Optimized for analytics queries                             │
│  Schema: marts_<domain>_<entity>                             │
└───────────┬──────────────────────────────────────────────────┘
            │
            │ Consumption
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   ANALYTICS TOOLS                            │
├──────────────────────────────────────────────────────────────┤
│  Dashboards (Metabase, Looker, Tableau)                     │
│  Ad-hoc SQL queries                                          │
│  ML/AI models (future)                                       │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Layers

1. **Raw Layer**: Immutable source of truth, exactly as extracted
2. **Staging Layer**: Cleaned, typed, deduped, PII-protected
3. **Marts Layer**: Business-oriented, optimized for queries
4. **Analytics Layer**: Dashboards, reports, ad-hoc queries

---

## Data Layers

### 1. Raw Layer (Landing Zone)

**Purpose**: Preserve complete historical data without transformations.

**Characteristics**:
- **Append-only**: Never update or delete, only insert
- **Immutable**: Original data preserved exactly as extracted
- **Full history**: All changes captured (CDC later)
- **Partitioned**: By extraction date for efficiency

**Schema Naming**: `raw_<source>_<table>`

**Example Tables**:
```sql
-- Raw users table (from Supabase PostgreSQL)
CREATE TABLE raw_supabase_users (
  extracted_at TIMESTAMPTZ NOT NULL,
  extracted_date DATE NOT NULL, -- Partition key
  source_system VARCHAR(50) DEFAULT 'supabase',

  -- Original columns (no transformations)
  id UUID,
  email VARCHAR(255),
  email_verified BOOLEAN,
  hashed_password VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_photo_url TEXT,
  auth_methods TEXT[],
  preferred_auth_method VARCHAR(50),
  two_factor_enabled BOOLEAN,
  account_locked_until TIMESTAMPTZ,
  failed_login_attempts INTEGER,
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  -- Metadata
  _extracted_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (extracted_date);

-- Create partitions for each month
CREATE TABLE raw_supabase_users_2026_01
  PARTITION OF raw_supabase_users
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

**Retention**: 2 years in hot storage, archive to cold storage afterward.

### 2. Staging Layer (Cleaned Data)

**Purpose**: Prepare data for analytics (clean, type, dedupe, protect PII).

**Characteristics**:
- **Current state only**: Latest snapshot (SCD Type 1)
- **PII protected**: Hashed emails, masked IPs, encrypted sensitive fields
- **Deduplicated**: Primary key enforced
- **Typed**: Correct data types, nulls handled
- **Validated**: Quality tests pass before promoting

**Schema Naming**: `stg_<source>_<table>`

**Example Tables**:
```sql
-- Staging users table (cleaned, PII-protected)
CREATE TABLE stg_supabase_users (
  user_id UUID PRIMARY KEY,

  -- PII hashed (SHA-256)
  email_hash VARCHAR(64) NOT NULL, -- SHA-256(email)
  ip_hash VARCHAR(64), -- SHA-256(ip_address)

  -- Non-PII fields (safe to analyze)
  email_domain VARCHAR(255), -- Extracted from email (e.g., 'gmail.com')
  email_verified BOOLEAN,
  has_password BOOLEAN, -- True if hashed_password IS NOT NULL
  auth_methods TEXT[],
  preferred_auth_method VARCHAR(50),
  two_factor_enabled BOOLEAN,
  is_account_locked BOOLEAN, -- Derived from account_locked_until > NOW()
  failed_login_attempts INTEGER,
  last_login_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  -- Metadata
  _dbt_loaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stg_users_email_hash ON stg_supabase_users(email_hash);
CREATE INDEX idx_stg_users_created_at ON stg_supabase_users(created_at);
```

**dbt Model Example**:
```sql
-- models/staging/stg_supabase_users.sql
{{
  config(
    materialized='incremental',
    unique_key='user_id',
    on_schema_change='fail'
  )
}}

SELECT
  id AS user_id,

  -- Hash PII
  ENCODE(SHA256(email::bytea), 'hex') AS email_hash,
  NULLIF(SPLIT_PART(email, '@', 2), '') AS email_domain,
  ENCODE(SHA256(last_login_ip::text::bytea), 'hex') AS ip_hash,

  -- Non-PII fields
  email_verified,
  (hashed_password IS NOT NULL) AS has_password,
  auth_methods,
  preferred_auth_method,
  two_factor_enabled,
  (account_locked_until > NOW()) AS is_account_locked,
  failed_login_attempts,
  last_login_at,
  created_at,
  updated_at,
  deleted_at,

  NOW() AS _dbt_loaded_at

FROM {{ source('raw', 'supabase_users') }}

{% if is_incremental() %}
  WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
{% endif %}
```

**Retention**: 3 years (historical analysis).

### 3. Marts Layer (Analytics-Ready)

**Purpose**: Business-oriented models optimized for analytics queries.

**Characteristics**:
- **Star/snowflake schema**: Fact tables + dimension tables
- **Pre-aggregated**: Metrics calculated once, not per query
- **Denormalized**: Optimized for read performance
- **Business logic**: Reflects product definitions (e.g., "active user")

**Schema Naming**: `marts_<domain>_<entity>`

**Example: User Lifecycle Mart**
```sql
-- Fact table: User activity by day
CREATE TABLE marts_core_user_activity_daily (
  activity_date DATE NOT NULL,
  user_id UUID NOT NULL,

  -- Activity metrics
  login_count INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  features_used TEXT[], -- Array of feature names used

  -- Engagement score
  engagement_score NUMERIC, -- Calculated: logins * 1 + sessions * 2 + ...

  -- User state on this date
  is_active BOOLEAN, -- Logged in within 30 days
  days_since_signup INTEGER,
  days_since_last_login INTEGER,

  -- Metadata
  _dbt_loaded_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (activity_date, user_id)
);

-- Dimension table: User attributes
CREATE TABLE marts_core_dim_users (
  user_id UUID PRIMARY KEY,

  -- Demographics (anonymized)
  email_domain VARCHAR(255),
  signup_cohort VARCHAR(20), -- e.g., '2026-01-W4' (year-week)

  -- Auth profile
  auth_methods TEXT[],
  preferred_auth_method VARCHAR(50),
  two_factor_enabled BOOLEAN,

  -- Lifecycle stage
  lifecycle_stage VARCHAR(50), -- 'new', 'active', 'at_risk', 'churned'

  -- Timestamps
  first_login_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,

  -- Metadata
  _dbt_loaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marts_dim_users_lifecycle ON marts_core_dim_users(lifecycle_stage);
CREATE INDEX idx_marts_dim_users_cohort ON marts_core_dim_users(signup_cohort);
```

**Retention**: 5 years (long-term trend analysis).

---

## Data Models

### Domain: Core (Authentication & Users)

**Purpose**: User authentication, account lifecycle, security metrics.

**Marts**:

1. **marts_core_user_activity_daily**
   - Grain: One row per user per day
   - Metrics: Logins, sessions, API calls, features used
   - Use case: Daily active users (DAU), engagement trends

2. **marts_core_dim_users**
   - Grain: One row per user
   - Attributes: Signup cohort, auth methods, lifecycle stage
   - Use case: Cohort analysis, user segmentation

3. **marts_core_auth_events**
   - Grain: One row per authentication event
   - Metrics: Login attempts, failures, token refreshes
   - Use case: Security monitoring, auth funnel analysis

**Example Queries**:
```sql
-- Daily active users (last 7 days)
SELECT
  activity_date,
  COUNT(DISTINCT user_id) AS dau
FROM marts_core_user_activity_daily
WHERE activity_date >= CURRENT_DATE - INTERVAL '7 days'
  AND login_count > 0
GROUP BY activity_date
ORDER BY activity_date;

-- User lifecycle distribution
SELECT
  lifecycle_stage,
  COUNT(*) AS user_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct
FROM marts_core_dim_users
WHERE deleted_at IS NULL
GROUP BY lifecycle_stage;

-- Authentication method adoption
SELECT
  preferred_auth_method,
  COUNT(*) AS user_count
FROM marts_core_dim_users
WHERE deleted_at IS NULL
GROUP BY preferred_auth_method
ORDER BY user_count DESC;
```

### Domain: Pets (Future)

**Purpose**: Pet profiles, health records, care events.

**Marts** (future):

1. **marts_pets_dim_pets**
   - Grain: One row per pet
   - Attributes: Species, breed, age, health status
   - Use case: Pet demographics, health insights

2. **marts_pets_health_events**
   - Grain: One row per health event (vet visit, vaccine, medication)
   - Metrics: Event type, date, outcome
   - Use case: Vaccination compliance, health trends

3. **marts_pets_care_schedule**
   - Grain: One row per scheduled care task
   - Metrics: Task type, due date, completion status
   - Use case: Reminder effectiveness, care compliance

### Domain: Product Usage (Future)

**Purpose**: Feature adoption, user behavior, product metrics.

**Marts** (future):

1. **marts_product_feature_usage**
   - Grain: One row per feature per user per day
   - Metrics: Feature usage count, time spent
   - Use case: Feature adoption, A/B test results

2. **marts_product_funnel_events**
   - Grain: One row per funnel step per user
   - Metrics: Step name, timestamp, conversion
   - Use case: Funnel analysis, drop-off identification

---

## Technology Stack

### Primary Warehouse: PostgreSQL (Supabase)

**Rationale**:
- **Already using Supabase**: Minimize new services
- **Good enough for scale**: Supports <10M rows per table efficiently
- **Familiar tooling**: SQL, psql, pg_dump
- **Row-level security**: Built-in privacy controls
- **Cost-effective**: Included in Supabase plan

**When to migrate**:
- If data exceeds 100GB (consider BigQuery, Redshift)
- If query performance becomes issue (consider columnar stores)
- If analytics workload impacts production DB (separate warehouse)

### Transformation: dbt (Data Build Tool)

**Rationale**:
- **Industry standard**: Wide adoption, strong community
- **Version control**: SQL transformations in Git
- **Testing**: Built-in data quality tests
- **Documentation**: Auto-generates data lineage
- **Modular**: Reusable models, DRY principles

**dbt Project Structure**:
```
dbt_petforce/
├── models/
│   ├── staging/
│   │   ├── stg_supabase_users.sql
│   │   ├── stg_supabase_sessions.sql
│   │   └── stg_supabase_pets.sql (future)
│   ├── marts/
│   │   ├── core/
│   │   │   ├── marts_core_user_activity_daily.sql
│   │   │   ├── marts_core_dim_users.sql
│   │   │   └── marts_core_auth_events.sql
│   │   └── pets/ (future)
│   └── tests/
│       ├── assert_user_counts_match.sql
│       └── assert_no_negative_metrics.sql
├── macros/
│   ├── hash_pii.sql
│   └── calculate_engagement_score.sql
├── seeds/
│   └── lifecycle_stage_definitions.csv
└── dbt_project.yml
```

### Orchestration: GitHub Actions (Initial) → Airflow (Future)

**Phase 1: GitHub Actions**
- **Rationale**: Simple, no new infrastructure, easy to monitor
- **Schedule**: Daily at 6 AM UTC (after operational DB quiets)
- **Workflow**: Extract → dbt run → dbt test → Notify Slack

**Phase 2: Airflow (When complexity grows)**
- **Rationale**: Complex DAGs, data quality SLAs, backfills
- **When**: If pipelines exceed 10+ dependencies
- **Cost**: Requires dedicated infrastructure (Astronomer, MWAA)

### Analytics: Metabase (Initial) → Looker (Future)

**Phase 1: Metabase**
- **Rationale**: Open source, self-hosted, simple UI
- **Users**: Internal team (Buck, Ana, Peter)
- **Dashboards**: KPI dashboards, ad-hoc queries

**Phase 2: Looker or Tableau (Scale)**
- **Rationale**: Advanced analytics, governance, embedded dashboards
- **When**: External stakeholders need dashboards
- **Cost**: ~$1000/month

---

## Privacy & Security

### PII Protection Strategy

**Principle**: No raw PII in analytics warehouse.

**Techniques**:

1. **Hashing (One-Way)**
   - Use case: De-identify but allow joins (email, IP)
   - Method: SHA-256 with salt
   - Example: `email_hash = SHA256(email + SALT)`

2. **Masking**
   - Use case: Partial visibility (e.g., last 4 of phone)
   - Method: `masked_email = 'user***@example.com'`

3. **Tokenization**
   - Use case: Reversible de-identification (future)
   - Method: Use external vault (HashiCorp Vault)

4. **Aggregation**
   - Use case: Analytics without individual-level data
   - Method: Pre-aggregate metrics (e.g., daily counts)

5. **Differential Privacy (Future)**
   - Use case: Public-facing analytics
   - Method: Add noise to aggregates

### Row-Level Security (RLS)

All marts enforce RLS:

```sql
-- Analysts can only see anonymized data
CREATE POLICY "Analysts see hashed PII only" ON marts_core_dim_users
  FOR SELECT
  TO analyst_role
  USING (true); -- Allow all rows, but columns are hashed

-- Data engineers can see raw data for debugging
CREATE POLICY "Data engineers full access" ON marts_core_dim_users
  FOR SELECT
  TO data_engineer_role
  USING (true);
```

### Audit Logging

All warehouse queries logged:

```sql
-- Audit log table
CREATE TABLE warehouse_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_email VARCHAR(255),
  query_text TEXT NOT NULL,
  tables_accessed TEXT[],
  rows_returned BIGINT,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  execution_time_ms INTEGER
);

-- Log query via trigger or application layer
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goal**: Set up raw and staging layers for users/sessions.

**Tasks**:
- [ ] Create raw layer tables (partitioned)
- [ ] Set up dbt project structure
- [ ] Create staging models (stg_supabase_users, stg_supabase_sessions)
- [ ] Write data quality tests (uniqueness, nullness, freshness)
- [ ] Set up GitHub Actions for daily dbt runs
- [ ] Test extraction and transformation in dev

**Deliverables**:
- `raw_supabase_users` table populated daily
- `stg_supabase_users` table with PII hashed
- dbt tests passing (100% success rate)

### Phase 2: Core Marts (Weeks 3-4)

**Goal**: Build first analytics marts for user lifecycle.

**Tasks**:
- [ ] Create marts_core_user_activity_daily
- [ ] Create marts_core_dim_users
- [ ] Create marts_core_auth_events
- [ ] Write business logic for lifecycle stages
- [ ] Set up Metabase for dashboards
- [ ] Create initial KPI dashboard (DAU, MAU, retention)

**Deliverables**:
- 3 marts tables ready for queries
- Metabase dashboard showing user metrics
- Ana can query marts for reports

### Phase 3: Pet Data (Future)

**Goal**: Extend warehouse to pet profiles and health data.

**Tasks**:
- [ ] Create raw/staging/marts for pets
- [ ] Model pet health events
- [ ] Build vaccination compliance dashboard
- [ ] Create proactive alert data models

### Phase 4: Advanced Features (Future)

**Goal**: Machine learning, predictive analytics, real-time data.

**Tasks**:
- [ ] Integrate ML models for predictions
- [ ] Add streaming data ingestion (Kafka)
- [ ] Build recommendation engine data models
- [ ] Implement differential privacy for public dashboards

---

## Cost Planning

### Storage Costs (Supabase PostgreSQL)

**Assumptions**:
- 10,000 users
- 100,000 sessions/month
- 1 KB per user record, 0.5 KB per session record

**Calculations**:
- Raw layer: ~1 GB/year (append-only)
- Staging layer: ~10 MB (current state only)
- Marts layer: ~50 MB (aggregated)
- **Total**: ~1.5 GB/year

**Supabase Pricing**:
- Free tier: 500 MB
- Pro tier: $25/month for 8 GB
- **Estimated cost**: $0/month (fits in Pro plan we already have)

### Compute Costs (dbt Runs)

**Assumptions**:
- Daily dbt runs: 1/day
- Execution time: ~5 minutes/run
- GitHub Actions: Free for open source, $0.008/minute for private

**Calculations**:
- Daily cost: 5 min * $0.008 = $0.04
- Monthly cost: $0.04 * 30 = $1.20
- **Annual cost**: ~$15/year

### Analytics Tool Costs

**Phase 1: Metabase (Self-Hosted)**
- Infrastructure: $20/month (1 vCPU, 2GB RAM)
- **Annual cost**: $240/year

**Phase 2: Looker or Tableau (Future)**
- **Annual cost**: ~$12,000/year (10 users * $100/month)

### Total Cost Estimate

**Year 1**: $255/year ($15 dbt + $240 Metabase)
**Year 2**: $12,255/year (if migrate to Looker)

---

## Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Data freshness | <24 hours | Last load timestamp |
| dbt test success rate | 100% | dbt test results |
| Query performance | <5 sec (p95) | Query logs |
| Pipeline uptime | 99.9% | GitHub Actions success rate |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboards used weekly | 3+ | Metabase usage logs |
| Queries per week | 20+ | Warehouse audit logs |
| Data-driven decisions | 1+/week | Product reviews |
| Time to insight | <1 hour | Ana's feedback |

---

## References

- [dbt Documentation](https://docs.getdbt.com/)
- [Data Retention Policy](./DATA-RETENTION-POLICY.md)
- [Supabase Database Guides](https://supabase.com/docs/guides/database)
- [Kimball Dimensional Modeling](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/)

---

## Approval & Next Steps

| Role | Approver | Status | Notes |
|------|----------|--------|-------|
| Data Engineering | Buck | ✓ Draft | Ready for review |
| Analytics | Ana | Pending | Needs mart requirements |
| Infrastructure | Isabel | Pending | Needs cost approval |
| Security | Samantha | Pending | Needs PII review |
| Product | Peter | Pending | Needs business alignment |

**Next Steps**:
1. Review with Ana: Confirm mart schemas meet analytics needs
2. Review with Samantha: Verify PII protection strategy
3. Review with Isabel: Approve infrastructure costs
4. Begin Phase 1 implementation (Week 1)

**Document Version**: 1.0
**Status**: PLANNING - Awaiting approval
