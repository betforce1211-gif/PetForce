# Runbook: {{SERVICE_OR_PROCEDURE_NAME}}

> **⚠️ INTERNAL DOCUMENT** - Not for external distribution

| Field | Value |
|-------|-------|
| **Owner** | [Team/Person] |
| **Last Updated** | {{DATE}} |
| **Last Tested** | {{DATE}} |
| **Review Cycle** | Quarterly |
| **Criticality** | P0 / P1 / P2 / P3 |

---

## Overview

### Purpose
What this runbook covers and when to use it.

### Scope
- Systems/services affected
- Environments covered (prod, staging, etc.)
- What this does NOT cover

### When to Use This Runbook
- Triggered by [alert/event]
- During [scheduled maintenance]
- When [condition] occurs

---

## Quick Reference

### Key Commands

```bash
# Health check
kubectl get pods -n namespace | grep service-name

# View logs
kubectl logs -f deployment/service-name -n namespace

# Restart service
kubectl rollout restart deployment/service-name -n namespace

# Check metrics
curl http://service:8080/metrics
```

### Important Links

| Resource | URL |
|----------|-----|
| Service Dashboard | [Link] |
| Logs (Splunk/DataDog) | [Link] |
| Metrics (Grafana) | [Link] |
| Alerts | [Link] |
| Incident Channel | #incident-channel |

### Key Contacts

| Role | Name | Contact |
|------|------|---------|
| Primary On-Call | [Rotation] | [PagerDuty] |
| Service Owner | [Name] | [Slack/Email] |
| Escalation | [Name] | [Phone] |

---

## Prerequisites

### Access Required
- [ ] Kubernetes cluster access (`kubectl` configured)
- [ ] Cloud console access (AWS/GCP/Azure)
- [ ] Database access (read-only minimum)
- [ ] Secrets manager access
- [ ] PagerDuty/Incident management access

### Tools Needed
- `kubectl` v1.25+
- `aws-cli` or equivalent
- `jq` for JSON parsing
- VPN connected (if required)

### Verify Access
```bash
# Verify Kubernetes access
kubectl auth can-i get pods -n production

# Verify cloud access
aws sts get-caller-identity
```

---

## Service Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                        │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Service  │    │ Service  │    │ Service  │
    │ Pod 1    │    │ Pod 2    │    │ Pod 3    │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   Database   │
                  │   (Primary)  │
                  └──────────────┘
```

### Dependencies

| Dependency | Type | Impact if Down |
|------------|------|----------------|
| Database | Critical | Complete outage |
| Cache (Redis) | Important | Degraded performance |
| Auth Service | Critical | No new sessions |
| External API | Medium | Feature X unavailable |

---

## Standard Operating Procedures

### Procedure 1: [Health Check]

**When to perform:** Daily / On-alert / Before deployment

**Steps:**

1. **Check pod status**
   ```bash
   kubectl get pods -n production -l app=service-name
   ```
   
   **Expected output:**
   ```
   NAME                           READY   STATUS    RESTARTS
   service-name-abc123-xyz        1/1     Running   0
   service-name-abc123-uvw        1/1     Running   0
   ```
   
   **If not healthy:** → Go to [Troubleshooting: Pod Issues](#troubleshooting-pod-issues)

2. **Check service endpoints**
   ```bash
   curl -s http://service-name.production.svc/health | jq .
   ```
   
   **Expected output:**
   ```json
   {
     "status": "healthy",
     "checks": {
       "database": "ok",
       "cache": "ok"
     }
   }
   ```

3. **Verify metrics**
   - Open Grafana dashboard: [Link]
   - Confirm request rate is within normal range
   - Confirm error rate < 0.1%

---

### Procedure 2: [Scaling]

**When to perform:** High load alerts, planned events

**Steps:**

1. **Check current replicas**
   ```bash
   kubectl get hpa service-name -n production
   ```

2. **Manual scale (if HPA insufficient)**
   ```bash
   # Scale to N replicas
   kubectl scale deployment service-name -n production --replicas=N
   ```
   
   **⚠️ Warning:** Manual scaling overrides HPA. Remember to revert.

3. **Verify scaling complete**
   ```bash
   kubectl rollout status deployment/service-name -n production
   ```

4. **Monitor after scaling**
   - Watch dashboard for 10 minutes
   - Confirm load distribution

---

### Procedure 3: [Database Failover]

**When to perform:** Primary database failure

**⚠️ CRITICAL PROCEDURE** - Requires approval from [Role]

**Pre-checks:**
- [ ] Confirm primary is truly unavailable
- [ ] Notify #incident-channel
- [ ] Get approval from [approver]

**Steps:**

1. **Assess the situation**
   ```bash
   # Check database status
   aws rds describe-db-instances --db-instance-identifier prod-db
   ```

2. **Initiate failover**
   ```bash
   # Trigger failover (this will cause brief downtime)
   aws rds failover-db-cluster --db-cluster-identifier prod-cluster
   ```

3. **Update connection strings** (if not automatic)
   ```bash
   # Update ConfigMap
   kubectl edit configmap service-config -n production
   # Change DB_HOST to replica endpoint
   ```

4. **Restart services to pick up new config**
   ```bash
   kubectl rollout restart deployment/service-name -n production
   ```

5. **Verify connectivity**
   ```bash
   kubectl exec -it deployment/service-name -n production -- psql -c "SELECT 1"
   ```

**Post-procedure:**
- [ ] Update incident timeline
- [ ] Monitor for 30 minutes
- [ ] Schedule primary repair/rebuild

---

## Troubleshooting

### Troubleshooting: Pod Issues

#### Pods Not Starting

**Symptoms:** Pods in `Pending` or `CrashLoopBackOff`

**Diagnosis:**
```bash
# Get pod details
kubectl describe pod <pod-name> -n production

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'
```

**Common Causes & Fixes:**

| Cause | Indicators | Fix |
|-------|------------|-----|
| Resource limits | "Insufficient cpu/memory" | Increase limits or scale nodes |
| Image pull failure | "ImagePullBackOff" | Check image exists, check secrets |
| Failed liveness probe | "Liveness probe failed" | Check application startup, increase timeout |
| Config error | "Error in config" | Review ConfigMap/Secrets |

---

### Troubleshooting: High Latency

**Symptoms:** p99 latency > threshold, user complaints

**Diagnosis:**

1. **Check service metrics**
   ```bash
   # Get latency percentiles from metrics endpoint
   curl -s http://service:8080/metrics | grep latency
   ```

2. **Check downstream dependencies**
   ```bash
   # Database connection pool
   kubectl exec -it deployment/service-name -- curl localhost:8080/debug/db-pool
   
   # Cache hit rate
   kubectl exec -it deployment/service-name -- curl localhost:8080/debug/cache-stats
   ```

3. **Check for resource contention**
   ```bash
   kubectl top pods -n production
   ```

**Common Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| Database slow queries | Identify and optimize queries |
| Cache misses | Warm cache, check eviction policy |
| CPU throttling | Increase CPU limits |
| Memory pressure | Increase memory, check for leaks |

---

### Troubleshooting: Error Spike

**Symptoms:** Error rate > threshold, 5xx responses

**Diagnosis:**

1. **Identify error types**
   ```bash
   # Check recent logs for errors
   kubectl logs -l app=service-name -n production --since=10m | grep -i error | head -50
   ```

2. **Check for patterns**
   - Specific endpoint?
   - Specific user/tenant?
   - Specific time pattern?

3. **Check dependencies**
   ```bash
   # Database connectivity
   kubectl exec deployment/service-name -- curl localhost:8080/health/db
   
   # External service status
   curl https://status.external-service.com/api/v1/status
   ```

**Mitigation Options:**

| Option | When to Use | Command |
|--------|-------------|---------|
| Restart pods | Memory leak, stuck state | `kubectl rollout restart deployment/service-name -n production` |
| Scale up | Load-related errors | `kubectl scale deployment ... --replicas=N` |
| Feature flag | Feature-specific errors | Toggle in feature flag dashboard |
| Rollback | Deployment-related | `kubectl rollout undo deployment/service-name -n production` |

---

## Rollback Procedures

### Application Rollback

**When to use:** Deployment caused issues, need to revert

```bash
# View rollout history
kubectl rollout history deployment/service-name -n production

