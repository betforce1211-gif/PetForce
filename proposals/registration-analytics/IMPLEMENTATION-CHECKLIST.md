# Registration Analytics Implementation Checklist

**Owner**: Ana (Analytics Agent)  
**Status**: Ready for Implementation  
**Sprint**: Week 1-2

## Phase 1: Event Tracking Enhancement (Week 1)

### Engrid (Web Implementation)

- [ ] **Add correlation ID tracking**
  - [ ] Generate UUID on form mount
  - [ ] Pass correlation_id to all analytics events
  - [ ] Store in sessionStorage for cross-page tracking
  - [ ] Include in API requests for server-side correlation

- [ ] **Form lifecycle events**
  - [ ] Track `registration.form.interaction` on first input focus
  - [ ] Track `registration.form.filled` when all fields valid
  - [ ] Track `registration.submit.clicked` on button click
  - [ ] Include metadata: field touched, time deltas, password strength

- [ ] **Navigation tracking (CRITICAL for P0)**
  - [ ] Track `registration.navigation.attempted` when navigate() called
  - [ ] Track `registration.navigation.result` on route change
  - [ ] Detect navigation failures (React Router errors)
  - [ ] Track actual vs expected path
  - [ ] Measure navigation latency

- [ ] **Page view tracking**
  - [ ] Track `registration.verify_page.viewed` on verify-pending mount
  - [ ] Include referrer, time since registration, UTM params
  - [ ] Use correlation_id from URL param or sessionStorage

- [ ] **Performance metrics**
  - [ ] Measure button disable latency (click to disabled state)
  - [ ] Measure API response time (request to response)
  - [ ] Measure total registration time (submit to success callback)
  - [ ] Track p50, p95, p99 distributions
  - [ ] Send via `registration.performance` event

- [ ] **Error tracking**
  - [ ] Categorize errors: validation | api | navigation | network
  - [ ] Track field that caused error
  - [ ] Include error code and message
  - [ ] Mark as recoverable or not
  - [ ] Send via `registration.error` event

- [ ] **UTM parameter collection**
  - [ ] Parse UTM params from URL on page load
  - [ ] Include in all registration events
  - [ ] Store in sessionStorage for persistence

- [ ] **Update metrics.ts**
  - [ ] Add new event types to AuthMetric interface
  - [ ] Add correlation_id field
  - [ ] Add metadata validation

### Maya (Mobile Implementation)

- [ ] **Implement same events as web**
  - [ ] All form lifecycle events
  - [ ] All navigation events
  - [ ] All performance metrics
  - [ ] All error tracking

- [ ] **Add platform identifier**
  - [ ] Set `source: 'mobile'` in all events
  - [ ] Include device info (iOS/Android, version)
  - [ ] Track app version

- [ ] **Mobile-specific metrics**
  - [ ] Track haptic feedback usage
  - [ ] Track online/offline state
  - [ ] Track keyboard show/hide events
  - [ ] Track background/foreground transitions

### Larry (Backend/Logging)

- [ ] **Enhance server-side events**
  - [ ] Accept correlation_id from client
  - [ ] Include in all auth-api events
  - [ ] Add source (web/mobile) field
  - [ ] Add device metadata
  - [ ] Add UTM parameters

- [ ] **Log aggregation**
  - [ ] Ensure all analytics events flow to monitoring service
  - [ ] Set up log queries for dashboard metrics
  - [ ] Configure log retention (90 days minimum)

- [ ] **Performance logging**
  - [ ] Log backend API latency
  - [ ] Log database query times
  - [ ] Include in correlation_id trace

## Phase 2: Dashboard Enhancement (Week 1)

### Ana (Dashboard Specification for Engrid)

- [ ] **8-Stage Funnel Visualization**
  - [ ] Design funnel chart component
  - [ ] Show all 8 stages with counts and percentages
  - [ ] Calculate and display drop-off rates
  - [ ] Highlight stages below target (red/yellow/green)
  - [ ] Add drill-down to see sample users at each stage
  - [ ] Make responsive (mobile-friendly)

- [ ] **KPI Cards**
  - [ ] Total registrations (with trend)
  - [ ] Success rate (API success / attempts)
  - [ ] Navigation success rate (CRITICAL - should be 0% now)
  - [ ] Verification rate (verified / API success)
  - [ ] Average registration time
  - [ ] Error rate
  - [ ] Add color coding based on targets

- [ ] **Performance Panel**
  - [ ] Line chart: p50/p95/p99 over time
  - [ ] Histogram: Registration completion time distribution
  - [ ] SLA indicators (green/yellow/red zones)
  - [ ] Show targets as reference lines
  - [ ] Time range selector (1h / 24h / 7d)

- [ ] **Error Breakdown Panel**
  - [ ] Pie chart: Errors by type
  - [ ] Bar chart: Top 5 errors by count
  - [ ] Line chart: Error rate trend
  - [ ] Table: All errors with details (paginated)

- [ ] **Alert Panel**
  - [ ] Show active alerts at top
  - [ ] Color-coded by severity (critical/warning/info)
  - [ ] Include timestamp and message
  - [ ] Add "Acknowledge" button
  - [ ] Show alert history (last 24h)

- [ ] **Platform Comparison**
  - [ ] Side-by-side: Web vs Mobile metrics
  - [ ] Highlight significant differences
  - [ ] Drill-down to platform-specific view
  - [ ] Show platform distribution (pie chart)

