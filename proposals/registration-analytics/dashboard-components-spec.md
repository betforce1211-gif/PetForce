# Dashboard Component Specifications

**For**: Engrid (Engineering Agent)  
**From**: Ana (Analytics Agent)  
**Purpose**: Detailed specs for implementing enhanced registration analytics dashboard

## Component Library

Use existing components where possible:

- `@/components/ui/Card` - For panels
- `@/components/ui/Button` - For interactions
- Recharts - For charts (already in dependencies)
- Framer Motion - For animations (already used)

## 1. KPICard Component

### Purpose

Display a single key metric with trend and status indication.

### Visual Design

```
┌─────────────────────────┐
│ Navigation Success      │  <- title (text-sm, opacity-80)
│                         │
│ 0%                  🔴  │  <- value (text-3xl, bold) + status icon
│                         │
│ Target: 100%            │  <- subtitle (text-xs, opacity-70)
│ ↓ 100% vs yesterday     │  <- trend (text-xs, color-coded)
└─────────────────────────┘
```

### TypeScript Interface

```typescript
interface KPICardProps {
  /** Card title */
  title: string;

  /** Main metric value */
  value: string | number;

  /** Optional target value for comparison */
  target?: number;

  /** Optional trend indicator */
  trend?: {
    direction: "up" | "down" | "neutral";
    value: number; // Percentage change
    label?: string; // e.g., "vs yesterday"
  };

  /** Visual status of the metric */
  status?: "healthy" | "warning" | "critical" | "neutral";

  /** Optional subtitle text */
  subtitle?: string;

  /** Optional click handler for drill-down */
  onClick?: () => void;

  /** Show loading skeleton */
  isLoading?: boolean;
}
```

### Status Colors

```typescript
const STATUS_COLORS = {
  healthy: {
    bg: "bg-green-50",
    text: "text-green-900",
    border: "border-green-200",
    icon: "✓",
  },
  warning: {
    bg: "bg-yellow-50",
    text: "text-yellow-900",
    border: "border-yellow-200",
    icon: "⚠",
  },
  critical: {
    bg: "bg-red-50",
    text: "text-red-900",
    border: "border-red-200",
    icon: "🔴",
  },
  neutral: {
    bg: "bg-gray-50",
    text: "text-gray-900",
    border: "border-gray-200",
    icon: "",
  },
};
```

### Trend Colors

```typescript
const TREND_COLORS = {
  up: "text-green-600", // Positive trend
  down: "text-red-600", // Negative trend
  neutral: "text-gray-600", // No change
};
```

### Implementation Notes

- Use Framer Motion for fade-in animation
- Show skeleton during loading (gray pulsing rectangles)
- Make clickable if onClick provided (add hover state)
- Responsive: Stack on mobile, grid on desktop

### Accessibility

- Status must not rely on color alone (use icon + text)
- Provide aria-label: `{title}: {value}, {status}`
- If clickable, use button role
- Trend arrow uses aria-hidden="true" (text provides context)

---

## 2. FunnelChart Component

### Purpose

Visualize 8-stage registration funnel with drop-off rates.

### Visual Design

```
┌─────────────────────────────────────────────────────┐
│ Registration Funnel                                 │
│                                                     │
│ 1. Page Viewed                1000 ██████████ 100% │
│    ↓ 80% continue                                   │
│ 2. Form Interaction            800 ████████ 80%    │
│    ↓ 88% continue                                   │
│ 3. Form Filled                 700 ███████ 70%     │
│    ↓ 97% continue                                   │
│ 4. Submit Clicked              680 ██████ 68%      │
│    ↓ 95% continue                                   │
│ 5. API Success                 647 ██████ 65%      │
│    ↓ 0% continue 🔴 PROBLEM!                        │
│ 6. Navigation Success            0 ▏ 0% 🔴         │
│    ↓ N/A                                            │
│ 7. Verify Page Viewed            0 ▏ 0%            │
│    ↓ N/A                                            │
│ 8. Email Verified                0 ▏ 0%            │
│                                                     │
│ Overall Conversion: 0% (target: 60%)                │
└─────────────────────────────────────────────────────┘
```

### TypeScript Interface

