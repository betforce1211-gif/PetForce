# security Specification Delta

## ADDED Requirements

### Requirement: Review Authentication Implementation Security
The system SHALL review authentication implementation for security vulnerabilities specific to auth flows.

#### Scenario: Review password security implementation
- **GIVEN** password-based authentication is implemented
- **WHEN** reviewing password handling
- **THEN** passwords SHALL be hashed with bcrypt (cost ≥12) or Argon2id
- **AND** passwords SHALL NEVER be stored in plaintext
- **AND** password requirements SHALL enforce minimum complexity (8 chars, mixed case, number)
- **AND** passwords SHALL be validated against common password lists (e.g., HaveIBeenPwned)
- **AND** password comparison SHALL use timing-safe comparison
- **AND** failed passwords SHALL NOT leak information (same error for wrong email/password)

#### Scenario: Review token security
- **GIVEN** JWT and refresh tokens are used
- **WHEN** reviewing token implementation
- **THEN** JWT access tokens SHALL have short expiration (≤15 minutes)
- **AND** JWT SHALL be signed with HS256 (symmetric) or RS256 (asymmetric)
- **AND** JWT SHALL include minimal claims (userId, email, iat, exp, authMethod)
- **AND** JWT SHALL NOT include sensitive data (passwords, secrets)
- **AND** refresh tokens SHALL be cryptographically random (≥32 bytes)
- **AND** refresh tokens SHALL be hashed before database storage
- **AND** refresh tokens SHALL rotate on use
- **AND** refresh tokens SHALL be revocable (stored in database)
- **AND** magic link tokens SHALL be single-use and time-limited (≤15 minutes)
- **AND** password reset tokens SHALL be single-use and time-limited (≤1 hour)

#### Scenario: Review OAuth implementation security
- **GIVEN** OAuth 2.0 (Google, Apple) is implemented
- **WHEN** reviewing OAuth security
- **THEN** state parameter SHALL be generated for CSRF protection
- **AND** state SHALL be cryptographically random and session-bound
- **AND** authorization code exchange SHALL happen server-side only
- **AND** ID tokens SHALL be verified (signature, audience, issuer, expiration)
- **AND** PKCE SHALL be used for mobile applications
- **AND** OAuth scopes SHALL be minimal (email, profile only)
- **AND** OAuth tokens from providers SHALL be encrypted at rest if stored

#### Scenario: Review session security
- **GIVEN** session management is implemented
- **WHEN** reviewing session handling
- **THEN** session cookies SHALL have HttpOnly flag
- **AND** session cookies SHALL have Secure flag (HTTPS only)
- **AND** session cookies SHALL have SameSite=Strict or Lax
- **AND** sessions SHALL be invalidated on logout
- **AND** sessions SHALL be invalidated on password change
- **AND** sessions SHALL be invalidated on account lock
- **AND** concurrent sessions from different IPs SHALL be monitored

#### Scenario: Review rate limiting and brute force protection
- **GIVEN** authentication endpoints exist
- **WHEN** reviewing attack protection
- **THEN** login attempts SHALL be rate limited (5 per 15 min per IP)
- **AND** failed login attempts SHALL trigger account lockout (5 attempts = 15 min lock)
- **AND** password reset requests SHALL be rate limited (3 per hour per email)
- **AND** email verification SHALL be rate limited (5 per day per user)
- **AND** rate limits SHALL return 429 status with retry-after header
- **AND** account lockout SHALL send email notification to user
- **AND** unlock mechanism SHALL exist (time-based or email verification)

#### Scenario: Review 2FA implementation
- **GIVEN** TOTP-based 2FA is implemented
- **WHEN** reviewing 2FA security
- **THEN** TOTP secrets SHALL be encrypted at rest
- **AND** TOTP validation SHALL allow ±1 time period (90 second window)
- **AND** backup codes SHALL be hashed with bcrypt before storage
- **AND** backup codes SHALL be single-use only
- **AND** 2FA SHALL be optional, not forced during signup
- **AND** 2FA setup SHALL require password confirmation
- **AND** 2FA disablement SHALL require password + TOTP/backup code
- **AND** 2FA recovery SHALL be secure (backup codes or support verification)

### Requirement: Audit Authentication Security Configuration
The system SHALL audit authentication-related configurations for security issues.

#### Scenario: Review authentication secrets management
- **GIVEN** authentication uses secrets (JWT keys, OAuth secrets, encryption keys)
- **WHEN** auditing secrets
- **THEN** secrets SHALL NOT be hardcoded in code
- **AND** secrets SHALL be stored in environment variables or secret manager (AWS Secrets Manager, Vault)
- **AND** JWT signing keys SHALL be rotated periodically
- **AND** encryption keys SHALL be rotated periodically
- **AND** secret access SHALL be logged
- **AND** secrets SHALL have appropriate access controls (least privilege)

