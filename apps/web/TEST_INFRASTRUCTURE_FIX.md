# Test Infrastructure Fix - Summary

## Problem

E2E tests were hitting the REAL Supabase API instead of using mocks, causing:

- "Email rate limit exceeded" errors
- Unreliable test execution
- Cannot validate navigation and loading state fixes
- CI/CD instability

**Root Cause**: Environment variable mismatch

- Production `.env` contains: `VITE_SUPABASE_URL=https://pudipylsmvhccctzqezg.supabase.co`
- Test mocks expect: `https://test.supabase.co`
- URL mismatch prevented mock interception

## Solution

Created test-specific environment configuration that forces Playwright tests to use mock URL.

### Files Created

#### 1. `/apps/web/.env.test`

Test environment configuration file with:

- `VITE_SUPABASE_URL=https://test.supabase.co` (matches mock pattern)
- `VITE_SUPABASE_ANON_KEY=mock-anon-key-for-testing-only` (test key)
- `NODE_ENV=test` (ensures test mode)

This file is committed to git (contains no secrets, only mock URLs).

### Files Modified

#### 2. `/apps/web/playwright.config.ts`

Added dotenv loading at the top:

```typescript
import * as dotenv from "dotenv";
import * as path from "path";

// Load test environment variables to ensure mocks intercept API calls
dotenv.config({ path: path.resolve(__dirname, ".env.test") });
```

This ensures Playwright loads `.env.test` before running tests.

### Files Verified (No Changes Needed)

#### 3. `/apps/web/src/features/auth/__tests__/e2e/test-helpers.ts`

Already correctly configured to intercept `https://test.supabase.co` URLs:

```typescript
const supabaseTestUrl = "https://test.supabase.co";
await page.route(`${supabaseTestUrl}/auth/v1/**`, async (route: Route) => {
  // Mock responses
});
```

#### 4. `/.gitignore`

Already configured to:

- Allow `.env.test` to be committed (line 30 only ignores `.env.test.local`)
- Exclude `.env` and other local env files

## Verification

### Configuration Verification

```bash
cd /Users/danielzeddr/PetForce/apps/web

# Verify environment variables load
node -e "require('dotenv').config({ path: '.env.test' }); console.log(process.env.VITE_SUPABASE_URL)"
# Should output: https://test.supabase.co
```

### Test Verification

```bash
cd /Users/danielzeddr/PetForce/apps/web

# Run a single test to verify mocks work
npx playwright test src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts --grep "successfully registers new user"

# Expected: No rate limit errors, mocks intercept all API calls
```

## Expected Behavior After Fix

1. Playwright loads `.env.test` before running tests
2. `VITE_SUPABASE_URL` is set to `https://test.supabase.co`
3. test-helpers.ts mocks intercept all `https://test.supabase.co` API calls
4. No requests reach real Supabase instance
5. No rate limit errors
6. Tests run reliably with mock data
7. Tucker can validate all P0 fixes

## Technical Details

### Why This Works

1. **Environment Loading**: Playwright config loads `.env.test` using dotenv
2. **URL Matching**: Mock URL (`https://test.supabase.co`) matches what Vite will use
3. **Route Interception**: Playwright's `page.route()` intercepts all matching URLs
4. **Mock Responses**: test-helpers.ts provides realistic mock responses
5. **No Network Calls**: All API calls are handled by mocks, never reach network

### Configuration Hierarchy

When running tests:

1. `.env.test` loads first (via Playwright config)
2. Sets `VITE_SUPABASE_URL=https://test.supabase.co`
3. Vite builds app with this URL
4. test-helpers.ts intercepts all `https://test.supabase.co` requests
5. Mock responses returned immediately

### Git Strategy

`.env.test` is committed because:

- Contains no secrets (only mock URLs)
- All developers need same test configuration
- CI/CD needs consistent test environment
- Makes setup easier for new developers

`.env.test.local` is gitignored for:

- Developer-specific test overrides
- Local debugging configurations
- Per-machine customizations

## Dependencies

Already installed:

- `dotenv` (via Expo dependency tree)
- `@playwright/test`

No additional installations required.

## Success Criteria

- [x] `.env.test` file created with mock URL
- [x] Playwright config loads `.env.test`
- [x] Mock URL matches test-helpers.ts pattern
- [x] Git configured to commit `.env.test`
- [ ] Test run shows no rate limit errors (awaiting Tucker's verification)
- [ ] Mocks successfully intercept all API calls (awaiting Tucker's verification)
- [ ] All P0 fixes validated (awaiting Tucker's test run)

## Next Steps for Tucker

1. Pull latest changes
2. Run auth tests: `npx playwright test src/features/auth/__tests__/e2e/`
3. Verify no "email rate limit exceeded" errors
4. Check console logs show "Mock intercepted" messages
5. Validate all P0 fixes work as expected
6. Update test results in P0 tracking

## Rollback Plan

If this causes issues:

```bash
# Revert Playwright config
git checkout HEAD -- apps/web/playwright.config.ts

# Remove .env.test
rm apps/web/.env.test

# Tests will use production URL (not recommended)
```

## Documentation

This fix is documented in:

- This file: `/apps/web/TEST_INFRASTRUCTURE_FIX.md`
- Inline comments in `.env.test`
- Inline comments in `playwright.config.ts`

---

**Fixed by**: Engrid (Senior Software Engineer)
**Date**: 2026-01-28
**Issue**: Test infrastructure hitting real API instead of mocks
**Solution**: Created `.env.test` with mock URL, updated Playwright config
