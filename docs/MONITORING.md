# Monitoring Service Configuration

## Overview

PetForce authentication now includes production-ready monitoring with support for multiple backends:
- Datadog (recommended for full-stack observability)
- Sentry (recommended for error tracking)
- CloudWatch (AWS-native option)
- Console (development fallback)

## Environment Variables

Configure monitoring via environment variables:

```bash
# Monitoring backend
MONITORING_BACKEND=datadog    # Options: datadog, sentry, cloudwatch, console

# API credentials
MONITORING_API_KEY=your_api_key_here

# Environment tag
NODE_ENV=production           # development, staging, production

# Service name
SERVICE_NAME=petforce-auth
```

## Datadog Setup

1. Sign up for Datadog account (free trial available)
2. Get API key from: https://app.datadoghq.com/account/settings#api
3. Configure environment:
   ```bash
   MONITORING_BACKEND=datadog
   MONITORING_API_KEY=your_datadog_api_key
   NODE_ENV=production
   SERVICE_NAME=petforce-auth
   ```

4. View logs at: https://app.datadoghq.com/logs
5. View metrics at: https://app.datadoghq.com/metric/summary

### Datadog Features
- Structured log aggregation
- Metrics and dashboards
- Request tracing
- Alerting
- 15-day log retention (free tier)

## Sentry Setup

1. Sign up for Sentry account (free tier available)
2. Create new project
3. Get DSN from project settings
4. Configure environment:
   ```bash
   MONITORING_BACKEND=sentry
   MONITORING_API_KEY=https://your_dsn@sentry.io/project_id
   NODE_ENV=production
   ```

5. View errors at: https://sentry.io/organizations/your-org/issues/

### Sentry Features
- Error tracking and grouping
- Stack traces
- Release tracking
- Performance monitoring (paid)
- 5,000 events/month (free tier)

## Development Mode

For local development, use console backend:

```bash
MONITORING_BACKEND=console
NODE_ENV=development
```

Logs will output to console in JSON format for testing.

## What Gets Logged

### Authentication Events
- registration_attempt_started
- registration_completed
- registration_failed
- login_attempt_started
- login_completed
- login_failed
- login_rejected_unconfirmed
- logout_attempt_started
- logout_completed
- confirmation_email_resend_requested
- confirmation_email_resent
- password_reset_requested
- password_reset_email_sent
- session_refresh_started
- session_refresh_completed

### Log Entry Format
```json
{
  "timestamp": "2026-01-25T12:00:00.000Z",
  "level": "INFO",
  "message": "Auth event: login_completed",
  "context": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "123",
    "email": "sha256:a1b2c3d4e5f6g7h8",
    "eventType": "login_completed"
  }
}
```

### Metrics Tracked
- Registration funnel (started → completed → confirmed)
- Login success/failure rates
- Unconfirmed login attempts
- Email confirmation times
- Session refresh patterns

## Privacy & Security

### Email Hashing
All email addresses are hashed using SHA-256 before logging:
- Original: user@example.com
- Logged: sha256:a1b2c3d4e5f6g7h8

This provides:
- GDPR/CCPA compliance (no PII in logs)
- Correlation capability (same hash for same email)
- 64 bits of entropy (sufficient for debugging)

### No Sensitive Data
The following are NEVER logged:
- Passwords (plain or hashed)
- Session tokens
- API keys
- Raw email addresses
- Credit card information
- Health records

### Request Correlation
Every log entry includes a requestId (UUID v4) for distributed tracing:
```
requestId: "550e8400-e29b-41d4-a716-446655440000"
```

This enables:
- User journey reconstruction
- Error debugging
- Performance analysis
- Cross-service correlation

## Alerts & Monitoring

The metrics system includes automatic alerting for:

### Critical Alerts
- Email confirmation rate < 50%
- Login success rate < 50%

### Warning Alerts
- Email confirmation rate < 70%
- Login success rate < 70%
- High unconfirmed login attempts (>20%)
- Slow email confirmation (>60 minutes avg)

Access alerts via `metrics.checkAlerts()`.

## Testing

### Test Monitoring Integration

```typescript
import { monitoring } from '@petforce/auth/utils/monitoring';

// Test log
monitoring.sendLog({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  message: 'Test log entry',
  context: { test: true }
});

// Test metric
monitoring.sendMetric({
  event: 'test_event',
  timestamp: Date.now(),
  metadata: { source: 'test' }
});

// Test error
monitoring.sendError(new Error('Test error'), {
  requestId: '123',
  component: 'test'
});
```

### Verify in Datadog
1. Go to Logs → Live Tail
2. Filter by: `service:petforce-auth`
3. Look for test entries

### Verify in Sentry
1. Go to Issues
2. Look for "Test error"
3. Check breadcrumbs and context

## Cost Estimates

### Datadog
- Free tier: 14-day retention, 500MB/day
- Pro: 50/host/month, 15-day retention
- Estimate: 10-50/month for small deployment

### Sentry
- Free tier: 5,000 events/month
- Team: 26/month, 50,000 events
- Estimate: 0-26/month for small deployment

### CloudWatch
- Logs: 0.50/GB ingested
- Metrics: 0.30/custom metric
- Estimate: 5-20/month for small deployment

## Troubleshooting

### Logs not appearing in Datadog
1. Check API key is correct
2. Verify MONITORING_BACKEND=datadog
3. Check network connectivity
4. View console for error messages

### Logs not appearing in Sentry
1. Check DSN is correct
2. Verify error level (Sentry only tracks WARN/ERROR)
3. Check project settings
4. View browser network tab for failed requests

### High log volume
1. Reduce DEBUG logging in production
2. Implement sampling for high-volume events
3. Use log level filtering
4. Archive old logs

## Best Practices

1. Always include requestId for correlation
2. Use appropriate log levels (DEBUG, INFO, WARN, ERROR)
3. Add context to every log entry
4. Never log sensitive data
5. Monitor your monitoring costs
6. Set up alerts for critical issues
7. Review logs regularly for patterns
8. Archive logs according to compliance requirements

## Migration from Console Logging

Old code:
```typescript
console.log('User logged in:', userId);
```

New code:
```typescript
logger.info('User logged in', {
  requestId,
  userId,
  eventType: 'login_completed'
});
```

## Support

For monitoring questions:
- Datadog Docs: https://docs.datadoghq.com/
- Sentry Docs: https://docs.sentry.io/
- Internal: Contact Larry (Logging/Observability Agent)
