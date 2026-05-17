import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.js';
import { setupManagerMocks } from './helpers/api-mocks.js';

test.describe('Manager Pages', () => {
  test.beforeEach(async ({ page }) => {
    await setupManagerMocks(page);
    await loginAs(page, 'LOT_MANAGER');
  });

  // ── Manager Dashboard ─────────────────────────────────────────────────
  test.describe('Dashboard', () => {
    test('should display welcome message', async ({ page }) => {
      await page.goto('/manager');

      await expect(page.getByText('Welcome, Test!')).toBeVisible();
    });

    test('should display stat cards', async ({ page }) => {
      await page.goto('/manager');

      await expect(page.getByText('Total Lots')).toBeVisible();
      await expect(page.getByText('Total Spots')).toBeVisible();
      await expect(page.getByText('Pending Approval').first()).toBeVisible();
      await expect(page.getByText('Occupancy').first()).toBeVisible();
      await expect(page.getByText('Active Now').first()).toBeVisible();
      await expect(page.getByText('Upcoming').first()).toBeVisible();
    });

    test('should display lots table', async ({ page }) => {
      await page.goto('/manager');

      await expect(page.getByText('My Parking Lots').first()).toBeVisible();
      await expect(page.getByText('MG Road Parking').first()).toBeVisible();
      await expect(page.getByText('Koregaon Park Lot').first()).toBeVisible();
    });







    test('should have Manage Lots button', async ({ page }) => {
      await page.goto('/manager');

      await page.click('button:has-text("Manage Lots")');
      await page.waitForURL('**/manager/lots');
    });

    test('should have action buttons in lots table', async ({ page }) => {
      await page.goto('/manager');

      await expect(page.getByText('Spots').first()).toBeVisible();
      await expect(page.getByText('Bookings').first()).toBeVisible();
    });


  });

  // ── My Lots ───────────────────────────────────────────────────────────
  test.describe('My Lots', () => {
    test('should display lots management page', async ({ page }) => {
      await page.goto('/manager/lots');

      await expect(page.locator('h1')).toContainText('My Parking Lots');
      await expect(page.getByText('Register and manage your parking facilities')).toBeVisible();
    });

    test('should list all lots as cards', async ({ page }) => {
      await page.goto('/manager/lots');

      await expect(page.getByText('MG Road Parking')).toBeVisible();
      await expect(page.getByText('Koregaon Park Lot')).toBeVisible();
    });



    test('should show open/close toggle', async ({ page }) => {
      await page.goto('/manager/lots');

      await expect(page.getByText('● Open').first()).toBeVisible();
      await expect(page.getByText('Close Lot').first()).toBeVisible();
    });

    test('should open register lot modal', async ({ page }) => {
      await page.goto('/manager/lots');

      await page.click('button:has-text("+ Register Lot")');

      await expect(page.locator('.modal')).toBeVisible();
      await expect(page.locator('.modal-title')).toContainText('Register Parking Lot');
    });

    test('should have all form fields in register modal', async ({ page }) => {
      await page.goto('/manager/lots');
      await page.click('button:has-text("+ Register Lot")');

      await expect(page.locator('.modal input[name="name"]')).toBeVisible();
      await expect(page.locator('.modal input[name="address"]')).toBeVisible();
      await expect(page.locator('.modal input[name="city"]')).toBeVisible();
      await expect(page.locator('.modal input[name="totalSpots"]')).toBeVisible();
      await expect(page.locator('.modal input[name="latitude"]')).toBeVisible();
      await expect(page.locator('.modal input[name="longitude"]')).toBeVisible();
      await expect(page.locator('.modal input[name="openTime"]')).toBeVisible();
      await expect(page.locator('.modal input[name="closeTime"]')).toBeVisible();
    });








  });
});
