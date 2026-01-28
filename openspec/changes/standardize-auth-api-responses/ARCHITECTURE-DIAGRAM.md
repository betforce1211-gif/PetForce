# Architecture Diagram

## Current State (Before)

```
┌─────────────────────────────────────────────────────────────┐
│                    Auth API Functions                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  register()                                                   │
│    ↓                                                          │
│    { success, message, confirmationRequired?, error? }       │
│                                                               │
│  login()                                                      │
│    ↓                                                          │
│    { success, tokens?, user?, error? }                       │
│                                                               │
│  logout()                                                     │
│    ↓                                                          │
│    { success, error? }                                       │
│                                                               │
│  resendConfirmationEmail()                                   │
│    ↓                                                          │
│    { success, message, error? }                              │
│                                                               │
│  getCurrentUser()                                            │
│    ↓                                                          │
│    { user, error? }  ← Missing 'success'!                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↓
         ↓  Different shapes = different parsers needed
         ↓
┌─────────────────────────────────────────────────────────────┐
│                     Client Code                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  // Must handle each endpoint differently                    │
│                                                               │
│  if (registerResult.success) {                               │
│    const required = registerResult.confirmationRequired;     │
│  }                                                            │
│                                                               │
│  if (loginResult.success) {                                  │
│    const tokens = loginResult.tokens;  ← Different!         │
│    const user = loginResult.user;                            │
│  }                                                            │
│                                                               │
│  const user = getUserResult.user;  ← No 'success' check!    │
│                                                               │
└─────────────────────────────────────────────────────────────┘

PROBLEMS:
❌ Inconsistent response shapes across endpoints
❌ Client code must handle each differently
❌ No rate limit visibility for UX
❌ Missing 'success' field on getCurrentUser()
❌ Higher cognitive load for developers
```

---

## Future State (After)

```
┌─────────────────────────────────────────────────────────────┐
│                Generic ApiResponse<T> Pattern                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  interface ApiResponse<T> {                                  │
│    success: boolean;          ← Always present              │
│    data?: T;                  ← Typed payload               │
│    message?: string;          ← User-friendly text          │
│    error?: AuthError;         ← Structured errors           │
│    meta?: {                   ← Metadata                    │
│      requestId?: string;      ← Tracing                     │
│      rateLimit?: {            ← NEW: Rate limiting          │
│        limit: number;         ← Max requests                │
│        remaining: number;     ← Attempts left               │
│        reset: number;         ← When resets                 │
│        retryAfter?: number;   ← Countdown timer             │
│      };                                                      │
│    };                                                        │
│  }                                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↓
         ↓  Single pattern used everywhere
         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Auth API Functions                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  register()                                                   │
│    ↓                                                          │
│    ApiResponse<{ confirmationRequired: boolean }>            │
│                                                               │
│  login()                                                      │
│    ↓                                                          │
│    ApiResponse<{ tokens: AuthTokens; user: User }>          │
│                                                               │
│  logout()                                                     │
│    ↓                                                          │
│    ApiResponse<void>                                         │
│                                                               │
│  resendConfirmationEmail()  ← Rate limited                  │
│    ↓                                                          │
│    ApiResponse<void>  (with meta.rateLimit)                 │
│                                                               │
│  getCurrentUser()                                            │
│    ↓                                                          │
│    ApiResponse<{ user: User | null }>                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↓
         ↓  Consistent handling across all endpoints
         ↓
┌─────────────────────────────────────────────────────────────┐
│                     Client Code                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  // Single response parser for ALL endpoints                 │
│                                                               │
│  function handleResponse<T>(result: ApiResponse<T>) {        │
│    if (result.success) {                                     │
│      return result.data;  ← Always in 'data'                │
│    } else {                                                  │
│      throw new Error(result.error.message);                  │
│    }                                                          │
│  }                                                            │
│                                                               │
│  // Use it everywhere                                        │
│  const { confirmationRequired } = handleResponse(register); │
│  const { tokens, user } = handleResponse(login);            │
│  const { user } = handleResponse(getCurrentUser);           │
│                                                               │
│  // Rate limit awareness                                     │
│  if (resendResult.meta?.rateLimit) {                        │
│    showCountdown(resendResult.meta.rateLimit.retryAfter);   │
│  }                                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘

BENEFITS:
✅ Consistent response shape across all endpoints
✅ Single response parser reduces code duplication
✅ Rate limit visibility enables better UX
✅ Type-safe with TypeScript generics
✅ Extensible via 'meta' field
✅ Lower cognitive load for developers
```

