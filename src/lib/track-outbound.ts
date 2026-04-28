import { supabase } from '@/integrations/supabase/client';
import { applyAffiliateTag } from './affiliate';
import { trackEvent } from './posthog';

export type OutboundSurface = 'chat_card' | 'detail_page' | 'map_info_window';

export interface OutboundClickInput {
  listingId: string;
  sourceUrl: string;
  surface: OutboundSurface;
}

/**
 * Apply the affiliate tag, open the URL in a new tab, and log the click
 * to Postgres + PostHog in the background. Returns the rewritten URL +
 * resolved tag so call sites can also use them for `<a href>` rendering
 * (so middle-click + Cmd-click also navigate to the rewritten URL).
 *
 * Side effects ordering:
 *   1. window.open synchronously — user-facing action MUST happen first
 *      and MUST NOT be gated on analytics.
 *   2. supabase.rpc('log_outbound_click') in the background — best-
 *      effort; failures are swallowed so a logging hiccup never breaks
 *      outbound nav.
 *   3. PostHog `outbound_clicked` event — same fire-and-forget.
 *
 * The RPC is fully typed via `database.types.ts` (regenerated after the
 * 20260427210000_outbound_clicks migration was applied to remote).
 */
export function trackOutboundClick(input: OutboundClickInput): {
  url: string;
  tag: string | null;
} {
  const { url, tag } = applyAffiliateTag(input.sourceUrl);

  window.open(url, '_blank', 'noopener,noreferrer');

  void (async () => {
    try {
      const { error } = await supabase.rpc('log_outbound_click', {
        p_listing_id: input.listingId,
        p_source_url: url,
        p_affiliate_tag: tag,
        p_surface: input.surface,
      });
      if (error) {
        console.warn('[track-outbound] RPC error:', error.message);
      }
    } catch (err) {
      console.warn('[track-outbound] RPC threw:', err);
    }
  })();

  trackEvent({
    name: 'outbound_clicked',
    apartmentId: input.listingId,
    sourceUrl: url,
  });

  return { url, tag };
}