# Rollback to previous version
kubectl rollout undo deployment/service-name -n production

# Rollback to specific revision
kubectl rollout undo deployment/service-name -n production --to-revision=N

# Verify rollback
kubectl rollout status deployment/service-name -n production
```

### Database Migration Rollback

**⚠️ DANGER ZONE** - Data loss possible

1. **Assess impact**
   - What data was modified?
   - Is rollback safe?

2. **Run rollback migration**
   ```bash
   # Connect to migrations pod
   kubectl exec -it job/migrations -n production -- bash
   
   # Run rollback
   ./migrate down 1
   ```

3. **Verify data integrity**

---

## Maintenance Windows

### Scheduled Maintenance

**Typical maintenance:** Tuesdays 2-4 AM UTC

**Pre-maintenance:**
- [ ] Notify stakeholders 48h in advance
- [ ] Post in #engineering 24h in advance
- [ ] Prepare rollback plan

**During maintenance:**
- [ ] Enable maintenance mode (if applicable)
- [ ] Perform changes
- [ ] Run verification procedures
- [ ] Disable maintenance mode

**Post-maintenance:**
- [ ] Monitor for 30 minutes
- [ ] Send completion notification

---

## Appendix

### Environment Details

| Environment | Cluster | Namespace | Replicas |
|-------------|---------|-----------|----------|
| Production | prod-cluster | production | 3-10 (HPA) |
| Staging | staging-cluster | staging | 2 |
| Development | dev-cluster | development | 1 |

### Configuration Reference

| Config Key | Description | Default | Where Set |
|------------|-------------|---------|-----------|
| `DB_HOST` | Database hostname | - | ConfigMap |
| `CACHE_URL` | Redis URL | - | ConfigMap |
| `LOG_LEVEL` | Logging verbosity | `info` | ConfigMap |
| `API_KEY` | External API key | - | Secret |

### Metrics Reference

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `http_request_duration_seconds` | Request latency | p99 > 500ms |
| `http_requests_total{status=~"5.."}` | Error count | > 10/min |
| `process_cpu_seconds_total` | CPU usage | > 80% |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | YYYY-MM-DD | [Name] | Initial runbook |
| 1.1 | YYYY-MM-DD | [Name] | Added database failover |
| 1.2 | YYYY-MM-DD | [Name] | Updated scaling procedure |

---

**⚠️ Remember to test this runbook periodically and update after any incidents.**

*Last tested: {{DATE}} by [Name]*
