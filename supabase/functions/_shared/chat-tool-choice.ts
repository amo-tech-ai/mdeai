/**
 * Deterministic tool forcing for ai-chat when Gemini "auto" skips search tools.
 * Rentals are checked before events — bare `show` must not steal rental prompts.
 */

const RENTAL_RE =
  /\b(apartment|apartments|rental|rentals|rent|renting|housing|flat|place to stay|accommodation|map pins?)\b/i;

/** Events — no bare `show` (matches "Show me 5 rentals…"). */
const EVENT_RE =
  /\b(event|events|concert|festival|nightlife|party|parties|things to do|what.*happen|gig|performance|tickets?)\b/i;

const RESTAURANT_RE =
  /\b(restaurant|food|eat|eating|dining|lunch|dinner|brunch|cafe|café|coffee|where.*eat)\b/i;

const ATTRACTION_RE =
  /\b(attraction|attractions|museum|tour|tours|park|sightseeing|cable car|things to see|tourist|activity|activities)\b/i;

export type ForcedToolName =
  | "search_apartments"
  | "search_events"
  | "search_restaurants"
  | "search_attractions";

/**
 * Returns a forced tool name when the user message clearly implies one domain.
 * Order: rentals → restaurants → attractions → events (rentals win over "show").
 */
export function resolveForcedToolName(lastUserContent: string): ForcedToolName | null {
  const text = lastUserContent.trim();
  if (!text) return null;

  if (RENTAL_RE.test(text)) return "search_apartments";
  if (RESTAURANT_RE.test(text)) return "search_restaurants";
  if (ATTRACTION_RE.test(text)) return "search_attractions";
  if (EVENT_RE.test(text)) return "search_events";

  return null;
}

export function buildToolChoice(
  lastUserContent: string,
): unknown {
  const forced = resolveForcedToolName(lastUserContent);
  if (forced) {
    return { type: "function", function: { name: forced } };
  }
  return "auto";
}
