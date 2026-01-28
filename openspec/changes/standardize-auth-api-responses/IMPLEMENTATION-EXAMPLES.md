# Implementation Examples

This document provides code examples for implementing the standardized API response formats.

## Type Definitions

```typescript
// packages/auth/src/types/auth.ts

/**
 * Standard API response wrapper for all authentication endpoints.
 * Provides consistent structure for success/error handling and metadata.
 *
 * @template T - The type of data returned on success
 */
export interface ApiResponse<T = void> {
  /** Whether the operation succeeded */
  success: boolean;

  /** Response data (only present on success) */
  data?: T;

  /** Optional user-friendly message */
  message?: string;

  /** Error details (only present on failure) */
  error?: AuthError;

  /** Optional metadata (request ID, rate limits, etc.) */
  meta?: ApiResponseMeta;
}

/**
 * Metadata included in API responses
 */
export interface ApiResponseMeta {
  /** Unique request identifier for tracing/debugging */
  requestId?: string;

  /** Rate limit information (for rate-limited endpoints) */
  rateLimit?: RateLimitInfo;
}

/**
 * Rate limit information returned in responses
 */
export interface RateLimitInfo {
  /** Maximum requests allowed in time window */
  limit: number;

  /** Requests remaining in current window */
  remaining: number;

  /** Unix timestamp (seconds) when window resets */
  reset: number;

  /** Seconds until retry allowed (only present when rate limited) */
  retryAfter?: number;
}

/**
 * Structured error response
 */
export interface AuthError {
  /** Machine-readable error code */
  code: AuthErrorCode;

  /** Human-readable error message */
  message: string;

  /** Optional additional context (e.g., field-level validation errors) */
  details?: Record<string, unknown>;
}

/**
 * Standard error codes used across auth APIs
 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'      // Wrong email/password
  | 'EMAIL_NOT_CONFIRMED'      // Email verification required
  | 'USER_ALREADY_EXISTS'      // Duplicate email on registration
  | 'WEAK_PASSWORD'            // Password doesn't meet requirements
  | 'INVALID_TOKEN'            // Expired/invalid reset token
  | 'RATE_LIMIT_EXCEEDED'      // Too many requests
  | 'INVALID_REQUEST'          // Validation failed
  | 'UNAUTHORIZED'             // Auth required
  | 'RESEND_ERROR'             // Failed to resend email
  | 'LOGIN_ERROR'              // Generic login failure
  | 'REGISTRATION_ERROR'       // Generic registration failure
  | 'LOGOUT_ERROR'             // Generic logout failure
  | 'REFRESH_ERROR'            // Token refresh failed
  | 'GET_USER_ERROR'           // Failed to get current user
  | 'UNEXPECTED_ERROR';        // Unknown server error
```

## Helper Functions

```typescript
// packages/auth/src/utils/api-response.ts

import { ApiResponse, ApiResponseMeta, RateLimitInfo } from '../types/auth';
import { logger } from './logger';

/**
 * Creates a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    message?: string;
    meta?: Partial<ApiResponseMeta>;
  }
): ApiResponse<T> {
  return {
    success: true,
    data,
    message: options?.message,
    meta: {
      requestId: logger.generateRequestId(),
      ...options?.meta,
    },
  };
}

/**
 * Creates an error API response
 */
export function createErrorResponse(
  code: string,
  message: string,
  options?: {
    details?: Record<string, unknown>;
    meta?: Partial<ApiResponseMeta>;
  }
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details: options?.details,
    },
    meta: {
      requestId: logger.generateRequestId(),
      ...options?.meta,
    },
  };
}

/**
 * Parses rate limit information from HTTP headers
 */
export function parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');

  if (!limit || !remaining || !reset) {
    return undefined;
  }

  const retryAfter = headers.get('Retry-After');

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: new Date(reset).getTime() / 1000, // Convert to Unix seconds
    retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
  };
}
```

