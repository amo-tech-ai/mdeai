import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { callGeminiStructured, withRetry } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Intent categories with their target agents
const INTENT_CATEGORIES = {
  // Housing & Accommodation
  housing_search: { agent: 'explore', description: 'Looking for apartments, stays, or accommodation' },
  housing_details: { agent: 'concierge', description: 'Questions about specific apartments or neighborhoods' },

  // Transportation
  car_rental: { agent: 'explore', description: 'Looking for car rentals or transportation' },
  car_booking: { agent: 'bookings', description: 'Booking or managing car reservations' },

  // Food & Dining
  restaurant_discovery: { agent: 'explore', description: 'Looking for restaurants or food recommendations' },
  restaurant_booking: { agent: 'bookings', description: 'Making or managing restaurant reservations' },

  // Events & Activities
  event_discovery: { agent: 'explore', description: 'Looking for events, concerts, or activities' },
  event_tickets: { agent: 'bookings', description: 'Purchasing or managing event tickets' },

  // Trip Planning
  trip_planning: { agent: 'trips', description: 'Planning a trip, creating itineraries' },
  trip_modification: { agent: 'trips', description: 'Modifying existing trips or schedules' },
  trip_question: { agent: 'trips', description: 'Questions about trip logistics or schedules' },

  // Booking Management
  booking_status: { agent: 'bookings', description: 'Checking booking status or confirmations' },
  booking_modification: { agent: 'bookings', description: 'Changing or cancelling bookings' },
  booking_help: { agent: 'bookings', description: 'Help with booking issues or questions' },

  // Local Knowledge
  local_knowledge: { agent: 'concierge', description: 'General questions about Medellín' },
  safety_tips: { agent: 'concierge', description: 'Safety or practical advice' },
  cultural_info: { agent: 'concierge', description: 'Colombian culture, customs, etiquette' },

  // General
  general_greeting: { agent: 'concierge', description: 'Greetings or casual conversation' },
  general_question: { agent: 'concierge', description: 'General questions not fitting other categories' },
} as const;

type IntentCategory = keyof typeof INTENT_CATEGORIES;

interface RouterInput {
  message: string;
  currentTab?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userContext?: {
    hasActiveTrip?: boolean;
    hasPendingBookings?: boolean;
    currentPage?: string;
  };
}

interface RouterOutput {
  intent: IntentCategory;
  targetAgent: string;
  confidence: number;
  entities: Record<string, unknown>;
  suggestedResponse?: string;
  requiresAuth?: boolean;
  reasoning?: string;
}

// Keywords for quick intent matching (before AI call)
const QUICK_INTENT_PATTERNS: Array<{ patterns: RegExp[]; intent: IntentCategory; confidence: number }> = [
  // Greetings
  { patterns: [/^(hi|hello|hey|hola|good morning|good afternoon|good evening)[\s!.,]*$/i], intent: 'general_greeting', confidence: 0.95 },

  // Housing
  { patterns: [/\b(apartment|apartamento|stay|housing|accommodation|rent|airbnb)\b/i], intent: 'housing_search', confidence: 0.85 },

  // Cars
  { patterns: [/\b(car|vehicle|rental car|rent a car|drive|carro)\b/i], intent: 'car_rental', confidence: 0.85 },

  // Restaurants
  { patterns: [/\b(restaurant|food|eat|dining|dinner|lunch|breakfast|cuisine|restaurante|comida)\b/i], intent: 'restaurant_discovery', confidence: 0.85 },
  { patterns: [/\b(reserv|book.*table|table for)\b/i], intent: 'restaurant_booking', confidence: 0.90 },

  // Events
  { patterns: [/\b(event|concert|festival|show|party|nightlife|evento)\b/i], intent: 'event_discovery', confidence: 0.85 },
  { patterns: [/\b(ticket|entrada|buy.*ticket|get.*ticket)\b/i], intent: 'event_tickets', confidence: 0.90 },

  // Trips
  { patterns: [/\b(trip|itinerary|plan|schedule|day.*plan|viaje)\b/i], intent: 'trip_planning', confidence: 0.85 },
  { patterns: [/\b(my trip|my itinerary|update.*trip|change.*trip)\b/i], intent: 'trip_modification', confidence: 0.88 },

  // Bookings
  { patterns: [/\b(my booking|my reservation|confirmation|booking status)\b/i], intent: 'booking_status', confidence: 0.90 },
  { patterns: [/\b(cancel|modify|change.*booking|change.*reservation)\b/i], intent: 'booking_modification', confidence: 0.90 },

  // Local knowledge
  { patterns: [/\b(safe|safety|dangerous|crime|security)\b/i], intent: 'safety_tips', confidence: 0.88 },
  { patterns: [/\b(culture|custom|tradition|etiquette|colombian)\b/i], intent: 'cultural_info', confidence: 0.85 },
  { patterns: [/\b(neighborhood|barrio|poblado|laureles|envigado|metro|transport)\b/i], intent: 'local_knowledge', confidence: 0.82 },
];

