# Unified Authentication Troubleshooting Guide

**For Support Teams**

This guide helps support teams troubleshoot common issues with the new unified authentication flow.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
- [Error Messages](#error-messages)
- [Database Queries](#database-queries)
- [Escalation Procedures](#escalation-procedures)

## Quick Diagnostics

When a user reports an authentication issue, ask these questions:

1. **What are they trying to do?**
   - Sign up for a new account
   - Sign in to an existing account
   - Reset their password
   - Verify their email

2. **What error message do they see?**
   - Get the exact text
   - Ask for a screenshot if possible

3. **Have they received any emails from PetForce?**
   - Check inbox and spam folder
   - Note the timestamp of the email

4. **What device and browser are they using?**
   - Desktop or mobile
   - Browser name and version

## Common Issues

### Issue 1: "This email is already registered"

**Symptom**: User tries to sign up but sees "This email is already registered"

**Cause**: The email already has an account

**User Flow**:
1. User goes to `/auth`
2. Clicks **Sign Up** tab
3. Enters email and password
4. Clicks **Create account**
5. Sees error: "This email is already registered"

**Resolution Steps**:

1. **Confirm they have an account**:
   - "It looks like you already have a PetForce account with this email address."
   - Ask: "Do you remember creating an account before?"

2. **If they remember their password**:
   - Click **Sign in** link in the error message
   - Enter email and password
   - Click **Sign in**

3. **If they forgot their password**:
   - Click **reset password** link in the error message
   - OR click **Forgot password?** on the Sign In tab
   - Enter email address
   - Check email for reset link
   - Create new password

4. **If they claim they never signed up**:
   - Possible scenarios:
     - They signed up with a different email
     - Someone else used their email (rare)
     - They signed up but forgot
   - Verify their email with database query (see below)
   - If account exists, proceed with password reset
   - If security concern, escalate to security team

**Database Verification**:
```sql
-- Check if user exists
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'user@example.com';
```

### Issue 2: "Please verify your email address"

**Symptom**: User tries to sign in but sees "Please verify your email address before logging in"

**Cause**: User registered but hasn't clicked verification link

**User Flow**:
1. User previously signed up
2. Never clicked verification link in email
3. Tries to sign in now
4. Sees error with **Resend verification email** button

**Resolution Steps**:

1. **Check if they received the original email**:
   - Ask them to check inbox and spam folder
   - Search for emails from "noreply@petforce.app"

2. **If they have the email**:
   - Have them click the verification link
   - Wait for confirmation message
   - Try signing in again

3. **If they can't find the email**:
   - Click **Resend verification email** button
   - Wait 2-5 minutes for new email
   - Check spam folder
   - Click verification link when it arrives

4. **If still no email after resend**:
   - Check their email address for typos
   - Verify email isn't blocked by IT (corporate accounts)
   - Check our email logs (see Database Queries)
   - May need to escalate to engineering

**Rate Limiting Note**:
Users can only resend verification emails once every 5 minutes. If they see "You have made too many requests", have them wait.

**Database Verification**:
```sql
-- Check verification status
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  CASE
    WHEN email_confirmed_at IS NULL THEN 'NOT VERIFIED'
    ELSE 'VERIFIED'
  END as verification_status,
  EXTRACT(MINUTE FROM (NOW() - created_at)) as minutes_since_signup
FROM auth.users
WHERE email = 'user@example.com';
```

### Issue 3: "The email or password you entered is incorrect"

**Symptom**: User tries to sign in but credentials don't work

**Causes**:
- Wrong password (most common)
- Wrong email address
- Caps Lock is on
- Extra spaces in email or password

**Resolution Steps**:

1. **Verify email address**:
   - Ask them to double-check for typos
   - Common mistakes: @gmial.com, @yaho.com
   - Check for extra spaces before/after

2. **Verify password**:
   - Passwords are case-sensitive
   - Check if Caps Lock is on
   - Ask if they recently changed it

3. **If they forgot password**:
   - Click **Forgot password?** link
   - Enter email address
   - Check email for reset link
   - Create new password
   - Sign in with new password

4. **If they're certain credentials are correct**:
   - Verify account exists (database query)
   - Check if email is verified
   - Try resetting password anyway

**Database Verification**:
```sql
-- Check if account exists and is verified
SELECT
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  CASE
    WHEN email_confirmed_at IS NULL THEN 'Unverified - need to verify email'
    ELSE 'Verified - password might be wrong'
  END as diagnosis
FROM auth.users
WHERE email = 'user@example.com';
```

### Issue 4: "Passwords don't match"

**Symptom**: User sees error when signing up about passwords not matching

**Cause**: Password and Confirm Password fields have different values

**Resolution Steps**:

1. **Have them re-enter both passwords**:
   - Make sure both fields have exactly the same text
   - Check for extra spaces
   - Remember passwords are case-sensitive

2. **Use the password visibility toggle**:
   - Click the eye icon to show password
   - Verify both fields match exactly

3. **Try copy-paste**:
   - Type password in first field
   - Copy it (Ctrl+C or Cmd+C)
   - Paste into second field (Ctrl+V or Cmd+V)

**Common Causes**:
- Caps Lock toggled between fields
- Extra space at the end
- Different character than they think (0 vs O, 1 vs l)

### Issue 5: Verification email not received

**Symptom**: User signed up but never received verification email

**Possible Causes**:
- Email in spam folder
- Typo in email address
- Email blocked by IT department
- Email service delay

**Resolution Steps**:

1. **Check spam/junk folder**:
   - Look for "PetForce" or "Verify your email"
   - Check "Promotions" tab (Gmail)
   - Mark as "Not Spam" if found

2. **Verify email address**:
   - Check for typos in email
   - Confirm it's the email they have access to

3. **Wait a few minutes**:
   - Emails can take 2-5 minutes to arrive
   - Server delays or email routing

4. **Resend verification email**:
   - Go to `/auth`
   - Click **Sign In** tab
   - Try to sign in with their email/password
   - Error will show **Resend verification email** button
   - Click it and wait for new email

5. **Check if email was sent**:
   - Use database query to see when emails were sent
   - Check email service logs (escalate if needed)

6. **Corporate email issues**:
   - Some companies block external emails
   - IT department may need to whitelist petforce.app
   - Try with personal email as workaround

**Database Verification**:
```sql
-- Check account and when it was created
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  EXTRACT(MINUTE FROM (NOW() - created_at)) as minutes_since_signup,
  CASE
    WHEN email_confirmed_at IS NULL THEN 'Waiting for verification'
    ELSE 'Already verified'
  END as status
FROM auth.users
WHERE email = 'user@example.com';

-- If created recently but not verified, email may still be in transit
-- If created >10 minutes ago, email service issue
```

### Issue 6: Can't switch between Sign In and Sign Up

**Symptom**: User clicks tab but nothing happens

**Cause**: JavaScript not loading or browser issue

**Resolution Steps**:

1. **Refresh the page**:
   - Press F5 or Cmd+R
   - Tab switching should work

2. **Clear browser cache**:
   - Ctrl+Shift+Delete (Chrome/Firefox)
   - Clear cache and reload

3. **Try different browser**:
   - Chrome, Firefox, Safari, Edge all supported
   - May indicate browser extension conflict

4. **Check browser console** (for advanced users):
   - Press F12
   - Look for JavaScript errors
   - Take screenshot and escalate if errors found

5. **Direct navigation workaround**:
   - For Sign Up: `/auth?mode=register`
   - For Sign In: `/auth`

**Escalation**: If tab switching doesn't work after refresh, escalate to engineering with:
- Browser name and version
- Screenshot of the page
- Browser console errors (F12)

## Error Messages

### Complete Error Message Reference

| Error Message | Meaning | User Action | Support Action |
|---------------|---------|-------------|----------------|
| "This email is already registered" | Email already has account | Sign in or reset password | Verify account exists in database |
| "Please verify your email address before logging in" | Email not confirmed | Check email for verification link | Verify email_confirmed_at is NULL |
| "The email or password you entered is incorrect" | Wrong credentials | Check email/password, reset if needed | Verify account exists, check if verified |
| "Passwords don't match. Please make sure both passwords are identical." | Password mismatch during signup | Re-enter both passwords | No action needed, validation working |
| "You have made too many requests. Please wait a few minutes." | Rate limit hit | Wait 5 minutes before resending | Rate limiting working as designed |
| "Unable to connect to the server. Please check your internet connection." | Network error | Check internet, try again | Check if servers are down |
| "An unexpected error occurred. Please try again." | Unknown server error | Try again, contact support if persists | Check logs, escalate to engineering |

### Error Code Reference

Internal error codes you may see in logs:

| Error Code | Meaning | User-Facing Message |
|------------|---------|---------------------|
| `USER_ALREADY_EXISTS` | Duplicate registration | "This email is already registered" |
| `EMAIL_NOT_CONFIRMED` | Login before verification | "Please verify your email address" |
| `INVALID_CREDENTIALS` | Wrong email/password | "The email or password you entered is incorrect" |
| `RATE_LIMIT_EXCEEDED` | Too many requests | "You have made too many requests" |
| `NETWORK_ERROR` | Connection failed | "Unable to connect to the server" |
| `WEAK_PASSWORD` | Password too simple | "Please choose a stronger password" |

## Database Queries

### Useful Support Queries

**Check user account status:**
```sql
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  CASE
    WHEN email_confirmed_at IS NULL THEN 'UNVERIFIED'
    WHEN last_sign_in_at IS NULL THEN 'VERIFIED_NEVER_LOGGED_IN'
    ELSE 'ACTIVE'
  END as account_status,
  EXTRACT(MINUTE FROM (NOW() - created_at)) as account_age_minutes,
  CASE
    WHEN email_confirmed_at IS NOT NULL THEN
      EXTRACT(MINUTE FROM (email_confirmed_at - created_at))
    ELSE NULL
  END as minutes_to_verify
FROM auth.users
WHERE email = 'user@example.com';
```

**Find recent signups waiting for verification:**
```sql
SELECT
  id,
  email,
  created_at,
  EXTRACT(MINUTE FROM (NOW() - created_at)) as minutes_waiting
FROM auth.users
WHERE email_confirmed_at IS NULL
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;
```

**Check for ghost users (should be empty if trigger works):**
```sql
SELECT
  au.id,
  au.email,
  au.created_at,
  'GHOST_USER' as issue
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;
```

**Find users who signed up but never verified:**
```sql
SELECT
  email,
  created_at,
  EXTRACT(DAY FROM (NOW() - created_at)) as days_unverified
FROM auth.users
WHERE email_confirmed_at IS NULL
  AND created_at < NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;
```

### Database Access

**Who has access:**
- Engineering team
- Senior support with read-only access

**How to request query:**
1. Ask in #support-escalation Slack channel
2. Provide: user email, issue description
3. Engineer will run query and share results

**Never share with users:**
- User IDs
- Password hashes
- Internal system details

## Escalation Procedures

### When to Escalate

Escalate to **Engineering** if:
- User can't sign up or sign in after trying all troubleshooting steps
- Verification emails not being sent (check database first)
- JavaScript errors in browser console
- Tab switching doesn't work after refresh
- "Unexpected error occurred" that persists
- Suspected bug or system issue

Escalate to **Security** if:
- User claims someone else created account with their email
- Suspicious account activity
- Multiple failed login attempts
- Account compromise suspected

Escalate to **Product** if:
- User experience issue not covered by documentation
- Feature request
- Consistent pattern of user confusion

### Escalation Template

```
**Issue**: [Brief description]
**User Email**: user@example.com (or anonymize if sensitive)
**Browser/Device**: Chrome 120 on Windows 11
**Steps Taken**:
1. Verified account exists in database
2. Confirmed email not verified
3. Resent verification email
4. User still not receiving emails

**Database Status**:
- Account created: 2026-01-27 10:30:00
- Email confirmed: NULL (unverified)
- Last sign in: Never

**Question**: Why aren't verification emails reaching this user?
```

### Engineering Contact

- **Slack**: #support-escalation
- **Email**: engineering-support@petforce.app
- **Emergency**: Use PagerDuty for production outages

### Expected Response Times

- **Low Priority** (general questions): 24-48 hours
- **Medium Priority** (user blocked but workaround exists): 4-8 hours
- **High Priority** (user completely blocked): 1-2 hours
- **Critical** (multiple users affected): 30 minutes

## Support Best Practices

### Do's

- **Do** be patient and empathetic
- **Do** verify information before making changes
- **Do** document all troubleshooting steps
- **Do** use database queries to verify user reports
- **Do** escalate when needed
- **Do** update this guide when you find new patterns

### Don'ts

- **Don't** share user IDs or internal details with users
- **Don't** manually change user passwords
- **Don't** promise specific features or timelines
- **Don't** blame the user for confusion
- **Don't** guess if you're unsure - escalate instead

### Communication Templates

**Verification email issue:**
```
Hi [Name],

I see you're having trouble receiving your verification email. Let's get this sorted out.

First, can you please check your spam/junk folder? Sometimes our emails end up there. Look for an email from noreply@petforce.app with the subject "Verify your email address".

If you don't see it there, try these steps:
1. Visit petforce.app/auth
2. Click the "Sign In" tab
3. Enter your email and password
4. You'll see an option to "Resend verification email"
5. Check your inbox again (including spam)

The email should arrive within 2-5 minutes. Let me know if you still don't receive it and I'll investigate further.

Best regards,
[Your name]
```

**Password reset:**
```
Hi [Name],

No worries about forgetting your password - this happens to everyone!

Here's how to reset it:
1. Go to petforce.app/auth
2. Click "Forgot password?" below the password field
3. Enter your email address
4. Check your email for a reset link
5. Click the link and create a new password
6. Sign in with your new password

The reset link expires after 1 hour for security, so use it as soon as you receive it.

Let me know if you run into any issues.

Best regards,
[Your name]
```

## Monitoring and Metrics

### Key Metrics to Watch

Track these metrics to identify systemic issues:

1. **Verification email delivery rate**: Should be >95%
2. **Time to verify email**: Average should be <15 minutes
3. **Login success rate**: Should be >90%
4. **Password reset requests**: Spike may indicate credential issues

### Red Flags

Contact engineering immediately if you see:
- Multiple users reporting same issue
- Verification emails not being received (>3 reports in 1 hour)
- "Unexpected error" reports increasing
- Tab switching not working for multiple users

## Related Documentation

- [User Guide](/docs/auth/UNIFIED_AUTH_FLOW.md) - Share with users for self-service
- [Architecture](/docs/auth/UNIFIED_AUTH_ARCHITECTURE.md) - Technical details for understanding system
- [Error Messages](/docs/auth/ERRORS.md) - Complete error reference

---

**Last Updated**: January 27, 2026
**Version**: 1.0.0
**Maintained By**: Thomas (Documentation Agent)
**For**: Support Teams, Customer Success
