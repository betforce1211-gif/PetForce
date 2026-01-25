# Chuck's CI/CD Setup Guide

This document contains all the steps needed to set up the PetForce repository with proper CI/CD pipelines, deployment automation, and monitoring.

## Table of Contents

- [GitHub Repository Setup](#github-repository-setup)
- [Branch Protection Rules](#branch-protection-rules)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [GitHub Environments](#github-environments)
- [Vercel Deployment Setup](#vercel-deployment-setup)
- [Supabase Configuration](#supabase-configuration)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Workflow Overview](#workflow-overview)
- [Troubleshooting](#troubleshooting)

---

## GitHub Repository Setup

### 1. Create New Repository

```bash
# Option 1: Via GitHub CLI
gh repo create PetForce/petforce --public --description "Pet care platform with autonomous development"

# Option 2: Via GitHub Web UI
# Go to github.com/new and create repository
```

### 2. Initialize Git and Push

```bash
cd /Users/danielzeddr/PetForce

# Initialize git
git init

# Add all files
git add .

# Initial commit
git commit -m "chore: initial commit with auth bug fix and CI/CD setup

- Complete authentication system with email verification
- Comprehensive logging and metrics collection
- Real-time monitoring dashboard
- Full CI/CD pipeline with GitHub Actions
- OpenSpec integration for requirements management

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Add remote
git remote add origin https://github.com/PetForce/petforce.git

# Create main and develop branches
git branch -M main
git push -u origin main

# Create develop branch
git checkout -b develop
git push -u origin develop
```

---

## Branch Protection Rules

### Configure via GitHub Web UI

Go to: `Settings → Branches → Add rule`

### `main` Branch Protection

**Branch name pattern**: `main`

**Settings**:
- ✅ Require a pull request before merging
  - ✅ Require approvals: **2**
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Required checks**:
    - `Lint Code`
    - `Type Check`
    - `Run Tests`
    - `Build All Apps (web)`
    - `Build All Apps (mobile)`
    - `Validate OpenSpec`
    - `All CI Checks Passed`
- ✅ Require conversation resolution before merging
- ✅ Require linear history
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches
  - Add: Maintainers only

### `develop` Branch Protection

**Branch name pattern**: `develop`

**Settings**:
- ✅ Require a pull request before merging
  - ✅ Require approvals: **1**
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Required checks**:
    - `Lint Code`
    - `Type Check`
    - `Run Tests`
    - `All CI Checks Passed`
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

---

## GitHub Secrets Configuration

Go to: `Settings → Secrets and variables → Actions → New repository secret`

### Supabase Secrets

#### Staging Environment
```
STAGING_SUPABASE_URL=https://your-project.supabase.co
STAGING_SUPABASE_ANON_KEY=eyJhbGc...
STAGING_SUPABASE_PROJECT_REF=your-staging-project-ref
```

#### Production Environment
```
PROD_SUPABASE_URL=https://your-prod-project.supabase.co
PROD_SUPABASE_ANON_KEY=eyJhbGc...
PROD_SUPABASE_PROJECT_REF=your-production-project-ref
```

#### Supabase CLI
```
SUPABASE_ACCESS_TOKEN=sbp_...
```

**To get Supabase tokens**:
```bash
# Login to Supabase CLI
npx supabase login

# Get access token
npx supabase projects list
# Copy project reference IDs

# Get anon keys from Supabase dashboard:
# Project Settings → API → anon public key
```

### Vercel Deployment Secrets

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=team_xxx or user_xxx
VERCEL_PROJECT_ID=prj_xxx
```

**To get Vercel tokens**:
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd apps/web
vercel link

# Get tokens from .vercel/project.json
cat .vercel/project.json
```

Or via Vercel dashboard:
- `VERCEL_TOKEN`: Settings → Tokens → Create Token
- `VERCEL_ORG_ID`: Check .vercel/project.json after linking
- `VERCEL_PROJECT_ID`: Check .vercel/project.json after linking

### Testing Secrets

```
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=SecureTestPassword123!

PROD_TEST_USER_EMAIL=prod-test@example.com
PROD_TEST_USER_PASSWORD=SecureProdPassword123!
```

### Monitoring and Alerts

#### Sentry (Error Tracking)
```
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your-org-name
SENTRY_PROJECT=petforce-web
```

**Setup Sentry**:
1. Go to sentry.io → Create account
2. Create new project: "petforce-web"
3. Get auth token: Settings → Account → API → Auth Tokens
4. Create token with `project:releases` scope

#### Slack Notifications
```
SLACK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Setup Slack**:
1. Go to api.slack.com/apps → Create New App
2. Choose "Incoming Webhooks"
3. Activate Incoming Webhooks
4. Add New Webhook to Workspace
5. Copy webhook URL

#### Snyk (Security Scanning)
```
SNYK_TOKEN=your_snyk_token
```

**Setup Snyk**:
1. Go to snyk.io → Create account
2. Go to Account Settings → API Token
3. Generate and copy token

### Optional: Codecov

```
CODECOV_TOKEN=your_codecov_token
```

---

## GitHub Environments

Go to: `Settings → Environments`

### Create `staging` Environment

**Settings**:
- **Deployment branches**: `develop` only
- **Environment secrets**: (same as staging secrets above)
- **Reviewers**: Not required (auto-deploy)
- **Wait timer**: 0 minutes

### Create `production` Environment

**Settings**:
- **Deployment branches**: `main` and `tags matching v*.*.*`
- **Environment secrets**: (same as production secrets above)
- **Required reviewers**: Add team leads (at least 1)
- **Wait timer**: 0 minutes
- **Deployment protection rules**:
  - ✅ Required reviewers (1-2 people)

---

## Vercel Deployment Setup

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Create Projects

#### Web App (Staging)
```bash
cd apps/web
vercel --name petforce-web-staging
```

When prompted:
- Link to existing project? **No**
- Project name: **petforce-web-staging**
- Output directory: **dist**
- Build command: **npm run build**
- Development command: **npm run dev**

Add custom domain in Vercel dashboard:
- Domain: `staging.petforce.app`

#### Web App (Production)
```bash
vercel --prod --name petforce-web
```

Add custom domain:
- Domain: `petforce.app` (production)

### 4. Configure Environment Variables in Vercel

Go to Vercel project → Settings → Environment Variables

**Staging Project**:
```
VITE_SUPABASE_URL = https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
NODE_ENV = staging
```

**Production Project**:
```
VITE_SUPABASE_URL = https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
NODE_ENV = production
```

---

## Supabase Configuration

### 1. Create Supabase Projects

Create two projects on supabase.com:
1. **petforce-staging** - For staging/development
2. **petforce-production** - For production

### 2. Configure Email Settings

**Project Settings → Auth → Email Templates**

Update templates to use your domain:
- Confirmation URL: `https://staging.petforce.app/auth/verify` (staging)
- Confirmation URL: `https://petforce.app/auth/verify` (production)

### 3. Enable Email Confirmation

**Project Settings → Auth → Settings**
- ✅ Enable email confirmations
- Confirmation URL: (set above)

### 4. Configure SMTP (Optional but Recommended)

Instead of Supabase's built-in email:
- Use SendGrid, AWS SES, or Postmark
- Better deliverability and tracking

**Auth Settings → SMTP**:
- Host: smtp.sendgrid.net
- Port: 587
- User: apikey
- Password: SG.your_api_key
- Sender email: noreply@petforce.app

### 5. Database Migrations

```bash
# Link to staging
npx supabase link --project-ref your-staging-ref

# Push current schema
npx supabase db push

# Repeat for production
npx supabase link --project-ref your-prod-ref
npx supabase db push
```

---

## Monitoring and Alerts

### Sentry Setup

1. **Create Sentry Project**
   - Go to sentry.io
   - Create project: "petforce-web"
   - Platform: React

2. **Install Sentry SDK**
   ```bash
   cd apps/web
   npm install @sentry/react @sentry/vite-plugin
   ```

3. **Configure Sentry** (apps/web/src/main.tsx)
   ```typescript
   import * as Sentry from '@sentry/react';

   Sentry.init({
     dsn: 'https://...@sentry.io/...',
     environment: import.meta.env.MODE,
     tracesSampleRate: 1.0,
   });
   ```

### Slack Alerts

Alerts are sent for:
- ✅ Successful deployments
- ❌ Failed deployments
- 🚨 Failed post-deployment checks
- ⚠️ High error rates (via Sentry integration)

**Sentry → Slack Integration**:
1. Sentry → Settings → Integrations → Slack
2. Install Slack integration
3. Configure alerts to #engineering channel

### Auth Metrics Dashboard

Access the dashboard at:
- Staging: `https://staging.petforce.app/admin/auth-metrics`
- Production: `https://petforce.app/admin/auth-metrics`

**Alerts to Monitor**:
- Confirmation rate < 70%
- Login success rate < 70%
- Unconfirmed login rejections > 20%
- Average confirmation time > 60 minutes

---

## Workflow Overview

### CI Pipeline (`.github/workflows/ci.yml`)

**Triggers**: Every push and PR to `main` or `develop`

**Jobs**:
1. Install Dependencies (with caching)
2. Lint Code (ESLint)
3. Type Check (TypeScript)
4. Run Tests (Vitest)
5. Build All Apps (web, mobile)
6. Validate OpenSpec
7. Security Audit (npm audit, Snyk)

**Duration**: ~3-5 minutes

### Staging Deployment (`.github/workflows/deploy-staging.yml`)

**Triggers**: Push to `develop`

**Jobs**:
1. Deploy Web App to Vercel (staging)
2. Run Database Migrations
3. Run Smoke Tests
4. Notify Slack

**Duration**: ~2-3 minutes

**URL**: https://staging.petforce.app

### Production Deployment (`.github/workflows/deploy-production.yml`)

**Triggers**: Push to `main` or tags `v*.*.*`

**Jobs**:
1. Pre-Deployment Checks (full test suite)
2. Deploy Web App to Vercel (production) - **Requires manual approval**
3. Run Database Migrations
4. Create Sentry Release
5. Post-Deployment Verification
6. Create GitHub Release (if tagged)

**Duration**: ~5-10 minutes (including approval wait)

**URL**: https://petforce.app

---

## Deployment Process

### Staging Deployment (Automatic)

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes, commit
git add .
git commit -m "feat: add new feature"

# 3. Push to GitHub
git push origin feature/new-feature

# 4. Create PR to develop
gh pr create --base develop --title "Add new feature"

# 5. Wait for CI to pass
# 6. Get approval, merge PR
# 7. Staging auto-deploys! 🚀
```

### Production Deployment (Manual Approval)

```bash
# 1. From develop, create PR to main
git checkout develop
git pull origin develop
gh pr create --base main --title "Release v1.2.0"

# 2. Wait for CI to pass
# 3. Get 2 approvals
# 4. Merge PR to main
# 5. GitHub Actions triggers, waits for manual approval
# 6. Team lead approves deployment in GitHub UI
# 7. Production deploys! 🎉

# 8. Create release tag (optional)
git tag v1.2.0
git push origin v1.2.0
# This creates a GitHub Release automatically
```

---

## Troubleshooting

### CI Failing?

**Check**:
1. All tests pass locally: `npm test`
2. Linting passes: `npm run lint`
3. Type checking passes: `npm run typecheck`
4. Build succeeds: `npm run build`

**Common Issues**:
- Missing environment variables in secrets
- Node version mismatch (use .nvmrc)
- Dependency version conflicts
- Test timeouts (increase timeout in CI)

### Deployment Failing?

**Check**:
1. Vercel token is valid
2. Project IDs are correct
3. Environment variables are set in Vercel
4. Supabase credentials are correct
5. Build command works locally

**Common Issues**:
- Missing `VITE_*` environment variables
- Supabase project ref mismatch
- Vercel token expired
- Domain not configured in Vercel

### Smoke Tests Failing?

**Check**:
1. Staging URL is accessible
2. Test user credentials are correct
3. Test user exists in Supabase
4. Test user email is verified

**Debug**:
```bash
# Run smoke tests locally against staging
BASE_URL=https://staging.petforce.app npm run test:e2e:smoke
```

### Database Migrations Failing?

**Check**:
1. Supabase access token is valid
2. Project ref is correct
3. Migration files are valid SQL
4. No breaking schema changes

**Manual Migration**:
```bash
# Login to Supabase
npx supabase login

# Link to project
npx supabase link --project-ref your-ref

# Push migrations
npx supabase db push
```

---

## Health Checks

### Verify CI/CD is Working

```bash
# 1. Create test branch
git checkout -b test/ci-check

# 2. Make trivial change
echo "# Test" >> README.md

# 3. Commit and push
git add .
git commit -m "test: verify CI pipeline"
git push origin test/ci-check

# 4. Watch GitHub Actions run
gh run watch

# 5. Clean up
git checkout develop
git branch -D test/ci-check
git push origin --delete test/ci-check
```

### Verify Staging Deployment

```bash
# 1. Push to develop
git checkout develop
echo "# Test deployment" >> README.md
git add .
git commit -m "test: verify staging deployment"
git push origin develop

# 2. Wait for deployment
gh run watch

# 3. Check staging
curl https://staging.petforce.app/api/health

# 4. Revert test change
git revert HEAD
git push origin develop
```

---

## Secrets Checklist

Before going live, ensure all secrets are configured:

### Required Secrets (Production Won't Work Without These)
- [ ] `PROD_SUPABASE_URL`
- [ ] `PROD_SUPABASE_ANON_KEY`
- [ ] `PROD_SUPABASE_PROJECT_REF`
- [ ] `SUPABASE_ACCESS_TOKEN`
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`

### Recommended Secrets (For Monitoring)
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `SENTRY_ORG`
- [ ] `SLACK_WEBHOOK`

### Optional Secrets (Nice to Have)
- [ ] `SNYK_TOKEN`
- [ ] `CODECOV_TOKEN`

---

## Next Steps After Setup

1. **Test CI Pipeline**: Create test PR, verify all checks pass
2. **Test Staging Deployment**: Push to develop, verify deployment
3. **Configure Monitoring**: Set up Sentry, Slack alerts
4. **Create Test Users**: Add test accounts to staging and production
5. **Run Smoke Tests**: Verify critical flows work
6. **Document Rollback**: Plan for rollback if needed
7. **Train Team**: Ensure team knows deployment process
8. **Set Up Metrics**: Configure auth metrics dashboard monitoring
9. **Schedule Production Deploy**: Plan first production release

---

## Support

If you encounter issues:
- Check GitHub Actions logs
- Review Vercel deployment logs
- Check Supabase project logs
- Verify secrets are correctly set
- Consult CONTRIBUTING.md for development workflow

**Emergency Rollback**:
1. Go to Vercel dashboard
2. Find previous deployment
3. Click "Promote to Production"
4. Notify team in Slack

---

## Chuck's Best Practices Summary

✅ **Always**:
- Use feature branches
- Get PR approvals before merging
- Run tests locally before pushing
- Keep `main` and `develop` protected
- Use semantic versioning for releases
- Monitor deployments and metrics
- Document breaking changes

❌ **Never**:
- Push directly to `main` or `develop`
- Merge without CI passing
- Deploy without testing
- Skip PR reviews
- Commit secrets to Git
- Force push to protected branches
- Deploy on Fridays (unless critical)

---

**Created by Chuck (CI/CD Agent) for PetForce**
**Last Updated**: 2026-01-24
