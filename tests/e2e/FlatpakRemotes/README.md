# FlatpakRemotes Test Suite

  Comprehensive Playwright end-to-end test suite for Katello's Flatpak Remote functionality.

  ## Overview

  This test suite provides complete coverage of the Flatpak Remotes feature, including CRUD operations, repository mirroring, and advanced
  UI interactions. Tests verify both frontend behavior and backend API interactions to ensure full end-to-end functionality.

  ## Test Files

  ### Core Functionality Tests

  #### `flatpakRemotesPage.spec.js`
  **Purpose**: Tests the main Flatpak Remotes listing page

  **Test Coverage**:
  - Page loading and navigation
  - Table structure and data display
  - Search functionality (basic, autocomplete, advanced operators)
  - Action menu interactions
  - Pagination and sorting
  - Empty state handling
  - Error handling and JavaScript error monitoring

  #### `createEditFlatpakRemote.spec.js`
  **Purpose**: Tests create and edit modal functionality

  **Test Coverage**:
  - Modal opening and closing
  - Form field validation and interaction
  - Create workflow with backend verification
  - Edit workflow with pre-population
  - Form submission and navigation
  - Error handling for invalid data

  **Backend Verification**:
  - Monitors POST/PUT API calls
  - Verifies navigation to detail page after creation
  - Validates form data persistence

  #### `deleteFlatpakRemote.spec.js`
  **Purpose**: Tests delete confirmation and execution

  **Test Coverage**:
  - Delete modal opening and display
  - Confirmation message and remote name display
  - Modal closing (Cancel, X button)
  - Delete execution with backend verification
  - Error handling for failed deletions
  - Button state management during deletion

  **Backend Verification**:
  - Monitors DELETE API calls with `page.on('request')`/`page.on('response')`
  - Verifies HTTP status codes (200/204)
  - Confirms table updates after deletion
  - Validates navigation back to list page

  #### `flatpakRemoteDetails.spec.js`
  **Purpose**: Tests individual remote detail page functionality

  **Test Coverage**:
  - Navigation to detail page from name links
  - Detail page content display
  - Action buttons (Scan, Edit, Delete)
  - Repository information display
  - Breadcrumb navigation
  - Mirror functionality from detail page

  ### Advanced Feature Tests

  #### `mirrorFlatpakRepository.spec.js`
  **Purpose**: Tests repository mirroring functionality with product selection

  **Test Coverage**:
  - Mirror modal opening and interface
  - Product selection dropdown/search
  - Mirror execution with backend verification
  - Progress indicators and status updates
  - Error handling and validation
  - Network error handling

  **Backend Verification**:
  - Monitors POST requests to `/flatpak_remote_repositories/{id}/mirror`
  - Verifies task creation and response structure
  - Confirms "Last mirrored" status updates in table
  - Validates success toast notifications

  ## Test Architecture

  ### Authentication & Setup
  All tests use a common `beforeEach` setup:

  ```javascript
  test.beforeEach(async ({ page }) => {
    // Automatic login with environment credentials
    // Navigation to /flatpak_remotes
    // Wait for page load completion
  });
  ```

  Environment Variables:
  - FOREMAN_USERNAME: Login username (default: 'admin')
  - FOREMAN_PASSWORD: Login password (default: 'changeme')

  Element Selection Strategy

  Tests prioritize reliable selectors in this order:

  1. Data attributes: data-ouia-component-id (PatternFly OUIA standard)
  2. Semantic selectors: button:has-text("Action"), table tbody tr
  3. CSS classes: PatternFly component classes as fallback
  4. Avoid: XPath, position-based selectors, fragile text matching

  Backend Verification Pattern

  Tests use Playwright's network monitoring for true e2e verification:

  ```javascript
  // Monitor API calls
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().includes('/endpoint')) {
      apiCalled = true;
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/endpoint')) {
      apiSuccess = response.status() === 200;
      responseData = await response.json();
    }
  });

  // Verify both UI and backend
  expect(apiCalled).toBeTruthy();
  expect(apiSuccess).toBeTruthy();
  ```

  Wait Strategies

  Tests use appropriate wait conditions:

  - waitForLoadState('networkidle'): After navigation and API calls
  - waitForURL(): For navigation verification
  - waitForSelector(): For dynamic content loading
  - waitForTimeout(): Only when necessary for async operations

  The documentation serves both as a reference for running tests and as a guide for understanding the testing approach and architecture
  used in the FlatpakRemotes test suite.
