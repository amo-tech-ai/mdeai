import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSupabasePublishableKey } from './supabase-publishable-key';

describe('getSupabasePublishableKey', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers VITE_SUPABASE_PUBLISHABLE_KEY', () => {
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'pk-publishable');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'pk-legacy');
    expect(getSupabasePublishableKey()).toBe('pk-publishable');
  });

  it('falls back to VITE_SUPABASE_ANON_KEY when publishable unset', () => {
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'pk-legacy-only');
    expect(getSupabasePublishableKey()).toBe('pk-legacy-only');
  });

  it('throws when both are missing', () => {
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(() => getSupabasePublishableKey()).toThrow(/VITE_SUPABASE_PUBLISHABLE_KEY/);
  });
});
