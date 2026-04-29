#!/usr/bin/env bash
# Project gates for mdeai.co — bundled by .claude/skills/mdeai-project-gates/.
#
# Runs gates in order, fails fast on the first non-zero exit. Adapts the
# gate set to what the current PR touches so we don't run check:bundle
# when no .ts/.tsx changed, and don't run verify:edge when no edge fn
# changed.
#
# Usage: bash .claude/skills/mdeai-project-gates/scripts/run-gates.sh
# Or via npm: add "gates": "bash .claude/skills/mdeai-project-gates/scripts/run-gates.sh"

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

GATES=(lint test build)

# Detect what kind of change this PR introduces. Compare against HEAD
# (working tree) to capture both staged + unstaged changes.
diff_files=$(git diff --name-only HEAD 2>/dev/null || true)

if printf '%s\n' "$diff_files" | grep -qE '^supabase/functions/'; then
  GATES+=(verify:edge)
fi
if printf '%s\n' "$diff_files" | grep -qE '^(src/|package\.json|vite\.config|index\.html)'; then
  GATES+=(check:bundle)
fi

echo "Gates to run: ${GATES[*]}"
echo ""

for gate in "${GATES[@]}"; do
  echo "──────── npm run $gate ────────"
  if ! npm run "$gate" --silent; then
    echo ""
    echo "❌ Gate failed: $gate"
    echo "Read the failure carefully. If the gate is lint, check whether"
    echo "the new errors are from YOUR files (444 pre-existing baseline"
    echo "is acceptable; new ones are not). If verify:edge, check the"
    echo "deno test output. If check:bundle, see scripts/check-bundle-size.mjs."
    exit 1
  fi
  echo ""
done

echo ""
echo "✅ All ${#GATES[@]} gates passed: ${GATES[*]}"
echo ""
echo "Reminders before commit:"
echo "  - Schema changes? Run mcp get_advisors (security + performance)"
echo "  - UI changes? Browser proof via claude-preview-browser-testing"
echo "  - Stage only the files this PR touches (no 'git add .')"
