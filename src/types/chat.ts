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

export interface OpenRentalsResultsAction {
  type: 'OPEN_RENTALS_RESULTS';
  payload: {
    filters: Record<string, unknown>;
    /** Listing IDs — legacy field, retained for the "See all on map →" button. */
    listing_ids?: string[];
    /** Full listing data for inline card rendering. Added Day 2. */
    listings?: RentalInlineListing[];
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

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  agent_type: string;
  status: 'active' | 'archived';
  session_data?: Record<string, unknown>;
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
