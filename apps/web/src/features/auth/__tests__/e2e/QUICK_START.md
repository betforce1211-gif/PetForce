# E2E Tests - Quick Start Guide

Tucker's fast-track guide to running and understanding the E2E tests.

## 30-Second Start

```bash
# From /apps/web directory

# Run all E2E tests
npm run test:e2e

# Run with UI (interactive, great for first time)
npm run test:e2e:ui

# Run only the critical duplicate email test
npx playwright test unified-auth-flow.spec.ts -g "CRITICAL"
```

## What Gets Tested

### Unified Auth Flow (NEW - Most Important)

The tab-based `/auth` page:

✅ **Tab Navigation**
- Sign In is default
- Can switch to Sign Up
- Can switch back

✅ **Duplicate Email Detection** (CRITICAL)
- Error appears when email already registered
- Error says "This email is already registered"
- "Sign in" link appears and works
- "Reset password" link appears and works

✅ **New User Registration**
- Can register with new email
- Redirects to verification page
- Email shown in verification page

✅ **Password Validation**
- Weak passwords flagged
- Strong passwords accepted
- Mismatch detection works
- Can toggle password visibility

✅ **Form Layout**
- "Create Account" button always visible
- No scrolling required
- Works on mobile

✅ **Accessibility**
- ARIA attributes correct
- Error messages announced
- Labels present

## Run Specific Tests

```bash
# Just duplicate email test (the important one)
npx playwright test -g "duplicate email"

# Just tab navigation
npx playwright test -g "Tab Navigation"

# Just password validation
npx playwright test -g "Password Validation"

# Just form layout tests
npx playwright test -g "Form Layout"

# Just accessibility tests
npx playwright test -g "Accessibility"
```

## Debug a Test

```bash
# Run in debug mode (pauses, step through)
npx playwright test unified-auth-flow.spec.ts --debug

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed
```

## Read Test Results

### All Passing
```
✓ defaults to Sign In tab (543ms)
✓ switches to Sign Up tab when clicked (421ms)
✓ CRITICAL: shows error when registering with existing email (892ms)
✓ successfully registers new user (1.2s)

4 passed (3s)
```

### Some Failing
```
✓ defaults to Sign In tab (543ms)
✗ CRITICAL: shows error when registering with existing email (892ms)
  Error: expected element to be visible
  
1 failed, 1 passed (1s)
```

The failed test tells you exactly what went wrong.

## Why This Matters

### Before These Tests
1. Bug happened (duplicate email error not shown)
2. User got confused
3. User contacted support
4. Dev team found bug
5. Fixed bug
6. Bug could come back later

### After These Tests
1. Bug would be caught in CI before merge
2. Test fails → PR blocked
3. Fix the bug → test passes
4. Merge with confidence
5. Bug can never come back (regression caught)

## Test Files

| File | What It Tests | Priority |
|------|---------------|----------|
| `unified-auth-flow.spec.ts` | Tab-based `/auth` page | 🔴 HIGH |
| `registration-flow.spec.ts` | Legacy registration flow | 🟡 MEDIUM |
| `login-flow.spec.ts` | Login flow | 🟡 MEDIUM |
| `password-reset-flow.spec.ts` | Password reset | 🟡 MEDIUM |
| `test-helpers.ts` | Reusable utilities | N/A |

## Common Commands

```bash
# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in browser
npm run test:e2e:headed

# Run one file
npx playwright test unified-auth-flow.spec.ts

# Run one test
npx playwright test -g "CRITICAL"

# Debug
npx playwright test --debug

# See report
npx playwright show-report

# Update snapshots (if using visual tests)
npm run test:visual:update
```

## What To Do When Tests Fail

### Step 1: Read the Error
```
Error: expected element to be visible
  at page.getByRole('alert')
```

This tells you: an alert should be visible but wasn't.

### Step 2: Run in UI Mode
```bash
npm run test:e2e:ui
```

Watch the test run step-by-step. See where it fails.

### Step 3: Check Your Code
- Did you change the alert component?
- Did you change the error handling?
- Did you change the route?

### Step 4: Fix or Update
- **If it's a bug**: Fix your code
- **If the test is wrong**: Update the test

### Step 5: Verify
```bash
npm run test:e2e
```

All tests should pass.

## CI/CD Integration

Tests run automatically on:
- Every PR (blocks merge if failing)
- Every commit to main
- Before every deployment

**Golden Rule**: Never merge a PR with failing tests.

## Need Help?

1. Read the full README: `README.md`
2. Check Playwright docs: https://playwright.dev/
3. Run in debug mode: `--debug`
4. Run in UI mode: `--ui`
5. Ask Tucker (the QA Guardian agent)

---

Tucker says: "Tests are your safety net. Trust them, maintain them, never skip them." ✅
