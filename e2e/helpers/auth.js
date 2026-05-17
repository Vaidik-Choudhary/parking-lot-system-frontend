/**
 * Auth helpers — set/clear localStorage tokens before navigating.
 * Usage: await loginAs(page, 'DRIVER')
 */
import { DRIVER_AUTH, MANAGER_AUTH, ADMIN_AUTH } from './mock-data.js';

const AUTH_MAP = {
  DRIVER: DRIVER_AUTH,
  LOT_MANAGER: MANAGER_AUTH,
  ADMIN: ADMIN_AUTH,
};

/**
 * Inject auth tokens into localStorage so ProtectedRoute lets us through.
 * Must be called BEFORE page.goto() — we visit the base URL first to
 * set storage on the correct origin, then navigate to the target page.
 */
export async function loginAs(page, role) {
  const auth = AUTH_MAP[role];
  if (!auth) throw new Error(`Unknown role: ${role}`);

  // Visit the root first to establish the origin
  await page.goto('/');
  await page.evaluate((data) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('role', data.role);
    localStorage.setItem('email', data.email);
    localStorage.setItem('fullName', data.fullName);
    localStorage.setItem('userId', String(data.userId));
  }, auth);
}

/**
 * Clear all auth data from localStorage.
 */
export async function logout(page) {
  await page.evaluate(() => {
    ['accessToken', 'refreshToken', 'role', 'email', 'fullName', 'userId']
      .forEach(k => localStorage.removeItem(k));
  });
}
