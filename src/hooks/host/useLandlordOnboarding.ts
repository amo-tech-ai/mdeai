import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/posthog";

/**
 * Landlord onboarding data layer (V1 D3).
 *
 * V1 keeps things simple — all writes go through supabase-js directly,
 * gated by RLS policies deployed in migration 20260429000000_landlord_v1.sql.
 * The plan called for a `landlord-onboarding-step` edge fn (§3 #1) but RLS
 * already enforces the auth gate; we'll add a server-side fn only if we
 * need extra validation (anti-spam, E.164 normalisation) which can wait.
 *
 * Storage uploads use the `identity-docs` bucket (private, 10 MB limit,
 * jpeg/png/webp/pdf only). Path convention: `<auth.uid()>/<filename>`.
 */

export type LandlordKind = "individual" | "agent" | "property_manager";

export type DocKind =
  | "national_id"
  | "passport"
  | "rut"
  | "property_deed"
  | "utility_bill";

export interface LandlordProfileRow {
  id: string;
  user_id: string;
  kind: LandlordKind;
  display_name: string;
  whatsapp_e164: string | null;
  primary_neighborhood: string | null;
  bio: string | null;
  verification_status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface Step1BasicsInput {
  display_name: string;
  kind: LandlordKind;
  whatsapp_e164: string;
  primary_neighborhood: string | null;
}

export interface Step2VerificationInput {
  doc_kind: DocKind;
  file: File;
  landlord_id: string;
}

const QUERY_KEY_OWN_PROFILE = ["landlord_profile_own"] as const;

/**
 * Fetch the current user's landlord_profiles row, if any. Returns null when
 * the user has not started onboarding yet (Step 1 has never been submitted).
 * RLS policy `landlord_profiles_select_own` gates this query.
 */
export function useOwnLandlordProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QUERY_KEY_OWN_PROFILE,
    enabled: !!user,
    queryFn: async (): Promise<LandlordProfileRow | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("landlord_profiles")
        .select(
          "id,user_id,kind,display_name,whatsapp_e164,primary_neighborhood,bio,verification_status,created_at,updated_at",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as LandlordProfileRow | null) ?? null;
    },
  });
}

/**
 * UPSERT the landlord_profiles row from Step 1. Uses (user_id) as the
 * conflict target — Step 1 is replayable (user navigates back, edits, re-submits).
 *
 * Auth: RLS policies `landlord_profiles_insert_own` + `_update_own` require
 * `user_id = auth.uid()`. We pass the current user.id explicitly so the
 * policies match.
 */
export function useSubmitStep1Basics() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Step1BasicsInput): Promise<LandlordProfileRow> => {
      if (!user) throw new Error("No authenticated user");
      const payload = {
        user_id: user.id,
        display_name: input.display_name.trim(),
        kind: input.kind,
        whatsapp_e164: input.whatsapp_e164.trim(),
        primary_neighborhood: input.primary_neighborhood?.trim() || null,
      };
      const { data, error } = await supabase
        .from("landlord_profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select(
          "id,user_id,kind,display_name,whatsapp_e164,primary_neighborhood,bio,verification_status,created_at,updated_at",
        )
        .single();
      if (error) throw error;
      return data as LandlordProfileRow;
    },
    onSuccess: (row) => {
      qc.setQueryData(QUERY_KEY_OWN_PROFILE, row);
    },
  });
}

/**
 * Upload an ID/document to the private `identity-docs` bucket and INSERT a
 * verification_requests row. Storage RLS gates the upload to the user's own
 * folder; verification_requests RLS gates the row insert to a landlord_id
 * the user owns.
 *
 * The mutation is intentionally idempotent at the storage level: filename
 * includes a timestamp suffix so re-uploads don't overwrite old proofs
 * (founder reviews against history). verification_requests rows are NOT
 * deduplicated — every submit creates a new pending row, and the founder
 * approves the latest.
 */
export function useSubmitVerification() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (
      input: Step2VerificationInput,
    ): Promise<{ verification_id: string; storage_path: string }> => {
      if (!user) throw new Error("No authenticated user");

      const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const stamp = Date.now();
      const storagePath = `${user.id}/${input.doc_kind}_${stamp}_${safeName}`;

      const upload = await supabase.storage
        .from("identity-docs")
        .upload(storagePath, input.file, {
          contentType: input.file.type,
          upsert: false,
        });
      if (upload.error) throw upload.error;

      const insert = await supabase
        .from("verification_requests")
        .insert({
          landlord_id: input.landlord_id,
          doc_kind: input.doc_kind,
          storage_path: storagePath,
        })
        .select("id")
        .single();
      if (insert.error) {
        // Best-effort cleanup: roll back the storage object so we don't
        // leave orphaned files behind. Failure of the cleanup itself is
        // logged but not surfaced — the original DB error is what the
        // user needs to see.
        await supabase.storage
          .from("identity-docs")
          .remove([storagePath])
          .catch((cleanupErr) => {
            console.warn(
              "[verification] orphan cleanup failed",
              cleanupErr,
            );
          });
        throw insert.error;
      }

      trackEvent({
        name: "verification_doc_uploaded",
        docKind: input.doc_kind,
      });

      return { verification_id: insert.data.id, storage_path: storagePath };
    },
  });
}
