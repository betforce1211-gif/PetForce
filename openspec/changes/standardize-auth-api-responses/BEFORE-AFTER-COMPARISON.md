# Before/After Comparison

This document shows the exact response shape changes for each auth API function.

## register()

### Before
```typescript
function register(data: RegisterRequest): Promise<{
  success: boolean;
  message: string;
  confirmationRequired?: boolean;
  error?: AuthError;
}>
```

**Success response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "confirmationRequired": true
}
```

**Error response:**
```json
{
  "success": false,
  "message": "Email already exists",
  "error": {
    "code": "REGISTRATION_ERROR",
    "message": "Email already exists"
  }
}
```

### After
```typescript
function register(data: RegisterRequest): Promise<
  ApiResponse<{ confirmationRequired: boolean }>
>
```

**Success response:**
```json
{
  "success": true,
  "data": {
    "confirmationRequired": true
  },
  "message": "Registration successful. Please check your email to verify your account.",
  "meta": {
    "requestId": "req_abc123"
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "USER_ALREADY_EXISTS",
    "message": "Email already exists"
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

### Changes
- Data moved into `data` field for consistency
- `confirmationRequired` is typed payload (not top-level optional field)
- Added `meta.requestId` for tracing
- Standardized error codes (`USER_ALREADY_EXISTS` instead of generic `REGISTRATION_ERROR`)
- Removed redundant `message` field from error (kept only in `error.message`)

---

## login()

### Before
```typescript
function login(data: LoginRequest): Promise<{
  success: boolean;
  tokens?: AuthTokens;
  user?: User;
  error?: AuthError;
}>
```

**Success response:**
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "v1.MRj...",
    "expiresIn": 900
  },
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "LOGIN_ERROR",
    "message": "Invalid email or password"
  }
}
```

### After
```typescript
function login(data: LoginRequest): Promise<
  ApiResponse<{ tokens: AuthTokens; user: User }>
>
```

**Success response:**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "v1.MRj...",
      "expiresIn": 900
    },
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "emailVerified": true
    }
  },
  "message": "Login successful",
  "meta": {
    "requestId": "req_xyz789"
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  },
  "meta": {
    "requestId": "req_xyz789"
  }
}
```

### Changes
- Tokens and user moved into `data` object
- Added optional success `message`
- Added `meta.requestId`
- Better error code (`INVALID_CREDENTIALS` vs `LOGIN_ERROR`)

---

## logout()

### Before
```typescript
function logout(): Promise<{
  success: boolean;
  error?: AuthError;
}>
```

**Success response:**
```json
{
  "success": true
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "LOGOUT_ERROR",
    "message": "Failed to logout"
  }
}
```

### After
```typescript
function logout(): Promise<ApiResponse<void>>
```

**Success response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "meta": {
    "requestId": "req_def456"
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "LOGOUT_ERROR",
    "message": "Failed to logout"
  },
  "meta": {
    "requestId": "req_def456"
  }
}
```

### Changes
- Added optional success `message`
- Added `meta.requestId`
- Type is `ApiResponse<void>` (no data payload)

---

## resendConfirmationEmail()

### Before
```typescript
function resendConfirmationEmail(email: string): Promise<{
  success: boolean;
  message: string;
  error?: AuthError;
}>
```

**Success response:**
```json
{
  "success": true,
  "message": "Confirmation email sent. Please check your inbox."
}
```

**Error response (429 Rate Limited):**
```json
{
  "success": false,
  "message": "Too many requests",
  "error": {
    "code": "RESEND_ERROR",
    "message": "Too many requests"
  }
}
```

### After
```typescript
function resendConfirmationEmail(email: string): Promise<ApiResponse<void>>
```

**Success response:**
```json
{
  "success": true,
  "message": "Confirmation email sent. Please check your inbox.",
  "meta": {
    "requestId": "req_ghi789",
    "rateLimit": {
      "limit": 3,
      "remaining": 2,
      "reset": 1737810600
    }
  }
}
```

**Error response (429 Rate Limited):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 10 minutes."
  },
  "meta": {
    "requestId": "req_ghi789",
    "rateLimit": {
      "limit": 3,
      "remaining": 0,
      "reset": 1737810600,
      "retryAfter": 600
    }
  }
}
```

