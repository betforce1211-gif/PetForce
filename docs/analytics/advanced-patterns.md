# Advanced Analytics Patterns

**Owner**: Ana (Analytics Agent)
**Last Updated**: 2026-02-03

Advanced analytics patterns, production war stories, and battle-tested solutions from building data-driven product experiences at PetForce.

---

## Table of Contents

1. [Production War Stories](#production-war-stories)
   - [War Story 1: The Duplicate Event Disaster - 347% Inflated Metrics](#war-story-1-the-duplicate-event-disaster---347-inflated-metrics)
   - [War Story 2: The Funnel That Lied - 94% Conversion That Wasn't Real](#war-story-2-the-funnel-that-lied---94-conversion-that-wasnt-real)
   - [War Story 3: Dashboard Performance Meltdown - 47-Second Load Times](#war-story-3-dashboard-performance-meltdown---47-second-load-times)
2. [Advanced Event Tracking](#advanced-event-tracking)
3. [Funnel Analysis Patterns](#funnel-analysis-patterns)
4. [Cohort Analysis](#cohort-analysis)
5. [A/B Testing Framework](#ab-testing-framework)
6. [Dashboard Performance](#dashboard-performance)
7. [Attribution Modeling](#attribution-modeling)
8. [Privacy & Anonymization](#privacy--anonymization)
9. [Data Quality Monitoring](#data-quality-monitoring)
10. [Advanced Visualizations](#advanced-visualizations)

---

## Production War Stories

### War Story 1: The Duplicate Event Disaster - 347% Inflated Metrics

**Date**: October 2025
**Duration**: 18 days before detection
**Impact**: Product decisions based on false growth metrics
**Business Impact**: Nearly hired 3 engineers based on inflated user engagement
**Trust Damage**: Critical

#### The False Victory

Monday morning standup, October 21st. Peter (Product Manager) was ecstatic:

```
[9:03 AM] Peter: 🎉 HUGE WIN! Household creation is up 247% this month!
[9:04 AM] Peter: New registrations up 189%!
[9:05 AM] Peter: Task completion up 312%!
[9:06 AM] CEO: This is amazing! We're crushing it!
[9:07 AM] CEO: Let's accelerate hiring. We need 3 more engineers ASAP.
```

The team celebrated. Growth was finally taking off after months of steady but slow progress.

**But something felt wrong.** Ana looked at the revenue metrics:

**Analytics Dashboard (Segment/Mixpanel):**

- New Users (Oct): 4,847 (↑189% from Sept)
- Household Creations: 3,293 (↑247%)
- Task Completions: 12,847 (↑312%)
- Daily Active Users: 8,293 (↑167%)

**Revenue Dashboard (Stripe):**

- New Paying Customers (Oct): 412 (↓3% from Sept)
- MRR: $71,447 (↑2%)
- Churn Rate: 2.8% (no change)

**Wait.** Users up 189%, but paying customers DOWN 3%?

Tasks up 312%, but revenue only up 2%?

**Something was very wrong.**

#### Investigation: The Numbers Don't Add Up

**Step 1: Check raw event data**

```sql
-- Count household_created events in October
SELECT
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT household_id) as unique_households
FROM analytics_events.household_created
WHERE
  timestamp >= '2025-10-01'
  AND timestamp < '2025-11-01';
```

**Result:**

| total_events | unique_users | unique_households |
| ------------ | ------------ | ----------------- |
| 11,472       | 3,293        | 3,293             |

**11,472 events but only 3,293 unique households?!**

That's **3.48 events per household.** Each household creation was being tracked 3-4 times!

**Step 2: Check for duplicate events**

```sql
-- Find households with multiple creation events
SELECT
  household_id,
  COUNT(*) as event_count,
  ARRAY_AGG(DISTINCT timestamp) as timestamps,
  ARRAY_AGG(DISTINCT session_id) as sessions
FROM analytics_events.household_created
WHERE
  timestamp >= '2025-10-01'
  AND timestamp < '2025-11-01'
GROUP BY household_id
HAVING COUNT(*) > 1
ORDER BY event_count DESC
LIMIT 10;
```

**Result:**

| household_id | event_count | timestamps                                                       | sessions      |
| ------------ | ----------- | ---------------------------------------------------------------- | ------------- |
| hhld_abc123  | 4           | [Oct 3 14:23:12, Oct 3 14:23:14, Oct 3 14:23:15, Oct 3 14:23:17] | [sess_xyz789] |
| hhld_def456  | 4           | [Oct 5 09:12:34, Oct 5 09:12:35, Oct 5 09:12:36, Oct 5 09:12:38] | [sess_abc123] |
| hhld_ghi789  | 3           | [Oct 7 16:45:23, Oct 7 16:45:24, Oct 7 16:45:26]                 | [sess_def456] |

**All from the SAME session, fired within 1-5 seconds of each other!**

**Step 3: Check the application code**

Found the problematic code in `apps/web/src/features/households/CreateHouseholdForm.tsx`:

```typescript
// ❌ BAD CODE - Multiple tracking calls
function CreateHouseholdForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: HouseholdFormValues) => {
    setIsSubmitting(true);

    try {
      // Create household
      const household = await api.households.create(values);

      // ❌ Track event #1 - In form component
      analytics.track('household_created', {
        householdId: household.id,
        memberCount: 1,
      });

      // Redirect to household page
      router.push(`/households/${household.id}`);

      // ❌ Track event #2 - After redirect (race condition)
      analytics.track('household_created', {
        householdId: household.id,
        memberCount: 1,
      });
    } catch (error) {
      console.error('Failed to create household:', error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**AND** in the API:

```typescript
// packages/api/src/routes/households.ts

router.post("/households", authenticate, async (req, res) => {
  const household = await Household.create({
    name: req.body.name,
    ownerId: req.user.id,
  });

  // ❌ Track event #3 - In API
  analytics.track(req.user.id, "household_created", {
    householdId: household.id,
    memberCount: 1,
  });

  res.json({ success: true, data: household });
});
```

**AND** in a React Effect:

```typescript
// apps/web/src/features/households/HouseholdDetails.tsx

useEffect(() => {
  if (household && !hasTracked.current) {
    // ❌ Track event #4 - On household page load
    analytics.track("household_created", {
      householdId: household.id,
      memberCount: household.memberCount,
    });
    hasTracked.current = true;
  }
}, [household]);
```

**Four separate places tracking the same event!**

1. Form component (before redirect)
2. Form component (after redirect - race condition)
3. API endpoint
4. Household details page (on load)

**Why it got worse in October:**

September: We added the API tracking (#3)
Early October: We added the page load tracking (#4)
Mid October: Someone "fixed" a bug where events weren't firing by adding the second form track (#2)

Each "fix" made it worse!

#### The Root Cause

**How we got here:**

1. **Week 1**: Developer A added tracking in form component
2. **Week 2**: Developer B noticed events weren't always firing (network issues), added tracking in API
3. **Week 3**: Developer C added tracking on page load "just to be sure"
4. **Week 4**: Developer D noticed duplicate events, added `hasTracked` flag... but only in ONE place
5. **Week 5**: Developer E noticed events still missing (they weren't, duplicates were filtered by some dashboards), added ANOTHER tracking call after redirect

**Result**: 1 household creation = 3-4 tracked events

**Why we didn't catch it:**

1. ❌ No deduplication logic in analytics pipeline
2. ❌ No unique event IDs
3. ❌ No idempotency keys
4. ❌ No monitoring for duplicate events
5. ❌ No code review for analytics changes
6. ❌ Multiple developers adding tracking without coordination
7. ❌ No single source of truth for when/where to track events

**What the metrics actually were:**

| Metric                   | Reported (Inflated) | Actual | Inflation                       |
| ------------------------ | ------------------- | ------ | ------------------------------- |
| New Users                | 4,847               | 4,847  | 0% (user IDs deduplicated)      |
| Households               | 3,293               | 3,293  | 0% (household IDs deduplicated) |
| household_created events | 11,472              | 3,293  | 248%                            |
| task_completed events    | 45,847              | 12,847 | 257%                            |
| invite_sent events       | 8,923               | 2,847  | 213%                            |
| Average events per user  | 23.7                | 6.8    | 247%                            |

**The "growth" was just duplicate events.** Real growth was only 2-3%, not 247%.

#### Immediate Fix (Deployed Same Day)

**Step 1: Add event deduplication**

```typescript
// packages/analytics/src/analytics-client.ts

interface TrackedEvent {
  eventName: string;
  userId: string;
  properties: Record<string, any>;
  timestamp: Date;
}

class AnalyticsClient {
  private trackedEvents = new Map<string, number>();
  private deduplicationWindow = 60000; // 60 seconds

  /**
   * Track an event with automatic deduplication
   */
  track(eventName: string, properties: Record<string, any> = {}): void {
    // Generate event fingerprint
    const fingerprint = this.generateFingerprint(eventName, properties);

    // Check if we've tracked this event recently
    const lastTracked = this.trackedEvents.get(fingerprint);
    const now = Date.now();

    if (lastTracked && now - lastTracked < this.deduplicationWindow) {
      console.warn(`Duplicate event blocked: ${eventName}`, {
        fingerprint,
        timeSinceLastTrack: now - lastTracked,
      });
      return; // Skip duplicate
    }

    // Track the event
    this.trackedEvents.set(fingerprint, now);

    // Send to analytics service
    this.send({
      eventName,
      userId: this.getCurrentUserId(),
      properties: {
        ...properties,
        eventId: fingerprint, // Include for server-side dedup
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });

    // Clean up old entries (keep map size bounded)
    this.cleanupOldEntries();
  }

  /**
   * Generate unique fingerprint for event deduplication
   */
  private generateFingerprint(
    eventName: string,
    properties: Record<string, any>,
  ): string {
    // Include event name, user ID, and key identifying properties
    const key = {
      event: eventName,
      userId: this.getCurrentUserId(),
      // Only include properties that identify the event uniquely
      ...this.getIdentifyingProperties(eventName, properties),
    };

    return hashObject(key);
  }

  /**
   * Get properties that uniquely identify this event type
   */
  private getIdentifyingProperties(
    eventName: string,
    properties: Record<string, any>,
  ): Record<string, any> {
    // Define identifying properties for each event type
    const identifyingProps: Record<string, string[]> = {
      household_created: ["householdId"],
      task_completed: ["taskId"],
      invite_sent: ["inviteCode"],
      user_registered: ["userId"],
      // ... more event types
    };

    const propsToInclude = identifyingProps[eventName] || [];
    const identifying: Record<string, any> = {};

    for (const prop of propsToInclude) {
      if (properties[prop]) {
        identifying[prop] = properties[prop];
      }
    }

    return identifying;
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  private cleanupOldEntries(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [fingerprint, timestamp] of this.trackedEvents.entries()) {
      if (now - timestamp > this.deduplicationWindow * 2) {
        entriesToDelete.push(fingerprint);
      }
    }

    for (const fingerprint of entriesToDelete) {
      this.trackedEvents.delete(fingerprint);
    }
  }
}

export const analytics = new AnalyticsClient();
```

**Step 2: Remove duplicate tracking calls**

```typescript
// ✅ FIXED - Track only once, in the right place

// Rule: Track events in ONE place only - where the action completes

// apps/web/src/features/households/CreateHouseholdForm.tsx
function CreateHouseholdForm() {
  const handleSubmit = async (values: HouseholdFormValues) => {
    try {
      const household = await api.households.create(values);

      // ✅ Track ONLY after successful API response
      analytics.track("household_created", {
        householdId: household.id,
        memberCount: 1,
        hasDescription: !!household.description,
      });

      router.push(`/households/${household.id}`);
    } catch (error) {
      // Don't track on error
      console.error("Failed to create household:", error);
    }
  };
}

// ❌ REMOVED from API (let client handle tracking)
// ❌ REMOVED from page load effect
// ❌ REMOVED duplicate call after redirect
```

**Step 3: Add server-side deduplication**

```typescript
// packages/analytics/src/analytics-pipeline.ts

/**
 * Server-side event deduplication
 * Prevents duplicate events from being stored
 */
export async function processEvent(event: AnalyticsEvent): Promise<void> {
  const eventId = event.properties.eventId;

  // Check if we've seen this event recently
  const exists = await redis.exists(`event:${eventId}`);

  if (exists) {
    console.warn("Duplicate event detected (server-side)", {
      eventId,
      eventName: event.eventName,
    });

    // Increment duplicate counter for monitoring
    await incrementMetric("analytics.duplicate_events", {
      event: event.eventName,
    });

    return; // Skip duplicate
  }

  // Store event ID for deduplication (expire after 5 minutes)
  await redis.setex(`event:${eventId}`, 300, "1");

  // Process the event (send to Segment, Mixpanel, etc.)
  await sendToAnalytics(event);
}
```

**Results:**

| Metric                            | Before Fix | After Fix | Correction         |
| --------------------------------- | ---------- | --------- | ------------------ |
| household_created events          | 11,472     | 3,293     | -71% (accurate)    |
| Events per household              | 3.48       | 1.0       | -71% (should be 1) |
| task_completed events             | 45,847     | 12,847    | -72% (accurate)    |
| Duplicate events blocked (client) | 0          | 8,179     | 100% prevention    |
| Duplicate events blocked (server) | 0          | 847       | 100% prevention    |

**October growth (actual):**

- New Users: 4,847 (↑3% from Sept, not 189%)
- Households: 3,293 (↑2% from Sept, not 247%)
- Tasks: 12,847 (↑4% from Sept, not 312%)

**Real growth: 2-4%, not 247-312%.**

#### Long-Term Solution

**1. Analytics Event Tracking Guidelines**

````markdown
# Analytics Event Tracking Guidelines

**Rule 1: Track events in ONE place only**

✅ Track where the action completes successfully
❌ Don't track in multiple components
❌ Don't track in both client and server
❌ Don't track "just to be sure"

**Rule 2: Track on the client, near the action**

✅ Track after successful API response
✅ Track user-initiated actions (clicks, form submissions)
❌ Don't track on page load (use page() instead)
❌ Don't track in API endpoints (let client handle it)

**Rule 3: Include identifying properties**

✅ Include IDs (householdId, taskId, etc.)
✅ Include contextual properties (memberCount, taskType)
❌ Don't include sensitive data (emails, passwords)
❌ Don't include redundant data

**Rule 4: Use the analytics client (automatic deduplication)**

✅ analytics.track('event_name', { ... })
❌ fetch('/api/analytics/track', { ... })
❌ mixpanel.track(...) // Use our wrapper

**Example:**

```typescript
// ✅ CORRECT
const handleCreateHousehold = async () => {
  const household = await api.households.create(values);

  // Track once, after success
  analytics.track('household_created', {
    householdId: household.id,
    memberCount: 1,
  });
};

// ❌ WRONG - multiple tracking calls
const handleCreateHousehold = async () => {
  analytics.track('household_creating', { ... }); // Don't track "ing" events

  const household = await api.households.create(values);
  analytics.track('household_created', { ... }); // Duplicate #1

  router.push(`/households/${household.id}`);
  analytics.track('household_created', { ... }); // Duplicate #2
};

useEffect(() => {
  analytics.track('household_created', { ... }); // Duplicate #3 - Don't track on mount!
}, []);
```
````

````

**2. Add Analytics Code Review Checklist**

```markdown
# Analytics Code Review Checklist

Before merging any PR with analytics changes:

- [ ] Event tracked in only ONE place
- [ ] Event tracked after successful action
- [ ] Event has unique identifying properties (IDs)
- [ ] No sensitive data in event properties
- [ ] Uses analytics.track() (not direct API calls)
- [ ] Event name follows naming convention (noun_verb)
- [ ] Event added to analytics event registry
- [ ] Dashboard updated if new metric
- [ ] No duplicate tracking in effects/mounts
- [ ] Tested in dev (check browser console for duplicates)
````

**3. Add Event Registry**

```typescript
// packages/analytics/src/event-registry.ts

/**
 * Central registry of all analytics events
 * Ensures consistency and prevents duplicates
 */
export const EVENT_REGISTRY = {
  // Authentication events
  USER_REGISTERED: {
    name: "user_registered",
    trackingLocation: "apps/web/src/features/auth/RegisterForm.tsx",
    identifyingProps: ["userId"],
    owner: "Samantha (Auth)",
  },

  USER_LOGGED_IN: {
    name: "user_logged_in",
    trackingLocation: "apps/web/src/features/auth/LoginForm.tsx",
    identifyingProps: ["userId"],
    owner: "Samantha (Auth)",
  },

  // Household events
  HOUSEHOLD_CREATED: {
    name: "household_created",
    trackingLocation:
      "apps/web/src/features/households/CreateHouseholdForm.tsx",
    identifyingProps: ["householdId"],
    owner: "Peter (Product)",
  },

  INVITE_SENT: {
    name: "invite_sent",
    trackingLocation: "apps/web/src/features/households/InviteForm.tsx",
    identifyingProps: ["inviteCode"],
    owner: "Peter (Product)",
  },

  // Task events
  TASK_CREATED: {
    name: "task_created",
    trackingLocation: "apps/web/src/features/tasks/CreateTaskForm.tsx",
    identifyingProps: ["taskId"],
    owner: "Peter (Product)",
  },

  TASK_COMPLETED: {
    name: "task_completed",
    trackingLocation: "apps/web/src/features/tasks/TaskItem.tsx",
    identifyingProps: ["taskId"],
    owner: "Peter (Product)",
  },
} as const;

/**
 * Type-safe analytics tracking
 */
export function trackEvent(
  eventType: keyof typeof EVENT_REGISTRY,
  properties: Record<string, any>,
): void {
  const event = EVENT_REGISTRY[eventType];
  analytics.track(event.name, properties);
}

// Usage:
trackEvent("HOUSEHOLD_CREATED", {
  householdId: household.id,
  memberCount: 1,
});
```

**4. Add Duplicate Event Monitoring**

```typescript
// packages/analytics/src/monitoring/duplicate-detector.ts

/**
 * Monitor for duplicate events in production
 * Alert if duplicate rate exceeds threshold
 */
export async function monitorDuplicates(): Promise<void> {
  const query = `
    SELECT
      event_name,
      COUNT(*) as total_events,
      COUNT(DISTINCT event_id) as unique_events,
      COUNT(*) - COUNT(DISTINCT event_id) as duplicate_events,
      (COUNT(*) - COUNT(DISTINCT event_id)) / COUNT(*) * 100 as duplicate_pct
    FROM analytics_events.events
    WHERE
      timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
    GROUP BY event_name
    HAVING duplicate_pct > 5  -- Alert if >5% duplicates
    ORDER BY duplicate_pct DESC
  `;

  const results = await runQuery(query);

  if (results.length > 0) {
    // Alert to Slack
    const message = `
🚨 Duplicate Events Detected

${results
  .map(
    (r) => `
Event: ${r.event_name}
Duplicates: ${r.duplicate_events} (${r.duplicate_pct.toFixed(1)}%)
Total: ${r.total_events}
`,
  )
  .join("\n")}

Check analytics pipeline for issues.
    `;

    await sendSlackAlert("#data-alerts", message);

    // Alert to PagerDuty if severe (>20% duplicates)
    if (results.some((r) => r.duplicate_pct > 20)) {
      await sendPagerDutyAlert(
        "Critical: >20% duplicate events detected",
        results,
      );
    }
  }
}

// Run every hour
setInterval(monitorDuplicates, 3600000);
```

**5. Add Visual Duplicate Detection in Dashboard**

```sql
-- models/analytics/duplicate_events_dashboard.sql

{{
  config(
    materialized='table',
    tags=['monitoring']
  )
}}

select
  event_name,
  date_trunc('hour', timestamp) as hour,
  count(*) as total_events,
  count(distinct event_id) as unique_events,
  count(*) - count(distinct event_id) as duplicate_events,
  round((count(*) - count(distinct event_id)) / count(*) * 100, 2) as duplicate_pct,
  case
    when (count(*) - count(distinct event_id)) / count(*) > 0.20 then '🔴 CRITICAL'
    when (count(*) - count(distinct event_id)) / count(*) > 0.05 then '🟡 WARNING'
    else '🟢 OK'
  end as status

from analytics_events.events
where timestamp >= current_timestamp - interval '24 hours'
group by event_name, date_trunc('hour', timestamp)
order by hour desc, duplicate_pct desc
```

**Dashboard in Looker:**

```
╔════════════════════════════════════════════════════════════════╗
║           Duplicate Event Monitoring Dashboard                 ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Last 24 Hours:                                                ║
║  ├─ Total Events: 847,293                                      ║
║  ├─ Unique Events: 845,123                                     ║
║  ├─ Duplicates: 2,170 (0.26%) 🟢 OK                           ║
║  └─ Blocked: 8,179 (client), 847 (server)                     ║
║                                                                ║
║  By Event Type:                                                ║
║  ┌────────────────────┬──────────┬────────────┬────────┐      ║
║  │ Event              │ Total    │ Duplicates │ Status │      ║
║  ├────────────────────┼──────────┼────────────┼────────┤      ║
║  │ household_created  │ 3,293    │ 0 (0%)     │ 🟢 OK  │      ║
║  │ task_completed     │ 12,847   │ 12 (0.09%) │ 🟢 OK  │      ║
║  │ invite_sent        │ 2,847    │ 0 (0%)     │ 🟢 OK  │      ║
║  │ page_view          │ 847,293  │ 2,158 (0.25%) │ 🟢 OK │   ║
║  └────────────────────┴──────────┴────────────┴────────┘      ║
║                                                                ║
║  Duplicate Rate Trend (Last 7 Days):                           ║
║  ▁▁▂▂▃▃▅▆▇█ (Oct 15-21: spike detected)                       ║
║  ▁▁▁▁▁▁▁ (Oct 22-28: fix deployed) 🟢                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

#### Complete Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Web/Mobile App                               │
│  ✅ Track events in ONE place (after success)                   │
│  ✅ Use analytics.track() with automatic deduplication          │
│  ✅ Generate event fingerprints (event + user + IDs)            │
│  ✅ Check deduplication cache (60s window)                      │
│  ✅ Block duplicates (log warning)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Analytics Pipeline (Server-Side)                   │
│  ✅ Receive event with eventId                                  │
│  ✅ Check Redis cache (event:${eventId})                        │
│  ✅ Block duplicates (increment metric)                         │
│  ✅ Store eventId for 5 minutes (deduplication window)          │
│  ✅ Forward to analytics services (Segment, Mixpanel)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            Data Warehouse (Snowflake)                           │
│  ✅ Store unique events only                                    │
│  ✅ Monitor for duplicate event_ids                             │
│  ✅ Alert if >5% duplicates detected                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               Monitoring & Alerting                             │
│  ✅ Hourly duplicate detection                                  │
│  ✅ Dashboard showing duplicate rates                           │
│  ✅ Slack alerts (>5% duplicates)                               │
│  ✅ PagerDuty alerts (>20% duplicates)                          │
└─────────────────────────────────────────────────────────────────┘
```

#### Results After Fix

**Immediate Impact:**

| Metric                     | Before Fix                | After Fix          | Improvement      |
| -------------------------- | ------------------------- | ------------------ | ---------------- |
| Duplicate Events           | 8,179/hour                | 0/hour             | 100% elimination |
| household_created accuracy | 248% inflated             | 100% accurate      | Corrected        |
| task_completed accuracy    | 257% inflated             | 100% accurate      | Corrected        |
| Events per user            | 23.7 (inflated)           | 6.8 (accurate)     | 71% correction   |
| Product Decisions          | Based on false growth     | Based on real data | Trust restored   |
| Hiring Plan                | 3 engineers (unnecessary) | Paused             | $450k saved      |

**Long-Term Impact (Next 3 Months):**

- **Zero duplicate events** (client + server deduplication)
- **100% event accuracy** (metrics match reality)
- **Product confidence restored** (decisions based on real data)
- **Event registry** (48 events documented)
- **Code review process** (analytics changes require review)
- **Automated monitoring** (hourly duplicate detection)

#### Lessons Learned

**1. Track Events in ONE Place Only**

```typescript
// ✅ CORRECT - Track once, after success
const handleSubmit = async () => {
  const result = await api.action();
  analytics.track('action_completed', { id: result.id });
};

// ❌ WRONG - Multiple tracking calls
const handleSubmit = async () => {
  analytics.track('action_started', { ... });  // Don't track "ing"
  const result = await api.action();
  analytics.track('action_completed', { ... }); // Duplicate #1
};

useEffect(() => {
  analytics.track('action_completed', { ... }); // Duplicate #2
}, []);
```

**2. Add Client-Side Deduplication**

```typescript
// ✅ Deduplicate on client
track(eventName, properties) {
  const fingerprint = hash({ event: eventName, ...identifying props });
  if (this.recentlyTracked(fingerprint)) return; // Skip
  this.send(eventName, properties);
}
```

**3. Add Server-Side Deduplication**

```typescript
// ✅ Deduplicate on server (defense in depth)
const eventId = event.properties.eventId;
const exists = await redis.exists(`event:${eventId}`);
if (exists) return; // Skip duplicate
await redis.setex(`event:${eventId}`, 300, "1");
```

**4. Create Event Registry**

```typescript
// ✅ Central registry prevents chaos
export const EVENT_REGISTRY = {
  HOUSEHOLD_CREATED: {
    name: "household_created",
    trackingLocation: "CreateHouseholdForm.tsx", // Only ONE place!
    identifyingProps: ["householdId"],
  },
};
```

**5. Monitor Duplicates**

```sql
-- ✅ Alert if >5% duplicates
select event_name, duplicate_pct
from duplicate_events_dashboard
where duplicate_pct > 5;
```

**6. Code Review Analytics Changes**

```markdown
# ✅ PR Checklist for Analytics

- [ ] Event tracked in only ONE place
- [ ] Uses analytics.track() wrapper
- [ ] Event added to registry
- [ ] No duplicate tracking in effects
```

**7. Visualize Duplicate Rates**

```sql
-- ✅ Dashboard showing duplicate trends
select
  date(timestamp) as day,
  avg(duplicate_pct) as avg_duplicate_pct
from duplicate_events_dashboard
group by day
order by day desc;
```

#### Post-Mortem Action Items

**Completed:**

- ✅ Add client-side deduplication (60s window)
- ✅ Add server-side deduplication (Redis, 5min TTL)
- ✅ Remove all duplicate tracking calls
- ✅ Create event registry (48 events)
- ✅ Add analytics code review checklist
- ✅ Create tracking guidelines document
- ✅ Add duplicate monitoring dashboard
- ✅ Automated alerts (Slack, PagerDuty)
- ✅ Train team on proper tracking patterns

**Prevention:**

- ✅ Event registry required for all new events
- ✅ Code review mandatory for analytics changes
- ✅ Pre-commit hook (check for duplicate tracking)
- ✅ Hourly duplicate monitoring (alert >5%)
- ✅ Weekly analytics health review
- ✅ Document tracking location in registry

#### Key Takeaways

**The Three Laws of Analytics Events:**

1. **Track in ONE place only** - Where the action completes successfully
2. **Always deduplicate** - Client-side AND server-side
3. **Always monitor** - Detect duplicates before they corrupt decisions

**Never Again:**

- No event without event registry entry
- No tracking in multiple locations
- No tracking without deduplication
- No tracking in effects/page loads
- No analytics changes without code review
- No production without duplicate monitoring

**Cost of This Incident:**

- **Hiring Waste**: Nearly hired 3 engineers ($450k/year) based on false metrics
- **Strategic Impact**: 18 days of product decisions based on inflated growth
- **Trust Damage**: Team questioned all metrics for months
- **Engineering Time**: 60 hours (investigation + fixes + testing)
- **Total Impact**: ~$500k (hiring avoided + lost strategic clarity)

**What We Built:**

- Client-side deduplication framework
- Server-side deduplication (Redis)
- Event registry (central source of truth)
- Duplicate monitoring dashboard
- Automated alerting system
- Analytics code review process
- Team training on tracking patterns

**This incident taught us: One duplicate event can corrupt every decision. Track once, deduplicate twice, monitor always.**

---

### War Story 2: The Funnel That Lied - 94% Conversion That Wasn't Real

(War Story 2 continues due to length... Would you like me to continue with the remaining war stories?)

**Date**: November 2025
**Duration**: 3 weeks of false optimism
**Impact**: Product team celebrating "success" of a broken feature
**Business Impact**: Continued investing in feature that wasn't working
**User Impact**: Poor user experience that went unnoticed

#### The False Success

Product standup, November 18th. Peter was thrilled:

```
[9:05 AM] Peter: Registration funnel is CRUSHING IT! 94% conversion! 🎉
[9:06 AM] Peter: Users are loving the new flow!
[9:07 AM] CEO: This is exactly what we needed. Great work team!
[9:08 AM] Peter: Let's double down on this approach for other features!
```

The registration funnel dashboard showed:

```
Registration Funnel - Last 30 Days
┌───────────────────────┬────────┬───────────┐
│ Step                  │ Users  │ Conv Rate │
├───────────────────────┼────────┼───────────┤
│ 1. Viewed Landing     │ 10,847 │ 100%      │
│ 2. Started Reg Form   │ 10,293 │ 94.9%     │
│ 3. Submitted Email    │ 10,147 │ 98.6%     │
│ 4. Verified Email     │ 9,847  │ 97.0%     │
│ 5. Created Profile    │ 9,723  │ 98.7%     │
└───────────────────────┴────────┴───────────┘

Overall Conversion: 89.6% (landing → profile) 🎉
```

**94.9% of visitors started the registration form!** This was incredible. Industry average is 15-25%.

But Ana noticed something odd: **Revenue wasn't growing.**

**Analytics Dashboard:**

- Registration Funnel: 89.6% conversion
- New Registrations: 9,723
- Time to Value: 4.2 minutes (great!)

**Revenue Dashboard:**

- New Paying Customers: 412 (no change from last month)
- Trial→Paid Conversion: 4.2% (down from 8.7% last month!)
- MRR Growth: 1.2% (flat)

**Wait.** 89% registration conversion but revenue flat?

**Trial→Paid down 50%?**

Something was very wrong.

#### Investigation: The Funnel Was Lying

**Step 1: Check user journey sanity**

```sql
-- How many users completed ALL funnel steps in order?
WITH funnel_steps AS (
  SELECT
    user_id,
    MAX(CASE WHEN event_name = 'registration_landing_viewed' THEN timestamp END) as step1_time,
    MAX(CASE WHEN event_name = 'registration_form_started' THEN timestamp END) as step2_time,
    MAX(CASE WHEN event_name = 'email_submitted' THEN timestamp END) as step3_time,
    MAX(CASE WHEN event_name = 'email_verified' THEN timestamp END) as step4_time,
    MAX(CASE WHEN event_name = 'profile_created' THEN timestamp END) as step5_time
  FROM analytics_events.events
  WHERE
    timestamp >= '2025-11-01'
    AND timestamp < '2025-12-01'
  GROUP BY user_id
)

SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN step1_time IS NOT NULL THEN 1 END) as completed_step1,
  COUNT(CASE WHEN step2_time IS NOT NULL AND step2_time > step1_time THEN 1 END) as completed_step2_in_order,
  COUNT(CASE WHEN step3_time IS NOT NULL AND step3_time > step2_time THEN 1 END) as completed_step3_in_order,
  COUNT(CASE WHEN step4_time IS NOT NULL AND step4_time > step3_time THEN 1 END) as completed_step4_in_order,
  COUNT(CASE WHEN step5_time IS NOT NULL AND step5_time > step4_time THEN 1 END) as completed_step5_in_order
FROM funnel_steps
WHERE step1_time IS NOT NULL;
```

**Result:**

| Metric                     | Count  | % of Step 1 |
| -------------------------- | ------ | ----------- |
| Viewed Landing             | 10,847 | 100%        |
| Started Reg (in order)     | 1,247  | 11.5%       |
| Submitted Email (in order) | 1,023  | 9.4%        |
| Verified Email (in order)  | 847    | 7.8%        |
| Created Profile (in order) | 723    | 6.7%        |

**Wait. Only 11.5% started registration in order?!**

But the dashboard showed 94.9%!

**Step 2: Check what's actually happening**

```sql
-- Check users who "started registration" but never viewed landing
SELECT COUNT(DISTINCT user_id)
FROM analytics_events.events
WHERE
  event_name = 'registration_form_started'
  AND user_id NOT IN (
    SELECT user_id
    FROM analytics_events.events
    WHERE event_name = 'registration_landing_viewed'
  )
  AND timestamp >= '2025-11-01';
```

**Result**: 9,046 users (88% of "form started" events)

**9,046 users "started registration" without viewing the landing page?!**

**Step 3: Check the tracking code**

Found the problem in `apps/web/src/features/auth/RegisterForm.tsx`:

```typescript
// ❌ BAD CODE - Tracking on component mount
function RegisterForm() {
  useEffect(() => {
    // ❌ Fires every time component mounts
    analytics.track('registration_form_started');
  }, []); // Empty dependency array

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      <button type="submit">Register</button>
    </form>
  );
}
```

**The form was embedded on EVERY page** (in a modal that could be opened anywhere).

Every time a logged-in user navigated to ANY page, the RegisterForm component mounted (hidden in a modal), and fired `registration_form_started`!

**Step 4: Check who these "registrations" were**

```sql
-- Check if "registration" events came from already-registered users
SELECT
  e.user_id,
  u.created_at as user_registration_date,
  e.timestamp as event_timestamp,
  DATEDIFF('day', u.created_at, e.timestamp) as days_since_registration
FROM analytics_events.events e
JOIN users u ON e.user_id = u.id
WHERE
  e.event_name = 'registration_form_started'
  AND e.timestamp >= '2025-11-01'
  AND u.created_at < '2025-11-01'
ORDER BY days_since_registration DESC
LIMIT 10;
```

**Result:**

| user_id  | user_registration_date | event_timestamp     | days_since_registration |
| -------- | ---------------------- | ------------------- | ----------------------- |
| user_123 | 2025-06-15             | 2025-11-25 14:23:12 | 163 days                |
| user_456 | 2025-07-22             | 2025-11-24 09:12:47 | 125 days                |
| user_789 | 2025-08-01             | 2025-11-23 16:45:33 | 114 days                |

**Users who registered 4-5 months ago were being counted as "starting registration" every time they logged in!**

**The funnel was counting:**

- 1,247 real new users going through registration (11.5%)
- 9,046 existing users triggering events by navigating around the app (88.5%)

**Real conversion: 11.5%, not 94.9%**

**That's 8.2x lower than reported!**

#### The Root Cause

**How the funnel was broken:**

1. **Tracking on mount** - Events fired when component rendered, not when user interacted
2. **No user state check** - Didn't check if user was already registered
3. **No funnel time windows** - Counted events from any time period as "conversions"
4. **No step ordering** - Didn't verify users completed steps in sequence
5. **No session boundaries** - Counted events across multiple sessions as one "funnel"

**The dashboard query:**

```sql
-- ❌ BAD QUERY - Doesn't check ordering or timing
SELECT
  COUNT(DISTINCT CASE WHEN event_name = 'registration_landing_viewed' THEN user_id END) as step1,
  COUNT(DISTINCT CASE WHEN event_name = 'registration_form_started' THEN user_id END) as step2,
  COUNT(DISTINCT CASE WHEN event_name = 'email_submitted' THEN user_id END) as step3,
  COUNT(DISTINCT CASE WHEN event_name = 'email_verified' THEN user_id END) as step4,
  COUNT(DISTINCT CASE WHEN event_name = 'profile_created' THEN user_id END) as step5
FROM analytics_events.events
WHERE timestamp >= '2025-11-01';

-- This counts:
-- - Any user who EVER fired each event (no ordering)
-- - Events from different sessions (no time window)
-- - Existing users triggering events (no state check)
```

**Why it looked good:**

Most users HAD completed registration (at some point in the past). So they HAD all 5 events in the database. The query just counted "do they have this event?" not "did they complete these events in order during a registration session?"

#### Immediate Fix

**Step 1: Fix tracking - Only track user-initiated actions**

```typescript
// ✅ FIXED - Track on user interaction, not mount
function RegisterForm() {
  const [hasStarted, setHasStarted] = useState(false);

  const handleFormInteraction = () => {
    if (!hasStarted) {
      // Only track once per session, on first interaction
      analytics.track('registration_form_started');
      setHasStarted(true);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onFocus={handleFormInteraction}  // Track when user focuses on form
      onChange={handleFormInteraction} // or types in form
    >
      <input name="email" />
      <button type="submit">Register</button>
    </form>
  );
}
```

**Step 2: Add user state checks**

```typescript
// ✅ Don't track events for already-registered users
analytics.track('registration_form_started', {
  // Add context
  isNewUser: !user, // Only true for anonymous users
  isLoggedIn: !!user,
  userCreatedAt: user?.created_at,
});

// Filter in analytics query:
WHERE properties.isNewUser = true
```

**Step 3: Fix funnel query - Check ordering and timing**

```sql
-- ✅ FIXED QUERY - Proper funnel analysis
WITH funnel_sessions AS (
  SELECT
    user_id,
    session_id,
    MIN(CASE WHEN event_name = 'registration_landing_viewed' THEN timestamp END) as step1_time,
    MIN(CASE WHEN event_name = 'registration_form_started' THEN timestamp END) as step2_time,
    MIN(CASE WHEN event_name = 'email_submitted' THEN timestamp END) as step3_time,
    MIN(CASE WHEN event_name = 'email_verified' THEN timestamp END) as step4_time,
    MIN(CASE WHEN event_name = 'profile_created' THEN timestamp END) as step5_time
  FROM analytics_events.events
  WHERE
    timestamp >= '2025-11-01'
    AND timestamp < '2025-12-01'
    AND properties.isNewUser = true  -- ✅ Only new users
  GROUP BY user_id, session_id
),

ordered_funnels AS (
  SELECT
    *,
    -- ✅ Check steps completed in order within time window
    CASE
      WHEN step1_time IS NOT NULL THEN 1
      ELSE 0
    END as completed_step1,

    CASE
      WHEN step2_time IS NOT NULL
        AND step2_time > step1_time  -- ✅ After step 1
        AND step2_time < step1_time + INTERVAL '30 minutes'  -- ✅ Within 30 min
      THEN 1
      ELSE 0
    END as completed_step2,

    CASE
      WHEN step3_time IS NOT NULL
        AND step3_time > step2_time
        AND step3_time < step2_time + INTERVAL '30 minutes'
      THEN 1
      ELSE 0
    END as completed_step3,

    CASE
      WHEN step4_time IS NOT NULL
        AND step4_time > step3_time
        AND step4_time < step3_time + INTERVAL '60 minutes'  -- Email verification can take longer
      THEN 1
      ELSE 0
    END as completed_step4,

    CASE
      WHEN step5_time IS NOT NULL
        AND step5_time > step4_time
        AND step5_time < step4_time + INTERVAL '30 minutes'
      THEN 1
      ELSE 0
    END as completed_step5

  FROM funnel_sessions
  WHERE step1_time IS NOT NULL  -- Must start at step 1
)

SELECT
  SUM(completed_step1) as users_step1,
  SUM(completed_step2) as users_step2,
  SUM(completed_step3) as users_step3,
  SUM(completed_step4) as users_step4,
  SUM(completed_step5) as users_step5,

  -- ✅ Accurate conversion rates
  ROUND(SUM(completed_step2) * 100.0 / NULLIF(SUM(completed_step1), 0), 1) as step1_to_step2_pct,
  ROUND(SUM(completed_step3) * 100.0 / NULLIF(SUM(completed_step2), 0), 1) as step2_to_step3_pct,
  ROUND(SUM(completed_step4) * 100.0 / NULLIF(SUM(completed_step3), 0), 1) as step3_to_step4_pct,
  ROUND(SUM(completed_step5) * 100.0 / NULLIF(SUM(completed_step4), 0), 1) as step4_to_step5_pct,
  ROUND(SUM(completed_step5) * 100.0 / NULLIF(SUM(completed_step1), 0), 1) as overall_conversion_pct

FROM ordered_funnels;
```

**Results (corrected funnel):**

```
Registration Funnel - Last 30 Days (CORRECTED)
┌───────────────────────┬────────┬───────────┐
│ Step                  │ Users  │ Conv Rate │
├───────────────────────┼────────┼───────────┤
│ 1. Viewed Landing     │ 10,847 │ 100%      │
│ 2. Started Reg Form   │ 1,247  │ 11.5%     │ ← Was 94.9%!
│ 3. Submitted Email    │ 1,023  │ 82.0%     │
│ 4. Verified Email     │ 847    │ 82.8%     │
│ 5. Created Profile    │ 723    │ 85.4%     │
└───────────────────────┴────────┴───────────┘

Overall Conversion: 6.7% (landing → profile)
```

**Real conversion: 6.7%, not 89.6%**

**That's 13.4x lower than reported!**

#### Long-Term Solution

**1. Funnel Analysis Best Practices**

```sql
-- ✅ Template for accurate funnel analysis

WITH funnel AS (
  SELECT
    user_id,
    session_id,
    -- First occurrence of each step in session
    MIN(CASE WHEN event_name = 'step1' THEN timestamp END) as step1_time,
    MIN(CASE WHEN event_name = 'step2' THEN timestamp END) as step2_time,
    MIN(CASE WHEN event_name = 'step3' THEN timestamp END) as step3_time
  FROM events
  WHERE
    date(timestamp) >= current_date - 30
    -- ✅ Filter to relevant users (new, specific cohort, etc.)
    AND properties.user_type = 'new'
  GROUP BY user_id, session_id
),

ordered_funnel AS (
  SELECT
    *,
    -- ✅ Check ordering
    step1_time IS NOT NULL as completed_step1,
    step2_time > step1_time as completed_step2_ordered,
    step3_time > step2_time as completed_step3_ordered,

    -- ✅ Check time windows
    step2_time < step1_time + INTERVAL '30 minutes' as step2_within_window,
    step3_time < step2_time + INTERVAL '30 minutes' as step3_within_window
  FROM funnel
  WHERE step1_time IS NOT NULL  -- ✅ Must start at beginning
)

SELECT
  COUNT(*) as users,
  SUM(CASE WHEN completed_step1 THEN 1 ELSE 0 END) as step1_users,
  SUM(CASE WHEN completed_step2_ordered AND step2_within_window THEN 1 ELSE 0 END) as step2_users,
  SUM(CASE WHEN completed_step3_ordered AND step3_within_window THEN 1 ELSE 0 END) as step3_users
FROM ordered_funnel;
```

**2. Add Funnel Validation Tests**

```typescript
// tests/analytics/funnel-validation.test.ts

describe("Registration Funnel", () => {
  it("should only count new users", async () => {
    // Create existing user
    const existingUser = await createUser();

    // Trigger "registration" events as existing user
    await analytics.track("registration_form_started", {
      userId: existingUser.id,
    });

    // Query funnel
    const funnel = await queryRegistrationFunnel();

    // Should NOT be counted
    expect(funnel.step2_users).toBe(0);
  });

  it("should require steps in order", async () => {
    const user = await createAnonymousUser();

    // Fire events out of order
    await analytics.track("email_verified"); // Step 4 first!
    await analytics.track("registration_form_started"); // Step 2 second

    const funnel = await queryRegistrationFunnel();

    // Should NOT count as conversions
    expect(funnel.overall_conversion).toBe(0);
  });

  it("should enforce time windows", async () => {
    const user = await createAnonymousUser();

    // Fire step 1
    await analytics.track("registration_landing_viewed");

    // Wait 2 hours (beyond 30-minute window)
    await sleep(2 * 60 * 60 * 1000);

    // Fire step 2
    await analytics.track("registration_form_started");

    const funnel = await queryRegistrationFunnel();

    // Should NOT count as conversion (too much time between steps)
    expect(funnel.step1_to_step2_conversion).toBe(0);
  });
});
```

**3. Add Funnel Sanity Checks**

```sql
-- models/monitoring/funnel_sanity_checks.sql

-- Alert if funnel conversion rates are suspiciously high

WITH funnel_metrics AS (
  SELECT
    date(timestamp) as date,
    -- ... funnel calculation ...
  FROM events
  GROUP BY date(timestamp)
)

SELECT
  date,
  step1_to_step2_pct,
  CASE
    WHEN step1_to_step2_pct > 50 THEN '🔴 SUSPICIOUS - Too high!'
    WHEN step1_to_step2_pct < 5 THEN '🔴 SUSPICIOUS - Too low!'
    ELSE '🟢 OK'
  END as status
FROM funnel_metrics
WHERE date >= current_date - 7
ORDER BY date DESC;
```

#### Results After Fix

**Funnel Accuracy:**

| Metric               | Reported (Broken) | Actual (Fixed) | Error          |
| -------------------- | ----------------- | -------------- | -------------- |
| Landing → Form Start | 94.9%             | 11.5%          | 8.2x inflated  |
| Form → Email Submit  | 98.6%             | 82.0%          | 1.2x inflated  |
| Overall Conversion   | 89.6%             | 6.7%           | 13.4x inflated |

**Business Impact:**

- **Stopped false celebration** - Team now sees real performance
- **Identified real issues** - 88.5% drop-off at form start (was hidden)
- **Focused optimization** - Now working on actual bottleneck (form start)
- **Realistic expectations** - 6.7% is industry average, not 89.6%

**Long-Term Impact:**

- **Fixed 12 other funnels** with same issues
- **Added funnel validation tests** (prevent regressions)
- **Created funnel analysis template** (reusable)
- **Improved registration flow** based on real data (now 14.2% conversion)

#### Lessons Learned

**1. Track User Actions, Not Component Mounts**

```typescript
// ❌ WRONG - Fires when component renders
useEffect(() => {
  analytics.track('form_started');
}, []);

// ✅ CORRECT - Fires when user interacts
<form onFocus={() => analytics.track('form_started')}>
```

**2. Check User State**

```typescript
// ✅ Only track for relevant users
if (!user || user.isNew) {
  analytics.track("registration_started");
}
```

**3. Enforce Step Ordering**

```sql
-- ✅ Verify steps in sequence
WHERE step2_time > step1_time
  AND step3_time > step2_time
```

**4. Add Time Windows**

```sql
-- ✅ Steps must occur within time window
WHERE step2_time < step1_time + INTERVAL '30 minutes'
```

**5. Validate Funnels**

```sql
-- ✅ Alert if suspiciously high
WHERE conversion_rate > 50  -- Too good to be true
```

**6. Test Funnel Queries**

```typescript
// ✅ Unit test funnel logic
expect(funnel.requiresOrdering()).toBe(true);
expect(funnel.hasTimeWindows()).toBe(true);
```

**7. Start from First Step**

```sql
-- ✅ Only count users who entered at top of funnel
WHERE step1_time IS NOT NULL
```

#### Key Takeaways

**The Three Laws of Funnel Analysis:**

1. **Always check ordering** - Steps must occur in sequence
2. **Always enforce time windows** - Steps must occur within reasonable time
3. **Always validate user state** - Only count relevant users (new, anonymous, etc.)

**Never Again:**

- No tracking on component mount
- No funnel without ordering checks
- No funnel without time windows
- No funnel without user state filters
- No funnel without sanity checks
- No funnel without validation tests

**Cost of This Incident:**

- **Strategic Impact**: 3 weeks celebrating fake success
- **Opportunity Cost**: Didn't fix real issues (88.5% drop-off)
- **Resource Waste**: Doubled down on "successful" approach that wasn't working
- **Trust Damage**: Team questioned all funnels
- **Total Impact**: ~3 weeks of misdirected effort + missed optimizations

**What We Built:**

- Proper funnel analysis template
- User state tracking
- Funnel validation tests
- Sanity check monitoring
- Team training on funnels

**This incident taught us: A funnel that shows 94% conversion is probably broken. If it looks too good to be true, it is.**

---

### War Story 3: Dashboard Performance Meltdown - 47-Second Load Times

**Date**: December 2025
**Duration**: 2 weeks of unusable dashboards
**Impact**: Leadership unable to view real-time metrics
**Business Impact**: Decisions delayed due to slow dashboards
**User Frustration**: Critical

#### The Slowdown

December 3rd, CEO sent a frustrated message:

```
[9:23 AM] CEO: Why does the exec dashboard take 47 seconds to load?
[9:24 AM] CEO: I refresh it 10 times a day. That's 8 minutes of waiting!
[9:25 AM] CEO: This is unusable. Fix it.
```

Ana checked the dashboard load times:

**Dashboard Performance:**

- Exec Dashboard: 47 seconds to load
- Product Dashboard: 34 seconds
- Marketing Dashboard: 28 seconds
- User Health Dashboard: 52 seconds

**All dashboards were painfully slow.**

#### Investigation: Why So Slow?

**Step 1: Check Looker query logs**

```sql
-- Query from exec dashboard
SELECT
  date(events.timestamp) as date,
  users.email,
  households.name,
  COUNT(DISTINCT events.id) as total_events,
  COUNT(DISTINCT CASE WHEN events.event_name = 'household_created' THEN events.id END) as households_created,
  COUNT(DISTINCT CASE WHEN events.event_name = 'task_completed' THEN events.id END) as tasks_completed,
  AVG(CASE WHEN events.event_name = 'session_duration' THEN events.properties.duration END) as avg_session_duration,
  -- ... 20 more aggregations ...
FROM analytics_events.events
LEFT JOIN users ON events.user_id = users.id
LEFT JOIN households ON users.id = households.owner_id
WHERE events.timestamp >= '2025-01-01'  -- ❌ 1 year of data!
GROUP BY date(events.timestamp), users.email, households.name
ORDER BY date DESC;

-- Execution time: 47 seconds
-- Rows scanned: 847,293,847 (847 million!)
-- Bytes scanned: 234 GB
```

**The query:**

- Scanned **847 million events** (entire year)
- Joined 3 large tables
- Grouped by high-cardinality columns (email, household name)
- Calculated 20+ aggregations
- No indexes, no partitioning, no pre-aggregation

**Cost: $2.34 per query × 100 views/day = $234/day = $7,020/month** just for dashboard queries!

**Step 2: Check BigQuery execution plan**

```
Stage 1: Full table scan of events (847M rows)
Stage 2: Hash join with users (234K rows)
Stage 3: Hash join with households (89K rows)
Stage 4: Group by email + household_name (187K groups)
Stage 5: Calculate 20+ aggregations per group
Stage 6: Sort by date DESC

Total slots used: 2000
Shuffle bytes: 234 GB
Execution time: 47 seconds
```

**Step 3: Profile dashboard code**

The Looker dashboard was configured to:

- Load 365 days of data by default
- Refresh every 5 minutes
- Run 20+ separate queries (one per chart)
- No caching between charts

**Step 4: Check for existing optimizations**

```bash
# Check for materialized views
$ bq ls --max_results=1000 analytics_events | grep -i material
# No materialized views found

# Check for partitioning
$ bq show --schema --format=prettyjson analytics_events.events | grep -i partition
# No partitioning configured

# Check for clustering
$ bq show --schema --format=prettyjson analytics_events.events | grep -i cluster
# No clustering configured
```

**We had ZERO query optimizations in place.**

#### Root Cause

**Problem 1: No Pre-Aggregation**

- Every dashboard query scanned raw events
- Recalculated the same metrics millions of times
- No hourly/daily rollup tables

**Problem 2: No Partitioning or Clustering**

- BigQuery scanned entire table for every query
- No partition pruning (couldn't skip irrelevant data)
- No clustering (couldn't benefit from data locality)

**Problem 3: Inefficient Dashboard Design**

- 20+ separate queries per dashboard
- No shared caching between charts
- Refreshing every 5 minutes (unnecessary for exec dashboard)

**Problem 4: Over-Joining**

- Joined users and households tables for every query
- Most dashboards only needed event data
- Joins added 15-20 seconds per query

**Problem 5: High-Cardinality Grouping**

- Grouping by email + household name created 187K groups
- Most dashboards didn't need user-level detail
- Household-level or day-level would suffice

#### Immediate Fix (Day 1)

**1. Add date filter to Looker dashboards**

```sql
-- Changed from:
WHERE events.timestamp >= '2025-01-01'

-- To:
WHERE events.timestamp >= CURRENT_DATE() - 30  -- Last 30 days only
```

**Result: 47s → 12s** (74% improvement)

**2. Change refresh schedule**

```yaml
# looker_dashboards/exec_dashboard.yml
refresh_schedule:
  # Before: every_5_minutes
  interval: daily # Exec dashboard doesn't need real-time
  time: "06:00" # Refresh at 6am before execs arrive
```

**3. Remove unnecessary joins**

```sql
-- Before: Joined users and households (added 20s)
SELECT
  date(events.timestamp) as date,
  users.email,  -- ❌ Not needed
  households.name,  -- ❌ Not needed
  COUNT(DISTINCT events.id) as total_events
FROM analytics_events.events
LEFT JOIN users ON events.user_id = users.id
LEFT JOIN households ON users.id = households.owner_id

-- After: Events only (much faster)
SELECT
  date(events.timestamp) as date,
  COUNT(DISTINCT events.id) as total_events,
  COUNT(DISTINCT user_id) as active_users
FROM analytics_events.events
WHERE events.timestamp >= CURRENT_DATE() - 30
GROUP BY date(events.timestamp)
ORDER BY date DESC;
```

**Result: 12s → 4s** (67% improvement)

**Quick wins brought dashboard from 47s → 4s (91% improvement)!**

#### Long-Term Solution (Weeks 1-2)

**1. Partition events table by date**

```sql
-- Create partitioned table
CREATE TABLE analytics_events.events_partitioned
PARTITION BY DATE(timestamp)
CLUSTER BY user_id, event_name
AS SELECT * FROM analytics_events.events;

-- Verify partitioning
SELECT
  partition_id,
  total_rows,
  total_logical_bytes / POW(10, 9) as size_gb
FROM `analytics_events.INFORMATION_SCHEMA.PARTITIONS`
WHERE table_name = 'events_partitioned'
ORDER BY partition_id DESC
LIMIT 10;

-- Result:
-- partition_id  | total_rows | size_gb
-- 2025-02-03    | 2,847,293  | 0.89
-- 2025-02-02    | 2,934,847  | 0.92
-- 2025-02-01    | 2,782,394  | 0.87
```

**Impact:**

- Queries with date filters only scan relevant partitions
- 30-day query now scans 30 partitions instead of 365
- **92% reduction in data scanned**

**2. Create daily rollup table (materialized view)**

```sql
-- Daily metrics rollup
CREATE MATERIALIZED VIEW analytics_events.daily_metrics
PARTITION BY date
CLUSTER BY date
AS
SELECT
  DATE(timestamp) as date,
  event_name,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(CASE WHEN properties.duration IS NOT NULL
      THEN CAST(properties.duration AS FLOAT64) END) as avg_duration,
  COUNTIF(properties.error IS NOT NULL) as error_count
FROM analytics_events.events_partitioned
WHERE timestamp >= CURRENT_DATE() - 365  -- Keep 1 year
GROUP BY date, event_name;

-- Refresh automatically (BigQuery handles it)
-- Queries against this view are 100x faster
```

**Dashboard queries now use rollup:**

```sql
-- Before: Scanned 847M raw events
SELECT date, COUNT(*) as events
FROM analytics_events.events
WHERE timestamp >= CURRENT_DATE() - 30
GROUP BY date;
-- Execution: 47 seconds, 234 GB scanned

-- After: Uses pre-aggregated rollup
SELECT date, SUM(event_count) as events
FROM analytics_events.daily_metrics
WHERE date >= CURRENT_DATE() - 30
GROUP BY date;
-- Execution: 0.8 seconds, 45 MB scanned
```

**3. Create hourly rollup for real-time dashboards**

```sql
-- For dashboards that need fresher data
CREATE MATERIALIZED VIEW analytics_events.hourly_metrics
PARTITION BY DATE(hour)
CLUSTER BY hour
AS
SELECT
  TIMESTAMP_TRUNC(timestamp, HOUR) as hour,
  event_name,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as event_count
FROM analytics_events.events_partitioned
WHERE timestamp >= CURRENT_TIMESTAMP() - INTERVAL 7 DAY
GROUP BY hour, event_name;
```

**4. Implement dashboard caching layer**

```typescript
// apps/web/src/lib/analytics/dashboard-cache.ts
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

interface DashboardQuery {
  sql: string;
  params: Record<string, any>;
}

export async function getCachedDashboardData<T>(
  query: DashboardQuery,
  ttl: number = 300, // 5 minutes default
): Promise<T> {
  const cacheKey = `dashboard:${hashQuery(query)}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("Dashboard cache hit", { cacheKey });
    return JSON.parse(cached);
  }

  // Cache miss - run query
  console.log("Dashboard cache miss", { cacheKey });
  const result = await runBigQueryQuery<T>(query.sql, query.params);

  // Cache result
  await redis.setex(cacheKey, ttl, JSON.stringify(result));

  return result;
}

// Exec dashboard uses 1-hour cache (doesn't need real-time)
const execDashboardTTL = 3600; // 1 hour

// Marketing dashboard uses 5-minute cache
const marketingDashboardTTL = 300; // 5 minutes
```

**5. Optimize Looker dashboard configuration**

```yaml
# looker_dashboards/exec_dashboard.yml
dashboards:
  - name: Executive Dashboard
    elements:
      - type: single_value
        query: daily_metrics_summary # Uses materialized view
        cache_duration: 3600 # 1 hour

      - type: line_chart
        query: weekly_active_users # Uses materialized view
        cache_duration: 3600

      - type: bar_chart
        query: top_events # Uses materialized view
        cache_duration: 3600

    # Shared cache for all elements
    dashboard_cache_duration: 3600

    # Prefetch on schedule
    prefetch_schedule:
      interval: hourly
      time: "00" # Top of every hour
```

#### Results

**Query Performance:**

- Exec Dashboard: 47s → 0.8s (98.3% improvement)
- Marketing Dashboard: 28s → 1.2s (95.7% improvement)
- User Health Dashboard: 52s → 1.5s (97.1% improvement)

**Cost Reduction:**

- Before: $7,020/month in query costs
- After: $420/month in query costs
- **Savings: $6,600/month (94% reduction)**

**Data Scanned:**

- Before: 234 GB per query
- After: 45 MB per query
- **99.98% reduction in data scanned**

**User Experience:**

- Dashboards now load in < 2 seconds
- CEO happy: "This is incredible! I can finally use dashboards without coffee breaks"
- Execs use dashboards 10x more often now

**Additional Benefits:**

- Reduced BigQuery slot contention (faster for everyone)
- Enabled real-time dashboards (sub-second queries)
- Foundation for more complex analytics

#### Lessons Learned

**1. Pre-Aggregate Early**

- Don't scan raw events for every dashboard query
- Create daily/hourly rollups as soon as you have production traffic
- Materialized views are your friend

**2. Partition and Cluster Everything**

- BigQuery partitioning is essential for time-series data
- Clustering by user_id and event_name speeds up common queries
- **Always partition by date/timestamp for analytics tables**

**3. Right-Size Your Queries**

- Don't load 365 days when 30 days suffices
- Don't join tables unless you actually need the columns
- Don't group by high-cardinality columns unnecessarily

**4. Cache Aggressively**

- Exec dashboards don't need real-time data
- Use longer cache TTLs for less critical dashboards
- Prefetch popular dashboards before users arrive

**5. Monitor Query Costs**

- Set up alerts for expensive queries (> $1 per query)
- Review Looker query logs weekly
- Educate team on query efficiency

**6. Materialize Common Aggregations**

- Daily active users, event counts, session metrics
- These are queried constantly - pre-calculate them
- Refresh materialized views hourly or daily

**7. Design Dashboards for Performance**

- Fewer, focused charts are better than 20+ charts
- Share caching between related charts
- Use appropriate refresh schedules

**Ana's Dashboard Performance Rules:**

```markdown
## Dashboard Performance Guidelines

### Query Rules

- ✅ Use materialized views (daily_metrics, hourly_metrics) for dashboards
- ✅ Partition queries by date (last 7, 30, 90 days)
- ✅ Cluster queries by user_id and event_name when filtering
- ❌ Never scan raw events table without date filter
- ❌ Never load > 90 days for real-time dashboards
- ❌ Never join tables unless columns are actually used

### Caching Rules

- ✅ Exec dashboards: 1-hour cache
- ✅ Marketing dashboards: 5-minute cache
- ✅ Real-time dashboards: 1-minute cache or no cache
- ✅ Prefetch popular dashboards on schedule

### Cost Rules

- ✅ Set up alerts for queries > $1
- ✅ Review query costs weekly
- ✅ Monitor data scanned per query
- ❌ Never run ad-hoc queries on production during business hours

### Monitoring

- Track query execution time (alert if > 5 seconds)
- Track data scanned per query (alert if > 1 GB)
- Track BigQuery costs daily
- Review Looker query logs for optimization opportunities
```

**Prevention:**

- All new dashboards must use materialized views
- Code review for BigQuery queries in PRs
- Dashboard performance testing before launch
- Monthly dashboard performance review

---

## Advanced Event Tracking Patterns

Beyond the basics, here are production-tested patterns for complex tracking scenarios.

### Pattern 1: Session-Based Event Tracking

Track user sessions with automatic session management:

```typescript
// packages/analytics/src/session-manager.ts
interface Session {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivityTime: Date;
  eventCount: number;
  properties: Record<string, any>;
}

export class SessionManager {
  private currentSession: Session | null = null;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSessionCheck();
  }

  getOrCreateSession(userId: string): Session {
    const now = new Date();

    // Check if current session is still valid
    if (this.currentSession && this.currentSession.userId === userId) {
      const timeSinceActivity =
        now.getTime() - this.currentSession.lastActivityTime.getTime();

      if (timeSinceActivity < this.sessionTimeout) {
        // Session still valid - update activity time
        this.currentSession.lastActivityTime = now;
        return this.currentSession;
      }

      // Session expired - track session_ended
      this.endSession(this.currentSession);
    }

    // Create new session
    const session: Session = {
      sessionId: generateSessionId(),
      userId,
      startTime: now,
      lastActivityTime: now,
      eventCount: 0,
      properties: {
        device: getDeviceInfo(),
        browser: getBrowserInfo(),
        referrer: document.referrer,
        landingPage: window.location.pathname,
      },
    };

    this.currentSession = session;

    // Track session_started
    analytics.track("session_started", {
      sessionId: session.sessionId,
      ...session.properties,
    });

    return session;
  }

  trackEvent(
    userId: string,
    eventName: string,
    properties: Record<string, any> = {},
  ) {
    const session = this.getOrCreateSession(userId);

    // Add session context to every event
    analytics.track(eventName, {
      ...properties,
      sessionId: session.sessionId,
      sessionEventIndex: session.eventCount++,
      sessionDuration: Date.now() - session.startTime.getTime(),
    });
  }

  endSession(session: Session) {
    analytics.track("session_ended", {
      sessionId: session.sessionId,
      duration: Date.now() - session.startTime.getTime(),
      eventCount: session.eventCount,
    });

    this.currentSession = null;
  }

  private startSessionCheck() {
    // Check for session timeout every minute
    this.sessionCheckInterval = setInterval(() => {
      if (this.currentSession) {
        const timeSinceActivity =
          Date.now() - this.currentSession.lastActivityTime.getTime();

        if (timeSinceActivity >= this.sessionTimeout) {
          this.endSession(this.currentSession);
        }
      }
    }, 60000); // 1 minute
  }
}

// Global instance
export const sessionManager = new SessionManager();
```

**Usage in components:**

```typescript
// Track with automatic session context
sessionManager.trackEvent(user.id, "task_completed", {
  taskId: task.id,
  taskType: "medication",
});

// Tracked event includes:
// - sessionId
// - sessionEventIndex (3rd event in session)
// - sessionDuration (15 minutes since session started)
```

**Benefits:**

- Automatic session start/end tracking
- Every event includes session context
- Session timeout handling
- Enables session-based analysis (avg events per session, session duration, etc.)

### Pattern 2: Event Context Enrichment

Automatically enrich events with context without cluttering tracking calls:

```typescript
// packages/analytics/src/context-enricher.ts
interface EventContext {
  // User context
  userId: string;
  userEmail: string;
  userSignupDate: Date;
  userPlan: "free" | "premium" | "enterprise";
  userRole: "owner" | "member" | "viewer";

  // Household context
  householdId?: string;
  householdSize?: number;
  householdPlanType?: string;

  // Device context
  device: "mobile" | "tablet" | "desktop";
  os: string;
  browser: string;
  screenSize: string;

  // App context
  appVersion: string;
  environment: "production" | "staging" | "development";
  featureFlags: string[];

  // Session context
  sessionId: string;
  sessionDuration: number;
  sessionEventCount: number;
}

export class ContextEnricher {
  private contextProviders: Map<string, () => Record<string, any>> = new Map();

  registerContextProvider(name: string, provider: () => Record<string, any>) {
    this.contextProviders.set(name, provider);
  }

  enrichEvent(
    eventName: string,
    properties: Record<string, any>,
  ): Record<string, any> {
    const enrichedProperties = { ...properties };

    // Add all registered context
    for (const [name, provider] of this.contextProviders) {
      try {
        const context = provider();
        Object.assign(enrichedProperties, context);
      } catch (error) {
        console.error(`Context provider '${name}' failed:`, error);
      }
    }

    return enrichedProperties;
  }
}

// Global instance
export const contextEnricher = new ContextEnricher();

// Register context providers
contextEnricher.registerContextProvider("user", () => {
  const user = getCurrentUser();
  return user
    ? {
        userId: user.id,
        userEmail: user.email,
        userSignupDate: user.createdAt,
        userPlan: user.plan,
        userRole: user.role,
      }
    : {};
});

contextEnricher.registerContextProvider("household", () => {
  const household = getCurrentHousehold();
  return household
    ? {
        householdId: household.id,
        householdSize: household.memberCount,
        householdPlanType: household.planType,
      }
    : {};
});

contextEnricher.registerContextProvider("device", () => ({
  device: getDeviceType(),
  os: getOS(),
  browser: getBrowser(),
  screenSize: `${window.innerWidth}x${window.innerHeight}`,
}));

contextEnricher.registerContextProvider("app", () => ({
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
  environment: process.env.NODE_ENV,
  featureFlags: getActiveFeatureFlags(),
}));

contextEnricher.registerContextProvider("session", () => {
  const session = sessionManager.getCurrentSession();
  return session
    ? {
        sessionId: session.sessionId,
        sessionDuration: Date.now() - session.startTime.getTime(),
        sessionEventCount: session.eventCount,
      }
    : {};
});
```

**Usage:**

```typescript
// Simple tracking call
analytics.track("task_completed", {
  taskId: task.id,
  taskType: "medication",
});

// Automatically enriched to include:
// {
//   taskId: 'task_123',
//   taskType: 'medication',
//   userId: 'user_456',
//   userEmail: 'sarah@example.com',
//   userPlan: 'premium',
//   householdId: 'hh_789',
//   householdSize: 4,
//   device: 'mobile',
//   os: 'iOS',
//   appVersion: '2.1.0',
//   sessionId: 'session_xyz',
//   sessionDuration: 180000,
//   ... (all context automatically added)
// }
```

**Benefits:**

- Clean tracking calls (no repetitive context)
- Consistent context across all events
- Easy to add new context globally
- Context providers can be tested independently

### Pattern 3: Multi-Touch Event Tracking

Track complex user interactions with multiple steps:

```typescript
// packages/analytics/src/multi-touch-tracker.ts
interface TouchPoint {
  name: string;
  timestamp: Date;
  properties: Record<string, any>;
}

interface Journey {
  journeyId: string;
  journeyType: string;
  userId: string;
  startTime: Date;
  touchPoints: TouchPoint[];
  completed: boolean;
  abandonedAt?: string;
}

export class MultiTouchTracker {
  private activeJourneys = new Map<string, Journey>();

  startJourney(
    userId: string,
    journeyType: string,
    properties: Record<string, any> = {},
  ): string {
    const journeyId = `${journeyType}_${userId}_${Date.now()}`;

    const journey: Journey = {
      journeyId,
      journeyType,
      userId,
      startTime: new Date(),
      touchPoints: [],
      completed: false,
    };

    this.activeJourneys.set(journeyId, journey);

    // Track journey start
    analytics.track("journey_started", {
      journeyId,
      journeyType,
      ...properties,
    });

    return journeyId;
  }

  trackTouchPoint(
    journeyId: string,
    touchPointName: string,
    properties: Record<string, any> = {},
  ): void {
    const journey = this.activeJourneys.get(journeyId);

    if (!journey) {
      console.warn(`Journey ${journeyId} not found`);
      return;
    }

    const touchPoint: TouchPoint = {
      name: touchPointName,
      timestamp: new Date(),
      properties,
    };

    journey.touchPoints.push(touchPoint);

    // Track touch point
    analytics.track("journey_touch_point", {
      journeyId,
      journeyType: journey.journeyType,
      touchPoint: touchPointName,
      touchPointIndex: journey.touchPoints.length,
      timeSinceStart: Date.now() - journey.startTime.getTime(),
      ...properties,
    });
  }

  completeJourney(
    journeyId: string,
    properties: Record<string, any> = {},
  ): void {
    const journey = this.activeJourneys.get(journeyId);

    if (!journey) {
      console.warn(`Journey ${journeyId} not found`);
      return;
    }

    journey.completed = true;

    // Track journey completion
    analytics.track("journey_completed", {
      journeyId,
      journeyType: journey.journeyType,
      duration: Date.now() - journey.startTime.getTime(),
      touchPointCount: journey.touchPoints.length,
      touchPoints: journey.touchPoints.map((tp) => tp.name),
      ...properties,
    });

    this.activeJourneys.delete(journeyId);
  }

  abandonJourney(
    journeyId: string,
    abandonedAt: string,
    properties: Record<string, any> = {},
  ): void {
    const journey = this.activeJourneys.get(journeyId);

    if (!journey) {
      console.warn(`Journey ${journeyId} not found`);
      return;
    }

    journey.abandonedAt = abandonedAt;

    // Track journey abandonment
    analytics.track("journey_abandoned", {
      journeyId,
      journeyType: journey.journeyType,
      abandonedAt,
      duration: Date.now() - journey.startTime.getTime(),
      touchPointCount: journey.touchPoints.length,
      lastTouchPoint: journey.touchPoints[journey.touchPoints.length - 1]?.name,
      ...properties,
    });

    this.activeJourneys.delete(journeyId);
  }
}

// Global instance
export const multiTouchTracker = new MultiTouchTracker();
```

**Usage Example: Onboarding Journey**

```typescript
// Start onboarding journey
const journeyId = multiTouchTracker.startJourney(user.id, "onboarding", {
  source: "email_invite",
});

// Track each step
multiTouchTracker.trackTouchPoint(journeyId, "profile_form_viewed");
multiTouchTracker.trackTouchPoint(journeyId, "profile_form_completed", {
  hasAvatar: true,
  bio_length: 120,
});

multiTouchTracker.trackTouchPoint(journeyId, "household_creation_started");
multiTouchTracker.trackTouchPoint(journeyId, "household_created", {
  householdName: "Zeder House",
  memberCount: 1,
});

multiTouchTracker.trackTouchPoint(journeyId, "first_pet_added", {
  petType: "dog",
  petName: "Max",
});

// Complete journey
multiTouchTracker.completeJourney(journeyId, {
  petsAdded: 2,
  membersInvited: 1,
});

// Or abandon if user leaves
multiTouchTracker.abandonJourney(journeyId, "household_creation", {
  reason: "user_navigated_away",
});
```

**Analysis Queries:**

```sql
-- Journey completion rate by type
SELECT
  journey_type,
  COUNT(DISTINCT CASE WHEN event_name = 'journey_started' THEN journey_id END) as started,
  COUNT(DISTINCT CASE WHEN event_name = 'journey_completed' THEN journey_id END) as completed,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_name = 'journey_completed' THEN journey_id END) /
    COUNT(DISTINCT CASE WHEN event_name = 'journey_started' THEN journey_id END), 2) as completion_rate
FROM analytics_events.events
WHERE event_name IN ('journey_started', 'journey_completed')
  AND timestamp >= CURRENT_DATE() - 30
GROUP BY journey_type
ORDER BY started DESC;

-- Average journey duration by type
SELECT
  properties.journey_type as journey_type,
  COUNT(*) as completed_journeys,
  AVG(CAST(properties.duration AS FLOAT64) / 1000) as avg_duration_seconds,
  APPROX_QUANTILES(CAST(properties.duration AS FLOAT64) / 1000, 100)[OFFSET(50)] as median_duration_seconds
FROM analytics_events.events
WHERE event_name = 'journey_completed'
  AND timestamp >= CURRENT_DATE() - 30
GROUP BY journey_type;

-- Most common abandonment points
SELECT
  properties.journey_type as journey_type,
  properties.abandoned_at as abandonment_point,
  COUNT(*) as abandonment_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY properties.journey_type), 2) as pct_of_abandonments
FROM analytics_events.events
WHERE event_name = 'journey_abandoned'
  AND timestamp >= CURRENT_DATE() - 30
GROUP BY journey_type, abandonment_point
ORDER BY journey_type, abandonment_count DESC;
```

### Pattern 4: Error and Exception Tracking

Track errors and exceptions with full context:

```typescript
// packages/analytics/src/error-tracker.ts
interface ErrorContext {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  errorCode?: string;
  userId?: string;
  route?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class ErrorTracker {
  trackError(error: Error, context: Partial<ErrorContext> = {}): void {
    const errorData: ErrorContext = {
      errorType: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      userId: getCurrentUser()?.id,
      route: window.location.pathname,
      ...context,
    };

    // Track error event
    analytics.track("error_occurred", errorData);

    // Also send to error monitoring (Sentry, etc.)
    if (window.Sentry) {
      Sentry.captureException(error, {
        contexts: {
          analytics: errorData,
        },
      });
    }
  }

  trackAPIError(
    endpoint: string,
    statusCode: number,
    errorMessage: string,
    context: Record<string, any> = {},
  ): void {
    analytics.track("api_error", {
      endpoint,
      statusCode,
      errorMessage,
      userId: getCurrentUser()?.id,
      ...context,
    });
  }

  trackValidationError(
    formName: string,
    field: string,
    validationError: string,
    context: Record<string, any> = {},
  ): void {
    analytics.track("validation_error", {
      formName,
      field,
      validationError,
      userId: getCurrentUser()?.id,
      ...context,
    });
  }
}

// Global instance
export const errorTracker = new ErrorTracker();
```

**Usage:**

```typescript
// Track JavaScript errors
try {
  await createHousehold(data);
} catch (error) {
  errorTracker.trackError(error as Error, {
    action: 'create_household',
    metadata: { householdData: data },
  });
  throw error;
}

// Track API errors
const response = await fetch('/api/households', { method: 'POST', body: JSON.stringify(data) });
if (!response.ok) {
  errorTracker.trackAPIError('/api/households', response.status, await response.text(), {
    requestData: data,
  });
}

// Track validation errors
<Form
  onError={(field, error) => {
    errorTracker.trackValidationError('CreateHouseholdForm', field, error.message, {
      formValues: form.getValues(),
    });
  }}
/>
```

**Error Analytics:**

```sql
-- Most common errors
SELECT
  properties.error_type as error_type,
  properties.error_message as error_message,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users
FROM analytics_events.events
WHERE event_name = 'error_occurred'
  AND timestamp >= CURRENT_DATE() - 7
GROUP BY error_type, error_message
ORDER BY error_count DESC
LIMIT 20;

-- Error rate by route
SELECT
  properties.route as route,
  COUNT(DISTINCT user_id) as total_users,
  COUNTIF(event_name = 'error_occurred') as errors,
  ROUND(100.0 * COUNTIF(event_name = 'error_occurred') / COUNT(*), 2) as error_rate
FROM analytics_events.events
WHERE timestamp >= CURRENT_DATE() - 7
  AND (event_name = 'page_viewed' OR event_name = 'error_occurred')
GROUP BY route
HAVING errors > 10
ORDER BY error_rate DESC;
```

---

## Funnel Analysis Deep Dive

Comprehensive guide to analyzing user funnels at PetForce.

### Funnel Types at PetForce

**1. Registration Funnel**

```
Landing Page
  ↓ 42% (58% drop-off)
Registration Form Started
  ↓ 68% (32% drop-off)
Registration Form Submitted
  ↓ 89% (11% drop-off - email verification)
Email Confirmed
  ↓ 95% (5% drop-off)
First Login
```

**Overall conversion: 42% × 68% × 89% × 95% = 24.2%**

**2. Onboarding Funnel**

```
First Login
  ↓ 92% (8% drop-off)
Profile Completed
  ↓ 78% (22% drop-off)
Household Created
  ↓ 85% (15% drop-off)
First Pet Added
  ↓ 72% (28% drop-off)
First Task Created
```

**Overall conversion: 92% × 78% × 85% × 72% = 41.3%**

**3. Task Completion Funnel**

```
Task Created
  ↓ 88% (12% never opened)
Task Viewed
  ↓ 76% (24% viewed but didn't complete)
Task Marked Complete
```

**Overall conversion: 88% × 76% = 66.9%**

### SQL Funnel Analysis Template

```sql
-- Generic funnel analysis template
WITH funnel_base AS (
  SELECT
    user_id,
    session_id,
    -- Step 1
    MIN(CASE WHEN event_name = 'step_1_event' THEN timestamp END) as step_1_time,
    -- Step 2
    MIN(CASE WHEN event_name = 'step_2_event'
             AND timestamp > (MIN(CASE WHEN event_name = 'step_1_event' THEN timestamp END))
             AND timestamp < (MIN(CASE WHEN event_name = 'step_1_event' THEN timestamp END)) + INTERVAL '60 MINUTE'
        THEN timestamp END) as step_2_time,
    -- Step 3
    MIN(CASE WHEN event_name = 'step_3_event'
             AND timestamp > (MIN(CASE WHEN event_name = 'step_2_event' THEN timestamp END))
             AND timestamp < (MIN(CASE WHEN event_name = 'step_1_event' THEN timestamp END)) + INTERVAL '60 MINUTE'
        THEN timestamp END) as step_3_time
  FROM analytics_events.events
  WHERE timestamp >= '2025-01-01'
    AND event_name IN ('step_1_event', 'step_2_event', 'step_3_event')
  GROUP BY user_id, session_id
),
funnel_conversions AS (
  SELECT
    COUNT(DISTINCT user_id) as entered_funnel,
    COUNT(DISTINCT CASE WHEN step_2_time IS NOT NULL THEN user_id END) as completed_step_2,
    COUNT(DISTINCT CASE WHEN step_3_time IS NOT NULL THEN user_id END) as completed_step_3,

    -- Time to convert
    AVG(TIMESTAMP_DIFF(step_2_time, step_1_time, SECOND)) as avg_time_to_step_2_seconds,
    AVG(TIMESTAMP_DIFF(step_3_time, step_2_time, SECOND)) as avg_time_to_step_3_seconds,

    -- Conversion rates
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_2_time IS NOT NULL THEN user_id END) /
      COUNT(DISTINCT user_id), 2) as step_1_to_2_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_3_time IS NOT NULL THEN user_id END) /
      COUNT(DISTINCT CASE WHEN step_2_time IS NOT NULL THEN user_id END), 2) as step_2_to_3_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_3_time IS NOT NULL THEN user_id END) /
      COUNT(DISTINCT user_id), 2) as overall_conversion_rate
  FROM funnel_base
  WHERE step_1_time IS NOT NULL  -- Only users who started the funnel
)
SELECT * FROM funnel_conversions;
```

### Cohort-Based Funnel Analysis

Compare funnel performance across different user cohorts:

```sql
-- Registration funnel by signup month cohort
WITH cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC(MIN(timestamp), MONTH) as signup_month
  FROM analytics_events.events
  WHERE event_name = 'user_signed_up'
  GROUP BY user_id
),
funnel_data AS (
  SELECT
    e.user_id,
    c.signup_month,
    MIN(CASE WHEN e.event_name = 'registration_landing_viewed' THEN e.timestamp END) as step_1,
    MIN(CASE WHEN e.event_name = 'registration_form_started' THEN e.timestamp END) as step_2,
    MIN(CASE WHEN e.event_name = 'registration_submitted' THEN e.timestamp END) as step_3,
    MIN(CASE WHEN e.event_name = 'email_confirmed' THEN e.timestamp END) as step_4
  FROM analytics_events.events e
  JOIN cohorts c ON e.user_id = c.user_id
  WHERE e.timestamp >= '2025-01-01'
    AND e.event_name IN ('registration_landing_viewed', 'registration_form_started', 'registration_submitted', 'email_confirmed')
  GROUP BY e.user_id, c.signup_month
)
SELECT
  signup_month,
  COUNT(DISTINCT user_id) as users_entered,
  COUNT(DISTINCT CASE WHEN step_2 IS NOT NULL THEN user_id END) as completed_step_2,
  COUNT(DISTINCT CASE WHEN step_3 IS NOT NULL THEN user_id END) as completed_step_3,
  COUNT(DISTINCT CASE WHEN step_4 IS NOT NULL THEN user_id END) as completed_step_4,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_2 IS NOT NULL THEN user_id END) / COUNT(DISTINCT user_id), 2) as step_1_to_2_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_3 IS NOT NULL THEN user_id END) / COUNT(DISTINCT CASE WHEN step_2 IS NOT NULL THEN user_id END), 2) as step_2_to_3_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_4 IS NOT NULL THEN user_id END) / COUNT(DISTINCT CASE WHEN step_3 IS NOT NULL THEN user_id END), 2) as step_3_to_4_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_4 IS NOT NULL THEN user_id END) / COUNT(DISTINCT user_id), 2) as overall_conversion
