# Implementation Tasks

## 1. Type System Updates
- [ ] 1.1 Create `ApiResponse<T>` generic type in `/Users/danielzeddr/PetForce/packages/auth/src/types/auth.ts`
- [ ] 1.2 Create `RateLimitInfo` interface
- [ ] 1.3 Create `ApiResponseMeta` interface
- [ ] 1.4 Define standard error response structure

## 2. Auth API Refactoring
- [ ] 2.1 Update `register()` to use `ApiResponse<{ confirmationRequired: boolean }>`
- [ ] 2.2 Update `login()` to use `ApiResponse<{ tokens: AuthTokens; user: User }>`
- [ ] 2.3 Update `logout()` to use `ApiResponse<void>`
- [ ] 2.4 Update `resendConfirmationEmail()` to use `ApiResponse<void>` with rate limit meta
- [ ] 2.5 Update `requestPasswordReset()` to use `ApiResponse<void>`
- [ ] 2.6 Update `getCurrentUser()` to use `ApiResponse<{ user: User | null }>`
- [ ] 2.7 Update `refreshSession()` to use `ApiResponse<{ tokens: AuthTokens }>`

## 3. Rate Limit Integration
- [ ] 3.1 Add rate limit info to `resendConfirmationEmail()` response meta
- [ ] 3.2 Parse rate limit headers from Supabase Edge Function responses
- [ ] 3.3 Add rate limit headers to all rate-limited endpoint responses
- [ ] 3.4 Document rate limits in OpenAPI spec

## 4. Testing
- [ ] 4.1 Update unit tests for new response shapes
- [ ] 4.2 Add tests for rate limit info in responses
- [ ] 4.3 Test backwards compatibility (if maintaining old shapes)
- [ ] 4.4 Integration tests for all refactored endpoints

## 5. Documentation
- [ ] 5.1 Update OpenAPI spec with new response schemas
- [ ] 5.2 Document rate limit behavior for each endpoint
- [ ] 5.3 Create migration guide if breaking changes introduced
- [ ] 5.4 Update API design guidelines with standard response pattern

## 6. Client Updates
- [ ] 6.1 Update mobile app to handle new response shapes
- [ ] 6.2 Update web app to handle new response shapes
- [ ] 6.3 Add rate limit UI feedback (countdown timers, etc.)
- [ ] 6.4 Test all auth flows end-to-end
