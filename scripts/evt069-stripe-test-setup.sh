#!/usr/bin/env bash
# EVT-069 — Push Stripe TEST secrets to Supabase + redeploy ticket edges.
# Prereqs: sk_test_ + whsec_ from Stripe Dashboard / `stripe listen` (TEST mode).
# Docs: https://docs.stripe.com/webhooks · https://supabase.com/docs/guides/functions/secrets
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PROJECT_REF="${SUPABASE_PROJECT_REF:-zkwcbyxiwklihegjhuql}"

ENV_FILE="${EVT069_ENV_FILE:-.env.local}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[evt069-setup] FAIL: missing $ENV_FILE" >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a && source "$ENV_FILE" && set +a

: "${STRIPE_SECRET_KEY:?STRIPE_SECRET_KEY missing in $ENV_FILE}"
: "${STRIPE_WEBHOOK_SECRET:?STRIPE_WEBHOOK_SECRET missing in $ENV_FILE}"

if [[ "${STRIPE_SECRET_KEY}" != sk_test_* ]]; then
  echo "[evt069-setup] FAIL: STRIPE_SECRET_KEY must start with sk_test_ (got ${STRIPE_SECRET_KEY:0:8}...)" >&2
  echo "  Dashboard → Test mode → Developers → API keys" >&2
  exit 1
fi
if [[ "${STRIPE_WEBHOOK_SECRET}" != whsec_* ]]; then
  echo "[evt069-setup] FAIL: STRIPE_WEBHOOK_SECRET must start with whsec_" >&2
  exit 1
fi

echo "[evt069-setup] Setting Supabase edge secrets (values not printed)..."
supabase secrets set \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  --project-ref "$PROJECT_REF"

echo "[evt069-setup] Secrets present on project (names only):"
supabase secrets list --project-ref "$PROJECT_REF" | rg -i stripe || true

if [[ -d dist ]]; then
  echo "[evt069-setup] Removing dist/ (dist-leak-scan deploy guard)..."
  rm -rf dist
fi

echo "[evt069-setup] Deploying ticket-checkout + ticket-payment-webhook..."
supabase functions deploy ticket-checkout ticket-payment-webhook \
  --no-verify-jwt \
  --project-ref "$PROJECT_REF"

echo "[evt069-setup] Done. Next:"
echo "  1. Forward webhooks to REMOTE (not 127.0.0.1 unless using local supabase):"
echo "     stripe listen --forward-to https://${PROJECT_REF}.supabase.co/functions/v1/ticket-payment-webhook"
echo "  2. bash scripts/evt069-stripe-smoke.sh"
echo "  3. Pay cs_test_ URL with 4242 4242 4242 4242"
echo "  4. supabase db query --linked \"SELECT id, status FROM event_orders WHERE id = '<order_id>';\""
