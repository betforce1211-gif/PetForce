# PetForce Logging & Observability Skill

This skill provides comprehensive logging, monitoring, and observability patterns for PetForce applications.

## Core Principles

**Product Philosophy**: "Pets are part of the family, so let's take care of them as simply as we can."

For observability, this means:
1. **Proactive monitoring prevents pet emergencies** - Log patterns reveal issues before they impact families
2. **Simple, actionable alerts** - Every alert should be actionable and tied to customer impact
3. **Privacy in logs** - Pet health records and family data must never appear in logs
4. **Observability enables prevention** - Track business metrics alongside technical metrics

## Log Level Guidelines

```
FATAL - Use when:
  • System cannot recover
  • Data corruption possible
  • Immediate attention required
  Example: Database connection pool exhausted, OOM

ERROR - Use when:
  • Operation failed
  • User request cannot be fulfilled
  • Requires investigation
  Example: Payment failed, API call failed after retries

WARN - Use when:
  • Something unexpected happened
  • System recovered automatically
  • Worth monitoring for patterns
  Example: Retry succeeded, cache miss, deprecated API used

INFO - Use when:
  • Business event occurred
  • State change happened
  • Normal operation milestone
  Example: User logged in, order placed, job completed

DEBUG - Use when:
  • Diagnostic information needed
  • Tracing code flow
  • Development/troubleshooting
  Example: Function parameters, decision branches, cache operations

TRACE - Use when:
  • Very detailed debugging
  • Performance profiling
  • Rarely in production
  Example: Loop iterations, raw payloads
```

## Structured Log Schema

```typescript
// Required fields for every log
{
  timestamp: string;     // ISO 8601
  level: string;         // FATAL|ERROR|WARN|INFO|DEBUG|TRACE
  message: string;       // Human-readable description
  service: string;       // Service name
  environment: string;   // prod|staging|dev
}

// Correlation (highly recommended)
{
  requestId: string;     // Unique request ID
  traceId?: string;      // Distributed trace ID
  spanId?: string;       // Current span ID
  userId?: string;       // Authenticated user
}

// Error context (when logging errors)
{
  error: {
    name: string;        // Error class
    message: string;     // Error message
    code?: string;       // Error code
    stack?: string;      // Stack trace (non-prod)
  }
}

// Performance (when timing operations)
{
  duration: number;      // Milliseconds
}
```

## Sensitive Data Rules

### Always Redact
- `password`, `passwd`, `pwd`
- `token`, `accessToken`, `refreshToken`
- `apiKey`, `api_key`, `secretKey`
- `authorization`, `auth`
- `creditCard`, `cardNumber`, `cvv`
- `ssn`, `socialSecurity`
- `secret`, `private`

### PetForce-Specific Redaction
- Pet health records
- Veterinary diagnoses
- Medication details (in logs - OK in structured events)
- Owner personal information
- Location data

### Safe to Log
- `userId` (not sensitive by itself)
- `requestId`, `traceId`
- `userAgent`
- `httpMethod`, `path`
- `statusCode`
- `duration`

## Observability Checklist

Use this checklist for every feature:

### Structured Logging
- [ ] Structured logging used (JSON format, not string concatenation)
- [ ] Consistent log schema applied across service
- [ ] Appropriate log levels used (FATAL, ERROR, WARN, INFO, DEBUG, TRACE)
- [ ] Log entries include timestamp, level, message, service, environment

### Correlation & Tracing
- [ ] Correlation IDs included (requestId, traceId)
- [ ] Context added to every log entry
- [ ] Trace context propagated across services
- [ ] User ID captured when authenticated

### Sensitive Data Protection
- [ ] Sensitive data automatically redacted (passwords, tokens, PII)
- [ ] Redaction rules applied consistently
- [ ] No credentials or secrets logged
- [ ] Compliance requirements met (GDPR, HIPAA, etc.)

### Coverage & Completeness
- [ ] Success and failure paths both logged
- [ ] All error handlers include logging
- [ ] Business events tracked alongside technical metrics
- [ ] Operation duration logged for performance tracking

### Performance & Efficiency
- [ ] No logging in tight loops without sampling
- [ ] Sampling implemented for high-volume operations
- [ ] Log volume appropriate (not too noisy, not too sparse)
- [ ] Async logging used where applicable

