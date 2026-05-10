#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROC_NAME="${MASTRA_SMOKE_PROC_NAME:-my-mastra-app}"

cd "$PROJECT_DIR"

npx --yes bgproc stop "$PROC_NAME" >/dev/null 2>&1 || true
pkill -TERM -f "${PROJECT_DIR}/node_modules/.bin/mastra dev" >/dev/null 2>&1 || true
rm -f /tmp/mdeai-mastra-smoke-env.*

if ps -ef | grep -E "${PROJECT_DIR}/node_modules/.bin/mastra dev|npm run dev|npx mastra dev" | grep -v grep >/dev/null; then
  echo "[mastra-stop] Mastra dev process still running" >&2
  exit 1
fi

if ss -tulpn | grep -q ':4111 '; then
  echo "[mastra-stop] Port 4111 still has a listener" >&2
  ss -tulpn | grep ':4111 ' >&2 || true
  exit 1
fi

echo "[mastra-stop] stopped"
