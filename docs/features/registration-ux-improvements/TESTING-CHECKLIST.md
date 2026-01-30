# Registration UX Improvements - Manual Testing Checklist

**Feature**: Enhanced Registration Flow with P0 Fixes
**Version**: 1.0.0 (P0 Release)
**Date**: 2026-01-28
**Owner**: Tucker (QA Engineer)
**Documentation**: Thomas (Documentation Agent)

## Overview

This checklist covers manual testing for the P0 registration UX improvements:

1. Navigation to verification page (P0 BLOCKER FIX)
2. Loading state feedback (P0 UX)
3. Form input disabling (P0 Security)
4. ARIA announcements (P0 Accessibility)
5. Button visibility (P1 UX - bonus)

## Prerequisites

Before testing, ensure:

- [ ] Supabase email confirmation is enabled
- [ ] Test email account accessible (check spam folder)
- [ ] Browser console open (F12) to check for errors
- [ ] Screen reader installed for accessibility tests
- [ ] Multiple browsers available for cross-browser testing

## Test Environment Setup

**Recommended Setup:**

- Clean browser state (clear cache/cookies)
- Stable internet connection
- Console open to monitor errors
- Network tab open to monitor API calls

**Test Data:**

- Email: `test+{timestamp}@example.com` (use unique emails)
- Password: `TestPass123!` (meets requirements)

---

## P0 Critical Tests

These tests must ALL pass before release.

### Test 1: Navigation to Verification Page (P0 BLOCKER)

**Priority:** P0 - CRITICAL
**Bug Fixed:** Navigation was broken, user stayed on registration page

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill email: `test+nav@example.com`
3. [ ] Fill password: `TestPass123!`
4. [ ] Fill confirm password: `TestPass123!`
5. [ ] Click "Create account"
6. [ ] Wait for API response (watch network tab)

**Expected Results:**

- [ ] Page automatically navigates to `/auth/verify-pending`
- [ ] Navigation occurs within 500ms of API success
- [ ] URL includes email parameter: `?email=test%2Bnav%40example.com`
- [ ] Verification page displays with email shown
- [ ] No console errors during navigation
- [ ] No flash of old page before navigation

**Failure Indicators:**

- ❌ User stays on `/auth?mode=register` page
- ❌ No navigation occurs
- ❌ Console shows navigation error
- ❌ URL does not change

**If Test Fails:**

- Check browser console for errors
- Verify React Router configuration
- Check network tab - did API return `confirmationRequired: true`?
- Screenshot and report as P0 blocker

---

### Test 2: Loading State Feedback (P0 UX)

**Priority:** P0 - CRITICAL
**Bug Fixed:** No visual feedback, users didn't know registration was processing

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill form with valid data
3. [ ] **Watch the button closely** as you click "Create account"
4. [ ] Observe loading state

**Expected Results:**

- [ ] Loading spinner appears < 100ms after click
- [ ] Button text changes OR spinner appears next to text
- [ ] Button becomes visually disabled (grayed out or opacity change)
- [ ] Button has `aria-busy="true"` attribute (check in Elements tab)
- [ ] Button maintains same size (no layout shift)
- [ ] Loading state visible for duration of API call (2-5 seconds typical)
- [ ] Loading state clears when navigation occurs

**Timing Test:**

- [ ] **Measure:** Click to loading visible should be < 100ms
- [ ] Use performance.now() or just observe - should feel instant
- [ ] If latency > 100ms, record time and report

**Spinner Details:**

- [ ] Spinner size: ~20px (web) or ~18px (mobile)
- [ ] Spinner animates smoothly (spins continuously)
- [ ] Spinner color matches brand (primary color)

**Failure Indicators:**

- ❌ No spinner appears
- ❌ Button doesn't change appearance
- ❌ Loading state delayed > 100ms
- ❌ Button text doesn't change
- ❌ Button size/layout shifts

---

### Test 3: Form Input Disabling (P0 Security)

