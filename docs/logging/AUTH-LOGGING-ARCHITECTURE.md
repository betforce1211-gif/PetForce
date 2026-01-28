# Auth Flow Logging Architecture

**Status**: Implemented  
**Date**: 2026-01-27  
**Priority**: P0 (Critical - prevents ghost users bug)

## Overview

Comprehensive logging architecture for the authentication flow to detect and prevent issues like ghost users (users in auth.users but not public.users).

## Architecture

### 1. Application-Level Logging (Client & API)

**Location**: `/Users/danielzeddr/PetForce/packages/auth/src/api/auth-api.ts`

**Logger**: `/Users/danielzeddr/PetForce/packages/auth/src/utils/logger.ts`

**Log Events**:
- `registration_attempt_started` - User initiates registration
- `registration_completed` - Registration succeeds
- `registration_failed` - Registration fails (with error code)
- `registration_duplicate_email` - Attempted to register existing email
- `login_attempt_started` - User initiates login
- `login_completed` - Login succeeds
- `login_failed` - Login fails (with error code)
- `login_rejected_unconfirmed` - Login blocked due to unverified email
- `logout_attempt_started` - User initiates logout
- `logout_completed` - Logout succeeds
- `password_reset_requested` - Password reset initiated
- `confirmation_email_resend_requested` - Resend verification email

**Log Format**:
```json
{
  "timestamp": "2026-01-27T10:30:00.000Z",
  "level": "INFO",
  "message": "Auth event: registration_completed",
  "context": {
    "requestId": "uuid-v4-request-id",
    "userId": "uuid-v4-user-id",
    "email": "hash:a1b2c3d4",
    "eventType": "registration_completed",
    "emailConfirmed": false,
    "confirmationRequired": true,
    "confirmationEmailSent": true
  }
}
```

**Privacy Compliance**:
- Emails are hashed using DJB2 algorithm
- Passwords are NEVER logged
- Sensitive user metadata is excluded
- PII is redacted automatically

### 2. Edge Function Logging (Server-Side)

**Location**: `/Users/danielzeddr/PetForce/supabase/functions/validate-registration/index.ts`

**Shared Logger**: `/Users/danielzeddr/PetForce/supabase/functions/_shared/logger.ts`

**Log Events**:
- `registration_validation_started` - Server-side validation begins
- `registration_validation_failed` - Validation fails (with field errors)
- `registration_success_auth_users` - User created in auth.users
- `registration_completed` - Full registration flow complete
- `confirmation_email_sent` - Verification email sent

**Log Format**: Same JSON structure as application logs, plus:
```json
{
  "environment": "edge-function",
  "functionName": "validate-registration"
}
```

### 3. Database-Level Logging (Critical for Ghost Users)

**Migration**: `/Users/danielzeddr/PetForce/supabase/migrations/20260127000003_add_user_sync_logging.sql`

**Log Table**: `public.user_sync_logs`

**Trigger Function**: `public.handle_new_user()`

**Trigger**: `on_auth_user_created` (fires AFTER INSERT on auth.users)

**Log Events**:
- `user_created_in_public_db` - User successfully synced to public.users (SUCCESS)
- `user_sync_failed` - User sync failed (CRITICAL ALERT)

**Log Schema**:
```sql
CREATE TABLE public.user_sync_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  email_hash TEXT,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'database_trigger',
  success BOOLEAN NOT NULL DEFAULT true,
  error_code TEXT,
  error_message TEXT,
  email_verified BOOLEAN,
  user_metadata JSONB,
  request_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Monitoring Views**:

1. **user_sync_metrics** - Hourly sync health metrics
2. **ghost_users_alert** - Detect ghost users (SHOULD ALWAYS BE EMPTY)

## Event Flow with Logging

### Registration Flow

```
1. Frontend Form Submission
   └─> Log: registration_attempt_started (auth-api.ts)

2. Client-Side Validation
   └─> If fails: Log: registration_failed (auth-api.ts)

3. Edge Function Validation
   └─> Log: registration_validation_started (validate-registration/index.ts)
   └─> If fails: Log: registration_validation_failed

4. Create User in auth.users
   └─> Log: registration_success_auth_users (validate-registration/index.ts)

5. Database Trigger Fires (CRITICAL)
   └─> Insert into public.users
   └─> Log: user_created_in_public_db (user_sync_logs table)
   └─> If fails: Log: user_sync_failed (ALERT!)

6. Send Confirmation Email
   └─> Log: confirmation_email_sent
   └─> If fails: Log error but continue

7. Return Success
   └─> Log: registration_completed (auth-api.ts)
```

## Monitoring & Alerts

### Critical Alerts

1. **Ghost User Alert** - User in auth.users but not public.users
   - Severity: P0 (Critical)
   - Action: Immediate investigation

2. **User Sync Failure** - Database trigger failed
   - Severity: P0 (Critical)
   - Action: Check database logs and permissions

3. **High Registration Failure Rate**
   - Alert if failure_rate > 5%
   - Severity: P1 (High)

## Privacy & Compliance

- Email hashing using DJB2 algorithm
- No passwords in logs
- GDPR/CCPA compliant
- 90-day retention for audit logs
