# Household Management System - Deployment Guide

**Version**: 1.0.0
**Last Updated**: 2026-02-02
**Owner**: Infrastructure Team (Isabel)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Steps](#deployment-steps)
4. [Health Checks](#health-checks)
5. [Scaling Strategy](#scaling-strategy)
6. [Disaster Recovery](#disaster-recovery)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                          CloudFront CDN                      │
│                     (Static Assets + Cache)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Mobile API  │  │  Background  │     │
│  │  (React/TS)  │  │  (Node/TS)   │  │    Jobs      │     │
│  │              │  │              │  │              │     │
│  │  ECS Fargate │  │  ECS Fargate │  │  ECS Fargate │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│    PostgreSQL (RDS)     │  │    Redis (ElastiCache)  │
│  - Primary: us-east-1a  │  │   - Cache Layer         │
│  - Replica: us-east-1b  │  │   - Rate Limiting       │
│  - Auto Backups         │  │   - Session Store       │
└─────────────────────────┘  └─────────────────────────┘
```

### Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js 20 + TypeScript + Express
- **Database**: PostgreSQL 16 (Supabase or RDS)
- **Cache**: Redis 7.x (ElastiCache)
- **Container Orchestration**: AWS ECS Fargate
- **CDN**: CloudFront
- **Monitoring**: CloudWatch + Datadog
- **Logging**: CloudWatch Logs + Datadog APM
- **Error Tracking**: Sentry

---

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/petforce
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Supabase (if using Supabase for auth)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Redis
REDIS_URL=redis://redis.xxxxx.cache.amazonaws.com:6379
REDIS_TLS_ENABLED=true

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Security
JWT_SECRET=<generate-with-openssl-rand-base64-32>
ENCRYPTION_KEY=<generate-with-openssl-rand-base64-32>
CORS_ORIGINS=https://petforce.app,https://www.petforce.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
DATADOG_API_KEY=xxxxx
DATADOG_SERVICE_NAME=petforce-api

# Email (for invites)
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@petforce.app

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_EMAIL_INVITES=true
ENABLE_PUSH_NOTIFICATIONS=true
```

### Environment-Specific Configuration

#### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://localhost:5432/petforce_dev
```

#### Staging
```bash
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_URL=<staging-db-url>
SENTRY_ENVIRONMENT=staging
```

#### Production
```bash
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_URL=<production-db-url>
SENTRY_ENVIRONMENT=production
```

---

## Deployment Steps

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Docker** installed locally (for image building)
3. **GitHub Actions** secrets configured
4. **Database migrations** tested in staging

### Staging Deployment

**Trigger**: Merge to `develop` branch

```bash
# Automatic via GitHub Actions
git checkout develop
git pull origin develop
git merge feature/your-feature
git push origin develop
```

**GitHub Actions Workflow**:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Tests
        run: npm run test

      - name: Build Docker Image
        run: docker build -t petforce-api:staging .

      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker push petforce-api:staging

      - name: Run Database Migrations
        run: npm run migrate:staging

      - name: Update ECS Service
        run: |
          aws ecs update-service \
            --cluster petforce-staging \
            --service api \
            --force-new-deployment

      - name: Run Smoke Tests
        run: npm run test:smoke:staging
```

### Production Deployment

**Trigger**: Merge to `main` branch (requires approval)

#### Step 1: Pre-Deployment Checklist

- [ ] All tests passing in staging
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] On-call engineer identified
- [ ] Monitoring dashboards ready

#### Step 2: Create Release PR

```bash
git checkout -b release/v1.2.0
git merge develop
# Update CHANGELOG.md
# Update version in package.json
git commit -m "chore(release): v1.2.0"
git push origin release/v1.2.0
```

#### Step 3: Get Approvals

- Require 2+ approvals from senior engineers
- Security review (if code touches auth/data)
- Product review (if UX changes)

#### Step 4: Merge and Deploy

```bash
# Merge PR to main
git checkout main
git pull origin main
git push origin main
```

**GitHub Actions handles**:
1. Full test suite (unit + integration + E2E)
2. Security scanning (SAST)
3. Docker image build
4. Push to ECR
5. Database migrations (with backup)
6. Blue-green deployment
7. Health checks
8. Traffic cutover
9. Post-deployment monitoring

#### Step 5: Post-Deployment Verification

```bash
# Check health endpoints
curl https://api.petforce.app/health
curl https://api.petforce.app/health/ready

# Monitor metrics
# - Error rate < 0.1%
# - P99 latency < 500ms
# - Success rate > 99.9%

# Monitor for 30 minutes
# If issues detected, trigger rollback
```

#### Step 6: Rollback (if needed)

```bash
# Automatic rollback if health checks fail
# Manual rollback via GitHub Actions workflow:

gh workflow run rollback.yml \
  --field version=v1.1.0 \
  --field environment=production
```

---

## Health Checks

### Endpoints

#### `/health` - Basic Health
```json
{
  "status": "healthy",
  "timestamp": "2026-02-02T10:30:00Z",
  "version": "1.2.0"
}
```

#### `/health/ready` - Ready to Serve Traffic
```json
{
  "status": "ready",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "dependencies": "healthy"
  }
}
```

#### `/health/live` - Container is Alive
```json
{
  "status": "alive",
  "uptime": 3600,
  "memoryUsage": "45%",
  "cpuUsage": "12%"
}
```

### ECS Task Definition

```json
{
  "healthCheck": {
    "command": ["CMD-SHELL", "curl -f http://localhost:3000/health/ready || exit 1"],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 60
  }
}
```

---

## Scaling Strategy

### Horizontal Scaling (Auto-Scaling)

**ECS Service Auto-Scaling**:
```json
{
  "scalingPolicy": {
    "targetValue": 70,
    "scaleOutCooldown": 60,
    "scaleInCooldown": 300,
    "metricType": "ECSServiceAverageCPUUtilization"
  },
  "minCapacity": 2,
  "maxCapacity": 10
}
```

**Scaling Triggers**:
- CPU > 70%: Scale out (+1 task)
- Memory > 80%: Scale out (+1 task)
- Request latency > 1s: Scale out (+2 tasks)
- CPU < 30% for 5 min: Scale in (-1 task)

### Vertical Scaling

**Task Resource Allocation**:
- **Development**: 0.25 vCPU, 512 MB RAM
- **Staging**: 0.5 vCPU, 1 GB RAM
- **Production**: 1 vCPU, 2 GB RAM
- **Production (Peak)**: 2 vCPU, 4 GB RAM

### Database Scaling

**RDS Instance Sizing**:
- **Development**: db.t3.micro (1 vCPU, 1 GB)
- **Staging**: db.t3.small (2 vCPU, 2 GB)
- **Production**: db.t3.medium (2 vCPU, 4 GB)
- **Production (Peak)**: db.t3.large (2 vCPU, 8 GB)

**Connection Pooling**:
```typescript
{
  min: 2,
  max: 10,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000
}
```

---

## Disaster Recovery

### Recovery Objectives

- **RTO (Recovery Time Objective)**: 15 minutes
- **RPO (Recovery Point Objective)**: 5 minutes

### Backup Strategy

#### Database Backups
- **Automated Snapshots**: Daily at 03:00 UTC
- **Retention**: 30 days
- **Point-in-Time Recovery**: Last 7 days
- **Cross-Region Replication**: us-west-2 (backup region)

```bash
# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier petforce-production \
  --db-snapshot-identifier petforce-manual-$(date +%Y%m%d-%H%M%S)
```

#### Application State
- **Redis Snapshots**: Every 6 hours
- **S3 Backups**: Versioning enabled
- **ECS Task Definitions**: Versioned in GitHub

### Recovery Procedures

#### Database Restore
```bash
# 1. Create new instance from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier petforce-restore \
  --db-snapshot-identifier <snapshot-id>

# 2. Update application connection string
# 3. Verify data integrity
# 4. Cut over traffic
```

#### Full System Recovery
```bash
# 1. Deploy infrastructure (Terraform/CloudFormation)
terraform apply -var="environment=production"

# 2. Restore database
# 3. Deploy application
gh workflow run deploy.yml --field environment=production

# 4. Verify health checks
# 5. Update DNS (if needed)
```

### Disaster Scenarios

| Scenario | Impact | Recovery Time | Procedure |
|----------|--------|---------------|-----------|
| Single AZ failure | Minimal (auto-failover) | < 1 minute | Automatic |
| Database failure | Service degraded | 5-10 minutes | Restore from snapshot |
| Full region outage | Service down | 15-30 minutes | Failover to DR region |
| Data corruption | Partial data loss | 30-60 minutes | Point-in-time restore |

---

## Troubleshooting

### Common Issues

#### High Error Rate

**Symptoms**: Error rate > 5%

**Diagnosis**:
```bash
# Check CloudWatch Logs
aws logs tail /ecs/petforce-production --follow

# Check Datadog APM
# Filter by error status codes
```

**Resolution**:
1. Check recent deployments (rollback if needed)
2. Check database connection pool
3. Check Redis connectivity
4. Scale up if resource constrained

#### High Latency

**Symptoms**: P99 latency > 1s

**Diagnosis**:
```bash
# Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check Redis latency
redis-cli --latency
```

**Resolution**:
1. Add database indexes
2. Optimize slow queries
3. Increase cache hit rate
4. Scale horizontally

#### Database Connection Pool Exhausted

**Symptoms**: "too many connections" errors

**Diagnosis**:
```sql
SELECT count(*) FROM pg_stat_activity;
```

**Resolution**:
1. Increase `max_connections` on RDS
2. Reduce connection pool size per instance
3. Scale up application instances
4. Add connection pooler (PgBouncer)

### Monitoring Queries

```sql
-- Active connections
SELECT count(*) as connections, usename, application_name
FROM pg_stat_activity
GROUP BY usename, application_name;

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 minute';

-- Table sizes
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Deployment Timeline

### Typical Production Deployment

| Time | Activity | Duration |
|------|----------|----------|
| T-0  | Merge PR to main | - |
| T+0  | CI/CD starts | - |
| T+2  | Tests complete | 2 min |
| T+5  | Docker build complete | 3 min |
| T+6  | Database migrations | 1 min |
| T+8  | Blue environment deployed | 2 min |
| T+10 | Health checks passing | 2 min |
| T+12 | Traffic cutover (0% → 100%) | 2 min |
| T+15 | Monitoring period starts | - |
| T+45 | Deployment complete | 30 min |

**Total**: ~45 minutes from merge to completion

---

## Contact

- **On-Call Engineer**: Check PagerDuty
- **Slack**: #petforce-incidents
- **Runbook**: `/infrastructure/docs/runbook.md`
- **Architecture Diagrams**: `/infrastructure/diagrams/`

---

**Next Steps**: See `/infrastructure/docs/runbook.md` for incident response procedures.
