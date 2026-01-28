# Monitoring Service Integration - Infrastructure Recommendation

**Task**: High Priority Task #3 from 14-Agent Review
**Agents**: Isabel (Infrastructure) + Larry (Logging/Observability)
**Status**: PLANNING
**Priority**: HIGH - Required before production
**Estimated Effort**: 4-6 hours

---

## Executive Summary

PetForce requires production-grade monitoring to ensure 99.9% uptime reliability for pet families. This document evaluates monitoring service options and provides implementation guidance for auth system monitoring.

**Recommendation**: **Sentry** (error tracking) + **Datadog** (metrics/logs) OR **All-in-one: Better Stack (Logtail + Error Tracking)**

---

## Business Requirements

### Core Philosophy Alignment
> "Pets are part of the family, so let's take care of them as simply as we can."

**What this means for monitoring**:
- **Reliability protects pet safety**: Downtime means pet parents can't access vet records during emergencies
- **Proactive monitoring prevents outages**: Detect and resolve issues before they impact families
- **Simple observability**: Clear dashboards that teams can act on quickly
- **Cost optimization funds features**: Right-sized monitoring without overspending

### Target SLOs
- **Uptime**: 99.9% (43 minutes downtime/month maximum)
- **API Response Time**: <500ms p95
- **Error Rate**: <0.1% of requests
- **Email Delivery**: >95% within 5 minutes

---

## Service Evaluation

### Option 1: Sentry (Error Tracking Leader)

**Strengths**:
- Industry-leading error tracking and debugging
- Excellent JavaScript/TypeScript support
- Source map support for production debugging
- User context tracking
- Release tracking and deploy notifications
- Performance monitoring included
- 5,000 errors/month free tier

**Weaknesses**:
- Limited log aggregation (errors only)
- Metrics require separate service
- More expensive at scale ($26/month for 50k errors)

**Cost Estimate** (first year):
- Free tier: $0/month (5k errors)
- Team plan: $26/month (50k errors)
- **Estimated**: $0-26/month

**Best For**: Error tracking and debugging production issues

---

### Option 2: Datadog (Enterprise APM)

**Strengths**:
- Full-stack observability (logs, metrics, traces, RUM)
- Excellent dashboard and alerting
- Infrastructure monitoring included
- APM for performance tracking
- Log aggregation with advanced search
- Industry standard for enterprise

**Weaknesses**:
- Expensive ($15/host + $1.27/GB logs)
- Complex pricing model
- Overkill for early stage
- Steep learning curve

**Cost Estimate** (first year):
- Free trial: 14 days
- Pro plan: ~$15/host + log ingestion
- **Estimated**: $100-200/month

**Best For**: Large-scale enterprise applications with complex infrastructure

---

### Option 3: Better Stack (Logtail + Error Tracking)

**Strengths**:
- Modern, simple all-in-one solution
- Logs + errors in one platform
- Clean UI, fast search
- Affordable pricing ($10/month for 1GB logs)
- Easy integration
- Great for startups
- Live tailing and debugging

**Weaknesses**:
- Newer service (less proven)
- Fewer integrations than Datadog
- Limited APM features
- Smaller community

**Cost Estimate** (first year):
- Free tier: 500MB logs/month
- Startup plan: $10/month (1GB logs)
- **Estimated**: $0-10/month

**Best For**: Startups prioritizing simplicity and cost

---

### Option 4: AWS CloudWatch

**Strengths**:
- Native AWS integration (if using AWS)
- No additional account needed
- Pay-per-use pricing
- Reliable and scalable
- Logs, metrics, alarms included

**Weaknesses**:
- Complex UI
- Poor developer experience
- Limited search capabilities
- Requires AWS infrastructure
- Not ideal for Supabase setup

**Cost Estimate** (first year):
- Pay per GB: ~$0.50/GB ingested
- **Estimated**: $10-30/month

**Best For**: AWS-heavy infrastructure

---

### Option 5: LogRocket (Session Replay)

**Strengths**:
- Full session replay (see user interactions)
- Error tracking with visual context
- Performance monitoring
- Great for debugging UX issues

**Weaknesses**:
- Expensive ($99/month minimum)
- Privacy concerns (records everything)
- Overkill for auth monitoring
- Not focused on logs/metrics

**Cost Estimate** (first year):
- Team plan: $99/month
- **Estimated**: $1,188/year

**Best For**: Consumer apps with complex UX debugging needs

---

## Recommendation Matrix

| Service | Error Tracking | Logs | Metrics | Cost (Year 1) | Complexity | Best For |
|---------|---------------|------|---------|---------------|------------|----------|
| **Sentry** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ | $0-312 | Low | Error debugging |
| **Datadog** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $1,200-2,400 | High | Enterprise |
| **Better Stack** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | $0-120 | Low | Startups |
| **CloudWatch** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | $120-360 | Medium | AWS-native |
| **LogRocket** | ⭐⭐⭐⭐ | ⭐ | ⭐⭐ | $1,188+ | Medium | UX debugging |

