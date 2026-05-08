import { getCorsHeaders, jsonResponse, errorBody } from "../_shared/http.ts";
import { getServiceClient } from "../_shared/supabase-clients.ts";
import { callGeminiStructured, withRetry } from "../_shared/gemini.ts";

// Inbound message shape from OpenClaw webhook.
interface InboundMessage {
  event:     "message" | "message.received";
  messageId: string;
  from:      string;   // phone number, e.g. "+573001234567"
  chatId:    string;
  body:      string;
  type?:     string;   // "text" | "image" | "audio" | ...
  timestamp?: string;
  campaignId?: string;
}

// Gemini classification output.
interface IntentResult {
  intent:     "vote_confirm" | "ticket_status" | "leaderboard" | "event_info" | "opt_out" | "other";
  confidence: number;
  reply:      string;
}

const intentSchema = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: ["vote_confirm", "ticket_status", "leaderboard", "event_info", "opt_out", "other"],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reply:      { type: "string" },
  },
  required: ["intent", "confidence", "reply"],
  additionalProperties: false,
};

const SYSTEM_INSTRUCTION = `You are a friendly event concierge bot for mdeai.co, a Medellin event platform.
Classify the user message into one of these intents:
- vote_confirm: confirming a vote or asking about their vote
- ticket_status: asking about ticket purchase, payment, or delivery
- leaderboard: asking about rankings, standings, or who is winning
- event_info: asking about event schedule, location, artist, or details
- opt_out: requesting to stop receiving messages (STOP, unsubscribe, remove me)
- other: anything that does not match the above

Then write a short, helpful reply in English. Keep replies under 160 characters.
For opt_out, confirm they will be removed and apologize for the interruption.
For other, offer to connect them with a human agent.`;

// Timing-safe HMAC-SHA256 verify (same contract as delivery webhook).
async function verifySignature(
  rawBody: Uint8Array,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;
  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;
  const sigHex = signatureHeader.slice(prefix.length).toLowerCase();

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, rawBody));

  if (sigHex.length !== mac.length * 2) return false;
  const sigBytes = new Uint8Array(mac.length);
  for (let i = 0; i < mac.length; i++) {
    sigBytes[i] = parseInt(sigHex.substr(i * 2, 2), 16);
  }
  let diff = 0;
  for (let i = 0; i < mac.length; i++) diff |= mac[i]! ^ sigBytes[i]!;
  return diff === 0;
}

// Send reply via OpenClaw gateway REST API.
async function sendReply(chatId: string, body: string): Promise<void> {
  const gatewayUrl  = Deno.env.get("OPENCLAW_GATEWAY_URL");
  const gatewayToken = Deno.env.get("OPENCLAW_GATEWAY_TOKEN");
  if (!gatewayUrl || !gatewayToken) {
    console.warn("OPENCLAW_GATEWAY_URL or OPENCLAW_GATEWAY_TOKEN not set — skipping reply");
    return;
  }
  const res = await fetch(`${gatewayUrl}/api/sendText`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${gatewayToken}`,
    },
    body: JSON.stringify({ chatId, body }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`sendReply failed ${res.status}:`, txt);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const webhookSecret = Deno.env.get("OPENCLAW_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("OPENCLAW_WEBHOOK_SECRET not set");
    return jsonResponse(errorBody("CONFIG_ERROR", "Webhook secret not configured"), 500, req);
  }

  const rawBody = new Uint8Array(await req.arrayBuffer());

  const valid = await verifySignature(
    rawBody,
    req.headers.get("x-openclaw-signature"),
    webhookSecret,
  );
  if (!valid) {
    console.warn("openclaw-concierge-webhook: invalid signature");
    return jsonResponse(errorBody("UNAUTHORIZED", "Invalid webhook signature"), 401, req);
  }

  let msg: InboundMessage;
  try {
    msg = JSON.parse(new TextDecoder().decode(rawBody)) as InboundMessage;
  } catch {
    return jsonResponse(errorBody("BAD_REQUEST", "Invalid JSON body"), 400, req);
  }

  // Only handle inbound text messages.
  if (!msg.body || !msg.from || !msg.messageId) {
    return jsonResponse({ ok: true, skipped: true }, 200, req);
  }
  if (msg.type && msg.type !== "text") {
    return jsonResponse({ ok: true, skipped: true, reason: "non-text message" }, 200, req);
  }

  const db = getServiceClient();

  // Store inbound message immediately — before classification.
  const { error: insertErr } = await db
    .schema("marketing")
    .from("openclaw_conversations")
    .insert({
      contact_phone:       msg.from,
      direction:           "inbound",
      channel:             "whatsapp",
      body:                msg.body,
      openclaw_message_id: msg.messageId,
      campaign_id:         msg.campaignId ?? null,
      metadata:            { chatId: msg.chatId, event: msg.event },
    });

  if (insertErr && insertErr.code !== "23505") {
    // 23505 = unique violation (duplicate delivery) — safe to continue
    console.error("conversation insert error:", insertErr.message);
  }

  // Classify intent + generate reply via Gemini.
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  let result: IntentResult;

  if (!GEMINI_API_KEY) {
    result = { intent: "other", confidence: 1, reply: "Thanks for your message. A team member will follow up shortly." };
  } else {
    try {
      const { data } = await withRetry(() =>
        callGeminiStructured<IntentResult>({
          model:             "gemini-3-flash-preview",
          prompt:            msg.body,
          systemInstruction: SYSTEM_INSTRUCTION,
          responseJsonSchema: intentSchema,
          thinkingLevel:     "minimal",
          agentName:         "concierge_bot",
          timeoutMs:         10_000,
        })
      );
      result = data;
    } catch (err) {
      console.error("Gemini classification error:", err instanceof Error ? err.message : err);
      result = { intent: "other", confidence: 0, reply: "Thanks for reaching out! We will get back to you soon." };
    }
  }

  // Update the conversation row with intent + reply.
  await db
    .schema("marketing")
    .from("openclaw_conversations")
    .update({
      intent:      result.intent,
      confidence:  result.confidence,
      reply_body:  result.reply,
      replied_at:  new Date().toISOString(),
    })
    .eq("openclaw_message_id", msg.messageId);

  // Opt-out: add to suppression list.
  if (result.intent === "opt_out") {
    const identifier = msg.from.replace(/\D/g, "").replace(/^1/, "");
    await db
      .from("suppression_list")
      .upsert(
        { channel: "whatsapp", identifier, reason: "user_opted_out" },
        { onConflict: "channel,identifier" },
      );
    console.log("openclaw-concierge-webhook: opted out", identifier);
  }

  // Send reply via OpenClaw gateway.
  await sendReply(msg.chatId, result.reply);

  // Store outbound reply as a conversation turn.
  await db
    .schema("marketing")
    .from("openclaw_conversations")
    .insert({
      contact_phone: msg.from,
      direction:     "outbound",
      channel:       "whatsapp",
      body:          result.reply,
      intent:        result.intent,
      campaign_id:   msg.campaignId ?? null,
      metadata:      { chatId: msg.chatId, in_reply_to: msg.messageId },
    });

  console.log(`openclaw-concierge-webhook: ${msg.from} → intent=${result.intent}`);
  return jsonResponse({ ok: true, intent: result.intent, reply: result.reply }, 200, req);
});
