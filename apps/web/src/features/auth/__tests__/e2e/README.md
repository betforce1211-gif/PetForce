# End-to-End (E2E) Tests

This directory contains Playwright E2E tests for the authentication flows.

## Test Files

- `unified-auth-flow.spec.ts` - **NEW** Tab-based unified auth page (catches duplicate email bug)
- `registration-flow.spec.ts` - Legacy registration journey (separate pages)
- `login-flow.spec.ts` - Complete login journey
- `password-reset-flow.spec.ts` - Complete password reset journey
- `test-helpers.ts` - Reusable test utilities and helpers

## NEW: Unified Auth Flow Tests

The `unified-auth-flow.spec.ts` file contains comprehensive tests for the new tab-based authentication interface (`/auth`). These tests would have caught the duplicate email registration bug that went to production.

### What It Tests

#### Tab Navigation
- Defaults to Sign In tab
- Switches between Sign In and Sign Up tabs
- Maintains proper ARIA attributes
- Smooth animations
- Respects URL parameters (`?mode=register`)

#### Duplicate Email Detection (CRITICAL)
- Shows error when registering with existing email
- Error message: "This email is already registered"
- Provides "Sign in" link that switches tabs
- Provides "reset password" link
- Error has proper styling (red background)

#### New User Registration
- Successfully registers new user
- Redirects to verification pending page
- Email parameter in URL
- Shows loading state during submission

#### Password Validation
- Password strength indicator (weak/strong)
- Mismatch detection (inline and on submit)
- Toggle password visibility
- Confirm password validation

#### Form Layout
- "Create Account" button visible without scrolling
- Button remains visible after filling form
- Button remains visible after error appears
- Mobile viewport compatibility

#### Accessibility
- Proper ARIA attributes on tabs
- Error messages have `aria-live="assertive"`
- Form inputs have proper labels
- Terms and Privacy links present

### Running Unified Auth Tests

```bash
# Run only unified auth tests
npx playwright test unified-auth-flow.spec.ts

# Run only the critical duplicate email test
npx playwright test unified-auth-flow.spec.ts -g "CRITICAL: shows error when registering with existing email"

# Run in UI mode to see the tests
npx playwright test unified-auth-flow.spec.ts --ui

# Run in headed mode (watch browser)
npx playwright test unified-auth-flow.spec.ts --headed

# Debug a specific test
npx playwright test unified-auth-flow.spec.ts -g "duplicate email" --debug
```

## Test Helpers

The `test-helpers.ts` file provides reusable utilities:

```typescript
import { TestData, Navigation, Tabs, Form, Assertions, Viewport } from './test-helpers';

// Generate test data
const email = TestData.generateEmail();

// Navigate
await Navigation.goToAuth(page);

// Switch tabs
await Tabs.switchToSignUp(page);

// Fill forms
await Form.fillRegistrationForm(page, email, TestData.strongPassword);
await Form.submitForm(page, 'register');

// Assert results
await Assertions.assertDuplicateEmailError(page);
await Assertions.assertVerificationPending(page, email);

// Set viewports
await Viewport.setMobile(page);
```

## Running Tests

```bash
# From apps/web directory

# Run all E2E tests (headless)
npm run test:e2e

# Run with interactive UI (great for debugging)
npm run test:e2e:ui

# Run in headed mode (see the browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test login-flow.spec.ts

# Run specific test by name
npx playwright test -g "completes full login journey"

# Debug mode (pauses execution)
npx playwright test --debug

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=mobile
```

## Test Structure

Each test file follows this pattern:

```typescript
test.describe('Feature Group', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/initial-route');
  });

  test('test scenario name', async ({ page }) => {
    // Test steps
    await page.fill('input', 'value');
    await page.click('button');
    
    // Assertions
    await expect(page).toHaveURL('/expected-route');
  });
});
```

## Best Practices

### 1. Use Descriptive Test Names

**Good**: `test('completes full login journey - happy path', ...)`  
**Bad**: `test('login works', ...)`

### 2. Test User Behavior, Not Implementation

**Good**: 
```typescript
await page.getByRole('button', { name: 'Sign in' }).click();
await expect(page).toHaveURL('/dashboard');
```

**Bad**:
```typescript
await page.click('#submit-btn-123');
expect(mockFunction).toHaveBeenCalled();
```

### 3. Use Proper Waits

**Good**:
```typescript
await expect(element).toBeVisible({ timeout: 5000 });
```

**Bad**:
```typescript
await page.waitForTimeout(3000); // Arbitrary wait
```

### 4. Test Both Happy and Sad Paths

Always test:
- ✅ Happy path (everything works)
- ✅ Validation errors
- ✅ Network errors
- ✅ Edge cases

### 5. Clean Test Data

Use unique identifiers to avoid conflicts:

```typescript
const testUser = {
  email: `test-${Date.now()}@petforce.test`,
  password: 'TestP@ssw0rd123!',
};
```

### 6. Use Test Helpers

Leverage `test-helpers.ts` for common operations:

```typescript
// Instead of this:
await page.getByLabel('Email address').fill(email);
await page.getByLabel('Password', { exact: true }).fill(password);
await page.getByLabel('Confirm password').fill(password);
await page.getByRole('button', { name: 'Create account' }).click();

// Do this:
await Form.fillRegistrationForm(page, email, password);
await Form.submitForm(page, 'register');
```

