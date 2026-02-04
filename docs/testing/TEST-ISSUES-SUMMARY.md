# Test Issues Summary - Registration Loop Problem

**Date**: 2026-02-04  
**Status**: ACTIVE INVESTIGATION  
**Impact**: 2 tests failing, blocking CI/CD

---

## Quick Summary

Tests are getting stuck on the registration form instead of navigating to the verification page. The form fills correctly, button is clicked, but navigation doesn't happen.

### Failed Tests

1. `unified-auth-flow › Form Layout and Scrolling › Create Account button remains visible after filling form`
2. `unified-auth-flow › Accessibility and UX › error messages have proper ARIA live region`

### Visual Evidence

Screenshot (`test-failed-1.png`) shows:
- Sign Up tab is active
- Email field filled: `test@example.com`
- Password field filled: `TestP@ssw0rd123!` (shows "Strong" indicator)
- Confirm password filled: `TestP@ssw0rd123!`
- Create Account button visible
- Page URL: `http://localhost:3000/auth`
- Expected URL: `http://localhost:3000/auth/verify-pending?email=...`

---

## Root Causes

### 1. setTimeout Race Condition (CRITICAL)

**Location**: `apps/web/src/features/auth/components/EmailPasswordForm.tsx:97-99`

```typescript
setTimeout(() => {
  navigate(`/auth/verify-pending?email=${encodeURIComponent(email)}`);
}, 100);
```

**Problem**: Navigation happens 100ms after success, but test doesn't wait properly.

### 2. Stacked Animation Delays

- Tab animation: 200ms
- Form animation: 300ms (Framer Motion)
- Success message animation: 300ms
- Navigation delay: 100ms
- Mock API delay: 500ms

**Total**: 1400ms of artificial delays stacking up

### 3. Selector Inconsistency

Three different ways to select the password field:
- `getByRole('textbox', { name: 'Password*', exact: true })`
- `getByLabel('Password', { exact: false }).first()`
- `getByLabel('Password', { exact: true })`

### 4. Success Message Before Navigation

Component sets success message state, triggers animation, then navigates 100ms later. Test may check URL during this transition.

---

## Immediate Fixes

### Fix 1: Remove setTimeout (5 minutes)

**File**: `apps/web/src/features/auth/components/EmailPasswordForm.tsx`

**Change lines 92-106 from**:
```typescript
if (result.success) {
  if (result.confirmationRequired) {
    setSuccessMessage('Thank you for registering!...');
    setTimeout(() => {
      navigate(`/auth/verify-pending?email=${encodeURIComponent(email)}`);
    }, 100);
  }
}
```

**To**:
```typescript
if (result.success) {
  if (result.confirmationRequired) {
    // Navigate immediately with state
    navigate(`/auth/verify-pending?email=${encodeURIComponent(email)}`, {
      state: { 
        email,
        message: 'Thank you for registering! Please check your email.'
      }
    });
  }
}
```

**Impact**: Removes race condition, tests will pass immediately

### Fix 2: Proper Navigation Waiting (2 minutes)

**File**: `apps/web/src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts`

**Change lines 214-218 from**:
```typescript
await page.getByRole('button', { name: 'Create account' }).click();

await expect(page).toHaveURL(/\/auth\/verify-pending/, { timeout: 10000 });
```

**To**:
```typescript
await Promise.all([
  page.waitForURL(/\/auth\/verify-pending/, { timeout: 10000 }),
  page.getByRole('button', { name: 'Create account' }).click(),
]);
```

**Impact**: Synchronized click and navigation wait

### Fix 3: Reduce Mock Delay (1 minute)

**File**: `apps/web/src/features/auth/__tests__/e2e/test-helpers.ts`

**Change line 47 from**:
```typescript
await new Promise(resolve => setTimeout(resolve, 500));
```

**To**:
```typescript
const delay = process.env.TEST_SLOW_MOCKS === 'true' ? 500 : 50;
await new Promise(resolve => setTimeout(resolve, delay));
```

**Impact**: Tests run 450ms faster per mock call

---

## Testing After Fixes

```bash
# Run the specific failing tests
npx playwright test unified-auth-flow.spec.ts -g "Create Account button remains visible"
npx playwright test unified-auth-flow.spec.ts -g "error messages have proper ARIA"

# Run all auth tests
npx playwright test unified-auth-flow.spec.ts

# Run in UI mode to verify visually
npm run test:e2e:ui
```

---

## Long-term Improvements

### Priority 2 (This Week)

1. **Standardize selectors** - Create `Selectors` helper object
2. **Remove animation waits** - Use visibility checks instead of `waitForTimeout`
3. **Unified mock strategy** - Environment variable for mock/real API

### Priority 3 (This Month)

4. **Page Object pattern** - Move test logic to helper functions
5. **Better test data** - Centralized fixtures
6. **Flakiness tracking** - Monitor test reliability metrics

---

## File Reference

### Critical Files

| File | Issue | Fix |
|------|-------|-----|
| `EmailPasswordForm.tsx` | setTimeout causing race | Remove setTimeout |
| `unified-auth-flow.spec.ts` | Not waiting for navigation | Use Promise.all |
| `test-helpers.ts` | Mock delay too long | Reduce to 50ms |

### Documentation

| File | Purpose |
|------|---------|
| `PLAYWRIGHT-TESTING-PLAYBOOK.md` | Comprehensive guide (this analysis) |
| `TEST-ISSUES-SUMMARY.md` | Quick reference (this doc) |
| `README.md` | Full E2E test documentation |
| `QUICK_START.md` | Quick start guide |

---

## Success Criteria

- [ ] Both failing tests pass
- [ ] All 29 tests pass
- [ ] Tests complete in <2 minutes
- [ ] No flaky failures (run 3x to verify)
- [ ] CI/CD pipeline green

---

## Notes

### Why setTimeout Was Added

Looking at git history, the 100ms delay was added to "allow screenshot" - likely for debugging purposes. This is a common anti-pattern in tests.

### Why Mocks Have 500ms Delay

Comment says "to allow loading states to be visible" - but this makes tests slow. Loading states should be tested explicitly, not by adding delays everywhere.

### Why Multiple Selector Styles

Tests evolved over time. Different developers used different selector patterns. Need to standardize.

---

## Contact

**Issue Owner**: Tucker (QA Guardian)  
**For Questions**: See `PLAYWRIGHT-TESTING-PLAYBOOK.md`  
**Full Analysis**: `docs/testing/PLAYWRIGHT-TESTING-PLAYBOOK.md` (31KB document)

---

**Tucker's Take**:

This is a textbook example of timing-based flakiness. The code works fine manually because humans are slow. Tests are fast and expose the race conditions. Fix: Remove artificial delays, use proper waiting mechanisms, and trust Playwright's auto-waiting.

The fix is simple: Navigate immediately, let React Router and Playwright handle the transitions. Don't try to outsmart the framework with setTimeout.

---

*Last Updated: 2026-02-04*
