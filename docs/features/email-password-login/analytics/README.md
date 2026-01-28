# Analytics Implementation - Email/Password Login

**Status**: READY FOR TEAM REVIEW  
**Owner**: Ana (Analytics)  
**Timeline**: 3-4 weeks  
**Priority**: MEDIUM

## Quick Links

- **Implementation Plan**: [ANALYTICS-IMPLEMENTATION-PLAN.md](./ANALYTICS-IMPLEMENTATION-PLAN.md) - Start here for overview
- **Task #22 Spec**: [email-engagement-tracking-spec.md](./email-engagement-tracking-spec.md) - Email engagement tracking details
- **Task #29 Spec**: [registration-funnel-dashboard-spec.md](./registration-funnel-dashboard-spec.md) - Dashboard design & implementation

## What We're Building

### 1. Email Engagement Tracking (Task #22)
**Problem**: 30% drop-off between registration and confirmation. Don't know if it's email delivery or user behavior.

**Solution**: Add UTM parameters to confirmation emails to track:
- Email link click rate
- Time from sent → clicked → confirmed
- Spam filter issues (sent but never clicked)

**Privacy-First Approach**: No tracking pixels, only click tracking (first-party, GDPR compliant)

**Key Metrics**:
- Click Rate: >60% (industry benchmark: 60-75%)
- Avg Time to Click: <10 min
- Spam Issues: <5% (emails sent but not clicked in 24h)

### 2. Registration Funnel Dashboard (Task #29)
**Problem**: Metrics collected but not visualized. Team can't quickly spot issues.

**Solution**: Real-time dashboard showing:
- Funnel KPIs (started, completed, confirmed, login)
- Email delivery health
- Login success trends
- Active alerts when metrics unhealthy

**Key Features**:
- Updates every 30 seconds
- Mobile-friendly
- Accessible (WCAG AA)
- Actionable alerts

## Why This Matters

**Alignment with Product Vision**:
> "Pets are part of the family, so let's take care of them as simply as we can."

These analytics make registration simpler by:
- **Proactive over Reactive**: Detect email issues before pet parents complain
- **Actionable insights**: Focus on metrics that drive decisions (confirmation rate, not vanity metrics)
- **Simple dashboards**: Team can understand health at a glance

**Business Impact**:
- Reduce email delivery issues by 60% (faster detection)
- Improve confirmation rate from 70% → 80% (data-driven optimization)
- Reduce support tickets about "email not received" by 50%
- Enable A/B testing of email copy

## Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| **1** | Email Engagement Tracking | UTM tracking live in staging |
| **2** | Email tracking to prod + Dashboard prep | Email tracking live, dashboard started |
| **3** | Dashboard components | All components built and tested |
| **4** | Dashboard launch | Dashboard live in production |

## Current Status

**Week 1 - Email Engagement Tracking**:
- [ ] Spec complete ✅ (this document)
- [ ] Implementation (Day 1-2)
- [ ] Testing (Day 3)
- [ ] Reviews (Day 4)
  - [ ] Peter: Approve UTM naming convention
  - [ ] Samantha: Privacy review
  - [ ] Larry: Monitoring readiness
- [ ] Deploy to staging (Day 5)

**Next Steps**:
1. Team reviews specs (this week)
2. Ana begins implementation (Week 1, Day 1)
3. Schedule reviews with Peter, Samantha, Dexter

## Technical Summary

### Email Engagement Tracking
**Files Changed**:
- `/supabase/functions/resend-confirmation/index.ts` - Add UTM to redirect URL
- `/packages/auth/src/utils/metrics.ts` - Add email engagement metrics
- `/apps/web/src/features/auth/pages/VerifyEmailPage.tsx` - Track clicks

**UTM Parameters**:
```
?utm_source=email
&utm_medium=confirmation
&utm_campaign=registration
&utm_content=primary_button
&utm_term=v1
```

### Registration Funnel Dashboard
**Components**:
- `FunnelKPICard.tsx` - KPI cards with sparklines
- `FunnelChart.tsx` - Visual funnel with drop-offs
- `EmailHealthPanel.tsx` - Email engagement metrics
- `LoginSuccessChart.tsx` - Login success trends
- `AlertsPanel.tsx` - Active warnings

**Data Flow**:
```
Auth Events → metrics.record() → Dashboard (polls every 30s) → Charts
```

## Success Metrics (30 Days Post-Launch)

**Email Engagement Tracking**:
- ✅ Click rate baseline established (>60%)
- ✅ Spam filter issues identified
- ✅ Zero privacy complaints

**Registration Funnel Dashboard**:
- ✅ Product team uses 3x/week
- ✅ Incident detection time reduced (hours → minutes)
- ✅ 80% of stakeholders find valuable

**Business Impact**:
- ✅ Confirmation rate improves 70% → 75%
- ✅ Support tickets reduced by 30%

## Team Collaboration

### Reviews Required
- **Peter (Product)**: UTM naming convention, dashboard usefulness
- **Dexter (UX)**: Dashboard wireframes, responsive design
- **Samantha (Security)**: Privacy implications, GDPR compliance
- **Larry (Logging)**: Monitoring readiness
- **Chuck (CI/CD)**: Deployment assistance
- **Engrid (Engineering)**: Code review
- **Tucker (QA)**: Testing validation

### Who Uses the Dashboard?
- Product Team: Monitor funnel health, A/B test results
- Engineering Team: Incident response, performance monitoring
- Support Team: Identify widespread email issues
- Customer Success: Understand onboarding friction

## Questions?

- **Implementation details**: See individual specs (linked above)
- **Timeline questions**: See [ANALYTICS-IMPLEMENTATION-PLAN.md](./ANALYTICS-IMPLEMENTATION-PLAN.md)
- **Technical questions**: Ana (Analytics agent)
- **Product questions**: Peter (Product agent)

---

**Created**: 2026-01-25  
**Owner**: Ana (Analytics)  
**Status**: READY FOR TEAM REVIEW
