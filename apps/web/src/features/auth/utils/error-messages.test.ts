/**
 * Tests for auth error message utility
 */

import { describe, it, expect, vi } from 'vitest';
import { getAuthErrorMessage } from './error-messages';

describe('getAuthErrorMessage', () => {
  describe('Duplicate email errors', () => {
    it('should detect USER_ALREADY_EXISTS error code', () => {
      const error = {
        code: 'USER_ALREADY_EXISTS',
        message: 'User already registered',
      };

      const result = getAuthErrorMessage(error);

      expect(result).toEqual({
        title: 'Email Already Registered',
        message: 'This email is already associated with an account. Would you like to sign in instead or reset your password?',
        action: undefined,
      });
    });

    it('should detect "user already registered" in message', () => {
      const error = {
        code: 'AuthApiError',
        message: 'User already registered',
      };

      const result = getAuthErrorMessage(error);

      expect(result?.title).toBe('Email Already Registered');
    });

    it('should detect "email already" in message', () => {
      const error = {
        message: 'Email already exists in the system',
      };

      const result = getAuthErrorMessage(error);

      expect(result?.title).toBe('Email Already Registered');
    });

    it('should provide action button when onSwitchToLogin is provided', () => {
      const error = {
        code: 'USER_ALREADY_EXISTS',
        message: 'User already registered',
      };

      const onSwitchToLogin = vi.fn();
      const result = getAuthErrorMessage(error, { onSwitchToLogin });

      expect(result?.action).toBeDefined();
      expect(result?.action?.text).toBe('Switch to Sign In');
      
      result?.action?.onClick();
      expect(onSwitchToLogin).toHaveBeenCalled();
    });
  });

  describe('Email not confirmed errors', () => {
    it('should handle EMAIL_NOT_CONFIRMED error code', () => {
      const error = {
        code: 'EMAIL_NOT_CONFIRMED',
        message: 'Please verify your email',
      };

      const result = getAuthErrorMessage(error);

      expect(result?.title).toBe('Email Not Verified');
      expect(result?.message).toBe('Please verify your email');
    });
  });

  describe('Invalid credentials errors', () => {
    it('should handle INVALID_CREDENTIALS error code', () => {
      const error = {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid login credentials',
      };

      const result = getAuthErrorMessage(error);

      expect(result?.title).toBe('Invalid Credentials');
    });

    it('should provide forgot password action when available', () => {
      const error = {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid login credentials',
      };

      const onForgotPassword = vi.fn();
      const result = getAuthErrorMessage(error, { onForgotPassword });

      expect(result?.action).toBeDefined();
      expect(result?.action?.text).toBe('Forgot Password?');
      
      result?.action?.onClick();
      expect(onForgotPassword).toHaveBeenCalled();
    });
  });

  describe('Rate limit errors', () => {
    it('should detect rate limit in message', () => {
      const error = {
        message: 'Rate limit exceeded',
      };

      const result = getAuthErrorMessage(error);

      expect(result?.title).toBe('Too Many Attempts');
    });
  });

  describe('Weak password errors', () => {
    it('should detect password strength errors', () => {
      const error = {
        message: 'Password does not meet strength requirements',
      };

      const result = getAuthErrorMessage(error);

      expect(result?.title).toBe('Password Too Weak');
    });
  });

  describe('Network errors', () => {
    it('should detect network errors', () => {
      const error = {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
      };

      const result = getAuthErrorMessage(error);

      expect(result?.title).toBe('Connection Error');
    });
  });

  describe('Unknown errors', () => {
    it('should handle unknown errors gracefully', () => {
      const error = {
        message: 'Some unexpected error',
      };

      const result = getAuthErrorMessage(error);

      expect(result?.title).toBe('Something Went Wrong');
      expect(result?.message).toBe('Some unexpected error');
    });
  });

  describe('Null/undefined errors', () => {
    it('should return null for null error', () => {
      const result = getAuthErrorMessage(null);

      expect(result).toBeNull();
    });
  });
});
