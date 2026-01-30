# Registration Flow Analytics Specification

**Agent**: Ana (Analytics)  
**Status**: Draft  
**Priority**: P0  
**Related**: Tucker's P0 Registration Fixes

## Executive Summary

This specification defines comprehensive analytics tracking for the registration flow to measure the success of P0 fixes (navigation blocking issue) and guide future UX improvements. The primary metric is **Email Verification Completion Rate** with a target of >75%.

## Current State Analysis

### Existing Analytics Infrastructure

We have solid analytics foundation:

- **Metrics Collector** (`packages/auth/src/utils/metrics.ts`): In-memory event tracking with real-time aggregation
- **Monitoring Service** (`packages/auth/src/utils/monitoring.ts`): Multi-backend support (Datadog, Sentry, CloudWatch, Console)
- **Structured Logging** (`packages/auth/src/utils/logger.ts`): Request ID correlation, PII protection
- **Live Dashboard** (`apps/web/src/features/auth/pages/AuthMetricsDashboard.tsx`): Real-time funnel visualization

### Events Currently Tracked

From `auth-api.ts`, we track:

1. `registration_attempt_started` - User submits registration form
2. `registration_completed` - API creates account
3. `registration_failed` - API error
4. `login_attempt_started` - User tries to login
5. `login_completed` - Successful login
6. `login_rejected_unconfirmed` - Login blocked due to unverified email
7. `email_confirmed` - User clicks verification link (via Supabase webhook)
8. `confirmation_email_resent` - User requests new verification email

### Gap Analysis

**Missing Events for P0 Fixes**:

- Form interaction start (when user first types)
- Form filled (all required fields complete)
- Submit button click (before API call)
- Navigation attempt and result (THE CRITICAL BUG)
- Verification page view
- Client-side performance metrics (button disable latency)
- Error categorization (validation vs API vs navigation)

**Missing Dashboard Metrics**:

- 8-stage detailed funnel (currently only 4 stages)
- Navigation success rate (would show 0% currently)
- Performance timing distributions (p50, p95, p99)
- Error breakdown by type
- Mobile vs Web comparison

## Proposed Analytics Architecture

### 1. Event Taxonomy (P0)

#### Client-Side Events (New)

```typescript
// Form Lifecycle Events
interface FormInteractionEvent {
  event: "registration.form.interaction";
  timestamp: number;
  correlation_id: string; // Tracks full user journey
  metadata: {
    first_field_touched: "email" | "password" | "confirm_password";
    time_since_page_view: number; // ms
  };
}

interface FormFilledEvent {
  event: "registration.form.filled";
  timestamp: number;
  correlation_id: string;
  metadata: {
    time_to_fill: number; // ms from first interaction
    password_visibility_toggled: boolean;
    password_strength: "weak" | "medium" | "strong";
  };
}

interface FormSubmitEvent {
  event: "registration.submit.clicked";
  timestamp: number;
  correlation_id: string;
  metadata: {
    time_since_filled: number; // ms
    form_complete: boolean;
  };
}

// Navigation Events (CRITICAL for P0 bug detection)
interface NavigationAttemptEvent {
  event: "registration.navigation.attempted";
  timestamp: number;
  correlation_id: string;
  metadata: {
    target_path: string; // e.g., '/auth/verify-pending'
    navigation_method: "navigate" | "redirect" | "window.location";
    triggered_by: "success_callback" | "manual";
  };
}

interface NavigationResultEvent {
  event: "registration.navigation.result";
  timestamp: number;
  correlation_id: string;
  metadata: {
    success: boolean;
    actual_path: string; // Where did we end up?
    expected_path: string;
    error?: string; // React Router error, if any
    latency: number; // ms
  };
}

interface PageViewEvent {
  event: "registration.verify_page.viewed";
  timestamp: number;
  correlation_id: string;
  metadata: {
    referrer: string;
    time_since_registration: number; // ms
    utm_source?: string;
    utm_campaign?: string;
  };
}

// Performance Events
interface PerformanceEvent {
  event: "registration.performance";
  timestamp: number;
  correlation_id: string;
  metrics: {
    button_disable_latency: number; // ms from click to disabled
    api_response_time: number; // ms for API call
    total_registration_time: number; // ms from submit to success callback
    render_time?: number; // Time to render success state
  };
}

// Error Events
interface ErrorEvent {
  event: "registration.error";
  timestamp: number;
  correlation_id: string;
  error: {
    type: "validation" | "api" | "navigation" | "network" | "unexpected";
    code: string; // e.g., 'PASSWORD_MISMATCH', 'EMAIL_EXISTS'
    message: string;
    field?: string; // Which field caused error
    recoverable: boolean; // Can user fix this?
  };
}
```

