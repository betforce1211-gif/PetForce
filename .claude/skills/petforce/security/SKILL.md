# PetForce Security Skill

This skill provides comprehensive security knowledge for PetForce development, including threat models, vulnerability assessment, compliance frameworks, and security review procedures.

## Security Checklists

### Pre-Merge Security Review
- [ ] **Input Validation**: All user input validated before processing
- [ ] **SQL Injection Prevention**: Parameterized queries used (no string concatenation)
- [ ] **File Upload Security**: Type, size, and content validated
- [ ] **SSRF Prevention**: URL validation implemented
- [ ] **XSS Prevention**: Output properly encoded

### Authentication & Session Management
- [ ] **Authentication Required**: On every sensitive endpoint
- [ ] **Password Hashing**: Argon2id or bcrypt (not MD5/SHA1)
- [ ] **Session Security**: httpOnly cookies, secure flags set
- [ ] **Password Reset**: Secure flow implemented
- [ ] **Rate Limiting**: Implemented on authentication endpoints

### Authorization & Access Control
- [ ] **Authorization Checks**: On every request
- [ ] **Deny by Default**: Applied throughout
- [ ] **Resource Ownership**: Verified for all operations
- [ ] **Least Privilege**: Applied to all roles and permissions
- [ ] **Privilege Escalation**: Prevented

### Data Protection
- [ ] **Encryption at Rest**: Sensitive data encrypted
- [ ] **TLS Configuration**: All traffic over TLS 1.2+
- [ ] **Secrets Management**: No hard-coded secrets
- [ ] **PII Classification**: Properly classified and protected
- [ ] **Retention Policies**: Enforced for all data types

### Security Headers & Configuration
- [ ] **Content-Security-Policy**: Header properly configured
- [ ] **X-Frame-Options**: Set to DENY or SAMEORIGIN
- [ ] **X-Content-Type-Options**: Set to nosniff
- [ ] **Strict-Transport-Security**: Configured with preload
- [ ] **Secure Defaults**: No security disabled for convenience

### Logging & Monitoring
- [ ] **Security Events**: Auth, authz, exceptions logged
- [ ] **No Sensitive Data**: Passwords, tokens, PII excluded from logs
- [ ] **Exception Context**: Security exceptions logged with context
- [ ] **Anomaly Monitoring**: Logs monitored for suspicious patterns

### Dependency Management
- [ ] **Vulnerability Scanning**: Dependencies scanned regularly
- [ ] **Updates Applied**: Dependencies kept current
- [ ] **No Deprecated Crypto**: Modern algorithms only
- [ ] **Security Warnings**: Addressed, not ignored

## Threat Models

### STRIDE Framework

#### Spoofing (Identity)
**Threat**: Attacker pretends to be someone else
**Examples**:
- Stolen credentials
- Session hijacking
- IP spoofing

**Mitigations**:
- Strong authentication (MFA)
- Secure session management
- Certificate validation

#### Tampering (Integrity)
**Threat**: Attacker modifies data or code
**Examples**:
- Man-in-the-middle attacks
- SQL injection
- File upload attacks

**Mitigations**:
- Input validation
- Digital signatures
- Integrity checks

#### Repudiation (Non-repudiation)
**Threat**: Attacker denies performing action
**Examples**:
- Claiming didn't make purchase
- Denying sent message
- Tampered logs

**Mitigations**:
- Audit logging
- Digital signatures
- Tamper-evident logs

#### Information Disclosure (Confidentiality)
**Threat**: Attacker accesses unauthorized data
**Examples**:
- Data breach
- Error message leakage
- Insecure direct object reference

**Mitigations**:
- Encryption
- Access controls
- Data classification

#### Denial of Service (Availability)
**Threat**: Attacker makes system unavailable
**Examples**:
- DDoS attacks
- Resource exhaustion
- Algorithmic complexity attacks

**Mitigations**:
- Rate limiting
- Auto-scaling
- Input validation

#### Elevation of Privilege
**Threat**: Attacker gains higher access
**Examples**:
- Privilege escalation
- Missing function level access control
- JWT manipulation

**Mitigations**:
- Least privilege principle
- Authorization on every request
- Input validation

## OWASP Top 10 (2021)

### A01: Broken Access Control (CRITICAL)
**Issues**:
- Users accessing unauthorized functions/data
- Missing function-level access control
- IDOR (Insecure Direct Object References)

**Prevention**: Verify permissions on EVERY request

### A02: Cryptographic Failures (CRITICAL)
**Issues**:
- Weak encryption algorithms
- Missing encryption for sensitive data
- Improper key management

