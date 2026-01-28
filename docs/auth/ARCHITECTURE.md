# Authentication System Architecture

Comprehensive technical architecture documentation for the PetForce authentication system.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagrams](#architecture-diagrams)
- [Component Design](#component-design)
- [Data Flow](#data-flow)
- [Email Confirmation Flow](#email-confirmation-flow)
- [Session Management](#session-management)
- [State Management](#state-management)
- [Security Architecture](#security-architecture)
- [Integration Points](#integration-points)
- [Platform Support](#platform-support)
- [Performance Considerations](#performance-considerations)
- [Monitoring & Observability](#monitoring--observability)

## System Overview

The PetForce authentication system is a shared package (`@petforce/auth`) that provides secure, cross-platform authentication for both web and mobile applications.

### Key Features

- Email/password authentication with email verification
- Magic link authentication
- OAuth (Google, Apple)
- Biometric authentication (mobile)
- Session management with automatic refresh
- Comprehensive logging and metrics
- Type-safe API with TypeScript

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | Supabase Auth | Authentication service |
| Database | PostgreSQL (Supabase) | User data storage |
| State Management | Zustand | Global auth state |
| Validation | Zod | Schema validation |
| Logging | Custom logger | Structured logging |
| Metrics | Custom metrics | Performance tracking |
| Type Safety | TypeScript | Full type coverage |

## Architecture Diagrams

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
├──────────────────────────┬──────────────────────────────────┤
│      Web App             │        Mobile App                 │
│   (React + Vite)         │   (React Native + Expo)          │
└────────────┬─────────────┴──────────────┬───────────────────┘
             │                            │
             └────────────┬───────────────┘
                          │
             ┌────────────▼────────────┐
             │   @petforce/auth        │
             │   Shared Package        │
             ├─────────────────────────┤
             │ • API Functions         │
             │ • React Hooks           │
             │ • State Management      │
             │ • Validation            │
             │ • Logging & Metrics     │
             └────────────┬────────────┘
                          │
                          │ HTTPS / JWT
                          │
             ┌────────────▼────────────┐
             │   Supabase Backend      │
             ├─────────────────────────┤
             │ • Authentication API    │
             │ • PostgreSQL Database   │
             │ • Email Service         │
             │ • Session Management    │
             └─────────────────────────┘
```

### Package Internal Architecture

```
@petforce/auth Package Structure

┌─────────────────────────────────────────────────────┐
│                   Entry Point                       │
│                   src/index.ts                      │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
┌───────▼──────┐ ┌──▼────┐ ┌────▼─────┐ ┌──────▼──────┐
│   API Layer  │ │ Hooks │ │  Stores  │ │   Utils     │
├──────────────┤ ├───────┤ ├──────────┤ ├─────────────┤
│ auth-api.ts  │ │useAuth│ │authStore │ │ validation  │
│ magic-link   │ │useOAuth│ │          │ │ storage     │
│ oauth.ts     │ │useMagic│ │(Zustand) │ │ logger      │
│ biometrics   │ │useBio  │ │          │ │ metrics     │
└──────┬───────┘ └───┬───┘ └────┬─────┘ └──────┬──────┘
       │             │          │               │
       └─────────────┴──────────┴───────────────┘
                     │
         ┌───────────▼──────────┐
         │   Supabase Client    │
         │  supabase-client.ts  │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │   Supabase API       │
         └──────────────────────┘
```

## Component Design

### API Layer (`src/api/`)

Handles all authentication API calls to Supabase.

**Key Files:**

1. **auth-api.ts** - Core email/password authentication
   - `register()` - Create new user account
   - `login()` - Authenticate with credentials
   - `logout()` - End user session
   - `resendConfirmationEmail()` - Resend verification email
   - `requestPasswordReset()` - Send password reset email
   - `getCurrentUser()` - Get current user info
   - `refreshSession()` - Refresh auth tokens

2. **magic-link.ts** - Passwordless authentication
   - `sendMagicLink()` - Send magic link email
   - `verifyMagicLink()` - Verify magic link token

3. **oauth.ts** - OAuth providers
   - `signInWithGoogle()` - Google OAuth
   - `signInWithApple()` - Apple OAuth
   - `handleOAuthCallback()` - Handle OAuth redirect

4. **biometrics.ts** - Biometric authentication (mobile)
   - `isBiometricAvailable()` - Check availability
   - `authenticateWithBiometrics()` - Authenticate with biometrics

5. **supabase-client.ts** - Supabase client singleton
   - Provides configured Supabase client
   - Environment-specific configuration
   - Single source of truth for Supabase instance

**Design Patterns:**

- **Result Objects**: All functions return structured results with `success`, `error`, `data`
- **Error Handling**: Consistent error codes and messages
- **Logging**: Every operation logged with request ID
- **Type Safety**: Full TypeScript types for requests/responses

**Example API Function Structure:**

```typescript
export async function apiFunction(data: RequestType): Promise<ResultType> {
  const requestId = logger.generateRequestId();

  try {
    // 1. Log start
    logger.authEvent('event_started', requestId, { /* context */ });

    // 2. Call Supabase
    const { data: result, error } = await supabase.auth.method();

    // 3. Handle error
    if (error) {
      logger.authEvent('event_failed', requestId, { error });
      return { success: false, error: { code: 'ERROR_CODE', message } };
    }

    // 4. Log success
    logger.authEvent('event_completed', requestId, { /* context */ });

    // 5. Return result
    return { success: true, data: result };
  } catch (error) {
    // 6. Handle unexpected errors
    logger.error('Unexpected error', { requestId, error });
    return { success: false, error: { code: 'UNEXPECTED_ERROR', message } };
  }
}
```

### Hooks Layer (`src/hooks/`)

React hooks for authentication state and operations.

**Key Files:**

1. **useAuth.ts** - Main authentication hook
   - Wraps auth API functions
   - Manages loading and error states
   - Updates global store on success

2. **useOAuth.ts** - OAuth authentication
   - Handles OAuth provider flows
   - Manages redirect handling

3. **useMagicLink.ts** - Magic link authentication
   - Send magic link flow
   - Email sent state management

4. **useBiometrics.ts** - Biometric authentication
   - Check availability
   - Handle biometric prompts

5. **usePasswordReset.ts** - Password reset flow
   - Send reset email
   - Reset password with token

**Hook Design Pattern:**

```typescript
export function useAuthHook() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { setUser, setTokens } = useAuthStore();

  const performAction = async (data: RequestType) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFunction(data);

      if (result.success) {
        // Update global state
        setUser(result.user);
        setTokens(result.tokens);
      } else {
        setError(result.error);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return { performAction, isLoading, error };
}
```

### State Management (`src/stores/`)

Global authentication state using Zustand.

**authStore.ts** - Central auth state

```typescript
interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

**Key Features:**

- **Persistence**: Tokens saved to storage (sessionStorage on web, SecureStore on mobile)
- **Hydration**: Load persisted state on app start
- **Computed Values**: `isAuthenticated` derived from `user` and `tokens`
- **Actions**: Methods to update state and sync with storage

**Store Flow:**

```
User Action
    ↓
Hook calls API function
    ↓
API returns success
    ↓
Hook calls store.setUser() / store.setTokens()
    ↓
Store updates state
    ↓
Store persists to storage
    ↓
Components re-render with new state
```

### Utilities (`src/utils/`)

Supporting utilities for validation, storage, logging, and metrics.

1. **validation.ts** - Input validation with Zod
   - Email validation
   - Password strength validation
   - Form schema validation

2. **storage.ts** - Token persistence
   - Platform-specific storage (sessionStorage / SecureStore)
   - Secure token storage and retrieval
   - Clear on logout

3. **logger.ts** - Structured logging
   - Request ID generation
   - Event logging with context
   - Privacy-aware (hashes emails in logs)

4. **metrics.ts** - Performance metrics
   - Event tracking
   - Funnel metrics
   - Alert detection

## Data Flow

### Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Registration Flow                         │
└─────────────────────────────────────────────────────────────┘

User fills form
    ↓
Validate email/password (client-side)
    ↓
Submit → register({ email, password })
    ↓
Generate requestId
    ↓
Log: registration_attempt_started
    ↓
Call: supabase.auth.signUp()
    ↓
Supabase creates user (unconfirmed)
    ↓
Supabase sends verification email
    ↓
Log: registration_completed
    ↓
Return: { success: true, confirmationRequired: true }
    ↓
UI: Show "Check your email" page
    ↓
User clicks link in email
    ↓
Supabase confirms email (sets email_confirmed_at)
    ↓
User can now log in
```

### Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Login Flow                              │
└─────────────────────────────────────────────────────────────┘

User enters email/password
    ↓
Submit → login({ email, password })
    ↓
Generate requestId
    ↓
Log: login_attempt_started
    ↓
Call: supabase.auth.signInWithPassword()
    ↓
Supabase validates credentials
    ↓
Check: user.email_confirmed_at !== null
    ↓
    ├─ Email NOT confirmed
    │      ↓
    │  Log: login_rejected_unconfirmed
    │      ↓
    │  Return: { success: false, error: 'EMAIL_NOT_CONFIRMED' }
    │      ↓
    │  UI: Show "Please verify email" + Resend button
    │
    └─ Email confirmed
           ↓
       Log: login_completed
           ↓
       Return: { success: true, user, tokens }
           ↓
       Update store: setUser(), setTokens()
           ↓
       Save tokens to storage
           ↓
       Navigate to dashboard
```

### Session Refresh Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Session Refresh Flow                       │
└─────────────────────────────────────────────────────────────┘

Token expires (900 seconds / 15 minutes)
    ↓
API call detects expired token
    ↓
Auto-trigger: refreshSession()
    ↓
Log: session_refresh_started
    ↓
Call: supabase.auth.refreshSession()
    ↓
Supabase validates refresh token
    ↓
    ├─ Refresh token valid
    │      ↓
    │  Get new access + refresh tokens
    │      ↓
    │  Update store: setTokens()
    │      ↓
    │  Retry original API call
    │      ↓
    │  Log: session_refresh_completed
    │
    └─ Refresh token invalid/expired
           ↓
       Log: session_refresh_failed
           ↓
       Clear store: logout()
           ↓
       Navigate to login
```

## Email Confirmation Flow

### State Diagram

```
┌──────────────┐
│ User Enters  │
│ Registration │
│    Form      │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Submit Registration │
└──────┬──────────────┘
       │
       ▼
┌───────────────────────────────────────────┐
│ Supabase Creates User                     │
│ • email_confirmed_at = null               │
│ • User exists in database                 │
│ • Confirmation email sent                 │
└──────┬────────────────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│ UI: "Check Your Email"  │
│ • Show success message  │
│ • Show resend button    │
│ • User exits app        │
└──────┬──────────────────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌──────────────────┐              ┌──────────────────────┐
│ User Clicks Link │              │ User Tries to Login  │
│    in Email      │              │  (Before Confirming) │
└──────┬───────────┘              └──────┬───────────────┘
       │                                 │
       ▼                                 ▼
┌─────────────────────┐         ┌────────────────────────┐
│ Supabase Confirms   │         │ Login Check:           │
│ • Sets              │         │ email_confirmed_at === │
│   email_confirmed_at│         │ null                   │
│ • Redirects to      │         └──────┬─────────────────┘
│   /auth/verify      │                │
└──────┬──────────────┘                ▼
       │                    ┌──────────────────────────┐
       │                    │ Return Error:            │
       │                    │ EMAIL_NOT_CONFIRMED      │
       │                    └──────┬───────────────────┘
       │                           │
       │                           ▼
       │                    ┌─────────────────────────┐
       │                    │ UI: Show Message        │
       │                    │ • "Please verify email" │
       │                    │ • Show resend button    │
       │                    └─────────────────────────┘
       │
       ▼
┌──────────────────┐
│ UI: Confirmed!   │
│ • Show success   │
│ • Navigate to    │
│   login          │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ User Logs In     │
│ Successfully     │
└──────────────────┘
```

### Technical Implementation

**Registration Response Structure:**

```typescript
{
  success: true,
  message: "Registration successful. Please check your email to verify your account before logging in.",
  confirmationRequired: true  // ← Frontend knows to show email page
}
```

**Login Email Check:**

```typescript
// In auth-api.ts login() function
const isConfirmed = authData.user.email_confirmed_at !== null;

if (!isConfirmed) {
  logger.authEvent('login_rejected_unconfirmed', requestId, {
    userId: authData.user.id,
    email: data.email,
    reason: 'Email not confirmed'
  });

  return {
    success: false,
    error: {
      code: 'EMAIL_NOT_CONFIRMED',
      message: 'Please verify your email address before logging in...'
    }
  };
}
```

**Resend Confirmation:**

```typescript
// Rate limited: max 1 per 5 minutes
export async function resendConfirmationEmail(email: string) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/verify`
    }
  });

  // Returns success/error
}
```

## Session Management

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     Token Lifecycle                          │
└─────────────────────────────────────────────────────────────┘

Login Successful
    ↓
Receive Tokens:
  • access_token (JWT, expires in 900s / 15 min)
  • refresh_token (expires in 90 days)
    ↓
Store Tokens:
  • Web: sessionStorage
  • Mobile: SecureStore (Keychain/Keystore)
    ↓
Use Access Token in API calls:
  Authorization: Bearer <access_token>
    ↓
Access Token Expires (after 15 min)
    ↓
Automatic Refresh:
  • Call refreshSession()
  • Use refresh_token to get new tokens
  • Update stored tokens
  • Retry original request
    ↓
Refresh Token Expires (after 90 days)
    ↓
User Must Log In Again
```

### Token Storage Strategy

**Web (sessionStorage):**

```typescript
// src/utils/storage.ts (web implementation)
export const storage = {
  async saveTokens(tokens: AuthTokens): Promise<void> {
    sessionStorage.setItem('auth_tokens', JSON.stringify(tokens));
  },

  async getTokens(): Promise<AuthTokens | null> {
    const stored = sessionStorage.getItem('auth_tokens');
    return stored ? JSON.parse(stored) : null;
  },

  async clearTokens(): Promise<void> {
    sessionStorage.removeItem('auth_tokens');
  }
};
```

**Mobile (SecureStore):**

```typescript
// src/utils/storage.ts (mobile implementation)
import * as SecureStore from 'expo-secure-store';

export const storage = {
  async saveTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(
      'auth_tokens',
      JSON.stringify(tokens)
    );
  },

  async getTokens(): Promise<AuthTokens | null> {
    const stored = await SecureStore.getItemAsync('auth_tokens');
    return stored ? JSON.parse(stored) : null;
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_tokens');
  }
};
```

### Session Hydration

On app start, restore session from storage:

```typescript
// In authStore.ts
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isHydrated: false,

  // Called on app start
  hydrate: async () => {
    const tokens = await storage.getTokens();

    if (tokens) {
      // Verify tokens are still valid
      const { user } = await getCurrentUser();

      if (user) {
        set({ user, tokens, isAuthenticated: true, isHydrated: true });
      } else {
        // Tokens invalid, clear
        await storage.clearTokens();
        set({ isHydrated: true });
      }
    } else {
      set({ isHydrated: true });
    }
  }
}));
```

## Security Architecture

### Authentication Security

1. **Password Requirements**
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number
   - Enforced client and server-side

2. **Email Verification**
   - Required by default
   - Prevents account hijacking
   - 24-hour link expiration

3. **Token Security**
   - JWT access tokens (15 min expiration)
   - Refresh tokens (90 day expiration)
   - Secure storage (Keychain/Keystore on mobile)
   - httpOnly cookies (future web enhancement)

4. **Rate Limiting**
   - Client-side: 1 resend per 5 minutes
   - Server-side: Supabase built-in rate limiting

5. **Email Enumeration Prevention**
   - Generic messages for password reset
   - Don't reveal if email exists
   - Log actual errors internally only

### Data Privacy

1. **Logging Privacy**
   - Emails hashed in logs: `use***@example.com`
   - Passwords never logged
   - Tokens never logged
   - PII excluded from production logs

2. **Secure Communication**
   - HTTPS only
   - TLS 1.2+ required
   - Certificate pinning (future mobile enhancement)

3. **User Data Protection**
   - Minimal data collection
   - Encrypted at rest (Supabase PostgreSQL)
   - Encrypted in transit (HTTPS)

## Integration Points

### Supabase Integration

**Configuration:**

```typescript
// src/api/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We handle persistence manually
    autoRefreshToken: false, // We handle refresh manually
  }
});
```

**Email Configuration:**

```toml
# supabase/config.toml
[auth.email]
enable_signup = true
enable_confirmations = true
double_confirm_changes = true
```

**Email Templates:**

Configured in Supabase Dashboard:
- Confirmation email (signup)
- Password reset email
- Magic link email

### Database Schema

**auth.users table** (managed by Supabase):

```sql
CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  encrypted_password text,
  email_confirmed_at timestamptz,  -- NULL until verified
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  user_metadata jsonb,  -- { first_name, last_name }
  ...
);
```

**Custom user profile** (future):

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  first_name text,
  last_name text,
  profile_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## Platform Support

### Cross-Platform Code

**Platform Detection:**

```typescript
const isReactNative =
  typeof navigator !== 'undefined' &&
  navigator.product === 'ReactNative';

if (isReactNative) {
  // React Native code
} else {
  // Web code
}
```

**Conditional Exports:**

```typescript
// src/utils/storage.ts
export const storage = isReactNative
  ? require('./storage.native').default
  : require('./storage.web').default;
```

### Platform-Specific Features

| Feature | Web | Mobile |
|---------|-----|--------|
| Email/Password | ✅ | ✅ |
| Magic Link | ✅ | ✅ |
| Google OAuth | ✅ | ✅ |
| Apple OAuth | ✅ | ✅ |
| Biometrics | ❌ | ✅ |
| Secure Storage | sessionStorage | Keychain/Keystore |

## Performance Considerations

### Optimization Strategies

1. **Code Splitting**
   - Lazy load auth pages
   - Dynamic imports for OAuth

2. **Caching**
   - Cache user data in store
   - Memoize validation functions

3. **Bundle Size**
   - Tree shaking enabled
   - Minimal dependencies
   - Current bundle: ~45KB (minified + gzipped)

4. **Network Optimization**
   - Debounce validation API calls
   - Retry failed requests
   - Timeout configuration

## Monitoring & Observability

### Structured Logging

Every auth operation includes:

- **requestId**: Unique UUID for correlation
- **eventType**: Type of event (e.g., `login_completed`)
- **context**: Event-specific data
- **timestamp**: ISO 8601 timestamp

**Example Log Entry:**

```json
{
  "timestamp": "2026-01-25T10:30:00.000Z",
  "level": "INFO",
  "message": "Auth event: registration_completed",
  "context": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "eventType": "registration_completed",
    "userId": "user-123",
    "email": "use***@example.com",
    "emailConfirmed": false,
    "confirmationRequired": true
  }
}
```

### Metrics Collection

Track key authentication metrics:

```typescript
import { metrics } from '@petforce/auth';

const summary = metrics.getSummary(24 * 60 * 60 * 1000); // Last 24 hours

console.log(summary);
/*
{
  registrationStarted: 150,
  registrationCompleted: 145,
  emailConfirmed: 120,
  loginAttempts: 500,
  loginSuccesses: 475,
  loginRejectedUnconfirmed: 15,
  confirmationRatePercent: 82.76,
  loginSuccessRatePercent: 95.00,
  avgTimeToConfirmMinutes: 8.5
}
*/
```

### Alert Detection

Automatic health checks:

```typescript
const alerts = metrics.checkAlerts();

alerts.forEach(alert => {
  console.log(`[${alert.level}] ${alert.message}`);
});

/*
Example alerts:
- [warning] Low email confirmation rate: 65% (last hour)
- [critical] Low login success rate: 45%
- [warning] Slow email confirmation: Average 75 minutes
*/
```

## Related Documentation

- [API Reference](/docs/API.md) - Complete API documentation
- [Error Codes](/docs/auth/ERRORS.md) - Error code reference
- [Security](/docs/auth/SECURITY.md) - Security best practices
- [Setup Guide](/docs/auth/SETUP.md) - Developer setup
- [User Guide](/docs/auth/USER_GUIDE.md) - End-user documentation

---

**Last Updated:** January 25, 2026
**Maintained By:** Thomas (Documentation Agent)
**Version:** 1.0.0