```typescript
enum FunnelStage {
  PAGE_VIEWED = 1,
  FORM_INTERACTION = 2,
  FORM_FILLED = 3,
  SUBMIT_CLICKED = 4,
  API_SUCCESS = 5,
  NAVIGATION_SUCCESS = 6,
  VERIFY_PAGE_VIEWED = 7,
  EMAIL_VERIFIED = 8,
}

interface FunnelStageData {
  stage: FunnelStage;
  label: string;
  count: number;
  percentage: number; // Relative to PAGE_VIEWED
  dropOffRate?: number; // % who didn't reach next stage
}

interface FunnelChartProps {
  /** Funnel stage data */
  stages: FunnelStageData[];

  /** Target conversion rates per stage */
  targets?: Record<FunnelStage, number>;

  /** Highlight a specific problematic stage */
  highlightStage?: FunnelStage;

  /** Show loading state */
  isLoading?: boolean;

  /** Click handler for drill-down */
  onStageClick?: (stage: FunnelStage) => void;
}
```

### Stage Labels

```typescript
const STAGE_LABELS: Record<FunnelStage, string> = {
  [FunnelStage.PAGE_VIEWED]: "Page Viewed",
  [FunnelStage.FORM_INTERACTION]: "Form Interaction",
  [FunnelStage.FORM_FILLED]: "Form Filled",
  [FunnelStage.SUBMIT_CLICKED]: "Submit Clicked",
  [FunnelStage.API_SUCCESS]: "API Success",
  [FunnelStage.NAVIGATION_SUCCESS]: "Navigation Success",
  [FunnelStage.VERIFY_PAGE_VIEWED]: "Verify Page Viewed",
  [FunnelStage.EMAIL_VERIFIED]: "Email Verified",
};
```

### Color Logic

```typescript
function getStageColor(stage: FunnelStageData, target?: number): string {
  if (!target) return "#2563EB"; // Primary blue

  if (stage.percentage >= target) return "#16A34A"; // Green
  if (stage.percentage >= target * 0.8) return "#EAB308"; // Yellow
  return "#DC2626"; // Red
}

function getDropOffColor(dropOffRate: number): string {
  if (dropOffRate <= 5) return "text-green-600";
  if (dropOffRate <= 15) return "text-yellow-600";
  return "text-red-600";
}
```

### Implementation Notes

- Each stage is a horizontal bar (width = percentage)
- Show count and percentage on the right
- Drop-off arrow between stages (↓ X% continue)
- Highlight critical stage with red glow
- Overall conversion at bottom
- Responsive: Reduce font size on mobile

### Accessibility

- Use table structure (screen reader friendly)
- Each bar has aria-label: "Stage X: Y users, Z%"
- Color + pattern for colorblind (stripes for below-target)
- Keyboard navigable if clickable

---

## 3. PerformanceChart Component

### Purpose

Show performance metrics over time with percentile lines.

### Visual Design

```
┌─────────────────────────────────────────────────┐
│ API Response Time                    [1h|24h|7d]│
│                                                 │
│ 5000ms ┤                                        │
│ 4000ms ┤           ╭─p99                        │
│ 3000ms ┤     ╭────╯  ╭─p95 (target)            │
│ 2000ms ┤   ╭╯       ╯                           │
│ 1000ms ┤ ╭╯  ╭─p50                              │
│    0ms ┼────────────────────────────            │
│        0h    6h    12h   18h   24h              │
│                                                 │
│ Current: p50=2.1s  p95=4.8s  p99=6.2s          │
│ Target:  p95 < 3.0s ⚠ Warning                   │
└─────────────────────────────────────────────────┘
```

### TypeScript Interface

```typescript
interface PerformanceDataPoint {
  timestamp: number;
  p50: number;
  p90?: number;
  p95: number;
  p99: number;
}

interface PerformanceChartProps {
  /** Time series data */
  data: PerformanceDataPoint[];

  /** Metric name */
  metric:
    | "api_response_time"
    | "button_disable_latency"
    | "total_registration_time";

  /** Target value (typically for p95) */
  target?: number;

  /** Time range */
  timeRange: "1h" | "24h" | "7d";

  /** Time range change handler */
  onTimeRangeChange?: (range: "1h" | "24h" | "7d") => void;

  /** Show loading state */
  isLoading?: boolean;
}
```

### Metric Configs

```typescript
const METRIC_CONFIGS = {
  api_response_time: {
    label: "API Response Time",
    unit: "ms",
    target: 3000,
    decimals: 0,
  },
  button_disable_latency: {
    label: "Button Disable Latency",
    unit: "ms",
    target: 100,
    decimals: 0,
  },
  total_registration_time: {
    label: "Total Registration Time",
    unit: "ms",
    target: 5000,
    decimals: 0,
  },
};
```

