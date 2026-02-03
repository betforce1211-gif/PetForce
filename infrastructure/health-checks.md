# PetForce Health Check Endpoints

This document describes the health check endpoints used by PetForce for monitoring and orchestration.

## Overview

Health checks are used by:

- Load balancers (ALB, ELB) for routing traffic
- Container orchestrators (ECS, Kubernetes) for managing containers
- Monitoring systems (DataDog, CloudWatch) for alerting
- Deployment systems for canary and blue/green deployments

## Endpoint Types

### 1. Liveness Probe (`/health`)

**Purpose**: Determine if the application is running and can handle requests

**Use Case**:

- Kubernetes/ECS restart decisions
- Load balancer health checks
- Basic "is the service up" monitoring

**HTTP Method**: `GET`

**Endpoint**: `/health`

**Response Format**:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-02T10:30:00Z",
  "uptime": 3600,
  "version": "1.5.0"
}
```

**Status Codes**:

- `200 OK` - Service is healthy
- `503 Service Unavailable` - Service is unhealthy

**Checks Performed**:

- Application is running
- HTTP server is responsive
- Basic memory/CPU within limits

**Timeout**: 5 seconds

**Frequency**: Every 10 seconds

**Failure Threshold**: 3 consecutive failures

---

### 2. Readiness Probe (`/health/ready`)

**Purpose**: Determine if the application is ready to accept traffic

**Use Case**:

- Load balancer traffic routing
- Kubernetes/ECS service mesh
- Graceful deployment rollouts
- Warm-up after startup

**HTTP Method**: `GET`

**Endpoint**: `/health/ready`

**Response Format**:

```json
{
  "status": "ready",
  "timestamp": "2026-02-02T10:30:00Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "supabase": "healthy"
  },
  "dependencies": {
    "database": {
      "status": "connected",
      "latency_ms": 5,
      "pool_available": 25
    },
    "redis": {
      "status": "connected",
      "latency_ms": 2,
      "memory_used_mb": 128
    },
    "supabase": {
      "status": "connected",
      "latency_ms": 50
    }
  }
}
```

**Status Codes**:

- `200 OK` - Service is ready
- `503 Service Unavailable` - Service is not ready

**Checks Performed**:

- Database connection is active
- Redis connection is active
- Supabase API is reachable
- All critical dependencies are available
- Connection pools are not exhausted

**Timeout**: 10 seconds

**Frequency**: Every 5 seconds

**Failure Threshold**: 2 consecutive failures

---

### 3. Startup Probe (`/health/startup`)

**Purpose**: Determine if the application has completed initialization

**Use Case**:

- Kubernetes startup checks
- Initial deployment validation
- Warm-up period handling
- Migration completion checks

**HTTP Method**: `GET`

**Endpoint**: `/health/startup`

**Response Format**:

```json
{
  "status": "started",
  "timestamp": "2026-02-02T10:30:00Z",
  "initialization": {
    "database_migrations": "complete",
    "cache_warming": "complete",
    "configuration_loaded": true,
    "startup_duration_ms": 5000
  }
}
```

**Status Codes**:

- `200 OK` - Service has started successfully
- `503 Service Unavailable` - Service is still starting

**Checks Performed**:

- Database migrations completed
- Cache warming completed
- Configuration loaded
- Initial data seeded

**Timeout**: 30 seconds

**Frequency**: Every 10 seconds (initial phase only)

**Failure Threshold**: 30 consecutive failures (5 minutes)

---

### 4. Deep Health Check (`/health/deep`)

**Purpose**: Comprehensive health check for debugging and monitoring

**Use Case**:

- Manual troubleshooting
- Detailed monitoring dashboards
- Pre-deployment validation
- Incident investigation

**HTTP Method**: `GET`

**Endpoint**: `/health/deep`

**Authentication**: Required (internal only)

**Response Format**:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-02T10:30:00Z",
  "version": "1.5.0",
  "environment": "production",
  "node": {
    "version": "20.19.0",
    "memory_used_mb": 512,
    "memory_total_mb": 1024,
    "cpu_usage_percent": 45,
    "uptime_seconds": 86400
  },
  "database": {
    "status": "connected",
    "latency_ms": 5,
    "pool_total": 50,
    "pool_available": 25,
    "pool_in_use": 25,
    "active_queries": 10,
    "version": "15.3"
  },
  "redis": {
    "status": "connected",
    "latency_ms": 2,
    "memory_used_mb": 128,
    "memory_max_mb": 512,
    "connected_clients": 15,
    "ops_per_sec": 1500,
    "hit_rate_percent": 87
  },
  "supabase": {
    "status": "connected",
    "latency_ms": 50,
    "auth_service": "healthy",
    "storage_service": "healthy"
  },
  "api": {
    "requests_per_second": 150,
    "error_rate_percent": 0.1,
    "p95_latency_ms": 250,
    "p99_latency_ms": 500
  },
  "features": {
    "households": "enabled",
    "analytics": "enabled",
    "rate_limiting": "enabled"
  }
}
```

