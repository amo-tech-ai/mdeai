#!/usr/bin/env bash
# EVT-069 — Stripe ticket spine smoke (test mode).
# Prereqs: STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET on Supabase edge; COP card enabled in Stripe Dashboard.
# Docs: https://docs.stripe.com/checkout · https://docs.stripe.com/webhooks/signature
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "[evt069] FAIL: missing .env (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)" >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a && source .env && set +a

: "${VITE_SUPABASE_URL:?}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:?}"

EVENT_ID="${EVT069_EVENT_ID:-22222222-2222-2222-2222-000000000001}"
TICKET_ID="${EVT069_TICKET_ID:-33333333-3333-3333-3333-000000000003}"
IDEM_KEY="${EVT069_IDEM_KEY:-$(python3 -c 'import uuid; print(uuid.uuid4())')}"
SMOKE_EMAIL="${EVT069_BUYER_EMAIL:-evt069-smoke@test.mdeai.co}"

FN_CHECKOUT="${VITE_SUPABASE_URL}/functions/v1/ticket-checkout"
FN_WEBHOOK="${VITE_SUPABASE_URL}/functions/v1/ticket-payment-webhook"

echo "[evt069] Step 1 — ticket-checkout (idempotency_key=${IDEM_KEY})"
CHECKOUT_BODY=$(python3 <<PY
import json
print(json.dumps({
  "event_id": "${EVENT_ID}",
  "ticket_id": "${TICKET_ID}",
  "quantity": 1,
  "buyer_email": "${SMOKE_EMAIL}",
  "buyer_name": "EVT069 Smoke",
  "attendees": [{"email": "${SMOKE_EMAIL}", "full_name": "EVT069 Smoke"}],
  "idempotency_key": "${IDEM_KEY}",
  "return_url_success": "https://mdeai.co/events/success?evt069=1",
  "return_url_cancel": "https://mdeai.co/events/cancel?evt069=1",
}))
PY
)

HTTP=$(curl -sS -o /tmp/evt069-checkout.json -w '%{http_code}' -X POST "$FN_CHECKOUT" \
  -H "apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "$CHECKOUT_BODY")

echo "[evt069] checkout HTTP ${HTTP}"
python3 -m json.tool < /tmp/evt069-checkout.json || cat /tmp/evt069-checkout.json

if [[ "$HTTP" != "200" ]]; then
  echo "[evt069] FAIL: checkout did not return 200 — see blockers in EVT-069 task" >&2
  exit 1
fi

ORDER_ID=$(python3 -c "import json; d=json.load(open('/tmp/evt069-checkout.json')); print(d['data']['order_id'])")
SESSION_URL=$(python3 -c "import json; d=json.load(open('/tmp/evt069-checkout.json')); print(d['data'].get('stripe_session_url',''))")
echo "[evt069] order_id=${ORDER_ID}"
echo "[evt069] stripe_session_url=${SESSION_URL:0:80}..."

echo "[evt069] Step 2 — Complete payment in Stripe test mode (manual or Stripe CLI):"
echo "  stripe checkout sessions retrieve <session_id>  # after paying with test card 4242..."
echo "  Or open: ${SESSION_URL}"

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "[evt069] STRIPE_SECRET_KEY not in shell — skip auto payment_intent trigger"
  echo "[evt069] After payment, run Step 3 SQL verify (see task file)"
  exit 0
fi

SESSION_ID=$(python3 -c "
import json, re
u = json.load(open('/tmp/evt069-checkout.json'))['data']['stripe_session_url']
# cs_test_... in URL
m = re.search(r'cs_[a-zA-Z0-9_]+', u)
print(m.group(0) if m else '')
")

if [[ -z "$SESSION_ID" ]]; then
  echo "[evt069] Could not parse session id from URL"
  exit 0
fi

echo "[evt069] Step 2b — Poll session (requires payment completed in Dashboard/CLI)..."
if command -v stripe >/dev/null 2>&1; then
  stripe checkout sessions retrieve "$SESSION_ID" --expand payment_intent
else
  echo "[evt069] Install Stripe CLI for automated retrieve; otherwise pay URL above"
fi

echo "[evt069] Step 3 — Verify order row (service role or SQL MCP):"
echo "  SELECT id, status, stripe_payment_intent_id FROM event_orders WHERE id = '${ORDER_ID}';"
echo "[evt069] Step 4 — Replay webhook: stripe events resend <event_id> OR re-POST signed body"
