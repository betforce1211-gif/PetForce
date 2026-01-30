# Migration Guide: Client-Side Auth to Edge Functions

**Purpose**: Guide for migrating resend confirmation and registration to use secure Edge Functions.

**Date**: 2026-01-25  
**Impact**: Breaking API change for resend confirmation  
**Reason**: Server-side rate limiting and password policy enforcement

---

## Overview

We're moving two critical auth operations to Supabase Edge Functions:

1. **Resend Confirmation Email** - Now with server-side rate limiting (3 per 15 min)
2. **User Registration** - Now with server-side password validation

**Why**:
- Client-side rate limiting can be bypassed
- Client-side password validation can be bypassed
- Server-side enforcement provides defense in depth
- Enables better monitoring and logging

---

## Changes Required

### 1. Update Resend Confirmation

**Before** (client-side only):
```typescript
// packages/auth/src/api/auth-api.ts
export async function resendConfirmationEmail(email: string) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  
  // ... handle error
}
```

**After** (Edge Function with rate limiting):
```typescript
// packages/auth/src/api/auth-api.ts
export async function resendConfirmationEmail(email: string) {
  const supabase = getSupabaseClient();
  
  // Call Edge Function instead
  const { data, error } = await supabase.functions.invoke('resend-confirmation', {
    body: { email },
  });
  
  if (error) {
    // Handle rate limit error
    if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: error.message,
        },
      };
    }
    
    return {
      success: false,
      error: {
        code: 'RESEND_ERROR',
        message: error.message,
      },
    };
  }
  
  return data;
}
```

### 2. Update UI for Rate Limit Display

**Before**:
```tsx
// No rate limit feedback
<button onClick={handleResend}>
  Resend Email
</button>
```

**After**:
```tsx
// Show retry-after time
const [retryAfter, setRetryAfter] = useState<number | null>(null);

const handleResend = async () => {
  const result = await resendConfirmationEmail(email);
  
  if (result.error?.code === 'RATE_LIMIT_EXCEEDED') {
    setRetryAfter(result.error.retryAfter);
    setError('Too many requests. Please try again later.');
  }
};

<button 
  onClick={handleResend}
  disabled={retryAfter !== null}
>
  {retryAfter ? `Retry in ${Math.ceil(retryAfter / 60)} min` : 'Resend Email'}
</button>
```

### 3. Update Registration (Optional but Recommended)

**Before** (client-side validation only):
```typescript
export async function register(data: RegisterRequest) {
  // Client validates password
  const passwordErrors = validatePassword(data.password);
  if (passwordErrors.length > 0) {
    return { success: false, errors: passwordErrors };
  }
  
  // Then call Supabase
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
}
```

**After** (server-side validation):
```typescript
export async function register(data: RegisterRequest) {
  // Server validates password (defense in depth)
  const { data: result, error } = await supabase.functions.invoke('validate-registration', {
    body: {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    },
  });
  
  if (error || !result.success) {
    return {
      success: false,
      error: result?.error || { code: 'REGISTRATION_ERROR', message: error.message },
    };
  }
  
  return result;
}
```

---

## Testing Changes

### 1. Test Rate Limiting

```typescript
// Should succeed
await resendConfirmationEmail('test@example.com');

// Should succeed
await resendConfirmationEmail('test@example.com');

// Should succeed
await resendConfirmationEmail('test@example.com');

// Should fail with RATE_LIMIT_EXCEEDED
const result = await resendConfirmationEmail('test@example.com');
expect(result.error.code).toBe('RATE_LIMIT_EXCEEDED');
expect(result.error.retryAfter).toBeGreaterThan(0);
```

### 2. Test Password Validation

```typescript
// Should fail - too short
const result1 = await register({
  email: 'test@example.com',
  password: 'Short1',
});
expect(result1.error.details).toContainEqual({
  field: 'password',
  message: 'Password must be at least 8 characters',
});

// Should fail - no uppercase
const result2 = await register({
  email: 'test@example.com',
  password: 'lowercase123',
});
expect(result2.error.details).toContainEqual({
  field: 'password',
  message: 'Password must contain at least one uppercase letter',
});

// Should succeed
const result3 = await register({
  email: 'test@example.com',
  password: 'SecurePass123',
});
expect(result3.success).toBe(true);
```

---

## Deployment Steps

### 1. Deploy Edge Functions

```bash
# Deploy to Supabase
npx supabase functions deploy resend-confirmation
npx supabase functions deploy validate-registration

# Set environment variables
npx supabase secrets set PUBLIC_SITE_URL=https://petforce.app
```

### 2. Run Migration

```bash
# Create rate limiting table
npx supabase db push
```

Verify migration:
```sql
SELECT * FROM auth_rate_limits LIMIT 1;
```

### 3. Update Client Code

Deploy updated client code with Edge Function calls.

### 4. Monitor

Watch for errors in Supabase logs:
```bash
npx supabase functions logs resend-confirmation --tail
```

---

## Rollback Plan

If Edge Functions fail:

1. **Quick Fix**: Revert client code to use `supabase.auth.resend()` directly
2. **Function Fix**: Fix Edge Function and redeploy
3. **Database**: Rate limit table can remain (no harm)

```typescript
// Rollback code (emergency only)
export async function resendConfirmationEmail(email: string) {
  // Bypass Edge Function, use Supabase directly
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  // ... original code
}
```

---

## Backward Compatibility

**Breaking Changes**:
- Resend confirmation now returns different error codes
- Rate limiting may block previously allowed requests
- Password validation errors have new format

**Non-Breaking**:
- Login flow unchanged
- Password reset unchanged
- Token management unchanged

---

## Monitoring

### Key Metrics to Watch

1. **Rate Limit Hit Rate**
   - Metric: `auth.rate_limit_exceeded`
   - Alert: > 5% of requests
   - Action: Adjust limits or investigate abuse

2. **Password Validation Failures**
   - Metric: `auth.registration_validation_failed`
   - Alert: > 20% of registrations
   - Action: Improve UI guidance

3. **Edge Function Errors**
   - Metric: `auth.edge_function_error`
   - Alert: > 1% of requests
   - Action: Check function logs

### Dashboard Queries

**Datadog**:
```
avg:auth.rate_limit_exceeded.count{*}
avg:auth.registration_validation_failed.count{*} by {field}
```

**Sentry**:
```
Filter: error.code:RATE_LIMIT_EXCEEDED
Filter: error.code:VALIDATION_FAILED
```

---

## FAQ

### Q: Will this affect existing users?

A: No. Only affects new registrations and resend confirmation requests.

### Q: What if a user is legitimately rate limited?

A: They'll see a clear message with retry time. Support can manually send confirmation emails if needed.

### Q: Can I increase the rate limit?

A: Yes. Edit `RATE_LIMIT_MAX_ATTEMPTS` in Edge Function and redeploy.

### Q: Does this work with mobile apps?

A: Yes. Edge Functions work identically for web and mobile clients.

### Q: What about email enumeration attacks?

A: We still return generic errors. Rate limiting adds an extra layer of protection.

---

## Timeline

- **Day 1**: Deploy Edge Functions to staging
- **Day 2-3**: Test thoroughly, monitor metrics
- **Day 4**: Deploy to production (low-traffic window)
- **Day 5-7**: Monitor production, adjust if needed

---

## Support

Questions? Contact:
- **Security Team**: security@petforce.app
- **Engineering**: engineering@petforce.app
- **Slack**: #security-team

---

**Version**: 1.0  
**Last Updated**: 2026-01-25
