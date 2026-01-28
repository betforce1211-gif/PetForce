# Design: Standardize Authentication API Response Formats

## Context

The current authentication API has inconsistent response shapes across endpoints:
- `register()`: `{ success, message, confirmationRequired?, error? }`
- `login()`: `{ success, tokens?, user?, error? }`
- `logout()`: `{ success, error? }`
- `resendConfirmationEmail()`: `{ success, message, error? }`

This forces clients to handle each endpoint differently, increasing cognitive load and error surface area. Additionally, rate limit information is only returned in headers from the Supabase Edge Function, not consistently in all auth API responses.

**Stakeholders:**
- Developers integrating with auth APIs (mobile, web)
- Maya (Mobile) - needs consistent response parsing
- Dexter (UX) - needs rate limit info for UI feedback
- Samantha (Security) - needs consistent error handling

## Goals / Non-Goals

**Goals:**
- Standardize all auth API responses to use `ApiResponse<T>` pattern
- Include rate limit information in all rate-limited endpoint responses
- Maintain type safety with TypeScript generics
- Enable better client-side UX (countdown timers, proactive button disabling)
- Reduce developer cognitive load with predictable patterns

**Non-Goals:**
- Changing underlying Supabase Auth behavior
- Implementing new rate limiting (reuse existing Edge Function limits)
- Modifying non-auth APIs (focus on auth package only)
- Building UI components (just provide the data structure)

## Decisions

### Decision 1: Use Generic `ApiResponse<T>` Pattern

**What:** Create a generic response wrapper used by all auth endpoints.

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: AuthError;
  meta?: ApiResponseMeta;
}

interface ApiResponseMeta {
  requestId?: string;
  rateLimit?: RateLimitInfo;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;        // Unix timestamp (seconds)
  retryAfter?: number;  // Seconds (only on 429)
}
```

**Why:**
- Industry standard pattern (Stripe, GitHub, Twilio use similar)
- Type-safe with TypeScript generics
- Extensible via optional `meta` field
- Clear separation of data vs metadata

**Alternatives considered:**
- Option A: Different shapes per endpoint (current state) - rejected for inconsistency
- Option B: Flat response with all fields optional - rejected for type safety issues
- Option C: Separate success/error return types - rejected for increased complexity

### Decision 2: Additive Migration Strategy

**What:** Add new fields while temporarily maintaining old fields, then deprecate.

**Migration phases:**
1. Add `data` wrapper with new structure
2. Keep old fields alongside for 1-2 release cycles
3. Mark old fields as `@deprecated` in TypeScript
4. Remove old fields in next major version

**Why:**
- Minimizes breaking changes
- Gives clients time to migrate
- Can rollback if issues discovered

**Example transition for `login()`:**
```typescript
// Phase 1: Both old and new
{
  success: true,
  tokens: { ... },      // @deprecated
  user: { ... },        // @deprecated
  data: {               // NEW
    tokens: { ... },
    user: { ... }
  }
}

// Phase 2: Only new
{
  success: true,
  data: {
    tokens: { ... },
    user: { ... }
  }
}
```

**Alternative considered:**
- Immediate breaking change with version bump - rejected due to migration burden

### Decision 3: Parse Rate Limits from Edge Function Headers

**What:** When calling Supabase Edge Functions that return rate limit headers, parse them and populate `meta.rateLimit`.

**Implementation:**
```typescript
async function resendConfirmationEmail(email: string): Promise<ApiResponse<void>> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  const rateLimit = parseRateLimitHeaders(response.headers);
  const body = await response.json();

  return {
    success: body.success,
    message: body.message,
    error: body.error,
    meta: {
      requestId: logger.generateRequestId(),
      rateLimit
    }
  };
}

function parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');

  if (!limit || !remaining || !reset) return undefined;

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: new Date(reset).getTime() / 1000,  // Convert to Unix seconds
    retryAfter: response.status === 429
      ? parseInt(headers.get('Retry-After') || '0', 10)
      : undefined
  };
}
```

**Why:**
- Reuses existing Edge Function rate limiting
- No changes to Supabase infrastructure needed
- Provides client-side visibility into rate limits

### Decision 4: Consistent Error Codes Across All Endpoints

**What:** Standardize error codes used across auth APIs.

**Error code dictionary:**
```typescript
type AuthErrorCode =
  | 'INVALID_CREDENTIALS'      // Wrong email/password
  | 'EMAIL_NOT_CONFIRMED'      // Email verification required
  | 'USER_ALREADY_EXISTS'      // Duplicate email on registration
  | 'WEAK_PASSWORD'            // Password doesn't meet requirements
  | 'INVALID_TOKEN'            // Expired/invalid reset token
  | 'RATE_LIMIT_EXCEEDED'      // Too many requests
  | 'INVALID_REQUEST'          // Validation failed
  | 'UNAUTHORIZED'             // Auth required
  | 'RESEND_ERROR'             // Failed to resend email
  | 'LOGIN_ERROR'              // Generic login failure
  | 'REGISTRATION_ERROR'       // Generic registration failure
  | 'LOGOUT_ERROR'             // Generic logout failure
  | 'REFRESH_ERROR'            // Token refresh failed
  | 'GET_USER_ERROR'           // Failed to get current user
  | 'UNEXPECTED_ERROR';        // Unknown server error
