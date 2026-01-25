# api-design Specification Delta

## ADDED Requirements

### Requirement: Design Authentication API Endpoints
The system SHALL design RESTful API endpoints for all authentication methods.

#### Scenario: Design registration endpoints
- **GIVEN** user registration is needed
- **WHEN** designing registration API
- **THEN** POST /auth/register SHALL accept {email, password}
- **AND** request SHALL validate email format and password complexity
- **AND** response SHALL return 201 Created on success
- **AND** response SHALL return {message: "Check email to verify"}
- **AND** response SHALL return 400 Bad Request for validation errors
- **AND** response SHALL return 409 Conflict if email already exists
- **AND** endpoint SHALL be rate limited (3 per hour per IP)

#### Scenario: Design login endpoints
- **GIVEN** user login is needed
- **WHEN** designing login API
- **THEN** POST /auth/login SHALL accept {email, password}
- **AND** response SHALL return 200 OK with {accessToken, refreshToken} on success
- **AND** response SHALL return 401 Unauthorized for invalid credentials
- **AND** response SHALL return 403 Forbidden for unverified email
- **AND** response SHALL return 423 Locked for locked account
- **AND** response SHALL return same timing for wrong email vs wrong password
- **AND** endpoint SHALL be rate limited (5 per 15 min per IP)

#### Scenario: Design email verification endpoints
- **GIVEN** email verification is required
- **WHEN** designing verification API
- **THEN** POST /auth/verify/send SHALL resend verification email
- **AND** GET /auth/verify/:token SHALL verify email with token
- **AND** response SHALL return 200 OK with tokens on successful verification
- **AND** response SHALL return 400 Bad Request for invalid/expired token
- **AND** response SHALL return 410 Gone for already-used token
- **AND** resend endpoint SHALL be rate limited (5 per day per user)

#### Scenario: Design password management endpoints
- **GIVEN** password reset and change are needed
- **WHEN** designing password API
- **THEN** POST /auth/password/forgot SHALL accept {email}
- **AND** POST /auth/password/reset SHALL accept {token, newPassword}
- **AND** POST /auth/password/change SHALL accept {currentPassword, newPassword}
- **AND** forgot endpoint SHALL return 200 OK even for non-existent emails (no enumeration)
- **AND** reset endpoint SHALL return 200 OK with tokens on success
- **AND** change endpoint SHALL require authentication
- **AND** all endpoints SHALL enforce password complexity requirements
- **AND** forgot SHALL be rate limited (3 per hour per email)

#### Scenario: Design magic link endpoints
- **GIVEN** passwordless authentication is supported
- **WHEN** designing magic link API
- **THEN** POST /auth/magic-link/send SHALL accept {email}
- **AND** GET /auth/magic-link/verify/:token SHALL authenticate with token
- **AND** send endpoint SHALL return 200 OK with {message: "Check email"}
- **AND** verify endpoint SHALL return 200 OK with {accessToken, refreshToken}
- **AND** verify endpoint SHALL create user if doesn't exist (optional behavior)
- **AND** tokens SHALL expire in 15 minutes
- **AND** tokens SHALL be single-use
- **AND** send SHALL be rate limited (3 per 15 min per email)

#### Scenario: Design OAuth endpoints
- **GIVEN** Google and Apple SSO are supported
- **WHEN** designing OAuth API
- **THEN** GET /auth/google SHALL redirect to Google OAuth
- **AND** GET /auth/google/callback SHALL handle OAuth callback
- **AND** GET /auth/apple SHALL redirect to Apple OAuth
- **AND** GET /auth/apple/callback SHALL handle Apple callback
- **AND** callback endpoints SHALL validate state parameter (CSRF protection)
- **AND** callback endpoints SHALL return 302 redirect to frontend with tokens in URL or cookie
- **AND** error responses SHALL redirect with error query param
- **AND** callback SHALL return 400 Bad Request for missing/invalid state

#### Scenario: Design biometric endpoints
- **GIVEN** biometric authentication is supported
- **WHEN** designing biometric API
- **THEN** POST /auth/biometric/enroll SHALL accept {deviceId, deviceName, biometricType, publicKey}
- **AND** POST /auth/biometric/authenticate SHALL accept {deviceId, challenge, signature}
- **AND** GET /auth/biometric/devices SHALL list enrolled devices
- **AND** DELETE /auth/biometric/devices/:deviceId SHALL remove device
- **AND** enroll SHALL require existing authenticated session
- **AND** authenticate SHALL return {accessToken, refreshToken}
- **AND** enroll SHALL validate publicKey format

#### Scenario: Design session management endpoints
- **GIVEN** session management is needed
- **WHEN** designing session API
- **THEN** POST /auth/refresh SHALL accept {refreshToken}
- **AND** POST /auth/logout SHALL accept {refreshToken}
- **AND** GET /auth/me SHALL return current user info (requires auth)
- **AND** GET /auth/sessions SHALL list active sessions (requires auth)
- **AND** DELETE /auth/sessions/:sessionId SHALL terminate session (requires auth)
- **AND** refresh SHALL return new {accessToken, refreshToken}
- **AND** logout SHALL return 204 No Content
- **AND** me SHALL return 200 OK with user object

