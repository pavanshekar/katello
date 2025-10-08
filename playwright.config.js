// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',

  // Global setup - loads Rails fixtures before all tests
  globalSetup: require.resolve('./tests/globalSetup.js'),

  // Run tests in files in parallel (reduce for VM performance)
  fullyParallel: !process.env.VM_MODE,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reduce workers in VM environment for better performance
  workers: process.env.VM_MODE ? 1 : (process.env.CI ? 1 : undefined),

  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: 'html',

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL - both dev and test use port 3000 (different RAILS_ENV on server side)
    baseURL: 'http://centos9-katello-devel-stable.example.com:3000',

    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',

    // Ignore HTTPS errors for development
    ignoreHTTPSErrors: true,

    // Set reasonable timeouts for Foreman app
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Timeout for each test (includes setup/teardown with DB operations)
  timeout: 60000,

  // Configure projects for major browsers (start with just Chromium)
  projects: [
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: '**/*.setup.js',
    },
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Uncomment these once you have the basic setup working
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // Note: webkit has library dependency issues on this system
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Test against mobile viewports.
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    // Test against branded browsers.
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  // Run your local dev server before starting the tests
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
