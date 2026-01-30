# Registration Flow Analytics - Complete Specification

**Status**: Ready for Implementation  
**Priority**: P0  
**Owner**: Ana (Analytics Agent)  
**Sprint**: Weeks 1-2

## Overview

This proposal defines comprehensive analytics for the registration flow to measure the success of P0 fixes (Tucker's navigation blocking bug) and enable data-driven UX improvements.

## The Problem

Tucker discovered critical UX issues in registration:

1. **Navigation Blocking**: Users stuck after registration (can't reach verify-pending page)
2. **No Visibility**: No metrics to measure verification rate or identify bottlenecks
3. **Limited Tracking**: Only 4 funnel stages tracked, missing critical client-side events

**Result**: 0% email verification rate (users never reach verification page)

## The Solution

Enhanced analytics system with:

- **8-stage detailed funnel** (currently only 4 stages)
- **Navigation tracking** to detect the blocking bug
- **Performance metrics** (button latency, API time, total time)
- **Error categorization** (validation vs API vs navigation)
- **Real-time dashboard** with alerts
- **Platform comparison** (web vs mobile)

## Primary Metric

**Email Verification Completion Rate**

```
Verification Rate = (Users who verified email) / (Successful registrations)
Target: >75%
Current: ~0% (due to navigation bug)
```

## Documents in This Proposal

### 1. ANALYTICS-SPEC.md (Main Specification)

**Read this first!**

Complete technical specification including:

- Event taxonomy (client and server events)
- 8-stage funnel definition
- Metrics schema
- Alert configuration
- Dashboard wireframes
- Color palettes
- Accessibility requirements
- Performance guidelines
- Success criteria

**For**: Everyone (comprehensive reference)

### 2. IMPLEMENTATION-CHECKLIST.md (Task List)

**For developers!**

Actionable checklist organized by:

- Phase 1: Event Tracking (Engrid, Maya, Larry)
- Phase 2: Dashboard (Engrid)
- Phase 3: Alerting (Larry)
- Phase 4: Baseline Capture (Tucker)
- Phase 5: Post-Fix Validation (Tucker, Ana)

Includes dependencies, timeline, and success criteria.

**For**: Engrid, Maya, Larry, Tucker

### 3. dashboard-components-spec.md (UI Specifications)

**For Engrid!**

Detailed component specifications with:

- Visual wireframes (ASCII art)
- TypeScript interfaces
- Color palettes
- Implementation notes
- Accessibility requirements
- Performance requirements
- Responsive design guidelines

Components:

1. KPICard - Single metric display
2. FunnelChart - 8-stage visualization
3. PerformanceChart - Time series with percentiles
4. ErrorBreakdown - Error distribution
5. AlertPanel - Active alerts
6. PlatformComparison - Web vs Mobile

**For**: Engrid (Engineering Agent)

### 4. baseline-metrics-template.json (Data Template)

**For Tucker!**

JSON template for capturing baseline metrics before P0 fixes.

Purpose:

- Document broken state (0% navigation success)
- Compare before/after fix effectiveness
- Validate analytics accuracy

**For**: Tucker (Testing Agent)

## Quick Start Guide

### For Engrid (Engineering)

1. **Read**: `dashboard-components-spec.md` (component details)
2. **Read**: `IMPLEMENTATION-CHECKLIST.md` (your tasks)
3. **Implement**:
   - Add event tracking to registration flow
   - Build dashboard components
   - Create backend API endpoint
4. **Timeline**: Week 1

### For Maya (Mobile)

1. **Read**: `ANALYTICS-SPEC.md` Section 1 (Event Taxonomy)
2. **Read**: `IMPLEMENTATION-CHECKLIST.md` (your tasks)
3. **Implement**:
   - Same events as web
   - Add platform='mobile'
   - Track mobile-specific metrics
4. **Timeline**: Week 1

### For Larry (Logging/Backend)

1. **Read**: `ANALYTICS-SPEC.md` Section 1.2 (Server-Side Events)
2. **Read**: `IMPLEMENTATION-CHECKLIST.md` (your tasks)
3. **Implement**:
   - Enhance server events with correlation_id
   - Set up metrics aggregation API
   - Configure alert rules
4. **Timeline**: Week 1-2

### For Tucker (Testing)

1. **Read**: `ANALYTICS-SPEC.md` (overview)
2. **Read**: `IMPLEMENTATION-CHECKLIST.md` Phase 4 & 5
3. **Use**: `baseline-metrics-template.json`
4. **Tasks**:
   - Capture baseline before fixes
   - Validate analytics accuracy
   - Measure fix effectiveness
5. **Timeline**: Week 1-2

### For Peter (Product)

1. **Read**: `ANALYTICS-SPEC.md` Executive Summary & Success Criteria
2. **Review**: Dashboard wireframes in Section "Dashboard Wireframes"
3. **Approve**: Metrics align with product goals
4. **Use**: Dashboard to track registration health

### For Ana (Analytics - Me!)

1. **Monitor**: Implementation progress
2. **Support**: Answer questions about specs
3. **Validate**: Dashboard matches design
4. **Deliver**: Baseline report, impact report
5. **Timeline**: Week 1-2

## Key Metrics at a Glance

| Metric                  | Current | Target | Status      |
| ----------------------- | ------- | ------ | ----------- |
| Navigation Success Rate | 0%      | 100%   | 🔴 Critical |
| Email Verification Rate | 0%      | >75%   | 🔴 Critical |
| API Success Rate        | ~95%    | >95%   | ✓ Healthy   |
| p95 API Response Time   | ~4.8s   | <3s    | ⚠ Warning   |
| Error Rate              | ~13%    | <10%   | ⚠ Warning   |

## 8-Stage Funnel

```
1. Page Viewed           → Baseline (100%)
2. Form Interaction      → Target: 85%
3. Form Filled           → Target: 95% of stage 2
4. Submit Clicked        → Target: 98% of stage 3
5. API Success           → Target: 95% of stage 4
6. Navigation Success    → Target: 100% of stage 5 (CURRENTLY 0% 🔴)
7. Verify Page Viewed    → Target: 100% of stage 6
8. Email Verified        → Target: 75% of stage 7 (within 24h)
```

## Event Flow

```
User Journey                  Client Events                    Server Events
─────────────────────────────────────────────────────────────────────────────

1. Lands on /auth?mode=register
   └─> registration.page.viewed

2. Types in email field
   └─> registration.form.interaction

3. Fills all fields
   └─> registration.form.filled

4. Clicks "Create account"
   └─> registration.submit.clicked
   └─> registration.performance (button latency)

5. API call sent
                                                 ──> registration_attempt_started
6. API returns success
                                                 <── registration_completed
   └─> registration.performance (API time)

7. Navigate to verify-pending
   └─> registration.navigation.attempted
   └─> registration.navigation.result (success/failure)
   [CURRENTLY FAILS HERE 🔴]

8. Verify-pending page loads
   └─> registration.verify_page.viewed

9. User checks email, clicks link
                                                 ──> email_confirmed
   └─> email.verified

10. User logs in
                                                 ──> login_attempt_started
                                                 <── login_completed
```

## Dashboard Preview

Main dashboard will show:

- **Alerts Panel**: Critical navigation failure highlighted
- **4 KPI Cards**: Total regs, API success, Navigation success, Verification rate
- **Funnel Chart**: Visual representation of 8 stages
- **Performance Charts**: API time, button latency (p50/p95/p99)
- **Error Breakdown**: Pie chart + top errors list
- **Platform Comparison**: Web vs Mobile side-by-side

See `ANALYTICS-SPEC.md` for full wireframe.

## Timeline

**Week 1**:

- Days 1-2: Event tracking (Engrid, Maya)
- Days 3-4: Backend aggregation (Larry)
- Days 4-5: Dashboard implementation (Engrid)
- Day 5: Baseline capture (Tucker)

**Week 2**:

- Days 1-2: P0 fixes deployed (Tucker)
- Days 2-3: Alert configuration (Larry)
- Days 3-4: Validation testing (Tucker)
- Days 4-5: Impact report (Ana)

## Dependencies

```
Ana (specs) ──> Engrid (implementation)
                  │
                  ├──> Larry (backend API)
                  └──> Maya (mobile events)

Tucker waits for Engrid deployment
Ana waits for Tucker's test results
```

## Success Criteria

This project succeeds when:

1. **Bug Detection**: Dashboard shows 0% navigation success before fix ✓
2. **Bug Validation**: Dashboard shows 100% navigation success after fix
3. **Primary Goal**: Email verification rate >75%
4. **Performance**: Dashboard loads <2s, updates <500ms
5. **Alerts**: Navigation failure alert fires within 1 min
6. **Accessibility**: All WCAG AA tests pass
7. **Adoption**: Tucker and Peter use dashboard to validate features

## Next Steps (Post-P0)

After validating P0 fixes:

1. **A/B Testing Framework** (P1)
   - Test loading text variants
   - Test transition durations
   - Test button copy

2. **Predictive Analytics** (P2)
   - Predict verification likelihood
   - Identify at-risk users
   - Cohort retention forecasting

3. **Business Impact** (P2)
   - ROI calculation dashboard
   - CAC impact analysis
   - Activation funnel optimization

4. **Customer-Facing Analytics** (P3)
   - Embeddable dashboards
   - White-label solutions
   - API access

## Questions?

**For specification questions**: Ask Ana (Analytics Agent)  
**For implementation questions**: Check `IMPLEMENTATION-CHECKLIST.md`  
**For component design questions**: Check `dashboard-components-spec.md`  
**For baseline data questions**: Check `baseline-metrics-template.json`

## References

- **Existing Code**:
  - Metrics: `/packages/auth/src/utils/metrics.ts`
  - Dashboard: `/apps/web/src/features/auth/pages/AuthMetricsDashboard.tsx`
  - Auth API: `/packages/auth/src/api/auth-api.ts`
- **Product Context**:
  - Product Vision: `/PRODUCT-VISION.md`
  - Tucker's P0 Issues: (link when available)

---

**Ready to implement? Start with `IMPLEMENTATION-CHECKLIST.md`!**
