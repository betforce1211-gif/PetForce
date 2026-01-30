# Registration Funnel Dashboard Specification

**Task**: #29 (MEDIUM PRIORITY)  
**Agent**: Ana (Analytics)  
**Status**: SPEC READY FOR IMPLEMENTATION  
**Created**: 2026-01-25

## Executive Summary

Build a real-time dashboard to monitor the email/password registration funnel health. This dashboard will help product and engineering teams quickly spot email delivery issues, UX problems, and conversion drop-offs.

## Problem Statement

**Current State**: 
- Registration metrics ARE collected (via `metrics.ts`)
- Metrics ARE available via `getSummary()` method
- BUT no visual dashboard to monitor them
- Team must write code to view metrics

**Business Impact**:
- Can't quickly spot when confirmation rate drops
- No visibility into funnel health during incidents
- Product team can't monitor A/B test results
- Support team can't see if email issues are widespread

**User Impact**:
- If confirmation emails break, we won't know until users complain
- Can't proactively fix email delivery issues
- Slow response to UX problems

## Success Criteria

### Quantitative Goals
- Dashboard loads in <2 seconds
- Updates every 30 seconds (real-time)
- Shows last 24 hours of data by default
- Accessible to Product, Engineering, and Support teams

### Qualitative Goals
- **Scannable**: Key metrics visible without scrolling
- **Actionable**: Alerts show when metrics are unhealthy
- **Simple**: Non-technical team members can understand
- **Mobile-friendly**: Viewable on phone for on-call engineers

## Dashboard Design

### Layout: Monitoring / Operations Pattern

```
┌──────────────────────────────────────────────────────────────────────┐
│ Registration Funnel Health                    Last Updated: 12:34 PM │
│ Status: ● OK   │  Alerts: 0   │  Period: Last 24h ▼                 │
├────────────────┬────────────────┬────────────────┬───────────────────┤
│ Started        │ Completed      │ Confirmed      │ First Login       │
│ 1,247          │ 1,123 (90%)    │ 786 (70%)      │ 724 (92%)        │
│ +12% vs prev   │ +10% vs prev   │ -5% vs prev ⚠️ │ +8% vs prev      │
│ ▁▂▃▄▅▆▇█▇▆▅   │ ▁▂▃▄▅▆▇█▇▆▅   │ ▁▂▃▄▃▂▁▂▃▄▅   │ ▁▂▃▄▅▆▇█▇▆▅      │
├────────────────┴────────────────┴────────────────┴───────────────────┤
│                       Registration Funnel (24h)                      │
│                                                                      │
│   Started     Completed    Confirmed     First Login                │
│    1,247  →    1,123    →    786     →      724                     │
│           90%          70% ⚠️        92%                             │
│                                                                      │
│   [█████████░] [███████░░░] [█████████░]                            │
│                                                                      │
│   Biggest Drop: Complete → Confirmed (30% loss)                     │
│   Action: Check email delivery (see Email Health below)             │
├──────────────────────────────────────────────────────────────────────┤
│                         Email Delivery Health                        │
├────────────────────────────┬─────────────────────────────────────────┤
│ Emails Sent: 1,123         │ Avg Time to Confirm: 12 min            │
│ Links Clicked: 820 (73%)   │ Avg Time to Click: 8 min               │
│ Confirmed: 786 (96% click) │ Spam Issues: 40 emails (4%) ⚠️         │
├────────────────────────────┴─────────────────────────────────────────┤
│                      Login Success Rate (24h)                        │
├──────────────────────────────────────────────────────────────────────┤
│ Attempts: 1,580            Success Rate: 89% ✅                      │
│ Successes: 1,408                                                     │
│ Failed: 172 (11%)          Top Failure: Unconfirmed (48 users - 3%) │
│                                                                      │
│ [Line chart: Login success rate over 24h]                           │
├──────────────────────────────────────────────────────────────────────┤
│                           Active Alerts                              │
├──────────────────────────────────────────────────────────────────────┤
│ ⚠️  WARNING: Confirmation rate below 70% (currently 70%)            │
│     Last hour: 45 confirmed / 63 completed = 71%                    │
│     Recommended: Check email deliverability                          │
│                                                                      │
│ ⚠️  WARNING: 40 emails sent but not clicked in 24h (spam?)          │
│     Recommended: Check spam filter settings                          │
└──────────────────────────────────────────────────────────────────────┘
```

