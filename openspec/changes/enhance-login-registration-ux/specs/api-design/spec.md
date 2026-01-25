# Capability: API Design (Modifications)

## ADDED Requirements

### Requirement: Design Authentication API Endpoints

The authentication API MUST provide all necessary endpoints for the enhanced login/registration experience, leveraging Supabase Auth while providing a clean abstraction layer.

#### Scenario: Design magic link endpoint

**Given** Axel is designing the magic link API
**When** they design the endpoint
**Then** the endpoint is `POST /auth/magic-link`
**And** the request body is `{ email: string }`
**And** the endpoint validates email format
**And** the endpoint calls `supabase.auth.signInWithOtp({ email })`
**And** the endpoint returns `{ success: true, message: "Magic link sent to your email" }`
**And** the endpoint returns appropriate error responses:
  - 400 for invalid email format
  - 429 for rate limit exceeded
  - 500 for server errors
**And** the endpoint is rate-limited (max 3 requests per 10 minutes per email)
**And** the endpoint has OpenAPI documentation

#### Scenario: Design email existence check endpoint

**Given** Axel is designing the email check API
**When** they design the endpoint
**Then** the endpoint is `GET /auth/check-email?email={email}`
**And** the endpoint validates email format
**And** the endpoint checks if email exists in the database
**And** the endpoint returns `{ exists: boolean }`
**And** the endpoint does not reveal whether email exists for security (always returns success, but frontend interprets the response)
**Or** (alternative approach) the endpoint only checks and returns exists: true/false (security team decides)
**And** the endpoint is rate-limited to prevent email enumeration attacks
**And** the endpoint has OpenAPI documentation

#### Scenario: Design OAuth callback handler

**Given** Axel is designing the OAuth callback API
**When** they design the endpoint
**Then** the endpoint is `GET /auth/callback` (web) and deep link `petforce://auth/callback` (mobile)
**And** the endpoint receives OAuth response parameters (code, state, error)
**And** the endpoint validates the state parameter (CSRF protection)
**And** the endpoint exchanges authorization code for tokens
**And** the endpoint establishes a session with received tokens
**And** the endpoint redirects to dashboard on success
**And** the endpoint redirects to login with error message on failure
**And** the endpoint has OpenAPI documentation

#### Scenario: Design biometric enrollment endpoint

**Given** Axel is designing the biometric enrollment API
**When** they design the endpoint
**Then** the endpoint is `POST /auth/biometric/enroll`
**And** the request requires authentication (valid access token)
**And** the request body is `{ publicKey: string, deviceId: string }`
**And** the endpoint stores the public key associated with the user and device
**And** the endpoint returns `{ success: true, enrollmentId: string }`
**And** the endpoint returns error responses for invalid input or auth failures
**And** the endpoint has OpenAPI documentation

#### Scenario: Design password reset endpoints

**Given** Axel is designing password reset APIs
**When** they design the endpoints
**Then** the "request reset" endpoint is `POST /auth/password-reset/request`
**And** the request body is `{ email: string }`
**And** the endpoint sends password reset email via `supabase.auth.resetPasswordForEmail()`
**And** the endpoint returns `{ success: true }` even if email doesn't exist (prevent email enumeration)
**And** the endpoint is rate-limited (max 3 requests per hour per email)
**And** the "reset password" endpoint is `POST /auth/password-reset/confirm`
**And** the request body is `{ token: string, newPassword: string }`
**And** the endpoint validates token and password strength
**And** the endpoint updates password via `supabase.auth.updateUser()`
**And** the endpoint returns `{ success: true }` on success
**And** the endpoint returns appropriate error responses (invalid token, weak password)
**And** both endpoints have OpenAPI documentation

### Requirement: Implement API Error Responses

All authentication API endpoints MUST return consistent, well-structured error responses.

#### Scenario: Design consistent error response format

**Given** Axel is designing error responses
**When** they define the error format
**Then** all errors follow this structure:
```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Email or password is incorrect",
    "details": {}  // optional additional context
  }
}
```
**And** error codes are consistent and documented:
  - `invalid_credentials` - Login failed due to wrong email/password
  - `email_not_confirmed` - Email verification required
  - `user_already_exists` - Email is already registered
  - `weak_password` - Password doesn't meet strength requirements
  - `invalid_token` - Token is expired or invalid
  - `rate_limit_exceeded` - Too many requests
  - `invalid_input` - Request validation failed
  - `unauthorized` - Authentication required
  - `internal_error` - Server error
