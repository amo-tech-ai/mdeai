/**
 * ai-embed — Gemini text-embedding-004 pipeline
 *
 * Triggered by pg_net from database triggers on INSERT/UPDATE to:
 *   apartments   → listing_embeddings   (768-dim HNSW)
 *   events       → event_embeddings
 *   restaurants  → restaurant_embeddings
 *
 * Auth: x-ai-embed-secret header (timing-safe compare; secret in vault).
 * verify_jwt: false — called by DB trigger via pg_net, no Supabase JWT.
 *
 * Idempotency: SHA-256 content_hash check — skips re-embed if text unchanged.
 * Retry: withRetry wraps the Gemini call (429 / 5xx backoff).
 */

import { errorBody, jsonResponse } from "../_shared/http.ts";
import { getServiceClient } from "../_shared/supabase-clients.ts";
import { z } from "https://esm.sh/zod@3.23.8";

// Inline retry — avoids importing the full @google/genai SDK from gemini.ts
async function withRetry<T>(fn: () => Promise<T>, maxTries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < maxTries; i++) {
    try { return await fn(); } catch (err) {
      last = err;
      const s = (err as { status?: number })?.status;
      const msg = err instanceof Error ? err.message : String(err);
      if (s === 400 || s === 403 || s === 404) throw err; // non-retryable
      if (!s && !msg.includes("429") && !msg.includes("50")) throw err;
      await new Promise((r) => setTimeout(r, Math.min(8000, 2 ** i * 1000)));
    }
  }
  throw last;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 768;
const EMBED_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const BodySchema = z.object({
  entity_type: z.enum(["listing", "event", "restaurant"]),
  entity_id: z.string().uuid(),
});

type EntityType = z.infer<typeof BodySchema>["entity_type"];
type ServiceClient = ReturnType<typeof getServiceClient>;

// ---------------------------------------------------------------------------
// Text builders — what we embed for each entity type.
// Rich, natural-language sentences maximise semantic search quality.
// ---------------------------------------------------------------------------

