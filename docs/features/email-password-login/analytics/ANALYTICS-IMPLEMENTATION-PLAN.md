# Analytics Implementation Plan - Email/Password Login

**Owner**: Ana (Analytics)  
**Status**: READY FOR TEAM REVIEW  
**Priority**: MEDIUM  
**Created**: 2026-01-25  
**Estimated Timeline**: 3-4 weeks

## Executive Summary

This plan implements two analytics enhancements to turn our comprehensive logging into actionable insights for improving pet family outcomes:

1. **Email Engagement Tracking** (Task #22) - Measure email delivery effectiveness
2. **Registration Funnel Dashboard** (Task #29) - Visualize registration health in real-time

**Business Impact**: 
- Reduce email delivery issues by 60% (faster detection)
- Improve confirmation rate from 70% → 80% (data-driven optimization)
- Reduce support tickets about "email not received" by 50%
- Enable A/B testing of email copy to improve conversion

**Alignment with Product Vision**:
> "Pets are part of the family, so let's take care of them as simply as we can."

These analytics help us make registration simpler by:
- **Proactive over Reactive**: Detect email issues before pet parents complain
- **Actionable insights**: Focus on metrics that drive decisions (confirmation rate, not vanity metrics)
- **Simple, scannable dashboards**: Team can understand health at a glance

## Tasks Overview

| Task | Description | Complexity | Timeline | Dependencies |
|------|-------------|------------|----------|--------------|
| **#22** | Email Engagement Tracking | Medium | Week 1-2 | Peter approval |
| **#29** | Registration Funnel Dashboard | Medium | Week 2-4 | Task #22, Dexter UX review |

**Total Effort**: 3-4 weeks (can parallelize some work)

## Task #22: Email Engagement Tracking

### What We're Building
Add UTM parameters to confirmation email links to track:
- Did the user click the email link?
- How long between email sent → clicked?
- How long between clicked → confirmed?
- Are emails going to spam? (sent but not clicked after 24h)

### Why It Matters
**Current Problem**: 30% of users drop off between registration and confirmation. We don't know if this is:
- Email delivery issue (spam filters, wrong address)
- UX issue (confusing email copy)
- Timing issue (users check email later)

**Solution**: Track email link clicks to distinguish delivery vs. behavior issues.

### Technical Approach
**Privacy-First**: No email open tracking pixels (privacy-friendly approach)
- Only track clicks on links users intentionally clicked
- Use UTM parameters (first-party tracking, GDPR compliant)
- No third-party tracking services

**Implementation**:
```typescript
// Before
redirectTo: 'https://petforce.app/auth/verify'

// After
redirectTo: 'https://petforce.app/auth/verify?utm_source=email&utm_medium=confirmation&utm_campaign=registration&utm_content=primary_button&utm_term=v1'

// Track on verify page
useEffect(() => {
  if (params.get('utm_source') === 'email') {
    metrics.record('email_link_clicked', { ... });
  }
}, []);
```

### Success Criteria
- ✅ 100% of confirmation emails have UTM parameters
- ✅ Link click events tracked for >95% of confirmations
- ✅ Baseline click rate established (target: >60%)
- ✅ Zero privacy complaints

### Files Changed
1. `/supabase/functions/resend-confirmation/index.ts` - Add UTM to redirect URL
2. `/packages/auth/src/utils/metrics.ts` - Add email engagement metrics
3. `/apps/web/src/features/auth/pages/VerifyEmailPage.tsx` - Track clicks

### Risks
- **Low**: UTM parameters could break links (mitigation: thorough testing)
- **Low**: Privacy concerns (mitigation: no tracking pixels, transparent)

**Full Spec**: `/docs/features/email-password-login/analytics/email-engagement-tracking-spec.md`

## Task #29: Registration Funnel Dashboard

### What We're Building
Real-time dashboard showing registration funnel health:
- KPI cards for each funnel stage (started, completed, confirmed, login)
- Visual funnel showing drop-off points
- Email delivery health (from Task #22)
- Login success rate trends
- Active alerts when metrics are unhealthy

### Why It Matters
**Current Problem**: 
- Metrics are collected but not visualized
- Team must write code to check funnel health
- Can't quickly spot when email delivery breaks
- No visibility during incidents

**Solution**: Scannable dashboard that shows funnel health at a glance.

### Dashboard Layout
```
┌──────────────────────────────────────────┐
│ Registration Funnel Health               │
│ Status: ● OK   Alerts: 0   Period: 24h  │
├──────────┬──────────┬──────────┬─────────┤
│ Started  │Completed │Confirmed │ Login   │
│ 1,247    │1,123(90%)│786 (70%) │724(92%) │
│ +12%     │+10%      │-5% ⚠️    │+8%      │
├──────────┴──────────┴──────────┴─────────┤
│         Registration Funnel              │
│  Started → Completed → Confirmed → Login │
│   1,247     1,123       786       724    │
│         90%        70%⚠️      92%        │
├──────────────────────────────────────────┤
│        Email Delivery Health             │
│  Sent: 1,123  Clicked: 820 (73%)        │
│  Confirmed: 786 (96% of clicks) ✅       │
├──────────────────────────────────────────┤
│        Active Alerts                     │
│  ⚠️ Confirmation rate at 70% threshold   │
└──────────────────────────────────────────┘
```

### Success Criteria
- ✅ Dashboard loads in <2 seconds
- ✅ Updates every 30 seconds (real-time)
- ✅ Mobile-friendly (viewable on phone)
- ✅ Product team uses 3x/week
- ✅ Reduces incident detection time from hours → minutes

### Components
1. `FunnelKPICard.tsx` - KPI cards with sparklines
2. `FunnelChart.tsx` - Visual funnel with drop-offs
3. `EmailHealthPanel.tsx` - Email engagement metrics
4. `LoginSuccessChart.tsx` - Login success trends
5. `AlertsPanel.tsx` - Active warnings

### Risks
- **Medium**: Team doesn't use dashboard (mitigation: make it actionable, integrate into incidents)
- **Low**: Performance issues with polling (mitigation: 30s interval, caching)

**Full Spec**: `/docs/features/email-password-login/analytics/registration-funnel-dashboard-spec.md`

## Timeline & Milestones

### Week 1: Email Engagement Tracking (Task #22)
**Owner**: Ana  
**Reviewers**: Peter (approve UTM convention), Samantha (privacy review)

- [ ] **Day 1-2**: Implementation
  - Add UTM helper function to resend-confirmation
  - Update metrics.ts with email engagement events
  - Add tracking to verify page
  - Unit tests

- [ ] **Day 3**: Testing
  - Manual testing with real emails
  - Verify UTM parameters in links
  - Check metrics collection

- [ ] **Day 4**: Review & Approval
  - Peter reviews UTM naming convention
  - Samantha reviews privacy implications
  - Larry confirms monitoring can handle new events

- [ ] **Day 5**: Deploy to Staging
  - Deploy and monitor for issues
  - Validate with test registrations

**Milestone**: Email engagement tracking live in staging ✅

### Week 2: Email Tracking to Production + Dashboard Prep
**Owner**: Ana  
**Reviewers**: Chuck (deployment), Dexter (UX design review)

- [ ] **Day 1**: Production Deployment (Task #22)
  - Deploy email engagement tracking to production
  - Monitor for 24 hours
  - Validate data quality

- [ ] **Day 2-3**: Dashboard Design Review
  - Dexter reviews dashboard wireframes
  - Iterate on UX feedback
  - Finalize component specs

- [ ] **Day 4-5**: Dashboard Development Begins
  - Create dashboard file structure
  - Implement `useRegistrationMetrics` hook
  - Build KPI card components

**Milestone**: Email tracking live in production, dashboard foundation built ✅

### Week 3: Dashboard Components
**Owner**: Ana  
**Reviewers**: Engrid (code review), Dexter (UX validation)

- [ ] **Day 1-2**: Core Components
  - FunnelChart component
  - EmailHealthPanel component
  - AlertsPanel component

- [ ] **Day 3-4**: Integration & Styling
  - Integrate all components
  - Responsive design (mobile, tablet, desktop)
  - Accessibility audit

- [ ] **Day 5**: Testing
  - Unit tests for all components
  - Visual regression tests
  - Manual testing on devices

**Milestone**: Dashboard components complete and tested ✅

### Week 4: Dashboard Launch
**Owner**: Ana  
**Reviewers**: Peter (product validation), Tucker (QA)

- [ ] **Day 1**: Staging Deployment
  - Deploy to staging
  - Invite Product/Engineering to test
  - Gather feedback

- [ ] **Day 2-3**: Iteration
  - Address feedback
  - Performance optimization
  - Final accessibility check

- [ ] **Day 4**: Production Deployment
  - Deploy to production
  - Add to internal tools menu
  - Announce to team

- [ ] **Day 5**: Documentation & Monitoring
  - Document how to use dashboard
  - Set up usage monitoring
  - Create team training session

**Milestone**: Dashboard live in production ✅

## Collaboration Points

### Ana ↔ Peter (Product)
- **Week 1, Day 4**: Peter approves UTM parameter naming convention
- **Week 2, Day 2**: Peter reviews dashboard wireframes
- **Week 4, Day 1**: Peter validates dashboard usefulness

### Ana ↔ Dexter (UX)
- **Week 2, Day 2-3**: Dexter reviews dashboard design
- **Week 3, Day 4**: Dexter validates responsive design
- **Week 4, Day 1**: Dexter tests final UX

### Ana ↔ Samantha (Security)
- **Week 1, Day 4**: Samantha reviews privacy implications of UTM tracking
- **Week 1, Day 4**: Samantha confirms GDPR compliance

### Ana ↔ Larry (Logging)
- **Week 1, Day 4**: Larry confirms monitoring can handle new email engagement events
- **Week 2, Day 1**: Larry monitors production deployment

### Ana ↔ Chuck (CI/CD)
- **Week 2, Day 1**: Chuck assists with production deployment of email tracking
- **Week 4, Day 4**: Chuck assists with dashboard deployment

### Ana ↔ Engrid (Engineering)
- **Week 3, Day 3**: Engrid code reviews dashboard components
- **Week 3, Day 5**: Engrid reviews performance optimization

### Ana ↔ Tucker (QA)
- **Week 3, Day 5**: Tucker tests dashboard functionality
- **Week 4, Day 1**: Tucker validates staging deployment

### Ana ↔ Casey (Customer Success)
- **Week 4, Day 5**: Casey learns to use dashboard for support insights
- **Ongoing**: Casey provides feedback on what metrics help customer success

## Success Metrics (30 Days Post-Launch)

### Email Engagement Tracking (Task #22)
- ✅ Click rate baseline established (target: >60%)
- ✅ Avg time to click measured (target: <10 min)
- ✅ Spam filter issues identified (sent but not clicked)
- ✅ Zero privacy complaints

### Registration Funnel Dashboard (Task #29)
- ✅ Product team uses 3x/week minimum
- ✅ Engineering checks during incidents
- ✅ Reduced incident detection time (hours → minutes)
- ✅ 80% of stakeholders find dashboard valuable

### Business Impact
- ✅ Confirmation rate improves 70% → 75% (through data-driven optimization)
- ✅ Support tickets about "email not received" reduced by 30%
- ✅ A/B test framework ready for email copy testing

## Risk Register

| Risk | Impact | Likelihood | Mitigation | Owner |
|------|--------|------------|------------|-------|
| UTM parameters break email links | HIGH | LOW | Thorough testing; parameters are URL-safe | Ana |
| Team doesn't use dashboard | HIGH | MEDIUM | Make actionable; integrate into incidents | Peter |
| Privacy concerns from users | MEDIUM | LOW | No tracking pixels; transparent policy | Samantha |
| Dashboard performance issues | MEDIUM | LOW | 30s polling; caching; data limits | Ana |
| Email tracking adds latency | MEDIUM | LOW | Async tracking; non-blocking | Larry |

## Budget & Resources

### Development Time
- Ana: 3-4 weeks (primary developer)
- Dexter: 1 day (UX review)
- Peter: 0.5 day (product review)
- Engrid: 0.5 day (code review)
- Tucker: 0.5 day (QA testing)

**Total**: ~3.5 weeks (one developer + reviews)

### Infrastructure Costs
- No additional costs (uses existing metrics infrastructure)
- Dashboard hosted on existing web app
- No third-party analytics services

## Future Enhancements (Post-Launch)

### Short-term (3 months)
- A/B testing framework for email copy
- Slack alerts when metrics are unhealthy
- Email digest (daily summary to team)
- Date range picker (7d, 30d, custom)

### Medium-term (6 months)
- Email provider breakdown (Gmail vs Outlook confirmation rates)
- Cohort analysis (registration date → conversion rate)
- Integration with Casey's customer health dashboard
- Mobile app dashboard (native implementation)

### Long-term (12+ months)
- Predictive alerts ("Confirmation rate will drop in 2 hours")
- Anomaly detection (ML-based)
- Custom dashboard builder (drag-and-drop widgets)

## Appendices

### A. Related Documents
- Email Engagement Tracking Spec: `./email-engagement-tracking-spec.md`
- Registration Funnel Dashboard Spec: `./registration-funnel-dashboard-spec.md`
- Ana's 14-Agent Review Checklist: `../checklists/ana-analytics-checklist.md`
- Product Vision: `/PRODUCT-VISION.md`
- Analytics Skill: `/.claude/skills/petforce/analytics/SKILL.md`

### B. Benchmarks
**Email Engagement** (Transactional Emails):
- Open rate: 20-30%
- Click rate: 15-25%
- Email-to-confirmation: 70-85%

**Registration Funnels** (SaaS Industry):
- Started → Completed: 85-95%
- Completed → Confirmed: 70-85%
- Confirmed → First Login: 90-95%

**Our Current Performance**:
- Started → Completed: 90% ✅
- Completed → Confirmed: 70% ⚠️ (at threshold)
- Confirmed → First Login: 92% ✅

### C. Decision Log

**Decision 1: No Email Open Tracking Pixels**
- **Date**: 2026-01-25
- **Decision**: Use click tracking only, no open tracking pixels
- **Rationale**: Privacy-friendly; Apple Mail blocks pixels anyway; clicks are sufficient
- **Owner**: Ana, approved by Samantha

**Decision 2: 30-Second Dashboard Refresh**
- **Date**: 2026-01-25
- **Decision**: Poll metrics every 30 seconds
- **Rationale**: Balance between "real-time" feeling and server load
- **Owner**: Ana, approved by Larry

**Decision 3: Internal Dashboard Only (For Now)**
- **Date**: 2026-01-25
- **Decision**: Dashboard is internal-only, not customer-facing
- **Rationale**: Focus on team use first, customer-facing later
- **Owner**: Peter

### D. Open Questions

1. **Should we add Slack alerts when metrics are unhealthy?**
   - Status: Deferred to post-launch enhancement
   - Owner: Ana + Larry

2. **Should dashboard be customer-facing eventually?**
   - Status: Yes, but not MVP (6-month enhancement)
   - Owner: Peter

3. **Should we track engagement for password reset emails too?**
   - Status: Yes, use same UTM approach
   - Owner: Ana (Week 2 task)

## Getting Started

### For Ana (Primary Developer)
1. Read both detailed specs (email tracking, dashboard)
2. Set up feature branch: `feature/analytics-email-engagement-tracking`
3. Start Week 1 implementation (email tracking)
4. Schedule reviews with Peter, Samantha, Dexter

### For Reviewers
- **Peter**: Review UTM naming convention (Week 1, Day 4)
- **Dexter**: Review dashboard wireframes (Week 2, Day 2-3)
- **Samantha**: Review privacy implications (Week 1, Day 4)
- **Larry**: Confirm monitoring readiness (Week 1, Day 4)

### For Stakeholders
- **Product Team**: Dashboard will be ready Week 4
- **Support Team**: Dashboard will help identify email issues faster
- **Engineering**: Dashboard will be part of incident response toolkit

---

**Next Steps**:
1. Ana: Begin implementation (Week 1, Day 1)
2. Peter: Review this plan and approve priority
3. Dexter: Schedule UX review for Week 2
4. Team: Standby for reviews as scheduled

**Questions?** Reach out to Ana (Analytics agent)

---

**Document Owner**: Ana (Analytics)  
**Last Updated**: 2026-01-25  
**Status**: READY FOR TEAM REVIEW  
**Approval Required**: Peter (Product), Dexter (UX), Samantha (Security)
