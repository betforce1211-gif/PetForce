# Data Infrastructure Planning - Completion Summary

**Date**: 2026-01-25
**Owner**: Buck (Data Engineering)
**Status**: LOW PRIORITY TASKS COMPLETE

---

## Executive Summary

Completed comprehensive planning for PetForce data infrastructure foundation, covering:
1. **Session Cleanup Automation** (Task #41) - COMPLETE
2. **Data Warehouse Architecture** (Task #44) - COMPLETE
3. **Log Retention Policy Documentation** (Task #45) - COMPLETE (Previously)

**Mission**: Build scalable data infrastructure that turns raw data into insights while protecting pet family privacy.

---

## Task Completion Status

### ✅ Task #41: Session Cleanup Automation

**Document**: `/docs/data-governance/SESSION-CLEANUP-AUTOMATION.md`

**What We Planned**:
- Automated cleanup of expired authentication tokens
- Daily cleanup for tokens (email verifications, password resets, magic links, rate limits)
- Weekly cleanup for expired sessions and PII removal
- Monthly cleanup for soft-deleted users and inactive users

**Implementation Strategy**:
- **Recommended**: PostgreSQL pg_cron extension (native, simple)
- **Alternative**: GitHub Actions (easier monitoring)
- **Future**: Supabase Edge Functions (if complexity grows)

**Key Deliverables**:
1. 3 cleanup functions:
   - `cleanup_expired_tokens()` - Daily at 2 AM UTC
   - `cleanup_expired_sessions()` - Weekly Sunday 3 AM UTC
   - `cleanup_deleted_users()` - Monthly 1st at 4 AM UTC

2. Monitoring dashboard metrics:
   - Cleanup job success rate (target: 100%)
   - Records deleted per day (expected: 100-500)
   - Database size growth (target: <1GB/month)
   - Job execution time (target: <5 seconds)

3. Alerting thresholds:
   - Critical: Job failure 3x in row → Page engineer
   - Warning: Unusual deletion volume (>10x normal) → Slack
   - Warning: Oldest expired token >48 hours → Slack

**Next Steps**:
- Week 1: Create migration with cleanup functions
- Week 2: Deploy to staging, monitor executions
- Week 3: Deploy to production
- Week 4: Set up Datadog dashboard and alerts

**Estimated Cost**: $0/month (included in Supabase Pro plan, pg_cron native)

---

### ✅ Task #44: Data Warehouse Architecture

**Document**: `/docs/data-governance/DATA-WAREHOUSE-ARCHITECTURE.md`

**What We Planned**:
- Scalable data warehouse for analytics and reporting
- Privacy-first architecture (PII hashed, RLS enforced)
- 3-layer architecture: Raw → Staging → Marts
- dbt for transformations, Metabase for dashboards

**Architecture Layers**:

1. **Raw Layer** (Landing Zone)
   - Append-only, immutable source of truth
   - Partitioned by extraction date
   - Schema: `raw_<source>_<table>`
   - Retention: 2 years hot, archive to cold storage

2. **Staging Layer** (Cleaned Data)
   - PII hashed (SHA-256 with salt)
   - Deduplicated, typed, validated
   - Schema: `stg_<source>_<table>`
   - Retention: 3 years

3. **Marts Layer** (Analytics-Ready)
   - Star/snowflake schema (fact + dimension tables)
   - Pre-aggregated metrics
   - Business logic applied (e.g., "active user" definition)
   - Schema: `marts_<domain>_<entity>`
   - Retention: 5 years

**Technology Stack**:
- **Warehouse**: PostgreSQL (Supabase) - good enough for <10M rows
- **Transformation**: dbt (Data Build Tool) - industry standard, version control
- **Orchestration**: GitHub Actions (initial) → Airflow (future)
- **Analytics**: Metabase (initial) → Looker (future)

**Privacy & Security**:
- No raw PII in analytics warehouse
- Techniques: Hashing (SHA-256), masking, aggregation
- Row-level security (RLS) enforced on all marts
- Audit logging for all warehouse queries

**Implementation Roadmap**:
- **Phase 1** (Weeks 1-2): Raw + staging layers for users/sessions
- **Phase 2** (Weeks 3-4): Core marts (user activity, auth events)
- **Phase 3** (Future): Pet data models
- **Phase 4** (Future): ML models, streaming data

**Estimated Costs**:
- Year 1: **$255/year** ($15 dbt + $240 Metabase self-hosted)
- Year 2: **$12,255/year** (if migrate to Looker for 10 users)
- Storage: Fits in existing Supabase Pro plan ($0 additional)

**First Deliverables** (Phase 1):
- `raw_supabase_users` table (partitioned, daily loads)
- `stg_supabase_users` table (PII hashed)
- dbt project structure with tests
- GitHub Actions for daily dbt runs

---

### ✅ Task #45: Log Retention Policy Documentation

**Document**: `/docs/data-governance/DATA-RETENTION-POLICY.md`

**Status**: COMPLETE (Created previously)

**What We Documented**:
- Comprehensive data retention schedules for all data types
- Deletion procedures (user-requested, automated, deceased pets)
- Archival strategy for compliance data (7-year retention)
- User rights under GDPR/CCPA
- Implementation SQL queries and cron jobs

**Key Retention Policies**:
- Email verification tokens: 1 hour after expiration
- Sessions: 30 days expiration + 7 days grace
- Session metadata (IP/UA): 90 days (PII removal)
- Soft-deleted users: 30-day grace period for recovery
- Inactive users: 2 years (soft-delete after warning emails)
- Application logs: 90 days
- Security audit logs: 7 years (compliance)
- Transaction records: 7 years (tax/audit)

**Compliance Coverage**:
- GDPR Article 5 (storage limitation)
- GDPR Article 17 (right to erasure)
- CCPA Section 1798.105 (right to delete)
- SOC 2 Type II (audit logging)

---

## Data Governance Documentation Structure

All documentation lives in `/docs/data-governance/`:

```
docs/data-governance/
├── README.md                          # Index and quick reference
├── DATA-RETENTION-POLICY.md           # ✅ Task #45 (Complete)
├── SESSION-CLEANUP-AUTOMATION.md      # ✅ Task #41 (Complete)
├── DATA-WAREHOUSE-ARCHITECTURE.md     # ✅ Task #44 (Complete)
└── INFRASTRUCTURE-PLANNING-SUMMARY.md # This document
```

**Future Documents** (Coming Soon):
- Data Classification Policy (Q2 2026)
- Data Quality Standards (Q2 2026)
- Privacy-First Architecture Guide (Q3 2026)
- Data Lineage Documentation (Q3 2026)

---

## Key Decisions & Rationale

### Decision 1: Use pg_cron for Session Cleanup

**Why**: Native PostgreSQL solution, no external dependencies, simple to maintain.

**Alternatives Considered**:
- GitHub Actions: Better monitoring, but requires DB credentials in GitHub
- Supabase Edge Functions: Too complex for simple cleanup

**Tradeoff**: Limited built-in monitoring, but Isabel can set up external observability.

---

### Decision 2: PostgreSQL as Data Warehouse (Initial)

**Why**: Already using Supabase, good enough for <10M rows, cost-effective.

**Alternatives Considered**:
- BigQuery: Better for scale (>100GB), but adds cost and complexity
- Redshift: Enterprise-grade, but overkill for startup stage

**Tradeoff**: May need to migrate if data exceeds 100GB or query performance degrades.

**Migration Trigger**: If warehouse exceeds 100GB or query p95 latency >5 seconds.

---

### Decision 3: dbt for Transformations

**Why**: Industry standard, version control, testing, documentation, strong community.

**Alternatives Considered**:
- Custom SQL scripts: Harder to maintain, no testing framework
- Airflow DAGs: More complex, higher overhead

**Tradeoff**: Learning curve for team, but pays off long-term.

---

### Decision 4: Hash PII in Staging Layer

**Why**: De-identify data while preserving ability to join tables (same hash for same email).

**Alternatives Considered**:
- Full anonymization: Can't join across tables
- Tokenization: Requires external vault (more complexity)

**Tradeoff**: Cannot reverse hashes (one-way), but that's the point (privacy).

**Implementation**: `email_hash = SHA256(email + SALT)` where SALT is stored securely.

---

## Product Philosophy Alignment

Every decision aligns with PetForce core philosophy:

> "Pets are part of the family, so let's take care of them as simply as we can."

### Simplicity
- **Session cleanup**: Automated, hands-off (no manual intervention)
- **Warehouse architecture**: 3 layers (simple, understandable)
- **Technology choices**: Use what we have (PostgreSQL), add only when needed

### Privacy-First
- **PII hashing**: No raw emails/IPs in analytics warehouse
- **RLS policies**: Row-level security enforces access control
- **Retention policies**: Delete data when no longer needed (GDPR/CCPA)

### Reliability
- **Automated cleanup**: No data accumulation (database health)
- **Data quality tests**: dbt tests ensure trustworthy data
- **Monitoring**: Alerts catch issues before they impact users

### Proactive Over Reactive
- **Data warehouse**: Enables proactive insights (vaccine reminders, health trends)
- **Cleanup automation**: Prevents database bloat before it becomes problem
- **Quality tests**: Catch bad data before it reaches dashboards

---

## Success Metrics

### Technical Metrics (Buck's Responsibility)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cleanup job success rate | 100% | pg_cron logs |
| Data freshness (warehouse) | <24 hours | Last load timestamp |
| dbt test pass rate | 100% | dbt test results |
| Query performance (p95) | <5 seconds | Query logs |
| Database size growth | <1GB/month | pg_database_size() |

### Business Metrics (Ana's Dashboards)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboards used weekly | 3+ | Metabase usage logs |
| Data-driven decisions | 1+/week | Product reviews |
| Time to insight (Ana) | <1 hour | Ana's feedback |
| Dashboard load time | <2 seconds | Metabase performance |

---

## Next Steps & Action Items

### Immediate (This Week)

**For Buck**:
- [ ] Review documents with Ana (confirm mart schemas meet analytics needs)
- [ ] Review with Samantha (verify PII protection strategy)
- [ ] Review with Isabel (approve infrastructure costs and monitoring plan)
- [ ] Get approval from Peter (business alignment)

**For Isabel** (Task #41 - Session Cleanup):
- [ ] Verify Supabase Pro plan supports pg_cron extension
- [ ] Set up Datadog/Prometheus monitoring for cleanup jobs
- [ ] Create alerts (Slack, PagerDuty) for job failures

### Phase 1 Implementation (Weeks 1-2)

**Session Cleanup Automation**:
- [ ] Create migration: `20260125000002_session_cleanup_automation.sql`
- [ ] Add cleanup functions (expired tokens, sessions, users)
- [ ] Schedule pg_cron jobs (daily, weekly, monthly)
- [ ] Test in dev environment
- [ ] Deploy to staging
- [ ] Monitor 3 days, fix issues
- [ ] Deploy to production

**Data Warehouse Foundation**:
- [ ] Create `raw_supabase_users` table (partitioned)
- [ ] Set up dbt project structure
- [ ] Create `stg_supabase_users` model (PII hashing)
- [ ] Write data quality tests (uniqueness, nullness, freshness)
- [ ] Set up GitHub Actions for daily dbt runs
- [ ] Test extraction and transformation in dev

### Phase 2 Implementation (Weeks 3-4)

**Core Marts**:
- [ ] Create `marts_core_user_activity_daily`
- [ ] Create `marts_core_dim_users`
- [ ] Create `marts_core_auth_events`
- [ ] Write business logic for lifecycle stages
- [ ] Set up Metabase (self-hosted)
- [ ] Create initial KPI dashboard (DAU, MAU, retention)

**Monitoring & Alerting**:
- [ ] Create cleanup log table
- [ ] Update cleanup functions to log results
- [ ] Create Datadog dashboard for cleanup jobs
- [ ] Set up alerts (failure, skipped runs, anomalies)
- [ ] Write troubleshooting runbook
- [ ] Train team on monitoring tools

### Future (Q2 2026 and Beyond)

**Data Warehouse Expansion**:
- [ ] Add pet data models (when pet features launch)
- [ ] Build vaccination compliance dashboard
- [ ] Create proactive alert data models
- [ ] Integrate ML models for predictions

**Advanced Features**:
- [ ] Migrate to Airflow for orchestration (if complexity grows)
- [ ] Add streaming data ingestion (Kafka) for real-time alerts
- [ ] Implement differential privacy for public dashboards
- [ ] Migrate to BigQuery/Redshift (if scale requires)

---

## Cost Summary

### Initial Costs (Year 1)

| Item | Monthly | Annual |
|------|---------|--------|
| Session Cleanup (pg_cron) | $0 | $0 |
| dbt Runs (GitHub Actions) | $1.25 | $15 |
| Warehouse Storage (PostgreSQL) | $0 | $0 |
| Metabase Self-Hosted | $20 | $240 |
| **Total Year 1** | **$21.25** | **$255** |

### Scale Costs (Year 2+)

| Item | Monthly | Annual |
|------|---------|--------|
| Looker (10 users) | $1,000 | $12,000 |
| BigQuery (if migrate) | $100 | $1,200 |
| Airflow (Astronomer) | $200 | $2,400 |
| **Total Year 2** | **$1,300** | **$15,600** |

**Note**: Year 2 costs only if we scale beyond 10M rows or 100GB data.

---

## Risks & Mitigations

### Risk 1: pg_cron Not Available on Supabase Free Tier

**Impact**: Cannot use native cleanup automation.

**Mitigation**:
- Verify Supabase Pro plan supports pg_cron (it does)
- Fallback: Use GitHub Actions for cleanup

**Likelihood**: Low (pg_cron available on Pro)

---

### Risk 2: Data Warehouse Outgrows PostgreSQL

**Impact**: Query performance degrades, costs increase.

**Mitigation**:
- Monitor database size monthly
- Set alert at 80GB (trigger migration planning)
- Pre-plan migration to BigQuery/Redshift

**Likelihood**: Medium (may happen in Year 2 if growth is high)

---

### Risk 3: PII Hashing Strategy Insufficient for Compliance

**Impact**: GDPR/CCPA violations, fines.

**Mitigation**:
- Review with Samantha (Security)
- Get legal counsel approval
- Audit hashing implementation (salt strength, algorithm)

**Likelihood**: Low (SHA-256 is industry standard)

---

### Risk 4: Team Lacks dbt Expertise

**Impact**: Slow implementation, poor data models.

**Mitigation**:
- Buck learns dbt (online courses, documentation)
- Start simple (staging models only)
- Iterate and improve over time

**Likelihood**: Medium (learning curve expected)

---

## Collaboration Requirements

### With Ana (Analytics)
- **Needed**: Confirm mart schemas meet dashboard requirements
- **Frequency**: Weekly sync during Phase 1-2 implementation
- **Deliverable**: Approved mart schema designs

### With Samantha (Security)
- **Needed**: Review PII hashing strategy, RLS policies
- **Frequency**: One-time review before production deployment
- **Deliverable**: Security approval for warehouse architecture

### With Isabel (Infrastructure)
- **Needed**: Set up monitoring (Datadog), approve costs
- **Frequency**: One-time setup during Phase 1
- **Deliverable**: Monitoring dashboard and alerts operational

### With Peter (Product)
- **Needed**: Align warehouse priorities with product roadmap
- **Frequency**: One-time review before starting implementation
- **Deliverable**: Product approval for warehouse scope

---

## References

**Internal Documents**:
- [Data Retention Policy](/docs/data-governance/DATA-RETENTION-POLICY.md)
- [Session Cleanup Automation](/docs/data-governance/SESSION-CLEANUP-AUTOMATION.md)
- [Data Warehouse Architecture](/docs/data-governance/DATA-WAREHOUSE-ARCHITECTURE.md)
- [Product Vision](/PRODUCT-VISION.md)
- [Architecture Overview](/docs/ARCHITECTURE.md)

**External Resources**:
- [Supabase pg_cron Guide](https://supabase.com/docs/guides/database/extensions/pgcron)
- [dbt Documentation](https://docs.getdbt.com/)
- [Kimball Dimensional Modeling](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/)
- [GDPR Article 5 (Storage Limitation)](https://gdpr.eu/article-5-how-to-process-personal-data/)

---

## Approval Sign-Off

| Role | Approver | Status | Date | Notes |
|------|----------|--------|------|-------|
| Data Engineering | Buck | ✅ Complete | 2026-01-25 | Planning done, ready for review |
| Analytics | Ana | ⏳ Pending | TBD | Needs mart schema review |
| Security | Samantha | ⏳ Pending | TBD | Needs PII strategy review |
| Infrastructure | Isabel | ⏳ Pending | TBD | Needs cost and monitoring approval |
| Product | Peter | ⏳ Pending | TBD | Needs business alignment |

**Next Milestone**: Complete all reviews by end of Week 1, begin Phase 1 implementation Week 2.

---

## Conclusion

Bad data is worse than no data. Good pipelines make good data.

We've laid the foundation for scalable, privacy-first data infrastructure that will:
1. **Protect pet families**: PII hashed, RLS enforced, retention policies automated
2. **Enable proactive care**: Analytics warehouse powers insights and alerts
3. **Stay simple**: Use what we have (PostgreSQL), add only when needed
4. **Scale reliably**: Clear migration path when we outgrow initial architecture

**Mission accomplished**: Data infrastructure planning complete. Ready to build pipelines that turn raw data into trustworthy insights.

---

**Document Owner**: Buck (Data Engineering)
**Document Version**: 1.0
**Status**: COMPLETE - Awaiting team review and approval
**Next Review**: After Phase 1 implementation (Week 2)
