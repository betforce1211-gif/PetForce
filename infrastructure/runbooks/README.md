# PetForce Runbooks

Operational runbooks for responding to incidents and performing common infrastructure tasks.

## Purpose

These runbooks provide step-by-step instructions for:

- Responding to production incidents
- Troubleshooting common issues
- Performing routine maintenance
- Executing emergency procedures

## Available Runbooks

### Incidents

1. [High Error Rate](./high-error-rate.md) - Application returning excessive errors
2. [High Latency](./high-latency.md) - Slow API responses
3. [High Memory Usage](./high-memory.md) - Memory exhaustion or OOM kills
4. [Database Connection Pool Exhausted](./db-connection-pool.md) - No available database connections
5. [Slow Database Queries](./slow-queries.md) - Database performance degradation
6. [Database Connection Failures](./db-connection-failure.md) - Cannot connect to database
7. [Authentication Failures](./auth-failures.md) - Users cannot log in
8. [Service Down](./service-down.md) - Complete service outage
9. [Pod Crash Looping](./pod-crash-looping.md) - Kubernetes pods restarting repeatedly

### Maintenance

10. [Scaling Infrastructure](./scaling.md) - Manual scaling procedures
11. [Database Maintenance](./db-maintenance.md) - Routine database tasks
12. [Certificate Renewal](./cert-renewal.md) - SSL/TLS certificate management
13. [Backup and Restore](./backup-restore.md) - Data backup and recovery
14. [Log Management](./log-management.md) - Log retention and analysis

## Using Runbooks

Each runbook follows this structure:

1. **Overview** - What the issue is and why it matters
2. **Symptoms** - How to recognize the issue
3. **Impact** - What users/systems are affected
4. **Diagnosis** - How to confirm the root cause
5. **Resolution** - Step-by-step fix
6. **Prevention** - How to avoid in the future
7. **Escalation** - When to escalate and to whom

## Severity Levels

- **P0 (Critical)**: Complete service outage or data loss - Page immediately
- **P1 (High)**: Severe degradation affecting many users - Alert on-call
- **P2 (Medium)**: Moderate impact - Create ticket and notify team
- **P3 (Low)**: Minor issues - Fix during business hours

## On-Call Contacts

- **Platform Team**: @platform-team (Slack), platform-oncall@petforce.app
- **Database Team**: @database-team (Slack), db-oncall@petforce.app
- **Security Team**: @security-team (Slack), security-oncall@petforce.app

## Quick Reference

### Common Commands

```bash
# Check service health
curl https://petforce.app/health

# View recent logs
kubectl logs -n petforce deployment/petforce-web --tail=100

# Scale deployment
kubectl scale deployment petforce-web -n petforce --replicas=5

# Check pod status
kubectl get pods -n petforce

# Restart deployment
kubectl rollout restart deployment/petforce-web -n petforce

# Check database connections
psql -U postgres -h $DB_HOST -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis memory
redis-cli INFO memory

# View DataDog dashboard
open https://app.datadoghq.com/dashboard/petforce-production
```

### Emergency Procedures

If you encounter a P0 incident:

1. **Acknowledge** - Acknowledge the PagerDuty alert immediately
2. **Assess** - Determine impact and affected systems
3. **Communicate** - Post in #incidents Slack channel
4. **Mitigate** - Follow relevant runbook to restore service
5. **Escalate** - Escalate to senior engineer if unresolved in 15 minutes
6. **Resolve** - Confirm service restored and close incident
7. **Document** - Complete post-mortem within 48 hours

## Contributing

When creating or updating runbooks:

1. Use the [runbook template](./template.md)
2. Include actual commands and examples
3. Test procedures in staging first
4. Get review from team lead
5. Update this README with new runbooks

---

**Remember**: During an incident, user safety and data integrity are top priorities. When in doubt, err on the side of caution and escalate.
