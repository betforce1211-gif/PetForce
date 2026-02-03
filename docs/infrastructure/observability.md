# Observability & Monitoring Guide

**Owner**: Isabel (Infrastructure Agent) + Larry (Logging Agent)
**Last Updated**: 2026-02-02

This guide provides comprehensive observability patterns for PetForce infrastructure. Covers metrics, logs, traces, and alerts.

---

## Table of Contents

1. [Observability Philosophy](#observability-philosophy)
2. [The Three Pillars](#the-three-pillars)
3. [Metrics](#metrics)
4. [Logs](#logs)
5. [Distributed Tracing](#distributed-tracing)
6. [Alerting](#alerting)
7. [Dashboards](#dashboards)
8. [SLOs and SLIs](#slos-and-slis)
9. [On-Call Runbooks](#on-call-runbooks)

---

## Observability Philosophy

### The Four Golden Signals

**From Google's SRE Book**:

1. **Latency** - How long does a request take?
2. **Traffic** - How many requests are we receiving?
3. **Errors** - What is the error rate?
4. **Saturation** - How full is our system?

**For PetForce**:

| Signal     | Metric              | Alert Threshold             |
| ---------- | ------------------- | --------------------------- |
| Latency    | p99 response time   | > 1000ms for 5 minutes      |
| Traffic    | Requests per second | < 50% of baseline (outage?) |
| Errors     | 5xx error rate      | > 1% for 5 minutes          |
| Saturation | CPU utilization     | > 80% for 10 minutes        |

### Observability vs Monitoring

**Monitoring** (traditional):

- "Is the system up?"
- Predefined dashboards and alerts
- Known unknowns

**Observability** (modern):

- "Why is the system slow?"
- Ad-hoc queries on high-cardinality data
- Unknown unknowns

**PetForce uses both**:

- Monitoring for known issues (CPU high, disk full)
- Observability for debugging novel issues (why is this user's request slow?)

---

## The Three Pillars

### 1. Metrics (What Happened)

**Time-series data** - numbers over time.

```
cpu_usage{pod="api-abc123"} 0.45 @ 2026-02-02T10:00:00Z
cpu_usage{pod="api-abc123"} 0.52 @ 2026-02-02T10:00:10Z
cpu_usage{pod="api-abc123"} 0.61 @ 2026-02-02T10:00:20Z
```

**Use Cases**:

- Alerting (CPU > 80%)
- Capacity planning (need more servers?)
- Performance analysis (response time trending up?)

### 2. Logs (What Did It Say)

**Structured events** with context.

```json
{
  "timestamp": "2026-02-02T10:00:00Z",
  "level": "error",
  "message": "Failed to fetch household",
  "householdId": "h_abc123",
  "userId": "u_xyz789",
  "error": "Database connection timeout",
  "duration_ms": 5000,
  "trace_id": "1234567890abcdef"
}
```

**Use Cases**:

- Debugging (why did this request fail?)
- Compliance (who accessed this data?)
- Root cause analysis (what happened before the error?)

### 3. Traces (How Did It Flow)

**End-to-end request flow** across services.

```
Trace ID: 1234567890abcdef

├─ Span: api-gateway (200ms)
│  └─ Span: auth-service (50ms)
├─ Span: api-service (150ms)
│  ├─ Span: database-query (100ms)
│  └─ Span: cache-get (10ms)
└─ Span: response-formatting (20ms)

Total: 220ms
```

**Use Cases**:

- Performance bottlenecks (which service is slow?)
- Service dependencies (what calls what?)
- Error propagation (where did the error originate?)

---

## Metrics

### Prometheus Fundamentals

**Metrics Types**:

1. **Counter** - Only goes up (requests served, errors occurred)
2. **Gauge** - Goes up and down (CPU usage, memory usage, active connections)
3. **Histogram** - Buckets of observations (request duration, response size)
4. **Summary** - Like histogram but with quantiles (p50, p99)

### Application Metrics

**Instrument your code**:

```typescript
import { Counter, Histogram, Gauge, register } from "prom-client";

// Counter: Total requests
const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});

// Histogram: Request duration
const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method", "route"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5], // 10ms, 50ms, 100ms, etc.
});

// Gauge: Active connections
const activeConnections = new Gauge({
  name: "http_active_connections",
  help: "Number of active HTTP connections",
});

// Express middleware
app.use((req, res, next) => {
  const start = Date.now();
  activeConnections.inc();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds

    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || "unknown",
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || "unknown",
      },
      duration,
    );

    activeConnections.dec();
  });

  next();
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
```

**Business Metrics** (not just infrastructure):

```typescript
// Household-specific metrics
const householdsCreated = new Counter({
  name: "households_created_total",
  help: "Total households created",
  labelNames: ["plan"],
});

const activePets = new Gauge({
  name: "active_pets_total",
  help: "Total active pets",
  labelNames: ["species"],
});

const taskCompletions = new Counter({
  name: "task_completions_total",
  help: "Total pet care tasks completed",
  labelNames: ["task_type", "household_id"],
});

// Track business events
householdsCreated.inc({ plan: "premium" });
activePets.set(
  { species: "dog" },
  await prisma.pet.count({ where: { species: "dog" } }),
);
taskCompletions.inc({ task_type: "feeding", household_id: "h_abc123" });
```

### Infrastructure Metrics (AWS CloudWatch)

**ECS Task Metrics**:

```hcl
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "petforce-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300 # 5 minutes
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "petforce-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "ECS memory utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }
}
```

**RDS Metrics**:

```hcl
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "petforce-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "petforce-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS has too many connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "petforce-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 10737418240 # 10 GB in bytes
  alarm_description   = "RDS storage is running low"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}
```

**ALB Metrics**:

```hcl
resource "aws_cloudwatch_metric_alarm" "alb_5xx_high" {
  alarm_name          = "petforce-alb-5xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB 5xx errors are too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_latency_high" {
  alarm_name          = "petforce-alb-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1 # 1 second
  alarm_description   = "ALB response time is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}
```

### Prometheus Queries (PromQL)

**Common Queries**:

```promql
# CPU usage by pod
rate(container_cpu_usage_seconds_total[5m]) * 100

# Memory usage by pod
container_memory_usage_bytes / container_spec_memory_limit_bytes * 100

# Request rate by endpoint
rate(http_requests_total[1m])

# Error rate
rate(http_requests_total{status=~"5.."}[1m]) / rate(http_requests_total[1m]) * 100

# p99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Top 5 slowest endpoints
topk(5, histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])))

# Request rate by status code
sum by (status) (rate(http_requests_total[1m]))

# Active connections
http_active_connections

# Database query duration p99
histogram_quantile(0.99, rate(database_query_duration_seconds_bucket[5m]))
```

---

## Logs

### Structured Logging

**Bad** (unstructured):

```typescript
console.log(`User ${userId} created household ${householdId}`);
```

**Good** (structured):

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "petforce-api" },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "app.log" }),
  ],
});

logger.info("Household created", {
  userId: "u_abc123",
  householdId: "h_xyz789",
  householdName: "Zeder House",
  petCount: 3,
  traceId: req.headers["x-trace-id"],
});
```

**Output**:

```json
{
  "timestamp": "2026-02-02T10:00:00.000Z",
  "level": "info",
  "message": "Household created",
  "service": "petforce-api",
  "userId": "u_abc123",
  "householdId": "h_xyz789",
  "householdName": "Zeder House",
  "petCount": 3,
  "traceId": "1234567890abcdef"
}
```

### Log Levels

**Use the right level**:

```typescript
// ERROR - Something failed (requires action)
logger.error("Failed to create household", {
  userId: "u_abc123",
  error: err.message,
  stack: err.stack,
});

// WARN - Something unexpected (doesn't break functionality)
logger.warn("Rate limit approaching", {
  userId: "u_abc123",
  currentRequests: 95,
  limit: 100,
});

// INFO - Normal operations (business events)
logger.info("Household created", {
  householdId: "h_xyz789",
  userId: "u_abc123",
});

// DEBUG - Detailed info (development only)
logger.debug("Database query executed", {
  query: "SELECT * FROM households WHERE id = ?",
  params: ["h_xyz789"],
  duration_ms: 15,
});
```

### CloudWatch Logs

**ECS Task Logs**:

```hcl
resource "aws_cloudwatch_log_group" "ecs_api" {
  name              = "/ecs/petforce-api"
  retention_in_days = 30 # Keep logs for 30 days

  tags = {
    Environment = "production"
  }
}

resource "aws_ecs_task_definition" "api" {
  family = "petforce-api"

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "petforce/api:latest"

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_api.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "api"
        }
      }
    }
  ])
}
```

**Query Logs** (CloudWatch Insights):

```sql
-- Find all errors in last 1 hour
fields @timestamp, @message, userId, householdId, error
| filter level = "error"
| sort @timestamp desc
| limit 100

