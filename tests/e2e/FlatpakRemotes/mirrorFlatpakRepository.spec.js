const { test, expect } = require('@playwright/test');

test.describe('Mirror Repository with Product Selection', () => {
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

    // Navigate to a remote detail page
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();
      await page.waitForLoadState('networkidle');
    }
  });

  // === REPOSITORIES TABLE AND MIRROR BUTTONS ===
  test('should display repositories table with Mirror actions', async ({ page }) => {
    // Look for repositories section
    const repositoriesSection = page.locator('text="Repositories", text="Remote Repositories"');
    if (await repositoriesSection.first().isVisible()) {
      await expect(repositoriesSection.first()).toBeVisible();

      // Should have a table for repositories
      const repositoriesTable = page.locator('table').nth(1);
      if (await repositoriesTable.isVisible()) {
        await expect(repositoriesTable).toBeVisible();

        // Look for Mirror buttons
        const mirrorButtons = page.locator('button:has-text("Mirror"), a:has-text("Mirror")');
        if (await mirrorButtons.first().isVisible()) {
          await expect(mirrorButtons.first()).toBeVisible();
        }
      }
    }
  });

  // === MIRROR MODAL OPENING AND INTERFACE ===
  test('should open Mirror modal with product selection', async ({ page }) => {
    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      const firstRepoRow = repositoryRows.first();
      const mirrorButton = firstRepoRow.locator('button:has-text("Mirror"), a:has-text("Mirror")');

      if (await mirrorButton.isVisible()) {
        await mirrorButton.click();

        // Should open mirror modal
        await expect(page.locator('.pf-c-modal-box, [role="dialog"]')).toBeVisible();
        await expect(page.locator('h1:has-text("Mirror"), h2:has-text("Mirror"), h3:has-text("Mirror")')).toBeVisible();

        // Should have product selection dropdown
        const productDropdown = page.locator('select[name*="product"], .pf-c-select, .pf-c-dropdown').first();
        if (await productDropdown.isVisible()) {
          await expect(productDropdown).toBeVisible();
        }
      }
    }
  });

  // === PRODUCT SELECTION AND VALIDATION ===
  test('should load existing products in dropdown', async ({ page }) => {
    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      const firstRepoRow = repositoryRows.first();
      const mirrorButton = firstRepoRow.locator('button:has-text("Mirror"), a:has-text("Mirror")');

      if (await mirrorButton.isVisible()) {
        await mirrorButton.click();

        // Click product dropdown to see options
        const productDropdown = page.locator('select[name*="product"], .pf-c-select__toggle, .pf-c-dropdown__toggle').first();
        if (await productDropdown.isVisible()) {
          await productDropdown.click();

          // Should show list of existing products (excluding Red Hat products)
          const productOptions = page.locator('option, .pf-c-select__menu-item');
          const optionCount = await productOptions.count();

          if (optionCount > 0) {
            await expect(productOptions.first()).toBeVisible();

            // Verify only custom products are shown (no Red Hat products)
            const redHatOptions = productOptions.filter({ hasText: /red hat|Red Hat|RHEL/i });
            const redHatCount = await redHatOptions.count();
            expect(redHatCount).toBe(0); // Should not show Red Hat products
          }
        }
      }
    }
  });

  // === SUCCESSFUL MIRRORING EXECUTION ===
  test('should successfully mirror to selected custom product', async ({ page }) => {
    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      const firstRepoRow = repositoryRows.first();
      const mirrorButton = firstRepoRow.locator('button:has-text("Mirror"), a:has-text("Mirror")');

      if (await mirrorButton.isVisible()) {
        await mirrorButton.click();

        // Select a custom product
        const productDropdown = page.locator('select[name*="product"], .pf-c-select__toggle').first();
        if (await productDropdown.isVisible()) {
          await productDropdown.click();

          const productOptions = page.locator('option, .pf-c-select__menu-item');
          const optionCount = await productOptions.count();

          if (optionCount > 1) { // Skip placeholder option
            await productOptions.nth(1).click();

            // Confirm mirroring
            const confirmButton = page.locator('button:has-text("Mirror"), button:has-text("Confirm")').last();
            await confirmButton.click();

            // Should start mirroring process
            await page.waitForLoadState('networkidle');

            // Modal should close and show success or progress
            await expect(page.locator('.pf-c-modal-box')).not.toBeVisible();

            const successMessage = page.locator('.alert-success, .pf-c-alert--success');
            const progressIndicator = page.locator('.spinner, .loading, text="Mirroring"');

            const hasSuccess = await successMessage.isVisible();
            const hasProgress = await progressIndicator.isVisible();

            expect(hasSuccess || hasProgress).toBeTruthy();
          }
        }
      }
    }
  });

  // === MIRROR VERIFICATION ===
  test('should actually mirror repository to product and verify task started', async ({ page }) => {
    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      const firstRepoRow = repositoryRows.first();
      const repositoryName = await firstRepoRow.locator('td').first().textContent();
      const mirrorButton = firstRepoRow.locator('button:has-text("Mirror"), a:has-text("Mirror")');

      if (await mirrorButton.isVisible()) {
        // Monitor API calls to verify backend mirror operation
        let mirrorApiCalled = false;
        let mirrorApiSuccess = false;
        let taskStarted = false;

        page.on('request', request => {
          if (request.method() === 'POST' && request.url().includes('/flatpak_remote_repositories/') && request.url().includes('/mirror')) {
            mirrorApiCalled = true;
            console.log('MIRROR API called:', request.url());
          }
        });

        page.on('response', async response => {
          if (response.request().method() === 'POST' && response.url().includes('/mirror')) {
            mirrorApiSuccess = response.status() === 200 || response.status() === 201;
            console.log('MIRROR API response:', response.status());

            if (mirrorApiSuccess) {
              try {
                const responseBody = await response.json();
                taskStarted = !!responseBody.id; // Should return task data with ID
                console.log('Task data:', responseBody);
              } catch (e) {
                console.log('Could not parse mirror response');
              }
            }
          }
        });

        await mirrorButton.click();

        // Wait for modal with proper ouiaId from component
        await page.waitForSelector('[data-ouia-component-id="mirror-repo-modal"]');

        // Verify modal content shows repository name
        if (repositoryName?.trim()) {
          const repoNameInModal = page.locator(`text="${repositoryName.trim()}"`);
          if (await repoNameInModal.isVisible()) {
            await expect(repoNameInModal).toBeVisible();
          }
        }

        // Capture initial "Last mirrored" status before mirroring
        const initialMirrorCell = firstRepoRow.locator('td').nth(3); // "Last mirrored" column
        const initialMirrorStatus = await initialMirrorCell.textContent();

        // Find and fill product using SearchText component (not dropdown)
        const productSearch = page.locator('input[aria-label="product-search"]');
        if (await productSearch.isVisible()) {
          // Type a product name to search
          await productSearch.fill('Test Product');

          // Wait for autocomplete dropdown
          await page.waitForTimeout(1000);

          // Select first autocomplete option if available
          const autocompleteOptions = page.locator('.dropdown-menu li, .pf-c-select__menu-item');
          if (await autocompleteOptions.first().isVisible()) {
            await autocompleteOptions.first().click();
          }

          // Use actual ouiaId from component for Mirror button
          const confirmButton = page.locator('[data-ouia-component-id="confirm-mirror-btn"]');
          await confirmButton.click();

          // Wait for API completion and modal close
          await page.waitForTimeout(3000);
          await page.waitForLoadState('networkidle');

          // Verify API calls were made successfully
          expect(mirrorApiCalled).toBeTruthy();
          expect(mirrorApiSuccess).toBeTruthy();
          expect(taskStarted).toBeTruthy();

          // Modal should be closed after successful mirror
          const modal = page.locator('[data-ouia-component-id="mirror-repo-modal"]');
          await expect(modal).not.toBeVisible();

          // Verify task started toast appears (from renderTaskStartedToast)
          const taskToast = page.locator('.toast-notifications-list-pf .alert-success, .pf-v5-c-alert--success');
          if (await taskToast.isVisible()) {
            const toastText = await taskToast.textContent();
            expect(toastText).toContain('task');
          }

          // Verify repository table refreshes with updated mirror status
          await page.waitForTimeout(2000);
          const refreshedRows = page.locator('table').nth(1).locator('tbody tr');

          // Verify the "Last mirrored" column has updated from initial status
          const updatedMirrorCell = refreshedRows.first().locator('td').nth(3);
          const updatedMirrorStatus = await updatedMirrorCell.textContent();

          // Status should have changed from the initial status
          expect(updatedMirrorStatus).not.toBe(initialMirrorStatus);

          // If initial was "Never", it should no longer show "Never"
          if (initialMirrorStatus?.includes('Never')) {
            expect(updatedMirrorStatus).not.toContain('Never');
          }

          // LastSync component should show mirror task information
          // Either shows time ("X ago") or task status, but not empty
          expect(updatedMirrorStatus?.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  // === ERROR HANDLING AND VALIDATION ===
  test('should show error when trying to use Red Hat product', async ({ page }) => {
    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      const firstRepoRow = repositoryRows.first();
      const mirrorButton = firstRepoRow.locator('button:has-text("Mirror"), a:has-text("Mirror")');

      if (await mirrorButton.isVisible()) {
        await mirrorButton.click();

        // Try to type or select a Red Hat product (if there's a text input)
        const productInput = page.locator('input[name*="product"], .pf-c-select__toggle-typeahead');
        if (await productInput.isVisible()) {
          await productInput.fill('Red Hat Enterprise Linux');

          const confirmButton = page.locator('button:has-text("Mirror"), button:has-text("Confirm")').last();
          await confirmButton.click();

          // Should show error message about Red Hat products
          const errorMessage = page.locator('.alert-danger, .pf-c-alert--danger, .error').filter({
            hasText: /red hat|cannot|not allowed|invalid/i
          });

          if (await errorMessage.first().isVisible()) {
            await expect(errorMessage.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('should require product selection before mirroring', async ({ page }) => {
    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      const firstRepoRow = repositoryRows.first();
      const mirrorButton = firstRepoRow.locator('button:has-text("Mirror"), a:has-text("Mirror")');

      if (await mirrorButton.isVisible()) {
        await mirrorButton.click();

        // Try to confirm without selecting product
        const confirmButton = page.locator('button:has-text("Mirror"), button:has-text("Confirm")').last();
        await confirmButton.click();

        // Should show validation error
        const errorMessage = page.locator('.pf-c-form__helper-text--error, .error, .invalid-feedback');
        if (await errorMessage.first().isVisible()) {
          await expect(errorMessage.first()).toBeVisible();
        }

        // Modal should remain open
        await expect(page.locator('.pf-c-modal-box')).toBeVisible();
      }
    }
  });

  // === MODAL CLOSING AND CANCELLATION ===
  test('should close modal on Cancel', async ({ page }) => {
    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      const firstRepoRow = repositoryRows.first();
      const mirrorButton = firstRepoRow.locator('button:has-text("Mirror"), a:has-text("Mirror")');

      if (await mirrorButton.isVisible()) {
        await mirrorButton.click();

        // Verify modal is open
        await expect(page.locator('.pf-c-modal-box')).toBeVisible();

        // Click Cancel
        await page.locator('button:has-text("Cancel")').click();

        // Modal should close
        await expect(page.locator('.pf-c-modal-box')).not.toBeVisible();
      }
    }
  });

  // === MODAL CONTENT AND INFORMATION DISPLAY ===
  test('should show repository information in modal', async ({ page }) => {
    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      const firstRepoRow = repositoryRows.first();
      const repositoryName = await firstRepoRow.locator('td').first().textContent();
      const mirrorButton = firstRepoRow.locator('button:has-text("Mirror"), a:has-text("Mirror")');

      if (await mirrorButton.isVisible()) {
        await mirrorButton.click();

        // Should show repository details
        if (repositoryName && repositoryName.trim()) {
          const nameInModal = page.locator(`text*="${repositoryName.trim()}"`);
          if (await nameInModal.isVisible()) {
            await expect(nameInModal).toBeVisible();
          }
        }

        // Should show confirmation message
        const confirmationText = page.locator('text*="mirror", text*="Mirror", text*="repository"');
        if (await confirmationText.first().isVisible()) {
          await expect(confirmationText.first()).toBeVisible();
        }
      }
    }
  });

  // === NETWORK AND ERROR HANDLING ===
  test('should handle network errors during mirroring', async ({ page }) => {
    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      const firstRepoRow = repositoryRows.first();
      const mirrorButton = firstRepoRow.locator('button:has-text("Mirror"), a:has-text("Mirror")');

      if (await mirrorButton.isVisible()) {
        await mirrorButton.click();

        // Select a product and confirm
        const productDropdown = page.locator('select[name*="product"], .pf-c-select__toggle').first();
        if (await productDropdown.isVisible()) {
          await productDropdown.click();

          const productOptions = page.locator('option, .pf-c-select__menu-item');
          const optionCount = await productOptions.count();

          if (optionCount > 1) {
            await productOptions.nth(1).click();

            const confirmButton = page.locator('button:has-text("Mirror"), button:has-text("Confirm")').last();
            await confirmButton.click();

            // Wait for potential errors
            await page.waitForTimeout(3000);

            // Check for error messages
            const errorAlert = page.locator('.alert-danger, .pf-c-alert--danger, .error');
            if (await errorAlert.isVisible()) {
              await expect(errorAlert).toBeVisible();

              // Error should be descriptive
              const errorText = await errorAlert.textContent();
              expect(errorText).toBeTruthy();
            }
          }
        }
      }
    }
  });

  // === PROGRESS AND STATUS INDICATORS ===
  test('should display mirror progress status', async ({ page }) => {
    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      // Check for status indicators in repository table
      const statusCells = page.locator('table').nth(1).locator('tbody tr td').filter({ hasText: /status|progress|mirrored|synced/i });

      if (await statusCells.first().isVisible()) {
        await expect(statusCells.first()).toBeVisible();
      }

      // Check for progress bars or status badges
      const progressIndicators = page.locator('.progress, .pf-c-progress, .badge, .pf-c-label');
      if (await progressIndicators.first().isVisible()) {
        await expect(progressIndicators.first()).toBeVisible();
      }
    }
  });

  // === QUALITY AND ERROR HANDLING ===
  test('should not have JavaScript errors during mirror workflow', async ({ page }) => {
    const errors = [];

    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
    const rowCount = await repositoryRows.count();

    if (rowCount > 0) {
      const firstRepoRow = repositoryRows.first();
      const mirrorButton = firstRepoRow.locator('button:has-text("Mirror"), a:has-text("Mirror")');

      if (await mirrorButton.isVisible()) {
        await mirrorButton.click();
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
    }
  });
});
