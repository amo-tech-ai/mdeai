#!/usr/bin/env bash
# Starts the Mastra dev server with secrets sourced from /home/sk/mde/.env.local.
# Runs permanently via bgproc (survives shell exit). Use mastra-stop.sh to stop.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_ENV="${MASTRA_ROOT_ENV:-/home/sk/mde/.env.local}"
NVM_NODE_BIN="${HOME}/.nvm/versions/node/v22.22.2/bin"
LOCAL_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
PROC_NAME="${MASTRA_PROC_NAME:-my-mastra-app}"

if [ -d "$NVM_NODE_BIN" ]; then
  export PATH="$NVM_NODE_BIN:$PATH"
  hash -r
fi

cd "$PROJECT_DIR"

log() { printf '[mastra-start] %s\n' "$*"; }
fail() { printf '[mastra-start] FAIL: %s\n' "$*" >&2; exit 1; }

[ -f "$ROOT_ENV" ] || fail "root env file not found: $ROOT_ENV"

# Read key from root .env.local (VITE_GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY)
gemini_key="$(grep -E "^(VITE_GEMINI_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY)=" "$ROOT_ENV" \
  | tail -n1 | cut -d= -f2- | tr -d '"' || true)"
[ -n "$gemini_key" ] || fail "VITE_GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY not found in $ROOT_ENV"

openai_key="$(grep -E "^OPENAI_API_KEY=" "$ROOT_ENV" | tail -n1 | cut -d= -f2- | tr -d '"' || true)"

# Build temp env file (written to /tmp, not .env*)
ENV_FILE="$(mktemp /tmp/mdeai-mastra-start.XXXXXX)"
chmod 600 "$ENV_FILE"
trap 'rm -f "$ENV_FILE"' EXIT

printf 'GOOGLE_GENERATIVE_AI_API_KEY=%s\n' "$gemini_key" >> "$ENV_FILE"
[ -n "${openai_key:-}" ] && printf 'OPENAI_API_KEY=%s\n' "$openai_key" >> "$ENV_FILE"
printf 'DATABASE_URL=%s\n' "$LOCAL_DB_URL" >> "$ENV_FILE"

log "GOOGLE_GENERATIVE_AI_API_KEY=present"
log "DATABASE_URL=$LOCAL_DB_URL"

# Stop any existing instance
npx --yes bgproc stop "$PROC_NAME" >/dev/null 2>&1 || true
pkill -TERM -f "${PROJECT_DIR}/node_modules/.bin/mastra" >/dev/null 2>&1 || true
sleep 2

log "starting $PROC_NAME on port 4111..."
MASTRA_DEV_NO_CACHE=1 npx --yes bgproc start -n "$PROC_NAME" -w -- \
  npx mastra dev --env "$ENV_FILE"

# Wait for the server to be ready
for _ in $(seq 1 30); do
  if curl -fsS http://localhost:4111 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

curl -fsS http://localhost:4111 >/dev/null 2>&1 || fail "server did not start on port 4111"

log "server ready → http://localhost:4111/agents"
npx --yes bgproc list
