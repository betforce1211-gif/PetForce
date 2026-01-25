# PetForce API Reference

Complete API documentation for the PetForce authentication system.

## Table of Contents

- [Authentication API](#authentication-api)
- [React Hooks](#react-hooks)
- [State Management](#state-management)
- [Utilities](#utilities)

## Authentication API

### Email/Password Authentication

#### `loginWithPassword`

Authenticate user with email and password.

```typescript
import { loginWithPassword } from '@petforce/auth';

const result = await loginWithPassword({
  email: 'user@example.com',
  password: 'SecurePassword123!'
});

if (result.success) {
  console.log('User:', result.user);
  console.log('Tokens:', result.tokens);
} else {
  console.error('Error:', result.error);
}
```

**Parameters:**
- `credentials`: `LoginRequest`
  - `email`: string - User's email address
  - `password`: string - User's password

**Returns:** `Promise<AuthResult>`
- `success`: boolean
- `user?`: User object if successful
- `tokens?`: AuthTokens if successful
- `error?`: AuthError if failed

#### `registerWithPassword`

Register a new user with email and password.

```typescript
import { registerWithPassword } from '@petforce/auth';

const result = await registerWithPassword({
  email: 'newuser@example.com',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe'
});
```

**Parameters:**
- `credentials`: `RegisterRequest`
  - `email`: string - User's email
  - `password`: string - User's password
  - `firstName?`: string - Optional first name
  - `lastName?`: string - Optional last name

**Returns:** `Promise<AuthResult>`

#### `logout`

Sign out the current user and clear session.

```typescript
import { logout } from '@petforce/auth';

await logout();
```

**Returns:** `Promise<void>`

### Magic Link Authentication

#### `sendMagicLink`

Send a passwordless magic link to user's email.

```typescript
import { sendMagicLink } from '@petforce/auth';

const result = await sendMagicLink('user@example.com');

if (result.success) {
  console.log('Magic link sent!');
}
```

**Parameters:**
- `email`: string - User's email address
- `redirectTo?`: string - Optional redirect URL after verification

**Returns:** `Promise<{ success: boolean; message: string; error?: AuthError }>`

#### `verifyMagicLink`

Verify a magic link token.

```typescript
import { verifyMagicLink } from '@petforce/auth';

const result = await verifyMagicLink(token, 'magiclink');

if (result.success) {
  console.log('User authenticated:', result.user);
}
```

**Parameters:**
- `token`: string - Magic link token from URL
- `type?`: 'magiclink' | 'email' - Type of verification (default: 'magiclink')

**Returns:** `Promise<AuthResult>`

### OAuth Authentication

#### `signInWithGoogle`

Initiate Google OAuth flow.

```typescript
import { signInWithGoogle } from '@petforce/auth';

const result = await signInWithGoogle();

if (result.success && result.url) {
  // Redirect to OAuth URL
  window.location.href = result.url;
}
```

**Returns:** `Promise<{ success: boolean; url?: string; error?: AuthError }>`

#### `signInWithApple`

Initiate Apple OAuth flow.

```typescript
import { signInWithApple } from '@petforce/auth';

const result = await signInWithApple();
```

**Returns:** `Promise<{ success: boolean; url?: string; error?: AuthError }>`

#### `handleOAuthCallback`

Handle OAuth callback after redirect.

```typescript
import { handleOAuthCallback } from '@petforce/auth';

// Called automatically on callback page
const result = await handleOAuthCallback();

if (result.success) {
  console.log('OAuth complete:', result.user);
}
```

**Returns:** `Promise<AuthResult>`

### Biometric Authentication

#### `isBiometricAvailable`

Check if biometric authentication is available on device.

```typescript
import { isBiometricAvailable } from '@petforce/auth';

const { available, biometryType } = await isBiometricAvailable();

if (available) {
  console.log('Biometrics available:', biometryType);
  // 'FaceID', 'TouchID', 'Fingerprint', or 'Biometrics'
}
```

**Returns:** `Promise<{ available: boolean; biometryType?: string; error?: AuthError }>`

#### `authenticateWithBiometrics`

Authenticate user with biometrics.

```typescript
import { authenticateWithBiometrics } from '@petforce/auth';

const result = await authenticateWithBiometrics('Sign in to PetForce');

if (result.success) {
  console.log('Biometric authentication successful');
}
```

**Parameters:**
- `promptMessage?`: string - Message to show in biometric prompt

**Returns:** `Promise<{ success: boolean; error?: AuthError }>`

### Password Reset

#### `sendResetEmail`

Send password reset email.

```typescript
import { usePasswordReset } from '@petforce/auth';

const { sendResetEmail } = usePasswordReset();

await sendResetEmail('user@example.com');
```

**Parameters:**
- `email`: string - User's email address

**Returns:** `Promise<void>`

#### `resetPassword`

Reset password with token.

```typescript
import { usePasswordReset } from '@petforce/auth';

const { resetPassword } = usePasswordReset();

await resetPassword('newSecurePassword123!');
```

**Parameters:**
- `password`: string - New password

**Returns:** `Promise<void>`

## React Hooks

### `useAuth`

Main authentication hook.

```typescript
import { useAuth } from '@petforce/auth';

function LoginForm() {
  const {
    loginWithPassword,
    registerWithPassword,
    logout,
    isLoading,
    error,
    user
  } = useAuth();

  const handleLogin = async () => {
    await loginWithPassword({ email, password });
  };

  return (
    <>
      {error && <ErrorMessage error={error} />}
      <Button onClick={handleLogin} isLoading={isLoading}>
        Sign In
      </Button>
    </>
  );
}
```

**Returns:**
- `loginWithPassword`: (credentials: LoginRequest) => Promise<AuthResult>
- `registerWithPassword`: (credentials: RegisterRequest) => Promise<AuthResult>
- `logout`: () => Promise<void>
- `isLoading`: boolean
- `error`: AuthError | null
- `user`: User | null

### `useOAuth`

OAuth authentication hook.

```typescript
import { useOAuth } from '@petforce/auth';

function SocialLogin() {
  const { loginWithGoogle, loginWithApple, isLoading } = useOAuth();

  return (
    <>
      <Button onClick={loginWithGoogle} isLoading={isLoading}>
        Sign in with Google
      </Button>
      <Button onClick={loginWithApple} isLoading={isLoading}>
        Sign in with Apple
      </Button>
    </>
  );
}
```

**Returns:**
- `loginWithGoogle`: () => Promise<void>
- `loginWithApple`: () => Promise<void>
- `isLoading`: boolean
- `error`: AuthError | null

### `useMagicLink`

Magic link authentication hook.

```typescript
import { useMagicLink } from '@petforce/auth';

function MagicLinkForm() {
  const { sendLink, isLoading, error, emailSent } = useMagicLink();

  if (emailSent) {
    return <div>Check your email!</div>;
  }

  return (
    <Button onClick={() => sendLink(email)} isLoading={isLoading}>
      Send Magic Link
    </Button>
  );
}
```

**Returns:**
- `sendLink`: (email: string) => Promise<void>
- `isLoading`: boolean
- `error`: AuthError | null
- `emailSent`: boolean

### `useBiometrics`

Biometric authentication hook (mobile only).

```typescript
import { useBiometrics } from '@petforce/auth';

function BiometricLogin() {
  const { authenticate, isAvailable, isEnrolled } = useBiometrics();

  if (!isAvailable) {
    return <div>Biometrics not available</div>;
  }

  return (
    <Button onClick={authenticate}>
      Sign in with {isAvailable.biometryType}
    </Button>
  );
}
```

**Returns:**
- `authenticate`: (promptMessage?: string) => Promise<void>
- `isAvailable`: { available: boolean; biometryType?: string }
- `isEnrolled`: boolean
- `isLoading`: boolean
- `error`: AuthError | null

### `usePasswordReset`

Password reset hook.

```typescript
import { usePasswordReset } from '@petforce/auth';

function ForgotPassword() {
  const {
    sendResetEmail,
    resetPassword,
    isLoading,
    error,
    emailSent,
    resetComplete
  } = usePasswordReset();

  return (
    // Implementation
  );
}
```

**Returns:**
- `sendResetEmail`: (email: string) => Promise<void>
- `resetPassword`: (password: string) => Promise<void>
- `isLoading`: boolean
- `error`: AuthError | null
- `emailSent`: boolean
- `resetComplete`: boolean

## State Management

### `useAuthStore`

Zustand store for global auth state.

```typescript
import { useAuthStore } from '@petforce/auth';

function UserProfile() {
  const { user, tokens, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect to="/auth/login" />;
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <Button onClick={logout}>Logout</Button>
    </div>
  );
}
```

**State:**
- `user`: User | null
- `tokens`: AuthTokens | null
- `isAuthenticated`: boolean
- `isLoading`: boolean
- `isHydrated`: boolean

**Actions:**
- `setUser`: (user: User | null) => void
- `setTokens`: (tokens: AuthTokens | null) => Promise<void>
- `logout`: () => Promise<void>
- `refreshSession`: () => Promise<void>

## Utilities

### Validation

#### `validateEmail`

Validate email address format.

```typescript
import { validateEmail } from '@petforce/auth';

if (validateEmail('user@example.com')) {
  console.log('Valid email');
}
```

**Parameters:**
- `email`: string

**Returns:** `boolean`

#### `validatePassword`

Validate password strength and requirements.

```typescript
import { validatePassword } from '@petforce/auth';

const result = validatePassword('MyPassword123!');

if (result.valid) {
  console.log('Password meets requirements');
} else {
  console.error('Errors:', result.errors);
}
```

**Parameters:**
- `password`: string

**Returns:** `{ valid: boolean; errors: string[] }`

#### `calculatePasswordStrength`

Calculate password strength score.

```typescript
import { calculatePasswordStrength } from '@petforce/auth';

const strength = calculatePasswordStrength('MyPassword123!');

console.log(strength);
// {
//   score: 4,
//   label: 'Strong',
//   color: '#2D9B87'
// }
```

**Parameters:**
- `password`: string

**Returns:** `{ score: number; label: string; color: string }`
- `score`: 0-4 (0=very weak, 4=strong)
- `label`: 'Weak' | 'Fair' | 'Good' | 'Strong'
- `color`: Hex color code

## TypeScript Types

### User

```typescript
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;
  authMethods: AuthMethod[];
  preferredAuthMethod?: AuthMethod;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### AuthTokens

```typescript
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}
```

### AuthError

```typescript
interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

### AuthMethod

```typescript
type AuthMethod =
  | 'email_password'
  | 'magic_link'
  | 'google_sso'
  | 'apple_sso'
  | 'biometric';
```

### LoginRequest

```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

### RegisterRequest

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
```

## Error Codes

Common error codes returned by the API:

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email or password is incorrect |
| `USER_NOT_FOUND` | No user found with this email |
| `EMAIL_IN_USE` | Email already registered |
| `WEAK_PASSWORD` | Password doesn't meet requirements |
| `INVALID_EMAIL` | Email format is invalid |
| `TOKEN_EXPIRED` | Auth token has expired |
| `TOKEN_INVALID` | Auth token is invalid |
| `NETWORK_ERROR` | Network connection failed |
| `SERVER_ERROR` | Server encountered an error |
| `BIOMETRIC_NOT_AVAILABLE` | Biometrics not available on device |
| `BIOMETRIC_AUTH_FAILED` | Biometric authentication failed |
| `OAUTH_ERROR` | OAuth flow encountered an error |

## Examples

### Complete Login Flow

```typescript
import { useAuth } from '@petforce/auth';
import { useState } from 'react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithPassword, isLoading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await loginWithPassword({ email, password });

    if (result.success) {
      // Redirect handled by auth state change
      console.log('Login successful');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div>{error.message}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### Registration with Validation

```typescript
import { useAuth, validatePassword } from '@petforce/auth';
import { useState } from 'react';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const { registerWithPassword, isLoading } = useAuth();

  const handlePasswordChange = (value) => {
    setPassword(value);
    const validation = validatePassword(value);
    setErrors(validation.errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (errors.length > 0) {
      return;
    }

    await registerWithPassword({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => handlePasswordChange(e.target.value)}
      />
      {errors.map((error, i) => (
        <div key={i}>{error}</div>
      ))}
      <button type="submit" disabled={isLoading || errors.length > 0}>
        Create Account
      </button>
    </form>
  );
}
```

### Protected Route

```typescript
import { useAuthStore } from '@petforce/auth';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  return children;
}
```

---

**Last Updated**: January 24, 2026
**Version**: 0.1.0
