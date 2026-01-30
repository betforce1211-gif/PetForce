# Registration Navigation Issue - Debug Guide

## The Problem (Tucker's P0 Finding)

After successful registration, users should navigate to `/auth/verify-pending` but navigation is not working.

## How Logging Helps

The instrumented form now logs EVERY step of the navigation decision and execution. This tells us exactly where it fails.

## Debug Decision Tree

### Step 1: Check if API Returns Success

**Look for**:

```javascript
[Registration] API response received {
  correlation_id: "abc-123",
  result_success: ???,  // ← Check this
  confirmation_required: ???,  // ← Check this
  api_duration_ms: 234
}
```

#### If `result_success: false`

→ **Root Cause**: API call failed  
→ **Location**: Backend or `auth-api.ts`  
→ **Fix**: Check error logs for API failure reason

#### If `result_success: true`, go to Step 2

---

### Step 2: Check Confirmation Required Flag

**Look for**:

```javascript
[Registration] Navigation decision {
  correlation_id: "abc-123",
  should_navigate: ???,  // ← Check this
  confirmation_required: ???,  // ← Check this
  target_url: "/auth/verify-pending"
}
```

#### If `confirmation_required: false`

→ **Root Cause**: Backend not requiring email confirmation  
→ **Location**: Supabase settings or auth-api.ts response mapping  
→ **Fix Options**:

1. Check Supabase email confirmation settings
2. Check `auth-api.ts` line 85-86 for confirmationRequired logic
3. Verify `authData.user.email_confirmed_at` is null for new users

#### If `confirmation_required: true`, go to Step 3

---

### Step 3: Check if Navigate Function Exists

**Look for**:

```javascript
[Registration] API response received {
  has_navigate_function: ???  // ← Check this
}
```

#### If `has_navigate_function: false`

→ **Root Cause**: useNavigate hook not working  
→ **Location**: Router context missing  
→ **Fix**: Ensure component is wrapped in RouterProvider

#### If `has_navigate_function: true`, go to Step 4

---

### Step 4: Check if Navigate Was Called

**Look for**:

```javascript
[Registration] Navigate called {
  correlation_id: "abc-123",
  url: "/auth/verify-pending?email=..."
}
```

#### If "Navigate called" log DOES NOT APPEAR

→ **Root Cause**: Conditional logic bug  
→ **Location**: EmailPasswordForm.tsx lines 92-96  
→ **Fix**: Check if-condition is evaluating correctly

```typescript
// Should be:
if (result.confirmationRequired) {
  navigate(...);  // ← This should execute
}
```

#### If "Navigate called" log DOES APPEAR, go to Step 5

---

### Step 5: Check Navigation Result

**Look for** (appears 100ms after navigate call):

```javascript
[Registration] Navigation result {
  correlation_id: "abc-123",
  success: ???,  // ← Check this
  current_url: "???",
  expected_url: "/auth/verify-pending"
}
```

#### If `success: false`

→ **Root Cause**: React Router blocked navigation  
→ **Possible Causes**:

1. Route guard blocking unauthenticated users
2. Route doesn't exist
3. Router not configured for `/auth/verify-pending`
4. Navigation prevented by useEffect or other hook

→ **Debug Steps**:

1. **Check if route exists**:

```bash
grep -r "verify-pending" apps/web/src/
```

2. **Check router configuration**:

```typescript
// Look for route definition
<Route path="/auth/verify-pending" element={...} />
```

3. **Check for route guards**:

```typescript
// Look for guards that might block
const RequireAuth = ({ children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" />;  // ← Might redirect away
  }
  return children;
};
```

4. **Check for useEffect blocking**:

```typescript
// In VerifyPendingPage or layout
useEffect(() => {
  if (!email) {
    navigate("/register"); // ← Might redirect back!
  }
}, [email]);
```

#### If `success: true`

→ **Problem Solved!** Navigation works.

---

## Quick Diagnosis Commands

### Check All Registration Logs

```javascript
// In browser console
sessionStorage.setItem("debug_registration", "true");

// Then register and filter logs
console.log(
  performance
    .getEntriesByType("mark")
    .filter((m) => m.name.includes("registration")),
);
```

