import { test, expect } from "../playwright-fixture";

/**
 * D14 spec 2 — renter contact-host form critical path.
 *
 * Walks the D7.5 flow: visit a V1 apartment detail page, click
 * "Contact Host", fill the 3-field modal, click Send via WhatsApp,
 * confirm the modal advances to the "Did your message send on
 * WhatsApp?" confirmation step.
 *
 * Mocks window.open so we don't actually launch wa.me in CI. Mocks
 * the lead-from-form edge fn so we don't write to live DB.
 */

const APT_ID = "11111111-2222-3333-4444-555555555555";

test.describe("Renter contact-host form", () => {
  test.beforeEach(async ({ page }) => {
    // Stub the apartments query so the detail page renders
    // without needing a real V1 listing in the live DB.
    await page.route("**/rest/v1/apartments?**", async (route) => {
      const url = route.request().url();
      if (url.includes(`id=eq.${APT_ID}`)) {
        const accept = route.request().headers()["accept"] ?? "";
        const wantsSingle = accept.includes("vnd.pgrst.object+json");
        const apartment = {
          id: APT_ID,
          title: "E2E test apartment in Provenza",
          description: "Mock listing for D14 Playwright spec.",
          neighborhood: "El Poblado",
          city: "Medellín",
          price_monthly: 4500000,
          currency: "COP",
          bedrooms: 2,
          bathrooms: 2,
          size_sqm: 80,
          images: [],
          landlord_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          moderation_status: "approved",
          status: "active",
          host_name: "Mario T.",
          created_at: "2026-05-01T00:00:00Z",
          updated_at: "2026-05-01T00:00:00Z",
        };
        return route.fulfill({
          status: 200,
          contentType: wantsSingle
            ? "application/vnd.pgrst.object+json"
            : "application/json",
          body: JSON.stringify(wantsSingle ? apartment : [apartment]),
        });
      }
      return route.continue();
    });

    // Stub the lead-from-form edge fn so we don't write a real lead.
    await page.route("**/functions/v1/lead-from-form", async (route) => {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            lead_id: "ffffffff-eeee-dddd-cccc-bbbbbbbbbbbb",
            whatsapp_e164: "+573001234567",
            landlord_display_name: "Mario T.",
            apartment: {
              id: APT_ID,
              title: "E2E test apartment in Provenza",
              neighborhood: "El Poblado",
            },
          },
        }),
      });
    });

    // Capture wa.me opens so we don't actually navigate.
    await page.addInitScript(() => {
      // @ts-expect-error — capture for assertion
      window.__waOpens = [];
      const orig = window.open;
      window.open = (url, ...rest) => {
        // @ts-expect-error
        window.__waOpens.push(url);
        return null;
      };
    });
  });

  test("fills form, opens WhatsApp, advances to confirm step", async ({ page }) => {
    await page.goto(`/apartments/${APT_ID}`, { waitUntil: "domcontentloaded" });

    // The Contact Host button lives in the right-panel (set via
    // setRightPanelContent in ApartmentDetail). On the detail page,
    // ANY button with the text "Contact Host" is the correct one;
    // there are typically 2-3 instances (header CTA + right panel).
    await page.getByRole("button", { name: "Contact Host" }).first().click();

    // Modal renders the 3 fields + send button.
    await expect(page.getByTestId("whatsapp-contact-modal")).toBeVisible();
    await page.getByTestId("contact-name-input").fill("E2E Sofia");
    await page.getByTestId("contact-when-now").click();
    await page
      .getByTestId("contact-message-input")
      .fill("Hola, ¿está disponible para noviembre?");

    await page.getByTestId("contact-send-btn").click();

    // After submit, the modal advances to the confirm step.
    await expect(page.getByTestId("contact-host-confirm")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId("contact-confirm-yes")).toBeVisible();

    // wa.me URL was opened with the prefilled body.
    const opens: string[] = await page.evaluate(
      // @ts-expect-error
      () => window.__waOpens,
    );
    expect(opens.length).toBeGreaterThanOrEqual(1);
    expect(opens[0]).toMatch(/^https:\/\/wa\.me\/573001234567\?text=/);
    const decoded = decodeURIComponent(opens[0]);
    expect(decoded).toContain("E2E Sofia");
    expect(decoded).toContain("E2E test apartment in Provenza");
  });
});
