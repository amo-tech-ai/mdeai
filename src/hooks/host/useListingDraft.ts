import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Listing-creation draft state shared across the 4-step wizard.
 *
 * V1 storage strategy:
 *   - Form state lives in React (no Supabase write yet — D5 ships
 *     `listing-create` edge fn).
 *   - We persist to sessionStorage keyed by `draftId` so a refresh during
 *     the wizard doesn't lose the user's work.
 *   - The draftId is generated once per wizard mount via crypto.randomUUID().
 *     It also feeds the photo upload path (listing-photos/<user>/<draftId>/...)
 *     so files for an abandoned draft can be cleaned up later by uuid.
 */

export type Currency = "COP" | "USD";

export interface ListingDraftPhoto {
  publicUrl: string;
  path: string;
  sizeBytes: number;
}

export interface ListingDraft {
  // Step 1 — Address
  address: string;
  neighborhood: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  // Step 2 — Specs
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  furnished: boolean;
  price_monthly: number | null;
  currency: Currency;
  minimum_stay_days: number;
  amenities: string[];
  building_amenities: string[];
  // Step 3 — Photos
  images: ListingDraftPhoto[];
  // Step 4 — Title + description (D5; pre-allocated so D4 form state is type-stable)
  title: string;
  description: string;
}

export const EMPTY_DRAFT: ListingDraft = {
  address: "",
  neighborhood: "",
  city: "Medellín",
  latitude: null,
  longitude: null,
  bedrooms: 1,
  bathrooms: 1,
  size_sqm: null,
  furnished: true,
  price_monthly: null,
  currency: "COP",
  minimum_stay_days: 30,
  amenities: [],
  building_amenities: [],
  images: [],
  title: "",
  description: "",
};

const STORAGE_PREFIX = "mdeai.listing-draft.";

function storageKey(draftId: string) {
  return `${STORAGE_PREFIX}${draftId}`;
}

interface UseListingDraftReturn {
  draftId: string;
  draft: ListingDraft;
  /** Patch one or more fields and persist atomically. */
  updateDraft: (patch: Partial<ListingDraft>) => void;
  /** Replace the whole draft (used for hydration). */
  setDraft: React.Dispatch<React.SetStateAction<ListingDraft>>;
  /** Clear local persistence — call after successful submit (D5). */
  clearDraft: () => void;
}

export function useListingDraft(): UseListingDraftReturn {
  // draftId is stable across renders via ref-init. Falls back to a counter
  // string in environments where crypto.randomUUID is unavailable (very old
  // browsers); same fallback used by the chat code.
  const draftIdRef = useRef<string | null>(null);
  if (draftIdRef.current === null) {
    draftIdRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  const draftId = draftIdRef.current;

  const [draft, setDraftRaw] = useState<ListingDraft>(EMPTY_DRAFT);
  // After clearDraft we want the state to reset to EMPTY_DRAFT WITHOUT the
  // persist effect re-writing the wiped key on the next render. This ref
  // gates that single skip; updateDraft re-enables persistence.
  const skipNextPersistRef = useRef(false);

  // Hydrate from sessionStorage (if a previous mount of this draft id
  // saved state). Runs once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(storageKey(draftId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ListingDraft>;
      setDraftRaw((prev) => ({ ...prev, ...parsed }));
    } catch (err) {
      console.warn("[listing-draft] hydrate failed", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change (cheap — single sessionStorage write).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    try {
      window.sessionStorage.setItem(storageKey(draftId), JSON.stringify(draft));
    } catch (err) {
      console.warn("[listing-draft] persist failed", err);
    }
  }, [draft, draftId]);

  const updateDraft = useCallback((patch: Partial<ListingDraft>) => {
    setDraftRaw((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearDraft = useCallback(() => {
    skipNextPersistRef.current = true;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey(draftId));
    }
    setDraftRaw(EMPTY_DRAFT);
  }, [draftId]);

  return useMemo(
    () => ({ draftId, draft, updateDraft, setDraft: setDraftRaw, clearDraft }),
    [draftId, draft, updateDraft, clearDraft],
  );
}
