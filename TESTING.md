# PetForce Testing Strategy

Comprehensive testing documentation for the PetForce authentication system.

## Overview

The PetForce project uses a multi-layered testing approach:

1. **Unit Tests** - Individual components and utilities
2. **Integration Tests** - Complete user flows
3. **E2E Tests** - Full application testing (future)

## Test Stack

### Web Application
- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **DOM**: jsdom
- **Coverage**: V8

### Mobile Application
- **Framework**: Jest (React Native default)
- **Testing Library**: React Native Testing Library
- **Future**: Detox for E2E testing

### Shared Packages
- **Framework**: Vitest
- **Coverage**: V8

## Running Tests

### Web App
```bash
cd apps/web

# Run all tests
npm test

# Watch mode
npm test -- --watch

# UI mode (recommended for development)
npm run test:ui

# Coverage report
npm run test:coverage
```

### Auth Package
```bash
cd packages/auth

# Run all tests
npm test

# With coverage
npm run test:coverage
```

### All Tests (from root)
```bash
# Run tests in all workspaces
npm test --workspaces
```

## Test Coverage

Current test coverage:

### Web App (`apps/web`)
- ✅ Button component - 100%
- ✅ Input component - 100%
- ✅ PasswordStrengthIndicator - 95%
- ✅ LoginPage - 90%
- ✅ Auth flow integration - 85%

### Auth Package (`packages/auth`)
- ✅ Validation utilities - 100%
- ✅ Auth store - 90%
- ⏳ API functions - TODO
- ⏳ Hooks - TODO

### Mobile App (`apps/mobile`)
- ⏳ Components - TODO
- ⏳ Screens - TODO
- ⏳ Navigation - TODO

## Test Organization

### Directory Structure

```
apps/web/
├── src/
│   ├── components/
│   │   └── ui/
│   │       └── __tests__/
│   │           ├── Button.test.tsx
│   │           └── Input.test.tsx
│   ├── features/
│   │   └── auth/
│   │       ├── components/__tests__/
│   │       ├── pages/__tests__/
│   │       └── __tests__/
│   │           └── auth-flow.integration.test.tsx
│   └── test/
│       ├── setup.ts
│       ├── mocks/
│       │   └── auth.ts
│       └── utils/
│           └── test-utils.tsx
└── vitest.config.ts

packages/auth/
├── src/
│   └── __tests__/
│       ├── setup.ts
│       ├── utils/
│       │   └── validation.test.ts
│       ├── stores/
│       │   └── authStore.test.ts
│       └── api/
└── vitest.config.ts
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithRouter } from '@/test/utils/test-utils';
import { LoginPage } from './LoginPage';

describe('Login Flow', () => {
  it('completes login successfully', async () => {
    const user = userEvent.setup();

    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Assertions...
  });
});
```

### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('logs in user', async () => {
    const { result } = renderHook(() => useAuth());

    await result.current.loginWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    });
  });
});
```

## Test Utilities

### Custom Render Functions

```typescript
// Render with React Router
import { renderWithRouter } from '@/test/utils/test-utils';

renderWithRouter(<MyComponent />, {
  initialRoute: '/auth/login'
});
```

### Mock Data

```typescript
import { mockUser, mockTokens } from '@/test/mocks/auth';

// Use in tests
mockUseAuth.user = mockUser;
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**: Testing implementation details
```typescript
expect(component.state.count).toBe(5);
```

✅ **Good**: Testing user behavior
```typescript
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. Use Semantic Queries

❌ **Bad**: Using test IDs
```typescript
getByTestId('submit-button');
```

✅ **Good**: Using accessible roles and labels
```typescript
getByRole('button', { name: /submit/i });
getByLabelText(/email address/i);
```

### 3. Test Async Correctly

❌ **Bad**: Using setTimeout
```typescript
setTimeout(() => {
  expect(element).toBeInTheDocument();
}, 1000);
```

✅ **Good**: Using waitFor
```typescript
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

### 4. Keep Tests Isolated

✅ **Good**: Each test is independent
```typescript
beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
});
```

### 5. Descriptive Test Names

✅ **Good**: Clear test descriptions
```typescript
it('shows error message when login fails with invalid credentials', () => {
  // Test implementation
});
```

## Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Web Components | 80% | 95% |
| Auth Package | 90% | 85% |
| Mobile Components | 80% | 0% (TODO) |
| Integration Tests | Critical paths | 75% |

## Continuous Integration

### GitHub Actions (Future)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test --workspaces
      - run: npm run test:coverage --workspaces
      - uses: codecov/codecov-action@v3
```

## Accessibility Testing

All components should pass basic accessibility checks:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Performance Testing

For critical components, use performance benchmarks:

```typescript
it('renders large list efficiently', () => {
  const startTime = performance.now();

  render(<LargeList items={1000} />);

  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(100); // 100ms threshold
});
```

## Future Enhancements

- [ ] E2E tests with Playwright (web)
- [ ] E2E tests with Detox (mobile)
- [ ] Visual regression testing with Percy/Chromatic
- [ ] Accessibility audits with axe-core
- [ ] Performance benchmarks
- [ ] Load testing for auth flows
- [ ] Security testing for authentication
- [ ] Mobile device testing with BrowserStack

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
```bash
# Solution: Increase timeout
vitest --test-timeout=10000
```

**Issue**: Mock not working
```typescript
// Solution: Define mock before imports
vi.mock('@petforce/auth', () => ({
  useAuth: () => mockUseAuth,
}));
```

**Issue**: Cannot find module
```bash
# Solution: Check path aliases in vitest.config.ts
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

---

**Last Updated**: January 24, 2026
**Maintainers**: PetForce Development Team
