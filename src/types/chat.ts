// Chat tab types
export type ChatTab = 'concierge' | 'trips' | 'explore' | 'bookings';

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

// ─── Persistent context chips ─────────────────────────────────────────────
// Neighborhood, dates, travelers, budget — rendered as chips above the
// message list; values flow into every tool call via the ai-chat request.

export interface ChatContextDates {
  start?: string | null;
  end?: string | null;
}

export interface ChatContextBudget {
  min?: number | null;
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

// ─── Structured actions emitted by edge functions via SSE sidecar ────────────
// The ai-chat function emits `data: {"__mdeai_actions__": [...]}` before
// streaming the text response when a tool result contains structured actions.

export interface ChatAction {
  type: string;
  payload: Record<string, unknown>;
}

// ─── Inline listing card shape ───────────────────────────────────────────────
// Emitted inside OPEN_RENTALS_RESULTS action payload.listings[].
// Matches the SELECT fields returned by the `rentals` edge function.

export interface RentalInlineListing {
  id: string;
  title: string;
  price_monthly: number | null;
  price_daily?: number | null;
  neighborhood: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images: string[];
  rating: number | null;
  source_url: string | null;
  latitude: number | null;
  longitude: number | null;
  description?: string | null;
  verified?: boolean;
}

export function hasChatContext(ctx: ChatContext | null | undefined): boolean {
  if (!ctx) return false;
  if (ctx.neighborhood && ctx.neighborhood.trim().length > 0) return true;
  if (ctx.travelers != null) return true;
  if (ctx.dates && (ctx.dates.start || ctx.dates.end)) return true;
  if (ctx.budget && (ctx.budget.min != null || ctx.budget.max != null)) return true;
  return false;
}
