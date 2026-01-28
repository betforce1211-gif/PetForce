# Standardize Authentication API Response Formats

## Overview

This change addresses two medium-priority API consistency improvements identified in the 14-agent review:

1. **Task #16: API Response Shape Standardization** - Standardize response shapes across all auth endpoints
2. **Task #24: Rate Limit Info in API Responses** - Add rate limit information to API responses

## Problem Statement

### Current Issues

**Inconsistent Response Shapes:**
```typescript
// register() returns
{ success: boolean, message: string, confirmationRequired?: boolean, error?: AuthError }

// login() returns
{ success: boolean, tokens?: AuthTokens, user?: User, error?: AuthError }

// logout() returns
{ success: boolean, error?: AuthError }

// resendConfirmationEmail() returns
{ success: boolean, message: string, error?: AuthError }
```

Clients must handle each endpoint differently, increasing complexity and error surface area.

**Missing Rate Limit Information:**
- Rate limits are implemented in Supabase Edge Functions
- Rate limit headers are returned (`X-RateLimit-*`)
- But clients don't have easy access to this info in response bodies
- UX suffers: can't show countdown timers or proactive button disabling

## Solution

### Standardized Response Pattern

All auth endpoints will return:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;              // Typed response payload
  message?: string;      // User-friendly message
  error?: AuthError;     // Structured error info
  meta?: {
    requestId?: string;
    rateLimit?: RateLimitInfo;  // NEW
  };
}
```

### Benefits

1. **Developer Experience**: Single response parser for all endpoints
2. **Type Safety**: Generic `<T>` provides compile-time type checking
3. **Rate Limit Visibility**: Clients can show accurate countdown timers
4. **Extensibility**: `meta` field allows future additions without breaking changes
5. **Consistency**: Aligns with industry standards (Stripe, GitHub, etc.)

## Files Changed

### New/Modified Files

```
packages/auth/src/
├── types/auth.ts                    # MODIFIED: Add ApiResponse<T>, RateLimitInfo types
├── utils/api-response.ts            # NEW: Helper functions
├── api/auth-api.ts                  # MODIFIED: All function signatures
└── __tests__/
    ├── api/auth-api.test.ts         # MODIFIED: Update tests
    └── utils/api-response.test.ts   # NEW: Test helpers

openspec/changes/standardize-auth-api-responses/
├── proposal.md                      # This proposal
├── tasks.md                         # Implementation checklist
├── design.md                        # Technical design decisions
├── specs/api-design/spec.md         # API design spec deltas
├── openapi-spec.yaml                # OpenAPI 3.0 specification
├── IMPLEMENTATION-EXAMPLES.md       # Code examples
└── README.md                        # This file
```

## Implementation Phases

### Phase 1: Type System (Week 1)
- [ ] Define `ApiResponse<T>` generic type
- [ ] Define `RateLimitInfo` interface
- [ ] Create helper functions (`createSuccessResponse`, `createErrorResponse`)
- [ ] Write unit tests for helpers

### Phase 2: API Refactoring (Week 2)
- [ ] Refactor all auth functions to return `ApiResponse<T>`
- [ ] Add rate limit header parsing
- [ ] Update function return types
- [ ] Maintain backwards compatibility (transitional phase)

### Phase 3: Client Updates (Week 3)
- [ ] Update mobile app response handling
- [ ] Update web app response handling
- [ ] Add rate limit UI components (countdown timers)
- [ ] Integration testing

### Phase 4: Cleanup (Week 4+)
- [ ] Remove deprecated fields
- [ ] Update documentation
- [ ] Final regression tests

## Quick Start

### For Implementers

1. Read `/Users/danielzeddr/PetForce/openspec/changes/standardize-auth-api-responses/design.md`
2. Review `/Users/danielzeddr/PetForce/openspec/changes/standardize-auth-api-responses/IMPLEMENTATION-EXAMPLES.md`
3. Follow tasks in `/Users/danielzeddr/PetForce/openspec/changes/standardize-auth-api-responses/tasks.md`
4. Reference OpenAPI spec: `/Users/danielzeddr/PetForce/openspec/changes/standardize-auth-api-responses/openapi-spec.yaml`

### For Reviewers

**Key Review Points:**
- Does `ApiResponse<T>` cover all use cases?
- Is rate limit info sufficient for UI needs?
- Are error codes comprehensive?
- Is migration strategy sound?

**Review Checklist:**
- [ ] Axel (API Design) - API consistency and patterns
- [ ] Engrid (Engineering) - Implementation feasibility
- [ ] Maya (Mobile) - Mobile integration impacts
- [ ] Samantha (Security) - Error message information disclosure
- [ ] Tucker (QA) - Testing strategy

## Testing Strategy

### Unit Tests
- Test helper functions (`createSuccessResponse`, `createErrorResponse`)
- Test rate limit header parsing
- Test each refactored auth function

### Integration Tests
- Test all auth flows end-to-end
- Verify rate limit info propagates correctly
- Test error handling for all scenarios

### Client Tests
- Test mobile app handles new response shapes
- Test web app handles new response shapes
- Test rate limit UI components

## Documentation Updates

- [ ] OpenAPI spec updated with new response schemas
- [ ] API design guidelines updated with standard pattern
- [ ] Migration guide for existing clients
- [ ] Code examples for common use cases

## Success Criteria

**Implementation:**
- [ ] All auth functions return `ApiResponse<T>`
- [ ] All rate-limited endpoints include `meta.rateLimit`
- [ ] All tests passing (unit, integration, e2e)
- [ ] Zero regression bugs

**Developer Experience:**
- [ ] Single response parser pattern in client code
- [ ] TypeScript catches response shape mismatches at compile time
- [ ] Positive feedback from mobile/web developers

**User Experience:**
- [ ] Countdown timers visible on rate-limited actions
- [ ] Clearer error messages
- [ ] Proactive button disabling when limits reached

## Related Documents

- **14-Agent Review**: `/Users/danielzeddr/PetForce/docs/features/email-password-login/checklists/axel-api-checklist.md`
- **Current Auth API**: `/Users/danielzeddr/PetForce/packages/auth/src/api/auth-api.ts`
- **Auth Types**: `/Users/danielzeddr/PetForce/packages/auth/src/types/auth.ts`
- **Edge Function**: `/Users/danielzeddr/PetForce/supabase/functions/resend-confirmation/index.ts`

## Contact

**Change Owner**: Axel (API Design)

**Stakeholders:**
- Engrid (Engineering) - Implementation
- Maya (Mobile) - Client integration
- Dexter (UX) - UI feedback requirements
- Samantha (Security) - Error message review

**Questions?** Reference this change in discussions: `standardize-auth-api-responses`