#### Server-Side Events (Enhanced)

```typescript
// Enhance existing events with additional metadata

interface RegistrationAttemptStartedEvent {
  event: "registration_attempt_started";
  timestamp: number;
  requestId: string;
  correlation_id: string; // NEW: Link to client events
  metadata: {
    email: string; // hashed
    hasFirstName: boolean;
    hasLastName: boolean;
    source: "web" | "mobile"; // NEW
    device?: string; // NEW: User agent info
    utm_params?: Record<string, string>; // NEW: Marketing attribution
  };
}

interface RegistrationCompletedEvent {
  event: "registration_completed";
  timestamp: number;
  requestId: string;
  correlation_id: string; // NEW
  metadata: {
    userId: string;
    email: string; // hashed
    emailConfirmed: boolean;
    confirmationRequired: boolean;
    confirmationEmailSent: boolean;
    api_latency: number; // NEW: Backend processing time
    source: "web" | "mobile"; // NEW
  };
}
```

### 2. Enhanced Funnel Tracking (8 Stages)

```typescript
// Funnel stage definitions with drop-off tracking

enum FunnelStage {
  PAGE_VIEWED = 1, // Viewed /auth?mode=register
  FORM_INTERACTION = 2, // Started typing in form
  FORM_FILLED = 3, // All required fields complete
  SUBMIT_CLICKED = 4, // Clicked "Create account" button
  API_SUCCESS = 5, // Account created in database
  NAVIGATION_SUCCESS = 6, // Successfully reached verify-pending page
  VERIFY_PAGE_VIEWED = 7, // Confirmed page view logged
  EMAIL_VERIFIED = 8, // Clicked verification link (within 24h)
}

interface FunnelMetrics {
  stage: FunnelStage;
  count: number;
  drop_off_rate: number; // % who didn't reach next stage
  avg_time_to_next_stage: number; // ms
  percentile_times: {
    p50: number;
    p95: number;
    p99: number;
  };
}

// Target success rates
const FUNNEL_TARGETS = {
  [FunnelStage.PAGE_VIEWED]: 100, // Baseline
  [FunnelStage.FORM_INTERACTION]: 85, // 85% start filling form
  [FunnelStage.FORM_FILLED]: 95, // 95% of starters complete
  [FunnelStage.SUBMIT_CLICKED]: 98, // 98% submit once filled
  [FunnelStage.API_SUCCESS]: 95, // 95% API success (5% errors OK)
  [FunnelStage.NAVIGATION_SUCCESS]: 100, // 100% should navigate (BUG: currently 0%)
  [FunnelStage.VERIFY_PAGE_VIEWED]: 100, // 100% should see page
  [FunnelStage.EMAIL_VERIFIED]: 75, // 75% verify email within 24h
};
```

### 3. Metrics Schema