## Debugging Tests

### View Test Report

```bash
npx playwright show-report
```

### Debug Specific Test

```bash
npx playwright test login-flow.spec.ts --debug
```

### Take Screenshots

```bash
npx playwright test --screenshot=on
```

### Record Video

```bash
npx playwright test --video=on
```

### Trace Viewer

```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Common Issues

### "Element not found"

**Problem**: Element selector not working or timing issue

**Solutions**:
1. Add proper wait: `await expect(element).toBeVisible()`
2. Use more robust selectors: `page.getByRole('button', { name: 'Sign in' })`
3. Check if element exists: `await page.locator('element').count()`

### "Test timeout"

**Problem**: Test takes too long or waits indefinitely

**Solutions**:
1. Increase timeout: `test.setTimeout(60000)`
2. Use proper waits instead of arbitrary timeouts
3. Check if dev server is running

### "Navigation failed"

**Problem**: Page won't navigate or route doesn't exist

**Solutions**:
1. Ensure dev server is running: `npm run dev`
2. Check the route exists in your app
3. Wait for navigation: `await page.waitForURL('/expected-route')`

## Mobile Testing

Tests automatically run on mobile viewport (iPhone 13):

```typescript
test.describe('Mobile Flow', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('works on mobile', async ({ page }) => {
    // Test mobile-specific behavior
  });
});
```

## Accessibility Testing

While these are E2E tests, they also check basic accessibility:

```typescript
// Check for ARIA labels
const button = page.locator('button[aria-label*="password"]');
await expect(button).toHaveAttribute('aria-label');

// Check keyboard navigation
await page.keyboard.press('Tab');
await expect(input).toBeFocused();
```

For comprehensive accessibility testing, see:
- `../accessibility.test.tsx`

## Test Data

### Test Users

```typescript
// Valid user
const validUser = {
  email: 'test@petforce.test',
  password: 'TestP@ssw0rd123!',
};

// Unconfirmed user
const unconfirmedUser = {
  email: 'unconfirmed@petforce.test',
  password: 'TestP@ssw0rd123!',
};

// Existing user (for duplicate email tests)
const existingUser = {
  email: 'existing@petforce.test',
};
```

### Test Passwords

```typescript
// Strong password
const strongPassword = 'TestP@ssw0rd123!';

// Weak password (for testing validation)
const weakPassword = 'weak';
```

## CI/CD Integration

Tests run automatically in CI/CD:

- On every pull request
- Before deployment
- Nightly for full suite

Configuration: `.github/workflows/e2e.yml`

## Test Coverage by Feature

| Feature | Test File | Status |
|---------|-----------|--------|
| Unified Auth (Tab-based) | `unified-auth-flow.spec.ts` | ✅ Complete |
| Legacy Registration | `registration-flow.spec.ts` | ✅ Complete |
| Login Flow | `login-flow.spec.ts` | ✅ Complete |
| Password Reset | `password-reset-flow.spec.ts` | ✅ Complete |

## Adding New Tests

### Checklist for New Tests

1. [ ] Test happy path
2. [ ] Test validation errors
3. [ ] Test network errors
4. [ ] Test mobile viewport
5. [ ] Test keyboard navigation
6. [ ] Add descriptive test name
7. [ ] Add comments for complex steps
8. [ ] Ensure cleanup after test
9. [ ] Update this README if needed
10. [ ] Add helpers to `test-helpers.ts` if reusable

### Template

```typescript
import { test, expect } from '@playwright/test';
import { TestData, Navigation, Form, Assertions } from './test-helpers';

test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    await Navigation.goToAuth(page);
  });

  test('happy path - user can complete action', async ({ page }) => {
    // Arrange
    const email = TestData.generateEmail();
    
    // Act
    await Form.fillRegistrationForm(page, email, TestData.strongPassword);
    await Form.submitForm(page, 'register');
    
    // Assert
    await Assertions.assertVerificationPending(page, email);
  });

  test('handles errors gracefully', async ({ page }) => {
    // Test error scenario
    await Form.fillRegistrationForm(page, TestData.existingEmail, TestData.strongPassword);
    await Form.submitForm(page, 'register');
    
    await Assertions.assertDuplicateEmailError(page);
  });

  test('works on mobile', async ({ page }) => {
    await Viewport.setMobile(page);
    // Test mobile behavior
  });
});
```

## Why These Tests Matter

### Real-World Impact

The unified auth flow tests were created in response to a production bug where:
1. User tried to register with an existing email
2. API returned error, but UI didn't show it clearly
3. User was confused and contacted support
4. Bug was only caught after user reported it

**These tests would have caught this bug before deployment.**

### Test-Driven Development

Going forward, for every bug fix:
1. Write a test that reproduces the bug
2. Verify the test fails
3. Fix the bug
4. Verify the test passes
5. Commit both test and fix together

This ensures bugs never come back (regression testing).

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Guide](../../../docs/TESTING.md)
- [Testing Checklist](../../../docs/TESTING_CHECKLIST.md)

---

Tucker says: "If I didn't break it, I didn't try hard enough. Test relentlessly, ship confidently." 🧪
