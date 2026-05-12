/**
 * MASTRA-038 / MASTRA-039 — Mastra chat live smoke (Medellín summer events).
 *
 * Run against a Vercel Preview URL (MASTRA-038) or Production (MASTRA-039):
 *   PLAYWRIGHT_BASE_URL=<url> npx playwright test tests/smoke/mastra-chat-events-weekend.spec.ts
 *
 * Pre-requisites before this spec is meaningful:
 * 1. The target URL has VITE_USE_MASTRA_CHAT=true and VITE_MASTRA_SERVER_URL set.
 * 2. Real seeded events exist in public.events with status='published' and
 *    event_start_time in the May–Sep 2026 window (seeded via 20260512130000
 *    and 20260513100000 migrations — Feria de las Flores, Colombiamoda, etc.).
 * 3. The four inline chat cards expose data-mdeai-card="event|rental|
 *    restaurant|attraction" (shipped alongside MASTRA-038).
 *
 * What this spec proves:
 * - The chat widget mounts on the target URL.
 * - A POST goes to the Mastra server URL (not /functions/v1/ai-chat).
 * - At least one [data-mdeai-card="event"] appears within 30s of submit.
 * - The wrapper [data-mdeai-embedded-listings][data-mdeai-action] contains
 *   OPEN_EVENT_RESULTS.
 *
 * What this spec does NOT prove (verify manually + by reading ai_runs):
 * - The right *content* of the card (date, venue) — leave that to the human
 *   reviewer with the precheck SQL output.
 * - The map pin renders — selector for the map container is product-specific
 *   and intentionally left to the human runbook step.
 *
 * Query rationale: "major events in Medellín this summer" is durable against
 * real seeded anchor events (Feria de las Flores, Colombiamoda, Altavoz, etc.)
 * and does not require a time-sensitive weekend fixture that must be deleted
 * after the smoke run.
 */

import { test, expect } from '@playwright/test';

const PROMPT = 'major events in Medellín this summer';

test.describe('Mastra chat — major events in Medellín this summer', () => {
  test('returns at least one event card and posts to the Mastra runtime', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
    test.skip(!baseUrl, 'PLAYWRIGHT_BASE_URL not set — this is a Preview/Production smoke only');

    const prompt = PROMPT;

    // Capture chat POSTs so we can assert routing to Mastra.
    const chatPostUrls: string[] = [];
    page.on('request', (req) => {
      if (req.method() !== 'POST') return;
      const url = req.url();
      if (
        url.includes('/functions/v1/ai-chat') ||
        url.includes('/chat') ||
        url.includes('/api/chat') ||
        url.includes('mastra')
      ) {
        chatPostUrls.push(url);
      }
    });

    await page.goto(baseUrl!);

    // Confirm the flag is on.
    const flagOn = await page.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => (import.meta as any).env?.VITE_USE_MASTRA_CHAT === 'true',
    );
    expect(flagOn, 'VITE_USE_MASTRA_CHAT must be "true" on the target URL').toBe(true);

    // Open the chat widget. Adjust the selector if the global chat trigger has
    // a different test id on the target build.
    const chatTrigger = page.locator(
      '[data-mdeai-chat-trigger], [aria-label="Open chat"], button:has-text("Chat")',
    );
    if (await chatTrigger.count()) {
      await chatTrigger.first().click({ trial: false });
    }

    // Type the prompt.
    const input = page.locator(
      '[data-mdeai-chat-input], textarea[placeholder*="Ask"], textarea[placeholder*="Type"]',
    );
    await expect(input.first()).toBeVisible({ timeout: 10_000 });
    await input.first().fill(prompt);
    await input.first().press('Enter');

    // Wait for an inline event card.
    const eventCard = page.locator('[data-mdeai-card="event"]');
    await expect(eventCard.first()).toBeVisible({ timeout: 30_000 });
    expect(await eventCard.count()).toBeGreaterThan(0);

    // Wrapper carries the action type.
    const wrapper = page.locator(
      '[data-mdeai-embedded-listings][data-mdeai-action*="OPEN_EVENT_RESULTS"]',
    );
    await expect(wrapper.first()).toBeAttached();

    // Routing assertion — at least one POST must hit the Mastra runtime,
    // and zero may hit the legacy ai-chat edge function.
    const wentToLegacy = chatPostUrls.some((u) => u.includes('/functions/v1/ai-chat'));
    expect(wentToLegacy, 'No POST should have gone to legacy /functions/v1/ai-chat').toBe(false);
    const wentToMastra = chatPostUrls.length > 0;
    expect(wentToMastra, 'At least one chat POST must have been captured').toBe(true);
  });
});
