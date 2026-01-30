# Monitoring Service Implementation Guide

**For**: Larry (Logging/Observability) + Isabel (Infrastructure)
**Task**: Integrate Better Stack (Logtail) for production monitoring
**Priority**: HIGH - Required before production
**Estimated Time**: 4-6 hours

---

## Overview

This guide provides step-by-step instructions to integrate Better Stack's Logtail service for production logging, error tracking, and metrics monitoring.

---

## Prerequisites

- [ ] Better Stack account created
- [ ] Source token obtained
- [ ] Node.js 18+ installed
- [ ] Access to PetForce repository
- [ ] Environment variable access

---

## Step 1: Account Setup (15 minutes)

### 1.1 Create Better Stack Account

```bash
# Navigate to Better Stack
open https://betterstack.com/logtail

# Sign up with:
# - Email: team@petforce.com (or your org email)
# - Password: Use 1Password/secure password manager
```

### 1.2 Create Log Source

1. After login, click "Create Source"
2. Select "Node.js" as the platform
3. Name: **PetForce Auth Service**
4. Environment: **Production**
5. Click "Create Source"
6. **SAVE THE SOURCE TOKEN** (shown once)

### 1.3 Store Source Token Securely

```bash
# Add to .env (local development)
echo "LOGTAIL_SOURCE_TOKEN=your_token_here" >> /Users/danielzeddr/PetForce/.env

# Add to Vercel/production environment variables
# (Do this manually in Vercel dashboard)
```

---

## Step 2: Install Dependencies (15 minutes)

### 2.1 Install Logtail SDK

```bash
cd /Users/danielzeddr/PetForce/packages/auth

# Install Logtail Node.js SDK
npm install @logtail/node

# Install types
npm install --save-dev @types/node
```

### 2.2 Verify Installation

```bash
# Check package.json
cat package.json | grep logtail

# Expected output:
# "@logtail/node": "^0.4.0"
```

---

## Step 3: Update Logger Utility (2 hours)

### 3.1 Update logger.ts

**File**: `/Users/danielzeddr/PetForce/packages/auth/src/utils/logger.ts`