```typescript
// Aggregated metrics for dashboard

interface RegistrationMetrics {
  // Volume metrics
  total_registrations: number;
  successful_registrations: number;
  failed_registrations: number;

  // Funnel metrics
  funnel: FunnelMetrics[];
  overall_conversion_rate: number; // Page view → Email verified

  // Performance metrics
  performance: {
    button_disable_latency: PercentileMetrics;
    api_response_time: PercentileMetrics;
    total_registration_time: PercentileMetrics;
    navigation_time: PercentileMetrics;
  };

  // Error metrics
  errors: {
    total_errors: number;
    error_rate: number; // % of attempts
    by_type: Record<ErrorType, number>;
    by_code: Record<string, number>;
    top_errors: Array<{ code: string; count: number; message: string }>;
  };

  // User behavior
  behavior: {
    avg_form_fill_time: number; // ms
    password_toggle_rate: number; // % who toggled visibility
    tab_switch_rate: number; // % who switched to login tab
    avg_password_attempts: number; // Before getting strong enough
  };

  // Cohort analysis
  cohorts: {
    by_source: Record<"web" | "mobile", RegistrationMetrics>;
    by_utm: Record<string, number>; // Traffic source performance
    by_hour: number[]; // Registrations by hour of day
  };
}

interface PercentileMetrics {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
}
```

### 4. Alert Configuration

```typescript
interface AlertRule {
  name: string;
  condition: (metrics: RegistrationMetrics) => boolean;
  severity: "critical" | "warning" | "info";
  channel: "page" | "email" | "slack";
  message: (metrics: RegistrationMetrics) => string;
}

const ALERT_RULES: AlertRule[] = [
  // Critical alerts (page immediately)
  {
    name: "navigation_failure_spike",
    severity: "critical",
    channel: "page",
    condition: (m) => {
      const navStage = m.funnel.find(
        (f) => f.stage === FunnelStage.NAVIGATION_SUCCESS,
      );
      return navStage && navStage.count === 0 && m.total_registrations > 5;
    },
    message: (m) =>
      `CRITICAL: 0% navigation success after ${m.successful_registrations} registrations`,
  },
  {
    name: "registration_api_failure",
    severity: "critical",
    channel: "page",
    condition: (m) => m.error_rate > 0.5, // >50% error rate
    message: (m) =>
      `CRITICAL: ${(m.error_rate * 100).toFixed(1)}% registration error rate`,
  },
  {
    name: "total_system_failure",
    severity: "critical",
    channel: "page",
    condition: (m) =>
      m.successful_registrations === 0 && m.total_registrations > 10,
    message: () => "CRITICAL: No successful registrations in last 5 minutes",
  },

  // Warning alerts (notify soon)
  {
    name: "low_verification_rate",
    severity: "warning",
    channel: "slack",
    condition: (m) => {
      const verifyStage = m.funnel.find(
        (f) => f.stage === FunnelStage.EMAIL_VERIFIED,
      );
      const apiStage = m.funnel.find(
        (f) => f.stage === FunnelStage.API_SUCCESS,
      );
      if (!verifyStage || !apiStage || apiStage.count === 0) return false;
      const rate = verifyStage.count / apiStage.count;
      return rate < 0.6; // <60% verification rate
    },
    message: (m) => {
      const rate =
        m.funnel.find((f) => f.stage === FunnelStage.EMAIL_VERIFIED)!.count /
        m.funnel.find((f) => f.stage === FunnelStage.API_SUCCESS)!.count;
      return `WARNING: ${(rate * 100).toFixed(1)}% email verification rate (target: >75%)`;
    },
  },
  {
    name: "slow_api_response",
    severity: "warning",
    channel: "slack",
    condition: (m) => m.performance.api_response_time.p95 > 5000, // >5s p95
    message: (m) =>
      `WARNING: p95 API response time ${m.performance.api_response_time.p95}ms (target: <3000ms)`,
  },
  {
    name: "slow_button_disable",
    severity: "warning",
    channel: "email",
    condition: (m) => m.performance.button_disable_latency.p95 > 100, // >100ms
    message: (m) =>
      `WARNING: p95 button disable latency ${m.performance.button_disable_latency.p95}ms (UX degradation)`,
  },
];
```

## Implementation Plan

### Phase 1: Enhanced Event Tracking (P0 - Week 1)

**For Engrid to implement in web app**:

1. Add correlation ID generation to form component
2. Track form lifecycle events:
   - `registration.form.interaction` on first input focus
   - `registration.form.filled` when all required fields valid
   - `registration.submit.clicked` on button click
3. Track navigation events:
   - `registration.navigation.attempted` when navigate() is called
   - `registration.navigation.result` on route change or error
4. Track page view events:
   - `registration.verify_page.viewed` on verify-pending page mount
5. Track performance metrics:
   - Button disable latency
   - API response time
   - Total registration time
6. Track errors:
   - Client-side validation errors
   - API errors (with categorization)
   - Navigation errors
7. Include UTM parameters in all events

**For Maya to implement in mobile app**:

1. Same events as web (consistency critical)
2. Add platform='mobile' to all events
3. Track mobile-specific metrics:
   - Haptic feedback usage
   - Offline/online state
   - Keyboard appearance/dismissal

### Phase 2: Enhanced Dashboard (P0 - Week 1)

**For Ana (me) to spec for Engrid**:

1. Update `AuthMetricsDashboard.tsx` with 8-stage funnel:
   - Visual funnel chart (not just 4 bars)
   - Show drop-off % between each stage
   - Highlight critical failures (navigation 0%)
2. Add performance panel:
   - Line charts for p50/p95/p99 over time
   - Histogram of registration completion times
   - Color-coded SLA indicators
3. Add error breakdown:
   - Pie chart of error types
   - Top 5 errors list with counts
   - Error rate trend line
4. Add real-time health indicator:
   - Green/Yellow/Red status
   - Based on navigation success + verification rate
5. Add platform comparison:
   - Web vs Mobile side-by-side metrics
   - Drill-down capability

### Phase 3: Alerting Integration (P0 - Week 2)

**For Larry to implement**:

1. Connect metrics to alert rules
2. Send critical alerts to PagerDuty
3. Send warning alerts to Slack
4. Daily digest emails with summary

### Phase 4: Baseline Capture (P0 - Immediate)

**Before deploying fixes**:

1. Capture 24h baseline metrics:
   - Current navigation failure rate (should be 100%)
   - Current form abandonment rate
   - Current error distribution
2. Document in `baseline-metrics.json`
3. Use for before/after comparison

## Dashboard Wireframes

### Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Registration Flow Analytics              [1h|24h|7d]         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🚨 ALERTS                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 CRITICAL: Navigation failure rate 100%               │ │
│ │    No users reaching verification page                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ REGISTRATION HEALTH                                           │
│ ┌──────────────┬──────────────┬──────────────┬────────────┐ │
│ │ Total Regs   │ Success Rate │ Verify Rate  │ Avg Time   │ │
│ │              │              │              │            │ │
│ │    247       │    92%       │    0% 🔴     │   4.2s     │ │
│ │    ↑ 12%    │    ↑ 2%     │    ↓ 75%    │   → 0%    │ │
│ └──────────────┴──────────────┴──────────────┴────────────┘ │
│                                                               │
│ REGISTRATION FUNNEL                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Page Viewed                1000 █████████████ 100%  │ │
│ │    ↓ 80%                                                 │ │
│ │ 2. Form Interaction            800 ██████████ 80%      │ │
│ │    ↓ 88%                                                 │ │
│ │ 3. Form Filled                 700 █████████ 70%       │ │
│ │    ↓ 97%                                                 │ │
│ │ 4. Submit Clicked              680 ████████ 68%        │ │
│ │    ↓ 95%                                                 │ │
│ │ 5. API Success                 647 ████████ 65%        │ │
│ │    ↓ 0% 🔴 PROBLEM!                                      │ │
│ │ 6. Navigation Success            0 ▏ 0% 🔴             │ │
│ │    ↓ N/A                                                 │ │
│ │ 7. Verify Page Viewed            0 ▏ 0%                │ │
│ │    ↓ N/A                                                 │ │
│ │ 8. Email Verified                0 ▏ 0%                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ PERFORMANCE METRICS                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Response Time (ms)          Error Rate (%)              │ │
│ │                                                           │ │
│ │  5000 ┤                       100┤                      │ │
│ │  4000 ┤                        80┤                      │ │
│ │  3000 ┤     ╭╮                 60┤                      │ │
│ │  2000 ┤   ╭╯╰╮╭╮              40┤                      │ │
│ │  1000 ┤ ╭╯   ╰╯╰╮             20┤  ╭╮  ╭╮             │ │
│ │     0 ┼─────────────           0┼───────────            │ │
│ │       0h  6h 12h 18h             0h  6h 12h 18h        │ │
│ │                                                           │ │
│ │ p50: 2.1s  p95: 4.8s  p99: 6.2s                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ERROR BREAKDOWN                                               │
│ ┌────────────────────────┬──────────────────────────────────┐│
│ │ By Type                │ Top Errors                        ││
│ │                        │                                   ││
│ │ Navigation: 247 (100%) │ 1. NAVIGATION_BLOCKED     247    ││
│ │ API: 33 (13%)          │ 2. EMAIL_EXISTS            18    ││
│ │ Validation: 12 (5%)    │ 3. PASSWORD_WEAK           12    ││
│ │ Network: 3 (1%)        │ 4. NETWORK_TIMEOUT          3    ││
│ └────────────────────────┴──────────────────────────────────┘│
│                                                               │
│ PLATFORM COMPARISON                                           │
│ ┌─────────────────────┬─────────────────────────────────────┐│
│ │ Web                 │ Mobile                              ││
│ │ • Regs: 200         │ • Regs: 47                          ││
│ │ • Success: 90%      │ • Success: 95%                      ││
│ │ • Avg time: 4.1s    │ • Avg time: 5.2s                    ││
│ │ • Nav success: 0%🔴 │ • Nav success: 0%🔴                 ││
│ └─────────────────────┴─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Color Palette

Using Ana's standard palette:

- **Primary (Blue)**: `#2563EB` - Default metrics, neutral states
- **Success (Green)**: `#16A34A` - Goals met, positive trends
- **Warning (Yellow)**: `#EAB308` - Degraded performance, attention needed
- **Error (Red)**: `#DC2626` - Critical issues, failures
- **Neutral (Gray)**: `#6B7280` - Baseline, unchanged

### Status Color Rules

```typescript
function getHealthColor(verificationRate: number): string {
  if (verificationRate >= 0.75) return "#16A34A"; // Green: Healthy
  if (verificationRate >= 0.6) return "#EAB308"; // Yellow: Warning
  return "#DC2626"; // Red: Critical
}

function getNavigationColor(successRate: number): string {
  if (successRate >= 0.95) return "#16A34A"; // Green
  if (successRate >= 0.8) return "#EAB308"; // Yellow
  return "#DC2626"; // Red: Critical (currently 0%)
}

function getPerformanceColor(p95Latency: number, target: number): string {
  if (p95Latency <= target) return "#16A34A"; // Green
  if (p95Latency <= target * 1.5) return "#EAB308"; // Yellow
  return "#DC2626"; // Red
}
```

## Accessibility Requirements

All dashboard components must meet WCAG AA standards:

1. **Color Independence**: Never rely on color alone
   - Use icons: ✓ (success), ⚠ (warning), 🔴 (error)
   - Use patterns in charts (stripes, dots) for colorblind users
   - Include text labels on all chart segments

2. **Contrast Ratios**: All text must meet 4.5:1 ratio
   - Green on white: OK
   - Yellow on white: Use darker yellow (`#CA8A04`)
   - Red on white: OK

3. **Screen Reader Support**:
   - Chart alt text: "Funnel chart showing 0% navigation success rate"
   - Table headers properly marked
   - ARIA live regions for alerts

4. **Keyboard Navigation**:
   - All interactive elements focusable
   - Visible focus indicators
   - Logical tab order

## Performance Requirements

Dashboard must be fast even with large datasets:

1. **Data Limits**:
   - Funnel chart: Pre-aggregated data (no client-side calc)
   - Line charts: Max 1000 points, downsample for longer periods
   - Tables: Paginate at 100 rows