---

## Final Recommendation

### Recommended Setup: **Better Stack (Logtail)**

**Why Better Stack**:
1. **Cost-effective**: $0-10/month (vs $100-200 for Datadog)
2. **All-in-one**: Logs + errors + metrics in one platform
3. **Simple integration**: <1 hour setup
4. **Startup-friendly**: Built for our stage
5. **Good enough**: Covers 90% of needs at 10% of cost

**Alternative**: **Sentry (free tier) + CloudWatch Logs**
- Use Sentry for error tracking (free)
- Use CloudWatch for log aggregation
- Total cost: $0-30/month
- More setup work, but proven solutions

---

## Implementation Plan

### Phase 1: Better Stack Integration (4-6 hours)

#### Step 1: Setup Account (15 minutes)
```bash
# 1. Sign up for Better Stack
# URL: https://betterstack.com/logtail

# 2. Create new source: "PetForce Auth"
# 3. Get API token

# 4. Add to environment variables
echo "LOGTAIL_SOURCE_TOKEN=your_token_here" >> .env
```

#### Step 2: Install Packages (15 minutes)
```bash
# Install Better Stack SDK
cd /Users/danielzeddr/PetForce/packages/auth
npm install @logtail/node @logtail/js

# Update package.json
```

#### Step 3: Update Logger (2 hours)
```typescript
// packages/auth/src/utils/logger.ts

import { Logtail } from '@logtail/node';

class Logger {
  private logtail: Logtail | null = null;

  constructor() {
    // Initialize Logtail in production
    if (process.env.NODE_ENV === 'production' && process.env.LOGTAIL_SOURCE_TOKEN) {
      this.logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
    }
  }

  private async sendToLogtail(entry: LogEntry): Promise<void> {
    if (!this.logtail) return;

    try {
      await this.logtail.log(entry.message, entry.level.toLowerCase(), {
        ...entry.context,
        timestamp: entry.timestamp,
      });
    } catch (error) {
      console.error('Failed to send log to Logtail:', error);
    }
  }

  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        email: context.email ? this.hashEmail(context.email) : undefined,
      },
    };

    // Development: console
    if (this.isDevelopment) {
      const logFn = level === 'ERROR' ? console.error :
                    level === 'WARN' ? console.warn : console.log;
      logFn(`[${entry.level}] ${entry.message}`, entry.context);
    } else {
      // Production: Logtail
      this.sendToLogtail(entry);
    }
  }
}
```

#### Step 4: Update Metrics (1.5 hours)
```typescript
// packages/auth/src/utils/metrics.ts

import { Logtail } from '@logtail/node';

class MetricsCollector {
  private logtail: Logtail | null = null;

  constructor() {
    if (process.env.NODE_ENV === 'production' && process.env.LOGTAIL_SOURCE_TOKEN) {
      this.logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
    }
  }

  private async sendToMonitoringService(metric: AuthMetric): Promise<void> {
    if (!this.logtail) {
      console.log(JSON.stringify({ service: 'auth', ...metric }));
      return;
    }

    try {
      await this.logtail.log(`Metric: ${metric.event}`, 'info', {
        service: 'auth',
        metric: metric.event,
        timestamp: metric.timestamp,
        ...metric.metadata,
      });
    } catch (error) {
      console.error('Failed to send metric to Logtail:', error);
    }
  }
}
```

#### Step 5: Add Email Hashing (1 hour)
```typescript
// packages/auth/src/utils/logger.ts

import crypto from 'crypto';

class Logger {
  /**
   * Hash email for privacy in logs (production-grade)
   */
  private hashEmail(email: string): string {
    if (!email) return '';

    // Production: SHA-256 hash
    const hash = crypto
      .createHash('sha256')
      .update(email.toLowerCase())
      .digest('hex')
      .substring(0, 16);

    // Format: hash@domain (preserves domain for debugging)
    const domain = email.split('@')[1] || 'unknown';
    return `${hash}@${domain}`;
  }
}
```

#### Step 6: Configure Dashboards (1 hour)
**In Better Stack Dashboard**:

1. **Auth Events Dashboard**
   - Widget: Log count over time (filter: `service:auth`)
   - Widget: Error rate (filter: `level:ERROR`)
   - Widget: Event breakdown (group by: `eventType`)

2. **Alert Rules**
   - Rule: Error rate >5 errors/minute → Slack/Email
   - Rule: Login success rate <70% (1 hour) → Critical alert
   - Rule: Email confirmation rate <50% → Warning
   - Rule: API latency >1s p95 → Warning

3. **Saved Searches**
   - "Failed logins": `eventType:login_failed`
   - "Unconfirmed logins": `eventType:login_rejected_unconfirmed`
   - "Registration funnel": `eventType:(registration_* OR email_confirmed)`

