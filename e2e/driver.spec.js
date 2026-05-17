import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.js';
import { setupDriverMocks } from './helpers/api-mocks.js';

test.describe('Driver Pages', () => {
  test.beforeEach(async ({ page }) => {
    await setupDriverMocks(page);
    await loginAs(page, 'DRIVER');
  });

  // ── Driver Dashboard ──────────────────────────────────────────────────
  test.describe('Dashboard', () => {
    test('should display welcome message with driver name', async ({ page }) => {
      await page.goto('/driver');
      await expect(page.getByText('Welcome back, Test!')).toBeVisible();
    });

    test('should display stat cards', async ({ page }) => {
      await page.goto('/driver');

      await expect(page.getByText('Active Parking')).toBeVisible();
      await expect(page.getByText('Reserved').first()).toBeVisible();
      await expect(page.getByText('Completed').first()).toBeVisible();
      await expect(page.getByText('Total Spent').first()).toBeVisible();
    });

    test('should display recent bookings table', async ({ page }) => {
      await page.goto('/driver');

      await expect(page.getByText('Recent Bookings')).toBeVisible();
      await expect(page.getByText('#101')).toBeVisible();
      await expect(page.getByText('#102')).toBeVisible();
    });

    test('should have Find Parking button', async ({ page }) => {
      await page.goto('/driver');

      const findBtn = page.getByText('+ Find Parking');
      await expect(findBtn).toBeVisible();
      await findBtn.click();
      await page.waitForURL('**/driver/search');
    });

    test('should have View All bookings button', async ({ page }) => {
      await page.goto('/driver');

      await page.click('button:has-text("View All")');
      await page.waitForURL('**/driver/bookings');
    });

    test('should show booking statuses with badges', async ({ page }) => {
      await page.goto('/driver');

      await expect(page.locator('.badge').first()).toBeVisible();
    });
  });

  // ── Search Lots ───────────────────────────────────────────────────────
  test.describe('Search Lots', () => {
    test('should display search page with city input', async ({ page }) => {
      await page.goto('/driver/search');

      await expect(page.locator('h1:has-text("Find Parking")')).toBeVisible();
      await expect(page.locator('input[placeholder*="Enter city"]')).toBeVisible();
    });


  });

  // ── Lot Detail (Booking Flow) ─────────────────────────────────────────
  test.describe('Lot Detail & Booking', () => {
    test('should display lot info card', async ({ page }) => {
      await page.goto('/driver/lots/1');

      await expect(page.getByText('MG Road Parking').first()).toBeVisible();
      await expect(page.getByText('123 MG Road, Mumbai').first()).toBeVisible();
    });

    test('should display booking mode selection (Step 1)', async ({ page }) => {
      await page.goto('/driver/lots/1');

      await expect(page.getByText('How would you like to park?')).toBeVisible();
      await expect(page.getByText('Pre-Booking')).toBeVisible();
      await expect(page.getByText('Drive-In')).toBeVisible();
    });

    test('should select Drive-In mode and show live spots', async ({ page }) => {
      await page.goto('/driver/lots/1');

      await page.locator('.booking-mode-card:has-text("Drive-In")').click();

      // Should load drive-in spots
      await expect(page.locator('.spot-tile').first()).toBeVisible();
      // Legend should show Free / Reserved / Occupied
      await expect(page.getByText('Free')).toBeVisible();
    });

    test('should select Pre-Booking mode and show time filter', async ({ page }) => {
      await page.goto('/driver/lots/1');

      await page.locator('.booking-mode-card:has-text("Pre-Booking")').click();

      await expect(page.getByText('Select your time window')).toBeVisible();
      await expect(page.locator('input[type="datetime-local"]').first()).toBeVisible();
    });

    test('should select a spot in Drive-In mode and show Book button', async ({ page }) => {
      await page.goto('/driver/lots/1');

      await page.locator('.booking-mode-card:has-text("Drive-In")').click();
      await page.locator('.spot-tile.available').first().click();

      await expect(page.getByText('Book This Spot')).toBeVisible();
    });

    test('should open booking modal when clicking Book This Spot', async ({ page }) => {
      await page.goto('/driver/lots/1');

      await page.locator('.booking-mode-card:has-text("Drive-In")').click();
      await page.locator('.spot-tile.available').first().click();
      await page.click('button:has-text("Book This Spot")');

      // Modal should appear
      await expect(page.locator('.modal')).toBeVisible();
      await expect(page.locator('input[placeholder="MH01AB1234"]')).toBeVisible();
    });

    test('should show spot info in booking modal', async ({ page }) => {
      await page.goto('/driver/lots/1');

      await page.locator('.booking-mode-card:has-text("Drive-In")').click();
      await page.locator('.spot-tile.available').first().click();
      await page.click('button:has-text("Book This Spot")');

      await expect(page.locator('.modal')).toContainText('₹');
      await expect(page.locator('.modal')).toContainText('/hr');
    });


  });

  // ── My Bookings ───────────────────────────────────────────────────────
  test.describe('My Bookings', () => {



  });

  // ── My Vehicles ───────────────────────────────────────────────────────
  test.describe('My Vehicles', () => {
    test('should display vehicles page header', async ({ page }) => {
      await page.goto('/driver/vehicles');

      await expect(page.locator('h1')).toContainText('My Vehicles');
    });

    test('should list registered vehicles', async ({ page }) => {
      await page.goto('/driver/vehicles');

      await expect(page.getByText('MH01AB1234')).toBeVisible();
      await expect(page.getByText('MH01CD5678')).toBeVisible();
      await expect(page.getByText('Toyota Camry')).toBeVisible();
      await expect(page.getByText('Tesla Model 3')).toBeVisible();
    });



    test('should show vehicle type badges', async ({ page }) => {
      await page.goto('/driver/vehicles');

      await expect(page.getByText('FOUR WHEELER').first()).toBeVisible();
    });

    test('should open add vehicle modal', async ({ page }) => {
      await page.goto('/driver/vehicles');

      await page.click('button:has-text("+ Add Vehicle")');

      await expect(page.locator('.modal')).toBeVisible();
      await expect(page.locator('.modal-title')).toContainText('Register Vehicle');
    });

    test('should display form fields in add vehicle modal', async ({ page }) => {
      await page.goto('/driver/vehicles');
      await page.click('button:has-text("+ Add Vehicle")');

      await expect(page.locator('.modal input[name="licensePlate"]')).toBeVisible();
      await expect(page.locator('.modal input[name="make"]')).toBeVisible();
      await expect(page.locator('.modal input[name="model"]')).toBeVisible();
      await expect(page.locator('.modal input[name="color"]')).toBeVisible();
      await expect(page.locator('.modal select[name="vehicleType"]')).toBeVisible();
      await expect(page.locator('.modal input[name="isEV"]')).toBeVisible();
    });




  });

  // ── Payment Page ──────────────────────────────────────────────────────
  test.describe('Payment Page', () => {


    test('should show total amount and pay button', async ({ page }) => {
      await page.goto('/driver/payment/101');

      await expect(page.getByText('Total Amount')).toBeVisible();
      await expect(page.locator('button:has-text("Pay")')).toBeVisible();
    });




  });
});
