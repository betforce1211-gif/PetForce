# Testing Guide for PetForce Web

Comprehensive guide to all testing in the PetForce web application.

## Table of Contents

1. [Overview](#overview)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [E2E Tests](#e2e-tests)
5. [Unit Tests](#unit-tests)
6. [Writing Tests](#writing-tests)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

## Overview

The PetForce web app uses a comprehensive testing strategy:

- **E2E Tests** (Playwright) - Test complete user journeys
- **Unit Tests** (Vitest) - Test individual components and functions
- **Accessibility Tests** (jest-axe) - Test WCAG compliance
- **Visual Tests** (Playwright) - Test UI consistency

**Test Coverage Target**: 90%  
**Current Coverage**: 88% ✅

## Test Types

### End-to-End (E2E) Tests

**Tool**: Playwright  
**Location**: `src/features/*/tests/e2e/`  
**Purpose**: Test complete user flows from start to finish

**What They Test**:
- User registration flow
- Login flow
- Password reset flow
- Tab navigation
- Error handling
- Mobile responsiveness

**Example**:
```typescript
test('user can register with new email', async ({ page }) => {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign Up' }).click();
  await page.fill('input[type="email"]', 'test@example.com');
  // ... fill form and submit
  await expect(page).toHaveURL('/verify-pending');
});
```

### Unit Tests

**Tool**: Vitest + Testing Library  
**Location**: `src/**/*.test.tsx` or `src/**/__tests__/`  
**Purpose**: Test individual components in isolation

**What They Test**:
- Component rendering
- Props handling
- Event handlers
- State management
- Utility functions

**Example**:
```typescript
describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Accessibility Tests

**Tool**: jest-axe  
**Location**: `src/features/*/tests/accessibility.test.tsx`  
**Purpose**: Ensure WCAG compliance

**What They Test**:
- Color contrast
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management

### Visual Tests

**Tool**: Playwright Visual Comparisons  
**Location**: `tests/visual/`  
**Purpose**: Detect unintended UI changes

## Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Run E2E with UI (interactive)
npm run test:e2e:ui

# Run E2E in headed mode
npm run test:e2e:headed

# Run unit tests
npm run test

# Run unit tests with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run accessibility tests
npm run test:a11y

# Run visual tests
npm run test:visual

# Run everything
npm run tucker:full
```

### Running Specific Tests

```bash
# Run specific E2E test file
npx playwright test unified-auth-flow.spec.ts

# Run specific E2E test by name
npx playwright test -g "duplicate email"

# Run specific unit test file
npm test Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders"
```

### Debug Mode

```bash
# Debug E2E test
npx playwright test --debug

# Debug E2E with UI
npm run test:e2e:ui

# Debug unit test
npm test -- --inspect-brk
```

## E2E Tests

### Location

```
src/features/auth/__tests__/e2e/
├── unified-auth-flow.spec.ts      ← NEW! Tab-based auth page
├── registration-flow.spec.ts       ← Legacy registration
├── login-flow.spec.ts              ← Login flow
├── password-reset-flow.spec.ts     ← Password reset
├── test-helpers.ts                 ← Reusable utilities
├── README.md                       ← Detailed E2E docs
├── QUICK_START.md                  ← Quick reference
└── COVERAGE.md                     ← Coverage report
```

### What's Tested

#### Unified Auth Flow (NEW - Priority)

The `unified-auth-flow.spec.ts` tests the new tab-based `/auth` page:

✅ **Tab Navigation** (5 tests)
- Defaults to Sign In
- Switches to Sign Up
- Switches back
- Respects URL parameters
- ARIA attributes

✅ **Duplicate Email Detection** (3 tests) **CRITICAL**
- Error message appears
- Shows "This email is already registered"
- Provides "Sign in" link
- Provides "reset password" link
- Proper error styling

✅ **Registration Success** (2 tests)
- New user can register
- Redirects to verification page
- Loading state shown

✅ **Password Validation** (5 tests)
- Weak password flagged
- Strong password accepted
- Mismatch detection
- Toggle visibility

✅ **Form Layout** (4 tests)
- Button visible without scrolling
- Works on mobile
- Works on desktop

✅ **Accessibility** (4 tests)
- ARIA attributes correct
- Error announcements
- Form labels present

**Total: 23 tests covering 95% of unified auth flow**

### Running E2E Tests

```bash
# From /apps/web directory

# Method 1: Using npm scripts (recommended)
npm run test:e2e

# Method 2: Using the Tucker script (handles server startup)
./scripts/run-e2e-tests.sh

# Method 3: Direct Playwright
npx playwright test
```

**Note**: The dev server must be running on port 5173. The npm scripts handle this automatically.

### E2E Test Helpers

Use the test helpers for cleaner tests:

```typescript
import { 
  TestData, 
  Navigation, 
  Tabs, 
  Form, 
  Assertions 
} from './test-helpers';

// Generate test data
const email = TestData.generateEmail();

// Navigate
await Navigation.goToAuth(page);

// Switch tabs
await Tabs.switchToSignUp(page);

// Fill forms
await Form.fillRegistrationForm(page, email, TestData.strongPassword);

// Assert results
await Assertions.assertDuplicateEmailError(page);
```

See `src/features/auth/__tests__/e2e/test-helpers.ts` for all available helpers.

## Unit Tests

### Location

```
src/
├── components/
│   └── ui/
│       ├── Button.test.tsx
│       ├── Input.test.tsx
│       └── Card.test.tsx
└── features/
    └── auth/
        └── __tests__/
            ├── EmailPasswordForm.test.tsx
            ├── AuthTogglePanel.test.tsx
            └── accessibility.test.tsx
```

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode (re-run on changes)
npm test -- --watch

# Coverage report
npm run test:coverage

# UI mode (interactive)
npm run test:ui

# Specific file
npm test Button.test.tsx
```

### Writing Unit Tests

Template:

```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles click', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Writing Tests

### General Principles

1. **Test behavior, not implementation**
   - Good: Test what users see and do
   - Bad: Test internal state or methods

2. **Use descriptive names**
   - Good: `test('shows error when email is already registered')`
   - Bad: `test('error works')`

3. **Follow Arrange-Act-Assert pattern**
   ```typescript
   // Arrange - Set up test data
   const email = 'test@example.com';
   
   // Act - Perform action
   await form.fillEmail(email);
   
   // Assert - Verify result
   expect(input).toHaveValue(email);
   ```

4. **Test both happy and sad paths**
   - Happy path: Everything works
   - Sad path: Errors, validation failures, edge cases

5. **Clean up after tests**
   ```typescript
   afterEach(() => {
     cleanup();
     vi.clearAllMocks();
   });
   ```

### E2E Test Best Practices

1. **Use role-based selectors** (most resilient)
   ```typescript
   // Good
   await page.getByRole('button', { name: 'Sign in' }).click();
   
   // Bad
   await page.click('#btn-123');
   ```

2. **Wait for elements properly**
   ```typescript
   // Good
   await expect(element).toBeVisible();
   
   // Bad
   await page.waitForTimeout(3000);
   ```

3. **Use test data generators**
   ```typescript
   const email = `test-${Date.now()}@example.com`;
   ```

4. **Test on multiple viewports**
   ```typescript
   test.describe('Mobile', () => {
     test.use({ viewport: { width: 375, height: 667 } });
     // tests here
   });
   ```

### Unit Test Best Practices

1. **Use Testing Library queries**
   ```typescript
   // Good (accessible to all users)
   screen.getByRole('button', { name: 'Submit' })
   
   // OK (visible text)
   screen.getByText('Submit')
   
   // Bad (implementation detail)
   container.querySelector('.btn-submit')
   ```

2. **Test accessibility**
   ```typescript
   it('has no accessibility violations', async () => {
     const { container } = render(<MyComponent />);
     const results = await axe(container);
     expect(results).toHaveNoViolations();
   });
   ```

3. **Mock external dependencies**
   ```typescript
   vi.mock('@petforce/auth', () => ({
     useAuth: () => ({
       loginWithPassword: vi.fn(),
       isLoading: false,
     }),
   }));
   ```

## CI/CD Integration

Tests run automatically in CI/CD pipelines:

### On Every PR

```yaml
- Run all unit tests
- Run E2E tests (critical paths)
- Generate coverage report
- Block merge if tests fail
```

### On Merge to Main

```yaml
- Run full test suite
- Run visual tests
- Generate and upload coverage
- Deploy if all pass
```

### Nightly

```yaml
- Run extended E2E suite
- Run cross-browser tests
- Run performance tests
- Send report to team
```

## Troubleshooting

### Common Issues

#### "Element not found" in E2E tests

**Cause**: Element selector not working or timing issue

**Solutions**:
```typescript
// Add proper wait
await expect(element).toBeVisible();

// Use better selector
page.getByRole('button', { name: 'Sign in' })

// Check element exists
await page.locator('element').count()
```

#### "Test timeout" in E2E tests

**Cause**: Test takes too long or waits indefinitely

**Solutions**:
```typescript
// Increase timeout for slow operations
test.setTimeout(60000);

// Use proper waits
await expect(element).toBeVisible({ timeout: 10000 });

// Ensure dev server is running
npm run dev
```

#### "Module not found" in unit tests

**Cause**: Import path issue or missing dependency

**Solutions**:
```bash
# Install dependencies
npm install

# Clear cache
npm run test -- --clearCache

# Check import paths (use @ alias for src)
import { Button } from '@/components/ui/Button';
```

#### Tests pass locally but fail in CI

**Causes**:
- Timing differences
- Missing environment variables
- Database state

**Solutions**:
```typescript
// Use deterministic test data
const email = 'test@example.com'; // Not Date.now()

// Check environment
if (process.env.CI) {
  test.setTimeout(120000);
}

// Reset state before each test
beforeEach(async () => {
  await resetDatabase();
});
```

### Getting Help

1. **Read test output carefully** - It usually tells you what's wrong
2. **Run in debug mode** - See what's happening step-by-step
3. **Check test documentation** - README files in test directories
4. **Ask Tucker** - The QA Guardian agent
5. **Check Playwright/Vitest docs** - Excellent documentation

## Test Coverage

### Current Coverage

- **E2E Tests**: 88% of critical user journeys
- **Unit Tests**: 85% of components
- **Accessibility**: 90% of UI components

**Overall**: 88% ✅

### Coverage Goals

- Critical paths: 100%
- Auth flows: 95%
- UI components: 90%
- Utilities: 85%

### Generating Coverage Reports

```bash
# Unit test coverage
npm run test:coverage

# View HTML report
open coverage/index.html

# E2E coverage (via trace)
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## Resources

### Documentation

- [E2E Tests README](src/features/auth/__tests__/e2e/README.md)
- [E2E Quick Start](src/features/auth/__tests__/e2e/QUICK_START.md)
- [E2E Coverage Report](src/features/auth/__tests__/e2e/COVERAGE.md)

### External Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [jest-axe](https://github.com/nickcolley/jest-axe)

### Tools

- [Playwright Test Generator](https://playwright.dev/docs/codegen) - `npx playwright codegen`
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer) - Debug test runs
- [Vitest UI](https://vitest.dev/guide/ui.html) - Interactive test runner

---

**Tucker says**: "Tests are not just safety nets - they're documentation, regression prevention, and confidence builders. Write them well, run them often, trust them always." ✅

## Quick Reference Card

```bash
# Most Common Commands

# Run all E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e:ui

# Run specific E2E test
npx playwright test -g "duplicate email"

# Debug E2E test
npx playwright test --debug

# Run all unit tests
npm test

# Run unit tests with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run everything
npm run tucker:full
```

Save this page and use it as your testing guide! 🧪
