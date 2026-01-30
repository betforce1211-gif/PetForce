# Registration Analytics Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Web/Mobile)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Registration Flow Component                                  │  │
│  │                                                              │  │
│  │  1. User interaction → Track events                         │  │
│  │  2. Form submission  → Measure performance                  │  │
│  │  3. API call         → Send correlation_id                  │  │
│  │  4. Navigation       → Track success/failure                │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                               │
│                     ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Analytics Client (metrics.ts)                                │  │
│  │                                                              │  │
│  │  • Generates correlation_id                                 │  │
│  │  • Collects events in-memory                                │  │
│  │  • Sends to monitoring service                              │  │
│  │  • Provides real-time aggregation                           │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                               │
└─────────────────────┼───────────────────────────────────────────────┘
                      │
                      │ Events + Metrics
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (Backend)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Auth API (auth-api.ts)                                       │  │
│  │                                                              │  │
│  │  • Receives correlation_id from client                      │  │
│  │  • Logs registration_attempt_started                        │  │
│  │  • Logs registration_completed                              │  │
│  │  • Includes server-side metadata                            │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                               │
│                     ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Monitoring Service (monitoring.ts)                           │  │
│  │                                                              │  │
│  │  Backends:                                                   │  │
│  │  • Datadog (metrics + logs)                                 │  │
│  │  • Sentry (errors)                                          │  │
│  │  • CloudWatch (AWS logs)                                    │  │
│  │  • Console (development)                                    │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                               │
│                     ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Metrics Aggregation Service (NEW)                           │  │
│  │                                                              │  │
│  │  • Queries monitoring backend                               │  │
│  │  • Aggregates funnel metrics                                │  │
│  │  • Calculates performance percentiles                       │  │
│  │  • Groups errors by type/code                               │  │
│  │  • Caches results (30s TTL)                                 │  │
│  │  • Exposes /api/analytics/registration/summary              │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                               │
│                     ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Alert Engine (NEW)                                           │  │
│  │                                                              │  │
│  │  • Evaluates alert rules every 1 min                        │  │
│  │  • Checks navigation failure rate                           │  │
│  │  • Checks API error rate                                    │  │
│  │  • Checks verification rate                                 │  │
│  │  • Sends to PagerDuty / Slack / Email                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                      │
                      │ Aggregated Metrics
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DASHBOARD (Web UI)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ AuthMetricsDashboard.tsx                                     │  │
│  │                                                              │  │
│  │  ┌────────────┬────────────┬────────────┬────────────┐      │  │
│  │  │ Total Regs │ API Success│ Navigation │ Verify Rate│      │  │
│  │  │    247     │    92%     │    0% 🔴   │    0%      │      │  │
│  │  └────────────┴────────────┴────────────┴────────────┘      │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ 8-Stage Funnel Chart                                 │   │  │
│  │  │ [Shows navigation failure at stage 6]                │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  ┌─────────────────────┬────────────────────────────────┐   │  │
│  │  │ Performance Charts  │ Error Breakdown                │   │  │
│  │  │ (p50/p95/p99)      │ (By type and code)            │   │  │
│  │  └─────────────────────┴────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ Platform Comparison: Web vs Mobile                   │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  Updates every 30 seconds                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Event Flow with Correlation

```
Step  Client Event                    Server Event                   correlation_id
────────────────────────────────────────────────────────────────────────────────────
1     registration.page.viewed        -                              abc-123
      └─ timestamp: T0

2     registration.form.interaction   -                              abc-123
      └─ timestamp: T1 (T1-T0 = time to start)

3     registration.form.filled        -                              abc-123
      └─ timestamp: T2 (T2-T1 = fill time)

4     registration.submit.clicked     -                              abc-123
      └─ timestamp: T3

5     registration.performance        -                              abc-123
      └─ button_disable_latency: T3.1 - T3

6     [API Request] ────────────────> registration_attempt_started   abc-123
                                       └─ timestamp: T4

7                                      registration_completed         abc-123
      <──────────────────────────────  └─ timestamp: T5
                                       └─ api_latency: T5 - T4

8     registration.performance        -                              abc-123
      └─ api_response_time: T5 - T4
      └─ total_time: T5 - T3

9     registration.navigation.attempted -                            abc-123
      └─ timestamp: T6
      └─ target: /auth/verify-pending

10    registration.navigation.result  -                              abc-123
      └─ timestamp: T7
      └─ success: false (BUG!)
      └─ error: "Navigation blocked"

[User stuck, never reaches verify-pending page]

Expected but missing:
11    registration.verify_page.viewed -                              abc-123
12    email.verified                  email_confirmed                abc-123
```

## Data Schema

### Client Event Schema

