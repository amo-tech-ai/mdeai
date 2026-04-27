/// <reference types="@types/google.maps" />
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin as MapPinIcon } from 'lucide-react';
import { useMapContext, PIN_CATEGORY_CONFIG, type MapPin } from '@/context/MapContext';
import {
  isMapsAuthFailed,
  loadGoogleMapsLibrary,
  onMapsAuthFailed,
} from '@/lib/google-maps-loader';
import { measureScriptLoad, trackMapEvent } from '@/lib/maps-telemetry';
import { cn } from '@/lib/utils';

/**
 * Right-panel live map for the chat canvas.
 *
 * Renders an actual Google Map (when VITE_GOOGLE_MAPS_API_KEY is set) with:
 *  - AdvancedMarkerElement labeled pins (emoji + title + label)
 *  - fitBounds on every new pin batch so the map zooms to current results
 *  - Hover sync with MapContext.highlightedPinId (card ↔ pin cross-hover)
 *  - Graceful fallback to a pin list when no key is present (local dev)
 *
 * Data contract: `MapContext.pins` is already shaped for Google Maps
 * (lat / lng / label / meta) — no transforms here.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §3 + Week 2 mid-week upgrade.
 */

// Medellín fallback center so the map has a reasonable default pose before
// any pins arrive (vs. staring at the Atlantic or whatever the default is).
const MEDELLIN_CENTER = { lat: 6.2442, lng: -75.5812 };
const MAP_ID = 'mdeai-chat-map';

