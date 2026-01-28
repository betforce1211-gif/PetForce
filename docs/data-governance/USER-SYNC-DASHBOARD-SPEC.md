# User Sync Monitoring Dashboard Specification

**For:** Ana (Analytics)
**From:** Buck (Data Engineering)
**Date:** 2026-01-27
**Priority:** P1 - High (supports P0 data quality monitoring)

## Overview

This dashboard monitors the health of the user data pipeline, tracking sync between `auth.users` and `public.users`. It helps detect and diagnose "ghost user" issues where authentication succeeds but application profiles are missing.

## Dashboard Goals

1. **Real-time visibility** into user sync health
2. **Early detection** of data quality issues
3. **Historical trending** to identify patterns
4. **Quick diagnosis** when issues occur

## Data Sources

All data comes from Buck's data quality functions:

```sql
-- Latest status (refresh every 5 minutes)
SELECT * FROM get_latest_sync_status();

-- 30-day history (cache for 1 hour)
SELECT * FROM get_sync_status_history(30);

-- Current statistics (refresh every 5 minutes)
SELECT * FROM get_user_sync_stats();

-- Live ghost users (only query when status is not 'healthy')
SELECT * FROM check_ghost_users();
```

**Database:** Production Supabase
**Schema:** public
**Access:** Requires `authenticated` role (already granted)

## Layout

### Page: Admin Dashboard > Data Quality > User Sync

**URL:** `/admin/data-quality/user-sync`
**Access:** Admin users only
**Refresh:** Auto-refresh every 5 minutes

## Components

### 1. Status Card (Top, Full Width)

**Purpose:** Immediate health status visibility

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  🟢 User Sync: HEALTHY                              │
│                                                     │
│  Auth Users: 1,234  |  Public Users: 1,234         │
│  Discrepancy: 0     |  Last Check: 2 mins ago      │
│                                                     │
│  Trigger: ✓ Active                                 │
└─────────────────────────────────────────────────────┘
```

**Status Colors:**
- 🟢 **GREEN (Healthy):** All checks pass, no issues
- 🟡 **YELLOW (Degraded):** Warning-level issues (orphaned profiles)
- 🔴 **RED (Critical):** Critical issues (ghost users, trigger disabled)

**Data Source:**
```sql
SELECT
  sync_status,
  auth_users_count,
  public_users_count,
  ghost_users_count,
  orphaned_profiles_count,
  trigger_enabled,
  checked_at
FROM get_latest_sync_status();
```

**Behavior:**
- Auto-refresh every 5 minutes
- Click to view details (expands to show Check 2 below)
- Shows time since last check (e.g., "2 mins ago", "1 hour ago")
- If critical: Flashing red border + show "View Issues" button

**Metrics:**
- **Auth Users:** Total count from `auth.users`
- **Public Users:** Total count from `public.users`
- **Discrepancy:** `|auth_count - public_count|`
- **Last Check:** Time since `checked_at`
- **Trigger:** ✓ Active / ✗ Disabled (from `trigger_enabled`)

### 2. Statistics Cards (Row of 4)

**Purpose:** Key metrics at a glance

**Layout:**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Ghost Users │ │  Orphaned   │ │  Auth Users │ │Public Users │
│             │ │   Profiles  │ │             │ │             │
│      0      │ │      0      │ │   1,234     │ │   1,234     │
│   ✓ OK      │ │   ✓ OK      │ │  +5 today   │ │  +5 today   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

**Data Source:**
```sql
SELECT metric, value, status
FROM get_user_sync_stats();
```

**Card Details:**

#### Card 1: Ghost Users
- **Value:** Count of ghost users (from `get_user_sync_stats()`)
- **Status:** ✓ OK (if 0) / ⚠️ CRITICAL (if > 0)
- **Color:** Green (if 0) / Red (if > 0)
- **Click:** Shows list of ghost users (calls `check_ghost_users()`)

#### Card 2: Orphaned Profiles
- **Value:** Count of orphaned profiles
- **Status:** ✓ OK (if 0) / ⚠️ WARNING (if > 0)
- **Color:** Green (if 0) / Yellow (if > 0)
- **Click:** Shows list of orphaned profiles (calls `check_orphaned_profiles()`)

#### Card 3: Auth Users
- **Value:** Total auth.users count
- **Trend:** Change from yesterday (e.g., "+5 today", "-2 today")
- **Click:** Shows auth.users growth chart

#### Card 4: Public Users
- **Value:** Total public.users count
- **Trend:** Change from yesterday
- **Click:** Shows public.users growth chart

### 3. User Count Trend Chart (Full Width)

**Purpose:** Visualize user growth and detect discrepancies over time

**Chart Type:** Line chart with dual Y-axis
**Time Range:** Last 30 days (default), selectable (7d, 30d, 90d)

**Data Source:**
```sql
SELECT
  date,
  auth_users_count,
  public_users_count,
  ghost_users_count
