import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearPendingPrompt,
  getPendingPrompt,
  PENDING_PROMPT_KEY,
  savePendingPrompt,
  urlSignalsPendingSend,
} from './pending-prompt';

describe('pending-prompt', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it('round-trips a prompt through sessionStorage', () => {
    savePendingPrompt('find rentals in Laureles');
    expect(getPendingPrompt()).toBe('find rentals in Laureles');
  });

  it('uses the single canonical key (no aliases)', () => {
    savePendingPrompt('hello');
    expect(window.sessionStorage.getItem(PENDING_PROMPT_KEY)).toBe('hello');
    expect(window.sessionStorage.getItem('pending_ai_prompt')).toBeNull();
  });

  it('trims whitespace and rejects empty input', () => {
    savePendingPrompt('   ');
    expect(getPendingPrompt()).toBeNull();
    savePendingPrompt('   real prompt   ');
    expect(getPendingPrompt()).toBe('real prompt');
  });

  it('caps very long input', () => {
    const huge = 'a'.repeat(10_000);
    savePendingPrompt(huge);
    const out = getPendingPrompt();
    expect(out).not.toBeNull();
    expect(out!.length).toBeLessThanOrEqual(4_000);
  });

  it('clearPendingPrompt removes the key', () => {
    savePendingPrompt('one');
    clearPendingPrompt();
    expect(getPendingPrompt()).toBeNull();
  });

  it('getPendingPrompt is null when nothing is stored', () => {
    expect(getPendingPrompt()).toBeNull();
  });

  it('savePendingPrompt is a no-op for non-strings', () => {
    // Type-safe call guard — exercises the runtime defense.
    // @ts-expect-error intentional bad input
    savePendingPrompt(undefined);
    // @ts-expect-error intentional bad input
    savePendingPrompt(42);
    expect(getPendingPrompt()).toBeNull();
  });

  it('urlSignalsPendingSend recognizes ?send=pending in any form', () => {
    expect(urlSignalsPendingSend('?send=pending')).toBe(true);
    expect(urlSignalsPendingSend('send=pending')).toBe(true);
    expect(urlSignalsPendingSend('?foo=bar&send=pending&x=1')).toBe(true);
    expect(urlSignalsPendingSend('?send=other')).toBe(false);
    expect(urlSignalsPendingSend('')).toBe(false);
  });
});
