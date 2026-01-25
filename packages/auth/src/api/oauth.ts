// OAuth Authentication (Google, Apple) using Supabase

import { getSupabaseClient } from './supabase-client';
import type { AuthError, AuthTokens, User } from '../types/auth';

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
        scopes: provider === 'google' ? 'email profile' : undefined,
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
          code: error.name || 'OAUTH_ERROR',
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
        code: 'UNEXPECTED_ERROR',
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
          code: error.name || 'OAUTH_CALLBACK_ERROR',
          message: error.message,
        },
      };
    }

    if (!session) {
      return {
        success: false,
        error: {
          code: 'OAUTH_CALLBACK_ERROR',
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
        expiresIn: session.expires_in || 900,
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

  // Fallback
  return 'petforce://auth/callback';
}