FROM get_sync_status_history(30);
```

**Series:**
1. **Auth Users** (blue line, solid)
2. **Public Users** (green line, solid)
3. **Ghost Users** (red line, dashed) - right Y-axis

**Features:**
- X-axis: Date
- Left Y-axis: User counts (0 - max)
- Right Y-axis: Ghost users (0 - max)
- Tooltip: Shows exact values on hover
- Legend: Toggle series on/off
- Download: Export as CSV

**Example:**
```
User Counts (Last 30 Days)

1,500 ┤
      │     ╱────────
1,000 ┤  ╱──         Auth Users
      │╱             Public Users
  500 ┤              Ghost Users (0)
      │
    0 └─────────────────────────────────
      Jan 1         Jan 15         Jan 30
```

### 4. Quality Check Results (Table)

**Purpose:** Detailed results of latest quality checks

**Visibility:** Always visible, but expandable for details

**Data Source:**
```sql
SELECT
  check_name,
  passed,
  issue_count,
  severity,
  message
FROM run_user_sync_quality_check();
```

**Columns:**
| Check | Status | Issues | Severity | Message |
|-------|--------|--------|----------|---------|
| Ghost Users | ✓ | 0 | Critical | No ghost users detected |
| Orphaned Profiles | ✓ | 0 | Warning | No orphaned profiles detected |
| Count Parity | ✓ | 0 | Critical | User counts match: 1,234 |
| Trigger Active | ✓ | 0 | Critical | User sync trigger is active |

**Status Icons:**
- ✓ (green checkmark) if `passed = true`
- ✗ (red X) if `passed = false`

**Severity Colors:**
- **Critical:** Red text
- **Warning:** Yellow text
- **Info:** Gray text

**Click Behavior:**
- Clicking a failed check shows diagnostic details
- For "Ghost Users": Shows list from `check_ghost_users()`
- For "Orphaned Profiles": Shows list from `check_orphaned_profiles()`

### 5. Alert History (Table, Collapsed by Default)

**Purpose:** Show recent alerts for historical context

**Visibility:** Collapsed, click "View Alert History" to expand

**Data Source:**
```sql
SELECT
  checked_at,
  sync_status,
  ghost_users_count,
  orphaned_profiles_count,
  alert_reason
FROM user_sync_monitoring_log
WHERE alert_sent = true
ORDER BY checked_at DESC
LIMIT 50;
```

**Columns:**
| Timestamp | Status | Ghost Users | Orphaned | Reason |
|-----------|--------|-------------|----------|--------|
| 2026-01-26 02:00:15 | Critical | 3 | 0 | Data quality issue: 3 ghost users, 3 discrepancy |
| 2026-01-25 02:00:10 | Degraded | 0 | 5 | Warning: 5 orphaned profiles detected |

**Features:**
- Pagination (50 per page)
- Date range filter
- Status filter (Critical, Degraded, Healthy)

### 6. Ghost Users Detail (Modal/Expandable)

**Purpose:** List ghost users for investigation

**Trigger:** Click "Ghost Users" card when count > 0, or click failed check

**Data Source:**
```sql
SELECT
  auth_user_id,
  email,
  created_at,
  days_since_creation
