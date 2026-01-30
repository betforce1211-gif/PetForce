# Larry's Registration Logging Implementation Checklist

## Overview

This checklist guides Engrid through integrating the comprehensive registration logging system to debug Tucker's P0 navigation issue.

## Quick Start (5 Minutes)

### 1. Install & Build Observability Package

```bash
cd /Users/danielzeddr/PetForce/packages/observability
npm install
npm run build
```

### 2. Replace EmailPasswordForm (Testing)

```bash
cd /Users/danielzeddr/PetForce

# Backup original
cp apps/web/src/features/auth/components/EmailPasswordForm.tsx \
   apps/web/src/features/auth/components/EmailPasswordForm.tsx.backup

# Use instrumented version
cp apps/web/src/features/auth/components/EmailPasswordForm.instrumented.tsx \
   apps/web/src/features/auth/components/EmailPasswordForm.tsx
```

### 3. Start Dev Server & Test

```bash
cd apps/web
npm run dev
```

Open http://localhost:3000/auth/register and check console.

## Detailed Implementation

### Phase 1: Core Logging (P0 - 30 minutes)

#### Step 1.1: Verify Registration Logger

**File**: `/Users/danielzeddr/PetForce/packages/observability/src/registration-logger.ts`

**Check**:

- [x] File created with all P0 events
- [x] Email hashing function present
- [x] Error sanitization implemented
- [x] Correlation ID tracking
- [ ] Build succeeds (`npm run build`)

**Test**:

```typescript
import { hashEmail, sanitizeErrorMessage } from "@petforce/observability";

console.log(hashEmail("test@example.com")); // Should output hash, not email
console.log(sanitizeErrorMessage("User test@example.com failed")); // Should sanitize
```

#### Step 1.2: Verify Export

**File**: `/Users/danielzeddr/PetForce/packages/observability/src/index.ts`

**Check**:

- [x] `export * from './registration-logger'` added

#### Step 1.3: Test Instrumented Form

**File**: `/Users/danielzeddr/PetForce/apps/web/src/features/auth/components/EmailPasswordForm.instrumented.tsx`

**Check**:

- [x] All 8 P0 events logged
- [x] Navigation debug logging comprehensive
- [x] Console.log statements present
- [x] Error handling complete
- [ ] No TypeScript errors

**Run TypeScript Check**:

```bash
cd apps/web
npx tsc --noEmit
```

### Phase 2: Integration Testing (P0 - 20 minutes)

#### Step 2.1: Local Development Test

1. **Start dev server**:

```bash
cd /Users/danielzeddr/PetForce/apps/web
npm run dev
```

2. **Open registration page**:
   - Navigate to http://localhost:3000/auth/register
   - Open browser DevTools Console

3. **Test happy path**:
   - Fill in email: `test-larry@example.com`
   - Fill in password: `TestPass123!`
   - Fill in confirm password: `TestPass123!`
   - Click "Create account"

4. **Verify console logs appear**:

```
[Registration] Form mounted
[Registration] Form submitted
[Registration] Validation passed
[Registration] API request sent
[Registration] API response received
[Registration] Navigation decision
[Registration] Navigate called
[Registration] Navigation result
[Registration] Flow completed
```

5. **Check correlation ID consistency**:
   - All logs should have same `correlation_id`
   - Example: `abc-123-def-456`

#### Step 2.2: Error Path Testing

**Test password mismatch**:

1. Fill in email: `test@example.com`
2. Fill in password: `Password1`
3. Fill in confirm password: `Password2` (different!)
4. Click "Create account"

**Expected logs**:

```
[Registration] Form submitted
[Registration] Validation failed - password mismatch
[Registration] Error occurred { error_type: 'validation' }
[Registration] Flow completed { success: false }
```

**Test duplicate email**:

1. Register with existing email
2. Look for API error logging

**Expected logs**:

```
[Registration] API response received { result_success: false }
[Registration] Registration failed
[Registration] Error occurred { error_type: 'api' }
```

#### Step 2.3: Navigation Issue Debugging

**This is the P0 blocker Tucker found!**

1. **Successful registration**:
   - Register new user
   - Watch console for navigation logs

2. **Look for these specific logs**:

```javascript
[Registration] Navigation decision {
  correlation_id: "...",
  should_navigate: true,  // ← Should be true
  will_navigate: true,    // ← Should be true
  confirmation_required: true,  // ← Key condition
  target_url: "/auth/verify-pending"
}

[Registration] Navigate called {
  correlation_id: "...",
  url: "/auth/verify-pending?email=..."
}

[Registration] Navigation result {
  correlation_id: "...",
  success: true,  // ← If false, navigation is blocked!
  current_url: "...",
  expected_url: "/auth/verify-pending"
}
```

3. **Diagnose issue**:

**If `confirmation_required: false`**:
→ Backend issue or auth-api.ts response mapping
→ Check: `packages/auth/src/api/auth-api.ts` line 85-86

**If `Navigate called` but `success: false`**:
→ React Router blocking navigation
→ Check: Router guards, protected routes, navigate hook

**If `Navigate called` doesn't appear**:
→ Logic bug in conditional
→ Check: EmailPasswordForm.tsx line 92-93