```

**Why:**
- Clients can handle errors programmatically
- Enables i18n (map codes to localized messages)
- Prevents exposing system internals in error messages

## Risks / Trade-offs

### Risk 1: Breaking Changes
**Risk:** Existing clients may break if response shapes change.
**Mitigation:**
- Use additive migration strategy (Decision 2)
- Document migration in changelog
- Provide TypeScript compilation errors to catch issues early
- Consider feature flag to enable new format gradually

### Risk 2: Rate Limit Header Parsing Failures
**Risk:** If Edge Function doesn't return headers, parsing fails.
**Mitigation:**
- Make `meta.rateLimit` optional
- Return `undefined` if headers missing
- Log warning but don't fail the request
- Edge Function should always return headers (verify in tests)

### Risk 3: Increased Response Size
**Risk:** Adding `meta` and `data` wrappers increases JSON payload size.
**Impact:** Minimal (~50-100 bytes per response)
**Mitigation:**
- Use gzip compression (standard in HTTP)
- Monitor response sizes post-deployment
- Optimize if becomes an issue (unlikely)

### Risk 4: Type Complexity
**Risk:** Generic types harder to understand for new developers.
**Mitigation:**
- Extensive JSDoc comments with examples
- Document in API design guidelines
- Provide helper functions for common patterns

## Migration Plan

### Phase 1: Preparation (Week 1)
1. Define `ApiResponse<T>` and related types in `auth.ts`
2. Create helper functions for response construction
3. Write comprehensive unit tests for new types
4. Update OpenAPI spec with new schemas

### Phase 2: Implementation (Week 2)
1. Refactor `resendConfirmationEmail()` first (simplest)
2. Add rate limit header parsing
3. Test rate limit info propagation
4. Refactor remaining auth functions one-by-one
5. Maintain old fields alongside new for compatibility

### Phase 3: Client Updates (Week 3)
1. Update mobile app to use new response shapes
2. Update web app to use new response shapes
3. Add UI for rate limit feedback (countdown timers)
4. End-to-end testing of all auth flows

### Phase 4: Deprecation (Week 4-6)
1. Mark old fields as `@deprecated` in types
2. Update docs to recommend new pattern
3. Monitor usage logs for deprecated field access
4. Communicate deprecation timeline to stakeholders

### Phase 5: Cleanup (Release N+1)
1. Remove deprecated fields
2. Bump major version if needed
3. Update all examples and docs
4. Final regression testing

**Rollback plan:**
- If issues arise, feature flag can disable new format
- Old fields maintained during transition allow immediate rollback
- Database/auth backend unchanged, so no data migrations needed

## Open Questions

1. **Q:** Should we version the API endpoints (e.g., `/v1/auth/login` vs `/v2/auth/login`)?
   **A:** Deferred. Use additive migration first. If too complex, consider versioning later.

2. **Q:** Should rate limit info be returned on ALL responses or only rate-limited ones?
   **A:** Only rate-limited endpoints. Reduces payload size and cognitive load.

3. **Q:** How to handle Supabase Auth errors that don't map cleanly to our error codes?
   **A:** Map to generic codes (e.g., `LOGIN_ERROR`) and log full Supabase error for debugging.

4. **Q:** Should `requestId` always be in `meta` or only for errors?
   **A:** Always include for tracing. Minimal cost, high debugging value.

## Success Metrics

**Implementation success:**
- All auth API functions return `ApiResponse<T>` shaped responses
- All rate-limited endpoints include `meta.rateLimit`
- Zero regression bugs in auth flows
- TypeScript compilation errors catch response shape mismatches

**Developer experience:**
- Reduced client code complexity (single response parser)
- Positive feedback from Maya (Mobile) and web developers
- Fewer support tickets about auth API inconsistencies

**User experience:**
- Countdown timers visible on rate-limited actions
- Clearer error messages from standardized codes
- No noticeable performance degradation
