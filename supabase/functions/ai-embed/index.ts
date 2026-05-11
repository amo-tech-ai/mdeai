import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { createHash } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ai-embed-secret",
};

const RequestSchema = z.object({
  entity_type: z.enum(["listing", "event", "restaurant"]),
  entity_id: z.string().uuid(),
});

type EntityType = z.infer<typeof RequestSchema>["entity_type"];

function buildListingText(apt: Record<string, unknown>): string {
  const parts: string[] = [];
  if (apt.title) parts.push(`Apartment: ${apt.title}`);
  if (apt.description) parts.push(`Description: ${apt.description}`);
  if (apt.neighborhood) parts.push(`Neighborhood: ${apt.neighborhood}`);
  if (apt.city) parts.push(`City: ${apt.city}`);
  if (apt.bedrooms) parts.push(`Bedrooms: ${apt.bedrooms}`);
  if (apt.bathrooms) parts.push(`Bathrooms: ${apt.bathrooms}`);
  if (apt.price_monthly) parts.push(`Monthly price: $${apt.price_monthly}`);
  if (apt.furnished) parts.push("Furnished");
  if (apt.pet_friendly) parts.push("Pet friendly");
  if (Array.isArray(apt.amenities) && apt.amenities.length)
    parts.push(`Amenities: ${apt.amenities.join(", ")}`);
  return parts.join(". ");
}

function buildEventText(evt: Record<string, unknown>): string {
  const parts: string[] = [];
  if (evt.name) parts.push(`Event: ${evt.name}`);
  if (evt.description) parts.push(`Description: ${evt.description}`);
  if (evt.event_type) parts.push(`Type: ${evt.event_type}`);
  if (evt.address) parts.push(`Location: ${evt.address}`);
  if (evt.ticket_price_min != null) parts.push(`Tickets from: $${evt.ticket_price_min}`);
  if (Array.isArray(evt.tags) && evt.tags.length)
    parts.push(`Tags: ${evt.tags.join(", ")}`);
  return parts.join(". ");
}

function buildRestaurantText(rest: Record<string, unknown>): string {
  const parts: string[] = [];
  if (rest.name) parts.push(`Restaurant: ${rest.name}`);
  if (rest.description) parts.push(`Description: ${rest.description}`);
  if (Array.isArray(rest.cuisine_types) && rest.cuisine_types.length)
    parts.push(`Cuisine: ${rest.cuisine_types.join(", ")}`);
  if (rest.address) parts.push(`Address: ${rest.address}`);
  if (rest.city) parts.push(`City: ${rest.city}`);
  if (rest.price_level)
    parts.push(`Price level: ${"$".repeat(rest.price_level as number)}`);
  if (Array.isArray(rest.dietary_options) && rest.dietary_options.length)
    parts.push(`Dietary: ${rest.dietary_options.join(", ")}`);
  if (Array.isArray(rest.ambiance) && rest.ambiance.length)
    parts.push(`Ambiance: ${rest.ambiance.join(", ")}`);
  return parts.join(". ");
}

function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastError;
}

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  return withRetry(async () => {
    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
      }
    );
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Gemini embedding failed ${resp.status}: ${body}`);
    }
    const data = await resp.json();
    const values: number[] = data?.embedding?.values;
    if (!Array.isArray(values) || values.length !== 768)
      throw new Error(`Unexpected embedding shape: ${values?.length}`);
    return values;
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = Deno.env.get("AI_EMBED_SECRET");
  const providedSecret = req.headers.get("x-ai-embed-secret") ?? "";
  if (!secret || !timingSafeEqual(providedSecret, secret)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const startMs = Date.now();
  let entityType: EntityType | undefined;
  let entityId: string | undefined;

  try {
    const body = RequestSchema.parse(await req.json());
    entityType = body.entity_type;
    entityId = body.entity_id;

    let entityText = "";
    let existingHash: string | null = null;

    if (entityType === "listing") {
      const { data, error } = await supabase
        .from("apartments")
        .select("id,title,description,neighborhood,city,bedrooms,bathrooms,price_monthly,furnished,pet_friendly,amenities")
        .eq("id", entityId)
        .single();
      if (error || !data) throw new Error(`Listing not found: ${entityId}`);
      entityText = buildListingText(data as Record<string, unknown>);

      const { data: existing } = await supabase
        .from("listing_embeddings")
        .select("content_hash")
        .eq("listing_id", entityId)
        .maybeSingle();
      existingHash = existing?.content_hash ?? null;
    } else if (entityType === "event") {
      const { data, error } = await supabase
        .from("events")
        .select("id,name,description,event_type,address,ticket_price_min,tags")
        .eq("id", entityId)
        .single();
      if (error || !data) throw new Error(`Event not found: ${entityId}`);
      entityText = buildEventText(data as Record<string, unknown>);

      const { data: existing } = await supabase
        .from("event_embeddings")
        .select("content_hash")
        .eq("event_id", entityId)
        .maybeSingle();
      existingHash = existing?.content_hash ?? null;
    } else {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id,name,description,cuisine_types,address,city,price_level,dietary_options,ambiance")
        .eq("id", entityId)
        .single();
      if (error || !data) throw new Error(`Restaurant not found: ${entityId}`);
      entityText = buildRestaurantText(data as Record<string, unknown>);

      const { data: existing } = await supabase
        .from("restaurant_embeddings")
        .select("content_hash")
        .eq("restaurant_id", entityId)
        .maybeSingle();
      existingHash = existing?.content_hash ?? null;
    }

    if (!entityText.trim()) throw new Error("Entity produced empty text");

    const contentHash = sha256Hex(entityText);
    if (existingHash === contentHash) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "content_unchanged" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const embedding = await getEmbedding(entityText, GEMINI_API_KEY);
    const embeddingStr = `[${embedding.join(",")}]`;

    if (entityType === "listing") {
      const { error } = await supabase.from("listing_embeddings").upsert(
        { listing_id: entityId, embedding: embeddingStr, model: "gemini-embedding-001", content_hash: contentHash, updated_at: new Date().toISOString() },
        { onConflict: "listing_id" }
      );
      if (error) throw error;
    } else if (entityType === "event") {
      const { error } = await supabase.from("event_embeddings").upsert(
        { event_id: entityId, embedding: embeddingStr, model: "gemini-embedding-001", content_hash: contentHash, updated_at: new Date().toISOString() },
        { onConflict: "event_id" }
      );
      if (error) throw error;
    } else {
      const { error } = await supabase.from("restaurant_embeddings").upsert(
        { restaurant_id: entityId, embedding: embeddingStr, model: "gemini-embedding-001", content_hash: contentHash, updated_at: new Date().toISOString() },
        { onConflict: "restaurant_id" }
      );
      if (error) throw error;
    }

    const durationMs = Date.now() - startMs;
    await supabase.from("ai_runs").insert({
      agent_name: "ai-embed",
      input_tokens: Math.ceil(entityText.length / 4),
      output_tokens: 768,
      duration_ms: durationMs,
      status: "success",
    }).then(() => {}, () => {});

    return new Response(
      JSON.stringify({ success: true, skipped: false, entity_type: entityType, entity_id: entityId, durationMs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const durationMs = Date.now() - startMs;
    console.error("ai-embed error:", err);
    await supabase.from("ai_runs").insert({
      agent_name: "ai-embed",
      input_tokens: 0,
      output_tokens: 0,
      duration_ms: durationMs,
      status: "error",
    }).then(() => {}, () => {});
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
