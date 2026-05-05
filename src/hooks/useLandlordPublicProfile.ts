/**
 * useLandlordPublicProfile — fetch the public-safe slice of a landlord's
 * profile for display on the public listing page.
 *
 * Calls the SECURITY DEFINER RPC `get_landlord_public_profile(uuid)`
 * because the equivalent `landlord_profiles_public` view uses
 * security_invoker=true and inherits owner-only RLS — meaning anon /
 * other-user access returns nothing. The RPC bypasses RLS but only
 * exposes safe columns (no phone, no whatsapp, no email).
 *
 * Returns null when the apartment has no landlord_id (legacy seeded
 * listings) so the caller can hide the card without a flash.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandlordPublicProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  primary_neighborhood: string | null;
  languages: string[];
  is_verified: boolean;
  active_listings: number;
  total_leads_received: number;
  median_response_time_minutes: number | null;
  created_at: string;
}

export function useLandlordPublicProfile(landlordId: string | null | undefined) {
  return useQuery({
    queryKey: ["landlord-public-profile", landlordId],
    enabled: !!landlordId,
    queryFn: async (): Promise<LandlordPublicProfile | null> => {
      if (!landlordId) return null;
      // RPC returns a SETOF — function gates rows on
      // verification_status IN ('approved','pending') so a brand-new
      // landlord whose verification was rejected wouldn't appear.
      const { data, error } = await supabase.rpc(
        "get_landlord_public_profile",
        { landlord_uuid: landlordId },
      );
      if (error) throw new Error(error.message);
      const rows = (data as LandlordPublicProfile[] | null) ?? [];
      return rows[0] ?? null;
    },
    // Public landlord data changes rarely — cache aggressively.
    staleTime: 5 * 60_000,
  });
}
