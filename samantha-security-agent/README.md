# 🔒 Samantha: The Security Agent

> *Security is not a product, but a process.*

Samantha is a comprehensive Security agent powered by Claude Code. She protects your applications, data, and users from threats by reviewing code, configuring security controls, and ensuring compliance. When Samantha reviews your code, vulnerabilities don't stand a chance.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Secure Code Review** | Identify vulnerabilities, OWASP Top 10 |
| **Authentication** | Password policies, MFA, JWT security |
| **Authorization** | RBAC/ABAC, access control patterns |
| **Data Protection** | Encryption, secrets management, PII handling |
| **Security Headers** | CSP, HSTS, CORS configuration |
| **Compliance** | GDPR, SOC2, PCI-DSS, HIPAA |

## 📁 Package Contents

```
samantha-security-agent/
├── SAMANTHA.md                           # Full security documentation
├── CLAUDE.md                             # Claude Code agent configuration
├── README.md                             # This file
├── QUICKSTART.md                         # 10-minute setup guide
├── .samantha.yml                         # Security configuration
└── templates/
    ├── security-middleware.ts.template   # Express security middleware
    └── auth-utils.ts.template            # Authentication utilities
```

## 🚀 Quick Start

### 1. Copy files to your project

```bash
cp samantha-security-agent/.samantha.yml your-repo/
cp samantha-security-agent/CLAUDE.md your-repo/
cp -r samantha-security-agent/templates your-repo/src/security/
```

### 2. Install dependencies

```bash
npm install helmet express-rate-limit cors jose zod isomorphic-dompurify otplib
```

### 3. Apply security middleware

```typescript
import { applySecurity } from './security/security-middleware';

const app = express();

applySecurity(app, {
  trustProxy: true,
  cors: {
    origins: ['https://your-app.com'],
  },
});
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 🛡️ OWASP Top 10 Coverage

| # | Vulnerability | Samantha's Protection |
|---|---------------|----------------------|
| A01 | Broken Access Control | Authorization middleware, RBAC patterns |
| A02 | Cryptographic Failures | Encryption utilities, secure key management |
| A03 | Injection | Input validation, parameterized queries |
| A04 | Insecure Design | Threat modeling, secure patterns |
| A05 | Security Misconfiguration | Security headers, hardening configs |
| A06 | Vulnerable Components | Dependency scanning, update guidance |
| A07 | Auth Failures | Password hashing, MFA, rate limiting |
| A08 | Data Integrity | Input validation, signature verification |
| A09 | Logging Failures | Audit logging patterns |
| A10 | SSRF | URL validation, allowlisting |

## 🔑 Authentication Features

### Password Security
- Minimum 12 characters (NIST compliant)
- Breached password detection
- Argon2id/bcrypt hashing
- No complexity requirements (per NIST)

### Session Security
- Secure, HttpOnly, SameSite cookies
- Session regeneration on login
- Idle and absolute timeouts
- Server-side session storage

### Multi-Factor Authentication
- TOTP (authenticator apps)
- WebAuthn (hardware keys)
- Recovery codes

## 🛡️ Security Headers

```typescript
// Applied automatically by securityHeaders middleware
{
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}
```

## 📋 Compliance

| Framework | Coverage |
|-----------|----------|
| **GDPR** | Data protection, consent, subject rights |
| **SOC 2** | Security, availability, confidentiality |
| **PCI-DSS** | Payment card data protection |
| **HIPAA** | Health information protection |

## 🤖 Using with Claude Code

```
You: Review the authentication in our login endpoint

Samantha: 🔒 Security Review: Login Endpoint

Overall Risk: HIGH ⚠️

Findings:

🔴 CRITICAL (1)
━━━━━━━━━━━━━
1. SQL Injection vulnerability
   File: src/auth/login.ts:23
   
   Current:
   ```typescript
   db.query(`SELECT * FROM users WHERE email = '${email}'`)
   ```
   
   Fix:
   ```typescript
   db.query('SELECT * FROM users WHERE email = $1', [email])
   ```

🟠 HIGH (2)
━━━━━━━━━
2. Missing rate limiting on login endpoint
3. Password not validated before hashing

Action Required:
• Fix CRITICAL issue immediately
• Add rate limiting before deployment
```

## 🎯 Samantha's Commands

### Scanning
```bash
samantha scan --full
samantha scan dependencies
samantha scan secrets
```

### Auditing
```bash
samantha audit auth
samantha audit headers
samantha audit encryption
```

### Compliance
```bash
samantha compliance gdpr
samantha compliance soc2
samantha compliance report
```

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Engrid** | Reviews code for security vulnerabilities |
| **Chuck** | Security gates in CI/CD pipeline |
| **Larry** | Security event logging requirements |
| **Tucker** | Security test cases |

## 📋 Configuration

Samantha uses `.samantha.yml`:

```yaml
version: 1

scanning:
  dependencies:
    failOn: 'high'
  secrets:
    enabled: true
    
authentication:
  password:
    minLength: 12
  session:
    cookieSecure: true
    cookieHttpOnly: true
    
headers:
  contentSecurityPolicy:
    defaultSrc: ["'self'"]
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [SAMANTHA.md](./SAMANTHA.md) | Complete security documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `security-middleware.ts.template` | Express security middleware |
| `auth-utils.ts.template` | Password hashing, JWT, MFA |

---

<p align="center">
  <strong>Samantha: Your Security Guardian</strong><br>
  <em>Think like an attacker. Defend like a champion.</em>
</p>

---

*Security is not a product, but a process.* 🔒
