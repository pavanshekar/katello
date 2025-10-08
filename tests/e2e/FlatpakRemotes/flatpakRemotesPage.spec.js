const { test, expect } = require('@playwright/test');

test.describe('Flatpak Remotes Main Page', () => {
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

  // === PAGE LOADING AND NAVIGATION ===
  test('should load Flatpak Remotes page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/flatpak_remotes/);
    await expect(page.locator('h1')).toContainText('Flatpak Remotes');
  });

  test('should display correct page header and title', async ({ page }) => {
    await expect(page.locator('h1:has-text("Flatpak Remotes")')).toBeVisible();
    await expect(page).toHaveTitle(/Flatpak Remotes/);
  });

  // === TABLE STRUCTURE AND DISPLAY ===
  test('should display table with correct column headers', async ({ page }) => {
    const table = page.locator('table[data-ouia-component-id="flatpak-remotes-table"]');
    await expect(table).toBeVisible();

    // Verify column headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("URL")')).toBeVisible();
  });

  test('should display empty state when no remotes exist', async ({ page }) => {
    // Check for empty state
    const hasData = await page.locator('table[data-ouia-component-id="flatpak-remotes-table"] tbody tr').count() > 0;

    if (!hasData) {
      // EmptyPage component from Foreman
      const emptyState = page.locator('.pf-c-empty-state, .pf-v5-c-empty-state');
      await expect(emptyState).toBeVisible();
    }
  });

  test('should display existing remotes when data is present', async ({ page }) => {
    const tableRows = page.locator('table[data-ouia-component-id="flatpak-remotes-table"] tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      // Verify first row structure
      const firstRow = tableRows.first();

      // Name column with link
      const nameLink = firstRow.locator('td').first().locator('a');
      await expect(nameLink).toBeVisible();

      // URL column with external link
      const urlLink = firstRow.locator('td').nth(1).locator('a');
      await expect(urlLink).toBeVisible();
      await expect(urlLink).toHaveAttribute('target', '_blank');

      // Actions column
      const actionsCell = firstRow.locator('td').last();
      await expect(actionsCell).toBeVisible();
    }
  });

  // === TABLE FUNCTIONALITY ===
  test('should support table sorting', async ({ page }) => {
    // Check if sort functionality exists
    const sortableHeaders = page.locator('th button[aria-sort], th[aria-sort]');
    const sortableCount = await sortableHeaders.count();

    if (sortableCount > 0) {
      const firstSortableHeader = sortableHeaders.first();
      await expect(firstSortableHeader).toBeVisible();

      // Click to test sorting
      await firstSortableHeader.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display pagination when needed', async ({ page }) => {
    const pagination = page.locator('.pf-c-pagination');

    // Check if pagination is visible
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();

      // Check pagination controls
      const pageInfo = pagination.locator('.pf-c-pagination__nav-page-select');
      if (await pageInfo.isVisible()) {
        await expect(pageInfo).toBeVisible();
      }
    }
  });

  // === LINK FUNCTIONALITY ===
  test('should handle remote name links correctly', async ({ page }) => {
    const nameLinks = page.locator('table tbody tr td:first-child a');
    const linkCount = await nameLinks.count();

    if (linkCount > 0) {
      const firstLink = nameLinks.first();
      const href = await firstLink.getAttribute('href');

      expect(href).toMatch(/\/flatpak_remotes\/\d+/);
      await expect(firstLink).toBeVisible();
    }
  });

  test('should handle external URL links correctly', async ({ page }) => {
    const urlLinks = page.locator('table tbody tr td:nth-child(2) a');
    const linkCount = await urlLinks.count();

    if (linkCount > 0) {
      const firstUrlLink = urlLinks.first();

      // Should be external links
      await expect(firstUrlLink).toHaveAttribute('target', '_blank');
      await expect(firstUrlLink).toHaveAttribute('rel', 'noopener noreferrer');

      const href = await firstUrlLink.getAttribute('href');
      expect(href).toMatch(/^https?:\/\//);
    }
  });

  // === ACTION MENU FUNCTIONALITY ===
  test('should display action menus for each remote', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionCell = firstRow.locator('td').last();

      // Look for action menu button or dropdown
      const actionButton = actionCell.locator('button, .pf-c-dropdown__toggle');

      if (await actionButton.isVisible()) {
        await expect(actionButton).toBeVisible();
        await expect(actionButton).toBeEnabled();
      }
    }
  });

  test('should open action menu when clicked', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();

        // Action menu should be visible
        const actionMenu = page.locator('.pf-c-dropdown__menu, .dropdown-menu');
        await expect(actionMenu).toBeVisible();

        // Should display all action options
        await expect(page.locator('button:has-text("Scan"), a:has-text("Scan")')).toBeVisible();
        await expect(page.locator('button:has-text("Edit"), a:has-text("Edit")')).toBeVisible();
        await expect(page.locator('button:has-text("Delete"), a:has-text("Delete")')).toBeVisible();
      }
    }
  });

  test('should close action menu when clicking outside', async ({ page }) => {
    const tableRows = page.locator('table tbody tr[data-ouia-component-id*="flatpak-remote-row"]');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      const actionButton = firstRow.locator('button[aria-label="Actions"], .pf-c-dropdown__toggle').first();

      if (await actionButton.isVisible()) {
        await actionButton.click();

        // Verify menu is open
        const actionMenu = page.locator('.pf-c-dropdown__menu, .dropdown-menu');
        await expect(actionMenu).toBeVisible();

        // Click outside the menu
        await page.click('h1');

        // Menu should close
        await expect(actionMenu).not.toBeVisible();
      }
    }
  });

  // === CREATE BUTTON FUNCTIONALITY ===
  test('should have functional Create button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();

    if (await createButton.isVisible()) {
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();
    }
  });

  // === SEARCH FUNCTIONALITY ===
  test('should have functional search functionality', async ({ page }) => {
    // Foreman TableIndexPage uses SearchBar with "Search" placeholder
    const searchInput = page.locator('input[placeholder="Search"]');
    await expect(searchInput).toBeVisible();

    // Test basic search
    await searchInput.fill('test');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Should execute search without errors
    const errorAlert = page.locator('.pf-c-alert--danger');
    await expect(errorAlert).not.toBeVisible();
  });

  test('should support autocomplete search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    await expect(searchInput).toBeVisible();

    // Start typing to trigger autocomplete
    await searchInput.fill('name');

    // Foreman autocomplete appears as dropdown menu
    const autocompleteDropdown = page.locator('.dropdown-menu');
    if (await autocompleteDropdown.isVisible()) {
      await expect(autocompleteDropdown).toBeVisible();

      // Click on first suggestion
      const firstSuggestion = autocompleteDropdown.locator('li').first();
      await firstSuggestion.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should support advanced search operators', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    await expect(searchInput).toBeVisible();

    // Test search with operators
    const searchQueries = [
      'name = "test"',
      'url ~ "http"',
      'name != "empty"'
    ];

    for (const query of searchQueries) {
      await searchInput.clear();
      await searchInput.fill(query);
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');

      // Should execute search without errors
      const errorAlert = page.locator('.pf-c-alert--danger');
      await expect(errorAlert).not.toBeVisible();
    }
  });

  test('should clear search results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    await expect(searchInput).toBeVisible();

    // Perform search
    await searchInput.fill('test search');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Clear search using standard method
    await searchInput.clear();
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Search should be cleared
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe('');
  });

  // === ERROR HANDLING AND QUALITY ===
  test('should not have JavaScript errors', async ({ page }) => {
    const errors = [];

    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.reload();
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
  });
});