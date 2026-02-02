# CI/CD Pipeline Guide - Household Management System

## Overview

Our CI/CD pipeline ensures every change to the household management system is:
- **Tested automatically** across multiple test suites
- **Deployed safely** with gradual rollout strategies
- **Monitored continuously** for errors and performance issues

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Developer Workflow                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. Create feature branch                                        │
│ 2. Make changes (pre-commit hooks validate)                     │
│ 3. Push to GitHub (pre-push hooks run tests)                    │
│ 4. Create PR → CI pipeline runs                                 │
│ 5. Review + Approve                                             │
│ 6. Merge to develop → Staging deployment                        │
│ 7. Merge to main → Production deployment (blue-green)           │
└─────────────────────────────────────────────────────────────────┘
```

## Pipeline Stages

### 1. Pre-Commit Checks (Local)

**Triggered**: On every `git commit`

**What runs**:
- Lint-staged (ESLint + Prettier on changed files only)
- Commit message validation (Conventional Commits)

**Configuration**:
- `.husky/pre-commit`
- `.lintstagedrc.json`
- `commitlint.config.js`

**Example commit message**:
```bash
feat(household): add QR code sharing
fix(auth): resolve invite code expiration bug
docs(api): update household API documentation
```

### 2. Pre-Push Checks (Local)

**Triggered**: On every `git push`

**What runs**:
- Unit tests for changed packages
- TypeScript compilation check

**Configuration**: `.husky/pre-push`

### 3. Pull Request Pipeline (GitHub Actions)

**Triggered**: On PR creation/update

**Workflow**: `.github/workflows/household-ci.yml`

**Stages**:

#### Stage 1: Lint & Format (2-3 min)
- ESLint validation
- Prettier format check
- TypeScript type checking

#### Stage 2: Unit Tests (3-5 min)
- Run all unit tests with coverage
- Upload coverage to Codecov
- Require 90%+ coverage for household code

#### Stage 3: Integration Tests (5-7 min)
- Spin up PostgreSQL test database
- Run database migrations
- Execute integration tests
- Verify API contracts

#### Stage 4: E2E Tests (8-12 min)
- Install Playwright browsers
- Run end-to-end household workflows
- Test authentication flow
- Verify QR code scanning
- Upload test reports as artifacts

#### Stage 5: Security Scanning (3-5 min)
- Trivy vulnerability scanner (container images)
- TruffleHog secret detection
- Upload results to GitHub Security

#### Stage 6: Build Verification (5-8 min)
- Build all packages
- Build web application
- Build mobile application
- Upload build artifacts

**Total PR Pipeline Time**: ~25-35 minutes

### 4. Staging Deployment (Automatic)

**Triggered**: Merge to `develop` branch

**Workflow**: `.github/workflows/household-deploy-staging.yml`

**Steps**:
1. Run full test suite
2. Build web application
3. Build Docker images (if configured)
4. Deploy to AWS ECS staging (if configured)
5. Deploy to Vercel staging
6. Run database migrations on staging
7. Run smoke tests
8. Notify team via Slack

**Environment**: `staging.petforce.app`

**Rollback**: Manual via Vercel dashboard

### 5. Production Deployment (Blue-Green)

**Triggered**: Merge to `main` branch

**Workflow**: `.github/workflows/household-deploy-production.yml`

**Deployment Strategy**: Blue-Green with automatic rollback

**Steps**:

#### Phase 1: Pre-Deployment Quality Gates (15 min)
- Lint validation
- Type checking
- Full unit test suite
- Full E2E test suite
- Build verification

#### Phase 2: Deploy to Green Environment (10 min)
- Build Docker image
- Push to ECR
- Deploy to ECS green cluster
- Wait for health checks

#### Phase 3: Health Verification (5 min)
- Run smoke tests on green
- Check API endpoints
- Verify database connectivity
- Test critical user flows

#### Phase 4: Traffic Cutover (5 min)
- Switch ALB from blue → green
- Monitor error rates for 5 minutes
- Check CloudWatch metrics

#### Phase 5: Post-Deployment Monitoring (30 min)
- Monitor error rates (target: <5%)
- Monitor P99 latency (target: <1000ms)
- Monitor throughput
- Create Sentry release
- Alert on anomalies

#### Automatic Rollback Triggers:
- Error rate > 5%
- P99 latency > 2000ms
- Health check failures
- Smoke test failures

**Total Production Deployment Time**: ~65 minutes (with monitoring)

## Branch Strategy

### Branch Protection Rules

Configuration: `.github/branch-protection.json`

#### `main` (Production)
- ✅ Require 2 approving reviews
- ✅ Require code owner approval
- ✅ Dismiss stale reviews
- ✅ Require all status checks to pass:
  - lint-and-format
  - unit-tests
  - integration-tests
  - e2e-tests
  - security-scan
  - build
- ✅ Require linear history
- ✅ Block force pushes
- ✅ Block deletions
- ✅ Enforce for administrators

#### `develop` (Staging)
- ✅ Require 1 approving review
- ✅ Require status checks to pass:
  - lint-and-format
  - unit-tests
  - build
- ⚠️ Allow force push (with care)
- ✅ Block deletions

#### `feature/*` (Development)
- ✅ Require lint-and-format check
- ✅ Allow force pushes
- ✅ Allow deletions

## Release Automation

**Tool**: semantic-release

**Configuration**: `.releaserc.json`

**How it works**:
1. Analyzes commit messages since last release
2. Determines version bump (major/minor/patch)
3. Generates CHANGELOG.md
4. Creates Git tag
5. Creates GitHub release
6. Updates package.json

**Version Bumping Rules**:
- `feat:` → Minor version (1.2.0 → 1.3.0)
- `fix:` → Patch version (1.2.0 → 1.2.1)
- `BREAKING CHANGE:` → Major version (1.2.0 → 2.0.0)

**Example**:
```bash
# Commits since v1.2.0:
feat(household): add temporary member support
fix(auth): resolve invite code expiration
docs(api): update API documentation

# Result: v1.3.0 (minor bump due to feat)
```

## Deployment Rollback

### Automatic Rollback

Production deployment automatically rolls back if:
- Error rate exceeds 5% during monitoring period
- Health checks fail on green environment
- Smoke tests fail

### Manual Rollback

#### Option 1: GitHub Workflow
```bash
gh workflow run rollback-production.yml -f version=previous
```

#### Option 2: AWS Console
1. Go to ECS Console
2. Switch ALB listener back to blue target group
3. Verify traffic routing

#### Option 3: Vercel Dashboard
1. Open Vercel project
2. Go to Deployments
3. Click previous deployment → "Promote to Production"

### Rollback Checklist
- [ ] Identify failing deployment (SHA/version)
- [ ] Check error logs (Sentry/CloudWatch)
- [ ] Execute rollback
- [ ] Verify previous version is live
- [ ] Monitor error rates (should decrease)
- [ ] Notify team
- [ ] Create post-mortem

## Monitoring

### Post-Deployment Monitoring

**Workflow**: `.github/workflows/post-deploy-monitoring.yml`

**Runs for**: 30 minutes after production deployment

**Monitors**:
- ✅ Error rate (target: <5%)
- ✅ P99 latency (target: <1000ms)
- ✅ Request throughput (matches baseline)
- ✅ Database connection pool health
- ✅ API endpoint availability

**Integrations**:
- Datadog (metrics + APM)
- CloudWatch (AWS infrastructure)
- Sentry (error tracking)
- Slack (notifications)

### Key Metrics

#### Application Metrics
- `household.requests.count` - Total requests
- `household.requests.duration` - Response time
- `household.errors.rate` - Error percentage
- `household.members.count` - Active members

#### Infrastructure Metrics
- CPU utilization (target: <70%)
- Memory utilization (target: <80%)
- Database connections (target: <80% pool)
- Request queue depth (target: <100)

## Troubleshooting

### CI Pipeline Failures

#### Lint failures
```bash
# Run locally to see errors
npm run lint

# Auto-fix most issues
npm run lint:fix
```

#### Test failures
```bash
# Run specific test
npm test -- path/to/test.spec.ts

# Run with coverage
npm test -- --coverage

# Debug mode
npm test -- --debug
```

#### Build failures
```bash
# Check TypeScript errors
npm run typecheck

# Clear cache and rebuild
rm -rf dist node_modules
npm ci
npm run build
```

### Deployment Failures

#### Staging deployment failed
1. Check GitHub Actions logs
2. Verify Supabase credentials (secrets)
3. Check Vercel deployment logs
4. Run smoke tests locally

#### Production deployment failed (pre-rollback)
1. Check quality gate logs
2. Review test failures
3. Fix issues and re-deploy
4. Never skip quality gates

#### Production deployment rolled back automatically
1. Check CloudWatch/Datadog for error spike
2. Review Sentry for new errors
3. Check database migration logs
4. Create hotfix if needed

### Common Issues

#### Issue: Tests pass locally but fail in CI
- **Cause**: Environment differences
- **Fix**: Check environment variables, database state, timezone

#### Issue: Deployment succeeds but app is broken
- **Cause**: Environment-specific bug
- **Fix**: Improve E2E coverage, add smoke tests for critical paths

#### Issue: High error rate after deployment
- **Cause**: Breaking change, database issue
- **Fix**: Immediate rollback, investigate logs, create hotfix

## Best Practices

### For Developers

1. **Run tests locally** before pushing
   ```bash
   npm test -- --run
   npm run test:e2e
   ```

2. **Use conventional commits**
   ```bash
   feat(household): description
   fix(auth): description
   ```

3. **Keep PRs small** (<500 lines changed)

4. **Review CI failures** immediately, don't ignore warnings

5. **Test migrations** in staging before production

### For Reviewers

1. **Check test coverage** for new code
2. **Verify E2E tests** cover new features
3. **Review security implications** of changes
4. **Ensure documentation** is updated

### For Deployers

1. **Monitor deployments** for 30 minutes after production deploy
2. **Have rollback plan** ready before deploying
3. **Deploy during low-traffic hours** when possible
4. **Communicate deployments** to team via Slack

## Security

### Secret Management

**Never commit secrets!** Use GitHub Secrets:

```yaml
# In workflow files
env:
  API_KEY: ${{ secrets.API_KEY }}
```

**Required Secrets**:
- `SUPABASE_ACCESS_TOKEN`
- `VERCEL_TOKEN`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SENTRY_AUTH_TOKEN`
- `SLACK_WEBHOOK`

### Security Scanning

**Tools**:
- Trivy (vulnerability scanning)
- TruffleHog (secret detection)
- Dependabot (dependency updates)

**Results**: Uploaded to GitHub Security tab

## Performance

### Pipeline Optimization

- Caching node_modules (saves ~2 min)
- Parallel job execution
- Conditional workflows (only run on changes)
- Incremental builds

### Current Performance

| Pipeline | Duration | Target |
|----------|----------|--------|
| PR Checks | 25-35 min | <30 min |
| Staging Deploy | 15-20 min | <20 min |
| Production Deploy | 65 min | <90 min |

## Future Improvements

- [ ] Add canary deployments (1% → 10% → 100%)
- [ ] Implement feature flags for gradual rollout
- [ ] Add automated load testing in staging
- [ ] Implement ChatOps (deploy via Slack)
- [ ] Add visual regression testing
- [ ] Implement database migration rollback automation

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Blue-Green Deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)

## Support

For CI/CD issues:
- Check #engineering-ci-cd Slack channel
- Review GitHub Actions logs
- Consult this guide
- Ask DevOps team

---

**Last Updated**: 2026-02-02
**Maintained by**: DevOps Team (Chuck - CI/CD Agent)
