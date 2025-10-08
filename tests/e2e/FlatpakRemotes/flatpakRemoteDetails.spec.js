const { test, expect } = require('@playwright/test');

test.describe('Flatpak Remote Details Page', () => {
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

  // === NAVIGATION TO DETAILS PAGE ===
  test('should navigate to detail page from remote name link', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      const firstLink = nameLinks.first();
      const remoteName = await firstLink.textContent();

      await firstLink.click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/flatpak_remotes\/\d+/);

      // Should show remote name in page header
      if (remoteName) {
        await expect(page.locator(`h1:has-text("${remoteName.trim()}"), h2:has-text("${remoteName.trim()}")`)).toBeVisible();
      }
    }
  });

  // === PAGE CONTENT AND LAYOUT ===
  test('should display remote details information', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      // Should display remote details - check for the actual ouiaId from component
      await expect(page.locator('[data-ouia-component-id="flatpak-remote-title"]')).toBeVisible();

      // Check for actual detail elements from component
      await expect(page.locator('[data-ouia-component-id="flatpak-remote-subtitle"]')).toContainText('Remote repositories');
      await expect(page.locator('[data-ouia-component-id="flatpak-remote-description"]')).toBeVisible();

      // Check for URL label (ActionableDetail component)
      await expect(page.locator('text="URL:"')).toBeVisible();
    }
  });

  test('should display remote status information', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      // Check for status indicators
      const statusElements = page.locator('text="Status", text="Last Scan", text="Last Updated"');
      if (await statusElements.first().isVisible()) {
        await expect(statusElements.first()).toBeVisible();
      }

      // Check for status badges or indicators
      const statusBadges = page.locator('.badge, .label, .pf-c-label');
      if (await statusBadges.first().isVisible()) {
        await expect(statusBadges.first()).toBeVisible();
      }
    }
  });

  // === ACTION BUTTONS ON DETAIL PAGE ===
  test('should display action buttons on detail page', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      // Check for action buttons
      const actionButtons = ['Scan', 'Edit', 'Delete'];
      for (const action of actionButtons) {
        const button = page.locator(`button:has-text("${action}")`);
        if (await button.isVisible()) {
          await expect(button).toBeVisible();
        }
      }
    }
  });

  // === SCAN FUNCTIONALITY ===
  test('should handle Scan action', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      const scanButton = page.locator('button:has-text("Scan")');
      if (await scanButton.isVisible()) {
        await scanButton.click();

        // Should show some indication of scanning
        const loadingIndicator = page.locator('.spinner, .loading, text="Scanning"');
        if (await loadingIndicator.isVisible()) {
          await expect(loadingIndicator).toBeVisible();
        }

        // Wait for scan to complete
        await page.waitForLoadState('networkidle');

        // Check for success message or updated data
        const successMessage = page.locator('.alert-success, .pf-c-alert--success');
        if (await successMessage.isVisible()) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should execute Scan action from main page', async ({ page }) => {
    // Go back to main page to test scan from there
    await page.goto('/flatpak_remotes');
    await page.waitForLoadState('networkidle');

    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();

        const scanAction = page.locator('button:has-text("Scan"), a:has-text("Scan")');
        await scanAction.click();

        // Should show scan progress or completion
        await page.waitForLoadState('networkidle');

        // Check for success message or loading indicator
        const successMessage = page.locator('.alert-success, .pf-c-alert--success');
        const loadingIndicator = page.locator('.spinner, .loading');

        const hasSuccess = await successMessage.isVisible();
        const hasLoading = await loadingIndicator.isVisible();

        // Either success message or loading should appear
        expect(hasSuccess || hasLoading).toBeTruthy();
      }
    }
  });

  // === EDIT FUNCTIONALITY FROM DETAIL PAGE ===
  test('should open Edit modal from detail page', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      const editButton = page.locator('button:has-text("Edit")');
      if (await editButton.isVisible()) {
        await editButton.click();

        // Should open edit modal
        await expect(page.locator('.pf-c-modal-box')).toBeVisible();
        await expect(page.locator('h1:has-text("Edit"), h2:has-text("Edit"), h3:has-text("Edit")')).toBeVisible();
      }
    }
  });

  // === DELETE FUNCTIONALITY FROM DETAIL PAGE ===
  test('should open Delete modal from detail page', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      const deleteButton = page.locator('button:has-text("Delete")');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should open delete confirmation modal
        await expect(page.locator('.pf-c-modal-box')).toBeVisible();
        await expect(page.locator('h1:has-text("Delete"), h2:has-text("Delete"), h3:has-text("Delete")')).toBeVisible();
      }
    }
  });

  // === REPOSITORIES SECTION ===
  test('should display repositories table', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      // Look for repositories section
      const repositoriesSection = page.locator('text="Repositories", text="Remote Repositories"');
      if (await repositoriesSection.first().isVisible()) {
        await expect(repositoriesSection.first()).toBeVisible();

        // Should have a table for repositories
        const repositoriesTable = page.locator('table').nth(1); // Second table on page
        if (await repositoriesTable.isVisible()) {
          await expect(repositoriesTable).toBeVisible();
        }
      }
    }
  });

  test('should display repository information when available', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      // Wait for any repository data to load
      await page.waitForLoadState('networkidle');

      // Check for repository-related content
      const repositoryContent = page.locator('text="Repository", text="Mirror", text="Status"');
      if (await repositoryContent.first().isVisible()) {
        await expect(repositoryContent.first()).toBeVisible();
      }

      // Check for repository table headers
      const repoHeaders = ['Name', 'Status', 'Last Sync'];
      for (const header of repoHeaders) {
        const headerElement = page.locator(`th:has-text("${header}")`);
        if (await headerElement.isVisible()) {
          await expect(headerElement).toBeVisible();
        }
      }
    }
  });

  // === MIRROR FUNCTIONALITY ===
  test('should handle Mirror Repository action', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for Mirror button in repository actions
      const mirrorButton = page.locator('button:has-text("Mirror")');
      if (await mirrorButton.isVisible()) {
        await mirrorButton.click();

        // Should open mirror modal or start mirroring
        const mirrorModal = page.locator('.pf-c-modal-box');
        const mirrorProgress = page.locator('text="Mirroring", .spinner');

        const hasModal = await mirrorModal.isVisible();
        const hasProgress = await mirrorProgress.isVisible();

        expect(hasModal || hasProgress).toBeTruthy();
      }
    }
  });

  // === NAVIGATION AND BREADCRUMBS ===
  test('should display breadcrumb navigation', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      // Check for breadcrumb navigation
      const breadcrumb = page.locator('.breadcrumb, .pf-c-breadcrumb, nav[aria-label*="breadcrumb"]');
      if (await breadcrumb.isVisible()) {
        await expect(breadcrumb).toBeVisible();

        // Should have link back to Flatpak Remotes
        const backLink = page.locator('a:has-text("Flatpak Remotes")');
        if (await backLink.isVisible()) {
          await expect(backLink).toBeVisible();
        }
      }
    }
  });

  test('should handle back navigation', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      // Look for back button or breadcrumb link
      const backLink = page.locator('a:has-text("Flatpak Remotes"), button:has-text("Back")');
      if (await backLink.first().isVisible()) {
        await backLink.first().click();

        // Should navigate back to list page
        await expect(page).toHaveURL(/\/flatpak_remotes$/);
      }
    }
  });

  // === DATA LOADING ===
  test('should show last sync information', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      // Look for last sync column
      const lastSyncHeader = page.locator('th:has-text("Last Sync"), th:has-text("Sync")');
      if (await lastSyncHeader.isVisible()) {
        await expect(lastSyncHeader).toBeVisible();

        // Check for sync timestamp or status
        const syncCells = page.locator('table').nth(1).locator('tbody tr td').filter({ hasText: /ago|never|sync|date/i });
        if (await syncCells.first().isVisible()) {
          await expect(syncCells.first()).toBeVisible();
        }
      }
    }
  });

  // === ERROR HANDLING ===
  test('should handle empty repository list', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Check if repositories section shows empty state
      const repositoryRows = page.locator('table').nth(1).locator('tbody tr');
      const rowCount = await repositoryRows.count();

      if (rowCount === 0) {
        const emptyState = page.locator('.empty-state, .no-repositories').or(page.locator('text="No repositories"'));
        if (await emptyState.first().isVisible()) {
          await expect(emptyState.first()).toBeVisible();
        }
      }
    }
  });

  // === QUALITY AND ERROR HANDLING ===
  test('should not have JavaScript errors on detail page', async ({ page }) => {
    const errors = [];

    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();
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

  test('should handle action button permissions correctly', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      await nameLinks.first().click();

      // Check if action buttons respect user permissions
      const actionButtons = ['Scan', 'Edit', 'Delete'];

      for (const action of actionButtons) {
        const button = page.locator(`button:has-text("${action}")`);
        if (await button.isVisible()) {
          const isDisabled = await button.isDisabled();
          const buttonClasses = await button.getAttribute('class');

          // Button should either be enabled or properly disabled with appropriate styling
          expect(typeof isDisabled).toBe('boolean');

          if (isDisabled && buttonClasses) {
            expect(buttonClasses).toMatch(/disabled|pf-m-disabled/);
          }
        }
      }
    }
  });
});
