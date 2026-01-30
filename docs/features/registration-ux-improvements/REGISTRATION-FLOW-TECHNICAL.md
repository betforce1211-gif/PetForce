# Registration Flow - Technical Documentation

**Feature**: Email Password Registration with Verification Flow
**Status**: P0 Fixes in Progress (Tucker QA Review)
**Last Updated**: 2026-01-28
**Owner**: Engrid (Engineering), Thomas (Documentation)

## Overview

User registration flow with email verification, enhanced loading states, form disabling, and accessibility features.

**Core Improvements (P0):**

- Fixed navigation to verification page after successful registration
- Added loading state feedback during account creation
- Implemented form input disabling during submission (security)
- Added ARIA announcements for screen reader accessibility

## Architecture

### Components

**EmailPasswordForm.tsx** - Main registration form

- Location: `/apps/web/src/features/auth/components/EmailPasswordForm.tsx`
- Handles form state, validation, submission
- Manages loading states and error display
- Implements navigation to verification page

**Button.tsx** - UI component with loading states

- Location: `/apps/web/src/components/ui/Button.tsx`
- Supports `isLoading` prop with spinner animation
- Maintains button dimensions (prevents layout shift)
- Accessible with `aria-busy` attribute

**EmailVerificationPendingPage.tsx** - Post-registration verification page

- Location: `/apps/web/src/features/auth/pages/EmailVerificationPendingPage.tsx`
- Polls for email confirmation every 10 seconds
- Displays instructions and resend button
- Auto-redirects when email is verified

### Flow Diagram

```
[User fills registration form]
    ↓
[Click "Create account"]
    ↓
[P0 FIX] Button disables + shows spinner + loading text
    ↓
[P0 FIX] Form inputs disable (via fieldset disabled={isLoading})
    ↓
[P0 FIX] ARIA announces: "Creating your account..."
    ↓
[API call: POST /auth/v1/signup]
    ↓
[Success: confirmationRequired=true]
    ↓
[P0 FIX] ARIA announces: "Account created successfully"
    ↓
[P0 FIX] Navigate to /auth/verify-pending?email=X (BLOCKER FIX)
    ↓
[Verification page: poll for confirmation]
    ↓
[Email confirmed → redirect to login/dashboard]
```

### State Management

#### Registration Form State

```typescript
interface RegistrationFormState {
  // Form data
  email: string;
  password: string;
  confirmPassword: string;

  // UI state
  showPassword: boolean;
  showResendButton: boolean;
  passwordMismatchError: string | null;

  // Auth state (from useAuth hook)
  isLoading: boolean; // P0: Used to disable form and show loading
  error: AuthError | null;
}
```

#### Loading States (P0 Fix)

**Before (BROKEN):**

- No visual feedback during submission
- User could click submit multiple times
- No indication that something is happening

**After (P0 FIX):**

- Button text changes OR shows spinner
- Button disabled: `true`
- Button aria-busy: `true`
- Form inputs disabled via `<fieldset disabled={isLoading}>`
- Spinner visible: 20px (web) / 18px (mobile)
- Status announced to screen readers

### Form Disabling (P0 Security Fix)

**Implementation:**

```typescript
<form onSubmit={handleSubmit}>
  <fieldset disabled={isLoading}>
    {/* All form inputs here are automatically disabled when isLoading=true */}
    <Input label="Email" />
    <Input label="Password" />
    <Input label="Confirm Password" />
  </fieldset>

  <Button type="submit" isLoading={isLoading}>
    Create account
  </Button>
</form>
```

**Benefits:**

