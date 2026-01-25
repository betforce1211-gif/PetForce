# Larry - Monitoring/Observability Quality Checklist

**Version**: 1.0
**Feature**: [Feature Name]
**Date**: [YYYY-MM-DD]
**Reviewer**: Larry (Logging & Observability)

## Checklist Items

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

## Summary

**Status**: [ ] ✅ APPROVED / [ ] ⚠️ APPROVED WITH NOTES / [ ] ❌ REJECTED

**Notes**:
[Any logging gaps, sensitive data concerns, or alerting recommendations]

**Signature**: Larry - [Date]
