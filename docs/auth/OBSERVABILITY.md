# Authentication Observability Guide

**Owner**: Larry (Logging/Observability)
**Status**: Production-Ready
**Last Updated**: 2026-01-25

## Overview

This guide covers comprehensive observability for the PetForce authentication system, including logging, metrics, monitoring, alerting, and debugging strategies.

## Table of Contents

- [Architecture](#architecture)
- [Event Logging](#event-logging)
- [Metrics Collection](#metrics-collection)
- [Monitoring Setup](#monitoring-setup)
- [Alerting](#alerting)
- [Debugging Guide](#debugging-guide)
- [Privacy & Security](#privacy--security)
- [Dashboard Setup](#dashboard-setup)
- [Troubleshooting](#troubleshooting)

---

## Architecture

### Observability Stack

```
┌────────────────────────────────────────────────────────┐
│                    Application Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Auth API    │  │  Logger      │  │  Metrics     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌────────────────────────────────────────────────────────┐
│              Monitoring Service Layer                   │
│  ┌──────────────────────────────────────────────────┐ │
│  │         Monitoring Service (monitoring.ts)        │ │
│  │                                                    │ │
│  │  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │ Datadog   │  │  Sentry  │  │   Console    │  │ │
│  │  │ Adapter   │  │ Adapter  │  │   Adapter    │  │ │
│  │  └───────────┘  └──────────┘  └──────────────┘  │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌────────────────────────────────────────────────────────┐
│              External Monitoring Services               │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐  │
│  │ Datadog  │       │  Sentry  │       │ Console  │  │
│  │ Service  │       │ Service  │       │  Output  │  │
│  └──────────┘       └──────────┘       └──────────┘  │
└────────────────────────────────────────────────────────┘
```

### Key Components

1. **Logger** (`packages/auth/src/utils/logger.ts`)
   - Structured JSON logging
   - Request ID correlation
   - PII protection (email hashing)
   - Log levels: DEBUG, INFO, WARN, ERROR

2. **Metrics** (`packages/auth/src/utils/metrics.ts`)
   - Event tracking
   - Business metrics calculation
   - Alert detection
   - Performance monitoring

3. **Monitoring Service** (`packages/auth/src/utils/monitoring.ts`)
   - Multi-backend support (Datadog, Sentry, CloudWatch)
   - Automatic failover to console
   - Environment-based configuration

---

## Event Logging

### Logged Events

All authentication operations are logged with structured data. Total: **21 distinct events**

#### Registration Events
- `registration_attempt_started` - User begins registration
- `registration_completed` - Account created successfully
- `registration_failed` - Registration error occurred

#### Login Events
- `login_attempt_started` - User begins login
- `login_completed` - Login successful
- `login_failed` - Login error occurred
- `login_rejected_unconfirmed` - Login blocked due to unverified email ⭐

#### Logout Events
- `logout_attempt_started` - User begins logout
- `logout_completed` - Logout successful
- `logout_failed` - Logout error occurred

#### Email Confirmation Events
- `confirmation_email_resend_requested` - User requests resend
- `confirmation_email_resent` - Confirmation email sent
- `confirmation_email_resend_failed` - Resend error occurred

#### Password Reset Events
- `password_reset_requested` - User requests password reset
- `password_reset_email_sent` - Reset email sent
- `password_reset_failed` - Reset error occurred

#### Session Management Events
- `session_refresh_started` - Token refresh begins
- `session_refresh_completed` - Token refresh successful
- `session_refresh_failed` - Token refresh error occurred

#### User Retrieval Events
- `get_user_completed` - User data retrieved
- `get_user_failed` - User retrieval error occurred

### Log Entry Format

Every log entry follows this structure:

```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601 timestamp
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;        // Human-readable message
  context: {
    requestId: string;    // UUID v4 for request correlation
    userId?: string;      // User ID (if authenticated)
    email?: string;       // Hashed email (SHA-256)
    eventType?: string;   // Event name
    [key: string]: any;   // Additional context
  };
}
```

### Example Log Entries

**Successful Login:**
```json
{
  "timestamp": "2026-01-25T14:30:00.123Z",
  "level": "INFO",
  "message": "Auth event: login_completed",
  "context": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "sha256:a1b2c3d4e5f6g7h8",
    "eventType": "login_completed",
    "duration": 342
  }
}
```

**Failed Login (Unconfirmed Email):**
```json
{
  "timestamp": "2026-01-25T14:31:15.456Z",
  "level": "WARN",
  "message": "Auth event: login_rejected_unconfirmed",
  "context": {
    "requestId": "650e8400-e29b-41d4-a716-446655440111",
    "email": "sha256:b2c3d4e5f6g7h8i9",
    "eventType": "login_rejected_unconfirmed",
    "emailConfirmed": false,
    "reason": "Email verification required"
  }
}
```

**Error:**
```json
{
  "timestamp": "2026-01-25T14:32:00.789Z",
  "level": "ERROR",
  "message": "Auth event: registration_failed",
  "context": {
    "requestId": "750e8400-e29b-41d4-a716-446655440222",
    "email": "sha256:c3d4e5f6g7h8i9j0",
    "eventType": "registration_failed",
    "error": {
      "code": "REGISTRATION_ERROR",
      "message": "Email already in use"
    }
  }
}
```

### Request Correlation

Every authentication operation generates a unique request ID (`UUID v4`) that is included in all log entries for that operation. This enables:

- **Distributed tracing**: Follow a request across services
- **User journey reconstruction**: See complete flow for a user
- **Error debugging**: Find all logs related to a failed operation
- **Performance analysis**: Measure operation duration

**Example Query (Datadog):**
```
requestId:550e8400-e29b-41d4-a716-446655440000
```

This returns all log entries for that specific request, showing the complete flow.

---

## Metrics Collection

### Business Metrics

The metrics system tracks key business indicators for authentication health.

#### Available Metrics

```typescript
interface MetricsSummary {
  // Registration Funnel
  registrationAttempts: number;        // Total registration attempts
  registrationSuccesses: number;       // Successful registrations
  registrationRate: number;            // Success rate (0-1)

  // Email Confirmation
  confirmationsSent: number;           // Confirmation emails sent
  confirmationsCompleted: number;      // Users who confirmed
  confirmationRate: number;            // Completion rate (0-1)
  avgTimeToConfirmMinutes: number;     // Average confirmation time

  // Login Performance
  loginAttempts: number;               // Total login attempts
  loginSuccesses: number;              // Successful logins
  loginRate: number;                   // Success rate (0-1)
  unconfirmedLoginAttempts: number;    // Logins blocked by unverified email

  // Session Management
  sessionRefreshes: number;            // Token refresh count
  sessionRefreshFailures: number;      // Failed refreshes
}
```

#### Accessing Metrics

```typescript
import { metrics } from '@petforce/auth';

// Get summary of all metrics
const summary = metrics.getSummary();
console.log('Registration rate:', summary.registrationRatePercent + '%');
console.log('Confirmation rate:', summary.confirmationRatePercent + '%');
console.log('Login success rate:', summary.loginRatePercent + '%');

// Check for alerts
const alerts = metrics.checkAlerts();
if (alerts.length > 0) {
  console.error('Active alerts:', alerts);
  // Send to monitoring service
}

// Get raw event data
const events = metrics.getEvents();
console.log('Total events:', events.length);
```

### Performance Metrics

Track operation timing and latency:

```typescript
// Automatic timing in API calls
const startTime = performance.now();
// ... operation ...
const duration = performance.now() - startTime;

logger.info('Operation completed', {
  requestId,
  duration,
  operation: 'login'
});
```

---

## Monitoring Setup

### Supported Backends

1. **Datadog** (Recommended for production)
2. **Sentry** (Recommended for error tracking)
3. **CloudWatch** (AWS native)
4. **Console** (Development fallback)

### Configuration

Set environment variables to enable monitoring:

```bash
# Choose backend
MONITORING_BACKEND=datadog  # or sentry, cloudwatch, console

# API credentials
MONITORING_API_KEY=your_api_key_here

# Environment
NODE_ENV=production

# Service identification
SERVICE_NAME=petforce-auth
SERVICE_VERSION=1.0.0
```

### Datadog Setup

**Why Datadog?**
- Complete observability: logs, metrics, traces
- Powerful query language
- Real-time dashboards
- Custom alerting
- 15-day retention (free tier)

**Setup Steps:**

1. Sign up at https://www.datadoghq.com/
2. Get API key from https://app.datadoghq.com/account/settings#api
3. Configure environment:
   ```bash
   MONITORING_BACKEND=datadog
   MONITORING_API_KEY=your_datadog_api_key
   NODE_ENV=production
   SERVICE_NAME=petforce-auth
   ```
4. Deploy application
5. View logs at https://app.datadoghq.com/logs

**Cost**: $10-50/month for small deployment

### Sentry Setup

**Why Sentry?**
- Excellent error tracking and grouping
- Stack traces with source maps
- Release tracking
- User impact measurement
- 5,000 events/month (free tier)

**Setup Steps:**

1. Sign up at https://sentry.io/
2. Create project and get DSN
3. Configure environment:
   ```bash
   MONITORING_BACKEND=sentry
   MONITORING_API_KEY=https://your_key@sentry.io/project_id
   NODE_ENV=production
   SERVICE_NAME=petforce-auth
   ```
4. Deploy application
5. View errors at https://sentry.io/

**Cost**: $0-26/month for small deployment

### Development Mode

For local development, monitoring automatically falls back to console:

```bash
MONITORING_BACKEND=console
NODE_ENV=development
```

Logs are printed to console in JSON format for easy debugging.

---

## Alerting

### Built-in Alert Rules

The metrics system includes automatic alert detection:

```typescript
const alerts = metrics.checkAlerts();
// Returns array of active alerts
```

#### Critical Alerts

1. **Email Confirmation Rate < 50%**
   - **Severity**: CRITICAL
   - **Impact**: Users cannot complete registration
   - **Actions**:
     - Check email deliverability
     - Verify email templates
     - Check spam folder rates
     - Review confirmation link validity

2. **Login Success Rate < 50%**
   - **Severity**: CRITICAL
   - **Impact**: Users cannot access accounts
   - **Actions**:
     - Check authentication service health
     - Review error logs for patterns
     - Verify database connectivity
     - Check session management

#### Warning Alerts

3. **Email Confirmation Rate < 70%**
   - **Severity**: WARNING
   - **Impact**: Below target, needs improvement
   - **Actions**:
     - Review verification email UX
     - Consider reminder emails
     - Check time-to-confirm metrics

4. **Login Success Rate < 70%**
   - **Severity**: WARNING
   - **Impact**: Higher than normal failures
   - **Actions**:
     - Review failed login reasons
     - Check password reset usage
     - Review error messages

5. **High Unconfirmed Login Attempts (>20%)**
   - **Severity**: WARNING
   - **Impact**: Users not verifying emails
   - **Actions**:
     - Improve verification email visibility
     - Add resend button on login page
     - Consider auto-resend after failed login

6. **Slow Email Confirmation (>60 min avg)**
   - **Severity**: WARNING
   - **Impact**: Poor user experience
   - **Actions**:
     - Review email delivery times
     - Check email service health
     - Optimize verification UX

### Setting Up Alerts

#### Datadog Monitors

Create monitors for key metrics:

```
# Registration Rate Monitor
Query: avg(last_5m):avg:petforce.auth.registration_rate{*} < 0.7
Alert threshold: < 0.5 (critical)
Warning threshold: < 0.7 (warning)
```

#### Sentry Alert Rules

Set up rules for error patterns:

```
IF event.level equals error
AND event.tags.component equals auth
THEN send notification to #alerts channel
```

---

## Debugging Guide

### Common Debugging Scenarios

#### User Cannot Login

1. **Find user's request ID:**
   ```
   email:sha256:a1b2c3d4e5f6g7h8 AND eventType:login_attempt_started
   ```

2. **Get complete login flow:**
   ```
   requestId:550e8400-e29b-41d4-a716-446655440000
   ```

3. **Check for errors:**
   ```
   requestId:550e8400-e29b-41d4-a716-446655440000 AND level:ERROR
   ```

4. **Common causes:**
   - Email not confirmed → Look for `login_rejected_unconfirmed`
   - Invalid credentials → Look for `login_failed` with auth error
   - Session issues → Check `session_refresh_failed`

#### User Not Receiving Verification Email

1. **Check if email was sent:**
   ```
   email:sha256:a1b2c3d4e5f6g7h8 AND eventType:registration_completed
   ```

2. **Check resend attempts:**
   ```
   email:sha256:a1b2c3d4e5f6g7h8 AND eventType:confirmation_email_resent
   ```

3. **Check for rate limiting:**
   ```
   email:sha256:a1b2c3d4e5f6g7h8 AND eventType:confirmation_email_resend_failed
   ```

4. **Verify Supabase email logs:**
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Check email delivery logs

#### High Error Rate

1. **Group errors by code:**
   ```
   level:ERROR AND service:petforce-auth | stats count by error.code
   ```

2. **Find recent errors:**
   ```
   level:ERROR AND service:petforce-auth | sort @timestamp desc | limit 100
   ```

3. **Pattern analysis:**
   - Single user affected → User-specific issue
   - Multiple users → System-wide issue
   - Specific time → Deployment or infrastructure change

### Request Tracing

Track a complete user journey using request ID:

```typescript
// Step 1: User registers
// requestId: 123-abc
// Event: registration_attempt_started → registration_completed

// Step 2: User confirms email
// (handled by Supabase, no direct log)

// Step 3: User logs in
// requestId: 456-def
// Event: login_attempt_started → login_completed

// Step 4: User refreshes session
// requestId: 789-ghi
// Event: session_refresh_started → session_refresh_completed
```

Each step has a unique request ID, but email hash correlates them.

---

## Privacy & Security

### Email Hashing

All email addresses are hashed using SHA-256 before logging:

```typescript
// Original email
const email = "user@example.com";

// Hashed for logging
const hashedEmail = "sha256:a1b2c3d4e5f6g7h8";

// Properties:
// - Same email always produces same hash (enables correlation)
// - Irreversible (cannot recover original email)
// - GDPR/CCPA compliant (no PII in logs)
// - 16 characters (64 bits of entropy)
```

### Never Logged

The following sensitive data is **NEVER** logged:

- Passwords (plain or hashed)
- Session tokens
- Refresh tokens
- API keys
- Credit card information
- Pet health records
- Raw email addresses (only hashed)

### Log Retention

**Recommended retention policies:**

- **Development**: 7 days
- **Staging**: 30 days
- **Production**: 90 days
- **Compliance**: May require longer (check GDPR/HIPAA requirements)

**Data deletion:**
- User deletion request → Delete all logs containing user's email hash
- Implement automated retention policy in monitoring service

---

## Dashboard Setup

### Key Metrics Dashboard

Create a dashboard with these widgets:

#### Authentication Funnel
```
┌─────────────────────────────────────┐
│   Registration → Confirmation       │
│   Login Success Rate                │
│   Unconfirmed Login Attempts        │
└─────────────────────────────────────┘
```

**Datadog Query:**
```
graph {
  title "Registration Funnel"
  metric "petforce.auth.registration_attempts" (line, blue)
  metric "petforce.auth.registration_successes" (line, green)
  metric "petforce.auth.confirmations_completed" (line, purple)
}
```

#### Error Rates
```
┌─────────────────────────────────────┐
│   Errors by Type                    │
│   Error Rate Over Time              │
│   Top Error Messages                │
└─────────────────────────────────────┘
```

**Datadog Query:**
```
graph {
  title "Error Rate"
  metric "count(level:ERROR)" (line, red)
  group_by "error.code"
}
```

#### Performance
```
┌─────────────────────────────────────┐
│   Login Duration (p50, p95, p99)    │
│   Registration Duration             │
│   Session Refresh Duration          │
└─────────────────────────────────────┘
```

**Datadog Query:**
```
graph {
  title "Login Duration"
  metric "avg(duration)" where "eventType:login_completed"
  percentile p50, p95, p99
}
```

### Example Dashboard Layout

```
┌────────────────────────────────────────────────────────┐
│                  PetForce Auth Dashboard                │
├────────────────────────────────────────────────────────┤
│  Registration Rate: 89%  ✓   Confirmation Rate: 76%  ⚠│
│  Login Success Rate: 94%  ✓   Active Alerts: 1       ⚠│
├─────────────────────────┬──────────────────────────────┤
│  Registration Funnel    │  Error Rate                  │
│  [Graph]                │  [Graph]                     │
├─────────────────────────┼──────────────────────────────┤
│  Login Duration         │  Top Errors                  │
│  [Graph]                │  [List]                      │
├─────────────────────────┴──────────────────────────────┤
│  Recent Authentication Events                          │
│  [Real-time log stream]                                │
└────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Logs Not Appearing

**Symptoms:**
- No logs in monitoring service
- Console shows logs but Datadog doesn't

**Checks:**
1. Verify environment variables:
   ```bash
   echo $MONITORING_BACKEND
   echo $MONITORING_API_KEY
   echo $NODE_ENV
   ```

2. Check monitoring service initialization:
   ```typescript
   import { monitoring } from '@petforce/auth/utils/monitoring';
   console.log('Monitoring backend:', process.env.MONITORING_BACKEND);
   ```

3. Test log sending:
   ```typescript
   monitoring.sendLog({
     timestamp: new Date().toISOString(),
     level: 'INFO',
     message: 'Test log',
     context: { test: true }
   });
   ```

4. Check API key validity:
   - Datadog: https://app.datadoghq.com/account/settings#api
   - Sentry: Project settings → Client Keys (DSN)

### Metrics Not Updating

**Symptoms:**
- Metrics summary shows zero values
- Alerts not triggering

**Checks:**
1. Verify metrics are being tracked:
   ```typescript
   import { metrics } from '@petforce/auth';
   const events = metrics.getEvents();
   console.log('Events tracked:', events.length);
   ```

2. Check if metrics are being sent to monitoring:
   ```typescript
   // Look for sendMetric calls in logs
   ```

3. Verify monitoring integration in metrics.ts:
   ```typescript
   // Should see monitoring.sendMetric() calls
   ```

### High Memory Usage

**Symptoms:**
- Application memory growing over time
- Out of memory errors

**Cause:** Metrics array growing unbounded

**Solution:**
Metrics are automatically limited to 10,000 events. If still experiencing issues:

```typescript
// Reduce MAX_METRICS in metrics.ts
const MAX_METRICS = 5000; // Instead of 10000
```

Or implement time-based retention:

```typescript
// Keep only last 24 hours
const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo);
```

### Email Hash Correlation Issues

**Symptoms:**
- Cannot correlate events for same user
- Different hashes for same email

**Cause:** Email normalization inconsistency

**Solution:**
Verify emails are normalized before hashing:

```typescript
private hashEmail(email: string): string {
  // MUST normalize: lowercase and trim
  const normalized = email.toLowerCase().trim();
  const hash = createHash('sha256').update(normalized).digest('hex');
  return 'sha256:' + hash.substring(0, 16);
}
```

---

## Best Practices

### Do's ✅

- **Always include request ID** in log context
- **Hash emails** before logging (use SHA-256)
- **Use structured logging** (JSON format)
- **Set up alerts** for critical metrics
- **Review logs regularly** for patterns
- **Test monitoring** in staging before production
- **Document alert runbooks** for on-call team
- **Monitor registration and confirmation funnels**

### Don'ts ❌

- **Don't log passwords** (even hashed)
- **Don't log tokens** (access or refresh)
- **Don't log raw emails** (always hash)
- **Don't ignore alerts** (investigate all critical alerts)
- **Don't disable monitoring** in production
- **Don't log PII** without hashing/encryption
- **Don't use DEBUG level** in production

---

## Related Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - System design and flows
- [Security Documentation](./SECURITY.md) - Security practices
- [Error Reference](./ERRORS.md) - Error codes and handling
- [Setup Guide](./SETUP.md) - Development setup
- [Monitoring Setup](../MONITORING.md) - Detailed monitoring configuration

---

## Support

**Questions or issues?**

- **Observability**: Larry (Logging/Observability Agent)
- **Documentation**: Thomas (Documentation Agent)
- **Security**: Samantha (Security Agent)

**Quick Links:**
- Datadog Dashboard: https://app.datadoghq.com/
- Sentry Dashboard: https://sentry.io/
- PetForce Docs: /docs/

---

**Remember**: If it's not logged, it didn't happen. Complete observability protects pet families by enabling rapid incident response.
