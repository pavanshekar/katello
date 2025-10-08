const { test: setup } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Create auth directory if it doesn't exist
  const authDir = path.join('playwright', '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const username = process.env.FOREMAN_USERNAME || 'admin';
  const password = process.env.FOREMAN_PASSWORD || 'changeme';

  // Goto with longer timeout and don't wait for everything to load
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Try to log in if we see a login form
  const loginForm = page.locator('form#login_form, form[action*="login"]').first();
  if (await loginForm.isVisible()) {
    await page.fill('input[name="login_login"], input[id="login_login"]', username);
    await page.fill('input[name="login_password"], input[id="login_password"]', password);
    await page.click('input[type="submit"], button[type="submit"]');

    // Wait for redirect after login
    await page.waitForURL(/.*/, { waitUntil: 'networkidle' });
  }

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
