# Quick Test Guide - Mock Infrastructure Fix

## One-Command Test

```bash
cd /Users/danielzeddr/PetForce/apps/web && ./test-mock-fix.sh
```

This will:

1. Clean environment (kill old dev servers)
2. Verify configuration files
3. Run the registration test
4. Report success or failure

## What to Look For

### Success Indicators

**Console Output**:

```
🔍 Mock intercepted signup request for: test@example.com
```

**Timing**:

- Test completes in 2-5 seconds
- NOT 10+ seconds

**No Errors**:

- No timeout errors
- No "Failed to fetch" errors
- No rate limit errors

### Failure Indicators

**Console Shows**:

- Real Supabase URL in network errors
- Timeout errors after 10+ seconds
- No mock interception message

**What This Means**:

- Browser still getting real URL from Vite
- Mocks not intercepting
- Need to debug configuration

## Manual Test (If Script Fails)

```bash
cd /Users/danielzeddr/PetForce/apps/web

# Step 1: Kill old servers
pkill -f "vite"
sleep 2

# Step 2: Run test
npx playwright test src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts --grep "successfully registers new user"
```

## Debug Mode (See Browser)

```bash
cd /Users/danielzeddr/PetForce/apps/web

npx playwright test src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts --grep "successfully registers new user" --headed --debug
```

Then:

1. Open browser DevTools
2. Go to Network tab
3. Look for Supabase API calls
4. Verify URL is: `https://test.supabase.co/...`

## Verify Configuration

```bash
# Check .env.test has mock URL
grep "VITE_SUPABASE_URL" /Users/danielzeddr/PetForce/apps/web/.env.test

# Expected: VITE_SUPABASE_URL=https://test.supabase.co
```

```bash
# Check playwright.config.ts has env injection
grep -A 5 "env:" /Users/danielzeddr/PetForce/apps/web/playwright.config.ts

# Expected: Should show VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

## Troubleshooting

### Port 3000 Already in Use

```bash
lsof -i :3000
kill -9 <PID>
```

### Still Getting Real URL

1. Check if `.env` file exists and has real URL
2. Verify `playwright.config.ts` has `env` object in `webServer`
3. Check that `env` object is INSIDE the `if (!process.env.CI)` block
4. Restart test completely (kill all node processes)

### Mocks Still Don't Intercept

1. Verify `.env.test` URL matches mock pattern in test-helpers.ts
2. Check that `setupMocks(page)` is called before navigation
3. Look for console message: "Supabase credentials found - E2E tests will use real API"
   - If you see this, mocks are disabled
   - Verify `shouldUseMocks()` returns true

## Next Steps After Success

1. Mark P0 infrastructure fix as complete
2. Run all E2E tests to verify fix is universal
3. Update remaining P0 issues (implementation bugs)
4. Report back to team

## Files Changed

- `/Users/danielzeddr/PetForce/apps/web/playwright.config.ts`
  - Added `env` injection to `webServer` config

## Documentation

- Full technical details: `/Users/danielzeddr/PetForce/apps/web/docs/MOCK_INFRASTRUCTURE_FIX.md`
- Verification guide: `/Users/danielzeddr/PetForce/apps/web/MOCK_FIX_VERIFICATION.md`

---

**Fix Status**: Implemented ✓
**Ready for Validation**: Yes
**Validator**: Tucker (Senior QA Engineer)
**Date**: 2026-01-28
