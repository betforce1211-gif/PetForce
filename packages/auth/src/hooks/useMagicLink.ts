// useMagicLink hook - Magic link (passwordless) authentication

import { useState, useCallback } from 'react';
import { sendMagicLink, verifyMagicLink } from '../api/magic-link';
import type { AuthError, AuthTokens, User } from '../types/auth';

export interface UseMagicLinkReturn {
  isLoading: boolean;
  error: AuthError | null;
  emailSent: boolean;
  tokens: AuthTokens | null;
  user: User | null;

  // Actions
  sendLink: (email: string, redirectTo?: string) => Promise<void>;
  verifyLink: (token: string, type?: 'magiclink' | 'email') => Promise<void>;
  clearError: () => void;
  resetState: () => void;
}

/**
 * Magic link authentication hook
 * Handles sending magic links and verifying them
 */
export function useMagicLink(): UseMagicLinkReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const sendLink = useCallback(async (email: string, redirectTo?: string) => {
    setIsLoading(true);
    setError(null);
    setEmailSent(false);

    try {
      const result = await sendMagicLink(email, redirectTo);

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

  const verifyLink = useCallback(async (token: string, type: 'magiclink' | 'email' = 'magiclink') => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyMagicLink(token, type);

      if (result.success && result.tokens && result.user) {
        setTokens(result.tokens);
        setUser(result.user);
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setError(null);
    setEmailSent(false);
    setTokens(null);
    setUser(null);
  }, []);

  return {
    isLoading,
    error,
    emailSent,
    tokens,
    user,
    sendLink,
    verifyLink,
    clearError,
    resetState,
  };
}
