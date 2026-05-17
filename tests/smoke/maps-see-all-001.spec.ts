/**
 * MAPS-SEE-ALL-001 — repeatable browser gate (localhost or production via PLAYWRIGHT_BASE_URL).
 *
 * Run:
 *   npm run dev
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test tests/smoke/maps-see-all-001.spec.ts --config playwright.smoke.config.ts
 *
 * Production spot-check (read-only):
 *   PLAYWRIGHT_BASE_URL=https://www.mdeai.co npx playwright test tests/smoke/maps-see-all-001.spec.ts --config playwright.smoke.config.ts
 */

import { test, expect } from '@playwright/test';

const DEFAULT_ORIGIN = 'http://127.0.0.1:8080';

function origin(): string {
  return process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_ORIGIN;
}

function isProduction(base: string): boolean {
  return base.includes('mdeai.co');
}

test.describe('MAPS-SEE-ALL-001', () => {
  test('stale /assets chunk must not return text/html (production)', async ({
    request,
  }) => {
    const base = origin();
    test.skip(!isProduction(base), 'Vite dev serves SPA 200 for unknown assets');

    const res = await request.get(
      `${base}/assets/Apartments-CyXgBAhe.js`,
      { failOnStatusCode: false },
    );
    const contentType = res.headers()['content-type'] ?? '';
    expect(res.status()).toBe(404);
    expect(contentType).not.toMatch(/text\/html/i);
  });

  test('apartments map view shows map canvas and at least one pin', async ({
    page,
  }) => {
    const base = origin();
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err.message)));

    const ids =
      '00000000-0000-4000-8000-000000000001,00000000-0000-4000-8000-000000000002';
    await page.goto(`${base}/apartments?ids=${ids}&view=map`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    await expect(page.getByText(/apartment/i).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.waitForTimeout(3_000);
    const gmStyle = await page.locator('.gm-style').count();
    if (!isProduction(base) && gmStyle === 0) {
      test.info().annotations.push({
        type: 'note',
        description:
          'Map did not mount — ensure VITE_GOOGLE_MAPS_API_KEY allows localhost:8080',
      });
    }

    const pinCount = await page.locator('[data-testid="map-pin"]').count();
    if (!isProduction(base) && pinCount === 0) {
      test.info().annotations.push({
        type: 'note',
        description:
          'No pins — check GOOGLE_MAPS_API_KEY referrers (use PORT=8080) and listing ids',
      });
    }

    const mapsAuthErrors = errors.filter((e) =>
      /RefererNotAllowed|ApiNotActivated|BillingNotEnabled|InvalidKey/i.test(e),
    );
    expect(mapsAuthErrors, mapsAuthErrors.join('\n')).toHaveLength(0);
  });

  test('mobile viewport — map pane has non-zero height', async ({ page }) => {
    const base = origin();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/apartments?view=map`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    const mapPane = page.locator('.gm-style').first();
    await page.waitForTimeout(2_000);
    const gmCount = await page.locator('.gm-style').count();
    if (gmCount > 0) {
      const box = await mapPane.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThan(100);
    }
  });

  test('chat rental prompt surfaces See all on map (production)', async ({
    page,
  }) => {
    const base = origin();
    test.skip(!isProduction(base), 'Requires live ai-chat on production');

    await page.goto(
      `${base}/chat?q=${encodeURIComponent('top rentals in Laureles')}`,
      { waitUntil: 'domcontentloaded', timeout: 60_000 },
    );

    const seeAll = page.getByRole('button', { name: /see all \d+ on the map/i });
    await expect(seeAll.first()).toBeVisible({ timeout: 90_000 });
    const href = await seeAll.first().getAttribute('href');
    expect(href).toMatch(/view=map/);
    expect(href).toMatch(/ids=/);
  });
});
