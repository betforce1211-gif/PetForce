# Cohort Analysis Feature

**Status**: DESIGN PHASE  
**Owner**: Ana (Analytics)  
**Priority**: LOW  
**Task**: #42

## Overview

Cohort analysis capability for PetForce that tracks how different groups of pet families engage with the platform over time. This enables data-driven understanding of retention patterns, feature adoption, and expansion opportunities.

**Core Philosophy**: "Pets are part of the family, so let's take care of them as simply as we can."

Cohort analysis supports this by:
- **Proactive insights**: Identify retention risks before families churn
- **Actionable patterns**: Discover what drives long-term success
- **Simple visualizations**: Complex retention data made scannable

## Quick Links

### Primary Documents
- **[COHORT-ANALYSIS-SPEC.md](./analytics/COHORT-ANALYSIS-SPEC.md)** - Complete specification (START HERE)
- **[IMPLEMENTATION-CHECKLIST.md](./analytics/IMPLEMENTATION-CHECKLIST.md)** - Implementation tasks & checklist
- **[DASHBOARD-WIREFRAMES.md](./analytics/DASHBOARD-WIREFRAMES.md)** - Detailed UI wireframes

### Related Documentation
- Analytics Skill: `/Users/danielzeddr/PetForce/.claude/skills/petforce/analytics/SKILL.md`
- Product Vision: `/Users/danielzeddr/PetForce/PRODUCT-VISION.md`
- Analytics Spec: `/Users/danielzeddr/PetForce/openspec/specs/analytics/spec.md`

## What We're Building

### 1. Retention Cohort Analysis
Track user retention by signup period (monthly/weekly cohorts) and identify retention patterns.

**Key Features**:
- Retention heatmap (cohorts × time periods)
- Retention curve comparison (up to 6 cohorts)
- Cohort detail pages with insights
- Automatic anomaly detection

**Key Metrics**:
- N-day/week/month retention
- Retention vs average
- Retention trend analysis

### 2. Feature Adoption Cohort Analysis
Measure how quickly cohorts adopt key features and identify adoption patterns that correlate with retention.

**Key Features**:
- Feature adoption timeline (stacked area chart)
- Time-to-adoption metrics
- Cohort comparison by feature
- Adoption velocity tracking

**Key Metrics**:
- Adoption rate by cohort
- Median time-to-adoption
- Adoption velocity (week 4 - week 1)

### 3. Expansion Cohort Analysis
Track upgrade and expansion patterns to identify high-value customers and expansion triggers.

**Key Features**:
- Expansion funnel (Sankey diagram)
- Expansion leading indicators
- Time-to-upgrade metrics
- ARR impact analysis

**Key Metrics**:
- Expansion rate by cohort
- Expansion ARR
- Time-to-expansion
- Conversion rates per tier

## Why This Matters

### Business Impact
- **Reduce churn**: Detect at-risk cohorts 2+ weeks earlier
- **Improve retention**: Data-driven product decisions (+5% retention target)
- **Increase expansion**: Identify expansion triggers (15% uplift target)
- **Forecast LTV**: Accurate customer lifetime value projections

### Team Impact
- **Casey (CS)**: Proactive churn prevention, targeted interventions
- **Peter (Product)**: Measure feature impact, prioritize roadmap
- **Marketing**: Optimize acquisition channels, measure campaign ROI
- **Leadership**: Forecast retention, calculate LTV for investors

## Timeline

| Phase | Duration | Focus | Deliverables |
|-------|----------|-------|--------------|
| **Phase 1** | Weeks 1-2 | Foundation | Database schema, calculation engine, API |
| **Phase 2** | Weeks 3-4 | Retention Analysis | Heatmap, curves, detail pages |
| **Phase 3** | Week 5 | Feature Adoption | Adoption tracking, timeline charts |
| **Phase 4** | Week 6 | Expansion Analysis | Expansion tracking, funnel viz |
| **Phase 5** | Week 7 | Polish & Launch | Performance, docs, training |

**Total Duration**: 6-7 weeks

## Success Metrics

### Adoption (30 days post-launch)
- 80% of product team uses weekly
- 60% of CS team uses weekly
- 40% of leadership views monthly

### Business Impact (90 days)
- Churn detected 2 weeks earlier (avg)
- 3+ product decisions informed by cohort data
- 1+ marketing campaign optimized
- LTV forecasting accuracy improved by 20%

### System Health
- 99.5% uptime
- <500ms avg query time
- Zero privacy incidents
- <5 bugs reported

## Technical Architecture

### Data Model
- `cohorts` - Cohort definitions (signup month/week)
- `cohort_memberships` - User-to-cohort assignments
- `cohort_metrics` - Pre-aggregated metrics (performance)
- `feature_adoption_events` - Feature usage tracking
- `expansion_events` - Upgrade/expansion tracking

### Calculation Engine
- Daily batch jobs (3am UTC)
- Incremental updates (only new data)
- Pre-aggregation (no runtime calculations)
- Cached queries (1hr TTL)

### API Endpoints
- `GET /api/analytics/cohorts` - List cohorts
- `GET /api/analytics/cohorts/:id/retention` - Retention data
- `GET /api/analytics/cohorts/:id/feature-adoption` - Adoption data
- `GET /api/analytics/cohorts/:id/expansion` - Expansion data
- `POST /api/analytics/cohorts/compare` - Compare cohorts

### Performance Targets
- Cohort list: <200ms
- Retention heatmap: <500ms
- Cohort detail: <300ms
- Comparison: <1s (max 6 cohorts)

## Privacy & Security

