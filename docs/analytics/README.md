# PetForce Analytics System

Comprehensive analytics and data-driven insights for building better pet care experiences.

## Philosophy

**Ana's Analytics Principles:**

1. **Data-Driven Decisions** - Every feature decision backed by real user behavior data
2. **Privacy-First** - Collect only what's needed, anonymize everything possible
3. **Actionable Insights** - Metrics that drive actual product improvements
4. **Real-Time Visibility** - See what's happening now, not just what happened
5. **User-Centric** - Measure outcomes that matter to pet families
6. **Cross-Platform** - Unified analytics across web, mobile, and API
7. **Performance** - Analytics never slow down the user experience

---

## Quick Start

### For Product Managers

**Key Dashboards:**

- [Product Overview Dashboard](#product-overview-dashboard) - High-level metrics
- [Feature Adoption Dashboard](#feature-adoption-dashboard) - New feature performance
- [User Health Dashboard](#user-health-dashboard) - Engagement and retention

**Most Important Metrics:**

- Daily Active Users (DAU) / Monthly Active Users (MAU)
- Feature Adoption Rate
- User Retention (Day 1, Day 7, Day 30)
- Time to Value (registration → first household created)

### For Developers

```typescript
import { analytics } from "@petforce/analytics";

// Track an event
analytics.track("household_created", {
  householdId: household.id,
  memberCount: 1,
  hasDescription: !!household.description,
});

// Track a page view
analytics.page("Household Details", {
  householdId: params.id,
});

// Identify a user
analytics.identify(user.id, {
  email: user.email, // Automatically hashed
  createdAt: user.created_at,
});
```

### For Designers

**Visualization Guidelines:**

- [Chart Selection Guide](#chart-selection-guide) - When to use each chart type
- [Dashboard Design Patterns](#dashboard-design-patterns) - Layout and composition
- [Accessibility for Data Viz](#accessibility-for-data-visualization) - WCAG compliant charts

---

## Table of Contents

1. [Analytics Strategy](#analytics-strategy)
2. [Event Tracking Specification](#event-tracking-specification)
3. [Metrics & KPIs](#metrics--kpis)
4. [Dashboard Design](#dashboard-design)
5. [Implementation Guide](#implementation-guide)
6. [Privacy & Compliance](#privacy--compliance)
7. [Analytics Stack](#analytics-stack)
8. [Best Practices](#best-practices)

---

## Analytics Strategy

### North Star Metric

**Primary Metric:** Active Households per Week

**Why this metric:**

- Directly measures our core value proposition (collaborative pet care)
- Indicates both user acquisition AND retention
- Correlates with user engagement and satisfaction
- Easy to understand and communicate

**Supporting Metrics:**

- Member Invitations per Household (virality)
- Tasks Completed per Household (engagement)
- Average Household Lifespan (retention)

### Analytics Hierarchy

```
North Star: Active Households per Week
    │
    ├─ Acquisition
    │   ├─ New User Registrations
    │   ├─ Registration Completion Rate
    │   └─ Time to First Household Created
    │
    ├─ Activation
    │   ├─ Households Created (Week 1)
    │   ├─ Members Invited (Week 1)
    │   └─ First Task Completed
    │
    ├─ Engagement
    │   ├─ Daily Active Users (DAU)
    │   ├─ Tasks per Active User
    │   └─ Sessions per User per Week
    │
    ├─ Retention
    │   ├─ Day 1, Day 7, Day 30 Retention
    │   ├─ Weekly Active Users (WAU)
    │   └─ Churn Rate
    │
    └─ Revenue (Future)
        ├─ Conversion to Premium
        ├─ Average Revenue per User (ARPU)
        └─ Customer Lifetime Value (LTV)
```

### Key Performance Indicators (KPIs)

#### Acquisition KPIs

| Metric                          | Target  | Current | Status |
| ------------------------------- | ------- | ------- | ------ |
| New User Registrations (Weekly) | 500     | TBD     | 🎯     |
| Registration Completion Rate    | 75%     | TBD     | 🎯     |
| Email Verification Rate         | 80%     | TBD     | 🎯     |
| Time to First Household         | < 5 min | TBD     | 🎯     |

#### Activation KPIs

| Metric                      | Target | Current | Status |
| --------------------------- | ------ | ------- | ------ |
| Households Created (Week 1) | 60%    | TBD     | 🎯     |
| Members Invited (Week 1)    | 40%    | TBD     | 🎯     |
| Multi-Member Households     | 50%    | TBD     | 🎯     |
| QR Code Shares              | 30%    | TBD     | 🎯     |

#### Engagement KPIs

| Metric                     | Target | Current | Status |
| -------------------------- | ------ | ------- | ------ |
| Daily Active Users (DAU)   | 1,000  | TBD     | 🎯     |
| DAU / MAU Ratio            | 40%    | TBD     | 🎯     |
| Sessions per User per Week | 5      | TBD     | 🎯     |
| Average Session Duration   | 3 min  | TBD     | 🎯     |

#### Retention KPIs

| Metric             | Target | Current | Status |
| ------------------ | ------ | ------- | ------ |
| Day 1 Retention    | 60%    | TBD     | 🎯     |
| Day 7 Retention    | 40%    | TBD     | 🎯     |
| Day 30 Retention   | 25%    | TBD     | 🎯     |
| Monthly Churn Rate | < 10%  | TBD     | 🎯     |

---

## Event Tracking Specification

### Event Taxonomy

All events follow this naming convention:

```
{object}_{action}
```

**Examples:**

- `household_created`
- `member_invited`
- `email_verified`

### Core Events

#### Authentication Events

```typescript
// User Registration
analytics.track("user_registered", {
  userId: string, // Auto-hashed user ID
  email: string, // Auto-hashed email
  registrationMethod: "email" | "google" | "apple",
  emailConfirmed: boolean,
  timestamp: Date,
});

// Email Verification
analytics.track("email_verified", {
  userId: string,
  verificationMethod: "link" | "auto_poll",
  timeToVerify: number, // Seconds from registration
  timestamp: Date,
});

// User Login
analytics.track("user_logged_in", {
  userId: string,
  loginMethod: "email" | "google" | "apple",
  sessionId: string,
  timestamp: Date,
});

// User Logout
analytics.track("user_logged_out", {
  userId: string,
  sessionDuration: number, // Seconds
  timestamp: Date,
});
```

#### Household Events

```typescript
// Household Created
analytics.track('household_created', {
  householdId: string,
  userId: string,              // Creator
  name: string,                // Household name (not PII)
  hasDescription: boolean,
  memberCount: number,         // Initially 1
  inviteCode: string,          // The generated code
  timestamp: Date,
});

// Household Updated
analytics.track('household_updated', {
  householdId: string,
  userId: string,              // Who updated
  fieldsChanged: string[],     // ['name', 'description']
  timestamp: Date,
});

// Household Deleted
analytics.track('household_deleted', {
  householdId: string,
  userId: string,              // Who deleted
  memberCount: number,         // At deletion
  householdAge: number,        // Days since creation
  timestamp: Date,
});

// Invite Code Regenerated
analytics.track('invite_code_regenerated', {
  householdId: string,
  userId: string,              // Who regenerated
  previousCode: string,
  newCode: string,
  timestamp: Date,
});
```

#### Member Events

```typescript
// Member Invited
analytics.track("member_invited", {
  householdId: string,
  inviterId: string, // Who sent invite
  inviteMethod: "qr_code" | "share_link" | "manual_code",
  timestamp: Date,
});

// Join Request Submitted
analytics.track("join_request_submitted", {
  householdId: string,
  userId: string, // Who requested
  inviteCode: string,
  timestamp: Date,
});

// Member Approved
analytics.track("member_approved", {
  householdId: string,
  approverId: string, // Who approved
  newMemberId: string, // Who joined
  timeToApproval: number, // Seconds from request
  timestamp: Date,
});

// Member Rejected
analytics.track("member_rejected", {
  householdId: string,
  rejectorId: string,
  rejectedUserId: string,
  timestamp: Date,
});

// Member Removed
analytics.track("member_removed", {
  householdId: string,
  removerId: string,
  removedMemberId: string,
  membershipDuration: number, // Days
  timestamp: Date,
});

// Member Left
analytics.track("member_left", {
  householdId: string,
  userId: string, // Who left
  membershipDuration: number, // Days
  timestamp: Date,
});
```

#### QR Code Events

```typescript
// QR Code Generated
analytics.track("qr_code_generated", {
  householdId: string,
  userId: string,
  qrCodeSize: number, // pixels
  platform: "web" | "ios" | "android",
  timestamp: Date,
});

// QR Code Scanned
analytics.track("qr_code_scanned", {
  householdId: string,
  userId: string, // Scanner (if logged in)
  inviteCode: string,
  platform: "web" | "ios" | "android",
  timestamp: Date,
});

// QR Code Shared
analytics.track("qr_code_shared", {
  householdId: string,
  userId: string,
  shareMethod: "download" | "system_share" | "copy_link",
  platform: "web" | "ios" | "android",
  timestamp: Date,
});
```

#### Page View Events

```typescript
// Page Viewed
analytics.page('Page Name', {
  path: string,                // URL path
  referrer: string,            // Previous page
  userId?: string,             // If authenticated
  sessionId: string,
  timestamp: Date,
});

// Common Page Names:
// - 'Registration'
// - 'Email Verification'
// - 'Login'
// - 'Dashboard'
// - 'Household List'
// - 'Household Details'
// - 'Create Household'
// - 'Join Household'
// - 'Member Management'
```

#### Error Events

```typescript
// Error Occurred
analytics.track('error_occurred', {
  errorType: 'validation' | 'network' | 'server' | 'client',
  errorCode: string,           // e.g., 'VALIDATION_ERROR'
  errorMessage: string,        // User-facing message
  page: string,                // Where error occurred
  userId?: string,
  timestamp: Date,
});

// API Error
analytics.track('api_error', {
  endpoint: string,            // e.g., '/households'
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  statusCode: number,          // HTTP status
  errorCode: string,
  userId?: string,
  timestamp: Date,
});
```

---

## Metrics & KPIs

### User Metrics

#### Daily Active Users (DAU)

**Definition:** Unique users who performed any tracked action in a 24-hour period.

**Calculation:**

```sql
SELECT COUNT(DISTINCT user_id)
FROM events
WHERE date = CURRENT_DATE;
```

**Segments:**

- Platform (Web, iOS, Android)
- User Type (Free, Premium)
- Household Role (Leader, Member)

**Target:** 1,000 DAU

#### Monthly Active Users (MAU)

**Definition:** Unique users who performed any tracked action in a 30-day period.

**Calculation:**

```sql
SELECT COUNT(DISTINCT user_id)
FROM events
WHERE date >= CURRENT_DATE - INTERVAL '30 days';
```

**DAU/MAU Ratio:**

- **Formula:** `DAU / MAU * 100`
- **Target:** 40%
- **Interpretation:** Higher ratio = more engaged user base

#### Stickiness

**Definition:** How often users return within a month.

**Calculation:**

```sql
SELECT
  user_id,
  COUNT(DISTINCT DATE(timestamp)) as days_active,
  days_active / 30.0 as stickiness
FROM events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;
```

**Target:** 30% (users active 9+ days per month)

### Household Metrics

#### Active Households

**Definition:** Households with at least one member action in past 7 days.

**Calculation:**

```sql
SELECT COUNT(DISTINCT household_id)
FROM events
WHERE event_name IN (
  'household_updated',
  'member_invited',
  'qr_code_generated'
)
AND timestamp >= CURRENT_DATE - INTERVAL '7 days';
```

**Target:** 500 active households per week

#### Household Growth Rate

**Definition:** Week-over-week growth in total households.

**Calculation:**

```sql
WITH weekly_households AS (
  SELECT
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as new_households
  FROM households
  GROUP BY week
)
SELECT
  week,
  new_households,
  LAG(new_households) OVER (ORDER BY week) as prev_week,
  (new_households - prev_week) / prev_week * 100 as growth_rate
FROM weekly_households;
```

**Target:** 10% week-over-week growth

#### Average Members per Household

**Definition:** Mean number of approved members per household.

**Calculation:**

```sql
SELECT AVG(member_count) as avg_members
FROM (
  SELECT
    household_id,
    COUNT(*) as member_count
  FROM household_members
  WHERE status = 'approved'
  GROUP BY household_id
) household_sizes;
```

**Target:** 2.5 members per household

### Engagement Metrics

#### Session Duration

**Definition:** Average time between first and last event in a session.

**Calculation:**

```sql
WITH sessions AS (
  SELECT
    session_id,
    MIN(timestamp) as session_start,
    MAX(timestamp) as session_end,
    EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as duration
  FROM events
  GROUP BY session_id
)
SELECT AVG(duration) / 60.0 as avg_duration_minutes
FROM sessions
WHERE duration > 0;
```

**Target:** 3 minutes average

#### Pages per Session

**Definition:** Average number of pages viewed per session.

**Calculation:**

```sql
SELECT AVG(page_count) as avg_pages_per_session
FROM (
  SELECT
    session_id,
    COUNT(*) as page_count
  FROM events
  WHERE event_name = 'page_viewed'
  GROUP BY session_id
) session_pages;
```

**Target:** 5 pages per session

#### Feature Adoption Rate

**Definition:** Percentage of users who use a specific feature.

**Calculation:**

```sql
-- Example: QR Code feature
SELECT
  COUNT(DISTINCT user_id) / (
    SELECT COUNT(DISTINCT user_id) FROM users
  ) * 100 as adoption_rate
FROM events
WHERE event_name = 'qr_code_generated'
AND timestamp >= CURRENT_DATE - INTERVAL '30 days';
```

**Target:** 30% adoption for core features

### Retention Metrics

#### Day N Retention

**Definition:** Percentage of users who return N days after registration.

**Calculation:**

```sql
-- Day 7 Retention Example
WITH cohort AS (
  SELECT
    user_id,
    DATE(created_at) as cohort_date
  FROM users
  WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
),
retention AS (
  SELECT
    c.user_id,
    c.cohort_date,
    MAX(CASE
      WHEN DATE(e.timestamp) = c.cohort_date + INTERVAL '7 days'
      THEN 1 ELSE 0
    END) as returned_day_7
  FROM cohort c
  LEFT JOIN events e ON c.user_id = e.user_id
  WHERE DATE(e.timestamp) <= c.cohort_date + INTERVAL '7 days'
  GROUP BY c.user_id, c.cohort_date
)
SELECT
  cohort_date,
  COUNT(*) as cohort_size,
  SUM(returned_day_7) as returned,
  SUM(returned_day_7) / COUNT(*) * 100 as day_7_retention
FROM retention
GROUP BY cohort_date
ORDER BY cohort_date;
```

**Targets:**

- Day 1: 60%
- Day 7: 40%
- Day 30: 25%

#### Cohort Analysis

**Definition:** Track retention by user cohort over time.

**Visualization:** Cohort retention matrix

```
          Week 0  Week 1  Week 2  Week 3  Week 4
Jan Week 1   100%    45%     38%     32%     28%
Jan Week 2   100%    48%     40%     35%     --
Jan Week 3   100%    50%     42%     --      --
Jan Week 4   100%    52%     --      --      --
```

**Analysis:**

- Identify which cohorts have better retention
- Correlate with product changes or campaigns
- Track improvements over time

### Funnel Metrics

#### Registration Funnel

```
Registration Started (100%)
    ↓
Email Entered (85%)
    ↓
Password Created (75%)
    ↓
Registration Submitted (70%)
    ↓
Email Verified (56%)
    ↓
First Household Created (42%)
```

**Drop-off Analysis:**

- Biggest drop: Email verification (70% → 56%)
- Improvement opportunity: Streamline verification process

#### Household Creation Funnel

```
View Dashboard (100%)
    ↓
Click "Create Household" (60%)
    ↓
Enter Household Name (55%)
    ↓
Submit Form (50%)
    ↓
Household Created Successfully (48%)
```

**Optimization:**

- Conversion rate: 48%
- Target: 60%
- Focus: Reduce form friction

---

## Dashboard Design

### Product Overview Dashboard

**Purpose:** High-level health metrics for product and executives.

**Metrics:**

- North Star Metric (Active Households per Week) - Big number
- Daily Active Users (DAU) - Trend chart (30 days)
- New Registrations - Trend chart (30 days)
- Day 7 Retention - Trend chart (cohorts)
- Feature Adoption - Horizontal bar chart

**Refresh Rate:** Real-time (updates every 5 minutes)

**Access:** Product managers, executives, leadership

### Feature Adoption Dashboard

**Purpose:** Track adoption of new features.

**Metrics per Feature:**

- Adoption Rate (% of users who tried feature)
- Power Users (% who use feature weekly)
- Trend (adoption over time)
- Segments (web vs mobile, by user type)

**Example Features:**

- QR Code Generation
- Household Invites
- Member Management

**Refresh Rate:** Daily

**Access:** Product managers, feature owners

### User Health Dashboard

**Purpose:** Monitor user engagement and identify at-risk users.

**Metrics:**

- Active Users (DAU, WAU, MAU) - Trend
- Engagement Score Distribution - Histogram
- At-Risk Users - Count and list
- Churn Prediction - ML model output

**Engagement Score:**

```typescript
// Score 0-100
const engagementScore =
  (daysActive / 30) * 40 + // 40% weight on frequency
  (householdsActive / totalHouseholds) * 30 + // 30% weight on breadth
  actionsPerDay * 20 + // 20% weight on depth
  (sessionDuration / 300) * 10; // 10% weight on duration
```

**Refresh Rate:** Daily

**Access:** Product managers, customer success

### Funnel Analysis Dashboard

**Purpose:** Identify conversion bottlenecks.

**Funnels:**

- Registration Funnel
- Household Creation Funnel
- Member Invitation Funnel
- Premium Conversion Funnel (future)

**Visualizations:**

- Funnel chart with drop-off percentages
- Cohort comparison (A/B tests)
- Segment breakdown (web vs mobile)

**Refresh Rate:** Real-time

**Access:** Product managers, growth team

---

## Chart Selection Guide

### When to Use Each Chart Type

#### Line Chart

**Use for:** Trends over time
**Examples:**

- Daily Active Users over 30 days
- Retention curves
- Cumulative growth

**Best Practices:**

- Max 5 lines per chart
- Use color for differentiation
- Label axes clearly
- Show data points on hover

#### Bar Chart (Vertical)

**Use for:** Comparing categories
**Examples:**

- Feature adoption by feature
- Error counts by type
- Platform distribution

**Best Practices:**

- Sort by value (descending)
- Use consistent colors
- Label bars if space allows
- Max 10 bars per chart

#### Bar Chart (Horizontal)

**Use for:** Ranking with long labels
**Examples:**

- Top error messages
- Most active households
- Feature usage ranking

**Best Practices:**

- Always sorted
- Labels on left, values on right
- Color coding for positive/negative

#### Pie Chart

**Use for:** Part-to-whole (max 5 slices)
**Examples:**

- Platform distribution (Web, iOS, Android)
- User type breakdown

**Best Practices:**

- Use only when parts sum to 100%
- Max 5 slices
- Consider donut chart for aesthetics
- Show percentages

**⚠️ Often better as bar chart!**

#### Area Chart

**Use for:** Cumulative totals over time
**Examples:**

- Stacked user types over time
- Cumulative registrations

**Best Practices:**

- Stacked areas should be ordered
- Use transparency for overlapping
- Clear legend

#### Scatter Plot

**Use for:** Correlation between two metrics
**Examples:**

- Session duration vs. retention
- Household size vs. engagement

**Best Practices:**

- Label axes clearly
- Add trend line if correlation exists
- Use size/color for third dimension

#### Heatmap

**Use for:** Cohort analysis, patterns
**Examples:**

- Retention cohort matrix
- Activity by day of week and hour

**Best Practices:**

- Use sequential color scale
- Clear row/column labels
- Show values on hover

#### KPI Card (Big Number)

**Use for:** Single most important metric
**Examples:**

- North Star Metric
- Revenue
- Active Users

**Best Practices:**

- Large, readable number
- Clear label
- Trend indicator (↑ 12% vs last week)
- Comparison context

---

## Dashboard Design Patterns

### Layout Principles

**F-Pattern Reading:**

```
┌─────────────────────────────────────┐
│ [KPI Card]  [KPI Card]  [KPI Card] │  ← Most important metrics
├─────────────────────────────────────┤
│ [Main Chart - Large]                │  ← Primary visualization
│                                     │
├─────────────────┬───────────────────┤
│ [Chart 1]       │ [Chart 2]         │  ← Supporting metrics
├─────────────────┴───────────────────┤
│ [Data Table - Scrollable]           │  ← Detailed breakdown
└─────────────────────────────────────┘
```

**Grid System:**

- 12-column grid
- Consistent spacing (16px, 24px)
- Responsive breakpoints

**Information Density:**

- Not too sparse (wasted space)
- Not too dense (overwhelming)
- White space for breathing

### Color Usage

**Semantic Colors:**

- 🟢 Green: Positive, success, increase
- 🔴 Red: Negative, error, decrease
- 🟡 Yellow: Warning, attention needed
- 🔵 Blue: Neutral, information
- ⚪ Gray: Inactive, disabled

**Data Visualization Colors:**

```css
/* Sequential (for continuous data) */
--viz-seq-1: #e6f7f3; /* Lightest */
--viz-seq-2: #b3e8dc;
--viz-seq-3: #80d9c5;
--viz-seq-4: #4dcaae;
--viz-seq-5: #2d9b87; /* Darkest */

/* Categorical (for distinct categories) */
--viz-cat-1: #2d9b87; /* Primary green */
--viz-cat-2: #ff9500; /* Secondary orange */
--viz-cat-3: #3b82f6; /* Blue */
--viz-cat-4: #8b5cf6; /* Purple */
--viz-cat-5: #ec4899; /* Pink */

/* Diverging (for positive/negative) */
--viz-neg: #ef4444; /* Red (negative) */
--viz-neutral: #6b7280; /* Gray (neutral) */
--viz-pos: #10b981; /* Green (positive) */
```

**Accessibility:**

- All colors meet WCAG AA (4.5:1 contrast)
- Never rely on color alone
- Patterns/icons supplement color
- Color-blind safe palettes

### Interactive Elements

**Tooltips:**

```typescript
<Tooltip>
  <TooltipTrigger>
    <DataPoint />
  </TooltipTrigger>
  <TooltipContent>
    <strong>Jan 15, 2026</strong><br />
    Active Users: 1,234<br />
    ↑ 12% vs previous day
  </TooltipContent>
</Tooltip>
```

**Filters:**

- Date range picker (default: Last 30 days)
- Platform filter (All, Web, iOS, Android)
- Segment filter (All Users, Free, Premium)
- Persist filter state in URL

**Drill-Down:**

- Click chart → see detail table
- Click data point → see user list
- Click segment → filter entire dashboard

---

## Accessibility for Data Visualization

### WCAG 2.1 AA Compliance

**Color Contrast:**

- Text on background: 4.5:1 minimum
- Chart elements: 3:1 minimum
- Don't rely on color alone

**Keyboard Navigation:**

- All interactive elements focusable
- Tab through filters and controls
- Arrow keys for data point navigation

**Screen Reader Support:**

```html
<!-- Chart with ARIA labels -->
<div
  role="img"
  aria-label="Line chart showing Daily Active Users over the past 30 days. The trend shows an increase from 800 users on January 1st to 1,234 users on January 30th, representing a 54% growth."
>
  <svg><!-- Chart visualization --></svg>
</div>

<!-- Data table alternative -->
<details>
  <summary>View data as table</summary>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Active Users</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Jan 1, 2026</td>
        <td>800</td>
      </tr>
      <!-- ... -->
    </tbody>
  </table>
</details>
```

**Alternative Formats:**

- Always provide data table view
- Export to CSV functionality
- Text summary of key findings

---

## Implementation Guide

### Analytics SDK Setup

**Web (React):**

```typescript
// src/lib/analytics.ts
import { AnalyticsClient } from "@petforce/analytics";

export const analytics = new AnalyticsClient({
  writeKey: process.env.NEXT_PUBLIC_ANALYTICS_KEY,
  debug: process.env.NODE_ENV === "development",

  // Privacy-first defaults
  anonymizeIP: true,
  respectDoNotTrack: true,

  // Performance
  flushInterval: 10000, // 10 seconds
  maxBatchSize: 50,
});

// Initialize on app mount
analytics.init();
```

**Mobile (React Native):**

```typescript
// src/services/analytics.ts
import { AnalyticsClient } from "@petforce/analytics-mobile";
import { Platform } from "react-native";

export const analytics = new AnalyticsClient({
  writeKey: Platform.select({
    ios: Config.ANALYTICS_KEY_IOS,
    android: Config.ANALYTICS_KEY_ANDROID,
  }),

  // Mobile-specific settings
  trackAppLifecycle: true,
  trackDeepLinks: true,
  flushQueueSize: 20,
});
```

### Tracking Patterns

**Page Views (Auto-tracking):**

```typescript
// app/_layout.tsx (Next.js App Router)
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    analytics.page(pathname);
  }, [pathname]);

  return children;
}
```

**Event Tracking:**

```typescript
// components/CreateHouseholdForm.tsx
import { analytics } from '@/lib/analytics';

function CreateHouseholdForm() {
  const handleSubmit = async (data) => {
    try {
      const household = await createHousehold(data);

      // ✅ Track successful creation
      analytics.track('household_created', {
        householdId: household.id,
        hasDescription: !!data.description,
        memberCount: 1,
      });

      router.push(`/households/${household.id}`);
    } catch (error) {
      // ✅ Track error
      analytics.track('error_occurred', {
        errorType: 'api',
        errorCode: error.code,
        page: 'Create Household',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

**User Identification:**

```typescript
// hooks/useAuth.ts
import { analytics } from "@/lib/analytics";

export function useAuth() {
  const login = async (email, password) => {
    const { user, session } = await authApi.login(email, password);

    // ✅ Identify user after login
    analytics.identify(user.id, {
      email: user.email, // Auto-hashed
      createdAt: user.created_at,
      emailConfirmed: !!user.email_confirmed_at,
    });

    // ✅ Track login event
    analytics.track("user_logged_in", {
      loginMethod: "email",
      sessionId: session.id,
    });

    return { user, session };
  };

  return { login };
}
```

### Custom Hooks

**usePageView:**

```typescript
// hooks/usePageView.ts
import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

export function usePageView(pageName: string, properties?: object) {
  useEffect(() => {
    analytics.page(pageName, properties);
  }, [pageName, properties]);
}

// Usage:
function HouseholdDetailsPage({ householdId }) {
  usePageView('Household Details', { householdId });

  return <div>...</div>;
}
```

**useTrackEvent:**

```typescript
// hooks/useTrackEvent.ts
import { useCallback } from 'react';
import { analytics } from '@/lib/analytics';

export function useTrackEvent() {
  const trackEvent = useCallback((
    eventName: string,
    properties?: object
  ) => {
    analytics.track(eventName, properties);
  }, []);

  return trackEvent;
}

// Usage:
function InviteMemberButton({ householdId }) {
  const trackEvent = useTrackEvent();

  const handleClick = () => {
    trackEvent('member_invited', {
      householdId,
      inviteMethod: 'button_click',
    });
    // ... show invite modal
  };

  return <button onClick={handleClick}>Invite Member</button>;
}
```

---

## Privacy & Compliance

### Privacy-First Analytics

**What We Collect:**

- ✅ User actions (events)
- ✅ Page views
- ✅ Session data
- ✅ Device type and platform
- ✅ Performance metrics

**What We DON'T Collect:**

- ❌ Personal Identifiable Information (PII) in plain text
- ❌ IP addresses (anonymized automatically)
- ❌ Precise geolocation
- ❌ Form field values (only submit/success)
- ❌ Pet names or personal notes

**Automatic PII Hashing:**

```typescript
// Automatically hash sensitive fields
analytics.identify(user.id, {
  email: user.email, // ← Automatically hashed to SHA256
  name: user.name, // ← Automatically hashed to SHA256
  // Only non-PII metadata stored in plain text
  createdAt: user.created_at,
  plan: "free",
});

// Household names are NOT PII (user-generated content)
// But we still avoid collecting sensitive information
analytics.track("household_created", {
  householdId: household.id,
  name: household.name, // ← OK: Not PII, user chose this
  hasDescription: !!household.description, // ← OK: Boolean
  description: household.description, // ← ❌ NO: Could contain PII
});
```

### GDPR Compliance

**Right to Access:**

```typescript
// API endpoint to retrieve user's analytics data
GET /api/analytics/user/:userId/data
Authorization: Bearer <user_token>

Response:
{
  "userId": "hashed_user_id",
  "events": [...],
  "exportedAt": "2026-02-02T10:00:00Z"
}
```

**Right to Deletion:**

```typescript
// API endpoint to delete user's analytics data
DELETE /api/analytics/user/:userId
Authorization: Bearer <user_token>

Response:
{
  "deleted": true,
  "eventsDeleted": 1234,
  "deletedAt": "2026-02-02T10:00:00Z"
}
```

**Data Retention:**

- Active users: Retain all events
- Inactive users (90+ days): Anonymize events
- Deleted accounts: Delete all events within 30 days
- Aggregated data: Retain indefinitely (no PII)

### Consent Management

**Cookie Consent:**

```typescript
// components/CookieConsent.tsx
import { analytics } from '@/lib/analytics';

function CookieConsent() {
  const handleAccept = () => {
    analytics.opt('in');
    setCookie('analytics_consent', 'granted');
  };

  const handleDecline = () => {
    analytics.opt('out');
    setCookie('analytics_consent', 'denied');
  };

  return (
    <div className="cookie-banner">
      <p>We use analytics to improve your experience.</p>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleDecline}>Decline</button>
    </div>
  );
}
```

**Opt-Out:**

```typescript
// User can opt out in settings
analytics.opt("out");

// All tracking disabled
analytics.track("event"); // ← No-op when opted out
```

---

## Analytics Stack

### Current Stack

**Event Collection:**

- **Web:** Custom analytics SDK (TypeScript)
- **Mobile:** Custom analytics SDK (React Native)
- **Backend:** Server-side events (Node.js)

**Event Storage:**

- **Database:** PostgreSQL (events table)
- **Data Warehouse:** (Future: Snowflake/BigQuery)

**Visualization:**

- **Dashboards:** Custom-built (React + D3.js)
- **Ad-hoc Analysis:** SQL queries + Jupyter notebooks

**Stack Benefits:**

- ✅ Full control over data
- ✅ Privacy-first by design
- ✅ No third-party dependencies
- ✅ Cost-effective

### Future Enhancements

**Phase 1: Real-Time Pipeline**

- Apache Kafka for event streaming
- Real-time dashboards (WebSocket updates)
- Anomaly detection (spike alerts)

**Phase 2: Advanced Analytics**

- Machine learning models (churn prediction)
- Cohort analysis automation
- A/B test framework

**Phase 3: Data Warehouse**

- Migrate to Snowflake/BigQuery
- ETL pipelines (dbt)
- Self-serve analytics (Looker/Metabase)

---

## Best Practices

### Event Tracking

**DO:**

- ✅ Track user intent, not just clicks
- ✅ Use consistent event naming
- ✅ Include context in properties
- ✅ Track both success AND failure
- ✅ Version your event schemas

**DON'T:**

- ❌ Track PII in plain text
- ❌ Create events for every click
- ❌ Use vague event names
- ❌ Skip error tracking
- ❌ Track in development environment

**Event Naming Convention:**

```typescript
// ✅ Good
analytics.track('household_created', { ... });
analytics.track('member_approved', { ... });

// ❌ Bad
analytics.track('click', { button: 'create' });
analytics.track('CreateHousehold', { ... });
```

### Dashboard Design

**DO:**

- ✅ Start with the most important metric
- ✅ Show trends, not just snapshots
- ✅ Provide context (vs. last week)
- ✅ Enable drill-down for details
- ✅ Make it accessible (WCAG AA)

**DON'T:**

- ❌ Show too many metrics (analysis paralysis)
- ❌ Use pie charts for > 5 slices
- ❌ Rely on color alone
- ❌ Auto-refresh too frequently (distracting)
- ❌ Hide the methodology

### Performance

**Optimize for Speed:**

- ✅ Batch events (send every 10 seconds)
- ✅ Async tracking (non-blocking)
- ✅ Cache dashboard queries
- ✅ Use indexes on event tables
- ✅ Debounce rapid events

**Monitoring:**

```typescript
// Track analytics performance
analytics.track("analytics_event_sent", {
  eventName: "household_created",
  batchSize: 5,
  latency: 123, // milliseconds
});
```

---

## Related Documentation

- [Event Taxonomy Full Specification](./event-taxonomy.md) - Complete list of all events
- [Dashboard Catalog](./dashboards.md) - All available dashboards
- [Analytics API Reference](./api.md) - Analytics SDK documentation
- [Privacy Policy](../legal/PRIVACY.md) - User privacy commitments
- [Data Retention Policy](./data-retention.md) - How long we keep data

---

Built with 📊 by Ana (Analytics Agent)

**Data-driven decisions, privacy-first approach, actionable insights.**

**Every metric tells a story. Let's make sure we're listening.**
