# Runbook: High Error Rate

**Severity**: P0 (Critical)  
**Estimated Resolution Time**: 15-30 minutes  
**On-Call**: Platform Team

---

## Overview

High error rate indicates the application is returning excessive 5xx or 4xx errors to users, preventing them from using household features.

---

## Symptoms

- DataDog monitor "High Error Rate - Household API" triggered
- Error rate > 10 errors/second
- Multiple user reports of "Something went wrong" errors
- Increased 5xx status codes in ALB metrics

---

## Impact

**User Impact**: Users cannot create, join, or manage households  
**Business Impact**: Core functionality unavailable, user churn risk  
**Data Impact**: No data loss, but operations may fail

---

## Diagnosis

### Step 1: Confirm the Issue

```bash
# Check current error rate (last 5 minutes)
curl -s https://petforce.app/health | jq '.status'

# View DataDog dashboard
open https://app.datadoghq.com/dashboard/petforce-errors

# Check application logs for errors
kubectl logs -n petforce deployment/petforce-web --tail=100 | grep "ERROR"

# Or for ECS:
aws logs tail /aws/ecs/petforce-web --since 5m --follow
```

**Expected Output**: Should see elevated error counts

### Step 2: Identify Error Type

```bash
# Group errors by endpoint
kubectl logs -n petforce deployment/petforce-web --since=5m | grep "ERROR" | awk '{print $4}' | sort | uniq -c

# Check specific error messages
kubectl logs -n petforce deployment/petforce-web --since=5m | grep "ERROR" -A 5
```

**Common Error Types**:

- `ECONNREFUSED` - Database connection failures
- `ETIMEDOUT` - Service timeouts
- `ValidationError` - Invalid input (4xx)
- `UnauthorizedError` - Authentication issues
- `InternalServerError` - Application bugs

### Step 3: Check Dependencies

```bash
# Test database connectivity
kubectl exec -n petforce deployment/petforce-web -- curl -s http://localhost:3000/health/ready

# Check Redis connectivity
kubectl exec -n petforce deployment/petforce-redis -- redis-cli ping

# Check Supabase status
curl -I https://your-project.supabase.co/rest/v1/
```

---

## Resolution

### Scenario 1: Database Connection Errors

**Symptoms**: Errors contain `ECONNREFUSED`, `connection pool exhausted`

**Steps**:

```bash
# 1. Check database connection pool
kubectl logs -n petforce deployment/petforce-web | grep "pool"

# 2. Check active database connections
psql -U postgres -h $DB_HOST -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# 3. If pool exhausted, restart application to reset connections
kubectl rollout restart deployment/petforce-web -n petforce

# 4. Monitor error rate
watch -n 5 'curl -s https://petforce.app/health/ready | jq ".checks.database"'

# 5. If issue persists, scale up database connections (requires config change)
# Edit deployment to increase SUPABASE_MAX_POOL_SIZE
kubectl edit deployment petforce-web -n petforce
```

**Expected Result**: Error rate drops to <1 error/sec within 5 minutes

---

### Scenario 2: Application Bugs/Crashes

**Symptoms**: Pods restarting frequently, stack traces in logs

**Steps**:

```bash
# 1. Check pod restart count
kubectl get pods -n petforce -o wide

# 2. View crash logs
kubectl logs -n petforce <pod-name> --previous

# 3. Rollback to previous version
kubectl rollout undo deployment/petforce-web -n petforce

# 4. Monitor rollback progress
kubectl rollout status deployment/petforce-web -n petforce

# 5. Verify health
curl https://petforce.app/health
```

**Expected Result**: Service stabilizes on previous version

---

### Scenario 3: Rate Limiting/DDoS

**Symptoms**: High request rate from specific IPs, rate limit errors

**Steps**:

```bash
# 1. Check request rate by IP
kubectl logs -n petforce deployment/petforce-web | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# 2. Check rate limit logs
kubectl logs -n petforce deployment/petforce-web | grep "rate_limit_exceeded"

# 3. Block malicious IPs at CloudFlare/WAF level
# Log into CloudFlare dashboard and add IP to block list

# 4. Temporarily increase rate limits if legitimate traffic
kubectl set env deployment/petforce-web RATE_LIMIT_MAX=200 -n petforce
```

**Expected Result**: Error rate decreases as malicious traffic is blocked

---

### Scenario 4: Supabase API Issues

**Symptoms**: Errors from Supabase client, authentication failures

**Steps**:

