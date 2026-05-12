import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/smoke',
  timeout: 60_000,
  retries: 1,
  workers: 1,
  reporter: 'list',
  use: {
    headless: true,
    ...devices['Desktop Chrome'],
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
  },
});
