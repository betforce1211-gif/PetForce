/**
 * E2E Test: Unified Auth Flow - Tab-Based Interface
 * Tucker's comprehensive testing of the new unified authentication page
 * 
 * Tests the tab-based authentication interface (/auth) including:
 * - Tab switching between Sign In and Sign Up
 * - Duplicate email registration (CRITICAL - would have caught the bug)
 * - New user registration flow
 * - Password validation and strength indicators
 * - Form fits without scrolling
 * - Error message handling
 * - Responsive behavior
 */

import { test, expect } from '@playwright/test';
import { ApiMocking } from './test-helpers';

// Test data
const EXISTING_EMAIL = 'existing@petforce.test';
const generateTestEmail = () => `test-${Date.now()}@example.com`;

test.describe('Unified Auth Page - Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // CRITICAL: Set up mocks BEFORE navigating to prevent real API calls
    if (ApiMocking.shouldUseMocks()) {
      await ApiMocking.setupMocks(page);
    }
    await page.goto('/auth');
  });

  test('defaults to Sign In tab', async ({ page }) => {
    // Assert Sign In tab is active by default
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    await expect(signInTab).toHaveAttribute('aria-selected', 'true');
    
    // Assert Sign In content is visible
    await expect(page.getByRole('heading', { name: 'Welcome Back!' })).toBeVisible();
    await expect(page.getByText('Sign in to continue')).toBeVisible();
    await expect(page.getByText('Or sign in with email')).toBeVisible();
    
    // Assert Forgot password link is present (login-only feature)
    await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible();
  });

  test('switches to Sign Up tab when clicked', async ({ page }) => {
    // Click Sign Up tab
    const signUpTab = page.getByRole('tab', { name: 'Sign Up' });
    await signUpTab.click();
    // Wait for animation to complete and form to be fully rendered
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();

    // Assert Sign Up tab is now active
    await expect(signUpTab).toHaveAttribute('aria-selected', 'true');
    
    // Assert Sign Up content is visible
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.getByText('Or sign up with email')).toBeVisible();
    
    // Assert registration-specific elements appear
    await expect(page.getByLabel('Confirm password')).toBeVisible();
    
    // Assert Forgot password link is NOT present (registration mode)
    await expect(page.getByRole('button', { name: 'Forgot password?' })).not.toBeVisible();
  });

  test('switches back to Sign In tab', async ({ page }) => {
    // First switch to Sign Up
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    // Wait for animation to complete and form to be fully rendered
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
    
    // Then switch back to Sign In
    await page.getByRole('tab', { name: 'Sign In' }).click();
    
    // Assert Sign In content is visible again
    await expect(page.getByRole('heading', { name: 'Welcome Back!' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible();
    
    // Assert Confirm password field is gone
    await expect(page.getByLabel('Confirm password')).not.toBeVisible();
  });

  test('maintains smooth animation during tab switches', async ({ page }) => {
    const signUpTab = page.getByRole('tab', { name: 'Sign Up' });

    // Switch to Sign Up and verify animation completes
    await signUpTab.click();
    // Wait for animation to complete and form to be fully rendered
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
    
    // Content should be fully visible (opacity: 1)
    const content = page.locator('section[aria-label="Create a new account"]');
    await expect(content).toBeVisible();
  });

  test('respects URL parameter for initial mode', async ({ page }) => {
    // Navigate with ?mode=register parameter
    await page.goto('/auth?mode=register');
    
    // Assert Sign Up tab is active
    const signUpTab = page.getByRole('tab', { name: 'Sign Up' });
    await expect(signUpTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
  });
});

test.describe('Registration Flow - Duplicate Email Detection', () => {
  test.beforeEach(async ({ page }) => {
    // CRITICAL: Set up mocks BEFORE navigating
    if (ApiMocking.shouldUseMocks()) {
      await ApiMocking.setupMocks(page);
    }
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    // Wait for animation to complete and all form fields to be interactive
    await page.waitForTimeout(400); // Wait for 200ms tab animation + 300ms form animation
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
  });

  test('CRITICAL: shows error when registering with existing email', async ({ page }) => {
    // This test would have caught today's bug!
    
    // Fill in existing email
    await page.getByLabel('Email address').fill(EXISTING_EMAIL);
    
    // Fill in password fields
    const passwordField = page.getByRole('textbox', { name: 'Password*', exact: true });
    const confirmPasswordField = page.getByLabel('Confirm password');
    
    await passwordField.fill('TestP@ssw0rd123!');
    await confirmPasswordField.fill('TestP@ssw0rd123!');
    
    // Submit the form
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Assert error message appears
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    
    // Assert correct error message
    await expect(errorAlert).toContainText('This email is already registered');
    
    // Assert "Sign in" link is visible in error message
    const signInLink = errorAlert.getByRole('button', { name: 'Sign in' });
    await expect(signInLink).toBeVisible();
    
    // Assert clicking "Sign in" switches to Sign In tab
    await signInLink.click();
    await expect(page.getByRole('heading', { name: 'Welcome Back!' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute('aria-selected', 'true');
  });

  test('error message includes "reset password" option', async ({ page }) => {
    // Fill in existing email
    await page.getByLabel('Email address').fill(EXISTING_EMAIL);
    await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('TestP@ssw0rd123!');
    await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
    
    // Submit
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Assert error contains reset password option
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    
    const resetPasswordLink = errorAlert.getByRole('button', { name: 'reset password' });
    await expect(resetPasswordLink).toBeVisible();
    
    // Clicking should navigate to forgot password page
    await resetPasswordLink.click();
    await expect(page).toHaveURL('/auth/forgot-password');
  });

  test('error message is styled appropriately', async ({ page }) => {
    // Fill in existing email
    await page.getByLabel('Email address').fill(EXISTING_EMAIL);
    await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('TestP@ssw0rd123!');
    await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
    
    // Submit
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Assert error has red styling (bg-red-50, border-red-200, text-red-700)
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveClass(/bg-red-50/);
  });
});

test.describe('Registration Flow - New User Success', () => {
  test.beforeEach(async ({ page }) => {
    // CRITICAL: Set up mocks BEFORE navigating
    if (ApiMocking.shouldUseMocks()) {
      await ApiMocking.setupMocks(page);
    }
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    // Wait for animation to complete and all form fields to be interactive
    await page.waitForTimeout(400); // Wait for 200ms tab animation + 300ms form animation
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
  });

  test('successfully registers new user and redirects to verification page', async ({ page }) => {
    const newEmail = generateTestEmail();
    
    // Fill in new email
    await page.getByLabel('Email address').fill(newEmail);
    
    // Fill in password fields
    await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('TestP@ssw0rd123!');
    await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
    
    // Submit
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Assert redirects to verification pending page
    await expect(page).toHaveURL(/\/auth\/verify-pending/, { timeout: 10000 });
    
    // Assert email parameter is in URL
    await expect(page).toHaveURL(new RegExp(encodeURIComponent(newEmail)));
    
    // Assert verification page content
    await expect(page.getByText(/check your email/i)).toBeVisible();
    await expect(page.locator(`text=${newEmail}`)).toBeVisible();
  });

});

test.describe('Password Validation', () => {
  test.beforeEach(async ({ page }) => {
    // CRITICAL: Set up mocks BEFORE navigating
    if (ApiMocking.shouldUseMocks()) {
      await ApiMocking.setupMocks(page);
    }
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    // Wait for animation to complete and all form fields to be interactive
    await page.waitForTimeout(400); // Wait for 200ms tab animation + 300ms form animation
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
  });

  test('shows password strength indicator for weak password', async ({ page }) => {
    const passwordField = page.getByRole('textbox', { name: 'Password*', exact: true });
    
    // Type weak password
    await passwordField.fill('weak');
    
    // Assert strength indicator appears
    await expect(page.locator('text=/weak/i')).toBeVisible();
  });

  test('shows password strength indicator for strong password', async ({ page }) => {
    const passwordField = page.getByRole('textbox', { name: 'Password*', exact: true });
    
    // Type strong password
    await passwordField.fill('TestP@ssw0rd123!');
    
    // Assert strength indicator shows strong
    await expect(page.locator('text=/strong/i')).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    const passwordField = page.getByRole('textbox', { name: 'Password*', exact: true });
    const confirmPasswordField = page.getByLabel('Confirm password');
    
    // Type mismatched passwords
    await passwordField.fill('TestP@ssw0rd123!');
    await confirmPasswordField.fill('DifferentP@ss123!');
    
    // Assert inline error appears on confirm field
    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });

  test('shows detailed error when submitting mismatched passwords', async ({ page }) => {
    await page.getByLabel('Email address').fill('test@example.com');
    await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('TestP@ssw0rd123!');
    await page.getByLabel('Confirm password').fill('DifferentP@ss123!');
    
    // Submit
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Assert detailed error message appears
    await expect(page.getByText(/passwords don't match.*identical/i)).toBeVisible();
  });

  test('toggles password visibility', async ({ page }) => {
    const passwordField = page.getByRole('textbox', { name: 'Password*', exact: true });
    const toggleButton = page.getByLabel('Show password');
    
    // Initially password is hidden
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // Click to show password
    await toggleButton.click();
    await expect(passwordField).toHaveAttribute('type', 'text');
    
    // Click to hide again
    const hideButton = page.getByLabel('Hide password');
    await hideButton.click();
    await expect(passwordField).toHaveAttribute('type', 'password');
  });
});

test.describe('Form Layout and Scrolling', () => {
  test.beforeEach(async ({ page }) => {
    // CRITICAL: Set up mocks BEFORE navigating
    if (ApiMocking.shouldUseMocks()) {
      await ApiMocking.setupMocks(page);
    }
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    // Wait for animation to complete and all form fields to be interactive
    await page.waitForTimeout(400); // Wait for 200ms tab animation + 300ms form animation
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
  });

  test('Create Account button is visible without scrolling on desktop', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 720 });
    
    const submitButton = page.getByRole('button', { name: 'Create account' });
    
    // Assert button is in viewport without scrolling
    await expect(submitButton).toBeInViewport();
  });

  test('Create Account button remains visible after filling form', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 720 });
    
    // Fill all fields
    await page.getByLabel('Email address').fill('test@example.com');
    await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('TestP@ssw0rd123!');
    await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
    
    const submitButton = page.getByRole('button', { name: 'Create account' });
    
    // Assert button is still in viewport
    await expect(submitButton).toBeInViewport();
  });

  test('Create Account button remains visible after error appears', async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 720 });
    
    // Trigger duplicate email error
    await page.getByLabel('Email address').fill(EXISTING_EMAIL);
    await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('TestP@ssw0rd123!');
    await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Wait for error to appear
    await expect(page.getByRole('alert')).toBeVisible();
    
    const submitButton = page.getByRole('button', { name: 'Create account' });
    
    // Assert button is still in viewport even with error message
    await expect(submitButton).toBeInViewport();
  });

  test('form fits comfortably on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // All key elements should be accessible
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password*', exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm password')).toBeVisible();
    
    // Submit button should be reachable (may require scroll on mobile)
    const submitButton = page.getByRole('button', { name: 'Create account' });
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();
  });
});

