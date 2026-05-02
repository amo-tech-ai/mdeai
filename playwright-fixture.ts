/**
 * Playwright base fixture for mdeai.co — D14.
 *
 * Provides:
 *   - `test` / `expect` from @playwright/test
 *   - `signInAsLandlord(page)` — supabase-js auth helper that hits the
 *     real auth endpoint with qa-landlord@mdeai.co (seeded migration
 *     20260501000000_landlord_v1_qa_user_seed.sql). Stashes the
 *     session in localStorage so subsequent navigations are
 *     authenticated.
 *
 * Credentials are sourced from env vars (preferred) or the seed-file
 * defaults. Never hard-code prod credentials in tests.
 */

import { test as base, expect, type Page } from "@playwright/test";

const SUPABASE_URL =
  process.env.PLAYWRIGHT_SUPABASE_URL ??
  "https://zkwcbyxiwklihegjhuql.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.PLAYWRIGHT_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprd2NieXhpd2tsaWhlZ2podXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTUyNDIsImV4cCI6MjA4MTk5MTI0Mn0.XFif2SYWfDs-MD-HQbGJ2VC0GoCr_n5yd_HBx2MHUUY";

const LANDLORD_EMAIL =
  process.env.PLAYWRIGHT_QA_LANDLORD_EMAIL ?? "qa-landlord@mdeai.co";
const LANDLORD_PASSWORD =
  process.env.PLAYWRIGHT_QA_LANDLORD_PASSWORD ?? "Qa-Landlord-V1-2026";

const STORAGE_KEY = "sb-zkwcbyxiwklihegjhuql-auth-token";

interface SupabaseTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: { id: string; email: string };
}

/**
 * Sign in as the seeded qa-landlord by calling the GoTrue REST endpoint
 * directly (faster + more reliable than driving the login form), then
 * write the session into localStorage so the React app picks it up on
 * the next navigation.
 *
 * Caller MUST navigate to a URL on the same origin AFTER calling this
 * (so localStorage is on the right origin).
 */
export async function signInAsLandlord(page: Page): Promise<void> {
  const response = await page.request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      data: { email: LANDLORD_EMAIL, password: LANDLORD_PASSWORD },
    },
  );
  if (!response.ok()) {
    throw new Error(
      `signInAsLandlord failed: ${response.status()} ${await response.text()}`,
    );
  }
  const session = (await response.json()) as SupabaseTokenResponse;

  // Navigate to a same-origin page first, then drop the session into
  // localStorage. Visiting "/" works for any baseURL.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(session)],
  );
}

export const test = base.extend<{
  signedInLandlord: Page;
}>({
  /**
   * Auto-signed-in landlord page. Use when a spec needs an authenticated
   * landlord but doesn't care about the sign-in flow itself.
   *
   * Usage:
   *   test("landlord sees their leads", async ({ signedInLandlord }) => {
   *     await signedInLandlord.goto("/host/leads");
   *     ...
   *   });
   */
  signedInLandlord: async ({ page }, useFixture) => {
    await signInAsLandlord(page);
    await useFixture(page);
  },
});

export { expect };
