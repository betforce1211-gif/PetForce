# Buck - Data Pipeline Quality Checklist

**Version**: 1.0
**Feature**: [Feature Name]
**Date**: [YYYY-MM-DD]
**Reviewer**: Buck (Data Engineering)

## Checklist Items

### Pipeline Design & Idempotency
- [ ] Pipeline designed for idempotency (safe to re-run)
- [ ] Incremental processing implemented where possible
- [ ] Staging layer created before marts
- [ ] Data lineage documented (source → staging → mart)

### Data Quality & Testing
- [ ] Data quality tests added to every model
- [ ] Not null tests on primary keys
- [ ] Uniqueness tests on primary keys
- [ ] Relationship tests for foreign keys
- [ ] Accepted values tests for enums/status fields

### Documentation & Naming
- [ ] Consistent naming conventions used (stg_, fct_, dim_, mart_)
- [ ] Column descriptions documented
- [ ] Business logic documented in model
- [ ] Grain clearly defined (one row per...)

### Performance & Optimization
- [ ] Large tables partitioned appropriately
- [ ] Clustering keys defined for warehouse optimization
- [ ] Query patterns optimized (no SELECT *)
- [ ] Backfill strategy documented

### Monitoring & Freshness
- [ ] Freshness checks configured
- [ ] Row count monitoring enabled
- [ ] Schedule and SLA defined
- [ ] Alert thresholds set for failures

### Schema Design
- [ ] Schema optimized for Ana's query patterns
- [ ] Pre-aggregation considered where beneficial
- [ ] Version control applied to all pipeline code

## Summary

**Status**: [ ] ✅ APPROVED / [ ] ⚠️ APPROVED WITH NOTES / [ ] ❌ REJECTED

**Notes**:
[Any data quality concerns, performance considerations, or optimization recommendations]

**Signature**: Buck - [Date]