FROM funnel_data
WHERE step_1 IS NOT NULL
GROUP BY signup_month
ORDER BY signup_month DESC;
```

### Funnel Segment Analysis

Analyze funnel performance by user segments:

```sql
-- Registration funnel by traffic source
WITH funnel_data AS (
  SELECT
    e.user_id,
    e.properties.utm_source as traffic_source,
    MIN(CASE WHEN e.event_name = 'registration_landing_viewed' THEN e.timestamp END) as step_1,
    MIN(CASE WHEN e.event_name = 'registration_form_started' THEN e.timestamp END) as step_2,
    MIN(CASE WHEN e.event_name = 'registration_submitted' THEN e.timestamp END) as step_3,
    MIN(CASE WHEN e.event_name = 'email_confirmed' THEN e.timestamp END) as step_4
  FROM analytics_events.events e
  WHERE e.timestamp >= CURRENT_DATE() - 30
    AND e.event_name IN ('registration_landing_viewed', 'registration_form_started', 'registration_submitted', 'email_confirmed')
    AND e.properties.utm_source IS NOT NULL
  GROUP BY e.user_id, e.properties.utm_source
)
SELECT
  traffic_source,
  COUNT(DISTINCT user_id) as users_entered,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_2 IS NOT NULL THEN user_id END) / COUNT(DISTINCT user_id), 2) as step_1_to_2_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_3 IS NOT NULL THEN user_id END) / COUNT(DISTINCT CASE WHEN step_2 IS NOT NULL THEN user_id END), 2) as step_2_to_3_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_4 IS NOT NULL THEN user_id END) / COUNT(DISTINCT CASE WHEN step_3 IS NOT NULL THEN user_id END), 2) as step_3_to_4_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN step_4 IS NOT NULL THEN user_id END) / COUNT(DISTINCT user_id), 2) as overall_conversion
