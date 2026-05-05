/**
 * Map-pin types + shared config — extracted from MapContext.tsx to fix
 * the `react-refresh/only-export-components` warnings (the rule fires
 * when a file mixes a component export with non-component exports;
 * splitting them out keeps HMR fast and lint-clean).
 *
 * Consumers:
 *   • src/context/MapContext.tsx — provider + useMapContext()
 *   • src/components/chat/ChatMap.tsx — renders pins, narrows meta to
 *     RentalPinMeta inside the InfoWindow peek
 *   • src/components/chat/ChatCanvas.tsx — produces pins from chat
 *     tool responses, populates typed `meta: RentalPinMeta`
 *   • Future: any vertical that needs to render pins on a shared map
 *     surface (apartment detail bottom map, trips, etc.)
 *
 * No React imports here on purpose — keeps the file lightweight and
 * avoids accidentally pulling components into a types-only module.
 */

export type MapPinCategory = 'rental' | 'restaurant' | 'event' | 'attraction';

/**
 * Per-vertical typed shapes for `MapPin.meta`. Today only `rental` has
 * a documented shape (used by ChatMap's InfoWindow peek + telemetry);
 * the other categories haven't shipped consumers yet so they keep the
 * loose `Record<string, unknown>` fallback. Adding a new vertical:
 *   1. Define `<Vertical>PinMeta` here.
 *   2. Narrow MapPin.meta in the consumer with `as <Vertical>PinMeta`.
 *   3. Producer (ChatCanvas / future tools) populates the shape.
 */
export interface RentalPinMeta {
  source_url?: string | null;
  neighborhood?: string | null;
  image?: string | null;
  rating?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
}

export interface MapPin {
  id: string;
  category: MapPinCategory;
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Short label shown next to the pin (e.g. price). */
  label?: string;
  /**
   * Free-form payload for detail lookups (URL, photo, rating, etc.).
   * Producers populate per-vertical shapes — see `RentalPinMeta`.
   * Consumers SHOULD narrow with `as RentalPinMeta` (or future
   * vertical types) instead of treating the bag as truly unknown.
   */
  meta?: Record<string, unknown>;
}

/**
 * Pin color config — single source of truth for both the map renderer and
 * the card badges. Adding a new category = one row.
 */
export const PIN_CATEGORY_CONFIG: Record<
  MapPinCategory,
  { emoji: string; color: string; label: string }
> = {
  rental: { emoji: '🏠', color: '#10b981', label: 'Rental' },
  restaurant: { emoji: '🍽️', color: '#f59e0b', label: 'Restaurant' },
  event: { emoji: '🎉', color: '#a855f7', label: 'Event' },
  attraction: { emoji: '📍', color: '#3b82f6', label: 'Attraction' },
};
