/**
 * whatsapp-webhook — receives inbound WhatsApp events from Meta Cloud API
 * (or any provider that signs with X-Hub-Signature-256).
 *
 * Auth:         X-Hub-Signature-256: sha256=<HMAC-SHA256(WHATSAPP_APP_SECRET, rawBody)>
 * verify_jwt:   false — provider webhook; no Supabase JWT possible
 *
 * GET  /whatsapp-webhook  — webhook registration challenge (hub.challenge echo)
 * POST /whatsapp-webhook  — inbound message / status update events
 *
 * Inbound messages are persisted to public.whatsapp_messages (direction=inbound,
 * sender=user). Delivery status updates (delivered/read/failed) are logged to
 * console only — no status tracking table in scope for MVP.
 *
 * Env vars required:
 *   WHATSAPP_APP_SECRET   — Meta App Secret (used for HMAC signature verification)
 *   WHATSAPP_VERIFY_TOKEN — arbitrary string set in Meta webhook config for GET challenge
 */

import { jsonResponse, errorBody } from "../_shared/http.ts";
import { getServiceClient } from "../_shared/supabase-clients.ts";

// ── HMAC helpers ─────────────────────────────────────────────────────────────

async function computeHmacSha256(secret: string, body: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, body);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time hex comparison to prevent timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ae = new TextEncoder().encode(a);
  const be = new TextEncoder().encode(b);
  let diff = 0;
  for (let i = 0; i < ae.length; i++) diff |= ae[i]! ^ be[i]!;
  return diff === 0;
}

async function verifySignature(
  req: Request,
  rawBody: Uint8Array,
  appSecret: string,
): Promise<boolean> {
  const sigHeader = req.headers.get("x-hub-signature-256") ?? "";
  if (!sigHeader.startsWith("sha256=")) return false;
  const received = sigHeader.slice("sha256=".length).toLowerCase();
  const expected = await computeHmacSha256(appSecret, rawBody);
  return timingSafeEqual(received, expected);
}

// ── Meta Cloud API payload shapes (minimal — only fields we use) ─────────────

interface MetaTextMessage {
  id: string;
  from: string; // E.164 without '+'
  timestamp: string;
  type: "text" | "image" | "audio" | "video" | "document" | "sticker" | "reaction" | "unsupported";
  text?: { body: string };
  image?: { caption?: string; mime_type: string };
  audio?: { mime_type: string };
  video?: { caption?: string; mime_type: string };
  document?: { filename?: string; caption?: string };
}

interface MetaStatusUpdate {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}

interface MetaWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata?: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: MetaTextMessage[];
        statuses?: MetaStatusUpdate[];
        errors?: Array<{ code: number; title: string; message: string }>;
      };
      field: string;
    }>;
  }>;
}

// ── Extract human-readable content from any message type ─────────────────────

function extractContent(msg: MetaTextMessage): string {
  if (msg.type === "text" && msg.text?.body) return msg.text.body;
  if (msg.type === "image") return msg.image?.caption ?? "[image]";
  if (msg.type === "audio") return "[audio message]";
  if (msg.type === "video") return msg.video?.caption ?? "[video]";
  if (msg.type === "document") {
    const name = msg.document?.filename ?? "document";
    const caption = msg.document?.caption ? ` — ${msg.document.caption}` : "";
    return `[${name}${caption}]`;
  }
  if (msg.type === "sticker") return "[sticker]";
  if (msg.type === "reaction") return "[reaction]";
  return `[${msg.type}]`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // ── GET: webhook registration challenge ──────────────────────────────────
  if (req.method === "GET") {
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (!verifyToken) {
      return new Response("WHATSAPP_VERIFY_TOKEN not configured", { status: 500 });
    }
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === verifyToken && challenge) {
      console.log("whatsapp-webhook: registration challenge accepted");
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── OPTIONS: CORS preflight ───────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204 });
  }

  // ── POST: inbound event ───────────────────────────────────────────────────
  if (req.method !== "POST") {
    return jsonResponse(errorBody("METHOD_NOT_ALLOWED", "Only GET and POST supported"), 405, req);
  }

  const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!appSecret) {
    console.error("whatsapp-webhook: WHATSAPP_APP_SECRET not configured");
    return jsonResponse(errorBody("CONFIG_ERROR", "Webhook secret not configured"), 500, req);
  }

  // Read raw body BEFORE parsing — HMAC is computed over the raw bytes.
  const rawBody = new Uint8Array(await req.arrayBuffer());

  const valid = await verifySignature(req, rawBody, appSecret);
  if (!valid) {
    console.warn("whatsapp-webhook: invalid X-Hub-Signature-256");
    return jsonResponse(errorBody("UNAUTHORIZED", "Invalid webhook signature"), 401, req);
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody)) as MetaWebhookPayload;
  } catch {
    return jsonResponse(errorBody("BAD_REQUEST", "Invalid JSON body"), 400, req);
  }

  if (payload.object !== "whatsapp_business_account") {
    // Non-WhatsApp event (e.g., Instagram DMs on same app) — acknowledge and skip.
    return jsonResponse({ ok: true, skipped: true }, 200, req);
  }

  const db = getServiceClient();
  const inserts: Array<Record<string, unknown>> = [];
  let statusUpdates = 0;
  let errors = 0;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const val = change.value;

      // ── Inbound messages ─────────────────────────────────────────────────
      for (const msg of val.messages ?? []) {
        const phoneNumber = `+${msg.from}`;
        const content = extractContent(msg);
        inserts.push({
          phone_number: phoneNumber,
          direction: "inbound",
          message_type: msg.type,
          content,
          sender: "user",
          external_id: msg.id,
          status: "delivered", // we received it, so it's delivered from Meta's view
          raw_payload: msg as unknown as Record<string, unknown>,
        });
      }

      // ── Status updates ──────────────────────────────────────────────────
      for (const status of val.statuses ?? []) {
        console.log(
          `whatsapp-webhook: status ${status.status} for msg ${status.id} → ${status.recipient_id}`,
        );
        // Update outbound message status in wa_outbox if we have the external_id
        if (status.status === "delivered" || status.status === "read") {
          const waStatus = status.status === "read" ? "read" : "delivered";
          await db.from("wa_outbox").update({ status: waStatus }).eq("external_id", status.id);
        }
        statusUpdates++;
      }

      // ── Provider-level errors ───────────────────────────────────────────
      for (const err of val.errors ?? []) {
        console.error(`whatsapp-webhook: provider error ${err.code}: ${err.title} — ${err.message}`);
        errors++;
      }
    }
  }

  // Batch-insert inbound messages (upsert on external_id for idempotency).
  if (inserts.length > 0) {
    const { error: insertErr } = await db
      .from("whatsapp_messages")
      .upsert(inserts, { onConflict: "external_id", ignoreDuplicates: true });

    if (insertErr) {
      console.error("whatsapp-webhook: insert error:", insertErr.message);
      // Still return 200 to prevent Meta from retrying — log and investigate separately.
    } else {
      console.log(`whatsapp-webhook: inserted ${inserts.length} inbound message(s)`);
    }
  }

  return jsonResponse(
    { ok: true, data: { messages: inserts.length, statuses: statusUpdates, errors } },
    200,
    req,
  );
});