- Prevents double-submit attacks
- Prevents user confusion (can't edit during submission)
- Prevents race conditions
- Native browser behavior (inputs become non-interactive)
- Works with keyboard navigation

**Testing:**

- Click submit, try to edit email → Should be disabled
- Click submit, try to click submit again → Should not trigger
- Verify disabled state clears on success/error

### ARIA Announcements (P0 Accessibility Fix)

**Implementation:**

```typescript
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"  // Screen reader only, visually hidden
>
  {statusMessage}
</div>
```

**Status Messages:**

- `"Creating your account..."` - On submit start
- `"Account created successfully"` - On success
- `"Error: {error.message}"` - On failure
- `""` (empty) - Idle state

**Screen Reader Behavior:**

- `aria-live="polite"`: Announces at next opportunity (non-interruptive)
- `aria-atomic="true"`: Reads entire message, not just changes
- `.sr-only`: Visually hidden but accessible to screen readers

**Testing Checklist:**

- VoiceOver (macOS/iOS): Announces state changes
- JAWS (Windows): Announces state changes
- NVDA (Windows): Announces state changes
- TalkBack (Android): Announces state changes

### Navigation (P0 Blocker Fix)

**Issue Identified by Tucker:**
Navigation code exists but does not execute after successful registration.

**Current Code (EmailPasswordForm.tsx, line 88-96):**

```typescript
if (mode === "register") {
  if (password !== confirmPassword) {
    setPasswordMismatchError("Passwords don't match...");
    return;
  }
  const result = await registerWithPassword({ email, password });

  if (result.success) {
    // Redirect to verification pending page
    if (result.confirmationRequired) {
      navigate(`/auth/verify-pending?email=${encodeURIComponent(email)}`);
    } else {
      onSuccess?.();
    }
  }
}
```

**Root Cause (TO BE DOCUMENTED AFTER FIX):**
[PENDING: Engrid to identify and fix]

Possible causes to investigate:

1. `navigate()` function not available/imported correctly
2. React Router route not configured for `/auth/verify-pending`
3. Route guard blocking programmatic navigation
4. `result.confirmationRequired` not being set by backend
5. Component unmounting before navigation executes
6. Race condition with state updates

**Solution (TO BE DOCUMENTED AFTER FIX):**
[PENDING: Engrid to document actual fix]

**Testing:**

- Register new user → MUST navigate to `/auth/verify-pending`
- URL must include `email` parameter
- Page must load with email displayed
- Navigation must occur within 500ms of API response

## API Contract

### Request

**Endpoint:** `POST /auth/v1/signup`

```typescript
{
  email: string,          // Required: User's email address
  password: string,       // Required: User's password
  requestId?: string      // Optional: UUID for deduplication
}
```

**Example:**

```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response (Success - 200)

```typescript
{
  success: true,
  confirmationRequired: boolean,  // CRITICAL: If true, client MUST navigate
  user: {
    id: string,
    email: string,
    emailConfirmed: boolean,       // Will be false if confirmationRequired
    createdAt: string
  }
}
```

**Example:**

```json
{
  "success": true,
  "confirmationRequired": true,
  "user": {
    "id": "user-abc-123",
    "email": "newuser@example.com",
    "emailConfirmed": false,
    "createdAt": "2026-01-28T10:30:00.000Z"
  }
}
```

### Response (Error - 400/409/429)

```typescript
{
  success: false,
  error: {
    code: string,
    message: string
  }
}
```

**Error Codes:**

| Code               | HTTP Status | Meaning                            | Client Action                    |
| ------------------ | ----------- | ---------------------------------- | -------------------------------- |
| `EMAIL_IN_USE`     | 409         | Email already registered           | Show "Sign in" link              |
| `WEAK_PASSWORD`    | 400         | Password doesn't meet requirements | Show password requirements       |
| `INVALID_EMAIL`    | 400         | Email format invalid               | Show email validation error      |
| `RATE_LIMIT`       | 429         | Too many attempts                  | Show retry timer (5 min)         |
| `UNEXPECTED_ERROR` | 500         | Server error                       | Show retry button + support link |

### Client Implementation Notes

#### 1. Disable Form During Submission (P0 SECURITY)

```typescript
<fieldset disabled={isLoading}>
  {/* All inputs automatically disabled */}
</fieldset>
```

#### 2. Show Loading State (P0 UX)

```typescript
<Button
  type="submit"
  isLoading={isLoading}
  aria-busy={isLoading}
>
  {isLoading ? 'Creating your account...' : 'Create account'}
</Button>
```

Alternative (with spinner):

```typescript
<Button type="submit" isLoading={isLoading}>
  Create account
</Button>
// Button component internally shows spinner and changes text
```

#### 3. Navigate on Success (P0 BLOCKER FIX)

```typescript
const result = await registerWithPassword({ email, password });

if (result.success && result.confirmationRequired) {
  // MUST navigate to verification page
  navigate(`/auth/verify-pending?email=${encodeURIComponent(email)}`);
}
```

**Critical:** Navigation MUST occur. Failure to navigate is a P0 blocker.

#### 4. Handle Errors (P0 UX)

```typescript
if (!result.success) {
  // Re-enable form
  setIsLoading(false);

  // Show error message
  setError(result.error);

  // Log error with correlation ID
  logger.error("Registration failed", {
    requestId,
    error: result.error,
    email: hashEmail(email), // Hashed for privacy
  });
}
```

## Error Handling

### Error States

| Error Type      | User Message                                                          | Recovery Action           |
| --------------- | --------------------------------------------------------------------- | ------------------------- |
| `EMAIL_IN_USE`  | "This email is already registered"                                    | Show "Sign in" link       |
| `WEAK_PASSWORD` | "Password must be stronger (8+ chars, uppercase, lowercase, numbers)" | Show requirements         |
| `NETWORK_ERROR` | "Connection issue. Please check your internet and try again."         | Show retry button         |
| `UNKNOWN`       | "Something went wrong. Please try again or contact support."          | Show retry + support link |

### Error Recovery

**On Error:**

1. Form re-enables (fieldset disabled=false)
2. Loading spinner stops
3. Error message displays
4. ARIA announces error
5. User can edit and retry

**Error Display:**

```typescript
<AnimatePresence>
  {error && (
    <motion.div
      role="alert"
      aria-live="assertive"  // Errors are assertive (immediate)
      className="error-alert"
    >
      <p>{error.message}</p>
      {error.code === 'EMAIL_IN_USE' && (
        <button onClick={toggleToLogin}>Sign in instead</button>
      )}
    </motion.div>
  )}
</AnimatePresence>
```

## Testing

### Unit Tests

**Test Coverage (Target: 100% of P0 fixes):**

```typescript
// P0: Navigation test
test('navigates to verification page on successful registration', async () => {
  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate
  }));

  render(<EmailPasswordForm mode="register" />);

  // Fill and submit form
  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
  await userEvent.click(screen.getByRole('button', { name: /create account/i }));

  // Verify navigation
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/auth/verify-pending')
    );
  });
});

