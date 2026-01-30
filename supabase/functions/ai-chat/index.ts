import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for AI function calling
const tools = [
  // Rentals tools - integrated with rentals Edge Function
  {
    type: "function",
    function: {
      name: "rentals_search",
      description: "Search for apartment rentals in Medellín. Use this when users want to find an apartment, rental, or housing. Returns listings with freshness verification, map pins, and available filters.",
      parameters: {
        type: "object",
        properties: {
          neighborhoods: {
            type: "array",
            items: { type: "string" },
            description: "Neighborhood names (e.g., ['El Poblado', 'Laureles', 'Envigado'])"
          },
          bedrooms_min: {
            type: "integer",
            description: "Minimum number of bedrooms (0 for studio)"
          },
          budget_min: {
            type: "number",
            description: "Minimum monthly price in USD"
          },
          budget_max: {
            type: "number",
            description: "Maximum monthly price in USD"
          },
          furnished: {
            type: "boolean",
            description: "Whether apartment should be furnished"
          },
          amenities: {
            type: "array",
            items: { type: "string" },
            description: "Required amenities (e.g., ['wifi', 'parking', 'gym', 'pool', 'ac'])"
          },
          pets: {
            type: "boolean",
            description: "Whether pets are allowed"
          },
          verified_only: {
            type: "boolean",
            description: "Only show verified/active listings"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "rentals_intake",
      description: "Collect rental search criteria through conversation. Use this when user mentions wanting an apartment but hasn't provided enough details. Returns either next questions to ask or a complete filter_json when ready to search.",
      parameters: {
        type: "object",
        properties: {
          user_message: {
            type: "string",
            description: "The user's latest message about their rental needs"
          },
          collected_criteria: {
            type: "object",
            description: "Criteria collected so far from previous messages"
          }
        },
        required: ["user_message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_restaurants",
      parameters: {
        type: "object",
        properties: {
          cuisine: {
            type: "string",
            description: "Type of cuisine (e.g., 'Colombian', 'Italian', 'Seafood', 'Mexican')"
          },
          price_level: {
            type: "integer",
            description: "Price level from 1 (cheap) to 4 (expensive)"
          },
          city: {
            type: "string",
            description: "City to search in (default: Medellín)"
          },
          limit: {
            type: "integer",
            description: "Maximum number of results to return (default: 5)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_apartments",
      description: "Search for apartment rentals in Medellín by neighborhood, price range, or amenities.",
      parameters: {
        type: "object",
        properties: {
          neighborhood: {
            type: "string",
            description: "Neighborhood name (e.g., 'El Poblado', 'Laureles', 'Envigado')"
          },
          min_price: {
            type: "number",
            description: "Minimum monthly price in USD"
          },
          max_price: {
            type: "number",
            description: "Maximum monthly price in USD"
          },
          bedrooms: {
            type: "integer",
            description: "Number of bedrooms"
          },
          amenities: {
            type: "array",
            items: { type: "string" },
            description: "Required amenities (e.g., ['WiFi', 'Pool', 'Gym'])"
          },
          limit: {
            type: "integer",
            description: "Maximum number of results to return (default: 5)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_cars",
      description: "Search for car rentals in Medellín by vehicle type, price, or features.",
      parameters: {
        type: "object",
        properties: {
          vehicle_type: {
            type: "string",
            description: "Type of vehicle (e.g., 'sedan', 'SUV', 'luxury', 'economy')"
          },
          max_price_daily: {
            type: "number",
            description: "Maximum daily rental price in USD"
          },
          transmission: {
            type: "string",
            enum: ["automatic", "manual"],
            description: "Transmission type"
          },
          limit: {
            type: "integer",
            description: "Maximum number of results to return (default: 5)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_events",
      description: "Search for upcoming events in Medellín by type, date range, or keywords.",
      parameters: {
        type: "object",
        properties: {
          event_type: {
            type: "string",
            description: "Type of event (e.g., 'concert', 'festival', 'cultural', 'nightlife')"
          },
          date_from: {
            type: "string",
            description: "Start date in ISO format (YYYY-MM-DD)"
          },
          date_to: {
            type: "string",
            description: "End date in ISO format (YYYY-MM-DD)"
          },
          free_only: {
            type: "boolean",
            description: "Only show free events"
          },
          limit: {
            type: "integer",
            description: "Maximum number of results to return (default: 5)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_user_trips",
      description: "Get the user's saved trips and itineraries.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["planning", "active", "completed"],
            description: "Filter by trip status"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_user_bookings",
      description: "Get the user's current and upcoming bookings.",
      parameters: {
        type: "object",
        properties: {
          booking_type: {
            type: "string",
            enum: ["apartment", "car", "restaurant", "event"],
            description: "Filter by booking type"
          },
          status: {
            type: "string",
            enum: ["pending", "confirmed", "cancelled"],
            description: "Filter by booking status"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_booking_preview",
      description: "Create a preview of a booking that the user can review before confirming. Returns booking details for user approval.",
      parameters: {
        type: "object",
        properties: {
          booking_type: {
            type: "string",
            enum: ["apartment", "car", "restaurant", "event"],
            description: "Type of booking"
          },
          resource_id: {
            type: "string",
            description: "ID of the resource to book (apartment, car, restaurant, or event)"
          },
          resource_title: {
            type: "string",
            description: "Name/title of the resource being booked"
          },
          start_date: {
            type: "string",
            description: "Start date in ISO format (YYYY-MM-DD)"
          },
          end_date: {
            type: "string",
            description: "End date in ISO format (YYYY-MM-DD), optional for single-day bookings"
          },
          party_size: {
            type: "integer",
            description: "Number of people (for restaurants/events)"
          },
          special_requests: {
            type: "string",
            description: "Any special requests or notes"
          }
        },
        required: ["booking_type", "resource_id", "resource_title", "start_date"]
      }
    }
  }
];

// System prompts for each tab/agent type - enhanced with tool awareness
const getSystemPrompt = (tab: string, tripContext?: { id: string; title: string; start_date: string; end_date: string; destination?: string } | null): string => {
  const tripInfo = tripContext 
    ? `\n\n🎯 ACTIVE TRIP CONTEXT:
The user is currently planning/viewing: "${tripContext.title}"
Dates: ${tripContext.start_date} to ${tripContext.end_date}
${tripContext.destination ? `Destination: ${tripContext.destination}` : 'Destination: Medellín, Colombia'}

When making recommendations, consider these trip dates and tailor suggestions accordingly.
When adding items to trips, use this trip ID: ${tripContext.id}`
    : '';

  const basePrompts: Record<string, string> = {
    concierge: `You are the I Love Medellín AI Concierge - a friendly, knowledgeable local guide for Medellín, Colombia.

You have access to tools to search the database for real-time information about:
- Restaurants (use search_restaurants)
- Apartments (use search_apartments)
- Car rentals (use search_cars)
- Events (use search_events)

When users ask for recommendations, USE THE TOOLS to search the database and provide real results.
Format results nicely with names, prices, ratings, and key details.

Your expertise covers:
- Neighborhoods and their characteristics (El Poblado, Laureles, Envigado, etc.)
- Safety tips and practical advice for visitors
- Colombian culture, customs, and etiquette
- Budget planning and cost of living
- Transportation options

Be warm, helpful, and conversational. Provide specific, actionable advice.${tripInfo}`,

    trips: `You are an expert Trip Planner for Medellín, Colombia. Help users create amazing itineraries.

You have access to tools:
- get_user_trips: View user's existing trips
- search_restaurants, search_apartments, search_cars, search_events: Find places to add to trips
- create_booking_preview: Prepare bookings for user approval

When creating itineraries:
- Search for real places using the tools
- Be specific with timing and locations
- Include meal recommendations from actual restaurants
- Consider travel time between locations
- Suggest alternatives for different weather conditions${tripInfo}`,

    explore: `You are a Discovery Agent for Medellín, Colombia. Help users find amazing places.

You MUST use the search tools to find real places:
- search_restaurants: Find restaurants by cuisine, price, location
- search_apartments: Find apartments by neighborhood, price, amenities
- search_cars: Find car rentals by type, price
- search_events: Find upcoming events

When recommending places:
- ALWAYS search the database first to get real listings
- Include the neighborhood
- Mention price range ($ to $$$$)
- Note ratings and reviews
- Suggest best times to visit${tripInfo}`,

    bookings: `You are a Booking Assistant for Medellín, Colombia. Help users manage reservations.

You have access to tools:
- get_user_bookings: View existing bookings
- search_restaurants, search_apartments, search_cars, search_events: Find bookable resources
- create_booking_preview: Create booking previews for user approval

IMPORTANT: When creating bookings:
1. First search for the resource to get its ID
2. Use create_booking_preview to show the user what will be booked
3. WAIT for user confirmation before any actual booking
4. Never create bookings without explicit user approval

When helping with bookings:
- Confirm dates, times, and party size
- Mention pricing when relevant
- Note any requirements (deposits, ID, etc.)
- Provide next steps clearly${tripInfo}`,
  };

  return basePrompts[tab] || basePrompts.concierge;
};

// Initialize Supabase client
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

// Type alias for Supabase client
type SupabaseClientType = ReturnType<typeof getSupabaseClient>;

// Extract user ID from JWT
async function getUserIdFromAuth(authHeader: string | null, supabase: SupabaseClientType): Promise<string | null> {
  if (!authHeader) return null;
  
  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    return user?.id || null;
  } catch {
    return null;
  }
}

// Tool execution functions
async function executeSearchRestaurants(params: Record<string, unknown>, supabase: SupabaseClientType) {
  let query = supabase
    .from("restaurants")
    .select("id, name, description, cuisine_types, price_level, rating, rating_count, address, city, phone, website, primary_image_url")
    .eq("is_active", true);

  if (params.cuisine) {
    query = query.contains("cuisine_types", [params.cuisine as string]);
  }
  if (params.price_level) {
    query = query.eq("price_level", params.price_level);
  }
  if (params.city) {
    query = query.ilike("city", `%${params.city}%`);
  }

  const limit = (params.limit as number) || 5;
  query = query.order("rating", { ascending: false, nullsFirst: false }).limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function executeSearchApartments(params: Record<string, unknown>, supabase: SupabaseClientType) {
  let query = supabase
    .from("apartments")
    .select("id, title, description, neighborhood, price_monthly, price_daily, bedrooms, bathrooms, amenities, rating, images")
    .eq("status", "active");

  if (params.neighborhood) {
    query = query.ilike("neighborhood", `%${params.neighborhood}%`);
  }
  if (params.min_price) {
    query = query.gte("price_monthly", params.min_price);
  }
  if (params.max_price) {
    query = query.lte("price_monthly", params.max_price);
  }
  if (params.bedrooms) {
    query = query.eq("bedrooms", params.bedrooms);
  }

  const limit = (params.limit as number) || 5;
  query = query.order("rating", { ascending: false, nullsFirst: false }).limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function executeSearchCars(params: Record<string, unknown>, supabase: SupabaseClientType) {
  let query = supabase
    .from("car_rentals")
    .select("id, make, model, year, vehicle_type, price_daily, transmission, features, rating, images")
    .eq("status", "active");

  if (params.vehicle_type) {
    query = query.ilike("vehicle_type", `%${params.vehicle_type}%`);
  }
  if (params.max_price_daily) {
    query = query.lte("price_daily", params.max_price_daily);
  }
  if (params.transmission) {
    query = query.eq("transmission", params.transmission);
  }

  const limit = (params.limit as number) || 5;
  query = query.order("rating", { ascending: false, nullsFirst: false }).limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function executeSearchEvents(params: Record<string, unknown>, supabase: SupabaseClientType) {
  let query = supabase
    .from("events")
    .select("id, name, description, event_type, event_start_time, event_end_time, ticket_price_min, ticket_price_max, address, city, rating, primary_image_url")
    .eq("is_active", true)
    .gte("event_start_time", new Date().toISOString());

  if (params.event_type) {
    query = query.ilike("event_type", `%${params.event_type}%`);
  }
  if (params.date_from) {
    query = query.gte("event_start_time", params.date_from);
  }
  if (params.date_to) {
    query = query.lte("event_start_time", params.date_to);
  }
  if (params.free_only) {
    query = query.or("ticket_price_min.is.null,ticket_price_min.eq.0");
  }

  const limit = (params.limit as number) || 5;
  query = query.order("event_start_time", { ascending: true }).limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function executeGetUserTrips(params: Record<string, unknown>, supabase: SupabaseClientType, userId: string | null) {
  if (!userId) {
    return { error: "User not authenticated. Please log in to view your trips." };
  }

  let query = supabase
    .from("trips")
    .select("id, name, description, start_date, end_date, status, destination")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (params.status) {
    query = query.eq("status", params.status);
  }

  query = query.order("start_date", { ascending: true }).limit(10);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function executeGetUserBookings(params: Record<string, unknown>, supabase: SupabaseClientType, userId: string | null) {
  if (!userId) {
    return { error: "User not authenticated. Please log in to view your bookings." };
  }

  let query = supabase
    .from("bookings")
    .select("id, booking_type, resource_title, start_date, end_date, status, total_price, party_size")
    .eq("user_id", userId);

  if (params.booking_type) {
    query = query.eq("booking_type", params.booking_type);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }

  query = query.order("start_date", { ascending: true }).limit(10);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function executeCreateBookingPreview(params: Record<string, unknown>, userId: string | null) {
  if (!userId) {
    return { 
      error: "User not authenticated. Please log in to create bookings.",
      requires_login: true 
    };
  }

  // Return a preview that the user can approve
  return {
    preview: true,
    message: "🎫 **Booking Preview** - Please review and confirm:",
    booking_details: {
      type: params.booking_type,
      resource_id: params.resource_id,
      resource_name: params.resource_title,
      start_date: params.start_date,
      end_date: params.end_date || params.start_date,
      party_size: params.party_size || 1,
      special_requests: params.special_requests || null,
    },
    action_required: "Reply 'confirm' to proceed with this booking, or 'cancel' to discard.",
    note: "This is a preview only. No booking has been made yet."
  };
}

// Execute rentals search by calling the rentals Edge Function
async function executeRentalsSearch(params: Record<string, unknown>) {
  console.log("Executing rentals_search with params:", params);
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/rentals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        action: "search",
        filter_json: params,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Rentals search error:", errorText);
      return { error: "Failed to search rentals", details: errorText };
    }
    
    const result = await response.json();
    
    // Format for chat display
    return {
      success: true,
      total_count: result.results?.total_count || 0,
      listings: result.results?.listings?.slice(0, 5) || [],
      filters_applied: params,
      actions: [
        { type: "OPEN_RENTALS_RESULTS", payload: { listings: result.results?.listings, map_pins: result.map_data?.pins } }
      ],
      message: result.results?.total_count > 0 
        ? `Found ${result.results.total_count} apartments matching your criteria.`
        : "No apartments found matching your criteria. Try adjusting your filters."
    };
  } catch (error) {
    console.error("Rentals search error:", error);
    return { error: "Failed to search rentals", details: String(error) };
  }
}

// Execute rentals intake for conversational criteria collection
async function executeRentalsIntake(params: Record<string, unknown>) {
  console.log("Executing rentals_intake with params:", params);
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/rentals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        action: "intake",
        user_message: params.user_message,
        context: {
          collected_criteria: params.collected_criteria || {},
          message_history: [],
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Rentals intake error:", errorText);
      return { error: "Failed to process rental inquiry", details: errorText };
    }
    
    const result = await response.json();
    
    // Return structured response for the chat
    return {
      status: result.status,
      filter_json: result.filter_json,
      next_questions: result.next_questions,
      ready_to_search: result.status === "complete",
      summary: result.summary,
    };
  } catch (error) {
    console.error("Rentals intake error:", error);
    return { error: "Failed to process rental inquiry", details: String(error) };
  }
}

// Execute a tool call
async function executeTool(
  toolName: string, 
  params: Record<string, unknown>, 
  supabase: SupabaseClientType,
  userId: string | null
): Promise<unknown> {
  console.log(`Executing tool: ${toolName}`, params);
  
  switch (toolName) {
    case "rentals_search":
      return executeRentalsSearch(params);
    case "rentals_intake":
      return executeRentalsIntake(params);
    case "search_restaurants":
      return executeSearchRestaurants(params, supabase);
    case "search_apartments":
      return executeSearchApartments(params, supabase);
    case "search_cars":
      return executeSearchCars(params, supabase);
    case "search_events":
      return executeSearchEvents(params, supabase);
    case "get_user_trips":
      return executeGetUserTrips(params, supabase, userId);
    case "get_user_bookings":
      return executeGetUserBookings(params, supabase, userId);
    case "create_booking_preview":
      return executeCreateBookingPreview(params, userId);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, tab = "concierge", conversationId, activeTripContext } = await req.json();
    const authHeader = req.headers.get("Authorization");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabase = getSupabaseClient(authHeader);
    const userId = await getUserIdFromAuth(authHeader, supabase);

    // Get the appropriate system prompt with trip context
    const systemPrompt = getSystemPrompt(tab, activeTripContext);

    // Prepare messages with system prompt
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    console.log(`AI Chat request - Tab: ${tab}, Messages: ${messages.length}, User: ${userId || 'anonymous'}`);

    // First call: Let AI decide if it needs to use tools
    const initialResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      console.error("AI gateway error:", initialResponse.status, errorText);

      if (initialResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (initialResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const initialData = await initialResponse.json();
    const assistantMessage = initialData.choices?.[0]?.message;

    // Check if AI wants to call tools
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`AI requested ${assistantMessage.tool_calls.length} tool call(s)`);
      
      // Execute all tool calls
      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall: { id: string; function: { name: string; arguments: string } }) => {
          const params = JSON.parse(toolCall.function.arguments || "{}");
          const result = await executeTool(toolCall.function.name, params, supabase, userId);
          return {
            tool_call_id: toolCall.id,
            role: "tool" as const,
            content: JSON.stringify(result),
          };
        })
      );

      // Second call: Let AI process tool results and generate final response
      const messagesWithTools = [
        ...aiMessages,
        assistantMessage,
        ...toolResults,
      ];

      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: messagesWithTools,
          stream: true,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!finalResponse.ok) {
        throw new Error("Failed to get final AI response after tool execution");
      }

      // Stream the final response back
      return new Response(finalResponse.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // No tool calls needed - stream a simple response
    // Re-request with streaming enabled
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!streamResponse.ok) {
      throw new Error("Failed to stream AI response");
    }

    // Stream the response back
    return new Response(streamResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