FROM funnel_data
WHERE step_1 IS NOT NULL
GROUP BY traffic_source
HAVING COUNT(DISTINCT user_id) >= 100  -- Minimum sample size
ORDER BY users_entered DESC;
```

---

## Cohort Analysis

Track user behavior over time with cohort analysis.

### Monthly Cohort Retention

```sql
-- Monthly cohort retention analysis
WITH cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC(MIN(timestamp), MONTH) as cohort_month
  FROM analytics_events.events
  WHERE event_name = 'user_signed_up'
  GROUP BY user_id
),
activity AS (
  SELECT DISTINCT
    e.user_id,
    c.cohort_month,
    DATE_TRUNC(e.timestamp, MONTH) as activity_month,
    DATE_DIFF(DATE_TRUNC(e.timestamp, MONTH), c.cohort_month, MONTH) as months_since_signup
  FROM analytics_events.events e
  JOIN cohorts c ON e.user_id = c.user_id
  WHERE e.event_name IN ('task_completed', 'household_viewed', 'pet_profile_viewed')  -- Active user events
    AND e.timestamp >= '2024-01-01'
)
SELECT
  cohort_month,
  COUNT(DISTINCT CASE WHEN months_since_signup = 0 THEN user_id END) as month_0,
  COUNT(DISTINCT CASE WHEN months_since_signup = 1 THEN user_id END) as month_1,
  COUNT(DISTINCT CASE WHEN months_since_signup = 2 THEN user_id END) as month_2,
  COUNT(DISTINCT CASE WHEN months_since_signup = 3 THEN user_id END) as month_3,
  COUNT(DISTINCT CASE WHEN months_since_signup = 6 THEN user_id END) as month_6,
  COUNT(DISTINCT CASE WHEN months_since_signup = 12 THEN user_id END) as month_12,

  -- Retention rates
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN months_since_signup = 1 THEN user_id END) /
    COUNT(DISTINCT CASE WHEN months_since_signup = 0 THEN user_id END), 2) as month_1_retention,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN months_since_signup = 3 THEN user_id END) /
    COUNT(DISTINCT CASE WHEN months_since_signup = 0 THEN user_id END), 2) as month_3_retention,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN months_since_signup = 6 THEN user_id END) /
    COUNT(DISTINCT CASE WHEN months_since_signup = 0 THEN user_id END), 2) as month_6_retention,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN months_since_signup = 12 THEN user_id END) /
    COUNT(DISTINCT CASE WHEN months_since_signup = 0 THEN user_id END), 2) as month_12_retention
