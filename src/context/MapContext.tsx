import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MapPin } from '@/types/map-pin';

// Re-export the types so existing consumers that import { MapPin, ... }
// from '@/context/MapContext' don't have to change. New consumers should
// prefer importing from '@/types/map-pin' directly.
export type { MapPin, MapPinCategory, RentalPinMeta } from '@/types/map-pin';
export { PIN_CATEGORY_CONFIG } from '@/types/map-pin';

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
 * Types + constants live in `src/types/map-pin.ts` so this file stays
 * component-only (keeps HMR fast — react-refresh prefers single-export
 * component files).
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

// react-refresh wants component-only files. `useMapContext` is a hook,
// not a component, but it's inseparable from the provider above (the
// internal `MapContext` object would otherwise need to be exported,
// which leaks an implementation detail). Co-locating provider + hook
// is the standard React pattern; the HMR cost is negligible (one
// component-tree refresh on context-file edits).
// eslint-disable-next-line react-refresh/only-export-components
export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error('useMapContext must be used within a <MapProvider>');
  }
  return ctx;
}