### Chart Colors

```typescript
const PERCENTILE_COLORS = {
  p50: "#60A5FA", // Light blue
  p90: "#93C5FD", // Lighter blue (optional)
  p95: "#2563EB", // Primary blue (main line)
  p99: "#1E40AF", // Dark blue
};

const TARGET_LINE = {
  stroke: "#EAB308", // Yellow
  strokeDasharray: "5 5", // Dashed
};
```

### Implementation Notes

- Use Recharts LineChart
- Show 3 lines: p50, p95, p99 (p90 optional)
- Target as horizontal reference line (dashed)
- Tooltip shows all values on hover
- X-axis: Time labels (adaptive based on range)
- Y-axis: Auto-scaled with 0 baseline
- Legend at bottom
- Time range selector buttons at top right

### Accessibility

- Chart has alt text describing trend
- Tooltip is keyboard accessible
- Data table toggle for screen readers
- Color + line style differentiation

---

## 4. ErrorBreakdown Component

### Purpose

Visualize error distribution by type and show top errors.

### Visual Design

```
┌─────────────────────────────────────────────────┐
│ Error Breakdown                     Total: 280  │
├────────────────────┬────────────────────────────┤
│ By Type            │ Top Errors                 │
│                    │                            │
│  Navigation: 88%   │ 1. NAVIGATION_BLOCKED      │
│  █████████         │    247 occurrences (88%)   │
│                    │                            │
│  API: 6%           │ 2. EMAIL_EXISTS            │
│  █                 │    18 occurrences (6%)     │
│                    │                            │
│  Validation: 4%    │ 3. PASSWORD_WEAK           │
│  ▌                 │    12 occurrences (4%)     │
│                    │                            │
│  Network: 1%       │ 4. NETWORK_TIMEOUT         │
│  ▌                 │    3 occurrences (1%)      │
│                    │                            │
│  Unexpected: 1%    │ 5. UNEXPECTED_ERROR        │
│  ▌                 │    0 occurrences (0%)      │
└────────────────────┴────────────────────────────┘
```

### TypeScript Interface

```typescript
type ErrorType = "navigation" | "api" | "validation" | "network" | "unexpected";

interface ErrorData {
  total_errors: number;
  by_type: Record<ErrorType, number>;
  by_code: Record<string, number>;
  top_errors: Array<{
    code: string;
    count: number;
    message: string;
    percentage: number;
  }>;
}

interface ErrorBreakdownProps {
  /** Error data */
  errors: ErrorData;

  /** Show loading state */
  isLoading?: boolean;

  /** Click handler for error code (drill-down) */
  onErrorClick?: (code: string) => void;
}
```

### Error Type Colors

```typescript
const ERROR_TYPE_COLORS: Record<ErrorType, string> = {
  navigation: "#DC2626", // Red (critical bug)
  api: "#EA580C", // Orange
  validation: "#EAB308", // Yellow
  network: "#2563EB", // Blue
  unexpected: "#6B7280", // Gray
};
```

### Implementation Notes

- Left side: Horizontal bar chart of error types
- Right side: Numbered list of top 5 errors
- Show percentage and count for each
- Clickable for drill-down
- Empty state: "No errors in this period 🎉"

### Accessibility

- Bar chart uses color + label
- List is semantic HTML (`<ol>`)
- Each item has full context in aria-label
- Keyboard navigable if clickable

---

## 5. AlertPanel Component

### Purpose

Display active alerts and recent alert history.

### Visual Design

```
┌─────────────────────────────────────────────────┐
│ 🚨 Active Alerts (2)                             │
├─────────────────────────────────────────────────┤
│ 🔴 CRITICAL                         2 mins ago   │
│ Navigation failure rate 100%                    │
│ No users reaching verification page             │
│ [Acknowledge] [View Details]                    │
├─────────────────────────────────────────────────┤
│ 🟡 WARNING                         15 mins ago   │
│ Low email verification rate: 45%                │
│ Target: >75%                                    │
│ [Acknowledge] [View Details]                    │
├─────────────────────────────────────────────────┤
│ Recent Alerts (last 24h)                         │
│ • API error spike - Resolved 2h ago             │
│ • Slow response time - Resolved 5h ago          │
└─────────────────────────────────────────────────┘
```

