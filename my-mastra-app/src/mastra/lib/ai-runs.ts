/**
 * Best-effort ai_runs writer for the Mastra runtime.
 * Mirrors public.ai_runs insert pattern from supabase/functions/_shared/ai-runs.ts.
 * Never throws — failures are logged and swallowed so chat response is never blocked.
 */
import { createClient } from '@supabase/supabase-js';

export type AgentType =
  | 'event_curator'
  | 'local_scout'
  | 'dining_orchestrator'
  | 'itinerary_optimizer'
  | 'budget_guardian'
  | 'booking_assistant'
  | 'general_concierge'
  | 'concierge'
  | 'mia'
  | 'luna'
  | 'carlos'
  | 'alex'
  | 'diego'
  | 'roberto'
  | 'sponsor';

export interface MastraRunRecord {
  user_id: string | null;
  agent_name: string;
  agent_type: AgentType;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  status: 'success' | 'error' | 'timeout';
  error_message?: string | null;
  /** Backward-compatible alias for older task docs/callers; stored as error_message. */
  error_code?: string | null;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  duration_ms?: number;
  model_name?: string;
  metadata?: Record<string, unknown>;
}

let _client: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

export async function recordMastraRun(record: MastraRunRecord): Promise<void> {
  const client = getServiceClient();
  if (!client) {
    console.warn('[ai-runs] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — skipping ai_runs insert');
    return;
  }
  try {
    // Race the insert against a 500ms deadline so a slow/down Supabase never
    // blocks the chat response path. Timeout is swallowed, not thrown.
    const deadline = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('ai_runs insert timeout')), 500),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await Promise.race([(client as any).from('ai_runs').insert({
      user_id: record.user_id,
      agent_name: record.agent_name,
      agent_type: record.agent_type,
      input_data: record.input_data ?? {},
      output_data: record.output_data ?? {},
      status: record.status,
      error_message: record.error_message ?? record.error_code ?? null,
      input_tokens: record.input_tokens ?? 0,
      output_tokens: record.output_tokens ?? 0,
      total_tokens: record.total_tokens ?? (record.input_tokens ?? 0) + (record.output_tokens ?? 0),
      duration_ms: record.duration_ms ?? 0,
      model_name: record.model_name ?? null,
      metadata: record.metadata ?? null,
    }), deadline]);
    if (error) {
      console.error('[ai-runs] insert failed:', error.message);
    }
  } catch (err) {
    console.warn('[ai-runs] skipped:', err instanceof Error ? err.message : String(err));
  }
}
