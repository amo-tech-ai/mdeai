import { test, expect } from "../playwright-fixture";

/**
 * D14 spec 1 — anon-redirect critical path.
 *
 * Confirms RoleProtectedRoute (D7) keeps unauthenticated visitors out
 * of /host/* and preserves the deep link via ?returnTo=… so a paste-from-
 * Slack URL lands on the right page after sign-in.
 *
 * Why this is the "guard rail" test: any regression in the auth gate
 * could expose landlord-side data to anon visitors. Catching it early.
 */

test.describe("Anon visitors", () => {
  test("/host/dashboard redirects to /login with returnTo param", async ({ page }) => {
    await page.goto("/host/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fhost%2Fdashboard/);
  });

  test("/host/leads redirects to /login with returnTo param", async ({ page }) => {
    await page.goto("/host/leads", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fhost%2Fleads/);
  });

  test("/host/listings/new redirects to /login with returnTo param", async ({ page }) => {
    await page.goto("/host/listings/new", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login\?returnTo=/);
  });

  test("/apartments stays public (no auth gate)", async ({ page }) => {
    await page.goto("/apartments", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/apartments/);
    await expect(page).not.toHaveURL(/\/login/);
  });
});
