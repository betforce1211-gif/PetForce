# PetForce Deployment Guide

## Overview

Comprehensive deployment documentation for PetForce household management system.

**Isabel's Infrastructure Philosophy:**

- Infrastructure as Code (IaC) for all resources
- Multi-environment strategy (dev, staging, production)
- Automated deployments with rollback capability
- Comprehensive monitoring and alerting
- Cost optimization at every layer
- Security by default

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Methods](#deployment-methods)
5. [Database Setup](#database-setup)
6. [Monitoring & Logging](#monitoring--logging)
7. [Scaling Strategy](#scaling-strategy)
8. [Disaster Recovery](#disaster-recovery)
9. [Security Checklist](#security-checklist)
10. [Cost Optimization](#cost-optimization)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         CDN (CloudFlare)                     │
│                    Static Assets & Images                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (AWS ALB)                   │
│              SSL Termination & Health Checks                 │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌───────────────────┐  ┌───────────────────┐
        │   Web App (ECS)   │  │  Mobile API (ECS) │
        │  Next.js/React    │  │    Express/Node   │
        │  Auto-scaling     │  │   Auto-scaling    │
        └───────────────────┘  └───────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
        ┌─────────────────────────────────────────┐
        │      Supabase (Managed PostgreSQL)      │
        │   - Database (households, members)      │
        │   - Authentication & Authorization      │
        │   - Real-time subscriptions             │
        │   - Storage (QR codes, avatars)         │
        └─────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌───────────────────┐  ┌───────────────────┐
        │  Redis (ElastiCache)│ │ Monitoring Stack  │
        │  - Rate limiting   │  │ - DataDog/Grafana │
        │  - Session cache   │  │ - CloudWatch      │
        │  - Distributed locks│ │ - Sentry          │
        └───────────────────┘  └───────────────────┘
```

### Infrastructure Stack

- **Hosting**: AWS ECS Fargate (serverless containers)
- **Database**: Supabase (managed PostgreSQL)
- **Cache**: AWS ElastiCache (Redis)
- **CDN**: CloudFlare
- **Monitoring**: DataDog + CloudWatch
- **Error Tracking**: Sentry
- **CI/CD**: GitHub Actions
- **IaC**: Terraform

---

## Prerequisites

### Required Tools

```bash
# Install required CLI tools
brew install terraform
brew install aws-cli
brew install docker
brew install kubectl
npm install -g @supabase/cli
```

### AWS Configuration

```bash
# Configure AWS credentials
aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

### Terraform Setup

```bash
# Initialize Terraform
cd infrastructure/terraform
terraform init

# Validate configuration
terraform validate

# Plan changes
terraform plan

# Apply changes
terraform apply
```

---

## Environment Configuration

### Environment Variables

Create `.env.production` file:

```bash
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://petforce.app

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redis (ElastiCache)
REDIS_HOST=petforce-prod.abc123.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS_ENABLED=true

# Monitoring
DATADOG_API_KEY=your-datadog-api-key
SENTRY_DSN=https://abc123@sentry.io/xyz456

# Feature Flags
RATE_LIMITING_ENABLED=true
ANALYTICS_ENABLED=true
PUSH_NOTIFICATIONS_ENABLED=true

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-encryption-key-min-32-chars

# External Services
EXPO_PUSH_API_URL=https://exp.host/--/api/v2/push/send
EXPO_ACCESS_TOKEN=your-expo-access-token

# Email (if using custom SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Secrets Management

**Using AWS Secrets Manager:**

```bash
# Store secrets
aws secretsmanager create-secret \
  --name petforce/production/supabase \
  --secret-string '{
    "url": "https://your-project.supabase.co",
    "anon_key": "...",
    "service_role_key": "..."
  }'

# Retrieve secrets in application
aws secretsmanager get-secret-value \
  --secret-id petforce/production/supabase \
  --query SecretString \
  --output text
```

---

## Deployment Methods

### Method 1: Docker Compose (Development/Staging)

**docker-compose.yml:**

```yaml
version: "3.8"

services:
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - redis
    restart: unless-stopped

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_HOST=redis
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
      - api
    restart: unless-stopped

volumes:
  redis_data:
```

**Deploy with Docker Compose:**

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Method 2: AWS ECS Fargate (Production)

**Task Definition (task-definition.json):**

```json
{
  "family": "petforce-web",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/petforce-web:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:petforce/production/supabase:url"
        },
        {
          "name": "SUPABASE_ANON_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:petforce/production/supabase:anon_key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/petforce-web",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
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

**Deploy to ECS:**

```bash
# Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t petforce-web ./apps/web
docker tag petforce-web:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/petforce-web:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/petforce-web:latest

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Update service
aws ecs update-service \
  --cluster petforce-production \
  --service petforce-web \
  --task-definition petforce-web:1 \
  --force-new-deployment

# Wait for deployment
aws ecs wait services-stable \
  --cluster petforce-production \
  --services petforce-web
```

### Method 3: Kubernetes (Alternative)

See `infrastructure/kubernetes/` for full manifests.

---

## Database Setup

### Supabase Configuration

1. **Create Supabase Project**
   - Go to https://supabase.com/dashboard
   - Create new project
   - Copy URL and anon key

2. **Run Migrations**

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Verify tables
supabase db inspect
```

3. **Row Level Security (RLS)**

```sql
-- Enable RLS on all household tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_join_requests ENABLE ROW LEVEL SECURITY;

-- Policies are defined in database/schema.sql
```

### Database Backups

**Automated Backups (Supabase):**

- Daily automatic backups (last 7 days)
- Point-in-time recovery (last 7 days)
- Manual backups via dashboard

**Manual Backup:**

```bash
# Export database
supabase db dump -f backup-$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup-*.sql s3://petforce-backups/database/
```

---

## Monitoring & Logging

### Health Check Endpoints

All services expose `/health` endpoint:

```typescript
// GET /health
{
  "status": "healthy",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "supabase": "healthy"
  },
  "timestamp": "2026-02-02T12:00:00Z"
}
```

### CloudWatch Metrics

**Key Metrics:**

- CPU utilization (target: < 70%)
- Memory utilization (target: < 80%)
- Request count
- Response time (p50, p95, p99)
- Error rate (target: < 1%)
- Database connections

### DataDog Integration

```yaml
# datadog-agent.yaml (if self-hosted)
apiVersion: v1
kind: ConfigMap
metadata:
  name: datadog-config
data:
  datadog.yaml: |
    api_key: ${DATADOG_API_KEY}
    logs_enabled: true
    apm_enabled: true
    process_config:
      enabled: true
```

### Alerts

See `infrastructure/monitoring/alerts.yaml` for full configuration.

**Critical Alerts:**

- Error rate > 5%
- Response time p95 > 2s
- CPU utilization > 85%
- Memory utilization > 90%
- Database connections > 90% of max

---

## Scaling Strategy

### Horizontal Scaling

**Auto-scaling Configuration (ECS):**

```json
{
  "scalingPolicies": [
    {
      "policyName": "cpu-scaling",
      "policyType": "TargetTrackingScaling",
      "targetTrackingScalingPolicyConfiguration": {
        "targetValue": 70.0,
        "predefinedMetricSpecification": {
          "predefinedMetricType": "ECSServiceAverageCPUUtilization"
        },
        "scaleInCooldown": 300,
        "scaleOutCooldown": 60
      }
    },
    {
      "policyName": "memory-scaling",
      "policyType": "TargetTrackingScaling",
      "targetTrackingScalingPolicyConfiguration": {
        "targetValue": 80.0,
        "predefinedMetricSpecification": {
          "predefinedMetricType": "ECSServiceAverageMemoryUtilization"
        }
      }
    }
  ],
  "minCapacity": 2,
  "maxCapacity": 10
}
```

### Vertical Scaling

**Task Size Recommendations:**

| Environment | CPU  | Memory | Cost/month |
| ----------- | ---- | ------ | ---------- |
| Development | 256  | 512MB  | ~$15       |
| Staging     | 512  | 1GB    | ~$30       |
| Production  | 1024 | 2GB    | ~$60       |

### Database Scaling

**Supabase Pro Plan:**

- Connection pooling (PgBouncer)
- Read replicas for analytics
- Dedicated compute
- Point-in-time recovery

---

## Disaster Recovery

### Backup Strategy

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 1 hour

**Backup Schedule:**

- Database: Daily full backup, hourly incremental
- Redis: Daily snapshot
- Configuration: Git repository
- Secrets: AWS Secrets Manager (versioned)

### Recovery Procedures

See `infrastructure/runbooks/disaster-recovery.md` for detailed procedures.

**Quick Recovery Steps:**

1. **Database Recovery**

```bash
# Restore from Supabase backup
supabase db restore --backup-id <backup-id>

# Or from manual backup
psql -h db.supabase.co -U postgres -d postgres -f backup.sql
```

2. **Service Recovery**

```bash
# Redeploy from last known good version
aws ecs update-service \
  --cluster petforce-production \
  --service petforce-web \
  --task-definition petforce-web:previous-version \
  --force-new-deployment
```

3. **Verify Health**

```bash
# Check all services
curl https://api.petforce.app/health
curl https://petforce.app/health
```

---

## Security Checklist

### Pre-Deployment Security

- [ ] All secrets stored in AWS Secrets Manager (not in code)
- [ ] SSL/TLS certificates configured and auto-renewing
- [ ] Database Row Level Security (RLS) enabled
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled (HSTS, CSP, X-Frame-Options)
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] CSRF protection enabled
- [ ] Audit logging enabled
- [ ] Regular security scans scheduled (Samantha's domain)

### Network Security

- [ ] VPC configured with private subnets
- [ ] Security groups restrict traffic (principle of least privilege)
- [ ] WAF rules configured (DDoS protection)
- [ ] IP whitelisting for admin endpoints
- [ ] API Gateway throttling enabled

### Compliance

- [ ] GDPR compliance (data export, hard delete)
- [ ] CCPA compliance (data privacy)
- [ ] SOC 2 Type II (if required)
- [ ] HIPAA compliance (if handling health data)

---

## Cost Optimization

### Monthly Cost Estimate

| Service         | Size/Tier      | Cost/month |
| --------------- | -------------- | ---------- |
| AWS ECS Fargate | 2x1GB (avg)    | ~$60       |
| Supabase Pro    | 8GB database   | $25        |
| AWS ElastiCache | cache.t3.micro | $15        |
| CloudFlare Pro  | CDN + WAF      | $20        |
| DataDog         | 5 hosts        | $75        |
| AWS ALB         | Load balancer  | $20        |
| **Total**       |                | **~$215**  |

### Cost Optimization Tips

1. **Use Spot Instances** (dev/staging): Save 70% on compute
2. **Reserved Instances** (production): Save 40% with 1-year commitment
3. **CloudFlare Caching**: Reduce origin requests by 80%
4. **Database Connection Pooling**: Reduce database costs
5. **Auto-scaling**: Scale down during off-hours
6. **S3 Lifecycle Policies**: Move old backups to Glacier

### Cost Monitoring

```bash
# AWS Cost Explorer CLI
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

---

## Quick Start

### Deploy to Production (First Time)

```bash
# 1. Clone repository
git clone https://github.com/your-org/petforce.git
cd petforce

# 2. Configure environment
cp .env.example .env.production
# Edit .env.production with your values

# 3. Initialize infrastructure
cd infrastructure/terraform
terraform init
terraform plan
terraform apply

# 4. Build and deploy
npm run build
npm run deploy:production

# 5. Run database migrations
npm run db:migrate:production

# 6. Verify deployment
curl https://petforce.app/health
```

### Update Existing Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Build
npm run build

# 3. Deploy (zero-downtime)
npm run deploy:production

# 4. Monitor deployment
npm run logs:production
```

---

## Support

- **Infrastructure Team**: infrastructure@petforce.com
- **On-Call Rotation**: PagerDuty
- **Runbooks**: `infrastructure/runbooks/`
- **Monitoring Dashboards**: https://petforce.datadog.com

---

**Built with 🏗️ by Isabel (Infrastructure Agent)**

_Production-ready infrastructure with reliability, security, and cost optimization built in._