### Visual Hierarchy

1. **Top Row**: Overall status (OK/Warning/Critical) + filter controls
2. **KPI Cards**: 4 key funnel stages with sparklines
3. **Funnel Visualization**: Visual flow showing drop-off points
4. **Email Health**: Email engagement metrics (from Task #22)
5. **Login Health**: Login success tracking
6. **Alerts**: Active warnings/issues requiring attention

## Chart Specifications

### 1. KPI Cards (Funnel Stages)

**Chart Type**: KPI Card with sparkline  
**Data Source**: `metrics.getSummary()`  
**Update Frequency**: 30 seconds

```typescript
interface FunnelKPIProps {
  title: 'Started' | 'Completed' | 'Confirmed' | 'First Login';
  value: number;
  percentOfPrevious?: number; // e.g., "90% of started"
  trendVsPrevious: number; // e.g., +12%
  sparklineData: number[]; // Last 24 hours by hour
  status: 'ok' | 'warning' | 'critical';
}
```

**Color Rules**:
- Green (#16A34A): Metric is healthy (>70% conversion)
- Yellow (#EAB308): Metric needs attention (50-70% conversion)
- Red (#DC2626): Metric is critical (<50% conversion)

**Components**:
```tsx
<KPICard
  title="Confirmed"
  value={786}
  percentOfPrevious={70} // 70% of 1,123 completed
  trendVsPrevious={-5} // Down 5% from previous 24h
  sparklineData={[...hourlyData]}
  status="warning" // Because 70% is at threshold
/>
```

### 2. Funnel Visualization

**Chart Type**: Horizontal funnel with drop-off annotations  
**Library**: Custom SVG (simple, performant)  
**Color**: Blue gradient (#2563EB → #1E40AF)

```tsx
interface FunnelStage {
  label: string;
  value: number;
  conversionFromPrevious?: number;
  status: 'ok' | 'warning' | 'critical';
}

<FunnelChart stages={[
  { label: 'Started', value: 1247, status: 'ok' },
  { label: 'Completed', value: 1123, conversionFromPrevious: 90, status: 'ok' },
  { label: 'Confirmed', value: 786, conversionFromPrevious: 70, status: 'warning' },
  { label: 'First Login', value: 724, conversionFromPrevious: 92, status: 'ok' },
]} />
```

**Interaction**:
- Click stage to drill down into time-series data
- Hover to see exact conversion rate
- Shows "Biggest Drop" annotation automatically

### 3. Email Delivery Health (from Task #22)

**Chart Type**: 2-column metric grid  
**Data Source**: `metrics.getEmailEngagementSummary()`

```typescript
interface EmailHealthMetrics {
  emailsSent: number;
  linksClicked: number;
  clickRate: number; // %
  confirmed: number;
  confirmationRateFromClicks: number; // %
  avgTimeToClick: number; // minutes
  avgTimeToConfirm: number; // minutes
  spamIssues: number; // emails sent but not clicked in 24h
}
```

**Alert Triggers**:
- Click rate < 60% → "Possible email delivery issues"
- Spam issues > 5% → "Check spam filter settings"
- Avg time to click > 30 min → "Users not seeing emails quickly"

### 4. Login Success Rate Chart

**Chart Type**: Line chart with area fill  
**X-axis**: Time (hourly for 24h, daily for 7d, weekly for 30d)  
**Y-axis**: Success rate (0-100%)  
**Color**: Green area (#16A34A with 20% opacity)

```typescript
interface LoginHealthData {
  timestamp: Date;
  attempts: number;
  successes: number;
  successRate: number; // %
  failureReasons: {
    unconfirmed: number;
    invalidPassword: number;
    other: number;
  };
}
```

**Annotations**:
- Red dashed line at 70% (warning threshold)
- Orange dashed line at 50% (critical threshold)
- Show deployment markers (if available from Chuck)

### 5. Active Alerts Panel

**Chart Type**: Alert cards (stacked list)  
**Data Source**: `metrics.checkAlerts()`

```tsx
interface Alert {
  level: 'warning' | 'critical';
  message: string;
  metric: string; // Which metric triggered
  recommendation: string;
  timestamp: Date;
}

<AlertCard
  level="warning"
  metric="Confirmation Rate"
  message="Confirmation rate below 70% (currently 70%)"
  recommendation="Check email deliverability"
  timestamp={new Date()}
/>
```

**Color Coding**:
- Warning: Yellow background (#FEF3C7), orange border
- Critical: Red background (#FEE2E2), red border

## Data Flow

```
┌──────────────────────┐
│ Auth Events          │
│ (login, registration)│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ metrics.record()     │
│ (in-memory storage)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Dashboard Component  │
│ - Polls every 30s    │
│ - Calls getSummary() │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Chart Components     │
│ - Render metrics     │
│ - Show alerts        │
└──────────────────────┘
```

## Technical Implementation

### File Structure
```
apps/web/src/features/analytics/
├── components/
│   ├── FunnelKPICard.tsx
│   ├── FunnelChart.tsx
│   ├── EmailHealthPanel.tsx
│   ├── LoginSuccessChart.tsx
│   └── AlertsPanel.tsx
├── pages/
│   └── RegistrationFunnelDashboard.tsx
├── hooks/
│   └── useRegistrationMetrics.ts
└── utils/
    └── chart-helpers.ts
```

### Core Hook: `useRegistrationMetrics`

```typescript
import { useState, useEffect } from 'react';
import { metrics } from '@petforce/auth/utils/metrics';

export function useRegistrationMetrics(refreshIntervalMs: number = 30000) {
  const [summary, setSummary] = useState(metrics.getSummary());
  const [alerts, setAlerts] = useState(metrics.checkAlerts());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading(true);
      setSummary(metrics.getSummary());
      setAlerts(metrics.checkAlerts());
      setLoading(false);
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [refreshIntervalMs]);

  return {
    summary,
    alerts,
    loading,
    refresh: () => {
      setSummary(metrics.getSummary());
      setAlerts(metrics.checkAlerts());
    },
  };
}
```

### Main Dashboard Component

```typescript
// apps/web/src/features/analytics/pages/RegistrationFunnelDashboard.tsx
import { useRegistrationMetrics } from '../hooks/useRegistrationMetrics';
import { FunnelKPICard } from '../components/FunnelKPICard';
import { FunnelChart } from '../components/FunnelChart';
import { EmailHealthPanel } from '../components/EmailHealthPanel';
import { LoginSuccessChart } from '../components/LoginSuccessChart';
import { AlertsPanel } from '../components/AlertsPanel';

export function RegistrationFunnelDashboard() {
  const { summary, alerts, loading } = useRegistrationMetrics(30000);

  // Calculate funnel stages
  const funnelStages = [
    {
      label: 'Started',
      value: summary.registrationStarted,
      status: 'ok' as const,
    },
    {
      label: 'Completed',
      value: summary.registrationCompleted,
      conversionFromPrevious: summary.registrationStarted > 0
        ? (summary.registrationCompleted / summary.registrationStarted) * 100
        : 0,
      status: 'ok' as const,
    },
    {
      label: 'Confirmed',
      value: summary.emailConfirmed,
      conversionFromPrevious: summary.confirmationRatePercent,
      status: summary.confirmationRatePercent >= 70 ? 'ok' : 
              summary.confirmationRatePercent >= 50 ? 'warning' : 'critical',
    },
    {
      label: 'First Login',
      value: summary.loginSuccesses,
      conversionFromPrevious: summary.emailConfirmed > 0
        ? (summary.loginSuccesses / summary.emailConfirmed) * 100
        : 0,
      status: 'ok' as const,
    },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Registration Funnel Health</h1>
        <div className="header-meta">
          <StatusBadge alerts={alerts} />
          <LastUpdated loading={loading} />
          <PeriodSelector /> {/* 24h, 7d, 30d */}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {funnelStages.map(stage => (
          <FunnelKPICard key={stage.label} {...stage} />
        ))}
      </div>

      {/* Funnel Visualization */}
      <section className="funnel-section">
        <h2>Registration Funnel (24h)</h2>
        <FunnelChart stages={funnelStages} />
      </section>

      {/* Email Health */}
      <section className="email-health-section">
        <h2>Email Delivery Health</h2>
        <EmailHealthPanel metrics={summary} />
      </section>

      {/* Login Success */}
      <section className="login-success-section">
        <h2>Login Success Rate (24h)</h2>
        <LoginSuccessChart metrics={summary} />
      </section>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section className="alerts-section">
          <h2>Active Alerts</h2>
          <AlertsPanel alerts={alerts} />
        </section>
      )}
    </div>
  );
}
```

## Responsive Design

### Desktop (>1024px)
- 4-column KPI grid
- Side-by-side email and login panels
- Full funnel visualization

### Tablet (768px - 1024px)
- 2-column KPI grid
- Stacked email and login panels
- Simplified funnel (smaller labels)

### Mobile (<768px)
- 1-column KPI grid
- All panels stacked vertically
- Funnel shows percentages only (no bars)
- Charts use full width

```css
/* Mobile-first approach */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## Accessibility

### WCAG AA Compliance
- ✅ 4.5:1 contrast ratio for all text
- ✅ Chart titles clearly describe content
- ✅ Status colors have text labels (not color alone)
- ✅ Keyboard navigation works for all interactions
- ✅ Screen reader announces metric updates

### Color-blind Friendly
- ✅ Not relying on red/green alone
- ✅ Using icons + text + color (triple coding)
- ✅ Patterns in charts (not just color)

```tsx
// Example: Status badge with icon + text + color
<StatusBadge status="warning">
  <Icon name="alert-triangle" /> {/* Visual */}
  <span>Warning</span> {/* Text */}
</StatusBadge>
```

### Screen Reader Support
```tsx
<div role="region" aria-label="Registration funnel metrics">
  <h2 id="funnel-heading">Registration Funnel Health</h2>
  <div aria-describedby="funnel-heading">
    <div role="status" aria-live="polite">
      {summary.registrationStarted} registrations started,
      {summary.confirmationRatePercent}% confirmed
    </div>
  </div>
</div>
```

## Performance Optimization

### Data Limits
- Show last 24 hours by default (manageable dataset)
- Limit sparklines to 24 data points (hourly)
- Lazy load historical data only when period changes

### Caching Strategy
```typescript
// Cache metrics summary for 30 seconds
const CACHE_TTL_MS = 30000;
let cachedSummary: MetricsSummary | null = null;
let cacheTimestamp: number = 0;

function getCachedSummary(): MetricsSummary {
  const now = Date.now();
  if (cachedSummary && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedSummary;
  }

  cachedSummary = metrics.getSummary();
  cacheTimestamp = now;
  return cachedSummary;
}
```

### Loading States
```tsx
{loading ? (
  <ChartSkeleton />
) : (
  <FunnelChart data={funnelStages} />
)}
```

## Security & Access Control

### Who Can Access?
- Product Team: Full access
- Engineering Team: Full access
- Support Team: Read-only access
- Customer Success: Read-only access

### Implementation
```typescript
// Simple role-based access (expand later)
const ALLOWED_ROLES = ['admin', 'product', 'engineering', 'support', 'customer_success'];

function ProtectedDashboard() {
  const { user } = useAuth();
  
  if (!ALLOWED_ROLES.includes(user.role)) {
    return <UnauthorizedPage />;
  }

  return <RegistrationFunnelDashboard />;
}
```

## Testing Plan

### Unit Tests
```typescript
describe('RegistrationFunnelDashboard', () => {
  it('should render all KPI cards', () => {
    render(<RegistrationFunnelDashboard />);
    expect(screen.getByText('Started')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('First Login')).toBeInTheDocument();
  });

  it('should show warning when confirmation rate < 70%', () => {
    // Mock metrics with low confirmation rate
    jest.spyOn(metrics, 'getSummary').mockReturnValue({
      confirmationRatePercent: 65,
      // ... other fields
    });

    render(<RegistrationFunnelDashboard />);
    expect(screen.getByText(/confirmation rate below 70%/i)).toBeInTheDocument();
  });

  it('should update every 30 seconds', () => {
    jest.useFakeTimers();
    const getSummarySpy = jest.spyOn(metrics, 'getSummary');

    render(<RegistrationFunnelDashboard />);
    
    expect(getSummarySpy).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(30000);
    expect(getSummarySpy).toHaveBeenCalledTimes(2);
  });
});
```

### Visual Regression Tests
- Capture screenshot of dashboard
- Compare against baseline
- Detect unintended layout changes

### Manual Testing Checklist
- [ ] Dashboard loads in <2 seconds
- [ ] All KPI cards render with correct data
- [ ] Funnel chart shows drop-off points
- [ ] Alerts appear when thresholds breached
- [ ] Dashboard updates every 30 seconds
- [ ] Responsive design works on mobile
- [ ] Accessible with keyboard navigation
- [ ] Screen reader announces updates

## Rollout Plan

### Phase 1: Build (Week 1)
- Implement dashboard components
- Create mock data for development
- Unit tests for all components
- Responsive design testing

### Phase 2: Integration (Week 2)
- Connect to real metrics from `metrics.ts`
- Test with production-like data
- Performance testing
- Accessibility audit

### Phase 3: Internal Launch (Week 3)
- Deploy to staging
- Invite Product/Engineering to test
- Gather feedback
- Iterate on design

### Phase 4: Production Launch (Week 4)
- Deploy to production
- Add to internal tools menu
- Document how to use dashboard
- Monitor usage and feedback

### Phase 5: Iteration (Ongoing)
- Add requested features (date range picker, export)
- Optimize based on usage patterns
- Add more drill-down views

## Success Metrics (30 Days Post-Launch)

### Adoption Metrics
- ✅ Product team uses dashboard 3x/week
- ✅ Engineering checks during incidents
- ✅ Support references dashboard in tickets
- ✅ 80% of stakeholders find it valuable

### Business Impact
- ✅ Reduced time to detect email issues (from hours → minutes)
- ✅ Faster response to funnel drop-offs
- ✅ Data-driven decisions on email optimization
- ✅ Reduced support tickets about "email not received"

### Quality Metrics
- ✅ Dashboard loads in <2 seconds
- ✅ Zero accessibility issues reported
- ✅ Mobile usage >20% of total
- ✅ No performance degradation

## Future Enhancements

### Short-term (3 months)
- Add date range picker (7d, 30d, custom)
- Export to PDF for executive reports
- Email digest (daily summary to team)
- Comparison mode (this week vs last week)

### Medium-term (6 months)
- Cohort analysis (registration date → conversion rate)
- Email provider breakdown (Gmail vs Outlook confirmation rates)
- A/B test tracking (show which email version is winning)
- Mobile app dashboard (native implementation)

### Long-term (12+ months)
- Predictive alerts ("Confirmation rate will drop below 70% in 2 hours")
- Anomaly detection (ML-based)
- Integration with Casey's customer health dashboard
- Custom dashboard builder (drag-and-drop widgets)

## Dependencies

### Internal Dependencies
- Task #22: Email Engagement Tracking (provides email health metrics)
- Larry (Logging): Confirm metrics.ts performance with real load
- Dexter (UX): Review dashboard design for usability

### External Dependencies
- None (uses existing `metrics.ts` infrastructure)

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Dashboard slows down with large datasets | MEDIUM | LOW | Limit to 24h default; paginate historical data |
| Metrics polling creates performance issues | MEDIUM | LOW | 30s interval; cached getSummary() |
| Team doesn't use dashboard | HIGH | MEDIUM | Make it actionable; integrate into incident response |
| Mobile layout doesn't work well | MEDIUM | LOW | Mobile-first design; test on real devices |

## Open Questions

1. Should dashboard be public (customer-facing)?
   - **Recommendation**: Internal only for now, customer-facing later
2. Should we alert in Slack when metrics are unhealthy?
   - **Recommendation**: Yes, future enhancement (Week 5)
3. Should dashboard show historical trends (>24h)?
   - **Recommendation**: Yes, add 7d/30d views in Phase 5

## Appendix

### Funnel Benchmark Data
- Registration started → completed: 85-95% (ours: 90% ✅)
- Completed → confirmed: 70-85% (ours: 70% ⚠️)
- Confirmed → first login: 90-95% (ours: 92% ✅)

### Dashboard Design Resources
- [Dashboard Design Patterns](https://dashboarddesignpatterns.github.io/)
- Monitoring layout based on Datadog/Grafana patterns
- KPI cards inspired by Stripe dashboard

### Related Tasks
- Task #22: Email Engagement Tracking (provides email metrics)
- Task #6: Ana's checklist gap (dashboard addresses "no visualization")

---

**Document Owner**: Ana (Analytics)  
**Reviewers**: Dexter (UX), Engrid (Engineering), Peter (Product)  
**Last Updated**: 2026-01-25  
**Status**: READY FOR DEXTER REVIEW (UX validation needed)