// Entity extraction patterns
const ENTITY_PATTERNS = {
  neighborhood: /\b(el poblado|poblado|laureles|envigado|belen|bello|sabaneta|itagui|la floresta|manila|boston|provenza)\b/i,
  cuisine: /\b(colombian|italian|japanese|mexican|peruvian|seafood|steakhouse|vegetarian|vegan|sushi|pizza)\b/i,
  priceLevel: /\b(cheap|budget|affordable|mid-range|expensive|luxury|upscale|\$+)\b/i,
  date: /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|today|tomorrow|next week|this weekend)\b/i,
  partySize: /\b(\d+)\s*(people|persons|guests|pax)\b/i,
  vehicleType: /\b(sedan|suv|luxury|economy|compact|van|motorcycle)\b/i,
  bedrooms: /\b(\d+)\s*(bed|bedroom|br|habitacion)\b/i,
};

function extractEntities(message: string): Record<string, unknown> {
  const entities: Record<string, unknown> = {};

  for (const [key, pattern] of Object.entries(ENTITY_PATTERNS)) {
    const match = message.match(pattern);
    if (match) {
      entities[key] = match[1] || match[0];
    }
  }

  return entities;
}

function quickIntentMatch(message: string): { intent: IntentCategory; confidence: number } | null {
  const normalizedMessage = message.toLowerCase().trim();

  for (const { patterns, intent, confidence } of QUICK_INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedMessage)) {
        return { intent, confidence };
      }
    }
  }

  return null;
}

// JSON schema for the structured intent classification response (G1).
// Hand-rolled to avoid pulling zod into the router (it's the cheapest fn —
// keep it tight on cold-start time).
const intentSchema = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: Object.keys(INTENT_CATEGORIES),
      description: "The category key from the available intents",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Classification confidence 0.0-1.0",
    },
    entities: {
      type: "object",
      description: "Extracted entities from the message",
      additionalProperties: true,
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of the classification",
    },
  },
  required: ["intent", "confidence"],
  additionalProperties: false,
};

interface IntentSchemaShape {
  intent: IntentCategory;
  confidence?: number;
  entities?: Record<string, unknown>;
  reasoning?: string;
}

