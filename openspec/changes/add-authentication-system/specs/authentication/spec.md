# authentication Specification

## Purpose
Provide secure, simple, and reliable authentication for PetForce users with multiple authentication methods including email/password, magic links, SSO (Google/Apple), and biometric authentication.

## ADDED Requirements

### Requirement: Support Multiple Authentication Methods
The system SHALL provide multiple authentication methods to accommodate different user preferences while maintaining security.

#### Scenario: Register with email and password
- **GIVEN** a new user wants to create an account
- **WHEN** registering with email/password
- **THEN** the system SHALL validate email format
- **AND** the system SHALL check email is not already registered (real-time feedback)
- **AND** the system SHALL require password minimum 8 characters with 1 uppercase, 1 lowercase, 1 number
- **AND** the system SHALL hash password with bcrypt (cost factor 12) or Argon2id
- **AND** the system SHALL send email verification link
- **AND** the system SHALL require email verification before account activation
- **AND** the system SHALL send welcome email after verification

#### Scenario: Login with email and password
- **GIVEN** a registered user with verified email
- **WHEN** logging in with email/password
- **THEN** the system SHALL validate credentials against hashed password
- **AND** the system SHALL generate JWT access token (15 minute expiration)
- **AND** the system SHALL generate refresh token (7 day expiration)
- **AND** the system SHALL create session record
- **AND** the system SHALL return tokens to client
- **AND** failed login SHALL increment failed attempt counter
- **AND** 5 failed attempts SHALL lock account for 15 minutes

#### Scenario: Authenticate with magic link
- **GIVEN** a user wants passwordless authentication
- **WHEN** requesting magic link
- **THEN** the system SHALL generate secure random token (32 bytes)
- **AND** the system SHALL store hashed token with 15 minute expiration
- **AND** the system SHALL send email with magic link
- **AND** the system SHALL limit to 3 magic link requests per 15 minutes per email
- **WHEN** user clicks magic link
- **THEN** the system SHALL verify token is valid and not expired
- **AND** the system SHALL mark token as used (single use)
- **AND** the system SHALL create or update user account
- **AND** the system SHALL create session and return tokens

#### Scenario: Authenticate with Google SSO
- **GIVEN** a user wants to sign in with Google
- **WHEN** initiating Google OAuth flow
- **THEN** the system SHALL generate state parameter for CSRF protection
- **AND** the system SHALL redirect to Google OAuth with appropriate scopes (email, profile)
- **WHEN** Google redirects back with authorization code
- **THEN** the system SHALL validate state parameter matches
- **AND** the system SHALL exchange code for access token and ID token
- **AND** the system SHALL verify ID token signature
- **AND** the system SHALL extract user info (email, name, picture)
- **AND** the system SHALL find or create user with Google email
- **AND** the system SHALL save OAuth connection
- **AND** the system SHALL create session and return tokens

#### Scenario: Authenticate with Apple SSO
- **GIVEN** a user wants to sign in with Apple
- **WHEN** initiating Apple OAuth flow
- **THEN** the system SHALL generate state parameter for CSRF protection
- **AND** the system SHALL redirect to Apple OAuth with appropriate scopes (email, name)
- **AND** the system SHALL support "Hide My Email" feature
- **WHEN** Apple redirects back with authorization code
- **THEN** the system SHALL validate state parameter matches
- **AND** the system SHALL exchange code for ID token
- **AND** the system SHALL verify ID token signature with Apple public key
- **AND** the system SHALL extract user info
- **AND** the system SHALL find or create user with Apple email/ID
- **AND** the system SHALL save OAuth connection
- **AND** the system SHALL create session and return tokens

#### Scenario: Authenticate with biometrics
- **GIVEN** a user wants to use Face ID or Touch ID
- **WHEN** enrolling biometric authentication (first time)
- **THEN** the system SHALL require existing authenticated session
- **AND** the system SHALL register device with device ID and public key
- **AND** the system SHALL store biometric device info
- **WHEN** authenticating with biometrics
- **THEN** the client SHALL prompt for biometric verification (Face ID/Touch ID)
- **AND** the client SHALL sign challenge with device private key
- **AND** the system SHALL verify signature with stored public key
- **AND** the system SHALL verify device is registered for user
- **AND** the system SHALL create session and return tokens
- **AND** failed biometric attempts SHALL fall back to primary auth method

### Requirement: Implement Secure Email Verification
The system SHALL require email verification for all accounts to prevent fake accounts and ensure contact reachability.

