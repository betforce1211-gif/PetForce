# Tucker's Manual Test Checklist - Registration Error Handling

## BUG REPORT
**Issue**: User tried to register with an email that already exists and got NO error message, NO feedback, NO guidance.

**Expected**: Show clear error: "This email is already registered. Please login or use forgot password."

## MANUAL TEST PROCEDURE

### Setup
1. Open http://localhost:3001/auth
2. Open browser DevTools (F12)
3. Go to Console tab
4. Go to Network tab

### Test 1: Register with Existing Email
**Steps**:
1. Click "Sign Up" tab
2. Enter email: `existing@example.com` (an email you know already exists)
3. Enter password: `Test123456!`
4. Enter confirm password: `Test123456!`
5. Click "Create Account"

**Observe**:
- [ ] What happens on screen? Any error message?
- [ ] What's in the browser console? Any errors?
- [ ] What's in Network tab? Check the response from Supabase
- [ ] Does the error message show up in the red error box?
- [ ] Is the error message helpful?

**Expected Supabase Response**:
```json
{
  "error": {
    "message": "User already registered",
    "status": 400
  }
}
```

**Record actual behavior**:
```
ACTUAL BEHAVIOR:
- Screen showed: ___________________________
- Console showed: __________________________
- Network response: ________________________
- Error box displayed: ______________________
```

### Test 2: Register with New Email
**Steps**:
1. Click "Sign Up" tab
2. Enter email: `newemail_${Date.now()}@example.com` (unique email)
3. Enter password: `Test123456!`
4. Enter confirm password: `Test123456!`
5. Click "Create Account"

**Observe**:
- [ ] Redirects to `/auth/verify-pending?email=...`
- [ ] Shows verification message
- [ ] No errors in console

### Test 3: Invalid Email Format
**Steps**:
1. Click "Sign Up" tab
2. Enter email: `notanemail`
3. Enter password: `Test123456!`
4. Click "Create Account"

**Observe**:
- [ ] HTML5 validation prevents submit? OR
- [ ] API returns validation error?
- [ ] Error message is clear?

### Test 4: Weak Password
**Steps**:
1. Click "Sign Up" tab
2. Enter email: `test@example.com`
3. Enter password: `weak`
4. Click "Create Account"

**Observe**:
- [ ] Password strength indicator shows weak
- [ ] API returns password strength error?
- [ ] Error message is clear?

### Test 5: Password Mismatch
**Steps**:
1. Click "Sign Up" tab
2. Enter email: `test@example.com`
3. Enter password: `Test123456!`
4. Enter confirm password: `Different123!`
5. Click "Create Account"

**Observe**:
- [ ] Error shows: "Passwords don't match"
- [ ] Form does NOT submit to API
- [ ] Error is shown BEFORE API call

### Test 6: Network Error
**Steps**:
1. Open DevTools > Network tab
2. Set throttling to "Offline"
3. Click "Sign Up" tab
4. Fill out form
5. Click "Create Account"

**Observe**:
- [ ] Shows network error message
- [ ] Button stops loading after timeout
- [ ] User can retry

## DEBUGGING CHECKLIST

If error message NOT showing for duplicate email:

1. **Check API Response**:
   - [ ] Open Network tab
   - [ ] Filter for `signUp` or `auth`
   - [ ] Check response body - does it contain error?
   - [ ] What's the exact error message and code?

2. **Check auth-api.ts**:
   - [ ] Does `register()` function receive the error?
   - [ ] Add console.log to line 49: `console.log('Supabase error:', error)`
   - [ ] Does it return the error properly?

3. **Check useAuth.ts**:
   - [ ] Does `registerWithPassword()` receive the error?
   - [ ] Add console.log to line 84: `console.log('Register result:', result)`
   - [ ] Does `setError()` get called?

4. **Check EmailPasswordForm.tsx**:
   - [ ] Does `error` prop from useAuth have a value?
   - [ ] Add console.log to line 76: `console.log('Form error:', error)`
   - [ ] Is the error AnimatePresence block rendering?
   - [ ] Check CSS - is error hidden by styling?

## EXPECTED RESULTS SUMMARY

| Test Case | Expected Behavior |
|-----------|-------------------|
| Existing email | Clear error: "User already registered" + guidance to login |
| New email | Redirect to verify-pending page |
| Invalid email | HTML5 validation or clear API error |
| Weak password | Password strength indicator + potential API error |
| Password mismatch | Client-side error BEFORE API call |
| Network error | Network error message + ability to retry |

## ACTUAL RESULTS

Fill this out after testing:

```
TEST RESULTS - [DATE/TIME]

Test 1 (Existing Email): 
Result: PASS / FAIL
Notes: 

Test 2 (New Email):
Result: PASS / FAIL
Notes:

Test 3 (Invalid Email):
Result: PASS / FAIL
Notes:

Test 4 (Weak Password):
Result: PASS / FAIL
Notes:

Test 5 (Password Mismatch):
Result: PASS / FAIL
Notes:

Test 6 (Network Error):
Result: PASS / FAIL
Notes:

OVERALL: PASS / FAIL
```

## FIX REQUIRED

Based on test results, the fix should:

1. **Detect duplicate email error** - Check Supabase error code/message
2. **Show helpful error message** - "This email is already registered"
3. **Provide next steps** - Link to Sign In tab or Forgot Password
4. **Maybe auto-switch to Sign In tab** - With email pre-filled

## NEXT STEPS

1. Run all 6 manual tests
2. Document actual behavior
3. If bug confirmed, implement fix
4. Write automated E2E test to prevent regression
5. Write unit tests for error handling
