/**
 * Deep Link Handling Utilities
 *
 * Handles deep links for household invites and other app features.
 *
 * Supported deep link formats:
 * - petforce://household/join?code=XXXX-XXXX-XXXX&name=Household+Name
 * - https://petforce.app/household/join?code=XXXX-XXXX-XXXX
 * - https://app.petforce.com/household/join?code=XXXX-XXXX-XXXX
 *
 * Features:
 * - Deep link parsing
 * - Navigation handling
 * - Universal link support (iOS)
 * - App link support (Android)
 */

import { Linking } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';

export interface DeepLinkData {
  type: 'household_join' | 'household_create' | 'auth' | 'unknown';
  params: Record<string, string>;
}

/**
 * Parse deep link URL
 *
 * @param url - Deep link URL
 * @returns Parsed deep link data
 */
export function parseDeepLink(url: string): DeepLinkData | null {
  try {
    // Handle both custom scheme and universal links
    const urlObj = new URL(
      url.replace('petforce://', 'https://petforce.app/')
    );

    const path = urlObj.pathname;
    const params: Record<string, string> = {};

    // Extract query parameters
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Determine deep link type based on path
    if (path.includes('/household/join')) {
      return {
        type: 'household_join',
        params,
      };
    }

    if (path.includes('/household/create')) {
      return {
        type: 'household_create',
        params,
      };
    }

    if (path.includes('/auth')) {
      return {
        type: 'auth',
        params,
      };
    }

    return {
      type: 'unknown',
      params,
    };
  } catch (error) {
    console.error('Failed to parse deep link', error);
    return null;
  }
}

/**
 * Handle deep link navigation
 *
 * @param url - Deep link URL
 * @param navigation - React Navigation ref
 * @returns True if handled, false otherwise
 */
export function handleDeepLink(
  url: string,
  navigation: NavigationContainerRef<any> | null
): boolean {
  if (!navigation) {
    console.warn('Navigation not ready for deep link', url);
    return false;
  }

  const deepLink = parseDeepLink(url);

  if (!deepLink) {
    console.warn('Failed to parse deep link', url);
    return false;
  }

  try {
    switch (deepLink.type) {
      case 'household_join':
        const inviteCode = deepLink.params.code;
        const householdName = deepLink.params.name;

        if (!inviteCode) {
          console.error('Missing invite code in deep link');
          return false;
        }

        // Navigate to join household screen with pre-filled code
        navigation.navigate('JoinHousehold', {
          inviteCode,
          householdName: householdName ? decodeURIComponent(householdName) : undefined,
        });
        return true;

      case 'household_create':
        // Navigate to create household screen
        navigation.navigate('CreateHousehold');
        return true;

      case 'auth':
        // Handle auth-related deep links (OAuth callback, magic link, etc.)
        const action = deepLink.params.action;

        if (action === 'oauth_callback') {
          navigation.navigate('OAuthCallback', deepLink.params);
          return true;
        }

        if (action === 'magic_link') {
          navigation.navigate('MagicLinkCallback', deepLink.params);
          return true;
        }

        return false;

      default:
        console.warn('Unknown deep link type', deepLink.type);
        return false;
    }
  } catch (error) {
    console.error('Failed to handle deep link', error);
    return false;
  }
}

/**
 * Set up deep link listener
 *
 * @param navigation - React Navigation ref
 * @returns Cleanup function
 */
export function setupDeepLinkListener(
  navigation: NavigationContainerRef<any> | null
): () => void {
  // Handle initial URL (app opened via deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('Initial deep link:', url);
      setTimeout(() => {
        handleDeepLink(url, navigation);
      }, 1000); // Wait for navigation to be ready
    }
  });

  // Handle deep links while app is running
  const subscription = Linking.addEventListener('url', (event) => {
    console.log('Deep link received:', event.url);
    handleDeepLink(event.url, navigation);
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}

/**
 * Generate deep link URL
 *
 * @param type - Deep link type
 * @param params - URL parameters
 * @returns Deep link URL
 */
export function generateDeepLink(
  type: 'household_join' | 'household_create' | 'auth',
  params: Record<string, string>
): string {
  const baseURL = 'petforce://';

  switch (type) {
    case 'household_join':
      const queryString = new URLSearchParams(params).toString();
      return `${baseURL}household/join?${queryString}`;

    case 'household_create':
      return `${baseURL}household/create`;

    case 'auth':
      const authQuery = new URLSearchParams(params).toString();
      return `${baseURL}auth?${authQuery}`;

    default:
      return baseURL;
  }
}

/**
 * Generate universal link (web fallback)
 *
 * @param type - Deep link type
 * @param params - URL parameters
 * @returns Universal link URL
 */
export function generateUniversalLink(
  type: 'household_join' | 'household_create' | 'auth',
  params: Record<string, string>
): string {
  const baseURL = 'https://petforce.app/';

  switch (type) {
    case 'household_join':
      const queryString = new URLSearchParams(params).toString();
      return `${baseURL}household/join?${queryString}`;

    case 'household_create':
      return `${baseURL}household/create`;

    case 'auth':
      const authQuery = new URLSearchParams(params).toString();
      return `${baseURL}auth?${authQuery}`;

    default:
      return baseURL;
  }
}