### Privacy Protections
1. **Aggregate Only**: Never show individual user data
2. **Minimum Cohort Size**: n ≥ 30 (suppress smaller cohorts)
3. **No PII**: All metrics are anonymized
4. **Opt-Out Respected**: Users who opt out excluded

### GDPR Compliance
- Right to be forgotten (delete from cohorts)
- Data retention (36 months)
- Consent required (analytics opt-in)
- Transparency (privacy policy disclosure)

### Access Control
- Role-based access (admin, product, CS, marketing)
- Audit trail for all queries
- Alert on unusual access patterns

## Key Design Decisions

### 1. Pre-Aggregation vs Real-Time
**Decision**: Pre-aggregate metrics daily (3am UTC)  
**Rationale**: Cohort analysis doesn't need real-time data. Daily batch is simpler, faster, and more cost-effective.  
**Trade-off**: Data is up to 24 hours old (acceptable for retention analysis)

### 2. Signup Cohorts Only (V1)
**Decision**: Start with signup date cohorts only  
**Rationale**: Covers 80% of use cases, simpler to implement and understand  
**Future**: Custom cohorts (behavioral, attribute-based) in Phase 2

### 3. Daily Batch vs Streaming
**Decision**: Daily batch processing  
**Rationale**: Retention metrics are inherently time-delayed. Streaming adds complexity without value.  
**Trade-off**: Can't see "live" cohort data (not needed)

### 4. Minimum Cohort Size (n=30)
**Decision**: Don't display cohorts with <30 users  
**Rationale**: Privacy protection, statistical significance  
**Trade-off**: New cohorts won't appear for ~1-2 months

## Dependencies

### Upstream (Need Before Starting)
- [ ] User activity tracking (Larry's telemetry)
- [ ] Feature usage events instrumented
- [ ] Subscription/plan data available
- [ ] Email confirmation flow tracking

### Downstream (This Unlocks)
- Predictive churn models (ML on cohort patterns)
- Personalized onboarding (adapt based on cohort insights)
- Targeted CS campaigns (Casey's interventions)
- LTV forecasting (finance/investor reporting)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Performance issues | Medium | High | Pre-aggregation, pagination, caching |
| Privacy concerns | Low | Critical | Aggregate-only, min cohort size, audit trail |
| Low team adoption | Medium | Medium | Training, documentation, integrate into workflows |
| Data quality issues | Medium | High | Validation, monitoring, confidence intervals |

## Team Collaboration

### Reviews Required
- **Peter (Product)**: Feature definitions, dashboard usefulness
- **Dexter (UX)**: Wireframes, responsive design, accessibility
- **Samantha (Security)**: Privacy implications, GDPR compliance
- **Buck (Data Engineering)**: Data schema, pipeline design
- **Larry (Logging)**: Feature event instrumentation, monitoring
- **Engrid (Engineering)**: Code review, performance
- **Tucker (QA)**: Testing validation, accessibility
- **Thomas (Documentation)**: User guides, API docs
- **Casey (Customer Success)**: Cohort definitions, use case validation

### Stakeholders
- **Product Team**: Monitor feature impact, prioritize roadmap
- **Customer Success**: Identify churn risks, target interventions
- **Marketing**: Optimize acquisition channels
- **Leadership**: Forecast retention, calculate LTV

## Next Steps

### Week 1 (Current)
1. ✅ Complete specification (this document)
2. ✅ Create implementation checklist
3. ✅ Design wireframes
4. [ ] Team reviews (Peter, Dexter, Samantha, Buck)
5. [ ] Address feedback
6. [ ] Finalize design

### Week 2-3
- Begin Phase 1 implementation (database, engine, API)
- Daily standups with Engrid
- Privacy review with Samantha

### Week 4-5
- Phase 2 implementation (retention dashboards)
- UX review with Dexter
- Accessibility testing with Tucker

## Open Questions

1. **Custom Cohorts in V1?**
   - **Recommendation**: No, start with signup cohorts only
   - **Rationale**: Simpler, covers 80% of use cases
   - **Future**: Phase 2 enhancement

2. **Real-Time Updates?**
   - **Recommendation**: Daily batch (3am UTC) with manual refresh
   - **Rationale**: Simpler, faster, less costly
   - **Future**: Consider streaming if demand justifies complexity

3. **Mobile App Access?**
   - **Recommendation**: Web-only for V1
   - **Rationale**: Complex visualizations, small audience
   - **Future**: Simplified mobile dashboard in Phase 2

4. **Customer Embedding?**
   - **Recommendation**: Internal tool only for V1
   - **Rationale**: Focus on internal use cases first
   - **Future**: Enterprise tier in Phase 3

## Resources

### Documentation
- [Complete Specification](./analytics/COHORT-ANALYSIS-SPEC.md)
- [Implementation Checklist](./analytics/IMPLEMENTATION-CHECKLIST.md)
- [Dashboard Wireframes](./analytics/DASHBOARD-WIREFRAMES.md)

### Examples
- Registration funnel dashboard: `/Users/danielzeddr/PetForce/docs/features/email-password-login/analytics/`
- Customer health dashboard: Casey's spec (openspec)
- Analytics skill: `/Users/danielzeddr/PetForce/.claude/skills/petforce/analytics/SKILL.md`

### External References
- [Cohort Analysis Guide (Mixpanel)](https://mixpanel.com/blog/cohort-analysis/)
- [Retention Analysis (Amplitude)](https://amplitude.com/blog/retention-analysis)
- [D3.js Heatmaps](https://d3-graph-gallery.com/heatmap.html)

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-25 | 1.0 | Initial design specification | Ana |

---

**Status**: DESIGN PHASE  
**Owner**: Ana (Analytics)  
**Created**: 2026-01-25  
**Next Review**: After team feedback
