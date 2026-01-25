# Change: Fix User Registration Database Persistence

## Why

**CRITICAL BUG DISCOVERED**: Users successfully register and receive verification emails, but their accounts do not appear in the database. This is a silent failure that breaks the entire authentication flow.

### Root Cause Analysis

After investigating the codebase and Supabase configuration, the team has identified the issue:

**Supabase Configuration** (`supabase/config.toml` line 46):
```toml
enable_confirmations = true
```

**What This Means**:
- When `enable_confirmations = true`, Supabase creates the user record BUT marks it as **unconfirmed**
- Unconfirmed users exist in `auth.users` table but **do not appear in standard queries**
- The user gets an email (which is why the user saw the email)
- The user cannot log in until they click the email verification link
- Our code at `auth-api.ts:47-56` checks `if (!authData.user)` which **passes** because Supabase returns the user
- However, the user is in a "pending confirmation" state

### The Silent Failure

The bug is **silent** because:
1. ✅ Registration returns `success: true`
2. ✅ Email is sent successfully
3. ✅ No errors are thrown
4. ❌ **BUT**: User cannot be queried from database until email is confirmed
5. ❌ **AND**: No logging exists to track this state
6. ❌ **AND**: No monitoring alerts fire

### Agent Responsibility Analysis

**Peter (Product Management)**:
- ❌ Requirements didn't specify email confirmation behavior
- ❌ Didn't research how competitors handle unconfirmed users
- ❌ Didn't define "user exists in database" clearly

**Engrid (Software Engineering)**:
- ❌ Code doesn't check for `email_confirmed_at` field
- ❌ No validation that user is queryable post-registration
- ❌ No state tracking for "pending confirmation" users

**Tucker (QA/Testing)**:
- ❌ No test for "user appears in database after registration"
- ❌ No test for "unconfirmed user cannot login"
- ❌ No integration test that checks email confirmation flow

**Larry (Logging/Observability)**:
- ❌ No logging of registration events
- ❌ No tracking of confirmation state
- ❌ No alerts for "registration succeeded but user unconfirmed" pattern
- ❌ No metrics on confirmation rate

**Samantha (Security)**:
- ⚠️ Email confirmation is a security best practice (prevents spam accounts)
- ✅ Configuration is secure
- ❌ Didn't flag that unconfirmed users need special handling

## What Changes

### 1. Fix Registration Flow
- Update registration API to track confirmation state
- Add explicit logging of user creation and confirmation status
- Return clear messaging about email confirmation requirement

### 2. Add Comprehensive Logging (Larry's Checklist)
- Log all registration attempts with unique request ID
- Log email confirmation sent/failed
- Log email confirmation completed
- Log user state transitions (created → confirmed → active)
- Track metrics: registration rate, confirmation rate, time-to-confirm

### 3. Add Missing Tests (Tucker's Checklist)
- Test: User created in database after registration
- Test: User marked as unconfirmed initially
- Test: User cannot login before email confirmation
- Test: User can login after email confirmation
- Test: Integration test for full registration → confirmation → login flow

### 4. Add Monitoring & Alerts (Larry's Checklist)
- Alert: Registration success rate drops below 95%
- Alert: Confirmation rate drops below 70% (24hr window)
- Alert: Time-to-confirm exceeds 1 hour for >20% of users
- Dashboard: Real-time registration funnel metrics

### 5. Improve User Experience (Dexter's Input)
- Show clear "Check your email" message after registration
- Add "Resend verification email" button
- Show countdown/status of email confirmation
- Improve error messages when login attempted before confirmation

## Impact

### Affected Specs
- **NEW**: `logging-observability` - Larry's requirements for auth event logging
- **NEW**: `qa-testing` - Tucker's requirements for registration testing
- **MODIFIED**: `authentication` - Add email confirmation state handling
- **MODIFIED**: `ux-design` - Add confirmation flow UX requirements

### Affected Code
- `packages/auth/src/api/auth-api.ts` - Add logging and state tracking
- `packages/auth/src/hooks/useAuth.ts` - Handle confirmation state
- `apps/web/src/pages/auth/RegistrationPage.tsx` - Improve UX messaging
- **NEW**: `packages/auth/src/utils/logger.ts` - Centralized auth logging
- **NEW**: `packages/auth/src/api/__tests__/registration-flow.test.ts` - Integration tests

### Breaking Changes
None - This is a bug fix that improves existing behavior

### Team Accountability

This bug happened because **multiple agents failed their responsibilities**:

1. **Peter** - Didn't define clear requirements for email confirmation flow
2. **Tucker** - Didn't test database persistence after registration
3. **Larry** - Didn't implement logging for critical auth events
4. **Engrid** - Didn't validate user state after creation

Going forward, the new agent checklists will prevent this class of bug.

## Success Criteria

✅ Users appear in database immediately after registration (even if unconfirmed)
✅ Confirmation state is clearly tracked and logged
✅ All registration events are logged with request IDs
✅ Alerts fire if confirmation rate drops
✅ Tests validate full registration flow
✅ User sees clear messaging about email confirmation
✅ Resend verification email functionality works

## Alignment with Product Philosophy

This fix embodies PetForce principles:

1. **Reliability Over Features**: Fix critical auth bug before adding features
2. **Never Miss Anything**: Comprehensive logging ensures we catch issues
3. **Simplicity**: Clear user messaging about email confirmation
4. **Quality Standards**: Every agent checklist must be complete going forward
