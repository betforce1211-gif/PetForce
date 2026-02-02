import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/*.spec.ts',  // Exclude Playwright E2E specs
      '**/*.spec.tsx', // Exclude Playwright E2E specs
      '**/e2e/**',     // Exclude E2E test directories
      '**/visual/**',  // Exclude visual test directories
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@petforce/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@petforce/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
