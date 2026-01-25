// Test setup for auth package

import { afterEach, vi } from 'vitest';

// Mock navigator for React Native detection
Object.defineProperty(global.navigator, 'product', {
  value: 'Web',
  writable: true,
});

// Mock window for web environment
global.window = global.window || ({} as any);

afterEach(() => {
  vi.clearAllMocks();
});
