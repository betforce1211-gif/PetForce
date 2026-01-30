// useAuth hook - Main authentication hook

import { useState, useCallback } from 'react';
import { login, register, logout, getCurrentUser } from '../api/auth-api';
import type { LoginRequest, RegisterRequest, User, AuthTokens, AuthError } from '../types/auth';

export interface UseAuthReturn {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  registrationResult: {
    email?: string;
    confirmationRequired?: boolean;
  } | null;

  // Actions
  loginWithPassword: (credentials: LoginRequest) => Promise<{ success: boolean; error?: AuthError }>;
  registerWithPassword: (data: RegisterRequest) => Promise<{ success: boolean; confirmationRequired?: boolean }>;
  logoutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

/**
 * Main authentication hook
 * Provides login, register, logout, and user state management
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [registrationResult, setRegistrationResult] = useState<{
    email?: string;
    confirmationRequired?: boolean;
  } | null>(null);

  const loginWithPassword = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(credentials);

      if (result.success && result.tokens && result.user) {
        setTokens(result.tokens);
        setUser(result.user);
        return { success: true };
      } else if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: false };
    } catch (err) {
      const error = {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      };
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerWithPassword = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    setRegistrationResult(null);

    try {
      const result = await register(data);

      if (result.success) {
        // Store registration result for redirect
        setRegistrationResult({
          email: data.email,
          confirmationRequired: result.confirmationRequired,
        });
        return { success: true, confirmationRequired: result.confirmationRequired };
      } else if (result.error) {
        setError(result.error);
        return { success: false };
      }

      return { success: false };
    } catch (err) {
      setError({
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logoutUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await logout();

      if (result.success) {
        setUser(null);
        setTokens(null);
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

  const refreshUser = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await getCurrentUser();

      if (result.user) {
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
    user,
    tokens,
    isLoading,
    error,
    isAuthenticated: !!user,
    registrationResult,
    loginWithPassword,
    registerWithPassword,
    logoutUser,
    refreshUser,
    clearError,
  };
}
