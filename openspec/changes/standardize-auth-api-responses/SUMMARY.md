# Change Summary: Standardize Authentication API Response Formats

## Quick Overview

**What**: Standardize all auth API responses to use `ApiResponse<T>` pattern and include rate limit information

**Why**: Improve developer experience with consistent response handling and enable better UX with rate limit visibility

**Effort**: 4-6 hours implementation + testing

**Priority**: MEDIUM (from 14-agent review)

## The Problem

Current auth APIs have **inconsistent response shapes**:

```typescript
// Each function has a different shape
register()              → { success, message, confirmationRequired?, error? }
login()                 → { success, tokens?, user?, error? }
logout()                → { success, error? }
resendConfirmationEmail() → { success, message, error? }
```

**Result**: Clients must handle each endpoint differently, increasing complexity.

**Missing rate limit info**: Edge Functions implement rate limiting but clients can't easily show countdown timers.

## The Solution

**Standardized pattern**:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;              // Typed payload
  message?: string;
  error?: AuthError;
  meta?: {
    requestId?: string;
    rateLimit?: {        // NEW!
      limit: number;
      remaining: number;
      reset: number;
      retryAfter?: number;
    };
  };
}
```

**Every endpoint** uses this pattern:

```typescript
register()              → ApiResponse<{ confirmationRequired: boolean }>
login()                 → ApiResponse<{ tokens: AuthTokens; user: User }>
logout()                → ApiResponse<void>
resendConfirmationEmail() → ApiResponse<void>  // with meta.rateLimit
```

## Key Benefits

1. **Single Response Parser**: Client code handles all endpoints the same way
2. **Type Safety**: TypeScript generics catch errors at compile time
3. **Rate Limit UX**: Clients can show accurate countdown timers
4. **Extensibility**: `meta` field allows future additions
5. **Industry Standard**: Aligns with Stripe, GitHub, Twilio patterns

## Example Usage

**Before:**
```typescript
const result = await login({ email, password });
if (result.success) {
  const tokens = result.tokens;  // Different for each endpoint
  const user = result.user;
}
```

**After:**
```typescript
const result = await login({ email, password });
if (result.success) {
  const { tokens, user } = result.data;  // Consistent pattern

  // Bonus: Access metadata
  console.log('Request ID:', result.meta?.requestId);
}
```

**Rate limit example:**
```typescript
const result = await resendConfirmationEmail(email);

if (!result.success && result.error?.code === 'RATE_LIMIT_EXCEEDED') {
  const { retryAfter } = result.meta!.rateLimit!;
  showCountdown(retryAfter); // Show "Try again in 10:00"
}
```

## What Changes

### Type Definitions (NEW)
```
packages/auth/src/types/auth.ts
+ interface ApiResponse<T>
+ interface ApiResponseMeta
+ interface RateLimitInfo
+ type AuthErrorCode (standardized codes)
```

### Helper Functions (NEW)
```
packages/auth/src/utils/api-response.ts
+ createSuccessResponse<T>()
+ createErrorResponse()
+ parseRateLimitHeaders()
```

### Refactored Functions (MODIFIED)
```
packages/auth/src/api/auth-api.ts
* register() → Promise<ApiResponse<{ confirmationRequired: boolean }>>
* login() → Promise<ApiResponse<{ tokens: AuthTokens; user: User }>>
* logout() → Promise<ApiResponse<void>>
* resendConfirmationEmail() → Promise<ApiResponse<void>>
* requestPasswordReset() → Promise<ApiResponse<void>>
* getCurrentUser() → Promise<ApiResponse<{ user: User | null }>>
* refreshSession() → Promise<ApiResponse<{ tokens: AuthTokens }>>
```

## Migration Strategy

**Additive approach** to minimize breaking changes:

### Phase 1: Add new fields alongside old
```typescript
// Both patterns work
{
  success: true,
  tokens: { ... },      // Old (deprecated)
  user: { ... },        // Old (deprecated)
  data: {               // New (recommended)
    tokens: { ... },
    user: { ... }
  }
}
```

### Phase 2: Deprecate old fields
```typescript
// Mark as @deprecated in TypeScript
tokens?: AuthTokens;  // @deprecated Use data.tokens instead
```

### Phase 3: Remove old fields (next major version)
```typescript
// Clean response
{
  success: true,
  data: {
    tokens: { ... },
    user: { ... }
  }
}
```

## Impact Analysis

### Affected Code
- `/Users/danielzeddr/PetForce/packages/auth/src/api/auth-api.ts` - All functions
- `/Users/danielzeddr/PetForce/packages/auth/src/types/auth.ts` - Type definitions
- Mobile app - Response handling
- Web app - Response handling

### Breaking Changes
- **Potentially breaking** if clients depend on exact response shapes
- **Mitigated** by additive migration strategy
- **TypeScript** will catch issues at compile time

### Testing Required
- Unit tests for helpers and refactored functions
- Integration tests for all auth flows
- Client tests for mobile/web apps
- Rate limit UI component tests

## Timeline

**Week 1**: Type system + helpers + tests
**Week 2**: Refactor auth functions + rate limit parsing
**Week 3**: Update clients + UI components + integration tests
**Week 4+**: Deprecation + cleanup

**Total**: 3-4 weeks with gradual rollout

## Success Metrics

- [ ] All auth functions return `ApiResponse<T>`
- [ ] All rate-limited endpoints include `meta.rateLimit`
- [ ] Zero regression bugs
- [ ] Single response parser in client code
- [ ] Countdown timers visible in UI
- [ ] Positive developer feedback

## Review Checklist

**Required Approvals:**
- [ ] Axel (API Design) - Pattern consistency
- [ ] Engrid (Engineering) - Implementation feasibility
- [ ] Maya (Mobile) - Client integration
- [ ] Samantha (Security) - Error message disclosure

**Nice to Have:**
- [ ] Dexter (UX) - Rate limit UI requirements
- [ ] Tucker (QA) - Testing coverage
- [ ] Thomas (Documentation) - API docs clarity

## Related Work

**Based on**: 14-agent review findings
- Task #16: API Response Shape Standardization
- Task #24: Rate Limit Info in API Responses

**Related Changes:**
- `enhance-login-registration-ux` - May need coordination
- `add-authentication-system` - Base auth implementation

**Dependencies:**
- Existing Supabase Edge Function rate limiting
- Current auth API implementation

## Questions & Answers

**Q: Why not just version the API (v2)?**
A: Additive migration is less disruptive. We can version later if needed.

**Q: What if Supabase doesn't return rate limit headers?**
A: `meta.rateLimit` is optional. Missing headers = undefined (graceful degradation).

**Q: How do clients know which fields to use during transition?**
A: TypeScript `@deprecated` annotations + documentation + changelog.

**Q: What about non-auth APIs?**
A: Out of scope. This change focuses on auth package only. Can extend pattern later.

## Next Steps

1. **Review this proposal** - Gather feedback from stakeholders
2. **Validate with OpenSpec** - Run `openspec validate standardize-auth-api-responses --strict`
3. **Get approvals** - Axel, Engrid, Maya, Samantha
4. **Implement Phase 1** - Types and helpers
5. **Iterate** - Refactor functions one by one with tests

---

**Change ID**: `standardize-auth-api-responses`
**Owner**: Axel (API Design)
**Status**: Awaiting Review
**Created**: 2026-01-25