-- Count errors by error message
fields error
| filter level = "error"
| stats count() by error
| sort count desc

-- Find slow requests (> 1 second)
fields @timestamp, userId, duration_ms, route
| filter duration_ms > 1000
| sort duration_ms desc

-- Trace a specific user's requests
fields @timestamp, @message, level, duration_ms
| filter userId = "u_abc123"
| sort @timestamp desc

-- Count requests by route
fields route
| stats count() by route
| sort count desc
```

### Log Aggregation (ELK Stack)

**Elasticsearch + Logstash + Kibana**:

```yaml
# Logstash pipeline
input {
cloudwatch_logs {
region => "us-east-1"
log_group => ["/ecs/petforce-api", "/ecs/petforce-web"]
}
}

filter {
json {
source => "message"
}

date {
match => ["timestamp", "ISO8601"]
target => "@timestamp"
}

geoip {
source => "clientIp"
}
}

output {
elasticsearch {
hosts => ["https://elasticsearch:9200"]
index => "petforce-logs-%{+YYYY.MM.dd}"
}
}
```

**Query in Kibana**:

```
level:error AND userId:u_abc123

duration_ms:>1000 AND route:/api/households

error:*timeout* AND @timestamp:[now-1h TO now]
```

---

## Distributed Tracing

### AWS X-Ray

**Instrument Express app**:

```typescript
import AWSXRay from "aws-xray-sdk-core";
import express from "express";

