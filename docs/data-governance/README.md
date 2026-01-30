# Data Governance Documentation

**Purpose**: Centralized documentation for PetForce data governance policies, compliance, and best practices.

**Owner**: Data Engineering Team (Buck)
**Last Updated**: 2026-01-25

---

## Overview

PetForce handles sensitive pet family data including health records, location data, and personal identifiable information (PII). Data governance ensures we:

- Protect pet family privacy
- Comply with GDPR, CCPA, and privacy regulations
- Maintain data quality and trustworthiness
- Enable data-driven product decisions
- Support Ana's dashboards with clean, reliable data

---

## Documents

### Core Policies

1. **[Data Retention Policy](./DATA-RETENTION-POLICY.md)** ✅
   - Retention schedules for all data types
   - Deletion procedures (user-requested, automated)
   - Archival strategy for compliance data
   - User rights (GDPR/CCPA)
   - Implementation guidelines

2. **[Session Cleanup Automation](./SESSION-CLEANUP-AUTOMATION.md)** ✅
   - Automated cleanup procedures for expired tokens/sessions
   - pg_cron implementation guide
   - Monitoring and alerting strategies
   - Troubleshooting runbook

3. **[Data Warehouse Architecture](./DATA-WAREHOUSE-ARCHITECTURE.md)** ✅
   - Warehouse design for analytics and reporting
   - Raw → Staging → Marts data layers
   - Privacy-first data modeling
   - dbt transformation strategy
   - Implementation roadmap

### Coming Soon

4. **Data Classification Policy** (Q2 2026)
   - Sensitivity tiers (PII, health data, operational)
   - Encryption requirements
   - Access control policies
   - Data handling procedures

5. **Data Quality Standards** (Q2 2026)
   - Data validation rules
   - Quality tests (dbt)
   - Freshness requirements
   - Monitoring thresholds

6. **Privacy-First Architecture Guide** (Q3 2026)
   - PII masking techniques
   - Anonymization strategies
   - Row-level security (RLS) patterns
   - Differential privacy for analytics

7. **Data Lineage Documentation** (Q3 2026)
   - Source-to-mart data flows
   - Transformation logic
   - Dependency graphs
   - Impact analysis

---

## Quick Reference

### Data Retention Periods

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| Active user data | While account active | Deleted 30 days after account deletion |
| Inactive user data | 2 years from last login | Warning emails at 18, 23 months |
| Pet health records (active) | Indefinitely | Valuable for ongoing care |
| Pet health records (deceased) | 90 days after death | Grieving period retention |
| Email verification tokens | 1 hour after expiration | Daily automated cleanup |
| Password reset tokens | 1 hour after expiration | Daily automated cleanup |
| Magic link tokens | 15 min after expiration | Daily automated cleanup |
| Rate limit records | 24 hours | Daily automated cleanup |
| Session tokens | 30 days + 7 days grace | Weekly automated cleanup |
| Session metadata (IP, UA) | 90 days | PII removal automation |
| Application logs | 90 days | Debugging recent issues |
| Security audit logs | 7 years | Compliance requirement |
| Transaction records | 7 years | Tax/audit compliance |

### User Rights (GDPR/CCPA)

| Right | GDPR Article | CCPA Section | Response Time |
|-------|--------------|--------------|---------------|
| Access (data export) | Article 15 | Section 1798.100 | 30 days |
| Deletion | Article 17 | Section 1798.105 | 30 days (GDPR), 45 days (CCPA) |
| Rectification | Article 16 | N/A | Immediate (self-service) |
| Portability | Article 20 | N/A | 30 days (JSON export) |
| Objection (opt-out) | Article 21 | Section 1798.120 | Immediate (self-service) |

### Compliance Checklists

**Before collecting new data types**:
- [ ] Identify sensitivity tier (Tier 1-5)
- [ ] Define retention period
- [ ] Document in privacy policy
- [ ] Implement encryption (if Tier 1-2)
- [ ] Add to data export process
- [ ] Create deletion procedure
- [ ] Add monitoring/alerts

**Before launching new features**:
- [ ] Review data collected
- [ ] Apply data minimization (collect only what's needed)
- [ ] Implement RLS policies
- [ ] Add PII hashing to logs
- [ ] Document in data lineage
- [ ] Add data quality tests
- [ ] Train support team on user rights

---

## Contact

**Data Governance Lead**: Buck (Data Engineering)
**Security Officer**: Samantha (Security)
**Privacy Counsel**: TBD (Legal)

**Questions or Policy Updates**: Contact Buck or create a GitHub issue with the `data-governance` label.

---

## Related Documentation

- [Authentication Security](../auth/SECURITY.md) - PII protection, email hashing
- [API Documentation](../API.md) - Data access patterns
- [Architecture](../ARCHITECTURE.md) - Data flow diagrams
- [Product Vision](../../PRODUCT-VISION.md) - Privacy-first philosophy

---

**Document Version**: 1.0
**Next Review**: 2026-04-25 (Quarterly)
