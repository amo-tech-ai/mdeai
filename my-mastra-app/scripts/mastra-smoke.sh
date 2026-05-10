#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROC_NAME="${MASTRA_SMOKE_PROC_NAME:-my-mastra-app}"
PORT="${MASTRA_PORT:-4111}"
BASE_URL="http://localhost:${PORT}"
NVM_NODE_BIN="${HOME}/.nvm/versions/node/v22.22.2/bin"
KEEP_RUNNING="${MASTRA_SMOKE_KEEP_RUNNING:-0}"
CLEAN_ORPHANS="${MASTRA_SMOKE_CLEAN_ORPHANS:-1}"
SMOKE_DATABASE_URL="${MASTRA_SMOKE_DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
SMOKE_ENV_FILE=""

if [ -d "$NVM_NODE_BIN" ]; then
  export PATH="$NVM_NODE_BIN:$PATH"
  hash -r
fi

cd "$PROJECT_DIR"

log() {
  printf '[mastra-smoke] %s\n' "$*"
}

fail() {
  printf '[mastra-smoke] FAIL: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

cleanup() {
  if [ "$KEEP_RUNNING" != "1" ]; then
    npx --yes bgproc stop "$PROC_NAME" >/dev/null 2>&1 || true
    if [ "$CLEAN_ORPHANS" = "1" ]; then
      pkill -TERM -f "${PROJECT_DIR}/node_modules/.bin/mastra dev" >/dev/null 2>&1 || true
    fi
  fi
  if [ -n "$SMOKE_ENV_FILE" ] && [ "$KEEP_RUNNING" != "1" ]; then
    rm -f "$SMOKE_ENV_FILE"
  fi
}

trap cleanup EXIT

require_cmd node
require_cmd npm
require_cmd curl
require_cmd npx
require_cmd ss

log "project=$PROJECT_DIR"
log "node=$(node -v)"
log "npm=$(npm -v)"

node -e "const v=process.versions.node.split('.').map(Number); if (v[0] < 22 || (v[0] === 22 && v[1] < 13)) process.exit(1)" \
  || fail "Node must be >=22.13.0"

node -e "
const pkg = require('./package.json');
const required = ['@mastra/core', '@mastra/pg', '@mastra/client-js', 'mastra'];
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const missing = required.filter((name) => !deps[name]);
if (missing.length) {
  console.error(missing.join(','));
  process.exit(1);
}
" || fail "required Mastra packages missing"

env_value() {
  local key="$1"
  local v="${!key:-}"
  if [ -n "$v" ]; then
    printf '%s' "$v"
    return 0
  fi
  if [ -f .env ]; then
    local line
    line="$(grep -E "^${key}=" .env | tail -n1 || true)"
    if [ -n "$line" ]; then
      printf '%s' "${line#${key}=}"
      return 0
    fi
  fi
  return 1
}

env_source() {
  if [ -n "${!1:-}" ]; then
    printf 'process-env'
  elif [ -f .env ] && grep -q "^${1}=" .env 2>/dev/null; then
    printf 'dotenv'
  else
    printf 'missing'
  fi
}

for key in OPENAI_API_KEY GOOGLE_GENERATIVE_AI_API_KEY DATABASE_URL; do
  src="$(env_source "$key")"
  if [ "$src" = "missing" ]; then
    fail "${key} not found in process env or .env (Infisical/agent-vault: run via \`infisical run -- npm run smoke:runtime\`)"
  fi
  log "${key}=present (source=${src})"
done

if command -v pg_isready >/dev/null 2>&1 && pg_isready -d "$SMOKE_DATABASE_URL" >/dev/null 2>&1; then
  export DATABASE_URL="$SMOKE_DATABASE_URL"
  SMOKE_ENV_FILE="$(mktemp /tmp/mdeai-mastra-smoke-env.XXXXXX)"
  chmod 600 "$SMOKE_ENV_FILE"
  for key in OPENAI_API_KEY GOOGLE_GENERATIVE_AI_API_KEY MODEL; do
    val="$(env_value "$key" || true)"
    if [ -n "$val" ]; then
      printf '%s=%s\n' "$key" "$val" >> "$SMOKE_ENV_FILE"
    fi
  done
  printf 'DATABASE_URL=%s\n' "$SMOKE_DATABASE_URL" >> "$SMOKE_ENV_FILE"
  log "DATABASE_URL=using-local-smoke-db"
else
  SMOKE_ENV_FILE=".env"
  log "DATABASE_URL=using-dotenv-value"
fi

log "typecheck"
npm run typecheck

log "build"
npm run build

log "health"
health_output="$(npm run health --silent)"
printf '%s\n' "$health_output" | grep -q '"ok":true' || fail "health output did not contain ok=true"
printf '%s\n' "$health_output" | grep -q '"storage":"postgres"' || fail "health output did not report postgres storage"

log "stop existing bgproc"
npx --yes bgproc stop "$PROC_NAME" >/dev/null 2>&1 || true

if [ "$CLEAN_ORPHANS" = "1" ]; then
  log "clean project-scoped orphan mastra dev processes"
  pkill -TERM -f "${PROJECT_DIR}/node_modules/.bin/mastra dev" >/dev/null 2>&1 || true
  sleep 1
fi

if ss -tulpn | grep -q ":${PORT} "; then
  ss -tulpn | grep ":${PORT} " >&2 || true
  fail "port ${PORT} is already listening before smoke start"
fi

log "start dev server"
MASTRA_DEV_NO_CACHE=1 npx --yes bgproc start -n "$PROC_NAME" -- npx mastra dev --env "$SMOKE_ENV_FILE" >/tmp/mastra-smoke-bgproc-start.json
cat /tmp/mastra-smoke-bgproc-start.json

log "wait for ${BASE_URL}"
ready=0
for _ in $(seq 1 60); do
  if curl -fsS "$BASE_URL" >/tmp/mastra-smoke-root.html 2>/tmp/mastra-smoke-root.err; then
    ready=1
    break
  fi
  sleep 1
done

if [ "$ready" != "1" ]; then
  cat /tmp/mastra-smoke-root.err >&2 || true
  npx --yes bgproc logs "$PROC_NAME" --tail 120 >&2 || true
  fail "Studio root did not answer on ${BASE_URL}"
fi

curl -fsS "${BASE_URL}/swagger-ui" >/tmp/mastra-smoke-swagger.html \
  || fail "Swagger UI did not answer on ${BASE_URL}/swagger-ui"

ss -tulpn | grep ":${PORT} " >/tmp/mastra-smoke-listener.txt \
  || fail "no listener found for port ${PORT}"

log "probe agent.generate (ping-agent)"
ping_http_code="$(curl -sS -o /tmp/mastra-smoke-ping.json -w '%{http_code}' \
  -X POST "${BASE_URL}/api/agents/ping-agent/generate" \
  -H 'content-type: application/json' \
  --data '{"messages":"ping"}' || echo 000)"
if [ "$ping_http_code" != "200" ]; then
  cat /tmp/mastra-smoke-ping.json >&2 || true
  fail "agent.generate ping-agent returned HTTP ${ping_http_code} (expected 200)"
fi
node -e "
const r = require('/tmp/mastra-smoke-ping.json');
const text = (r && (r.text ?? r.content ?? r.message ?? '')) || JSON.stringify(r);
if (!text || typeof text !== 'string') { console.error('no text in agent response'); process.exit(1); }
process.stdout.write(text.slice(0, 200));
" >/tmp/mastra-smoke-ping-text.txt || fail "ping-agent response missing text field"
log "ping-agent text=$(cat /tmp/mastra-smoke-ping-text.txt | tr '\n' ' ' | head -c 200)"

log "probe workflow.start-async (weather-workflow Madrid)"
wf_http_code="$(curl -sS -o /tmp/mastra-smoke-wf.json -w '%{http_code}' \
  -X POST "${BASE_URL}/api/workflows/weather-workflow/start-async" \
  -H 'content-type: application/json' \
  --data '{"inputData":{"city":"Madrid"}}' || echo 000)"
if [ "$wf_http_code" != "200" ]; then
  cat /tmp/mastra-smoke-wf.json >&2 || true
  fail "workflow.start-async weather-workflow returned HTTP ${wf_http_code} (expected 200)"
fi
node -e "
const r = require('/tmp/mastra-smoke-wf.json');
const status = r && r.status;
const traceId = r && r.traceId;
const stepPath = r && r.stepExecutionPath;
if (!status || !traceId || !Array.isArray(stepPath)) {
  console.error('workflow response missing status/traceId/stepExecutionPath: ' + JSON.stringify(r).slice(0, 300));
  process.exit(1);
}
const isExternalTimeout = status === 'failed'
  && r.error
  && (r.error.code === 'ETIMEDOUT' || (r.error.cause && r.error.cause.code === 'ETIMEDOUT'));
const note = isExternalTimeout ? ' (external-network-blocked, runtime path verified)' : '';
console.log('status=' + status + ' traceId=' + traceId + ' steps=' + stepPath.join(',') + note);
" >/tmp/mastra-smoke-wf-status.txt || fail "weather-workflow runtime path not exercised (missing status/traceId/stepExecutionPath)"
log "weather-workflow $(cat /tmp/mastra-smoke-wf-status.txt)"

log "probe agent.generate (router-agent)"
router_http_code="$(curl -sS -o /tmp/mastra-smoke-router.json -w '%{http_code}' \
  -X POST "${BASE_URL}/api/agents/router-agent/generate" \
  -H 'content-type: application/json' \
  --data '{"messages":"I need a 2-bedroom apartment in El Poblado under 100 USD"}' || echo 000)"
if [ "$router_http_code" != "200" ]; then
  cat /tmp/mastra-smoke-router.json >&2 || true
  fail "agent.generate router-agent returned HTTP ${router_http_code} (expected 200)"
fi
log "router-agent HTTP 200"

log "probe agent.generate (concierge-agent)"
concierge_http_code="$(curl -sS -o /tmp/mastra-smoke-concierge.json -w '%{http_code}' \
  -X POST "${BASE_URL}/api/agents/concierge-agent/generate" \
  -H 'content-type: application/json' \
  --data '{"messages":"Find me a salsa night in Laureles under 20 USD"}' || echo 000)"
if [ "$concierge_http_code" != "200" ]; then
  cat /tmp/mastra-smoke-concierge.json >&2 || true
  fail "agent.generate concierge-agent returned HTTP ${concierge_http_code} (expected 200)"
fi
log "concierge-agent HTTP 200"

log "probe workflow.start-async (rental-search-workflow Poblado)"
rental_http_code="$(curl -sS -o /tmp/mastra-smoke-rental.json -w '%{http_code}' \
  -X POST "${BASE_URL}/api/workflows/rental-search-workflow/start-async" \
  -H 'content-type: application/json' \
  --data '{"inputData":{"neighborhood":"El Poblado","minBedrooms":2,"maxPricePerNight":150,"limit":5}}' || echo 000)"
if [ "$rental_http_code" != "200" ]; then
  cat /tmp/mastra-smoke-rental.json >&2 || true
  fail "workflow.start-async rental-search-workflow returned HTTP ${rental_http_code} (expected 200)"
fi
node -e "
const r = require('/tmp/mastra-smoke-rental.json');
if (r.status !== 'success') { console.error('expected status=success got=' + JSON.stringify(r).slice(0,400)); process.exit(1); }
const cards = r.result && r.result.cards;
if (!Array.isArray(cards) || cards.length === 0) { console.error('rental-search-workflow returned no cards: ' + JSON.stringify(r).slice(0,400)); process.exit(1); }
console.log('status=' + r.status + ' cards=' + cards.length + ' first=' + cards[0].headline);
" >/tmp/mastra-smoke-rental-status.txt || fail "rental-search-workflow did not return cards"
log "rental-search-workflow $(cat /tmp/mastra-smoke-rental-status.txt)"

log "probe workflow.start-async (event-discovery-workflow nightlife)"
event_http_code="$(curl -sS -o /tmp/mastra-smoke-event.json -w '%{http_code}' \
  -X POST "${BASE_URL}/api/workflows/event-discovery-workflow/start-async" \
  -H 'content-type: application/json' \
  --data '{"inputData":{"category":"nightlife","limit":5}}' || echo 000)"
if [ "$event_http_code" != "200" ]; then
  cat /tmp/mastra-smoke-event.json >&2 || true
  fail "workflow.start-async event-discovery-workflow returned HTTP ${event_http_code} (expected 200)"
fi
node -e "
const r = require('/tmp/mastra-smoke-event.json');
if (r.status !== 'success') { console.error('expected status=success got=' + JSON.stringify(r).slice(0,400)); process.exit(1); }
const cards = r.result && r.result.cards;
if (!Array.isArray(cards) || cards.length === 0) { console.error('event-discovery-workflow returned no cards: ' + JSON.stringify(r).slice(0,400)); process.exit(1); }
console.log('status=' + r.status + ' cards=' + cards.length + ' first=' + cards[0].headline);
" >/tmp/mastra-smoke-event-status.txt || fail "event-discovery-workflow did not return cards"
log "event-discovery-workflow $(cat /tmp/mastra-smoke-event-status.txt)"

log "listener proof"
cat /tmp/mastra-smoke-listener.txt

log "bgproc proof"
npx --yes bgproc list

if [ "$KEEP_RUNNING" = "1" ]; then
  log "PASS runtime smoke; server left running because MASTRA_SMOKE_KEEP_RUNNING=1"
  log "temporary smoke env file retained until bgproc is stopped"
else
  log "PASS runtime smoke; server will be stopped by cleanup"
fi
