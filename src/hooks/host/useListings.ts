import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOwnLandlordProfile } from "./useLandlordOnboarding";

/**
 * Fetch the current landlord's apartments — D7 dashboard list.
 *
 * Authorization: existing RLS on apartments is permissive
 * (`authenticated_can_view_all_apartments` allows any signed-in user to
 * read all rows — see follow-up #R-RLS-1 in todo to tighten). We defend
 * in depth by filtering on `landlord_id` from the caller's profile so
 * the dashboard never accidentally shows another landlord's listings.
 *
 * Pagination: the V1 cohort target is ~25-50 listings TOTAL across the
 * whole platform, so a single landlord realistically has 1-5. We can
 * fetch up to 100 without pagination and revisit if a power-user lands
 * with more.
 */

export type ApartmentModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "archived";

export type ApartmentListingStatus =
  | "active"
  | "inactive"
  | "booked"
  | "pending";

export interface OwnListingRow {
  id: string;
  title: string;
  neighborhood: string;
  city: string;
  price_monthly: number;
  currency: "COP" | "USD";
  bedrooms: number;
  bathrooms: number;
  images: string[];
  moderation_status: ApartmentModerationStatus;
  status: ApartmentListingStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = ["host_own_listings"] as const;

export function useOwnListings() {
  const { data: profile } = useOwnLandlordProfile();
  return useQuery({
    queryKey: QUERY_KEY,
    enabled: !!profile,
    queryFn: async (): Promise<OwnListingRow[]> => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from("apartments")
        .select(
          "id,title,neighborhood,city,price_monthly,currency,bedrooms,bathrooms,images,moderation_status,status,rejection_reason,created_at,updated_at",
        )
        .eq("landlord_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as OwnListingRow[];
    },
  });
}
