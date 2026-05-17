import { test, expect } from '@playwright/test';
import { setupAuthMocks, setupGuestMocks } from './helpers/api-mocks.js';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page);
    await setupGuestMocks(page);
  });

  // ── Login Page ──────────────────────────────────────────────────────────
  test.describe('Login Page', () => {
    test('should display the login form with all elements', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('h1')).toContainText('ParkEase');
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
      await expect(page.getByText('Continue with Google')).toBeVisible();
      await expect(page.getByText("Don't have an account?")).toBeVisible();
      await expect(page.getByText('Forgot Password?')).toBeVisible();
    });

    test('should login as driver and redirect to driver dashboard', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'driver@test.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/driver');
      expect(page.url()).toContain('/driver');
    });

    test('should login as manager and redirect to manager dashboard', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'manager@test.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/manager');
      expect(page.url()).toContain('/manager');
    });

    test('should login as admin and redirect to admin dashboard', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/admin');
      expect(page.url()).toContain('/admin');
    });

    test('should show error on invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'wrong@test.com');
      await page.fill('input[name="password"]', 'wrongpass');
      await page.click('button[type="submit"]');

      await expect(page.locator('.alert-danger')).toContainText('Invalid email or password');
    });

    test('should show "Signing in..." while loading', async ({ page }) => {
      // Delay the response to observe loading state
      await page.route('**/api/auth/login', async route => {
        await new Promise(r => setTimeout(r, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'tok', refreshToken: 'ref',
            role: 'DRIVER', email: 'x@x.com', fullName: 'X', userId: 1,
          }),
        });
      });

      await page.goto('/login');
      await page.fill('input[name="email"]', 'driver@test.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page.locator('button[type="submit"]')).toContainText('Signing in...');
    });

    test('should navigate to register page via link', async ({ page }) => {
      await page.goto('/login');
      await page.click('a:has-text("Create one")');
      await page.waitForURL('**/register');
      expect(page.url()).toContain('/register');
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await page.goto('/login');
      await page.click('a:has-text("Forgot Password?")');
      await page.waitForURL('**/forgot-password');
      expect(page.url()).toContain('/forgot-password');
    });

    test('should navigate back to landing page via browse link', async ({ page }) => {
      await page.goto('/login');
      await page.click('a:has-text("Browse lots without signing in")');
      await page.waitForURL('/');
    });
  });

  // ── Register Page ───────────────────────────────────────────────────────
  test.describe('Register Page', () => {
    test('should display the registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('h1')).toContainText('ParkEase');
      await expect(page.getByText('Create your account')).toBeVisible();
      await expect(page.locator('input[name="fullName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('select[name="role"]')).toBeVisible();
    });

    test('should register a new driver', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="fullName"]', 'New Driver');
      await page.fill('input[name="email"]', 'newdriver@test.com');
      await page.fill('input[name="password"]', 'password123');
      await page.selectOption('select[name="role"]', 'DRIVER');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/driver');
    });

    test('should register a new lot manager', async ({ page }) => {
      // Override register mock for manager role
      await page.route('**/api/auth/register', route => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'tok', refreshToken: 'ref',
            role: 'LOT_MANAGER', email: 'mgr@test.com', fullName: 'Manager', userId: 99,
          }),
        });
      });

      await page.goto('/register');
      await page.fill('input[name="fullName"]', 'New Manager');
      await page.fill('input[name="email"]', 'mgr@test.com');
      await page.fill('input[name="password"]', 'password123');
      await page.selectOption('select[name="role"]', 'LOT_MANAGER');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/manager');
    });

    test('should have role dropdown with Driver and Lot Manager options', async ({ page }) => {
      await page.goto('/register');
      const options = await page.locator('select[name="role"] option').allTextContents();
      expect(options).toContain('Driver — Looking for parking');
      expect(options).toContain('Lot Manager — I own a parking facility');
    });

    test('should navigate to login page via sign in link', async ({ page }) => {
      await page.goto('/register');
      await page.click('a:has-text("Sign in")');
      await page.waitForURL('**/login');
    });
  });

  // ── Forgot Password Page ──────────────────────────────────────────────
  test.describe('Forgot Password Page', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');

      await expect(page.locator('h1')).toContainText('Forgot Password');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.getByText('Send Reset Link')).toBeVisible();
    });

    test('should send reset link and show success message', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.fill('input[type="email"]', 'driver@test.com');
      await page.click('button:has-text("Send Reset Link")');

      await expect(page.locator('.alert-success')).toContainText('Password reset link sent');
    });

    test('should have link back to login', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.click('a:has-text("Back to Login")');
      await page.waitForURL('**/login');
    });
  });

  // ── Reset Password Page ───────────────────────────────────────────────
  test.describe('Reset Password Page', () => {
    test('should display reset password form', async ({ page }) => {
      await page.goto('/reset-password?token=test-reset-token');

      await expect(page.locator('h1')).toContainText('Reset Password');
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.getByText('Reset Password').last()).toBeVisible();
    });

    test('should reset password and show success', async ({ page }) => {
      await page.goto('/reset-password?token=test-reset-token');
      await page.fill('input[type="password"]', 'newpassword123');
      await page.click('button:has-text("Reset Password")');

      await expect(page.locator('.alert-success')).toContainText('Password reset successful');
    });
  });
});
