import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const recordMastraRun = vi.fn<(...args: unknown[]) => Promise<void>>(() => Promise.resolve());
const insert = vi.fn(() => Promise.resolve({ error: null }));
const createClient = vi.fn(() => ({
  from: vi.fn((table: string) => {
    expect(table).toBe('ai_runs');
    return { insert };
  }),
}));

vi.mock('./ai-runs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./ai-runs')>()),
  recordMastraRun,
}));

vi.mock('@supabase/supabase-js', () => ({ createClient }));

function jwtWithSub(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub })).toString('base64url');
  return `${header}.${payload}.signature`;
}

function createContext({
  auth,
  body,
  status = 200,
}: {
  auth?: string;
  body?: unknown;
  status?: number;
} = {}) {
  return {
    req: {
      header: vi.fn((name: string) => (name.toLowerCase() === 'authorization' ? auth : undefined)),
      json: vi.fn(async () => {
        if (body instanceof Error) throw body;
        return body ?? {};
      }),
    },
    res: { status },
  };
}

describe('aiRunsMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T07:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.resetModules();
  });

  it('is scoped to /chat', async () => {
    const { aiRunsMiddleware } = await import('./ai-runs-middleware');

    expect(aiRunsMiddleware.path).toBe('/chat');
  });

  it('records a successful authenticated chat turn after next() completes', async () => {
    const { aiRunsMiddleware } = await import('./ai-runs-middleware');
    const userId = '00000000-0000-4000-8000-000000000001';
    const c = createContext({
      auth: `Bearer ${jwtWithSub(userId)}`,
      body: {
        messages: [
          { role: 'assistant', content: 'previous' },
          { role: 'user', content: 'top rentals in Laureles' },
        ],
      },
    });
    const next = vi.fn(async () => {
      vi.setSystemTime(new Date('2026-05-17T07:00:00.123Z'));
    });

    await aiRunsMiddleware.handler(c, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(recordMastraRun).toHaveBeenCalledWith({
      user_id: userId,
      agent_name: 'concierge-agent',
      agent_type: 'general_concierge',
      input_data: { last_user_message: 'top rentals in Laureles' },
      output_data: { status: 'success' },
      status: 'success',
      duration_ms: 123,
    });
  });

  it('records error status when downstream response status is >= 400', async () => {
    const { aiRunsMiddleware } = await import('./ai-runs-middleware');
    const c = createContext({
      auth: `Bearer ${jwtWithSub('00000000-0000-4000-8000-000000000002')}`,
      body: { messages: [{ role: 'user', content: 'hello' }] },
      status: 502,
    });

    await aiRunsMiddleware.handler(c, vi.fn(async () => undefined));

    expect(recordMastraRun).toHaveBeenCalledWith(
      expect.objectContaining({
        output_data: { status: 'error' },
        status: 'error',
      }),
    );
  });

  it('does not write ai_runs for missing or invalid bearer JWTs', async () => {
    const { aiRunsMiddleware } = await import('./ai-runs-middleware');

    await aiRunsMiddleware.handler(createContext(), vi.fn(async () => undefined));
    await aiRunsMiddleware.handler(
      createContext({ auth: 'Bearer not-a-jwt', body: { messages: [{ content: 'hello' }] } }),
      vi.fn(async () => undefined),
    );

    expect(recordMastraRun).not.toHaveBeenCalled();
  });

  it('continues and records an empty input summary when request JSON parsing fails', async () => {
    const { aiRunsMiddleware } = await import('./ai-runs-middleware');
    const c = createContext({
      auth: `Bearer ${jwtWithSub('00000000-0000-4000-8000-000000000003')}`,
      body: new Error('bad json'),
    });

    await aiRunsMiddleware.handler(c, vi.fn(async () => undefined));

    expect(recordMastraRun).toHaveBeenCalledWith(expect.objectContaining({ input_data: {} }));
  });

  it('swallows async ai_runs insert failures so chat responses are not blocked', async () => {
    recordMastraRun.mockRejectedValueOnce(new Error('database unavailable'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { aiRunsMiddleware } = await import('./ai-runs-middleware');
    const c = createContext({
      auth: `Bearer ${jwtWithSub('00000000-0000-4000-8000-000000000004')}`,
      body: { messages: [{ content: 'hello' }] },
    });

    await aiRunsMiddleware.handler(c, vi.fn(async () => undefined));
    await vi.runAllTicks();

    expect(warn).toHaveBeenCalledWith(
      '[ai-runs-middleware] insert failed:',
      'database unavailable',
    );
    warn.mockRestore();
  });
});
