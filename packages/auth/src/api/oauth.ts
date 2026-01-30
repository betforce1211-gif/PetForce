// OAuth Authentication (Google, Apple) using Supabase

import { getSupabaseClient } from './supabase-client';
import type { AuthError, AuthTokens, User } from '../types/auth';
import { TOKEN_EXPIRY_SECONDS, AUTH_ERROR_CODES, REDIRECT_PATHS, OAUTH_CONFIG } from '../config/constants';
import { getOrigin, isWindowAvailable } from '../utils/window-adapter';

export type OAuthProvider = 'google' | 'apple';

/**
 * Initiate OAuth sign-in flow
 * @param provider - OAuth provider ('google' or 'apple')
 * @param redirectTo - Optional redirect URL after authentication
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  redirectTo?: string
): Promise<{ success: boolean; url?: string; error?: AuthError }> {
  try {
    const supabase = getSupabaseClient();

    const finalRedirectTo = redirectTo || getDefaultRedirectUrl();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: finalRedirectTo,
        scopes: provider === 'google' ? OAUTH_CONFIG.GOOGLE_SCOPES : undefined,
        queryParams:
          provider === 'apple'
            ? {
                // Apple-specific options can go here
              }
            : undefined,
      },
    });

    if (error) {
      return {
        success: false,
        error: {
          code: error.name || AUTH_ERROR_CODES.OAUTH_ERROR,
          message: error.message,
        },
      };
    }

    return {
      success: true,
      url: data.url,
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
 * Sign in with Google
 */
export async function signInWithGoogle(redirectTo?: string) {
  return signInWithOAuth('google', redirectTo);
}

/**
 * Sign in with Apple
 */
export async function signInWithApple(redirectTo?: string) {
  return signInWithOAuth('apple', redirectTo);
}

/**
 * Handle OAuth callback
 * Extracts tokens from the URL hash/query parameters after OAuth redirect
 */
export async function handleOAuthCallback(): Promise<{
  success: boolean;
  tokens?: AuthTokens;
  user?: User;
  error?: AuthError;
}> {
  try {
    const supabase = getSupabaseClient();

    // Get session from URL (Supabase handles this automatically)
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        error: {
          code: error.name || AUTH_ERROR_CODES.OAUTH_CALLBACK_ERROR,
          message: error.message,
        },
      };
    }

    if (!session) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.OAUTH_CALLBACK_ERROR,
          message: 'No session found after OAuth callback',
        },
      };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      success: true,
      tokens: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in || TOKEN_EXPIRY_SECONDS,
      },
      user: user
        ? {
            id: user.id,
            email: user.email || '',
            emailVerified: user.email_confirmed_at !== null,
            firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0],
            lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' '),
            profilePhotoUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            authMethods: ['google_sso'] as const,
            preferredAuthMethod: 'google_sso' as const,
            twoFactorEnabled: false,
            createdAt: user.created_at,
            updatedAt: user.updated_at || user.created_at,
          }
        : undefined,
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

  // Fallback
  return REDIRECT_PATHS.NATIVE_CALLBACK;
}
