// useOAuth hook - OAuth authentication (Google, Apple)

import { useState, useCallback } from 'react';
import { signInWithGoogle, signInWithApple, handleOAuthCallback } from '../api/oauth';
import type { AuthError, AuthTokens, User } from '../types/auth';

export interface UseOAuthReturn {
  isLoading: boolean;
  error: AuthError | null;
  tokens: AuthTokens | null;
  user: User | null;

  // Actions
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  loginWithApple: (redirectTo?: string) => Promise<void>;
  handleCallback: () => Promise<void>;
  clearError: () => void;
}

/**
 * OAuth authentication hook
 * Handles Google and Apple sign-in flows
 */
export function useOAuth(): UseOAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const loginWithGoogle = useCallback(async (redirectTo?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle(redirectTo);

      if (result.success && result.url) {
        // Redirect to Google OAuth consent screen
        if (typeof window !== 'undefined') {
          window.location.href = result.url;
        }
      } else if (result.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (err) {
      setError({
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      setIsLoading(false);
    }
  }, []);

  const loginWithApple = useCallback(async (redirectTo?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithApple(redirectTo);

      if (result.success && result.url) {
        // Redirect to Apple sign-in screen
        if (typeof window !== 'undefined') {
          window.location.href = result.url;
        }
      } else if (result.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (err) {
      setError({
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      setIsLoading(false);
    }
  }, []);

  const handleCallback = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await handleOAuthCallback();

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

  return {
    isLoading,
    error,
    tokens,
    user,
    loginWithGoogle,
    loginWithApple,
    handleCallback,
    clearError,
  };
}
