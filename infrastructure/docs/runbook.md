# Household Management System - Operational Runbook

**Version**: 1.0.0
**Last Updated**: 2026-02-02
**Owner**: Infrastructure Team (Isabel)

---

## Table of Contents

1. [Incident Response](#incident-response)
2. [Common Incidents](#common-incidents)
3. [Escalation Procedures](#escalation-procedures)
4. [Monitoring Dashboards](#monitoring-dashboards)
5. [Useful Commands](#useful-commands)

---

## Incident Response

### Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P0 - Critical** | Complete service outage | 5 minutes | Database down, API returning 500s |
| **P1 - High** | Major feature broken | 15 minutes | Join household broken, auth broken |
| **P2 - Medium** | Minor feature degraded | 1 hour | Analytics slow, email delayed |
| **P3 - Low** | Non-critical issue | 24 hours | UI bug, typo, cosmetic issue |

### Incident Response Flow

```
┌─────────────────┐
│ Alert Triggered │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ 1. Acknowledge (1 min)  │
│    - PagerDuty          │
│    - Slack #incidents   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. Assess (2-5 min)     │
│    - Check dashboards   │
│    - Review logs        │
│    - Determine severity │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 3. Communicate (1 min)  │
│    - Update stakeholders│
│    - Set ETA            │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 4. Mitigate (varies)    │
│    - Follow runbook     │
│    - Implement fix      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 5. Verify (5 min)       │
│    - Check metrics      │
│    - User verification  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 6. Document (1 hour)    │
│    - Post-mortem        │
│    - Action items       │
└─────────────────────────┘
```

---

## Common Incidents

### 1. High Error Rate (500s)

**Alert**: `error_rate > 5%`
**Severity**: P0

#### Symptoms
- API returning 500 errors
- Users unable to create/join households
- Dashboard errors in Sentry

#### Diagnosis

```bash
# 1. Check recent deployments
aws ecs list-task-definitions --family petforce-api --sort DESC | head -n 5

# 2. Check CloudWatch Logs
aws logs tail /ecs/petforce-production --follow --filter-pattern "ERROR"

# 3. Check Datadog APM
# Navigate to: https://app.datadoghq.com/apm/services/petforce-api
# Filter by: Status Code = 500

# 4. Check database
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

#### Resolution

**Option A: Rollback Recent Deployment**
```bash
# Find previous healthy version
aws ecs describe-task-definition --task-definition petforce-api:42

# Rollback
gh workflow run rollback.yml \
  --field version=v1.1.0 \
  --field environment=production
```

**Option B: Database Connection Issue**
```bash
# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# If near max_connections:
# 1. Restart ECS tasks (will clear connection pools)
aws ecs update-service \
  --cluster petforce-production \
  --service api \
  --force-new-deployment

# 2. Scale up RDS (if needed)
aws rds modify-db-instance \
  --db-instance-identifier petforce-production \
  --db-instance-class db.t3.large \
  --apply-immediately
```

**Option C: Redis Connection Issue**
```bash
# Check Redis
redis-cli -h redis.xxxxx.cache.amazonaws.com ping

# Restart Redis (if needed)
aws elasticache reboot-cache-cluster \
  --cache-cluster-id petforce-production-redis
```

#### Post-Incident
- Document root cause
- Add monitoring to prevent recurrence
- Update runbook if needed

---

### 2. High Latency (P99 > 1s)

**Alert**: `p99_latency > 1000ms`
**Severity**: P1

#### Symptoms
- Slow page loads
- Timeouts
- User complaints

#### Diagnosis

```bash
# 1. Check slow queries
psql $DATABASE_URL << 'EOF'
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
EOF

# 2. Check Datadog APM traces
# Filter by: Latency > 1s

# 3. Check Redis latency
redis-cli --latency-history

# 4. Check ECS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=petforce-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

#### Resolution

**Option A: Slow Database Query**
```sql
-- Add missing index
CREATE INDEX CONCURRENTLY idx_household_members_household_id
ON household_members(household_id)
WHERE status = 'active';

-- Analyze table
ANALYZE household_members;
```

**Option B: Scale Horizontally**
```bash
# Increase ECS task count
aws ecs update-service \
  --cluster petforce-production \
  --service api \
  --desired-count 6
```

**Option C: Increase Cache Hit Rate**
```typescript
// Add caching to frequently accessed data
const household = await cache.remember(
  `household:${householdId}`,
  () => db.getHousehold(householdId),
  { ttl: 300 } // 5 minutes
);
```

---

### 3. Database Connection Pool Exhausted

**Alert**: `db_pool_available < 2`
**Severity**: P0

#### Symptoms
- "too many connections" errors
- 500 errors
- Timeouts

#### Diagnosis

```sql
-- Check current connections
SELECT
  count(*) as total_connections,
  max_connections
FROM pg_stat_activity,
  (SELECT setting::int as max_connections FROM pg_settings WHERE name = 'max_connections') mc
GROUP BY max_connections;

-- Check connections by application
SELECT
  count(*) as connections,
  application_name,
  state
FROM pg_stat_activity
GROUP BY application_name, state
ORDER BY connections DESC;

-- Check long-running queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 minutes'
ORDER BY duration DESC;
```

#### Resolution

**Immediate Fix**: Kill long-running queries
```sql
-- Kill specific query
SELECT pg_terminate_backend(12345);

-- Kill all idle connections > 10 minutes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND now() - state_change > interval '10 minutes';
```

**Short-term Fix**: Increase max_connections
```bash
# Increase max_connections (requires restart)
aws rds modify-db-parameter-group \
  --db-parameter-group-name petforce-production \
  --parameters "ParameterName=max_connections,ParameterValue=200,ApplyMethod=pending-reboot"

# Reboot (during maintenance window)
aws rds reboot-db-instance \
  --db-instance-identifier petforce-production
```

**Long-term Fix**: Connection Pooling
```typescript
// Reduce per-instance pool size
const pool = new Pool({
  min: 2,
  max: 5, // Reduced from 10
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 10000
});

// Or deploy PgBouncer
```

---

### 4. Rate Limit Violations

**Alert**: `rate_limit_violations > 100/hour`
**Severity**: P2

#### Symptoms
- Many 429 (Too Many Requests) errors
- Users reporting "too many requests"

#### Diagnosis

```bash
# Check rate limiter logs
aws logs filter-log-events \
  --log-group-name /ecs/petforce-production \
  --filter-pattern "RATE_LIMIT" \
  --start-time $(date -d '1 hour ago' +%s)000

# Check top offending IPs
redis-cli --scan --pattern "rate_limit:*" | \
  xargs -I {} redis-cli GET {} | \
  sort | uniq -c | sort -nr | head -20
```

#### Resolution

**Option A: Legitimate Traffic Spike**
```bash
# Temporarily increase rate limits
aws ssm put-parameter \
  --name /petforce/production/RATE_LIMIT_MAX_REQUESTS \
  --value "200" \
  --overwrite

# Restart services to pick up new config
aws ecs update-service \
  --cluster petforce-production \
  --service api \
  --force-new-deployment
```

**Option B: Attack/Abuse**
```bash
# Block offending IPs at WAF level
aws wafv2 update-ip-set \
  --scope REGIONAL \
  --id xxxxx \
  --lock-token xxxxx \
  --addresses 192.168.1.1/32

# Or update rate limit per IP
redis-cli SET "rate_limit_override:192.168.1.1" 10
```

---

### 5. Memory Leak

**Alert**: `memory_usage > 90%`
**Severity**: P1

#### Symptoms
- ECS tasks restarting
- Out of memory errors
- Slow performance

#### Diagnosis

```bash
# Check ECS task memory
aws ecs describe-tasks \
  --cluster petforce-production \
  --tasks $(aws ecs list-tasks --cluster petforce-production --service-name api --query 'taskArns[0]' --output text) \
  --query 'tasks[0].containers[0].memory'

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=petforce-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Maximum
```

#### Resolution

**Immediate**: Restart tasks
```bash
aws ecs update-service \
  --cluster petforce-production \
  --service api \
  --force-new-deployment
```

**Investigation**: Take heap dump
```bash
# SSH into ECS task (via SSM)
aws ecs execute-command \
  --cluster petforce-production \
  --task <task-id> \
  --container api \
  --command "/bin/bash" \
  --interactive

# Inside container
node --expose-gc --inspect app.js
# Trigger heap dump via Chrome DevTools
```

**Fix**: Patch memory leak
```typescript
// Common causes:
// 1. Event listeners not removed
// 2. Global caches growing unbounded
// 3. Database connections not closed
// 4. Closures holding references

// Fix example:
const cache = new Map();
// Add max size
if (cache.size > 10000) {
  cache.clear();
}
```

---

## Escalation Procedures

### Escalation Matrix

| Severity | Initial Response | Escalate After | Escalate To |
|----------|-----------------|----------------|-------------|
| P0 | On-call engineer | 15 minutes | Engineering lead + CTO |
| P1 | On-call engineer | 30 minutes | Engineering lead |
| P2 | On-call engineer | 2 hours | Engineering lead |
| P3 | Ticket assignment | N/A | Backlog |

### Escalation Contacts

```yaml
on_call_engineer:
  primary: Check PagerDuty rotation
  secondary: Check PagerDuty rotation

engineering_lead:
  name: "Engrid"
  slack: "@engrid"
  phone: "+1-xxx-xxx-xxxx"

cto:
  name: "Larry"
  slack: "@larry"
  phone: "+1-xxx-xxx-xxxx"

dba:
  name: "Buck"
  slack: "@buck"
  email: "buck@petforce.app"
```

### Communication Templates

**Incident Started**:
```
🚨 INCIDENT: [P0/P1/P2] [Title]
Status: Investigating
Impact: [User-facing description]
Started: [Timestamp]
ETA: [Estimated resolution time]
On-call: [@engineer]
```

**Update**:
```
📊 UPDATE: [Title]
Status: [Investigating/Mitigating/Resolved]
Progress: [What's been done]
Next: [What's next]
ETA: [Updated ETA]
```

**Resolved**:
```
✅ RESOLVED: [Title]
Duration: [Time from start to resolution]
Root Cause: [Brief explanation]
Fix: [What was done]
Follow-up: [Post-mortem link]
```

---

## Monitoring Dashboards

### Primary Dashboards

1. **CloudWatch Dashboard**: https://console.aws.amazon.com/cloudwatch/dashboards/petforce-production
2. **Datadog APM**: https://app.datadoghq.com/apm/services/petforce-api
3. **Sentry Errors**: https://sentry.io/organizations/petforce/issues/
4. **PagerDuty**: https://petforce.pagerduty.com/incidents

### Key Metrics to Monitor

```yaml
application:
  - request_rate: requests/second
  - error_rate: errors/total requests (%)
  - p50_latency: milliseconds
  - p99_latency: milliseconds
  - success_rate: successful requests (%)

database:
  - connection_pool_usage: used/max (%)
  - query_latency: milliseconds
  - slow_queries: count
  - deadlocks: count

infrastructure:
  - cpu_utilization: percentage
  - memory_utilization: percentage
  - disk_usage: percentage
  - network_throughput: MB/s

business:
  - households_created: count/hour
  - join_requests: count/hour
  - active_users: count
```

---

## Useful Commands

### ECS

```bash
# List running tasks
aws ecs list-tasks --cluster petforce-production --service-name api

# Describe task
aws ecs describe-tasks --cluster petforce-production --tasks <task-id>

# Force new deployment (restart all tasks)
aws ecs update-service \
  --cluster petforce-production \
  --service api \
  --force-new-deployment

# Scale service
aws ecs update-service \
  --cluster petforce-production \
  --service api \
  --desired-count 4

# View logs
aws logs tail /ecs/petforce-production --follow

# Execute command in container (requires ECS Exec enabled)
aws ecs execute-command \
  --cluster petforce-production \
  --task <task-id> \
  --container api \
  --command "/bin/bash" \
  --interactive
```

### RDS

```bash
# Describe database
aws rds describe-db-instances --db-instance-identifier petforce-production

# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier petforce-production \
  --db-snapshot-identifier manual-$(date +%Y%m%d-%H%M%S)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier petforce-restore \
  --db-snapshot-identifier <snapshot-id>

# Reboot
aws rds reboot-db-instance --db-instance-identifier petforce-production

# Modify instance class
aws rds modify-db-instance \
  --db-instance-identifier petforce-production \
  --db-instance-class db.t3.large \
  --apply-immediately
```

### Redis

```bash
# Connect to Redis
redis-cli -h redis.xxxxx.cache.amazonaws.com --tls

# Check latency
redis-cli --latency

# Get key
redis-cli GET "household:12345"

# Clear cache (use with caution!)
redis-cli FLUSHDB

# Get cache size
redis-cli INFO memory
```

### Database Queries

```sql
-- Active connections
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Long-running queries
SELECT pid, now() - query_start as duration, state, query
FROM pg_stat_activity
WHERE state != 'idle' AND query_start IS NOT NULL
ORDER BY duration DESC;

-- Kill query
SELECT pg_terminate_backend(12345);

-- Slow queries (requires pg_stat_statements)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

## Post-Incident

### Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date**: [Date]
**Severity**: [P0/P1/P2]
**Duration**: [X hours Y minutes]
**Impact**: [User-facing impact]

## Timeline

- **HH:MM** - Alert triggered
- **HH:MM** - Engineer acknowledged
- **HH:MM** - Root cause identified
- **HH:MM** - Fix deployed
- **HH:MM** - Incident resolved

## Root Cause

[Detailed explanation of what went wrong]

## Resolution

[What was done to fix it]

## Action Items

- [ ] [Action 1] - [@owner] - [Due date]
- [ ] [Action 2] - [@owner] - [Due date]
- [ ] [Action 3] - [@owner] - [Due date]

## Lessons Learned

- [What went well]
- [What could be improved]
- [What we learned]
```

---

**Last Updated**: 2026-02-02
**Maintained By**: Infrastructure Team (Isabel)
