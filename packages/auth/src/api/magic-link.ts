// Magic Link (Passwordless) Authentication using Supabase

import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';
import type { AuthError, User } from '../types/auth';
import { TOKEN_EXPIRY_SECONDS, AUTH_ERROR_CODES, REDIRECT_PATHS } from '../config/constants';
import { getOrigin, isWindowAvailable } from '../utils/window-adapter';
import { mapSupabaseUserToUser } from './auth-api';

/**
 * Send a magic link to the user's email
 * @param email - User's email address
 * @param redirectTo - Optional redirect URL after verification (platform-specific)
 */
export async function sendMagicLink(
  email: string,
  redirectTo?: string
): Promise<{ success: boolean; message: string; error?: AuthError }> {
  try {
    const supabase = getSupabaseClient();

    // Determine redirect URL based on platform
    const finalRedirectTo = redirectTo || getDefaultRedirectUrl();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: finalRedirectTo,
        shouldCreateUser: true, // Auto-create user if doesn't exist
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message,
        error: {
          code: error.name || AUTH_ERROR_CODES.MAGIC_LINK_ERROR,
          message: error.message,
        },
      };
    }

    return {
      success: true,
      message: 'Magic link sent! Check your email to sign in.',
    };
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: {
        code: AUTH_ERROR_CODES.UNEXPECTED_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Verify magic link token
 * @param token - The token from the magic link URL
 * @param type - The type of verification (typically 'magiclink' or 'email')
 */
export async function verifyMagicLink(
  token: string,
  type: 'magiclink' | 'email' = 'magiclink'
): Promise<{
  success: boolean;
  tokens?: { accessToken: string; refreshToken: string; expiresIn: number };
  user?: User;
  error?: AuthError;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'magiclink' | 'email',
    });

    if (error) {
      return {
        success: false,
        error: {
          code: error.name || AUTH_ERROR_CODES.VERIFICATION_ERROR,
          message: error.message,
        },
      };
    }

    if (!data.session || !data.user) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.VERIFICATION_ERROR,
          message: 'No session returned from verification',
        },
      };
    }

    return {
      success: true,
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in || TOKEN_EXPIRY_SECONDS,
      },
      user: mapSupabaseUserToUser(data.user),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: AUTH_ERROR_CODES.UNEXPECTED_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Get default redirect URL based on platform
 */
function getDefaultRedirectUrl(): string {
  // Check if running in React Native
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return REDIRECT_PATHS.NATIVE_CALLBACK;
  }

  // Web environment
  if (isWindowAvailable()) {
    return `${getOrigin()}${REDIRECT_PATHS.AUTH_CALLBACK}`;
  }

  // Fallback (shouldn't happen)
  return REDIRECT_PATHS.NATIVE_CALLBACK;
}
