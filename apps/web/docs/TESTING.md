# Testing Documentation

## Overview

PetForce Web App has comprehensive test coverage including unit tests, integration tests, end-to-end (E2E) tests, and accessibility tests.

## Test Types

### 1. Unit Tests

Test individual components and functions in isolation.

**Location**: `src/**/__tests__/*.test.tsx`

**Run**:
```bash
npm run test              # Run in watch mode
npm run test:coverage     # Run with coverage report
npm run test:ui          # Run with Vitest UI
```

**Examples**:
- Component rendering tests
- Function logic tests
- State management tests

### 2. Integration Tests

Test how multiple components work together.

**Location**: `src/features/auth/__tests__/auth-flow.integration.test.tsx`

**Run**:
```bash
npm run test auth-flow.integration
```

**Examples**:
- Form submission flows
- Component interaction
- State synchronization

### 3. End-to-End (E2E) Tests

Test complete user journeys from start to finish.

**Location**: `src/features/auth/__tests__/e2e/*.spec.ts`

**Run**:
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with Playwright UI
npm run test:e2e:headed    # Run in headed mode (see browser)
```

**Test Files**:
- `registration-flow.spec.ts` - Complete registration journey
- `login-flow.spec.ts` - Complete login journey

**What They Test**:
- User registration from welcome to email verification
- Login with valid/invalid credentials
- Password reset flows
- Email confirmation handling
- Mobile responsiveness
- Error handling and recovery
- Session persistence

### 4. Accessibility (A11y) Tests

Ensure WCAG 2.1 AA compliance and usability for all users.

**Location**: `src/features/auth/__tests__/accessibility.test.tsx`

**Run**:
```bash
npm run test:a11y          # Run accessibility tests
npm run test accessibility # Run as part of full suite
```

**What They Test**:
- No WCAG violations (using jest-axe)
- Proper heading hierarchy
- Form label associations
- ARIA attributes
- Keyboard navigation
- Focus management
- Color contrast
- Screen reader compatibility
- Touch target sizes

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can register', async ({ page }) => {
  await page.goto('/auth/register');
  
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button:has-text("Create account")');
  
  await expect(page).toHaveURL('/auth/verify-pending');
});
```

### Accessibility Test Example

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<LoginPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Test Coverage Standards

### Coverage Thresholds

- **Lines**: 80% minimum
- **Branches**: 75% minimum  
- **Functions**: 85% minimum
- **Statements**: 80% minimum

### Critical Paths

These areas require 100% coverage:
- Authentication flows
- Payment processing
- Pet health data handling
- Security features
- Data privacy features

## Testing Best Practices

### 1. Test Behavior, Not Implementation

**Good**:
```typescript
it('shows error when password is too short', async () => {
  await userEvent.type(passwordInput, 'short');
  await userEvent.click(submitButton);
  expect(screen.getByText(/at least 8 characters/i)).toBeVisible();
});
```

**Bad**:
```typescript
it('sets error state to true', () => {
  const { result } = renderHook(() => useForm());
  result.current.setPassword('short');
  expect(result.current.hasError).toBe(true);
});
```

### 2. Use Accessible Queries

Prefer queries that match how users interact:

**Priority Order**:
1. `getByRole` - Best for accessibility
2. `getByLabelText` - Good for form fields
3. `getByPlaceholderText` - OK for inputs
4. `getByText` - Good for non-interactive elements
5. `getByTestId` - Last resort only

### 3. Test Edge Cases

Tucker's edge case checklist:

**For Strings**:
- Empty string ""
- Whitespace only "   "
- Very long strings
- Special characters
- Unicode/emoji
- XSS attempts

**For Numbers**:
- Zero
- Negative numbers
- Very large numbers
- Decimals
- NaN/Infinity

**For Arrays**:
- Empty array
- Single element
- Many elements

**For Dates**:
- Leap year dates
- Timezone boundaries
- Far past/future

**For Auth**:
- Expired tokens
- Invalid tokens
- Missing tokens
- Wrong user's data

### 4. Mock External Dependencies

```typescript
// Mock API calls
vi.mock('@petforce/auth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});
```

## Running Tests in CI/CD

Tests run automatically on:
- Every push to feature branches
- Every pull request
- Before merging to main
- Before deployment

**CI Configuration**: `.github/workflows/test.yml`

## Debugging Tests

### Debug Unit/Integration Tests

```bash
# Run specific test file
npm run test LoginPage.test.tsx

# Run tests in UI mode (interactive)
npm run test:ui

# Run with console output
npm run test -- --reporter=verbose
```

### Debug E2E Tests

```bash
# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test
npx playwright test login-flow.spec.ts

# Debug mode (pauses execution)
npx playwright test --debug

# Run with trace
npx playwright test --trace on
```

### View Test Reports

```bash
# View Playwright HTML report
npx playwright show-report

# View Vitest coverage
open coverage/index.html
```

## Test Organization

```
src/
├── components/
│   └── ui/
│       └── __tests__/          # Component unit tests
│           ├── Button.test.tsx
│           └── Input.test.tsx
├── features/
│   └── auth/
│       ├── __tests__/          # Feature integration tests
│       │   ├── auth-flow.integration.test.tsx
│       │   ├── accessibility.test.tsx
│       │   └── e2e/            # E2E tests
│       │       ├── registration-flow.spec.ts
│       │       └── login-flow.spec.ts
│       ├── components/
│       │   └── __tests__/      # Component-specific tests
│       └── pages/
│           └── __tests__/      # Page-specific tests
└── test/
    ├── setup.ts               # Global test setup
    ├── mocks/                 # Shared mocks
    │   └── auth.ts
    └── utils/                 # Test utilities
        └── test-utils.tsx
```

## Common Issues and Solutions

### Issue: "Cannot find module"

**Solution**: Check path aliases in `vitest.config.ts`

### Issue: "Element not found in E2E tests"

**Solution**: Add proper waits:
```typescript
await expect(element).toBeVisible({ timeout: 5000 });
```

### Issue: "Accessibility violations"

**Solution**: Fix the violations reported by axe:
```typescript
// Read the violation details
const results = await axe(container);
console.log(results.violations);
```

### Issue: "Flaky tests"

**Solutions**:
- Add proper waits instead of arbitrary timeouts
- Use `waitFor` for async updates
- Mock time-dependent functions
- Ensure proper cleanup between tests

## Test Data Management

### Test Users

Create unique test users to avoid conflicts:

```typescript
const testUser = {
  email: `test-${Date.now()}@petforce.test`,
  password: 'TestP@ssw0rd123!',
};
```

### Test Environment

E2E tests run against: `http://localhost:5173`

Set up test database with: `npm run db:test:setup`

## Performance Testing

For performance testing, see:
- `docs/PERFORMANCE.md` - Performance benchmarks
- Lighthouse CI configuration
- Core Web Vitals monitoring

## Security Testing

For security testing, see:
- `docs/SECURITY.md` - Security testing guide
- OWASP testing checklist
- Penetration testing procedures

## Additional Resources

- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Remember**: If you didn't break it, you didn't try hard enough! - Tucker, QA Guardian
