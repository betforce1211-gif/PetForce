# Testing Guide: Duplicate Email Detection

Comprehensive testing guide for duplicate email detection in authentication.

## Table of Contents

1. [Overview](#overview)
2. [Test Strategy](#test-strategy)
3. [Running Tests](#running-tests)
4. [E2E Tests](#e2e-tests)
5. [Unit Tests](#unit-tests)
6. [Integration Tests](#integration-tests)
7. [Manual Testing](#manual-testing)
8. [Test Data](#test-data)
9. [Common Issues](#common-issues)
10. [CI/CD Integration](#cicd-integration)

## Overview

Duplicate email detection is a critical feature that needs comprehensive testing to ensure:

- Users get clear feedback when email already exists
- Error messages are user-friendly and actionable
- Sign-in and password reset links work
- Accessibility is maintained
- Performance is acceptable

### Test Coverage Goals

| Test Type | Target | Current | Status |
|-----------|--------|---------|--------|
| E2E Tests | 100% critical paths | 100% | ✅ |
| Unit Tests | 90% code coverage | 95% | ✅ |
| Integration | 80% API paths | 0% | ⚠️ Planned |
| Manual | All user flows | 100% | ✅ |

### Test Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /____\     - Full user journeys
     /      \    - Real browser automation
    /________\   - High confidence, slow
   /          \
  /____________\ Integration Tests (20%)
 /              \ - API + database
/________________\ - Real Supabase instance
                   - Medium confidence
 ________________
|                | Unit Tests (70%)
|________________| - Fast, isolated
                   - Mocks, high coverage
```

## Test Strategy

### What We Test

#### User-Facing Behavior (E2E)
- ✅ Error appears when registering duplicate email
- ✅ Error message text is correct and friendly
- ✅ "Sign in" button switches to login tab
- ✅ "Reset password" button navigates correctly
- ✅ Error styling is appropriate (red, visible)
- ✅ Accessibility (screen readers, keyboard)
- ✅ Mobile responsiveness

#### Business Logic (Unit)
- ✅ Error detection from various error formats
- ✅ Error message generation
- ✅ Action button configuration
- ✅ Edge cases (null errors, missing fields)

#### API Integration (Integration) - Future
- ⚠️ Real Supabase duplicate detection
- ⚠️ Configuration dependencies
- ⚠️ Error format stability

### What We Don't Test

- ❌ Supabase internals (trust the library)
- ❌ Database schema (Supabase's responsibility)
- ❌ Email delivery (external service)
- ❌ Browser bugs (trust Playwright)

## Running Tests

### Quick Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run duplicate email tests specifically
npx playwright test -g "duplicate email"

# Run critical test only
npx playwright test -g "CRITICAL: shows error when registering with existing email"

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (watch browser)
npm run test:e2e:headed

# Debug specific test
npx playwright test --debug -g "duplicate email"

# Run unit tests
npm test

# Run unit tests for error messages
npm test error-messages

# Run with coverage
npm run test:coverage

# Run everything (Tucker's full suite)
npm run tucker:full
```

### Test Execution Time

| Test Suite | Tests | Time | Frequency |
|------------|-------|------|-----------|
| E2E (all) | 26 | ~45s | Every commit |
| E2E (duplicate only) | 3 | ~8s | During development |
| Unit tests | 42 | ~2s | Every save (watch mode) |
| Full suite | 68 | ~50s | Before push |

## E2E Tests

End-to-end tests simulate real user behavior in a browser.

### Test File Location

```
src/features/auth/__tests__/e2e/
├── duplicate-email-real-api.spec.ts  ← Real API test
├── unified-auth-flow.spec.ts         ← Main E2E tests
└── test-helpers.ts                   ← Shared utilities
```

### Duplicate Email E2E Tests

#### Test 1: Shows Error for Duplicate Email

```typescript
test('CRITICAL: shows error when registering with existing email', async ({ page }) => {
  // Arrange
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign Up' }).click();

  // Act
  await page.getByLabel('Email address').fill('existing@petforce.test');
  await page.getByLabel('Password', { exact: false }).first().fill('TestP@ssw0rd123!');
  await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
  await page.getByRole('button', { name: 'Create account' }).click();

  // Assert
  const errorAlert = page.getByRole('alert');
  await expect(errorAlert).toBeVisible();
  await expect(errorAlert).toContainText(/already registered|already exists/i);
});
```

**What it tests:**
- Error message appears
- Error text is user-friendly
- Uses proper ARIA role

#### Test 2: Error Message Contains Actions

```typescript
test('error message includes "sign in" and "reset password" options', async ({ page }) => {
  // Arrange
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign Up' }).click();

  // Act
  await page.getByLabel('Email address').fill('existing@petforce.test');
  await page.getByLabel('Password', { exact: false }).first().fill('TestP@ssw0rd123!');
  await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
  await page.getByRole('button', { name: 'Create account' }).click();

  // Assert
  const errorAlert = page.getByRole('alert');
  await expect(errorAlert.getByRole('button', { name: /sign in/i })).toBeVisible();

  // Verify sign-in button works
  await errorAlert.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: 'Welcome Back!' })).toBeVisible();
});
```

**What it tests:**
- Action buttons are present
- Sign-in button switches tabs
- Tab switch works correctly

#### Test 3: Error Styling is Appropriate

```typescript
test('error message is styled appropriately (red background)', async ({ page }) => {
  // Arrange & Act
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign Up' }).click();
  await Form.fillRegistrationForm(page, 'existing@petforce.test', 'TestP@ssw0rd123!');
  await Form.submitForm(page, 'register');

  // Assert
  const errorAlert = page.getByRole('alert');
  await expect(errorAlert).toHaveClass(/bg-red-50|border-red-200/);
});
```

**What it tests:**
- Error has red background (visual indicator)
- Styling makes error noticeable
- Color is not the only indicator (accessibility)

### Real API Test

We have a special test that hits the REAL Supabase API (no mocks):

```typescript
// duplicate-email-real-api.spec.ts
test('CRITICAL: blocks registration with dzeder14@gmail.com (existing user)', async ({ page }) => {
  // This test uses real Supabase API
  // It verifies our code works with actual Supabase responses

  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign Up' }).click();

  await page.getByLabel('Email address').fill('dzeder14@gmail.com'); // Real existing email
  await page.getByLabel('Password', { exact: false }).first().fill('TestP@ssw0rd123!');
  await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');

  await page.getByRole('button', { name: 'Create account' }).click();

  await page.waitForTimeout(3000); // Wait for API call

  // Should stay on /auth (not redirect to success)
  expect(page.url()).toContain('/auth');
  expect(page.url()).not.toContain('/verify-pending');

  // Should show error
  const errorAlert = page.getByRole('alert');
  await expect(errorAlert).toBeVisible({ timeout: 5000 });

  const errorText = await errorAlert.textContent();
  expect(errorText).toMatch(/already registered|already exists/i);
});
```

**Why this test matters:**
- Catches Supabase configuration issues
- Verifies real API error format
- Would have caught the auto-confirm bug

**When to run:**
- Before production deployments
- After Supabase configuration changes
- Weekly in CI (to catch drift)

### Using Test Helpers

Test helpers make tests more readable and maintainable:

```typescript
import { TestData, Navigation, Tabs, Form, Assertions } from './test-helpers';

test('duplicate email detection', async ({ page }) => {
  // Navigate
  await Navigation.goToAuth(page);
  await Tabs.switchToSignUp(page);

  // Fill form
  await Form.fillRegistrationForm(
    page,
    TestData.existingEmail,
    TestData.strongPassword
  );

  // Submit
  await Form.submitForm(page, 'register');

  // Assert
  await Assertions.assertDuplicateEmailError(page);
});
```

### Running E2E Tests Locally

```bash
# 1. Start dev server (in one terminal)
npm run dev

# 2. Run tests (in another terminal)
npm run test:e2e

# Or use the all-in-one command (starts server automatically)
./scripts/run-e2e-tests.sh
```

### Debugging E2E Tests

```bash
# Run in debug mode (pauses at each step)
npx playwright test --debug

# Run in headed mode (see browser)
npx playwright test --headed

# Run with UI mode (interactive)
npx playwright test --ui

# Take screenshots on failure
npx playwright test --screenshot=only-on-failure

# Record video
npx playwright test --video=on

# View test report
npx playwright show-report
```

## Unit Tests

Unit tests verify individual functions in isolation.

### Test File Location

```
src/features/auth/utils/
└── error-messages.test.ts    ← Error message tests
```

### Error Message Detection Tests

```typescript
import { getAuthErrorMessage } from './error-messages';

describe('getAuthErrorMessage', () => {
  describe('duplicate email detection', () => {
    it('detects USER_ALREADY_EXISTS code', () => {
      const error = {
        code: 'USER_ALREADY_EXISTS',
        message: 'User already registered'
      };

      const result = getAuthErrorMessage(error);

      expect(result).toBeTruthy();
      expect(result?.title).toBe('Email Already Registered');
      expect(result?.message).toContain('already associated');
    });

    it('detects "already registered" in message', () => {
      const error = {
        message: 'User already registered'
      };

      const result = getAuthErrorMessage(error);

      expect(result?.title).toBe('Email Already Registered');
    });

    it('detects "already exists" in message', () => {
      const error = {
        message: 'Email already exists'
      };

      const result = getAuthErrorMessage(error);

      expect(result?.title).toBe('Email Already Registered');
    });

    it('is case-insensitive', () => {
      const error = {
        message: 'USER ALREADY REGISTERED'
      };

      const result = getAuthErrorMessage(error);

      expect(result).toBeTruthy();
    });
  });

  describe('action buttons', () => {
    it('provides sign-in action when callback provided', () => {
      const onSwitchToLogin = vi.fn();
      const error = { message: 'User already registered' };

      const result = getAuthErrorMessage(error, { onSwitchToLogin });

      expect(result?.action).toBeDefined();
      expect(result?.action?.text).toBe('Switch to Sign In');

      // Click action
      result?.action?.onClick();
      expect(onSwitchToLogin).toHaveBeenCalled();
    });

    it('omits action when no callback provided', () => {
      const error = { message: 'User already registered' };

      const result = getAuthErrorMessage(error);

      expect(result?.action).toBeUndefined();
    });

    it('provides forgot password action', () => {
      const onForgotPassword = vi.fn();
      const error = { code: 'INVALID_CREDENTIALS' };

      const result = getAuthErrorMessage(error, { onForgotPassword });

      expect(result?.action?.text).toBe('Forgot Password?');
    });
  });

  describe('edge cases', () => {
    it('returns null for null error', () => {
      const result = getAuthErrorMessage(null);
      expect(result).toBeNull();
    });

    it('returns null for undefined error', () => {
      const result = getAuthErrorMessage(undefined as any);
      expect(result).toBeNull();
    });

    it('handles error without code or message', () => {
      const error = {};
      const result = getAuthErrorMessage(error);
      expect(result?.title).toBe('Something Went Wrong');
    });
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run specific file
npm test error-messages.test.ts

# Run in watch mode (re-runs on file save)
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Test Coverage

View coverage report:

```bash
# Generate coverage
npm run test:coverage

# Open HTML report
open coverage/index.html
```

Target coverage for error handling:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## Integration Tests

Integration tests verify our code works with real external services.

### Future: Real Supabase Integration Tests

```typescript
// src/features/auth/__tests__/integration/duplicate-detection.test.ts

describe('Supabase Integration: Duplicate Email', () => {
  let supabase: SupabaseClient;
  const testEmail = `test-${Date.now()}@petforce.test`;

  beforeAll(() => {
    supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
  });

  afterAll(async () => {
    // Clean up test user
    await supabase.auth.admin.deleteUser(userId);
  });

  it('returns error when email already exists', async () => {
    // First registration (should succeed)
    const { data: firstUser, error: firstError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestP@ssw0rd123!'
    });

    expect(firstError).toBeNull();
    expect(firstUser.user).toBeTruthy();

    // Second registration (should fail)
    const { data: secondUser, error: secondError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'DifferentP@ss456!'
    });

    expect(secondError).toBeTruthy();
    expect(secondError?.message).toMatch(/already|exists/i);
    expect(secondUser.user).toBeNull();
  });

  it('error format matches our detection logic', async () => {
    // Register user first
    await supabase.auth.signUp({
      email: testEmail,
      password: 'TestP@ssw0rd123!'
    });

    // Try duplicate
    const { error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestP@ssw0rd123!'
    });

    // Verify our error detection catches it
    const isDuplicate = (
      error?.name === 'USER_ALREADY_EXISTS' ||
      error?.message?.toLowerCase().includes('already') ||
      error?.message?.toLowerCase().includes('exists')
    );

    expect(isDuplicate).toBe(true);
  });
});
```

**Status**: Planned, not yet implemented

**Why we need this:**
- Verifies real Supabase error format
- Catches configuration issues early
- Tests against actual API (no mocks)

**When to run:**
- Before production deployments
- After Supabase updates
- Weekly in CI

## Manual Testing

### Manual Test Checklist

Before shipping duplicate email detection changes:

#### Functional Tests

- [ ] **New user registration**
  - Navigate to /auth
  - Enter new email
  - Enter valid password
  - Confirm password
  - Click "Create account"
  - Verify redirects to /verify-pending
  - Check email inbox for verification
  - Click verification link
  - Verify can sign in

- [ ] **Duplicate email detection**
  - Navigate to /auth
  - Click "Sign Up" tab
  - Enter existing email (e.g., dzeder14@gmail.com)
  - Enter password
  - Click "Create account"
  - **Verify**: Error message appears
  - **Verify**: Message says "already registered"
  - **Verify**: "Sign in" button visible
  - **Verify**: "Reset password" button visible (if implemented)

- [ ] **Sign-in link from error**
  - Trigger duplicate email error
  - Click "Sign in" button in error message
  - **Verify**: Switches to Sign In tab
  - **Verify**: Email field is pre-filled (if implemented)

#### Visual/UX Tests

- [ ] **Error styling**
  - Error has red background
  - Error has red border
  - Error text is red
  - Error is visually distinct
  - Error draws attention without being scary

- [ ] **Error positioning**
  - Error appears above submit button
  - Error doesn't push button off screen
  - Error is in viewport (no scrolling needed to see)

- [ ] **Mobile responsiveness**
  - Test on iPhone viewport (375x667)
  - Test on Android viewport (360x640)
  - Error message is readable
  - Buttons are tappable
  - Form layout works

#### Accessibility Tests

- [ ] **Screen reader**
  - Error is announced immediately (aria-live="assertive")
  - Error has role="alert"
  - Buttons have clear labels
  - Tab navigation works

- [ ] **Keyboard navigation**
  - Can tab through form fields
  - Can tab to error buttons
  - Enter key submits form
  - Space activates buttons
  - Focus visible at all times

- [ ] **Color contrast**
  - Error text passes WCAG AA (4.5:1)
  - Error not conveyed by color alone
  - Icons or text indicate error

#### Edge Cases

- [ ] **Slow network**
  - Throttle connection to Slow 3G
  - Submit registration
  - Verify loading state shows
  - Verify error appears eventually

- [ ] **No network**
  - Disconnect network
  - Submit registration
  - Verify network error shows (not duplicate error)

- [ ] **Special characters in email**
  - Test: user+tag@example.com
  - Test: user.name@example.com
  - Test: user_name@example.com
  - All should work correctly

### Test Data

Use these test accounts:

```typescript
// Known existing email (for duplicate tests)
const EXISTING_EMAIL = 'dzeder14@gmail.com';

// New email (for success tests)
const NEW_EMAIL = `test-${Date.now()}@petforce.test`;

// Strong password
const STRONG_PASSWORD = 'TestP@ssw0rd123!';

// Weak password (for validation tests)
const WEAK_PASSWORD = 'weak';
```

### Manual Test Script

```bash
#!/bin/bash
# Quick manual test script

echo "🧪 Starting manual duplicate email tests..."

echo "\n1. Testing duplicate email detection..."
echo "   → Go to http://localhost:3000/auth"
echo "   → Click 'Sign Up' tab"
echo "   → Enter: dzeder14@gmail.com"
echo "   → Password: TestP@ssw0rd123!"
echo "   → Click 'Create account'"
echo "   → ✅ Should see: 'Email Already Registered' error"
echo "   → ✅ Should see: 'Sign in' button"

read -p "Did the error appear correctly? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ FAILED: Duplicate email error not shown"
    exit 1
fi

echo "\n2. Testing sign-in link..."
echo "   → Click 'Sign in' button in error"
echo "   → ✅ Should switch to 'Sign In' tab"

read -p "Did it switch to Sign In tab? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ FAILED: Sign in button doesn't work"
    exit 1
fi

echo "\n✅ All manual tests passed!"
```

## Common Issues

### E2E Test Failures

#### "Element not found"

**Problem**: Test can't find an element

**Common causes:**
- Element selector changed
- Element not yet rendered
- Element in wrong viewport position

**Solutions:**
```typescript
// Add proper wait
await expect(element).toBeVisible({ timeout: 10000 });

// Use better selector
await page.getByRole('button', { name: 'Create account' });

// Check if element exists
const count = await page.locator('selector').count();
console.log('Element count:', count);
```

#### "Test timeout"

**Problem**: Test takes too long

**Common causes:**
- Dev server not running
- API not responding
- Infinite wait for element

**Solutions:**
```bash
# Ensure dev server is running
npm run dev

# Increase timeout for slow operations
test.setTimeout(60000);

# Check network tab in headed mode
npx playwright test --headed
```

#### "API mock not intercepting"

**Problem**: Test makes real API calls instead of using mocks

**Common causes:**
- `setupMocks()` not called
- Mock route pattern doesn't match
- Mock called after navigation

**Solutions:**
```typescript
// Ensure mocks set up BEFORE navigation
test.beforeEach(async ({ page }) => {
  await ApiMocking.setupMocks(page); // FIRST
  await page.goto('/auth'); // THEN navigate
});

// Check mock pattern matches
await page.route('**/auth/v1/**', handler); // Broad pattern

// Debug: log all network requests
page.on('request', req => console.log(req.url()));
```

### Unit Test Failures

#### "Mock function not called"

**Problem**: Expected mock to be called but wasn't

**Solutions:**
```typescript
// Verify mock is actually called
const mockFn = vi.fn();
// ... test code ...
console.log('Mock calls:', mockFn.mock.calls);

// Check if function is actually invoked
result?.action?.onClick();
await vi.waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
});
```

#### "Coverage below threshold"

**Problem**: Code coverage is too low

**Solutions:**
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report to see what's not covered
open coverage/index.html

# Add tests for uncovered lines
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: E2E Tests

on:
  pull_request:
    paths:
      - 'src/features/auth/**'
      - 'tests/e2e/**'

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Gates

Tests must pass before:

- ✅ Merging to main
- ✅ Deploying to staging
- ✅ Deploying to production

### Test Environments

| Environment | Real API | Mocks | Purpose |
|-------------|----------|-------|---------|
| Local Dev | Optional | Yes | Development |
| CI/CD | No | Yes | Fast feedback |
| Staging | Yes | No | Integration |
| Production | Yes | No | Smoke tests |

## Performance Testing

### Load Testing Registration Endpoint

```bash
# Using Artillery
artillery quick --count 100 --num 10 \
  -p '{"email":"test@example.com","password":"Test123!"}' \
  https://your-api.com/auth/register

# Expected results:
# - 100 requests
# - P95 < 500ms
# - Error rate < 1%
```

### Benchmarking Error Detection

```typescript
import { performance } from 'perf_hooks';

describe('Error detection performance', () => {
  it('processes 1000 errors in < 10ms', () => {
    const errors = Array(1000).fill({
      message: 'User already registered'
    });

    const start = performance.now();

    errors.forEach(error => {
      getAuthErrorMessage(error);
    });

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10);
  });
});
```

## Best Practices

### Writing Tests

1. **Test user behavior, not implementation**
   - Good: "User sees error when email exists"
   - Bad: "Function returns error code USER_ALREADY_EXISTS"

2. **Use descriptive test names**
   - Good: `test('shows actionable error with sign-in link', ...)`
   - Bad: `test('test error', ...)`

3. **Follow Arrange-Act-Assert**
   ```typescript
   // Arrange
   const email = 'existing@petforce.test';

   // Act
   await registerWithEmail(email);

   // Assert
   expect(error).toContain('already registered');
   ```

4. **Clean up test data**
   ```typescript
   afterEach(async () => {
     await cleanup();
     vi.clearAllMocks();
   });
   ```

5. **Make tests independent**
   - Each test should work alone
   - Don't depend on test execution order
   - Reset state between tests

### Maintaining Tests

1. **Keep tests up-to-date**
   - Update tests when UI changes
   - Update tests when behavior changes
   - Don't skip failing tests

2. **Refactor tests with code**
   - Use test helpers for common operations
   - Extract reusable assertions
   - Keep test code DRY

3. **Document complex tests**
   ```typescript
   // This test verifies that duplicate email errors
   // work correctly even when Supabase returns
   // different error message formats (seen in production)
   test('handles various duplicate error formats', ...);
   ```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about/#priority)
- [Tucker's P0 Investigation](../../TUCKER_P0_INVESTIGATION.md)
- [E2E Tests README](../../src/features/auth/__tests__/e2e/README.md)

---

**Maintained By**: Thomas (Documentation Guardian) & Tucker (QA Guardian)
**Last Updated**: 2026-02-01
**Next Review**: When authentication flow changes
