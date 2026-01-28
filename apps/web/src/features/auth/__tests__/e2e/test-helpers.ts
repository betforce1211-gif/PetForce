/**
 * Test Helpers for E2E Authentication Tests
 * Tucker's reusable testing utilities
 */

import { Page, expect, Route } from '@playwright/test';

/**
 * API Mocking helpers for testing without real Supabase
 */
export const ApiMocking = {
  /**
   * Setup API mocks for all Supabase endpoints
   */
  async setupMocks(page: Page) {
    // Mock Supabase Auth API - Sign Up (New User)
    await page.route('**/auth/v1/signup', async (route: Route) => {
      const request = route.request();
      const body = JSON.parse(request.postData() || '{}');
      const email = body.email;

      // Simulate duplicate email error for known test email
      if (email === 'existing@petforce.test') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'User already registered',
              status: 400,
            },
          }),
        });
        return;
      }

      // Success response for new users
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: `user-${Date.now()}`,
            email: email,
            email_confirmed_at: null, // Email not confirmed yet
            created_at: new Date().toISOString(),
          },
          session: null, // No session until email confirmed
        }),
      });
    });

    // Mock Supabase Auth API - Sign In
    await page.route('**/auth/v1/token?grant_type=password', async (route: Route) => {
      const request = route.request();
      const body = JSON.parse(request.postData() || '{}');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          user: {
            id: 'user-123',
            email: body.email,
            email_confirmed_at: new Date().toISOString(),
          },
        }),
      });
    });

    // Mock other Supabase endpoints if needed
    await page.route('**/auth/v1/**', async (route: Route) => {
      // Default mock for other auth endpoints
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  },

  /**
   * Check if we should use mocks (no real credentials available)
   */
  shouldUseMocks(): boolean {
    return !process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL === 'https://test.supabase.co';
  },
};

/**
 * Test user data generator
 */
export const TestData = {
  /**
   * Generate a unique test email with timestamp
   */
  generateEmail: () => `test-${Date.now()}@petforce.test`,
  
  /**
   * Known existing email for duplicate registration tests
   */
  existingEmail: 'existing@petforce.test',
  
  /**
   * Strong password that meets all requirements
   */
  strongPassword: 'TestP@ssw0rd123!',
  
  /**
   * Weak password for validation testing
   */
  weakPassword: 'weak',
  
  /**
   * Invalid email formats for validation testing
   */
  invalidEmails: [
    'not-an-email',
    '@example.com',
    'user@',
    'user space@example.com',
    'user@domain',
  ],
};

/**
 * Navigation helpers
 */
export const Navigation = {
  /**
   * Navigate to auth page and ensure it loaded
   */
  async goToAuth(page: Page) {
    await page.goto('/auth');
    await expect(page).toHaveURL('/auth');
  },
  
  /**
   * Navigate to auth page with specific mode
   */
  async goToAuthMode(page: Page, mode: 'login' | 'register') {
    await page.goto(`/auth?mode=${mode}`);
    await expect(page).toHaveURL(`/auth?mode=${mode}`);
  },
};

/**
 * Tab interaction helpers
 */
export const Tabs = {
  /**
   * Switch to Sign In tab
   */
  async switchToSignIn(page: Page) {
    await page.getByRole('tab', { name: 'Sign In' }).click();
    await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute('aria-selected', 'true');
  },
  
  /**
   * Switch to Sign Up tab
   */
  async switchToSignUp(page: Page) {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await expect(page.getByRole('tab', { name: 'Sign Up' })).toHaveAttribute('aria-selected', 'true');
  },
  
  /**
   * Assert current active tab
   */
  async assertActiveTab(page: Page, tab: 'Sign In' | 'Sign Up') {
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
  },
};

/**
 * Form interaction helpers
 */
export const Form = {
  /**
   * Fill in login form
   */
  async fillLoginForm(page: Page, email: string, password: string) {
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
  },
  
  /**
   * Fill in registration form (all fields)
   */
  async fillRegistrationForm(page: Page, email: string, password: string, confirmPassword?: string) {
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(confirmPassword ?? password);
  },
  
  /**
   * Submit the form (works for both login and register)
   */
  async submitForm(page: Page, mode: 'login' | 'register') {
    const buttonText = mode === 'login' ? 'Sign in' : 'Create account';
    await page.getByRole('button', { name: buttonText }).click();
  },
  
  /**
   * Complete full registration flow
   */
  async completeRegistration(page: Page, email: string, password: string) {
    await this.fillRegistrationForm(page, email, password);
    await this.submitForm(page, 'register');
  },
  
  /**
   * Complete full login flow
   */
  async completeLogin(page: Page, email: string, password: string) {
    await this.fillLoginForm(page, email, password);
    await this.submitForm(page, 'login');
  },
};

/**
 * Assertion helpers
 */
export const Assertions = {
  /**
   * Assert error message is visible with expected text
   */
  async assertError(page: Page, errorText: string | RegExp) {
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(errorText);
  },
  
  /**
   * Assert duplicate email error with actionable links
   */
  async assertDuplicateEmailError(page: Page) {
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('This email is already registered');
    await expect(errorAlert.getByRole('button', { name: 'Sign in' })).toBeVisible();
  },
  
  /**
   * Assert password strength indicator shows expected level
   */
  async assertPasswordStrength(page: Page, level: 'weak' | 'medium' | 'strong') {
    await expect(page.locator(`text=/${level}/i`)).toBeVisible();
  },
  
  /**
   * Assert successful navigation to verification pending page
   */
  async assertVerificationPending(page: Page, email: string) {
    await expect(page).toHaveURL(/\/auth\/verify-pending/);
    await expect(page).toHaveURL(new RegExp(encodeURIComponent(email)));
    await expect(page.getByText(/check your email/i)).toBeVisible();
  },
  
  /**
   * Assert element is in viewport (no scrolling needed)
   */
  async assertInViewport(page: Page, selector: string) {
    const element = page.locator(selector);
    await expect(element).toBeInViewport();
  },
};

/**
 * Viewport helpers
 */
export const Viewport = {
  /**
   * Set desktop viewport
   */
  async setDesktop(page: Page) {
    await page.setViewportSize({ width: 1280, height: 720 });
  },
  
  /**
   * Set mobile viewport (iPhone 13)
   */
  async setMobile(page: Page) {
    await page.setViewportSize({ width: 375, height: 667 });
  },
  
  /**
   * Set tablet viewport (iPad)
   */
  async setTablet(page: Page) {
    await page.setViewportSize({ width: 768, height: 1024 });
  },
};

/**
 * Debugging helpers
 */
export const Debug = {
  /**
   * Take a screenshot for debugging
   */
  async screenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  },
  
  /**
   * Log current page state for debugging
   */
  async logPageState(page: Page) {
    console.log('Current URL:', page.url());
    console.log('Active element:', await page.evaluate(() => document.activeElement?.tagName));
  },
};
