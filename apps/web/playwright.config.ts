import { defineConfig, devices } from '@playwright/test';

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
  };
}

export default config;
