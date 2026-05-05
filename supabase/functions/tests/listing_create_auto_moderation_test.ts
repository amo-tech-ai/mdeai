// Pure-fn coverage for the listing auto-moderation rules.
// Run via `npm run verify:edge` — wraps `deno test`.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  autoModerationVerdict,
  containsContactInfo,
  isInMedellinMetro,
  type ListingForModeration,
} from "../listing-create/auto-moderation.ts";

const baseValid: ListingForModeration = {
  description:
    "Sunny two-bedroom apartment in El Poblado with mountain views, " +
    "10 minutes from Parque Lleras. Newly furnished. Perfect for nomads " +
    "and short stays alike. Wifi 200 mbps. Quiet building.",
  latitude: 6.21,
  longitude: -75.57,
  price_monthly: 1_500_000,
  currency: "COP",
  photos_count: 6,
};

Deno.test("autoModerationVerdict — clean listing returns auto_approved", () => {
  const out = autoModerationVerdict(baseValid);
  assertEquals(out.verdict, "auto_approved");
  assertEquals(out.reasons, []);
});

Deno.test("autoModerationVerdict — single violation returns needs_review", () => {
  const out = autoModerationVerdict({ ...baseValid, photos_count: 4 });
  assertEquals(out.verdict, "needs_review");
  assertEquals(out.reasons, ["photos_lt_5"]);
});

Deno.test("autoModerationVerdict — two violations returns rejected", () => {
  const out = autoModerationVerdict({
    ...baseValid,
    photos_count: 3,
    description: "Tiny",
  });
  assertEquals(out.verdict, "rejected");
  assertEquals(out.reasons.sort(), ["description_too_short", "photos_lt_5"]);
});

Deno.test("autoModerationVerdict — out-of-range price (COP) flagged", () => {
  const out = autoModerationVerdict({ ...baseValid, price_monthly: 50_000 });
  assertEquals(out.verdict, "needs_review");
  assertEquals(out.reasons, ["price_out_of_range_cop"]);
});

Deno.test("autoModerationVerdict — out-of-range price (USD) flagged", () => {
  const out = autoModerationVerdict({
    ...baseValid,
    price_monthly: 9_000,
    currency: "USD",
  });
  assertEquals(out.verdict, "needs_review");
  assertEquals(out.reasons, ["price_out_of_range_usd"]);
});

Deno.test("autoModerationVerdict — outside Medellín metro flagged", () => {
  const out = autoModerationVerdict({
    ...baseValid,
    latitude: 4.71, // Bogotá
    longitude: -74.07,
  });
  assertEquals(out.verdict, "needs_review");
  assertEquals(out.reasons, ["outside_medellin_metro"]);
});

Deno.test("autoModerationVerdict — phone in description flagged", () => {
  const out = autoModerationVerdict({
    ...baseValid,
    description: baseValid.description + " Call me at +573001234567",
  });
  assertEquals(out.verdict, "needs_review");
  assertEquals(out.reasons, ["contact_info_in_description"]);
});

Deno.test("autoModerationVerdict — email in description flagged", () => {
  const out = autoModerationVerdict({
    ...baseValid,
    description:
      "Beautiful 1-bedroom in Laureles, perfect for digital nomads. " +
      "Email me at host@example.com to reserve.",
  });
  assertEquals(out.verdict, "needs_review");
  assertEquals(out.reasons, ["contact_info_in_description"]);
});

Deno.test("autoModerationVerdict — short description flagged", () => {
  const out = autoModerationVerdict({
    ...baseValid,
    description: "Nice place. Available now.",
  });
  assertEquals(out.verdict, "needs_review");
  assertEquals(out.reasons, ["description_too_short"]);
});

Deno.test("isInMedellinMetro — known points", () => {
  // El Poblado
  assertEquals(isInMedellinMetro(6.21, -75.57), true);
  // Laureles
  assertEquals(isInMedellinMetro(6.245, -75.59), true);
  // Bello (N edge)
  assertEquals(isInMedellinMetro(6.34, -75.55), true);
  // Bogotá (way out)
  assertEquals(isInMedellinMetro(4.71, -74.07), false);
  // Caribbean coast
  assertEquals(isInMedellinMetro(11.0, -74.8), false);
});

Deno.test("containsContactInfo — true cases", () => {
  assertEquals(containsContactInfo("call me at +57 300 123 4567"), true);
  assertEquals(containsContactInfo("(305) 555-1234 anytime"), true);
  assertEquals(containsContactInfo("write to host@example.com"), true);
  assertEquals(containsContactInfo("email: jane.doe+rentals@example.co"), true);
});

Deno.test("containsContactInfo — false cases", () => {
  assertEquals(containsContactInfo("5 stars on AirBnB"), false);
  assertEquals(containsContactInfo("Apt 3B, 4th floor"), false);
  assertEquals(containsContactInfo("125 sqm with city view"), false);
});

Deno.test("autoModerationVerdict — exactly 5 photos passes the photo gate", () => {
  const out = autoModerationVerdict({ ...baseValid, photos_count: 5 });
  assertEquals(out.verdict, "auto_approved");
  assertEquals(out.reasons, []);
});

Deno.test("autoModerationVerdict — exactly 80 chars passes the description gate", () => {
  const desc80 = "a".repeat(80);
  const out = autoModerationVerdict({ ...baseValid, description: desc80 });
  assertEquals(out.verdict, "auto_approved");
  assertEquals(out.reasons, []);
});
