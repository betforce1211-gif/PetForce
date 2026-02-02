# Duplicate Email Detection

Complete guide to duplicate email detection in PetForce authentication.

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [User Experience](#user-experience)
4. [Developer Guide](#developer-guide)
5. [Testing](#testing)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)

## Overview

PetForce prevents duplicate email registrations to ensure each pet parent has a unique account. When someone tries to register with an email that already exists, they receive a clear, actionable error message guiding them to sign in or reset their password.

### What This Feature Does

- Detects when a registration email already exists
- Shows a family-friendly error message
- Provides quick actions: "Sign in" or "Reset password"
- Prevents user confusion and support tickets
- Protects against email enumeration (with proper configuration)

### Current Implementation Status

**Status**: Production-ready with Supabase
**Version**: 1.0.0
**Last Updated**: 2026-02-01

Currently implemented using Supabase's built-in duplicate detection. This works reliably when Supabase is configured correctly.

## How It Works

### High-Level Flow

```
User enters email → Submit registration form → Supabase checks if email exists
                                                 ↓
                               Email exists? → Error returned
                                                 ↓
                               Display friendly error + action buttons
```

### Technical Implementation

#### 1. Form Submission

When a pet parent submits the registration form:

```typescript
// EmailPasswordForm.tsx
const result = await registerWithPassword({ email, password });
```

#### 2. Supabase API Call

The request goes to Supabase's `/auth/v1/signup` endpoint:

```typescript
// Via @supabase/supabase-js
const { data, error } = await supabase.auth.signUp({
  email,
  password
});
```

#### 3. Duplicate Detection

Supabase checks if the email already exists in `auth.users` table:

- **If email is new**: Returns success with user data
- **If email exists**: Returns error (configuration dependent)

#### 4. Error Handling

Our code detects duplicate email errors:

```typescript
// error-messages.ts
if (
  errorCode === 'USER_ALREADY_EXISTS' ||
  errorMessage.toLowerCase().includes('user already registered') ||
  errorMessage.toLowerCase().includes('already exists')
) {
  return {
    title: 'Email Already Registered',
    message: 'This email is already associated with an account...',
    action: {
      text: 'Switch to Sign In',
      onClick: onSwitchToLogin
    }
  };
}
```

#### 5. Display Error

The UI shows the error with actionable buttons:

```typescript
// EmailPasswordForm.tsx
{error && (
  <div role="alert" className="bg-red-50 border-red-200">
    <p>This email is already registered</p>
    <button onClick={onToggleMode}>Sign in</button>
    <button onClick={onForgotPassword}>Reset password</button>
  </div>
)}
```

### Supabase Configuration Requirements

For duplicate email detection to work correctly, Supabase must be configured with:

```
✅ Enable email confirmations: ON
✅ Block duplicate signups: ON
❌ Auto-confirm emails: OFF
```

**Why This Matters:**

| Setting | Duplicate Signup Behavior |
|---------|--------------------------|
| Auto-confirm OFF | Returns error → Our UI shows it ✅ |
| Auto-confirm ON | Returns success → Silent failure ❌ |

See [Configuration](#configuration) for details.

## User Experience

### What Pet Parents See

#### Scenario 1: Email Already Registered

1. Pet parent navigates to `/auth`
2. Clicks "Sign Up" tab
3. Enters existing email: `buddy@petforce.com`
4. Enters password
5. Clicks "Create account"
6. **Sees error message:**

```
┌────────────────────────────────────────┐
│ Email Already Registered               │
│                                        │
│ This email is already associated with  │
│ an account. Would you like to sign     │
│ in instead or reset your password?     │
│                                        │
│ [Sign in] [Reset password]             │
└────────────────────────────────────────┘
```

7. Clicks "Sign in" → Switches to Sign In tab with email pre-filled
   OR
   Clicks "Reset password" → Goes to password reset flow

#### Scenario 2: New Email

1. Pet parent enters new email: `newuser@petforce.com`
2. Enters password
3. Clicks "Create account"
4. **Sees success message:**

```
┌────────────────────────────────────────┐
│ ✓ Registration Successful              │
│                                        │
│ Thank you for registering! Please      │
│ check your email for a verification    │
│ link.                                  │
└────────────────────────────────────────┘
```

5. Redirects to `/auth/verify-pending?email=newuser@petforce.com`

### Design Principles

Our duplicate email detection follows PetForce's family-first philosophy:

1. **Clear Communication** - Error message explains what happened and why
2. **Actionable Guidance** - Buttons for next steps (sign in or reset password)
3. **No Shame** - Friendly tone, not accusatory ("This email is already registered" not "You already have an account!")
4. **Fast Resolution** - One-click to sign in or reset password
5. **Accessible** - Proper ARIA labels and screen reader support

## Developer Guide

### Adding Duplicate Email Detection to a Form

If you're building a new registration form:

```typescript
import { useAuth } from '@petforce/auth';
import { getAuthErrorMessage } from '@/features/auth/utils/error-messages';

function RegistrationForm() {
  const { registerWithPassword, error } = useAuth();

  // Get user-friendly error message
  const errorConfig = getAuthErrorMessage(error, {
    onSwitchToLogin: () => {
      // Navigate to login tab/page
    },
    onForgotPassword: () => {
      // Navigate to password reset
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await registerWithPassword({ email, password });

    if (result.success) {
      // Handle success
      navigate('/verify-pending');
    }
    // Error is automatically set in useAuth hook
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      {errorConfig && (
        <div role="alert" aria-live="assertive">
          <h4>{errorConfig.title}</h4>
          <p>{errorConfig.message}</p>
          {errorConfig.action && (
            <button onClick={errorConfig.action.onClick}>
              {errorConfig.action.text}
            </button>
          )}
        </div>
      )}

      <button type="submit">Create Account</button>
    </form>
  );
}
```

### Error Message Customization

To customize error messages, edit `src/features/auth/utils/error-messages.ts`:

```typescript
export function getAuthErrorMessage(error, context) {
  // Add custom logic here
  if (errorMessage.includes('already')) {
    return {
      title: 'Your Custom Title',
      message: 'Your custom message',
      action: {
        text: 'Custom Action',
        onClick: context.onSwitchToLogin
      }
    };
  }

  // Default handling...
}
```

### API Response Format

Supabase returns different responses based on configuration:

#### Success Response (New Email)

```json
{
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "newuser@petforce.com",
      "email_confirmed_at": null,
      "created_at": "2026-02-01T10:00:00Z"
    },
    "session": null
  },
  "error": null
}
```

#### Error Response (Duplicate Email)

```json
{
  "data": null,
  "error": {
    "name": "USER_ALREADY_EXISTS",
    "message": "User already registered",
    "status": 400
  }
}
```

#### Silent Success (Auto-Confirm Enabled) ⚠️

```json
{
  "data": {
    "user": {
      "id": "existing-uuid",  // Same ID as before!
      "email": "existing@petforce.com",
      "email_confirmed_at": "2026-01-15T08:00:00Z"
    },
    "session": null
  },
  "error": null
}
```

This is why proper Supabase configuration is critical.

### Accessibility Implementation

Our error messages are accessible to all users:

```tsx
<div
  role="alert"
  aria-live="assertive"
  className="bg-red-50 border-red-200 text-red-700"
>
  <p className="font-medium">
    This email is already registered
  </p>
  <div className="mt-2 space-x-2">
    <button
      type="button"
      onClick={onToggleMode}
      aria-label="Switch to sign in form"
    >
      Sign in
    </button>
    <button
      type="button"
      onClick={onForgotPassword}
      aria-label="Reset your password"
    >
      Reset password
    </button>
  </div>
</div>
```

**Accessibility Features:**

- `role="alert"` - Screen readers announce immediately
- `aria-live="assertive"` - Interrupts current reading
- `aria-label` on buttons - Clear action description
- Color + text - Not color-only indicators
- Keyboard accessible - Tab navigation works

## Testing

### E2E Tests

We have comprehensive E2E tests for duplicate email detection:

```bash
# Run duplicate email tests
npx playwright test -g "duplicate email"

# Run the critical test
npx playwright test -g "CRITICAL: shows error when registering with existing email"
```

**Test Coverage:**

- ✅ Error message appears when using existing email
- ✅ Error message text is correct
- ✅ "Sign in" button is visible and works
- ✅ "Reset password" button is visible
- ✅ Error has proper styling (red background)
- ✅ Error has proper ARIA attributes
- ✅ User stays on registration page (doesn't redirect)

### Unit Tests

Test error message generation:

```typescript
import { getAuthErrorMessage } from './error-messages';

describe('getAuthErrorMessage', () => {
  it('detects duplicate email errors', () => {
    const error = {
      code: 'USER_ALREADY_EXISTS',
      message: 'User already registered'
    };

    const result = getAuthErrorMessage(error);

    expect(result.title).toBe('Email Already Registered');
    expect(result.message).toContain('already associated');
  });

  it('provides sign-in action', () => {
    const onSwitchToLogin = vi.fn();
    const error = { message: 'User already registered' };

    const result = getAuthErrorMessage(error, { onSwitchToLogin });

    expect(result.action).toBeDefined();
    expect(result.action.text).toBe('Switch to Sign In');

    result.action.onClick();
    expect(onSwitchToLogin).toHaveBeenCalled();
  });
});
```

### Manual Testing Checklist

Before shipping duplicate email detection changes:

- [ ] Test with known existing email (e.g., your test account)
- [ ] Verify error message appears
- [ ] Click "Sign in" button - should switch tabs
- [ ] Click "Reset password" - should navigate to reset flow
- [ ] Verify error styling is correct (red background)
- [ ] Test keyboard navigation (Tab key)
- [ ] Test screen reader (VoiceOver/NVDA)
- [ ] Test on mobile viewport
- [ ] Test with slow network (throttle in DevTools)

### Test Data

Use these test emails for manual testing:

```typescript
// Existing email (for duplicate test)
const existingEmail = 'existing@petforce.test';

// New email (for success test)
const newEmail = `test-${Date.now()}@petforce.test`;

// Password for all tests
const password = 'TestP@ssw0rd123!';
```

## Configuration

### Supabase Dashboard Setup

To enable duplicate email detection:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your PetForce project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in sidebar
   - Click "Email" provider

3. **Configure Email Settings**

   Required settings:
   ```
   ✅ Enable email sign-up: ON
   ✅ Enable email confirmations: ON
   ✅ Block duplicate signups: ON (if available)
   ```

   Security settings:
   ```
   ❌ Auto-confirm emails: OFF
   ✅ Confirm email on update: ON
   ```

4. **Email Templates (Optional)**

   Customize the verification email template to match PetForce branding.

### Environment Variables

No special environment variables are required for duplicate email detection. Standard Supabase credentials are sufficient:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Verification

To verify configuration is correct:

```bash
# 1. Start dev server
npm run dev

# 2. Open browser to http://localhost:3000/auth

# 3. Try registering with a known existing email

# 4. You should see error message (not success)
```

If you see success instead of error, check Supabase dashboard settings.

## Troubleshooting

### Problem: No Error Shown for Duplicate Email

**Symptom**: User can register with existing email, no error appears

**Likely Cause**: Supabase auto-confirm is enabled

**Solution**:
1. Open Supabase Dashboard
2. Go to Authentication → Email
3. Set "Auto-confirm emails" to OFF
4. Test again

**Technical Details**: When auto-confirm is ON, Supabase returns success (not error) for duplicate signups to prevent email enumeration attacks. This is secure but confusing for users.

### Problem: Error Message Not User-Friendly

**Symptom**: Raw Supabase error shown instead of friendly message

**Likely Cause**: Error detection logic not matching Supabase error format

**Solution**:
1. Check `src/features/auth/utils/error-messages.ts`
2. Add console.log to see actual error:
   ```typescript
   console.log('Supabase error:', { code: error.code, message: error.message });
   ```
3. Update error detection logic to match actual error format
4. Test again

### Problem: "Sign In" Button Doesn't Work

**Symptom**: Clicking "Sign in" does nothing

**Likely Cause**: `onToggleMode` callback not provided

**Solution**:
1. Ensure `EmailPasswordForm` receives `onToggleMode` prop:
   ```typescript
   <EmailPasswordForm
     mode="register"
     onToggleMode={() => setMode('login')}
   />
   ```
2. Or handle in parent component

### Problem: E2E Tests Failing

**Symptom**: Tests for duplicate email detection fail

**Likely Causes**:
- Dev server not running
- Supabase configuration changed
- Mock not intercepting API calls

**Solutions**:

```bash
# 1. Verify dev server is running
npm run dev

# 2. Check test uses mocks (not real API)
# In test file, ensure this is called:
await ApiMocking.setupMocks(page);

# 3. Run test with debug mode
npx playwright test --debug -g "duplicate email"

# 4. Check browser console for errors
# Look for network requests to Supabase
```

### Problem: Users Getting Confused

**Symptom**: Support tickets about "can't create account"

**Likely Cause**: Error message not clear enough

**Solution**: Review and improve error message wording:

```typescript
// Current
message: 'This email is already associated with an account.'

// Better for pet parents
message: 'This email already has a PetForce account. Sign in below or reset your password if you forgot it.'
```

Update in `src/features/auth/utils/error-messages.ts`

### Problem: Email Enumeration Concerns

**Symptom**: Security team concerned about revealing which emails exist

**Context**: Telling users "email already registered" reveals account existence

**Solutions**:

**Option 1: Accept the Trade-off** (Current)
- Better UX for pet parents
- Low risk for pet care app
- Implement rate limiting

**Option 2: Silent Success** (More Secure)
- Always show "Check your email"
- Don't reveal if email exists
- More confusing for users

**Option 3: Hybrid Approach** (Recommended for sensitive apps)
- Use rate limiting
- Show error after first attempt (helpful)
- Silent success after rate limit hit (secure)

For PetForce, **Option 1 is recommended** because:
- Pet parents need clear guidance
- Not a high-security target
- Better user experience reduces support burden

### Getting Help

If you're still stuck:

1. **Check Recent Changes**
   ```bash
   git log --oneline src/features/auth/
   ```

2. **Read Tucker's Investigation**
   - See `/apps/web/TUCKER_P0_INVESTIGATION.md`
   - Tucker analyzed this exact issue in detail

3. **Run Diagnostic Tests**
   ```bash
   npm run test:e2e -- -g "duplicate email"
   ```

4. **Ask in Team Chat**
   - Share error screenshots
   - Share Supabase configuration
   - Share browser console output

---

**Documentation Maintained By**: Thomas (Documentation Guardian)
**Last Verified**: 2026-02-01
**Related Docs**: [Testing Guide](../TESTING.md), [Error Messages](../../src/features/auth/utils/error-messages.ts)