#### Scenario: Review email security configuration
- **GIVEN** transactional emails are sent (verification, reset, magic link)
- **WHEN** auditing email security
- **THEN** SPF records SHALL be configured for domain
- **AND** DKIM SHALL be configured for email authentication
- **AND** DMARC SHALL be configured (p=quarantine or reject)
- **AND** email links SHALL use HTTPS only
- **AND** email tokens SHALL be hashed in database
- **AND** email rate limiting SHALL prevent abuse
- **AND** bounce/spam complaints SHALL be monitored

#### Scenario: Review biometric authentication security
- **GIVEN** biometric authentication (Face ID, Touch ID) is implemented
- **WHEN** reviewing biometric security
- **THEN** biometric enrollment SHALL require existing authenticated session
- **AND** biometric verification SHALL happen on-device only (local auth)
- **AND** biometric public keys SHALL be stored, never private keys
- **AND** biometric authentication SHALL fall back to password if biometric fails
- **AND** device revocation SHALL be available (remove registered devices)
- **AND** biometric SHALL be platform-specific (iOS/macOS Local Authentication framework)

### Requirement: Monitor Authentication Security Events
The system SHALL monitor and alert on authentication security events.

#### Scenario: Detect authentication attacks
- **GIVEN** authentication events are logged
- **WHEN** monitoring for attacks
- **THEN** high failed login rate (>100/min) SHALL trigger alert
- **AND** account lockout spike (>10x baseline) SHALL trigger alert
- **AND** unusual login patterns (geographic anomalies) SHALL be logged
- **AND** brute force patterns (same IP, multiple accounts) SHALL be detected
- **AND** credential stuffing patterns (many emails, same password) SHALL be detected
- **AND** alerts SHALL include IP addresses, timestamps, affected accounts

#### Scenario: Audit authentication logs for compliance
- **GIVEN** authentication activity is logged
- **WHEN** auditing for compliance
- **THEN** successful logins SHALL be logged (userId, method, IP, timestamp)
- **AND** failed logins SHALL be logged (email, IP, reason, timestamp)
- **AND** password changes SHALL be logged
- **AND** password resets SHALL be logged
- **AND** 2FA changes SHALL be logged
- **AND** OAuth connections SHALL be logged
- **AND** session terminations SHALL be logged
- **AND** logs SHALL NOT include passwords or tokens
- **AND** logs SHALL be retained per compliance requirements (90 days minimum)
- **AND** logs SHALL be tamper-proof (write-only, or signed)

### Requirement: Ensure Authentication Privacy Compliance
The system SHALL ensure authentication system complies with privacy regulations (GDPR, CCPA).

#### Scenario: Handle user data privacy in authentication
- **GIVEN** user data is collected for authentication
- **WHEN** ensuring privacy compliance
- **THEN** minimal data SHALL be collected (email, password hash only)
- **AND** email addresses SHALL be protected (encrypted at rest optional)
- **AND** IP addresses SHALL be anonymized after 30 days
- **AND** user agent strings SHALL be anonymized after 30 days
- **AND** OAuth profile data SHALL be minimal (email, name, photo URL only)
- **AND** users SHALL have right to access their auth data
- **AND** users SHALL have right to delete their account and auth data
- **AND** data retention SHALL be documented and enforced

#### Scenario: Implement secure account deletion
- **GIVEN** a user requests account deletion
- **WHEN** processing deletion
- **THEN** all sessions SHALL be invalidated immediately
- **AND** all refresh tokens SHALL be deleted
- **AND** all OAuth connections SHALL be disconnected
- **AND** all biometric devices SHALL be unregistered
- **AND** user account SHALL be soft-deleted (marked deleted, retained 30 days)
- **AND** after 30 days, account SHALL be hard-deleted (permanent removal)
- **AND** deletion SHALL be logged for audit
- **AND** user SHALL receive confirmation email

## MODIFIED Requirements

### Requirement: Verify authentication implementation
The system SHALL verify authentication is implemented securely with industry-standard protocols and proper security controls.

#### Scenario: Verify password-based authentication security
- **GIVEN** password-based authentication is implemented
- **WHEN** reviewing authentication security
- **THEN** passwords SHALL be hashed with bcrypt (cost ≥12) or Argon2id
- **AND** password comparison SHALL use timing-safe functions
- **AND** authentication SHALL use industry-standard protocols (OAuth 2.0, JWT)
- **AND** JWT access tokens SHALL have short expiration (≤15 minutes)

#### Scenario: Verify multi-factor authentication security
- **GIVEN** 2FA is implemented
- **WHEN** reviewing 2FA security
- **THEN** TOTP secrets SHALL be encrypted at rest
- **AND** TOTP validation SHALL use ±1 time period tolerance
- **AND** backup codes SHALL be hashed before storage

### Requirement: Verify authorization checks
The system SHALL ensure authorization is checked on every authenticated request with proper session validation.

#### Scenario: Verify session-based authorization
- **GIVEN** session-based authentication is used
- **WHEN** reviewing authorization
- **THEN** authorization SHALL be checked on EVERY authenticated request
- **AND** JWT tokens SHALL be validated for signature and expiration
- **AND** session invalidation SHALL work properly on logout
- **AND** authorization SHALL follow least privilege principle
