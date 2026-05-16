/**
 * Hardened wrapper around @mastra/mcp for Google Maps Grounding Lite.
 *
 * Responsibilities:
 *   - Validate env on first use (fail fast, redacted error).
 *   - Whitelist tools — never expose `listTools()` output blindly.
 *   - Enforce timeout per call.
 *   - Retry once on transient errors (network / 5xx).
 *   - Circuit breaker — flip open after N consecutive failures.
 *   - Structured logging hooks (ai_runs + grounding usage).
 *   - Disconnect cleanup on shutdown.
 *
 * Does NOT implement the Places-SDK or Supabase fallback paths — those live
 * in the tool that orchestrates this client (search-grounded-places.ts) so
 * fallback policy is decided per tool, not per transport.
 */

import { MCPClient } from '@mastra/mcp';
import {
  GROUNDING_LIMITS,
  GROUNDING_MCP_SERVER_ID,
  GROUNDING_TOOL_NAMES,
  type GroundingToolName,
  filterGroundingTools,
} from './allowedGroundingTools.js';
import { recordMastraRun } from './ai-runs.js';

export class GroundingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroundingConfigError';
  }
}

export class GroundingTimeoutError extends Error {
  readonly toolName: string;
  readonly timeoutMs: number;
  constructor(toolName: string, timeoutMs: number) {
    super(`Grounding Lite tool "${toolName}" timed out after ${timeoutMs}ms`);
    this.name = 'GroundingTimeoutError';
    this.toolName = toolName;
    this.timeoutMs = timeoutMs;
  }
}

export class GroundingCircuitOpenError extends Error {
  constructor() {
    super('Grounding Lite circuit breaker is open — refusing to call MCP');
    this.name = 'GroundingCircuitOpenError';
  }
}

export class GroundingMcpError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'GroundingMcpError';
    this.cause = cause;
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.length < 8) {
    throw new GroundingConfigError(`Missing required env var: ${name}`);
  }
  return v;
}

interface BreakerState {
  failures: number;
  openedAt: number | null;
}

const breaker: BreakerState = { failures: 0, openedAt: null };

function breakerIsOpen(): boolean {
  if (breaker.openedAt === null) return false;
  if (Date.now() - breaker.openedAt > GROUNDING_LIMITS.CIRCUIT_BREAKER_COOLDOWN_MS) {
    breaker.openedAt = null;
    breaker.failures = 0;
    return false;
  }
  return true;
}

function breakerRecordFailure(): void {
  breaker.failures += 1;
  if (breaker.failures >= GROUNDING_LIMITS.CIRCUIT_BREAKER_THRESHOLD) {
    breaker.openedAt = Date.now();
  }
}

function breakerRecordSuccess(): void {
  breaker.failures = 0;
  breaker.openedAt = null;
}

let _mcp: MCPClient | null = null;

function getClient(): MCPClient {
  if (_mcp) return _mcp;
  const apiKey = requireEnv('GOOGLE_MAPS_API_KEY');
  _mcp = new MCPClient({
    id: 'maps-grounding-lite',
    servers: {
      [GROUNDING_MCP_SERVER_ID]: {
        url: new URL('https://mapstools.googleapis.com/mcp'),
        requestInit: {
          headers: { 'X-Goog-Api-Key': apiKey },
        },
      },
    },
    timeout: GROUNDING_LIMITS.MCP_TIMEOUT_MS,
  });
  return _mcp;
}

export async function disconnectGroundingClient(): Promise<void> {
  if (_mcp) {
    try {
      await _mcp.disconnect();
    } catch (err) {
      console.warn('[maps-grounding-client] disconnect failed', err);
    }
    _mcp = null;
  }
}

interface AnyTool {
  execute?: (...args: unknown[]) => Promise<unknown>;
}

async function withTimeout<T>(p: Promise<T>, ms: number, toolName: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new GroundingTimeoutError(toolName, ms)), ms),
    ),
  ]);
}

interface CallOptions {
  userId?: string | null;
  signal?: AbortSignal;
}

/**
 * Call a Grounding Lite tool by short name (e.g. "search_places").
 * Throws structured errors. Caller is responsible for fallback policy.
 */
export async function callGroundingTool(
  toolName: GroundingToolName,
  args: Record<string, unknown>,
  opts: CallOptions = {},
): Promise<unknown> {
  if (breakerIsOpen()) {
    throw new GroundingCircuitOpenError();
  }
  if (!GROUNDING_TOOL_NAMES.includes(toolName)) {
    throw new GroundingMcpError(`Tool not whitelisted: ${toolName}`);
  }

  const startedAt = Date.now();
  const namespacedName = `${GROUNDING_MCP_SERVER_ID}_${toolName}`;

  const tryCall = async (): Promise<unknown> => {
    const client = getClient();
    const allTools = (await client.listTools()) as unknown as Record<string, AnyTool>;
    const tools = filterGroundingTools(allTools);
    const tool = tools[namespacedName];
    if (!tool || typeof tool.execute !== 'function') {
      throw new GroundingMcpError(`Tool unavailable from MCP: ${namespacedName}`);
    }
    return withTimeout(tool.execute(args), GROUNDING_LIMITS.MCP_TIMEOUT_MS, toolName);
  };

  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= GROUNDING_LIMITS.MCP_MAX_RETRIES) {
    try {
      const result = await tryCall();
      breakerRecordSuccess();
      void recordMastraRun({
        user_id: opts.userId ?? null,
        agent_name: 'maps-grounding-lite',
        agent_type: 'general_concierge',
        input_data: { tool: toolName, attempt },
        status: 'success',
        duration_ms: Date.now() - startedAt,
      });
      return result;
    } catch (err) {
      lastErr = err;
      attempt += 1;
      if (err instanceof GroundingConfigError || err instanceof GroundingCircuitOpenError) {
        break;
      }
      if (attempt > GROUNDING_LIMITS.MCP_MAX_RETRIES) break;
    }
  }

  breakerRecordFailure();
  const errCode = lastErr instanceof Error ? lastErr.name : 'GroundingMcpError';
  const errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  void recordMastraRun({
    user_id: opts.userId ?? null,
    agent_name: 'maps-grounding-lite',
    agent_type: 'general_concierge',
    input_data: { tool: toolName, attempts: attempt },
    status: lastErr instanceof GroundingTimeoutError ? 'timeout' : 'error',
    error_code: errCode,
    duration_ms: Date.now() - startedAt,
  });
  throw lastErr instanceof Error ? lastErr : new GroundingMcpError(errMsg, lastErr);
}

/** Read-only breaker status for health endpoints / dashboards. */
export function getGroundingBreakerStatus(): {
  open: boolean;
  failures: number;
  openedAt: number | null;
} {
  return {
    open: breakerIsOpen(),
    failures: breaker.failures,
    openedAt: breaker.openedAt,
  };
}