## Refactored API Functions

### Register Function

```typescript
// packages/auth/src/api/auth-api.ts

/**
 * Register a new user with email and password
 * Sends email verification link
 */
export async function register(
  data: RegisterRequest
): Promise<ApiResponse<{ confirmationRequired: boolean }>> {
  const requestId = logger.generateRequestId();

  try {
    logger.authEvent('registration_attempt_started', requestId, {
      email: data.email,
      hasFirstName: !!data.firstName,
      hasLastName: !!data.lastName,
    });

    const supabase = getSupabaseClient();

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    });

    if (error) {
      logger.authEvent('registration_failed', requestId, {
        email: data.email,
        errorCode: error.name || 'REGISTRATION_ERROR',
        errorMessage: error.message,
      });

      return createErrorResponse(
        error.name || 'REGISTRATION_ERROR',
        error.message,
        { meta: { requestId } }
      );
    }

    if (!authData.user) {
      logger.error('Registration succeeded but no user in response', {
        requestId,
        email: data.email,
      });

      return createErrorResponse(
        'REGISTRATION_ERROR',
        'No user returned from registration',
        { meta: { requestId } }
      );
    }

    const isConfirmed = authData.user.email_confirmed_at !== null;
    const confirmationRequired = !isConfirmed;

    logger.authEvent('registration_completed', requestId, {
      userId: authData.user.id,
      email: data.email,
      emailConfirmed: isConfirmed,
      confirmationRequired,
    });

    return createSuccessResponse(
      { confirmationRequired },
      {
        message: confirmationRequired
          ? 'Registration successful. Please check your email to verify your account before logging in.'
          : 'Registration successful.',
        meta: { requestId },
      }
    );
  } catch (error) {
    logger.error('Unexpected error during registration', {
      requestId,
      email: data.email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return createErrorResponse(
      'UNEXPECTED_ERROR',
      'An unexpected error occurred',
      { meta: { requestId } }
    );
  }
}
```

### Login Function

```typescript
/**
 * Log in with email and password
 * Returns JWT tokens and user profile
 */
export async function login(
  data: LoginRequest
): Promise<ApiResponse<{ tokens: AuthTokens; user: User }>> {
  const requestId = logger.generateRequestId();

  try {
    logger.authEvent('login_attempt_started', requestId, {
      email: data.email,
    });

    const supabase = getSupabaseClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      logger.authEvent('login_failed', requestId, {
        email: data.email,
        errorCode: error.name || 'LOGIN_ERROR',
        errorMessage: error.message,
      });

      return createErrorResponse(
        error.name || 'LOGIN_ERROR',
        error.message,
        { meta: { requestId } }
      );
    }

    if (!authData.session || !authData.user) {
      logger.error('Login succeeded but no session in response', {
        requestId,
        email: data.email,
      });

      return createErrorResponse(
        'LOGIN_ERROR',
        'No session returned from login',
        { meta: { requestId } }
      );
    }

    const isConfirmed = authData.user.email_confirmed_at !== null;

    if (!isConfirmed) {
      logger.authEvent('login_rejected_unconfirmed', requestId, {
        userId: authData.user.id,
        email: data.email,
        reason: 'Email not confirmed',
      });

      return createErrorResponse(
        'EMAIL_NOT_CONFIRMED',
        'Please verify your email address before logging in. Check your inbox for the verification link.',
        { meta: { requestId } }
      );
    }

    logger.authEvent('login_completed', requestId, {
      userId: authData.user.id,
      email: data.email,
      sessionExpiresIn: authData.session.expires_in,
    });

    return createSuccessResponse(
      {
        tokens: {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresIn: authData.session.expires_in || 900,
        },
        user: mapSupabaseUserToUser(authData.user),
      },
      {
        message: 'Login successful',
        meta: { requestId },
      }
    );
  } catch (error) {
    logger.error('Unexpected error during login', {
      requestId,
      email: data.email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return createErrorResponse(
      'UNEXPECTED_ERROR',
      'An unexpected error occurred',
      { meta: { requestId } }
    );
  }
}
```

