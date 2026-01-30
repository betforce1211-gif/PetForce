import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables to ensure mocks intercept API calls
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright E2E Test Configuration
 * Tucker's comprehensive end-to-end testing setup
 */
const config = defineConfig({
  testDir: './src/features/auth/__tests__/e2e',
  fullyParallel: false, // Run tests sequentially to avoid timeouts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduce retries to save time
  workers: 1, // Always use 1 worker to avoid conflicts
  reporter: 'html',
  timeout: 30000, // 30 second timeout per test
  expect: {
    timeout: 10000, // 10 second timeout for assertions
  },
  globalSetup: './src/features/auth/__tests__/e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000, // 10 second timeout for actions
    navigationTimeout: 30000, // 30 second timeout for navigation (increased)
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

// Only add webServer when not in CI (CI starts server separately)
if (!process.env.CI) {
  config.webServer = {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
    // CRITICAL: Inject test env vars so Vite serves mocked Supabase URL
    // Without this, browser gets real URL from .env and mocks never intercept
    // This ensures the JavaScript bundle contains the mock URL, not the real one
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-for-testing-only',
      NODE_ENV: 'test',
    },
  };
}

export default config;
