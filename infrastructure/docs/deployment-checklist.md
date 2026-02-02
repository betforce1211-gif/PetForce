# Production Deployment Checklist

**Version**: 1.0.0
**Last Updated**: 2026-02-02

Use this checklist for every production deployment to ensure consistency and safety.

---

## Pre-Deployment (1-2 days before)

### Code & Tests
- [ ] All unit tests passing (`npm run test`)
- [ ] All integration tests passing (`npm run test:integration`)
- [ ] All E2E tests passing (`npm run test:e2e`)
- [ ] Code coverage ≥ 80% (`npm run test:coverage`)
- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] No critical Snyk vulnerabilities (`npm audit`)

### Code Review
- [ ] PR has 2+ approvals from senior engineers
- [ ] Security review completed (if touching auth/data)
- [ ] Product owner approval (if UX changes)
- [ ] All PR comments addressed
- [ ] No "DO NOT MERGE" labels

### Database
- [ ] Database migrations written and tested
- [ ] Migrations tested on staging database
- [ ] Rollback migrations prepared
- [ ] Migration execution time estimated (< 5 minutes recommended)
- [ ] Index creation uses `CONCURRENTLY` (for PostgreSQL)
- [ ] Large table migrations scheduled for maintenance window (if needed)

### Documentation
- [ ] CHANGELOG.md updated with changes
- [ ] API documentation updated (if API changes)
- [ ] User-facing documentation updated (if needed)
- [ ] Runbook updated (if new operational procedures)
- [ ] Version number bumped in package.json

### Communication
- [ ] Deployment scheduled and communicated to team
- [ ] Stakeholders notified of deployment window
- [ ] Customer success team informed of changes
- [ ] On-call engineer identified and available
- [ ] Backup engineer identified (secondary on-call)

### Monitoring
- [ ] Dashboards reviewed and functional
- [ ] Alerts configured and tested
- [ ] Sentry project configured
- [ ] Datadog APM enabled
- [ ] Log aggregation working

### Rollback Plan
- [ ] Rollback procedure documented
- [ ] Previous version identified (tag/SHA)
- [ ] Database rollback scripts prepared (if needed)
- [ ] Estimated rollback time documented (< 5 minutes)
- [ ] Rollback tested in staging

---

## Day of Deployment

### Morning (Before Deployment)

#### Environment Verification
- [ ] Staging environment healthy and stable
- [ ] Staging deployment successful (within last 24 hours)
- [ ] Staging smoke tests passing
- [ ] No active incidents in production

#### Infrastructure Check
- [ ] AWS resources healthy (RDS, ECS, ElastiCache)
- [ ] Database connection pool not exhausted
- [ ] Disk space ≥ 30% free
- [ ] Memory usage < 70%
- [ ] CPU usage < 50%
- [ ] No scheduled AWS maintenance in next 2 hours

#### Backups
- [ ] Database backup completed (automated daily backup verified)
- [ ] Manual snapshot created (pre-deployment backup)
  ```bash
  aws rds create-db-snapshot \
    --db-instance-identifier petforce-production \
    --db-snapshot-identifier pre-deploy-$(date +%Y%m%d-%H%M%S)
  ```
- [ ] Snapshot verified and available

#### Communication
- [ ] Deployment announcement posted to #engineering
  ```
  🚀 Production Deployment Starting
  Version: v1.2.0
  ETA: 45 minutes
  Changes: [link to CHANGELOG]
  On-call: @engineer
  ```
- [ ] Status page updated (if customer-facing changes)

---

## During Deployment (30-45 minutes)

### Step 1: Pre-Deployment Tasks (5 minutes)
- [ ] Set deployment in progress flag
  ```bash
  redis-cli SET deployment:in_progress "v1.2.0-$(date +%s)"
  ```
- [ ] Enable read-only mode (if needed for migrations)
- [ ] Increase alert thresholds temporarily (if needed)

### Step 2: Database Migrations (1-5 minutes)
- [ ] Run migrations on production database
  ```bash
  npm run migrate:production
  ```
- [ ] Verify migrations applied
  ```sql
  SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;
  ```
- [ ] Check migration logs for errors
- [ ] Test critical queries still work

### Step 3: Application Deployment (15-20 minutes)
- [ ] Merge PR to `main` branch
  ```bash
  git checkout main
  git pull origin main
  git push origin main
  ```
- [ ] GitHub Actions CI/CD triggered automatically
- [ ] Monitor CI/CD progress
  - [ ] Tests pass (2 min)
  - [ ] Docker build succeeds (3 min)
  - [ ] Image pushed to ECR (1 min)
  - [ ] ECS task definition updated (1 min)
- [ ] Blue-green deployment starts
  - [ ] New tasks launched (green environment)
  - [ ] Health checks passing on green
  - [ ] Traffic cutover 0% → 50% → 100%
  - [ ] Old tasks drained (blue environment)

### Step 4: Verification (10-15 minutes)
- [ ] Health check endpoints responding
  ```bash
  curl https://api.petforce.app/health
  curl https://api.petforce.app/health/ready
  ```
- [ ] Critical API endpoints working
  ```bash
  # Test household creation
  curl -X POST https://api.petforce.app/api/v1/households \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Test Household"}'

  # Test household join
  curl https://api.petforce.app/api/v1/households/join?code=TEST-CODE
  ```
- [ ] Dashboard metrics normal
  - [ ] Error rate < 0.1%
  - [ ] P99 latency < 500ms
  - [ ] Success rate > 99.9%
  - [ ] No spike in 500 errors
- [ ] Database queries performing normally
  ```sql
  SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
  SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5;
  ```