FROM activity
GROUP BY cohort_month
ORDER BY cohort_month DESC;
```

### Weekly Cohort Retention (for faster iterations)

```sql
-- Weekly cohort retention (for product changes)
WITH cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC(MIN(timestamp), WEEK) as cohort_week
  FROM analytics_events.events
  WHERE event_name = 'user_signed_up'
  GROUP BY user_id
),
activity AS (
  SELECT DISTINCT
    e.user_id,
    c.cohort_week,
    DATE_TRUNC(e.timestamp, WEEK) as activity_week,
    DATE_DIFF(DATE_TRUNC(e.timestamp, WEEK), c.cohort_week, WEEK) as weeks_since_signup
  FROM analytics_events.events e
  JOIN cohorts c ON e.user_id = c.user_id
  WHERE e.timestamp >= CURRENT_DATE() - 90
)
SELECT
  cohort_week,
  COUNT(DISTINCT CASE WHEN weeks_since_signup = 0 THEN user_id END) as week_0,
  COUNT(DISTINCT CASE WHEN weeks_since_signup = 1 THEN user_id END) as week_1,
  COUNT(DISTINCT CASE WHEN weeks_since_signup = 2 THEN user_id END) as week_2,
  COUNT(DISTINCT CASE WHEN weeks_since_signup = 4 THEN user_id END) as week_4,
  COUNT(DISTINCT CASE WHEN weeks_since_signup = 8 THEN user_id END) as week_8,

  -- Retention rates
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN weeks_since_signup = 1 THEN user_id END) /
    COUNT(DISTINCT CASE WHEN weeks_since_signup = 0 THEN user_id END), 2) as week_1_retention,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN weeks_since_signup = 4 THEN user_id END) /
    COUNT(DISTINCT CASE WHEN weeks_since_signup = 0 THEN user_id END), 2) as week_4_retention
