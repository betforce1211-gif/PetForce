// Window Adapter - Dependency Injection for window object
// Provides testable abstraction for browser window APIs

/**
 * Window Location interface for dependency injection
 */
export interface WindowLocation {
  readonly origin: string;
  readonly href: string;
  readonly hash: string;
  assign(url: string): void;
}

/**
 * Window interface for dependency injection
 */
export interface WindowAdapter {
  readonly location: WindowLocation;
  readonly innerHeight: number;
  readonly PublicKeyCredential?: any;
}

/**
 * Default browser window adapter
 */
class BrowserWindowAdapter implements WindowAdapter {
  get location(): WindowLocation {
    if (typeof window === 'undefined') {
      throw new Error('Window is not defined - cannot access location in non-browser environment');
    }
    return {
      origin: window.location.origin,
      href: window.location.href,
      hash: window.location.hash,
      assign: (url: string) => {
        window.location.href = url;
      },
    };
  }

  get innerHeight(): number {
    if (typeof window === 'undefined') {
      return 0;
    }
    return window.innerHeight;
  }

  get PublicKeyCredential(): any {
    if (typeof window === 'undefined') {
      return undefined;
    }
    return (window as any).PublicKeyCredential;
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined';
  }
}

/**
 * React Native window adapter
 */
class ReactNativeWindowAdapter implements WindowAdapter {
  get location(): WindowLocation {
    throw new Error('Window location not available in React Native');
  }

  get innerHeight(): number {
    return 0; // Not applicable in React Native
  }

  get PublicKeyCredential(): any {
    return undefined;
  }

  isAvailable(): boolean {
    return false;
  }
}

/**
 * Singleton instance
 */
let windowAdapterInstance: WindowAdapter | null = null;

/**
 * Get the appropriate window adapter based on platform
 */
export function getWindowAdapter(): WindowAdapter {
  if (windowAdapterInstance) {
    return windowAdapterInstance;
  }

  // Detect platform
  const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

  windowAdapterInstance = isReactNative ? new ReactNativeWindowAdapter() : new BrowserWindowAdapter();

  return windowAdapterInstance;
}

/**
 * Set custom window adapter (useful for testing)
 */
export function setWindowAdapter(adapter: WindowAdapter): void {
  windowAdapterInstance = adapter;
}

/**
 * Reset window adapter to default (useful for testing)
 */
export function resetWindowAdapter(): void {
  windowAdapterInstance = null;
}

/**
 * Check if window is available
 */
export function isWindowAvailable(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safe window location origin getter
 * Returns origin if available, otherwise returns fallback
 */
export function getOrigin(fallback: string = ''): string {
  try {
    return getWindowAdapter().location.origin;
  } catch {
    return fallback;
  }
}

/**
 * Safe window location href getter
 */
export function getHref(fallback: string = ''): string {
  try {
    return getWindowAdapter().location.href;
  } catch {
    return fallback;
  }
}

/**
 * Safe window location hash getter
 */
export function getHash(fallback: string = ''): string {
  try {
    return getWindowAdapter().location.hash;
  } catch {
    return fallback;
  }
}

/**
 * Safe window location assignment
 */
export function navigateToUrl(url: string): void {
  try {
    getWindowAdapter().location.assign(url);
  } catch (error) {
    console.error('Failed to navigate:', error);
  }
}

/**
 * Get inner height safely
 */
export function getInnerHeight(fallback: number = 600): number {
  try {
    const height = getWindowAdapter().innerHeight;
    return height > 0 ? height : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Check if WebAuthn is supported
 */
export function isWebAuthnSupported(): boolean {
  try {
    return !!getWindowAdapter().PublicKeyCredential;
  } catch {
    return false;
  }
}
