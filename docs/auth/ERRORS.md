# Authentication Error Code Reference

Comprehensive reference for all error codes returned by the PetForce authentication system.

## Table of Contents

- [Error Response Format](#error-response-format)
- [Error Codes by Category](#error-codes-by-category)
- [Error Code Details](#error-code-details)
- [Error Handling Examples](#error-handling-examples)
- [User-Facing Messages](#user-facing-messages)
- [Troubleshooting Guide](#troubleshooting-guide)

## Error Response Format

All authentication API errors follow this structure:

```typescript
interface AuthError {
  code: string;           // Error code (see below)
  message: string;        // Human-readable error message
  details?: Record<string, unknown>; // Optional additional context
}
```

**Example Error Response:**

```typescript
{
  success: false,
  error: {
    code: 'EMAIL_NOT_CONFIRMED',
    message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
    details: {
      email: 'user@example.com',
      resendAvailable: true
    }
  }
}
```

## Error Codes by Category

### Registration Errors
- `REGISTRATION_ERROR` - General registration failure
- `EMAIL_IN_USE` - Email already registered
- `WEAK_PASSWORD` - Password doesn't meet requirements
- `INVALID_EMAIL` - Email format invalid

### Login Errors
- `LOGIN_ERROR` - General login failure
- `EMAIL_NOT_CONFIRMED` - Email verification required
- `INVALID_CREDENTIALS` - Email or password incorrect
- `USER_NOT_FOUND` - No account with this email

### Session Errors
- `TOKEN_EXPIRED` - Auth token has expired
- `TOKEN_INVALID` - Auth token is invalid
- `REFRESH_ERROR` - Session refresh failed
- `GET_USER_ERROR` - Failed to retrieve user

### Email Errors
- `RESEND_ERROR` - Failed to resend confirmation email
- `PASSWORD_RESET_ERROR` - Failed to send reset email

### System Errors
- `UNEXPECTED_ERROR` - Unexpected system error
- `NETWORK_ERROR` - Network connection failed
- `SERVER_ERROR` - Server error occurred

### OAuth Errors (Future)
- `OAUTH_ERROR` - OAuth flow failed
- `OAUTH_CANCELLED` - User cancelled OAuth flow

### Biometric Errors (Mobile)
- `BIOMETRIC_NOT_AVAILABLE` - Biometrics not available
- `BIOMETRIC_NOT_ENROLLED` - No biometrics enrolled
- `BIOMETRIC_AUTH_FAILED` - Biometric authentication failed

## Error Code Details

### EMAIL_NOT_CONFIRMED

**When It Occurs:** User attempts to log in before verifying their email address.

**Cause:** Email confirmation is enabled (default). User created an account but hasn't clicked the verification link sent to their email.

**User Experience:**
```
❌ Login Attempt
   ↓
   Email not verified
   ↓
   Show "Please verify your email" message
   ↓
   Offer "Resend verification email" button
```

**API Response:**
```typescript
{
  success: false,
  error: {
    code: 'EMAIL_NOT_CONFIRMED',
    message: 'Please verify your email address before logging in. Check your inbox for the verification link.'
  }
}
```

**User-Facing Message:**
> "Please verify your email before signing in. We sent a verification link to your email address. Can't find it? Check your spam folder or request a new link."

**Resolution:**
1. Check email inbox (and spam folder)
2. Click verification link in email
3. Try logging in again
4. OR use `resendConfirmationEmail()` to get a new link

**Related Metrics:**
- `login_rejected_unconfirmed` - Count of blocked login attempts
- `confirmation_rate` - % of users who verify email

---

### REGISTRATION_ERROR

**When It Occurs:** User registration fails for any reason.

**Common Causes:**
- Email already in use
- Invalid email format
- Weak password
- Server error
- Network error

**API Response:**
```typescript
{
  success: false,
  message: 'Registration failed',
  error: {
    code: 'REGISTRATION_ERROR',
    message: 'Detailed error message from Supabase'
  }
}
```

**User-Facing Message:**
> "We couldn't create your account. Please check your information and try again."

**Debugging:**
- Check `error.message` for specific Supabase error
- Look for `registration_failed` event in logs
- Check validation errors before submission

---

### LOGIN_ERROR

**When It Occurs:** Login fails for reasons other than unconfirmed email.

**Common Causes:**
- Wrong password
- Account doesn't exist
- Account disabled
- Too many failed attempts (rate limited)

**API Response:**
```typescript
{
  success: false,
  error: {
    code: 'LOGIN_ERROR',
    message: 'Invalid login credentials'
  }
}
```

**User-Facing Message:**
> "Email or password is incorrect. Please try again or reset your password."

**Security Note:**
Don't distinguish between "user not found" and "wrong password" to prevent email enumeration attacks.

---

### INVALID_CREDENTIALS

**When It Occurs:** Email and password combination doesn't match.

**API Response:**
```typescript
{
  success: false,
  error: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid login credentials'
  }
}
```

**User-Facing Message:**
> "Email or password is incorrect. Please try again."

**Resolution:**
1. Double-check email and password
2. Use "Forgot Password" if needed
3. Check for caps lock

---

### RESEND_ERROR

**When It Occurs:** Failed to resend confirmation email.

**Common Causes:**
- Rate limiting (too many requests)
- Email service unavailable
- Invalid email address
- User already confirmed

**API Response:**
```typescript
{
  success: false,
  message: 'Failed to resend confirmation email',
  error: {
    code: 'RESEND_ERROR',
    message: 'Detailed error message'
  }
}
```

**User-Facing Message:**
> "We couldn't resend the verification email. Please wait a few minutes and try again."

**Client-Side Rate Limiting:**
- Maximum 1 resend per 5 minutes per email
- Enforced in `ResendConfirmationButton` component

---

### PASSWORD_RESET_ERROR

**When It Occurs:** Failed to send password reset email.

**API Response:**
```typescript
{
  success: false,
  message: 'Failed to send password reset email',
  error: {
    code: 'PASSWORD_RESET_ERROR',
    message: 'Detailed error message'
  }
}
```

**User-Facing Message (Generic for Security):**
> "If an account exists with that email, a password reset link has been sent."

**Security Note:**
Always return success message to prevent email enumeration, but log actual errors internally.

---

### UNEXPECTED_ERROR

**When It Occurs:** Unhandled exception or unexpected system error.

**API Response:**
```typescript
{
  success: false,
  message: 'An unexpected error occurred',
  error: {
    code: 'UNEXPECTED_ERROR',
    message: 'Error details'
  }
}
```

**User-Facing Message:**
> "Something went wrong. Please try again. If the problem continues, contact support."

**Debugging:**
- Check console for detailed error stack
- Look for `ERROR` level logs with requestId
- Check network tab for failed requests

---

### TOKEN_EXPIRED

**When It Occurs:** JWT access token has expired.

**Automatic Handling:**
The auth system automatically attempts to refresh the token using the refresh token before returning this error to the user.

**User Experience:**
```
API Call with expired token
   ↓
Auto-refresh attempt
   ↓
   Success: Request retried
   Failed: User logged out
```

**Resolution:**
- Automatic: Token refresh happens in background
- Manual: Call `refreshSession()` explicitly
- Fallback: User logs in again

---

### GET_USER_ERROR

**When It Occurs:** Failed to retrieve current user information.

**Common Causes:**
- No active session
- Invalid token
- Network error
- Server error

**API Response:**
```typescript
{
  user: null,
  error: {
    code: 'GET_USER_ERROR',
    message: 'Failed to get user'
  }
}
```

**Resolution:**
- Check if user is logged in
- Refresh the session
- Log in again if needed

---

### REFRESH_ERROR

**When It Occurs:** Failed to refresh session tokens.

**Common Causes:**
- Refresh token expired (90 days)
- Refresh token invalid/revoked
- Network error
- Server error

**API Response:**
```typescript
{
  success: false,
  error: {
    code: 'REFRESH_ERROR',
    message: 'Failed to refresh session'
  }
}
```

**Resolution:**
User must log in again. Refresh tokens expire after 90 days (Supabase default).

---

## Error Handling Examples

### Basic Error Handling

```typescript
import { login } from '@petforce/auth';

const result = await login({ email, password });

if (!result.success) {
  switch (result.error?.code) {
    case 'EMAIL_NOT_CONFIRMED':
      // Show verification prompt
      showVerificationPrompt(email);
      break;

    case 'INVALID_CREDENTIALS':
      // Show error message
      showError('Email or password is incorrect');
      break;

    case 'UNEXPECTED_ERROR':
      // Show generic error and log
      console.error('Login error:', result.error);
      showError('Something went wrong. Please try again.');
      break;

    default:
      showError(result.error?.message || 'Login failed');
  }
}
```

### React Component Error Handling

```typescript
import { useAuth } from '@petforce/auth';
import { useState } from 'react';

function LoginForm() {
  const { loginWithPassword, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowResend(false);

    const result = await loginWithPassword({ email, password });

    if (!result.success) {
      if (result.error?.code === 'EMAIL_NOT_CONFIRMED') {
        setError('Please verify your email before signing in.');
        setShowResend(true);
      } else {
        setError(result.error?.message || 'Login failed');
      }
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && (
        <div className="error">
          {error}
          {showResend && (
            <ResendConfirmationButton email={email} />
          )}
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

### Comprehensive Error Handler

```typescript
function handleAuthError(error: AuthError): {
  userMessage: string;
  showResend: boolean;
  shouldRetry: boolean;
} {
  switch (error.code) {
    case 'EMAIL_NOT_CONFIRMED':
      return {
        userMessage: 'Please verify your email before signing in.',
        showResend: true,
        shouldRetry: false,
      };

    case 'INVALID_CREDENTIALS':
      return {
        userMessage: 'Email or password is incorrect.',
        showResend: false,
        shouldRetry: true,
      };

    case 'NETWORK_ERROR':
      return {
        userMessage: 'Network error. Please check your connection.',
        showResend: false,
        shouldRetry: true,
      };

    case 'UNEXPECTED_ERROR':
      // Log for debugging
      console.error('Unexpected auth error:', error);
      return {
        userMessage: 'Something went wrong. Please try again.',
        showResend: false,
        shouldRetry: true,
      };

    default:
      return {
        userMessage: error.message || 'An error occurred',
        showResend: false,
        shouldRetry: false,
      };
  }
}
```

## User-Facing Messages

### Best Practices

1. **Be Clear and Actionable**
   - Tell users what happened
   - Tell them what to do next
   - Provide a way forward

2. **Use Friendly Language**
   - Avoid technical jargon
   - Use "we" and "your" (not "system" or "user")
   - Be empathetic and helpful

3. **Respect Privacy**
   - Don't reveal if email exists (prevents enumeration)
   - Generic messages for security-sensitive errors

4. **Provide Help**
   - Link to support
   - Offer alternative actions
   - Show resend/retry options when appropriate

### Recommended Messages by Error Code

| Error Code | User Message |
|-----------|-------------|
| `EMAIL_NOT_CONFIRMED` | "Please verify your email before signing in. Check your inbox for the verification link." |
| `INVALID_CREDENTIALS` | "Email or password is incorrect. Please try again." |
| `REGISTRATION_ERROR` | "We couldn't create your account. Please check your information and try again." |
| `WEAK_PASSWORD` | "Please choose a stronger password (at least 8 characters with uppercase, lowercase, and numbers)." |
| `RESEND_ERROR` | "We couldn't resend the email. Please wait a few minutes and try again." |
| `PASSWORD_RESET_ERROR` | "If an account exists with that email, a password reset link has been sent." |
| `NETWORK_ERROR` | "Connection error. Please check your internet and try again." |
| `UNEXPECTED_ERROR` | "Something went wrong. Please try again or contact support if the problem continues." |

## Troubleshooting Guide

### For Developers

#### Can't Log In After Registration

**Symptom:** User registers successfully but login fails.

**Diagnosis:**
```typescript
// Check logs for this event
logger.authEvent('login_rejected_unconfirmed', requestId, {
  email: 'user@example.com',
  reason: 'Email not confirmed'
});
```

**Solution:**
1. Verify email confirmation is working
2. Check email delivery (spam folders)
3. Test verification link functionality
4. Ensure `emailRedirectTo` is configured correctly

#### High Error Rate

**Symptom:** Many authentication errors in metrics.

**Diagnosis:**
```typescript
import { metrics } from '@petforce/auth';

const summary = metrics.getSummary();
console.log('Login success rate:', summary.loginSuccessRatePercent);
// If < 95%, investigate

const alerts = metrics.checkAlerts();
alerts.forEach(alert => console.log(alert));
```

**Common Causes:**
- Email confirmation issues
- Password complexity confusion
- Network problems
- Rate limiting too aggressive

#### Debugging Specific Request

**Using Request ID:**
```typescript
// Every auth operation generates a unique requestId
// Search logs for all events with that ID

// Example log correlation:
requestId: "abc-123"
[INFO] Auth event: login_attempt_started
[INFO] Auth event: login_rejected_unconfirmed
```

**Log Search:**
```bash
# Search logs for specific request
grep "abc-123" logs/auth.log

# Search for specific error code
grep "EMAIL_NOT_CONFIRMED" logs/auth.log
```

### For Support Teams

#### User Can't Verify Email

**Checklist:**
1. Email in spam folder?
2. Correct email address?
3. Verification link expired? (24 hours)
4. Used old link after requesting new one?

**Resolution:**
- Use resend confirmation email
- Check email deliverability settings
- Verify redirect URL configuration

#### User Forgot Password but Not Receiving Email

**Checklist:**
1. Email in spam folder?
2. Correct email address?
3. Email service working?
4. Rate limiting blocking request?

**Note:** Always show generic success message to prevent email enumeration:
> "If an account exists with that email, a password reset link has been sent."

## Related Documentation

- [API Reference](/docs/API.md#error-codes) - API error handling
- [Architecture](/docs/auth/ARCHITECTURE.md) - System design and flows
- [Security](/docs/auth/SECURITY.md) - Security considerations
- [Troubleshooting](/docs/auth/USER_GUIDE.md#troubleshooting) - User-facing troubleshooting

---

**Last Updated:** January 25, 2026
**Maintained By:** Thomas (Documentation Agent)
**Version:** 1.0.0