### TypeScript Interface

```typescript
interface Alert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: number;
  acknowledged?: boolean;
  resolved?: boolean;
}

interface AlertPanelProps {
  /** Active alerts */
  alerts: Alert[];

  /** Recent alert history */
  history?: Alert[];

  /** Acknowledge handler */
  onAcknowledge?: (alertId: string) => void;

  /** View details handler */
  onViewDetails?: (alertId: string) => void;

  /** Show loading state */
  isLoading?: boolean;
}
```

### Alert Styles

```typescript
const ALERT_STYLES = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: "🔴",
    iconBg: "bg-red-100",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    icon: "🟡",
    iconBg: "bg-yellow-100",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: "ℹ️",
    iconBg: "bg-blue-100",
  },
};
```

### Implementation Notes

- Active alerts at top (most recent first)
- Animate entrance (slide down + fade in)
- Time ago format: "2 mins ago", "1 hour ago"
- Acknowledge button disables alert (grays out)
- History section collapsible
- Empty state: "No active alerts 🎉"

### Accessibility

- Alerts use role="alert" for screen readers
- Critical alerts announced immediately
- Time uses `<time>` element with datetime attribute
- Buttons are keyboard accessible

---

## 6. PlatformComparison Component

### Purpose

Compare web vs mobile registration metrics side-by-side.

### Visual Design

```
┌──────────────────────────────────────────────────┐
│ Platform Comparison                              │
├────────────────────┬─────────────────────────────┤
│ Web (81%)          │ Mobile (19%)                │
│                    │                             │
│ Registrations: 200 │ Registrations: 47           │
│ Success: 92%  ✓    │ Success: 95%  ✓             │
│ Nav success: 0% 🔴 │ Nav success: 0% 🔴          │
│ Verify rate: 0%    │ Verify rate: 0%             │
│ Avg time: 4.1s     │ Avg time: 5.2s              │
│                    │                             │
│ [View Web Details] │ [View Mobile Details]       │
└────────────────────┴─────────────────────────────┘
```

### TypeScript Interface

```typescript
interface PlatformMetrics {
  total_registrations: number;
  success_rate: number;
  navigation_success_rate: number;
  verification_rate: number;
  avg_time_ms: number;
}

interface PlatformComparisonProps {
  /** Web platform metrics */
  web: PlatformMetrics;

  /** Mobile platform metrics */
  mobile: PlatformMetrics;

  /** Click handler for platform drill-down */
  onPlatformClick?: (platform: "web" | "mobile") => void;

  /** Show loading state */
  isLoading?: boolean;
}
```

### Implementation Notes

- Two-column layout (responsive: stack on mobile)
- Show platform distribution percentage in header
- Highlight significant differences (>10% delta)
- Use status icons (✓ / 🔴 / ⚠)
- Drill-down buttons at bottom
- Empty state if no data for platform

### Accessibility

- Each column is a semantic section
- Metrics use definition list (`<dl>`)
- Platform % in header for context
- Keyboard navigable drill-down

---

## 7. Updated AuthMetricsDashboard Layout

### Overall Structure

