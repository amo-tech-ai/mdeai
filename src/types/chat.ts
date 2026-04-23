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

export type ChatAction = OpenRentalsResultsAction;

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

export interface Conversation {
  id: string;
  user_id: string;
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