### Export Logs for Analysis

```javascript
// In browser console after registration
const logs = [];
const originalLog = console.log;
console.log = (...args) => {
  if (args[0]?.includes?.("[Registration]")) {
    logs.push(args);
  }
  originalLog(...args);
};

// After registration
copy(JSON.stringify(logs, null, 2)); // Copies to clipboard
```

## Common Scenarios

### Scenario A: Email Confirmation Disabled

**Symptoms**:

- `confirmation_required: false`
- Navigation never attempted
- User logged in immediately

**Logs**:

```
[Registration] API response received { confirmation_required: false }
[Registration] No confirmation required, calling onSuccess
[Registration] Flow completed { success: true }
```

**Fix**: Enable email confirmation in Supabase settings

---

### Scenario B: Route Not Found

**Symptoms**:

- Navigate called
- Navigation result shows different URL
- 404 page appears

**Logs**:

```
[Registration] Navigate called { url: "/auth/verify-pending?email=..." }
[Registration] Navigation result {
  success: false,
  current_url: "/404"  // ← or still on /auth/register
}
```

**Fix**: Create `/auth/verify-pending` route

---

### Scenario C: Route Guard Blocking

**Symptoms**:

- Navigate called
- Redirected back to login or register

**Logs**:

```
[Registration] Navigate called { url: "/auth/verify-pending?email=..." }
[Registration] Navigation result {
  success: false,
  current_url: "/auth/login"  // ← Redirected by guard
}
```

**Fix**: Exclude `/auth/verify-pending` from authentication guards

---

### Scenario D: Race Condition

**Symptoms**:

- Sometimes works, sometimes doesn't
- Inconsistent navigation

**Logs**:

```
[Registration] Navigate called { url: "/auth/verify-pending?email=..." }
// ... long delay ...
[Registration] Navigation result { success: false }
```

**Fix**: Ensure navigate is called synchronously, not in setTimeout or Promise

---

## Log Correlation Example

**Successful flow**:

```
[Registration] Flow started { correlation_id: "abc-123" }
[Registration] Validation passed { correlation_id: "abc-123" }
[Registration] API request sent { correlation_id: "abc-123" }
[Registration] API response received {
  correlation_id: "abc-123",
  result_success: true,
  confirmation_required: true
}
[Registration] Navigation decision {
  correlation_id: "abc-123",
  should_navigate: true
}
[Registration] Navigate called {
  correlation_id: "abc-123",
  url: "/auth/verify-pending?email=..."
}
[Registration] Navigation result {
  correlation_id: "abc-123",
  success: true
}
[Registration] Flow completed { correlation_id: "abc-123", success: true }
```

**Failed flow** (example: route not found):

```
[Registration] Flow started { correlation_id: "def-456" }
[Registration] Validation passed { correlation_id: "def-456" }
[Registration] API request sent { correlation_id: "def-456" }
[Registration] API response received {
  correlation_id: "def-456",
  result_success: true,
  confirmation_required: true
}
[Registration] Navigation decision {
  correlation_id: "def-456",
  should_navigate: true
}
[Registration] Navigate called {
  correlation_id: "def-456",
  url: "/auth/verify-pending?email=..."
}
[Registration] Navigation result {
  correlation_id: "def-456",
  success: false,  // ← FAILURE
  current_url: "/auth/register"  // ← Still on same page
}
[Registration] Flow completed { correlation_id: "def-456", success: false }
```

## Reporting Findings

When you identify the issue, report with:

1. **Correlation ID**: `abc-123`
2. **Failure Point**: "Step 5 - Navigation blocked"
3. **Symptoms**: "Navigate called but success: false"
4. **Current URL**: "/auth/register"
5. **Expected URL**: "/auth/verify-pending"
6. **Suspected Cause**: "Route guard or missing route"
7. **Relevant Logs**: Copy full log sequence

## Next Steps

1. Run through decision tree
2. Identify exact failure point
3. Check suggested locations
4. Apply recommended fix
5. Test again with logging
6. Verify success in logs

---

**Created**: 2026-01-28  
**For**: Engrid & Tucker  
**Purpose**: Debug P0 registration navigation issue