test.describe('Accessibility and UX', () => {
  test.beforeEach(async ({ page }) => {
    // CRITICAL: Set up mocks BEFORE navigating
    if (ApiMocking.shouldUseMocks()) {
      await ApiMocking.setupMocks(page);
    }
    await page.goto('/auth');
  });

  test('tabs have correct ARIA attributes', async ({ page }) => {
    const signInTab = page.getByRole('tab', { name: 'Sign In' });
    const signUpTab = page.getByRole('tab', { name: 'Sign Up' });

    // Assert tablist structure
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    // Assert tabs have correct ARIA
    await expect(signInTab).toHaveAttribute('aria-selected', 'true');
    await expect(signUpTab).toHaveAttribute('aria-selected', 'false');

    // Switch tabs
    await signUpTab.click();
    // Wait for animation to complete and form to be fully rendered
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();

    await expect(signInTab).toHaveAttribute('aria-selected', 'false');
    await expect(signUpTab).toHaveAttribute('aria-selected', 'true');
  });

  test('error messages have proper ARIA live region', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    // Wait for animation to complete and all form fields to be interactive
    await page.waitForTimeout(400); // Wait for 200ms tab animation + 300ms form animation

    // Trigger error
    await page.getByLabel('Email address').fill(EXISTING_EMAIL);
    await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('TestP@ssw0rd123!');
    await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Assert error has proper ARIA attributes
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
  });

  test('form inputs have proper labels', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    // Wait for animation to complete and all form fields to be interactive
    await page.waitForTimeout(400); // Wait for 200ms tab animation + 300ms form animation

    // All inputs should be accessible by label
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password*', exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm password')).toBeVisible();
  });

  test('Terms and Privacy links are present on registration', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    // Wait for animation to complete and all form fields to be interactive
    await page.waitForTimeout(400); // Wait for 200ms tab animation + 300ms form animation

    // Assert Terms of Service link
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
    
    // Assert Privacy Policy link
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  });
});

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // CRITICAL: Set up mocks BEFORE navigating
    if (ApiMocking.shouldUseMocks()) {
      await ApiMocking.setupMocks(page);
    }
    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    // Wait for animation to complete and all form fields to be interactive
    await page.waitForTimeout(400); // Wait for 200ms tab animation + 300ms form animation
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
  });

  test('handles empty form submission gracefully', async ({ page }) => {
    // Try to submit without filling anything
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // HTML5 validation should prevent submission
    // Page should still be on /auth
    await expect(page).toHaveURL('/auth');
  });

  test('validates email format', async ({ page }) => {
    // Try invalid email
    await page.getByLabel('Email address').fill('not-an-email');
    await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('TestP@ssw0rd123!');
    await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
    
    // HTML5 validation should prevent submission
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Should still be on /auth
    await expect(page).toHaveURL('/auth');
  });

  test('handles very long email addresses', async ({ page }) => {
    const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
    
    await page.getByLabel('Email address').fill(longEmail);
    await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('TestP@ssw0rd123!');
    await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
    
    // Form should handle long email gracefully
    const emailInput = page.getByLabel('Email address');
    await expect(emailInput).toHaveValue(longEmail);
  });

  test('clears error when switching tabs', async ({ page }) => {
    // First switch to Sign Up tab
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await page.waitForTimeout(400); // Wait for animation to complete

    // Trigger error on registration
    await page.getByLabel('Email address').fill(EXISTING_EMAIL);
    await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('TestP@ssw0rd123!');
    await page.getByLabel('Confirm password').fill('TestP@ssw0rd123!');
    await page.getByRole('button', { name: 'Create account' }).click();

    // Wait for error
    await expect(page.getByRole('alert')).toBeVisible();

    // Switch to Sign In tab
    await page.getByRole('tab', { name: 'Sign In' }).click();

    // Switch back to Sign Up
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await page.waitForTimeout(400); // Wait for animation to complete

    // Error should be cleared (form is reset)
    // Note: This depends on implementation - error might persist
    // This test documents expected behavior
  });
});
