// Test setup for auth package

import { afterEach, vi } from 'vitest';

// Initialize global objects for node environment
if (typeof global.navigator === 'undefined') {
  global.navigator = {} as any;
}

if (typeof global.window === 'undefined') {
  global.window = {} as any;
}

// Mock navigator for React Native detection
Object.defineProperty(global.navigator, 'product', {
  value: 'Web',
  writable: true,
});

// Mock window.location for auth redirects
Object.defineProperty(global.window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
  },
  writable: true,
});

afterEach(() => {
  vi.clearAllMocks();
});