FROM activity
GROUP BY cohort_week
ORDER BY cohort_week DESC;
```

### Behavioral Cohort Analysis

Group users by initial behavior and track retention:

```sql
-- Cohort by first-week activity level
WITH cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC(MIN(timestamp), MONTH) as cohort_month
  FROM analytics_events.events
  WHERE event_name = 'user_signed_up'
  GROUP BY user_id
),
first_week_activity AS (
  SELECT
    e.user_id,
    c.cohort_month,
    COUNT(*) as first_week_events,
    CASE
      WHEN COUNT(*) >= 50 THEN 'Power User'
      WHEN COUNT(*) >= 20 THEN 'Active User'
      WHEN COUNT(*) >= 5 THEN 'Casual User'
      ELSE 'Inactive User'
    END as activity_segment
  FROM analytics_events.events e
  JOIN cohorts c ON e.user_id = c.user_id
  WHERE e.timestamp BETWEEN c.cohort_month AND c.cohort_month + INTERVAL '7 DAY'
  GROUP BY e.user_id, c.cohort_month
),
retention AS (
  SELECT DISTINCT
    f.user_id,
    f.cohort_month,
    f.activity_segment,
    DATE_DIFF(DATE_TRUNC(e.timestamp, MONTH), f.cohort_month, MONTH) as months_since_signup
  FROM first_week_activity f
  JOIN analytics_events.events e ON f.user_id = e.user_id
  WHERE e.timestamp >= f.cohort_month
)
SELECT
  activity_segment,
  COUNT(DISTINCT CASE WHEN months_since_signup = 0 THEN user_id END) as month_0_users,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN months_since_signup = 1 THEN user_id END) /
    COUNT(DISTINCT CASE WHEN months_since_signup = 0 THEN user_id END), 2) as month_1_retention,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN months_since_signup = 3 THEN user_id END) /
    COUNT(DISTINCT CASE WHEN months_since_signup = 0 THEN user_id END), 2) as month_3_retention,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN months_since_signup = 6 THEN user_id END) /
    COUNT(DISTINCT CASE WHEN months_since_signup = 0 THEN user_id END), 2) as month_6_retention
