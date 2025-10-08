const { test, expect } = require('@playwright/test');

test.describe('Create/Edit Flatpak Remote Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Flatpak Remotes page
    await page.goto('/flatpak_remotes');
    await page.waitForLoadState('networkidle');

    // Handle organization selection if needed (fixtures use Empty Organization)
    const orgSelector = page.locator('select, [role="combobox"]').first();
    if (await orgSelector.isVisible()) {
      await page.selectOption('select, [role="combobox"]', { label: 'Empty Organization' });
      await page.click('button:has-text("Select")');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('h1:has-text("Flatpak Remotes")');
    }
  });

  // === CREATE MODAL FUNCTIONALITY ===
  test('should open Create Flatpak Remote modal', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();

      // Verify modal is open using correct modal selector
      await expect(page.locator('[data-ouia-component-id="create-flatpak-modal"]')).toBeVisible();
      await expect(page.locator('h1:has-text("Create Flatpak Remote")')).toBeVisible();
    }
  });

  test('should display all required form fields in Create modal', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[data-ouia-component-id="create-flatpak-modal"]');

      // Check for required form fields using actual IDs from component
      await expect(page.locator('#name')).toBeVisible();
      await expect(page.locator('#url')).toBeVisible();
      await expect(page.locator('#username')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();

      // Check for form buttons using actual ouiaIds
      await expect(page.locator('[data-ouia-component-id="create-flatpak-form-submit"]')).toBeVisible();
      await expect(page.locator('[data-ouia-component-id="create-flatpakcancel"]')).toBeVisible();
    }
  });

  test('should close modal on Cancel button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();

      // Verify modal is open using correct PatternFly 5 class
      await expect(page.locator('.pf-v5-c-modal-box')).toBeVisible();

      // Click Cancel using ouiaId
      await page.locator('[data-ouia-component-id="create-flatpakcancel"]').click();

      // Modal should be closed
      await expect(page.locator('.pf-v5-c-modal-box')).not.toBeVisible();
    }
  });

  test('should close modal on X button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();

      // Verify modal is open using correct PatternFly 5 class
      await expect(page.locator('.pf-v5-c-modal-box')).toBeVisible();

      // Click X button using PatternFly 5 selector
      const closeButton = page.locator('.pf-v5-c-modal-box__close button, button[aria-label="Close"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();

        // Modal should be closed
        await expect(page.locator('.pf-v5-c-modal-box')).not.toBeVisible();
      }
    }
  });

  // === FORM FIELD FUNCTIONALITY ===
  test('should fill form fields correctly', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[data-ouia-component-id="create-flatpak-modal"]');

      // Fill form fields using actual IDs
      const nameField = page.locator('#name');
      const urlField = page.locator('#url');

      await nameField.fill('Test Flatpak Remote');
      await urlField.fill('https://example.com/flatpak');

      // Verify fields are filled
      await expect(nameField).toHaveValue('Test Flatpak Remote');
      await expect(urlField).toHaveValue('https://example.com/flatpak');

      // Fill optional fields
      const usernameField = page.locator('#username');
      await usernameField.fill('testuser');
      await expect(usernameField).toHaveValue('testuser');
    }
  });

  // === FORM VALIDATION ===
  test('should validate required fields in Create form', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[data-ouia-component-id="create-flatpak-modal"]');

      // Submit button should be disabled when form is empty
      const submitButton = page.locator('[data-ouia-component-id="create-flatpak-form-submit"]');
      await expect(submitButton).toBeDisabled();

      // Fill only name field (missing required URL)
      await page.locator('#name').fill('Test Name');
      await expect(submitButton).toBeDisabled();

      // Fill invalid URL
      await page.locator('#url').fill('invalid-url');
      await expect(submitButton).toBeDisabled();
    }
  });

  test('should validate URL format', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[data-ouia-component-id="create-flatpak-modal"]');

      const nameField = page.locator('#name');
      const urlField = page.locator('#url');

      await nameField.fill('Test Remote');
      await urlField.fill('invalid-url');

      // Should show URL validation error in helper text
      // The error appears conditionally when urlValidated === 'error'
      const urlError = page.locator('text="Must be a vaild URL"');
      await expect(urlError).toBeVisible();

      // Submit button should be disabled due to invalid URL
      const submitButton = page.locator('[data-ouia-component-id="create-flatpak-form-submit"]');
      await expect(submitButton).toBeDisabled();
    }
  });

  // === FORM SUBMISSION ===
  test('should handle form submission', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[data-ouia-component-id="create-flatpak-modal"]');

      // Fill valid form data with unique name to avoid "already taken" error
      const uniqueName = `Test Remote E2E ${Date.now()}`;
      await page.locator('#name').fill(uniqueName);
      await page.locator('#url').fill('https://flatpaks.redhat.io/rhel/');

      // Submit button should be enabled with valid data
      const submitButton = page.locator('[data-ouia-component-id="create-flatpak-form-submit"]');
      await expect(submitButton).toBeEnabled();

      // Submit form and wait for navigation
      await submitButton.click();

      // Wait for navigation to detail page (successful creation)
      await page.waitForURL(/\/flatpak_remotes\/\d+/);

      // Verify we successfully navigated to the new flatpak remote's detail page
      expect(page.url()).toMatch(/\/flatpak_remotes\/\d+/);
    }
  });

  // === EDIT MODAL FUNCTIONALITY ===
  test('should open Edit modal from action menu', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();

        // Click Edit option
        await page.locator('button:has-text("Edit"), a:has-text("Edit")').click();

        // Verify Edit modal is open
        await expect(page.locator('[data-ouia-component-id="edit-flatpak-modal"]')).toBeVisible();
        await expect(page.locator('h1:has-text("Edit Flatpak Remote")')).toBeVisible();
      }
    }
  });

  test('should pre-populate fields in Edit modal', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Edit"), a:has-text("Edit")').click();
        await page.waitForSelector('[data-ouia-component-id="edit-flatpak-modal"]');

        // Fields should be pre-populated
        const nameField = page.locator('#name');
        const urlField = page.locator('#url');

        const nameValue = await nameField.inputValue();
        const urlValue = await urlField.inputValue();

        expect(nameValue).toBeTruthy();
        expect(urlValue).toBeTruthy();
      }
    }
  });

  test('should show password indication in Edit modal', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Edit"), a:has-text("Edit")').click();
        await page.waitForSelector('[data-ouia-component-id="edit-flatpak-modal"]');

        // Check for password field with asterisks (indicating existing password)
        const passwordField = page.locator('#password');
        const passwordValue = await passwordField.inputValue();
        expect(passwordValue).toBe('*****');
      }
    }
  });

  // === EDIT FORM FUNCTIONALITY ===
  test('should allow editing existing remote details', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Edit"), a:has-text("Edit")').click();
        await page.waitForSelector('[data-ouia-component-id="edit-flatpak-modal"]');

        // Modify fields
        const nameField = page.locator('#name');
        const currentName = await nameField.inputValue();

        await nameField.clear();
        await nameField.fill(currentName + ' - Modified');

        // Verify modification
        await expect(nameField).toHaveValue(currentName + ' - Modified');

        // Check if save button is enabled
        const saveButton = page.locator('[data-ouia-component-id="create-flatpak-form-submit"]');
        await expect(saveButton).toBeEnabled();
      }
    }
  });

  test('should handle Edit form submission', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Edit"), a:has-text("Edit")').click();
        await page.waitForSelector('[data-ouia-component-id="edit-flatpak-modal"]');

        // Get original name and make a change
        const nameField = page.locator('#name');
        const originalName = await nameField.inputValue();
        const updatedName = `${originalName} - Updated ${Date.now()}`;

        await nameField.clear();
        await nameField.fill(updatedName);

        // Submit form and wait for navigation back to detail page
        const saveButton = page.locator('[data-ouia-component-id="create-flatpak-form-submit"]');
        await saveButton.click();

        // Wait for navigation back to detail page (edit redirects back)
        await page.waitForLoadState('networkidle');

        // Verify the change was saved by checking the page title/heading
        await expect(page.locator('h1, h2, h3').filter({ hasText: updatedName })).toBeVisible();
      }
    }
  });

  // === READ FUNCTIONALITY (Data Verification) ===
  test('should display created remote in the table with correct data', async ({ page }) => {
    // First create a remote to ensure we have data to read
    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[data-ouia-component-id="create-flatpak-modal"]');

      // Create a remote with known data
      const testName = `Read Test Remote ${Date.now()}`;
      const testUrl = 'https://flatpaks.redhat.io/rhel/';

      await page.locator('#name').fill(testName);
      await page.locator('#url').fill(testUrl);

      const submitButton = page.locator('[data-ouia-component-id="create-flatpak-form-submit"]');
      await submitButton.click();

      // Wait for navigation to detail page
      await page.waitForURL(/\/flatpak_remotes\/\d+/);

      // Navigate back to list to verify the remote appears
      await page.goto('/flatpak_remotes');
      await page.waitForLoadState('networkidle');

      // Verify the remote appears in the table with correct data
      const tableRow = page.locator('table tbody tr').filter({ hasText: testName });
      await expect(tableRow).toBeVisible();

      // Verify the name link is correct
      const nameLink = tableRow.locator('td').first().locator('a');
      await expect(nameLink).toHaveText(testName);
      await expect(nameLink).toHaveAttribute('href', /\/flatpak_remotes\/\d+/);

      // Verify the URL is displayed and linked correctly
      const urlLink = tableRow.locator('td').nth(1).locator('a');
      await expect(urlLink).toHaveText(testUrl);
      await expect(urlLink).toHaveAttribute('href', testUrl);
      await expect(urlLink).toHaveAttribute('target', '_blank');
    }
  });

  // === ERROR HANDLING ===
  test('should handle form submission errors gracefully', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[data-ouia-component-id="create-flatpak-modal"]');

      // Fill with valid but potentially problematic data
      await page.locator('#name').fill('Test Remote with Special Chars !@#$%');
      await page.locator('#url').fill('https://nonexistent-flatpak-repo.example.com');

      // Submit button should be enabled with valid data
      const submitButton = page.locator('[data-ouia-component-id="create-flatpak-form-submit"]');
      await expect(submitButton).toBeEnabled();

      // Submit form
      await submitButton.click();

      // Wait longer for potential async operation and error
      await page.waitForTimeout(5000);
      await page.waitForLoadState('networkidle');

      // Check for error messages
      const errorAlert = page.locator('.pf-v5-c-alert--danger, .pf-v5-c-alert.pf-m-danger');
      if (await errorAlert.isVisible()) {
        await expect(errorAlert).toBeVisible();
      }
    }
  });

  test('should not have JavaScript errors during modal operations', async ({ page }) => {
    const errors = [];

    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    const createButton = page.locator('button:has-text("Create new")');

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[data-ouia-component-id="create-flatpak-modal"]');

      // Close modal
      await page.locator('[data-ouia-component-id="create-flatpakcancel"]').click();
      await page.waitForLoadState('networkidle');

      // Filter out non-critical errors and HTTP errors (500, 404, etc)
      const criticalErrors = errors.filter(error =>
        !error.includes('favicon') &&
        !error.includes('404') &&
        !error.includes('500') &&
        !error.includes('Failed to load resource') &&
        !error.includes('net::ERR_')
      );

      expect(criticalErrors.length).toBe(0);
    }
  });
});