### Changes
- **MAJOR**: Added `meta.rateLimit` with full rate limiting info
- Better error code (`RATE_LIMIT_EXCEEDED` vs `RESEND_ERROR`)
- `retryAfter` field enables countdown timers in UI
- `reset` timestamp shows when limit window resets
- Added `requestId` for debugging

---

## requestPasswordReset()

### Before
```typescript
function requestPasswordReset(data: PasswordResetRequest): Promise<{
  success: boolean;
  message: string;
  error?: AuthError;
}>
```

**Success response:**
```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent."
}
```

**Error response:**
```json
{
  "success": false,
  "message": "Failed to send reset email",
  "error": {
    "code": "PASSWORD_RESET_ERROR",
    "message": "Failed to send reset email"
  }
}
```

### After
```typescript
function requestPasswordReset(data: PasswordResetRequest): Promise<ApiResponse<void>>
```

**Success response:**
```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent.",
  "meta": {
    "requestId": "req_jkl012"
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "PASSWORD_RESET_ERROR",
    "message": "Failed to send reset email"
  },
  "meta": {
    "requestId": "req_jkl012"
  }
}
```

### Changes
- Added `meta.requestId`
- Removed redundant top-level `message` on error
- Type is `ApiResponse<void>`

---

## getCurrentUser()

### Before
```typescript
function getCurrentUser(): Promise<{
  user: User | null;
  error?: AuthError;
}>
```

**Success response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

**Error response:**
```json
{
  "user": null,
  "error": {
    "code": "GET_USER_ERROR",
    "message": "Not authenticated"
  }
}
```

### After
```typescript
function getCurrentUser(): Promise<ApiResponse<{ user: User | null }>>
```

**Success response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "emailVerified": true
    }
  },
  "meta": {
    "requestId": "req_mno345"
  }
}
```

**No user (not an error):**
```json
{
  "success": true,
  "data": {
    "user": null
  },
  "meta": {
    "requestId": "req_mno345"
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated"
  },
  "meta": {
    "requestId": "req_mno345"
  }
}
```

### Changes
- **MAJOR**: Added `success` field (was missing before!)
- User wrapped in `data` object
- Clear distinction between "no user" (success with null) vs auth error (failure)
- Added `meta.requestId`
- Better error code (`UNAUTHORIZED` vs `GET_USER_ERROR`)

---

## refreshSession()

### Before
```typescript
function refreshSession(): Promise<{
  success: boolean;
  tokens?: AuthTokens;
  error?: AuthError;
}>
```

**Success response:**
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "v1.MRj...",
    "expiresIn": 900
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "REFRESH_ERROR",
    "message": "Invalid refresh token"
  }
}
```

### After
```typescript
function refreshSession(): Promise<ApiResponse<{ tokens: AuthTokens }>>
```

**Success response:**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "v1.MRj...",
      "expiresIn": 900
    }
  },
  "message": "Session refreshed successfully",
  "meta": {
    "requestId": "req_pqr678"
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid refresh token"
  },
  "meta": {
    "requestId": "req_pqr678"
  }
}
```

### Changes
- Tokens moved into `data` object
- Added optional success `message`
- Added `meta.requestId`
- Better error code (`INVALID_TOKEN` vs `REFRESH_ERROR`)

---

## Summary of Changes

### Consistent Additions Across All Endpoints

1. **`meta.requestId`** - Always included for request tracing
2. **`message`** field - Optional user-friendly message on success
3. **`data` wrapper** - Typed payload always in `data` field
4. **Error consistency** - All errors in `error` object with structured format

### New Capability: Rate Limit Info

For rate-limited endpoints (`resendConfirmationEmail`):

```json
"meta": {
  "rateLimit": {
    "limit": 3,
    "remaining": 2,
    "reset": 1737810600,
    "retryAfter": 600  // Only on 429 errors
  }
}
```

This enables:
- Showing "2 attempts remaining"
- Countdown timer: "Try again in 10:00"
- Proactive button disabling when limit reached

### Breaking vs Non-Breaking

**Potentially Breaking:**
- Fields moved into `data` wrapper (e.g., `tokens` → `data.tokens`)
- `getCurrentUser()` now returns `success` field

**Non-Breaking:**
- All new fields are additive (`meta`, `message`)
- Error structure remains compatible

**Mitigation:**
- Transition period with both old and new fields
- TypeScript `@deprecated` annotations
- Clear migration guide