FROM check_ghost_users()
ORDER BY created_at DESC;
```

**Columns:**
| User ID | Email | Created | Age | Actions |
|---------|-------|---------|-----|---------|
| 123e4567-e89b-12d3-a456-426614174000 | user@example.com | 2026-01-27 | 0 days | [Backfill] [View in Auth] |

**Actions:**
- **Backfill:** Creates `public.users` record for this ghost user (admin only)
- **View in Auth:** Opens Supabase dashboard to view auth.users record

### 7. Orphaned Profiles Detail (Modal/Expandable)

**Purpose:** List orphaned profiles for investigation

**Trigger:** Click "Orphaned Profiles" card when count > 0

**Data Source:**
```sql
SELECT
  user_id,
  email,
  created_at,
  days_since_creation
FROM check_orphaned_profiles()
ORDER BY created_at DESC;
```

**Columns:**
| User ID | Email | Created | Age | Actions |
|---------|-------|---------|-----|---------|
| 123e4567-e89b-12d3-a456-426614174001 | orphan@example.com | 2026-01-20 | 7 days | [Investigate] [Delete] |

**Actions:**
- **Investigate:** Shows user details (last login, sessions, etc.)
- **Delete:** Soft-deletes orphaned profile (admin only, requires confirmation)

## Technical Implementation

### React Components (Suggested)

```typescript
// Main dashboard component
<UserSyncDashboard>
  <StatusCard />                    // Component 1
  <StatisticsRow>                   // Component 2
    <MetricCard type="ghost" />
    <MetricCard type="orphaned" />
    <MetricCard type="auth" />
    <MetricCard type="public" />
  </StatisticsRow>
  <TrendChart />                    // Component 3
  <QualityCheckTable />             // Component 4
  <AlertHistory collapsed />        // Component 5
  <GhostUsersModal />               // Component 6
  <OrphanedProfilesModal />         // Component 7
</UserSyncDashboard>
```

### Data Fetching

```typescript
// Hooks for data fetching
const { data: status, isLoading } = useUserSyncStatus();  // 5 min cache
const { data: stats } = useUserSyncStats();               // 5 min cache
const { data: history } = useUserSyncHistory(30);         // 1 hour cache
const { data: checks } = useQualityChecks();              // 5 min cache

// Supabase client functions
async function getUserSyncStatus() {
  const { data, error } = await supabase.rpc('get_latest_sync_status');
  return data;
}

async function getUserSyncStats() {
  const { data, error } = await supabase.rpc('get_user_sync_stats');
  return data;
}

async function getUserSyncHistory(days: number) {
  const { data, error } = await supabase.rpc('get_sync_status_history', { days });
  return data;
}

async function runQualityCheck() {
  const { data, error } = await supabase.rpc('run_user_sync_quality_check');
  return data;
}

async function getGhostUsers() {
  const { data, error } = await supabase.rpc('check_ghost_users');
  return data;
}

async function getOrphanedProfiles() {
  const { data, error } = await supabase.rpc('check_orphaned_profiles');
  return data;
}
```

### Auto-refresh Strategy

```typescript
// Refresh every 5 minutes for critical metrics
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

useEffect(() => {
  const interval = setInterval(() => {
    refetchStatus();
    refetchStats();
    refetchChecks();
  }, REFRESH_INTERVAL);

  return () => clearInterval(interval);
}, []);
```

### Alert Display

```typescript
// Show toast notification if status changes to critical
useEffect(() => {
  if (status?.sync_status === 'critical' && previousStatus !== 'critical') {
    toast.error({
      title: 'User Sync Issue Detected',
      description: status.alert_reason,
      action: (
        <Button onClick={() => router.push('/admin/data-quality/user-sync')}>
          View Details
        </Button>
      ),
      duration: Infinity, // Don't auto-dismiss
    });
  }
}, [status]);
```

## Styling Guidelines

### Colors

**Status Colors:**
- Healthy: `#10b981` (green-500)
- Degraded: `#f59e0b` (amber-500)
- Critical: `#ef4444` (red-500)