```typescript
// Structured logging utility for authentication events
// Provides request ID tracking and correlation

import { v4 as uuidv4 } from 'uuid';
import { Logtail } from '@logtail/node';
import { createHash } from 'crypto';
import { metrics } from './metrics';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  requestId?: string;
  userId?: string;
  email?: string;
  eventType?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
}

class Logger {
  private isDevelopment: boolean;
  private logtail: Logtail | null = null;

  constructor() {
    this.isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

    // Initialize Logtail in production
    if (!this.isDevelopment && process.env.LOGTAIL_SOURCE_TOKEN) {
      try {
        this.logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
      } catch (error) {
        console.error('Failed to initialize Logtail:', error);
      }
    }
  }

  /**
   * Generate a unique request ID for correlation
   */
  generateRequestId(): string {
    return uuidv4();
  }

  /**
   * Hash email for privacy in logs (production-grade)
   */
  private hashEmail(email: string): string {
    if (!email) return '';

    try {
      // Production: SHA-256 hash
      const hash = createHash('sha256')
        .update(email.toLowerCase())
        .digest('hex')
        .substring(0, 16);

      // Format: hash@domain (preserves domain for debugging)
      const domain = email.split('@')[1] || 'unknown';
      return `${hash}@${domain}`;
    } catch (error) {
      // Fallback to simple masking if hashing fails
      return `***@${email.split('@')[1] || 'unknown'}`;
    }
  }

  /**
   * Send log to Logtail (async, non-blocking)
   */
  private async sendToLogtail(entry: LogEntry): Promise<void> {
    if (!this.logtail) return;

    try {
      // Map our log levels to Logtail levels
      const logtailLevel = entry.level.toLowerCase() as 'debug' | 'info' | 'warn' | 'error';

      await this.logtail.log(entry.message, logtailLevel, {
        ...entry.context,
        timestamp: entry.timestamp,
        service: 'auth',
        environment: process.env.NODE_ENV || 'production',
      });
    } catch (error) {
      // Never throw in logging - just fallback to console
      console.error('Failed to send log to Logtail:', error);
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Format and output log entry
   */
  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        // Hash email if present for privacy (GDPR/CCPA compliance)
        email: context.email ? this.hashEmail(context.email) : undefined,
      },
    };

    // Development: console with colors
    if (this.isDevelopment) {
      const logFn = level === 'ERROR' ? console.error :
                    level === 'WARN' ? console.warn :
                    console.log;
      logFn(`[${entry.level}] ${entry.message}`, entry.context);
    } else {
      // Production: Send to Logtail (async, non-blocking)
      this.sendToLogtail(entry).catch((error) => {
        console.error('Logging error:', error);
      });
    }
  }

  /**
   * Log debug information (disabled in production)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('DEBUG', message, context);
    }
  }

  /**
   * Log informational events
   */
  info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  /**
   * Log warning events
   */
  warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  /**
   * Log error events
   */
  error(message: string, context?: LogContext): void {
    this.log('ERROR', message, context);
  }

  /**
   * Log authentication event with standardized format
   */
  authEvent(
    eventType: string,
    requestId: string,
    context: Omit<LogContext, 'eventType' | 'requestId'>
  ): void {
    this.info(`Auth event: ${eventType}`, {
      ...context,
      eventType,
      requestId,
    });

    // Also record metric for monitoring
    metrics.record(eventType, {
      requestId,
      ...context,
    });
  }

  /**
   * Flush logs (call before process exit)
   */
  async flush(): Promise<void> {
    if (this.logtail) {
      try {
        await this.logtail.flush();
      } catch (error) {
        console.error('Failed to flush logs:', error);
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { Logger };

// Graceful shutdown: flush logs before exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await logger.flush();
  });
}
```

### 3.2 Test Logger Changes

```bash
# Run TypeScript compiler
cd /Users/danielzeddr/PetForce/packages/auth
npm run typecheck

# Run tests
npm test
```

---

## Step 4: Update Metrics Utility (1.5 hours)

### 4.1 Update metrics.ts

**File**: `/Users/danielzeddr/PetForce/packages/auth/src/utils/metrics.ts`