2. **Caching**:
   - Cache aggregated metrics for 30 seconds
   - Incremental updates (not full refresh)
   - Use React.memo for chart components

3. **Loading States**:
   - Show skeleton screens while loading
   - Progressive loading (KPIs first, charts second)
   - Error boundaries for failed chart loads

## Success Criteria

This analytics implementation is successful if:

1. **P0 Bug Detection**: Dashboard clearly shows 0% navigation success before fix
2. **P0 Bug Validation**: After fix, dashboard shows 100% navigation success
3. **Primary Metric**: Can measure email verification rate (target >75%)
4. **Performance**: Dashboard loads in <2s, updates in <500ms
5. **Alerts**: Critical navigation failure triggers alert within 1 minute
6. **Accessibility**: All charts pass WCAG AA automated tests
7. **Adoption**: Tucker and Peter use dashboard to validate fixes

## Next Steps (Post-P0)

After P0 fixes are deployed and validated:

1. **A/B Testing Framework** (P1):
   - Test loading text variants
   - Test success transition duration
   - Test button text variants

2. **Predictive Analytics** (P2):
   - Predict verification likelihood based on behavior
   - Identify users likely to abandon (proactive intervention)
   - Cohort retention forecasting

3. **Business Impact Modeling** (P2):
   - Connect verification rate to activation rate
   - Calculate CAC impact of improved flow
   - ROI dashboard for product improvements

4. **Customer-Facing Analytics** (P3):
   - Embeddable registration stats for enterprise customers
   - White-label analytics dashboard
   - API for programmatic access

## Appendices

### A. Event Catalog

See complete event definitions in Sections 1.1 and 1.2.

### B. Metrics Calculation Formulas

```typescript
// Email Verification Completion Rate (Primary Metric)
verification_rate = (email_verified_count / api_success_count) * 100;
// Target: >75%

// Navigation Success Rate (P0 Bug Metric)
navigation_success_rate = (navigation_success_count / api_success_count) * 100;
// Target: 100% (currently 0%)

// Overall Conversion Rate
conversion_rate = (email_verified_count / page_viewed_count) * 100;
// Target: >60% (85% * 95% * 98% * 95% * 100% * 100% * 75%)

// Error Rate
error_rate = (error_count / total_attempts) * 100;
// Target: <10%

// Drop-off Rate (per stage)
drop_off_rate =
  ((prev_stage_count - current_stage_count) / prev_stage_count) * 100;

// Average Time to Verify
avg_time_to_verify =
  sum(verification_time - registration_time) / verified_count;
// Target: <30 minutes
```

### C. Dashboard Component Specifications

```typescript
// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  target?: number;
  trend?: { direction: "up" | "down" | "neutral"; value: number };
  status?: "healthy" | "warning" | "critical";
  subtitle?: string;
}

// Funnel Chart Component
interface FunnelChartProps {
  stages: FunnelMetrics[];
  targets: Record<FunnelStage, number>;
  highlightStage?: FunnelStage; // Highlight problematic stage
}

// Performance Chart Component
interface PerformanceChartProps {
  data: Array<{ timestamp: number; p50: number; p95: number; p99: number }>;
  target: number;
  metric: "latency" | "error_rate";
}

// Error Breakdown Component
interface ErrorBreakdownProps {
  errors: {
    by_type: Record<ErrorType, number>;
    by_code: Record<string, number>;
    top_errors: Array<{ code: string; count: number; message: string }>;
  };
}
```

### D. References

- Existing Analytics: `/Users/danielzeddr/PetForce/packages/auth/src/utils/metrics.ts`
- Dashboard: `/Users/danielzeddr/PetForce/apps/web/src/features/auth/pages/AuthMetricsDashboard.tsx`
- Tucker's P0 Fixes: (reference Tucker's spec when available)
- Product Vision: `/Users/danielzeddr/PetForce/PRODUCT-VISION.md`
