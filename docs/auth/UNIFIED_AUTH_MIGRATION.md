# Migration Guide: Old Auth Flow → Unified Auth Flow

**For Developers and Product Teams**

This guide helps teams migrate from the old 3-page authentication flow to the new unified tabbed interface.

## Table of Contents

- [Overview](#overview)
- [What Changed](#what-changed)
- [Breaking Changes](#breaking-changes)
- [Migration Steps](#migration-steps)
- [Code Changes Required](#code-changes-required)
- [Testing Checklist](#testing-checklist)
- [Rollout Strategy](#rollout-strategy)

## Overview

### Old Flow (Deprecated)

```
Step 1: /auth/welcome
  - Welcome message
  - "Continue with Google" button
  - "Continue with Apple" button
  - "Continue with Email" button (→ login)
  - "Or create an account" link (→ register)

Step 2a: /auth/login
  - Email input
  - Password input
  - "Sign in" button
  - "Forgot password?" link
  - "Don't have an account? Sign up" link (→ register)

Step 2b: /auth/register
  - Email input
  - Password input
  - Confirm password input
  - "Create account" button
  - "Already have an account? Sign in" link (→ login)
```

### New Flow (Current)

```
Single Page: /auth
  - Tabs: [Sign In] [Sign Up]
  - Default: Sign In tab active
  - Content switches based on active tab
  - No navigation required
  - SSO buttons in each tab
```

### Migration Summary

| Aspect | Old Flow | New Flow |
|--------|----------|----------|
| **Pages** | 3 separate pages | 1 unified page |
| **Navigation** | Click through 2-3 pages | Switch tabs on same page |
| **Default View** | Welcome/landing page | Sign In form (most common action) |
| **User Clicks** | 2-3 clicks to login | 1 click to login |
| **Mobile Experience** | More scrolling, page loads | Compact, no page loads |
| **Discoverability** | Login hidden behind "Continue with Email" | Login immediately visible |

## What Changed

### Routes

**Deprecated Routes:**
```typescript
/auth/welcome     → Replaced by /auth
/auth/login       → Replaced by /auth (Sign In tab)
/auth/register    → Replaced by /auth?mode=register (Sign Up tab)
```

**Still Active Routes:**
```typescript
/auth                          → New unified page ✅
/auth?mode=register           → Unified page with Sign Up tab active ✅
/auth/forgot-password         → Unchanged ✅
/auth/reset-password          → Unchanged ✅
/auth/verify-pending          → Unchanged ✅
/auth/verify                  → Unchanged ✅
```

### Components

**Removed Components:**
- `WelcomePage.tsx` - Replaced by `UnifiedAuthPage.tsx`
- `AuthMethodSelector.tsx` - No longer needed (tabs replace it)

**New Components:**
- `UnifiedAuthPage.tsx` - Root container
- `AuthHeader.tsx` - Shared branding/messaging
- `AuthTogglePanel.tsx` - Tab navigation and content

**Modified Components:**
- `EmailPasswordForm.tsx` - Now supports both login and register modes
- Enhanced duplicate email error handling
- Better mode switching integration

**Unchanged Components:**
- `LoginPage.tsx` - Still exists but should redirect to `/auth`
- `RegisterPage.tsx` - Still exists but should redirect to `/auth?mode=register`
- `SSOButtons.tsx` - Same functionality
- `PasswordStrengthIndicator.tsx` - Same functionality
- `ResendConfirmationButton.tsx` - Same functionality

### User Experience

**Improved:**
- **Faster login**: 0 clicks for returning users (default tab is Sign In)
- **Less navigation**: No page transitions required
- **Clearer options**: Tabs make login/register choice obvious
- **Better mobile**: Compact design fits without scrolling

**Trade-offs:**
- **Less prominent registration**: Sign Up is a tab, not a dedicated page
- **No welcome message**: Directly to auth forms (but faster UX)

## Breaking Changes

### Hard Breaking Changes (Action Required)

1. **Direct links to `/auth/login` or `/auth/register`**
   - **Impact**: Links will redirect, but analytics may be affected
   - **Action**: Update all deep links to use `/auth` or `/auth?mode=register`

2. **Bookmarks and saved links**
   - **Impact**: Users with bookmarked `/auth/welcome` will be redirected
   - **Action**: Communicate change via email if significant user base

3. **External links (docs, emails, social media)**
   - **Impact**: Links to old URLs still work but redirect
   - **Action**: Update all documentation and marketing materials

### Soft Breaking Changes (No Action Required)

1. **Route redirects handle old URLs**
   ```typescript
   // Old routes automatically redirect
   <Route path="/auth/welcome" element={<Navigate to="/auth" replace />} />
   <Route path="/auth/login" element={<Navigate to="/auth" replace />} />
   <Route path="/auth/register" element={<Navigate to="/auth?mode=register" replace />} />
   ```

2. **Analytics event names changed**
   - Old: `welcome_page_viewed`, `login_page_viewed`
   - New: `unified_auth_viewed`, `sign_in_tab_selected`, `sign_up_tab_selected`

## Migration Steps

### Phase 1: Pre-Deployment (1-2 hours)

1. **Audit deep links** across all properties:
   - Website marketing pages
   - Blog posts and articles
   - Help center and documentation
   - Email templates
   - Social media profiles
   - Mobile app deep links

2. **Update documentation**:
   - User guides
   - Support articles
   - Developer documentation
   - Onboarding materials

3. **Prepare support team**:
   - Brief on new flow
   - Share troubleshooting guide
   - Update canned responses

4. **Update analytics**:
   - Add new event tracking for tabs
   - Create funnels for new flow
   - Set up comparison reports (old vs new)

### Phase 2: Deployment (Deploy Day)

1. **Deploy code**:
   ```bash
   git checkout main
   git pull
   npm run build
   npm run deploy:production
   ```

2. **Verify routes**:
   - Test `/auth` loads correctly
   - Test `/auth?mode=register` opens Sign Up tab
   - Test old routes redirect properly
   - Test forgot password flow
   - Test email verification flow

3. **Monitor for issues**:
   - Watch error rates
   - Check analytics for drop-offs
   - Monitor support tickets

### Phase 3: Post-Deployment (1-2 weeks)

1. **Update external links** (do gradually):
   - Update website to link to `/auth`
   - Update email templates
   - Update documentation
   - Update help center
   - Update social media

2. **Monitor metrics**:
   - Registration completion rate
   - Login success rate
   - Time to complete auth
   - Support ticket volume

3. **Collect feedback**:
   - User feedback surveys
   - Support team observations
   - Analytics data

4. **Optimize if needed**:
   - Adjust tab labels if confusing
   - Tweak animations if too slow/fast
   - Improve error messages based on tickets

### Phase 4: Cleanup (After 30 days)

1. **Remove old components**:
   ```bash
   # After verifying no issues
   rm src/features/auth/pages/WelcomePage.tsx
   rm src/features/auth/components/AuthMethodSelector.tsx
   ```

2. **Remove old routes** (optional):
   ```typescript
   // Keep redirects for a while, then remove
   // Remove after 6-12 months
   ```

3. **Update analytics**:
   - Archive old event types
   - Clean up old funnels
   - Focus reporting on new flow

## Code Changes Required

### 1. Update Route Definitions

**Before:**
```typescript
// src/App.tsx
<Routes>
  <Route path="/auth/welcome" element={<WelcomePage />} />
  <Route path="/auth/login" element={<LoginPage />} />
  <Route path="/auth/register" element={<RegisterPage />} />
</Routes>
```

**After:**
```typescript
// src/App.tsx
<Routes>
  {/* New unified route */}
  <Route path="/auth" element={<UnifiedAuthPage />} />

  {/* Redirects for backward compatibility */}
  <Route path="/auth/welcome" element={<Navigate to="/auth" replace />} />
  <Route path="/auth/login" element={<Navigate to="/auth" replace />} />
  <Route path="/auth/register" element={<Navigate to="/auth?mode=register" replace />} />

  {/* Unchanged routes */}
  <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
  <Route path="/auth/verify-pending" element={<EmailVerificationPendingPage />} />
  <Route path="/auth/verify" element={<VerifyEmailPage />} />
</Routes>
```

### 2. Update Navigation Links

**Before:**
```typescript
// Anywhere linking to auth
<Link to="/auth/welcome">Get Started</Link>
<Link to="/auth/login">Sign In</Link>
<Link to="/auth/register">Sign Up</Link>
```

**After:**
```typescript
// Update links to new URLs
<Link to="/auth">Get Started</Link>
<Link to="/auth">Sign In</Link>
<Link to="/auth?mode=register">Sign Up</Link>
```

### 3. Update Email Templates

**Before:**
```html
<!-- Email verification email -->
<a href="https://petforce.app/auth/verify?token=...">Verify Email</a>

<!-- Password reset email -->
<a href="https://petforce.app/auth/reset-password?token=...">Reset Password</a>

<!-- Marketing emails -->
<a href="https://petforce.app/auth/register">Join PetForce</a>
```

**After:**
```html
<!-- Email verification email (unchanged) -->
<a href="https://petforce.app/auth/verify?token=...">Verify Email</a>

<!-- Password reset email (unchanged) -->
<a href="https://petforce.app/auth/reset-password?token=...">Reset Password</a>

<!-- Marketing emails -->
<a href="https://petforce.app/auth?mode=register">Join PetForce</a>
```

### 4. Update Analytics Events

**Before:**
```typescript
// Old event tracking
analytics.track('welcome_page_viewed');
analytics.track('login_page_viewed');
analytics.track('register_page_viewed');
```

**After:**
```typescript
// New event tracking
analytics.track('unified_auth_page_viewed');
analytics.track('sign_in_tab_selected');
analytics.track('sign_up_tab_selected');
analytics.track('sign_in_form_submitted');
analytics.track('sign_up_form_submitted');
```

### 5. Update Tests

**Before:**
```typescript
// E2E test navigating to login
await page.goto('/auth/welcome');
await page.click('text=Continue with Email');
await expect(page).toHaveURL('/auth/login');
```

**After:**
```typescript
// E2E test for unified page
await page.goto('/auth');
// Sign In tab is active by default
await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute('aria-selected', 'true');

// Or navigate directly to Sign Up
await page.goto('/auth?mode=register');
await expect(page.getByRole('tab', { name: 'Sign Up' })).toHaveAttribute('aria-selected', 'true');
```

## Testing Checklist

### Pre-Deployment Testing

- [ ] **Unified page loads correctly**
  - [ ] Visit `/auth`
  - [ ] Sign In tab is active by default
  - [ ] Logo and branding appear
  - [ ] SSO buttons visible
  - [ ] Email form visible

- [ ] **Tab switching works**
  - [ ] Click Sign Up tab
  - [ ] Content switches smoothly
  - [ ] Animation is smooth (200ms)
  - [ ] Confirm password field appears
  - [ ] Password strength indicator appears
  - [ ] Terms and Privacy links appear

- [ ] **URL parameter works**
  - [ ] Visit `/auth?mode=register`
  - [ ] Sign Up tab is active
  - [ ] Registration form is visible

- [ ] **Old routes redirect**
  - [ ] Visit `/auth/welcome` → redirects to `/auth`
  - [ ] Visit `/auth/login` → redirects to `/auth`
  - [ ] Visit `/auth/register` → redirects to `/auth?mode=register`

- [ ] **Registration flow works**
  - [ ] Fill in registration form
  - [ ] Submit successfully
  - [ ] Redirect to `/auth/verify-pending`
  - [ ] Receive verification email
  - [ ] Click verification link
  - [ ] Redirect to `/auth/verify` (success page)

- [ ] **Login flow works**
  - [ ] Fill in login form (verified account)
  - [ ] Submit successfully
  - [ ] Redirect to `/dashboard`

- [ ] **Duplicate email detection works**
  - [ ] Try to register with existing email
  - [ ] See error: "This email is already registered"
  - [ ] Click "Sign in" link
  - [ ] Switches to Sign In tab
  - [ ] Email is pre-filled (optional)

- [ ] **Unverified login blocked**
  - [ ] Try to login with unverified account
  - [ ] See error: "Please verify your email address"
  - [ ] Resend confirmation button appears
  - [ ] Click resend
  - [ ] Cooldown timer works (5 minutes)

- [ ] **Forgot password flow**
  - [ ] Click "Forgot password?" link
  - [ ] Navigate to `/auth/forgot-password`
  - [ ] Submit email
  - [ ] Receive reset email
  - [ ] Click reset link
  - [ ] Create new password
  - [ ] Login with new password

- [ ] **Mobile responsiveness**
  - [ ] Test on iPhone (Safari)
  - [ ] Test on Android (Chrome)
  - [ ] Tabs work on mobile
  - [ ] Form fits without horizontal scroll
  - [ ] Submit button accessible without excessive scroll

- [ ] **Accessibility**
  - [ ] Tab navigation with keyboard
  - [ ] Form fields have labels
  - [ ] Error messages have aria-live
  - [ ] ARIA attributes on tabs
  - [ ] Screen reader announces changes

### Post-Deployment Testing

- [ ] **Production smoke test**
  - [ ] Visit production `/auth`
  - [ ] Tab switching works
  - [ ] SSO buttons work
  - [ ] Registration works
  - [ ] Login works

- [ ] **Analytics tracking**
  - [ ] Events firing correctly
  - [ ] Funnel data collecting
  - [ ] No missing events

- [ ] **Error monitoring**
  - [ ] No JavaScript errors
  - [ ] API errors handled gracefully
  - [ ] Network errors handled

## Rollout Strategy

### Recommended Approach: Big Bang Deployment

**Why Big Bang:**
- Simple, clean cutover
- No complex feature flags needed
- Old flow has redirects as fallback
- Easy to rollback if needed

**Rollout Plan:**

1. **Deploy to staging** (Day 1)
   - Deploy unified auth
   - Test thoroughly
   - Share with team for feedback

2. **Deploy to production** (Day 3)
   - Deploy during low-traffic window
   - Monitor closely for 2 hours
   - Have rollback plan ready

3. **Monitor and iterate** (Days 4-14)
   - Watch metrics daily
   - Address issues quickly
   - Collect user feedback

4. **Update external links** (Days 15-30)
   - Update marketing site
   - Update docs
   - Update emails

### Alternative: Phased Rollout (if needed)

**If you prefer gradual rollout:**

1. **Phase 1: New users only** (Week 1)
   - Show unified auth to new registrations
   - Keep old flow for existing users
   - Compare metrics

2. **Phase 2: 50% of users** (Week 2)
   - A/B test old vs new
   - Monitor metrics
   - Iterate based on data

3. **Phase 3: All users** (Week 3)
   - Roll out to everyone
   - Remove old flow

### Rollback Plan

**If issues arise:**

1. **Identify the issue**
   - Error rates elevated?
   - Completion rates dropped?
   - Critical bug?

2. **Quick fixes** (try first):
   - Fix animation timing
   - Update error messages
   - Fix mobile layout

3. **Full rollback** (if needed):
   ```bash
   # Revert to previous commit
   git revert <commit-hash>
   npm run build
   npm run deploy:production
   ```

4. **Post-rollback**:
   - Document what went wrong
   - Fix issues in staging
   - Re-plan deployment

## Communication Plan

### Internal Communication

**Engineering Team:**
- Share this migration guide
- Demo new flow in team meeting
- Answer questions in Slack

**Support Team:**
- Training session on new flow
- Share troubleshooting guide
- Update canned responses
- Monitor tickets closely first week

**Product/Marketing:**
- Update website copy
- Update marketing materials
- Prepare user announcement

### External Communication

**Email to Users (Optional):**
```
Subject: New, Faster Way to Sign In to PetForce

Hi [Name],

We've made signing in to PetForce even faster!

Instead of clicking through multiple pages, you can now sign in or create an account on a single page. Just head to petforce.app/auth and you'll see everything you need.

Your account and pet information are exactly the same - just a faster way to access them.

Have questions? Reply to this email or visit our help center.

Happy pet parenting!
The PetForce Team
```

**Help Center Article:**
- "What's new with PetForce sign in"
- Screenshots of new flow
- Link to user guide

## Success Metrics

Track these metrics to measure success:

### Primary Metrics

1. **Registration Completion Rate**
   - **Target**: ≥ current rate (no regression)
   - **Ideal**: 5-10% improvement

2. **Login Success Rate**
   - **Target**: ≥ current rate
   - **Ideal**: Maintain 95%+

3. **Time to Complete Auth**
   - **Target**: 20-30% reduction
   - **Measurement**: From page load to dashboard

### Secondary Metrics

1. **Support Tickets**
   - **Target**: No significant increase
   - **Monitor**: Auth-related tickets

2. **Error Rates**
   - **Target**: ≤ current rate
   - **Monitor**: JavaScript errors, API errors

3. **User Satisfaction**
   - **Target**: Positive feedback
   - **Measurement**: In-app surveys, NPS

### Analytics Events to Track

```typescript
// New events to monitor
unified_auth_page_viewed
sign_in_tab_selected
sign_up_tab_selected
tab_switched_sign_in_to_sign_up
tab_switched_sign_up_to_sign_in
duplicate_email_error_shown
sign_in_link_clicked_from_error
reset_password_link_clicked_from_error
```

## Common Issues and Solutions

### Issue: Users confused by tabs

**Symptom**: Users don't realize they can click tabs

**Solution**:
- Make tabs more prominent
- Add hover states
- Consider adding instructional text

### Issue: Registration rate dropped

**Symptom**: Fewer sign-ups than before

**Solution**:
- Make Sign Up tab more prominent
- Add registration CTA on landing page
- A/B test tab labels

### Issue: Mobile layout issues

**Symptom**: Form doesn't fit on mobile

**Solution**:
- Reduce padding
- Smaller text
- Stack elements vertically

### Issue: Animation feels slow

**Symptom**: Users complain about sluggishness

**Solution**:
- Reduce duration from 200ms to 150ms
- Or remove animation entirely

## Related Documentation

- [Architecture Documentation](/docs/auth/UNIFIED_AUTH_ARCHITECTURE.md) - Technical details
- [User Guide](/docs/auth/UNIFIED_AUTH_FLOW.md) - End-user documentation
- [Troubleshooting Guide](/docs/auth/UNIFIED_AUTH_TROUBLESHOOTING.md) - Support guide
- [Testing Documentation](/apps/web/src/features/auth/__tests__/e2e/README.md) - E2E test details

---

**Last Updated**: January 27, 2026
**Version**: 1.0.0
**Maintained By**: Thomas (Documentation Agent)
**For**: Developers, Product Teams, Engineering Leads
