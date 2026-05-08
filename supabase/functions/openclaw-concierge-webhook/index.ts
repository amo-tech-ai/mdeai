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

// Timing-safe Bearer token comparison.
// OpenClaw sends: Authorization: Bearer <hooks.token from openclaw.json>
function verifyBearer(authHeader: string | null, secret: string): boolean {
  if (!authHeader) return false;
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  const a = new TextEncoder().encode(authHeader);
  const b = new TextEncoder().encode(expected);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
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

  const valid = verifyBearer(req.headers.get("Authorization"), webhookSecret);
  if (!valid) {
    console.warn("openclaw-concierge-webhook: invalid bearer token");
    return jsonResponse(errorBody("UNAUTHORIZED", "Invalid webhook token"), 401, req);
  }

  let msg: InboundMessage;
  try {
    msg = await req.json() as InboundMessage;
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
  const { error: insertErr } = await db.rpc("fn_insert_conversation", {
    p_data: {
      contact_phone:       msg.from,
      direction:           "inbound",
      channel:             "whatsapp",
      body:                msg.body,
      openclaw_message_id: msg.messageId,
      campaign_id:         msg.campaignId ?? null,
      metadata:            JSON.stringify({ chatId: msg.chatId, event: msg.event }),
    },
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

  await db.rpc("fn_update_conversation_intent", {
    p_message_id: msg.messageId,
    p_intent:     result.intent,
    p_confidence: result.confidence,
    p_reply:      result.reply,
  });

  // Opt-out: add to suppression list.
  if (result.intent === "opt_out") {
    const identifier = msg.from.replace(/\D/g, "").replace(/^1/, "");
    await db
      .from("suppression_list")
      .upsert(
        { channel: "whatsapp", identifier, reason: "user_stop", source: "openclaw_concierge" },
        { onConflict: "channel,identifier" },
      );
    console.log("openclaw-concierge-webhook: opted out", identifier);
  }

  // Send reply via OpenClaw gateway.
  await sendReply(msg.chatId, result.reply);

  await db.rpc("fn_insert_conversation", {
    p_data: {
      contact_phone: msg.from,
      direction:     "outbound",
      channel:       "whatsapp",
      body:          result.reply,
      intent:        result.intent,
      campaign_id:   msg.campaignId ?? null,
      metadata:      JSON.stringify({ chatId: msg.chatId, in_reply_to: msg.messageId }),
    },
  });

  console.log(`openclaw-concierge-webhook: ${msg.from} → intent=${result.intent}`);
  return jsonResponse({ ok: true, intent: result.intent, reply: result.reply }, 200, req);
});