### Monitoring & Alerting
- [ ] Dashboards created for visibility
- [ ] Alerts configured for critical issues
- [ ] Alert thresholds appropriate (not too sensitive)
- [ ] Runbooks created for alert response

## Alert Levels

```
🔴 P1 - CRITICAL (Page immediately)
  • Service is down
  • Data loss occurring
  • Security breach detected
  • Revenue-impacting failure
  Response: Acknowledge within 5 minutes

🟠 P2 - HIGH (Page during business hours)
  • Significant degradation
  • Feature completely broken
  • Error rate > 5%
  Response: Acknowledge within 30 minutes

🟡 P3 - MEDIUM (Ticket, next business day)
  • Minor degradation
  • Non-critical feature impacted
  • Error rate > 1%
  Response: Resolve within 24 hours

🟢 P4 - LOW (Ticket, within week)
  • Cosmetic issues
  • Performance slightly degraded
  • Warning thresholds exceeded
  Response: Resolve within 1 week
```

## Metrics Categories

### RED Metrics (Request-driven)
- **Rate**: Requests per second
- **Errors**: Error rate (4xx, 5xx)
- **Duration**: Response time (p50, p95, p99)

### USE Metrics (Resource-driven)
- **Utilization**: CPU, memory, disk usage
- **Saturation**: Queue depths, thread pool usage
- **Errors**: Hardware/resource errors

### Business Metrics
- User signups
- Orders placed
- Revenue processed
- Feature usage
- Medication adherence rates
- Appointment bookings

### Health Metrics
- Service uptime
- Dependency health
- Circuit breaker state
- Cache hit rate

## Code Examples

### Good Logging Examples

```typescript
// ✅ Good: Rich context
logger.info('User logged in successfully', {
  userId: user.id,
  method: 'oauth',
  provider: 'google',
  duration: loginDuration,
});

// ✅ Good: Error with context
logger.error('Failed to process payment', {
  error: { name: err.name, message: err.message, code: err.code },
  orderId: order.id,
  amount: order.total,
  retryCount: 0,
});

// ✅ Good: Performance tracking
const start = Date.now();
await processOrder(orderId);
logger.info('Order processed', {
  orderId,
  duration: Date.now() - start,
  itemCount: order.items.length,
});
```

### Anti-Patterns (Avoid These)

```typescript
// ❌ Bad: No context
logger.info('User logged in');

// ❌ Bad: Logging sensitive data
logger.info('User created', { password: user.password, ssn: user.ssn });

// ❌ Bad: Generic error message
logger.error('Something went wrong');

// ❌ Bad: Logging in loops (log spam)
for (const item of items) {
  logger.debug(`Processing item ${item.id}`);
}

// ❌ Bad: String concatenation
logger.info('User ' + userId + ' performed action ' + action);
```

## Dashboard Layout Recommendations

```
ROW 1: Health Overview
  [Uptime] [Error Rate] [Latency p95] [Requests/sec]

ROW 2: Traffic & Errors
  [Request Rate & Error Rate Over Time - Time Series Graph]

ROW 3: Performance
  [Latency Distribution] [Slowest Endpoints]

ROW 4: Errors Deep Dive
  [Errors by Type] [Recent Errors]

ROW 5: Dependencies
  [External API Health] [Database Performance]
```

## Configuration

Larry uses `.larry.yml` for configuration. Key settings:

```yaml
logging:
  level: info
  format: json

redaction:
  enabled: true
  fields: [password, token, secret, apiKey, creditCard, ssn]

tracing:
  enabled: true
  sampleRate: 0.1

metrics:
  enabled: true
  endpoint: /metrics

alerting:
  enabled: true
  rules:
    errorRate:
      threshold: 0.05
      window: '5m'
      severity: 'critical'
```

## Integration Points

### With Engineering (Engrid)
- Provide logging patterns for new code
- Review logging in code reviews
- Suggest instrumentation improvements

### With QA (Tucker)
- Use logs to debug test failures
- Verify logging in test scenarios
- Ensure error cases are logged

### With CI/CD (Chuck)
- Monitor logs during deployments
- Alert on error rate changes
- Track deployment health

### With Documentation (Thomas)
- Document logging conventions
- Provide log schema documentation
- Create runbooks for alerts
