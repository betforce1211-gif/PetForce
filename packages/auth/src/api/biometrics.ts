// Biometric Authentication
// Platform-specific implementation for Face ID, Touch ID, and Fingerprint

import type { AuthError } from '../types/auth';

// Platform detection
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// Lazy load expo-local-authentication only in React Native
let LocalAuthentication: any = null;
if (isReactNative) {
  try {
    LocalAuthentication = require('expo-local-authentication');
  } catch (e) {
    // expo-local-authentication not available
  }
}

/**
 * Check if biometric authentication is available on the device
 */
export async function isBiometricAvailable(): Promise<{
  available: boolean;
  biometryType?: 'FaceID' | 'TouchID' | 'Fingerprint' | 'Biometrics';
  error?: AuthError;
}> {
  try {
    if (!isReactNative) {
      // Web/Desktop - check for WebAuthn support
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        return {
          available: true,
          biometryType: 'Biometrics',
        };
      }
      return { available: false };
    }

    // React Native - use expo-local-authentication
    if (LocalAuthentication) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { available: false };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { available: false };
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const AuthenticationType = LocalAuthentication.AuthenticationType;

      let biometryType: 'FaceID' | 'TouchID' | 'Fingerprint' | 'Biometrics' = 'Biometrics';
      if (supportedTypes.includes(AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = 'FaceID';
      } else if (supportedTypes.includes(AuthenticationType.FINGERPRINT)) {
        biometryType = 'Fingerprint';
      }

      return {
        available: true,
        biometryType,
      };
    }

    return {
      available: false,
      error: {
        code: 'NOT_AVAILABLE',
        message: 'expo-local-authentication not available',
      },
    };
  } catch (error) {
    return {
      available: false,
      error: {
        code: 'BIOMETRIC_CHECK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Authenticate user with biometrics
 * @param promptMessage - Message to show in the biometric prompt
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Authenticate to access PetForce'
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    if (!isReactNative) {
      // Web - WebAuthn implementation (placeholder for now)
      return {
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Web biometric authentication will be implemented with WebAuthn',
        },
      };
    }

    // React Native - use expo-local-authentication
    if (LocalAuthentication) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: {
            code: 'BIOMETRIC_AUTH_FAILED',
            message: result.error || 'Biometric authentication failed',
          },
        };
      }
    }

    return {
      success: false,
      error: {
        code: 'NOT_AVAILABLE',
        message: 'expo-local-authentication not available',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'BIOMETRIC_AUTH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Enroll user in biometric authentication
 * Stores encrypted credentials that can be unlocked with biometrics
 */
export async function enrollBiometrics(_userId: string): Promise<{
  success: boolean;
  publicKey?: string;
  error?: AuthError;
}> {
  try {
    if (!isReactNative) {
      return {
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Web biometric enrollment will be implemented with WebAuthn',
        },
      };
    }

    // React Native - will be implemented when react-native-biometrics is added
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Biometric enrollment will be added with react-native-biometrics package',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'BIOMETRIC_ENROLL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Check if user has enrolled biometrics
 */
export async function isBiometricEnrolled(_userId: string): Promise<boolean> {
  // Will be implemented with actual storage check
  // For now, return false
  return Promise.resolve(false);
}

/**
 * Disable biometric authentication for user
 */
export async function disableBiometrics(_userId: string): Promise<{
  success: boolean;
  error?: AuthError;
}> {
  try {
    // Will delete stored biometric keys and credentials
    // For now, return success
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'BIOMETRIC_DISABLE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