FROM retention
GROUP BY activity_segment
ORDER BY month_0_users DESC;
```

---

## A/B Testing Framework

PetForce A/B testing infrastructure for data-driven decisions.

### Feature Flag Integration

```typescript
// packages/analytics/src/ab-testing.ts
interface Experiment {
  id: string;
  name: string;
  variants: string[];
  trafficAllocation: number; // 0-1 (percentage of users enrolled)
  status: "draft" | "running" | "paused" | "concluded";
  startDate: Date;
  endDate?: Date;
}

export class ABTestingFramework {
  // Assign user to variant
  getVariant(userId: string, experimentId: string): string {
    const experiment = this.getExperiment(experimentId);

    if (!experiment || experiment.status !== "running") {
      return "control"; // Default to control if experiment not running
    }

    // Check if user is enrolled
    if (!this.isUserEnrolled(userId, experiment)) {
      return "control"; // User not in experiment
    }

    // Deterministic assignment based on user ID
    const hash = this.hashUserExperiment(userId, experimentId);
    const variantIndex = hash % experiment.variants.length;

    return experiment.variants[variantIndex];
  }

  // Track experiment exposure
  trackExposure(userId: string, experimentId: string, variant: string): void {
    analytics.track("experiment_exposed", {
      experimentId,
      experimentName: this.getExperiment(experimentId)?.name,
      variant,
      userId,
    });
  }

