# Testing Guide for PetForce Web App

This directory contains test utilities, mocks, and configuration for the web application.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/test/
├── setup.ts           # Global test setup
├── mocks/
│   └── auth.ts        # Mock auth utilities and hooks
└── utils/
    └── test-utils.tsx # Custom render functions with providers
```

## Writing Tests

### Unit Tests for Components

Place tests next to the components in `__tests__` folders:

```typescript
// src/components/ui/__tests__/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### Integration Tests

Place integration tests in feature folders:

```typescript
// src/features/auth/__tests__/auth-flow.integration.test.tsx
import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '@/test/utils/test-utils';
import { LoginPage } from '../pages/LoginPage';

describe('Login Flow', () => {
  it('completes full login', async () => {
    renderWithRouter(<LoginPage />);
    // Test implementation
  });
});
```

### Using Test Utilities

```typescript
import { renderWithRouter, userEvent } from '@/test/utils/test-utils';

// Render with router
const { container } = renderWithRouter(<MyComponent />, {
  initialRoute: '/auth/login'
});

// User interactions
const user = userEvent.setup();
await user.click(screen.getByRole('button'));
await user.type(screen.getByLabelText('Email'), 'test@example.com');
```

### Mocking Auth Hooks

```typescript
import { vi } from 'vitest';
import { mockUseAuth } from '@/test/mocks/auth';

vi.mock('@petforce/auth', () => ({
  useAuth: () => mockUseAuth,
}));

// In your test
mockUseAuth.loginWithPassword.mockResolvedValue({ success: true });
```

## Best Practices

1. **Test user behavior, not implementation**
   - Use `screen.getByRole()` and `screen.getByLabelText()`
   - Avoid querying by class names or test IDs

2. **Use async utilities correctly**
   - Use `waitFor()` for async state changes
   - Use `userEvent` instead of `fireEvent`

3. **Mock external dependencies**
   - Mock API calls
   - Mock auth hooks
   - Mock navigation

4. **Write descriptive test names**
   - Use "it should..." format
   - Be specific about what you're testing

5. **Keep tests isolated**
   - Don't rely on test execution order
   - Clean up after each test (automatic with setup)

## Coverage Goals

- **Components**: 80%+ coverage
- **Utilities**: 90%+ coverage
- **Integration**: Critical paths covered

## Common Patterns

### Testing Forms

```typescript
it('submits form with valid data', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();

  render(<MyForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com'
    });
  });
});
```

### Testing Navigation

```typescript
it('navigates to correct page', async () => {
  const user = userEvent.setup();
  const mockNavigate = vi.fn();

  vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
  }));

  render(<MyComponent />);
  await user.click(screen.getByText('Go to Dashboard'));

  expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
});
```

### Testing Async State

```typescript
it('shows loading state', async () => {
  mockUseAuth.isLoading = true;
  render(<MyComponent />);

  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

it('shows error state', () => {
  mockUseAuth.error = { code: 'ERROR', message: 'Something went wrong' };
  render(<MyComponent />);

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Troubleshooting

### Tests timing out

Increase timeout in individual tests:
```typescript
it('slow test', async () => {
  // Test implementation
}, 10000); // 10 second timeout
```

### Module not found

Check path aliases in `vitest.config.ts` and `tsconfig.json`.

### Mocks not working

Ensure mocks are defined before imports:
```typescript
vi.mock('@petforce/auth', () => ({
  useAuth: () => mockUseAuth,
}));

import { MyComponent } from './MyComponent'; // After mock
```
