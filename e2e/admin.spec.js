import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.js';
import { setupAdminMocks } from './helpers/api-mocks.js';

test.describe('Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminMocks(page);
    await loginAs(page, 'ADMIN');
  });

  // ── Admin Dashboard ───────────────────────────────────────────────────
  test.describe('Dashboard', () => {


    test('should display platform stat cards', async ({ page }) => {
      await page.goto('/admin');

      await expect(page.getByText('Active Lots')).toBeVisible();
      await expect(page.getByText('Total Spots')).toBeVisible();
      await expect(page.getByText('Bookings Today')).toBeVisible();
      await expect(page.getByText('Revenue Today')).toBeVisible();
    });

    test('should show correct stat values', async ({ page }) => {
      await page.goto('/admin');

      await expect(page.locator('.stat-value', { hasText: '5' }).first()).toBeVisible();     // totalActiveLots
      await expect(page.locator('.stat-value', { hasText: '250' }).first()).toBeVisible();   // totalSpots
      await expect(page.locator('.stat-value', { hasText: '45' }).first()).toBeVisible();    // bookingsToday
    });

    test('should display platform occupancy bar', async ({ page }) => {
      await page.goto('/admin');

      await expect(page.getByText('Platform Occupancy Rate')).toBeVisible();
      await expect(page.locator('.occupancy-bar')).toBeVisible();
      await expect(page.getByText('48.0%')).toBeVisible();
    });

    test('should display quick links cards', async ({ page }) => {
      await page.goto('/admin');

      await expect(page.locator('.card:has-text("Manage Users")').first()).toBeVisible();
      await expect(page.locator('.card:has-text("Approve Lots")').first()).toBeVisible();
      await expect(page.getByText('All Bookings')).toBeVisible();
      await expect(page.getByText('Platform Analytics')).toBeVisible();
    });

    test('should navigate to manage users', async ({ page }) => {
      await page.goto('/admin');

      await page.locator('.card:has-text("Manage Users")').click();
      await page.waitForURL('**/admin/users');
    });

    test('should navigate to all bookings', async ({ page }) => {
      await page.goto('/admin');

      await page.locator('.card:has-text("All Bookings")').click();
      await page.waitForURL('**/admin/bookings');
    });
  });

  // ── Manage Users ──────────────────────────────────────────────────────
  test.describe('Manage Users', () => {
    test('should display users page header with count', async ({ page }) => {
      await page.goto('/admin/users');

      await expect(page.locator('h1')).toContainText('Manage Users');
      await expect(page.getByText('4 total users')).toBeVisible();
    });

    test('should display users table', async ({ page }) => {
      await page.goto('/admin/users');

      await expect(page.locator('td:has-text("Test Driver")').first()).toBeVisible();
      await expect(page.locator('td:has-text("Test Manager")').first()).toBeVisible();
      await expect(page.locator('td:has-text("Test Admin")').first()).toBeVisible();
      await expect(page.locator('td:has-text("Suspended User")').first()).toBeVisible();
    });

    test('should show role badges', async ({ page }) => {
      await page.goto('/admin/users');

      await expect(page.locator('.badge:has-text("DRIVER")').first()).toBeVisible();
      await expect(page.locator('.badge:has-text("LOT MANAGER")').first()).toBeVisible();
      await expect(page.locator('.badge:has-text("ADMIN")').first()).toBeVisible();
    });

    test('should show active/suspended status', async ({ page }) => {
      await page.goto('/admin/users');

      await expect(page.getByText('● Active').first()).toBeVisible();
      await expect(page.getByText('● Suspended')).toBeVisible();
    });

    test('should show Suspend button for active users', async ({ page }) => {
      await page.goto('/admin/users');

      await expect(page.getByText('Suspend').first()).toBeVisible();
    });

    test('should show Activate button for suspended users', async ({ page }) => {
      await page.goto('/admin/users');

      await expect(page.getByText('Activate')).toBeVisible();
    });

    test('should show Delete button for all users', async ({ page }) => {
      await page.goto('/admin/users');

      const deleteBtns = page.getByRole('button', { name: 'Delete' });
      await expect(deleteBtns.first()).toBeVisible();
    });

    test('should have search input', async ({ page }) => {
      await page.goto('/admin/users');

      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    });

    test('should filter users by search term', async ({ page }) => {
      await page.goto('/admin/users');

      await page.fill('input[placeholder*="Search"]', 'driver');

      // Should show only driver users
      await expect(page.locator('td:has-text("Test Driver")').first()).toBeVisible();
      await expect(page.locator('td:has-text("Test Admin")').first()).not.toBeVisible();
    });

    test('should have role filter dropdown', async ({ page }) => {
      await page.goto('/admin/users');

      const roleSelect = page.locator('select');
      await expect(roleSelect).toBeVisible();

      const options = await roleSelect.locator('option').allTextContents();
      expect(options).toContain('All Roles');
      expect(options).toContain('Drivers');
      expect(options).toContain('Managers');
      expect(options).toContain('Admins');
    });

    test('should filter users by role', async ({ page }) => {
      await page.goto('/admin/users');

      await page.selectOption('select', 'LOT_MANAGER');

      await expect(page.locator('td:has-text("Test Manager")').first()).toBeVisible();
      await expect(page.locator('td:has-text("Test Driver")').first()).not.toBeVisible();
    });

    test('should show provider badge', async ({ page }) => {
      await page.goto('/admin/users');

      await expect(page.getByText('LOCAL').first()).toBeVisible();
      await expect(page.getByText('GOOGLE')).toBeVisible();
    });
  });
});
