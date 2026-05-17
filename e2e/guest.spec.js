import { test, expect } from '@playwright/test';
import { setupGuestMocks } from './helpers/api-mocks.js';
import { MOCK_LOTS, MOCK_SPOTS } from './helpers/mock-data.js';

test.describe('Guest / Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupGuestMocks(page);
  });

  // ── Landing Page ────────────────────────────────────────────────────────
  test.describe('Landing Page', () => {



  });

  // ── Guest Lot Detail ──────────────────────────────────────────────────
  test.describe('Guest Lot Detail Page', () => {
    test('should display lot information', async ({ page }) => {
      await page.goto('/guest/lots/1');

      await expect(page.getByText('MG Road Parking')).toBeVisible();
      await expect(page.getByText('123 MG Road, Mumbai')).toBeVisible();
      await expect(page.getByText('● Open')).toBeVisible();
    });

    test('should display spot grid grouped by floor', async ({ page }) => {
      await page.goto('/guest/lots/1');

      await expect(page.getByText('Floor 1')).toBeVisible();
      await expect(page.getByText('Floor 2')).toBeVisible();

      // Spot tiles should be visible
      await expect(page.locator('.spot-tile').first()).toBeVisible();
    });

    test('should display spot legend', async ({ page }) => {
      await page.goto('/guest/lots/1');

      await expect(page.getByText('Available — click to select')).toBeVisible();
      await expect(page.getByText('Reserved')).toBeVisible();
      await expect(page.getByText('Occupied')).toBeVisible();
      await expect(page.getByText('Maintenance')).toBeVisible();
    });

    test('should select an available spot', async ({ page }) => {
      await page.goto('/guest/lots/1');

      // Click the first available spot (A-1)
      await page.locator('.spot-tile.available').first().click();

      // Should show selected spot info in banner
      await expect(page.getByText('Spot A-1 selected')).toBeVisible();
    });

    test('should show booking banner prompting sign in', async ({ page }) => {
      await page.goto('/guest/lots/1');

      await expect(page.getByText('Select an available spot below to book it')).toBeVisible();
    });

    test('should redirect to login when guest tries to book', async ({ page }) => {
      await setupGuestMocks(page);

      await page.goto('/guest/lots/1');
      await page.locator('.spot-tile.available').first().click();

      // Click the Book button
      await page.click('button:has-text("Book Spot")');

      await page.waitForURL('**/login');
    });

    test('should have back to search button', async ({ page }) => {
      await page.goto('/guest/lots/1');

      await expect(page.getByText('← Back to Search')).toBeVisible();
    });

    test('should display bottom CTA with sign in and register', async ({ page }) => {
      await page.goto('/guest/lots/1');

      await expect(page.getByText('Ready to park smarter?')).toBeVisible();
      await expect(page.getByText('Sign In').first()).toBeVisible();
      await expect(page.getByText('Create Free Account →')).toBeVisible();
    });

    test('should show available spots count', async ({ page }) => {
      await page.goto('/guest/lots/1');

      const availableCount = MOCK_SPOTS.filter(s => s.status === 'AVAILABLE').length;
      await expect(page.getByText(`${availableCount} available of ${MOCK_SPOTS.length}`)).toBeVisible();
    });
  });
});
