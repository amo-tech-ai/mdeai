import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { callGeminiStructured, geminiClient, withRetry } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  query: string;
  domain?: "all" | "apartments" | "cars" | "restaurants" | "events";
  filters?: {
    neighborhood?: string;
    priceMin?: number;
    priceMax?: number;
    dateFrom?: string;
    dateTo?: string;
  };
  limit?: number;
}

interface SearchResult {
  id: string;
  type: "apartment" | "car" | "restaurant" | "event";
  title: string;
  description: string | null;
  price: number | null;
  rating: number | null;
  imageUrl: string | null;
  location: string | null;
  relevanceScore: number;
  metadata: Record<string, unknown>;
}

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

// JSON schema for structured search-param extraction (G1).
const searchParamsSchema = {
  type: "object",
  properties: {
    keywords: { type: "array", items: { type: "string" } },
    domain: {
      type: ["string", "null"],
      enum: ["apartments", "cars", "restaurants", "events", null],
    },
    neighborhood: { type: ["string", "null"] },
    priceRange: {
      type: "object",
      properties: {
        min: { type: ["number", "null"] },
        max: { type: ["number", "null"] },
      },
    },
    cuisineType: { type: ["string", "null"] },
    eventType: { type: ["string", "null"] },
    vehicleType: { type: ["string", "null"] },
  },
  required: ["keywords"],
  additionalProperties: false,
};

interface ExtractedSearchParams {
  keywords: string[];
  domain: string | null;
  neighborhood: string | null;
  priceRange: { min: number | null; max: number | null };
  cuisineType: string | null;
  eventType: string | null;
  vehicleType: string | null;
}

// Default fallback when Gemini is unavailable or errors out.
function fallbackSearchParams(query: string): ExtractedSearchParams {
  return {
    keywords: query.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
    domain: null,
    neighborhood: null,
    priceRange: { min: null, max: null },
    cuisineType: null,
    eventType: null,
    vehicleType: null,
  };
}

// Extract search parameters using Gemini
async function extractSearchParams(query: string): Promise<ExtractedSearchParams> {
  if (!Deno.env.get("GEMINI_API_KEY")) {
    return fallbackSearchParams(query);
  }

  const systemInstruction =
    `You are a search query analyzer for a Medellín travel app. ` +
    `Extract structured search parameters from natural language queries.\n\n` +
    `Map vague price words to ranges (cheap=$0-50, mid=$50-150, luxury=$150+).\n` +
    `Common neighborhoods: El Poblado, Laureles, Envigado, Sabaneta, Belén.\n` +
    `Common cuisines: Colombian, Italian, Japanese, Mexican, Mediterranean, Seafood, Vegetarian.\n` +
    `Set fields to null when no signal — never guess.`;

  try {
    const result = await withRetry(() =>
      callGeminiStructured<ExtractedSearchParams>({
        model: "gemini-3-flash-preview",
        prompt: query,
        systemInstruction,
        responseJsonSchema: searchParamsSchema, // G1
        thinkingLevel: "low",
        agentName: "search_param_extractor",
        timeoutMs: 10_000,
      })
    );

    // Make sure keywords field is always populated even if model omitted it.
    return {
      ...fallbackSearchParams(query),
      ...result.data,
      keywords: result.data.keywords?.length
        ? result.data.keywords
        : fallbackSearchParams(query).keywords,
    };
  } catch (error) {
    console.error("AI extraction failed:", error);
    return fallbackSearchParams(query);
  }
}

// Search apartments
async function searchApartments(
  supabase: ReturnType<typeof getSupabaseClient>,
  keywords: string[],
  filters: SearchRequest["filters"],
  neighborhood: string | null,
  limit: number
): Promise<SearchResult[]> {
  let query = supabase
    .from("apartments")
    .select("id, title, description, neighborhood, price_monthly, rating, images, amenities")
    .eq("status", "active");

  if (neighborhood || filters?.neighborhood) {
    query = query.ilike("neighborhood", `%${neighborhood || filters?.neighborhood}%`);
  }
  if (filters?.priceMin) {
    query = query.gte("price_monthly", filters.priceMin);
  }
  if (filters?.priceMax) {
    query = query.lte("price_monthly", filters.priceMax);
  }

  const { data, error } = await query.order("rating", { ascending: false, nullsFirst: false }).limit(limit);
  
  if (error) {
    console.error("Apartment search error:", error);
    return [];
  }

  return (data || []).map((apt, idx) => ({
    id: apt.id,
    type: "apartment" as const,
    title: apt.title,
    description: apt.description,
    price: apt.price_monthly,
    rating: apt.rating,
    imageUrl: apt.images?.[0] || null,
    location: apt.neighborhood,
    relevanceScore: 1 - (idx * 0.1),
    metadata: { amenities: apt.amenities },
  }));
}

// Search restaurants
async function searchRestaurants(
  supabase: ReturnType<typeof getSupabaseClient>,
  keywords: string[],
  cuisineType: string | null,
  limit: number
): Promise<SearchResult[]> {
  let query = supabase
    .from("restaurants")
    .select("id, name, description, cuisine_types, price_level, rating, primary_image_url, city, address")
    .eq("is_active", true);

  if (cuisineType) {
    query = query.contains("cuisine_types", [cuisineType]);
  }

  const { data, error } = await query.order("rating", { ascending: false, nullsFirst: false }).limit(limit);
  
  if (error) {
    console.error("Restaurant search error:", error);
    return [];
  }

  return (data || []).map((rest, idx) => ({
    id: rest.id,
    type: "restaurant" as const,
    title: rest.name,
    description: rest.description,
    price: rest.price_level,
    rating: rest.rating,
    imageUrl: rest.primary_image_url,
    location: rest.address || rest.city,
    relevanceScore: 1 - (idx * 0.1),
    metadata: { cuisineTypes: rest.cuisine_types, priceLevel: rest.price_level },
  }));
}

