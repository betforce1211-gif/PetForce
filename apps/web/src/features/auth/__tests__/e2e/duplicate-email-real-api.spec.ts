/**
 * TUCKER'S CRITICAL TEST: Real API Duplicate Email Detection
 * 
 * This test runs against the REAL Supabase API (NO MOCKS) to verify
 * that duplicate email detection works correctly with dzeder14@gmail.com
 * 
 * This test should have caught today's bug!
 */

import { test, expect } from '@playwright/test';

const REAL_DUPLICATE_EMAIL = 'dzeder14@gmail.com';
const TEST_PASSWORD = 'TestP@ssw0rd123!';

test.describe('REAL API: Duplicate Email Detection', () => {
  test.use({
    // Ensure we're testing against real localhost server
    baseURL: 'http://localhost:3000',
  });

  test.beforeEach(async ({ page }) => {
    // NO MOCKS - we're testing the real API!
    console.log('🔥 TUCKER: Testing against REAL API - NO MOCKS');
    
    // Enable console logging to see Tucker's debug output
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('TUCKER') || text.includes('created_at') || text.includes('timeSince')) {
        console.log('🖥️  Browser console:', text);
      }
    });

    await page.goto('/auth');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await page.waitForTimeout(400); // Wait for animation
    await expect(page.getByRole('heading', { name: 'Join the Family' })).toBeVisible();
  });

  test('CRITICAL: blocks registration with dzeder14@gmail.com (existing user)', async ({ page }) => {
    console.log('🔥 TUCKER: Testing duplicate registration with', REAL_DUPLICATE_EMAIL);
    
    // Fill form using same selectors as working tests
    await page.getByLabel('Email address').fill(REAL_DUPLICATE_EMAIL);
    await page.getByLabel('Password', { exact: false }).first().fill(TEST_PASSWORD);
    await page.getByLabel('Confirm password').fill(TEST_PASSWORD);
    
    console.log('✓ Form filled');
    
    // Submit the form
    console.log('📤 Submitting registration form...');
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Wait a bit for the API call and processing
    await page.waitForTimeout(3000);
    
    // CRITICAL ASSERTION: Should show error, NOT redirect to success
    console.log('🔍 Checking for error message...');
    
    // Check if we're still on /auth (didn't redirect)
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    expect(currentUrl).toContain('/auth');
    expect(currentUrl).not.toContain('/verify-pending'); // Should NOT go to success page
    
    // Check for error message
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    
    // Verify error message content
    const errorText = await errorAlert.textContent();
    console.log('📢 Error message:', errorText);
    
    expect(errorText).toMatch(/already registered|already exists/i);
    
    console.log('✅ TUCKER: Duplicate email was correctly rejected!');
  });

  test('shows actionable error with sign-in link', async ({ page }) => {
    console.log('🔥 TUCKER: Testing error message UX');
    
    await page.getByLabel('Email address').fill(REAL_DUPLICATE_EMAIL);
    await page.getByLabel('Password', { exact: false }).first().fill(TEST_PASSWORD);
    await page.getByLabel('Confirm password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();
    
    await page.waitForTimeout(3000);
    
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    
    // Should have sign-in link
    const signInButton = errorAlert.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
    
    // Clicking should switch to sign-in tab
    await signInButton.click();
    await expect(page.getByRole('heading', { name: 'Welcome Back!' })).toBeVisible();
    
    console.log('✅ TUCKER: Error UX is correct!');
  });
});
