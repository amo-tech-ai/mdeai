/// <reference types="@types/google.maps" />
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin as MapPinIcon } from 'lucide-react';
import { useMapContext, PIN_CATEGORY_CONFIG, type MapPin } from '@/context/MapContext';
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

declare global {
  interface Window {
    google?: typeof google;
    __mdeaiMapScriptPromise?: Promise<void>;
    /** Google Maps auth-failure callback — set before script load. */
    gm_authFailure?: () => void;
    /** Latched truthy when gm_authFailure fires — components read + fall back. */
    __mdeaiMapAuthFailed?: boolean;
  }
}

// Medellín fallback center so the map has a reasonable default pose before
// any pins arrive (vs. staring at the Atlantic or whatever the default is).
const MEDELLIN_CENTER = { lat: 6.2442, lng: -75.5812 };
const MAP_ID = 'mdeai-chat-map';

/**
 * Load the Google Maps script exactly once per tab. Stores the Promise on
 * `window.__mdeaiMapScriptPromise` so multiple ChatMap mounts share the same
 * load and never double-append the <script> tag.
 *
 * Adds `loading=async` per Google's recommended pattern — silences the
 * "loaded directly without loading=async" warning and lets the API defer
 * non-critical work.
 *
 * Installs `window.gm_authFailure` so ApiNotActivatedMapError / RefererNotAllowed
 * / InvalidKey surface as a flag we can check instead of crashing inside
 * the Maps API internals.
 */
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!window.gm_authFailure) {
    window.gm_authFailure = () => {
      window.__mdeaiMapAuthFailed = true;
      console.warn(
        '[ChatMap] Google Maps auth failed (likely ApiNotActivatedMapError or referrer restriction). Enable Maps JavaScript API in Google Cloud + whitelist the hostname.',
      );
      // Fire a custom event so mounted components can react without polling.
      window.dispatchEvent(new Event('mdeai:map-auth-failed'));
    };
  }
  if (window.google?.maps?.Map) return Promise.resolve();
  if (window.__mdeaiMapScriptPromise) return window.__mdeaiMapScriptPromise;

  window.__mdeaiMapScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Maps script failed')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Maps script failed'));
    document.head.appendChild(script);
  });
  return window.__mdeaiMapScriptPromise;
}

function FallbackPinList({
  pins,
  highlightedPinId,
  setHighlightedPinId,
  reason,
}: {
  pins: MapPin[];
  highlightedPinId: string | null;
  setHighlightedPinId: (id: string | null) => void;
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

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // If a prior mount already tripped gm_authFailure, skip straight to the
  // fallback UI — no point loading the script again just to crash.
  const [authFailed, setAuthFailed] = useState<boolean>(
    typeof window !== 'undefined' && !!window.__mdeaiMapAuthFailed,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setAuthFailed(true);
    window.addEventListener('mdeai:map-auth-failed', handler);
    return () => window.removeEventListener('mdeai:map-auth-failed', handler);
  }, []);

  // Load Google Maps script (once per tab). Re-runs only on apiKey change,
  // which never happens after initial mount.
  useEffect(() => {
    if (!apiKey || authFailed) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => !cancelled && setMapReady(true))
      .catch((err) => !cancelled && setMapError(String(err)));
    return () => {
      cancelled = true;
    };
  }, [apiKey, authFailed]);

  // Initialize map once script + container are ready.
  useEffect(() => {
    if (!mapReady || authFailed || !containerRef.current || mapRef.current) return;
    try {
      mapRef.current = new google.maps.Map(containerRef.current, {
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
    } catch (err) {
      console.error('ChatMap init failed:', err);
      setMapError(err instanceof Error ? err.message : String(err));
    }
  }, [mapReady, authFailed]);

  // Create / update marker content. Uses a plain div so we can keep the
  // mdeai visual language (emoji + title pill) without MapID-bound custom
  // styles. `isHot` is the hover-highlight from card ↔ pin cross-link.
  const makeContent = useCallback((pin: MapPin, isHot: boolean) => {
    const cfg = PIN_CATEGORY_CONFIG[pin.category];
    const div = document.createElement('div');
    div.className = [
      'inline-flex items-center gap-1.5 pr-2.5 pl-1.5 py-1 rounded-full border-2 shadow-md cursor-pointer',
      'transition-all font-sans select-none whitespace-nowrap',
      isHot ? 'bg-black text-white scale-110 z-20' : 'bg-white text-gray-900 hover:scale-105',
    ].join(' ');
    div.style.borderColor = isHot ? '#000' : cfg.color;

    const dot = document.createElement('span');
    dot.className = 'w-5 h-5 rounded-full flex items-center justify-center text-[11px]';
    dot.style.background = isHot ? 'rgba(255,255,255,0.15)' : `${cfg.color}20`;
    dot.textContent = cfg.emoji;
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
    if (!mapRef.current || !mapReady || authFailed) return;
    const map = mapRef.current;
    const pinsWithCoords = pins.filter(
      (p) => p.latitude != null && p.longitude != null,
    );

    try {
      // Remove markers that are no longer in the current set.
      const nextIds = new Set(pinsWithCoords.map((p) => p.id));
      for (const [id, marker] of markersRef.current) {
        if (!nextIds.has(id)) {
          marker.map = null;
          markersRef.current.delete(id);
        }
      }

      // Add / update markers for the current set.
      for (const pin of pinsWithCoords) {
        const isHot = pin.id === highlightedPinId;
        const existing = markersRef.current.get(pin.id);
        if (existing) {
          existing.position = { lat: pin.latitude!, lng: pin.longitude! };
          existing.content = makeContent(pin, isHot);
        } else {
          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: pin.latitude!, lng: pin.longitude! },
            content: makeContent(pin, isHot),
            zIndex: isHot ? 1000 : 1,
          });
          marker.addListener('click', () => {
            setHighlightedPinId(pin.id);
          });
          markersRef.current.set(pin.id, marker);
        }
      }

      // Fit bounds to current pins so the map auto-frames results.
      if (pinsWithCoords.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        for (const p of pinsWithCoords) {
          bounds.extend({ lat: p.latitude!, lng: p.longitude! });
        }
        map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
      } else if (pinsWithCoords.length === 1) {
        const p = pinsWithCoords[0];
        map.setCenter({ lat: p.latitude!, lng: p.longitude! });
        map.setZoom(15);
      }
    } catch (err) {
      // Don't crash the React tree if Maps internals throw (e.g. a later
      // auth check trips after the initial Map() succeeded, or an SDK
      // bug between marker versions). Flip to fallback and surface it.
      console.error('ChatMap marker render failed:', err);
      setMapError(err instanceof Error ? err.message : String(err));
    }
    // `highlightedPinId` intentionally omitted — handled in the next effect
    // to avoid re-creating markers on every hover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, mapReady, authFailed, makeContent, setHighlightedPinId]);

  // Update marker content when highlight changes (no marker churn).
  useEffect(() => {
    if (!mapReady || authFailed) return;
    try {
      for (const pin of pins) {
        const marker = markersRef.current.get(pin.id);
        if (!marker) continue;
        const isHot = pin.id === highlightedPinId;
        marker.content = makeContent(pin, isHot);
        marker.zIndex = isHot ? 1000 : 1;
      }
    } catch (err) {
      console.error('ChatMap highlight update failed:', err);
    }
  }, [highlightedPinId, pins, mapReady, authFailed, makeContent]);

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
      {mapReady && pins.length === 0 && (
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