// Search cars
async function searchCars(
  supabase: ReturnType<typeof getSupabaseClient>,
  vehicleType: string | null,
  filters: SearchRequest["filters"],
  limit: number
): Promise<SearchResult[]> {
  let query = supabase
    .from("car_rentals")
    .select("id, make, model, year, vehicle_type, price_daily, rating, images, features")
    .eq("status", "active");

  if (vehicleType) {
    query = query.ilike("vehicle_type", `%${vehicleType}%`);
  }
  if (filters?.priceMax) {
    query = query.lte("price_daily", filters.priceMax);
  }

  const { data, error } = await query.order("rating", { ascending: false, nullsFirst: false }).limit(limit);
  
  if (error) {
    console.error("Car search error:", error);
    return [];
  }

  return (data || []).map((car, idx) => ({
    id: car.id,
    type: "car" as const,
    title: `${car.year} ${car.make} ${car.model}`,
    description: `${car.vehicle_type} - ${car.features?.slice(0, 3).join(", ") || "Well equipped"}`,
    price: car.price_daily,
    rating: car.rating,
    imageUrl: car.images?.[0] || null,
    location: "Medellín pickup available",
    relevanceScore: 1 - (idx * 0.1),
    metadata: { vehicleType: car.vehicle_type, features: car.features },
  }));
}

// Search events
async function searchEvents(
  supabase: ReturnType<typeof getSupabaseClient>,
  eventType: string | null,
  filters: SearchRequest["filters"],
  limit: number
): Promise<SearchResult[]> {
  const now = new Date().toISOString();
  
  let query = supabase
    .from("events")
    .select("id, name, description, event_type, event_start_time, ticket_price_min, rating, primary_image_url, address")
    .eq("is_active", true)
    .gte("event_start_time", now);

  if (eventType) {
    query = query.ilike("event_type", `%${eventType}%`);
  }
  if (filters?.dateFrom) {
    query = query.gte("event_start_time", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("event_start_time", filters.dateTo);
  }

  const { data, error } = await query.order("event_start_time", { ascending: true }).limit(limit);
  
  if (error) {
    console.error("Event search error:", error);
    return [];
  }

  return (data || []).map((evt, idx) => ({
    id: evt.id,
    type: "event" as const,
    title: evt.name,
    description: evt.description,
    price: evt.ticket_price_min,
    rating: evt.rating,
    imageUrl: evt.primary_image_url,
    location: evt.address,
    relevanceScore: 1 - (idx * 0.1),
    metadata: { eventType: evt.event_type, startTime: evt.event_start_time },
  }));
}

// Generate AI summary of results using a free-text (non-structured) call.
// Summary doesn't need a JSON schema — it's a 1-2 sentence string.
async function generateSummary(query: string, results: SearchResult[]): Promise<string> {
  if (!Deno.env.get("GEMINI_API_KEY") || results.length === 0) {
    return results.length === 0
      ? "No results found for your search. Try broadening your criteria."
      : `Found ${results.length} results matching your search.`;
  }

  try {
    const resultSummary = results.slice(0, 5).map((r) =>
      `- ${r.title} (${r.type}): ${r.price ? `$${r.price}` : "Price varies"}, Rating: ${r.rating ?? "N/A"}`
    ).join("\n");

    const prompt = `User searched for: "${query}"\n\nTop results:\n${resultSummary}\n\nProvide a brief summary.`;

    const response = await Promise.race([
      geminiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction:
            "You are a helpful travel assistant. Provide a brief, friendly 1-2 sentence summary of search results for Medellín, Colombia. Be concise and highlight the best options.",
          thinkingConfig: { thinkingLevel: "low" },
          // No temperature — G2.
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), 10_000)
      ),
    ]);

    const text = (response as { text?: string }).text;
    return text?.trim() || `Found ${results.length} great options!`;
  } catch (error) {
    console.error("Summary generation failed:", error);
  }

  return `Found ${results.length} results matching your search.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = getSupabaseClient(authHeader);
    
    const body: SearchRequest = await req.json();
    const { query, domain = "all", filters = {}, limit = 10 } = body;

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract search parameters using AI
    const params = await extractSearchParams(query);
    const effectiveDomain = domain !== "all" ? domain : params.domain;
    const resultsPerDomain = Math.ceil(limit / (effectiveDomain ? 1 : 4));

    const results: SearchResult[] = [];

    // Search relevant domains
    const searchPromises: Promise<SearchResult[]>[] = [];

    if (!effectiveDomain || effectiveDomain === "apartments") {
      searchPromises.push(searchApartments(supabase, params.keywords, filters, params.neighborhood, resultsPerDomain));
    }
    if (!effectiveDomain || effectiveDomain === "restaurants") {
      searchPromises.push(searchRestaurants(supabase, params.keywords, params.cuisineType, resultsPerDomain));
    }
    if (!effectiveDomain || effectiveDomain === "cars") {
      searchPromises.push(searchCars(supabase, params.vehicleType, filters, resultsPerDomain));
    }
    if (!effectiveDomain || effectiveDomain === "events") {
      searchPromises.push(searchEvents(supabase, params.eventType, filters, resultsPerDomain));
    }

    const searchResults = await Promise.all(searchPromises);
    searchResults.forEach(r => results.push(...r));

    // Sort by relevance and limit
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const finalResults = results.slice(0, limit);

    // Generate AI summary
    const summary = await generateSummary(query, finalResults);

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        query,
        summary,
        results: finalResults,
        meta: {
          total: finalResults.length,
          domains: [...new Set(finalResults.map(r => r.type))],
          durationMs,
          extractedParams: params,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Search error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Search failed" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
