// Magic Link (Passwordless) Authentication using Supabase

import { getSupabaseClient } from './supabase-client';
import type { AuthError } from '../types/auth';

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
          code: error.name || 'MAGIC_LINK_ERROR',
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
        code: 'UNEXPECTED_ERROR',
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
  user?: any;
  error?: AuthError;
}> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any,
    });

    if (error) {
      return {
        success: false,
        error: {
          code: error.name || 'VERIFICATION_ERROR',
          message: error.message,
        },
      };
    }

    if (!data.session || !data.user) {
      return {
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: 'No session returned from verification',
        },
      };
    }

    return {
      success: true,
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in || 900,
      },
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
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
    return 'petforce://auth/callback';
  }

  // Web environment
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }

  // Fallback (shouldn't happen)
  return 'petforce://auth/callback';
}
