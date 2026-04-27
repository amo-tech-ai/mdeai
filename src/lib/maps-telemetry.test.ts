import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  measureScriptLoad,
  setMapTelemetrySink,
  trackMapEvent,
} from './maps-telemetry';

describe('maps-telemetry', () => {
  let sink: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sink = vi.fn();
    setMapTelemetrySink(sink);
  });

  afterEach(() => {
    // Reset to no-op so other tests don't see captured state.
    setMapTelemetrySink(() => undefined);
  });

  it('forwards events to the active sink', () => {
    trackMapEvent({ kind: 'pin_click', pinId: 'abc', newTab: false });
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith({
      kind: 'pin_click',
      pinId: 'abc',
      newTab: false,
    });
  });

  it('does NOT throw when the sink throws (telemetry must not break the app)', () => {
    setMapTelemetrySink(() => {
      throw new Error('sink boom');
    });
    expect(() =>
      trackMapEvent({ kind: 'auth_failed', error: 'whatever' }),
    ).not.toThrow();
  });

  it('measureScriptLoad emits script_loaded on success with duration', async () => {
    const result = await measureScriptLoad(async () => {
      await new Promise((r) => setTimeout(r, 5));
      return 'ok';
    }, ['maps', 'marker']);
    expect(result).toBe('ok');
    expect(sink).toHaveBeenCalledTimes(1);
    const event = sink.mock.calls[0][0];
    expect(event.kind).toBe('script_loaded');
    expect(event.libraries).toEqual(['maps', 'marker']);
    expect(typeof event.durationMs).toBe('number');
    expect(event.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('measureScriptLoad emits script_load_failed on rejection AND rethrows', async () => {
    await expect(
      measureScriptLoad(async () => {
        throw new Error('network down');
      }, ['maps']),
    ).rejects.toThrow('network down');

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0][0]).toEqual({
      kind: 'script_load_failed',
      error: 'network down',
    });
  });
});
