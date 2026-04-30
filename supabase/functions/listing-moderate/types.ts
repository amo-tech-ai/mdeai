/**
 * Types shared across listing-moderate (edge fn) and email-template
 * (pure module). Extracted so deno tests can import without dragging
 * the Deno.serve handler into scope.
 */

export interface ListingForReview {
  title: string;
  neighborhood: string;
  city: string;
  price_monthly: number;
  currency: "COP" | "USD";
  photo_count: number;
  landlord_display_name: string | null;
  reasons: string[];
}

export type ModerationAction = "approve" | "reject";

export interface ModerationOutcome {
  /** Final moderation_status the listing landed at. */
  moderation_status: "approved" | "rejected";
  /** Whether this call actually changed the row (vs already in target). */
  changed: boolean;
  listing_id: string;
}
