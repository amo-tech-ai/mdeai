/**
 * WhatsApp deep-link helpers — Landlord V1 D7.5.
 *
 * `wa.me/<phone>?text=<encoded>` opens the WhatsApp app with a draft
 * message addressed to the host. Works on iOS, Android, desktop web
 * (redirects to web.whatsapp.com when the app isn't installed).
 *
 * Why deep-link instead of WhatsApp Business API? V1 plan §1.2 defers
 * the Business API to V2 — the deep-link costs $0 and works for the
 * whole funnel (browse → click → message landlord) without any
 * provisioning on the landlord's side beyond having WhatsApp.
 */

/** When the renter expects to move in. Maps to landlord_inbox.structured_profile.move_when. */
export type MoveWhen = "now" | "soon" | "later";

const MOVE_WHEN_LABEL: Record<MoveWhen, string> = {
  now: "moving-in now (within a few weeks)",
  soon: "moving-in soon (1-3 months)",
  later: "still browsing, no rush",
};

export interface BuildMessageInput {
  /** First name (or full); just used to sign the message. */
  renterName: string;
  /** Listing title for context. */
  apartmentTitle: string;
  /** Neighborhood for friendlier salutation. */
  apartmentNeighborhood?: string;
  /** Public listing URL the host can click to see what's referenced. */
  listingUrl: string;
  /** When the renter wants to move (radio answer). */
  moveWhen: MoveWhen;
  /** Optional free-text addendum. */
  message?: string;
}

/**
 * Build the prefilled WhatsApp message body. Renderer sets the lead-in,
 * the listing context, the move-when, and the user's optional message.
 * The host only sees this whole block — the wa.me URL just opens with
 * the body in the input area.
 */
export function buildWhatsAppMessage(input: BuildMessageInput): string {
  const lines: string[] = [];
  const place = input.apartmentNeighborhood
    ? `${input.apartmentTitle} (${input.apartmentNeighborhood})`
    : input.apartmentTitle;
  lines.push(`Hi! I'm interested in ${place}.`);
  lines.push("");
  lines.push(`Move-in: ${MOVE_WHEN_LABEL[input.moveWhen]}.`);
  if (input.message?.trim()) {
    lines.push("");
    lines.push(input.message.trim());
  }
  lines.push("");
  lines.push(`— ${input.renterName} (via mdeai)`);
  lines.push(input.listingUrl);
  return lines.join("\n");
}

/**
 * Build the full wa.me URL. Phone is normalized to digits-only.
 *
 * Throws when the phone doesn't have at least 8 digits (E.164 minimum
 * for a real mobile number) so the caller never opens a broken link.
 */
export function buildWhatsAppUrl(
  phoneE164: string,
  message: string,
): string {
  const digits = phoneE164.replace(/\D+/g, "");
  if (digits.length < 8) {
    throw new Error(
      `whatsapp-deeplink: phone too short (got "${phoneE164}", needs ≥8 digits)`,
    );
  }
  // wa.me uses %20 for spaces, %0A for newlines — encodeURIComponent
  // produces the right output for both.
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Convenience: build message + URL in one call. */
export function buildWhatsAppDeepLink(
  phoneE164: string,
  msgInput: BuildMessageInput,
): { url: string; message: string } {
  const message = buildWhatsAppMessage(msgInput);
  const url = buildWhatsAppUrl(phoneE164, message);
  return { url, message };
}
