/**
 * sponsor-payment-webhook — handles Stripe webhook events for sponsor payments.
 *
 * Auth: Stripe-Signature header verification (STRIPE_SPONSOR_WEBHOOK_SECRET)
 * Handles: checkout.session.completed, payment_intent.payment_failed
 *
 * On checkout.session.completed:
 *   1. Verifies Stripe signature
 *   2. Loads invoice by stripe_session_id
 *   3. Sets invoice: status='paid', paid_at=now(), stripe_payment_intent=payment_intent
 *   4. Activates placements where start_at <= now()
 *   5. Logs to ai_runs
 *
 * On payment_intent.payment_failed:
 *   1. Sets invoice: status='failed'
 *   2. Logs error
 *
 * Idempotent: UNIQUE on stripe_session_id in invoices table means duplicate webhook
 * events are no-ops on the UPDATE (row already paid — UPDATE is idempotent).
 */

import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext";
import { errorBody, getCorsHeaders, jsonResponse } from "../_shared/http.ts";
import { getServiceClient } from "../_shared/supabase-clients.ts";

// ---------------------------------------------------------------------------
// Stripe — lazy init
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return null;
  _stripe = new Stripe(key, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });
  return _stripe;
}

// ---------------------------------------------------------------------------
// DB row shapes
// ---------------------------------------------------------------------------

interface InvoiceRow {
  id: string;
  application_id: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Schema helper
// ---------------------------------------------------------------------------

type AnyClient = ReturnType<typeof getServiceClient>;

function sponsorSchema(client: AnyClient) {
  return (client as unknown as { schema: (s: string) => AnyClient }).schema(
    "sponsor",
  );
}

// ---------------------------------------------------------------------------
// Helper: log to ai_runs (best-effort)
// ---------------------------------------------------------------------------

async function logAiRun(
  service: AnyClient,
  status: "success" | "error",
  durationMs: number,
  errorMessage?: string,
): Promise<void> {
  try {
    await service.from("ai_runs").insert({
      agent_name: "sponsor-payment-webhook",
      input_tokens: 0,
      output_tokens: 0,
      duration_ms: durationMs,
      status,
      ...(errorMessage ? { error_message: errorMessage } : {}),
    });
  } catch (logErr) {
    console.error("sponsor-payment-webhook: ai_runs log failed", logErr);
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  service: AnyClient,
  startMs: number,
): Promise<void> {
  const db = sponsorSchema(service);

  // Load invoice by stripe_session_id.
  const { data: invoiceRaw, error: lookupErr } = await db
    .from("invoices")
    .select("id, application_id, status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (lookupErr) {
    throw new Error(`Invoice lookup failed: ${lookupErr.message}`);
  }

  if (!invoiceRaw) {
    // No invoice for this session — may be a different product's webhook endpoint.
    // Return silently so Stripe doesn't retry (safe no-op).
    console.warn(
      `sponsor-payment-webhook: no invoice for stripe_session_id=${session.id}; ignoring`,
    );
    return;
  }

  const invoice = invoiceRaw as InvoiceRow;

  // Resolve payment_intent string (may be string | Stripe.PaymentIntent | null).
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  // UPDATE invoice → paid (idempotent — if already paid, UPDATE is a no-op on status).
  const { error: invoiceUpdateErr } = await db
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent: paymentIntentId,
    })
    .eq("id", invoice.id);

  if (invoiceUpdateErr) {
    throw new Error(`Invoice UPDATE failed: ${invoiceUpdateErr.message}`);
  }

  // Activate placements where start_at <= now() and still inactive.
  const now = new Date().toISOString();
  const { error: placementsUpdateErr } = await db
    .from("placements")
    .update({ active: true })
    .eq("application_id", invoice.application_id)
    .lte("start_at", now)
    .eq("active", false);

  if (placementsUpdateErr) {
    // Non-fatal — log + continue. Invoice is already marked paid.
    console.error(
      `sponsor-payment-webhook: placements activation failed for application=${invoice.application_id}`,
      placementsUpdateErr.message,
    );
  }

  await logAiRun(service, "success", Date.now() - startMs);
  console.log(
    `sponsor-payment-webhook: invoice=${invoice.id} marked paid, placements activated`,
  );
}