```typescript
// Authentication Metrics Collection
// Tracks registration funnel and confirmation rates

import { Logtail } from '@logtail/node';

export interface AuthMetric {
  event: string;
  timestamp: number;
  userId?: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface MetricsSummary {
  registrationStarted: number;
  registrationCompleted: number;
  emailConfirmed: number;
  loginAttempts: number;
  loginSuccesses: number;
  loginRejectedUnconfirmed: number;
  confirmationRatePercent: number;
  loginSuccessRatePercent: number;
  avgTimeToConfirmMinutes: number | null;
}

class MetricsCollector {
  private metrics: AuthMetric[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k events in memory
  private metricsListeners: Array<(summary: MetricsSummary) => void> = [];
  private logtail: Logtail | null = null;

  constructor() {
    // Initialize Logtail in production
    const isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

    if (!isDevelopment && process.env.LOGTAIL_SOURCE_TOKEN) {
      try {
        this.logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
      } catch (error) {
        console.error('Failed to initialize Logtail for metrics:', error);
      }
    }
  }

  /**
   * Record an authentication metric
   */
  record(event: string, metadata?: Record<string, any>): void {
    const metric: AuthMetric = {
      event,
      timestamp: Date.now(),
      userId: metadata?.userId,
      email: metadata?.email,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Notify listeners
    this.notifyListeners();

    // In production, send to monitoring service
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
      this.sendToMonitoringService(metric);
    }
  }

  /**
   * Get metrics summary for a time period
   */
  getSummary(periodMs: number = 24 * 60 * 60 * 1000): MetricsSummary {
    const now = Date.now();
    const cutoff = now - periodMs;
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= cutoff);

    const registrationStarted = recentMetrics.filter(
      (m) => m.event === 'registration_attempt_started'
    ).length;

    const registrationCompleted = recentMetrics.filter(
      (m) => m.event === 'registration_completed'
    ).length;

    const emailConfirmed = recentMetrics.filter(
      (m) => m.event === 'email_confirmed'
    ).length;

    const loginAttempts = recentMetrics.filter(
      (m) => m.event === 'login_attempt_started'
    ).length;

    const loginSuccesses = recentMetrics.filter(
      (m) => m.event === 'login_completed'
    ).length;

    const loginRejectedUnconfirmed = recentMetrics.filter(
      (m) => m.event === 'login_rejected_unconfirmed'
    ).length;

    const confirmationRate = registrationCompleted > 0
      ? (emailConfirmed / registrationCompleted) * 100
      : 0;

    const loginSuccessRate = loginAttempts > 0
      ? (loginSuccesses / loginAttempts) * 100
      : 0;

    // Calculate average time to confirm
    let avgTimeToConfirm: number | null = null;
    const confirmTimes: number[] = [];

    recentMetrics
      .filter((m) => m.event === 'email_confirmed' && m.userId)
      .forEach((confirmMetric) => {
        const registrationMetric = recentMetrics.find(
          (m) =>
            m.event === 'registration_completed' &&
            m.userId === confirmMetric.userId
        );

        if (registrationMetric) {
          const timeDiff = confirmMetric.timestamp - registrationMetric.timestamp;
          confirmTimes.push(timeDiff);
        }
      });

    if (confirmTimes.length > 0) {
      const avgMs = confirmTimes.reduce((a, b) => a + b, 0) / confirmTimes.length;
      avgTimeToConfirm = avgMs / (1000 * 60); // Convert to minutes
    }

    return {
      registrationStarted,
      registrationCompleted,
      emailConfirmed,
      loginAttempts,
      loginSuccesses,
      loginRejectedUnconfirmed,
      confirmationRatePercent: Math.round(confirmationRate * 100) / 100,
      loginSuccessRatePercent: Math.round(loginSuccessRate * 100) / 100,
      avgTimeToConfirmMinutes: avgTimeToConfirm
        ? Math.round(avgTimeToConfirm * 100) / 100
        : null,
    };
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(listener: (summary: MetricsSummary) => void): () => void {
    this.metricsListeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.metricsListeners = this.metricsListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get all metrics for a time period
   */
  getMetrics(periodMs: number = 24 * 60 * 60 * 1000): AuthMetric[] {
    const cutoff = Date.now() - periodMs;
    return this.metrics.filter((m) => m.timestamp >= cutoff);
  }

  /**
   * Check if metrics indicate issues
   */
  checkAlerts(): Array<{ level: 'warning' | 'critical'; message: string }> {
    const alerts: Array<{ level: 'warning' | 'critical'; message: string }> = [];
    const summary = this.getSummary(60 * 60 * 1000); // Last hour

    // Alert: Low confirmation rate
    if (summary.registrationCompleted > 10 && summary.confirmationRatePercent < 70) {
      alerts.push({
        level: summary.confirmationRatePercent < 50 ? 'critical' : 'warning',
        message: `Low email confirmation rate: ${summary.confirmationRatePercent}% (last hour)`,
      });
    }

    // Alert: High unconfirmed login attempts
    if (summary.loginAttempts > 10 && summary.loginRejectedUnconfirmed > 5) {
      const rejectedPercent = (summary.loginRejectedUnconfirmed / summary.loginAttempts) * 100;
      if (rejectedPercent > 20) {
        alerts.push({
          level: 'warning',
          message: `High unconfirmed login attempts: ${summary.loginRejectedUnconfirmed} (${Math.round(rejectedPercent)}% of logins)`,
        });
      }
    }

    // Alert: Slow email confirmation
    if (summary.avgTimeToConfirmMinutes && summary.avgTimeToConfirmMinutes > 60) {
      alerts.push({
        level: 'warning',
        message: `Slow email confirmation: Average ${Math.round(summary.avgTimeToConfirmMinutes)} minutes`,
      });
    }

    // Alert: Low login success rate
    if (summary.loginAttempts > 10 && summary.loginSuccessRatePercent < 70) {
      alerts.push({
        level: summary.loginSuccessRatePercent < 50 ? 'critical' : 'warning',
        message: `Low login success rate: ${summary.loginSuccessRatePercent}%`,
      });
    }

    return alerts;
  }

  private notifyListeners(): void {
    const summary = this.getSummary();
    this.metricsListeners.forEach((listener) => listener(summary));
  }

  private async sendToMonitoringService(metric: AuthMetric): Promise<void> {
    if (!this.logtail) {
      // Fallback: console.log
      console.log(JSON.stringify({
        service: 'auth',
        metric: metric.event,
        timestamp: metric.timestamp,
        ...metric.metadata,
      }));
      return;
    }

    try {
      // Send metric to Logtail
      await this.logtail.log(`Metric: ${metric.event}`, 'info', {
        service: 'auth',
        metric: metric.event,
        timestamp: metric.timestamp,
        environment: process.env.NODE_ENV || 'production',
        ...metric.metadata,
      });
    } catch (error) {
      console.error('Failed to send metric to Logtail:', error);
      // Fallback to console
      console.log(JSON.stringify(metric));
    }
  }

  /**
   * Flush metrics (call before process exit)
   */
  async flush(): Promise<void> {
    if (this.logtail) {
      try {
        await this.logtail.flush();
      } catch (error) {
        console.error('Failed to flush metrics:', error);
      }
    }
  }
}

// Export singleton instance
export const metrics = new MetricsCollector();

// Graceful shutdown: flush metrics before exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await metrics.flush();
  });
}
```