#### Scenario: Send email verification
- **GIVEN** a newly registered user
- **WHEN** account is created
- **THEN** the system SHALL generate secure random verification token (32 bytes)
- **AND** the system SHALL store hashed token with 24 hour expiration
- **AND** the system SHALL send verification email with link
- **AND** email SHALL have clear call-to-action button
- **AND** email SHALL include expiration time
- **AND** the system SHALL limit to 5 verification emails per day per user

#### Scenario: Verify email address
- **GIVEN** a user receives verification email
- **WHEN** clicking verification link
- **THEN** the system SHALL verify token exists and is not expired
- **AND** the system SHALL mark token as used (single use)
- **AND** the system SHALL mark user email as verified
- **AND** the system SHALL create authenticated session
- **AND** the system SHALL redirect to onboarding or dashboard
- **AND** invalid/expired tokens SHALL show clear error with option to resend

#### Scenario: Resend verification email
- **GIVEN** a user did not receive or lost verification email
- **WHEN** requesting new verification email
- **THEN** the system SHALL invalidate previous verification token
- **AND** the system SHALL generate new token
- **AND** the system SHALL send new verification email
- **AND** the system SHALL enforce rate limit (5 per day)

### Requirement: Provide Secure Password Management
The system SHALL implement secure password reset and change functionality.

