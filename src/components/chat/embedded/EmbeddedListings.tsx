import { useEffect, useMemo, useState } from 'react';
import type {
  ChatAction,
  RentalInlineListing,
  EventInlineListing,
  RestaurantInlineListing,
  AttractionInlineListing,
} from '@/types/chat';
import { RentalCardInline } from './RentalCardInline';
import { EventCardInline } from './EventCardInline';
import { RestaurantCardInline } from './RestaurantCardInline';
import { AttractionCardInline } from './AttractionCardInline';
import { useChatActions } from '@/hooks/useChatActions';
import { AddToTripModal } from '../AddToTripModal';

interface EmbeddedListingsProps {
  actions: ChatAction[];
  conversationId?: string | null;
}

/**
 * Renders inline listing cards extracted from an assistant turn's pending
 * actions. Handles OPEN_RENTALS_RESULTS, OPEN_EVENT_RESULTS,
 * OPEN_RESTAURANT_RESULTS, and OPEN_ATTRACTION_RESULTS.
 *
 * Owns the Save / Add-to-trip / social-proof pipeline via useChatActions
 * for rentals. Other verticals are display-only for now.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Tue + Week 2 Tue.
 */
export function EmbeddedListings({ actions, conversationId }: EmbeddedListingsProps) {
  const chatActions = useChatActions();
  const { savedIds, saveCounts, toggleSave, fetchSaveCounts } = chatActions;
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [tripTarget, setTripTarget] = useState<RentalInlineListing | null>(null);

  const rentals = useMemo<RentalInlineListing[]>(() => {
    const out: RentalInlineListing[] = [];
    for (const a of actions) {
      if (a.type === 'OPEN_RENTALS_RESULTS' && a.payload.listings) {
        out.push(...a.payload.listings);
      }
    }
    return out;
  }, [actions]);

  const events = useMemo<EventInlineListing[]>(() => {
    const out: EventInlineListing[] = [];
    for (const a of actions) {
      if (a.type === 'OPEN_EVENT_RESULTS' && a.payload.listings) {
        out.push(...a.payload.listings);
      }
    }
    return out;
  }, [actions]);

  const restaurants = useMemo<RestaurantInlineListing[]>(() => {
    const out: RestaurantInlineListing[] = [];
    for (const a of actions) {
      if (a.type === 'OPEN_RESTAURANT_RESULTS' && a.payload.listings) {
        out.push(...a.payload.listings);
      }
    }
    return out;
  }, [actions]);

  const attractions = useMemo<AttractionInlineListing[]>(() => {
    const out: AttractionInlineListing[] = [];
    for (const a of actions) {
      if (a.type === 'OPEN_ATTRACTION_RESULTS' && a.payload.listings) {
        out.push(...a.payload.listings);
      }
    }
    return out;
  }, [actions]);

  useEffect(() => {
    if (rentals.length === 0) return;
    void fetchSaveCounts(rentals);
  }, [rentals, fetchSaveCounts]);

  const hasAny =
    rentals.length > 0 || events.length > 0 || restaurants.length > 0 || attractions.length > 0;

  if (!hasAny) return null;

  const openTripModal = (listing: RentalInlineListing) => {
    setTripTarget(listing);
    setTripModalOpen(true);
  };

  return (
    <>
      <div className="mt-3 space-y-2">
        {rentals.map((l) => (
          <RentalCardInline
            key={l.id}
            listing={l}
            onSave={() => toggleSave(l)}
            onAddToTrip={() => openTripModal(l)}
            saved={savedIds.has(l.id)}
            saveCount={saveCounts.get(l.id) ?? 0}
            conversationId={conversationId ?? undefined}
          />
        ))}
        {events.map((e) => (
          <EventCardInline key={e.id} event={e} />
        ))}
        {restaurants.map((r) => (
          <RestaurantCardInline key={r.id} restaurant={r} />
        ))}
        {attractions.map((a) => (
          <AttractionCardInline key={a.id} attraction={a} />
        ))}
      </div>
      <AddToTripModal
        open={tripModalOpen}
        onOpenChange={setTripModalOpen}
        listing={tripTarget}
        actions={chatActions}
      />
    </>
  );
}