---

## Rate Limit Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Function                          │
│         (resend-confirmation/index.ts)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Check auth_rate_limits table                            │
│  2. Count attempts in last 15 minutes                       │
│  3. If >= 3 attempts:                                        │
│     - Return 429 Too Many Requests                           │
│     - Include headers:                                       │
│       X-RateLimit-Limit: 3                                   │
│       X-RateLimit-Remaining: 0                               │
│       X-RateLimit-Reset: 2026-01-25T12:30:00Z               │
│       Retry-After: 600                                       │
│  4. Else:                                                    │
│     - Send confirmation email                                │
│     - Record attempt in table                                │
│     - Return 200 with rate limit headers                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↓
         ↓  HTTP Response with headers
         ↓
┌─────────────────────────────────────────────────────────────┐
│           Auth API (resendConfirmationEmail)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Call Edge Function                                       │
│  2. Parse rate limit headers:                                │
│     parseRateLimitHeaders(response.headers)                  │
│  3. Extract:                                                 │
│     - limit: parseInt(X-RateLimit-Limit)                    │
│     - remaining: parseInt(X-RateLimit-Remaining)            │
│     - reset: new Date(X-RateLimit-Reset).getTime() / 1000   │
│     - retryAfter: parseInt(Retry-After)  (if 429)           │
│  4. Build ApiResponse:                                       │
│     {                                                        │
│       success: response.ok,                                  │
│       message: body.message,                                 │
│       error: body.error,                                     │
│       meta: {                                                │
│         requestId: generateRequestId(),                      │
│         rateLimit: { limit, remaining, reset, retryAfter }  │
│       }                                                      │
│     }                                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↓
         ↓  ApiResponse with meta.rateLimit
         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Mobile/Web Client                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  const result = await resendConfirmationEmail(email);        │
│                                                               │
│  if (!result.success) {                                      │
│    if (result.error.code === 'RATE_LIMIT_EXCEEDED') {       │
│                                                               │
│      // Access rate limit info                               │
│      const rateLimit = result.meta.rateLimit;                │
│                                                               │
│      // Show user-friendly message                           │
│      setError(                                               │
│        `Too many attempts. Try again in ${                   │
│          Math.ceil(rateLimit.retryAfter / 60)               │
│        } minutes.`                                           │
│      );                                                      │
│                                                               │
│      // Start countdown timer                                │
│      <RateLimitCountdown                                     │
│        resetTimestamp={rateLimit.reset}                      │
│      />                                                      │
│                                                               │
│      // Disable button until reset                           │
│      <Button disabled={rateLimit.remaining === 0} />         │
│    }                                                         │
│  }                                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

FLOW:
1. Edge Function enforces rate limits
2. Auth API parses headers → meta.rateLimit
3. Client accesses structured data
4. UI shows countdown timer and disables button
```

---

## Type Safety Flow

```
┌─────────────────────────────────────────────────────────────┐
│                TypeScript Compilation                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  // Function signature with generic type                     │
│  function login(                                             │
│    data: LoginRequest                                        │
│  ): Promise<ApiResponse<{ tokens: AuthTokens; user: User }>>│
│                                                               │
│  // Type inference at call site                              │
│  const result = await login({ email, password });            │
│  //    ^                                                     │
│  //    ApiResponse<{ tokens: AuthTokens; user: User }>      │
│                                                               │
│  if (result.success) {                                       │
│    const tokens = result.data.tokens;                        │
│    //                      ^                                 │
│    //                      AuthTokens (type-safe!)           │
│                                                               │
│    const invalid = result.data.foo;                          │
│    //                          ^^^                           │
│    //    ERROR: Property 'foo' does not exist               │
│  }                                                           │
│                                                               │
│  // Accessing data when success is false → compile error    │
│  const tokens = result.data.tokens;                          │
│  //                     ^^^^                                 │
│  //   ERROR: Object is possibly 'undefined'                  │
│  //   (Must check 'success' first)                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

