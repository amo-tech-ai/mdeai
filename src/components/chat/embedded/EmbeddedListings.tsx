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
import { mergePinsByCategory, useSafeMapContext, type MapPin } from '@/context/MapContext';

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
  // Safe — null when rendered outside MapProvider (e.g. FloatingChatWidget)
  const mapCtx = useSafeMapContext();
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

  // ── Card → Pin sync ──────────────────────────────────────────────────────
  // Whenever inline cards are rendered we push the same listings into
  // MapContext as pins. This is the authoritative pin-population path for the
  // chat map: it fires whenever cards become visible regardless of whether
  // pendingActions was already cleared, guaranteeing card count = pin count.
  // No-op outside a MapProvider (e.g. FloatingChatWidget).

  useEffect(() => {
    if (!mapCtx || rentals.length === 0) return;
    const pins: MapPin[] = rentals
      .filter((l) => {
        const lat = Number(l.latitude);
        const lng = Number(l.longitude);
        return l.latitude != null && l.longitude != null && !isNaN(lat) && !isNaN(lng);
      })
      .map((l) => ({
        id: l.id,
        category: 'rental' as const,
        title: l.title,
        // Coerce to number: Supabase numeric columns arrive as strings via the edge fn.
        latitude: Number(l.latitude),
        longitude: Number(l.longitude),
        label: l.price_monthly
          ? `$${l.price_monthly}/mo`
          : l.price_daily
            ? `$${l.price_daily}/night`
            : undefined,
        meta: { neighborhood: l.neighborhood, image: l.images?.[0] ?? null, rating: l.rating ?? null },
      }));
    if (pins.length > 0) {
      mapCtx.setPins((prev) => mergePinsByCategory(prev, 'rental', pins));
    }
  }, [rentals, mapCtx]);

  useEffect(() => {
    if (!mapCtx || events.length === 0) return;
    const pins: MapPin[] = events
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({
        id: e.id,
        category: 'event' as const,
        title: e.title,
        latitude: e.latitude ?? null,
        longitude: e.longitude ?? null,
        label: e.pricePerTicket != null ? `$${e.pricePerTicket}` : undefined,
        meta: { neighborhood: e.neighborhood, venue: e.venue },
      }));
    if (pins.length > 0) {
      mapCtx.setPins((prev) => mergePinsByCategory(prev, 'event', pins));
    }
  }, [events, mapCtx]);

  useEffect(() => {
    if (!mapCtx || restaurants.length === 0) return;
    const pins: MapPin[] = restaurants
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        id: r.id,
        category: 'restaurant' as const,
        title: r.name,
        latitude: r.latitude ?? null,
        longitude: r.longitude ?? null,
        label: r.priceTier ?? undefined,
        meta: { neighborhood: r.neighborhood, rating: r.rating ?? null },
      }));
    if (pins.length > 0) {
      mapCtx.setPins((prev) => mergePinsByCategory(prev, 'restaurant', pins));
    }
  }, [restaurants, mapCtx]);

  useEffect(() => {
    if (!mapCtx || attractions.length === 0) return;
    const pins: MapPin[] = attractions
      .filter((a) => a.latitude != null && a.longitude != null)
      .map((a) => ({
        id: a.id,
        category: 'attraction' as const,
        title: a.name,
        latitude: a.latitude ?? null,
        longitude: a.longitude ?? null,
        label: a.priceUsd === 0 ? 'Free' : a.priceUsd != null ? `$${a.priceUsd}` : undefined,
        meta: { neighborhood: a.neighborhood, rating: a.rating ?? null },
      }));
    if (pins.length > 0) {
      mapCtx.setPins((prev) => mergePinsByCategory(prev, 'attraction', pins));
    }
  }, [attractions, mapCtx]);

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
          // Wrap with hover handlers for card ↔ map-pin sync (no-op when mapCtx is null)
          <div
            key={l.id}
            onMouseEnter={() => mapCtx?.setHighlightedPinId(l.id)}
            onMouseLeave={() => mapCtx?.setHighlightedPinId(null)}
          >
            <RentalCardInline
              listing={l}
              onSave={() => toggleSave(l)}
              onAddToTrip={() => openTripModal(l)}
              saved={savedIds.has(l.id)}
              saveCount={saveCounts.get(l.id) ?? 0}
              conversationId={conversationId ?? undefined}
            />
          </div>
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
