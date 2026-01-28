# Change: Standardize Authentication API Response Formats

## Why

The 14-agent review identified two medium-priority API consistency issues:

1. **Response Shape Inconsistency** - Different auth functions return different response structures, forcing clients to handle each endpoint differently
2. **Missing Rate Limit Info** - Rate limit information is not consistently returned in API responses, preventing clients from showing accurate feedback

These inconsistencies harm developer experience and make it harder for clients to build reliable UIs. Standardizing response shapes reduces cognitive load, while rate limit information enables better UX (countdown timers, clear messaging).

## What Changes

### Task #16: API Response Shape Standardization
- Create standard `ApiResponse<T>` generic type
- Refactor all auth API functions to use consistent shape: `{ success, data?, message?, error?, meta? }`
- Update TypeScript types and function signatures
- Maintain backwards compatibility where possible

### Task #24: Rate Limit Info in API Responses
- Add `meta.rateLimit` to all rate-limited endpoints
- Include: `limit`, `remaining`, `reset` timestamp
- Ensure Supabase Edge Function rate limits propagate to client responses
- Add rate limit headers to HTTP responses

## Impact

**Affected specs:**
- `api-design` - Core API patterns and response standards
- `authentication` - Auth API contracts (if exists as separate spec)

**Affected code:**
- `/Users/danielzeddr/PetForce/packages/auth/src/api/auth-api.ts` - All API functions
- `/Users/danielzeddr/PetForce/packages/auth/src/types/auth.ts` - Response types
- `/Users/danielzeddr/PetForce/supabase/functions/resend-confirmation/index.ts` - Rate limit info
- All client code consuming these APIs (mobile, web)

**Breaking changes:** Potentially breaking if clients depend on exact response shape. Mitigation: use additive approach where possible, version if needed.

**Timeline:** 4-6 hours implementation + testing