#### Scenario: Request password reset
- **GIVEN** a user forgot their password
- **WHEN** requesting password reset
- **THEN** the system SHALL verify email exists (but not leak if it doesn't)
- **AND** the system SHALL generate secure random reset token (32 bytes)
- **AND** the system SHALL store hashed token with 1 hour expiration
- **AND** the system SHALL send password reset email
- **AND** the system SHALL limit to 3 reset requests per hour per email
- **AND** reset email SHALL include expiration time and security warning

#### Scenario: Reset password with token
- **GIVEN** a user receives reset email
- **WHEN** clicking reset link and submitting new password
- **THEN** the system SHALL verify token is valid and not expired
- **AND** the system SHALL validate new password meets requirements
- **AND** the system SHALL hash new password
- **AND** the system SHALL update user password
- **AND** the system SHALL mark reset token as used (single use)
- **AND** the system SHALL invalidate all existing sessions for security
- **AND** the system SHALL send password changed confirmation email
- **AND** the system SHALL create new session and return tokens

#### Scenario: Change password while authenticated
- **GIVEN** an authenticated user wants to change password
- **WHEN** submitting current and new password
- **THEN** the system SHALL verify current password is correct
- **AND** the system SHALL validate new password meets requirements
- **AND** the system SHALL verify new password differs from current
- **AND** the system SHALL hash new password
- **AND** the system SHALL update user password
- **AND** the system SHALL invalidate all other sessions (keep current session)
- **AND** the system SHALL send password changed confirmation email

### Requirement: Implement Session Management
The system SHALL manage user sessions securely with JWT tokens and refresh token rotation.

#### Scenario: Create authenticated session
- **GIVEN** user successfully authenticates
- **WHEN** creating session
- **THEN** the system SHALL generate JWT access token with 15 minute expiration
- **AND** access token SHALL include: userId, email, authMethod, iat, exp
- **AND** access token SHALL be signed with HS256 or RS256
- **AND** the system SHALL generate cryptographically random refresh token (32 bytes)
- **AND** refresh token SHALL have 7 day expiration
- **AND** refresh token SHALL be hashed before storage in database
- **AND** the system SHALL store session with user agent, IP, device info
- **AND** the system SHALL return both tokens to client

#### Scenario: Refresh access token
- **GIVEN** an expired or soon-to-expire access token
- **WHEN** client presents valid refresh token
- **THEN** the system SHALL verify refresh token exists in database
- **AND** the system SHALL verify refresh token is not expired
- **AND** the system SHALL generate new access token
- **AND** the system SHALL rotate refresh token (generate new one)
- **AND** the system SHALL invalidate old refresh token
- **AND** the system SHALL return new access and refresh tokens

#### Scenario: Logout and invalidate session
- **GIVEN** an authenticated user
- **WHEN** user logs out
- **THEN** the system SHALL delete session from database
- **AND** the system SHALL invalidate refresh token
- **AND** access token SHALL naturally expire (no server-side revocation needed)
- **AND** the system SHALL confirm logout to client

#### Scenario: Detect and prevent session hijacking
- **GIVEN** a session is active
- **WHEN** detecting suspicious activity
- **THEN** the system SHALL log IP address changes
- **AND** sudden location changes SHALL be flagged (optional)
- **AND** concurrent sessions from different IPs SHALL be allowed but logged
- **AND** the system SHALL provide session management UI (view active sessions)
- **AND** user SHALL be able to terminate sessions remotely

### Requirement: Implement Account Protection Features
The system SHALL protect accounts from brute force attacks and unauthorized access.

#### Scenario: Prevent brute force login attacks
- **GIVEN** multiple failed login attempts
- **WHEN** tracking failed attempts
- **THEN** the system SHALL increment failed counter per email/IP
- **AND** 5 failed attempts within 15 minutes SHALL lock account
- **AND** account lock SHALL last 15 minutes
- **AND** the system SHALL send account locked email to user
- **AND** email SHALL include unlock link (email verification)
- **AND** successful login SHALL reset failed attempt counter

#### Scenario: Implement rate limiting
- **GIVEN** API endpoints for authentication
- **WHEN** receiving requests
- **THEN** login endpoint SHALL limit to 5 attempts per 15 minutes per IP
- **AND** registration SHALL limit to 3 attempts per hour per IP
- **AND** magic link SHALL limit to 3 requests per 15 minutes per email
- **AND** password reset SHALL limit to 3 requests per hour per email
- **AND** email verification resend SHALL limit to 5 per day per user
- **AND** rate limit exceeded SHALL return 429 status with retry-after header

#### Scenario: Prevent email enumeration
- **GIVEN** authentication endpoints that accept email
- **WHEN** user provides email that doesn't exist
- **THEN** the system SHALL return same response as if email existed (timing-safe)
- **AND** password reset for non-existent email SHALL appear to succeed
- **AND** magic link for new email SHALL create account (if allowed)
- **AND** error messages SHALL not reveal if email is registered

### Requirement: Support Optional Two-Factor Authentication
The system SHALL provide optional TOTP-based 2FA for security-conscious users without forcing it during signup.

#### Scenario: Enable 2FA in settings
- **GIVEN** an authenticated user in account settings
- **WHEN** enabling 2FA
- **THEN** the system SHALL generate TOTP secret
- **AND** the system SHALL display QR code for authenticator app
- **AND** the system SHALL display manual entry code
- **AND** user SHALL enter verification code to confirm setup
- **AND** the system SHALL verify TOTP code is correct
- **AND** the system SHALL generate 10 single-use backup codes
- **AND** the system SHALL display backup codes for user to save
- **AND** the system SHALL encrypt and store TOTP secret
- **AND** the system SHALL hash and store backup codes

#### Scenario: Login with 2FA enabled
- **GIVEN** a user with 2FA enabled
- **WHEN** logging in with primary auth method
- **THEN** the system SHALL require TOTP code after credentials verified
- **AND** the system SHALL validate TOTP code (30 second window, allow ±1 period)
- **AND** invalid code SHALL count toward failed attempts
- **AND** the system SHALL allow backup code as alternative
- **AND** used backup codes SHALL be marked as consumed
- **AND** successful 2FA SHALL create session normally

#### Scenario: Disable 2FA
- **GIVEN** an authenticated user with 2FA enabled
- **WHEN** disabling 2FA
- **THEN** the system SHALL require current password confirmation
- **AND** the system SHALL require valid TOTP code or backup code
- **AND** the system SHALL delete TOTP secret
- **AND** the system SHALL delete backup codes
- **AND** the system SHALL send confirmation email
- **AND** the system SHALL log 2FA disablement for audit

#### Scenario: Regenerate backup codes
- **GIVEN** a user with 2FA enabled running low on backup codes
- **WHEN** regenerating backup codes
- **THEN** the system SHALL require password confirmation
- **AND** the system SHALL invalidate all old backup codes
- **AND** the system SHALL generate 10 new backup codes
- **AND** the system SHALL display codes for user to save
- **AND** the system SHALL hash and store new codes

### Requirement: Provide User Account Information
The system SHALL allow authenticated users to view and manage their account information.

#### Scenario: Retrieve current user profile
- **GIVEN** an authenticated user
- **WHEN** requesting account information
- **THEN** the system SHALL verify access token is valid
- **AND** the system SHALL return user profile (id, email, name, photo)
- **AND** the system SHALL return auth methods enabled
- **AND** the system SHALL return 2FA status
- **AND** the system SHALL return email verification status
- **AND** the system SHALL NOT return sensitive data (password hash, tokens, secrets)

#### Scenario: View active sessions
- **GIVEN** an authenticated user
- **WHEN** viewing active sessions
- **THEN** the system SHALL list all active sessions for user
- **AND** each session SHALL show: device type, browser, OS, location (city), IP (masked), last activity time
- **AND** current session SHALL be marked as "This device"
- **AND** the system SHALL allow user to terminate any session
- **AND** terminating session SHALL delete it from database

#### Scenario: Manage authentication methods
- **GIVEN** an authenticated user
- **WHEN** viewing authentication settings
- **THEN** the system SHALL list enabled auth methods
- **AND** the system SHALL show OAuth connections (Google, Apple)
- **AND** the system SHALL show biometric devices enrolled
- **AND** user SHALL be able to disconnect OAuth providers
- **AND** user SHALL be able to remove biometric devices
- **AND** the system SHALL require at least one auth method remains

### Requirement: Send Transactional Emails
The system SHALL send timely, professional emails for authentication events.

#### Scenario: Send welcome email after verification
- **GIVEN** a user completes email verification
- **WHEN** email is verified
- **THEN** the system SHALL send welcome email
- **AND** email SHALL have warm, family-friendly tone
- **AND** email SHALL include next steps (complete profile, add pet)
- **AND** email SHALL include quick tips for getting started
- **AND** email SHALL include link to help center
- **AND** email SHALL include unsubscribe option for marketing (not transactional)

#### Scenario: Send security notification emails
- **GIVEN** security-sensitive events occur
- **WHEN** events happen
- **THEN** password changed SHALL send confirmation email
- **AND** password reset request SHALL send reset link email
- **AND** account locked SHALL send notification email
- **AND** 2FA enabled/disabled SHALL send confirmation email
- **AND** new OAuth connection SHALL send notification email
- **AND** emails SHALL include event details (time, location if available)
- **AND** emails SHALL include "wasn't you?" security notice with support link

#### Scenario: Handle email delivery failures
- **GIVEN** transactional email fails to send
- **WHEN** email service returns error
- **THEN** the system SHALL retry up to 3 times with exponential backoff
- **AND** permanent failures (invalid email) SHALL be logged
- **AND** temporary failures (service down) SHALL be retried
- **AND** critical emails (verification, password reset) SHALL be prioritized
- **AND** failed deliveries SHALL be monitored and alerted
- **AND** bounce rate > 5% SHALL trigger investigation

### Requirement: Log Authentication Events
The system SHALL log authentication events for security auditing and monitoring.

#### Scenario: Log security-relevant events
- **GIVEN** authentication events occur
- **WHEN** logging events
- **THEN** the system SHALL log successful logins (userId, method, IP, timestamp)
- **AND** the system SHALL log failed login attempts (email, IP, reason, timestamp)
- **AND** the system SHALL log account lockouts (userId, IP, timestamp)
- **AND** the system SHALL log password changes (userId, timestamp)
- **AND** the system SHALL log password resets (userId, timestamp)
- **AND** the system SHALL log 2FA enabled/disabled (userId, timestamp)
- **AND** the system SHALL log OAuth connections added/removed (userId, provider, timestamp)
- **AND** the system SHALL log session terminations (userId, sessionId, reason, timestamp)
- **AND** logs SHALL NOT include passwords or tokens
- **AND** logs SHALL include correlation IDs for request tracing

#### Scenario: Monitor authentication metrics
- **GIVEN** authentication events are logged
- **WHEN** analyzing metrics
- **THEN** the system SHALL track registration completion rate
- **AND** the system SHALL track login success rate by auth method
- **AND** the system SHALL track email delivery success rate
- **AND** the system SHALL track OAuth success rate by provider
- **AND** the system SHALL track magic link usage rate
- **AND** the system SHALL track 2FA enrollment rate
- **AND** the system SHALL track average session duration
- **AND** the system SHALL track account lockout frequency
- **AND** metrics SHALL be aggregated hourly and daily
- **AND** anomalies SHALL trigger alerts

#### Scenario: Detect suspicious authentication patterns
- **GIVEN** authentication events are monitored
- **WHEN** detecting patterns
- **THEN** high failed login rate (>100/min globally) SHALL alert security team
- **AND** account lockout spike (>10x baseline) SHALL alert
- **AND** OAuth provider errors (>10%) SHALL alert
- **AND** email delivery failure (>5%) SHALL alert
- **AND** unusual login locations SHALL be logged (optional: notify user)
- **AND** concurrent sessions from different countries SHALL be flagged
- **AND** alerts SHALL include actionable information and links to logs
