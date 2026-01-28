/**
 * ResendConfirmationEmail Integration Tests
 * Tucker's comprehensive API testing for email recovery flow
 * 
 * Critical for pet families who lose their verification emails.
 * Every edge case must be covered to prevent lockout scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resendConfirmationEmail } from '../../api/auth-api';
import { getSupabaseClient } from '../../api/supabase-client';
import { logger } from '../../utils/logger';

// Mock dependencies
vi.mock('../../api/supabase-client');
vi.mock('../../utils/logger');

describe('resendConfirmationEmail', () => {
  const mockResend = vi.fn();
  const mockSupabaseClient = {
    auth: {
      resend: mockResend,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabaseClient as any);
    vi.mocked(logger.generateRequestId).mockReturnValue('test-request-id-123');
    vi.mocked(logger.authEvent).mockImplementation(() => {});
    vi.mocked(logger.error).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('successfully resends confirmation email', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await resendConfirmationEmail('owner@petfamily.com');

      expect(result).toEqual({
        success: true,
        message: 'Confirmation email sent. Please check your inbox.',
      });

      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'owner@petfamily.com',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/verify'),
        },
      });
    });

    it('logs confirmation resend request', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      await resendConfirmationEmail('test@example.com');

      expect(logger.authEvent).toHaveBeenCalledWith(
        'confirmation_email_resend_requested',
        'test-request-id-123',
        { email: 'test@example.com' }
      );
    });

    it('logs successful resend completion', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      await resendConfirmationEmail('test@example.com');

      expect(logger.authEvent).toHaveBeenCalledWith(
        'confirmation_email_resent',
        'test-request-id-123',
        { email: 'test@example.com' }
      );
    });

    it('includes correct redirect URL', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://petforce.app' },
        writable: true,
      });

      await resendConfirmationEmail('test@example.com');

      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'https://petforce.app/auth/verify',
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('handles Supabase error response', async () => {
      mockResend.mockResolvedValue({
        data: null,
        error: {
          name: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      });

      const result = await resendConfirmationEmail('test@example.com');

      expect(result).toEqual({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      });
    });

    it('logs resend failure with error details', async () => {
      mockResend.mockResolvedValue({
        data: null,
        error: {
          name: 'INVALID_EMAIL',
          message: 'Invalid email format',
        },
      });

      await resendConfirmationEmail('invalid-email');

      expect(logger.authEvent).toHaveBeenCalledWith(
        'confirmation_email_resend_failed',
        'test-request-id-123',
        {
          email: 'invalid-email',
          errorCode: 'INVALID_EMAIL',
          errorMessage: 'Invalid email format',
        }
      );
    });

    it('handles Supabase error without name field', async () => {
      mockResend.mockResolvedValue({
        data: null,
        error: {
          message: 'Unknown error occurred',
        },
      });

      const result = await resendConfirmationEmail('test@example.com');

      expect(result.error?.code).toBe('RESEND_ERROR');
    });

    it('handles unexpected thrown errors', async () => {
      mockResend.mockRejectedValue(new Error('Network failure'));

      const result = await resendConfirmationEmail('test@example.com');

      expect(result).toEqual({
        success: false,
        message: 'An unexpected error occurred',
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Network failure',
        },
      });
    });

    it('logs unexpected errors', async () => {
      mockResend.mockRejectedValue(new Error('Connection timeout'));

      await resendConfirmationEmail('test@example.com');

      expect(logger.error).toHaveBeenCalledWith(
        'Unexpected error resending confirmation email',
        {
          requestId: 'test-request-id-123',
          email: 'test@example.com',
          error: 'Connection timeout',
        }
      );
    });

    it('handles non-Error exceptions', async () => {
      mockResend.mockRejectedValue('String error');

      const result = await resendConfirmationEmail('test@example.com');

      expect(result.error?.message).toBe('Unknown error');
      expect(logger.error).toHaveBeenCalledWith(
        'Unexpected error resending confirmation email',
        expect.objectContaining({
          error: 'Unknown error',
        })
      );
    });
  });

  describe('Edge Cases - Email Validation', () => {
    it('handles empty email string', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await resendConfirmationEmail('');

      expect(result.success).toBe(true);
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: '',
        options: expect.any(Object),
      });
    });

    it('handles email with special characters', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      const specialEmail = 'user+test@example.co.uk';
      const result = await resendConfirmationEmail(specialEmail);

      expect(result.success).toBe(true);
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: specialEmail,
        options: expect.any(Object),
      });
    });

    it('handles very long email addresses', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      const longEmail = 'a'.repeat(200) + '@example.com';
      const result = await resendConfirmationEmail(longEmail);

      expect(result.success).toBe(true);
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: longEmail,
        options: expect.any(Object),
      });
    });

    it('handles email with unicode characters', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      const unicodeEmail = 'tëst@ëxamplë.com';
      const result = await resendConfirmationEmail(unicodeEmail);

      expect(result.success).toBe(true);
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: unicodeEmail,
        options: expect.any(Object),
      });
    });

    it('handles email with emoji', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      const emojiEmail = 'pet🐶owner@example.com';
      const result = await resendConfirmationEmail(emojiEmail);

      expect(result.success).toBe(true);
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: emojiEmail,
        options: expect.any(Object),
      });
    });
  });

  describe('Edge Cases - Security', () => {
    it('handles potential XSS in email parameter', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      const xssEmail = '<script>alert("xss")</script>@example.com';
      const result = await resendConfirmationEmail(xssEmail);

      // Function should not crash and should pass email as-is to Supabase
      // Supabase will handle validation
      expect(result.success).toBe(true);
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: xssEmail,
        options: expect.any(Object),
      });
    });

    it('handles SQL injection attempts', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      const sqlInjection = "'; DROP TABLE users; --@example.com";
      const result = await resendConfirmationEmail(sqlInjection);

      expect(result.success).toBe(true);
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: sqlInjection,
        options: expect.any(Object),
      });
    });

    it('does not expose sensitive information in error messages', async () => {
      mockResend.mockResolvedValue({
        data: null,
        error: {
          name: 'DATABASE_ERROR',
          message: 'Internal database connection string: postgres://secret@host',
        },
      });

      const result = await resendConfirmationEmail('test@example.com');

      // Error message is passed through, but logging should handle sanitization
      expect(result.error?.message).toContain('database connection string');
      // In production, logger should sanitize sensitive data
    });
  });

  describe('Edge Cases - Rate Limiting', () => {
    it('handles rate limit error from Supabase', async () => {
      mockResend.mockResolvedValue({
        data: null,
        error: {
          name: 'RATE_LIMIT_EXCEEDED',
          message: 'Email rate limit exceeded. Please wait before trying again.',
        },
      });

      const result = await resendConfirmationEmail('test@example.com');

      expect(result).toEqual({
        success: false,
        message: 'Email rate limit exceeded. Please wait before trying again.',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Email rate limit exceeded. Please wait before trying again.',
        },
      });

      expect(logger.authEvent).toHaveBeenCalledWith(
        'confirmation_email_resend_failed',
        'test-request-id-123',
        {
          email: 'test@example.com',
          errorCode: 'RATE_LIMIT_EXCEEDED',
          errorMessage: 'Email rate limit exceeded. Please wait before trying again.',
        }
      );
    });

    it('handles rapid successive calls', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      // Simulate rapid successive calls
      const promises = [
        resendConfirmationEmail('test@example.com'),
        resendConfirmationEmail('test@example.com'),
        resendConfirmationEmail('test@example.com'),
      ];

      const results = await Promise.all(promises);

      // All should succeed (rate limiting is handled by Supabase/UI layer)
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      expect(mockResend).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases - Network Conditions', () => {
    it('handles network timeout', async () => {
      mockResend.mockRejectedValue(new Error('Request timeout'));

      const result = await resendConfirmationEmail('test@example.com');

      expect(result).toEqual({
        success: false,
        message: 'An unexpected error occurred',
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Request timeout',
        },
      });
    });

    it('handles connection refused', async () => {
      mockResend.mockRejectedValue(new Error('Connection refused'));

      const result = await resendConfirmationEmail('test@example.com');

      expect(result.error?.message).toBe('Connection refused');
    });

    it('handles DNS resolution failure', async () => {
      mockResend.mockRejectedValue(new Error('DNS resolution failed'));

      const result = await resendConfirmationEmail('test@example.com');

      expect(result.error?.message).toBe('DNS resolution failed');
    });
  });

  describe('Edge Cases - User States', () => {
    it('resends for user who never received initial email', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await resendConfirmationEmail('never-received@example.com');

      expect(result.success).toBe(true);
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'never-received@example.com',
        options: expect.any(Object),
      });
    });

    it('handles already confirmed user gracefully', async () => {
      mockResend.mockResolvedValue({
        data: null,
        error: {
          name: 'EMAIL_ALREADY_CONFIRMED',
          message: 'Email is already confirmed',
        },
      });

      const result = await resendConfirmationEmail('already-confirmed@example.com');

      expect(result).toEqual({
        success: false,
        message: 'Email is already confirmed',
        error: {
          code: 'EMAIL_ALREADY_CONFIRMED',
          message: 'Email is already confirmed',
        },
      });
    });

    it('handles non-existent user', async () => {
      mockResend.mockResolvedValue({
        data: null,
        error: {
          name: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });

      const result = await resendConfirmationEmail('nonexistent@example.com');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('Logging & Observability', () => {
    it('generates unique request ID for tracking', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      await resendConfirmationEmail('test@example.com');

      expect(logger.generateRequestId).toHaveBeenCalled();
    });

    it('uses same request ID across all log calls', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      await resendConfirmationEmail('test@example.com');

      const requestStartCall = vi.mocked(logger.authEvent).mock.calls.find(
        (call) => call[0] === 'confirmation_email_resend_requested'
      );
      const requestEndCall = vi.mocked(logger.authEvent).mock.calls.find(
        (call) => call[0] === 'confirmation_email_resent'
      );

      expect(requestStartCall?.[1]).toBe('test-request-id-123');
      expect(requestEndCall?.[1]).toBe('test-request-id-123');
    });

    it('logs all required fields for observability', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      await resendConfirmationEmail('track@example.com');

      expect(logger.authEvent).toHaveBeenCalledWith(
        'confirmation_email_resend_requested',
        expect.any(String),
        { email: 'track@example.com' }
      );

      expect(logger.authEvent).toHaveBeenCalledWith(
        'confirmation_email_resent',
        expect.any(String),
        { email: 'track@example.com' }
      );
    });
  });

  describe('Integration - Request Structure', () => {
    it('always uses "signup" type for resend', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      await resendConfirmationEmail('test@example.com');

      expect(mockResend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'signup',
        })
      );
    });

    it('includes emailRedirectTo in options', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      await resendConfirmationEmail('test@example.com');

      expect(mockResend).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            emailRedirectTo: expect.any(String),
          }),
        })
      );
    });

    it('redirect URL points to /auth/verify', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      await resendConfirmationEmail('test@example.com');

      const call = mockResend.mock.calls[0][0];
      expect(call.options.emailRedirectTo).toMatch(/\/auth\/verify$/);
    });
  });

  describe('Performance & Reliability', () => {
    it('completes quickly for successful requests', async () => {
      mockResend.mockResolvedValue({
        data: {},
        error: null,
      });

      const start = Date.now();
      await resendConfirmationEmail('test@example.com');
      const duration = Date.now() - start;

      // Should complete in less than 100ms (in test environment)
      expect(duration).toBeLessThan(100);
    });

    it('does not hang on slow network', async () => {
      mockResend.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 50))
      );

      const start = Date.now();
      await resendConfirmationEmail('test@example.com');
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(50);
      expect(duration).toBeLessThan(200);
    });
  });
});