- [ ] Sentry shows no new critical errors
- [ ] Datadog APM shows healthy traces
- [ ] CloudWatch logs show no errors

### Step 5: Smoke Tests (5 minutes)
- [ ] Run automated smoke tests
  ```bash
  npm run test:smoke:production
  ```
- [ ] Manual smoke tests
  - [ ] Create household (web)
  - [ ] Join household (web)
  - [ ] Approve request (web)
  - [ ] View household dashboard (web)
  - [ ] Create household (mobile - if deployed)
- [ ] Test critical user flows
  - [ ] Registration → Create household → Generate invite
  - [ ] Registration → Join household → Get approved

---

## Post-Deployment (30 minutes monitoring)

### Immediate (First 5 minutes)
- [ ] Monitor error rates every minute
- [ ] Watch for alert spikes
- [ ] Check Sentry for new errors
- [ ] Verify no rollback needed

### Short-term (First 30 minutes)
- [ ] Monitor key metrics:
  - [ ] Request rate stable
  - [ ] Error rate < 0.1%
  - [ ] Latency p99 < 500ms
  - [ ] Database connection pool normal
  - [ ] CPU/Memory normal
- [ ] Review Datadog traces for anomalies
- [ ] Check user feedback channels (if available)
- [ ] Monitor business metrics:
  - [ ] Household creations still happening
  - [ ] Join requests still happening
  - [ ] No drop in active users

### Cleanup (After 30 minutes of stability)
- [ ] Clear deployment flag
  ```bash
  redis-cli DEL deployment:in_progress
  ```
- [ ] Restore normal alert thresholds
- [ ] Disable read-only mode (if enabled)
- [ ] Tag release in GitHub
  ```bash
  git tag -a v1.2.0 -m "Release v1.2.0"
  git push origin v1.2.0
  ```
- [ ] Create GitHub release with CHANGELOG
  ```bash
  gh release create v1.2.0 \
    --title "v1.2.0" \
    --notes "$(cat CHANGELOG.md)"
  ```

### Communication
- [ ] Post deployment success to #engineering
  ```
  ✅ Production Deployment Complete
  Version: v1.2.0
  Duration: 35 minutes
  Status: Successful
  Metrics: ✅ Error rate: 0.05% | P99: 245ms | Success: 99.95%
  ```
- [ ] Update status page (if used)
- [ ] Notify stakeholders
- [ ] Thank the team

---

## Long-term Monitoring (24 hours)

### Next 24 Hours
- [ ] Monitor error rates daily
- [ ] Check for increased bug reports
- [ ] Review Sentry for patterns
- [ ] Monitor business metrics for anomalies
- [ ] Check user feedback

### If Issues Detected
- [ ] Follow incident response procedures
- [ ] Consider rollback if critical
- [ ] Document issues for post-mortem

---

## Rollback Procedure (If Needed)

**Decision Point**: Rollback if:
- Error rate > 5% for 5+ minutes
- Critical functionality broken
- Database corruption detected
- Unrecoverable user-facing issue

### Rollback Steps (< 5 minutes)

1. **Immediate**:
   ```bash
   # Trigger rollback workflow
   gh workflow run rollback.yml \
     --field version=v1.1.0 \
     --field environment=production
   ```

2. **Database Rollback** (if needed):
   ```bash
   # Restore from pre-deployment snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier petforce-production \
     --db-snapshot-identifier pre-deploy-YYYYMMDD-HHMMSS
   ```

3. **Verify**:
   - [ ] Old version deployed
   - [ ] Health checks passing
   - [ ] Error rate normal
   - [ ] Critical flows working

4. **Communicate**:
   ```
   🔄 ROLLBACK COMPLETE
   Rolled back to: v1.1.0
   Reason: [explanation]
   Status: System stable
   Next steps: [investigation plan]
   ```

---

## Post-Deployment Tasks (Within 1 week)

- [ ] Monitor metrics for 7 days
- [ ] Review Sentry errors for patterns
- [ ] Collect user feedback
- [ ] Write post-deployment report
- [ ] Update documentation based on learnings
- [ ] Schedule retrospective (if issues occurred)
- [ ] Plan next deployment

---

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| On-call Engineer | Check PagerDuty | 24/7 |
| Engineering Lead | @engrid on Slack | Business hours |
| CTO | @larry on Slack | Escalation only |
| DBA | @buck on Slack | Database issues |
| DevOps | @isabel on Slack | Infrastructure |

---

## Useful Commands Reference

```bash
# Health checks
curl https://api.petforce.app/health
curl https://api.petforce.app/health/ready

# View ECS tasks
aws ecs list-tasks --cluster petforce-production --service-name api

# View logs
aws logs tail /ecs/petforce-production --follow

# Database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Redis check
redis-cli -h $REDIS_HOST ping

# Force ECS deployment
aws ecs update-service \
  --cluster petforce-production \
  --service api \
  --force-new-deployment

# Create database snapshot
aws rds create-db-snapshot \
  --db-instance-identifier petforce-production \
  --db-snapshot-identifier manual-$(date +%Y%m%d-%H%M%S)
```

---

## Notes

- **Deployment Window**: Tuesday-Thursday, 10am-4pm EST (avoid Mondays and Fridays)
- **Freeze Periods**: No deployments during major holidays or company events
- **Emergency Deployments**: Follow abbreviated checklist, get VP Engineering approval
- **Hotfixes**: Can skip some pre-deployment checks, but must be reviewed post-deployment

---

**Checklist Version**: 1.0.0
**Last Updated**: 2026-02-02
**Owner**: Infrastructure Team (Isabel)
