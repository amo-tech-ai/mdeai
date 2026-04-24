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
 * Install Google's inline bootstrap loader.
 *
 * The key insight (from
 * https://developers.google.com/maps/documentation/javascript/load-maps-js-api):
 * `google.maps.importLibrary(...)` is ONLY installed when you use the inline
 * bootstrap pattern. A plain `<script src=".../js?...&loading=async">` tag
 * does NOT install importLibrary; calling it throws "is not a function".
 *
 * This helper is a typed port of Google's minified IIFE: it seeds
 * `google.maps.importLibrary` as a lazy shim that (on first call) injects
 * the real Maps API script, and — once the script executes — the real
 * `importLibrary` overwrites our shim. Subsequent awaits resolve to the
 * requested library's real constructors (Map, AdvancedMarkerElement, …).
 *
 * Also installs `window.gm_authFailure` so ApiNotActivatedMapError /
 * RefererNotAllowed / InvalidKey surface as a flag we can fall back on
 * instead of crashing inside the Maps API internals.
 */
type BootstrapConfig = {
  key: string;
  v: string;
  libraries?: string;
  loading?: string;
};

function installMapsBootstrap(config: BootstrapConfig): void {
  if (typeof window === 'undefined') return;

  if (!window.gm_authFailure) {
    window.gm_authFailure = () => {
      window.__mdeaiMapAuthFailed = true;
      console.warn(
        '[ChatMap] Google Maps auth failed (ApiNotActivatedMapError / referrer / invalid key). Enable Maps JavaScript API + whitelist the hostname on the key.',
      );
      window.dispatchEvent(new Event('mdeai:map-auth-failed'));
    };
  }

  const w = window as unknown as { google?: { maps?: Record<string, unknown> } };
  w.google = w.google || {};
  w.google.maps = w.google.maps || {};
  const mapsNs = w.google.maps;

  // If the real importLibrary is already installed (prior mount) — we're done.
  if (typeof mapsNs.importLibrary === 'function' && !mapsNs.__mdeai_shim__) return;

  const libsToLoad = new Set<string>();
  let loadPromise: Promise<void> | null = null;

  const ensureLoaded = (): Promise<void> => {
    if (loadPromise) return loadPromise;
    loadPromise = new Promise<void>((resolve, reject) => {
      const params = new URLSearchParams();
      params.set('libraries', Array.from(libsToLoad).join(','));
      for (const [k, v] of Object.entries(config)) {
        if (v == null) continue;
        // camelCase → snake_case (Google's convention: `v` stays, `loading` stays, `key` stays)
        const snake = k.replace(/[A-Z]/g, (ch) => '_' + ch.toLowerCase());
        params.set(snake, String(v));
      }
      params.set('callback', 'google.maps.__mdeai_cb__');
      mapsNs.__mdeai_cb__ = resolve;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onerror = () => reject(new Error('Google Maps script failed to load'));
      document.head.append(script);
    });
    return loadPromise;
  };

  // Install our shim. Google's real importLibrary (installed by the loaded
  // script) will OVERWRITE this function, so subsequent calls go to the
  // real one. The recursive `mapsNs.importLibrary(...)` at the end re-enters
  // the now-real function.
  mapsNs.__mdeai_shim__ = true;
  mapsNs.importLibrary = (libName: string, ...rest: unknown[]) => {
    libsToLoad.add(libName);
    return ensureLoaded().then(() => {
      // At this point the Maps API has loaded and replaced importLibrary
      // with the real one. Re-call via mapsNs to pick up the new function.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (mapsNs.importLibrary as any)(libName, ...rest);
    });
  };
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

  // Install the inline bootstrap (seeds google.maps.importLibrary). This
  // MUST happen before any `importLibrary()` call. Safe to call multiple
  // times — the helper no-ops after the first install.
  useEffect(() => {
    if (!apiKey || authFailed) return;
    installMapsBootstrap({ key: apiKey, v: 'weekly' });
  }, [apiKey, authFailed]);

  // Expose the Map + AdvancedMarkerElement constructors once importLibrary
  // resolves. We don't use `google.maps.Map` on the root namespace directly
  // because with the bootstrap loader it isn't populated until the library
  // is imported — we use whatever importLibrary returns.
  const MapCtorRef = useRef<typeof google.maps.Map | null>(null);
  const MarkerCtorRef = useRef<typeof google.maps.marker.AdvancedMarkerElement | null>(null);
  const [librariesReady, setLibrariesReady] = useState(false);

  // Initialize map once container is ready + bootstrap has been installed.
  useEffect(() => {
    if (!apiKey || authFailed || !containerRef.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        // Request both libraries in parallel so our shim adds both to
        // `libsToLoad` before `ensureLoaded()` triggers — the single
        // script URL will include `libraries=maps,marker` (one network
        // round-trip instead of a lazy second load).
        const [mapsLib, markerLib] = (await Promise.all([
          google.maps.importLibrary('maps'),
          google.maps.importLibrary('marker'),
        ])) as [google.maps.MapsLibrary, google.maps.MarkerLibrary];
        if (cancelled) return;
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
        console.error('ChatMap init failed:', err);
        setMapError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, authFailed]);

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
          const marker = new MarkerCtor({
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
      // LatLngBounds is on the base namespace once `importLibrary('maps')`
      // has resolved (which gated our `librariesReady` flag).
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
  }, [pins, librariesReady, authFailed, makeContent, setHighlightedPinId]);

  // Update marker content when highlight changes (no marker churn).
  useEffect(() => {
    if (!librariesReady || authFailed) return;
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
  }, [highlightedPinId, pins, librariesReady, authFailed, makeContent]);

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
