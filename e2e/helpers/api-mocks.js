/**
 * API mock helpers — intercept fetch requests to the gateway and return
 * mock data so tests run without a live backend.
 *
 * Usage:
 *   await setupGuestMocks(page);   // for unauthenticated pages
 *   await setupDriverMocks(page);  // for driver-authenticated pages
 *   etc.
 */
import {
  MOCK_LOTS, MOCK_SPOTS, MOCK_DRIVE_IN_SPOTS,
  MOCK_BOOKINGS, MOCK_VEHICLES, MOCK_USERS,
  MOCK_PLATFORM_ANALYTICS, MOCK_MANAGER_DASHBOARD,
  MOCK_NOTIFICATIONS, DRIVER_AUTH, MANAGER_AUTH, ADMIN_AUTH,
} from './mock-data.js';

const GATEWAY = 'http://localhost:8080';

/**
 * Helper: fulfill a route with JSON data.
 */
function json(route, data, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

// ── Guest / Public mocks ────────────────────────────────────────────────────
export async function setupGuestMocks(page) {
  // Search lots by city
  await page.route(`${GATEWAY}/api/lots/city/**`, route => json(route, MOCK_LOTS));

  // Nearby lots
  await page.route(`${GATEWAY}/api/lots/nearby*`, route => json(route, MOCK_LOTS));

  // Single lot by ID
  await page.route(`${GATEWAY}/api/lots/*`, route => {
    const url = route.request().url();
    // Skip /api/lots/city/ and /api/lots/my-lots etc.
    if (url.includes('/city/') || url.includes('/my-lots') || url.includes('/toggle') || url.includes('/nearby') || url.includes('/approve') || url.endsWith('/all')) {
      return route.fallback();
    }
    return json(route, MOCK_LOTS[0]);
  });

  // Spots for a lot
  await page.route(`${GATEWAY}/api/spots/lot/*`, route => json(route, MOCK_SPOTS));
}

// ── Auth mocks ──────────────────────────────────────────────────────────────
export async function setupAuthMocks(page) {
  // Login
  await page.route(`${GATEWAY}/api/auth/login`, route => {
    const body = route.request().postDataJSON();
    if (body?.email === 'driver@test.com' && body?.password === 'password123') {
      return json(route, DRIVER_AUTH);
    }
    if (body?.email === 'manager@test.com' && body?.password === 'password123') {
      return json(route, MANAGER_AUTH);
    }
    if (body?.email === 'admin@test.com' && body?.password === 'password123') {
      return json(route, ADMIN_AUTH);
    }
    return json(route, { message: 'Invalid email or password' }, 401);
  });

  // Register
  await page.route(`${GATEWAY}/api/auth/register`, route => {
    const body = route.request().postDataJSON();
    const auth = {
      ...DRIVER_AUTH,
      email: body?.email || 'new@test.com',
      fullName: body?.fullName || 'New User',
      role: body?.role || 'DRIVER',
    };
    return json(route, auth);
  });

  // Forgot password
  await page.route(`${GATEWAY}/api/auth/forgot-password`, route =>
    json(route, { message: 'Password reset link sent' })
  );

  // Reset password
  await page.route(`${GATEWAY}/api/auth/reset-password`, route =>
    json(route, { message: 'Password reset successful' })
  );
}

// ── Driver mocks ────────────────────────────────────────────────────────────
export async function setupDriverMocks(page) {
  await setupGuestMocks(page);

  // My bookings
  await page.route(`${GATEWAY}/api/bookings/my`, route => json(route, MOCK_BOOKINGS));

  // Single booking
  await page.route(`${GATEWAY}/api/bookings/*`, route => {
    const url = route.request().url();
    const method = route.request().method();

    // Skip sub-routes
    if (url.includes('/slots/') || url.includes('/manager/') || url.endsWith('/my') || url.endsWith('/all')) return route.fallback();

    // PUT actions (checkin, checkout, cancel, extend)
    if (method === 'PUT') {
      return json(route, { ...MOCK_BOOKINGS[0], status: 'COMPLETED' });
    }
    // POST (create booking)
    if (method === 'POST') {
      return json(route, {
        bookingId: 999,
        lotId: 1,
        spotId: 1,
        vehiclePlate: 'MH01AB1234',
        status: 'ACTIVE',
        bookingType: 'DRIVE_IN',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        estimatedAmount: 40,
        totalAmount: 0,
        isPaid: false,
      });
    }
    // GET single booking
    return json(route, MOCK_BOOKINGS[0]);
  });

  // Available slots for pre-booking
  await page.route(`${GATEWAY}/api/bookings/slots/*/available*`, route =>
    json(route, MOCK_SPOTS.filter(s => s.status === 'AVAILABLE'))
  );

  // Drive-in slots
  await page.route(`${GATEWAY}/api/bookings/slots/*/drive-in`, route =>
    json(route, MOCK_DRIVE_IN_SPOTS)
  );

  // My vehicles
  await page.route(`${GATEWAY}/api/vehicles/my`, route => json(route, MOCK_VEHICLES));
  await page.route(`${GATEWAY}/api/vehicles`, route => {
    if (route.request().method() === 'POST') {
      return json(route, { vehicleId: 99, ...route.request().postDataJSON() });
    }
    return route.fallback();
  });
  await page.route(`${GATEWAY}/api/vehicles/*`, route => {
    const url = route.request().url();
    if (url.endsWith('/my')) return route.fallback();
    const method = route.request().method();
    if (method === 'PUT') return json(route, { ...MOCK_VEHICLES[0] });
    if (method === 'DELETE') return json(route, {});
    return json(route, MOCK_VEHICLES[0]);
  });

  // Payments
  await page.route(`${GATEWAY}/api/payments/booking/*`, route => json(route, null, 404));
  await page.route(`${GATEWAY}/api/payments/order`, route =>
    json(route, { razorpayKeyId: 'rzp_test_123', amount: 115, razorpayOrderId: 'order_test_123' })
  );
  await page.route(`${GATEWAY}/api/payments/verify`, route =>
    json(route, { status: 'PAID' })
  );

  // Notifications
  await page.route(`${GATEWAY}/api/notifications/**`, route => {
    if (route.request().method() === 'POST') return json(route, {});
    return json(route, MOCK_NOTIFICATIONS);
  });

  // Receipts
  await page.route(`${GATEWAY}/api/receipts/**`, route => json(route, []));
}

// ── Manager mocks ───────────────────────────────────────────────────────────
export async function setupManagerMocks(page) {
  await setupGuestMocks(page);

  // My lots
  await page.route(`${GATEWAY}/api/lots/my-lots`, route => json(route, MOCK_LOTS));

  // Toggle lot
  await page.route(`${GATEWAY}/api/lots/*/toggle`, route =>
    json(route, { ...MOCK_LOTS[0], open: !MOCK_LOTS[0].open })
  );

  // Create/update lot
  await page.route(`${GATEWAY}/api/lots`, route => {
    if (route.request().method() === 'POST') {
      return json(route, { lotId: 99, ...route.request().postDataJSON(), approved: false, open: false });
    }
    return route.fallback();
  });

  // Manager dashboard per lot
  await page.route(`${GATEWAY}/api/bookings/manager/*/dashboard`, route =>
    json(route, MOCK_MANAGER_DASHBOARD)
  );

  // Lot bookings
  await page.route(`${GATEWAY}/api/bookings/lot/*`, route => json(route, MOCK_BOOKINGS));

  // Lot spots management
  await page.route(`${GATEWAY}/api/spots/lot/*`, route => json(route, MOCK_SPOTS));
  await page.route(`${GATEWAY}/api/spots/*`, route => {
    const method = route.request().method();
    if (method === 'POST') return json(route, { spotId: 99 });
    if (method === 'PUT') return json(route, MOCK_SPOTS[0]);
    if (method === 'DELETE') return json(route, {});
    return json(route, MOCK_SPOTS[0]);
  });

  // Analytics
  await page.route(`${GATEWAY}/api/analytics/lot/*`, route =>
    json(route, { totalBookings: 150, totalRevenue: 45000, averageOccupancy: 65.5 })
  );
}

// ── Admin mocks ─────────────────────────────────────────────────────────────
export async function setupAdminMocks(page) {
  await setupGuestMocks(page);

  // Platform analytics
  await page.route(`${GATEWAY}/api/analytics/platform`, route =>
    json(route, MOCK_PLATFORM_ANALYTICS)
  );

  // All users
  await page.route(`${GATEWAY}/api/admin/users`, route => json(route, MOCK_USERS));
  await page.route(`${GATEWAY}/api/admin/users/*/suspend`, route => json(route, {}));
  await page.route(`${GATEWAY}/api/admin/users/*/activate`, route => json(route, {}));
  await page.route(`${GATEWAY}/api/admin/users/*`, route => {
    if (route.request().method() === 'DELETE') return json(route, {});
    return json(route, MOCK_USERS[0]);
  });

  // All lots (admin view)
  await page.route(`${GATEWAY}/api/lots/all`, route => json(route, MOCK_LOTS));
  await page.route(`${GATEWAY}/api/lots/*/approve`, route => json(route, {}));

  // All bookings
  await page.route(`${GATEWAY}/api/bookings/all`, route => json(route, MOCK_BOOKINGS));
  await page.route(`${GATEWAY}/api/bookings/my`, route => json(route, MOCK_BOOKINGS));
}
