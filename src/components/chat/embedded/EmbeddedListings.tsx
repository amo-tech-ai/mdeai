import { useMemo } from 'react';
import type { ChatAction, RentalInlineListing } from '@/types/chat';
import { RentalCardInline } from './RentalCardInline';

interface EmbeddedListingsProps {
  actions: ChatAction[];
  /** Optional callbacks — wired Week 2 Tue. */
  onSave?: (listingId: string) => void;
  onAddToTrip?: (listingId: string) => void;
  savedIds?: Set<string>;
}

/**
 * Renders inline listing cards extracted from an assistant turn's pending
 * actions. Today handles OPEN_RENTALS_RESULTS → RentalCardInline.
 * Additional vertical types (restaurants, events, attractions) plug in here
 * as new branches — card component + pin color, nothing else.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Tue.
 */
export function EmbeddedListings({
  actions,
  onSave,
  onAddToTrip,
  savedIds,
}: EmbeddedListingsProps) {
  // Flatten rental listings from all OPEN_RENTALS_RESULTS actions on this turn.
  // (Usually there's exactly one, but the protocol allows multiple.)
  const rentals = useMemo<RentalInlineListing[]>(() => {
    const out: RentalInlineListing[] = [];
    for (const a of actions) {
      if (a.type === 'OPEN_RENTALS_RESULTS' && a.payload.listings) {
        out.push(...a.payload.listings);
      }
    }
    return out;
  }, [actions]);

  if (rentals.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {rentals.map((l) => (
        <RentalCardInline
          key={l.id}
          listing={l}
          onSave={onSave}
          onAddToTrip={onAddToTrip}
          saved={savedIds?.has(l.id) ?? false}
        />
      ))}
    </div>
  );
}