**Status Codes**:

- `200 OK` - Detailed health information
- `503 Service Unavailable` - Critical issues detected

**Checks Performed**:

- All liveness and readiness checks
- Database query performance
- Redis cache performance
- Memory and CPU metrics
- Active connection counts
- Request rate and error rate
- Feature flags status

**Timeout**: 30 seconds

**Frequency**: On-demand or every 1 minute

---

## Implementation

### Express.js Example

```typescript
// src/routes/health.ts
import express from "express";
import { checkDatabaseConnection, getDatabaseStats } from "../database";
import { checkRedisConnection, getRedisStats } from "../cache";
import { checkSupabaseConnection } from "../supabase";

const router = express.Router();

// Liveness probe
router.get("/health", async (req, res) => {
  try {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || "unknown",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Readiness probe
router.get("/health/ready", async (req, res) => {
  try {
    const [dbStatus, redisStatus, supabaseStatus] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection(),
      checkSupabaseConnection(),
    ]);

    const allHealthy =
      dbStatus.healthy && redisStatus.healthy && supabaseStatus.healthy;

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus.healthy ? "healthy" : "unhealthy",
        redis: redisStatus.healthy ? "healthy" : "unhealthy",
        supabase: supabaseStatus.healthy ? "healthy" : "unhealthy",
      },
      dependencies: {
        database: {
          status: dbStatus.healthy ? "connected" : "disconnected",
          latency_ms: dbStatus.latency,
          pool_available: dbStatus.poolAvailable,
        },
        redis: {
          status: redisStatus.healthy ? "connected" : "disconnected",
          latency_ms: redisStatus.latency,
          memory_used_mb: redisStatus.memoryUsed,
        },
        supabase: {
          status: supabaseStatus.healthy ? "connected" : "disconnected",
          latency_ms: supabaseStatus.latency,
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      error: error.message,
    });
  }
});

// Startup probe
router.get("/health/startup", async (req, res) => {
  try {
    // Check if migrations completed
    const migrationsComplete = await checkMigrations();
    const cacheWarmed = await checkCacheWarming();
    const configLoaded = !!process.env.SUPABASE_URL;

    const started = migrationsComplete && cacheWarmed && configLoaded;

    res.status(started ? 200 : 503).json({
      status: started ? "started" : "starting",
      timestamp: new Date().toISOString(),
      initialization: {
        database_migrations: migrationsComplete ? "complete" : "pending",
        cache_warming: cacheWarmed ? "complete" : "pending",
        configuration_loaded: configLoaded,
        startup_duration_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "starting",
      error: error.message,
    });
  }
});

// Deep health check (authenticated)
router.get("/health/deep", authenticateInternal, async (req, res) => {
  try {
    const [dbStats, redisStats, apiStats] = await Promise.all([
      getDatabaseStats(),
      getRedisStats(),
      getAPIStats(),
    ]);

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "unknown",
      environment: process.env.NODE_ENV,
      node: {
        version: process.version,
        memory_used_mb: Math.round(
          process.memoryUsage().heapUsed / 1024 / 1024,
        ),
        memory_total_mb: Math.round(
          process.memoryUsage().heapTotal / 1024 / 1024,
        ),
        cpu_usage_percent: Math.round(process.cpuUsage().user / 1000000),
        uptime_seconds: Math.round(process.uptime()),
      },
      database: dbStats,
      redis: redisStats,
      api: apiStats,
      features: {
        households: true,
        analytics: true,
        rate_limiting: true,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

export default router;
```

---

## Kubernetes Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: petforce-web
spec:
  template:
    spec:
      containers:
        - name: web
          image: petforce-web:latest
          ports:
            - containerPort: 3000

          # Liveness probe - restart if unhealthy
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 60
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
            successThreshold: 1

          # Readiness probe - remove from service if not ready
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 2
            successThreshold: 1

          # Startup probe - allow time for initialization
          startupProbe:
            httpGet:
              path: /health/startup
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 30 # 5 minutes total
            successThreshold: 1