function FallbackPinList({
  pins,
  highlightedPinId,
  setHighlightedPinId,
  onPinClick,
  reason,
}: {
  pins: MapPin[];
  highlightedPinId: string | null;
  setHighlightedPinId: (id: string | null) => void;
  onPinClick: (pin: MapPin, openInNewTab?: boolean) => void;
  reason?: string;
}) {
  return (
    <aside className="h-full overflow-y-auto bg-muted/10 border-l border-border">
      <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border px-4 py-3 z-10">
        <h2 className="text-sm font-semibold">{pins.length} on the map</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {reason ?? 'Interactive map pending Google Maps key'}
        </p>
      </div>
      <ul className="divide-y divide-border">
        {pins.map((pin) => {
          const cfg = PIN_CATEGORY_CONFIG[pin.category];
          const isHot = pin.id === highlightedPinId;
          return (
            <li
              key={pin.id}
              onMouseEnter={() => setHighlightedPinId(pin.id)}
              onMouseLeave={() => setHighlightedPinId(null)}
              onClick={(e) =>
                onPinClick(pin, e.metaKey || e.ctrlKey || e.button === 1)
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPinClick(pin);
                }
              }}
              className={cn(
                'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                isHot ? 'bg-accent' : 'hover:bg-accent/40',
              )}
            >
              <span
                aria-hidden
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm flex-shrink-0"
                style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
              >
                {cfg.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-1">{pin.title}</p>
                {pin.label && (
                  <p className="text-xs text-muted-foreground mt-0.5">{pin.label}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function EmptyState() {
  return (
    <aside className="h-full flex items-center justify-center text-center p-8 bg-muted/20 border-l border-border">
      <div className="max-w-xs">
        <MapPinIcon className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Pins appear here as you chat.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Try "top rentals in Laureles" →
        </p>
      </div>
    </aside>
  );
}

export function ChatMap() {
  const { pins, highlightedPinId, setHighlightedPinId } = useMapContext();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const navigate = useNavigate();

  /**
   * Map a pin to its detail route. Today every pin is a `rental` so the
   * route is `/apartments/:id`; restaurants/events/attractions plug in
   * here as the verticals ship.
   */
  const pinDetailPath = useCallback((pin: MapPin): string | null => {
    if (pin.category === 'rental') return `/apartments/${pin.id}`;
    return null;
  }, []);

  const navigateToPin = useCallback(
    (pin: MapPin, openInNewTab = false) => {
      const path = pinDetailPath(pin);
      if (!path) return;
      if (openInNewTab) {
        window.open(path, '_blank', 'noopener,noreferrer');
      } else {
        navigate(path);
      }
    },
    [navigate, pinDetailPath],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  // Each marker carries the EventListener we attached, so we can call
  // `removeEventListener` symmetrically on unmount + when a marker is
  // dropped between turns. Without this, listeners leak — addEventListener
  // (unlike the legacy `marker.addListener` API) is not auto-cleaned up
  // by Google Maps when `marker.map = null`.
  type MarkerEntry = {
    marker: google.maps.marker.AdvancedMarkerElement;
    clickHandler: EventListener;
  };
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const [mapError, setMapError] = useState<string | null>(null);

  // If a prior mount already tripped gm_authFailure, skip straight to the
  // fallback UI — no point loading the script again just to crash.
  const [authFailed, setAuthFailed] = useState<boolean>(isMapsAuthFailed());
  useEffect(() => onMapsAuthFailed(() => setAuthFailed(true)), []);

  // Expose the Map + AdvancedMarkerElement constructors once `importLibrary`
  // resolves. The shared loader (src/lib/google-maps-loader.ts) is the
  // single source of truth — it dedupes against any pre-existing
  // <script id="google-maps-script"> AND across React StrictMode remounts
  // so we never inject Maps twice on the page.
  const MapCtorRef = useRef<typeof google.maps.Map | null>(null);
  const MarkerCtorRef = useRef<typeof google.maps.marker.AdvancedMarkerElement | null>(null);
  const [librariesReady, setLibrariesReady] = useState(false);

  // Initialize map once container is ready. StrictMode-safe: the
  // `if (mapRef.current) return` guard short-circuits the second pass,
  // and `cancelled` blocks the async tail from racing the unmount.
  useEffect(() => {
    if (!apiKey || authFailed || !containerRef.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        // measureScriptLoad emits a `script_loaded` telemetry event with
        // the measured millisecond duration on success, or a
        // `script_load_failed` event with the error on failure.
        const [mapsLib, markerLib] = await measureScriptLoad(
          () =>
            Promise.all([
              loadGoogleMapsLibrary<google.maps.MapsLibrary>('maps', apiKey),
              loadGoogleMapsLibrary<google.maps.MarkerLibrary>('marker', apiKey),
            ]),
          ['maps', 'marker'],
        );
        if (cancelled) return;
        if (mapRef.current) return; // StrictMode-safe: another pass beat us
        MapCtorRef.current = mapsLib.Map;
        MarkerCtorRef.current = markerLib.AdvancedMarkerElement;

        mapRef.current = new mapsLib.Map(containerRef.current!, {
          center: MEDELLIN_CENTER,
          zoom: 13,
          mapId: MAP_ID,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });
        setLibrariesReady(true);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error('ChatMap init failed:', err);
        trackMapEvent({ kind: 'map_init_failed', error: message });
        setMapError(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, authFailed]);

  // Create / update marker content. Uses a plain div so we can keep the
  // mdeai visual language (emoji + title pill) without MapID-bound custom
  // styles. `isHot` is the hover-highlight from card ↔ pin cross-link.
  //
  // A11y: `gmpClickable: true` already makes the marker keyboard-focusable.
  // We ALSO set `role="button"` and an `aria-label` so screen readers
  // announce it as "Open <title>, <label>". Decorative emoji is
  // `aria-hidden`. Enter / Space already triggers gmp-click natively.
  const makeContent = useCallback((pin: MapPin, isHot: boolean) => {
    const cfg = PIN_CATEGORY_CONFIG[pin.category];
    const div = document.createElement('div');
    div.className = [
      'inline-flex items-center gap-1.5 pr-2.5 pl-1.5 py-1 rounded-full border-2 shadow-md cursor-pointer',
      'transition-all font-sans select-none whitespace-nowrap',
      isHot ? 'bg-black text-white scale-110 z-20' : 'bg-white text-gray-900 hover:scale-105',
    ].join(' ');
    div.style.borderColor = isHot ? '#000' : cfg.color;
    div.setAttribute('role', 'button');
    div.setAttribute(
      'aria-label',
      `Open ${pin.title}${pin.label ? `, ${pin.label}` : ''}`,
    );
    if (isHot) div.setAttribute('aria-current', 'true');

    const dot = document.createElement('span');
    dot.className = 'w-5 h-5 rounded-full flex items-center justify-center text-[11px]';
    dot.style.background = isHot ? 'rgba(255,255,255,0.15)' : `${cfg.color}20`;
    dot.textContent = cfg.emoji;
    dot.setAttribute('aria-hidden', 'true');
    div.appendChild(dot);

    const label = document.createElement('span');
    label.className = 'text-[11px] font-medium max-w-[140px] truncate';
    // Prefer the short label (price) when present; fall back to title.
    label.textContent = pin.label || pin.title;
    div.appendChild(label);

    return div;
  }, []);

  // Rebuild markers whenever the pin set changes + refit bounds. Keeping
  // markers keyed by pin.id lets us update content-only (no churn) for
  // highlight changes, which we handle in a separate effect below.
  useEffect(() => {
    if (!mapRef.current || !librariesReady || authFailed) return;
    const map = mapRef.current;
    const MarkerCtor = MarkerCtorRef.current;
    if (!MarkerCtor) return;
    const pinsWithCoords = pins.filter(
      (p) => p.latitude != null && p.longitude != null,
    );

    try {
      // Remove markers that are no longer in the current set.
      const nextIds = new Set(pinsWithCoords.map((p) => p.id));
      for (const [id, entry] of markersRef.current) {
        if (!nextIds.has(id)) {
          entry.marker.removeEventListener('gmp-click', entry.clickHandler);
          entry.marker.map = null;
          markersRef.current.delete(id);
        }
      }

      // Add / update markers for the current set.
      for (const pin of pinsWithCoords) {
        const isHot = pin.id === highlightedPinId;
        const existing = markersRef.current.get(pin.id);
        if (existing) {
          existing.marker.position = { lat: pin.latitude!, lng: pin.longitude! };
          existing.marker.content = makeContent(pin, isHot);
        } else {
          const marker = new MarkerCtor({
            map,
            position: { lat: pin.latitude!, lng: pin.longitude! },
            content: makeContent(pin, isHot),
            zIndex: isHot ? 1000 : 1,
            // gmpClickable enables the `gmp-click` event on this marker
            // (also makes the element keyboard-focusable for a11y).
            gmpClickable: true,
          });
          // Use the modern `gmp-click` event per Google's recent guidance:
          // <gmp-advanced-marker> deprecates plain 'click'. The event's
          // `domEvent` carries the originating MouseEvent or KeyboardEvent
          // (Enter/Space) so we still get modifier-key access for
          // Cmd/Ctrl-click → open in new tab.
          const clickHandler: EventListener = (event) => {
            const evt = event as Event & {
              domEvent?: MouseEvent | KeyboardEvent;
            };
            const dom = evt.domEvent;
            const viaKeyboard = dom instanceof KeyboardEvent;
            const newTab = !!(
              dom &&
              'metaKey' in dom &&
              (dom.metaKey ||
                dom.ctrlKey ||
                (dom instanceof MouseEvent && dom.button === 1))
            );
            trackMapEvent({
              kind: 'pin_click',
              pinId: pin.id,
              viaKeyboard,
              newTab,
            });
            setHighlightedPinId(pin.id);
            navigateToPin(pin, newTab);
          };
          marker.addEventListener('gmp-click', clickHandler);
          markersRef.current.set(pin.id, { marker, clickHandler });
        }
      }

      // Fit bounds to current pins so the map auto-frames results.
      // LatLngBounds is on the base namespace once `importLibrary('maps')`
      // has resolved (which gated our `librariesReady` flag).
      if (pinsWithCoords.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        for (const p of pinsWithCoords) {
          bounds.extend({ lat: p.latitude!, lng: p.longitude! });
        }
        map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
        trackMapEvent({ kind: 'fitbounds', pinCount: pinsWithCoords.length });
      } else if (pinsWithCoords.length === 1) {
        const p = pinsWithCoords[0];
        map.setCenter({ lat: p.latitude!, lng: p.longitude! });
        map.setZoom(15);
      }

      trackMapEvent({ kind: 'markers_rendered', count: pinsWithCoords.length });
    } catch (err) {
      // Don't crash the React tree if Maps internals throw (e.g. a later
      // auth check trips after the initial Map() succeeded, or an SDK
      // bug between marker versions). Flip to fallback and surface it.
      const message = err instanceof Error ? err.message : String(err);
      console.error('ChatMap marker render failed:', err);
      trackMapEvent({
        kind: 'marker_render_failed',
        error: message,
        pinCount: pinsWithCoords.length,
      });
      setMapError(message);
    }
    // `highlightedPinId` intentionally omitted — handled in the next effect
    // to avoid re-creating markers on every hover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, librariesReady, authFailed, makeContent, setHighlightedPinId, navigateToPin]);

  // Update marker content when highlight changes (no marker churn).
  useEffect(() => {
    if (!librariesReady || authFailed) return;
    try {
      for (const pin of pins) {
        const entry = markersRef.current.get(pin.id);
        if (!entry) continue;
        const isHot = pin.id === highlightedPinId;
        entry.marker.content = makeContent(pin, isHot);
        entry.marker.zIndex = isHot ? 1000 : 1;
      }
    } catch (err) {
      console.error('ChatMap highlight update failed:', err);
    }
  }, [highlightedPinId, pins, librariesReady, authFailed, makeContent]);

  // Full unmount cleanup — symmetric to addEventListener('gmp-click').
  // Without this, listeners leak across navigations (chat → /apartments → chat).
  // We capture the ref by closure so the cleanup function can iterate it
  // even after the ref is mutated by a later mount.
  useEffect(() => {
    const map = markersRef.current;
    return () => {
      for (const { marker, clickHandler } of map.values()) {
        marker.removeEventListener('gmp-click', clickHandler);
        marker.map = null;
      }
      map.clear();
    };
  }, []);

  // Fall back to the pin list when:
  //   - no API key at all (local dev / missing env)
  //   - auth failed at runtime (gm_authFailure — usually ApiNotActivatedMapError
  //     or a referrer restriction on the Google Cloud key)
  // Never throw out of the component — the chat itself still works.
  if (!apiKey || authFailed) {
    if (pins.length === 0) return <EmptyState />;
    return (
      <FallbackPinList
        pins={pins}
        highlightedPinId={highlightedPinId}
        setHighlightedPinId={setHighlightedPinId}
        onPinClick={navigateToPin}
        reason={
          authFailed
            ? 'Map unavailable — enable Maps JavaScript API on the key'
            : 'Interactive map pending Google Maps key'
        }
      />
    );
  }

  return (
    <aside className="relative h-full border-l border-border overflow-hidden bg-muted/10">
      <div ref={containerRef} className="w-full h-full" />

      {/* Count pill floats top-left on the map — matches Mindtrip's lightweight UI */}
      {pins.length > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur rounded-full px-3 py-1.5 text-xs font-medium shadow-sm border border-border">
          {pins.length} on the map
        </div>
      )}

      {/* Empty-until-you-chat helper — only when the map has loaded but no pins */}
      {librariesReady && pins.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-center p-6 pointer-events-none">
          <div className="bg-background/95 backdrop-blur rounded-xl px-4 py-3 shadow-lg border border-border max-w-xs text-center">
            <p className="text-sm">Pins appear here as you chat.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try "top rentals in Laureles" →
            </p>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute top-3 right-3 z-10 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 text-xs text-destructive max-w-[220px]">
          Map failed to load. Chat still works — we'll show pins as a list.
        </div>
      )}
    </aside>
  );
}
