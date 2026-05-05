/**
 * formatListingPrice — render a listing price with the correct currency
 * code and locale-appropriate thousands separators.
 *
 * Used by ApartmentDetail (public + mobile CTA) and listing cards. The
 * existing inline `${amount.toLocaleString()}` pattern dropped the
 * currency code entirely, so a 3.8M COP listing rendered as "$3,800,000"
 * — easily mistaken for USD by a renter scanning prices. (P2 bug found
 * in QA 2026-05-02.)
 *
 * Returns "—" for null/undefined amounts so the caller can render
 * skeleton-free placeholders without conditionals at every callsite.
 */

export type ListingCurrency = "COP" | "USD";

export function formatListingPrice(
  amount: number | null | undefined,
  currency: ListingCurrency | string | null | undefined,
): string {
  if (amount == null) return "—";
  const cur = (currency ?? "USD").toUpperCase();
  if (cur === "COP") {
    // Colombian convention: dot thousands, no decimals on whole-peso prices.
    // "$3.800.000 COP" — matches the host dashboard formatting and the
    // way COP prices appear on Colombian rental sites.
    return `$${amount.toLocaleString("es-CO", {
      maximumFractionDigits: 0,
    })} COP`;
  }
  // USD and unknown currencies fall back to en-US thousands.
  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })} ${cur}`;
}
