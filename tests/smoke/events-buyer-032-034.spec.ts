/**
 * EVT-032 → EVT-034 — production-safe buyer route smoke (no Stripe charge).
 *
 * Run:
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test tests/smoke/events-buyer-032-034.spec.ts --config playwright.smoke.config.ts
 *   PLAYWRIGHT_BASE_URL=https://www.mdeai.co npx playwright test tests/smoke/events-buyer-032-034.spec.ts --config playwright.smoke.config.ts
 *
 * Full payment + webhook proof: bash scripts/evt069-stripe-smoke.sh (cs_test_ only)
 */

import { test, expect } from '@playwright/test';

const EVENT_ID =
  process.env.EVT_SMOKE_EVENT_ID ?? '22222222-2222-2222-2222-000000000001';

function base(): string {
  return (
    process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8080'
  );
}

test.describe('EVT-032–034 buyer smoke', () => {
  test('events list loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(`${base()}/events`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({
      timeout: 30_000,
    });
    expect(errors.filter((e) => /stripe|live/i.test(e))).toHaveLength(0);
  });

  test('event detail shows V2 buy CTA', async ({ page }) => {
    await page.goto(`${base()}/events/${EVENT_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(page.locator('body')).not.toContainText(/internal server error/i, {
      timeout: 10_000,
    });
    await expect(page.getByRole('heading', { name: /buy tickets/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: /^buy ticket$/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('wallet route renders without crash', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base()}/me/tickets`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(page.getByRole('heading', { name: /my tickets/i })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('ticket detail route does not 500 for unknown id', async ({ page }) => {
    await page.goto(`${base()}/me/tickets/00000000-0000-4000-8000-000000000099`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).not.toMatch(/internal server error/);
  });
});
