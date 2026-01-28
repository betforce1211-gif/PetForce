# Security Quick Reference Card

**For Developers**: Essential security guidelines for PetForce authentication.

Print this and keep it nearby while coding auth features.

---

## Golden Rules

1. **NEVER** trust user input - Validate EVERYTHING server-side
2. **NEVER** log passwords, tokens, or plain-text emails
3. **NEVER** store tokens in non-secure storage (use httpOnly cookies or SecureStore)
4. **ALWAYS** use HTTPS in production
5. **ALWAYS** rate limit sensitive endpoints
6. **ALWAYS** hash emails in logs (SHA-256)
7. **ALWAYS** enforce email verification before login
8. **ALWAYS** use parameterized queries (never string concatenation)

---

## Password Requirements

Enforce on **server-side** (Edge Function):

```
Minimum 8 characters (recommend 12+)
At least 1 uppercase letter (A-Z)
At least 1 lowercase letter (a-z)
At least 1 number (0-9)
Maximum 100 characters
```

**Implementation**:
- Client: `packages/auth/src/utils/validation.ts` (passwordSchema)
- Server: `supabase/functions/validate-registration/index.ts`

---

## Rate Limits

### Resend Confirmation Email

- **Limit**: 3 requests per 15 minutes per email
- **Enforcement**: Server-side (Edge Function)
- **Error Code**: `RATE_LIMIT_EXCEEDED`
- **Response**: HTTP 429 with `Retry-After` header

### Login Attempts (Supabase Built-in)

- **Limit**: 5 failed attempts per email
- **Lockout**: 15 minutes
- **Additional**: IP-based secondary limit

---

## Token Storage

### Web (React)

**Development**:
```typescript
// Supabase uses localStorage by default
const supabase = createClient(url, key);
```

**Production** (Recommended):
```typescript
// Use httpOnly cookies
const supabase = createClient(url, key, {
  auth: {
    storage: customCookieStorage, // httpOnly, secure, sameSite
  },
});
```

### Mobile (React Native)

```typescript
// Use Expo SecureStore (hardware-backed encryption)
import * as SecureStore from 'expo-secure-store';

const supabase = createClient(url, key, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
  },
});
```

---

## Logging Guidelines

### DO Log

```typescript
// Hashed email (SHA-256)
logger.authEvent('login_attempt', requestId, {
  email: 'user@example.com', // Automatically hashed by logger
  userId: 'user_123',
  eventType: 'login',
});

// Request context
logger.info('Auth operation completed', {
  requestId: 'req_abc',
  duration: 120,
  success: true,
});
```

### DON'T Log

```typescript
// NEVER log these
logger.info('Password received', { password: '...' }); // NO!
logger.info('Token issued', { token: '...' }); // NO!
logger.info('User email', { email: 'user@example.com' }); // NO! (use logger, it hashes)
```

---

## Error Handling

### Generic Errors (Prevent Enumeration)

```typescript
// DON'T reveal if email exists
if (!userExists) {
  return { error: 'User not found' }; // NO! Reveals email doesn't exist
}

// DO use generic errors
return { error: 'Invalid email or password' }; // YES! Doesn't reveal which
```

### Rate Limit Errors (Be Specific)

```typescript
// DO show retry time for rate limits
if (rateLimited) {
  return {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again in 12 minutes.',
      retryAfter: 720, // seconds
    },
  };
}
```

---

## Security Headers (Production)

Configure in Vercel/Netlify/Edge Functions:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Common Vulnerabilities

### XSS (Cross-Site Scripting)

**Prevention**:
- Use httpOnly cookies for tokens
- Sanitize user input before display
- Use Content Security Policy
- Never use `dangerouslySetInnerHTML` with user content

### CSRF (Cross-Site Request Forgery)

**Prevention**:
- Use SameSite cookies (`strict` or `lax`)
- Validate token on every request
- Use CORS headers properly

### SQL Injection

**Prevention**:
- ALWAYS use parameterized queries
- Never concatenate user input into SQL
- Supabase handles this automatically

### Brute Force

**Prevention**:
- Rate limiting on login (built into Supabase)
- Account lockout after failed attempts
- Email verification before login

---

## Email Verification Flow

```
1. User registers -> Email NOT confirmed
2. Confirmation email sent
3. User clicks link -> Email confirmed
4. User can now login
```

**CRITICAL**: Check `email_confirmed_at` before allowing login:

```typescript
if (!user.email_confirmed_at) {
  return {
    success: false,
    error: {
      code: 'EMAIL_NOT_CONFIRMED',
      message: 'Please verify your email before logging in.',
    },
  };
}
```

---

## Edge Function Endpoints

### Resend Confirmation

```bash
POST /functions/v1/resend-confirmation
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Register with Validation

```bash
POST /functions/v1/validate-registration
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

## Testing Security

### Rate Limiting

```typescript
test('should rate limit after 3 requests', async () => {
  // First 3 should succeed
  await resendConfirmation('test@example.com');
  await resendConfirmation('test@example.com');
  await resendConfirmation('test@example.com');
  
  // 4th should fail
  const result = await resendConfirmation('test@example.com');
  expect(result.error.code).toBe('RATE_LIMIT_EXCEEDED');
});
```

### Password Validation

```typescript
test('should reject weak passwords', async () => {
  const result = await register({
    email: 'test@example.com',
    password: 'weak', // Too short, no uppercase, no number
  });
  
  expect(result.error.code).toBe('VALIDATION_FAILED');
  expect(result.error.details).toHaveLength(3);
});
```

---

## Incident Response

### If You Suspect a Security Issue

1. **STOP** - Don't push code if vulnerability found
2. **NOTIFY** - Email security@petforce.app immediately
3. **DOCUMENT** - Write down what you found
4. **DON'T** - Don't discuss publicly (Slack, GitHub issues)

### If Production Incident

1. **Contact**: security-oncall@petforce.app
2. **PagerDuty**: Page security team
3. **Slack**: #security-incidents (private channel)

---

## Resources

- **Full Security Docs**: `/docs/auth/SECURITY.md`
- **Edge Functions**: `/supabase/functions/README.md`
- **Migration Guide**: `/docs/auth/MIGRATION-TO-EDGE-FUNCTIONS.md`
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Supabase Security**: https://supabase.com/docs/guides/auth/security

---

## Checklist (Before PR Merge)

- [ ] Server-side validation for all user input
- [ ] Rate limiting on sensitive operations
- [ ] Emails hashed in logs (use `logger.authEvent()`)
- [ ] No passwords/tokens in logs
- [ ] Email verification enforced
- [ ] Error messages don't reveal sensitive info
- [ ] Tests include security scenarios
- [ ] Documentation updated

---

**Print This**: Keep it by your desk while coding auth features.

**Questions**: Ask in #security-team (Slack) or security@petforce.app

**Remember**: Security is everyone's responsibility. When in doubt, ask!

---

Last Updated: 2026-01-25
