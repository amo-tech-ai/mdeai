import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ListingDraft } from "./useListingDraft";

/**
 * Submits a fully-filled listing draft to the listing-create edge function.
 *
 * The edge function:
 *   - Validates the payload with Zod (auth + shape)
 *   - Looks up the caller's landlord_profiles row (must exist)
 *   - Runs the auto-moderation pure fn (5 rules)
 *   - Inserts the apartments row (service-role) with the right
 *     moderation_status / source / landlord_id / status
 *   - Returns { listing_id, moderation_status, verdict, reasons }
 *
 * Verdict semantics:
 *   - auto_approved   → moderation_status='approved', visible to renters
 *   - needs_review    → moderation_status='pending', renter still sees it
 *                       (optimistic; founder reviews via admin link, D6)
 *   - rejected        → 422; nothing inserted; UI shows reasons + lets
 *                       user fix and resubmit
 */

export type ListingCreateVerdict =
  | "auto_approved"
  | "needs_review"
  | "rejected";

export interface ListingCreateSuccess {
  listing_id: string;
  moderation_status: "approved" | "pending";
  verdict: "auto_approved" | "needs_review";
  reasons: string[];
}

export interface ListingCreateRejection {
  verdict: "rejected";
  reasons: string[];
}

export type ListingCreateOutcome =
  | { ok: true; data: ListingCreateSuccess }
  | { ok: false; rejection: ListingCreateRejection };

interface ListingCreateError extends Error {
  code?: string;
}

function buildPayload(draft: ListingDraft): Record<string, unknown> {
  return {
    address: draft.address,
    city: draft.city,
    neighborhood: draft.neighborhood,
    // Edge function will geocode when these are null (e.g. Maps fallback path)
    latitude: draft.latitude ?? 0,
    longitude: draft.longitude ?? 0,
    bedrooms: draft.bedrooms,
    bathrooms: draft.bathrooms,
    size_sqm: draft.size_sqm,
    furnished: draft.furnished,
    price_monthly: draft.price_monthly ?? 0,
    currency: draft.currency,
    minimum_stay_days: draft.minimum_stay_days,
    amenities: draft.amenities,
    building_amenities: draft.building_amenities,
    images: draft.images.map((img) => ({
      publicUrl: img.publicUrl,
      path: img.path,
      sizeBytes: img.sizeBytes,
    })),
    title: draft.title.trim(),
    description: draft.description.trim(),
  };
}

export function useListingCreate() {
  return useMutation<ListingCreateOutcome, ListingCreateError, ListingDraft>({
    mutationFn: async (draft) => {
      const payload = buildPayload(draft);
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: ListingCreateSuccess;
        error?: { code: string; message: string; details?: unknown };
        verdict?: ListingCreateVerdict;
      }>("listing-create", { body: payload });

      // supabase-js wraps non-2xx responses in `error`. The 422 rejected
      // path returns a structured body though, so we need to handle both.
      if (error) {
        // FunctionsHttpError exposes the raw response on .context (when
        // available); we read body to get the rejection reasons.
        const ctx = (error as unknown as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            if (body?.error?.code === "AUTO_REJECTED") {
              return {
                ok: false,
                rejection: {
                  verdict: "rejected",
                  reasons: body.error.details?.reasons ?? [],
                },
              };
            }
          } catch {
            // fall through to generic error
          }
        }
        const e = new Error(
          (error as Error).message ?? "Listing create failed",
        ) as ListingCreateError;
        e.code = "LISTING_CREATE_ERROR";
        throw e;
      }

      if (!data?.success || !data.data) {
        const e = new Error(
          data?.error?.message ?? "Unexpected response shape",
        ) as ListingCreateError;
        e.code = data?.error?.code ?? "INVALID_RESPONSE";
        throw e;
      }

      return { ok: true, data: data.data };
    },
  });
}