async function handlePaymentFailed(
  pi: Stripe.PaymentIntent,
  service: AnyClient,
  startMs: number,
): Promise<void> {
  const db = sponsorSchema(service);

  // Look up invoice by stripe_payment_intent (may not exist yet if payment failed
  // before checkout session completed — also try by session if available).
  const { data: invoiceRaw, error: lookupErr } = await db
    .from("invoices")
    .select("id, application_id, status")
    .eq("stripe_payment_intent", pi.id)
    .maybeSingle();

  if (lookupErr) {
    throw new Error(`Invoice lookup (by payment_intent) failed: ${lookupErr.message}`);
  }

  if (!invoiceRaw) {
    // No matching invoice — this payment_intent may belong to a different product.
    console.warn(
      `sponsor-payment-webhook: no invoice for payment_intent=${pi.id}; ignoring`,
    );
    await logAiRun(service, "success", Date.now() - startMs);
    return;
  }

  const invoice = invoiceRaw as InvoiceRow;

  const { error: updateErr } = await db
    .from("invoices")
    .update({ status: "failed" })
    .eq("id", invoice.id)
    .neq("status", "paid"); // Never downgrade a paid invoice.

  if (updateErr) {
    throw new Error(`Invoice UPDATE (failed) error: ${updateErr.message}`);
  }

  const errMsg = `payment_intent.payment_failed for pi=${pi.id}, invoice=${invoice.id}`;
  console.error(`sponsor-payment-webhook: ${errMsg}`);
  await logAiRun(service, "error", Date.now() - startMs, errMsg);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }
  if (req.method !== "POST") {
    return jsonResponse(errorBody("METHOD_NOT_ALLOWED", "Use POST"), 405, req);
  }

  const startMs = Date.now();

  // 1. Read raw body FIRST — must not parse as JSON before signature verification.
  const rawBody = await req.text();

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return jsonResponse(
      errorBody("BAD_SIGNATURE", "Missing stripe-signature header"),
      400,
      req,
    );
  }

  // 2. Webhook secret — missing in local dev is a warning, not a hard error.
  //    Stripe signs with HMAC; there is no Supabase JWT involved here.
  const webhookSecret = Deno.env.get("STRIPE_SPONSOR_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.warn(
      "sponsor-payment-webhook: STRIPE_SPONSOR_WEBHOOK_SECRET is not set; " +
        "skipping signature verification (dev only)",
    );
    return jsonResponse({ success: true, dev_skip: true }, 200, req);
  }

  const stripe = getStripe();
  if (!stripe) {
    console.error(
      "sponsor-payment-webhook: STRIPE_SECRET_KEY is not configured",
    );
    return jsonResponse(
      errorBody("CONFIG_ERROR", "Server is missing Stripe credentials"),
      500,
      req,
    );
  }

  // 3. Verify signature using constructEventAsync (Deno-compatible async variant).
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      webhookSecret,
    );
  } catch (err) {
    console.error(
      "sponsor-payment-webhook: signature verification failed",
      err instanceof Error ? err.message : err,
    );
    return jsonResponse(
      errorBody("INVALID_SIGNATURE", "Webhook signature verification failed"),
      400,
      req,
    );
  }

  const service = getServiceClient();

  // 4. Dispatch by event type.
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          service,
          startMs,
        );
        break;
      }

      case "payment_intent.payment_failed": {
        await handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
          service,
          startMs,
        );
        break;
      }

      default: {
        // Unknown/unsubscribed event — return 200 so Stripe stops retrying.
        console.log(
          `sponsor-payment-webhook: ignoring unsubscribed event type ${event.type}`,
        );
        break;
      }
    }
  } catch (err) {
    console.error("sponsor-payment-webhook: handler failed", {
      event_id: event.id,
      event_type: event.type,
      err: err instanceof Error ? err.message : err,
    });
    // 500 → Stripe retries with exponential back-off (up to 3 days).
    return jsonResponse(
      errorBody(
        "HANDLER_FAILED",
        err instanceof Error ? err.message : "Unknown handler error",
      ),
      500,
      req,
    );
  }

  return jsonResponse({ success: true, event_id: event.id }, 200, req);
});
