// Authentication API tests
// Tests for email confirmation state tracking and logging

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { register, login, logout, requestPasswordReset, getCurrentUser, refreshSession } from '../../api/auth-api';
import { getSupabaseClient } from '../../api/supabase-client';
import { logger } from '../../utils/logger';

// Mock Supabase client
vi.mock('../../api/supabase-client', () => ({
  getSupabaseClient: vi.fn(),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    generateRequestId: vi.fn(() => 'test-request-id'),
    authEvent: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Auth API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        getUser: vi.fn(),
        refreshSession: vi.fn(),
      },
    };

    (getSupabaseClient as any).mockReturnValue(mockSupabase);

    // Mock window.location.origin for email redirects
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('register()', () => {
    it('should successfully register a user and detect unconfirmed state', async () => {
      const mockAuthData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          email_confirmed_at: null, // ❌ Unconfirmed - the bug scenario!
          user_metadata: {
            first_name: 'Test',
            last_name: 'User',
          },
          created_at: '2026-01-24T00:00:00Z',
          updated_at: '2026-01-24T00:00:00Z',
        },
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const result = await register({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      // Verify registration succeeded
      expect(result.success).toBe(true);
      expect(result.confirmationRequired).toBe(true); // ✅ Bug fix: returns confirmation state
      expect(result.message).toContain('check your email');

      // Verify logging was called correctly
      expect(logger.generateRequestId).toHaveBeenCalled();
      expect(logger.authEvent).toHaveBeenCalledWith(
        'registration_attempt_started',
        'test-request-id',
        expect.objectContaining({
          email: 'test@example.com',
          hasFirstName: true,
          hasLastName: true,
        })
      );

      expect(logger.authEvent).toHaveBeenCalledWith(
        'registration_completed',
        'test-request-id',
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          emailConfirmed: false,
          confirmationRequired: true,
          confirmationEmailSent: true,
        })
      );

      // ✅ Bug fix: Logs when user is unconfirmed
      expect(logger.info).toHaveBeenCalledWith(
        'User created but email not confirmed yet',
        expect.objectContaining({
          requestId: 'test-request-id',
          userId: 'user-123',
          email: 'test@example.com',
          message: 'User must click verification link in email before they can login',
        })
      );
    });

    it('should register a user with confirmed email (auto-confirm enabled)', async () => {
      const mockAuthData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          email_confirmed_at: '2026-01-24T00:00:00Z', // ✅ Confirmed
          user_metadata: {
            first_name: 'Test',
            last_name: 'User',
          },
          created_at: '2026-01-24T00:00:00Z',
          updated_at: '2026-01-24T00:00:00Z',
        },
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const result = await register({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.success).toBe(true);
      expect(result.confirmationRequired).toBe(false); // Email already confirmed
      expect(result.message).toBe('Registration successful.');

      // Verify unconfirmed warning was NOT logged
      expect(logger.info).not.toHaveBeenCalledWith(
        'User created but email not confirmed yet',
        expect.any(Object)
      );
    });

    it('should handle registration errors and log them', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: {
          name: 'USER_ALREADY_EXISTS',
          message: 'User already registered',
        },
      });

      const result = await register({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_ALREADY_EXISTS');

      // Verify error logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'registration_failed',
        'test-request-id',
        expect.objectContaining({
          email: 'test@example.com',
          errorCode: 'USER_ALREADY_EXISTS',
          errorMessage: 'User already registered',
        })
      );
    });

    it('should handle missing user in response', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null }, // No user returned
        error: null,
      });

      const result = await register({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('REGISTRATION_ERROR');

      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        'Registration succeeded but no user in response',
        expect.objectContaining({
          requestId: 'test-request-id',
          email: 'test@example.com',
        })
      );
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.auth.signUp.mockRejectedValue(new Error('Network error'));

      const result = await register({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNEXPECTED_ERROR');

      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        'Unexpected error during registration',
        expect.objectContaining({
          requestId: 'test-request-id',
          email: 'test@example.com',
          error: 'Network error',
        })
      );
    });
  });

  describe('login()', () => {
    it('should reject login for unconfirmed users (bug fix)', async () => {
      const mockAuthData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          email_confirmed_at: null, // ❌ Unconfirmed
          user_metadata: {},
          created_at: '2026-01-24T00:00:00Z',
          updated_at: '2026-01-24T00:00:00Z',
        },
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
        },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const result = await login({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      // ✅ Bug fix: Login rejected for unconfirmed users
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_NOT_CONFIRMED');
      expect(result.error?.message).toContain('verify your email address');

      // Verify logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'login_rejected_unconfirmed',
        'test-request-id',
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          reason: 'Email not confirmed',
        })
      );
    });

    it('should successfully login confirmed users', async () => {
      const mockAuthData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          email_confirmed_at: '2026-01-24T00:00:00Z', // ✅ Confirmed
          user_metadata: {
            first_name: 'Test',
            last_name: 'User',
          },
          created_at: '2026-01-24T00:00:00Z',
          updated_at: '2026-01-24T00:00:00Z',
        },
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
        },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const result = await login({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens?.accessToken).toBe('mock-token');
      expect(result.user).toBeDefined();
      expect(result.user?.emailVerified).toBe(true);

      // Verify logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'login_attempt_started',
        'test-request-id',
        expect.objectContaining({
          email: 'test@example.com',
        })
      );

      expect(logger.authEvent).toHaveBeenCalledWith(
        'login_completed',
        'test-request-id',
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          sessionExpiresIn: 3600,
        })
      );
    });

    it('should handle login errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: {
          name: 'INVALID_CREDENTIALS',
          message: 'Invalid login credentials',
        },
      });

      const result = await login({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CREDENTIALS');

      // Verify error logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'login_failed',
        'test-request-id',
        expect.objectContaining({
          email: 'test@example.com',
          errorCode: 'INVALID_CREDENTIALS',
        })
      );
    });
  });

  describe('logout()', () => {
    it('should successfully logout and log the event', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await logout();

      expect(result.success).toBe(true);

      // Verify logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'logout_attempt_started',
        'test-request-id',
        {}
      );

      expect(logger.authEvent).toHaveBeenCalledWith(
        'logout_completed',
        'test-request-id',
        {}
      );
    });

    it('should handle logout errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: {
          name: 'LOGOUT_ERROR',
          message: 'Failed to logout',
        },
      });

      const result = await logout();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LOGOUT_ERROR');

      // Verify error logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'logout_failed',
        'test-request-id',
        expect.objectContaining({
          errorCode: 'LOGOUT_ERROR',
        })
      );
    });
  });

  describe('requestPasswordReset()', () => {
    it('should request password reset and log the event', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const result = await requestPasswordReset({ email: 'test@example.com' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('password reset link has been sent');

      // Verify logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'password_reset_requested',
        'test-request-id',
        expect.objectContaining({
          email: 'test@example.com',
        })
      );

      expect(logger.authEvent).toHaveBeenCalledWith(
        'password_reset_email_sent',
        'test-request-id',
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });

    it('should handle password reset errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: {
          name: 'PASSWORD_RESET_ERROR',
          message: 'Failed to send reset email',
        },
      });

      const result = await requestPasswordReset({ email: 'test@example.com' });

      expect(result.success).toBe(false);

      // Verify error logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'password_reset_failed',
        'test-request-id',
        expect.objectContaining({
          email: 'test@example.com',
          errorCode: 'PASSWORD_RESET_ERROR',
        })
      );
    });
  });

  describe('getCurrentUser()', () => {
    it('should get current user and log the event', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2026-01-24T00:00:00Z',
        user_metadata: {
          first_name: 'Test',
          last_name: 'User',
        },
        created_at: '2026-01-24T00:00:00Z',
        updated_at: '2026-01-24T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe('user-123');
      expect(result.user?.emailVerified).toBe(true);

      // Verify logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'get_user_completed',
        'test-request-id',
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          emailVerified: true,
        })
      );
    });

    it('should handle no user session', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result.user).toBeNull();

      // Verify debug logging
      expect(logger.debug).toHaveBeenCalledWith(
        'Get user completed - no user session',
        expect.objectContaining({
          requestId: 'test-request-id',
        })
      );
    });
  });

  describe('refreshSession()', () => {
    it('should refresh session and log the event', async () => {
      const mockSession = {
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_in: 3600,
        user: {
          id: 'user-123',
        },
      };

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await refreshSession();

      expect(result.success).toBe(true);
      expect(result.tokens?.accessToken).toBe('new-token');

      // Verify logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'session_refresh_started',
        'test-request-id',
        {}
      );

      expect(logger.authEvent).toHaveBeenCalledWith(
        'session_refresh_completed',
        'test-request-id',
        expect.objectContaining({
          userId: 'user-123',
          expiresIn: 3600,
        })
      );
    });

    it('should handle refresh errors', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: {
          name: 'REFRESH_ERROR',
          message: 'Invalid refresh token',
        },
      });

      const result = await refreshSession();

      expect(result.success).toBe(false);

      // Verify error logging
      expect(logger.authEvent).toHaveBeenCalledWith(
        'session_refresh_failed',
        'test-request-id',
        expect.objectContaining({
          errorCode: 'REFRESH_ERROR',
        })
      );
    });
  });
});
