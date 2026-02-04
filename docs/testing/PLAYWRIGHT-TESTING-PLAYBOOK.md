# Playwright Testing Playbook
## Tucker's Comprehensive Guide to E2E Testing at PetForce

**Version**: 1.0  
**Last Updated**: 2026-02-04  
**Maintainer**: Tucker (QA Guardian)

---

## Executive Summary

This playbook documents our Playwright E2E testing strategy, current issues with the auth flow tests (specifically the registration loop problem), and best practices to ensure reliable, maintainable tests.

### Current Critical Issues

1. **Registration Loop**: Tests getting stuck in registration form instead of navigating to verify-pending page
2. **Timing Races**: Multiple setTimeout/animation delays causing flaky tests
3. **Selector Inconsistencies**: Different selectors used for the same elements across tests
4. **Mock/Real API Confusion**: Unclear when tests use mocks vs real API

---

## Table of Contents

1. [Current Test Architecture](#current-test-architecture)
2. [The Registration Loop Problem](#the-registration-loop-problem)
3. [Root Cause Analysis](#root-cause-analysis)
4. [Recommended Fixes](#recommended-fixes)
5. [Best Practices](#best-practices)
6. [Testing Patterns](#testing-patterns)
7. [Common Pitfalls](#common-pitfalls)
8. [Debugging Guide](#debugging-guide)

---

## Current Test Architecture

### Test Structure

```
apps/web/
├── src/features/auth/__tests__/e2e/
│   ├── unified-auth-flow.spec.ts       # Tab-based auth (MAIN)
│   ├── duplicate-email-real-api.spec.ts # Real API duplicate test
│   ├── test-helpers.ts                  # Utilities and mocks
│   ├── global-setup.ts                  # Test environment setup
│   ├── README.md                        # Full documentation
│   └── QUICK_START.md                   # Quick reference
├── playwright.config.ts                 # Playwright configuration
└── test-results/                        # Test artifacts
```

### Key Files

| File | Purpose | Lines of Code | Critical? |
|------|---------|---------------|-----------|
| `unified-auth-flow.spec.ts` | Main auth tests | 518 | YES |
| `test-helpers.ts` | Mocking & utilities | 445 | YES |
| `EmailPasswordForm.tsx` | Form component | 314 | YES |
| `auth-api.ts` | API registration logic | 693 | YES |

### Test Coverage

```
Unified Auth Flow Tests:
├── Tab Navigation (6 tests)
├── Duplicate Email Detection (3 tests) ⚠️ FAILING
├── New User Registration (1 test) ⚠️ FAILING
├── Password Validation (5 tests)
├── Form Layout (4 tests)
├── Accessibility (4 tests)
└── Edge Cases (6 tests)

Total: 29 tests
Status: 2 failing (registration flow)
```

---

## The Registration Loop Problem

### Symptoms

**Test**: "Create Account button remains visible after filling form"  
**Expected**: Form submits → navigates to `/auth/verify-pending`  
**Actual**: Form fills → button clicked → stays on `/auth` page  
**Screenshot**: Shows Sign Up tab with filled form (email, password, confirm password all populated)

### Failed Test Output

```
Test: unified-auth-flow › Form Layout and Scrolling › 
      Create Account button remains visible after filling form

Expected: page.url() to contain '/verify-pending'
Actual: page.url() = 'http://localhost:3000/auth'

Screenshot: test-failed-1.png shows form with:
- Sign Up tab selected
- Email: test@example.com
- Password: TestP@ssw0rd123! (filled, shows "Strong")
- Confirm password: TestP@ssw0rd123! (filled)
- Create Account button visible
```

### Impact

- **2 tests failing**: Form layout test + ARIA live region test
- **Blocks CI/CD**: Cannot merge PRs with failing tests
- **False negatives**: Tests fail even though feature works manually
- **Developer friction**: Uncertainty about whether code or tests are broken

---

## Root Cause Analysis

### Issue 1: Navigation Timing Race Condition

**Location**: `EmailPasswordForm.tsx` lines 92-106

```typescript
const result = await registerWithPassword({ email, password });

if (result.success) {
  if (result.confirmationRequired) {
    setSuccessMessage('Thank you for registering!...');
    // ⚠️ PROBLEM: Arbitrary 100ms delay
    setTimeout(() => {
      navigate(`/auth/verify-pending?email=${encodeURIComponent(email)}`);
    }, 100);
  }
}
```

**Why it's problematic:**

1. **Race condition**: Test clicks button, but navigation happens 100ms later
2. **Animation overlap**: Component has 300ms form animation (Framer Motion)
3. **Test timeout**: Test expects immediate navigation, doesn't wait properly
4. **Unpredictable**: Real API might take >100ms, causing test to check URL before navigation

### Issue 2: Multiple Animation Delays Stack

**Locations across test files:**

```typescript
// unified-auth-flow.spec.ts line 117
await page.waitForTimeout(400); // 200ms tab + 300ms form animation

// EmailPasswordForm.tsx line 124
transition={{ duration: 0.3 }} // 300ms animation

// Component setTimeout line 98
setTimeout(() => navigate(...), 100); // 100ms artificial delay
```

**Total delay chain**: 400ms (test wait) + 300ms (animation) + 100ms (setTimeout) + API time = 800ms+

**Problem**: Tests assume these happen sequentially but they may overlap or vary.

### Issue 3: Selector Inconsistency

**Password field selectors across tests:**

```typescript
// unified-auth-flow.spec.ts line 128
page.getByRole('textbox', { name: 'Password*', exact: true })

// duplicate-email-real-api.spec.ts line 44
page.getByLabel('Password', { exact: false }).first()

// test-helpers.ts line 315
page.getByLabel('Password', { exact: true })
```

**Why it matters**: Different selectors may behave differently with Framer Motion animations, ARIA attributes, or input type changes.

### Issue 4: Mock API Response Timing

**Location**: `test-helpers.ts` lines 46-47

```typescript
// Add realistic delay to allow loading states to be visible
await new Promise(resolve => setTimeout(resolve, 500));
```

**The paradox**:
- Mock adds 500ms delay to "be realistic"
- Component adds 100ms delay "to allow screenshot"
- Test waits 400ms for "animation to complete"
- **Total**: 1000ms+ of artificial waiting

### Issue 5: Success Message Before Navigation

**Location**: `EmailPasswordForm.tsx` lines 94-99

```typescript
setSuccessMessage('Thank you for registering!...');
// Message renders (triggers animation)
setTimeout(() => {
  navigate(...); // Navigation 100ms later
}, 100);
```

**Problem sequence**:
1. Success message state set (causes re-render)
2. AnimatePresence triggers 300ms enter animation
3. setTimeout waits 100ms
4. Navigate happens during animation
5. Test checks URL before navigation completes

### Issue 6: Mocking Strategy Confusion

**Two test files exist for same scenario:**

1. `unified-auth-flow.spec.ts` - Uses mocks (via test-helpers.ts)
2. `duplicate-email-real-api.spec.ts` - Uses real API (explicitly no mocks)

**Configuration check**: `test-helpers.ts` line 216-218

```typescript
shouldUseMocks(): boolean {
  return !process.env.VITE_SUPABASE_URL || 
         process.env.VITE_SUPABASE_URL === 'https://test.supabase.co';
}
```

**Confusion points**:
- When do mocks activate?
- Does dev server have real credentials?
- Are tests using mock or real API?
- Different timing for mock vs real API responses

---

## Recommended Fixes

### Priority 1: Remove Arbitrary setTimeout (CRITICAL)

**Fix**: Replace setTimeout navigation with immediate navigation after state update

**File**: `apps/web/src/features/auth/components/EmailPasswordForm.tsx`

**Current code (lines 92-106)**:
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

**Recommended fix**:
```typescript
if (result.success) {
  if (result.confirmationRequired) {
    // Navigate immediately - React will handle the transition
    navigate(`/auth/verify-pending?email=${encodeURIComponent(email)}`, {
      state: { 
        email,
        message: 'Thank you for registering! Please check your email.'
      }
    });
  }
}
```

**Why this works**:
- React Router handles navigation transitions smoothly
- No artificial delays
- Tests can use `await expect(page).toHaveURL()` which properly waits
- Success message shown on destination page (better UX)

**Impact**: Fixes 2 failing tests, removes race condition

### Priority 2: Standardize Selectors

**Fix**: Use consistent, semantic selectors across all tests

**Create selector constants** in `test-helpers.ts`:

```typescript
export const Selectors = {
  // Form fields
  emailInput: () => page.getByLabel('Email address', { exact: true }),
  passwordInput: () => page.getByLabel('Password', { exact: true }),
  confirmPasswordInput: () => page.getByLabel('Confirm password', { exact: true }),
  
  // Buttons
  createAccountButton: () => page.getByRole('button', { name: 'Create account', exact: true }),
  signInButton: () => page.getByRole('button', { name: 'Sign in', exact: true }),
  
  // Tabs
  signInTab: () => page.getByRole('tab', { name: 'Sign In' }),
  signUpTab: () => page.getByRole('tab', { name: 'Sign Up' }),
  
  // Messages
  errorAlert: () => page.getByRole('alert'),
  successMessage: () => page.getByRole('status'),
};
```

**Update all tests to use these selectors**:

```typescript
// Before:
await page.getByLabel('Password', { exact: false }).first().fill(password);

// After:
await Selectors.passwordInput().fill(password);
```

**Why this works**:
- Single source of truth for selectors
- Easy to update if component changes
- Self-documenting code
- Reduces selector-related flakiness

### Priority 3: Proper Navigation Waiting

**Fix**: Use Playwright's built-in navigation waiting instead of arbitrary timeouts

**File**: `unified-auth-flow.spec.ts`

**Current code (lines 215-218)**:
```typescript
await page.getByRole('button', { name: 'Create account' }).click();

// Assert redirects to verification pending page
await expect(page).toHaveURL(/\/auth\/verify-pending/, { timeout: 10000 });
```

**Recommended enhancement**:
```typescript
// Wait for navigation to complete
await Promise.all([
  page.waitForURL(/\/auth\/verify-pending/, { timeout: 10000 }),
  page.getByRole('button', { name: 'Create account' }).click(),
]);

// Additional verification
await expect(page).toHaveURL(new RegExp(encodeURIComponent(email)));
await expect(page.getByText(/check your email/i)).toBeVisible();
```

**Why this works**:
- `Promise.all` ensures click and navigation are synchronized
- `waitForURL` is more reliable than polling with expect
- Explicit timeout makes test intent clear

### Priority 4: Remove Animation Waits Where Possible

**Fix**: Use visibility checks instead of time-based waits

**Current pattern (everywhere)**:
```typescript
await page.getByRole('tab', { name: 'Sign Up' }).click();
await page.waitForTimeout(400); // ⚠️ BAD: Arbitrary wait
await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
```

**Recommended pattern**:
```typescript
await page.getByRole('tab', { name: 'Sign Up' }).click();
// Wait for animation to complete by waiting for content visibility
await expect(page.getByRole('heading', { name: 'Join the Family' }))
  .toBeVisible({ timeout: 1000 }); // Content appears when animation finishes
```

**Why this works**:
- Test waits only as long as needed
- More resilient to animation timing changes
- Clearly documents what we're waiting for

### Priority 5: Unified Mock Strategy

**Fix**: Make mocking behavior explicit and consistent

**Create environment-based test configuration**:

```typescript
// test-helpers.ts
export const TestConfig = {
  useRealAPI: process.env.TEST_USE_REAL_API === 'true',
  
  async setupTestEnvironment(page: Page) {
    if (this.useRealAPI) {
      console.log('🔥 TESTS USING REAL API');
      // No mocking, just set up logging
      this.setupAPILogging(page);
    } else {
      console.log('🎭 TESTS USING MOCKED API');
      await ApiMocking.setupMocks(page);
    }
  },
  
  setupAPILogging(page: Page) {
    page.on('request', req => {
      if (req.url().includes('/auth/v1/')) {
        console.log(`→ ${req.method()} ${req.url()}`);
      }
    });
    page.on('response', res => {
      if (res.url().includes('/auth/v1/')) {
        console.log(`← ${res.status()} ${res.url()}`);
      }
    });
  },
};
```

**Update test files**:
```typescript
test.beforeEach(async ({ page }) => {
  await TestConfig.setupTestEnvironment(page);
  await page.goto('/auth');
});
```

**Run with real API**:
```bash
TEST_USE_REAL_API=true npm run test:e2e
```

**Why this works**:
- Clear, explicit configuration
- Single source of truth
- Easy to switch between mock/real for debugging
- Consistent logging across both modes

### Priority 6: Reduce Mock API Delay

**Fix**: Make mock responses fast by default

**File**: `test-helpers.ts` line 46-47

**Current**:
```typescript
// Add realistic delay to allow loading states to be visible
await new Promise(resolve => setTimeout(resolve, 500));
```

**Recommended**:
```typescript
// Fast response by default - use TEST_SLOW_MOCKS=true to add delays
const delay = process.env.TEST_SLOW_MOCKS === 'true' ? 500 : 50;
await new Promise(resolve => setTimeout(resolve, delay));
```

**Why this works**:
- Tests run faster (500ms saved per mock call)
- Can still test loading states when needed
- Default is fast and reliable

---

## Best Practices

### 1. Navigation Testing

**DO:**
```typescript
// Wait for navigation properly
await Promise.all([
  page.waitForURL('/expected-url'),
  page.click('button'),
]);

// Verify navigation completed
await expect(page).toHaveURL('/expected-url');
```

**DON'T:**
```typescript
// Arbitrary waits
await page.click('button');
await page.waitForTimeout(1000); // ⚠️ Flaky!
expect(page.url()).toContain('/expected-url');
```

### 2. Animation Handling

**DO:**
```typescript
// Wait for content that appears after animation
await page.click('tab');
await expect(page.locator('.content')).toBeVisible();
```

**DON'T:**
```typescript
// Hardcoded animation waits
await page.click('tab');
await page.waitForTimeout(300); // ⚠️ Breaks if animation changes
```

### 3. Form Submission

**DO:**
```typescript
// Fill form
await page.fill('[name="email"]', email);
await page.fill('[name="password"]', password);

// Submit and wait for response
await Promise.all([
  page.waitForResponse(res => res.url().includes('/auth/v1/signup')),
  page.click('button[type="submit"]'),
]);

// Verify outcome
await expect(page.getByRole('alert')).toBeVisible();
```

**DON'T:**
```typescript
// Submit without waiting
await page.click('button[type="submit"]');
await page.waitForTimeout(2000); // ⚠️ Hope it's done
```

### 4. Error Testing

**DO:**
```typescript
// Test the error, not the implementation
test('shows error for duplicate email', async ({ page }) => {
  await fillRegistrationForm(page, EXISTING_EMAIL, password);
  await page.click('button[type="submit"]');
  
  // Verify user-facing error
  await expect(page.getByRole('alert'))
    .toContainText('This email is already registered');
  
  // Verify helpful actions
  await expect(page.getByRole('button', { name: 'Sign in' }))
    .toBeVisible();
});
```

**DON'T:**
```typescript
// Test implementation details
test('calls API with email', async ({ page }) => {
  let apiCalled = false;
  page.on('request', req => {
    if (req.url().includes('signup')) apiCalled = true;
  });
  await page.click('button');
  expect(apiCalled).toBe(true); // ⚠️ Testing implementation
});
```

### 5. Selector Hierarchy

**Priority order (most to least resilient):**

1. **Semantic roles**: `page.getByRole('button', { name: 'Submit' })`
2. **Labels**: `page.getByLabel('Email address')`
3. **Test IDs**: `page.getByTestId('submit-button')`
4. **Text content**: `page.getByText('Submit')`
5. **CSS selectors**: `page.locator('button.submit')` (LAST RESORT)

### 6. Test Data Management

**DO:**
```typescript
// Generate unique test data
const testEmail = `test-${Date.now()}@example.com`;
const testUser = {
  email: testEmail,
  password: 'TestP@ssw0rd123!',
};
```

**DON'T:**
```typescript
// Hardcode test data
const testEmail = 'test@example.com'; // ⚠️ Conflicts in parallel runs
```

### 7. Test Independence

**DO:**
```typescript
test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Fresh setup for each test
    await page.goto('/auth');
  });
  
  test('scenario A', async ({ page }) => {
    // Completely independent
  });
  
  test('scenario B', async ({ page }) => {
    // Doesn't depend on scenario A
  });
});
```

**DON'T:**
```typescript
test.describe.serial('Feature', () => {
  test('scenario A', async ({ page }) => {
    await page.goto('/auth');
    await page.click('button');
    // Leave page in modified state
  });
  
  test('scenario B', async ({ page }) => {
    // ⚠️ Assumes scenario A ran first
    await page.click('next-button');
  });
});
```

---

## Testing Patterns

### Pattern 1: Page Object Model (Light)

While we don't use full Page Object Model, we use a similar pattern with test helpers.

**Helper pattern**:
```typescript
// test-helpers.ts
export const AuthPage = {
  async goto(page: Page) {
    await page.goto('/auth');
    await expect(page.getByRole('heading')).toBeVisible();
  },
  
  async switchToSignUp(page: Page) {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await expect(page.getByRole('heading', { name: 'Join the Family' }))
      .toBeVisible();
  },
  
  async fillRegistrationForm(page: Page, email: string, password: string) {
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
  },
  
  async submitRegistration(page: Page) {
    await page.getByRole('button', { name: 'Create account' }).click();
  },
  
  async expectError(page: Page, message: string | RegExp) {
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(message);
  },
};
```

**Usage in tests**:
```typescript
test('registration error handling', async ({ page }) => {
  await AuthPage.goto(page);
  await AuthPage.switchToSignUp(page);
  await AuthPage.fillRegistrationForm(page, EXISTING_EMAIL, 'Pass123!');
  await AuthPage.submitRegistration(page);
  await AuthPage.expectError(page, /already registered/i);
});
```

### Pattern 2: Test Fixtures

Create reusable test fixtures for common scenarios.

```typescript
// test-fixtures.ts
export const fixtures = {
  validUser: {
    email: () => `user-${Date.now()}@example.com`,
    password: 'TestP@ssw0rd123!',
  },
  
  existingUser: {
    email: 'existing@petforce.test',
    password: 'ExistingP@ss123!',
  },
  
  invalidPasswords: [
    'weak',
    '12345678',
    'nouppercasenumbers',
    'NoNumbers!',
  ],
};
```

### Pattern 3: Custom Matchers

Extend Playwright's expect with domain-specific matchers.

```typescript
// custom-matchers.ts
export async function toShowAuthError(locator: Locator, expectedMessage: string | RegExp) {
  const alert = locator.page().getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(expectedMessage);
  await expect(alert).toHaveClass(/bg-red/); // Error styling
  return { pass: true };
}

// Usage:
await expect(page).toShowAuthError(/already registered/i);
```

### Pattern 4: Test Contexts

Group related tests and share setup logic.

```typescript
test.describe('Duplicate Email Detection', () => {
  // Shared context setup
  test.beforeEach(async ({ page }) => {
    await TestConfig.setupTestEnvironment(page);
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await expect(page.getByRole('heading', { name: 'Join the Family' }))
      .toBeVisible();
  });

  // All tests share the setup above
  test('shows error message', async ({ page }) => { /* ... */ });
  test('provides sign-in link', async ({ page }) => { /* ... */ });
  test('provides reset password link', async ({ page }) => { /* ... */ });
});
```

---

## Common Pitfalls

### Pitfall 1: Race Conditions

**Symptom**: Test passes sometimes, fails other times

**Example**:
```typescript
// BAD: Race between click and navigation
await page.click('button');
expect(page.url()).toBe('/new-page'); // ⚠️ Might check before navigation
```

**Fix**:
```typescript
// GOOD: Wait for navigation explicitly
await Promise.all([
  page.waitForURL('/new-page'),
  page.click('button'),
]);
```

### Pitfall 2: Stale Element References

**Symptom**: "Element is not attached to the DOM"

**Example**:
```typescript
// BAD: Element reference becomes stale after re-render
const button = await page.$('button');
await page.click('.refresh');
await button.click(); // ⚠️ Element no longer exists
```

**Fix**:
```typescript
// GOOD: Query element fresh each time
await page.click('.refresh');
await page.locator('button').click(); // Fresh query
```

### Pitfall 3: Hardcoded Timeouts

**Symptom**: Tests are slow, still fail occasionally

**Example**:
```typescript
// BAD: Arbitrary wait
await page.waitForTimeout(3000);
```

**Fix**:
```typescript
// GOOD: Wait for specific condition
await page.waitForSelector('.loaded', { timeout: 5000 });
```

### Pitfall 4: Test Interdependence

**Symptom**: Tests pass individually but fail when run together

**Example**:
```typescript
// BAD: Tests share state
let userId;
test('creates user', async () => { userId = await createUser(); });
test('deletes user', async () => { await deleteUser(userId); }); // ⚠️ Depends on previous test
```

**Fix**:
```typescript
// GOOD: Each test is independent
test('creates user', async () => {
  const userId = await createUser();
  // Clean up within test
  await deleteUser(userId);
});
```

### Pitfall 5: Over-Mocking

**Symptom**: Tests pass but production is broken

**Example**:
```typescript
// BAD: Mock everything
await page.route('**/api/**', route => route.fulfill({ body: '{}' }));
```

**Fix**:
```typescript
// GOOD: Mock only what's necessary
await page.route('**/auth/v1/signup', mockSignupResponse);
// Let other API calls go through (or fail meaningfully)
```

### Pitfall 6: Testing Implementation Instead of Behavior

**Symptom**: Tests break with every refactor

**Example**:
```typescript
// BAD: Testing internal state
test('sets loading state', async () => {
  expect(component.state.isLoading).toBe(true); // ⚠️ Implementation detail
});
```

**Fix**:
```typescript
// GOOD: Testing user-visible behavior
test('shows loading spinner', async ({ page }) => {
  await page.click('button');
  await expect(page.locator('.spinner')).toBeVisible();
});
```

### Pitfall 7: Selector Brittleness

**Symptom**: Tests break when CSS classes change

**Example**:
```typescript
// BAD: Depends on implementation details
await page.click('.btn-primary.submit-form.mt-4'); // ⚠️ CSS-coupled
```

**Fix**:
```typescript
// GOOD: Semantic selector
await page.getByRole('button', { name: 'Submit' });
```

---

## Debugging Guide

### Debug Workflow

```
1. Test fails in CI/locally
   ├─→ Read error message
   │   ├─→ "Element not found" → Check selectors
   │   ├─→ "Timeout" → Check waiting logic
   │   └─→ "Unexpected value" → Check assertions
   │
   ├─→ Run with UI mode
   │   $ npm run test:e2e:ui
   │   └─→ Watch test execute step-by-step
   │
   ├─→ Run with debug mode
   │   $ npx playwright test --debug
   │   └─→ Pause and inspect at each step
   │
   ├─→ Add debugging logs
   │   console.log('Current URL:', page.url());
   │   await page.screenshot({ path: 'debug.png' });
   │
   └─→ Check test artifacts
       ├─→ Screenshot: test-results/*/test-failed-1.png
       ├─→ Video: test-results/*/video.webm
       └─→ Trace: test-results/*/trace.zip
```

### Useful Debug Commands

```bash
# Run single test with full output
npx playwright test -g "test name" --headed --debug

# Show browser while running
npm run test:e2e:headed

# Interactive UI mode
npm run test:e2e:ui

# Generate trace for failed tests
npx playwright test --trace on

# View trace
npx playwright show-trace test-results/trace.zip

# View last HTML report
npx playwright show-report

# Run with verbose console output
DEBUG=pw:api npx playwright test
```

### Adding Debug Info to Tests

```typescript
test('registration flow', async ({ page }) => {
  // Take screenshot at any point
  await page.screenshot({ path: 'debug-before-click.png' });
  
  // Log page state
  console.log('URL before:', page.url());
  console.log('Visible buttons:', await page.locator('button').count());
  
  // Pause execution (when running with --debug)
  await page.pause();
  
  // Log network activity
  page.on('request', req => console.log('→', req.method(), req.url()));
  page.on('response', res => console.log('←', res.status(), res.url()));
  
  // Continue test...
});
```

### Common Debug Patterns

#### Pattern: "Why isn't this element found?"

```typescript
// Check if element exists at all
const count = await page.locator('button').count();
console.log('Found', count, 'buttons');

// Check what selectors DO work
await page.locator('button').evaluateAll(buttons => 
  buttons.map(b => ({ text: b.textContent, id: b.id, class: b.className }))
).then(console.log);

// Take screenshot to see current state
await page.screenshot({ path: 'current-state.png', fullPage: true });
```

#### Pattern: "Why isn't navigation happening?"

```typescript
// Log navigation events
page.on('framenavigated', frame => {
  console.log('Navigated to:', frame.url());
});

// Check if there's a JavaScript error preventing navigation
page.on('pageerror', error => {
  console.error('Page error:', error);
});

// Wait and log URL changes
console.log('URL before click:', page.url());
await page.click('button');
await page.waitForTimeout(1000);
console.log('URL after click:', page.url());
```

#### Pattern: "Why is this timing out?"

```typescript
// Set longer timeout temporarily
await expect(page.locator('.element'))
  .toBeVisible({ timeout: 30000 }); // 30s instead of default 10s

// Check what's actually on the page
const html = await page.content();
console.log('Current HTML:', html.substring(0, 500));

// Check if page is still loading
const readyState = await page.evaluate(() => document.readyState);
console.log('Document ready state:', readyState);
```

### Interpreting Test Artifacts

#### Screenshot Analysis

```
test-failed-1.png shows:
- ✓ Form is rendered (elements visible)
- ✓ Fields are filled (can see values)
- ✓ Button is clickable (no disabled state)
- ✗ Still on /auth page (expected /verify-pending)
- ✗ No error message visible (maybe expected one?)

Conclusion: Navigation not happening OR error not being shown
```

#### Error Context File

The `error-context.md` file in test results shows:
- Page DOM snapshot
- Active elements
- ARIA structure
- Form state

Use this to understand what the page looked like at failure time.

---

## Appendix: Configuration Reference

### Playwright Config

```typescript
// playwright.config.ts
{
  testDir: './src/features/auth/__tests__/e2e',
  fullyParallel: false,     // Sequential (safer but slower)
  workers: 1,                // Single worker (avoids conflicts)
  timeout: 30000,            // 30s per test
  expect: { timeout: 10000 }, // 10s per assertion
  retries: 0,                // No retries (fail fast)
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
}
```

### Test Helper Config

```typescript
// ApiMocking.shouldUseMocks()
// Returns true when:
// - No VITE_SUPABASE_URL env var
// - VITE_SUPABASE_URL === 'https://test.supabase.co' (placeholder)

// Use real API:
$ VITE_SUPABASE_URL=https://real.supabase.co npm run test:e2e

// Use mocks (default):
$ npm run test:e2e
```

---

## Summary of Recommendations

### Immediate Actions (Priority 1)

1. **Remove `setTimeout` in EmailPasswordForm.tsx** - Navigate immediately after success
2. **Standardize selectors** - Create and use `Selectors` helper object
3. **Fix navigation waiting** - Use `Promise.all` with `waitForURL`

### Short-term Improvements (Priority 2)

4. **Remove animation waits** - Use visibility checks instead of `waitForTimeout`
5. **Unified mock strategy** - Make mock/real API explicit with environment variable
6. **Reduce mock delay** - Change 500ms to 50ms default

### Long-term Maintenance (Priority 3)

7. **Page Object pattern** - Gradually move test logic to helper functions
8. **Custom matchers** - Create domain-specific expect extensions
9. **Better test data** - Centralized fixtures and generators
10. **CI optimization** - Parallel execution when tests are stable

---

## Metrics & Success Criteria

### Current State

- **Total tests**: 29
- **Passing**: 27 (93%)
- **Failing**: 2 (7%)
- **Flaky rate**: Unknown (need to track)
- **Average duration**: ~45s per test file
- **Total suite time**: ~3 minutes

### Target State

- **Passing**: 100% (all tests)
- **Flaky rate**: <1% (max 1 flaky failure per 100 runs)
- **Average duration**: <30s per test file
- **Total suite time**: <2 minutes
- **CI reliability**: 100% (no false negatives)

### Tracking

Monitor these metrics weekly:
```bash
# Run tests 10 times and check for flakiness
for i in {1..10}; do 
  npm run test:e2e >> test-results.log 2>&1
done

# Count failures
grep "failed" test-results.log | wc -l
```

---

## Maintenance Checklist

### Weekly

- [ ] Run full E2E suite locally
- [ ] Check for flaky tests (run 3x)
- [ ] Review test execution times
- [ ] Update test data if needed

### Monthly

- [ ] Review and update this playbook
- [ ] Audit test coverage (are we testing what matters?)
- [ ] Check for unused test helpers
- [ ] Update Playwright version if needed

### Per Feature

- [ ] Add E2E tests for new features
- [ ] Update existing tests if behavior changes
- [ ] Add to relevant test groups
- [ ] Document in README.md

### Per Bug

- [ ] Write failing test that reproduces bug
- [ ] Fix bug
- [ ] Verify test passes
- [ ] Commit test and fix together

---

## Contact & Resources

**Maintainer**: Tucker (QA Guardian)  
**Documentation**: `apps/web/src/features/auth/__tests__/e2e/README.md`  
**Quick Start**: `apps/web/src/features/auth/__tests__/e2e/QUICK_START.md`

**External Resources**:
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

**Internal Links**:
- Product Vision: `@/PRODUCT-VISION.md`
- Testing Strategy: `@/docs/testing/TESTING.md`
- CI/CD Guide: `@/docs/ci-cd/PIPELINE.md`

---

**Tucker's Final Word**:

> "If I didn't break it, I didn't try hard enough. But once I do break it, I write a test so it never breaks again. That's the Tucker way." 🧪

**Remember**: Tests aren't overhead - they're your safety net. Maintain them ruthlessly, trust them completely, and never ship without them.

---

*Version 1.0 - Created 2026-02-04*  
*Next review: 2026-02-11*
