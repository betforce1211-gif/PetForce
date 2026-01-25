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
- `success`: boolean
- `message`: string - Status message
- `confirmationRequired?`: boolean - true if email confirmation is needed
- `error?`: AuthError if failed

**Email Confirmation Flow:**

When email confirmation is enabled (default), new users must verify their email before logging in:

1. User registers → receives verification email
2. User clicks link in email → email confirmed
3. User can now log in

**Note:** Login attempts before email confirmation will fail with error code `EMAIL_NOT_CONFIRMED`.

#### `resendConfirmationEmail`

Resend email confirmation link to user.

```typescript
import { resendConfirmationEmail } from '@petforce/auth';

const result = await resendConfirmationEmail('user@example.com');

if (result.success) {
  console.log('Verification email resent');
}
```

**Parameters:**
- `email`: string - User's email address

**Returns:** `Promise<{ success: boolean; message: string; error?: AuthError }>`

**Rate Limiting:** Maximum 1 resend per 5 minutes per email address (enforced client-side)

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
| `EMAIL_NOT_CONFIRMED` | Email verification required before login |
| `BIOMETRIC_NOT_AVAILABLE` | Biometrics not available on device |
| `BIOMETRIC_AUTH_FAILED` | Biometric authentication failed |
| `OAUTH_ERROR` | OAuth flow encountered an error |

## Logging & Observability

### Authentication Event Logging

All authentication operations are automatically logged with structured data for observability and debugging.

**Logged Events:**
- `registration_attempt_started` - User begins registration
- `registration_completed` - User account created (may be unconfirmed)
- `registration_failed` - Registration error occurred
- `email_confirmed` - User clicked verification link
- `login_attempt_started` - User attempts login
- `login_completed` - Successful login
- `login_failed` - Login error occurred
- `login_rejected_unconfirmed` - Login blocked due to unverified email
- `logout_attempt_started` - User begins logout
- `logout_completed` - Successful logout
- `confirmation_email_resend_requested` - Resend email requested
- `confirmation_email_resent` - Verification email resent
- `password_reset_requested` - Password reset requested
- `password_reset_email_sent` - Reset email sent

**Log Structure:**

```typescript
{
  timestamp: "2026-01-25T10:30:00.000Z",
  level: "INFO",
  message: "Auth event: registration_completed",
  context: {
    requestId: "550e8400-e29b-41d4-a716-446655440000",
    eventType: "registration_completed",
    userId: "user-123",
    email: "use***@example.com", // Hashed for privacy
    emailConfirmed: false,
    confirmationRequired: true
  }
}
```

**Request ID Tracking:**

Every auth operation generates a unique `requestId` (UUID v4) that is:
- Included in all log entries for that operation
- Consistent across multiple log events in the same flow
- Used to correlate events for debugging

**Example: Tracing a Registration Flow**

```
[INFO] Auth event: registration_attempt_started
  requestId: "abc-123"
  email: "use***@example.com"

[INFO] Auth event: registration_completed
  requestId: "abc-123"
  userId: "user-456"
  confirmationRequired: true

[INFO] User created but email not confirmed yet
  requestId: "abc-123"
  userId: "user-456"
  message: "User must click verification link..."
```

**Privacy & Security:**
- Email addresses are hashed in logs (first 3 chars + `***@domain.com`)
- Passwords are never logged
- Tokens are never logged
- PII is excluded from production logs

**Metrics Collection:**

The auth system tracks key metrics:
- Registration funnel (started → completed → confirmed)
- Confirmation rate (% of users who verify email)
- Time to confirm (minutes from registration to verification)
- Login success rate
- Unconfirmed login attempts

Access metrics via `metrics.getSummary()`:

```typescript
import { metrics } from '@petforce/auth';

const summary = metrics.getSummary(24 * 60 * 60 * 1000); // Last 24 hours
console.log(summary);
/*
{
  registrationStarted: 150,
  registrationCompleted: 145,
  emailConfirmed: 120,
  loginAttempts: 500,
  loginSuccesses: 475,
  loginRejectedUnconfirmed: 15,
  confirmationRatePercent: 82.76,
  loginSuccessRatePercent: 95.00,
  avgTimeToConfirmMinutes: 8.5
}
*/
```

**Alert Monitoring:**

Built-in health checks for auth system:

```typescript
import { metrics } from '@petforce/auth';

const alerts = metrics.checkAlerts();
alerts.forEach(alert => {
  console.log(`[${alert.level}] ${alert.message}`);
});
/*
Example alerts:
- [warning] Low email confirmation rate: 65% (last hour)
- [critical] Low login success rate: 45%
- [warning] Slow email confirmation: Average 75 minutes
*/
```

## Troubleshooting

### User Not Appearing in Database

**Symptom:** User registers successfully and receives email, but cannot log in.

**Cause:** Email confirmation is enabled. User account exists but is in unconfirmed state.

**Solution:**
1. Check user's email for verification link
2. Click the verification link to confirm email
3. Try logging in again

**Alternative:** Use resend confirmation email:
```typescript
await resendConfirmationEmail('user@example.com');
```

**For Developers:**
- Check `email_confirmed_at` field in `auth.users` table
- Look for `login_rejected_unconfirmed` events in logs
- Verify `enable_confirmations = true` in `supabase/config.toml`

### Email Verification Not Working

**Symptom:** User clicks verification link but still cannot log in.

**Common Causes:**
1. Redirect URL misconfigured
2. Email link expired (links expire after 24 hours)
3. User clicked old link after new one was sent

**Solutions:**
1. Resend verification email
2. Check `emailRedirectTo` configuration
3. Verify email template in Supabase dashboard

### High Unconfirmed User Rate

**Symptom:** Many users register but don't confirm email.

**Solutions:**
1. Check email deliverability (spam folders)
2. Improve verification page UX
3. Send reminder emails after 1 hour
4. Consider disabling email confirmation for development

**Monitoring:**
```typescript
const summary = metrics.getSummary();
if (summary.confirmationRatePercent < 70) {
  console.warn('Low confirmation rate!', summary);
}
```

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