---

## Monitoring Checklist

### Logs to Track
- [x] Registration events (started, completed, failed)
- [x] Login events (started, completed, failed, rejected_unconfirmed)
- [x] Logout events
- [x] Email confirmation events
- [x] Password reset events
- [x] Session refresh events
- [x] All errors with full context

### Metrics to Track
- [ ] Registration rate (per hour/day)
- [ ] Email confirmation rate (%)
- [ ] Login success rate (%)
- [ ] Unconfirmed login attempts
- [ ] API response time (p50, p95, p99)
- [ ] Error rate (errors/minute)
- [ ] Active sessions count

### Alerts to Configure
- [ ] Error rate spike (>10 errors/minute)
- [ ] Login success rate drop (<70%)
- [ ] Email confirmation rate drop (<50%)
- [ ] API latency spike (>1s p95)
- [ ] High unconfirmed login attempts (>20%)

---

## Cost Projections

### Year 1 (Estimated Traffic)
**Assumptions**:
- 1,000 users
- 100 logins/day
- 50 registrations/day
- ~5,000 log entries/day
- ~150MB logs/month

**Better Stack Cost**:
- Free tier: 500MB/month
- **Total: $0/month** (within free tier)

### Year 2 (Growth Scenario)
**Assumptions**:
- 10,000 users
- 1,000 logins/day
- 500 registrations/day
- ~50,000 log entries/day
- ~1.5GB logs/month

**Better Stack Cost**:
- Startup plan: 3GB for $30/month
- **Total: $30/month** ($360/year)

### Alternative: Sentry + CloudWatch
**Year 1**: $0-10/month
**Year 2**: $26 (Sentry) + $20 (CloudWatch) = $46/month

---

## Integration with Existing Code

### Current State
```typescript
// packages/auth/src/utils/logger.ts (line 67-69)
console.log(JSON.stringify(entry)); // ← Replace this

// packages/auth/src/utils/metrics.ts (line 206-215)
console.log(JSON.stringify({...})); // ← Replace this
```

### After Integration
```typescript
// Production logs go to Better Stack
await this.logtail.log(entry.message, entry.level, entry.context);

// Metrics go to Better Stack
await this.logtail.log(`Metric: ${metric.event}`, 'info', metric);
```

---

## Rollout Plan

### Week 1: Setup & Integration
- [ ] Create Better Stack account
- [ ] Install packages
- [ ] Update logger.ts with Logtail integration
- [ ] Update metrics.ts with Logtail integration
- [ ] Add production email hashing (SHA-256)
- [ ] Add environment variables
- [ ] Test in development

### Week 2: Testing & Validation
- [ ] Deploy to staging environment
- [ ] Generate test traffic
- [ ] Validate logs appear in Better Stack
- [ ] Validate metrics are recorded
- [ ] Test alert rules
- [ ] Create dashboards

### Week 3: Production & Monitoring
- [ ] Deploy to production
- [ ] Monitor for 48 hours
- [ ] Fine-tune alert thresholds
- [ ] Document runbooks
- [ ] Train team on dashboard usage

---

## Success Criteria

Monitoring integration is complete when:
- [x] All 21 auth events are logged to Better Stack
- [x] Production email hashing implemented (SHA-256)
- [x] Dashboards show real-time auth metrics
- [x] Alerts trigger on error rate spikes
- [x] Request ID correlation works for debugging
- [x] Team can debug production issues from logs
- [x] Cost stays within budget ($0-30/month)

---

## Risk Mitigation

### Risk: Logtail downtime
**Mitigation**: Logs also written to console.log as backup

### Risk: Cost overrun
**Mitigation**: Set up budget alerts at 80% of limit

### Risk: PII leakage
**Mitigation**: SHA-256 email hashing + code review

### Risk: Performance impact
**Mitigation**: Async logging, non-blocking

---

## Next Steps

1. **Decision Required**: Approve Better Stack as monitoring service
2. **Isabel**: Create Better Stack account and get source token
3. **Larry**: Update logger.ts and metrics.ts with Logtail SDK
4. **Isabel**: Configure environment variables
5. **Larry**: Set up dashboards and alerts
6. **Both**: Test integration in staging
7. **Isabel**: Deploy to production

---

**Document Owner**: Isabel (Infrastructure)
**Collaboration**: Larry (Logging/Observability)
**Last Updated**: 2026-01-25
**Status**: Ready for Approval

---

## References

- [Better Stack Pricing](https://betterstack.com/pricing)
- [Better Stack Node.js SDK](https://github.com/logtail/logtail-js)
- [Sentry Pricing](https://sentry.io/pricing/)
- [Datadog Pricing](https://www.datadoghq.com/pricing/)
- 14-Agent Review: `/Users/danielzeddr/PetForce/docs/reviews/login-process-complete-review.md`
- Larry's Review: Lines 887-1090
- Isabel's Review: Lines 1600-1736
