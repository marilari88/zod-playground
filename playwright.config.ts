import {defineConfig, devices} from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173/',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },

    {
      name: 'firefox',
      use: {...devices['Desktop Firefox']},
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/',
    reuseExistingServer: !process.env.CI,
  },
})
