import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Authentication UI
 *
 * These tests ensure the UI looks correct and catches styling issues like:
 * - Visited link colors on buttons
 * - Layout shifts
 * - Color inconsistencies
 * - Spacing issues
 */

test.describe('Auth Welcome Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/welcome');
  });

  test('welcome page matches baseline', async ({ page }) => {
    // Wait for all animations to complete
    await page.waitForTimeout(1000);

    // Take screenshot and compare
    await expect(page).toHaveScreenshot('welcome-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('email & password button has correct styling', async ({ page }) => {
    const emailButton = page.getByRole('button', { name: /email.*password/i });

    // Check button exists and is visible
    await expect(emailButton).toBeVisible();

    // Check text color is NOT purple (visited link color)
    const color = await emailButton.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Should be gray-700 (rgb(55, 65, 81)) not purple
    expect(color).not.toContain('128, 0, 128'); // Not purple
    expect(color).not.toContain('85, 26, 139'); // Not dark purple
  });

  test('all auth method buttons have consistent styling', async ({ page }) => {
    const buttons = await page.getByRole('button').all();

    for (const button of buttons) {
      const isVisible = await button.isVisible();
      if (!isVisible) continue;

      // Check border exists
      const borderWidth = await button.evaluate((el) => {
        return window.getComputedStyle(el).borderWidth;
      });
      expect(borderWidth).toBe('2px');

      // Check text is not underlined (link style)
      const textDecoration = await button.evaluate((el) => {
        return window.getComputedStyle(el).textDecoration;
      });
      expect(textDecoration).toContain('none');
    }
  });

  test('hover states work correctly', async ({ page }) => {
    const emailButton = page.getByRole('button', { name: /email.*password/i });

    // Get original background color
    const originalBg = await emailButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Hover over button
    await emailButton.hover();
    await page.waitForTimeout(100); // Let hover transition complete

    // Get hovered background color
    const hoveredBg = await emailButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background should change on hover
    expect(hoveredBg).not.toBe(originalBg);

    // Take screenshot of hover state
    await expect(page).toHaveScreenshot('welcome-page-hover.png', {
      animations: 'disabled',
    });
  });

  test('selected state styling is correct', async ({ page }) => {
    const emailButton = page.getByRole('button', { name: /email.*password/i });

    // Click to select
    await emailButton.click();
    await page.waitForTimeout(300); // Let animation complete

    // Check border color changed to primary
    const borderColor = await emailButton.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // Should be primary color (teal)
    expect(borderColor).toContain('45, 155, 135'); // Primary-500

    // Take screenshot of selected state
    await expect(page).toHaveScreenshot('welcome-page-selected.png', {
      animations: 'disabled',
    });
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/auth/welcome');
    await page.waitForLoadState('networkidle');

    // Should have no console errors
    expect(errors).toHaveLength(0);
  });
});

test.describe('Auth Forms Visual Tests', () => {
  test('login form matches baseline', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('login-form.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('registration form matches baseline', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('register-form.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('password strength indicator colors are correct', async ({ page }) => {
    await page.goto('/auth/register');

    const passwordInput = page.getByLabel(/^password$/i);

    // Test weak password (red)
    await passwordInput.fill('weak');
    await page.waitForTimeout(200);
    let indicator = page.locator('[data-testid="password-strength"]');
    let color = await indicator.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toContain('239, 68, 68'); // red-500

    // Test medium password (yellow/orange)
    await passwordInput.fill('Medium123');
    await page.waitForTimeout(200);
    color = await indicator.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toContain('245, 158, 11'); // amber-500

    // Test strong password (green)
    await passwordInput.fill('StrongPassword123!');
    await page.waitForTimeout(200);
    color = await indicator.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toContain('34, 197, 94'); // green-500
  });
});