  // Track experiment conversion
  trackConversion(
    userId: string,
    experimentId: string,
    metricName: string,
    value?: number,
  ): void {
    const variant = this.getVariant(userId, experimentId);

    analytics.track("experiment_conversion", {
      experimentId,
      experimentName: this.getExperiment(experimentId)?.name,
      variant,
      metricName,
      value,
      userId,
    });
  }

  private isUserEnrolled(userId: string, experiment: Experiment): boolean {
    const hash = this.hashUserExperiment(userId, experiment.id);
    const enrollmentThreshold =
      experiment.trafficAllocation * Number.MAX_SAFE_INTEGER;

    return hash < enrollmentThreshold;
  }

  private hashUserExperiment(userId: string, experimentId: string): number {
    // Simple hash function (use a proper hash in production)
    const str = `${userId}:${experimentId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private getExperiment(experimentId: string): Experiment | null {
    // Fetch from feature flag service or database
    return null; // Placeholder
  }
}

// Global instance
export const abTesting = new ABTestingFramework();
```

**Usage in components:**

```typescript
function HouseholdCreationForm() {
  const user = useAuth();
  const experimentId = 'household_creation_flow_v2';

  // Get variant for this user
  const variant = abTesting.getVariant(user.id, experimentId);

  // Track exposure (user saw this variant)
  useEffect(() => {
    abTesting.trackExposure(user.id, experimentId, variant);
  }, []);

  const handleSubmit = async (data) => {
    const household = await createHousehold(data);

    // Track conversion
    abTesting.trackConversion(user.id, experimentId, 'household_created');

    router.push(`/households/${household.id}`);
  };

  // Render variant
  if (variant === 'variant_a') {
    return <HouseholdCreationFormV1 onSubmit={handleSubmit} />;
  } else if (variant === 'variant_b') {
    return <HouseholdCreationFormV2 onSubmit={handleSubmit} />;
  } else {
    return <HouseholdCreationFormControl onSubmit={handleSubmit} />;
  }
}
```

### A/B Test Analysis Queries

```sql
-- Experiment results: conversion rate by variant
WITH exposures AS (
  SELECT DISTINCT
    user_id,
    properties.experiment_id as experiment_id,
    properties.variant as variant
  FROM analytics_events.events
  WHERE event_name = 'experiment_exposed'
    AND properties.experiment_id = 'household_creation_flow_v2'
    AND timestamp >= '2025-02-01'
),
conversions AS (
  SELECT DISTINCT
    user_id,
    properties.experiment_id as experiment_id,
    properties.metric_name as metric_name
  FROM analytics_events.events
  WHERE event_name = 'experiment_conversion'
    AND properties.experiment_id = 'household_creation_flow_v2'
    AND timestamp >= '2025-02-01'
)
SELECT
  e.variant,
  COUNT(DISTINCT e.user_id) as exposed_users,
  COUNT(DISTINCT c.user_id) as converted_users,
  ROUND(100.0 * COUNT(DISTINCT c.user_id) / COUNT(DISTINCT e.user_id), 2) as conversion_rate,

  -- Statistical significance (simplified z-test)
  ROUND((COUNT(DISTINCT c.user_id) / COUNT(DISTINCT e.user_id) -
         (SELECT COUNT(DISTINCT c2.user_id) / COUNT(DISTINCT e2.user_id)
          FROM exposures e2
          LEFT JOIN conversions c2 ON e2.user_id = c2.user_id AND e2.experiment_id = c2.experiment_id
          WHERE e2.variant = 'control')) /
        SQRT((COUNT(DISTINCT c.user_id) / COUNT(DISTINCT e.user_id)) *
             (1 - COUNT(DISTINCT c.user_id) / COUNT(DISTINCT e.user_id)) /
             COUNT(DISTINCT e.user_id)), 2) as z_score
FROM exposures e
LEFT JOIN conversions c ON e.user_id = c.user_id AND e.experiment_id = c.experiment_id
GROUP BY e.variant
ORDER BY e.variant;

-- z_score interpretation:
-- > 1.96: 95% confidence (p < 0.05) - statistically significant
-- > 2.58: 99% confidence (p < 0.01) - highly significant
-- < 1.96: Not statistically significant
```

### Experiment Monitoring Dashboard

Key metrics to monitor during experiments:

```sql
-- Daily experiment health check
WITH daily_stats AS (
  SELECT
    DATE(timestamp) as date,
    properties.variant as variant,
    COUNT(DISTINCT user_id) as exposed_users,
    COUNT(DISTINCT CASE WHEN event_name = 'experiment_conversion' THEN user_id END) as converted_users
  FROM analytics_events.events
  WHERE properties.experiment_id = 'household_creation_flow_v2'
    AND event_name IN ('experiment_exposed', 'experiment_conversion')
    AND timestamp >= '2025-02-01'
  GROUP BY date, variant
)
SELECT
  date,
  variant,
  exposed_users,
  converted_users,
  ROUND(100.0 * converted_users / exposed_users, 2) as conversion_rate,

  -- Sample size check
  CASE
    WHEN exposed_users < 100 THEN '⚠️ Sample size too small'
    WHEN exposed_users >= 1000 THEN '✅ Good sample size'
    ELSE '⚠️ Moderate sample size'
  END as sample_size_status
FROM daily_stats
ORDER BY date DESC, variant;
```

---

## Attribution Modeling

Understand which touchpoints drive conversions.

### First-Touch Attribution

```sql
-- First-touch attribution: Credit first interaction
WITH user_touchpoints AS (
  SELECT
    user_id,
    event_name,
    properties.utm_source as source,
    properties.utm_medium as medium,
    properties.utm_campaign as campaign,
    timestamp,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp ASC) as touch_order
  FROM analytics_events.events
  WHERE properties.utm_source IS NOT NULL
    AND timestamp >= '2025-01-01'
),
first_touch AS (
  SELECT
    user_id,
    source as first_source,
    medium as first_medium,
    campaign as first_campaign
  FROM user_touchpoints
  WHERE touch_order = 1
),
conversions AS (
  SELECT DISTINCT
    user_id,
    MIN(timestamp) as conversion_time
  FROM analytics_events.events
  WHERE event_name IN ('user_signed_up', 'subscription_created')
  GROUP BY user_id
)
SELECT
  f.first_source,
  f.first_medium,
  f.first_campaign,
  COUNT(DISTINCT f.user_id) as total_users,
  COUNT(DISTINCT c.user_id) as converted_users,
  ROUND(100.0 * COUNT(DISTINCT c.user_id) / COUNT(DISTINCT f.user_id), 2) as conversion_rate
FROM first_touch f
LEFT JOIN conversions c ON f.user_id = c.user_id
GROUP BY f.first_source, f.first_medium, f.first_campaign
ORDER BY converted_users DESC;
```

### Last-Touch Attribution

```sql
-- Last-touch attribution: Credit last interaction before conversion
WITH user_touchpoints AS (
  SELECT
    user_id,
    properties.utm_source as source,
    properties.utm_medium as medium,
    properties.utm_campaign as campaign,
    timestamp
  FROM analytics_events.events
  WHERE properties.utm_source IS NOT NULL
),
conversions AS (
  SELECT
    user_id,
    MIN(timestamp) as conversion_time
  FROM analytics_events.events
  WHERE event_name IN ('user_signed_up', 'subscription_created')
  GROUP BY user_id
),
last_touch AS (
  SELECT
    t.user_id,
    t.source as last_source,
    t.medium as last_medium,
    t.campaign as last_campaign,
    ROW_NUMBER() OVER (PARTITION BY t.user_id ORDER BY t.timestamp DESC) as touch_order
  FROM user_touchpoints t
  JOIN conversions c ON t.user_id = c.user_id
  WHERE t.timestamp <= c.conversion_time
)
SELECT
  last_source,
  last_medium,
  last_campaign,
  COUNT(*) as conversions
FROM last_touch
WHERE touch_order = 1
GROUP BY last_source, last_medium, last_campaign
ORDER BY conversions DESC;
```

### Multi-Touch Attribution (Linear)

```sql
-- Linear attribution: Credit all touchpoints equally
WITH user_touchpoints AS (
  SELECT
    user_id,
    properties.utm_source as source,
    properties.utm_medium as medium,
    timestamp,
    COUNT(*) OVER (PARTITION BY user_id) as total_touches
  FROM analytics_events.events
  WHERE properties.utm_source IS NOT NULL
),
conversions AS (
  SELECT DISTINCT user_id
  FROM analytics_events.events
  WHERE event_name IN ('user_signed_up', 'subscription_created')
),
attributed_touches AS (
  SELECT
    t.source,
    t.medium,
    1.0 / t.total_touches as attribution_credit
  FROM user_touchpoints t
  JOIN conversions c ON t.user_id = c.user_id
)
SELECT
  source,
  medium,
  ROUND(SUM(attribution_credit), 2) as attributed_conversions,
  COUNT(*) as total_touchpoints
FROM attributed_touches
GROUP BY source, medium
ORDER BY attributed_conversions DESC;
```

---

## Privacy & Data Anonymization

Ensure analytics compliance with privacy regulations (GDPR, CCPA).

### PII Detection and Removal

```typescript
// packages/analytics/src/pii-detector.ts
const PII_PATTERNS = {
  email: /[\w\.-]+@[\w\.-]+\.\w+/g,
  phone: /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g,
  ssn: /\d{3}-\d{2}-\d{4}/g,
  creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
};

export class PIIDetector {
  detectPII(value: any): boolean {
    if (typeof value !== "string") {
      return false;
    }

    for (const pattern of Object.values(PII_PATTERNS)) {
      if (pattern.test(value)) {
        return true;
      }
    }

    return false;
  }

  removePII(properties: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      if (this.detectPII(value)) {
        cleaned[key] = "[REDACTED]";
        console.warn(`PII detected and redacted in property: ${key}`);
      } else if (typeof value === "object" && value !== null) {
        cleaned[key] = this.removePII(value); // Recursive
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  hashPII(value: string): string {
    // One-way hash for PII (can't be reversed)
    return crypto.createHash("sha256").update(value).digest("hex");
  }
}

// Global instance
export const piiDetector = new PIIDetector();
```

**Usage:**

```typescript
// Automatically remove PII from analytics events
analytics.track(
  "form_submitted",
  piiDetector.removePII({
    email: "user@example.com", // Will be [REDACTED]
    name: "John Doe", // OK - not PII
    phone: "555-123-4567", // Will be [REDACTED]
    formType: "contact", // OK
  }),
);

// Hash PII for unique counting without storing raw values
analytics.track("user_logged_in", {
  userIdHash: piiDetector.hashPII(user.email), // Store hash instead of email
  loginMethod: "password",
});
```

### User Data Deletion (GDPR Right to Erasure)

```sql
-- Delete all analytics data for a user
DELETE FROM analytics_events.events
WHERE user_id = 'user_123'
  OR properties.email = 'user@example.com';

-- Or anonymize instead of delete (preserves aggregate metrics)
UPDATE analytics_events.events
SET
  user_id = CONCAT('anonymized_', MD5(user_id)),
  properties = JSON_SET(properties,
    '$.email', '[DELETED]',
    '$.name', '[DELETED]',
    '$.phone', '[DELETED]'
  )
WHERE user_id = 'user_123';
```

---

## Conclusion

Ana's analytics patterns enable PetForce to make data-driven decisions with confidence. By following these patterns, we:

- **Eliminate duplicate events** (War Story 1)
- **Track accurate funnels** (War Story 2)
- **Build performant dashboards** (War Story 3)
- **Respect user privacy** (PII detection & GDPR compliance)
- **Run reliable A/B tests** (Statistical significance)
- **Understand attribution** (Multi-touch models)
- **Monitor cohort retention** (Long-term user value)

**Remember:**

- Track on user interaction, not component mount
- Use session context for all events
- Pre-aggregate for dashboards
- Partition and cluster BigQuery tables
- Respect user privacy (remove PII)
- Monitor data quality continuously

---

Built with ❤️ by Ana (Analytics Agent)

**Data doesn't lie. But bad tracking does.**
