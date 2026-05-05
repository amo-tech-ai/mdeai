import { test, expect, signInAsLandlord } from "../playwright-fixture";

/**
 * D14 spec 3 — landlord inbox + lead detail smoke test.
 *
 * Verifies:
 *   - qa-landlord can sign in via the GoTrue REST endpoint + localStorage
 *   - /host/leads loads the inbox shell (header + filters)
 *   - Either at least one card renders OR the empty state shows
 *   - Clicking a card navigates to /host/leads/:id and renders the
 *     detail shell (back link + status pill + Responder section)
 *
 * The exhaustive status-transition matrix (new → viewed → replied →
 * archived → reopen) is covered by LeadStatusActions.test.tsx (8
 * vitest cases) where we can mock the mutation cleanly. This E2E
 * smoke test only verifies that the network round-trips work in a
 * real browser against the live DB.
 */

test.describe("Landlord inbox smoke", () => {
  test("signs in, opens /host/leads, optionally drills into a lead", async ({
    page,
  }) => {
    await signInAsLandlord(page);

    await page.goto("/host/leads", { waitUntil: "domcontentloaded" });

    // Header always renders (RoleProtectedRoute passes; HostShell + page).
    await expect(
      page.getByRole("heading", { level: 1, name: /Leads/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Filter pills always render.
    await expect(page.getByTestId("lead-status-filter")).toBeVisible();

    // Either the list OR the empty state must be visible.
    const card = page.getByTestId("lead-card").first();
    const empty = page.getByTestId("leads-empty");
    await Promise.race([
      card.waitFor({ state: "visible", timeout: 15_000 }),
      empty.waitFor({ state: "visible", timeout: 15_000 }),
    ]);

    if (await empty.isVisible()) {
      // No leads exist — the page rendered cleanly. End the test here
      // (the detail-page assertion needs a real lead).
      return;
    }

    // Click into the first card → /host/leads/:id should load.
    await card.click();
    await expect(page).toHaveURL(/\/host\/leads\/[0-9a-f-]{36}/, {
      timeout: 10_000,
    });
    await expect(page.getByTestId("lead-detail")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("lead-detail-status")).toBeVisible();
    await expect(page.getByTestId("whatsapp-reply-block")).toBeVisible();
  });
});
