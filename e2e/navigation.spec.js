import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/auth.js';
import { setupDriverMocks, setupManagerMocks, setupAdminMocks, setupGuestMocks } from './helpers/api-mocks.js';

test.describe('Route Protection & Navigation', () => {

  // ── Unauthenticated access ────────────────────────────────────────────
  test.describe('Unauthenticated redirects', () => {
    test('should redirect /driver to /login when not logged in', async ({ page }) => {
      await setupGuestMocks(page);
      await page.goto('/driver');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
    });

    test('should redirect /manager to /login when not logged in', async ({ page }) => {
      await setupGuestMocks(page);
      await page.goto('/manager');
      await page.waitForURL('**/login');
    });

    test('should redirect /admin to /login when not logged in', async ({ page }) => {
      await setupGuestMocks(page);
      await page.goto('/admin');
      await page.waitForURL('**/login');
    });

    test('should redirect /driver/bookings to /login', async ({ page }) => {
      await setupGuestMocks(page);
      await page.goto('/driver/bookings');
      await page.waitForURL('**/login');
    });

    test('should redirect /admin/users to /login', async ({ page }) => {
      await setupGuestMocks(page);
      await page.goto('/admin/users');
      await page.waitForURL('**/login');
    });

    test('should allow access to / without login', async ({ page }) => {
      await setupGuestMocks(page);
      await page.goto('/');
      await expect(page.locator('.guest-hero-title')).toBeVisible();
    });

    test('should allow access to /login without login', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('h1')).toContainText('ParkEase');
    });

    test('should allow access to /register without login', async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByText('Create your account')).toBeVisible();
    });

    test('should allow access to /guest/lots/:id without login', async ({ page }) => {
      await setupGuestMocks(page);
      await page.goto('/guest/lots/1');
      await expect(page.getByText('MG Road Parking')).toBeVisible();
    });
  });

  // ── Role-based redirects ──────────────────────────────────────────────
  test.describe('Wrong-role redirects', () => {
    test('should redirect driver away from /manager', async ({ page }) => {
      await setupDriverMocks(page);
      await loginAs(page, 'DRIVER');
      await page.goto('/manager');
      await page.waitForURL('**/driver');
    });

    test('should redirect driver away from /admin', async ({ page }) => {
      await setupDriverMocks(page);
      await loginAs(page, 'DRIVER');
      await page.goto('/admin');
      await page.waitForURL('**/driver');
    });

    test('should redirect manager away from /driver', async ({ page }) => {
      await setupManagerMocks(page);
      await loginAs(page, 'LOT_MANAGER');
      await page.goto('/driver');
      await page.waitForURL('**/manager');
    });

    test('should redirect manager away from /admin', async ({ page }) => {
      await setupManagerMocks(page);
      await loginAs(page, 'LOT_MANAGER');
      await page.goto('/admin');
      await page.waitForURL('**/manager');
    });

    test('should redirect admin away from /driver', async ({ page }) => {
      await setupAdminMocks(page);
      await loginAs(page, 'ADMIN');
      await page.goto('/driver');
      await page.waitForURL('**/admin');
    });

    test('should redirect admin away from /manager', async ({ page }) => {
      await setupAdminMocks(page);
      await loginAs(page, 'ADMIN');
      await page.goto('/manager');
      await page.waitForURL('**/admin');
    });
  });

  // ── Fallback route ────────────────────────────────────────────────────
  test.describe('Fallback', () => {
    test('should redirect unknown routes to landing page', async ({ page }) => {
      await setupGuestMocks(page);
      await page.goto('/some/unknown/path');
      await page.waitForURL('/');
    });

    test('should redirect /xyz to landing page', async ({ page }) => {
      await setupGuestMocks(page);
      await page.goto('/xyz');
      await page.waitForURL('/');
    });
  });

  // ── Sidebar navigation ───────────────────────────────────────────────
  test.describe('Sidebar Navigation', () => {
    test('driver sidebar should have correct menu items', async ({ page }) => {
      await setupDriverMocks(page);
      await loginAs(page, 'DRIVER');
      await page.goto('/driver');

      // Check sidebar has the expected links
      await expect(page.locator('nav, .sidebar, aside').getByText('Dashboard')).toBeVisible();
    });
  });
});
