// Chat tab types
export type ChatTab = 'concierge' | 'trips' | 'explore' | 'bookings';

// ─── Structured chat actions ─────────────────────────────────────────────
// Tools in supabase/functions/ai-chat/index.ts emit an `actions[]` array in
// their response envelope. The edge function prepends these as an SSE
// sidecar event (`{ mdeai_actions: [...] }`) before Gemini's text stream.
// The chat UI consumes them to render affordances like "See all N results →"
// that navigate the user to a full results page.

/**
 * Minimal rental data surfaced inline in chat cards.
 * The full `Apartment` type (src/types/listings.ts) is used on detail pages;
 * chat-inline uses this narrower shape to keep SSE payloads small.
 */
export interface RentalInlineListing {
  id: string;
  title: string;
  neighborhood: string;
  price_monthly?: number | null;
  price_daily?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  rating?: number | null;
  amenities?: string[] | null;
  images?: string[] | null;
  verified?: boolean | null;
  source_url?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * "Not a Good Fit" row — powers the rejection-transparency table.
 * Surfaces WHY an AI considered-then-skipped a particular listing so the
 * user can trust the shortlist and override if their weights differ.
 */
export interface ConsideredButRejected {
  listing_summary: string;
  reason: string;
}

export interface OpenRentalsResultsAction {
  type: 'OPEN_RENTALS_RESULTS';
  payload: {
    filters: Record<string, unknown>;
    /** Listing IDs — legacy field, retained for the "See all on map →" button. */
    listing_ids?: string[];
    /** Full listing data for inline card rendering. Added Day 2. */
    listings?: RentalInlineListing[];
    /** Rejection-transparency rows for the "Not a Good Fit" table. Day 4. */
    considered_but_rejected?: ConsideredButRejected[];
    /** How many matches the tool considered (for "12 of 72" narration). Day 4. */
    considered?: number;
  };
}

// ─── Event draft action ──────────────────────────────────────────────────

export interface EventDraftTier {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  qty_total: number;
}

export interface EventDraftPayload {
  event_id: string;
  name: string;
  start_at: string | null;
  end_at: string | null;
  address: string | null;
  description: string | null;
  currency: string;
  tiers: EventDraftTier[];
  deep_link: string;
}

export interface ShowEventDraftAction {
  type: 'SHOW_EVENT_DRAFT';
  payload: EventDraftPayload;
}

export type ChatAction = OpenRentalsResultsAction | ShowEventDraftAction;

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent_name?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ─── Session context chips ───────────────────────────────────────────────
// Persistent filters that travel with the conversation (neighborhood, dates,
// travelers, budget). Rendered as chips above the message list; edited
// values flow into the next tool call via the `sessionData` field on the
// ai-chat request. Authenticated users get these mirrored to
// `public.conversations.session_data` jsonb on every change. Anon users
// keep them in memory only until they sign in.

export interface ChatContextDates {
  /** ISO 8601 date (YYYY-MM-DD). Null = not set. */
  start?: string | null;
  /** ISO 8601 date (YYYY-MM-DD). Null = not set. */
  end?: string | null;
}

export interface ChatContextBudget {
  /** Monthly USD floor. Null = not set. */
  min?: number | null;
  /** Monthly USD ceiling. Null = not set. */
  max?: number | null;
}

export interface ChatContext {
  neighborhood?: string | null;
  dates?: ChatContextDates | null;
  travelers?: number | null;
  budget?: ChatContextBudget | null;
}

export const EMPTY_CHAT_CONTEXT: ChatContext = {
  neighborhood: null,
  dates: null,
  travelers: null,
  budget: null,
};

/**
 * True when any chip has a user-supplied value. Used to decide whether to
 * persist to session_data and to include in the ai-chat request payload.
 */
export function hasChatContext(ctx: ChatContext | null | undefined): boolean {
  if (!ctx) return false;
  if (ctx.neighborhood && ctx.neighborhood.trim().length > 0) return true;
  if (ctx.travelers != null) return true;
  if (ctx.dates && (ctx.dates.start || ctx.dates.end)) return true;
  if (ctx.budget && (ctx.budget.min != null || ctx.budget.max != null)) return true;
  return false;
}

/**
 * Conversation owner. Authenticated users carry a UUID; anonymous chat
 * sessions carry the literal `'anon'` sentinel (in-memory only, never
 * written to DB — the anon path skips Postgres writes entirely).
 *
 * The `string & {}` trick preserves the `'anon'` literal in IntelliSense
 * autocomplete while still accepting any UUID string. Without it, TS
 * widens the union to plain `string` and the literal hint is lost.
 *
 * Always check `user_id === 'anon'` before:
 *   - inserting a row that FKs to `auth.users` (Postgres won't accept it)
 *   - subscribing to realtime channels (the broker errors on non-UUID
 *     conversation owners — `useRealtimeChannel` already gates on
 *     `conversation.user_id === user.id`, but new code should do the
 *     same)
 *   - calling RLS-protected RPCs that auto-fill from `auth.uid()`
 *
 * Past bug class this prevents:
 *   "anon-${sid}" was once stored on `messages.conversation_id` (uuid
 *   type) — which threw at runtime. The 'anon' marker now lives ONLY
 *   on `user_id`, and this type makes that contract explicit.
 */
export type ConversationUserId = (string & {}) | 'anon';

export interface Conversation {
  id: string;
  user_id: ConversationUserId;
  title: string;
  agent_type: string;
  status: 'active' | 'archived';
  /** Persistent context chips — hydrated into ChatContext on load. */
  session_data?: { chat_context?: ChatContext } & Record<string, unknown>;
  last_message_at?: string;
  message_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ChatState {
  activeTab: ChatTab;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
}

// Map chat tabs to agent types
export const tabToAgentType: Record<ChatTab, string> = {
  concierge: 'general_concierge',
  trips: 'itinerary_optimizer',
  explore: 'local_scout',
  bookings: 'booking_assistant',
};

export const agentTypeToTab: Record<string, ChatTab> = {
  general_concierge: 'concierge',
  itinerary_optimizer: 'trips',
  local_scout: 'explore',
  booking_assistant: 'bookings',
};
