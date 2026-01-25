# Capability Spec: Data Engineering

**Status**: MODIFIED
**Change**: add-agent-quality-checklists
**Owner**: Dante (Data Engineering)

## ADDED Requirements

### Requirement: Data Engineering SHALL provide data pipeline quality checklist

Data Engineering SHALL provide a quality review checklist to ensure data pipeline, ETL, and data quality standards are met before features proceed through stage gates.

#### Scenario: Complete Data Engineering quality checklist
- **GIVEN** a feature with data pipeline or storage requirements ready for review
- **WHEN** Data Engineering evaluates the feature
- **THEN** all checklist items SHALL be evaluated as Yes, No, or N/A
- **AND** "No" items SHALL be documented with data quality risks
- **AND** N/A items SHALL include justification for non-applicability
- **AND** checklist SHALL be signed, dated, and attached to release notes

**Data Engineering Quality Checklist (v1.0)**:

1. **Data Schema**: Database schema designed with proper normalization and indexes
2. **Data Validation**: Input data validated before storage (type checking, constraints)
3. **Data Integrity**: Foreign key constraints and referential integrity enforced
4. **ETL Pipelines**: ETL jobs idempotent (can safely rerun without data corruption)
5. **Data Backfill**: Historical data migration/backfill strategy defined (if applicable)
6. **Data Quality Checks**: Automated data quality checks in place (null checks, range validation)
7. **Data Lineage**: Data lineage documented (source → transformations → destination)
8. **Performance Optimization**: Queries optimized with appropriate indexes and query plans reviewed
9. **Data Retention**: Data retention and archival policies implemented
10. **PII Handling**: PII data encrypted at rest and access-controlled
11. **Data Recovery**: Backup and recovery procedures tested for new data stores
12. **Batch Job Monitoring**: Scheduled jobs monitored with failure alerts
13. **Data Volume Scaling**: Pipeline can handle expected data volume growth (10x current load)
14. **Data Documentation**: Data dictionary updated with new tables/fields

**Approval Options**:
- [ ] Approved (data engineering standards met)
- [ ] Approved with Notes (minor issues documented, non-blocking)
- [ ] Concerns Raised (data quality or scalability risks, recommend remediation)

**Notes**: _____________________________________________________________________________

**Reviewer**: Dante (Data Engineering)
**Date**: _________________
**Checklist Version**: 1.0
**Signature**: _________________
