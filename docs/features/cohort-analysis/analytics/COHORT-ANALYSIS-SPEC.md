# Cohort Analysis Capability - PetForce

**Status**: DESIGN PHASE  
**Owner**: Ana (Analytics)  
**Priority**: LOW  
**Timeline**: 4-6 weeks  
**Task**: #42

## Executive Summary

Design and implement cohort analysis capability to track how different groups of pet families engage with PetForce over time. This enables data-driven understanding of retention patterns, feature adoption, and expansion opportunities.

**Core Principle**: "Pets are part of the family, so let's take care of them as simply as we can."

Cohort analysis makes pet care simpler by:
- **Proactive insights**: Identify retention risks before families churn
- **Actionable patterns**: Discover what drives long-term success
- **Simple visualizations**: Complex retention data made scannable

## Problem Statement

### Current State
- Customer health scores exist but lack time-based analysis
- No visibility into how user behavior changes over time
- Can't identify which onboarding patterns lead to retention
- No data on feature adoption timing or patterns
- Can't compare effectiveness of product changes across cohorts

### Pain Points
1. **Casey (Customer Success)**: Can't identify early warning signs of churn
2. **Peter (Product)**: No data on which features drive retention
3. **Leadership**: Can't predict long-term retention or LTV
4. **Marketing**: Can't measure campaign effectiveness over time

### Business Impact
- Churn discovered too late (reactive vs proactive)
- Product decisions based on intuition, not data
- Can't identify expansion triggers
- No visibility into customer lifecycle stages

## Solution Overview

### What We're Building

**Cohort Analysis Platform** with three core capabilities:

1. **Retention Cohort Analysis**
   - Track user retention by signup month/week
   - Visualize retention curves over time
   - Compare cohort performance
   - Identify retention inflection points

2. **Feature Adoption Cohort Analysis**
   - Track feature adoption rate by cohort
   - Measure time-to-adoption for key features
   - Identify adoption patterns that correlate with retention
   - Compare feature rollout impact across cohorts

3. **Expansion Cohort Analysis**
   - Track upgrade/expansion patterns by cohort
   - Identify expansion triggers (features, usage patterns)
   - Measure time-to-expansion
   - Profile high-value customer characteristics

### Key Design Principles

1. **Pet Family-Centric Metrics**
   - Measure family success, not just logins
   - Track pet health improvements over time
   - Focus on value delivered, not vanity metrics

2. **Actionable Over Academic**
   - Every chart answers "What should we do?"
   - Highlight anomalies and trends automatically
   - Provide next-step recommendations

3. **Accessible Complexity**
   - Simple default views for quick insights
   - Drill-down for deeper analysis
   - Mobile-friendly, WCAG AA compliant

4. **Privacy-Preserving**
   - Aggregate data only (no individual tracking)
   - Minimum cohort size (n=30) for privacy
   - GDPR/CCPA compliant

## Technical Architecture

### Data Model

```sql
-- Cohort definitions
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cohort_type VARCHAR(50) NOT NULL, -- 'signup_month', 'signup_week', 'custom'
  cohort_period DATE NOT NULL, -- 2026-01-01, 2026-01-W01, etc.
  definition JSONB, -- Custom cohort criteria
  user_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cohort_type, cohort_period)
);

-- Cohort membership (pre-calculated for performance)
CREATE TABLE cohort_memberships (
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY(cohort_id, user_id)
);

-- Cohort metrics (pre-aggregated for fast queries)
CREATE TABLE cohort_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL, -- 'retention_rate', 'feature_adoption', etc.
  period_offset INTEGER NOT NULL, -- Days/weeks/months since cohort start
  metric_value DECIMAL(10, 4),
  user_count INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cohort_id, metric_name, period_offset)
);

-- Feature adoption events
CREATE TABLE feature_adoption_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  adopted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, feature_name)
);

-- Expansion events
CREATE TABLE expansion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expansion_type VARCHAR(50) NOT NULL, -- 'plan_upgrade', 'add_pet', 'add_user'
  from_plan VARCHAR(50),
  to_plan VARCHAR(50),
  expansion_value DECIMAL(10, 2), -- ARR increase
  expanded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_cohort_memberships_user_id ON cohort_memberships(user_id);
CREATE INDEX idx_cohort_metrics_cohort_metric ON cohort_metrics(cohort_id, metric_name);
CREATE INDEX idx_feature_adoption_user_id ON feature_adoption_events(user_id);
CREATE INDEX idx_feature_adoption_feature_name ON feature_adoption_events(feature_name);
CREATE INDEX idx_expansion_events_user_id ON expansion_events(user_id);
CREATE INDEX idx_expansion_events_expanded_at ON expansion_events(expanded_at);
```