**Prevention**: Use strong crypto, encrypt PII

### A03: Injection (CRITICAL)
**Issues**:
- SQL injection
- NoSQL injection
- Command injection
- LDAP injection

**Prevention**: Parameterized queries, input validation

### A04: Insecure Design (HIGH)
**Issues**:
- Missing security in design phase
- No threat modeling
- Insecure architecture patterns

**Prevention**: Security by design, threat modeling

### A05: Security Misconfiguration (HIGH)
**Issues**:
- Default credentials
- Unnecessary features enabled
- Missing security headers
- Verbose error messages

**Prevention**: Hardening, security headers, minimal install

### A06: Vulnerable Components (HIGH)
**Issues**:
- Outdated dependencies
- Known CVEs in packages
- Unmaintained libraries

**Prevention**: Dependency scanning, regular updates

### A07: Authentication Failures (HIGH)
**Issues**:
- Weak passwords allowed
- Missing brute force protection
- Session fixation
- Credential stuffing

**Prevention**: MFA, rate limiting, secure session management

### A08: Data Integrity Failures (MEDIUM)
**Issues**:
- Insecure deserialization
- Missing integrity checks
- Unsigned updates

**Prevention**: Signature verification, integrity checks

### A09: Logging Failures (MEDIUM)
**Issues**:
- Missing audit logs
- Logs not monitored
- Sensitive data in logs

**Prevention**: Comprehensive logging, SIEM integration

### A10: SSRF (MEDIUM)
**Issues**:
- Server-Side Request Forgery
- Fetching attacker-controlled URLs
- Internal network access

**Prevention**: URL validation, allowlisting, network isolation

## Vulnerability Severity Levels

### CRITICAL (Block Deployment)
- Remote code execution
- SQL injection
- Authentication bypass
- Exposed credentials
- Unencrypted sensitive data

**Response**: Block deployment, fix immediately

### HIGH (Fix within 1 week)
- Cross-site scripting (XSS)
- Broken access control
- Insecure deserialization
- Missing encryption
- Weak authentication

### MEDIUM (Fix within 1 month)
- Missing security headers
- Information disclosure
- Session management issues
- Insufficient logging

### LOW (Track and fix when convenient)
- Minor information leakage
- Verbose error messages
- Missing best practices

## Security Review Templates

### Security Review Format
```
🔒 Security Review: [Component/Feature]

Overall Risk: [CRITICAL|HIGH|MEDIUM|LOW] [emoji]

Findings:

🔴 CRITICAL ([count])
━━━━━━━━━━━━━━━━━━━
[Number]. [Issue title]
   File: [path:line]

   Current:
   ```[language]
   [vulnerable code]
   ```

   Fix:
   ```[language]
   [secure code]
   ```

🟠 HIGH ([count])
━━━━━━━━━━━━━━━
[Findings...]

🟡 MEDIUM ([count])
━━━━━━━━━━━━━━━━
[Findings...]

🟢 LOW ([count])
━━━━━━━━━━━━━
[Findings...]

Action Required:
• [Priority and timeline for fixes]
```

### Security Alert Format
```
🚨 SECURITY ALERT: [Alert Title]

Detected: [Timestamp]
Severity: [CRITICAL|HIGH|MEDIUM|LOW]

Evidence:
• [Evidence point 1]
• [Evidence point 2]

Immediate Actions Taken:
✅ [Action 1]
✅ [Action 2]

Recommended Actions:
1. [Recommendation 1]
2. [Recommendation 2]

Investigation Details:
• [Details...]
```

### Compliance Report Format
```
📋 Compliance Check: [Framework]

Status: [X]% Compliant [emoji]

✅ COMPLIANT
━━━━━━━━━━━
• [Compliant item 1]
• [Compliant item 2]

❌ GAPS IDENTIFIED
━━━━━━━━━━━━━━━━
1. [Gap title]
   Issue: [Description]
   Risk: [Level]
   Recommendation: [Fix]

Timeline to Full Compliance: [Estimate]
```

## Compliance Frameworks

### GDPR Requirements
- Data encryption at rest and in transit
- Access controls implemented
- Audit logging enabled
- Data processing records
- Right to Erasure (Article 17)
- Data Portability (Article 20)
- Privacy Policy maintenance
- Cookie consent management

### SOC 2 Trust Principles
- Security
- Availability
- Confidentiality
- Processing Integrity
- Privacy