#### Scenario: Design 2FA endpoints
- **GIVEN** optional 2FA is supported
- **WHEN** designing 2FA API
- **THEN** POST /auth/2fa/enable SHALL generate and return TOTP secret + QR code
- **AND** POST /auth/2fa/verify SHALL accept {code} to confirm 2FA setup
- **AND** POST /auth/2fa/disable SHALL accept {password, code} to disable 2FA
- **AND** POST /auth/2fa/backup-codes/regenerate SHALL create new backup codes
- **AND** enable/disable SHALL require authenticated session
- **AND** verify SHALL return backup codes on successful setup
- **AND** all 2FA changes SHALL require password confirmation

### Requirement: Define Authentication API Request/Response Schemas
The system SHALL define clear JSON schemas for all authentication API requests and responses.

#### Scenario: Define registration request schema
- **GIVEN** registration endpoint exists
- **WHEN** defining request schema
- **THEN** schema SHALL require email (string, email format)
- **AND** schema SHALL require password (string, min 8 chars)
- **AND** schema MAY include optional firstName, lastName
- **AND** validation errors SHALL return 400 with detailed field errors

#### Scenario: Define login response schema
- **GIVEN** successful login
- **WHEN** defining response schema
- **THEN** schema SHALL include accessToken (string, JWT)
- **AND** schema SHALL include refreshToken (string)
- **AND** schema SHALL include tokenType ("Bearer")
- **AND** schema SHALL include expiresIn (number, seconds)
- **AND** schema MAY include user object (id, email, name)

#### Scenario: Define error response schema
- **GIVEN** API errors occur
- **WHEN** defining error schema
- **THEN** schema SHALL include error (string, error code)
- **AND** schema SHALL include message (string, human-readable)
- **AND** schema MAY include details (object, field-specific errors)
- **AND** schema MAY include retryAfter (number, for rate limiting)

### Requirement: Document Authentication API Security Requirements
The system SHALL document authentication and authorization requirements for authentication APIs.

#### Scenario: Specify authentication requirements per endpoint
- **GIVEN** authentication endpoints
- **WHEN** documenting security
- **THEN** public endpoints SHALL be documented (register, login, forgot password, OAuth)
- **AND** authenticated endpoints SHALL require Bearer token (logout, me, password change)
- **AND** API documentation SHALL specify required auth for each endpoint
- **AND** 401 Unauthorized SHALL be returned for missing/invalid tokens
- **AND** token format SHALL be documented (JWT in Authorization header)

#### Scenario: Document rate limiting
- **GIVEN** rate limiting is implemented
- **WHEN** documenting limits
- **THEN** rate limits SHALL be documented per endpoint
- **AND** rate limit response (429) SHALL be documented
- **AND** retry-after header SHALL be documented
- **AND** rate limit basis SHALL be documented (per IP, per user, per email)

### Requirement: Design Authentication API for Platform Compatibility
The system SHALL ensure authentication API works across web, mobile, and desktop platforms.

#### Scenario: Design for mobile app authentication
- **GIVEN** mobile apps (iOS, Android) use the API
- **WHEN** designing for mobile
- **THEN** API SHALL support PKCE for OAuth flows
- **AND** API SHALL support biometric authentication endpoints
- **AND** API SHALL allow deep links for email verification/password reset
- **AND** token refresh SHALL work seamlessly in background
- **AND** API SHALL support device identification for biometric enrollment

#### Scenario: Design for web app authentication
- **GIVEN** web apps use the API
- **WHEN** designing for web
- **THEN** API SHALL support traditional OAuth 2.0 flow
- **AND** API SHALL work with httpOnly cookies OR token-based auth
- **AND** API SHALL handle CORS appropriately
- **AND** magic link SHALL redirect to web app after verification

#### Scenario: Handle authentication errors consistently
- **GIVEN** errors occur during authentication
- **WHEN** defining error handling
- **THEN** 400 Bad Request SHALL be for validation errors
- **AND** 401 Unauthorized SHALL be for authentication failures
- **AND** 403 Forbidden SHALL be for unverified email or insufficient permissions
- **AND** 409 Conflict SHALL be for duplicate email
- **AND** 423 Locked SHALL be for locked accounts
- **AND** 429 Too Many Requests SHALL be for rate limiting
- **AND** error messages SHALL be clear and actionable
- **AND** error messages SHALL NOT leak sensitive information

## MODIFIED Requirements

### Requirement: Implement authentication
The API SHALL support industry-standard authentication protocols including OAuth 2.0, JWT, and multiple authentication methods.

#### Scenario: Support multiple authentication methods via API
- **GIVEN** users need various authentication options
- **WHEN** implementing authentication API
- **THEN** the API SHALL support email/password authentication
- **AND** the API SHALL support passwordless magic link authentication
- **AND** the API SHALL support Google OAuth 2.0
- **AND** the API SHALL support Apple OAuth 2.0
- **AND** the API SHALL support biometric authentication enrollment and verification
- **AND** the API SHALL support optional TOTP-based 2FA
- **AND** authentication SHALL use JWT for session management
- **AND** authentication errors SHALL return 401 Unauthorized
