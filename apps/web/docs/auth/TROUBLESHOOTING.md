# Troubleshooting Guide: Authentication

Quick solutions to common authentication issues.

## Quick Navigation

- [User Issues](#user-issues) - Help for pet parents
- [Developer Issues](#developer-issues) - Technical problems
- [Test Issues](#test-issues) - Test failures
- [Configuration Issues](#configuration-issues) - Supabase setup
- [Production Issues](#production-issues) - Live environment

## User Issues

### "This email is already registered"

**Symptom**: User sees error when trying to register

**This is correct behavior when:**
- User already has an account with that email
- User forgot they registered before

**Solutions**:

1. **Try signing in**
   - Click "Sign in" button in the error message
   - Use the password from when you first registered
   - If successful → Welcome back!

2. **Reset password**
   - Click "Reset password" in the error message
   - Check email for reset link
   - Create new password
   - Sign in with new password

3. **Check spam folder**
   - Original verification email may be in spam
   - Find and click verification link
   - Then try signing in

**If none of these work**:
- Contact support@petforce.com
- Include the email address you're trying to use
- We'll check if an account exists

---

### "Password too weak"

**Symptom**: Can't create account, password rejected

**Why this happens**:
- Password doesn't meet security requirements
- Protects your pet's information

**Requirements**:
- At least 8 characters
- Mix of uppercase and lowercase letters
- At least one number
- At least one special character (!, @, #, $, etc.)

**Good password examples**:
- `BuddyLoves2024!`
- `MyC@t$Rule`
- `P3tF0rce!`

**Bad passwords to avoid**:
- `password` (too common)
- `12345678` (no letters)
- `buddy` (too short, no numbers/symbols)

---

### "Passwords don't match"

**Symptom**: Error when creating account

**Why this happens**:
- Password and Confirm Password fields are different
- Even one character difference causes error

**Solution**:
1. Clear both password fields
2. Carefully type your new password
3. Carefully type the SAME password in confirm field
4. Watch for:
   - Capital letters (P vs p)
   - Numbers that look like letters (0 vs O)
   - Spaces at beginning or end
5. Try copying password from first field and pasting in second

---

### "Check your email"

**Symptom**: After registering, told to check email, but no email arrives

**Immediate actions**:

1. **Wait 5 minutes**
   - Email can take up to 5 minutes to arrive
   - Check inbox every minute

2. **Check spam/junk folder**
   - Email might be filtered
   - Look for emails from PetForce or Supabase
   - Mark as "Not Spam" if found

3. **Check email address**
   - Go back to registration page
   - Did you type email correctly?
   - Common mistakes: .con instead of .com, gmial instead of gmail

4. **Resend verification email**
   - On the "Check your email" page
   - Click "Resend verification email"
   - Wait another 5 minutes

**Still no email**:
- Try a different email address (Gmail, Outlook, etc.)
- Contact support@petforce.com
- Include: email address you used, time you registered

---

### "Too many attempts"

**Symptom**: Can't register, blocked

**Why this happens**:
- Security measure to prevent abuse
- Triggered after multiple failed attempts

**Solution**:
1. Wait 30 minutes
2. Try again
3. If still blocked, wait 1 hour

**Prevention**:
- Don't click "Create account" multiple times
- Wait for response before trying again

---

## Developer Issues

### No Error Shown for Duplicate Email

**Symptom**: Duplicate registration succeeds instead of showing error

**Root Cause**: Supabase auto-confirm is enabled

**Diagnosis**:
```bash
# Check Supabase Dashboard
# Authentication → Email → Auto-confirm emails

# Should be: OFF
# If ON → This is the problem
```

**Solution**:
1. Open Supabase Dashboard
2. Navigate to Authentication → Email
3. Turn OFF "Auto-confirm emails"
4. Turn ON "Enable email confirmations"
5. Test again

**Why this matters**:
- Auto-confirm ON → Supabase returns success (security feature)
- Auto-confirm OFF → Supabase returns error (helpful for users)

**Reference**: [DUPLICATE_EMAIL_DETECTION.md#configuration](./DUPLICATE_EMAIL_DETECTION.md#configuration)

---

### Error Message Not User-Friendly

**Symptom**: Raw technical error shown to users

**Example**:
```
AuthApiError: User already registered
```

Instead of:
```
Email Already Registered
This email is already associated with an account...
```

**Diagnosis**:
```typescript
// Check error detection logic
console.log('Error:', { code: error.code, message: error.message });
```

**Solution**:

1. Update error detection in `src/features/auth/utils/error-messages.ts`:

```typescript
function getAuthErrorMessage(error, context) {
  const errorMessage = error?.message?.toLowerCase() || '';

  // Add more detection patterns
  if (
    error.code === 'USER_ALREADY_EXISTS' ||
    errorMessage.includes('already registered') ||
    errorMessage.includes('already exists') ||
    errorMessage.includes('email already') ||
    errorMessage.includes('duplicate email') // Add your pattern
  ) {
    return {
      title: 'Email Already Registered',
      message: '...',
      action: { /* ... */ }
    };
  }
}
```

2. Test with real error:
```bash
npm run test:e2e -- -g "duplicate email"
```

---

### "Sign In" Button Doesn't Work

**Symptom**: Clicking button does nothing

**Root Cause**: Missing `onToggleMode` callback

**Diagnosis**:
```typescript
// Check if callback provided
<EmailPasswordForm
  mode="register"
  onToggleMode={???} // Is this provided?
/>
```

**Solution**:

```typescript
const [mode, setMode] = useState<'login' | 'register'>('register');

<EmailPasswordForm
  mode={mode}
  onToggleMode={() => setMode(mode === 'login' ? 'register' : 'login')}
/>
```

Or for separate pages:
```typescript
<EmailPasswordForm
  mode="register"
  onToggleMode={() => navigate('/auth?mode=login')}
/>
```

---

### Environment Variables Not Working

**Symptom**: Auth API calls fail, no Supabase connection

**Diagnosis**:
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Should output values, not empty
```

**Solution**:

1. Create `.env.local` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Restart dev server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

3. Verify in browser console:
```javascript
// Check if loaded
console.log(import.meta.env.VITE_SUPABASE_URL)
```

**Common mistakes**:
- ❌ File named `.env` (should be `.env.local`)
- ❌ Missing `VITE_` prefix
- ❌ Quotes around values (don't use quotes)
- ❌ Didn't restart dev server

---

## Test Issues

### E2E Tests Failing: "Element not found"

**Symptom**: Playwright can't find element

**Diagnosis**:
```bash
# Run in headed mode to see what's happening
npx playwright test --headed -g "duplicate email"

# Take screenshot
npx playwright test --screenshot=on
```

**Common causes & solutions**:

1. **Dev server not running**
   ```bash
   # Terminal 1: Start server
   npm run dev

   # Terminal 2: Run tests
   npm run test:e2e
   ```

2. **Element selector changed**
   ```typescript
   // Instead of:
   await page.click('#submit-button')

   // Use role-based selector:
   await page.getByRole('button', { name: 'Create account' }).click()
   ```

3. **Element not rendered yet**
   ```typescript
   // Add proper wait
   await expect(element).toBeVisible({ timeout: 10000 });
   ```

4. **Element off screen**
   ```typescript
   // Scroll into view
   await element.scrollIntoViewIfNeeded();
   ```

---

### E2E Tests Timing Out

**Symptom**: Tests take too long, timeout error

**Diagnosis**:
```bash
# Check dev server logs
# Look for slow API calls or errors
```

**Solutions**:

1. **Increase timeout**:
```typescript
test.setTimeout(60000); // 60 seconds
```

2. **Check dev server is responsive**:
```bash
curl http://localhost:3000/auth
# Should return HTML quickly
```

3. **Check for infinite waits**:
```typescript
// Bad (waits forever if element never appears)
await page.waitForSelector('.nonexistent')

// Good (times out after 5 seconds)
await expect(element).toBeVisible({ timeout: 5000 })
```

---

### Mocks Not Working

**Symptom**: E2E tests make real API calls instead of using mocks

**Diagnosis**:
```typescript
// Add logging to see what's called
page.on('request', req => {
  console.log('Request:', req.url());
});
```

**Solution**:

Ensure mocks are set up BEFORE navigation:

```typescript
test.beforeEach(async ({ page }) => {
  // FIRST: Set up mocks
  await ApiMocking.setupMocks(page);

  // THEN: Navigate
  await page.goto('/auth');
});
```

**Common mistakes**:
- ❌ Calling `goto()` before `setupMocks()`
- ❌ Mock route pattern doesn't match request
- ❌ Missing `await` on `setupMocks()`

---

### Unit Tests Failing: Mock Not Called

**Symptom**: `expect(mockFn).toHaveBeenCalled()` fails

**Diagnosis**:
```typescript
const mockFn = vi.fn();
// ... test code ...
console.log('Mock calls:', mockFn.mock.calls);
console.log('Call count:', mockFn.mock.calls.length);
```

**Common causes**:

1. **Function not actually invoked**:
```typescript
// Make sure you call it!
const action = result?.action;
action?.onClick(); // Don't forget this!

expect(mockFn).toHaveBeenCalled();
```

2. **Wrong mock function**:
```typescript
// Make sure you're checking the right one
const mockA = vi.fn();
const mockB = vi.fn();

// Called mockA but checking mockB
mockA();
expect(mockB).toHaveBeenCalled(); // ❌ Wrong mock
expect(mockA).toHaveBeenCalled(); // ✅ Correct
```

3. **Mock cleared between calls**:
```typescript
mockFn();
vi.clearAllMocks(); // Clears call history!
expect(mockFn).toHaveBeenCalled(); // ❌ Fails
```

---

## Configuration Issues

### Supabase Auto-Confirm Enabled

**Symptom**: Duplicate emails don't show error

**Check**:
1. Open Supabase Dashboard
2. Go to Authentication → Email
3. Look for "Auto-confirm emails"

**If ON**:
- Duplicate signups return success (security feature)
- Users get confusing experience

**If OFF**:
- Duplicate signups return error
- Users get helpful error message

**Solution**:
Turn OFF auto-confirm for better UX (acceptable for pet care app)

**Security consideration**:
- Auto-confirm ON = prevents email enumeration
- Auto-confirm OFF = better UX, slight enumeration risk
- For PetForce: UX > enumeration risk (low-value target)

---

### Email Verification Not Working

**Symptom**: Users don't receive verification emails

**Check**:
1. Supabase Dashboard → Authentication → Email Templates
2. "Confirm signup" template should be enabled

**Common issues**:

1. **Email template disabled**
   - Enable "Confirm signup" template
   - Verify email content is correct

2. **Wrong email provider**
   - Check SMTP settings
   - Verify sender email is verified

3. **Emails going to spam**
   - Add SPF/DKIM records
   - Verify sender domain

---

### Rate Limiting Too Aggressive

**Symptom**: Users blocked after few attempts

**Check Supabase settings**:
- Dashboard → Authentication → Rate Limits

**Recommended limits**:
- Registration: 5 per hour per IP
- Login: 10 per 5 minutes per IP
- Password reset: 3 per hour per email

**Balance**:
- Too loose = security risk
- Too tight = frustrated users

---

## Production Issues

### Users Report "Can't Register"

**Immediate diagnosis**:

1. **Check error tracking** (Sentry, etc.):
   ```bash
   # Look for auth errors in last hour
   # Filter by: registration, signup
   ```

2. **Check Supabase status**:
   - Visit status.supabase.com
   - Check if service is down

3. **Check recent deployments**:
   ```bash
   git log -10 --oneline
   # Any recent auth changes?
   ```

4. **Reproduce issue**:
   - Go to production site
   - Try registering with test email
   - See if you can reproduce

---

### High Error Rate on Registration

**Symptom**: Error monitoring shows spike in registration errors

**Diagnosis steps**:

1. **Check error types**:
   - All duplicate email? (expected)
   - Network errors? (Supabase issue)
   - Validation errors? (frontend issue)

2. **Check error rate**:
   - 5% duplicate email = normal
   - 50% duplicate email = suspicious (attack?)
   - 80% network errors = Supabase issue

3. **Check geographic distribution**:
   - All from one region? (regional outage)
   - All from one IP? (bot attack)

**Actions**:

- **If Supabase issue**: Check status page, wait for resolution
- **If bot attack**: Enable CAPTCHA, increase rate limiting
- **If code issue**: Roll back recent deployment

---

### Email Verification Links Expired

**Symptom**: Users clicking old verification links get errors

**Why**:
- Links expire after 24 hours (Supabase default)
- User found email late

**Solution for users**:
1. Go back to registration page
2. Enter same email address
3. Click "Resend verification email"
4. Check inbox for new email
5. Click link within 24 hours

**Prevention**:
- Send reminder email after 12 hours
- Make expiration time clear in email
- Provide "resend" link in error message

---

## Getting Help

### Before Asking for Help

Gather this information:

1. **What you're trying to do**
   - Register new user
   - Handle duplicate email
   - Test authentication

2. **What happened**
   - Exact error message
   - Screenshot if possible
   - Browser console errors

3. **What you expected**
   - User-friendly error
   - Redirect to verification
   - Test passing

4. **What you tried**
   - Checked Supabase dashboard
   - Ran tests
   - Reviewed docs

### Where to Get Help

**Internal**:
- Thomas (Documentation) - Documentation questions
- Tucker (QA) - Testing questions
- Chuck (DevOps) - Configuration questions
- Peter (Product) - UX questions

**External**:
- Supabase Discord - Supabase-specific issues
- GitHub Issues - Bug reports
- Stack Overflow - General questions

### How to Ask

**Good question**:
```
I'm getting "Element not found" error in E2E test for duplicate email detection.

What I'm trying to do:
- Run: npx playwright test -g "duplicate email"

What happens:
- Error: "Timeout waiting for selector 'button[name="Create account"]'"
- Screenshot attached

What I tried:
- Ran in headed mode, button is there
- Selector works in other tests
- Dev server is running

Environment:
- Node: 18.19.0
- Playwright: 1.58.0
- Branch: feature/duplicate-email
```

**Bad question**:
```
Tests don't work help
```

---

## Diagnostic Checklist

Use this checklist to systematically diagnose issues:

### User Can't Register Checklist

- [ ] Is error message shown?
- [ ] Is error message user-friendly?
- [ ] Can user see "Sign in" button?
- [ ] Does "Sign in" button work?
- [ ] Is Supabase reachable?
- [ ] Are environment variables set?
- [ ] Is email verification required?

### Test Failing Checklist

- [ ] Is dev server running?
- [ ] Are mocks set up correctly?
- [ ] Are selectors up to date?
- [ ] Is there a timing issue?
- [ ] Does it pass in headed mode?
- [ ] Are environment variables set for tests?
- [ ] Is Supabase configuration correct?

### Production Issue Checklist

- [ ] Can you reproduce locally?
- [ ] Can you reproduce in staging?
- [ ] Is Supabase status green?
- [ ] Any recent deployments?
- [ ] Error rate normal or spike?
- [ ] Affecting all users or subset?
- [ ] Are monitoring tools working?

---

## Quick Reference

### Most Common Fixes

| Issue | Fix |
|-------|-----|
| No error for duplicate email | Turn off Supabase auto-confirm |
| Tests timing out | Ensure dev server running |
| Mocks not working | Call `setupMocks()` before `goto()` |
| Error not user-friendly | Update error detection logic |
| "Sign in" button broken | Provide `onToggleMode` callback |
| No verification email | Check spam, resend after 5 min |

### Quick Commands

```bash
# Run failing test in debug mode
npx playwright test --debug -g "test name"

# Check environment variables
echo $VITE_SUPABASE_URL

# Restart dev server
# Press Ctrl+C, then:
npm run dev

# View test report
npx playwright show-report

# Run specific test
npx playwright test -g "duplicate email"
```

---

**Maintained By**: Thomas (Documentation Guardian) & Tucker (QA Guardian)
**Last Updated**: 2026-02-01
**Related Docs**: [README](./README.md) | [User Guide](./USER_GUIDE.md) | [Testing Guide](./TESTING_GUIDE.md)
