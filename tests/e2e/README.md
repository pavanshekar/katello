# Playwright E2E Tests for Katello

This directory contains end-to-end tests for Katello using Playwright.

## Prerequisites

1. **Foreman with Katello must be running**: Since Katello is a Foreman plugin, you need a running Foreman instance with Katello enabled.

2. **Start Foreman development server**:
   ```bash
   cd /path/to/foreman
   bundle exec rails server -p 3000
   ```

   Or if using puma directly:
   ```bash
   bundle exec puma -p 3000
   ```

## Running Tests

### Basic test run
```bash
npm run test:e2e
```

### Run tests with UI (interactive mode)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run specific test file
```bash
npx playwright test tests/e2e/basic.spec.js
```

### Remote Development Setup

  When running tests from your laptop against a remote dev box:

  1. **Update playwright.config.js** to point to your dev box:
     ```javascript
     // Replace localhost with your dev box hostname
     use: {
       baseURL: 'https://your-dev-box-hostname',
     }

## Configuration

### Environment Variables

You can set these environment variables to customize test behavior:

- `FOREMAN_USERNAME`: Username for login tests (default: 'admin')
- `FOREMAN_PASSWORD`: Password for login tests (default: 'changeme')

Example:
```bash
FOREMAN_USERNAME=testuser FOREMAN_PASSWORD=testpass npm run test:e2e
```

### Playwright Configuration

The main configuration is in `playwright.config.js`. Key settings:

- **Base URL**: `http://localhost:3000` (Foreman development server)
- **Browsers**: Currently configured for Chromium only (Firefox and WebKit commented out)
- **Timeouts**: Extended for Foreman's slower response times
- **Test Directory**: `./tests/e2e`

## Test Structure

## Fixture-Based Testing

  ### Global Setup and Fixture Loading

  All E2E tests use **fixture-based testing** rather than creating test data during test execution. This approach:

  **Faster test execution** - Data is loaded once before all tests
  **Consistent test data** - Same fixtures used across all test runs
  **No data cleanup needed** - Test database is reset with fresh fixtures each run
  **Parallel test execution** - Tests don't interfere with each other's data

  ### How it Works

  1. **Global Setup** (`tests/globalSetup.js`):
     - Runs once before all tests start
     - Loads Foreman base fixtures
     - Loads all Katello fixtures from `test/fixtures/models/`
     - Creates admin user for test authentication

  2. **Test Execution**:
     - Tests read and interact with pre-loaded fixture data
     - No login required (fixtures loaded in test database)
     - Organization selection handled automatically

  3. **Fixture Data**:
     - Located in: `test/fixtures/models/katello_*.yml`
     - Uses Rails fixture format with ERB
     - Loaded via: `RAILS_ENV=test rake db:fixtures:load`

  ### Example Test Using Fixtures

  ```javascript
  test.describe('Flatpak Remotes Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to page (fixtures already loaded by globalSetup)
      await page.goto('/flatpak_remotes');
      await page.waitForLoadState('networkidle');

      // Handle organization selection (fixtures use Empty Organization)
      const orgSelector = page.locator('select, [role="combobox"]').first();
      if (await orgSelector.isVisible()) {
        await page.selectOption('select, [role="combobox"]', { label: 'Empty Organization' });
        await page.click('button:has-text("Select")');
        await page.waitForLoadState('networkidle');
      }
    });
  });
  ```

### Current Tests

1. **Homepage Load Test**: Verifies Foreman loads correctly
2. **Login Form Test**: Checks login form elements are present
3. **Katello Menu Test**: Verifies Katello-specific menus appear after login
4. **Navigation Test**: Basic navigation functionality
5. **JavaScript Error Test**: Checks for critical JavaScript errors
6. **FlatpakRemotes/**: Comprehensive test suite for Flatpak Remotes functionality
    - **flatpakRemotesPage.spec.js**: Main page functionality (table display, search, navigation, action menus)
    - **createEditFlatpakRemote.spec.js**: Create and Edit modal functionality with form validation and backend verification
    - **deleteFlatpakRemote.spec.js**: Delete confirmation modal and actual deletion verification with API monitoring
    - **flatpakRemoteDetails.spec.js**: Detail page functionality (navigation, action buttons, repository display)
    - **mirrorFlatpakRepository.spec.js**: Repository mirroring functionality with product selection and backend verification

### Adding New Tests

Create new `.spec.js` files in the `tests/e2e` directory. Example:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('My Feature Tests', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Your test code here
  });
});
```

## Automated Test Generation with Codegen

  Playwright provides a codegen tool to help generate tests automatically:

  ```bash
  npx playwright codegen <url>
  ```

  When to Use Codegen

  Codegen is useful for:
  - Getting started quickly
  - Finding the right selectors for elements
  - Learning Playwright syntax
  - Prototyping interaction flows

  Important Note

  Always refactor auto-generated tests into well-structured, maintainable tests. Auto-generated code often contains:
  - Hardcoded selectors that may be brittle
  - Unnecessary wait times
  - Redundant actions
  - Poor organization

  Use codegen as a starting point, then refactor the generated code to follow best practices and maintain consistency with your existing
  test suite.


## Troubleshooting

### Connection Refused Errors
- Ensure Foreman is running on port 3000
- Check that Katello plugin is properly loaded

### Browser Launch Errors (WebKit)
- WebKit has library dependencies that may not be available
- Use Chromium or Firefox for testing

### Slow Tests
- Foreman can be slow to respond
- Tests have extended timeouts configured
- Consider running with `--workers=1` for debugging

### Login Issues
- Verify credentials in environment variables
- Check that the user exists in Foreman
- Ensure the user has appropriate permissions

## CI/CD Integration

For continuous integration, you may want to:

1. Set up a test database
2. Start Foreman in test mode
3. Run tests with `--reporter=junit` for CI systems
4. Use `--workers=1` to avoid race conditions

Example CI command:
```bash
RAILS_ENV=test npm run test:e2e -- --reporter=junit
```