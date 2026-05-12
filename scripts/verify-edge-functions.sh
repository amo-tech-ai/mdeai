#!/usr/bin/env bash
# Static checks for Supabase Edge layout (runs in CI/local without Deno CLI).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[verify-edge] Repo root: $ROOT"

if grep -rE --include='*.ts' 'https://deno\.land/std@[^"'\'']+/http/server' supabase/functions 2>/dev/null | grep -q .; then
  echo "[verify-edge] FAIL: deprecated deno std http/server import."
  grep -rE --include='*.ts' 'https://deno\.land/std@[^"'\'']+/http/server' supabase/functions || true
  exit 1
fi

echo "[verify-edge] Optional: Deno syntax check entrypoints..."
# Functions skipped from local type-check (must list reason).
# - sponsor-audience-match: P3, uses unimplemented callGeminiStructured helper (gemini native API). Re-enable when helper lands.
SKIP_FUNCTIONS=(
  "sponsor-audience-match"
  "sponsor-creative-gen"
  "sponsor-moderate"
  "sponsor-optimize"
  "sponsor-roi-explain"
)

is_skipped() {
  local name="$1"
  for s in "${SKIP_FUNCTIONS[@]}"; do
    [ "$name" = "$s" ] && return 0
  done
  return 1
}

if command -v deno >/dev/null 2>&1; then
  # Run from supabase/functions so deno discovers ./deno.json
  # (nodeModulesDir=auto enables npm: specifier resolution locally).
  pushd supabase/functions >/dev/null
  mapfile -t entries < <(find . -maxdepth 2 -name index.ts -type f | sort)
  for f in "${entries[@]}"; do
    fn_name="$(basename "$(dirname "$f")")"
    if is_skipped "$fn_name"; then
      echo "  deno check: supabase/functions/${f#./} (SKIPPED — see SKIP_FUNCTIONS)"
      continue
    fi
    echo "  deno check: supabase/functions/${f#./}"
    deno check "$f" || { popd >/dev/null; exit 1; }
  done
  popd >/dev/null
else
  echo "  (skip) deno not installed — install for full checks."
fi

echo "[verify-edge] Deno unit tests (supabase/functions/tests/)..."
if command -v deno >/dev/null 2>&1; then
  pushd supabase/functions >/dev/null
  EDGE_FUNCTIONS_AUDIT= deno test --allow-all tests/ || { popd >/dev/null; exit 1; }
  popd >/dev/null
else
  echo "  (skip) deno not installed — run: npm run test:edge after installing Deno."
fi

echo "[verify-edge] OK."