### Resend Confirmation Email with Rate Limits

```typescript
/**
 * Resend email confirmation link
 * Includes rate limit information in response
 */
export async function resendConfirmationEmail(
  email: string
): Promise<ApiResponse<void>> {
  const requestId = logger.generateRequestId();

  try {
    logger.authEvent('confirmation_email_resend_requested', requestId, {
      email,
    });

    // Call Supabase Edge Function (which implements rate limiting)
    const edgeFunctionUrl = `${process.env.SUPABASE_URL}/functions/v1/resend-confirmation`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ email }),
    });

    const rateLimit = parseRateLimitHeaders(response.headers);
    const body = await response.json();

    if (!response.ok) {
      logger.authEvent('confirmation_email_resend_failed', requestId, {
        email,
        errorCode: body.error?.code || 'RESEND_ERROR',
        errorMessage: body.error?.message || 'Failed to resend confirmation',
        statusCode: response.status,
      });

      return createErrorResponse(
        body.error?.code || 'RESEND_ERROR',
        body.error?.message || 'Failed to send confirmation email',
        {
          meta: {
            requestId,
            rateLimit,
          },
        }
      );
    }

    logger.authEvent('confirmation_email_resent', requestId, {
      email,
    });

    return createSuccessResponse(
      undefined, // void response
      {
        message: 'Confirmation email sent. Please check your inbox.',
        meta: {
          requestId,
          rateLimit,
        },
      }
    );
  } catch (error) {
    logger.error('Unexpected error resending confirmation email', {
      requestId,
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return createErrorResponse(
      'UNEXPECTED_ERROR',
      'An unexpected error occurred',
      { meta: { requestId } }
    );
  }
}
```

## Client-Side Usage

### React Hook Example

```typescript
// apps/mobile/src/hooks/useAuth.ts

import { useState } from 'react';
import { register, login, resendConfirmationEmail } from '@petforce/auth';
import type { ApiResponse } from '@petforce/auth/types';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const response = await register({ email, password });

    setLoading(false);

    if (response.success) {
      // Success - access typed data
      const { confirmationRequired } = response.data!;

      if (confirmationRequired) {
        showMessage(response.message || 'Please check your email');
      }

      return { success: true };
    } else {
      // Error - handle specific error codes
      const errorCode = response.error!.code;

      switch (errorCode) {
        case 'USER_ALREADY_EXISTS':
          setError('This email is already registered');
          break;
        case 'WEAK_PASSWORD':
          setError('Password is too weak');
          break;
        default:
          setError(response.error!.message);
      }

      return { success: false };
    }
  };

  const handleResendConfirmation = async (email: string) => {
    setLoading(true);
    setError(null);

    const response = await resendConfirmationEmail(email);

    setLoading(false);

    if (response.success) {
      showMessage(response.message || 'Confirmation email sent');

      // Access rate limit info to show countdown
      if (response.meta?.rateLimit) {
        const { remaining, reset } = response.meta.rateLimit;
        showRateLimitInfo(remaining, reset);
      }

      return { success: true };
    } else {
      // Handle rate limit errors
      if (response.error!.code === 'RATE_LIMIT_EXCEEDED') {
        const retryAfter = response.meta?.rateLimit?.retryAfter;
        if (retryAfter) {
          setError(`Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`);
          startCountdown(retryAfter);
        }
      } else {
        setError(response.error!.message);
      }

      return { success: false };
    }
  };

  return {
    loading,
    error,
    handleRegister,
    handleResendConfirmation,
  };
}
```

### Rate Limit Countdown Component