TYPE SAFETY BENEFITS:
✅ Compile-time checks prevent runtime errors
✅ IDE autocomplete shows exact response shape
✅ Can't access 'data' without checking 'success'
✅ Can't access wrong fields (compile error)
✅ Refactoring is safe (TypeScript finds all uses)
```

---

## Helper Functions Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         packages/auth/src/utils/api-response.ts              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  export function createSuccessResponse<T>(                   │
│    data: T,                                                  │
│    options?: { message?: string; meta?: ... }               │
│  ): ApiResponse<T> {                                         │
│    return {                                                  │
│      success: true,                                          │
│      data,                                                   │
│      message: options?.message,                              │
│      meta: {                                                 │
│        requestId: logger.generateRequestId(),                │
│        ...options?.meta                                      │
│      }                                                       │
│    };                                                        │
│  }                                                           │
│                                                               │
│  export function createErrorResponse(                        │
│    code: string,                                             │
│    message: string,                                          │
│    options?: { details?: ...; meta?: ... }                  │
│  ): ApiResponse<never> {                                     │
│    return {                                                  │
│      success: false,                                         │
│      error: { code, message, details: options?.details },   │
│      meta: {                                                 │
│        requestId: logger.generateRequestId(),                │
│        ...options?.meta                                      │
│      }                                                       │
│    };                                                        │
│  }                                                           │
│                                                               │
│  export function parseRateLimitHeaders(                      │
│    headers: Headers                                          │
│  ): RateLimitInfo | undefined {                              │
│    // Extract X-RateLimit-* headers                          │
│    // Parse into structured object                           │
│    // Return undefined if headers missing                    │
│  }                                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↓
         ↓  Used by all auth functions
         ↓
┌─────────────────────────────────────────────────────────────┐
│         packages/auth/src/api/auth-api.ts                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  export async function register(                             │
│    data: RegisterRequest                                     │
│  ): Promise<ApiResponse<{ confirmationRequired: boolean }>> {│
│                                                               │
│    // ... Supabase call ...                                  │
│                                                               │
│    if (error) {                                              │
│      return createErrorResponse(                             │
│        error.name || 'REGISTRATION_ERROR',                   │
│        error.message                                         │
│      );                                                      │
│    }                                                         │
│                                                               │
│    return createSuccessResponse(                             │
│      { confirmationRequired },                               │
│      { message: 'Registration successful...' }              │
│    );                                                        │
│  }                                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

BENEFITS:
✅ DRY: No repeated response construction code
✅ Consistency: All responses use same helpers
✅ Maintainability: Change once, applies everywhere
✅ Testability: Helpers are easily unit tested
```

---

## Migration Strategy Diagram

```
PHASE 1: Additive (Weeks 1-2)
┌─────────────────────────────────────────────────────────────┐
│  Response includes BOTH old and new fields                   │
├─────────────────────────────────────────────────────────────┤
│  {                                                            │
│    success: true,                                            │
│    tokens: { ... },       // OLD (deprecated)                │
│    user: { ... },         // OLD (deprecated)                │
│    data: {                // NEW (recommended)               │
│      tokens: { ... },                                        │
│      user: { ... }                                           │
│    },                                                        │
│    meta: { requestId: '...' }  // NEW                        │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
  ↓ Clients can use either old or new
  ↓ No breaking changes
  ↓

PHASE 2: Deprecation (Weeks 3-4)
┌─────────────────────────────────────────────────────────────┐
│  TypeScript shows deprecation warnings                       │
├─────────────────────────────────────────────────────────────┤
│  interface LoginResponse {                                   │
│    success: boolean;                                         │
│    /** @deprecated Use data.tokens instead */                │
│    tokens?: AuthTokens;                                      │
│    /** @deprecated Use data.user instead */                  │
│    user?: User;                                              │
│    data: { tokens: AuthTokens; user: User };                │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
  ↓ IDE shows warnings
  ↓ Docs recommend new pattern
  ↓ Usage tracking monitors adoption
  ↓

PHASE 3: Cleanup (Release N+1)
┌─────────────────────────────────────────────────────────────┐
│  Remove deprecated fields                                    │
├─────────────────────────────────────────────────────────────┤
│  {                                                            │
│    success: true,                                            │
│    data: {                // Only new fields                 │
│      tokens: { ... },                                        │
│      user: { ... }                                           │
│    },                                                        │
│    meta: { requestId: '...' }                                │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
  ↓ Clean, standardized response
  ↓ All clients migrated
  ✓ DONE

ROLLBACK PLAN:
If issues arise during Phases 1-2:
→ Feature flag can toggle old/new format
→ Old fields still present, so clients keep working
→ No database changes, so rollback is instant
```

---

This architecture provides:
- Consistency across all endpoints
- Type safety at compile time
- Better developer experience
- Rate limit visibility for UX
- Graceful migration path
