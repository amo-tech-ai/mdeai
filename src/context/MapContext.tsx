import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type MapPinCategory = 'rental' | 'restaurant' | 'event' | 'attraction';

export interface MapPin {
  id: string;
  category: MapPinCategory;
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Short label shown next to the pin (e.g. price). */
  label?: string;
  /** Free-form payload for detail lookups (URL, price, etc). */
  meta?: Record<string, unknown>;
}

interface MapContextValue {
  pins: MapPin[];
  setPins: (pins: MapPin[]) => void;
  clearPins: () => void;
  highlightedPinId: string | null;
  setHighlightedPinId: (id: string | null) => void;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

/**
 * Shares map-pin state between the chat conversation (produces pins on tool
 * response) and the map panel (renders them). Also carries the hover / click
 * highlight used to cross-link cards ↔ pins.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §3 — Architecture.
 */
export function MapProvider({ children }: { children: ReactNode }) {
  const [pins, setPinsState] = useState<MapPin[]>([]);
  const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);

  const setPins = useCallback((next: MapPin[]) => {
    setPinsState(next);
  }, []);

  const clearPins = useCallback(() => {
    setPinsState([]);
    setHighlightedPinId(null);
  }, []);

  const value = useMemo<MapContextValue>(
    () => ({ pins, setPins, clearPins, highlightedPinId, setHighlightedPinId }),
    [pins, setPins, clearPins, highlightedPinId],
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error('useMapContext must be used within a <MapProvider>');
  }
  return ctx;
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
