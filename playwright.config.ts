import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for mdeai.co — D14.
 *
 * Fast-by-default for CI: chromium only, single worker on CI (Vercel-
 * preview-style runners are 2-CPU). Local dev gets parallel execution.
 *
 * baseURL pulls from PLAYWRIGHT_BASE_URL — defaults to the dev server
 * on :8080. Override per environment (preview, prod) via env var.
 *
 * webServer: starts `npm run dev` if no server is reachable. CI sets
 * the env var so we run against the running preview instead.
 */

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: !IS_CI,
  workers: IS_CI ? 1 : undefined,
  retries: IS_CI ? 1 : 0,
  forbidOnly: IS_CI,
  reporter: IS_CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // qa-landlord credentials are sourced via storage state OR the
    // signInAsLandlord() helper in fixture.ts — never hard-coded here.
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: !IS_CI,
        timeout: 120_000,
      },
});
