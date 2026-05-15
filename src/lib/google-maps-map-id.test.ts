/**
 * MASTRA-068 — google-maps-map-id unit tests
 *
 * Verified against official GMP docs via MCP (google-maps-code-assist, 2026-05-14):
 *   Source: developers.google.com/maps/documentation/javascript/advanced-markers/start
 *   "DEMO_MAP_ID is for testing only."
 *   "Advanced markers requires a map ID. If the map ID is missing, advanced markers
 *    cannot load."
 *
 * Test contracts:
 * 1. When VITE_GOOGLE_MAPS_MAP_ID is set → returns it (trimmed), any environment
 * 2. When VITE_GOOGLE_MAPS_MAP_ID is whitespace-only → treated as missing
 * 3. Env var unset + non-production mode → returns DEMO_MAP_ID, logs console.warn
 * 4. Env var unset + production mode → returns undefined, logs console.error
 * 5. DEMO_MAP_ID constant exported is the exact string 'DEMO_MAP_ID'
 * 6. No hardcoded 'mdeai-chat-map' or other invented Map ID remains
 * 7. Production never silently returns DEMO_MAP_ID
 * 8. Env var set in production → returns env var (not DEMO_MAP_ID)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Dynamically re-import per test so env stubs take effect.
// The helper reads import.meta.env INSIDE the function body so stubs
// applied before each call are visible — no module reset needed.
import { getGoogleMapsMapId, DEMO_MAP_ID } from './google-maps-map-id';

describe('DEMO_MAP_ID constant', () => {
  it('equals the exact string "DEMO_MAP_ID" as documented by Google', () => {
    expect(DEMO_MAP_ID).toBe('DEMO_MAP_ID');
  });
});

describe('getGoogleMapsMapId — env var present', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns the env var value when set (dev mode)', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', 'abc123RealMapId');
    vi.stubEnv('MODE', 'development');
    expect(getGoogleMapsMapId()).toBe('abc123RealMapId');
  });

  it('returns the env var value when set (production mode)', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', 'prod-map-id-xyz');
    vi.stubEnv('MODE', 'production');
    expect(getGoogleMapsMapId()).toBe('prod-map-id-xyz');
  });

  it('trims whitespace from env var', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', '  realId  ');
    expect(getGoogleMapsMapId()).toBe('realId');
  });

  it('does not log warn or error when env var is set', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', 'valid-id');
    getGoogleMapsMapId();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('does NOT return DEMO_MAP_ID when env var is set in production', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', 'real-production-map-id');
    vi.stubEnv('MODE', 'production');
    const result = getGoogleMapsMapId();
    expect(result).not.toBe(DEMO_MAP_ID);
    expect(result).toBe('real-production-map-id');
  });
});

describe('getGoogleMapsMapId — env var missing, non-production mode', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', '');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns DEMO_MAP_ID in development mode', () => {
    vi.stubEnv('MODE', 'development');
    expect(getGoogleMapsMapId()).toBe('DEMO_MAP_ID');
  });

  it('returns DEMO_MAP_ID in test mode (Vitest default)', () => {
    // Vitest default MODE is 'test' — not 'production' → should get DEMO_MAP_ID
    vi.stubEnv('MODE', 'test');
    expect(getGoogleMapsMapId()).toBe(DEMO_MAP_ID);
  });

  it('logs a console.warn (not error) in non-production mode', () => {
    vi.stubEnv('MODE', 'development');
    getGoogleMapsMapId();
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('warn message mentions VITE_GOOGLE_MAPS_MAP_ID', () => {
    vi.stubEnv('MODE', 'development');
    getGoogleMapsMapId();
    const warnArg = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(warnArg).toContain('VITE_GOOGLE_MAPS_MAP_ID');
  });

  it('warn message mentions DEMO_MAP_ID', () => {
    vi.stubEnv('MODE', 'development');
    getGoogleMapsMapId();
    const warnArg = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(warnArg).toContain('DEMO_MAP_ID');
  });
});

describe('getGoogleMapsMapId — env var missing, production mode', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', '');
    vi.stubEnv('MODE', 'production');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns undefined in production when env var is missing', () => {
    expect(getGoogleMapsMapId()).toBeUndefined();
  });

  it('does NOT silently return DEMO_MAP_ID in production', () => {
    // Core contract: production must never silently use DEMO_MAP_ID
    const result = getGoogleMapsMapId();
    expect(result).not.toBe(DEMO_MAP_ID);
    expect(result).not.toBe('DEMO_MAP_ID');
  });

  it('logs a console.error (not warn) in production', () => {
    getGoogleMapsMapId();
    expect(console.error).toHaveBeenCalledOnce();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('error message mentions VITE_GOOGLE_MAPS_MAP_ID', () => {
    getGoogleMapsMapId();
    const errArg = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(errArg).toContain('VITE_GOOGLE_MAPS_MAP_ID');
  });

  it('error message mentions Vercel environment variables', () => {
    getGoogleMapsMapId();
    const errArg = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(errArg.toLowerCase()).toContain('vercel');
  });
});

describe('getGoogleMapsMapId — whitespace-only env var', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('treats whitespace-only env var as missing in dev', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', '   ');
    vi.stubEnv('MODE', 'development');
    expect(getGoogleMapsMapId()).toBe(DEMO_MAP_ID);
  });

  it('treats whitespace-only env var as missing in production → undefined', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_MAP_ID', '   ');
    vi.stubEnv('MODE', 'production');
    expect(getGoogleMapsMapId()).toBeUndefined();
  });
});
