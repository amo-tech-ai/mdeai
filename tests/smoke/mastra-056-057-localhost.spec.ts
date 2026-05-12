/**
 * MASTRA-056 / MASTRA-057 — localhost browser sanity (optional CI/manual gate).
 *
 * MASTRA-056: Chat map shell mounts without runtime crashes — prerequisite for
 * future `category: 'grounded'` pins once MASTRA-049 lands (no grounded MCP yet).
 *
 * MASTRA-057: No UI surface — after Playwright, verify quota table via SQL locally:
 *   supabase db query --local -o table 'select count(*) from public.grounding_quota_log'
 *
 * Run:
 *   npm run dev   # port 8080 (or set PLAYWRIGHT_BASE_URL to actual origin)
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 \\
 *     npx playwright test tests/smoke/mastra-056-057-localhost.spec.ts \\
 *       --config playwright.smoke.config.ts
 */

import { test, expect } from '@playwright/test';

const DEFAULT_ORIGIN = 'http://127.0.0.1:8080';

function origin(): string {
  return (
    process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_ORIGIN
  );
}

test.describe('localhost — chat map shell (MASTRA-056 baseline)', () => {
  test('GET /chat loads map panel copy without page errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err.message)));

    await page.goto(`${origin()}/chat`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    await expect(
      page.getByText(/Pins appear here as you chat/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    expect(
      errors,
      `Uncaught page errors:\n${errors.join('\n')}`,
    ).toHaveLength(0);
  });
});
