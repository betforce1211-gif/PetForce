# Supabase Edge Functions

This directory contains Supabase Edge Functions for server-side authentication operations with enhanced security.

## Functions

### `resend-confirmation`

**Purpose**: Resend email confirmation with server-side rate limiting.

**Endpoint**: `POST /functions/v1/resend-confirmation`

**Rate Limit**: 3 requests per 15 minutes per email address

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Confirmation email sent. Please check your inbox."
}
```

**Rate Limit Response** (429):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 12 minutes.",
    "retryAfter": 720
  }
}
```

**Headers**:
- `X-RateLimit-Limit`: Maximum requests allowed (3)
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: ISO timestamp when limit resets
- `Retry-After`: Seconds until next attempt (on 429 only)

---

### `validate-registration`

**Purpose**: Register user with server-side password policy enforcement.

**Endpoint**: `POST /functions/v1/validate-registration`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account before logging in.",
  "confirmationRequired": true
}
```

**Validation Error Response** (400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Registration validation failed",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      },
      {
        "field": "password",
        "message": "Password must contain at least one uppercase letter"
      }
    ]
  }
}
```

**Password Requirements**:
- Minimum 8 characters (recommended: 12+)
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- Maximum 100 characters

---

## Development

### Local Testing

1. Start Supabase local development:
```bash
npx supabase start
```

2. Deploy functions locally:
```bash
npx supabase functions deploy resend-confirmation --no-verify-jwt
npx supabase functions deploy validate-registration --no-verify-jwt
```

3. Test with curl:
```bash
# Test resend confirmation
curl -X POST http://localhost:54321/functions/v1/resend-confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com"}'

# Test registration
curl -X POST http://localhost:54321/functions/v1/validate-registration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com","password":"SecurePass123","firstName":"John"}'
```

### Production Deployment

```bash
# Deploy to production
npx supabase functions deploy resend-confirmation
npx supabase functions deploy validate-registration

# Set environment variables
npx supabase secrets set PUBLIC_SITE_URL=https://petforce.app
```

---

## Environment Variables

Required for all functions:

- `SUPABASE_URL`: Automatically provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Automatically provided by Supabase
- `PUBLIC_SITE_URL`: Your public site URL (for email redirect links)

Optional:

- `MONITORING_BACKEND`: `datadog`, `sentry`, or `console` (default: `console`)
- `MONITORING_API_KEY`: API key for monitoring service

---

## Security

### Rate Limiting

Rate limits are stored in the `auth_rate_limits` table:

```sql
CREATE TABLE auth_rate_limits (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  operation text NOT NULL,
  attempted_at timestamptz NOT NULL,
  ip_address inet,
  user_agent text
);
```

Cleanup old records (> 24 hours) via:
```sql
SELECT cleanup_old_rate_limits();
```

### Password Policy

Server-side validation ensures:
- Cannot bypass client-side checks
- Consistent enforcement across all clients (web, mobile)
- Defense in depth

### Logging

All operations logged with:
- Email (hashed via SHA-256)
- IP address
- User agent
- Timestamp
- Request outcome

---

## Monitoring

Functions send logs to configured monitoring backend:

- **Development**: Console logs
- **Production**: Datadog or Sentry

Example log:
```json
{
  "level": "INFO",
  "message": "Confirmation email resent successfully",
  "context": {
    "email": "sha256:a1b2c3d4e5f6g7h8",
    "ipAddress": "192.168.1.1",
    "timestamp": "2026-01-25T12:00:00Z"
  }
}
```

---

## Troubleshooting

### Rate limit table doesn't exist

Run migration:
```bash
npx supabase db push
```

### Function returns 500

Check Supabase logs:
```bash
npx supabase functions logs resend-confirmation
```

### Email not sending

Verify Supabase email configuration:
```bash
npx supabase status
```

Check `supabase/config.toml`:
```toml
[auth.email]
enable_signup = true
enable_confirmations = true
```

---

## Testing

### Unit Tests (Future)

```bash
deno test supabase/functions/resend-confirmation/index_test.ts
```

### Integration Tests

See `/packages/auth/src/__tests__/api/auth-api.test.ts`

---

## References

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Runtime Documentation](https://deno.land/manual)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
