# Mock Infrastructure Fix - Validation Checklist

**Validator**: Tucker (Senior QA Engineer)
**Date**: 2026-01-28
**Fix**: Environment variable injection for Vite dev server

---

## Pre-Validation Setup

- [ ] Read `FIX_SUMMARY.md` for overview
- [ ] Understand the problem: Vite was using `.env` instead of `.env.test`
- [ ] Review modified file: `playwright.config.ts` (lines 53-60)

---

## Validation Steps

### Step 1: Quick Test

```bash
cd /Users/danielzeddr/PetForce/apps/web
./test-mock-fix.sh
```

**Expected**: Script reports success, shows mock interception messages

- [ ] Script runs without errors
- [ ] Console shows: `🔍 Mock intercepted signup request`
- [ ] No timeout errors
- [ ] Test completes in < 5 seconds

### Step 2: Manual Verification

```bash
cd /Users/danielzeddr/PetForce/apps/web
pkill -f "vite" || true
npx playwright test src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts --grep "successfully registers new user"
```

**Expected**: Same results as quick test

- [ ] Mock interception messages appear
- [ ] No timeout errors
- [ ] Fast execution (< 5 seconds)

### Step 3: Configuration Check

```bash
# Verify .env.test has mock URL
grep "VITE_SUPABASE_URL" .env.test
```

**Expected**: `VITE_SUPABASE_URL=https://test.supabase.co`

- [ ] `.env.test` contains mock URL
- [ ] Mock URL is `https://test.supabase.co`

```bash
# Verify playwright.config.ts has env injection
grep -A 5 "env:" playwright.config.ts
```

**Expected**: Shows `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in env object

- [ ] `playwright.config.ts` has `env` object
- [ ] `env` object is inside `webServer` config
- [ ] `VITE_SUPABASE_URL` is injected
- [ ] `VITE_SUPABASE_ANON_KEY` is injected
- [ ] `NODE_ENV: 'test'` is set

### Step 4: Debug Mode (Optional)

```bash
npx playwright test src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts --grep "successfully registers new user" --headed --debug
```

**In Browser**:

- [ ] Network tab shows requests to `https://test.supabase.co/...`
- [ ] NOT requests to real Supabase URL
- [ ] Requests complete instantly (< 100ms)
- [ ] Console shows mock interception messages

---

## Success Criteria

### Must Have (P0)

- [ ] Mock interception console messages appear
- [ ] No timeout errors
- [ ] Test completes in < 5 seconds
- [ ] No real API calls in network tab

### Should Have

- [ ] Test script executes cleanly
- [ ] Configuration files validated
- [ ] Documentation is clear and complete

### Nice to Have

- [ ] Can run multiple tests in sequence without issues
- [ ] Dev server restarts cleanly between test runs

---

## Failure Scenarios

### If Mock Interception Doesn't Appear

**Possible Causes**:

1. Old dev server still running with `.env` config
2. `webServer.env` not being injected properly
3. `.env.test` not being loaded by dotenv

**Debug Steps**:

1. Kill all node processes: `pkill -f "node"`
2. Verify `.env.test` exists and has correct values
3. Check `playwright.config.ts` has `env` object in correct location
4. Add debug logging to see what Vite receives

### If Timeout Errors Still Occur

**Possible Causes**:

1. Mocks not set up correctly in test file
2. Mock URL pattern doesn't match request URL
3. Real API credentials being used

**Debug Steps**:

1. Check `shouldUseMocks()` returns true
2. Verify mock URL pattern matches in `test-helpers.ts`
3. Check for console message about real API usage

### If Tests Run Slow (> 10 seconds)

**Possible Causes**:

1. Requests going to real API
2. Network timeouts before mocks intercept
3. Dev server slow to start

**Debug Steps**:

1. Run in headed mode to see network tab
2. Check request URLs in network tab
3. Verify mock responses are instant

---

## Post-Validation Actions

### If Successful

- [ ] Mark P0 infrastructure fix as COMPLETE
- [ ] Update test status in project tracker
- [ ] Notify team that mock infrastructure is working
- [ ] Proceed with remaining P0 implementation fixes
- [ ] Document any additional observations

### If Unsuccessful

- [ ] Document exact failure mode
- [ ] Capture screenshots/console output
- [ ] Share findings with Engrid for debugging
- [ ] Try alternative solution (see `MOCK_FIX_VERIFICATION.md`)

---

## Notes Section

**Observations**:

```
[Tucker's notes here]
```

**Issues Found**:

```
[Any issues encountered during validation]
```

**Additional Testing**:

```
[Other tests run to verify the fix]
```

---

## Sign-Off

- [ ] Validation completed
- [ ] Results documented
- [ ] Team notified

**Validated by**: Tucker (Senior QA Engineer)
**Date**: ******\_******
**Status**: [ ] PASS / [ ] FAIL / [ ] NEEDS REVISION
**Comments**:

```
[Final comments]
```

---

## Reference Documentation

- **Quick Guide**: `QUICK_TEST_GUIDE.md`
- **Detailed Verification**: `MOCK_FIX_VERIFICATION.md`
- **Technical Details**: `docs/MOCK_INFRASTRUCTURE_FIX.md`
- **Summary**: `FIX_SUMMARY.md`
- **Test Script**: `./test-mock-fix.sh`

---

**Ready for Tucker's validation!**
