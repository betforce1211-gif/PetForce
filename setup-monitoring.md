# Setting Up Production Monitoring for PetForce

## Problem Identified

Larry built comprehensive logging infrastructure but **never configured it**. All errors are going to `console.log` instead of a monitoring service, making them invisible in production.

## Current State

- ✅ Logging infrastructure exists (`packages/auth/src/utils/logger.ts`)
- ✅ Monitoring adapters exist (Datadog, Sentry, CloudWatch support)
- ❌ No monitoring service configured
- ❌ No API keys set up
- ❌ All errors going to console (lost after reload)

## Quick Fix: Enable Sentry (Free tier: 5k errors/month)

### Step 1: Create Sentry Account (2 minutes)

1. Go to https://sentry.io/signup/
2. Sign up (free account)
3. Create a new project: "PetForce Auth"
4. Copy your DSN (format: `https://xxx@sentry.io/xxx`)

### Step 2: Add to .env (30 seconds)

Add these lines to your `.env` file:

```bash
# Monitoring Configuration
MONITORING_BACKEND=sentry
MONITORING_API_KEY=https://YOUR_KEY_HERE@sentry.io/YOUR_PROJECT
NODE_ENV=production
SERVICE_NAME=petforce-auth
```

### Step 3: Restart Server (10 seconds)

```bash
# Stop current server (Ctrl+C)
cd apps/web && npm run dev
```

### Step 4: Test It Works (1 minute)

Trigger an error and check Sentry dashboard:

```bash
# Trigger test error
curl http://localhost:3001/api/test-error
```

Check https://sentry.io - you should see the error!

## What You'll Get

Once configured, you'll see in Sentry dashboard:

- **All errors** with stack traces
- **User context** (hashed for privacy)
- **Request IDs** for correlation
- **Error frequency** and trends
- **Email/Slack alerts** for critical errors
- **Source maps** to debug production issues

## Larry's Complete Logging System

The system logs:

### Auth Events (all tracked):
- `registration_attempt_started`
- `registration_completed`
- `registration_failed`
- `login_attempt_started`
- `login_completed`
- `login_failed`
- `login_rejected_unconfirmed`
- `logout_attempt_started`
- `logout_completed`

### Errors (all caught):
- Database errors
- Rate limiting
- Invalid credentials
- Missing sessions
- Unexpected errors

### Metrics (all recorded):
- Auth event counts
- Error rates
- Response times
- User flows

## Alternative: Datadog (Enterprise)

If you prefer Datadog:

```bash
MONITORING_BACKEND=datadog
MONITORING_API_KEY=your_datadog_api_key
NODE_ENV=production
SERVICE_NAME=petforce-auth
```

Get API key: https://app.datadoghq.com/account/settings#api

## Alternative: Console (Development Only)

Current default - logs to console:

```bash
MONITORING_BACKEND=console
# No API key needed
```

**DO NOT use in production** - logs are lost!

## Why This Matters

**Without monitoring:**
- ❌ You only find bugs when users report them
- ❌ No visibility into error rates
- ❌ Can't track down production issues
- ❌ No alerts when things break
- ❌ Can't measure impact of deployments

**With monitoring:**
- ✅ See errors as they happen
- ✅ Get alerted before users complain
- ✅ Track error trends over time
- ✅ Debug production issues with stack traces
- ✅ Know immediately when deployments break things

## Cost

**Sentry Free Tier:**
- 5,000 errors/month
- 1 project
- 7 days retention
- Perfect for MVP

**Sentry Paid ($26/month):**
- 50,000 errors/month
- Unlimited projects
- 90 days retention
- Performance monitoring

## Summary

Larry built world-class logging infrastructure but forgot to plug it in!

**Action Items:**
1. ✅ Create Sentry account (2 min)
2. ✅ Add DSN to .env (30 sec)
3. ✅ Restart server (10 sec)
4. ✅ Test error tracking works (1 min)

**Total time: 5 minutes to go from blind to full visibility**
