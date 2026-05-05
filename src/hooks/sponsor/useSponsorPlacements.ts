import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SponsorPlacement, SponsorSurface } from "@/types/sponsor";

function weightedPick(placements: SponsorPlacement[]): SponsorPlacement | null {
  if (!placements.length) return null;
  if (placements.length === 1) return placements[0];
  const total = placements.reduce((s, p) => s + p.weight, 0);
  let rand = Math.random() * total;
  for (const p of placements) {
    rand -= p.weight;
    if (rand <= 0) return p;
  }
  return placements[placements.length - 1];
}

export function useSponsorPlacements(surface: SponsorSurface, surfaceRef?: string) {
  return useQuery({
    queryKey: ['sponsor-placements', surface, surfaceRef ?? null],
    queryFn: async (): Promise<SponsorPlacement | null> => {
      // Query active placements for this surface
      // sponsor schema requires schema() chaining
      const sponsorClient = (supabase as unknown as { schema: (s: string) => typeof supabase }).schema('sponsor');

      let q = sponsorClient
        .from('placements')
        .select('id, application_id, surface, surface_ref, asset_id, utm_destination, start_at, end_at, active, weight')
        .eq('surface', surface)
        .eq('active', true);

      if (surfaceRef) {
        q = q.eq('surface_ref', surfaceRef) as typeof q;
      }

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      if (!data?.length) return null;

      // Fetch assets for placements that have one
      const assetIds = data.filter(p => p.asset_id).map(p => p.asset_id as string);
      let assetMap: Record<string, { storage_path: string | null; alt_text: string | null }> = {};

      if (assetIds.length) {
        const { data: assets } = await sponsorClient
          .from('assets')
          .select('id, storage_path, alt_text')
          .in('id', assetIds);
        assetMap = Object.fromEntries((assets ?? []).map(a => [a.id, a]));
      }

      const enriched: SponsorPlacement[] = data.map(p => ({
        ...p,
        asset_storage_path: p.asset_id ? assetMap[p.asset_id]?.storage_path ?? null : null,
        asset_alt_text: p.asset_id ? assetMap[p.asset_id]?.alt_text ?? null : null,
      }));

      return weightedPick(enriched);
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes — placements don't change mid-session
    gcTime: 10 * 60 * 1000,
  });
}