```

---

## AWS ECS Configuration

```json
{
  "containerDefinitions": [
    {
      "name": "petforce-web",
      "image": "your-registry/petforce-web:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**ALB Target Group Health Check**:

```json
{
  "HealthCheckProtocol": "HTTP",
  "HealthCheckPath": "/health/ready",
  "HealthCheckIntervalSeconds": 30,
  "HealthCheckTimeoutSeconds": 10,
  "HealthyThresholdCount": 2,
  "UnhealthyThresholdCount": 3,
  "Matcher": {
    "HttpCode": "200"
  }
}
```

---

## Docker Compose Configuration

```yaml
version: "3.8"

services:
  web:
    image: petforce-web:latest
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    depends_on:
      redis:
        condition: service_healthy
```

---

## Monitoring Integration

### DataDog Synthetic Monitoring

```yaml
# DataDog Synthetic Test
tests:
  - name: "PetForce Health Check"
    type: "api"
    request:
      method: "GET"
      url: "https://petforce.app/health"
    assertions:
      - type: "statusCode"
        operator: "is"
        target: 200
      - type: "responseTime"
        operator: "lessThan"
        target: 1000
      - type: "body"
        operator: "contains"
        target: "healthy"
    locations: ["aws:us-east-1", "aws:us-west-2", "aws:eu-west-1"]
    options:
      tick_every: 60
      min_failure_duration: 0
      min_location_failed: 1
    message: "Health check failed @pagerduty-critical"
```

### Prometheus ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: petforce-health-metrics
spec:
  selector:
    matchLabels:
      app: petforce-web
  endpoints:
    - port: http
      path: /health
      interval: 30s
```

---

## Best Practices

### 1. Keep Health Checks Lightweight

✅ **Good**: Check basic connectivity

```typescript
await db.query("SELECT 1");
```

❌ **Bad**: Run expensive queries

```typescript
await db.query("SELECT COUNT(*) FROM households");
```

### 2. Use Appropriate Timeouts

- Liveness: 5 seconds
- Readiness: 10 seconds
- Startup: 30 seconds

### 3. Implement Graceful Degradation

```typescript
// Return partial health if non-critical services are down
const redisHealthy = await checkRedis().catch(() => false);
const dbHealthy = await checkDatabase();

// Still healthy if Redis is down (non-critical)
const status = dbHealthy ? "ready" : "not_ready";
```

### 4. Cache Health Check Results

```typescript
// Cache results for 5 seconds to avoid overwhelming dependencies
const cachedHealthCheck = memoize(performHealthCheck, { maxAge: 5000 });
```

### 5. Log Health Check Failures

```typescript
if (!dbHealthy) {
  logger.error("Health check failed - database unhealthy", {
    latency: dbLatency,
    poolAvailable: poolStats.available,
  });
}
```

---

## Troubleshooting

### Health Check Failing but Service Works

**Possible Causes**:

- Health check timeout too short
- Dependencies temporarily slow
- Network issues between load balancer and container

**Solutions**:

- Increase timeout values
- Check dependency latency
- Review network policies

### Frequent Restarts

**Possible Causes**:

- Liveness probe too aggressive
- Application startup time too long
- Memory leaks causing OOM

**Solutions**:

- Increase `initialDelaySeconds`
- Increase `failureThreshold`
- Use startup probe for initial startup
- Fix memory leaks

### Traffic Not Routing

**Possible Causes**:

- Readiness probe failing
- Application not fully initialized
- Dependencies unavailable

**Solutions**:

- Check `/health/ready` response
- Review dependency status
- Check logs for initialization errors

---

## Testing

### Manual Testing

```bash
# Test liveness
curl http://localhost:3000/health

# Test readiness
curl http://localhost:3000/health/ready

# Test startup
curl http://localhost:3000/health/startup

# Test deep health (with auth token)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/health/deep
```

### Automated Testing

```typescript
// tests/health.test.ts
describe("Health Check Endpoints", () => {
  it("should return 200 for /health", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
  });

  it("should return 503 when database is down", async () => {
    // Mock database failure
    jest
      .spyOn(database, "query")
      .mockRejectedValue(new Error("Connection failed"));

    const response = await request(app).get("/health/ready");
    expect(response.status).toBe(503);
    expect(response.body.checks.database).toBe("unhealthy");
  });
});
```

---

## Related Documentation

- [Monitoring & Alerting](./monitoring/alerts.yaml)
- [Deployment Guide](./deploy.md)
- [Kubernetes Configuration](./kubernetes/deployment.yaml)
- [Runbooks](./runbooks/)

---

Built with ❤️ by the PetForce Platform Team
