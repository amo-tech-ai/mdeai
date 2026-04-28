/**
 * Regression test for the Google Maps loader shim recursion contract.
 *
 * The shim (`mapsNs.importLibrary`) is called BEFORE Google's real
 * implementation has loaded. On the first call, our shim:
 *   1. Adds the requested library name to the libsToLoad set.
 *   2. Triggers `ensureScript()` which appends the <script> tag and
 *      returns a promise resolving when Google's bootstrap callback
 *      fires.
 *   3. After resolve, recurses by reading `mapsNs.importLibrary` again
 *      — by now Google has overwritten our shim with their real
 *      implementation, so the recursion lands in their code.
 *
 * The bug class to prevent: if step 3 reads a stale closure of
 * `importLibrary` (the OLD shim), it would infinite-recurse instead
 * of bouncing into Google's real one. The shim must read the freshest
 * value off `mapsNs` after the await, not from a captured local.
 *
 * This test stubs `document.createElement('script')` so a real network
 * request never fires — instead we synthesize Google's "callback fires
 * → real importLibrary installed" sequence and assert the post-load
 * call goes to the REAL impl, not the shim.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MapsNamespace = Record<string, unknown> & {
  importLibrary?: (name: string) => Promise<unknown>;
  __mdeaiMapsCb__?: () => void;
};
type WindowWithMaps = Window & {
  google?: { maps?: MapsNamespace };
  __mdeaiMapsLoader?: unknown;
  __mdeaiMapAuthFailed?: unknown;
  gm_authFailure?: () => void;
};

describe('google-maps-loader shim recursion', () => {
  let originalCreateElement: typeof document.createElement;
  let scriptStub: HTMLScriptElement | null;

  beforeEach(() => {
    // Reset every globals the loader touches between tests.
    const w = window as unknown as WindowWithMaps;
    delete w.google;
    delete w.__mdeaiMapsLoader;
    delete w.__mdeaiMapAuthFailed;
    delete w.gm_authFailure;
    scriptStub = null;

    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((
      tagName: string,
    ) => {
      if (tagName !== 'script') return originalCreateElement(tagName);
      // Build a real <script> element but DON'T let it actually fetch.
      // We assert on its src + simulate the callback firing manually.
      const el = originalCreateElement('script') as HTMLScriptElement;
      scriptStub = el;
      // Block real network: replace the setter on `src` to a noop. The
      // bootstrap reads `script.src = '...'` then `document.head.append(script)`.
      Object.defineProperty(el, 'src', {
        get: () => el.getAttribute('src') ?? '',
        set: (v: string) => el.setAttribute('src', v),
      });
      return el;
    }) as typeof document.createElement);

    // Prevent the real <script> from being inserted into the DOM (which
    // jsdom would otherwise try to fetch and warn about).
    vi.spyOn(document.head, 'append').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset the loader's module-internal state by clearing the window-
    // shared bag. The next import will re-populate it.
    const w = window as unknown as WindowWithMaps;
    delete w.google;
    delete w.__mdeaiMapsLoader;
    delete w.gm_authFailure;
    vi.resetModules();
  });

  it('recursive call lands in Google\'s real importLibrary, not the shim', async () => {
    const mod = await import('./google-maps-loader');

    // Kick off a load — the shim is now installed but Google's real
    // script hasn't "loaded" yet (we stubbed network).
    const loadPromise = mod.loadGoogleMapsLibrary('maps', 'test-api-key');

    // Sanity: shim is installed.
    const w = window as unknown as WindowWithMaps;
    const mapsNs = w.google?.maps;
    expect(mapsNs).toBeDefined();
    expect(typeof mapsNs?.importLibrary).toBe('function');

    // The shim itself is a function — call signature (libName) => Promise.
    // After Google's "real" importLibrary lands, the shim's `then(() => fn(...))`
    // should pick up the REAL one, not call itself. Simulate Google: replace
    // mapsNs.importLibrary with a sentinel that records the call and returns
    // a tagged result. The bootstrap callback fires to resolve the promise.
    const realCalls: string[] = [];
    const realImpl = vi.fn((name: string) => {
      realCalls.push(name);
      return Promise.resolve({ __real: true, name });
    });
    if (!mapsNs) throw new Error('mapsNs not installed');
    mapsNs.importLibrary = realImpl as unknown as MapsNamespace['importLibrary'];

    // Fire the bootstrap callback that Google would have fired after
    // the script loaded.
    mapsNs.__mdeaiMapsCb__?.();

    // The pending load should now resolve via `then(() => fn(libName, ...rest))`.
    // If the `fn` capture were stale (the old shim), it would loop;
    // instead, it must call our `realImpl` ONCE.
    const result = (await loadPromise) as { __real?: boolean; name?: string };

    expect(realImpl).toHaveBeenCalledTimes(1);
    expect(realCalls).toEqual(['maps']);
    expect(result.__real).toBe(true);
    expect(result.name).toBe('maps');
  });

  it('script src is built with the api key, async loading, and callback', async () => {
    const mod = await import('./google-maps-loader');
    const promise = mod.loadGoogleMapsLibrary('marker', 'k123');

    expect(scriptStub).not.toBeNull();
    const src = scriptStub?.getAttribute('src') ?? '';
    expect(src).toContain('https://maps.googleapis.com/maps/api/js');
    expect(src).toContain('key=k123');
    expect(src).toContain('loading=async');
    expect(src).toContain('callback=google.maps.__mdeaiMapsCb__');

    // Drain the pending promise so afterEach cleanup doesn't hit an
    // unresolved-promise warning.
    const w = window as unknown as WindowWithMaps;
    const mapsNs = w.google?.maps;
    if (!mapsNs) throw new Error('mapsNs missing');
    mapsNs.importLibrary = ((name: string) =>
      Promise.resolve({ name })) as unknown as MapsNamespace['importLibrary'];
    mapsNs.__mdeaiMapsCb__?.();
    await promise;
  });

  it('refuses to load without an api key', async () => {
    const mod = await import('./google-maps-loader');
    await expect(mod.loadGoogleMapsLibrary('maps', '')).rejects.toThrow(
      /apiKey is required/,
    );
  });

  it('isMapsAuthFailed flips after gm_authFailure fires', async () => {
    const mod = await import('./google-maps-loader');
    expect(mod.isMapsAuthFailed()).toBe(false);
    // Trigger an init to install the auth-failure handler.
    void mod.loadGoogleMapsLibrary('maps', 'k').catch(() => undefined);
    const w = window as unknown as WindowWithMaps;
    expect(typeof w.gm_authFailure).toBe('function');
    w.gm_authFailure?.();
    expect(mod.isMapsAuthFailed()).toBe(true);
  });
});
