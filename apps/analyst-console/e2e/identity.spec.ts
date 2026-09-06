import { test, expect } from '@playwright/test';

test.describe('Identity & Authentication', () => {
  test('User login succeeds with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Verify the page has the correct heading
    await expect(page.locator('text=CYBERMIND OS')).toBeVisible();

    // Fill in the login form
    await page.fill('input[name="tenantId"]', 'cybermind-master-tenant');
    await page.fill('input[name="email"]', 'admin@cybermind.local');
    await page.fill('input[name="password"]', 'admin123'); // Assuming a default password for the test

    // Intercept the API request to mock the backend response
    await page.route('**/v1/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock-jwt-token' }),
      });
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the redirection to the dashboard (or whichever page it goes to)
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
  });

  test('Invalid credentials rejected', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Fill in the login form with wrong password
    await page.fill('input[name="tenantId"]', 'cybermind-master-tenant');
    await page.fill('input[name="email"]', 'admin@cybermind.local');
    await page.fill('input[name="password"]', 'wrong-password');

    // Intercept the API request to mock a 401 Unauthorized
    await page.route('**/v1/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify error message is displayed
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
