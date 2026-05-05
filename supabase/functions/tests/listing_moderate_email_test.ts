import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { renderNeedsReviewEmail } from "../listing-moderate/email-template.ts";

Deno.test("renderNeedsReviewEmail — includes both magic links + listing details", () => {
  const { subject, text } = renderNeedsReviewEmail(
    {
      title: "Bright 2-BR in El Poblado",
      neighborhood: "El Poblado",
      city: "Medellín",
      price_monthly: 4500000,
      currency: "COP",
      photo_count: 5,
      landlord_display_name: "Mario T.",
      reasons: ["outside_medellin_metro"],
    },
    "https://example.com/approve?token=A",
    "https://example.com/reject?token=R",
  );
  assertEquals(subject, "[mdeai] Listing needs review: Bright 2-BR in El Poblado");
  assertStringIncludes(text, "Bright 2-BR in El Poblado");
  assertStringIncludes(text, "El Poblado, Medellín");
  assertStringIncludes(text, "Mario T.");
  assertStringIncludes(text, "outside_medellin_metro");
  assertStringIncludes(text, "https://example.com/approve?token=A");
  assertStringIncludes(text, "https://example.com/reject?token=R");
  assertStringIncludes(text, "Photos: 5");
});

Deno.test("renderNeedsReviewEmail — formats COP with es-CO locale", () => {
  const { text } = renderNeedsReviewEmail(
    {
      title: "x",
      neighborhood: "y",
      city: "z",
      price_monthly: 1234567,
      currency: "COP",
      photo_count: 1,
      landlord_display_name: null,
      reasons: [],
    },
    "https://e/a",
    "https://e/r",
  );
  // es-CO uses dots as thousands separator
  assertStringIncludes(text, "$1.234.567 COP");
  assertStringIncludes(text, "(none flagged)");
  assertStringIncludes(text, "(unknown)");
});

Deno.test("renderNeedsReviewEmail — formats USD with en-US locale", () => {
  const { text } = renderNeedsReviewEmail(
    {
      title: "x",
      neighborhood: "y",
      city: "z",
      price_monthly: 1500,
      currency: "USD",
      photo_count: 1,
      landlord_display_name: "A",
      reasons: ["price_out_of_range_usd"],
    },
    "https://e/a",
    "https://e/r",
  );
  assertStringIncludes(text, "$1,500 USD");
});
