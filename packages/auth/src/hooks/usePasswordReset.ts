// usePasswordReset hook - Password reset flow

import { useState, useCallback } from 'react';
import { requestPasswordReset } from '../api/auth-api';
import { getSupabaseClient } from '../api/supabase-client';
import type { AuthError } from '../types/auth';

export interface UsePasswordResetReturn {
  isLoading: boolean;
  error: AuthError | null;
  emailSent: boolean;
  resetComplete: boolean;

  // Actions
  sendResetEmail: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  clearError: () => void;
  resetState: () => void;
}

/**
 * Password reset hook
 * Handles forgot password and password reset flows
 */
export function usePasswordReset(): UsePasswordResetReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const sendResetEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    setEmailSent(false);

    try {
      const result = await requestPasswordReset({ email });

      if (result.success) {
        setEmailSent(true);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError({
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (newPassword: string) => {
    setIsLoading(true);
    setError(null);
    setResetComplete(false);

    try {
      const supabase = getSupabaseClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError({
          code: updateError.name || 'PASSWORD_RESET_ERROR',
          message: updateError.message,
        });
      } else {
        setResetComplete(true);
      }
    } catch (err) {
      setError({
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setError(null);
    setEmailSent(false);
    setResetComplete(false);
  }, []);

  return {
    isLoading,
    error,
    emailSent,
    resetComplete,
    sendResetEmail,
    resetPassword,
    clearError,
    resetState,
  };
}