// P0: Loading state test
test('shows loading state during submission', async () => {
  render(<EmailPasswordForm mode="register" />);

  const submitButton = screen.getByRole('button', { name: /create account/i });

  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
    expect(submitButton).toBeDisabled();
  });
});

// P0: Form disabling test
test('disables all form inputs during submission', async () => {
  render(<EmailPasswordForm mode="register" />);

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/^password$/i);
  const submitButton = screen.getByRole('button');

  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });
});

// P0: ARIA announcements test
test('announces state changes to screen readers', async () => {
  render(<EmailPasswordForm mode="register" />);

  const liveRegion = screen.getByRole('status');

  await userEvent.click(screen.getByRole('button'));

  await waitFor(() => {
    expect(liveRegion).toHaveTextContent(/creating your account/i);
  });
});

// P0: Double-submit prevention test
test('prevents double submission', async () => {
  const mockRegister = jest.fn().mockResolvedValue({ success: true });

  render(<EmailPasswordForm mode="register" />);

  const submitButton = screen.getByRole('button');

  // Click twice rapidly
  await userEvent.click(submitButton);
  await userEvent.click(submitButton);

  // Should only call API once
  expect(mockRegister).toHaveBeenCalledTimes(1);
});
```

### E2E Tests (Playwright)

**Critical Path Test:**

```typescript
test("complete registration flow with enhanced UX", async ({ page }) => {
  await page.goto("/auth?mode=register");

  // Fill form
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "SecurePass123!");
  await page.fill('[name="confirmPassword"]', "SecurePass123!");

  // Submit
  await page.click('button[type="submit"]');

  // P0: Verify loading state appears < 100ms
  const loadingStart = Date.now();
  await expect(page.locator('button[aria-busy="true"]')).toBeVisible();
  const loadingLatency = Date.now() - loadingStart;
  expect(loadingLatency).toBeLessThan(100);

  // P0: Verify form inputs are disabled
  await expect(page.locator('[name="email"]')).toBeDisabled();
  await expect(page.locator('[name="password"]')).toBeDisabled();

  // P0: Verify navigation to verification page (CRITICAL)
  await expect(page).toHaveURL(/\/auth\/verify-pending/, { timeout: 5000 });

  // Verify email parameter in URL
  expect(page.url()).toContain("email=test%40example.com");

  // Verify verification page loaded
  await expect(page.locator("text=/check your email/i")).toBeVisible();
});
```

### Accessibility Tests

**Requirements:**

- WCAG 2.1 Level AA compliance
- Screen reader compatible (VoiceOver, JAWS, NVDA, TalkBack)
- Keyboard navigable
- Focus management
- ARIA attributes correct

**Test with axe:**

```typescript
test('registration form has no accessibility violations', async () => {
  const { container } = render(<EmailPasswordForm mode="register" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('registration form loading state has no accessibility violations', async () => {
  const { container } = render(<EmailPasswordForm mode="register" />);

  await userEvent.click(screen.getByRole('button'));

  await waitFor(async () => {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Performance Requirements

**Button Disable Latency:** < 100ms (p95)

- Time from click to button disabled
- Measured from user click event to DOM update

**API Response Time:** < 3000ms (p95)

- Time from request sent to response received
- Includes network time

**Total Flow Time:** < 5000ms (p95)

- Time from submit click to verification page load
- End-to-end user experience

**Navigation Time:** < 500ms

- Time from API success to new page visible
- Must feel instant to users

**Performance Monitoring:**

```typescript
const start = performance.now();
await handleSubmit();
const latency = performance.now() - start;

// Log if too slow
if (latency > 100) {
  logger.warn("Slow button disable", { latency, threshold: 100 });
}
```

## Security Considerations

### Form Disabling (P0)

**Threat:** Double-submit attack
**Mitigation:** Disable all inputs via `<fieldset disabled={isLoading}>`
**Test:** Try to submit form twice → Should only send one API request

### Request Deduplication

**Threat:** Race condition from rapid clicks
**Mitigation:** Use UUID requestId for idempotency on backend
**Implementation:**

```typescript
const requestId = crypto.randomUUID();
await registerWithPassword({ email, password, requestId });
```

### Email Privacy

**Threat:** Email exposed in URL query parameters
**Mitigation:**

- URL encodes email
- Consider sessionStorage instead (P1 improvement)
- Current: Acceptable for email (non-sensitive)
- Better: Store in sessionStorage, not URL

### No PII in ARIA Announcements

**Threat:** Screen reader announces sensitive data publicly
**Mitigation:** Don't include email/password in status messages
**Good:** "Creating your account..."
**Bad:** "Creating account for user@example.com..."

### No PII in Logs

**Threat:** Email addresses in plaintext logs
**Mitigation:** Hash email addresses in logs
**Implementation:**

```typescript
logger.info("Registration started", {
  email: hashEmail(email), // "use***@example.com"
  requestId,
});
```

## Mobile Considerations

### Touch Targets

**Requirement:** 44px minimum (WCAG AA)
**Current:** Button maintains size during loading ✓
**Test:** Verify button dimensions don't change when spinner appears

### Haptic Feedback

**P1 Enhancement (not P0):**

- Vibrate on submit (iOS/Android)
- Different pattern for success vs. error

### Keyboard Behavior

**Requirement:** Keyboard dismisses on submit
**Implementation:** Automatic on form submit (native behavior)

### Offline Detection

**P1 Enhancement (not P0):**

- Detect offline before submit
- Show "You're offline" message
- Prevent failed API call

## Logging Events

See Larry's spec for full event list. Key events for registration:

**Events:**

1. `registration.attempt.started` - User clicks submit
2. `registration.api.request` - API request sent
3. `registration.api.response` - API response received
4. `registration.navigation.attempted` - Navigation triggered
5. `registration.navigation.result` - Navigation succeeded/failed
6. `registration.error` - Any error occurred

**Example Log Entry:**

```json
{
  "timestamp": "2026-01-28T10:30:00.000Z",
  "level": "INFO",
  "event": "registration.navigation.attempted",
  "requestId": "abc-123",
  "data": {
    "email": "use***@example.com",
    "targetUrl": "/auth/verify-pending",
    "hasEmailParam": true
  }
}
```

## Future Improvements (P1)

**Not required for P0, but nice to have:**

1. **Success Transition Animation** (1000ms)
   - Checkmark animation
   - "Account created!" message
   - Smooth fade to verification page

2. **Enhanced Haptic Feedback**
   - Different patterns for different states
   - Success haptic on account creation
   - Error haptic on failure

3. **A/B Testing on Loading Text**
   - Test "Creating your account..."
   - vs. "Setting up your PetForce family..."
   - vs. just spinner, no text

4. **Full Event Logging Suite**
   - All 14 events from Larry's spec
   - Analytics integration
   - Error tracking (Sentry/similar)

5. **Email in SessionStorage**
   - Store email in sessionStorage instead of URL
   - More private, cleaner URLs
   - Retrieve on verification page

## Related Documentation

- [User Guide (FAQ)](/docs/auth/USER_GUIDE.md) - User-facing documentation
- [Error Reference](/docs/auth/ERRORS.md) - Error codes and handling
- [API Documentation](/docs/API.md) - Complete API reference
- [Email Verification Flow](/docs/auth/EMAIL_VERIFICATION_FLOW.md) - Verification process
- [Testing Checklist](/docs/features/registration-ux-improvements/TESTING-CHECKLIST.md) - Manual testing guide

---

**Last Updated**: 2026-01-28
**Documentation Owner**: Thomas (Documentation Agent)
**Engineering Owner**: Engrid (Software Engineer)
**QA Owner**: Tucker (QA Engineer)
**Status**: P0 - Critical for Release