### Cohort Calculation Engine

**Automatic Cohort Generation**:
- Daily job creates signup cohorts (weekly, monthly)
- Assigns new users to appropriate cohorts
- Recalculates cohort metrics (retention, adoption, expansion)

**Calculation Jobs**:
```typescript
// Daily: Update cohort memberships for new signups
calculateCohortMemberships(date: Date): Promise<void>

// Daily: Calculate retention for all active cohorts
calculateRetentionMetrics(date: Date): Promise<void>

// Weekly: Calculate feature adoption rates
calculateFeatureAdoptionMetrics(date: Date): Promise<void>

// Monthly: Calculate expansion metrics
calculateExpansionMetrics(date: Date): Promise<void>
```

**Performance Optimizations**:
- Pre-aggregate cohort metrics (no runtime calculations)
- Incremental updates (only new data)
- Cached queries with 1-hour TTL
- Progressive loading for UI (show cached, update in background)

### API Endpoints

```typescript
// Get cohort list
GET /api/analytics/cohorts
Query params:
  - cohort_type: 'signup_month' | 'signup_week' | 'custom'
  - start_date: ISO date
  - end_date: ISO date
  - min_size: minimum cohort size (default: 30)

// Get retention data
GET /api/analytics/cohorts/{cohort_id}/retention
Query params:
  - period_unit: 'day' | 'week' | 'month'
  - max_periods: number (default: 12)

// Get feature adoption data
GET /api/analytics/cohorts/{cohort_id}/feature-adoption
Query params:
  - feature_names: comma-separated list
  - period_unit: 'day' | 'week' | 'month'

// Get expansion data
GET /api/analytics/cohorts/{cohort_id}/expansion
Query params:
  - expansion_types: comma-separated list

// Compare cohorts
POST /api/analytics/cohorts/compare
Body:
  {
    cohort_ids: UUID[],
    metric: 'retention' | 'feature_adoption' | 'expansion',
    period_unit: 'day' | 'week' | 'month'
  }
```

## Dashboard Design

### Dashboard Layout: Cohort Analysis Hub

```
┌──────────────────────────────────────────────────────────────┐
│  Cohort Analysis                              [Date Range ▼] │
├────────────┬────────────┬────────────┬────────────────────────┤
│ Total      │ Active     │ Avg        │ Top Performing         │
│ Cohorts    │ Cohorts    │ Retention  │ Cohort                 │
│ 24         │ 18         │ 73.5%      │ Jan 2026 (85%)         │
├────────────┴────────────┴────────────┴────────────────────────┤
│  [Retention ▼] [Feature Adoption] [Expansion]                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              Retention Cohort Chart                          │
│              (Heatmap showing retention by month)            │
│                                                              │
├────────────────────────────┬─────────────────────────────────┤
│                            │                                 │
│  Cohort Comparison         │  Key Insights                   │
│  (Line chart)              │  • Best: Jan 2026 (+12% vs avg) │
│                            │  • Worst: Oct 2025 (-8% vs avg) │
│                            │  • Trend: Improving ↑           │
└────────────────────────────┴─────────────────────────────────┘
```

### Chart Components

#### 1. Retention Cohort Heatmap

**Chart Type**: Heatmap (cohorts × time periods)

**Purpose**: Show retention rate for each cohort over time at a glance

