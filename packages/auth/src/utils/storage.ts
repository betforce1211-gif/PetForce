// Secure Token Storage
// Platform-specific secure storage for authentication tokens

import type { AuthTokens } from '../types/auth';

// Platform detection
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// Storage keys
const ACCESS_TOKEN_KEY = 'petforce_access_token';
const REFRESH_TOKEN_KEY = 'petforce_refresh_token';
const EXPIRES_IN_KEY = 'petforce_expires_in';
const TOKEN_TIMESTAMP_KEY = 'petforce_token_timestamp';

/**
 * Store authentication tokens securely
 * - Web: Uses sessionStorage for access token, httpOnly cookies (set by backend) for refresh token
 * - Mobile: Will use react-native-keychain for encrypted storage
 */
export async function storeTokens(tokens: AuthTokens): Promise<void> {
  try {
    if (isReactNative) {
      // React Native - will use react-native-keychain
      // For now, store in memory (not persistent - will be enhanced)
      // @ts-ignore - global storage placeholder
      global.__petforceTokens = tokens;

      // TODO: Implement with react-native-keychain
      // import * as Keychain from 'react-native-keychain';
      // await Keychain.setGenericPassword(
      //   'petforce_tokens',
      //   JSON.stringify(tokens),
      //   { service: 'com.petforce.auth' }
      // );
    } else {
      // Web - store access token in sessionStorage (memory-like, cleared on tab close)
      // Refresh token should be httpOnly cookie set by backend
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        sessionStorage.setItem(EXPIRES_IN_KEY, tokens.expiresIn.toString());
        sessionStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());
      }
    }
  } catch (error) {
    console.error('Failed to store tokens:', error);
    throw new Error('Failed to securely store authentication tokens');
  }
}

/**
 * Retrieve authentication tokens from secure storage
 */
export async function getTokens(): Promise<AuthTokens | null> {
  try {
    if (isReactNative) {
      // React Native - retrieve from keychain
      // @ts-ignore - global storage placeholder
      const tokens = global.__petforceTokens;
      return tokens || null;

      // TODO: Implement with react-native-keychain
      // const credentials = await Keychain.getGenericPassword({ service: 'com.petforce.auth' });
      // if (credentials) {
      //   return JSON.parse(credentials.password);
      // }
      // return null;
    } else {
      // Web - retrieve from sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
        const expiresIn = sessionStorage.getItem(EXPIRES_IN_KEY);

        if (accessToken && refreshToken && expiresIn) {
          return {
            accessToken,
            refreshToken,
            expiresIn: parseInt(expiresIn, 10),
          };
        }
      }
      return null;
    }
  } catch (error) {
    console.error('Failed to retrieve tokens:', error);
    return null;
  }
}

/**
 * Clear all stored authentication tokens
 */
export async function clearTokens(): Promise<void> {
  try {
    if (isReactNative) {
      // React Native - clear keychain
      // @ts-ignore
      global.__petforceTokens = undefined;

      // TODO: Implement with react-native-keychain
      // await Keychain.resetGenericPassword({ service: 'com.petforce.auth' });
    } else {
      // Web - clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(EXPIRES_IN_KEY);
        sessionStorage.removeItem(TOKEN_TIMESTAMP_KEY);
      }
    }
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    throw new Error('Failed to clear authentication tokens');
  }
}

/**
 * Check if access token is expired
 */
export async function isTokenExpired(): Promise<boolean> {
  try {
    const tokens = await getTokens();
    if (!tokens) return true;

    if (isReactNative) {
      // For React Native, we'd check the token timestamp
      // Placeholder for now
      return false;
    } else {
      if (typeof sessionStorage !== 'undefined') {
        const timestamp = sessionStorage.getItem(TOKEN_TIMESTAMP_KEY);
        const expiresIn = sessionStorage.getItem(EXPIRES_IN_KEY);

        if (!timestamp || !expiresIn) return true;

        const expirationTime = parseInt(timestamp, 10) + parseInt(expiresIn, 10) * 1000;
        return Date.now() > expirationTime;
      }
      return true;
    }
  } catch (error) {
    console.error('Failed to check token expiration:', error);
    return true;
  }
}

/**
 * Store a single value securely
 * General-purpose secure storage for auth-related data
 */
export async function setSecureValue(key: string, value: string): Promise<void> {
  try {
    if (isReactNative) {
      // @ts-ignore
      if (!global.__petforceSecureStorage) {
        // @ts-ignore
        global.__petforceSecureStorage = {};
      }
      // @ts-ignore
      global.__petforceSecureStorage[key] = value;

      // TODO: Implement with react-native-keychain
    } else {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(`petforce_secure_${key}`, value);
      }
    }
  } catch (error) {
    console.error('Failed to store secure value:', error);
    throw new Error('Failed to store secure value');
  }
}

/**
 * Retrieve a single value from secure storage
 */
export async function getSecureValue(key: string): Promise<string | null> {
  try {
    if (isReactNative) {
      // @ts-ignore
      return global.__petforceSecureStorage?.[key] || null;

      // TODO: Implement with react-native-keychain
    } else {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem(`petforce_secure_${key}`);
      }
      return null;
    }
  } catch (error) {
    console.error('Failed to retrieve secure value:', error);
    return null;
  }
}

/**
 * Remove a single value from secure storage
 */
export async function removeSecureValue(key: string): Promise<void> {
  try {
    if (isReactNative) {
      // @ts-ignore
      if (global.__petforceSecureStorage) {
        // @ts-ignore
        delete global.__petforceSecureStorage[key];
      }

      // TODO: Implement with react-native-keychain
    } else {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(`petforce_secure_${key}`);
      }
    }
  } catch (error) {
    console.error('Failed to remove secure value:', error);
    throw new Error('Failed to remove secure value');
  }
}
