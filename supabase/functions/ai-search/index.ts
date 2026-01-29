import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

// Extract search parameters using Gemini
async function extractSearchParams(query: string): Promise<{
  keywords: string[];
  domain: string | null;
  neighborhood: string | null;
  priceRange: { min: number | null; max: number | null };
  cuisineType: string | null;
  eventType: string | null;
  vehicleType: string | null;
}> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    // Fallback to simple extraction
    return {
      keywords: query.toLowerCase().split(/\s+/).filter(w => w.length > 2),
      domain: null,
      neighborhood: null,
      priceRange: { min: null, max: null },
      cuisineType: null,
      eventType: null,
      vehicleType: null,
    };
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a search query analyzer for a Medellín travel app. Extract structured search parameters from natural language queries.
            
Respond with JSON only:
{
  "keywords": ["array", "of", "important", "words"],
  "domain": "apartments|cars|restaurants|events|null",
  "neighborhood": "El Poblado|Laureles|Envigado|null",
  "priceRange": { "min": number|null, "max": number|null },
  "cuisineType": "Colombian|Italian|Japanese|etc|null",
  "eventType": "concert|festival|cultural|null",
  "vehicleType": "sedan|SUV|luxury|null"
}`
          },
          { role: "user", content: query }
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("AI extraction failed:", error);
  }

  // Fallback
  return {
    keywords: query.toLowerCase().split(/\s+/).filter(w => w.length > 2),
    domain: null,
    neighborhood: null,
    priceRange: { min: null, max: null },
    cuisineType: null,
    eventType: null,
    vehicleType: null,
  };
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

// Generate AI summary of results
async function generateSummary(query: string, results: SearchResult[]): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY || results.length === 0) {
    return results.length === 0 
      ? "No results found for your search. Try broadening your criteria."
      : `Found ${results.length} results matching your search.`;
  }

  try {
    const resultSummary = results.slice(0, 5).map(r => 
      `- ${r.title} (${r.type}): ${r.price ? `$${r.price}` : "Price varies"}, Rating: ${r.rating || "N/A"}`
    ).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a helpful travel assistant. Provide a brief, friendly 1-2 sentence summary of search results for Medellín, Colombia. Be concise and highlight the best options."
          },
          {
            role: "user",
            content: `User searched for: "${query}"\n\nTop results:\n${resultSummary}\n\nProvide a brief summary.`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || `Found ${results.length} great options!`;
    }
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