function buildListingText(r: Record<string, unknown>): string {
  const parts: (string | null | undefined)[] = [
    r.title as string,
    r.description as string,
    `Located in ${r.neighborhood}${r.city ? `, ${r.city}` : ""}.`,
    r.bedrooms != null ? `${r.bedrooms} bedroom(s)` : null,
    r.bathrooms != null ? `${r.bathrooms} bathroom(s)` : null,
    r.size_sqm != null ? `${r.size_sqm} sqm` : null,
    r.price_monthly != null ? `$${r.price_monthly}/month` : null,
    Array.isArray(r.amenities) && r.amenities.length
      ? `Amenities: ${(r.amenities as string[]).join(", ")}`
      : null,
    Array.isArray(r.building_amenities) && r.building_amenities.length
      ? `Building amenities: ${(r.building_amenities as string[]).join(", ")}`
      : null,
    r.furnished ? "Furnished." : "Unfurnished.",
    r.pet_friendly ? "Pets allowed." : null,
    r.parking_included ? "Parking included." : null,
    r.wifi_speed != null ? `WiFi ${r.wifi_speed}Mbps.` : null,
    r.utilities_included ? "Utilities included." : null,
  ];
  return parts
    .filter((p): p is string => Boolean(p))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildEventText(r: Record<string, unknown>): string {
  const parts: (string | null | undefined)[] = [
    r.name as string,
    r.description as string,
    r.event_type ? `Type: ${r.event_type}.` : null,
    r.subcategory ? `Category: ${r.subcategory}.` : null,
    r.address ? `At ${r.address}.` : null,
    Array.isArray(r.tags) && r.tags.length
      ? `Tags: ${(r.tags as string[]).join(", ")}.`
      : null,
    r.ticket_price_min != null
      ? Number(r.ticket_price_min) === 0
        ? "Free event."
        : `Tickets from $${r.ticket_price_min}.`
      : null,
  ];
  return parts
    .filter((p): p is string => Boolean(p))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildRestaurantText(r: Record<string, unknown>): string {
  const parts: (string | null | undefined)[] = [
    r.name as string,
    r.description as string,
    Array.isArray(r.cuisine_types) && r.cuisine_types.length
      ? `Cuisine: ${(r.cuisine_types as string[]).join(", ")}.`
      : null,
    r.address ? `At ${r.address}.` : null,
    r.price_level != null ? `Price level ${r.price_level} out of 5.` : null,
    Array.isArray(r.dietary_options) && r.dietary_options.length
      ? `Dietary options: ${(r.dietary_options as string[]).join(", ")}.`
      : null,
    Array.isArray(r.ambiance) && r.ambiance.length
      ? `Ambiance: ${(r.ambiance as string[]).join(", ")}.`
      : null,
    Array.isArray(r.tags) && r.tags.length
      ? `Tags: ${(r.tags as string[]).join(", ")}.`
      : null,
    r.rating != null ? `Rated ${r.rating} out of 5.` : null,
  ];
  return parts
    .filter((p): p is string => Boolean(p))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildText(type: EntityType, row: Record<string, unknown>): string {
  if (type === "listing") return buildListingText(row);
  if (type === "event") return buildEventText(row);
  return buildRestaurantText(row);
}

// ---------------------------------------------------------------------------
// Entity table maps
// ---------------------------------------------------------------------------

const SOURCE_TABLE: Record<EntityType, string> = {
  listing: "apartments",
  event: "events",
  restaurant: "restaurants",
};

const EMBED_TABLE: Record<EntityType, string> = {
  listing: "listing_embeddings",
  event: "event_embeddings",
  restaurant: "restaurant_embeddings",
};

const FK_COL: Record<EntityType, string> = {
  listing: "listing_id",
  event: "event_id",
  restaurant: "restaurant_id",
};

// ---------------------------------------------------------------------------
// Gemini embedContent (direct REST — avoids SDK type churn for embeddings)
// ---------------------------------------------------------------------------

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const resp = await fetch(`${EMBED_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: EMBED_DIMS,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Gemini embed HTTP ${resp.status}: ${body.slice(0, 300)}`);
  }

  const data = (await resp.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBED_DIMS) {
    throw new Error(
      `Unexpected embedding dims: got ${values?.length ?? 0}, expected ${EMBED_DIMS}`,
    );
  }
  return values;
}

// ---------------------------------------------------------------------------
// SHA-256 content hash (idempotency gate)
// ---------------------------------------------------------------------------

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function fetchEntity(
  db: ServiceClient,
  type: EntityType,
  id: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await db
    .from(SOURCE_TABLE[type])
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Fetch ${type} ${id}: ${error.message}`);
  return data as Record<string, unknown> | null;
}

async function getExistingHash(
  db: ServiceClient,
  type: EntityType,
  id: string,
): Promise<string | null> {
  const { data } = await db
    .from(EMBED_TABLE[type])
    .select("content_hash")
    .eq(FK_COL[type], id)
    .maybeSingle();
  return (data as { content_hash?: string } | null)?.content_hash ?? null;
}

// ---------------------------------------------------------------------------
// Timing-safe header comparison
// ---------------------------------------------------------------------------

function timingSafeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  const aB = new TextEncoder().encode(a);
  const bB = new TextEncoder().encode(b);
  let diff = 0;
  for (let i = 0; i < aB.length; i++) diff |= aB[i] ^ bB[i];
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // Top-level safety net — ensures any uncaught exception returns JSON, not Deno's text/plain 500
  try {
    return await handleRequest(req);
  } catch (fatal) {
    const msg = fatal instanceof Error ? fatal.message : String(fatal);
    console.error("ai-embed FATAL:", msg, fatal);
    return new Response(
      JSON.stringify({ success: false, error: { code: "FATAL", message: msg } }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type, x-ai-embed-secret",
      },
    });
  }
  if (req.method !== "POST") {
    return jsonResponse(errorBody("METHOD_NOT_ALLOWED", "POST only"), 405, req);
  }

  // Auth — timing-safe compare against AI_EMBED_SECRET env var.
  // When secret is unset (local dev) auth is skipped.
  const secret = Deno.env.get("AI_EMBED_SECRET");
  if (secret) {
    const incoming = req.headers.get("x-ai-embed-secret");
    if (!timingSafeEqual(incoming, secret)) {
      return jsonResponse(errorBody("UNAUTHORIZED", "Invalid embed secret"), 401, req);
    }
  }

  const t0 = Date.now();
  const db = getServiceClient();

  // Parse + validate body
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return jsonResponse(
      errorBody("VALIDATION_ERROR", e instanceof Error ? e.message : "invalid body"),
      400,
      req,
    );
  }

  const { entity_type, entity_id } = body;

  try {
    // 1. Load entity from source table
    const row = await fetchEntity(db, entity_type, entity_id);
    if (!row) {
      // Entity was deleted between trigger fire and this call — safe no-op.
      return jsonResponse(
        { success: true, skipped: true, reason: "entity_not_found" },
        200,
        req,
      );
    }

    // 2. Build natural-language text for embedding
    const text = buildText(entity_type, row);
    if (!text.trim()) {
      return jsonResponse(
        { success: true, skipped: true, reason: "empty_text" },
        200,
        req,
      );
    }

    // 3. Content-hash idempotency — skip if nothing changed
    const hash = await sha256Hex(text);
    const existingHash = await getExistingHash(db, entity_type, entity_id);
    if (existingHash === hash) {
      return jsonResponse(
        { success: true, skipped: true, reason: "content_unchanged", entity_id },
        200,
        req,
      );
    }

    // 4. Generate 768-dim embedding with retry (429 / 5xx backoff)
    const embedding = await withRetry(() => getEmbedding(text));

    // 5. Upsert into embedding table.
    // pgvector accepts the array literal format '[v1,v2,...]'.
    const { error: upsertErr } = await db
      .from(EMBED_TABLE[entity_type])
      .upsert(
        {
          [FK_COL[entity_type]]: entity_id,
          embedding: `[${embedding.join(",")}]`,
          model: EMBED_MODEL,
          content_hash: hash,
          updated_at: new Date().toISOString(),
        },
        { onConflict: FK_COL[entity_type] },
      );

    if (upsertErr) {
      throw new Error(`Upsert ${EMBED_TABLE[entity_type]}: ${upsertErr.message}`);
    }

    const duration_ms = Date.now() - t0;

    // 6. Log to ai_runs (user_id nullable after migration)
    try {
      await db.from("ai_runs").insert({
        agent_name: "ai-embed",
        agent_type: "general_concierge",
        status: "success",
        input_data: { entity_type, entity_id, text_length: text.length },
        output_data: { dims: EMBED_DIMS, content_hash: hash },
        input_tokens: Math.ceil(text.length / 4),
        output_tokens: EMBED_DIMS,
        total_tokens: Math.ceil(text.length / 4) + EMBED_DIMS,
        duration_ms,
        model_name: EMBED_MODEL,
        metadata: { entity_type, entity_id },
      });
    } catch (logErr) {
      console.error("ai_runs insert failed", logErr);
    }

    console.log(`ai-embed ok: ${entity_type} ${entity_id} (${duration_ms}ms)`);

    return jsonResponse(
      {
        success: true,
        entity_type,
        entity_id,
        dims: EMBED_DIMS,
        content_hash: hash,
        duration_ms,
      },
      200,
      req,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration_ms = Date.now() - t0;
    console.error("ai-embed error", { entity_type, entity_id, msg });

    try {
      await db.from("ai_runs").insert({
        agent_name: "ai-embed",
        agent_type: "general_concierge",
        status: "error",
        input_data: { entity_type, entity_id },
        error_message: msg,
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        duration_ms,
        model_name: EMBED_MODEL,
      });
    } catch { /* non-fatal logging */ }

    return jsonResponse(errorBody("EMBED_FAILED", msg), 500, req);
  }
}
