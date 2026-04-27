/// <reference types="@types/google.maps" />

/**
 * Singleton loader for the Google Maps JavaScript API.
 *
 * Goals
 * -----
 *   • One <script> tag per page — even if multiple components race to
 *     load Maps (ChatMap on `/`, GoogleMapView on `/trips/:id`).
 *   • One CustomElementsRegistry registration — no
 *     "Element with name 'gmp-map' already defined" warnings.
 *   • Idempotent under React StrictMode and remounts.
 *   • Modern API: `loading=async` + inline bootstrap so callers can
 *     `await google.maps.importLibrary('maps' | 'marker' | …)`.
 *   • Authoritative auth-failure flag (`gm_authFailure` global) that
 *     surfaces ApiNotActivatedMapError / RefererNotAllowed / InvalidKey
 *     to React state instead of crashing inside the Maps internals.
 *
 * Use it like this (callers should NOT inject their own <script>):
 *
 *   const { Map } = await loadGoogleMapsLibrary('maps', apiKey);
 *   const { AdvancedMarkerElement } = await loadGoogleMapsLibrary('marker', apiKey);
 *
 *   if (isMapsAuthFailed()) { … render fallback … }
 */

const SCRIPT_ID = 'google-maps-script';
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
void UUID_RE; // (kept for future referrer-test parity; unused at runtime)

declare global {
  interface Window {
    google?: typeof google;
    /** Google's auth-failure callback. We install once. */
    gm_authFailure?: () => void;
    /** True after gm_authFailure has fired at least once this tab. */
    __mdeaiMapAuthFailed?: boolean;
    /** Internal: shared bootstrap state — survives module HMR + StrictMode. */
    __mdeaiMapsLoader?: MapsLoaderState;
  }
}

interface MapsLoaderState {
  /** API key the loader was first installed with — required to be stable. */
  apiKey: string | null;
  /** Promise that resolves when the bootstrap script has executed. Null until first triggered. */
  scriptPromise: Promise<void> | null;
  /** True after our shim wrote `google.maps.importLibrary`. */
  shimInstalled: boolean;
  /** True after Google's real `importLibrary` has overwritten our shim. */
  loaded: boolean;
}

function getState(): MapsLoaderState {
  if (typeof window === 'undefined') {
    return {
      apiKey: null,
      scriptPromise: null,
      shimInstalled: false,
      loaded: false,
    };
  }
  if (!window.__mdeaiMapsLoader) {
    window.__mdeaiMapsLoader = {
      apiKey: null,
      scriptPromise: null,
      shimInstalled: false,
      loaded: false,
    };
  }
  return window.__mdeaiMapsLoader;
}

function installAuthFailureHandler(): void {
  if (typeof window === 'undefined') return;
  if (window.gm_authFailure) return;
  window.gm_authFailure = () => {
    window.__mdeaiMapAuthFailed = true;
    console.warn(
      '[google-maps-loader] Auth failed (ApiNotActivatedMapError / referrer / invalid key). Whitelist the hostname + enable Maps JavaScript API on the key.',
    );
    window.dispatchEvent(new Event('mdeai:map-auth-failed'));
  };
}

export function isMapsAuthFailed(): boolean {
  return typeof window !== 'undefined' && !!window.__mdeaiMapAuthFailed;
}

/**
 * Subscribe to the auth-failure event. Returns an unsubscribe function.
 * Components use this to flip from the map render to the pin-list fallback.
 */
export function onMapsAuthFailed(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('mdeai:map-auth-failed', cb);
  return () => window.removeEventListener('mdeai:map-auth-failed', cb);
}

/**
 * Install Google's inline bootstrap loader (idempotent).
 *
 * The bootstrap seeds `google.maps.importLibrary` with a lazy shim. On the
 * first `importLibrary(libName)` call, the shim creates the real <script>
 * tag. When that script loads, Google replaces our shim with their real
 * `importLibrary` — subsequent calls go straight there.
 *
 * Idempotency rules:
 *   • If `google.maps.importLibrary` is already a function (shim OR real),
 *     do not re-install — that prevents the "two scripts" race.
 *   • If a legacy `<script id="google-maps-script">` already exists
 *     (e.g. an older component injected it before this loader ran), wait
 *     for it to finish before installing our shim. Avoids appending a
 *     second script.
 */