### Phase 3: Privacy Verification (P0 - 10 minutes)

#### Step 3.1: Check for PII Leaks

**Test**:

1. Register with email: `myrealemail@gmail.com`
2. Cause an error (duplicate email or password mismatch)
3. Check ALL console logs and network logs

**Verify**:

- [ ] Email never appears in plain text
- [ ] Email hash is used instead
- [ ] Error messages are sanitized
- [ ] No passwords in logs (obviously!)

**Command to grep for email in logs**:

```bash
# Should return NO results
grep -r "myrealemail@gmail.com" logs/
```

#### Step 3.2: Test Email Hashing

**Browser console**:

```javascript
import { hashEmail } from "@petforce/observability";

const hash1 = hashEmail("test@example.com");
const hash2 = hashEmail("TEST@EXAMPLE.COM");
const hash3 = hashEmail(" test@example.com ");

console.log(hash1 === hash2); // Should be true (case insensitive)
console.log(hash1 === hash3); // Should be true (trimmed)
console.log(hash1); // Should NOT contain @
```

### Phase 4: Performance Verification (P1 - 10 minutes)

#### Step 4.1: Check Performance Metrics

1. **Register a new user**
2. **Look for performance logs**:

```
[PERF] registration.api.<correlation-id>: 234.56ms
[Registration] Performance timing {
  button_disable_latency_ms: 5,     // ← Should be < 100ms
  api_response_time_ms: 234,        // ← Should be < 5000ms
}
```

3. **Check for warnings**:

If button disable > 100ms:

```
[Registration] Button disable latency exceeded 100ms
```

If API response > 5s:

```
[Registration] API response time exceeded 5s
```

#### Step 4.2: Test Double-Submit Prevention

1. Fill registration form
2. Click "Create account"
3. **IMMEDIATELY** click again (within 1 second)

**Expected log**:

```
[Registration] Double-submit detected {
  prevented: true,
  time_between_clicks_ms: 234
}
```

**Expected behavior**: Second click ignored

### Phase 5: Rollback Plan (Just in Case)

#### If Anything Goes Wrong

**Quick rollback**:

```bash
cd /Users/danielzeddr/PetForce

# Restore original form
cp apps/web/src/features/auth/components/EmailPasswordForm.tsx.backup \
   apps/web/src/features/auth/components/EmailPasswordForm.tsx

# Restart dev server
cd apps/web
npm run dev
```

**Gradual rollout option**:
Keep both files and use feature flag:

```typescript
// apps/web/src/features/auth/pages/RegisterPage.tsx
import { EmailPasswordForm } from '../components/EmailPasswordForm';
import { EmailPasswordForm as InstrumentedForm } from '../components/EmailPasswordForm.instrumented';

const ENABLE_LOGGING = process.env.NODE_ENV === 'development'; // Or use feature flag

const FormComponent = ENABLE_LOGGING ? InstrumentedForm : EmailPasswordForm;

<FormComponent mode="register" />
```

## Success Criteria

### Must Have (P0)

- [x] Registration logger created
- [x] Instrumented form created
- [ ] Build succeeds
- [ ] Console logs appear
- [ ] Correlation IDs match
- [ ] Navigation issue is debuggable
- [ ] No PII in logs

### Should Have (P1)

- [ ] Performance metrics tracked
- [ ] Double-submit prevention works
- [ ] Error sanitization verified
- [ ] Backend endpoint created
- [ ] Dashboards configured

## Troubleshooting

### Build Errors

**Error**: `Cannot find module '@petforce/observability'`

**Fix**:

```bash
cd /Users/danielzeddr/PetForce/packages/observability
npm run build
cd /Users/danielzeddr/PetForce/apps/web
npm install
```

### TypeScript Errors

**Error**: `Property 'registrationLogger' does not exist`

**Fix**: Check that `index.ts` exports registration-logger:

```typescript
export * from "./registration-logger";
```

### Console Logs Not Appearing

**Check**:

1. Is development mode? `console.log(process.env.NODE_ENV)`
2. Is instrumented form being used?
3. Is registration mode? (Login mode has minimal logging)

### Navigation Still Broken

**Debug steps**:

1. Check console for navigation logs
2. Find exact point of failure
3. Check `should_navigate` value
4. Check `Navigate called` appears
5. Check `Navigation result` success value
6. Report findings to Engrid with correlation ID

## Next Steps After Implementation

### Immediate (P0)

1. ✅ Implement logging
2. Test in development
3. Identify navigation issue root cause
4. Fix navigation issue
5. Verify fix with logs

### Short-term (P1)

1. Create backend log endpoint
2. Set up log aggregation (Datadog/CloudWatch)
3. Create dashboards
4. Configure alerts
5. Add mobile-specific events

### Long-term (P2)

1. Analyze registration funnel
2. Identify optimization opportunities
3. A/B test improvements
4. Monitor KPIs

## Questions?

Contact Larry (Logging & Observability Agent) for:

- Log structure questions
- Privacy/security concerns
- Dashboard configuration
- Alert threshold recommendations
- Performance optimization

---

**Last Updated**: 2026-01-28  
**Version**: 1.0  
**Status**: Ready for Implementation
