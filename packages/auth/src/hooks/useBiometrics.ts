// useBiometrics hook - Biometric authentication

import { useState, useCallback, useEffect } from 'react';
import {
  isBiometricAvailable,
  authenticateWithBiometrics,
  enrollBiometrics,
  isBiometricEnrolled,
  disableBiometrics,
} from '../api/biometrics';
import type { AuthError } from '../types/auth';

export interface UseBiometricsReturn {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometryType: 'FaceID' | 'TouchID' | 'Fingerprint' | 'Biometrics' | null;
  isLoading: boolean;
  error: AuthError | null;

  // Actions
  checkAvailability: () => Promise<void>;
  authenticate: (promptMessage?: string) => Promise<boolean>;
  enroll: (userId: string) => Promise<boolean>;
  disable: (userId: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Biometric authentication hook
 * Handles Face ID, Touch ID, and fingerprint authentication
 */
export function useBiometrics(userId?: string): UseBiometricsReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometryType, setBiometryType] = useState<
    'FaceID' | 'TouchID' | 'Fingerprint' | 'Biometrics' | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const checkAvailability = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await isBiometricAvailable();

      if (result.available) {
        setIsAvailable(true);
        setBiometryType(result.biometryType || null);

        // Check if user has enrolled
        if (userId) {
          const enrolled = await isBiometricEnrolled(userId);
          setIsEnrolled(enrolled);
        }
      } else {
        setIsAvailable(false);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      setError({
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const authenticate = useCallback(async (promptMessage?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authenticateWithBiometrics(promptMessage);

      if (result.success) {
        return true;
      } else if (result.error) {
        setError(result.error);
        return false;
      }
      return false;
    } catch (err) {
      setError({
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enroll = useCallback(async (enrollUserId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await enrollBiometrics(enrollUserId);

      if (result.success) {
        setIsEnrolled(true);
        return true;
      } else if (result.error) {
        setError(result.error);
        return false;
      }
      return false;
    } catch (err) {
      setError({
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disable = useCallback(async (disableUserId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await disableBiometrics(disableUserId);

      if (result.success) {
        setIsEnrolled(false);
        return true;
      } else if (result.error) {
        setError(result.error);
        return false;
      }
      return false;
    } catch (err) {
      setError({
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check availability on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    isAvailable,
    isEnrolled,
    biometryType,
    isLoading,
    error,
    checkAvailability,
    authenticate,
    enroll,
    disable,
    clearError,
  };
}
