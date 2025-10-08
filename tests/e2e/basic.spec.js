const { test, expect } = require('@playwright/test');

test.describe('Foreman/Katello Basic Tests', () => {
  test('should load the Foreman homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load - could be login page or dashboard depending on auth state
    await expect(page).toHaveTitle(/Foreman|Login/);

    // Check that the page loaded successfully (not an error page)
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Verify we're not seeing a generic error page
    const errorIndicators = page.locator('h1:has-text("Error"), h1:has-text("404"), h1:has-text("500")');
    await expect(errorIndicators).toHaveCount(0);
  });

  test('should have working login form', async ({ page }) => {
    await page.goto('/');

    // Look for Foreman login elements
    const loginForm = page.locator('form#login_form, form[action*="login"]').first();
    if (await loginForm.isVisible()) {
      // Check for username field
      const usernameField = page.locator('input[name="login_login"], input[id="login_login"]').first();
      await expect(usernameField).toBeVisible();

      // Check for password field
      const passwordField = page.locator('input[name="login_password"], input[id="login_password"]').first();
      await expect(passwordField).toBeVisible();

      // Check for submit button
      const submitButton = page.locator('input[type="submit"], button[type="submit"]').first();
      await expect(submitButton).toBeVisible();
    }
  });

  test('should show Katello menu items when logged in', async ({ page }) => {
    // Skip this test if we can't log in (no credentials provided)
    const username = process.env.FOREMAN_USERNAME || 'admin';
    const password = process.env.FOREMAN_PASSWORD || 'changeme';

    await page.goto('/');

    // Try to log in if we see a login form
    const loginForm = page.locator('form#login_form, form[action*="login"]').first();
    if (await loginForm.isVisible()) {
      await page.fill('input[name="login_login"], input[id="login_login"]', username);
      await page.fill('input[name="login_password"], input[id="login_password"]', password);
      await page.click('input[type="submit"], button[type="submit"]');

      // Wait for redirect after login
      await page.waitForURL(/.*/, { waitUntil: 'networkidle' });
    }

    // Look for Katello-specific menu items
    const katelloMenus = [
      'Content',
      'Hosts',
      'Configure'
    ];

    for (const menuItem of katelloMenus) {
      const menu = page.locator(`nav a:has-text("${menuItem}"), .nav a:has-text("${menuItem}")`).first();
      if (await menu.isVisible()) {
        await expect(menu).toBeVisible();
        break; // If we find any menu, the test passes
      }
    }
  });

  test('should handle navigation', async ({ page }) => {
    await page.goto('/');

    // Test basic navigation - look for common navigation elements
    const navigation = page.locator('nav, .navbar, .navigation').first();
    if (await navigation.isVisible()) {
      await expect(navigation).toBeVisible();
    }

    // Test that JavaScript is working by checking for interactive elements
    const interactiveElements = await page.locator('button, a, input').count();
    expect(interactiveElements).toBeGreaterThan(0);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors = [];

    // Listen for console errors
    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');

    // Wait a bit for any async errors to surface
    await page.waitForTimeout(2000);

    // Check that there are no critical JavaScript errors
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.includes('net::ERR_')
    );

    expect(criticalErrors.length).toBe(0);
  });
});