// Capture AWS SDK calls
const AWS = AWSXRay.captureAWS(require("aws-sdk"));

// Capture HTTP requests
const app = express();
app.use(AWSXRay.express.openSegment("petforce-api"));

// Your routes here
app.get("/api/households/:id", async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment("fetch-household");

  try {
    const household = await prisma.household.findUnique({
      where: { id: req.params.id },
    });

    subsegment.addAnnotation("householdId", req.params.id);
    subsegment.addMetadata("household", household);
    subsegment.close();

    res.json(household);
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    throw error;
  }
});

app.use(AWSXRay.express.closeSegment());
```

**Trace in X-Ray Console**:

```
Trace ID: 1-63f8d2a4-1234567890abcdef

├─ petforce-api (250ms)
│  ├─ fetch-household (200ms)
│  │  └─ RDS::Query (180ms)
│  └─ response-formatting (20ms)
```

**Annotations vs Metadata**:

- **Annotations** - Indexed, searchable (userId, householdId, status)
- **Metadata** - Not indexed, debug info (full request/response)

### OpenTelemetry (Vendor-Neutral)

**Modern alternative to X-Ray** (works with Jaeger, Zipkin, Honeycomb, Datadog, etc.).

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: "http://otel-collector:4318/v1/traces",
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": {
        enabled: false, // Noisy
      },
    }),
  ],
});

sdk.start();
```

**Custom Spans**:

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("petforce-api");

app.get("/api/households/:id", async (req, res) => {
  const span = tracer.startSpan("fetch-household");

  try {
    span.setAttribute("household.id", req.params.id);
    span.setAttribute("user.id", req.user.id);

    const household = await prisma.household.findUnique({
      where: { id: req.params.id },
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json(household);
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.end();
    throw error;
  }
});
```

---

## Alerting

### Alert Philosophy

**Good Alert**:

- Actionable (you can fix it)
- Urgent (requires immediate attention)
- Real (not a false positive)

**Bad Alert**:

- Noisy (fires constantly)
- Vague ("something is wrong")
- Too late (damage already done)

### Alert Severity Levels

| Severity      | Response Time               | Example                                |
| ------------- | --------------------------- | -------------------------------------- |
| P0 (Critical) | Immediate (wake up on-call) | Production down, data loss             |
| P1 (High)     | 15 minutes                  | Elevated error rate, latency spike     |
| P2 (Medium)   | 1 hour                      | Non-critical service degraded          |
| P3 (Low)      | Next business day           | Disk space warning, cert expiring soon |

### CloudWatch Alarms

**SNS Topic** (alert destination):

```hcl
resource "aws_sns_topic" "alerts" {
  name = "petforce-alerts"
}

resource "aws_sns_topic_subscription" "pagerduty" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "https"
  endpoint  = "https://events.pagerduty.com/integration/abc123/enqueue"
}

resource "aws_sns_topic_subscription" "slack" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.slack_notifier.arn
}
```

**Composite Alarm** (multiple conditions):

```hcl
resource "aws_cloudwatch_composite_alarm" "api_degraded" {
  alarm_name          = "petforce-api-degraded"
  alarm_description   = "API is degraded (high latency AND high error rate)"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alerts.arn]

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.alb_latency_high.alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.alb_5xx_high.alarm_name})"
}
```

### PagerDuty Integration

**Incident Management**:

```yaml
# Escalation Policy
Level 1: Primary on-call (immediate)
  └─ If no response in 5 minutes → Level 2

