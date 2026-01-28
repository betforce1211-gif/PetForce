# Tucker's Test Plan - Registration Error Handling Fix

## Current Status: FAILED
**Bug**: User tries to register with existing email, gets NO error message.

## Root Cause Analysis

After code review, the flow is:
1. User submits registration form → EmailPasswordForm.tsx
2. Calls registerWithPassword() → useAuth.ts hook
3. Calls register() API → auth-api.ts
4. Calls Supabase signUp() → Supabase API
5. Supabase returns error (if email exists)
6. Error flows back up the chain
7. EmailPasswordForm displays error

**THE PROBLEM**: We need to ACTUALLY TEST this to see where it breaks.

## Files Involved

1. `/Users/danielzeddr/PetForce/apps/web/src/features/auth/components/EmailPasswordForm.tsx`
   - Line 205-229: Error display logic
   - Should show error in red box

2. `/Users/danielzeddr/PetForce/packages/auth/src/api/auth-api.ts`
   - Line 49-64: Error handling for registration
   - Passes through Supabase error

3. `/Users/danielzeddr/PetForce/packages/auth/src/hooks/useAuth.ts`
   - Line 69-99: registerWithPassword hook
   - Line 84-86: Sets error state

## Test Strategy

### Phase 1: Manual Verification
1. Start dev server: `npm run dev`
2. Open http://localhost:3001/auth
3. Open DevTools Console and Network tab
4. Try to register with existing email
5. Document EXACT behavior

### Phase 2: Add Debug Logging
If error doesn't show, add console.logs:
- auth-api.ts line 49: Log Supabase error
- useAuth.ts line 84: Log error being set
- EmailPasswordForm.tsx line 76: Log error prop

### Phase 3: Fix Implementation
Based on findings, implement fix with:
- Better error detection (check Supabase error codes)
- User-friendly messages
- Actionable guidance (link to sign in, forgot password)

### Phase 4: Automated Tests
Write tests to prevent regression:
- Unit test: auth-api.ts handles duplicate email error
- Unit test: useAuth.ts sets error state
- Integration test: EmailPasswordForm displays error
- E2E test: Full registration flow with duplicate email

## Expected Supabase Error for Duplicate Email

Based on Supabase docs and our test file, expect:
```javascript
{
  error: {
    name: 'AuthApiError' or 'USER_ALREADY_EXISTS',
    message: 'User already registered' or similar,
    status: 400 or 422
  }
}
```

## Success Criteria

- [ ] Register with existing email shows error message
- [ ] Error message is clear and helpful
- [ ] Error provides actionable guidance (link to sign in)
- [ ] Error is visible and prominently displayed
- [ ] All other error cases work (network, weak password, etc.)
- [ ] Happy path still works (new email registers successfully)

## Test Cases

### Test 1: Duplicate Email (CRITICAL - This is the bug)
**Input**: Email that already exists in database
**Expected**: Show error "Email already registered. Would you like to sign in instead?"
**Actual**: [TO BE TESTED]

### Test 2: New Email (Happy Path)
**Input**: Unique email address
**Expected**: Redirect to /auth/verify-pending
**Actual**: [TO BE TESTED]

### Test 3: Invalid Email Format
**Input**: "notanemail"
**Expected**: HTML5 validation or API error
**Actual**: [TO BE TESTED]

### Test 4: Weak Password
**Input**: "weak"
**Expected**: Password strength indicator + potential API error
**Actual**: [TO BE TESTED]

### Test 5: Password Mismatch
**Input**: password="Test123!" confirmPassword="Different123!"
**Expected**: Client-side error before API call
**Actual**: [TO BE TESTED]

### Test 6: Network Error
**Input**: Valid data but network offline
**Expected**: Network error message
**Actual**: [TO BE TESTED]

## Next Actions

1. YOU (human) need to run manual test
2. Go to http://localhost:3001/auth
3. Try to register with email you already registered
4. Tell Tucker what happens
5. Tucker will then create proper fix

Tucker cannot test in browser directly - YOU must be the hands and eyes!