**Visualization**:
```
Cohort        Month 0   Month 1   Month 2   Month 3   ...
Jan 2026      100%      85%       78%       73%       
Dec 2025      100%      82%       74%       68%       
Nov 2025      100%      79%       71%       65%       
Oct 2025      100%      75%       66%       59%       
...
```

**Color Palette**: Sequential (Low to High)
- Dark Red (#DC2626): <50% retention
- Orange (#EA580C): 50-65% retention
- Yellow (#EAB308): 65-75% retention
- Light Green (#4ADE80): 75-85% retention
- Dark Green (#16A34A): >85% retention

**Interactivity**:
- Hover: Show exact percentage + user count
- Click: Drill down to cohort detail page
- Toggle: Switch between percentage/absolute numbers

**Accessibility**:
- Pattern overlay for colorblind users
- Keyboard navigation (arrow keys)
- Screen reader: "Cohort Jan 2026, Month 3, 73% retention, 220 users"

#### 2. Cohort Retention Curves

**Chart Type**: Multi-line chart

**Purpose**: Compare retention curves across selected cohorts

**Visualization**:
- X-axis: Time period (Month 0-12)
- Y-axis: Retention rate (0-100%)
- Lines: One per cohort (max 6 for readability)
- Benchmark line: Average retention across all cohorts

**Color Palette**: Categorical
- Line 1: #2563EB (Blue)
- Line 2: #7C3AED (Purple)
- Line 3: #DB2777 (Pink)
- Line 4: #EA580C (Orange)
- Line 5: #16A34A (Green)
- Line 6: #6B7280 (Neutral)
- Benchmark: Dashed gray (#9CA3AF)

**Interactivity**:
- Hover: Show tooltip with exact values
- Legend: Click to show/hide cohorts
- Annotations: Mark product launches, feature releases

**Accessibility**:
- Line patterns (solid, dashed, dotted) for colorblind users
- Keyboard navigation
- Screen reader: Describe trend direction

#### 3. Feature Adoption Timeline

**Chart Type**: Stacked area chart

**Purpose**: Show feature adoption over time for a cohort

**Visualization**:
- X-axis: Days/weeks since signup
- Y-axis: % of cohort adopted (0-100%)
- Stacked areas: One per feature (max 5)

**Color Palette**: Sequential blues
- Feature 1: #EFF6FF
- Feature 2: #BFDBFE
- Feature 3: #60A5FA
- Feature 4: #2563EB
- Feature 5: #1E40AF

**Key Metrics**:
- Median time-to-adoption per feature
- Final adoption rate (% at Month 6)
- Adoption velocity (steepness of curve)

**Interactivity**:
- Hover: Show adoption % + user count
- Toggle: Switch between stacked/separated views
- Filter: Select features to display

#### 4. Expansion Funnel

**Chart Type**: Sankey diagram / Funnel

**Purpose**: Show upgrade paths and expansion patterns

**Visualization**:
```
Free Plan (1000)
  ├─> Basic Plan (300)
  │     ├─> Pro Plan (150)
  │     │     └─> Enterprise (20)
  │     └─> Churned (30)
  └─> Churned (200)
```

**Color Palette**:
- Free: #6B7280 (Neutral)
- Basic: #60A5FA (Light Blue)
- Pro: #2563EB (Blue)
- Enterprise: #1E40AF (Dark Blue)
- Churned: #DC2626 (Red)

**Key Metrics**:
- Conversion rate per stage
- Time-to-upgrade (median)
- Expansion ARR

**Interactivity**:
- Hover: Show conversion rate + user count
- Click: Filter to show only this path
- Time slider: Animate expansion over time

### Mobile-First Design

**Mobile Layout** (< 768px):
- Stack charts vertically
- Show KPIs at top
- Simplify heatmap (fewer columns)
- Collapse filters into drawer
- Swipeable chart carousel

**Tablet Layout** (768px - 1024px):
- 2-column grid
- Abbreviated labels
- Condensed legends

**Desktop Layout** (> 1024px):
- Full layout as shown above
- Side-by-side comparisons
- Expanded tooltips

## Key Metrics Definitions

### Retention Metrics

**Definition**: Percentage of users from a cohort still active after N periods

**Calculation**:
```typescript
retention_rate = (active_users_in_period / cohort_size) * 100

// User is "active" if they:
// - Logged in during period, OR
// - Interacted with pet profiles, OR
// - Recorded pet health data
```

**Retention Types**:
1. **N-Day Retention**: % active on Day N exactly
2. **Rolling Retention**: % active on Day N or later
3. **Bounded Retention**: % active between Day N and Day N+X

**Industry Benchmarks** (SaaS):
- Month 1: 80-90% (excellent), 70-80% (good), <70% (needs improvement)
- Month 3: 70-80% (excellent), 60-70% (good), <60% (needs improvement)
- Month 12: 60-70% (excellent), 50-60% (good), <50% (needs improvement)

**PetForce Targets**:
- Month 1: 85% (pet families stay when they see value)
- Month 3: 75% (past onboarding hump)
- Month 12: 65% (long-term retention)

### Feature Adoption Metrics

**Definition**: Percentage of cohort that has used a feature at least once

**Calculation**:
```typescript
adoption_rate = (users_who_adopted_feature / cohort_size) * 100

// Adoption triggers (examples):
// - Pet Profile: Created first pet
// - Medication Tracker: Added first medication
// - Vet Visits: Scheduled first appointment
// - Weight Tracking: Logged first weight entry
```

**Time-to-Adoption**:
```typescript
time_to_adoption = MEDIAN(
  adopted_at - user_created_at FOR users_who_adopted
)
```

**Adoption Velocity**:
```typescript
// How quickly cohort adopts feature
velocity = adoption_rate_week_4 - adoption_rate_week_1
```

**Key Features to Track**:
1. **Core Features** (expected 80%+ adoption):
   - Pet profile creation
   - Health records upload
   - Medication reminders

2. **Growth Features** (expected 40-60% adoption):
   - Vet appointment scheduling
   - Weight tracking
   - Activity logs

3. **Premium Features** (expected 10-30% adoption):
   - Multi-pet management
   - Advanced analytics
   - Integrations

### Expansion Metrics

**Definition**: Tracking upgrades, add-ons, and increased usage

**Expansion Events**:
1. **Plan Upgrade**: Free → Basic → Pro → Enterprise
2. **Add Pets**: Additional pet profiles added
3. **Add Users**: Additional family members added
4. **Add-On Features**: Purchase of premium features

**Calculation**:
```typescript
expansion_rate = (users_who_expanded / cohort_size) * 100

expansion_arr = SUM(
  new_arr - old_arr FOR users_who_expanded
)

time_to_expansion = MEDIAN(
  expanded_at - user_created_at FOR users_who_expanded
)
```

**Leading Indicators** (predict expansion):
- High feature adoption (>70% of core features)
- Multiple active pets (>2 pets)
- Regular usage (>3 logins/week)
- Long session duration (>10 min average)
- Low support tickets (<1 ticket/month)

## Use Cases & User Stories

### Use Case 1: Casey Identifies Churn Risk Pattern

**Actor**: Casey (Customer Success)

**Goal**: Identify cohorts at high churn risk to proactively intervene

**Flow**:
1. Casey opens Cohort Analysis dashboard
2. Views retention heatmap
3. Notices Oct 2025 cohort has 59% Month 3 retention (vs 73% avg)
4. Clicks cohort to drill down
5. Sees low adoption of "Medication Tracker" feature (30% vs 65% avg)
6. Creates targeted email campaign to Oct 2025 cohort promoting medication tracker
7. Monitors cohort retention improving over next 2 weeks

**Success Metrics**:
- Identified at-risk cohort within 5 minutes
- Created intervention plan same day
- Retention improved 8 percentage points

### Use Case 2: Peter Measures Feature Launch Impact

**Actor**: Peter (Product)

**Goal**: Measure if new "Vet Appointment Scheduler" improves retention

**Flow**:
1. Feature launched Jan 15, 2026
2. Peter compares:
   - Pre-launch cohorts (Nov-Dec 2025)
   - Post-launch cohorts (Jan-Feb 2026)
3. Views feature adoption timeline
4. Sees:
   - Post-launch cohorts adopt scheduler 2x faster (14 days vs 28 days)
   - Post-launch cohorts have +5% Month 2 retention
   - 40% of post-launch cohort adopted scheduler (vs 25% pre-launch)
5. Concludes feature improves retention
6. Prioritizes similar features in roadmap

**Success Metrics**:
- Feature impact measured within 2 months
- Data-driven roadmap decisions
- Quantified retention improvement

### Use Case 3: Leadership Forecasts LTV

**Actor**: CEO / CFO

**Goal**: Forecast customer lifetime value for investor presentation

**Flow**:
1. View retention curves for last 12 cohorts
2. Identify average retention curve shape
3. Apply curve to revenue data
4. Calculate:
   - Month 12 retention: 65%
   - Month 24 retention (projected): 55%
   - Average subscription: $20/month
   - LTV = $20 × (1/churn_rate) × 12 = $20 × 36 months = $720
5. Use in investor deck

**Success Metrics**:
- LTV calculated in 10 minutes
- Data-backed projections
- Investor confidence

### Use Case 4: Marketing Measures Campaign Effectiveness

**Actor**: Marketing Team

**Goal**: Compare retention of different acquisition channels

**Flow**:
1. Create custom cohorts by acquisition source:
   - Organic search
   - Paid ads (Google)
   - Paid ads (Meta)
   - Referrals
   - Content marketing
2. Compare retention curves
3. Finds:
   - Referral cohorts: 80% Month 3 retention
   - Organic cohorts: 75% Month 3 retention
   - Paid ads cohorts: 65% Month 3 retention
4. Reallocates budget to referral programs and SEO

**Success Metrics**:
- Channel performance quantified
- Budget reallocation data-driven
- Improved overall retention

## Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

**Deliverables**:
- [ ] Database schema (cohorts, metrics tables)
- [ ] Cohort calculation engine
- [ ] Basic API endpoints
- [ ] Unit tests

**Tasks**:
1. Create migration files for new tables
2. Build cohort assignment logic
3. Build retention calculation engine
4. Create API routes
5. Write tests

**Team Collaboration**:
- **Engrid**: Code review on calculation engine
- **Buck**: Review data schema design
- **Samantha**: Privacy review (aggregate-only data)
- **Tucker**: Test plan review

### Phase 2: Retention Analysis (Weeks 3-4)

**Deliverables**:
- [ ] Retention heatmap component
- [ ] Retention curve comparison chart
- [ ] Cohort detail page
- [ ] Mobile-responsive layout

**Tasks**:
1. Build heatmap chart component
2. Build line chart component
3. Implement drill-down interactions
4. Add filters (date range, cohort type)
5. Accessibility testing

**Team Collaboration**:
- **Dexter**: Design review (wireframes, colors)
- **Maya**: Mobile layout review
- **Tucker**: Accessibility testing
- **Thomas**: User documentation

### Phase 3: Feature Adoption Analysis (Week 5)

**Deliverables**:
- [ ] Feature adoption tracking
- [ ] Adoption timeline chart
- [ ] Time-to-adoption metrics
- [ ] Cohort comparison by feature

**Tasks**:
1. Build feature adoption event tracking
2. Create adoption timeline chart
3. Add time-to-adoption calculations
4. Build comparison view

**Team Collaboration**:
- **Larry**: Instrument feature adoption events
- **Engrid**: Code review
- **Casey**: Validate feature definitions

### Phase 4: Expansion Analysis (Week 6)

**Deliverables**:
- [ ] Expansion event tracking
- [ ] Expansion funnel visualization
- [ ] Leading indicator analysis
- [ ] Expansion predictions

**Tasks**:
1. Track expansion events (upgrades, add-ons)
2. Build Sankey diagram / funnel
3. Calculate expansion leading indicators
4. Create prediction model

**Team Collaboration**:
- **Peter**: Define expansion events
- **Casey**: Validate expansion triggers
- **Buck**: Review data pipeline

### Phase 5: Polish & Launch (Week 7)

**Deliverables**:
- [ ] Performance optimization
- [ ] Error handling
- [ ] Loading states
- [ ] Documentation
- [ ] Team training

**Tasks**:
1. Add caching layer
2. Optimize queries
3. Add error boundaries
4. Create user guides
5. Team demo + training

**Team Collaboration**:
- **All agents**: Final review
- **Thomas**: Documentation
- **Casey**: Training for CS team
- **Peter**: Product announcement

## Performance Targets

### Query Performance
- Cohort list: <200ms (cached)
- Retention heatmap: <500ms (pre-aggregated)
- Cohort detail: <300ms
- Comparison queries: <1s (max 6 cohorts)

### Data Freshness
- Cohort metrics: Updated daily (3am UTC)
- Live data available for current day cohort
- Manual refresh available (rate-limited to 1/hour)

### Data Limits
- Max cohorts displayed: 24 (2 years monthly)
- Max cohorts compared: 6 (readability)
- Max retention periods: 18 months
- Max feature adoption features: 10

### Caching Strategy
- Cohort list: 1 hour TTL
- Metrics: 1 hour TTL (updates daily)
- User-specific queries: No cache (privacy)

## Privacy & Security

### Privacy Protections

1. **Aggregate Only**: Never show individual user data
2. **Minimum Cohort Size**: n ≥ 30 (suppress smaller cohorts)
3. **No PII**: All metrics are anonymized
4. **Opt-Out Respected**: Users who opt out excluded from cohorts

### GDPR Compliance

- Right to be forgotten: User deletion removes from all cohorts
- Data retention: Cohort metrics retained 36 months
- Consent: Analytics consent required
- Transparency: Users informed of cohort analysis in privacy policy

### Access Control

**Role-Based Access**:
- **Admin**: Full access to all cohorts
- **Product Team**: Access to product metrics
- **Customer Success**: Access to customer health metrics
- **Marketing**: Access to acquisition metrics
- **Basic User**: No access (internal tool only)

**Audit Trail**:
- Log all cohort queries
- Track who accessed which cohorts
- Alert on unusual access patterns

## Success Metrics (Post-Launch)

### Adoption Metrics (30 days)
- [ ] 80% of product team uses weekly
- [ ] 60% of CS team uses weekly
- [ ] 40% of leadership views monthly

### Business Impact (90 days)
- [ ] Churn detected 2 weeks earlier (avg)
- [ ] 3+ product decisions informed by cohort data
- [ ] 1+ marketing campaign optimized using cohort insights
- [ ] Customer LTV forecasting accuracy improved by 20%

### System Health
- [ ] 99.5% uptime
- [ ] <500ms avg query time
- [ ] Zero privacy incidents
- [ ] <5 bugs reported

## Accessibility Compliance

### WCAG AA Checklist

- [ ] Color contrast: 4.5:1 for text, 3:1 for charts
- [ ] Not relying on color alone (patterns + labels)
- [ ] Keyboard navigation (arrow keys for heatmap)
- [ ] Screen reader support (ARIA labels)
- [ ] Focus indicators visible
- [ ] Touch targets ≥44×44px (mobile)
- [ ] Text resizable to 200%
- [ ] No flashing content

### Colorblind Testing

- [ ] Tested with Deuteranopia simulator (red-green)
- [ ] Tested with Protanopia simulator (red-green)
- [ ] Tested with Tritanopia simulator (blue-yellow)
- [ ] Patterns added to heatmap for redundancy

## Future Enhancements (Post-V1)

### Phase 2 Features (3-6 months)
- **Predictive Analytics**: ML model predicts churn risk
- **Custom Cohorts**: Build cohorts by any user attribute
- **Cohort Experiments**: A/B test by cohort
- **Automated Insights**: AI-generated cohort insights

### Phase 3 Features (6-12 months)
- **Behavioral Cohorts**: Cohorts by usage patterns
- [ ] Real-time cohort updates (streaming)
- **Cohort Messaging**: Send targeted messages to cohorts
- **API Access**: External integrations

## Dependencies

### Upstream (Need Before Starting)
- User activity tracking (Larry's telemetry)
- Feature usage events (instrumented)
- Subscription/plan data (billing system)
- Email confirmation flow (for retention tracking)

### Downstream (This Unlocks)
- Predictive churn models
- Personalized onboarding
- Targeted customer success campaigns
- LTV forecasting

## Risks & Mitigations

### Risk 1: Performance Issues with Large Cohorts
**Likelihood**: Medium  
**Impact**: High  
**Mitigation**:
- Pre-aggregate all metrics (no runtime calculations)
- Use pagination for large cohort lists
- Implement progressive loading
- Monitor query performance (Larry alerts)

### Risk 2: Privacy Concerns
**Likelihood**: Low  
**Impact**: Critical  
**Mitigation**:
- Aggregate-only data (minimum cohort size)
- Privacy review with Samantha
- Clear documentation in privacy policy
- Audit trail for access

### Risk 3: Low Adoption by Team
**Likelihood**: Medium  
**Impact**: Medium  
**Mitigation**:
- Involve stakeholders in design
- Provide training and documentation
- Integrate into existing workflows
- Measure and iterate based on feedback

### Risk 4: Data Quality Issues
**Likelihood**: Medium  
**Impact**: High  
**Mitigation**:
- Validate data pipelines (Buck review)
- Monitor data completeness
- Add data quality checks
- Provide confidence intervals

## Open Questions

1. **Custom Cohorts**: Should V1 support custom cohort definitions, or only signup date cohorts?
   - **Recommendation**: Start with signup cohorts only (simpler, faster)
   - **Future**: Add custom cohorts in Phase 2

2. **Real-Time vs Daily**: Should cohort metrics update in real-time or daily batch?
   - **Recommendation**: Daily batch (3am UTC) with manual refresh option
   - **Rationale**: Simpler, faster, less costly

3. **Mobile App**: Should cohort analysis be available in mobile app?
   - **Recommendation**: Web-only for V1 (complex visualizations)
   - **Future**: Mobile dashboard with simplified charts

4. **Embedding**: Should we allow customers to embed cohort analysis in their own dashboards?
   - **Recommendation**: Internal tool only for V1
   - **Future**: Consider for Enterprise tier

## Appendix

### A. Related Documentation
- Analytics Skill: `/Users/danielzeddr/PetForce/.claude/skills/petforce/analytics/SKILL.md`
- Product Vision: `/Users/danielzeddr/PetForce/PRODUCT-VISION.md`
- Analytics Spec: `/Users/danielzeddr/PetForce/openspec/specs/analytics/spec.md`
- Customer Success Metrics: See Casey's health score dashboard

### B. Example Cohort Analysis Queries

**Retention Rate Calculation**:
```sql
-- Calculate Month 3 retention for Jan 2026 cohort
SELECT 
  c.name AS cohort_name,
  c.cohort_period,
  c.user_count AS cohort_size,
  COUNT(DISTINCT s.user_id) AS active_users,
  ROUND(COUNT(DISTINCT s.user_id)::DECIMAL / c.user_count * 100, 2) AS retention_rate
FROM cohorts c
JOIN cohort_memberships cm ON c.id = cm.cohort_id
LEFT JOIN sessions s ON cm.user_id = s.user_id
  AND s.created_at >= c.cohort_period + INTERVAL '3 months'
  AND s.created_at < c.cohort_period + INTERVAL '4 months'
WHERE c.cohort_type = 'signup_month'
  AND c.cohort_period = '2026-01-01'
GROUP BY c.id, c.name, c.cohort_period, c.user_count;
```

**Feature Adoption Rate**:
```sql
-- Calculate "Medication Tracker" adoption for all cohorts
SELECT 
  c.name AS cohort_name,
  c.user_count AS cohort_size,
  COUNT(DISTINCT fa.user_id) AS adopters,
  ROUND(COUNT(DISTINCT fa.user_id)::DECIMAL / c.user_count * 100, 2) AS adoption_rate,
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (fa.adopted_at - u.created_at)) / 86400
  ) AS median_days_to_adopt
FROM cohorts c
JOIN cohort_memberships cm ON c.id = cm.cohort_id
JOIN users u ON cm.user_id = u.id
LEFT JOIN feature_adoption_events fa ON cm.user_id = fa.user_id
  AND fa.feature_name = 'medication_tracker'
WHERE c.cohort_type = 'signup_month'
GROUP BY c.id, c.name, c.user_count
ORDER BY c.cohort_period DESC;
```

**Expansion Rate**:
```sql
-- Calculate expansion rate for all cohorts
SELECT 
  c.name AS cohort_name,
  c.user_count AS cohort_size,
  COUNT(DISTINCT e.user_id) AS expanded_users,
  ROUND(COUNT(DISTINCT e.user_id)::DECIMAL / c.user_count * 100, 2) AS expansion_rate,
  SUM(e.expansion_value) AS total_expansion_arr,
  ROUND(SUM(e.expansion_value) / NULLIF(COUNT(DISTINCT e.user_id), 0), 2) AS avg_expansion_arr
FROM cohorts c
JOIN cohort_memberships cm ON c.id = cm.cohort_id
LEFT JOIN expansion_events e ON cm.user_id = e.user_id
WHERE c.cohort_type = 'signup_month'
GROUP BY c.id, c.name, c.user_count
ORDER BY c.cohort_period DESC;
```

### C. Wireframe Details

**Retention Heatmap - Interactive States**:
```
Default State:
┌─────────┬─────┬─────┬─────┬─────┐
│ Cohort  │ M0  │ M1  │ M2  │ M3  │
├─────────┼─────┼─────┼─────┼─────┤
│ Jan '26 │ 100 │ 85  │ 78  │ 73  │
│ Dec '25 │ 100 │ 82  │ 74  │ 68  │
└─────────┴─────┴─────┴─────┴─────┘

Hover State (Jan '26, M3):
┌─────────────────────────────┐
│ Jan 2026 Cohort             │
│ Month 3 Retention           │
│ 73% (220 of 300 users)      │
│                             │
│ vs Avg: +2% ↑               │
│ Trend: Stable               │
│                             │
│ [View Details →]            │
└─────────────────────────────┘

Click State:
→ Navigate to Cohort Detail Page
```

### D. Color Palette Reference

**Heatmap Colors** (Retention Rate):
```css
/* <50% - Critical */
.retention-critical { 
  background: #DC2626; 
  color: #FFFFFF; 
}

/* 50-65% - Poor */
.retention-poor { 
  background: #EA580C; 
  color: #FFFFFF; 
}

/* 65-75% - Fair */
.retention-fair { 
  background: #EAB308; 
  color: #000000; 
}

/* 75-85% - Good */
.retention-good { 
  background: #4ADE80; 
  color: #000000; 
}

/* >85% - Excellent */
.retention-excellent { 
  background: #16A34A; 
  color: #FFFFFF; 
}
```

**Line Chart Colors** (Cohort Comparison):
```css
.cohort-1 { stroke: #2563EB; } /* Blue */
.cohort-2 { stroke: #7C3AED; } /* Purple */
.cohort-3 { stroke: #DB2777; } /* Pink */
.cohort-4 { stroke: #EA580C; } /* Orange */
.cohort-5 { stroke: #16A34A; } /* Green */
.cohort-6 { stroke: #6B7280; } /* Neutral */
.benchmark { stroke: #9CA3AF; stroke-dasharray: 5,5; } /* Dashed Gray */
```

---

**Document Version**: 1.0  
**Created**: 2026-01-25  
**Owner**: Ana (Analytics)  
**Status**: DESIGN PHASE  
**Next Review**: After team feedback