```typescript
// apps/mobile/src/components/RateLimitCountdown.tsx

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

interface Props {
  resetTimestamp: number; // Unix timestamp (seconds)
}

export function RateLimitCountdown({ resetTimestamp }: Props) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, resetTimestamp - now);
      setTimeLeft(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [resetTimestamp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft === 0) return null;

  return (
    <View>
      <Text>
        Try again in {minutes}:{seconds.toString().padStart(2, '0')}
      </Text>
    </View>
  );
}
```

## Testing Examples

### Unit Test for Response Helpers

```typescript
// packages/auth/src/utils/__tests__/api-response.test.ts

import { createSuccessResponse, createErrorResponse, parseRateLimitHeaders } from '../api-response';

describe('createSuccessResponse', () => {
  it('creates success response with data', () => {
    const response = createSuccessResponse({ userId: '123' });

    expect(response.success).toBe(true);
    expect(response.data).toEqual({ userId: '123' });
    expect(response.meta?.requestId).toBeDefined();
  });

  it('includes optional message', () => {
    const response = createSuccessResponse(
      { userId: '123' },
      { message: 'User created successfully' }
    );

    expect(response.message).toBe('User created successfully');
  });
});

describe('createErrorResponse', () => {
  it('creates error response with code and message', () => {
    const response = createErrorResponse('INVALID_CREDENTIALS', 'Login failed');

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('INVALID_CREDENTIALS');
    expect(response.error?.message).toBe('Login failed');
    expect(response.meta?.requestId).toBeDefined();
  });
});

describe('parseRateLimitHeaders', () => {
  it('parses rate limit headers correctly', () => {
    const headers = new Headers({
      'X-RateLimit-Limit': '3',
      'X-RateLimit-Remaining': '2',
      'X-RateLimit-Reset': '2026-01-25T12:00:00Z',
    });

    const rateLimit = parseRateLimitHeaders(headers);

    expect(rateLimit).toEqual({
      limit: 3,
      remaining: 2,
      reset: expect.any(Number),
      retryAfter: undefined,
    });
  });

  it('includes retryAfter when present', () => {
    const headers = new Headers({
      'X-RateLimit-Limit': '3',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': '2026-01-25T12:00:00Z',
      'Retry-After': '600',
    });

    const rateLimit = parseRateLimitHeaders(headers);

    expect(rateLimit?.retryAfter).toBe(600);
  });

  it('returns undefined when headers missing', () => {
    const headers = new Headers();
    const rateLimit = parseRateLimitHeaders(headers);

    expect(rateLimit).toBeUndefined();
  });
});
```

### Integration Test for Login

```typescript
// packages/auth/src/api/__tests__/auth-api.test.ts

import { login } from '../auth-api';

describe('login', () => {
  it('returns success response with tokens and user', async () => {
    const response = await login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.success).toBe(true);
    expect(response.data?.tokens).toBeDefined();
    expect(response.data?.user).toBeDefined();
    expect(response.meta?.requestId).toBeDefined();
  });

  it('returns error response for unconfirmed email', async () => {
    const response = await login({
      email: 'unconfirmed@example.com',
      password: 'password123',
    });

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('EMAIL_NOT_CONFIRMED');
    expect(response.error?.message).toContain('verify your email');
  });

  it('returns error response for invalid credentials', async () => {
    const response = await login({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('INVALID_CREDENTIALS');
  });
});
```

## Migration Guide

### For Existing Clients

**Old pattern:**
```typescript
const result = await login({ email, password });
if (result.success) {
  const tokens = result.tokens;  // Direct access
  const user = result.user;      // Direct access
}
```

**New pattern:**
```typescript
const result = await login({ email, password });
if (result.success) {
  const tokens = result.data.tokens;  // Wrapped in data
  const user = result.data.user;      // Wrapped in data
}
```

**Backwards-compatible transition (Phase 1):**
```typescript
// Both patterns work during transition
const result = await login({ email, password });
if (result.success) {
  // Old way (deprecated)
  const tokens = result.tokens;

  // New way (recommended)
  const tokens = result.data.tokens;
}
```