### PCI-DSS (Payment Card Industry)
- Build and maintain secure network
- Protect cardholder data
- Maintain vulnerability management program
- Implement strong access control measures
- Regularly monitor and test networks
- Maintain information security policy

## Data Classification

### RESTRICTED (Highest sensitivity)
- Passwords, auth tokens, API keys
- Payment card data (PCI-DSS)
- Health records (HIPAA)
- Government IDs (SSN, passport)
- Biometric data

**Requirements**:
- Encrypted at rest AND in transit
- Access logged and audited
- Need-to-know access only
- Cannot be stored in logs
- Retention limits enforced

### CONFIDENTIAL
- Personal Identifiable Information (PII)
- Email addresses, phone numbers
- Physical addresses
- Financial information
- Employment records

**Requirements**:
- Encrypted in transit, at rest preferred
- Access controls required
- Anonymize/pseudonymize when possible
- Subject to GDPR/CCPA rights

### INTERNAL
- Business data
- Internal communications
- Non-sensitive user data
- Aggregate statistics

**Requirements**:
- Standard access controls
- Not publicly accessible

### PUBLIC
- Marketing content
- Public documentation
- Published APIs

**Requirements**: None (intentionally public)

## Authentication Best Practices

### Password Policy (NIST 800-63B)
- Minimum 12 characters
- No maximum length (up to ~128)
- Allow all characters including spaces
- Check against breached password lists
- NO complexity requirements
- NO periodic rotation requirements

### Password Storage
✅ Use: Argon2id (preferred), bcrypt, scrypt
❌ Never: MD5, SHA1, SHA256 (without salt/iterations)
- Minimum work factor: bcrypt(12), Argon2id(t=3,m=64MB)
- Unique salt per password (auto with modern algorithms)

### Multi-Factor Authentication
Require MFA for:
- Admin accounts (mandatory)
- Sensitive operations
- Login from new device/location
- Password changes

MFA Methods (strongest → weakest):
1. Hardware keys (FIDO2/WebAuthn)
2. Authenticator apps (TOTP)
3. Push notifications
4. SMS (avoid if possible)

### Session Management
- Secure, HttpOnly, SameSite cookies
- Regenerate session ID on login
- Absolute timeout: 24 hours
- Idle timeout: 30-60 minutes
- Logout invalidates server-side session

### Brute Force Protection
- Rate limit: 5 attempts per 15 minutes
- Account lockout after 10 failures
- CAPTCHA after 3 failures
- Notify user of failed attempts

## Security Headers Configuration

### Required Headers
- **Content-Security-Policy**: Prevent XSS and data injection
- **X-Frame-Options**: Prevent clickjacking (DENY or SAMEORIGIN)
- **X-Content-Type-Options**: Prevent MIME sniffing (nosniff)
- **Strict-Transport-Security**: Force HTTPS (max-age=31536000)
- **Referrer-Policy**: Control referrer information (strict-origin-when-cross-origin)
- **Permissions-Policy**: Disable unnecessary browser features

### CSP Directives
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' https://api.your-domain.com;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
upgrade-insecure-requests;
```

## Secrets Management

### Storage Hierarchy (Best → Worst)
1. 🥇 Hardware Security Module (HSM)
2. 🥈 Cloud KMS (AWS KMS, GCP KMS, Azure Key Vault)
3. 🥉 Secrets Manager (Vault, AWS Secrets Manager)
4. 🆗 Encrypted environment variables
5. ❌ Plain text env vars in CI/CD
6. ❌ Config files in repo
7. ☠️ Hardcoded in source code

### What Counts as a Secret
- API keys (internal and external)
- Database credentials
- Encryption keys
- OAuth client secrets
- JWT signing keys
- SSH keys
- Certificates and private keys
- Webhook secrets
- Service account credentials

### Secret Rotation
- API keys: Every 90 days
- Database passwords: Every 90 days
- Encryption keys: Annually (with key versioning)
- After any suspected compromise: Immediately

## Audit Logging Events

### Authentication Events
- login.success
- login.failure
- logout
- password.change
- password.reset
- mfa.enable
- mfa.disable
- token.refresh

### Authorization Events
- permission.denied
- role.assign
- role.remove

### Data Access Events
- data.read (for sensitive data)
- data.create
- data.update
- data.delete
- data.export
- data.bulk

### Administrative Events
- user.create
- user.delete
- user.suspend
- settings.change
- config.change

### Security Events
- suspicious.activity
- breach.detected
- rate.limit.exceeded

## Never Log
- Passwords
- Tokens
- Secrets
- Credit card numbers
- SSNs
- Full PII (use masked versions)
