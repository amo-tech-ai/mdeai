#!/usr/bin/env bash
# EVT-009 — redeploy ticket edges with gateway verify_jwt=false (matches config.toml + handlers).
# Official: https://supabase.com/docs/guides/functions/function-configuration
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PROJECT_REF="${SUPABASE_PROJECT_REF:-zkwcbyxiwklihegjhuql}"

if [[ -d dist ]]; then
  echo "[deploy-ticket-jwt] WARN: dist/ exists — dist-leak-scan may block deploy. Remove dist/ or fix bundle leaks first."
fi

echo "[deploy-ticket-jwt] Deploying ticket-checkout (verify_jwt=false)..."
supabase functions deploy ticket-checkout --no-verify-jwt --project-ref "$PROJECT_REF"

echo "[deploy-ticket-jwt] Deploying ticket-validate (verify_jwt=false)..."
supabase functions deploy ticket-validate --no-verify-jwt --project-ref "$PROJECT_REF"

echo "[deploy-ticket-jwt] Optional: redeploy webhook from main repo path (fixes worktree entrypoint metadata)..."
supabase functions deploy ticket-payment-webhook --no-verify-jwt --project-ref "$PROJECT_REF"

echo "[deploy-ticket-jwt] Verify remote flags:"
supabase functions list --project-ref "$PROJECT_REF" -o json \
  | python3 -c "
import json, sys
for f in json.load(sys.stdin):
    if 'ticket' in f.get('slug', ''):
        print(f\"  {f['slug']}: verify_jwt={f.get('verify_jwt')}\")
"

if [[ -f .env ]]; then
  echo "[deploy-ticket-jwt] Gateway smoke (expect NOT 401 UNAUTHORIZED_NO_AUTH_HEADER):"
  # shellcheck disable=SC1091
  set -a && source .env && set +a
  code=$(curl -sS -o /tmp/tc_smoke.json -w '%{http_code}' -X POST "${VITE_SUPABASE_URL}/functions/v1/ticket-checkout" \
    -H "Content-Type: application/json" -H "apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}" -d '{}')
  echo "  ticket-checkout HTTP ${code} — body: $(head -c 120 /tmp/tc_smoke.json)"
fi