Level 2: Secondary on-call
  └─ If no response in 10 minutes → Level 3

Level 3: Engineering Manager
```

**Alert Routing**:

```yaml
# High severity → Page immediately
if severity == "critical":
  trigger: phone_call + sms + push
  urgency: high

# Low severity → Create ticket
if severity == "low":
  trigger: email
  urgency: low
```

### Slack Notifications

**Lambda Function** (format CloudWatch alarm for Slack):

```typescript
import { SNSEvent } from "aws-lambda";
import axios from "axios";

export const handler = async (event: SNSEvent) => {
  const message = JSON.parse(event.Records[0].Sns.Message);

  const slackMessage = {
    text: `🚨 ${message.AlarmName}`,
    attachments: [
      {
        color: message.NewStateValue === "ALARM" ? "danger" : "good",
        fields: [
          {
            title: "Alarm",
            value: message.AlarmName,
            short: true,
          },
          {
            title: "Status",
            value: message.NewStateValue,
            short: true,
          },
          {
            title: "Reason",
            value: message.NewStateReason,
            short: false,
          },
          {
            title: "Timestamp",
            value: message.StateChangeTime,
            short: true,
          },
        ],
        actions: [
          {
            type: "button",
            text: "View in AWS Console",
            url: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:alarm/${message.AlarmName}`,
          },
        ],
      },
    ],
  };

  await axios.post(process.env.SLACK_WEBHOOK_URL!, slackMessage);
};
```

---

## Dashboards

### Grafana Dashboards

**Infrastructure Dashboard**:

```yaml
Dashboard: PetForce Infrastructure
Refresh: 30s

Rows:
  - Title: ECS Cluster
    Panels:
      - CPU Utilization (gauge)
      - Memory Utilization (gauge)
      - Running Tasks (stat)
      - Task Launches/Stops (graph)

  - Title: Database (RDS)
    Panels:
      - CPU (graph)
      - Connections (graph)
      - Read/Write IOPS (graph)
      - Disk Space (gauge)

  - Title: Load Balancer
    Panels:
      - Request Count (graph)
      - Response Time p99 (graph)
      - 5xx Error Rate (graph)
      - Healthy Targets (stat)

  - Title: Application
    Panels:
      - Requests by Endpoint (table)
      - Error Rate by Endpoint (graph)
      - Active Users (stat)
```

**Business Dashboard**:

```yaml
Dashboard: PetForce Business Metrics
Refresh: 5m

Rows:
  - Title: Growth
    Panels:
      - Total Households (stat)
      - New Households Today (stat)
      - Total Active Pets (stat)
      - Daily Active Users (graph)

  - Title: Engagement
    Panels:
      - Tasks Completed Today (stat)
      - Tasks by Type (pie chart)
      - Average Tasks per Household (graph)
      - User Retention 7-day (graph)

  - Title: Revenue
    Panels:
      - MRR (stat)
      - Churn Rate (gauge)
      - Lifetime Value (graph)
```

### CloudWatch Dashboards

**Example Dashboard** (JSON):

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", { "stat": "Average" }],
          [".", "MemoryUtilization"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS CPU & Memory"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "TargetResponseTime", { "stat": "p99" }]
        ],
        "period": 60,
        "stat": "Average",
        "region": "us-east-1",
        "title": "API Latency (p99)"
      }
    }
  ]
}
```

---

## SLOs and SLIs

### Service Level Indicators (SLIs)

**What to measure**:

| SLI          | Definition                  | Target                     |
| ------------ | --------------------------- | -------------------------- |
| Availability | % of successful requests    | 99.9% (99.99% for premium) |
| Latency      | % of requests < 500ms (p99) | 95%                        |
| Durability   | % of data not lost          | 99.999999999% (11 nines)   |
| Correctness  | % of correct responses      | 99.99%                     |

### Service Level Objectives (SLOs)

**PetForce SLOs**:

```yaml
API Availability:
  SLI: (successful_requests / total_requests) * 100
  SLO: 99.9% over 30 days
  Error Budget: 0.1% = 43 minutes downtime per month

API Latency:
  SLI: (requests_under_500ms / total_requests) * 100
  SLO: 95% of requests < 500ms
  Error Budget: 5% of requests can be slow

Database Durability:
  SLI: (data_not_lost / total_data) * 100
  SLO: 99.999999999% (11 nines)
  Error Budget: Negligible
```

**Error Budget**:

```
If SLO is 99.9% uptime:
  - Allowed downtime: 0.1% of 30 days = 43 minutes
  - If you've used 30 minutes, you have 13 minutes left
  - If you exceed 43 minutes, you've violated SLO
```

**Error Budget Policy**:

- **> 80% error budget remaining**: Ship fast, take risks
- **50-80% remaining**: Balanced approach
- **< 50% remaining**: Focus on reliability, slow down deployments
- **0% remaining (SLO violated)**: Feature freeze, only reliability work

### Measuring SLOs

**Prometheus Recording Rule**:

```yaml
groups:
  - name: slos
    interval: 1m
    rules:
      # Availability SLI
      - record: slo:api:availability:ratio
        expr: |
          sum(rate(http_requests_total{status!~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))

      # Latency SLI (% of requests < 500ms)
      - record: slo:api:latency:ratio
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
          < 0.5

      # Error budget remaining (30 days)
      - record: slo:api:error_budget:remaining
        expr: |
          1 - (
            (1 - avg_over_time(slo:api:availability:ratio[30d]))
            /
            (1 - 0.999)
          )
```

**Alert on Error Budget**:

```yaml
groups:
  - name: slo_alerts
    rules:
      - alert: ErrorBudgetNearlyExhausted
        expr: slo:api:error_budget:remaining < 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Error budget for API availability is running low"
          description: "Only {{ $value | humanizePercentage }} of error budget remaining"

      - alert: ErrorBudgetExhausted
        expr: slo:api:error_budget:remaining <= 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error budget for API availability exhausted"
          description: "SLO violated. Freeze feature releases and focus on reliability."
```

---

## On-Call Runbooks

### Example Runbook: High API Error Rate

**Symptoms**:

- Alert: `petforce-alb-5xx-high`
- 5xx error rate > 1%
- User reports of "Something went wrong" errors

**Triage** (5 minutes):

```bash
# 1. Check CloudWatch dashboard
open https://console.aws.amazon.com/cloudwatch/home#dashboards:name=petforce-production

# 2. Check recent deployments
aws ecs describe-services --cluster petforce-production --services petforce-api \
  | jq '.services[0].deployments'

# 3. Check application logs
aws logs tail /ecs/petforce-api --follow --filter-pattern "level=error"

# 4. Check ECS task health
aws ecs describe-services --cluster petforce-production --services petforce-api \
  | jq '.services[0].runningCount'
```

**Common Causes**:

1. **Recent Deployment** → Rollback

   ```bash
   aws ecs update-service \
     --cluster petforce-production \
     --service petforce-api \
     --task-definition petforce-api:previous-version
   ```

2. **Database Connection Pool Exhausted** → Scale up tasks

   ```bash
   aws ecs update-service \
     --cluster petforce-production \
     --service petforce-api \
     --desired-count 6
   ```

3. **Database Down** → Check RDS

   ```bash
   aws rds describe-db-instances --db-instance-identifier petforce-production
   ```

4. **Dependency Outage** (e.g., S3, external API) → Check AWS Health Dashboard
   ```bash
   open https://health.aws.amazon.com/health/status
   ```

**Resolution Steps**:

1. Mitigate (stop the bleeding)
2. Communicate (update status page, Slack)
3. Investigate root cause
4. Implement fix
5. Post-mortem (within 48 hours)

---

**Related Documentation**:

- [Infrastructure Overview](./README.md)
- [Kubernetes Guide](./kubernetes.md)
- [Logging Best Practices](../logging/README.md)
- [Security Monitoring](../security/monitoring.md)