// AI-based intent classification for complex queries
async function classifyWithAI(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  userContext?: RouterInput['userContext']
): Promise<RouterOutput> {
  const intentList = Object.entries(INTENT_CATEGORIES)
    .map(([key, value]) => `- ${key}: ${value.description}`)
    .join('\n');

  const contextInfo = userContext
    ? `\nUser Context:\n- Has active trip: ${userContext.hasActiveTrip ? 'Yes' : 'No'}\n- Has pending bookings: ${userContext.hasPendingBookings ? 'Yes' : 'No'}\n- Current page: ${userContext.currentPage || 'Unknown'}`
    : '';

  const systemInstruction = `You are an intent classification system for "I Love Medellín", a travel and lifestyle app for Medellín, Colombia.

Your task is to analyze user messages and classify their intent into one of these categories:
${intentList}
${contextInfo}

Be precise. If the user wants to FIND something, use discovery intents. If they want to BOOK/RESERVE, use booking intents. If asking general questions about the city, use concierge intents.`;

  // Compose the prompt: include recent history + the message to classify.
  // Flash-Lite (cheapest tier) handles this fine without multi-turn structuring.
  const recentHistory = conversationHistory
    .slice(-4)
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");
  const prompt = recentHistory
    ? `Recent conversation:\n${recentHistory}\n\nClassify this latest user message: "${message}"`
    : `Classify this message: "${message}"`;

  try {
    const result = await withRetry(() =>
      callGeminiStructured<IntentSchemaShape>({
        model: "gemini-3.1-flash-lite-preview",
        prompt,
        systemInstruction,
        responseJsonSchema: intentSchema, // G1
        thinkingLevel: "minimal", // sub-second routing
        agentName: "intent_router",
        timeoutMs: 10_000,
      })
    );

    const intent = result.data.intent;
    const agentInfo = INTENT_CATEGORIES[intent] ?? INTENT_CATEGORIES.general_question;

    return {
      intent,
      targetAgent: agentInfo.agent,
      confidence: result.data.confidence ?? 0.75,
      entities: { ...extractEntities(message), ...(result.data.entities ?? {}) },
      reasoning: result.data.reasoning,
      requiresAuth: [
        'booking_status',
        'booking_modification',
        'trip_modification',
        'trip_question',
      ].includes(intent),
    };
  } catch (error) {
    console.error("AI classification error:", error);
    // Fallback to general_question
    return {
      intent: 'general_question',
      targetAgent: 'concierge',
      confidence: 0.5,
      entities: extractEntities(message),
      reasoning: 'Fallback due to AI classification error',
    };
  }
}

// Initialize Supabase client for logging
function getSupabaseClient(authHeader: string | null) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

async function getUserIdFromAuth(authHeader: string | null, supabase: ReturnType<typeof getSupabaseClient>): Promise<string | null> {
  if (!authHeader) return null;

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    return user?.id || null;
  } catch {
    return null;
  }
}

// Log AI run to database
async function logAIRun(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string | null,
  input: RouterInput,
  output: RouterOutput,
  durationMs: number
) {
  if (!userId) return; // Only log for authenticated users

  try {
    await supabase.from("ai_runs").insert({
      user_id: userId,
      agent_name: "intent_router",
      agent_type: "router",
      input_data: input,
      output_data: output,
      duration_ms: durationMs,
      status: "completed",
      model_name: output.confidence > 0.8 ? "pattern_match" : "gemini-3.1-flash-lite-preview",
    });
  } catch (error) {
    console.error("Failed to log AI run:", error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = getSupabaseClient(authHeader);
    const userId = await getUserIdFromAuth(authHeader, supabase);

    const body: RouterInput = await req.json();
    const { message, currentTab, conversationHistory, userContext } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try quick pattern matching first
    const quickMatch = quickIntentMatch(message);
    let result: RouterOutput;

    if (quickMatch && quickMatch.confidence >= 0.85) {
      // Use quick match for high-confidence patterns
      const agentInfo = INTENT_CATEGORIES[quickMatch.intent];
      result = {
        intent: quickMatch.intent,
        targetAgent: agentInfo.agent,
        confidence: quickMatch.confidence,
        entities: extractEntities(message),
        reasoning: 'Pattern-matched with high confidence',
      };
    } else {
      // Use AI for complex queries
      result = await classifyWithAI(message, conversationHistory, userContext);
    }

    // Apply context-aware adjustments
    if (currentTab) {
      // Boost confidence if current tab matches target agent
      if (currentTab === result.targetAgent) {
        result.confidence = Math.min(1.0, result.confidence + 0.1);
      }

      // If user is on a specific tab and confidence is low, consider keeping them there
      if (result.confidence < 0.7 && currentTab !== 'concierge') {
        result.suggestedResponse = `I can help with that! Would you like me to handle this in the ${result.targetAgent} section, or continue here?`;
      }
    }

    // Mark if auth is required for this intent
    result.requiresAuth = ['booking_status', 'booking_modification', 'trip_modification', 'trip_question', 'booking_help'].includes(result.intent);

    const durationMs = Date.now() - startTime;

    // Log the AI run
    await logAIRun(supabase, userId, body, result, durationMs);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        meta: {
          durationMs,
          method: quickMatch && quickMatch.confidence >= 0.85 ? 'pattern' : 'ai',
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Router error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          intent: 'general_question',
          targetAgent: 'concierge',
          confidence: 0.5,
          entities: {},
          reasoning: 'Fallback due to error',
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
