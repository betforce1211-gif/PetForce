# Design: Authentication System Architecture

## Overview

This document details the technical architecture for PetForce's authentication system, supporting email/password, magic links, Google SSO, Apple SSO, and biometric authentication.

## Architecture Principles

Aligned with PetForce philosophy:
- **Simple Over Complex**: Use proven libraries, avoid custom crypto
- **Secure by Default**: Industry-standard protocols (OAuth 2.0, JWT, bcrypt)
- **Reliable**: Graceful degradation, clear error handling
- **Privacy-First**: Minimal data collection, secure storage

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Web    │  │  Mobile  │  │  macOS   │  │  Admin   │        │
│  │  (React) │  │  (iOS)   │  │ (Electron)│  │ Console  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / TLS 1.3
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Gateway                                │
│                   (Rate Limiting, CORS)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Service                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Auth API   │  │ Token Manager│  │  Session     │          │
│  │  (REST/      │  │  (JWT)       │  │  Manager     │          │
│  │   GraphQL)   │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Email/Pass   │  │  Magic Link  │  │  OAuth       │          │
│  │   Provider   │  │   Provider   │  │  Provider    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   2FA TOTP   │  │  Biometric   │  │   Account    │          │
│  │   Provider   │  │   Manager    │  │   Recovery   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Database │  │  Email   │  │  OAuth   │
        │ (Users,  │  │ Service  │  │ Providers│
        │Sessions) │  │(Resend)  │  │(G, Apple)│
        └──────────┘  └──────────┘  └──────────┘
```

## Data Models

### User Model

```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique, verified
  emailVerified: boolean;        // Email verification status
  hashedPassword?: string;       // bcrypt hash (optional, not used for SSO/magic link)

  // Profile
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;

  // Authentication metadata
  authMethods: AuthMethod[];     // Which methods this user has enabled
  preferredAuthMethod?: AuthMethod;

  // 2FA
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;      // TOTP secret (encrypted)
  twoFactorBackupCodes?: string[]; // Encrypted backup codes

  // Security
  accountLockedUntil?: Date;     // Account lockout timestamp
  failedLoginAttempts: number;
  lastLoginAt?: Date;
  lastLoginIp?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;              // Soft delete
}

type AuthMethod =
  | 'email_password'
  | 'magic_link'
  | 'google_sso'
  | 'apple_sso'
  | 'biometric';

interface BiometricDevice {
  id: string;
  userId: string;
  deviceId: string;              // Platform-specific device identifier
  deviceName: string;            // "iPhone 14 Pro", "MacBook Pro"
  biometricType: 'face_id' | 'touch_id';
  publicKey: string;             // For biometric verification
  createdAt: Date;
  lastUsedAt: Date;
}
```

### Session Model

```typescript
interface Session {
  id: string;                    // UUID
  userId: string;

  // Tokens
  accessToken: string;           // Short-lived JWT (15 min)
  refreshToken: string;          // Long-lived token (7 days), hashed in DB

  // Metadata
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    type: 'web' | 'mobile' | 'desktop';
    os: string;
    browser?: string;
  };

  // Expiration
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;

  // Timestamps
  createdAt: Date;
  lastActivityAt: Date;
}
```

### Email Verification Model

```typescript
interface EmailVerification {
  id: string;
  userId: string;
  email: string;
  token: string;                 // Secure random token (hashed in DB)
  expiresAt: Date;               // 24 hours from creation
  verifiedAt?: Date;
  createdAt: Date;
}
```

### Password Reset Model

```typescript
interface PasswordReset {
  id: string;
  userId: string;
  token: string;                 // Secure random token (hashed in DB)
  expiresAt: Date;               // 1 hour from creation
  usedAt?: Date;                 // Single use
  createdAt: Date;
}
```

### Magic Link Model

```typescript
interface MagicLink {
  id: string;
  email: string;                 // Can be used before user exists
  token: string;                 // Secure random token (hashed in DB)
  expiresAt: Date;               // 15 minutes from creation
  usedAt?: Date;                 // Single use
  createdAt: Date;
}
```

### OAuth Connection Model

```typescript
interface OAuthConnection {
  id: string;
  userId: string;
  provider: 'google' | 'apple';
  providerId: string;            // User ID from OAuth provider
  email: string;                 // Email from provider
  accessToken?: string;          // Encrypted (if we need to call provider APIs)
  refreshToken?: string;         // Encrypted
  tokenExpiresAt?: Date;