```typescript
export function AuthMetricsDashboard() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'web' | 'mobile'>('all');

  // Fetch metrics from API
  const { data: metrics, isLoading } = useRegistrationMetrics(timeRange, platformFilter);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <DashboardHeader
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          platformFilter={platformFilter}
          onPlatformFilterChange={setPlatformFilter}
        />

        {/* Alerts (if any) */}
        {metrics?.alerts && metrics.alerts.length > 0 && (
          <AlertPanel
            alerts={metrics.alerts}
            onAcknowledge={handleAcknowledge}
            onViewDetails={handleViewDetails}
          />
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Registrations"
            value={metrics?.total_registrations ?? 0}
            trend={metrics?.trends.registrations}
            status="neutral"
            isLoading={isLoading}
          />
          <KPICard
            title="API Success Rate"
            value={`${metrics?.api_success_rate ?? 0}%`}
            target={95}
            trend={metrics?.trends.api_success}
            status={getSuccessRateStatus(metrics?.api_success_rate)}
            isLoading={isLoading}
          />
          <KPICard
            title="Navigation Success"
            value={`${metrics?.navigation_success_rate ?? 0}%`}
            target={100}
            subtitle="CRITICAL METRIC"
            status={getNavigationStatus(metrics?.navigation_success_rate)}
            isLoading={isLoading}
          />
          <KPICard
            title="Email Verification Rate"
            value={`${metrics?.verification_rate ?? 0}%`}
            target={75}
            subtitle="PRIMARY GOAL"
            status={getVerificationStatus(metrics?.verification_rate)}
            isLoading={isLoading}
          />
        </div>

        {/* Funnel */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Registration Funnel</h2>
          <FunnelChart
            stages={metrics?.funnel ?? []}
            targets={FUNNEL_TARGETS}
            highlightStage={findProblematicStage(metrics?.funnel)}
            isLoading={isLoading}
          />
        </Card>

        {/* Performance */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart
              data={metrics?.performance.api_response_time ?? []}
              metric="api_response_time"
              target={3000}
              timeRange={timeRange}
              isLoading={isLoading}
            />
            <PerformanceChart
              data={metrics?.performance.button_disable_latency ?? []}
              metric="button_disable_latency"
              target={100}
              timeRange={timeRange}
              isLoading={isLoading}
            />
          </div>
        </Card>

        {/* Errors */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Error Analysis</h2>
          <ErrorBreakdown
            errors={metrics?.errors ?? DEFAULT_ERROR_DATA}
            onErrorClick={handleErrorDrillDown}
            isLoading={isLoading}
          />
        </Card>

        {/* Platform Comparison */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Platform Comparison</h2>
          <PlatformComparison
            web={metrics?.cohorts.by_source.web ?? DEFAULT_PLATFORM_METRICS}
            mobile={metrics?.cohorts.by_source.mobile ?? DEFAULT_PLATFORM_METRICS}
            onPlatformClick={handlePlatformDrillDown}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </div>
  );
}
```

### API Endpoint

```typescript
// GET /api/analytics/registration/summary
interface RegistrationMetricsResponse {
  total_registrations: number;
  api_success_rate: number;
  navigation_success_rate: number;
  verification_rate: number;

  funnel: FunnelStageData[];

  performance: {
    api_response_time: PerformanceDataPoint[];
    button_disable_latency: PerformanceDataPoint[];
    total_registration_time: PerformanceDataPoint[];
  };

  errors: ErrorData;

  cohorts: {
    by_source: {
      web: PlatformMetrics;
      mobile: PlatformMetrics;
    };
  };

  alerts: Alert[];

  trends: {
    registrations: TrendData;
    api_success: TrendData;
    navigation: TrendData;
    verification: TrendData;
  };
}
```

---

## Color Palette Reference

```typescript
export const ANALYTICS_COLORS = {
  // Status colors
  success: "#16A34A",
  warning: "#EAB308",
  error: "#DC2626",
  neutral: "#6B7280",

  // Chart colors (categorical)
  primary: "#2563EB",
  secondary: "#7C3AED",
  accent1: "#DB2777",
  accent2: "#EA580C",

  // Chart colors (sequential)
  blue_light: "#EFF6FF",
  blue_lighter: "#BFDBFE",
  blue_medium: "#60A5FA",
  blue_primary: "#2563EB",
  blue_dark: "#1E40AF",

  // Backgrounds
  bg_success: "#F0FDF4",
  bg_warning: "#FEFCE8",
  bg_error: "#FEF2F2",
  bg_neutral: "#F9FAFB",
};
```

## Accessibility Checklist

Every component must:

- [ ] Meet 4.5:1 contrast ratio
- [ ] Not rely on color alone (use icons/patterns)
- [ ] Have semantic HTML structure
- [ ] Include ARIA labels where needed
- [ ] Be keyboard navigable
- [ ] Provide alt text for charts
- [ ] Support screen readers
- [ ] Have visible focus indicators

## Performance Checklist

Every component must:

- [ ] Use React.memo for pure components
- [ ] Implement loading skeletons
- [ ] Handle error states gracefully
- [ ] Debounce user interactions
- [ ] Lazy load charts below fold
- [ ] Virtualize long lists (errors table)
- [ ] Cache computed values

## Responsive Design

Breakpoints:

- Mobile: < 768px (stack vertically, simplify charts)
- Tablet: 768px - 1024px (2-column grid)
- Desktop: > 1024px (full layout)

Mobile considerations:

- Reduce font sizes
- Simplify charts (fewer data points)
- Stack KPI cards
- Collapse platform comparison
- Hide p90 line on performance charts
