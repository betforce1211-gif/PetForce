/**
 * Household Accessibility Tests
 *
 * Tests WCAG 2.1 AA compliance for household management features.
 * Covers keyboard navigation, screen reader support, and color contrast.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Household Accessibility Tests', () => {
  test.describe('Create Household Form', () => {
    test('should be accessible (no axe violations)', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/household/create`);

      // Run axe accessibility audit
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/household/create`);

      // Start at the first focusable element
      await page.keyboard.press('Tab');

      // Should focus on household name input
      const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
      await expect(nameInput).toBeFocused();

      // Tab to description textarea
      await page.keyboard.press('Tab');
      const descriptionInput = page.locator('textarea[name="description"], textarea[id*="description"]').first();
      await expect(descriptionInput).toBeFocused();

      // Tab to submit button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Skip cancel button if present

      // Enter to submit (would submit form if filled)
      await page.keyboard.press('Enter');
    });

    test('should have visible focus indicators', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/household/create`);

      // Tab to first input
      await page.keyboard.press('Tab');

      // Check that focused element has visible outline/ring
      const focusedElement = page.locator(':focus');
      const outline = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          outlineColor: styles.outlineColor,
          outlineWidth: styles.outlineWidth,
        };
      });

      // Should have either outline or box-shadow (focus ring)
      const hasFocusIndicator =
        (outline.outline !== 'none' && outline.outlineWidth !== '0px') ||
        (outline.boxShadow !== 'none' && outline.boxShadow.length > 0);

      expect(hasFocusIndicator).toBeTruthy();
    });

    test('should have proper form labels and ARIA attributes', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/household/create`);

      // Check form has aria-label
      const form = page.locator('form').first();
      const formLabel = await form.getAttribute('aria-label');
      expect(formLabel).toBeTruthy();

      // Check inputs have labels
      const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
      const nameInputId = await nameInput.getAttribute('id');

      if (nameInputId) {
        // Check for associated label
        const label = page.locator(`label[for="${nameInputId}"]`);
        const labelCount = await label.count();
        expect(labelCount).toBeGreaterThan(0);
      }

      // Check for aria-describedby on inputs
      const ariaDescribedby = await nameInput.getAttribute('aria-describedby');
      if (ariaDescribedby) {
        // Verify the description element exists
        const descriptionElements = ariaDescribedby.split(' ');
        for (const id of descriptionElements) {
          const element = page.locator(`#${id}`);
          await expect(element).toBeAttached();
        }
      }
    });

    test('should have sufficient color contrast (WCAG AA)', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/household/create`);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include('form')
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === 'color-contrast'
      );

      expect(contrastViolations).toHaveLength(0);
    });
  });

  test.describe('Join Household Form', () => {
    test('should be accessible (no axe violations)', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/household/join`);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/household/join`);

      // Tab to invite code input
      await page.keyboard.press('Tab');

      const codeInput = page.locator('input[name*="code"], input[id*="code"]').first();
      await expect(codeInput).toBeFocused();

      // Type invite code
      await page.keyboard.type('TEST-CODE-HERE');

      // Tab to submit button
      await page.keyboard.press('Tab');

      // Verify button is focused
      const submitButton = page.locator('button[type="submit"]').first();
      await expect(submitButton).toBeFocused();
    });
  });

  test.describe('Household Dashboard', () => {
    test('should be accessible (no axe violations)', async ({ page }) => {
      // Note: This test assumes user is logged in and has a household
      await page.goto(`${BASE_URL}/dashboard`);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should support keyboard navigation through member list', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Tab through the page
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }

      // Verify at least some interactive elements are reachable
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeAttached();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/household/create`);

      // Check for proper heading structure (h1 -> h2 -> h3, no skipping)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const headingLevels = await Promise.all(
        headings.map(async (h) => {
          const tagName = await h.evaluate((el) => el.tagName);
          return parseInt(tagName.replace('H', ''), 10);
        })
      );

      // Check that headings don't skip levels
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    });

    test('should have proper landmark regions', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Check for main landmark
      const mainLandmark = page.locator('main, [role="main"]');
      await expect(mainLandmark).toBeAttached();

      // Check for navigation landmark (if exists)
      const navLandmark = page.locator('nav, [role="navigation"]');
      const navCount = await navLandmark.count();
      // Navigation may or may not exist, but if it does, it should be valid
      if (navCount > 0) {
        await expect(navLandmark.first()).toBeAttached();
      }
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Find all images
      const images = await page.locator('img').all();

      for (const img of images) {
        // Each image should have alt attribute (can be empty for decorative images)
        const alt = await img.getAttribute('alt');
        expect(alt !== null).toBeTruthy();
      }
    });
  });

  test.describe('200% Zoom Support', () => {
    test('should not have horizontal scroll at 200% zoom', async ({ page, context }) => {
      // Set viewport to standard desktop size
      await page.setViewportSize({ width: 1280, height: 720 });

      // Navigate to page
      await page.goto(`${BASE_URL}/onboarding/household/create`);

      // Simulate 200% zoom by scaling the page
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      // Wait for layout to settle
      await page.waitForTimeout(500);

      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    });

    test('should have all content visible at 200% zoom', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`${BASE_URL}/onboarding/household/create`);

      // Apply 200% zoom
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      await page.waitForTimeout(500);

      // Verify submit button is still visible
      const submitButton = page.locator('button[type="submit"]').first();
      await expect(submitButton).toBeVisible();

      // Verify form inputs are visible
      const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
      await expect(nameInput).toBeVisible();
    });
  });

  test.describe('Error Announcements', () => {
    test('should have proper error announcements with role="alert"', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/household/create`);

      // Submit empty form to trigger error
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Wait for error to appear
      await page.waitForTimeout(300);

      // Check for error with role="alert" (for screen readers)
      const errorAlert = page.locator('[role="alert"]');
      const alertCount = await errorAlert.count();

      if (alertCount > 0) {
        // Verify error is visible
        await expect(errorAlert.first()).toBeVisible();

        // Verify error has text content
        const errorText = await errorAlert.first().textContent();
        expect(errorText).toBeTruthy();
        expect(errorText!.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Interactive Elements', () => {
    test('should have proper button labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/household/create`);

      // Find all buttons
      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        // Each button should have either:
        // 1. Text content
        // 2. aria-label
        // 3. aria-labelledby

        const textContent = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledby = await button.getAttribute('aria-labelledby');

        const hasAccessibleName =
          (textContent && textContent.trim().length > 0) ||
          (ariaLabel && ariaLabel.length > 0) ||
          (ariaLabelledby && ariaLabelledby.length > 0);

        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('should have proper link labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Find all links
      const links = await page.locator('a').all();

      for (const link of links) {
        const textContent = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');

        const hasAccessibleName =
          (textContent && textContent.trim().length > 0) ||
          (ariaLabel && ariaLabel.length > 0);

        expect(hasAccessibleName).toBeTruthy();
      }
    });
  });
});