**Chart Colors:**
- Auth Users: `#3b82f6` (blue-500)
- Public Users: `#10b981` (green-500)
- Ghost Users: `#ef4444` (red-500)

### Typography

- **Title:** text-2xl font-bold
- **Card Header:** text-lg font-semibold
- **Metrics:** text-3xl font-bold
- **Status:** text-sm font-medium
- **Body:** text-sm

### Spacing

- **Container:** max-w-7xl mx-auto px-4
- **Section Gap:** space-y-6
- **Card Padding:** p-6
- **Grid:** grid-cols-4 gap-4

## Accessibility

- All status indicators must have text labels (not just colors)
- ARIA labels for icons (e.g., `aria-label="Status: Healthy"`)
- Keyboard navigation for all interactive elements
- Focus states for cards and buttons
- Screen reader announcements for status changes

## Performance

- Use React Query or SWR for data caching
- Debounce chart rendering on window resize
- Virtualize long lists (>100 items)
- Lazy load modals (don't render until opened)
- Memoize expensive calculations

## Testing Requirements

1. **Unit Tests:**
   - Component rendering with different status states
   - Data transformation functions
   - Chart data formatting

2. **Integration Tests:**
   - Data fetching from Supabase functions
   - Auto-refresh behavior
   - Modal open/close interactions

3. **E2E Tests:**
   - Full dashboard load
   - Navigation between cards
   - Alert display on status change

## Rollout Plan

### Phase 1: Basic Dashboard (Week 1)
- Components 1, 2, 3 (Status Card, Stats, Chart)
- Data fetching and auto-refresh
- Basic styling

### Phase 2: Quality Checks (Week 2)
- Component 4 (Quality Check Table)
- Click handlers for failed checks
- Alert notifications

### Phase 3: Details & History (Week 3)
- Components 5, 6, 7 (Alerts, Ghost Users, Orphaned Profiles)
- Admin actions (backfill, delete)
- Export functionality

### Phase 4: Polish (Week 4)
- Accessibility improvements
- Performance optimizations
- Documentation and testing

## Success Metrics

- **P0:** Dashboard shows accurate real-time sync status
- **P1:** Issues detected within 5 minutes of occurrence
- **P2:** Mean time to resolution (MTTR) < 30 minutes for ghost user issues
- **P3:** 100% of admins check dashboard daily

## Questions for Ana

1. **Framework:** Are we using a specific charting library? (Recharts, Chart.js, D3?)
2. **Design System:** Should I match existing admin dashboard styles?
3. **Access Control:** How are we handling admin-only routes?
4. **Real-time:** Do we want WebSocket updates instead of polling?
5. **Export:** What format for CSV exports (ghost users, history)?

## Support from Buck

I've created all the SQL functions you need. They're ready to use:

✓ `get_latest_sync_status()` - Latest health status
✓ `get_user_sync_stats()` - Current metrics
✓ `get_sync_status_history(days)` - Historical data for charts
✓ `run_user_sync_quality_check()` - Quality check results
✓ `check_ghost_users()` - List of ghost users
✓ `check_orphaned_profiles()` - List of orphaned profiles

All functions are granted to `authenticated` role, so your dashboard will have access.

If you need any changes to the data structure or additional metrics, let me know!

---

**Next Steps:**
1. Ana reviews this spec
2. Ana confirms charting library and design approach
3. Buck and Ana sync on data formats
4. Ana implements Phase 1
5. Buck and Ana test together

**Timeline:** 4 weeks to full dashboard
**Owner:** Ana (Analytics)
**Support:** Buck (Data Engineering)
