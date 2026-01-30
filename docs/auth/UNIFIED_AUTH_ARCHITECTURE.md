# Unified Authentication Page - Technical Architecture

**Developer Documentation**

This document describes the technical architecture of PetForce's unified authentication page, which replaces the previous 3-page flow with a single tabbed interface.

## Table of Contents

- [Overview](#overview)
- [Migration from Old Flow](#migration-from-old-flow)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Duplicate Email Detection](#duplicate-email-detection)
- [Email Verification Flow](#email-verification-flow)
- [Testing Strategy](#testing-strategy)
- [Known Issues and Fixes](#known-issues-and-fixes)

## Overview

### What Changed

**Before (3-page flow):**
```
/auth/welcome → User chooses method → /auth/login OR /auth/register
```

**After (Unified flow):**
```
/auth → Single page with Sign In / Sign Up tabs
```

### Key Benefits

1. **Zero navigation for login**: Most users want to sign in, now they can immediately
2. **50% reduction in clicks**: No more clicking through welcome page
3. **Clearer messaging**: No confusing "Join" → "Welcome back" flow
4. **Better mobile experience**: Compact design avoids scrolling
5. **Familiar UX pattern**: Tabs are universally understood

### Design Philosophy

- **Login is default**: Most returning users want to sign in immediately
- **Tab-based switching**: Smooth animation between Sign In and Sign Up
- **Single form area**: No duplicate buttons or confusing navigation
- **Compact layout**: Designed to fit without scrolling on desktop (720px height)

## Migration from Old Flow

### Route Changes

| Old Route | New Route | Migration Notes |
|-----------|-----------|----------------|
| `/auth/welcome` | `/auth` | Welcome page deprecated |
| `/auth/login` | `/auth` (Sign In tab) | Redirect to `/auth` |
| `/auth/register` | `/auth?mode=register` | URL param sets initial tab |

### Routing Implementation

```typescript
// Old routes (deprecated but still work)
<Route path="/auth/welcome" element={<Navigate to="/auth" replace />} />
<Route path="/auth/login" element={<Navigate to="/auth" replace />} />
<Route path="/auth/register" element={<Navigate to="/auth?mode=register" replace />} />

// New unified route
<Route path="/auth" element={<UnifiedAuthPage />} />
```

### URL Parameters

The unified page supports a `mode` parameter for deep linking:

```typescript
// Sign In (default)
/auth

// Sign Up
/auth?mode=register
```

**Implementation:**
```typescript
// In AuthTogglePanel component
const [searchParams] = useSearchParams();
const [activeMode, setActiveMode] = useState<AuthMode>('login');

useEffect(() => {
  const mode = searchParams.get('mode');
  if (mode === 'register') {
    setActiveMode('register');
  }
}, [searchParams]);
```

## Component Architecture

### Component Hierarchy

```
UnifiedAuthPage
├── AuthHeader (logo, welcome message, tagline)
└── AuthTogglePanel (tabs and content)
    ├── Tab Navigation (Sign In / Sign Up buttons)
    └── Animated Content Panel
        ├── Sign In Mode
        │   ├── SSOButtons (Google, Apple)
        │   ├── Divider ("Or sign in with email")
        │   └── EmailPasswordForm (mode="login")
        │       ├── Email input
        │       ├── Password input (with toggle)
        │       ├── Forgot password link
        │       └── Submit button
        │
        └── Sign Up Mode
            ├── SSOButtons (Google, Apple)
            ├── Divider ("Or sign up with email")
            ├── EmailPasswordForm (mode="register")
            │   ├── Email input
            │   ├── Password input (with toggle)
            │   ├── Confirm password input
            │   ├── Password strength indicator
            │   └── Submit button
            └── Terms and Privacy links
```

### Component Details

#### UnifiedAuthPage

**Location**: `/apps/web/src/features/auth/pages/UnifiedAuthPage.tsx`

**Purpose**: Root container for the unified auth experience

**Key Features**:
- Gradient background
- Responsive centering
- Max-width constraint (xl breakpoint)

**Code Structure**:
```typescript
export function UnifiedAuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <AuthHeader />
        <AuthTogglePanel />
      </div>
    </div>
  );
}
```

#### AuthHeader

**Location**: `/apps/web/src/features/auth/components/AuthHeader.tsx`

**Purpose**: Shared branding and messaging

**Key Features**:
- Animated logo with spring effect
- Responsive text sizing
- Different taglines for mobile/desktop

**Animations**:
- Logo: Scale from 0 to 1 with spring (delay: 0.2s)
- Title: Fade in from y=20 (delay: 0.3s)
- Tagline: Fade in from y=20 (delay: 0.4s)

#### AuthTogglePanel

**Location**: `/apps/web/src/features/auth/components/AuthTogglePanel.tsx`

**Purpose**: Tab navigation and content switching

**Key Features**:
- Tab-based interface with ARIA attributes
- Smooth content transitions
- Mode persistence via URL params
- Separate success handlers for login/register

**State Management**:
```typescript
type AuthMode = 'login' | 'register';
const [activeMode, setActiveMode] = useState<AuthMode>('login');
```

**Tab Switching**:
```typescript
<button
  role="tab"
  aria-selected={activeMode === 'login'}
  aria-controls="auth-panel"
  className={activeMode === 'login'
    ? 'text-primary-600 border-b-2 border-primary-600'
    : 'text-gray-500'
  }
  onClick={() => setActiveMode('login')}
>
  Sign In
</button>
```

**Content Animation**:
```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={activeMode}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2, ease: 'easeInOut' }}
  >
    {/* Tab content */}
  </motion.div>
</AnimatePresence>
```

#### EmailPasswordForm

**Location**: `/apps/web/src/features/auth/components/EmailPasswordForm.tsx`

**Purpose**: Unified form for both login and registration

**Props Interface**:
```typescript
export interface EmailPasswordFormProps {
  mode: 'login' | 'register';
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onToggleMode?: () => void;
}
```

**Key Features**:
- Mode-based rendering (login vs register)
- Password visibility toggle
- Password strength indicator (register only)
- Confirm password field (register only)
- Forgot password link (login only)
- Duplicate email error with actionable links
- Resend confirmation button for unverified accounts

**Form State**:
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [showResendButton, setShowResendButton] = useState(false);
const [passwordMismatchError, setPasswordMismatchError] = useState<string | null>(null);
```

## Data Flow

### Registration Flow

```
User fills Sign Up form
    ↓
Validate: Password === Confirm Password
    ↓
Submit → registerWithPassword({ email, password })
    ↓
API: supabase.auth.signUp()
    ↓
Success: User created (email_confirmed_at = null)
    ↓
Supabase sends verification email
    ↓
Navigate to /auth/verify-pending?email={email}
    ↓
User clicks link in email
    ↓
Supabase confirms email (sets email_confirmed_at)
    ↓
Redirect to /auth/verify (success page)
    ↓
User can now log in
```

### Login Flow

```
User fills Sign In form
    ↓
Submit → loginWithPassword({ email, password })
    ↓
API: supabase.auth.signInWithPassword()
    ↓
Check: user.email_confirmed_at !== null
    ↓
    ├─ Email NOT confirmed
    │      ↓
    │  Return error: EMAIL_NOT_CONFIRMED
    │      ↓
    │  Show "Please verify email" message
    │      ↓
    │  Display ResendConfirmationButton
    │      ↓
    │  User clicks resend
    │      ↓
    │  Send new verification email
    │
    └─ Email confirmed
           ↓
       Return success with user + tokens
           ↓
       Update auth store
           ↓
       Save tokens to storage
           ↓
       Navigate to /dashboard
```

### Tab Switching Flow

```
User clicks Sign Up tab
    ↓
setActiveMode('register')
    ↓
AnimatePresence triggers exit animation
    ↓
    - Current content fades out (opacity: 0)
    - Current content slides left (x: -20)
    - Duration: 200ms
    ↓
Old content unmounts
    ↓
New content mounts
    ↓
AnimatePresence triggers enter animation
    ↓
    - New content fades in (opacity: 1)
    - New content slides from right (x: 0)
    - Duration: 200ms
    ↓
Animation complete
```

## Duplicate Email Detection

### The Problem

When a user tries to register with an email that already exists, we need to:
1. Detect the duplicate
2. Show a clear error message
3. Provide actionable next steps
4. Allow easy switching to Sign In mode

### Implementation

**Error Detection** (in EmailPasswordForm):
```typescript
const { loginWithPassword, registerWithPassword, isLoading, error } = useAuth();

// API returns error with duplicate email
if (error?.message.includes('already') || error?.message.includes('exist')) {
  // Error is automatically displayed
}
```

**Error Display**:
```typescript
<AnimatePresence>
  {error && (
    <motion.div
      className="p-2 border rounded-lg text-xs bg-red-50 border-red-200 text-red-700"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      role="alert"
      aria-live="assertive"
    >
      <p className="font-medium text-xs">
        {error.message.includes('already') || error.message.includes('exist')
          ? 'This email is already registered'
          : error.message}
      </p>

      {/* Actionable guidance for duplicate email */}
      {(error.message.includes('already') || error.message.includes('exist')) && mode === 'register' && (
        <p className="text-xs">
          Already have an account?{' '}
          {onToggleMode && (
            <button
              type="button"
              onClick={onToggleMode}
              className="font-medium text-red-700 hover:text-red-800 underline"
            >
              Sign in
            </button>
          )}
          {onToggleMode && onForgotPassword && ' or '}
          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="font-medium text-red-700 hover:text-red-800 underline"
            >
              reset password
            </button>
          )}
        </p>
      )}
    </motion.div>
  )}
</AnimatePresence>
```

**User Flow**:
1. User tries to register with existing email
2. API returns error: "User already registered"
3. Error message displays: "This email is already registered"
4. User sees two options:
   - Click "Sign in" → switches to Sign In tab
   - Click "reset password" → navigates to /auth/forgot-password

### Error Message Mapping

Handled by `getAuthErrorMessage()` utility:

| API Error | User-Facing Message | Actions Provided |
|-----------|---------------------|------------------|
| `USER_ALREADY_EXISTS` | "This email is already registered" | Sign in, Reset password |
| `INVALID_CREDENTIALS` | "The email or password you entered is incorrect" | Forgot password |
| `EMAIL_NOT_CONFIRMED` | "Please verify your email address before logging in" | Resend confirmation |
| Rate limit error | "You have made too many requests. Please wait a few minutes." | None |

## Email Verification Flow

### Architecture Decision

**Why we enforce email verification:**
1. Prevents account hijacking
2. Ensures user has access to the email
3. Enables password recovery
4. Prevents spam registrations

### Technical Implementation

**Registration creates unconfirmed user:**
```typescript
// In registerWithPassword() API function
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/verify`
  }
});

// User is created with email_confirmed_at = null
// Supabase automatically sends verification email

return {
  success: true,
  confirmationRequired: true,
  message: "Registration successful. Please check your email to verify your account."
};
```

**Login checks confirmation:**
```typescript
// In loginWithPassword() API function
const { data: authData, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

const isConfirmed = authData.user.email_confirmed_at !== null;

if (!isConfirmed) {
  logger.authEvent('login_rejected_unconfirmed', requestId, {
    userId: authData.user.id,
    email,
    reason: 'Email not confirmed'
  });

  return {
    success: false,
    error: {
      code: 'EMAIL_NOT_CONFIRMED',
      message: 'Please verify your email address before logging in. Check your inbox for the verification link.'
    }
  };
}
```

**Resend confirmation:**
```typescript
// In ResendConfirmationButton component
const handleResend = async () => {
  await resendConfirmationEmail(email);

  // Start 5-minute cooldown
  setIsDisabled(true);
  setTimeRemaining(300); // 5 minutes in seconds

  // Countdown timer
  const interval = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev <= 1) {
        clearInterval(interval);
        setIsDisabled(false);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};
```

### Database State

**Unconfirmed User** (auth.users table):
```sql
id: uuid
email: "user@example.com"
encrypted_password: "$2a$..."
email_confirmed_at: NULL  ← Not confirmed yet
created_at: "2026-01-27T10:00:00Z"
```

**Confirmed User** (after clicking link):
```sql
id: uuid
email: "user@example.com"
encrypted_password: "$2a$..."
email_confirmed_at: "2026-01-27T10:05:00Z"  ← Confirmed!
created_at: "2026-01-27T10:00:00Z"
```

## Testing Strategy

### E2E Tests

**Location**: `/apps/web/src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts`

**Coverage**: 21 test scenarios covering:

1. **Tab Navigation** (6 tests)
   - Defaults to Sign In tab
   - Switches to Sign Up tab
   - Switches back to Sign In
   - Smooth animations
   - URL parameter support
   - Animation timing

2. **Duplicate Email Detection** (3 tests)
   - Shows error for existing email
   - Provides "Sign in" link that works
   - Provides "reset password" link
   - Error message styling

3. **Registration Success** (2 tests)
   - New user registration flow
   - Redirects to verification page
   - Email in URL parameter
   - Loading state

4. **Password Validation** (6 tests)
   - Password strength indicator
   - Password mismatch detection
   - Inline validation
   - Submit-time validation
   - Password visibility toggle
   - Confirm password field

5. **Form Layout** (4 tests)
   - No scrolling required on desktop
   - Submit button always visible
   - Error doesn't push button off-screen
   - Mobile viewport handling

6. **Accessibility** (4 tests)
   - ARIA attributes on tabs
   - Error messages have aria-live
   - Form inputs have proper labels
   - Terms and Privacy links present

7. **Edge Cases** (5 tests)
   - Empty form submission
   - Invalid email format
   - Very long email addresses
   - Error clearing on tab switch
   - Animation completion

### Key Test Patterns

**Waiting for animations:**
```typescript
// Switch to Sign Up and wait for animation
await page.getByRole('tab', { name: 'Sign Up' }).click();
await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();

// Content should be fully visible (opacity: 1)
const content = page.locator('section[aria-label="Create a new account"]');
await expect(content).toBeVisible();
```

**Testing duplicate email flow:**
```typescript
test('CRITICAL: shows error when registering with existing email', async ({ page }) => {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign Up' }).click();

  // Fill existing email
  await page.getByLabel('Email address').fill('existing@petforce.test');
  await page.getByLabel('Password', { exact: true }).fill('TestP@ssw0rd123!');
  await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');

  // Submit
  await page.getByRole('button', { name: 'Create account' }).click();

  // Assert error appears
  const errorAlert = page.getByRole('alert');
  await expect(errorAlert).toBeVisible({ timeout: 5000 });
  await expect(errorAlert).toContainText('This email is already registered');

  // Assert "Sign in" link works
  const signInLink = errorAlert.getByRole('button', { name: 'Sign in' });
  await expect(signInLink).toBeVisible();
  await signInLink.click();

  // Should switch to Sign In tab
  await expect(page.getByRole('heading', { name: 'Welcome Back!' })).toBeVisible();
});
```

### Test Environment Setup

**Prerequisites:**
```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Set up test database
npm run test:db:setup
```

**Running tests:**
```bash
# All E2E tests
npm run test:e2e

# Specific test file
npx playwright test unified-auth-flow.spec.ts

# With UI mode (recommended for debugging)
npx playwright test --ui

# Watch mode
npx playwright test --watch
```

## Known Issues and Fixes

### Issue 1: Ghost Users (FIXED)

**Problem**: Users created in `auth.users` but not in `public.users`

**Cause**: Missing database trigger to create user profile

**Impact**: Users could register but couldn't access the app

**Status**: Identified by Tucker (QA), to be fixed by Isabel (Infrastructure)

**Fix Required**:
```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**Verification Query**:
```sql
-- Check for ghost users
SELECT
  au.id,
  au.email,
  au.created_at,
  CASE
    WHEN pu.id IS NULL THEN 'GHOST USER'
    ELSE 'OK'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;
```

### Issue 2: Animation Timing in Tests (FIXED)

**Problem**: Tests failing because they don't wait for animations to complete

**Cause**: Content switches with 200ms animation, tests were checking immediately

**Fix**: Use Playwright's built-in `toBeVisible()` which waits for animations

**Before**:
```typescript
await signUpTab.click();
// Fails: content not visible yet
expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
```

**After**:
```typescript
await signUpTab.click();
// Waits for animation: passes reliably
await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
```

### Issue 3: Error State Persistence (FIXED)

**Problem**: Error from registration persists when switching back to login

**Cause**: Error state not cleared on tab switch

**Fix**: Clear error when tab changes

**Implementation**:
```typescript
// In AuthTogglePanel
const [activeMode, setActiveMode] = useState<AuthMode>('login');

// EmailPasswordForm manages its own error state
// It clears on unmount when tab switches (handled by React)
```

## Performance Considerations

### Bundle Size

**Current Impact**:
- framer-motion: ~35KB (used for animations)
- Component code: ~8KB
- Total for auth flow: ~43KB gzipped

**Optimization**:
- Lazy load auth pages: `const UnifiedAuthPage = lazy(() => import('./UnifiedAuthPage'))`
- Code splitting ensures auth code only loads when needed

### Animation Performance

**Settings chosen for 60fps**:
- Duration: 200ms (fast enough to feel instant, slow enough to be smooth)
- Easing: easeInOut (natural feeling)
- Properties animated: opacity, x (GPU-accelerated)

**Why these animations are fast**:
- Only animating transform and opacity (GPU-accelerated properties)
- Short duration (200ms)
- No layout recalculation during animation

### Network Optimization

**API calls**:
- Registration: 1 request
- Login: 1 request
- Resend confirmation: 1 request (rate limited)

**Assets**:
- No additional images or fonts loaded
- All icons inline SVG

## Related Documentation

- [User Guide](/docs/auth/UNIFIED_AUTH_FLOW.md) - Pet parent documentation
- [Troubleshooting Guide](/docs/auth/UNIFIED_AUTH_TROUBLESHOOTING.md) - Support team guide
- [API Reference](/docs/API.md) - Authentication API documentation
- [Architecture](/docs/auth/ARCHITECTURE.md) - Overall auth system architecture
- [Security](/docs/auth/SECURITY.md) - Security implementation details

## Migration Checklist

For teams migrating from the old 3-page flow:

- [ ] Update all deep links to use `/auth` instead of `/auth/welcome`
- [ ] Update registration links to use `/auth?mode=register`
- [ ] Test all authentication flows in staging
- [ ] Update documentation and help articles
- [ ] Train support team on new flow
- [ ] Monitor analytics for completion rates
- [ ] Set up Isabel's database trigger for user creation
- [ ] Verify no ghost users in production

---

**Last Updated**: January 27, 2026
**Version**: 1.0.0
**Maintained By**: Thomas (Documentation Agent)
**For**: Developers, Technical Teams