```typescript
interface ClientEvent {
  event: string; // e.g., 'registration.form.interaction'
  timestamp: number; // Unix timestamp in ms
  correlation_id: string; // UUID linking all events for this user
  session_id?: string; // Browser session
  user_id?: string; // If logged in
  metadata: {
    [key: string]: any; // Event-specific data
  };
  device: {
    platform: "web" | "mobile";
    os?: string;
    browser?: string;
    screen_size?: string;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}
```

### Server Event Schema

```typescript
interface ServerEvent {
  event: string; // e.g., 'registration_completed'
  timestamp: string; // ISO 8601
  requestId: string; // Server request ID
  correlation_id: string; // From client (links events)
  metadata: {
    userId?: string;
    email: string; // Hashed
    [key: string]: any;
  };
  performance: {
    api_latency_ms?: number;
    db_query_ms?: number;
  };
}
```

### Aggregated Metrics Schema

```typescript
interface RegistrationMetrics {
  // Time period
  period: {
    start: string;
    end: string;
    duration_hours: number;
  };

  // Volume
  total_registrations: number;
  successful_api_calls: number;
  failed_api_calls: number;

  // Rates
  api_success_rate: number; // %
  navigation_success_rate: number; // % (CRITICAL)
  verification_rate: number; // % (PRIMARY)
  error_rate: number; // %

  // Funnel (8 stages)
  funnel: Array<{
    stage: number;
    label: string;
    count: number;
    percentage: number;
    drop_off_rate: number;
  }>;

  // Performance (percentiles)
  performance: {
    button_disable_latency: { p50: number; p95: number; p99: number };
    api_response_time: { p50: number; p95: number; p99: number };
    total_registration_time: { p50: number; p95: number; p99: number };
  };

  // Errors
  errors: {
    total: number;
    by_type: Record<string, number>;
    by_code: Record<string, number>;
    top_errors: Array<{ code: string; count: number; message: string }>;
  };

  // Cohorts
  cohorts: {
    by_platform: {
      web: Partial<RegistrationMetrics>;
      mobile: Partial<RegistrationMetrics>;
    };
  };

  // Alerts
  alerts: Array<{
    level: "critical" | "warning" | "info";
    message: string;
    timestamp: number;
  }>;
}
```

## Database Schema (for metrics aggregation)

```sql
-- Event storage (if not using external service like Datadog)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  correlation_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  platform VARCHAR(20), -- 'web' or 'mobile'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast aggregation
CREATE INDEX idx_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_events_correlation_id ON analytics_events(correlation_id);
CREATE INDEX idx_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_events_platform ON analytics_events(platform);

-- Materialized view for funnel (refreshed every 5 min)
CREATE MATERIALIZED VIEW registration_funnel_hourly AS
SELECT
  date_trunc('hour', timestamp) AS hour,
  platform,
  COUNT(*) FILTER (WHERE event_type = 'registration.page.viewed') AS page_viewed,
  COUNT(*) FILTER (WHERE event_type = 'registration.form.interaction') AS form_interaction,
  COUNT(*) FILTER (WHERE event_type = 'registration.form.filled') AS form_filled,
  COUNT(*) FILTER (WHERE event_type = 'registration.submit.clicked') AS submit_clicked,
  COUNT(*) FILTER (WHERE event_type = 'registration_completed') AS api_success,
  COUNT(*) FILTER (WHERE event_type = 'registration.navigation.result' AND metadata->>'success' = 'true') AS navigation_success,
  COUNT(*) FILTER (WHERE event_type = 'registration.verify_page.viewed') AS verify_page_viewed,
  COUNT(*) FILTER (WHERE event_type = 'email_confirmed') AS email_verified
FROM analytics_events
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY hour, platform;

-- Materialized view for performance (refreshed every 5 min)
CREATE MATERIALIZED VIEW registration_performance_hourly AS
SELECT
  date_trunc('hour', timestamp) AS hour,
  platform,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (metadata->>'button_disable_latency')::int) AS button_p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'button_disable_latency')::int) AS button_p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (metadata->>'button_disable_latency')::int) AS button_p99,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (metadata->>'api_response_time')::int) AS api_p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'api_response_time')::int) AS api_p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (metadata->>'api_response_time')::int) AS api_p99
FROM analytics_events
WHERE event_type = 'registration.performance'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY hour, platform;
```

## API Endpoints

### GET /api/analytics/registration/summary

