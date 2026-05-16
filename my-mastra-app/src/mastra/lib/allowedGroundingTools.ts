/**
 * Explicit whitelist of Grounding Lite MCP tools we are allowed to call.
 * Anything else returned by `mapsGroundingMcp.listTools()` must be rejected
 * — Google may add tools to the server; we ship only what we have reviewed.
 */

export const GROUNDING_MCP_SERVER_ID = 'mapsGroundingLite' as const;

export const GROUNDING_TOOL_NAMES = [
  'search_places',
  'compute_routes',
  'lookup_weather',
] as const;

export type GroundingToolName = (typeof GROUNDING_TOOL_NAMES)[number];

export const NAMESPACED_GROUNDING_TOOL_NAMES = GROUNDING_TOOL_NAMES.map(
  (n) => `${GROUNDING_MCP_SERVER_ID}_${n}`,
) as readonly string[];

export function isAllowedGroundingTool(name: string): boolean {
  return NAMESPACED_GROUNDING_TOOL_NAMES.includes(name);
}

/** Filter a `listTools()` result down to the explicit whitelist. */
export function filterGroundingTools<T extends Record<string, unknown>>(
  tools: T,
): Pick<T, Extract<keyof T, string>> {
  const out: Record<string, unknown> = {};
  for (const [name, tool] of Object.entries(tools)) {
    if (isAllowedGroundingTool(name)) out[name] = tool;
  }
  return out as Pick<T, Extract<keyof T, string>>;
}

/** Production caps — used by clients and by quota logging hooks. */
export const GROUNDING_LIMITS = {
  MCP_TIMEOUT_MS: 30_000,
  MCP_MAX_RETRIES: 1,
  CIRCUIT_BREAKER_THRESHOLD: 3,
  CIRCUIT_BREAKER_WINDOW_MS: 5 * 60_000,
  CIRCUIT_BREAKER_COOLDOWN_MS: 60_000,
  SEARCH_PAGE_SIZE_MAX: 5,
  DAILY_CALL_CAP: 200,
} as const;