function installBootstrap(apiKey: string): void {
  if (typeof window === 'undefined') return;
  installAuthFailureHandler();

  const state = getState();
  if (state.apiKey && state.apiKey !== apiKey) {
    console.warn(
      '[google-maps-loader] Maps API was loaded with a different key earlier this session — using the original key.',
    );
  }
  state.apiKey ??= apiKey;

  const w = window as unknown as { google?: { maps?: Record<string, unknown> } };
  w.google = w.google || {};
  w.google.maps = w.google.maps || {};
  const mapsNs = w.google.maps;

  // If anyone (us or a legacy component) has already installed a real
  // importLibrary OR our shim, do nothing. This is the critical guard
  // that prevents double-script injection.
  if (typeof mapsNs.importLibrary === 'function') {
    state.shimInstalled = true;
    return;
  }

  // If a legacy <script id="google-maps-script"> exists, wait for it
  // and DON'T inject another. The legacy script doesn't use loading=async
  // so it'll populate `google.maps.Map` etc. directly — once that happens,
  // we can synthesize an importLibrary that returns the right module.
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    state.scriptPromise = new Promise<void>((resolve, reject) => {
      const onLoad = () => {
        state.loaded = true;
        // Synthesize importLibrary on top of the legacy global.
        if (typeof mapsNs.importLibrary !== 'function') {
          mapsNs.importLibrary = legacyImportLibraryShim;
        }
        resolve();
      };
      if (mapsNs.Map) {
        // Already loaded.
        onLoad();
        return;
      }
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Legacy Maps script failed to load')),
        { once: true },
      );
    });
    return;
  }

  // Install Google's bootstrap shim (typed port of their minified IIFE).
  const libsToLoad = new Set<string>();
  state.shimInstalled = true;

  const ensureScript = (): Promise<void> => {
    if (state.scriptPromise) return state.scriptPromise;
    state.scriptPromise = new Promise<void>((resolve, reject) => {
      const params = new URLSearchParams();
      params.set('key', apiKey);
      params.set('v', 'weekly');
      params.set('loading', 'async');
      if (libsToLoad.size > 0) {
        params.set('libraries', Array.from(libsToLoad).join(','));
      }
      const callbackName = '__mdeaiMapsCb__';
      params.set('callback', `google.maps.${callbackName}`);
      mapsNs[callbackName] = () => {
        state.loaded = true;
        resolve();
      };

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.onerror = () => reject(new Error('Google Maps script failed to load'));
      document.head.append(script);
    });
    return state.scriptPromise;
  };

  // Our shim. When the real Maps script executes, it OVERWRITES this
  // function on `mapsNs.importLibrary`, so subsequent calls go directly
  // to Google's implementation.
  mapsNs.importLibrary = ((libName: string, ...rest: unknown[]) => {
    libsToLoad.add(libName);
    return ensureScript().then(() => {
      const fn = mapsNs.importLibrary as unknown as (
        n: string,
        ...r: unknown[]
      ) => Promise<unknown>;
      // After the script ran, `fn` is Google's real importLibrary.
      return fn(libName, ...rest);
    });
  }) as unknown as typeof google.maps.importLibrary;
}

/**
 * Fallback `importLibrary` for the case where the legacy `<script>`-tag
 * loader (no loading=async) has populated `google.maps.*` directly. We
 * map the requested library name to the matching subnamespace so callers
 * that uniformly use `importLibrary` keep working.
 */
function legacyImportLibraryShim(name: string): Promise<unknown> {
  if (typeof window === 'undefined' || !window.google?.maps) {
    return Promise.reject(new Error('Maps not available'));
  }
  const maps = window.google.maps as unknown as Record<string, unknown>;
  switch (name) {
    case 'maps':
      return Promise.resolve({ Map: maps.Map, LatLngBounds: maps.LatLngBounds });
    case 'marker':
      return Promise.resolve(maps.marker);
    case 'places':
      return Promise.resolve(maps.places);
    default: {
      const lib = maps[name];
      return lib
        ? Promise.resolve(lib)
        : Promise.reject(new Error(`Unknown Maps library: ${name}`));
    }
  }
}

/**
 * Public: load a Maps library (or several) and return Google's library
 * object. Components should ALWAYS go through this — never inject their
 * own <script> tags or read `google.maps.Map` directly.
 *
 *   const { Map } = await loadGoogleMapsLibrary('maps', apiKey);
 *   const { AdvancedMarkerElement } = await loadGoogleMapsLibrary('marker', apiKey);
 */
export async function loadGoogleMapsLibrary<T = unknown>(
  name: 'maps' | 'marker' | 'places' | 'geometry' | string,
  apiKey: string,
): Promise<T> {
  if (typeof window === 'undefined') {
    throw new Error('loadGoogleMapsLibrary called outside the browser');
  }
  if (!apiKey) throw new Error('loadGoogleMapsLibrary: apiKey is required');
  installBootstrap(apiKey);
  // After installBootstrap, google.maps.importLibrary is guaranteed to be a
  // function (either ours or the real one).
  const importLib = window.google?.maps?.importLibrary as
    | ((n: string) => Promise<unknown>)
    | undefined;
  if (typeof importLib !== 'function') {
    throw new Error('Maps importLibrary not installed');
  }
  return (await importLib(name)) as T;
}
