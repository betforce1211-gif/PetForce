# Email Verification Flow - Developer Guide

**Owner**: Thomas (Documentation) & Engrid (Engineering)
**Status**: Production-Ready
**Last Updated**: 2026-01-25

## Overview

This guide provides a complete technical walkthrough of the email verification flow in PetForce authentication, covering implementation details, integration points, and troubleshooting for developers.

## Table of Contents

- [Quick Start](#quick-start)
- [Complete Flow Diagram](#complete-flow-diagram)
- [Step-by-Step Implementation](#step-by-step-implementation)
- [Components Reference](#components-reference)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 30-Second Overview

```typescript
// 1. User registers
const result = await registerWithPassword({ email, password });
// → User created in database (emailConfirmed: false)
// → Verification email sent automatically by Supabase

// 2. Redirect to pending page
if (result.confirmationRequired) {
  navigate(`/auth/verify-pending?email=${email}`);
}

// 3. User clicks link in email
// → Supabase verifies token
// → Updates user.email_confirmed_at
// → Redirects to /auth/verify with success token

// 4. VerifyEmailPage handles redirect
// → Extracts token from URL
// → Updates local state
// → Shows success message
// → Redirects to login or dashboard
```

---

## Complete Flow Diagram

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Registration & Email Verification Flow    │
└─────────────────────────────────────────────────────────────┘

1. User Registration
   ┌──────────────┐
   │ RegisterPage │
   │              │
   │ [Email]      │
   │ [Password]   │
   │ [Register]   │
   └──────┬───────┘
          │
          │ registerWithPassword({ email, password })
          │
          ▼
   ┌──────────────┐
   │  Auth API    │──────┐
   │              │      │ supabase.auth.signUp()
   │ auth-api.ts  │      │
   └──────┬───────┘      │
          │              ▼
          │         ┌─────────────┐
          │         │  Supabase   │
          │         │  Database   │
          │         │             │
          │         │ User created│
          │         │ confirmed:  │
          │         │   FALSE     │
          │         └──────┬──────┘
          │                │
          │                │ Triggers email send
          │                │
          │                ▼
          │         ┌─────────────┐
          │         │   Supabase  │
          │         │    Email    │
          │         │   Service   │
          │         └──────┬──────┘
          │                │
          │                │ Sends verification email
          │                │
          ▼                ▼
   { success: true,   [User's Inbox]
     confirmationRequired: true }


2. Email Verification Pending
   ┌──────────────────────┐
   │ EmailVerification    │
   │   PendingPage        │
   │                      │
   │ "Check your email"   │
   │ [Resend] button      │
   └──────────────────────┘


3. User Clicks Verification Link
   Email Link:
   https://app.petforce.com/auth/verify?token=xxx&type=signup
          │
          │ Browser redirect
          │
          ▼
   ┌──────────────┐
   │  Supabase    │
   │   Verifies   │
   │    Token     │
   │              │
   │ ✓ Valid?     │
   │ ✓ Not expired│
   │ ✓ Not used?  │
   └──────┬───────┘
          │
          │ If valid: Update database
          │
          ▼
   ┌─────────────┐
   │  Database   │
   │             │
   │ SET         │
   │ confirmed_at│
   │ = NOW()     │
   └──────┬──────┘
          │
          │ Redirect with success
          │
          ▼
   https://app.petforce.com/auth/verify?success=true


4. Verification Complete
   ┌──────────────────────┐
   │   VerifyEmailPage    │
   │                      │
   │ ✓ Email verified!    │
   │ [Continue to Login]  │
   └──────────────────────┘
          │
          │ User clicks "Continue"
          │
          ▼
   ┌──────────────────────┐
   │     LoginPage        │
   │                      │
   │ Now can login ✓      │
   └──────────────────────┘
```

### Error Scenarios

```
Registration Errors:
   ┌──────────────┐
   │ Email exists │──→ Show error, suggest login
   │ Weak password│──→ Show password requirements
   │ Invalid email│──→ Show format error
   └──────────────┘

Verification Errors:
   ┌──────────────┐
   │ Token expired│──→ Show resend button
   │ Token invalid│──→ Show error, suggest re-register
   │ Already used │──→ Show success, redirect to login
   └──────────────┘

Login with Unverified Email:
   ┌──────────────┐
   │ Login blocked│──→ Show "Email not verified" message
   │              │──→ Display resend button
   └──────────────┘
```

---

## Step-by-Step Implementation

### Step 1: User Registration

**File**: `packages/auth/src/api/auth-api.ts`

```typescript
export async function register(
  request: RegisterRequest
): Promise<RegisterResponse> {
  const requestId = generateRequestId();
  logger.info('Auth event: registration_attempt_started', {
    requestId,
    email: hashEmail(request.email),
  });

  try {
    // Call Supabase signUp
    const { data, error } = await supabase.auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        // Redirect URL after email verification
        emailRedirectTo: `${window.location.origin}/auth/verify`,

        // Custom data (optional)
        data: {
          firstName: request.firstName,
          lastName: request.lastName,
        },
      },
    });

    if (error) {
      logger.error('Auth event: registration_failed', {
        requestId,
        email: hashEmail(request.email),
        error: { code: 'REGISTRATION_ERROR', message: error.message },
      });
      return {
        success: false,
        error: { code: 'REGISTRATION_ERROR', message: error.message },
      };
    }

    // Track successful registration
    metrics.trackEvent('registration_attempt', {
      timestamp: Date.now(),
      metadata: { requestId },
    });

    logger.info('Auth event: registration_completed', {
      requestId,
      userId: data.user?.id,
      email: hashEmail(request.email),
      confirmationRequired: true,
    });

    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      confirmationRequired: true,
    };
  } catch (error) {
    // Handle unexpected errors
    logger.error('Auth event: registration_failed', {
      requestId,
      email: hashEmail(request.email),
      error: normalizeError(error),
    });
    return {
      success: false,
      error: { code: 'UNEXPECTED_ERROR', message: 'An unexpected error occurred' },
    };
  }
}
```

**Key Points:**
- `emailRedirectTo` must be configured in Supabase (see Setup section)
- Supabase automatically sends verification email
- User is created with `email_confirmed_at: null`
- Returns `confirmationRequired: true` to indicate pending verification

### Step 2: Redirect to Pending Page

**File**: `apps/web/src/features/auth/pages/RegisterPage.tsx`

```typescript
export function RegisterPage() {
  const navigate = useNavigate();
  const { registerWithPassword, isLoading, error } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    const result = await registerWithPassword({ email, password });

    if (result.success && result.confirmationRequired) {
      // Redirect to pending page with email in query string
      navigate(`/auth/verify-pending?email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <EmailPasswordForm
      mode="register"
      onSuccess={() => {
        // onSuccess is called automatically
      }}
    />
  );
}
```

### Step 3: Email Verification Pending Page

**File**: `apps/web/src/features/auth/pages/EmailVerificationPendingPage.tsx`

```typescript
export function EmailVerificationPendingPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Message */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Check your email
        </h1>
        <p className="text-gray-600">
          We sent a verification link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Click the link in your email to verify your account and sign in.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
        <h3 className="font-semibold text-blue-900 mb-2">Next steps:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Check your inbox for an email from PetForce</li>
          <li>Click the "Verify Email" button in the email</li>
          <li>You'll be redirected back to sign in</li>
        </ol>
      </div>

      {/* Resend button */}
      <div className="pt-4">
        <p className="text-sm text-gray-600 mb-3">
          Didn't receive the email?
        </p>
        <ResendConfirmationButton email={email} />
      </div>

      {/* Check spam folder */}
      <p className="text-xs text-gray-500">
        If you don't see the email, check your spam folder or contact support.
      </p>
    </div>
  );
}
```

### Step 4: User Clicks Email Link

**Email Template** (configured in Supabase):

```html
<!DOCTYPE html>
<html>
<head>
  <title>Verify your PetForce account</title>
</head>
<body>
  <h1>Welcome to PetForce!</h1>
  <p>Thanks for signing up. Click the button below to verify your email address:</p>

  <a href="{{ .ConfirmationURL }}" style="...">
    Verify Email Address
  </a>

  <p>Or copy this link into your browser:</p>
  <p>{{ .ConfirmationURL }}</p>

  <p><small>This link expires in 24 hours.</small></p>
</body>
</html>
```

**Link Format**:
```
https://app.petforce.com/auth/verify?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&type=signup
```

**What Happens:**
1. User clicks link in email
2. Browser opens link (redirects to Supabase first)
3. Supabase validates token:
   - Checks if token is valid
   - Checks if not expired (24 hours)
   - Checks if not already used
4. If valid: Updates `auth.users.email_confirmed_at = NOW()`
5. Redirects to configured `emailRedirectTo` with result:
   - Success: `?success=true` or `?access_token=...`
   - Error: `?error=invalid_token` or `?error=expired_token`

### Step 5: Verify Email Page

**File**: `apps/web/src/features/auth/pages/VerifyEmailPage.tsx`

```typescript
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Check for success parameter
      const success = searchParams.get('success');
      const error = searchParams.get('error');
      const accessToken = searchParams.get('access_token');

      if (success === 'true' || accessToken) {
        // Verification successful
        setStatus('success');

        // If we have tokens, store them
        if (accessToken) {
          const refreshToken = searchParams.get('refresh_token');
          await setTokens({ accessToken, refreshToken, expiresIn: 3600 });
        }

        // Redirect after 3 seconds
        setTimeout(() => {
          if (accessToken) {
            navigate('/dashboard'); // Already authenticated
          } else {
            navigate('/auth/login'); // Need to login
          }
        }, 3000);
      } else if (error) {
        // Verification failed
        setStatus('error');
        setErrorMessage(getErrorMessage(error));
      } else {
        // No parameters, possible direct navigation
        setStatus('error');
        setErrorMessage('Invalid verification link');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  if (status === 'verifying') {
    return (
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Verifying your email...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email verified!
          </h1>
          <p className="text-gray-600">
            Your email has been successfully verified. You can now sign in to your account.
          </p>
        </div>
        <Button onClick={() => navigate('/auth/login')}>
          Continue to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <XCircle className="w-12 h-12 text-red-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Verification failed
        </h1>
        <p className="text-gray-600">{errorMessage}</p>
      </div>
      <div className="space-y-3">
        <Button variant="primary" onClick={() => navigate('/auth/register')}>
          Try Registering Again
        </Button>
        <Button variant="outline" onClick={() => navigate('/auth/login')}>
          Back to Sign In
        </Button>
      </div>
    </div>
  );
}

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'expired_token':
      return 'This verification link has expired. Please request a new one.';
    case 'invalid_token':
      return 'This verification link is invalid. Please request a new one.';
    case 'already_confirmed':
      return 'This email is already verified. You can sign in now.';
    default:
      return 'Verification failed. Please try again or contact support.';
  }
}
```

### Step 6: Resending Verification Email

**File**: `packages/auth/src/api/auth-api.ts`

```typescript
export async function resendConfirmationEmail(
  email: string
): Promise<ResendConfirmationResponse> {
  const requestId = generateRequestId();
  logger.info('Auth event: confirmation_email_resend_requested', {
    requestId,
    email: hashEmail(email),
  });

  try {
    // Call Supabase resend
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    });

    if (error) {
      logger.error('Auth event: confirmation_email_resend_failed', {
        requestId,
        email: hashEmail(email),
        error: { code: 'RESEND_ERROR', message: error.message },
      });
      return {
        success: false,
        error: { code: 'RESEND_ERROR', message: error.message },
      };
    }

    logger.info('Auth event: confirmation_email_resent', {
      requestId,
      email: hashEmail(email),
    });

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    };
  } catch (error) {
    logger.error('Auth event: confirmation_email_resend_failed', {
      requestId,
      email: hashEmail(email),
      error: normalizeError(error),
    });
    return {
      success: false,
      error: { code: 'UNEXPECTED_ERROR', message: 'Failed to resend email' },
    };
  }
}
```

**Rate Limiting:**
- **Client-side**: 5-minute cooldown (managed by ResendConfirmationButton)
- **Server-side**: 3 requests per 15 minutes per email (Supabase default)

---

## Components Reference

### EmailPasswordForm

Used for both login and registration with email verification integration.

```typescript
<EmailPasswordForm
  mode="register"
  onSuccess={() => {
    // Automatically redirects to verify-pending page
  }}
/>
```

**Email Verification Integration:**
- Registration mode automatically handles `confirmationRequired`
- Redirects to `/auth/verify-pending` with email parameter
- Login mode shows resend button for unconfirmed users

### ResendConfirmationButton

Standalone button for resending verification email.

```typescript
<ResendConfirmationButton
  email="user@example.com"
  variant="outline"
  size="md"
/>
```

**Features:**
- 5-minute cooldown timer
- Success/error message display
- Animated feedback
- Automatic success message dismissal

### EmailVerificationPendingPage

Shows after registration to inform user about pending verification.

```typescript
<Route path="/auth/verify-pending" element={<EmailVerificationPendingPage />} />
```

**Features:**
- Displays email address from query parameter
- Instructions for verification
- Resend button with rate limiting
- Spam folder reminder

### VerifyEmailPage

Handles the redirect from email verification link.

```typescript
<Route path="/auth/verify" element={<VerifyEmailPage />} />
```

**Features:**
- Extracts verification result from URL
- Shows success/error state
- Auto-redirects after success
- Error handling with helpful messages

---

## API Reference

### register()

Creates a new user account and triggers email verification.

```typescript
function register(request: RegisterRequest): Promise<RegisterResponse>

interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  confirmationRequired?: boolean;  // True if email verification needed
  error?: AuthError;
}
```

**Returns:**
- `success: true` - Registration successful
- `confirmationRequired: true` - Email verification required
- `message` - User-friendly message to display

### resendConfirmationEmail()

Resends verification email to user.

```typescript
function resendConfirmationEmail(email: string): Promise<ResendConfirmationResponse>

interface ResendConfirmationResponse {
  success: boolean;
  message?: string;
  error?: AuthError;
}
```

**Rate Limiting:**
- Client: 1 request per 5 minutes
- Server: 3 requests per 15 minutes per email

### loginWithPassword()

Attempts login, blocks if email not verified.

```typescript
function loginWithPassword(request: LoginRequest): Promise<LoginResponse>

interface LoginResponse {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  error?: AuthError;  // Error code: 'EMAIL_NOT_CONFIRMED' if not verified
}
```

**Error Handling:**
- If email not confirmed, returns `EMAIL_NOT_CONFIRMED` error
- UI shows error message with resend button

---

## Database Schema

### Supabase Auth Tables

**auth.users** (managed by Supabase):
```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255) NOT NULL,
  email_confirmed_at TIMESTAMPTZ,  -- NULL until verified
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Other fields...
);
```

**Key Fields:**
- `email_confirmed_at`: NULL when user registers, set to NOW() after verification
- Used by Supabase to determine if email is verified
- Login is blocked when this is NULL

**auth.verification_tokens** (internal Supabase table):
```sql
-- Simplified representation
CREATE TABLE auth.verification_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  token_type VARCHAR(50),  -- 'signup', 'recovery', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,  -- 24 hours from creation
  used_at TIMESTAMPTZ      -- NULL until token is used
);
```

**Token Lifecycle:**
1. Created when user registers or requests resend
2. Expires after 24 hours
3. Marked as used after verification
4. Cannot be reused

---

## State Management

### Auth Store Integration

```typescript
// packages/auth/src/stores/authStore.ts

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}

// After successful verification and login
store.setUser({
  id: '123',
  email: 'user@example.com',
  emailVerified: true,  // ✓ Now true
  // ...
});

store.setTokens({
  accessToken: 'xxx',
  refreshToken: 'yyy',
  expiresIn: 3600,
});
```

### Component State

**During Registration:**
```typescript
const [stage, setStage] = useState<'form' | 'pending' | 'verified'>('form');

// After successful registration
if (result.confirmationRequired) {
  setStage('pending');
  navigate('/auth/verify-pending');
}
```

**During Verification:**
```typescript
const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

// After checking URL parameters
if (success) {
  setStatus('success');
} else if (error) {
  setStatus('error');
}
```

---

## Error Handling

### Error Codes

| Code | Scenario | User Message | Action |
|------|----------|--------------|--------|
| `EMAIL_NOT_CONFIRMED` | Login with unverified email | "Please verify your email before signing in." | Show resend button |
| `REGISTRATION_ERROR` | Email already exists | "An account with this email already exists." | Suggest login |
| `RESEND_ERROR` | Rate limit exceeded | "Please wait before requesting another email." | Show countdown |
| `expired_token` | Verification link expired | "This link has expired. Please request a new one." | Show resend option |
| `invalid_token` | Invalid verification link | "This link is invalid. Please try again." | Show support contact |

### Error Handling Patterns

**In Registration:**
```typescript
const result = await registerWithPassword({ email, password });

if (!result.success) {
  if (result.error?.code === 'REGISTRATION_ERROR') {
    // Email exists
    setError('This email is already registered. Try signing in instead.');
    setShowLoginLink(true);
  } else {
    setError(result.error?.message || 'Registration failed');
  }
}
```

**In Login:**
```typescript
const result = await loginWithPassword({ email, password });

if (!result.success) {
  if (result.error?.code === 'EMAIL_NOT_CONFIRMED') {
    // Show special UI for unverified email
    setShowResendButton(true);
    setError('Your email is not verified. Check your inbox or request a new verification email.');
  } else {
    setError(result.error?.message || 'Login failed');
  }
}
```

**In Resend:**
```typescript
const result = await resendConfirmationEmail(email);

if (!result.success) {
  if (result.error?.message.includes('rate limit')) {
    setError('Too many requests. Please wait a few minutes and try again.');
    setCountdown(300); // 5 minutes
  } else {
    setError('Failed to send email. Please try again later.');
  }
}
```

---

## Testing

### Unit Tests

**Test Registration Flow:**
```typescript
// packages/auth/src/__tests__/api/auth-api.test.ts

describe('register()', () => {
  it('should return confirmationRequired: true', async () => {
    const result = await register({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(result.success).toBe(true);
    expect(result.confirmationRequired).toBe(true);
    expect(result.message).toContain('check your email');
  });

  it('should log registration events', async () => {
    const logSpy = jest.spyOn(logger, 'info');

    await register({ email: 'test@example.com', password: 'Password123!' });

    expect(logSpy).toHaveBeenCalledWith(
      'Auth event: registration_attempt_started',
      expect.any(Object)
    );
    expect(logSpy).toHaveBeenCalledWith(
      'Auth event: registration_completed',
      expect.any(Object)
    );
  });
});
```

**Test Email Verification:**
```typescript
describe('Email Verification', () => {
  it('should update email_confirmed_at after verification', async () => {
    // 1. Register user
    const { user } = await register({ email, password });
    expect(user.emailVerified).toBe(false);

    // 2. Simulate clicking verification link
    const token = await getVerificationToken(user.id);
    await verifyEmailToken(token);

    // 3. Check user is now verified
    const updatedUser = await getUser(user.id);
    expect(updatedUser.emailVerified).toBe(true);
  });

  it('should block login for unverified users', async () => {
    // 1. Register user (not verified)
    await register({ email, password });

    // 2. Try to login
    const result = await loginWithPassword({ email, password });

    // 3. Should be blocked
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EMAIL_NOT_CONFIRMED');
  });
});
```

### Integration Tests

**Test Complete Flow:**
```typescript
// apps/web/src/features/auth/__tests__/auth-flow.integration.test.tsx

describe('Email Verification Flow', () => {
  it('should complete registration → verification → login flow', async () => {
    // 1. Render registration page
    render(<RegisterPage />);

    // 2. Fill form and submit
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    // 3. Should redirect to pending page
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    // 4. Simulate clicking verification link (mock)
    await mockVerifyEmail('test@example.com');

    // 5. Navigate to verify page
    render(<VerifyEmailPage />, {
      initialEntries: ['/auth/verify?success=true'],
    });

    // 6. Should show success
    expect(screen.getByText(/email verified/i)).toBeInTheDocument();

    // 7. Try to login
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    // 8. Should be able to login now
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // 9. Should redirect to dashboard
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
```

### E2E Tests

**Test with Real Email:**
```typescript
// e2e/auth-verification.spec.ts

test('complete email verification flow', async ({ page }) => {
  // 1. Register
  await page.goto('/auth/register');
  await page.fill('[name="email"]', 'test+automation@example.com');
  await page.fill('[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  // 2. Check pending page
  await expect(page).toHaveURL(/\/auth\/verify-pending/);
  await expect(page.locator('text=Check your email')).toBeVisible();

  // 3. Get verification link from test email inbox
  const verificationLink = await getVerificationLinkFromEmail(
    'test+automation@example.com'
  );

  // 4. Click verification link
  await page.goto(verificationLink);

  // 5. Verify success page
  await expect(page.locator('text=Email verified')).toBeVisible();

  // 6. Login
  await page.click('text=Continue to Sign In');
  await page.fill('[name="email"]', 'test+automation@example.com');
  await page.fill('[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  // 7. Should be on dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Troubleshooting

### Common Issues

#### 1. Verification Email Not Received

**Symptoms:**
- User registered but no email arrived
- Inbox and spam folder both empty

**Debug Steps:**

1. **Check Supabase Email Logs:**
   ```
   Supabase Dashboard → Authentication → Email Templates → Logs
   ```
   - Look for email send attempts
   - Check for errors

2. **Verify Email Provider:**
   ```
   Supabase Dashboard → Settings → Auth → Email Auth
   ```
   - Confirm SMTP is configured
   - Test email connection

3. **Check Rate Limiting:**
   ```typescript
   // Look for rate limit errors in logs
   eventType:confirmation_email_resend_failed AND error.message:*rate*
   ```

4. **Verify Redirect URL:**
   ```
   Supabase Dashboard → Authentication → URL Configuration
   ```
   - Ensure `https://app.petforce.com/auth/verify` is in allowed list

**Solutions:**
- Configure SMTP properly in Supabase
- Add redirect URL to Supabase allowed list
- Check email service status
- Use resend button after rate limit expires

#### 2. Verification Link Expired

**Symptoms:**
- User clicks link, sees "Link expired" error
- Link older than 24 hours

**Debug Steps:**

1. **Check token timestamp:**
   ```sql
   SELECT created_at, expires_at, used_at
   FROM auth.verification_tokens
   WHERE user_id = 'xxx';
   ```

2. **Verify user status:**
   ```sql
   SELECT email_confirmed_at
   FROM auth.users
   WHERE email = 'user@example.com';
   ```

**Solutions:**
- User clicks "Resend verification email"
- New token generated with fresh 24-hour expiration
- Old token remains invalid

#### 3. Login Blocked Despite Verification

**Symptoms:**
- User verified email but still can't login
- Error: "Email not verified"

**Debug Steps:**

1. **Check database:**
   ```sql
   SELECT email, email_confirmed_at
   FROM auth.users
   WHERE email = 'user@example.com';
   ```
   - Should have non-null `email_confirmed_at`

2. **Check logs:**
   ```typescript
   email:sha256:xxx AND eventType:login_rejected_unconfirmed
   ```

3. **Verify Supabase session:**
   ```typescript
   const { data } = await supabase.auth.getUser();
   console.log('Email confirmed:', data.user?.email_confirmed_at);
   ```

**Solutions:**
- If `email_confirmed_at` is null, verification didn't complete
- Ask user to click verification link again
- Check if correct email was verified (typo in registration)
- Verify Supabase is returning correct user data

#### 4. Resend Button Not Working

**Symptoms:**
- Click resend, but nothing happens
- No error message shown

**Debug Steps:**

1. **Check console for errors:**
   ```javascript
   // Browser console
   Failed to resend: [error]
   ```

2. **Check rate limiting:**
   ```typescript
   // Component state
   canResend: false
   countdown: 180  // Still on cooldown
   ```

3. **Check API response:**
   ```typescript
   // Network tab
   POST /auth/resend
   Response: { success: false, error: { code: 'RESEND_ERROR' } }
   ```

**Solutions:**
- Wait for cooldown to expire (5 minutes client-side)
- Check server-side rate limit (3 per 15 min)
- Verify Supabase API is responding
- Check network connectivity

#### 5. Verification Link Invalid

**Symptoms:**
- User clicks link, sees "Invalid link" error
- Link format looks correct

**Debug Steps:**

1. **Check token in database:**
   ```sql
   SELECT token, used_at, expires_at
   FROM auth.verification_tokens
   WHERE token = 'xxx';
   ```

2. **Check token format:**
   ```
   # Should be JWT format
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Verify redirect URL matches:**
   ```
   Link: https://app.petforce.com/auth/verify?token=xxx
   Configured: https://app.petforce.com/auth/verify
   ✓ Match
   ```

**Solutions:**
- Token already used → Show success, redirect to login
- Token format invalid → User must re-register
- Wrong redirect URL → Update Supabase configuration
- Token corrupted (email client) → Use resend

---

## Configuration

### Supabase Dashboard Settings

**Required Configuration:**

1. **Enable Email Confirmation:**
   ```
   Dashboard → Authentication → Providers → Email
   ✓ Enable email confirmations
   ```

2. **Set Redirect URL:**
   ```
   Dashboard → Authentication → URL Configuration
   Redirect URLs: https://app.petforce.com/auth/verify
   ```

3. **Email Templates:**
   ```
   Dashboard → Authentication → Email Templates → Confirm signup
   ```
   - Customize subject line
   - Customize email body
   - Include `{{ .ConfirmationURL }}` variable

4. **Token Expiration:**
   ```
   Dashboard → Authentication → Email
   Email confirmation expiry: 86400 (24 hours)
   ```

### Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# App Configuration
VITE_APP_URL=https://app.petforce.com

# Email Configuration (if using custom SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

---

## Related Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - System design
- [API Reference](../API.md) - Complete API documentation
- [Setup Guide](./SETUP.md) - Development setup
- [Error Reference](./ERRORS.md) - Error codes
- [User Guide](./USER_GUIDE.md) - End-user troubleshooting
- [Observability Guide](./OBSERVABILITY.md) - Monitoring and logging

---

## Support

**Need help?**

- **Engineering**: Engrid (Software Engineering Agent)
- **Documentation**: Thomas (Documentation Agent)
- **Infrastructure**: Isabel (Infrastructure Agent)

**Quick Links:**
- Supabase Dashboard: https://app.supabase.com/
- Email Templates: Supabase → Authentication → Email Templates
- PetForce Docs: /docs/

---

**Remember**: Email verification protects pet families by ensuring account ownership and enabling secure communication about their pets' care.
