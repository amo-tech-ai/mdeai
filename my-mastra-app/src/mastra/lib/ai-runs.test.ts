import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const insert = vi.fn<(row: Record<string, unknown>) => Promise<{ error: null }>>(() =>
  Promise.resolve({ error: null }),
);
const createClient = vi.fn(() => ({
  from: vi.fn((table: string) => {
    expect(table).toBe('ai_runs');
    return { insert };
  }),
}));

vi.mock('@supabase/supabase-js', () => ({ createClient }));

describe('recordMastraRun', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.resetModules();
  });

  it('inserts the live ai_runs schema shape, including error_message not error_code', async () => {
    const { recordMastraRun } = await import('./ai-runs');

    await recordMastraRun({
      user_id: '00000000-0000-4000-8000-000000000005',
      agent_name: 'concierge-agent',
      agent_type: 'general_concierge',
      input_data: { last_user_message: 'nearby restaurants' },
      output_data: { status: 'error' },
      status: 'error',
      error_code: 'MAPS_TIMEOUT',
      input_tokens: 12,
      output_tokens: 8,
      duration_ms: 321,
      model_name: 'gemini-3-flash-preview',
      metadata: { grounded: true, cost_class: 'maps' },
    });

    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'service-role-test-key', {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    expect(insert).toHaveBeenCalledWith({
      user_id: '00000000-0000-4000-8000-000000000005',
      agent_name: 'concierge-agent',
      agent_type: 'general_concierge',
      input_data: { last_user_message: 'nearby restaurants' },
      output_data: { status: 'error' },
      status: 'error',
      error_message: 'MAPS_TIMEOUT',
      input_tokens: 12,
      output_tokens: 8,
      total_tokens: 20,
      duration_ms: 321,
      model_name: 'gemini-3-flash-preview',
      metadata: { grounded: true, cost_class: 'maps' },
    });
    expect(insert.mock.calls[0][0]).not.toHaveProperty('error_code');
  });

  it('uses an explicit error_message over the backward-compatible error_code alias', async () => {
    const { recordMastraRun } = await import('./ai-runs');

    await recordMastraRun({
      user_id: '00000000-0000-4000-8000-000000000006',
      agent_name: 'concierge-agent',
      agent_type: 'general_concierge',
      status: 'error',
      error_message: 'human readable error',
      error_code: 'LEGACY_CODE',
    });

    expect(insert.mock.calls[0][0]).toMatchObject({
      error_message: 'human readable error',
    });
    expect(insert.mock.calls[0][0]).not.toHaveProperty('error_code');
  });
});
