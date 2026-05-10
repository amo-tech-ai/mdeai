#!/usr/bin/env bash
# Infisical-wrapped smoke runtime — pulls OPENAI_API_KEY (and other Mastra
# secrets) from Infisical at process start, never from on-disk .env.
#
# Prereqs:
#   1. `infisical login` (one-time) against http://localhost:80
#   2. Project 82d12c1d-c7dc-4b0e-82e2-2fca61340102 has OPENAI_API_KEY,
#      GOOGLE_GENERATIVE_AI_API_KEY, and DATABASE_URL set in env=dev
#   3. .infisical.json present in this directory
#
# Usage:
#   bash scripts/mastra-smoke-vault.sh
#   INFISICAL_ENV=staging bash scripts/mastra-smoke-vault.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_NAME="${INFISICAL_ENV:-dev}"

cd "$PROJECT_DIR"

if ! command -v infisical >/dev/null 2>&1; then
  echo "[mastra-smoke-vault] FAIL: infisical CLI not found on PATH" >&2
  exit 1
fi

if [ ! -f .infisical.json ]; then
  echo "[mastra-smoke-vault] FAIL: .infisical.json missing — run 'infisical init' or restore the file" >&2
  exit 1
fi

echo "[mastra-smoke-vault] env=${ENV_NAME} project=$(jq -r .workspaceId .infisical.json 2>/dev/null || echo unknown)"
exec infisical run --env="$ENV_NAME" --silent -- bash scripts/mastra-smoke.sh
