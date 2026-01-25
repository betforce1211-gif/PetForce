# Samantha - Security Review Quality Checklist

**Version**: 1.0
**Feature**: [Feature Name]
**Date**: [YYYY-MM-DD]
**Reviewer**: Samantha (Security)

## Checklist Items

### Input Validation & Injection Prevention
- [ ] All user input validated before processing
- [ ] Parameterized queries used (no string concatenation for SQL)
- [ ] File uploads validated (type, size, content)
- [ ] URL validation implemented (SSRF prevention)
- [ ] Output properly encoded (XSS prevention)

### Authentication & Session Management
- [ ] Authentication required on every sensitive endpoint
- [ ] Passwords hashed with Argon2id or bcrypt (not MD5/SHA1)
- [ ] Session management secure (httpOnly cookies, secure flags)
- [ ] Password reset flow secure
- [ ] Rate limiting implemented on authentication endpoints

### Authorization & Access Control
- [ ] Authorization checked on every request
- [ ] Deny by default approach used
- [ ] Resource ownership verified
- [ ] Principle of least privilege applied
- [ ] Privilege escalation prevented

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] All traffic over TLS 1.2 or higher
- [ ] Secrets stored securely (not hard-coded)
- [ ] PII properly classified and protected
- [ ] Data retention policies enforced

### Security Headers & Configuration
- [ ] Content-Security-Policy header set
- [ ] X-Frame-Options header set
- [ ] X-Content-Type-Options header set
- [ ] Strict-Transport-Security header set
- [ ] Secure defaults used (no security disabled for convenience)

### Logging & Monitoring
- [ ] Security-relevant events logged (auth, authz, exceptions)
- [ ] Sensitive data NOT logged (passwords, tokens, PII)
- [ ] Security exceptions logged with context
- [ ] Logs monitored for anomalies

### Dependency Management
- [ ] Dependencies scanned for vulnerabilities
- [ ] Dependencies kept updated
- [ ] No deprecated crypto algorithms used
- [ ] Security warnings not ignored

## Summary

**Status**: [ ] ✅ APPROVED / [ ] ⚠️ APPROVED WITH NOTES / [ ] ❌ REJECTED

**Notes**:
[Any security vulnerabilities, risk assessment, or remediation requirements]

**Signature**: Samantha - [Date]
