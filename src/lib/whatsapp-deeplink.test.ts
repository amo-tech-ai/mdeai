import { describe, it, expect } from "vitest";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  buildWhatsAppDeepLink,
} from "./whatsapp-deeplink";

// whatsapp-deeplink contract:
//   - Message includes greeting + place + move-when + optional msg + sig + URL.
//   - URL strips non-digits from phone, encodes the body, errors on short phone.

const BASE = {
  renterName: "Sofia",
  apartmentTitle: "Bright 2-BR",
  apartmentNeighborhood: "El Poblado",
  listingUrl: "https://mdeai.co/apartments/abc",
  moveWhen: "soon" as const,
};

describe("buildWhatsAppMessage", () => {
  it("includes greeting, place, move-when, and signature", () => {
    const msg = buildWhatsAppMessage(BASE);
    expect(msg).toContain("Bright 2-BR (El Poblado)");
    expect(msg).toContain("Move-in: moving-in soon (1-3 months).");
    expect(msg).toContain("— Sofia (via mdeai)");
    expect(msg).toContain("https://mdeai.co/apartments/abc");
  });

  it("includes the optional free-text message when provided", () => {
    const msg = buildWhatsAppMessage({
      ...BASE,
      message: "Is parking included?",
    });
    expect(msg).toContain("Is parking included?");
  });

  it("trims whitespace from the optional message", () => {
    const msg = buildWhatsAppMessage({ ...BASE, message: "   hello   " });
    expect(msg).toContain("\nhello");
    expect(msg).not.toContain("   hello");
  });

  it("omits the optional message line when empty/blank", () => {
    const a = buildWhatsAppMessage({ ...BASE });
    const b = buildWhatsAppMessage({ ...BASE, message: "   " });
    expect(a).toBe(b);
  });

  it("falls back to bare title when neighborhood is omitted", () => {
    const msg = buildWhatsAppMessage({
      ...BASE,
      apartmentNeighborhood: undefined,
    });
    expect(msg).toContain("interested in Bright 2-BR.");
    expect(msg).not.toContain("(El Poblado)");
  });

  it.each([
    ["now", "moving-in now (within a few weeks)"],
    ["soon", "moving-in soon (1-3 months)"],
    ["later", "still browsing, no rush"],
  ] as const)("formats move-when=%s as %s", (when, label) => {
    const msg = buildWhatsAppMessage({ ...BASE, moveWhen: when });
    expect(msg).toContain(`Move-in: ${label}.`);
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds a wa.me URL with digits-only phone + encoded body", () => {
    const url = buildWhatsAppUrl("+57 300 123 4567", "Hi there!");
    expect(url).toBe("https://wa.me/573001234567?text=Hi%20there!");
  });

  it("encodes newlines as %0A", () => {
    const url = buildWhatsAppUrl("+573001234567", "line1\nline2");
    expect(url).toContain("line1%0Aline2");
  });

  it("throws on a too-short phone number", () => {
    expect(() => buildWhatsAppUrl("+57", "msg")).toThrow(/phone too short/);
    expect(() => buildWhatsAppUrl("", "msg")).toThrow(/phone too short/);
  });

  it("strips parens, dashes, and spaces from phone", () => {
    const url = buildWhatsAppUrl("(+57) 300-123-4567", "x");
    expect(url).toMatch(/^https:\/\/wa\.me\/573001234567\?/);
  });
});

describe("buildWhatsAppDeepLink", () => {
  it("returns both url and message", () => {
    const { url, message } = buildWhatsAppDeepLink("+573001234567", BASE);
    expect(url).toMatch(/^https:\/\/wa\.me\/573001234567\?text=/);
    expect(message).toContain("Bright 2-BR");
  });
});