- [ ] **Accessibility**
  - [ ] All charts have alt text
  - [ ] Color-blind safe palettes (use patterns too)
  - [ ] Keyboard navigable
  - [ ] ARIA labels on interactive elements
  - [ ] Screen reader tested

- [ ] **Performance**
  - [ ] Pre-aggregate metrics on backend
  - [ ] Use React.memo for chart components
  - [ ] Implement skeleton loading states
  - [ ] Add error boundaries
  - [ ] Cache metrics for 30 seconds
  - [ ] Progressive loading (KPIs first)

### Engrid (Dashboard Implementation)

- [ ] **Build dashboard components**
  - [ ] Implement KPICard component
  - [ ] Implement FunnelChart component
  - [ ] Implement PerformanceChart component (use recharts or similar)
  - [ ] Implement ErrorBreakdown component
  - [ ] Implement AlertPanel component
  - [ ] Implement PlatformComparison component

- [ ] **Update AuthMetricsDashboard.tsx**
  - [ ] Replace 4-stage funnel with 8-stage
  - [ ] Add performance panel
  - [ ] Add error breakdown panel
  - [ ] Add platform comparison
  - [ ] Add real-time updates (30s polling)
  - [ ] Add time range selector

- [ ] **Backend API for dashboard data**
  - [ ] Create `/api/analytics/registration/summary` endpoint
  - [ ] Return RegistrationMetrics schema
  - [ ] Accept time range parameter
  - [ ] Accept platform filter
  - [ ] Optimize queries (add indexes)

## Phase 3: Alerting (Week 2)

### Larry (Alert Integration)

- [ ] **Configure alert rules**
  - [ ] Implement ALERT_RULES from spec
  - [ ] Critical: Navigation failure spike
  - [ ] Critical: API failure >50%
  - [ ] Critical: Total system failure
  - [ ] Warning: Low verification rate
  - [ ] Warning: Slow API response
  - [ ] Warning: Slow button disable

- [ ] **Alert channels**
  - [ ] Critical alerts → PagerDuty
  - [ ] Warning alerts → Slack (#eng-alerts)
  - [ ] Info alerts → Daily email digest

- [ ] **Alert evaluation**
  - [ ] Run alert checks every 1 minute
  - [ ] De-duplicate alerts (don't spam)
  - [ ] Track alert acknowledgments
  - [ ] Auto-resolve when condition clears

## Phase 4: Baseline Capture (BEFORE P0 Fixes)

### Tucker (Testing Coordination)

- [ ] **Capture baseline metrics**
  - [ ] Deploy enhanced analytics to staging
  - [ ] Run 24h baseline data collection
  - [ ] Document current navigation failure rate
  - [ ] Document current verification rate (should be ~0%)
  - [ ] Document error distribution
  - [ ] Export baseline to `baseline-metrics.json`

- [ ] **Validate analytics accuracy**
  - [ ] Manual registration test (10 attempts)
  - [ ] Verify all 8 funnel events fire
  - [ ] Verify navigation failure is tracked
  - [ ] Verify correlation_id links events
  - [ ] Verify dashboard shows accurate data

### Ana (Baseline Analysis)

- [ ] **Create baseline report**
  - [ ] Document pre-fix state
  - [ ] Identify key problem metrics
  - [ ] Set improvement targets
  - [ ] Create before/after comparison template

## Phase 5: Post-Fix Validation (AFTER P0 Fixes)

### Tucker (Validation Testing)

- [ ] **Validate fixes with analytics**
  - [ ] Deploy P0 fixes to staging
  - [ ] Run 24h post-fix data collection
  - [ ] Verify navigation success rate = 100%
  - [ ] Verify verification page views match API success
  - [ ] Compare before/after metrics
  - [ ] Document improvement

### Ana (Impact Report)

- [ ] **Create impact report**
  - [ ] Compare baseline vs post-fix metrics
  - [ ] Calculate improvement percentages
  - [ ] Highlight remaining opportunities
  - [ ] Present to team

## Dependencies

### Engrid depends on:

- Ana: Dashboard wireframes and component specs (DONE in ANALYTICS-SPEC.md)
- Larry: Backend API endpoint for metrics aggregation

### Maya depends on:

- Engrid: Event schema definitions (DONE in ANALYTICS-SPEC.md)

### Larry depends on:

- Engrid: Final event schema (DONE in ANALYTICS-SPEC.md)

### Tucker depends on:

- Engrid: Analytics implementation deployed to staging
- Maya: Mobile analytics implementation

## Success Criteria

- [ ] All 8 funnel stages tracked
- [ ] Navigation success rate visible on dashboard
- [ ] Dashboard shows 0% navigation success before fix
- [ ] Dashboard shows 100% navigation success after fix
- [ ] Email verification rate >75% (primary goal)
- [ ] Dashboard loads in <2s
- [ ] Alerts fire within 1 minute
- [ ] All accessibility tests pass
- [ ] Tucker validates fixes using dashboard
- [ ] Peter approves for production

## Timeline

**Week 1**:

- Day 1-2: Engrid implements event tracking
- Day 2-3: Maya implements mobile events
- Day 3-4: Larry sets up backend aggregation
- Day 4-5: Engrid implements dashboard

**Week 2**:

- Day 1: Tucker captures baseline
- Day 2-3: Tucker deploys P0 fixes
- Day 3-4: Larry configures alerts
- Day 4-5: Ana creates impact report

**Total**: 2 weeks
