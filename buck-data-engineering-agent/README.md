# 🔄 Buck: The Data Engineering Agent

> *Bad data is worse than no data. Good pipelines make good data.*

Buck is a comprehensive Data Engineering agent powered by Claude Code. He builds the data pipelines, transforms raw data into clean models, and ensures Ana's dashboards have the high-quality data they need. When Buck builds a pipeline, data flows reliably and arrives on time.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **ETL/ELT Pipelines** | Batch & streaming data ingestion |
| **Data Modeling** | Dimensional modeling (star/snowflake schemas) |
| **dbt Integration** | Modern transformation framework |
| **Data Quality** | Tests, freshness checks, anomaly detection |
| **Orchestration** | Airflow, Dagster, Prefect support |
| **Warehouse Optimization** | Partitioning, clustering, performance |

## 📁 Package Contents

```
buck-data-engineering-agent/
├── BUCK.md                               # Full data engineering documentation
├── CLAUDE.md                             # Claude Code agent configuration
├── README.md                             # This file
├── QUICKSTART.md                         # 10-minute setup guide
├── .buck.yml                             # Data engineering configuration
└── templates/
    ├── stg_model.sql.template            # dbt staging model template
    └── fct_model.sql.template            # dbt fact model template
```

## 🚀 Quick Start

### 1. Initialize dbt project

```bash
dbt init analytics
cd analytics
```

### 2. Copy Buck's templates

```bash
cp buck-data-engineering-agent/templates/*.sql.template models/
```

### 3. Create your first models

```sql
-- models/staging/stg_orders.sql
select * from {{ source('raw', 'orders') }}
```

```sql
-- models/marts/fct_orders.sql
select * from {{ ref('stg_orders') }}
```

### 4. Run dbt

```bash
dbt run
dbt test
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 🏗️ Data Architecture

### Medallion Architecture (Bronze/Silver/Gold)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   BRONZE    │───▶│   SILVER    │───▶│    GOLD     │
│    (Raw)    │    │  (Staging)  │    │   (Marts)   │
└─────────────┘    └─────────────┘    └─────────────┘
    raw_*             stg_*           fct_*, dim_*
```

| Layer | Purpose | Materialization |
|-------|---------|-----------------|
| Bronze | Raw source data | Table (append) |
| Silver | Cleaned, typed | View |
| Gold | Business-ready | Table/Incremental |

### Star Schema Example

```
              dim_date
                 │
dim_customer ─── fct_orders ─── dim_product
                 │
              dim_store
```

## 📊 dbt Project Structure

```
dbt_project/
├── models/
│   ├── staging/           # 🥈 Silver layer
│   │   ├── stg_orders.sql
│   │   └── _staging.yml
│   ├── intermediate/      # Business logic
│   │   └── int_orders_enriched.sql
│   └── marts/             # 🥇 Gold layer
│       ├── core/
│       │   ├── fct_orders.sql
│       │   └── dim_customers.sql
│       └── marketing/
│           └── mart_campaigns.sql
├── tests/                 # Custom tests
├── macros/                # Reusable SQL
└── seeds/                 # Static data
```

## 🧪 Data Quality

### Test Types
| Type | Example | Purpose |
|------|---------|---------|
| `not_null` | Primary keys | Completeness |
| `unique` | IDs | Uniqueness |
| `accepted_values` | Status fields | Validity |
| `relationships` | Foreign keys | Referential integrity |

### Freshness Checks
```yaml
sources:
  - name: raw
    freshness:
      warn_after: {count: 12, period: hour}
      error_after: {count: 24, period: hour}
```

## 🤖 Using with Claude Code

```
You: Create a pipeline for customer analytics

Buck: 🔄 Pipeline Design: Customer Analytics

Data Flow:
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Postgres │───▶│ Staging  │───▶│   Mart   │
│  (raw)   │    │ (clean)  │    │ (ready)  │
└──────────┘    └──────────┘    └──────────┘

Models:
1. stg_users (cleaned user data)
2. stg_orders (cleaned order data)
3. int_customers_enriched (joined + calculated)
4. dim_customers (dimension table)
5. fct_orders (fact table)
6. mart_customer_360 (for Ana's dashboard)

Schedule: Daily at 6 AM
SLA: Complete by 8 AM
Tests: 12 data quality checks

Ready to implement?
```

## 🎯 Buck's Commands

### dbt Commands
```bash
buck dbt run --select staging
buck dbt run --select marts.core
buck dbt test
buck dbt docs generate
```

### Pipeline Commands
```bash
buck pipeline trigger daily_elt
buck backfill --start 2024-01-01 --end 2024-01-31
buck freshness check
```

### Quality Commands
```bash
buck quality report
buck anomaly detect fct_orders
buck lineage show dim_customers
```

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Ana** | Provides clean marts for dashboards |
| **Isabel** | Infrastructure for warehouse & orchestration |
| **Larry** | Pipeline monitoring & logging |
| **Samantha** | Data security & PII masking |

## 📋 Configuration

Buck uses `.buck.yml`:

```yaml
version: 1

warehouse:
  type: snowflake
  schemas:
    raw: "raw"
    staging: "staging"
    marts: "marts"

dbt:
  models:
    staging:
      materialized: view
    marts:
      materialized: table

orchestration:
  engine: airflow
  schedules:
    daily_elt:
      cron: "0 6 * * *"

quality:
  freshness:
    warn_after: {count: 12, period: hour}
    error_after: {count: 24, period: hour}
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [BUCK.md](./BUCK.md) | Complete data engineering documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `stg_model.sql.template` | Staging layer models |
| `fct_model.sql.template` | Fact table models |

---

<p align="center">
  <strong>Buck: Your Data Engineering Partner</strong><br>
  <em>Building pipelines that deliver truth.</em>
</p>

---

*Bad data is worse than no data. Good pipelines make good data.* 🔄