```typescript
// Request
GET /api/analytics/registration/summary?timeRange=24h&platform=all

// Response
{
  "period": {
    "start": "2026-01-28T00:00:00Z",
    "end": "2026-01-29T00:00:00Z",
    "duration_hours": 24
  },
  "total_registrations": 247,
  "api_success_rate": 92,
  "navigation_success_rate": 0,  // THE BUG!
  "verification_rate": 0,
  "error_rate": 13,
  "funnel": [
    { "stage": 1, "label": "Page Viewed", "count": 1000, "percentage": 100, "drop_off_rate": 20 },
    { "stage": 2, "label": "Form Interaction", "count": 800, "percentage": 80, "drop_off_rate": 12 },
    // ... 6 more stages
  ],
  "performance": {
    "button_disable_latency": { "p50": 45, "p95": 89, "p99": 142 },
    "api_response_time": { "p50": 2100, "p95": 4800, "p99": 6200 },
    "total_registration_time": { "p50": 4200, "p95": 8100, "p99": 12000 }
  },
  "errors": {
    "total": 280,
    "by_type": {
      "navigation": 247,
      "api": 18,
      "validation": 12,
      "network": 3
    },
    "top_errors": [
      { "code": "NAVIGATION_BLOCKED", "count": 247, "message": "Navigation failed" },
      { "code": "EMAIL_EXISTS", "count": 18, "message": "Email already registered" }
    ]
  },
  "alerts": [
    {
      "level": "critical",
      "message": "Navigation failure rate: 100%",
      "timestamp": 1706400000000
    }
  ]
}
```

### POST /api/analytics/events (batch event ingestion)

```typescript
// Request
POST /api/analytics/events
{
  "events": [
    {
      "event": "registration.form.interaction",
      "correlation_id": "abc-123",
      "timestamp": 1706400000000,
      "metadata": { "first_field_touched": "email" }
    },
    {
      "event": "registration.form.filled",
      "correlation_id": "abc-123",
      "timestamp": 1706400015000,
      "metadata": { "time_to_fill": 15000 }
    }
  ]
}

// Response
{
  "success": true,
  "events_recorded": 2
}
```

## Monitoring Backend Configuration

### Datadog Setup

```typescript
// Environment variables
MONITORING_BACKEND=datadog
DATADOG_API_KEY=<api_key>
DATADOG_APP_KEY=<app_key>
DATADOG_SITE=datadoghq.com

// Metrics sent as:
// - auth.registration_attempt_started (count)
// - auth.registration_completed (count)
// - auth.registration.button_disable_latency (distribution)
// - auth.registration.api_response_time (distribution)

// Tags:
// - env:production
// - service:petforce-auth
// - platform:web|mobile
```

### Alert Rules in Datadog

```typescript
// Critical: Navigation failure
{
  "name": "Registration Navigation Failure",
  "query": "sum(last_5m):sum:auth.registration_completed{*} - sum:auth.registration.navigation_success{*} > 10",
  "message": "🚨 Navigation failures detected. No users reaching verification page.",
  "tags": ["team:engineering", "priority:critical"],
  "options": {
    "notify_no_data": false,
    "thresholds": {
      "critical": 10,
      "warning": 5
    }
  }
}

// Warning: Low verification rate
{
  "name": "Low Email Verification Rate",
  "query": "avg(last_1h):(sum:auth.email_confirmed{*} / sum:auth.registration_completed{*}) * 100 < 60",
  "message": "⚠️ Email verification rate below target (60%, target: 75%)",
  "tags": ["team:product", "priority:warning"],
  "options": {
    "thresholds": {
      "critical": 50,
      "warning": 60
    }
  }
}
```

## Caching Strategy

```typescript
// In-memory cache (server-side)
const metricsCache = new Map<
  string,
  { data: RegistrationMetrics; expires: number }
>();

function getMetrics(timeRange: string, platform: string): RegistrationMetrics {
  const cacheKey = `${timeRange}:${platform}`;
  const cached = metricsCache.get(cacheKey);

  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  // Fetch from DB or monitoring service
  const data = fetchMetricsFromDatadog(timeRange, platform);

  // Cache for 30 seconds
  metricsCache.set(cacheKey, {
    data,
    expires: Date.now() + 30_000,
  });

  return data;
}
```

## Scalability Considerations

### Current Scale (P0)

- ~1000 registrations/day
- ~10 events per registration
- ~10,000 events/day
- Dashboard: ~10 concurrent users

### Future Scale (P2)

- ~10,000 registrations/day
- ~10 events per registration
- ~100,000 events/day
- Dashboard: ~100 concurrent users

### Optimizations Needed for Scale

1. **Event batching**: Send events in batches every 5s (not real-time)
2. **Materialized views**: Pre-aggregate funnel data every 5 min
3. **Read replicas**: Separate analytics DB from production
4. **Time-series DB**: Consider TimescaleDB for time-series data
5. **CDN caching**: Cache dashboard static assets
6. **Query optimization**: Add composite indexes on timestamp + platform

---

**This architecture supports P0 requirements and scales to P2.**
