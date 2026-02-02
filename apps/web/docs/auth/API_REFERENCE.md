# Authentication API Reference

Complete API reference for PetForce authentication, including duplicate email detection.

## Table of Contents

1. [Overview](#overview)
2. [Registration API](#registration-api)
3. [Error Codes](#error-codes)
4. [Error Handling](#error-handling)
5. [Helper Functions](#helper-functions)
6. [TypeScript Types](#typescript-types)
7. [Examples](#examples)

## Overview

PetForce uses Supabase for authentication. This document covers the registration API with focus on duplicate email detection.

### Base Configuration

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
```

### Authentication Flow

```
Client → Supabase API → Database → Response → Client
         ↓
    Validation &
    Duplicate Check
```

## Registration API

### `registerWithPassword`

Register a new user with email and password.

#### Function Signature

```typescript
async function registerWithPassword(params: {
  email: string;
  password: string;
}): Promise<AuthResult>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | `string` | Yes | User's email address |
| `password` | `string` | Yes | User's password (min 8 chars) |

#### Returns

```typescript
interface AuthResult {
  success: boolean;
  message?: string;
  error?: AuthError;
  confirmationRequired?: boolean;
  user?: User;
}
```

#### Behavior

1. Validates email format
2. Sends registration request to Supabase
3. Supabase checks for duplicate email
4. Returns success or error

#### Success Response

```typescript
{
  success: true,
  confirmationRequired: true,
  user: {
    id: 'uuid-here',
    email: 'newuser@petforce.com',
    email_confirmed_at: null,
    created_at: '2026-02-01T10:00:00Z'
  }
}
```

#### Error Response (Duplicate Email)

```typescript
{
  success: false,
  message: 'User already registered',
  error: {
    code: 'USER_ALREADY_EXISTS',
    message: 'User already registered'
  }
}
```

#### Example Usage

```typescript
import { useAuth } from '@petforce/auth';

function RegistrationForm() {
  const { registerWithPassword, isLoading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await registerWithPassword({
      email: 'buddy@petforce.com',
      password: 'SecureP@ss123'
    });

    if (result.success) {
      // Navigate to email verification page
      navigate(`/verify-pending?email=${email}`);
    } else {
      // Error is available in hook's error state
      console.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && <ErrorMessage error={error} />}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
```

### Underlying Supabase API

Direct Supabase API call (you usually don't call this directly):

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    emailRedirectTo: 'https://petforce.com/auth/callback',
    data: {
      // Additional user metadata
    }
  }
});
```

## Error Codes

### Standard Error Codes

| Code | Meaning | User Action |
|------|---------|-------------|
| `USER_ALREADY_EXISTS` | Email already registered | Sign in or reset password |
| `INVALID_EMAIL` | Email format invalid | Check email format |
| `WEAK_PASSWORD` | Password too weak | Choose stronger password |
| `NETWORK_ERROR` | Connection failed | Check internet, try again |
| `RATE_LIMITED` | Too many requests | Wait and try again |
| `EMAIL_NOT_CONFIRMED` | Email not verified | Check inbox, resend email |
| `INVALID_CREDENTIALS` | Wrong email/password | Try again or reset password |

### Supabase-Specific Errors

Supabase may return these error names:

- `AuthApiError` - General auth API error
- `AuthSessionMissingError` - No valid session
- `AuthWeakPasswordError` - Password too weak
- `AuthPKCEGrantCodeExchangeError` - OAuth flow error

### Error Response Format

All errors follow this structure:

```typescript
interface AuthError {
  code: string;           // Error code (e.g., 'USER_ALREADY_EXISTS')
  message: string;        // Human-readable message
  status?: number;        // HTTP status code
  details?: any;          // Additional error details
}
```

## Error Handling

### `getAuthErrorMessage`

Converts technical errors into user-friendly messages.

#### Function Signature

```typescript
function getAuthErrorMessage(
  error: { code?: string; message?: string } | null,
  context?: {
    onSwitchToLogin?: () => void;
    onForgotPassword?: () => void;
  }
): ErrorMessageConfig | null
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `error` | `AuthError \| null` | Yes | Error from auth API |
| `context.onSwitchToLogin` | `() => void` | No | Callback to switch to login |
| `context.onForgotPassword` | `() => void` | No | Callback for password reset |

#### Returns

```typescript
interface ErrorMessageConfig {
  title: string;           // Error title
  message: string;         // User-friendly message
  action?: {
    text: string;          // Button text
    onClick: () => void;   // Button action
  };
}
```

#### Example

```typescript
import { getAuthErrorMessage } from '@/features/auth/utils/error-messages';

function MyForm() {
  const { error } = useAuth();

  const errorConfig = getAuthErrorMessage(error, {
    onSwitchToLogin: () => navigate('/auth?mode=login'),
    onForgotPassword: () => navigate('/forgot-password'),
  });

  if (errorConfig) {
    return (
      <div role="alert" className="error-alert">
        <h3>{errorConfig.title}</h3>
        <p>{errorConfig.message}</p>
        {errorConfig.action && (
          <button onClick={errorConfig.action.onClick}>
            {errorConfig.action.text}
          </button>
        )}
      </div>
    );
  }

  return <Form />;
}
```

#### Error Detection Logic

The function detects duplicate email errors by checking multiple conditions:

```typescript
// Duplicate email detection
if (
  errorCode === 'USER_ALREADY_EXISTS' ||
  errorMessage.toLowerCase().includes('user already registered') ||
  errorMessage.toLowerCase().includes('email already') ||
  errorMessage.toLowerCase().includes('already exists')
) {
  return {
    title: 'Email Already Registered',
    message: 'This email is already associated with an account. Would you like to sign in instead or reset your password?',
    action: {
      text: 'Switch to Sign In',
      onClick: context.onSwitchToLogin
    }
  };
}
```

### Error Message Examples

#### Duplicate Email

```typescript
{
  title: 'Email Already Registered',
  message: 'This email is already associated with an account. Would you like to sign in instead or reset your password?',
  action: {
    text: 'Switch to Sign In',
    onClick: () => { /* switch to login */ }
  }
}
```

#### Invalid Credentials

```typescript
{
  title: 'Invalid Credentials',
  message: 'The email or password you entered is incorrect. Please try again.',
  action: {
    text: 'Forgot Password?',
    onClick: () => { /* navigate to reset */ }
  }
}
```

#### Weak Password

```typescript
{
  title: 'Password Too Weak',
  message: 'Please choose a stronger password. Use at least 8 characters with a mix of letters, numbers, and symbols.'
}
```

#### Network Error

```typescript
{
  title: 'Connection Error',
  message: 'Unable to connect to the server. Please check your internet connection and try again.'
}
```

## Helper Functions

### `useAuth` Hook

React hook for authentication operations.

```typescript
function useAuth(): {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  registerWithPassword: (params: RegisterParams) => Promise<AuthResult>;
  loginWithPassword: (params: LoginParams) => Promise<AuthResult>;
  logout: () => Promise<void>;
}
```

#### Example

```typescript
import { useAuth } from '@petforce/auth';

function MyComponent() {
  const {
    user,
    isLoading,
    error,
    registerWithPassword,
    loginWithPassword,
    logout
  } = useAuth();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <LoginForm />;

  return <Dashboard user={user} onLogout={logout} />;
}
```

### Email Validation

Built-in email validation:

```typescript
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Password Strength

Check password strength:

```typescript
function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const score = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

  if (score < 3) return 'weak';
  if (score < 4) return 'medium';
  return 'strong';
}
```

## TypeScript Types

### Core Types

```typescript
// User object
interface User {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  user_metadata?: Record<string, any>;
}

// Auth result
interface AuthResult {
  success: boolean;
  message?: string;
  error?: AuthError;
  confirmationRequired?: boolean;
  user?: User;
}

// Auth error
interface AuthError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}

// Registration parameters
interface RegisterParams {
  email: string;
  password: string;
}

// Login parameters
interface LoginParams {
  email: string;
  password: string;
}

// Error message configuration
interface ErrorMessageConfig {
  title: string;
  message: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}
```

### Import Paths

```typescript
// Types
import type { User, AuthError, AuthResult } from '@petforce/auth';

// Functions
import { getAuthErrorMessage } from '@/features/auth/utils/error-messages';

// Hooks
import { useAuth } from '@petforce/auth';

// Components
import { EmailPasswordForm } from '@/features/auth/components/EmailPasswordForm';
```

## Examples

### Complete Registration Flow

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@petforce/auth';
import { getAuthErrorMessage } from '@/features/auth/utils/error-messages';

function RegistrationPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { registerWithPassword, isLoading, error } = useAuth();

  const errorConfig = getAuthErrorMessage(error, {
    onSwitchToLogin: () => navigate('/auth?mode=login'),
    onForgotPassword: () => navigate('/forgot-password'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    const result = await registerWithPassword({ email, password });

    if (result.success) {
      if (result.confirmationRequired) {
        navigate(`/verify-pending?email=${encodeURIComponent(email)}`);
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create Your PetForce Account</h1>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm password"
        required
      />

      {errorConfig && (
        <div role="alert" className="error">
          <h3>{errorConfig.title}</h3>
          <p>{errorConfig.message}</p>
          {errorConfig.action && (
            <button type="button" onClick={errorConfig.action.onClick}>
              {errorConfig.action.text}
            </button>
          )}
        </div>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}
```

### Handling Duplicate Email with Inline Actions

```typescript
function RegistrationWithInlineActions() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const { registerWithPassword, error } = useAuth();

  const errorConfig = getAuthErrorMessage(error, {
    onSwitchToLogin: () => setMode('login'),
    onForgotPassword: () => navigate('/forgot-password'),
  });

  if (mode === 'login') {
    return <LoginForm />;
  }

  return (
    <div>
      <RegistrationForm onSubmit={registerWithPassword} />

      {errorConfig && (
        <Alert variant="error">
          <AlertTitle>{errorConfig.title}</AlertTitle>
          <AlertDescription>{errorConfig.message}</AlertDescription>
          {errorConfig.action && (
            <Button onClick={errorConfig.action.onClick}>
              {errorConfig.action.text}
            </Button>
          )}
        </Alert>
      )}
    </div>
  );
}
```

### Custom Error Handling

```typescript
function CustomErrorHandler() {
  const { registerWithPassword, error } = useAuth();

  const handleError = (error: AuthError) => {
    switch (error.code) {
      case 'USER_ALREADY_EXISTS':
        toast.error('This email is already registered', {
          action: {
            label: 'Sign in',
            onClick: () => navigate('/login'),
          },
        });
        break;

      case 'WEAK_PASSWORD':
        toast.error('Please choose a stronger password');
        break;

      case 'NETWORK_ERROR':
        toast.error('Connection error. Please check your internet.');
        break;

      default:
        toast.error(error.message || 'An error occurred');
    }
  };

  const handleSubmit = async (email: string, password: string) => {
    const result = await registerWithPassword({ email, password });

    if (!result.success && result.error) {
      handleError(result.error);
    }
  };

  return <RegistrationForm onSubmit={handleSubmit} />;
}
```

### Testing Error Scenarios

```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mock the auth hook
vi.mock('@petforce/auth', () => ({
  useAuth: () => ({
    registerWithPassword: vi.fn().mockResolvedValue({
      success: false,
      error: {
        code: 'USER_ALREADY_EXISTS',
        message: 'User already registered',
      },
    }),
    isLoading: false,
    error: {
      code: 'USER_ALREADY_EXISTS',
      message: 'User already registered',
    },
  }),
}));

describe('Duplicate Email Error', () => {
  it('shows error when email already exists', async () => {
    render(<RegistrationForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'existing@petforce.com');
    await userEvent.type(screen.getByLabelText('Password'), 'SecureP@ss123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/already registered/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
```

## Rate Limiting

Supabase provides built-in rate limiting. Typical limits:

- **Registration attempts**: 5 per hour per IP
- **Login attempts**: 10 per 5 minutes per IP
- **Password reset**: 3 per hour per email

When rate limited, you'll receive:

```typescript
{
  code: 'RATE_LIMITED',
  message: 'Too many requests. Please try again later.',
  status: 429
}
```

Handle rate limiting gracefully:

```typescript
if (error?.code === 'RATE_LIMITED') {
  return (
    <Alert variant="warning">
      <p>Too many attempts. Please wait a few minutes and try again.</p>
    </Alert>
  );
}
```

## Security Considerations

### Email Enumeration

Our current implementation reveals when an email exists (for better UX). To prevent abuse:

1. **Rate limiting** - Supabase enforces per-IP limits
2. **CAPTCHA** - Add after failed attempts (future)
3. **Monitoring** - Alert on enumeration patterns (future)

### Password Requirements

Enforce strong passwords:

```typescript
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireLowercase: true,
  requireUppercase: true,
  requireNumber: true,
  requireSymbol: true,
};
```

### HTTPS Only

All auth requests must use HTTPS in production:

```typescript
if (process.env.NODE_ENV === 'production' && !window.location.protocol.startsWith('https')) {
  throw new Error('Authentication requires HTTPS');
}
```

## Migration Guide

### From Direct Supabase to useAuth Hook

**Before:**
```typescript
const { data, error } = await supabase.auth.signUp({ email, password });
if (error) {
  console.error(error.message);
}
```

**After:**
```typescript
const { registerWithPassword, error } = useAuth();
const result = await registerWithPassword({ email, password });

const errorConfig = getAuthErrorMessage(error);
if (errorConfig) {
  showError(errorConfig.title, errorConfig.message);
}
```

### Adding to Existing Form

```typescript
// 1. Import hook
import { useAuth } from '@petforce/auth';
import { getAuthErrorMessage } from '@/features/auth/utils/error-messages';

// 2. Use hook
const { registerWithPassword, isLoading, error } = useAuth();

// 3. Handle submission
const handleSubmit = async (e) => {
  e.preventDefault();
  await registerWithPassword({ email, password });
};

// 4. Display errors
const errorConfig = getAuthErrorMessage(error, {
  onSwitchToLogin: () => navigate('/login')
});
```

## Related Documentation

- [Duplicate Email Detection Guide](./DUPLICATE_EMAIL_DETECTION.md)
- [Architecture Decision Record](./ADR-001-DUPLICATE-EMAIL-DETECTION.md)
- [Testing Guide](../TESTING.md)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Maintained By**: Thomas (Documentation Guardian)
**Last Updated**: 2026-02-01
**Version**: 1.0.0
