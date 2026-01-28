# Authentication Security Documentation

**Purpose**: Document security measures, token storage strategy, and security best practices for PetForce authentication system.

**Last Updated**: 2026-01-25  
**Owner**: Security Team (Samantha)  
**Compliance**: GDPR, CCPA, SOC 2 Type II

---

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Token Storage & Management](#token-storage--management)
3. [Password Security](#password-security)
4. [Rate Limiting](#rate-limiting)
5. [PII Protection](#pii-protection)
6. [Email Verification](#email-verification)
7. [Session Management](#session-management)
8. [Security Headers](#security-headers)
9. [Threat Model](#threat-model)
10. [Incident Response](#incident-response)

---

## Security Architecture

### Overview

PetForce uses **Supabase Auth** for authentication, which provides enterprise-grade security:

- **JWT-based authentication** with automatic token refresh
- **Row Level Security (RLS)** for database access control
- **Email verification enforcement** before login
- **Server-side password hashing** using bcrypt
- **Rate limiting** on sensitive endpoints
- **Audit logging** with PII protection

### Defense in Depth

Our security strategy uses multiple layers:

1. **Input Validation**: Client-side AND server-side validation
2. **Authentication**: JWT tokens with automatic expiration
3. **Authorization**: RLS policies enforce data access
4. **Encryption**: TLS 1.2+ for all traffic, bcrypt for passwords
5. **Monitoring**: Real-time logging and alerting via Datadog/Sentry
6. **Audit Trail**: All auth events logged with request correlation

---

## Token Storage & Management

### Token Types

PetForce uses two token types:

1. **Access Token** (JWT)
   - Short-lived (15 minutes default)
   - Contains user identity and claims
   - Used for API authentication

2. **Refresh Token** (Opaque)
   - Long-lived (30 days default)
   - Used to obtain new access tokens
   - Stored securely (see below)

### Secure Storage Strategy

**CRITICAL**: Tokens MUST be stored securely to prevent XSS and CSRF attacks.

#### Web Application (React)

Supabase automatically stores tokens in:

- **localStorage** for refresh tokens
- **Memory** for access tokens (during session)
- **httpOnly cookies** (when configured - recommended for production)

**Production Recommendation**: Use Supabase Server-Side Auth for httpOnly cookies:

```typescript
// Configure Supabase for server-side sessions
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: {
        // Use httpOnly cookies in production
        getItem: (key) => getCookie(key),
        setItem: (key, value) => setCookie(key, value, { httpOnly: true, secure: true, sameSite: 'strict' }),
        removeItem: (key) => deleteCookie(key),
      },
    },
  }
);
```

**Security Properties**:
- `httpOnly: true` - Prevents JavaScript access (XSS protection)
- `secure: true` - HTTPS only
- `sameSite: 'strict'` - CSRF protection

#### Mobile Application (React Native)

Uses **Expo SecureStore** for encrypted token storage:

```typescript
import * as SecureStore from 'expo-secure-store';

// Tokens encrypted at rest
await SecureStore.setItemAsync('supabase_session', JSON.stringify(session));
```

**Security Properties**:
- Hardware-backed encryption (iOS Keychain, Android Keystore)
- Biometric protection available
- App-specific storage (not shared between apps)

### Token Refresh Flow

```
1. Access token expires (15 min)
2. Client detects 401 Unauthorized
3. Client sends refresh token to /auth/refresh
4. Server validates refresh token
5. Server issues new access + refresh tokens
6. Client stores new tokens securely
```

**Security Note**: Refresh tokens are rotated on each use (one-time use).

### Token Validation

All API requests validate tokens:

```typescript
// Server-side token validation
const { data: { user }, error } = await supabase.auth.getUser(accessToken);

if (error || !user) {
  return res.status(401).json({ error: 'Unauthorized' });
}

// Check email verification
if (!user.email_confirmed_at) {
  return res.status(403).json({ error: 'Email not verified' });
}
```

---

## Password Security

### Server-Side Password Policy

**ENFORCED ON SERVER** (Supabase Edge Function: `validate-registration`)

Minimum requirements:
- **8+ characters** (recommended: 12+)
- **1 uppercase** letter (A-Z)
- **1 lowercase** letter (a-z)
- **1 number** (0-9)

**Why these requirements**:
- 8 chars = 10^14 combinations (resistant to brute force)
- Mixed case + numbers = prevents dictionary attacks
- Server-side enforcement = cannot be bypassed

### Password Hashing

Supabase uses **bcrypt** with work factor 10:

```
bcrypt(password, salt_rounds=10)
```

**Security properties**:
- Adaptive (can increase work factor over time)
- Salt per password (prevents rainbow tables)
- Slow by design (prevents brute force)

### Password Reset Flow

```
1. User requests reset via email
2. Server generates secure token (256-bit random)
3. Token stored hashed in database with 1-hour expiry
4. Email sent with reset link (token in URL)
5. User clicks link, enters new password
6. Server validates token, hashes new password
7. Old sessions invalidated
```

**Security Note**: We do NOT reveal whether email exists (prevents enumeration).

### Password Storage

**NEVER** store passwords in:
- Plain text
- Reversible encryption
- Client-side code
- Logs (even hashed)

---

## Rate Limiting

### Protection Against Abuse

Rate limiting prevents:
- **Brute force attacks** (password guessing)
- **Email spam** (confirmation email abuse)
- **Denial of Service** (resource exhaustion)

### Implemented Limits

#### Resend Confirmation Email

**Endpoint**: `/functions/v1/resend-confirmation`  
**Limit**: **3 requests per 15 minutes** per email address  
**Implementation**: Database-backed tracking in `auth_rate_limits` table

```typescript
// Rate limit check
const attempts = await supabase
  .from('auth_rate_limits')
  .select()
  .eq('email', email)
  .eq('operation', 'resend_confirmation')
  .gte('attempted_at', fifteenMinutesAgo);

if (attempts.length >= 3) {
  return res.status(429).json({
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again in X minutes.',
    retryAfter: calculateRetryAfter(attempts),
  });
}
```

**Response Headers**:
- `Retry-After`: Seconds until next attempt allowed
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: ISO timestamp when limit resets

#### Login Attempts

**Built into Supabase Auth**:
- 5 failed attempts per email
- 15-minute lockout
- IP-based secondary rate limit

#### Registration

**Supabase default**:
- Rate limited by IP address
- Prevents mass account creation

### Future Rate Limits (Roadmap)

- Password reset: 3 requests per hour per email
- Session refresh: 10 requests per minute per token
- Magic link: 3 requests per 15 minutes per email

---

## PII Protection

### Personal Identifiable Information

Pet family data is highly sensitive. We treat these as PII:

- Email addresses
- Names (first, last)
- IP addresses
- User IDs (in some contexts)

### Logging Strategy

**Production-ready SHA-256 email hashing** (implemented in `logger.ts`):

```typescript
// Email hashing in logs
private hashEmail(email: string): string {
  const hash = createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
  
  // Return first 16 chars (64 bits of entropy)
  return 'sha256:' + hash.substring(0, 16);
}
```

**What we log**:
```json
{
  "event": "login_attempt_started",
  "email": "sha256:a1b2c3d4e5f6g7h8",
  "timestamp": "2026-01-25T12:00:00Z",
  "requestId": "req_123abc"
}
```

**What we NEVER log**:
- Plain text emails
- Passwords (even hashed)
- Tokens (access or refresh)
- Session IDs

### GDPR Compliance

- **Right to Access**: Users can request their data via support
- **Right to Deletion**: Soft delete (email -> 'deleted_YYYYMMDD@deleted.local')
- **Data Retention**: 90 days for audit logs, 7 years for compliance logs
- **Data Minimization**: Only collect what's necessary

### Monitoring Integration

Logs sent to monitoring service with PII already hashed:

```typescript
monitoring.sendLog({
  level: 'INFO',
  message: 'User login successful',
  context: {
    email: 'sha256:a1b2c3d4e5f6g7h8', // Already hashed
    userId: 'user_123',
    requestId: 'req_abc',
  },
});
```

---

## Email Verification

### Enforcement Policy

**CRITICAL**: Users MUST verify email before login.

```typescript
// Enforced in login flow (auth-api.ts:185-203)
if (!authData.user.email_confirmed_at) {
  logger.authEvent('login_rejected_unconfirmed', requestId, {
    userId: authData.user.id,
    email: data.email,
  });

  return {
    success: false,
    error: {
      code: 'EMAIL_NOT_CONFIRMED',
      message: 'Please verify your email address before logging in.',
    },
  };
}
```

### Verification Flow

```
1. User registers with email/password
2. Supabase generates secure verification token
3. Email sent with verification link
4. User clicks link -> token validated
5. email_confirmed_at timestamp set
6. User can now login
```

### Token Security

- **256-bit random tokens** (cryptographically secure)
- **1-hour expiration** (reduces attack window)
- **Single use** (token invalidated after verification)
- **HTTPS only** (prevents token interception)

### Resend Protection

Rate limiting prevents abuse (see Rate Limiting section).

---

## Session Management

### Session Lifecycle

```
1. Login -> Access token (15 min) + Refresh token (30 days)
2. Access token expires -> Auto-refresh using refresh token
3. Refresh token expires -> User must login again
4. Logout -> Both tokens invalidated
```

### Session Security

**Automatic Features**:
- Token rotation on refresh
- Refresh token single-use
- Concurrent session detection
- Idle timeout (30 days)

**Manual Features**:
- Logout invalidates all sessions
- Password change invalidates all sessions
- Email change requires re-verification

### Multi-Device Sessions

Supabase allows concurrent sessions:

- Each device gets unique tokens
- Logout on one device doesn't affect others
- Future: "Logout everywhere" feature

---

## Security Headers

### Required HTTP Headers (Production)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.supabase.co
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Implementation**: Configure in Supabase Edge Functions or Vercel/Netlify.

### CORS Policy

```typescript
// Allowed origins (production)
const corsOrigins = [
  'https://petforce.app',
  'https://www.petforce.app',
  'https://admin.petforce.app',
];

// CORS headers
res.setHeader('Access-Control-Allow-Origin', origin);
res.setHeader('Access-Control-Allow-Credentials', 'true');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
```

---

## Threat Model

### Threats We Mitigate

1. **Brute Force Attacks**
   - Mitigation: Rate limiting, account lockout, bcrypt work factor

2. **Credential Stuffing**
   - Mitigation: Email verification, rate limiting, monitoring for anomalies

3. **XSS (Cross-Site Scripting)**
   - Mitigation: httpOnly cookies, CSP headers, input sanitization

4. **CSRF (Cross-Site Request Forgery)**
   - Mitigation: SameSite cookies, CORS policy, token validation

5. **Session Hijacking**
   - Mitigation: HTTPS only, short-lived tokens, token rotation

6. **Email Enumeration**
   - Mitigation: Generic error messages, rate limiting

7. **Man-in-the-Middle**
   - Mitigation: TLS 1.2+, HSTS, certificate pinning (mobile)

8. **PII Exposure**
   - Mitigation: Email hashing in logs, secure storage, GDPR compliance

### Threats We Accept (With Controls)

1. **Phishing Attacks**
   - Control: User education, email verification from known domain

2. **Device Theft**
   - Control: Biometric auth (mobile), session timeout, remote logout (future)

3. **Social Engineering**
   - Control: Support team training, strict identity verification

---

## Incident Response

### Security Incident Procedure

1. **Detection**
   - Monitoring alerts (Datadog/Sentry)
   - User reports
   - Security scan findings

2. **Assessment**
   - Severity (CRITICAL, HIGH, MEDIUM, LOW)
   - Impact (users affected, data exposed)
   - Root cause analysis

3. **Containment**
   - Block attack vector
   - Invalidate compromised tokens
   - Rate limit if necessary

4. **Remediation**
   - Deploy fix
   - Rotate secrets if needed
   - Notify affected users (GDPR requirement)

5. **Post-Mortem**
   - Document incident
   - Update threat model
   - Improve monitoring

### Contact

- **Security Team**: security@petforce.app
- **On-Call**: Pagerduty (production)
- **Bug Bounty**: hackerone.com/petforce (future)

### Disclosure Policy

- **User notification**: Within 72 hours (GDPR requirement)
- **Public disclosure**: After fix deployed + 30 days
- **CVE**: If severity warrants

---

## Security Checklist (Pre-Production)

- [x] Server-side password policy enforcement
- [x] Rate limiting on resend confirmation
- [x] Production email hashing (SHA-256)
- [x] Token storage strategy documented
- [ ] Security headers configured (Vercel/Netlify)
- [ ] Monitoring service integrated (Datadog/Sentry)
- [ ] HTTPS enforced (production)
- [ ] Security audit completed
- [ ] Penetration testing completed
- [ ] GDPR compliance verified
- [ ] Incident response plan tested

---

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Supabase Auth Security](https://supabase.com/docs/guides/auth/security)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [GDPR Requirements](https://gdpr.eu/)

---

**Document Version**: 1.0  
**Last Review**: 2026-01-25  
**Next Review**: 2026-04-25 (quarterly)