### 4.2 Test Metrics Changes

```bash
cd /Users/danielzeddr/PetForce/packages/auth
npm run typecheck
npm test
```

---

## Step 5: Update Environment Variables (15 minutes)

### 5.1 Local Development

**File**: `/Users/danielzeddr/PetForce/.env`

```bash
# Add Logtail source token
LOGTAIL_SOURCE_TOKEN=your_production_token_here
```

### 5.2 Production (Vercel/Deployment Platform)

```bash
# In Vercel dashboard:
# Settings → Environment Variables

# Add:
# Name: LOGTAIL_SOURCE_TOKEN
# Value: your_production_token_here
# Environment: Production
```

### 5.3 Update .env.example

**File**: `/Users/danielzeddr/PetForce/.env.example`

```bash
# Existing variables...

# Monitoring (Better Stack Logtail)
LOGTAIL_SOURCE_TOKEN=your_logtail_source_token_here
```

---

## Step 6: Configure Better Stack Dashboard (1 hour)

### 6.1 Create Auth Events Dashboard

1. Log into Better Stack
2. Navigate to "Dashboards"
3. Click "Create Dashboard"
4. Name: **PetForce Auth Monitoring**

**Add Widgets**:

1. **Log Volume Over Time**
   - Type: Line chart
   - Query: `service:auth`
   - Time range: Last 24 hours

2. **Error Rate**
   - Type: Number
   - Query: `service:auth AND level:error`
   - Aggregation: Count

3. **Event Breakdown**
   - Type: Pie chart
   - Query: `service:auth`
   - Group by: `eventType`

4. **Login Success Rate**
   - Type: Number
   - Query: `service:auth AND eventType:login_completed`
   - Formula: `(login_completed / login_attempt_started) * 100`

