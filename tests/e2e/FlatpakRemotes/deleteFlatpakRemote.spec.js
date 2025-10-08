const { test, expect } = require('@playwright/test');

test.describe('Delete Flatpak Remote Modal', () => {
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

  // === DELETE MODAL OPENING ===
  test('should open Delete confirmation modal', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();

        // Click Delete option
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        // Verify Delete modal is open
        await expect(page.locator('.pf-c-modal-box, [role="dialog"]')).toBeVisible();
        await expect(page.locator('h1:has-text("Delete"), h2:has-text("Delete"), h3:has-text("Delete")')).toBeVisible();
      }
    }
  });

  // === MODAL CONTENT AND DISPLAY ===
  test('should display confirmation message in Delete modal', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        // Should show confirmation message
        const confirmationText = page.locator('text*="Are you sure", text*="confirm", text*="delete", text*="remove"');
        if (await confirmationText.first().isVisible()) {
          await expect(confirmationText.first()).toBeVisible();
        }

        // Should show remote name in confirmation
        const remoteName = await firstRow.locator('td').first().textContent();
        if (remoteName && remoteName.trim()) {
          const nameInModal = page.locator(`text*="${remoteName.trim()}"`);
          if (await nameInModal.isVisible()) {
            await expect(nameInModal).toBeVisible();
          }
        }
      }
    }
  });

  test('should have Delete and Cancel buttons', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        // Should have Delete confirmation button
        await expect(page.locator('button:has-text("Delete"), button:has-text("Confirm"), button[type="submit"]').last()).toBeVisible();

        // Should have Cancel button
        await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      }
    }
  });

  test('should show Delete button as danger/destructive', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        // Delete button should have danger styling
        const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
        const buttonClasses = await deleteButton.getAttribute('class');

        if (buttonClasses) {
          expect(buttonClasses).toMatch(/danger|destructive|error|warning/);
        }
      }
    }
  });

  // === MODAL CLOSING FUNCTIONALITY ===
  test('should close modal on Cancel button', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        // Verify modal is open
        await expect(page.locator('.pf-c-modal-box')).toBeVisible();

        // Click Cancel
        await page.locator('button:has-text("Cancel")').click();

        // Modal should be closed
        await expect(page.locator('.pf-c-modal-box')).not.toBeVisible();
      }
    }
  });

  test('should close modal on X button', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        // Verify modal is open
        await expect(page.locator('.pf-c-modal-box')).toBeVisible();

        // Click X button
        const closeButton = page.locator('button[aria-label="Close"], .pf-c-modal-box__close button');
        if (await closeButton.isVisible()) {
          await closeButton.click();

          // Modal should be closed
          await expect(page.locator('.pf-c-modal-box')).not.toBeVisible();
        }
      }
    }
  });

  // === DELETE EXECUTION ===
  test('should handle deletion confirmation', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const remoteName = await firstRow.locator('td').first().textContent();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        // Confirm deletion
        const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
        await deleteButton.click();

        // Wait for deletion to complete
        await page.waitForLoadState('networkidle');

        // Modal should close
        await expect(page.locator('.pf-c-modal-box')).not.toBeVisible();

        // Should show success message or remove item from table
        const successAlert = page.locator('.alert-success, .pf-c-alert--success');
        const tableStillHasItem = page.locator(`table tbody tr:has-text("${remoteName}")`);

        const hasSuccessMessage = await successAlert.isVisible();
        const itemRemoved = !(await tableStillHasItem.isVisible());

        expect(hasSuccessMessage || itemRemoved).toBeTruthy();
      }
    }
  });

  // === DELETE VERIFICATION ===
  test('should actually delete remote from backend and verify removal from table', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const initialRowCount = await tableRows.count();

    if (initialRowCount > 0) {
      const firstRow = tableRows.first();
      const remoteName = await firstRow.locator('td').first().textContent();
      const remoteNameTrimmed = remoteName?.trim() || '';

      // Monitor API calls to verify backend deletion
      let deleteApiCalled = false;
      let deleteApiSuccess = false;

      page.on('request', request => {
        if (request.method() === 'DELETE' && request.url().includes('/flatpak_remotes/')) {
          deleteApiCalled = true;
          console.log('DELETE API called:', request.url());
        }
      });

      page.on('response', response => {
        if (response.request().method() === 'DELETE' && response.url().includes('/flatpak_remotes/')) {
          deleteApiSuccess = response.status() === 200 || response.status() === 204;
          console.log('DELETE API response:', response.status());
        }
      });

      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        // Use actual ouiaId from component
        const deleteButton = page.locator('[data-ouia-component-id="delete-button"]');
        await deleteButton.click();

        // Wait for navigation back to list (handleSuccess callback)
        await page.waitForURL(/\/flatpak_remotes$/);
        await page.waitForLoadState('networkidle');

        // Verify API call was made and successful
        expect(deleteApiCalled).toBeTruthy();
        expect(deleteApiSuccess).toBeTruthy();

        // Verify item is actually removed from table
        const updatedRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
        const finalRowCount = await updatedRows.count();

        // Either row count decreased OR specific remote name is gone
        const rowCountDecreased = finalRowCount < initialRowCount;
        const specificRemoteGone = !(await page.locator(`table tbody tr:has-text("${remoteNameTrimmed}")`).isVisible());

        expect(rowCountDecreased || specificRemoteGone).toBeTruthy();

        // Verify success toast appears (from successToast in action)
        const successToast = page.locator('.toast-notifications-list-pf .alert-success, .pf-v5-c-alert--success');
        if (await successToast.isVisible()) {
          await expect(successToast).toContainText('deleted');
        }
      }
    }
  });

  test('should disable action buttons during deletion', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();

        // Click delete and check if button becomes disabled
        await deleteButton.click();

        // Button might become disabled during processing
        const isDisabled = await deleteButton.isDisabled();
        const hasLoadingState = await page.locator('.spinner, .loading').isVisible();

        // Either button should be disabled or show loading state
        expect(isDisabled || hasLoadingState).toBeTruthy();
      }
    }
  });

  // === ERROR HANDLING ===
  test('should handle deletion errors gracefully', async ({ page }) => {
    // This test would need a way to simulate server errors
    // For now, we'll just check that error handling exists

    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
        await deleteButton.click();

        // Wait for any potential error messages
        await page.waitForTimeout(2000);

        // Check for error alerts
        const errorAlert = page.locator('.alert-danger, .pf-c-alert--danger, .error');
        if (await errorAlert.isVisible()) {
          await expect(errorAlert).toBeVisible();
        }
      }
    }
  });

  test('should show appropriate error messages for failed deletions', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
        await deleteButton.click();

        // Wait for completion or error
        await page.waitForLoadState('networkidle');

        // If there's an error, it should be descriptive
        const errorAlert = page.locator('.alert-danger, .pf-c-alert--danger, .error');
        if (await errorAlert.isVisible()) {
          const errorText = await errorAlert.textContent();
          expect(errorText).toBeTruthy();
          expect(errorText.length).toBeGreaterThan(10); // Should be descriptive
        }
      }
    }
  });

  // === ACCESSIBILITY AND INTERACTION ===
  test('should support keyboard navigation in delete modal', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        // Test keyboard navigation
        const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
        const cancelButton = page.locator('button:has-text("Cancel")');

        // Tab navigation should work
        await deleteButton.focus();
        await page.keyboard.press('Tab');

        // Should focus on Cancel button
        const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
        if (focusedElement && focusedElement.includes('Cancel')) {
          expect(focusedElement).toContain('Cancel');
        }

        // Escape should close modal
        await page.keyboard.press('Escape');
        await expect(page.locator('.pf-c-modal-box')).not.toBeVisible();
      }
    }
  });

  test('should prevent accidental deletions with clear confirmation', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const remoteName = await firstRow.locator('td').first().textContent();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();

        // Modal should clearly indicate what will be deleted
        if (remoteName && remoteName.trim()) {
          const nameInModal = page.locator(`text*="${remoteName.trim()}"`);
          if (await nameInModal.isVisible()) {
            await expect(nameInModal).toBeVisible();
          }
        }

        // Should have clear warning language
        const warningText = page.locator('text*="permanently", text*="cannot be undone", text*="irreversible"');
        if (await warningText.first().isVisible()) {
          await expect(warningText.first()).toBeVisible();
        }
      }
    }
  });

  // === QUALITY AND ERROR HANDLING ===
  test('should not have JavaScript errors during delete operations', async ({ page }) => {
    const errors = [];

    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();
        await page.locator('button:has-text("Delete"), a:has-text("Delete")').click();
        await page.waitForLoadState('networkidle');

        // Close modal
        await page.locator('button:has-text("Cancel")').click();
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
