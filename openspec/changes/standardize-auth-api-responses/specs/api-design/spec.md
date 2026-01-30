# Capability: API Design (Modifications)

## MODIFIED Requirements

### Requirement: Design RESTful APIs

The system SHALL design REST APIs following standard conventions and best practices with consistent response shapes across all endpoints.

#### Scenario: Design resource endpoints
- **GIVEN** a new resource requiring API access
- **WHEN** designing the API
- **THEN** endpoints SHALL use nouns for resources (not verbs)
- **AND** endpoints SHALL use appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE)
- **AND** endpoints SHALL return proper HTTP status codes
- **AND** collection endpoints SHALL implement pagination
- **AND** the API SHALL be versioned from day one (v1, v2)

#### Scenario: Design consistent error responses
- **GIVEN** any API endpoint that can fail
- **WHEN** defining error handling
- **THEN** all errors SHALL return a consistent error format
- **AND** error responses SHALL include error code, message, and details
- **AND** error responses SHALL use appropriate HTTP status codes (400, 401, 403, 404, 409, 500)
- **AND** error messages SHALL be clear and actionable

#### Scenario: Design standard response shape
- **GIVEN** any API endpoint returning data
- **WHEN** designing the response structure
- **THEN** all responses SHALL follow the `ApiResponse<T>` pattern:
  ```typescript
  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
    meta?: {
      requestId?: string;
      rateLimit?: RateLimitInfo;
    };
  }
  ```
- **AND** success responses SHALL include `data` field with typed payload
- **AND** error responses SHALL include `error` field with structured error
- **AND** optional `message` field MAY provide user-friendly context
- **AND** optional `meta` field MAY include request tracking and rate limit info
- **AND** this pattern SHALL be used consistently across all API functions

## ADDED Requirements

### Requirement: Return Rate Limit Information in API Responses

The system SHALL include rate limit information in responses from all rate-limited endpoints to enable better client-side UX.

#### Scenario: Include rate limit headers
- **GIVEN** any rate-limited API endpoint
- **WHEN** processing a request
- **THEN** the response SHALL include rate limit HTTP headers:
  - `X-RateLimit-Limit`: Maximum requests allowed in window
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when window resets
- **AND** on 429 responses, SHALL include `Retry-After` header (seconds)
- **AND** headers SHALL be returned on all responses (success and error)

#### Scenario: Include rate limit in response meta
- **GIVEN** any rate-limited API endpoint
- **WHEN** returning an `ApiResponse`
- **THEN** the `meta.rateLimit` field SHALL be populated:
  ```typescript
  interface RateLimitInfo {
    limit: number;           // Max requests per window
    remaining: number;       // Requests remaining
    reset: number;          // Unix timestamp (seconds)
    retryAfter?: number;    // Seconds until retry (only on 429)
  }
  ```
- **AND** this information SHALL match the HTTP headers
- **AND** clients MAY use this to display countdown timers
- **AND** clients MAY proactively disable submit buttons when limit reached

#### Scenario: Propagate rate limits from Edge Functions
- **GIVEN** a Supabase Edge Function implementing rate limiting
- **WHEN** the function returns rate limit headers
- **THEN** the client SDK SHALL parse these headers
- **AND** the client SDK SHALL populate `meta.rateLimit` in the response
- **AND** the information SHALL be accessible to UI components
- **AND** rate limit state SHALL be consistent between server and client

### Requirement: Standardize Authentication API Response Shapes

All authentication API endpoints SHALL use the consistent `ApiResponse<T>` pattern for predictable client integration.

#### Scenario: Standardize register response
- **GIVEN** the `register()` function
- **WHEN** refactoring for consistency
- **THEN** the return type SHALL be `Promise<ApiResponse<{ confirmationRequired: boolean }>>`
- **AND** success cases SHALL set `success: true` with `data.confirmationRequired`
- **AND** the `message` field SHALL provide user-friendly confirmation status
- **AND** error cases SHALL set `success: false` with structured `error` object
- **AND** the response SHALL be backwards compatible if possible

#### Scenario: Standardize login response
- **GIVEN** the `login()` function
- **WHEN** refactoring for consistency
- **THEN** the return type SHALL be `Promise<ApiResponse<{ tokens: AuthTokens; user: User }>>`
- **AND** success cases SHALL include both tokens and user data in `data` field
- **AND** error cases SHALL use consistent error codes (EMAIL_NOT_CONFIRMED, etc.)
- **AND** the response SHALL follow the standard `ApiResponse<T>` pattern

#### Scenario: Standardize logout response
- **GIVEN** the `logout()` function
- **WHEN** refactoring for consistency
- **THEN** the return type SHALL be `Promise<ApiResponse<void>>`
- **AND** success cases SHALL set `success: true` with no data
- **AND** optional `message` MAY confirm logout success
- **AND** error cases SHALL include structured error

#### Scenario: Standardize resendConfirmationEmail response
- **GIVEN** the `resendConfirmationEmail()` function
- **WHEN** refactoring for consistency
- **THEN** the return type SHALL be `Promise<ApiResponse<void>>`
- **AND** the response SHALL include `meta.rateLimit` information
- **AND** on success, `message` SHALL confirm email sent
- **AND** on 429 errors, `meta.rateLimit.retryAfter` SHALL indicate wait time
- **AND** clients SHALL be able to show accurate countdown timers

## Quality Checklist

When implementing this change, ensure:

- [ ] `ApiResponse<T>` generic type is defined and documented
- [ ] `RateLimitInfo` interface matches HTTP header semantics
- [ ] All auth API functions return `ApiResponse<T>` shaped responses
- [ ] Rate limit headers are consistently returned from all rate-limited endpoints
- [ ] Rate limit info in response meta matches HTTP headers exactly
- [ ] Edge Function rate limits propagate to client SDK responses
- [ ] All response types are updated in TypeScript definitions
- [ ] OpenAPI spec is updated with new response schemas
- [ ] Migration guide is created if breaking changes introduced
- [ ] Backwards compatibility is maintained where feasible
- [ ] Unit tests updated for new response shapes
- [ ] Integration tests verify rate limit info is correct
- [ ] Client code (mobile/web) updated to handle new shapes
- [ ] UI components can access and display rate limit countdowns

## Notes

This change addresses two API consistency issues identified in the 14-agent review:

1. **Response Shape Standardization** - Creates predictable, type-safe API responses that reduce developer cognitive load
2. **Rate Limit Information** - Enables better UX by giving clients real-time feedback on rate limiting state

The design follows industry best practices:
- Generic `ApiResponse<T>` pattern (similar to Stripe, GitHub APIs)
- Structured errors with codes for programmatic handling
- Rate limit headers aligned with IETF standards (RFC 6585, draft-ietf-httpapi-ratelimit-headers)
- Optional `meta` field for extensibility without breaking changes

Backwards compatibility strategy:
- If existing clients depend on exact response shapes, consider versioning (v1 vs v2 endpoints)
- Otherwise, use additive approach: add `data` wrapper while keeping existing fields temporarily
- Deprecate old fields with timeline, then remove in next major version
