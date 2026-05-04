import { useEffect, useRef } from "react";
import { useSponsorPlacements } from "@/hooks/sponsor/useSponsorPlacements";
import { buildUtmUrl } from "@/lib/sponsor/buildUtmUrl";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { SponsorSurface } from "@/types/sponsor";

interface Props {
  surface: SponsorSurface;
  surfaceRef?: string;
  className?: string;
  fallback?: React.ReactNode;
}

// Fire-and-forget impression beacon
async function recordImpression(placementId: string, surface: string): Promise<void> {
  try {
    await supabase.functions.invoke('sponsor-impression', {
      body: {
        placement_id: placementId,
        surface,
        viewer_anon_id: sessionStorage.getItem('anon_id') ?? undefined,
      },
    });
  } catch {
    // Best-effort — never throw
  }
}

// Fire-and-forget click beacon
async function recordClick(placementId: string): Promise<void> {
  try {
    await supabase.functions.invoke('sponsor-click', {
      body: {
        placement_id: placementId,
        viewer_anon_id: sessionStorage.getItem('anon_id') ?? undefined,
      },
    });
  } catch {
    // Best-effort
  }
}

export function SponsoredSurface({ surface, surfaceRef, className, fallback = null }: Props) {
  const { data: placement, isLoading } = useSponsorPlacements(surface, surfaceRef);
  const impressionFired = useRef(false);

  useEffect(() => {
    if (placement && !impressionFired.current) {
      impressionFired.current = true;
      void recordImpression(placement.id, surface);
    }
  }, [placement, surface]);

  if (isLoading || !placement) return <>{fallback}</>;

  // Build asset URL from storage path
  let logoUrl: string | null = null;
  if (placement.asset_storage_path) {
    const { data } = supabase.storage
      .from('sponsor-assets')
      .getPublicUrl(placement.asset_storage_path);
    logoUrl = data.publicUrl;
  }

  const utmUrl = buildUtmUrl(placement.utm_destination, placement.id, surface);

  return (
    <div className={cn('relative inline-block', className)}>
      <span className="absolute top-0.5 right-0.5 text-[9px] text-muted-foreground/70 leading-none select-none">
        Sponsored
      </span>
      <a
        href={utmUrl}
        target="_blank"
        rel="noopener sponsored noreferrer"
        onClick={() => void recordClick(placement.id)}
        className="block"
        aria-label={placement.asset_alt_text ?? 'Sponsored content'}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={placement.asset_alt_text ?? 'Sponsor logo'}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-muted-foreground">Sponsored</span>
        )}
      </a>
    </div>
  );
}