  // Profile data from provider
  providerData: {
    name?: string;
    picture?: string;
    email?: string;
    emailVerified?: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

## Authentication Flows

### 1. Email/Password Registration

```
Client                    API                     Database           Email Service
  │                        │                         │                    │
  │ POST /auth/register    │                         │                    │
  ├───────────────────────>│                         │                    │
  │ {email, password}      │                         │                    │
  │                        │ Check email exists      │                    │
  │                        ├────────────────────────>│                    │
  │                        │<────────────────────────┤                    │
  │                        │ (not found = good)      │                    │
  │                        │                         │                    │
  │                        │ Hash password (bcrypt)  │                    │
  │                        │ Create user             │                    │
  │                        ├────────────────────────>│                    │
  │                        │<────────────────────────┤                    │
  │                        │                         │                    │
  │                        │ Generate verification   │                    │
  │                        │ token & save            │                    │
  │                        ├────────────────────────>│                    │
  │                        │                         │                    │
  │                        │ Send verification email │                    │
  │                        ├────────────────────────────────────────────>│
  │                        │                         │                    │
  │<───────────────────────┤                         │                    │
  │ {message: "Check email │                         │                    │
  │  to verify"}           │                         │                    │
  │                        │                         │                    │
```

### 2. Email Verification

```
Client                    API                     Database
  │                        │                         │
  │ GET /auth/verify?token │                         │
  ├───────────────────────>│                         │
  │                        │ Find token              │
  │                        ├────────────────────────>│
  │                        │<────────────────────────┤
  │                        │ Check expiration        │
  │                        │ Mark email verified     │
  │                        ├────────────────────────>│
  │                        │ Create session          │
  │                        │ Generate JWT            │
  │                        │                         │
  │<───────────────────────┤                         │
  │ {accessToken,          │                         │
  │  refreshToken}         │                         │
  │ Redirect to onboarding │                         │
```

### 3. Magic Link Login

```
Client                    API                     Database           Email Service
  │                        │                         │                    │
  │ POST /auth/magic-link  │                         │                    │
  ├───────────────────────>│                         │                    │
  │ {email}                │                         │                    │
  │                        │ Check if user exists    │                    │
  │                        ├────────────────────────>│                    │
  │                        │<────────────────────────┤                    │
  │                        │                         │                    │
  │                        │ Generate magic link     │                    │
  │                        │ token & save            │                    │
  │                        ├────────────────────────>│                    │
  │                        │                         │                    │
  │                        │ Send magic link email   │                    │
  │                        ├────────────────────────────────────────────>│
  │                        │                         │                    │
  │<───────────────────────┤                         │                    │
  │ {message: "Check email"}                         │                    │
  │                        │                         │                    │
  │ (User clicks link)     │                         │                    │
  │ GET /auth/magic?token  │                         │                    │
  ├───────────────────────>│                         │                    │
  │                        │ Verify token            │                    │
  │                        ├────────────────────────>│                    │
  │                        │ Check expiration (15min)│                    │
  │                        │ Mark as used            │                    │
  │                        │ Create/update user      │                    │
  │                        │ Create session          │                    │
  │                        │                         │                    │
  │<───────────────────────┤                         │                    │
  │ {accessToken,          │                         │                    │
  │  refreshToken}         │                         │                    │
```

### 4. OAuth (Google/Apple) Flow

```
Client              API              OAuth Provider        Database
  │                  │                      │                 │
  │ Click "Sign in   │                      │                 │
  │ with Google"     │                      │                 │
  ├─────────────────>│                      │                 │
  │                  │ Generate OAuth state │                 │
  │                  │ (CSRF protection)    │                 │
  │                  │                      │                 │
  │<─────────────────┤                      │                 │
  │ Redirect to      │                      │                 │
  │ Google OAuth     │                      │                 │
  │──────────────────────────────────────>  │                 │
  │                  │   (User authorizes)  │                 │
  │                  │                      │                 │
  │<──────────────────────────────────────  │                 │
  │ Redirect back    │                      │                 │
  │ with auth code   │                      │                 │
  │                  │                      │                 │
  │ GET /auth/google │                      │                 │
  │ /callback?code   │                      │                 │
  ├─────────────────>│                      │                 │
  │                  │ Exchange code for    │                 │
  │                  │ tokens               │                 │
  │                  ├─────────────────────>│                 │
  │                  │<─────────────────────┤                 │
  │                  │ {access_token, id_token}               │
  │                  │                      │                 │
  │                  │ Verify ID token      │                 │
  │                  │ Extract user info    │                 │
  │                  │                      │                 │
  │                  │ Find or create user  │                 │
  │                  ├────────────────────────────────────────>│
  │                  │ Save OAuth connection│                 │
  │                  │                      │                 │
  │                  │ Create session       │                 │
  │                  │ Generate JWT         │                 │
  │                  │                      │                 │
  │<─────────────────┤                      │                 │
  │ {accessToken,    │                      │                 │
  │  refreshToken}   │                      │                 │
```

### 5. Biometric Authentication

```
Client (iOS/macOS)         API                    Database
  │                         │                        │
  │ (First time setup)      │                        │
  │ User logs in via        │                        │
  │ another method          │                        │
  │                         │                        │
  │ POST /auth/biometric    │                        │
  │ /enroll                 │                        │
  ├────────────────────────>│                        │
  │ {deviceId, publicKey}   │                        │
  │                         │ Save biometric device  │
  │                         ├───────────────────────>│
  │                         │                        │
  │<────────────────────────┤                        │
  │ {enrolled: true}        │                        │
  │                         │                        │
  │ (Subsequent logins)     │                        │
  │ Show biometric prompt   │                        │
  │ (Face ID / Touch ID)    │                        │
  │                         │                        │
  │ POST /auth/biometric    │                        │
  │ /authenticate           │                        │
  ├────────────────────────>│                        │
  │ {deviceId, signature}   │                        │
  │                         │ Verify device exists   │
  │                         ├───────────────────────>│
  │                         │ Verify signature with  │
  │                         │ stored public key      │
  │                         │                        │
  │                         │ Create session         │
  │                         │                        │
  │<────────────────────────┤                        │
  │ {accessToken,           │                        │
  │  refreshToken}          │                        │
```

## Security Considerations

### 1. Password Security
- **Hashing**: Use bcrypt with cost factor 12 (or Argon2id)
- **Requirements**: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number
- **Storage**: Never store plaintext, only hashed passwords
- **Validation**: Check against common password lists (HaveIBeenPwned API)

### 2. Token Security
- **JWT Access Tokens**:
  - Short-lived (15 minutes)
  - Include: userId, email, authMethod, iat, exp
  - Signed with HS256 or RS256
  - Not stored in database (stateless)

- **Refresh Tokens**:
  - Long-lived (7 days)
  - Cryptographically random (32 bytes)
  - Hashed before storage in database
  - Rotate on use
  - Revocable (can be deleted from database)

- **Magic Link Tokens**:
  - Cryptographically random (32 bytes)
  - Hashed before storage
  - Single use only
  - 15 minute expiration
  - Tied to specific email address

- **Email Verification Tokens**:
  - Cryptographically random (32 bytes)
  - Hashed before storage
  - Single use only
  - 24 hour expiration

### 3. OAuth Security
- **State Parameter**: CSRF protection, unique per request, validated on callback
- **PKCE**: Use Proof Key for Code Exchange for mobile apps
- **Token Storage**: Encrypt access/refresh tokens from providers before storing
- **Scope Limitation**: Request minimum scopes needed (email, profile)

### 4. Session Security
- **Secure Cookies** (if using cookies):
  - HttpOnly flag (prevent XSS)
  - Secure flag (HTTPS only)
  - SameSite=Strict or Lax
  - Domain and Path restrictions

- **Token Storage** (if using local storage):
  - Access token in memory only (cleared on page refresh)
  - Refresh token in httpOnly cookie or secure storage

- **Session Invalidation**:
  - Logout deletes session from database
  - Password change invalidates all sessions
  - Account locked invalidates all sessions

### 5. Rate Limiting
- **Login attempts**: 5 attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP
- **Magic link requests**: 3 per 15 minutes per email
- **Password reset**: 3 per hour per email
- **Email verification**: 5 sends per day per user

### 6. Account Lockout
- **Trigger**: 5 failed login attempts
- **Duration**: 15 minutes
- **Unlock**: Time-based or email verification link
- **Notification**: Email sent to user about lockout

### 7. 2FA Security
- **TOTP**: Standard implementation (RFC 6238)
- **Secret Storage**: Encrypted at rest
- **Backup Codes**: 10 single-use codes, bcrypt hashed
- **Recovery**: Backup codes or support contact

## API Endpoints

### Registration & Login

```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
```

### Email Verification

```
POST   /auth/verify/send
GET    /auth/verify/:token
```

### Password Management

```
POST   /auth/password/forgot
POST   /auth/password/reset
POST   /auth/password/change
```

### Magic Link

```
POST   /auth/magic-link/send
GET    /auth/magic-link/verify/:token
```

### OAuth

```
GET    /auth/google
GET    /auth/google/callback
GET    /auth/apple
GET    /auth/apple/callback
```

### Biometric

```
POST   /auth/biometric/enroll
POST   /auth/biometric/authenticate
DELETE /auth/biometric/devices/:deviceId
GET    /auth/biometric/devices
```

### 2FA

```
POST   /auth/2fa/enable
POST   /auth/2fa/disable
POST   /auth/2fa/verify
POST   /auth/2fa/backup-codes/regenerate
```

## Email Templates

### 1. Welcome Email
**Subject**: Welcome to the PetForce family! 🐾

**Content**:
- Warm welcome message
- What's next: Complete your profile, add your first pet
- Quick tips for getting started
- Link to help center
- Unsubscribe option

### 2. Email Verification
**Subject**: Verify your PetForce email address

**Content**:
- Simple message explaining why verification is needed
- Large "Verify Email" button
- Expiration time (24 hours)
- Alternative: Copy/paste link
- Support contact if issues

### 3. Magic Link
**Subject**: Your PetForce login link

**Content**:
- "You requested a login link"
- Large "Sign In" button
- Expiration time (15 minutes)
- Security note: "Didn't request this? Ignore this email"
- Alternative: Copy/paste link

### 4. Password Reset
**Subject**: Reset your PetForce password

**Content**:
- "You requested a password reset"
- Large "Reset Password" button
- Expiration time (1 hour)
- Security note: "Didn't request this? Contact support"
- Alternative: Copy/paste link

### 5. Password Changed
**Subject**: Your PetForce password was changed

**Content**:
- Confirmation that password was changed
- Time and location of change
- "Not you? Contact support immediately"
- Link to account security settings

### 6. Account Locked
**Subject**: Your PetForce account has been locked

**Content**:
- Explanation of why (5 failed login attempts)
- How long it's locked (15 minutes)
- "Unlock Now" button (email verification)
- Security tips
- Support contact

## Technology Stack Recommendations

### Backend
- **Language**: TypeScript/Node.js or Go
- **Framework**: Express.js, Fastify, or Hono (Node) / Gin or Fiber (Go)
- **Database**: PostgreSQL (user data, sessions)
- **Cache**: Redis (rate limiting, session cache)
- **Email**: Resend (modern, developer-friendly)

### Libraries
- **JWT**: jsonwebtoken (Node) or golang-jwt/jwt (Go)
- **Password Hashing**: bcrypt or @node-rs/bcrypt
- **2FA**: speakeasy (TOTP)
- **OAuth**: passport (Node) / oauth2 libraries (Go)
- **Validation**: zod or joi (Node) / go-playground/validator (Go)

### Frontend
- **Framework**: React (web), SwiftUI (iOS), Swift (macOS)
- **State**: Zustand or Context API
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios or native fetch
- **Biometric**: LocalAuthentication framework (iOS/macOS)

### Infrastructure
- **Secrets**: AWS Secrets Manager, Vault, or environment variables
- **Email Service**: Resend, SendGrid, or AWS SES
- **Monitoring**: Sentry (errors), DataDog or New Relic (performance)
- **Analytics**: PostHog or Mixpanel (user events)

## Performance Considerations

### Database Indexes
```sql
-- Users table
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);

-- Sessions table
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token_hash ON sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(refresh_token_expires_at);

-- OAuth connections
CREATE UNIQUE INDEX idx_oauth_provider_id ON oauth_connections(provider, provider_id);
CREATE INDEX idx_oauth_user_id ON oauth_connections(user_id);
```

### Caching Strategy
- **User lookups**: Cache user object for 5 minutes after login
- **OAuth tokens**: Cache provider tokens with their expiration
- **Rate limiting**: Redis counters with TTL
- **Session validation**: Cache valid JWT signatures

### Response Times (Target)
- Login: < 500ms (p95)
- Registration: < 1s (p95)
- Email send: < 2s (p95)
- OAuth flow: < 3s (p95, depends on provider)
- Token refresh: < 200ms (p95)

## Monitoring & Logging

### Metrics to Track
- Registration completion rate
- Login success/failure rate by method
- Email delivery rate
- OAuth success rate by provider
- Magic link usage rate
- 2FA enrollment rate
- Session duration
- Token refresh frequency
- Account lockout frequency

### Security Events to Log
- Failed login attempts (with IP)
- Account lockouts
- Password changes
- Password resets
- 2FA enablement/disablement
- OAuth connections added/removed
- Suspicious login patterns
- API rate limit violations

### Alerts
- **Critical**: High failed login rate (potential attack)
- **Critical**: Email delivery failure > 5%
- **High**: OAuth provider errors > 10%
- **Medium**: Account lockout spike
- **Low**: 2FA backup codes running low

## Privacy & Compliance

### GDPR Considerations
- **Data Collection**: Collect minimum data needed
- **User Consent**: Clear privacy policy, consent checkboxes
- **Data Access**: Users can download their data
- **Data Deletion**: Users can request account deletion
- **Data Portability**: Export user data in JSON format

### Data Retention
- **Active Sessions**: Until expiration or logout
- **Expired Tokens**: Delete after 30 days
- **Failed Login Logs**: 90 days
- **Deleted Accounts**: Soft delete for 30 days, then hard delete

### PII Handling
- **Email Addresses**: Encrypted at rest (optional), protected in logs
- **IP Addresses**: Hashed or anonymized after 30 days
- **User Agent**: Stored for security, cleared after 90 days

## Testing Strategy

### Unit Tests
- Password hashing/validation
- JWT generation/verification
- Token expiration logic
- Email validation
- Rate limiting logic

### Integration Tests
- Complete registration flow
- All login methods
- Password reset flow
- Email verification flow
- Magic link flow
- OAuth flows (Google, Apple)
- 2FA setup and verification
- Biometric enrollment and authentication

### Security Tests
- SQL injection attempts
- XSS attempts
- CSRF token validation
- Session fixation attacks
- Brute force protection
- OAuth state parameter validation
- JWT tampering detection

### Performance Tests
- Concurrent login requests (1000/s target)
- Database query optimization
- Email queue handling
- Token generation speed
- Password hashing benchmarks

## Rollout Strategy

### Phase 1: Core Auth (Week 1-2)
- Email/password registration
- Email verification
- Login with email/password
- Password reset
- JWT session management

### Phase 2: Passwordless (Week 2-3)
- Magic link authentication
- Rate limiting
- Account lockout protection

### Phase 3: SSO (Week 3-4)
- Google OAuth integration
- Apple OAuth integration
- OAuth connection management

### Phase 4: Enhanced Security (Week 4-5)
- Optional 2FA (TOTP)
- Biometric authentication (iOS/macOS)
- Backup codes

### Phase 5: Polish (Week 5-6)
- Email templates styling
- Error message refinement
- Analytics integration
- Documentation completion
- Load testing and optimization

---

**Design Author**: Engrid (Software Engineering), Axel (API Design), Samantha (Security)

**Date**: 2026-01-21

**Status**: Proposed