5. **Recent Errors**
   - Type: Log list
   - Query: `service:auth AND level:error`
   - Limit: 10

### 6.2 Create Alert Rules

Navigate to "Alerts" → "Create Alert"

**Alert 1: High Error Rate**
```
Name: Auth Service - High Error Rate
Query: service:auth AND level:error
Condition: Count > 10 in 5 minutes
Severity: Critical
Notification: Slack + Email
```

**Alert 2: Low Login Success Rate**
```
Name: Auth Service - Low Login Success
Query: service:auth AND eventType:login_failed
Condition: Count > 20% of login attempts in 1 hour
Severity: Warning
Notification: Slack
```

**Alert 3: Email Confirmation Issues**
```
Name: Auth Service - Low Email Confirmation
Query: service:auth AND eventType:login_rejected_unconfirmed
Condition: Count > 10 in 1 hour
Severity: Warning
Notification: Email
```

**Alert 4: API Latency**
```
Name: Auth Service - High Latency
Query: service:auth
Condition: Response time > 1000ms (p95)
Severity: Warning
Notification: Slack
```

### 6.3 Create Saved Searches

**Search 1: Failed Logins**
```
Query: service:auth AND eventType:login_failed
Name: Failed Login Attempts
```

**Search 2: Unconfirmed Login Attempts**
```
Query: service:auth AND eventType:login_rejected_unconfirmed
Name: Unconfirmed Email Login Attempts
```

**Search 3: Registration Funnel**
```
Query: service:auth AND eventType:(registration_attempt_started OR registration_completed OR email_confirmed)
Name: Registration Funnel
```

---

## Step 7: Testing (1 hour)

### 7.1 Test in Development

```bash
# Start development server
cd /Users/danielzeddr/PetForce/apps/web
npm run dev

# In browser:
# 1. Register new account
# 2. Check Better Stack for logs
# 3. Verify events appear with correct context
```

### 7.2 Test Logger Directly

Create test file: `/Users/danielzeddr/PetForce/packages/auth/src/utils/__tests__/logger-integration.test.ts`

```typescript
import { logger } from '../logger';

describe('Logger Integration', () => {
  it('should log to Logtail', async () => {
    const requestId = logger.generateRequestId();

    logger.info('Test log from integration test', {
      requestId,
      testData: 'verification',
    });

    // Flush to ensure log is sent
    await logger.flush();

    console.log('Check Better Stack for log entry with requestId:', requestId);
  });
});
```

Run test:
```bash
npm test -- logger-integration.test.ts
```

### 7.3 Verify in Better Stack

1. Go to Better Stack dashboard
2. Search for test logs
3. Verify:
   - [x] Logs appear in real-time
   - [x] Request IDs are present
   - [x] Email addresses are hashed
   - [x] Event types are tagged
   - [x] Timestamps are correct

---

## Step 8: Documentation (30 minutes)

### 8.1 Update Architecture Docs

**File**: `/Users/danielzeddr/PetForce/docs/ARCHITECTURE.md`

Add section:

```markdown
## Monitoring & Analytics

### Error Tracking
- Better Stack (Logtail) for error monitoring
- Structured logging with request IDs
- Real-time alerting on error spikes

### Metrics
- Registration funnel tracking
- Login success rates
- Email confirmation rates
- API response times

### Dashboards
- Auth Events Dashboard (Better Stack)
- Real-time log streaming
- Custom saved searches
```

### 8.2 Create Runbook

**File**: `/Users/danielzeddr/PetForce/docs/runbooks/monitoring-runbook.md`

