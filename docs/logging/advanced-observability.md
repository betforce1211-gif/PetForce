# Advanced Observability Patterns - PetForce

**Agent**: Larry (Logging/Observability)
**Excellence Level**: 90%+ Approval Rating
**Last Updated**: 2026-02-03

## Table of Contents

1. [Introduction](#introduction)
2. [Production War Stories](#production-war-stories)
3. [Advanced Distributed Tracing](#advanced-distributed-tracing)
4. [Log-Based SLIs & SLOs](#log-based-slis--slos)
5. [Real-Time Anomaly Detection](#real-time-anomaly-detection)
6. [Advanced Metrics & Instrumentation](#advanced-metrics--instrumentation)
7. [Log Aggregation at Scale](#log-aggregation-at-scale)
8. [Cost Optimization Strategies](#cost-optimization-strategies)
9. [Complex Troubleshooting Patterns](#complex-troubleshooting-patterns)
10. [Advanced Dashboard Design](#advanced-dashboard-design)
11. [Incident Response & Postmortems](#incident-response--postmortems)
12. [Observability as Code](#observability-as-code)
13. [Multi-Region & Global Observability](#multi-region--global-observability)
14. [AI/ML for Log Analysis](#aiml-for-log-analysis)
15. [Advanced Security Observability](#advanced-security-observability)

---

## Introduction

This guide covers advanced observability patterns learned from operating PetForce in production. These are battle-tested strategies for maintaining observability at scale, debugging complex distributed systems, and building world-class monitoring.

**Who This Is For**:

- Senior engineers building observability platforms
- SREs managing production systems
- Platform engineers designing monitoring infrastructure
- Anyone who's experienced a 3am production incident and wants to prevent the next one

**Prerequisites**:

- Deep understanding of structured logging (see [README.md](./README.md))
- Experience with distributed systems
- Familiarity with Prometheus, Grafana, OpenTelemetry
- Production operations experience

---

## Production War Stories

### War Story #1: The Silent Database Deadlock

**Situation**: Users reported intermittent 504 timeouts when creating households. Errors appeared random - sometimes it worked, sometimes it didn't. No error logs, no stack traces, just timeouts.

**Investigation**:

Initial logs showed clean execution paths up to the database call, then nothing:

```typescript
// Last log before silence
logger.info("Creating household in database", {
  correlationId: "req-xyz789",
  userId: "user-123",
  householdName: "[REDACTED]",
});

// ... 30 seconds of silence ...

// Timeout error
logger.error("Request timeout", {
  correlationId: "req-xyz789",
  duration_ms: 30000,
});
```

**Root Cause**: Database deadlocks caused by concurrent household creation with members. Postgres wasn't logging deadlocks at our log level.

**Solution Implemented**:

1. **Enhanced database query logging** with start/end markers:

```typescript
async function withQueryLogging<T>(
  queryName: string,
  query: () => Promise<T>,
  context: Record<string, any>,
): Promise<T> {
  const queryId = generateId();
  const start = Date.now();

  logger.info(`Database query start: ${queryName}`, {
    ...context,
    queryId,
    queryName,
  });

  try {
    const result = await query();
    const duration = Date.now() - start;

    logger.info(`Database query success: ${queryName}`, {
      ...context,
      queryId,
      queryName,
      duration_ms: duration,
    });

    // Alert on slow queries
    if (duration > 5000) {
      logger.warn(`Slow query detected: ${queryName}`, {
        ...context,
        queryId,
        duration_ms: duration,
        threshold_ms: 5000,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    logger.error(`Database query failed: ${queryName}`, error, {
      ...context,
      queryId,
      queryName,
      duration_ms: duration,
      errorCode: error.code,
      errorMessage: error.message,
    });

    // Check for deadlock
    if (error.code === "40P01") {
      // Postgres deadlock code
      logger.error("Database deadlock detected", error, {
        ...context,
        queryId,
        queryName,
        deadlockVictim: true,
      });

      // Increment deadlock counter for alerting
      metrics.increment("database.deadlock", {
        table: context.table || "unknown",
        operation: context.operation || "unknown",
      });
    }

    throw error;
  }
}

// Usage
await withQueryLogging(
  "create_household_with_members",
  async () => {
    return await db.transaction(async (tx) => {
      const household = await tx
        .insert(households)
        .values({
          name: input.name,
          ownerId: userId,
        })
        .returning();

      const member = await tx
        .insert(householdMembers)
        .values({
          householdId: household[0].id,
          userId,
          role: "owner",
        })
        .returning();

      return { household: household[0], member: member[0] };
    });
  },
  {
    correlationId: req.correlationId,
    userId,
    operation: "transaction",
    table: "households,household_members",
  },
);
```

2. **Added deadlock retry logic** with exponential backoff:

```typescript
async function withDeadlockRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === "40P01" && attempt < maxRetries) {
        const delay = Math.min(100 * Math.pow(2, attempt), 1000);

        logger.warn("Deadlock detected, retrying", {
          attempt,
          maxRetries,
          delay_ms: delay,
          errorCode: error.code,
        });

        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}
```

3. **Created deadlock dashboard** showing:
   - Deadlock rate over time
   - Tables involved in deadlocks
   - Operations triggering deadlocks
   - Retry success rate

**Lesson Learned**: Always log the start and end of critical operations, especially database transactions. Silence in logs is often more dangerous than errors.

---

### War Story #2: The Correlation ID That Wasn't

**Situation**: Users complained about slow household creation (3-5 seconds). We tried to trace the request using correlation IDs, but logs showed the operation completing in 150ms.

**Investigation**:

Logs showed fast execution:

```
10:45:23.123 - Request received (correlation: req-abc)
10:45:23.273 - Response sent (correlation: req-abc) duration: 150ms
```

But users were experiencing 3-5 second delays. The correlation ID wasn't capturing the full picture.

**Root Cause**: Client-side rendering delays after API response. The browser was blocking on heavy React re-renders after receiving household data.

**Solution Implemented**:

1. **End-to-end correlation IDs** that span client and server:

```typescript
// Client generates correlation ID
const correlationId = generateCorrelationId(); // client-abc123

// Client logs start
logger.info("Household creation started", {
  correlationId,
  timestamp: Date.now(),
  location: "client",
});

// API call with correlation ID in header
const response = await fetch("/api/households", {
  method: "POST",
  headers: {
    "x-correlation-id": correlationId,
    "x-client-timestamp": Date.now().toString(),
  },
  body: JSON.stringify(input),
});

// Server logs with same correlation ID
app.post("/api/households", (req, res) => {
  const correlationId = req.headers["x-correlation-id"];
  const clientTimestamp = parseInt(req.headers["x-client-timestamp"]);
  const networkLatency = Date.now() - clientTimestamp;

  logger.info("API request received", {
    correlationId,
    networkLatency_ms: networkLatency,
    location: "server",
  });

  // ... handle request ...

  logger.info("API response sent", {
    correlationId,
    duration_ms: Date.now() - startTime,
    location: "server",
  });
});

// Client logs after UI update
const household = await response.json();
await updateUI(household); // Render household

logger.info("Household creation completed", {
  correlationId,
  duration_ms: Date.now() - clientStartTime,
  location: "client",
  uiRenderTime_ms: Date.now() - responseReceivedTime,
});
```

2. **Performance markers** for client-side operations:

```typescript
// Mark performance milestones
performance.mark('household-create-start');

const response = await fetch('/api/households', ...);
performance.mark('household-api-complete');

const data = await response.json();
performance.mark('household-json-parsed');

await renderHousehold(data);
performance.mark('household-render-complete');

// Calculate durations
performance.measure(
  'household-api-call',
  'household-create-start',
  'household-api-complete'
);

performance.measure(
  'household-render',
  'household-api-complete',
  'household-render-complete'
);

// Log all measurements
const apiMeasure = performance.getEntriesByName('household-api-call')[0];
const renderMeasure = performance.getEntriesByName('household-render')[0];

logger.info('Client-side performance', {
  correlationId,
  api_duration_ms: apiMeasure.duration,
  render_duration_ms: renderMeasure.duration,
  total_duration_ms: apiMeasure.duration + renderMeasure.duration,
});
```

**Lesson Learned**: Correlation IDs must span the entire user journey, including client-side operations. Server-side performance is only half the story.

---

### War Story #3: The Log Storm That Cost $10,000

**Situation**: Our AWS bill showed $10,000 in CloudWatch Logs charges for a single day (normally $300/day). No outage, no incidents reported.

**Investigation**:

Queried CloudWatch to find the source:

```sql
-- CloudWatch Insights query
fields @timestamp, @message
| stats count() by @logStream
| sort count desc
| limit 10
```

Result: A single API instance was logging 500GB/day (normal: 2GB/day).

Digging deeper into that instance's logs:

```
11:23:45.123 - Health check OK
11:23:45.124 - Health check OK
11:23:45.125 - Health check OK
... (repeating every millisecond) ...
```

**Root Cause**: A health check endpoint was logging at `info` level, and a misconfigured load balancer was hitting it every 1ms instead of every 10s.

**Solution Implemented**:

1. **Log sampling for high-frequency endpoints**:

```typescript
// Sample rate map by endpoint
const LOG_SAMPLE_RATES: Record<string, number> = {
  "/health": 0.001, // 0.1% of health checks
  "/metrics": 0.01, // 1% of metrics requests
  "/api/households": 1, // 100% of business logic
};

function shouldLog(endpoint: string): boolean {
  const sampleRate = LOG_SAMPLE_RATES[endpoint] ?? 1;
  return Math.random() < sampleRate;
}

app.get("/health", (req, res) => {
  const isHealthy = checkHealth();

  if (shouldLog("/health")) {
    logger.debug("Health check", {
      status: isHealthy ? "healthy" : "unhealthy",
      sampled: true,
      sampleRate: LOG_SAMPLE_RATES["/health"],
    });
  }

  res.json({ status: isHealthy ? "ok" : "degraded" });
});
```

2. **Log volume monitoring** with alerts:

```typescript
// Track log volume by log level
const logVolumeCounter = new Counter({
  name: "log_volume_bytes_total",
  help: "Total log volume in bytes",
  labelNames: ["level", "endpoint"],
});

// Wrap logger to track volume
const originalInfo = logger.info;
logger.info = function (message: string, metadata?: object) {
  const logSize = JSON.stringify({ message, ...metadata }).length;
  logVolumeCounter.inc(
    { level: "info", endpoint: metadata?.endpoint || "unknown" },
    logSize,
  );

  return originalInfo.call(this, message, metadata);
};

// Alert if log volume > 100MB/hour for any instance
const alert = {
  name: "high-log-volume",
  query: "sum(rate(log_volume_bytes_total[1h])) > 100000000",
  severity: "warning",
  action: "Investigate log storm",
};
```

3. **Cost attribution dashboard**:

```typescript
// Estimate cost by log level and endpoint
const costByEndpoint = await cloudwatch.query({
  logGroupName: "/aws/petforce/api",
  query: `
    fields @timestamp, @message
    | stats sum(strlen(@message)) as bytes by endpoint, level
    | eval cost = bytes * 0.50 / 1000000000
    | sort cost desc
  `,
});

// Dashboard showing:
// - Cost per endpoint
// - Cost per log level
// - Projected monthly cost
// - Cost trending
```

**Lesson Learned**: Uncontrolled logging can cost more than the entire infrastructure. Always sample high-frequency endpoints and monitor log volume.

---

### War Story #4: The Invisible Race Condition

**Situation**: Household members occasionally saw stale data. When user A added a pet, user B (in same household) didn't see it until refreshing the page multiple times.

**Investigation**:

Logs showed both users' requests succeeding:

```
User A: POST /api/pets/add -> 201 Created
User B: GET /api/households/123 -> 200 OK (no new pet)
User B: GET /api/households/123 -> 200 OK (no new pet)
User B: GET /api/households/123 -> 200 OK (pet appears!)
```

The data was eventually consistent, but not immediately.

**Root Cause**: Cache invalidation race condition. User A's request invalidated the cache, but User B's read hit a replica cache node that hadn't been notified yet.

**Solution Implemented**:

1. **Cache versioning with logs**:

```typescript
// Track cache version in logs
let cacheVersion = 1;

async function invalidateHouseholdCache(householdId: string) {
  cacheVersion++;

  logger.info("Invalidating household cache", {
    householdId,
    cacheVersion,
    reason: "data_changed",
  });

  await redis.del(`household:${householdId}`);
  await redis.publish(
    "cache:invalidate",
    JSON.stringify({
      householdId,
      version: cacheVersion,
    }),
  );
}

async function getHousehold(householdId: string): Promise<Household> {
  const cachedVersion = await redis.get(`household:${householdId}:version`);
  const cached = await redis.get(`household:${householdId}`);

  logger.debug("Reading household from cache", {
    householdId,
    cacheHit: !!cached,
    cachedVersion,
    currentVersion: cacheVersion,
    stale: cachedVersion && parseInt(cachedVersion) < cacheVersion,
  });

  if (cached && parseInt(cachedVersion) === cacheVersion) {
    return JSON.parse(cached);
  }

  // Cache miss or stale - fetch from database
  const household = await db.query.households.findFirst({
    where: eq(households.id, householdId),
    with: { members: true, pets: true },
  });

  logger.info("Household fetched from database", {
    householdId,
    cacheVersion,
    memberCount: household.members.length,
    petCount: household.pets.length,
  });

  // Update cache with version
  await redis.set(
    `household:${householdId}`,
    JSON.stringify(household),
    "EX",
    300,
  );
  await redis.set(
    `household:${householdId}:version`,
    cacheVersion.toString(),
    "EX",
    300,
  );

  return household;
}
```

2. **Distributed cache invalidation logging**:

```typescript
// Subscribe to cache invalidation events
redis.subscribe("cache:invalidate", (message) => {
  const { householdId, version } = JSON.parse(message);

  logger.info("Received cache invalidation event", {
    householdId,
    version,
    instanceId: process.env.INSTANCE_ID,
    latency_ms: Date.now() - message.timestamp,
  });

  // Invalidate local cache
  localCache.del(householdId);
});
```

3. **Cache consistency dashboard**:

```typescript
// Track cache hit rate and staleness
const cacheMetrics = {
  hits: new Counter({ name: "cache_hits_total", labelNames: ["resource"] }),
  misses: new Counter({ name: "cache_misses_total", labelNames: ["resource"] }),
  stale: new Counter({
    name: "cache_stale_reads_total",
    labelNames: ["resource"],
  }),
  invalidations: new Counter({
    name: "cache_invalidations_total",
    labelNames: ["resource", "reason"],
  }),
};

// Dashboard shows:
// - Cache hit rate by resource
// - Stale read rate
// - Cache invalidation latency (pub/sub delay)
// - Cache version mismatches
```

**Lesson Learned**: Distributed caching requires meticulous logging of versions, invalidations, and consistency. What looks like "working" can hide subtle race conditions.

---

## Advanced Distributed Tracing

### Tracing Across Microservices

When a single user action triggers multiple services, standard correlation IDs aren't enough. We need distributed tracing with spans:

```typescript
// packages/tracing/src/distributed-tracer.ts
import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";

const tracer = trace.getTracer("petforce");
const propagator = new W3CTraceContextPropagator();

// Parent service (API Gateway)
export async function handleHouseholdCreate(req: Request, res: Response) {
  const span = tracer.startSpan("household.create", {
    attributes: {
      "http.method": req.method,
      "http.url": req.url,
      "user.id": req.user.id,
    },
  });

  try {
    // Create household in database
    const householdSpan = tracer.startSpan("database.insert.household", {
      parent: span,
    });
    const household = await db
      .insert(households)
      .values({
        name: req.body.name,
        ownerId: req.user.id,
      })
      .returning();
    householdSpan.end();

    // Call notification service
    const notifySpan = tracer.startSpan("notification.service.call", {
      parent: span,
    });

    // Inject trace context into HTTP headers
    const headers: Record<string, string> = {};
    propagator.inject(trace.setSpan(context.active(), notifySpan), headers, {
      set: (carrier, key, value) => {
        carrier[key] = value;
      },
    });

    await fetch("http://notification-service/notify", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: req.user.id,
        event: "household.created",
        householdId: household[0].id,
      }),
    });

    notifySpan.end();

    span.setStatus({ code: SpanStatusCode.OK });
    res.json(household[0]);
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}

// Child service (Notification Service)
export async function handleNotification(req: Request, res: Response) {
  // Extract trace context from headers
  const extractedContext = propagator.extract(context.active(), req.headers, {
    get: (carrier, key) => carrier[key],
    keys: (carrier) => Object.keys(carrier),
  });

  // Create child span under parent's trace
  const span = tracer.startSpan(
    "notification.send",
    {
      attributes: {
        "notification.event": req.body.event,
        "notification.userId": req.body.userId,
      },
    },
    extractedContext,
  );

  try {
    // Send email
    const emailSpan = tracer.startSpan("email.send", { parent: span });
    await sendEmail(req.body.userId, {
      subject: "Household Created",
      body: `Your household was created successfully!`,
    });
    emailSpan.end();

    // Send push notification
    const pushSpan = tracer.startSpan("push.send", { parent: span });
    await sendPushNotification(req.body.userId, {
      title: "Household Created",
      body: "Welcome to your new household!",
    });
    pushSpan.end();

    span.setStatus({ code: SpanStatusCode.OK });
    res.json({ success: true });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Trace Visualization

The trace will show the complete flow:

```
Trace ID: 7a8d5e3f2b1c9d6e
│
├─ household.create (250ms)
│  ├─ database.insert.household (50ms)
│  └─ notification.service.call (180ms)
│     ├─ HTTP call to notification-service (20ms)
│     │
│     └─ notification.send (160ms)
│        ├─ email.send (80ms)
│        └─ push.send (70ms)
```

### Custom Span Attributes

Add business context to spans:

```typescript
span.setAttributes({
  "household.id": household.id,
  "household.name": "[REDACTED]",
  "household.memberCount": household.members.length,
  "household.petCount": household.pets.length,
  "user.isPremium": user.isPremium,
  "user.householdCount": user.households.length,
});

// Query traces by business attributes
// "Find all household.create spans where household.petCount > 5"
```

### Sampling Strategies

Not all traces need to be collected (costs $$):

```typescript
import { Sampler, SamplingDecision } from "@opentelemetry/sdk-trace-base";

class AdaptiveSampler implements Sampler {
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
  ): SamplingDecision {
    // Always sample errors
    if (context.getValue("error")) {
      return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    }

    // Always sample slow operations
    const duration = context.getValue("duration_ms");
    if (duration && duration > 1000) {
      return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    }

    // Sample 1% of successful fast operations
    if (Math.random() < 0.01) {
      return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    }

    return { decision: SamplingDecision.NOT_RECORD };
  }
}
```

---

## Log-Based SLIs & SLOs

### Defining SLIs from Logs

Service Level Indicators (SLIs) measure user-facing performance:

```typescript
// SLI: Household creation success rate
// Definition: % of household creation requests that complete successfully in < 2s

// Log successful requests
logger.info("Household created", {
  event: "household.created",
  status: "success",
  duration_ms: 150,
});

// Log failed requests
logger.error("Household creation failed", {
  event: "household.created",
  status: "error",
  duration_ms: 1500,
  errorCategory: "database",
});

// Calculate SLI from logs (CloudWatch Insights)
const sliQuery = `
  fields @timestamp, status, duration_ms
  | filter event = "household.created"
  | stats
      sum(status = "success" and duration_ms < 2000) as good_requests,
      count(*) as total_requests
  | eval sli = good_requests / total_requests * 100
`;

// Result: SLI = 99.7% (997 good requests out of 1000)
```

### Setting SLOs

Service Level Objectives (SLOs) are targets for SLIs:

```typescript
// SLO: 99.5% of household creation requests succeed in < 2s over 30 days

const SLO_TARGET = 0.995; // 99.5%
const ERROR_BUDGET = 1 - SLO_TARGET; // 0.5%

// Track error budget consumption
logger.info("SLO measurement", {
  event: "slo.measured",
  sli: "household_create_success_rate",
  current_sli: 0.997,
  slo_target: 0.995,
  error_budget_remaining: (0.997 - 0.995) / ERROR_BUDGET, // 40% budget remaining
  measurement_window: "30d",
});

// Alert when error budget is low
if (errorBudgetRemaining < 0.2) {
  // 20% budget left
  logger.warn("Error budget low", {
    event: "slo.error_budget_low",
    sli: "household_create_success_rate",
    error_budget_remaining: errorBudgetRemaining,
    action: "reduce_risky_deployments",
  });
}
```

### SLO Dashboard

```typescript
// Grafana dashboard showing:
// 1. Current SLI vs SLO target
// 2. Error budget remaining (%)
// 3. Error budget burn rate
// 4. Time until error budget exhausted
// 5. Historical SLI trend

const sloDashboard = {
  title: "Household Creation SLO",
  panels: [
    {
      title: "SLI vs SLO",
      query: `
        sum(rate(household_create_success_total[5m]))
        /
        sum(rate(household_create_total[5m]))
      `,
      threshold: 0.995, // SLO target
    },
    {
      title: "Error Budget Remaining",
      query: `
        (current_sli - slo_target) / (1 - slo_target) * 100
      `,
      unit: "percent",
    },
    {
      title: "Error Budget Burn Rate",
      query: `
        rate(household_create_error_total[1h])
        /
        (total_requests * error_budget / 30d)
      `,
      description: "1.0 = burning at expected rate, >1.0 = burning too fast",
    },
  ],
};
```

---

## Real-Time Anomaly Detection

### Statistical Anomaly Detection

Detect unusual patterns in logs using statistical methods:

```typescript
// packages/anomaly-detection/src/detector.ts
export class AnomalyDetector {
  private baseline: Map<string, { mean: number; stddev: number }> = new Map();

  // Learn baseline from historical data
  async learnBaseline(metric: string, window: string = "7d") {
    const query = `
      fields @timestamp, ${metric}
      | stats avg(${metric}) as mean, stddev(${metric}) as stddev
    `;

    const result = await cloudwatch.query({ query });
    this.baseline.set(metric, {
      mean: result.mean,
      stddev: result.stddev,
    });

    logger.info("Baseline learned", {
      event: "anomaly_detection.baseline_learned",
      metric,
      mean: result.mean,
      stddev: result.stddev,
      window,
    });
  }

  // Check if current value is anomalous
  detectAnomaly(metric: string, value: number): boolean {
    const baseline = this.baseline.get(metric);
    if (!baseline) return false;

    // Z-score: number of standard deviations from mean
    const zScore = Math.abs(value - baseline.mean) / baseline.stddev;

    // Anomaly if > 3 standard deviations
    const isAnomaly = zScore > 3;

    if (isAnomaly) {
      logger.warn("Anomaly detected", {
        event: "anomaly_detection.anomaly_detected",
        metric,
        value,
        baseline_mean: baseline.mean,
        baseline_stddev: baseline.stddev,
        z_score: zScore,
      });
    }

    return isAnomaly;
  }
}

// Usage
const detector = new AnomalyDetector();
await detector.learnBaseline("household_create_duration_ms", "7d");

// Check each request
app.post("/api/households", async (req, res) => {
  const start = Date.now();
  const household = await createHousehold(req.body);
  const duration = Date.now() - start;

  // Check for anomaly
  const isAnomaly = detector.detectAnomaly(
    "household_create_duration_ms",
    duration,
  );

  logger.info("Household created", {
    duration_ms: duration,
    is_anomaly: isAnomaly,
  });

  res.json(household);
});
```

### Pattern-Based Anomaly Detection

Detect anomalous patterns in log sequences:

```typescript
// Detect unusual error sequences
export class PatternDetector {
  private recentErrors: string[] = [];
  private maxWindowSize = 100;

  detectAnomalousPattern(errorCode: string) {
    this.recentErrors.push(errorCode);

    // Keep only recent errors
    if (this.recentErrors.length > this.maxWindowSize) {
      this.recentErrors.shift();
    }

    // Pattern 1: Same error repeating rapidly
    const last10 = this.recentErrors.slice(-10);
    if (last10.every((code) => code === errorCode)) {
      logger.error("Error storm detected", {
        event: "anomaly_detection.error_storm",
        errorCode,
        count: 10,
        window: "10_consecutive",
      });
      return true;
    }

    // Pattern 2: Cascading failures (multiple different errors)
    if (last10.length === 10 && new Set(last10).size === 10) {
      logger.error("Cascading failures detected", {
        event: "anomaly_detection.cascading_failures",
        uniqueErrors: Array.from(new Set(last10)),
        count: 10,
      });
      return true;
    }

    // Pattern 3: Sudden spike (5x baseline rate)
    const last5Min = this.recentErrors.filter(
      (_, i) => i >= this.recentErrors.length - 50,
    );
    const errorRate = last5Min.length / 5; // errors per minute
    if (errorRate > baselineRate * 5) {
      logger.error("Error rate spike detected", {
        event: "anomaly_detection.error_spike",
        current_rate: errorRate,
        baseline_rate: baselineRate,
        multiplier: errorRate / baselineRate,
      });
      return true;
    }

    return false;
  }
}
```

---

## Advanced Metrics & Instrumentation

### Custom Prometheus Metrics

Go beyond standard metrics:

```typescript
// packages/metrics/src/custom-metrics.ts
import { register, Histogram, Summary, Counter, Gauge } from "prom-client";

// Request duration by user plan (free vs premium)
export const requestDurationByPlan = new Histogram({
  name: "http_request_duration_by_plan_seconds",
  help: "HTTP request duration by user plan",
  labelNames: ["method", "route", "status_code", "user_plan"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

// Track per-endpoint metrics
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const userPlan = req.user?.plan || "anonymous";

    requestDurationByPlan.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
        user_plan: userPlan,
      },
      duration,
    );
  });

  next();
});

// Household size distribution (how many pets per household?)
export const householdPetCount = new Histogram({
  name: "household_pet_count",
  help: "Distribution of pet counts per household",
  buckets: [0, 1, 2, 3, 5, 10, 20, 50],
});

householdPetCount.observe(household.pets.length);

// User engagement score (composite metric)
export const userEngagementScore = new Gauge({
  name: "user_engagement_score",
  help: "User engagement score (0-100)",
  labelNames: ["user_id"],
});

function calculateEngagementScore(user: User): number {
  let score = 0;

  // Login frequency (0-30 points)
  const daysSinceLastLogin =
    (Date.now() - user.lastLoginAt.getTime()) / 86400000;
  score += Math.max(0, 30 - daysSinceLastLogin);

  // Task completion rate (0-40 points)
  const completionRate = user.tasksCompleted / user.tasksCreated;
  score += completionRate * 40;

  // Household activity (0-30 points)
  const activeHouseholds = user.households.filter(
    (h) => h.lastActivityAt > Date.now() - 86400000 * 7,
  );
  score += Math.min(30, activeHouseholds.length * 10);

  return Math.min(100, score);
}

setInterval(() => {
  users.forEach((user) => {
    const score = calculateEngagementScore(user);
    userEngagementScore.set({ user_id: user.id }, score);

    logger.info("User engagement score calculated", {
      event: "metrics.user_engagement",
      userId: user.id,
      score,
    });
  });
}, 300000); // Every 5 minutes
```

### Application-Specific Metrics

Metrics that matter for PetForce:

```typescript
// Pet care compliance (are pets getting regular care?)
export const petCareCompliance = new Gauge({
  name: "pet_care_compliance_percent",
  help: "Percentage of pets receiving regular care tasks",
  labelNames: ["household_id", "pet_type"],
});

async function calculatePetCareCompliance(household: Household) {
  for (const pet of household.pets) {
    const requiredTasks = ["feed", "water", "exercise"];
    const completedTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.petId, pet.id),
        eq(tasks.status, "completed"),
        gte(tasks.completedAt, new Date(Date.now() - 86400000)), // Last 24h
      ),
    });

    const completedTaskTypes = new Set(completedTasks.map((t) => t.type));
    const compliance = completedTaskTypes.size / requiredTasks.length;

    petCareCompliance.set(
      { household_id: household.id, pet_type: pet.type },
      compliance * 100,
    );

    if (compliance < 0.5) {
      logger.warn("Low pet care compliance", {
        event: "pet_care.low_compliance",
        householdId: household.id,
        petId: pet.id,
        petType: pet.type,
        compliance_percent: compliance * 100,
      });
    }
  }
}

// Household collaboration score
export const householdCollaboration = new Gauge({
  name: "household_collaboration_score",
  help: "How well household members collaborate (0-100)",
  labelNames: ["household_id"],
});

function calculateCollaborationScore(household: Household): number {
  const members = household.members;
  if (members.length === 1) return 100; // Single-member households get max score

  // Calculate score based on:
  // 1. Task distribution evenness (are tasks evenly distributed?)
  const tasksPerMember = members.map((m) => m.completedTasks);
  const mean = tasksPerMember.reduce((a, b) => a + b, 0) / members.length;
  const variance =
    tasksPerMember.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
    members.length;
  const evenness = Math.max(0, 100 - variance);

  // 2. Communication frequency (comments, updates, etc.)
  const commentsPerDay = household.comments.length / household.ageInDays;
  const communication = Math.min(100, commentsPerDay * 10);

  // 3. Response time (how quickly do members respond to tasks?)
  const avgResponseTime =
    household.tasks.reduce((sum, t) => sum + t.responseTimeHours, 0) /
    household.tasks.length;
  const responsiveness = Math.max(0, 100 - avgResponseTime);

  return (evenness + communication + responsiveness) / 3;
}
```

---

## Log Aggregation at Scale

### Handling 1TB+/day of Logs

When you're processing terabytes of logs per day, standard approaches break down:

**Architecture for Scale**:

```
┌──────────────────────────────────────────────────────┐
│                  Application Layer                    │
│  1000+ instances generating 1TB/day of logs          │
└────────────┬─────────────────────────────────────────┘
             │
             ├─────────────────────────────────┐
             │                                 │
     ┌───────▼────────┐              ┌────────▼────────┐
     │  Fluent Bit    │              │  Fluent Bit     │
     │  (Local Agent) │              │  (Local Agent)  │
     └───────┬────────┘              └────────┬────────┘
             │                                 │
             └────────────┬────────────────────┘
                          │
                  ┌───────▼───────┐
                  │  Kafka Cluster│
                  │  (Buffer)     │
                  └───────┬───────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
  ┌─────▼─────┐    ┌──────▼──────┐   ┌────▼─────┐
  │ Consumer  │    │  Consumer   │   │ Consumer │
  │ (Process  │    │  (Process   │   │ (Archive)│
  │  & Index) │    │   & Index)  │   │          │
  └─────┬─────┘    └──────┬──────┘   └────┬─────┘
        │                 │                 │
  ┌─────▼─────┐    ┌──────▼──────┐   ┌────▼─────┐
  │Elasticsearch│  │Elasticsearch│   │    S3    │
  │  Shard 1   │   │  Shard 2    │   │ Archive  │
  └────────────┘   └─────────────┘   └──────────┘
```

**Fluent Bit Configuration for Scale**:

```conf
# fluent-bit.conf
[SERVICE]
    Flush         5
    Daemon        off
    Log_Level     info
    Parsers_File  parsers.conf

[INPUT]
    Name              tail
    Path              /var/log/petforce/*.log
    Parser            json
    Refresh_Interval  5
    Mem_Buf_Limit     50MB
    Skip_Long_Lines   On

[FILTER]
    Name    grep
    Match   *
    # Exclude health checks and metrics
    Exclude log health|metrics

[FILTER]
    Name    throttle
    Match   *
    Rate    10000
    Window  1
    Interval 1s

[OUTPUT]
    Name   kafka
    Match  *
    Brokers kafka1:9092,kafka2:9092,kafka3:9092
    Topics  petforce-logs
    Retry_Limit 3
```

**Kafka Consumer for Processing**:

```typescript
// packages/log-processor/src/consumer.ts
import { Kafka } from "kafkajs";
import { Client } from "@elastic/elasticsearch";

const kafka = new Kafka({
  clientId: "petforce-log-processor",
  brokers: ["kafka1:9092", "kafka2:9092", "kafka3:9092"],
});

const consumer = kafka.consumer({ groupId: "log-indexer" });
const es = new Client({ node: "http://elasticsearch:9200" });

await consumer.subscribe({ topic: "petforce-logs", fromBeginning: false });

await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
    const operations = [];

    for (const message of batch.messages) {
      const log = JSON.parse(message.value.toString());

      // Extract fields for indexing
      operations.push(
        {
          index: {
            _index: `petforce-logs-${getDateString()}`,
            _id: log.correlationId,
          },
        },
        log,
      );

      // Mark offset as processed
      resolveOffset(message.offset);

      // Send heartbeat to avoid rebalancing
      await heartbeat();
    }

    // Bulk index to Elasticsearch
    if (operations.length > 0) {
      await es.bulk({ operations });
    }
  },
});
```

### Index Management

Rotate indices daily to manage size:

```typescript
// Create index template
await es.indices.putIndexTemplate({
  name: "petforce-logs",
  index_patterns: ["petforce-logs-*"],
  template: {
    settings: {
      number_of_shards: 5,
      number_of_replicas: 1,
      refresh_interval: "10s",
      // Auto-delete indices older than 30 days
      "index.lifecycle.name": "petforce-logs-policy",
      "index.lifecycle.rollover_alias": "petforce-logs",
    },
    mappings: {
      properties: {
        "@timestamp": { type: "date" },
        level: { type: "keyword" },
        message: { type: "text" },
        correlationId: { type: "keyword" },
        userId: { type: "keyword" },
        householdId: { type: "keyword" },
        event: { type: "keyword" },
        duration_ms: { type: "long" },
        error: {
          properties: {
            message: { type: "text" },
            stack: { type: "text" },
            code: { type: "keyword" },
          },
        },
      },
    },
  },
});

// ILM policy for automatic retention
await es.ilm.putLifecycle({
  name: "petforce-logs-policy",
  policy: {
    phases: {
      hot: {
        actions: {
          rollover: {
            max_size: "50GB",
            max_age: "1d",
          },
        },
      },
      warm: {
        min_age: "7d",
        actions: {
          readonly: {},
          shrink: {
            number_of_shards: 1,
          },
        },
      },
      cold: {
        min_age: "30d",
        actions: {
          freeze: {},
        },
      },
      delete: {
        min_age: "90d",
        actions: {
          delete: {},
        },
      },
    },
  },
});
```

---

## Cost Optimization Strategies

### Log Sampling by Importance

Not all logs are equally valuable:

```typescript
// Sampling strategy
enum LogImportance {
  CRITICAL = 1.0, // 100% sampling (errors, security events)
  HIGH = 0.5, // 50% sampling (business events)
  MEDIUM = 0.1, // 10% sampling (debug info)
  LOW = 0.01, // 1% sampling (verbose details)
}

function getLogImportance(level: string, event: string): LogImportance {
  // Always log errors and security events
  if (level === "error" || event.startsWith("security.")) {
    return LogImportance.CRITICAL;
  }

  // Business events at high importance
  if (event.includes("created") || event.includes("completed")) {
    return LogImportance.HIGH;
  }

  // Debug logs at low importance
  if (level === "debug") {
    return LogImportance.LOW;
  }

  return LogImportance.MEDIUM;
}

function shouldSendLog(level: string, event: string): boolean {
  const importance = getLogImportance(level, event);
  return Math.random() < importance;
}

// Wrap logger with sampling
const originalInfo = logger.info;
logger.info = function (message: string, metadata?: any) {
  if (shouldSendLog("info", metadata?.event || "")) {
    metadata.sampled = true;
    metadata.sampleRate = getLogImportance("info", metadata?.event || "");
    return originalInfo.call(this, message, metadata);
  }
};
```

### Dynamic Sampling Based on Error Rate

Increase sampling when errors spike:

```typescript
class AdaptiveSampler {
  private errorRate = 0;
  private baselineSampleRate = 0.1;

  updateErrorRate(rate: number) {
    this.errorRate = rate;
  }

  getSampleRate(level: string): number {
    // Always sample errors
    if (level === "error") return 1.0;

    // Increase sampling proportionally to error rate
    if (this.errorRate > 0.05) {
      // 5% errors
      return Math.min(
        1.0,
        this.baselineSampleRate * (this.errorRate / 0.05) * 10,
      );
    }

    return this.baselineSampleRate;
  }
}

// Update error rate periodically
setInterval(async () => {
  const errorRate = await calculateErrorRate();
  sampler.updateErrorRate(errorRate);

  logger.info("Sample rate adjusted", {
    event: "logging.sample_rate_adjusted",
    errorRate,
    newSampleRate: sampler.getSampleRate("info"),
  });
}, 60000); // Every minute
```

### Cost Attribution & Budgets

Track logging costs per team/service:

```typescript
// Tag logs with cost center
logger.info("User action", {
  event: "user.action",
  costCenter: "team-platform", // or 'team-mobile', 'team-web'
  service: "api-gateway",
});

// Query cost per team
const costQuery = `
  fields @timestamp, @message, costCenter
  | stats sum(strlen(@message)) as bytes by costCenter
  | eval cost = bytes * 0.50 / 1000000000
  | sort cost desc
`;

// Result:
// team-platform: $250/month
// team-mobile: $180/month
// team-web: $120/month

// Set cost budgets and alert when exceeded
const COST_BUDGETS = {
  "team-platform": 300, // $300/month
  "team-mobile": 200,
  "team-web": 150,
};

if (actualCost[team] > COST_BUDGETS[team]) {
  logger.warn("Logging cost budget exceeded", {
    event: "cost.budget_exceeded",
    team,
    budget: COST_BUDGETS[team],
    actual: actualCost[team],
    overage: actualCost[team] - COST_BUDGETS[team],
  });
}
```

---

## Complex Troubleshooting Patterns

### The "Heisenbug" Pattern

Bugs that disappear when you try to observe them:

**Scenario**: Users report household data occasionally showing wrong member count. When we add debug logging to investigate, the bug stops happening.

**Root Cause**: Race condition that's timing-sensitive. Adding logs changes timing, masking the bug.

**Solution**: Asynchronous debug logging that doesn't affect timing:

```typescript
// Non-blocking debug logger
class AsyncDebugLogger {
  private buffer: any[] = [];
  private worker: Worker;

  constructor() {
    this.worker = new Worker("./debug-logger-worker.js");
    this.worker.on("message", (msg) => {
      if (msg.type === "flushed") {
        this.buffer = [];
      }
    });
  }

  debug(message: string, metadata: any) {
    // Add to buffer without blocking
    this.buffer.push({ message, metadata, timestamp: Date.now() });

    // Flush if buffer is full
    if (this.buffer.length > 100) {
      this.flush();
    }
  }

  flush() {
    // Send to worker thread (non-blocking)
    this.worker.postMessage({ type: "flush", logs: this.buffer });
  }
}

// Use in race-condition-prone code
async function getHouseholdMemberCount(householdId: string): Promise<number> {
  asyncDebugLogger.debug("Getting member count START", {
    householdId,
    timestamp: Date.now(),
  });

  const members = await db.query.householdMembers.findMany({
    where: eq(householdMembers.householdId, householdId),
  });

  asyncDebugLogger.debug("Getting member count END", {
    householdId,
    count: members.length,
    timestamp: Date.now(),
  });

  return members.length;
}
```

### The "Needle in a Haystack" Pattern

Finding the one bad request among millions:

**Scenario**: One user complains about a specific household creation failure 3 days ago, but we have 10 million logs from that day.

**Solution**: Indexed queries with filters:

```
// Query strategy:
// 1. Start broad, narrow down
event:household.created status:error @timestamp:[NOW-4d TO NOW-2d]

// Result: 1,245 failed household creations

// 2. Add user ID (from support ticket)
event:household.created status:error userId:user-12345 @timestamp:[NOW-4d TO NOW-2d]

// Result: 1 failure

// 3. Get correlation ID
correlationId:req-abc123

// Result: Complete trace of the failed request
```

### The "Ghost Load" Pattern

System load appears high, but no obvious cause:

**Scenario**: API response times degrade during "off-peak" hours (2am-4am). No scheduled jobs, no traffic spikes.

**Investigation**:

```typescript
// Add resource utilization logging
setInterval(() => {
  const usage = process.memoryUsage();
  const cpu = process.cpuUsage();

  logger.info("Resource usage", {
    event: "system.resource_usage",
    memory_mb: usage.heapUsed / 1024 / 1024,
    cpu_user: cpu.user,
    cpu_system: cpu.system,
    active_connections: server.connections,
    event_loop_delay: eventLoopDelay,
  });
}, 60000); // Every minute

// Query for anomalies
const usageQuery = `
  fields @timestamp, event_loop_delay, active_connections
  | filter event = "system.resource_usage"
  | filter @timestamp >= NOW-7d
  | stats avg(event_loop_delay) as avg_delay by bin(@timestamp, 1h)
  | sort @timestamp desc
`;

// Result: Event loop delay spikes at 2am-4am
// Cause: Automated database backups blocking event loop
```

**Solution**: Off-load backups to replica, add load shedding during backups.

---

## Advanced Dashboard Design

### Hierarchical Dashboards

Navigate from high-level overview to detailed drill-downs:

```
Level 1: Executive Dashboard (30 second glance)
├─ Overall Health (Green/Yellow/Red)
├─ Key Metrics (DAU, Error Rate, P95 Latency)
└─ Incidents (Open/Resolved)

Level 2: Service Dashboard (5 minute analysis)
├─ Request Rate by Endpoint
├─ Error Rate by Category
├─ Latency Distribution (P50/P95/P99)
└─ Top Errors (with links to Level 3)

Level 3: Endpoint Dashboard (Deep investigation)
├─ Request Rate Timeline
├─ Error Rate Timeline
├─ Latency Heatmap
├─ Sample Traces (links to Jaeger)
└─ Recent Errors (links to logs)

Level 4: Log Viewer (Detailed debugging)
├─ Full log context for a specific request
├─ Distributed trace across services
└─ Related errors and warnings
```

### Anomaly Highlighting

Automatically highlight unusual patterns:

```typescript
// Dashboard query that highlights anomalies
const query = `
  fields @timestamp, duration_ms, statusCode
  | stats
      avg(duration_ms) as avg_duration,
      stddev(duration_ms) as stddev_duration,
      count(*) as request_count
    by bin(@timestamp, 5m), statusCode
  | eval
      upper_bound = avg_duration + 3 * stddev_duration,
      lower_bound = avg_duration - 3 * stddev_duration,
      is_anomaly = avg_duration > upper_bound or avg_duration < lower_bound
  | filter is_anomaly = true
`;

// Visualization: Time series with anomalies highlighted in red
```

### Correlation Heatmaps

Visualize relationships between metrics:

```typescript
// Correlation between error rate and latency
const correlationQuery = `
  fields @timestamp, errorRate, p95Latency
  | stats
      avg(errorRate) as avg_error,
      avg(p95Latency) as avg_latency
    by bin(@timestamp, 1h)
  | eval correlation = (avg_error - mean_error) * (avg_latency - mean_latency)
`;

// Heatmap showing:
// - X-axis: Error rate
// - Y-axis: P95 latency
// - Color: Request count
// - Size: Number of affected users
```

---

## Incident Response & Postmortems

### Incident Timeline Reconstruction

Automatically generate incident timelines from logs:

```typescript
// packages/incident-response/src/timeline.ts
export async function reconstructIncidentTimeline(
  startTime: Date,
  endTime: Date,
  correlationId?: string,
): Promise<IncidentTimeline> {
  const query = `
    fields @timestamp, level, event, message, correlationId, userId
    | filter @timestamp >= ${startTime.getTime()} and @timestamp <= ${endTime.getTime()}
    ${correlationId ? `| filter correlationId = "${correlationId}"` : ""}
    | sort @timestamp asc
  `;

  const logs = await cloudwatch.query({ query });

  const timeline: IncidentEvent[] = logs.map((log) => ({
    timestamp: new Date(log["@timestamp"]),
    level: log.level,
    event: log.event,
    message: log.message,
    correlationId: log.correlationId,
    userId: log.userId,
  }));

  // Annotate with context
  return {
    timeline,
    summary: generateSummary(timeline),
    rootCause: identifyRootCause(timeline),
    affectedUsers: new Set(timeline.map((e) => e.userId)).size,
    errorCount: timeline.filter((e) => e.level === "error").length,
  };
}

function generateSummary(timeline: IncidentEvent[]): string {
  const firstError = timeline.find((e) => e.level === "error");
  const errorCount = timeline.filter((e) => e.level === "error").length;
  const duration =
    timeline[timeline.length - 1].timestamp.getTime() -
    timeline[0].timestamp.getTime();

  return `
    Incident Duration: ${duration / 1000}s
    First Error: ${firstError?.message}
    Total Errors: ${errorCount}
    Affected Users: ${affectedUsers}
  `;
}
```

### Automated Postmortem Reports

Generate postmortem skeleton from logs:

```typescript
export async function generatePostmortem(
  incidentId: string,
  startTime: Date,
  endTime: Date,
): Promise<string> {
  const timeline = await reconstructIncidentTimeline(startTime, endTime);

  return `
# Postmortem: ${incidentId}

## Summary

**Date**: ${startTime.toISOString()}
**Duration**: ${(endTime.getTime() - startTime.getTime()) / 1000}s
**Severity**: ${calculateSeverity(timeline)}
**Affected Users**: ${timeline.affectedUsers}

## Timeline

${timeline.timeline.map((e) => `- ${e.timestamp.toISOString()}: ${e.message}`).join("\n")}

## Root Cause

${timeline.rootCause}

## Impact

- Total errors: ${timeline.errorCount}
- Affected users: ${timeline.affectedUsers}
- Failed operations: ${timeline.timeline.filter((e) => e.event.includes("failed")).length}

## Detection

${generateDetectionSection(timeline)}

## Resolution

${generateResolutionSection(timeline)}

## Action Items

${generateActionItems(timeline)}
  `;
}
```

---

## Observability as Code

### Terraform for Observability Infrastructure

```hcl
# terraform/observability.tf

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/petforce/api"
  retention_in_days = 90

  tags = {
    Environment = var.environment
    Service     = "api"
    CostCenter  = "platform"
  }
}

# Metric Filters
resource "aws_cloudwatch_log_metric_filter" "error_rate" {
  name           = "api-error-rate"
  log_group_name = aws_cloudwatch_log_group.api_logs.name
  pattern        = "[timestamp, request_id, level = ERROR, ...]"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "PetForce/API"
    value     = "1"
  }
}

# Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "petforce-api-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "PetForce/API"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Triggers when error rate exceeds 10 errors per 5 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

# DataDog Monitors (via Terraform)
resource "datadog_monitor" "api_latency" {
  name    = "High API Latency"
  type    = "metric alert"
  message = "API latency is above threshold. @pagerduty"

  query = "avg(last_5m):avg:petforce.api.latency.p95{*} > 2000"

  thresholds = {
    critical = 2000
    warning  = 1500
  }

  tags = ["service:api", "env:production"]
}
```

### GitOps for Dashboard Management

```yaml
# dashboards/api-health.yaml
apiVersion: v1
kind: GrafanaDashboard
metadata:
  name: api-health
  namespace: observability
spec:
  json: |
    {
      "dashboard": {
        "title": "API Health",
        "panels": [
          {
            "title": "Request Rate",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total[5m]))"
              }
            ]
          },
          {
            "title": "Error Rate",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total{status_code=~'5..'}[5m])) / sum(rate(http_requests_total[5m]))"
              }
            ]
          }
        ]
      }
    }
```

---

## Multi-Region & Global Observability

### Cross-Region Log Aggregation

```typescript
// Aggregate logs from multiple regions
const regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"];

async function queryAllRegions(query: string, startTime: Date, endTime: Date) {
  const results = await Promise.all(
    regions.map(async (region) => {
      const client = new CloudWatchLogsClient({ region });
      return await client.query({ query, startTime, endTime });
    }),
  );

  // Merge and sort by timestamp
  const merged = results.flat().sort((a, b) => a.timestamp - b.timestamp);

  logger.info("Cross-region query completed", {
    event: "observability.cross_region_query",
    regions: regions.length,
    totalResults: merged.length,
    query,
  });

  return merged;
}
```

### Global Request Tracing

Trace requests across regions:

```typescript
// Request starts in us-east-1
const span = tracer.startSpan("global-request", {
  attributes: {
    "request.region": "us-east-1",
    "request.id": requestId,
  },
});

// Call EU service
const euResponse = await fetch("https://api-eu.petforce.com/process", {
  headers: {
    "x-trace-id": span.spanContext().traceId,
    "x-span-id": span.spanContext().spanId,
    "x-origin-region": "us-east-1",
  },
});

// EU service continues the trace
app.post("/process", (req, res) => {
  const parentTrace = req.headers["x-trace-id"];
  const parentSpan = req.headers["x-span-id"];

  const span = tracer.startSpan("eu-processing", {
    attributes: {
      "request.region": "eu-west-1",
      "request.origin_region": req.headers["x-origin-region"],
    },
    links: [
      {
        context: { traceId: parentTrace, spanId: parentSpan },
      },
    ],
  });

  // Process...

  span.end();
});
```

---

## AI/ML for Log Analysis

### Anomaly Detection with ML

```typescript
// Train model on historical logs
import * as tf from "@tensorflow/tfjs-node";

async function trainAnomalyModel(historicalLogs: LogEvent[]) {
  // Extract features
  const features = historicalLogs.map((log) => [
    log.duration_ms,
    log.statusCode,
    log.requestSize,
    log.responseSize,
    new Date(log.timestamp).getHours(), // Hour of day
  ]);

  // Normalize
  const normalized = tf.tensor2d(features).div(tf.max(tf.tensor2d(features)));

  // Autoencoder model
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [5], units: 3, activation: "relu" }),
      tf.layers.dense({ units: 5, activation: "sigmoid" }),
    ],
  });

  model.compile({ optimizer: "adam", loss: "meanSquaredError" });

  // Train
  await model.fit(normalized, normalized, {
    epochs: 50,
    batchSize: 32,
  });

  return model;
}

// Detect anomalies in real-time
async function detectAnomaly(
  log: LogEvent,
  model: tf.LayersModel,
): Promise<boolean> {
  const features = tf.tensor2d([
    [
      log.duration_ms,
      log.statusCode,
      log.requestSize,
      log.responseSize,
      new Date(log.timestamp).getHours(),
    ],
  ]);

  const prediction = model.predict(features) as tf.Tensor;
  const reconstructionError = tf.losses
    .meanSquaredError(features, prediction)
    .dataSync()[0];

  // High reconstruction error = anomaly
  const isAnomaly = reconstructionError > 0.1;

  if (isAnomaly) {
    logger.warn("ML anomaly detected", {
      event: "ml.anomaly_detected",
      reconstructionError,
      log,
    });
  }

  return isAnomaly;
}
```

### Log Clustering

Group similar errors automatically:

```typescript
import { kmeans } from "ml-kmeans";

async function clusterErrors(errorLogs: LogEvent[]): Promise<ErrorCluster[]> {
  // Vectorize error messages (TF-IDF)
  const vectors = errorLogs.map((log) => vectorizeMessage(log.message));

  // Cluster with k-means
  const result = kmeans(vectors, 5); // 5 clusters

  const clusters: ErrorCluster[] = result.clusters.map((clusterIndex, i) => ({
    id: clusterIndex,
    errors: errorLogs.filter((_, j) => result.clusters[j] === clusterIndex),
    representative: findCentroid(
      errorLogs.filter((_, j) => result.clusters[j] === clusterIndex),
    ),
  }));

  logger.info("Error clustering completed", {
    event: "ml.error_clustering",
    totalErrors: errorLogs.length,
    clusters: clusters.length,
    topCluster: clusters[0].errors.length,
  });

  return clusters;
}
```

---

## Advanced Security Observability

### Security Event Correlation

Correlate security events across services to detect attacks:

```typescript
// Track security events
export class SecurityEventCorrelator {
  private events: Map<string, SecurityEvent[]> = new Map();

  recordEvent(event: SecurityEvent) {
    const key = event.userId || event.ipAddress;
    if (!this.events.has(key)) {
      this.events.set(key, []);
    }

    this.events.get(key)!.push(event);

    // Check for attack patterns
    this.checkForAttackPatterns(key);
  }

  private checkForAttackPatterns(key: string) {
    const events = this.events.get(key)!;
    const recent = events.filter(
      (e) => Date.now() - e.timestamp.getTime() < 300000,
    ); // Last 5 min

    // Pattern 1: Multiple failed login attempts
    const failedLogins = recent.filter((e) => e.type === "login_failed");
    if (failedLogins.length > 5) {
      logger.error("Brute force attack detected", {
        event: "security.brute_force_detected",
        userId: key,
        attemptCount: failedLogins.length,
        timeWindow: "5m",
      });
    }

    // Pattern 2: Privilege escalation attempts
    const escalationAttempts = recent.filter(
      (e) => e.type === "permission_denied",
    );
    if (escalationAttempts.length > 3) {
      logger.error("Privilege escalation attempt detected", {
        event: "security.privilege_escalation_detected",
        userId: key,
        attemptCount: escalationAttempts.length,
      });
    }

    // Pattern 3: Data exfiltration (high download volume)
    const dataAccess = recent.filter((e) => e.type === "data_accessed");
    const totalBytes = dataAccess.reduce((sum, e) => sum + e.bytesAccessed, 0);
    if (totalBytes > 100000000) {
      // 100MB
      logger.error("Potential data exfiltration detected", {
        event: "security.data_exfiltration_detected",
        userId: key,
        totalBytes,
        requestCount: dataAccess.length,
      });
    }
  }
}
```

---

## Conclusion

Advanced observability is not just about collecting logs—it's about building systems that help you understand, debug, and improve your application. The patterns in this guide are battle-tested from operating PetForce in production.

**Key Takeaways**:

1. **Correlation is everything**: Without correlation IDs, distributed debugging is impossible
2. **Sample intelligently**: Not all logs are equal—focus on what matters
3. **Automate analysis**: Use ML and statistical methods to find patterns humans miss
4. **Build for scale**: 1TB/day of logs requires different architecture than 1GB/day
5. **Optimize costs**: Uncontrolled logging can bankrupt you
6. **Think in SLOs**: Measure what users care about, not just what's easy to measure
7. **Incident response matters**: Good observability reduces MTTR by 10x

**Remember Larry's Motto**: "If it's not logged, it didn't happen. If it's not monitored, it will fail."

Now go build world-class observability! 🚀📊