```bash
# 1. Check Supabase status page
open https://status.supabase.com/

# 2. Test Supabase connectivity
curl -H "apikey: $SUPABASE_ANON_KEY" https://your-project.supabase.co/rest/v1/

# 3. If Supabase is down, enable maintenance mode
kubectl set env deployment/petforce-web MAINTENANCE_MODE=true -n petforce

# 4. Display maintenance page to users
# This will return 503 with a friendly message

# 5. Monitor Supabase status and re-enable when recovered
kubectl set env deployment/petforce-web MAINTENANCE_MODE=false -n petforce
```

**Expected Result**: Graceful degradation until Supabase recovers

---

## Post-Resolution

### Verify Recovery

```bash
# 1. Check error rate
curl https://petforce.app/health
# Should return {"status": "healthy"}

# 2. Verify DataDog alert cleared
open https://app.datadoghq.com/monitors

# 3. Test household operations manually
# Create household, join household, regenerate code

# 4. Check recent logs for any remaining errors
kubectl logs -n petforce deployment/petforce-web --tail=50 | grep "ERROR"
```

### Document Incident

1. **Update Incident Ticket**:
   - Root cause identified
   - Resolution steps taken
   - Verification completed

2. **Post in #incidents**:

   ```
   🟢 RESOLVED: High Error Rate
   - Root Cause: [Database connection pool exhausted / Application bug / etc.]
   - Resolution: [Restarted pods / Rolled back / etc.]
   - Duration: [X minutes]
   - User Impact: [Estimated users affected]
   ```

3. **Schedule Post-Mortem**:
   - Create calendar invite within 48 hours
   - Invite: Platform team, product team, on-call engineer
   - Prepare blameless post-mortem doc

---

## Prevention

### Immediate Actions

1. **Monitor Error Rate More Closely**:

   ```bash
   # Add more granular DataDog monitors
   # Alert at 5 errors/sec (warning)
   # Alert at 10 errors/sec (critical)
   ```

2. **Increase Connection Pool Size** (if database-related):

   ```bash
   kubectl set env deployment/petforce-web SUPABASE_MAX_POOL_SIZE=50 -n petforce
   ```

3. **Add Retry Logic** (if transient failures):
   ```typescript
   // In API client
   const retryOptions = {
     retries: 3,
     minTimeout: 1000,
     maxTimeout: 5000,
   };
   ```

### Long-Term Actions

1. **Implement Circuit Breakers**:
   - Add circuit breakers for Supabase calls
   - Fail fast when dependency is down
   - Graceful degradation

2. **Improve Error Handling**:
   - Add specific error types for common failures
   - Return user-friendly error messages
   - Log error context (user ID, request ID)

3. **Add Chaos Engineering**:
   - Test failure scenarios in staging
   - Verify error handling and recovery
   - Practice runbooks regularly

4. **Increase Monitoring Coverage**:
   - Add error tracking by endpoint
   - Track error patterns and trends
   - Alert on error rate increase (not just absolute numbers)

---

## Escalation

### Escalate If:

- Error rate doesn't decrease within 15 minutes
- Unable to identify root cause
- Database or Supabase issues beyond our control
- Multiple incidents occurring simultaneously

### Escalation Path:

1. **15 minutes**: Notify Platform Team Lead (@platform-lead)
2. **30 minutes**: Escalate to Engineering Manager
3. **45 minutes**: Consider involving CTO

### Contact Information:

- Platform Lead: platform-lead@petforce.app
- Engineering Manager: eng-manager@petforce.app
- CTO: cto@petforce.app
- PagerDuty: Call +1-XXX-XXX-XXXX

---

## Related Runbooks

- [High Latency](./high-latency.md)
- [Database Connection Pool Exhausted](./db-connection-pool.md)
- [Database Connection Failures](./db-connection-failure.md)
- [Service Down](./service-down.md)

---

## Appendix: Common Commands

```bash
# Quick health check
curl https://petforce.app/health/ready | jq

# View error logs (last hour)
kubectl logs -n petforce deployment/petforce-web --since=1h | grep "ERROR"

# Count errors by type
kubectl logs -n petforce deployment/petforce-web --since=1h | grep "ERROR" | awk '{print $5}' | sort | uniq -c

# Restart all pods
kubectl rollout restart deployment/petforce-web -n petforce

# Scale up replicas
kubectl scale deployment petforce-web -n petforce --replicas=5

# Rollback deployment
kubectl rollout undo deployment/petforce-web -n petforce

# Check pod resource usage
kubectl top pods -n petforce

# Describe pod for events
kubectl describe pod -n petforce <pod-name>

# Get recent events
kubectl get events -n petforce --sort-by='.lastTimestamp' | tail -20
```

---

**Last Updated**: 2026-02-02  
**Maintained By**: Platform Team  
**Review Schedule**: Quarterly