```markdown
# Monitoring Runbook

## Accessing Logs

1. Log into Better Stack: https://betterstack.com
2. Navigate to "Logs"
3. Use saved searches or custom queries

## Common Queries

### Find user's auth journey
Query: `requestId:"<request-id>"`

### Debug failed logins
Query: `service:auth AND eventType:login_failed`

### Check email confirmation rate
Query: `service:auth AND eventType:(registration_completed OR email_confirmed)`

## Responding to Alerts

### High Error Rate
1. Check "Recent Errors" widget
2. Identify error pattern
3. Check related request IDs
4. Escalate if database/Supabase issue

### Low Login Success Rate
1. Check for Supabase outage
2. Verify email service is working
3. Check for bot traffic
4. Review recent code deploys
```

---

## Step 9: Deployment (30 minutes)

### 9.1 Staging Deployment

```bash
# Ensure LOGTAIL_SOURCE_TOKEN is set in staging environment
# Deploy to staging
# Monitor Better Stack for 24 hours
# Verify alerts trigger correctly
```

### 9.2 Production Deployment

```bash
# Ensure LOGTAIL_SOURCE_TOKEN is set in production environment
# Deploy to production
# Monitor Better Stack closely for first 48 hours
# Fine-tune alert thresholds based on actual traffic
```

---

## Validation Checklist

Before marking as complete:

### Code Changes
- [ ] logger.ts updated with Logtail integration
- [ ] metrics.ts updated with Logtail integration
- [ ] SHA-256 email hashing implemented
- [ ] Tests passing
- [ ] TypeScript compilation successful

### Configuration
- [ ] Better Stack account created
- [ ] Source token generated and stored securely
- [ ] Environment variables configured (local, staging, production)
- [ ] .env.example updated

### Dashboards & Alerts
- [ ] Auth Events Dashboard created
- [ ] 4 alert rules configured
- [ ] 3 saved searches created
- [ ] Alert notifications tested

### Testing
- [ ] Logs appear in Better Stack
- [ ] Request ID correlation works
- [ ] Email hashing verified (no raw PII)
- [ ] Metrics recorded correctly
- [ ] Alerts trigger on test conditions

### Documentation
- [ ] Architecture docs updated
- [ ] Runbook created
- [ ] Team trained on dashboard usage
- [ ] Incident response process documented

---

## Troubleshooting

### Logs not appearing in Better Stack

**Check**:
1. Is `LOGTAIL_SOURCE_TOKEN` set?
2. Is `NODE_ENV` set to production?
3. Check console for Logtail errors
4. Verify network connectivity

**Fix**:
```bash
# Verify token
echo $LOGTAIL_SOURCE_TOKEN

# Test Logtail connection
node -e "const { Logtail } = require('@logtail/node'); const lt = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN); lt.log('test'); lt.flush();"
```

### Email addresses not hashed

**Check**: logger.ts hashEmail() function

**Fix**: Verify `createHash` import from 'crypto'

### High latency from logging

**Check**: Are logs being sent synchronously?

**Fix**: Ensure `sendToLogtail()` is async and non-blocking

---

## Success Criteria

Monitoring integration is complete when:
- [x] All 21 auth events logged to Better Stack
- [x] Production email hashing (SHA-256)
- [x] Dashboards show real-time auth metrics
- [x] Alerts trigger on anomalies
- [x] Request ID correlation enables debugging
- [x] Team can debug production issues from logs
- [x] Cost stays within budget ($0-30/month)

---

## Cost Monitoring

### Set Budget Alerts

In Better Stack:
1. Settings → Billing
2. Set budget limit: $30/month
3. Alert at 80% ($24)
4. Alert at 100% ($30)

### Monthly Review

- [ ] Review log volume
- [ ] Optimize verbose logging
- [ ] Archive old logs
- [ ] Adjust retention policy

---

## Next Steps After Completion

1. Monitor for 1 week
2. Fine-tune alert thresholds
3. Add additional metrics (API latency, session duration)
4. Integrate with Slack for alerts
5. Create on-call runbooks

---

**Implementation Owner**: Larry (Logging/Observability)
**Infrastructure Support**: Isabel
**Review Required**: Samantha (Security - verify PII protection)
**Last Updated**: 2026-01-25
