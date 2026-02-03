# Household Analytics System

## Overview

The household analytics system provides comprehensive metrics and insights for household leaders to understand member growth, engagement, and retention.

## Architecture

### Event Tracking (`household-events.ts`)

All household actions are tracked through analytics events:

- **Creation Events**: `household_created` - When a new household is created
- **Join Flow Events**:
  - `household_join_request_submitted` - User submits join request
  - `household_join_request_approved` - Leader approves join request
  - `household_join_request_rejected` - Leader rejects join request
- **Member Management**:
  - `household_member_removed` - Leader removes a member
  - `household_left` - Member voluntarily leaves
  - `household_leadership_transferred` - Leadership changes hands
- **Security Events**: `household_invite_code_regenerated` - Invite code refreshed

### Analytics API (`household-analytics-api.ts`)

Provides aggregated metrics and reporting:

```typescript
// Fetch comprehensive household metrics
const { success, data, error } = await getHouseholdMetrics(householdId);

// Export analytics to CSV
const blob = await exportHouseholdAnalytics(householdId);
downloadCSV(blob, 'household-analytics.csv');
```

#### Metrics Provided

1. **Active Members**: Current count of active household members
2. **Pending Requests**: Count of join requests awaiting approval
3. **Retention Rate**: Percentage of members who joined and remain active
4. **Member Growth**: Change in membership over last 30 vs. previous 30 days
5. **Creation Timeline**: Daily member joins over last 90 days
6. **Join Funnel**: Conversion rates from submission → approval → active
7. **Member Activity**: Per-member engagement metrics

### Data Model

```typescript
interface HouseholdMetrics {
  // Summary metrics
  activeMembers: number;
  pendingRequests: number;
  retentionRate: number; // 0-100
  memberGrowth: number; // percentage change
  retentionChange: number; // percentage change

  // Timeline data
  creationTimeline: TimelineDataPoint[]; // Last 90 days

  // Funnel data
  joinFunnel: FunnelDataPoint[]; // submitted → approved → active

  // Activity data
  memberActivity: ActivityDataPoint[]; // Per-member stats
}
```

## Dashboard UI

### Access Control

- **Leader-Only**: Only household leaders can access analytics
- **Route**: `/households/analytics`
- **Navigation**: Available from household dashboard (leader-only button)

### Features

1. **Key Metrics Cards**:
   - Active Members (with growth trend)
   - Join Requests (current pending)
   - Member Retention (with change indicator)

2. **Charts**:
   - Member Growth Chart (line chart, 90-day timeline)
   - Join Funnel Chart (conversion funnel visualization)
   - Member Activity Chart (top active members)

3. **CSV Export**:
   - One-click export of all analytics data
   - Includes: summary metrics, timeline, funnel, and activity data
   - Filename format: `{household-name}-analytics-{date}.csv`

## Database Queries

### Active Members Count

```sql
SELECT COUNT(*)
FROM household_members
WHERE household_id = ? AND status = 'active';
```

### Pending Requests Count

```sql
SELECT COUNT(*)
FROM household_join_requests
WHERE household_id = ? AND status = 'pending';
```

### Retention Calculation

```sql
-- Total members who ever joined
SELECT COUNT(*) as total_joined
FROM household_members
WHERE household_id = ?;

-- Currently active members
SELECT COUNT(*) as active
FROM household_members
WHERE household_id = ? AND status = 'active';

-- Retention Rate = (active / total_joined) * 100
```

### Member Growth Timeline

```sql
SELECT
  DATE(joined_at) as join_date,
  COUNT(*) as new_members
FROM household_members
WHERE household_id = ?
  AND joined_at >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
GROUP BY DATE(joined_at)
ORDER BY join_date;
```

### Join Funnel

```sql
-- Submitted count
SELECT COUNT(*) as submitted
FROM household_join_requests
WHERE household_id = ?;

-- Approved count
SELECT COUNT(*) as approved
FROM household_join_requests
WHERE household_id = ? AND status = 'approved';

-- Active members (completed funnel)
SELECT COUNT(*) as active
FROM household_members
WHERE household_id = ? AND status = 'active';
```

## Integration Example

```typescript
// In a React component
import { useHouseholdMetrics } from '../hooks/useHouseholdMetrics';

function AnalyticsDashboard() {
  const { metrics, loading, error, refresh } = useHouseholdMetrics(householdId);

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  if (!metrics) return null;

  return (
    <div>
      <MetricCard
        title="Active Members"
        value={metrics.activeMembers}
        change={metrics.memberGrowth}
      />
      <HouseholdCreationChart data={metrics.creationTimeline} />
      <JoinFunnelChart data={metrics.joinFunnel} />
    </div>
  );
}
```

## Privacy & Compliance

- **No PII in Events**: Analytics events never contain personally identifiable information
- **Leader-Only Access**: Only household leaders can view analytics
- **Aggregate Data Only**: Dashboard shows aggregated metrics, not individual user data
- **CSV Export**: Includes member names but only accessible by household leader

## Future Enhancements

- [ ] Date range picker for custom time periods
- [ ] Member engagement scoring (based on activity events)
- [ ] Predictive churn analytics
- [ ] Household health score
- [ ] Comparative benchmarks (vs. similar households)
- [ ] Email digest of key metrics
- [ ] Mobile analytics dashboard

## Testing

### Unit Tests Needed

- [ ] Analytics event tracking functions
- [ ] Metrics calculation logic
- [ ] CSV export formatting
- [ ] Chart data transformations

### E2E Tests Needed

- [ ] Leader can access analytics dashboard
- [ ] Non-leader cannot access analytics
- [ ] CSV export downloads successfully
- [ ] Charts render with real data
- [ ] Refresh functionality works

## Performance Considerations

- Metrics are calculated on-demand (not cached)
- Timeline data limited to 90 days to reduce query time
- Member activity currently simplified (will use event tracking in future)
- Consider caching metrics for large households (100+ members)

## Maintenance

### Adding New Events

1. Define event function in `household-events.ts`
2. Call event function from API action
3. Update analytics queries to include new event data
4. Add to dashboard visualization if needed
5. Update CSV export to include new data

### Modifying Metrics

1. Update `HouseholdMetrics` interface
2. Modify query in `getHouseholdMetrics()`
3. Update dashboard UI to display new metric
4. Add to CSV export
5. Document changes in this README