**Priority:** P0 - CRITICAL
**Bug Fixed:** Form inputs stayed active, allowing double-submit and user confusion

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill email: `test+disabled@example.com`
3. [ ] Fill password: `TestPass123!`
4. [ ] Fill confirm password: `TestPass123!`
5. [ ] Click "Create account"
6. [ ] **Immediately try to:**
   - [ ] Edit the email field (click and type)
   - [ ] Edit the password field (click and type)
   - [ ] Edit the confirm password field (click and type)
   - [ ] Click the "Show password" toggle
   - [ ] Click the "Create account" button again

**Expected Results:**

- [ ] Email input is disabled (cannot type, cursor doesn't appear)
- [ ] Password input is disabled (cannot type)
- [ ] Confirm password input is disabled (cannot type)
- [ ] All inputs visually appear disabled (grayed out)
- [ ] "Show password" button still works (or is also disabled - verify spec)
- [ ] Submit button disabled (cannot click again)
- [ ] Cursor changes to "not-allowed" over disabled inputs
- [ ] Tab navigation skips over disabled inputs

**Code Inspection:**

- [ ] Inspect HTML - verify `<fieldset disabled>` wraps form inputs
- [ ] Or verify each input has `disabled` attribute
- [ ] Check that `disabled` is set via `isLoading` state

**Security Test:**

- [ ] Open console
- [ ] Try to submit form twice rapidly
- [ ] Check Network tab - should only see ONE `/auth/v1/signup` request
- [ ] If two requests sent, this is a CRITICAL security bug

**Failure Indicators:**

- ❌ Can still type in email field
- ❌ Can still type in password fields
- ❌ Submit button can be clicked multiple times
- ❌ Multiple API requests sent (check Network tab)
- ❌ Inputs don't look disabled

---

### Test 4: ARIA Announcements (P0 Accessibility)

**Priority:** P0 - CRITICAL
**Bug Fixed:** Screen readers were silent, no state announcements

**Prerequisite:** Install screen reader:

- macOS: VoiceOver (Cmd+F5 to toggle)
- Windows: NVDA (free) or JAWS
- iOS: VoiceOver (Settings > Accessibility)
- Android: TalkBack (Settings > Accessibility)

**Steps:**

1. [ ] Enable screen reader
2. [ ] Go to `/auth?mode=register`
3. [ ] Fill form with valid data
4. [ ] **Listen** as you click "Create account"
5. [ ] Note what screen reader announces

**Expected Announcements:**

**On Submit:**

- [ ] Hears: "Creating your account..." (or similar)
- [ ] Announcement is polite (not interruptive)
- [ ] Announcement happens within 1 second of click

**On Success:**

- [ ] Hears: "Account created successfully" (or similar)
- [ ] Or hears navigation to new page

**On Error (test separately):**

- [ ] Hears: Error message clearly
- [ ] Error announcement is assertive (immediate)

**Code Inspection:**

- [ ] Open Elements tab
- [ ] Find `<div role="status" aria-live="polite">`
- [ ] Verify it exists
- [ ] Click submit, watch this element's text content update
- [ ] Text should change from "" to "Creating your account..."

**Cross-Screen Reader Testing:**

- [ ] VoiceOver (macOS): Announces correctly
- [ ] NVDA (Windows): Announces correctly
- [ ] JAWS (Windows): Announces correctly (if available)
- [ ] TalkBack (Android): Announces correctly (mobile only)

**Failure Indicators:**

- ❌ Screen reader is completely silent
- ❌ No status update announced
- ❌ Announcement is too late (> 2 seconds)
- ❌ `role="status"` element missing
- ❌ `aria-live` attribute missing or set to "off"

---

### Test 5: Form Re-enables on Error (P0 UX)

**Priority:** P0 - CRITICAL
**Bug Fixed:** Form stayed disabled after errors, preventing retry

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill email: `existing@example.com` (use email already registered)
3. [ ] Fill password: `TestPass123!`
4. [ ] Fill confirm password: `TestPass123!`
5. [ ] Click "Create account"
6. [ ] Wait for error: "This email is already registered"

**Expected Results:**

- [ ] Error message appears
- [ ] Loading spinner stops
- [ ] Button returns to "Create account" text
- [ ] Button becomes enabled again
- [ ] All form inputs become enabled
- [ ] User can edit email field
- [ ] User can edit password fields
- [ ] User can click "Create account" again to retry
- [ ] Focus management: focus should be on error or email field

**Test Retry:**

- [ ] Change email to new address
- [ ] Click "Create account" again
- [ ] Should work normally (navigation to verification)

**Failure Indicators:**

- ❌ Form stays disabled after error
- ❌ Button still shows loading spinner
- ❌ Cannot edit form fields
- ❌ Cannot retry submission

---

## P1 Enhancements (Nice to Have)

These are bonuses but not required for P0 release.

### Test 6: Button Always Visible Without Scrolling (P1 UX)

**Priority:** P1 - Enhancement
**Issue:** On some screen sizes, button was below the fold

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Resize browser to small height (e.g., 600px tall)
3. [ ] Note if "Create account" button is visible without scrolling

**Expected Results:**

- [ ] Button visible on screen without scrolling
- [ ] If not fully visible, page auto-scrolls button into view when focused
- [ ] Mobile: Button always in viewport or sticky at bottom

**Testing Viewports:**

- [ ] Desktop: 1920x1080 (full screen)
- [ ] Laptop: 1366x768
- [ ] Small laptop: 1280x720
- [ ] Mobile: 375x667 (iPhone SE)
- [ ] Mobile: 390x844 (iPhone 12)
- [ ] Tablet: 768x1024 (iPad)

---

## Functional Testing

### Test 7: Complete Registration Flow (Happy Path)

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill email: `test+happy@example.com`
3. [ ] Fill password: `TestPass123!`
4. [ ] Fill confirm password: `TestPass123!`
5. [ ] Click "Create account"
6. [ ] Wait for navigation to verification page
7. [ ] Check email inbox (including spam)
8. [ ] Click verification link in email
9. [ ] Verify redirected back to app
10. [ ] Try to sign in with credentials

**Expected Results:**

- [ ] Each step completes successfully
- [ ] No errors at any point
- [ ] Email arrives < 2 minutes
- [ ] Verification link works
- [ ] Can sign in after verification
- [ ] Total time < 5 minutes

---

### Test 8: Password Mismatch Error

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill email: `test@example.com`
3. [ ] Fill password: `TestPass123!`
4. [ ] Fill confirm password: `DifferentPass123!` (mismatch)
5. [ ] Click "Create account"

**Expected Results:**

- [ ] Error appears: "Passwords don't match"
- [ ] Form does NOT submit to API (check Network tab)
- [ ] Form stays enabled (not disabled)
- [ ] No loading spinner
- [ ] User can fix passwords and retry

---

### Test 9: Weak Password Error

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill email: `test@example.com`
3. [ ] Fill password: `weak` (doesn't meet requirements)
4. [ ] Fill confirm password: `weak`
5. [ ] Click "Create account"

**Expected Results:**

- [ ] Password strength indicator shows "Weak"
- [ ] Form submits anyway (or blocks - verify spec)
- [ ] API returns error: "Password doesn't meet requirements"
- [ ] Error message shows password requirements
- [ ] Form re-enables for retry

---

### Test 10: Network Error Handling

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill form with valid data
3. [ ] **Disconnect internet** (turn off WiFi)
4. [ ] Click "Create account"
5. [ ] Wait for timeout

**Expected Results:**

- [ ] Loading spinner appears
- [ ] After timeout (10s), error appears: "Network error"
- [ ] Form re-enables
- [ ] User can reconnect and retry
- [ ] Helpful message: "Check your internet connection"

---

## Edge Cases

### Test 11: Double-Click Prevention

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill form with valid data
3. [ ] Click "Create account" button TWICE very rapidly

**Expected Results:**

- [ ] Only ONE API request sent (check Network tab)
- [ ] Second click has no effect (button already disabled)
- [ ] Only one account created
- [ ] No duplicate submission

**If Double Request Sent:**

- This is a P0 security bug
- Backend should handle idempotency (same requestId)
- But client should prevent this

---

### Test 12: Browser Back Button During Loading

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill form and click "Create account"
3. [ ] **Immediately** click browser back button
4. [ ] Check what happens

**Expected Results:**

- [ ] Request may still complete
- [ ] Or request is cancelled
- [ ] No error in console
- [ ] User navigates back safely
- [ ] No hanging state

---

### Test 13: Slow Network Simulation

**Steps:**

1. [ ] Open DevTools > Network tab
2. [ ] Set throttling to "Slow 3G" or "Fast 3G"
3. [ ] Go to `/auth?mode=register`
4. [ ] Fill form and submit
5. [ ] Observe behavior during slow API call

**Expected Results:**

- [ ] Loading spinner visible for longer (10-30 seconds)
- [ ] Form stays disabled entire time
- [ ] No timeout error (or acceptable 30s timeout)
- [ ] Eventually navigates to verification page
- [ ] User experience is acceptable (not frustrating)

---

### Test 14: Very Fast Network

**Steps:**

1. [ ] Use very fast connection or mock instant API response
2. [ ] Submit registration form
3. [ ] Observe if loading state is visible at all

**Expected Results:**

- [ ] Loading spinner MAY flash briefly (< 100ms)
- [ ] Still navigates correctly
- [ ] No jarring instant transition
- [ ] User experience is smooth

---

## Accessibility Testing

### Test 15: Keyboard-Only Navigation

**Steps:**

1. [ ] Do NOT use mouse
2. [ ] Go to `/auth?mode=register`
3. [ ] Press Tab to navigate through form
4. [ ] Fill each field using keyboard only
5. [ ] Press Tab to reach "Create account" button
6. [ ] Press Enter or Space to submit

**Expected Results:**

- [ ] Can tab through all fields in logical order
- [ ] Focus indicator visible on each field
- [ ] Can type in all fields
- [ ] Can reach submit button via Tab
- [ ] Can submit via Enter key (in last input) OR Space on button
- [ ] After submit, focus management is handled (doesn't jump randomly)
- [ ] No keyboard traps (can always tab forward/backward)

---

### Test 16: High Contrast Mode

**Steps:**

1. [ ] Enable high contrast mode:
   - Windows: Settings > Ease of Access > High Contrast
   - macOS: System Preferences > Accessibility > Display > Increase Contrast
2. [ ] Go to `/auth?mode=register`
3. [ ] Fill and submit form

**Expected Results:**

- [ ] All text is readable
- [ ] Disabled state is visually clear
- [ ] Loading spinner is visible
- [ ] Borders and outlines sufficient
- [ ] Error messages have good contrast

---

### Test 17: 200% Zoom

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Zoom to 200% (Cmd/Ctrl + + +)
3. [ ] Fill and submit form

**Expected Results:**

- [ ] All content visible (no horizontal scroll ideally)
- [ ] Text not cut off
- [ ] Button still visible without scrolling (or requires minimal scroll)
- [ ] Form is usable at high zoom

---

## Browser Compatibility

### Test 18: Cross-Browser Testing

**Test on each browser:**

**Chrome (latest):**

- [ ] Registration flow works
- [ ] Loading states correct
- [ ] Navigation works
- [ ] No console errors

**Firefox (latest):**

- [ ] Registration flow works
- [ ] Loading states correct
- [ ] Navigation works
- [ ] No console errors

**Safari (latest):**

- [ ] Registration flow works
- [ ] Loading states correct
- [ ] Navigation works
- [ ] No console errors

**Edge (latest):**

- [ ] Registration flow works
- [ ] Loading states correct
- [ ] Navigation works
- [ ] No console errors

**Mobile Safari (iOS):**

- [ ] Registration flow works
- [ ] Touch interactions smooth
- [ ] Navigation works
- [ ] Loading states visible
- [ ] Keyboard dismisses on submit

**Chrome Mobile (Android):**

- [ ] Registration flow works
- [ ] Touch interactions smooth
- [ ] Navigation works
- [ ] Loading states visible

---

## Performance Testing

### Test 19: Performance Metrics

**Measurements to record:**

**Button Disable Latency:**

- [ ] Click submit → Measure time to button disabled
- [ ] Target: < 100ms (p95)
- [ ] Record: **\_** ms

**API Response Time:**

- [ ] Check Network tab for `/auth/v1/signup` request
- [ ] Record response time
- [ ] Target: < 3000ms (p95)
- [ ] Record: **\_** ms

**Navigation Time:**

- [ ] API success → Measure time to verification page visible
- [ ] Target: < 500ms
- [ ] Record: **\_** ms

**Total Flow Time:**

- [ ] Submit click → Verification page fully loaded
- [ ] Target: < 5000ms (p95)
- [ ] Record: **\_** ms

**Tools:**

- Use DevTools Performance tab
- Use console.time() / console.timeEnd()
- Use performance.now()

---

### Test 20: No Layout Shift

**Steps:**

1. [ ] Go to `/auth?mode=register`
2. [ ] Fill form
3. [ ] **Watch button closely** as you click submit
4. [ ] Note if button changes size or position

**Expected Results:**

- [ ] Button maintains same width and height
- [ ] Button stays in same position
- [ ] No text reflow around button
- [ ] Spinner appears without layout shift
- [ ] Google Lighthouse CLS score: 0 (or very low)

---

## Security Testing

### Test 21: No PII in Console Logs

**Steps:**

1. [ ] Open console (F12)
2. [ ] Clear console
3. [ ] Fill form with email: `test@example.com`, password: `Secret123!`
4. [ ] Submit form
5. [ ] Review ALL console logs

**Expected Results:**

- [ ] Email does NOT appear in plaintext in logs
- [ ] Password does NOT appear in logs at all
- [ ] If email logged, it's hashed: `tes***@example.com`
- [ ] Only requestId and generic events logged

**Failure = CRITICAL Security Bug:**

- ❌ Email in plaintext: `test@example.com`
- ❌ Password in any form

---

### Test 22: No PII in ARIA Announcements

**Steps:**

1. [ ] Enable screen reader
2. [ ] Submit registration form with email: `personal@example.com`
3. [ ] Listen to what screen reader announces

**Expected Results:**

- [ ] Does NOT announce email address
- [ ] Announces: "Creating your account..." (generic)
- [ ] Does NOT announce password
- [ ] Privacy maintained

**Failure = Privacy Issue:**

- ❌ "Creating account for personal@example.com" (reveals PII publicly)

---

## Bug Report Template

If any test fails, use this template:

```markdown
## Bug Report: [Test Name] Failed

**Test ID:** Test [number]
**Priority:** P0 / P1
**Status:** FAILED

**Steps to Reproduce:**

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach screenshots]

**Console Errors:**
```

[Paste any console errors]

```

**Environment:**
- Browser: [Chrome 120, Safari 17, etc.]
- OS: [macOS 14, Windows 11, etc.]
- Screen size: [1920x1080, etc.]
- Date/Time: [2026-01-28 10:30 AM]

**Additional Notes:**
[Any other relevant information]
```

---

## Sign-Off

**P0 Tests (Must ALL Pass):**

- [ ] Test 1: Navigation to verification page ✓
- [ ] Test 2: Loading state feedback ✓
- [ ] Test 3: Form input disabling ✓
- [ ] Test 4: ARIA announcements ✓
- [ ] Test 5: Form re-enables on error ✓

**Functional Tests:**

- [ ] Test 7: Complete happy path ✓
- [ ] Test 8: Password mismatch ✓
- [ ] Test 9: Weak password ✓
- [ ] Test 10: Network error ✓

**Edge Cases:**

- [ ] Test 11: Double-click prevention ✓
- [ ] Test 13: Slow network ✓

**Accessibility:**

- [ ] Test 15: Keyboard navigation ✓
- [ ] Test 16: High contrast ✓

**Cross-Browser:**

- [ ] Test 18: All major browsers ✓

**Security:**

- [ ] Test 21: No PII in logs ✓
- [ ] Test 22: No PII in ARIA ✓

**Performance:**

- [ ] Test 19: Performance targets met ✓
- [ ] Test 20: No layout shift ✓

---

**QA Sign-Off:**

- Tester: **\*\***\_\_\_\_**\*\***
- Date: **\*\***\_\_\_\_**\*\***
- Status: PASS / FAIL / BLOCKED
- Notes: **\*\***\_\_\_\_**\*\***

---

**Last Updated**: 2026-01-28
**Test Plan Owner**: Tucker (QA Engineer)
**Documentation Owner**: Thomas (Documentation Agent)
**Version**: 1.0.0 (P0 Release)