**And** HTTP status codes align with error types:
  - 400 for invalid input
  - 401 for authentication failures
  - 403 for authorization failures
  - 409 for conflicts (email already exists)
  - 429 for rate limiting
  - 500 for server errors

#### Scenario: Handle validation errors

**Given** an API endpoint receives invalid input
**When** validation fails
**Then** the endpoint returns a 400 status code
**And** the error response includes field-level errors:
```json
{
  "error": {
    "code": "invalid_input",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "password": "Password must be at least 8 characters"
      }
    }
  }
}
```
**And** the frontend can map field errors to appropriate form inputs

### Requirement: Implement API Rate Limiting

Authentication endpoints MUST be protected against abuse with appropriate rate limiting.

#### Scenario: Implement rate limiting for sensitive endpoints

**Given** Axel is designing rate limiting
**When** they configure rate limits
**Then** login endpoint is limited to 5 attempts per 15 minutes per IP
**And** registration endpoint is limited to 3 attempts per hour per IP
**And** magic link endpoint is limited to 3 attempts per 10 minutes per email
**And** password reset endpoint is limited to 3 attempts per hour per email
**And** email check endpoint is limited to 10 attempts per minute per IP
**And** rate limit exceeded returns 429 status with `Retry-After` header
**And** rate limit info is included in response headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Timestamp when limit resets
**And** rate limiting is implemented at the API gateway or middleware level

#### Scenario: Handle rate limit exceeded

**Given** a user exceeds the rate limit
**When** they make another request
**Then** the endpoint returns 429 status
**And** the error response is:
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many attempts. Please try again in 10 minutes.",
    "details": {
      "retryAfter": 600  // seconds
    }
  }
}
```
**And** the `Retry-After` header is set: `Retry-After: 600`
**And** the frontend displays a friendly message with countdown timer

### Requirement: Design API Security

All authentication API endpoints MUST follow security best practices.

#### Scenario: Implement CSRF protection for OAuth

**Given** Axel is designing OAuth security
**When** they design the OAuth flow
**Then** the OAuth initiation generates a random `state` parameter
**And** the `state` parameter is stored in session or signed token
**And** the OAuth callback validates the `state` parameter matches
**And** requests with mismatched or missing `state` are rejected with 403
**And** the `state` parameter is single-use (invalidated after verification)

#### Scenario: Secure token transmission

**Given** Axel is designing token handling
**When** they design token responses
**Then** access tokens are short-lived (15 minutes)
**And** refresh tokens are long-lived (30 days) but rotated on use
**And** tokens are transmitted only over HTTPS in production
**And** on web, refresh tokens are set as httpOnly cookies (not accessible to JavaScript)
**And** on mobile, tokens are stored in secure storage (not in response body if possible)
**And** tokens are never logged or exposed in error messages

#### Scenario: Implement input sanitization

**Given** Axel is designing endpoint validation
**When** they validate user input
**Then** all inputs are validated against strict schemas (Zod)
**And** email addresses are normalized (lowercased, trimmed)
**And** inputs are sanitized to prevent injection attacks
**And** maximum input lengths are enforced (email max 255 chars, password max 128 chars)
**And** special characters in inputs are handled safely
**And** validation errors provide helpful messages without exposing system internals

## Quality Checklist

When implementing or modifying this capability, ensure:

- [ ] All authentication endpoints are documented with OpenAPI/Swagger
- [ ] All endpoints follow consistent error response format
- [ ] All endpoints have appropriate rate limiting
- [ ] All endpoints validate input with strict schemas
- [ ] All endpoints are only accessible over HTTPS in production
- [ ] OAuth endpoints implement CSRF protection with state parameter
- [ ] Tokens are transmitted securely (httpOnly cookies on web, secure storage on mobile)
- [ ] Sensitive endpoints (login, password reset) have stricter rate limits
- [ ] Error messages are user-friendly and don't expose system internals
- [ ] All endpoints have integration tests
- [ ] All endpoints have security tests (invalid input, missing auth, etc.)
- [ ] API documentation is up-to-date and accurate
- [ ] Rate limit headers are included in responses
- [ ] CORS is properly configured for web clients
- [ ] API versioning is considered for future changes

## Notes

These modifications extend the API Design capability to include comprehensive authentication API requirements. The design leverages Supabase Auth for the heavy lifting but provides a clean abstraction layer for:
1. Consistent error handling
2. Rate limiting
3. Security best practices
4. Platform-specific optimizations (web vs mobile)

The API design should be reviewed by Samantha (Security) before implementation.
