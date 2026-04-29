---
name: mdeai-project-gates
description: "Use BEFORE every commit/push in mdeai.co. Forces the lint + test + build + edge + bundle + browser-proof sequence. Triggers: any 'I'm done', 'ready to commit', 'time to push' moment, OR after any code change that touches src/, supabase/functions/, or supabase/migrations/. Built on verification-before-completion (skills.sh)."
metadata:
  source: https://skills.sh/ (verification-before-completion)
  installed: 2026-04-29
  version: "0.1.0"
  origin: external concept + mdeai.co npm-script adaptations
  baseline_lint_errors: 444
  baseline_test_count: 86
  bundle_budget_index_kb: 100
---

# Project gates — mdeai.co

Five gates, in order. **Skipping any of these has shipped real bugs in V1** — D3 Rules-of-Hooks would've been caught by gate 4 before merge; D4 missing FK indexes by `get_advisors` after gate 3.

## Quick path — bundled script

For most PRs, just run the bundled wrapper. It detects what changed and only runs the relevant gates:

```bash
bash .claude/skills/mdeai-project-gates/scripts/run-gates.sh
```

The script always runs lint + test + build, and conditionally adds `verify:edge` (if `supabase/functions/` changed) and `check:bundle` (if `src/` or build config changed). Fails fast on any non-zero exit. Use the matrix below when you need to run individual gates by hand.

## Gate matrix

| # | Command | When required | Expected |
|---|---|---|---|
| 1 | `npm run lint` | Every PR | exit 0; **444 pre-existing problems baseline** — flag any DELTA over baseline |
| 2 | `npm run test` | Every PR | All passing; current baseline **86/86** across 15 files |
| 3 | `npm run build` | Every PR | Clean exit; <5s on warm cache |
| 4 | `npm run check:bundle` | When bundle could grow (any new dep, any new chunk, any vendor split change) | 10/10 chunks within budget; index gzip ≤ 100 KB |
| 5 | `npm run verify:edge` | When `supabase/functions/` changed | All deno tests pass + `deno check` clean |

Plus the non-script gate:

| # | Action | When required |
|---|---|---|
| 6 | **Browser proof** via `claude-preview-browser-testing` | Any UI change |
| 7 | **Schema audit** via `mcp_get_advisors` | Any DDL (migration / RLS / index change) |

## Lint baseline (gate 1)

Last seen baseline: **444 problems (313 errors, 131 warnings)**, all pre-existing. Current acceptance:

- New `.tsx`/`.ts` files: **zero issues** (we caught zero D2-D5 issues this way)
- Modified files: **no NEW issues** beyond what was there at HEAD
- Generated files (`database.types.ts`): excluded — `eslint.config.js` ignores them

If the count rises, identify whether a new file introduced a `:any` / `console.log` / unused-var. If yes, fix before commit. If a generated file expanded the count, add it to the eslint ignore list.

## Test baseline (gate 2)

Current: 86 tests across 15 files. Going down without a deletion-justifying commit message is a red flag.

If a test starts failing on a CHANGE you didn't cause, run the failure through `systematic-debugging` rather than deleting it.

## Bundle budget (gate 4)

Tracked in `scripts/check-bundle-size.mjs`. Per-chunk gzip ceilings:

| Chunk | Budget | Why |
|---|---|---|
| `index-*.js` (entry) | 100 KB | First-paint cost |
| `radix-*.js` | 100 KB | Lazy but heavy if used |
| `posthog-*.js` | 70 KB | |
| `supabase-*.js` | 60 KB | |
| `gadget-*.js` | 60 KB | |
| `sentry-*.js` | 35 KB | |
| `forms-*.js` | 30 KB | |
| `dates-*.js` | 25 KB | |
| `icons-*.js` | 20 KB | |
| `tanstack-*.js` | 20 KB | |

To bump a budget: requires PR description note + reviewer signoff. Don't unilaterally raise it because "my change made it bigger" — that's the problem.

## Edge function checks (gate 5)

`npm run verify:edge` runs `deno check` (TypeScript) + `deno test` over `supabase/functions/tests/`. Use when:

- Adding a new `supabase/functions/<name>/index.ts`
- Modifying `_shared/*.ts` (every function imports these)
- Adding a deno test
- Updating `supabase/functions/deno.json` import map

## Schema audit (gate 7)

After ANY migration or schema change, run:

```ts
mcp__ed3787fc-985d-4fc2-87ac-e09815d3583a__get_advisors({
  project_id: "zkwcbyxiwklihegjhuql",
  type: "security"
})
// And:
mcp__ed3787fc-985d-4fc2-87ac-e09815d3583a__get_advisors({
  project_id: "zkwcbyxiwklihegjhuql",
  type: "performance"
})
```

Look for new ERROR-level findings on tables YOU touched (skip pre-existing on `spatial_ref_sys`, `proactive_suggestions`, etc — those are unrelated).

D4 audit caught 2 missing FK indexes this way. D1 would've caught them too if we'd run advisors.

## Commit + push (final gate)

Once all 5 gates green + browser proof attached + schema audit clean:

```bash
# Stage only the files THIS PR touches — list them explicitly. `git add .`
# is dangerous because it can sweep in untracked drafts, secrets that
# weren't supposed to be tracked, or files from a parallel experiment.
# The 2026-04-29 incident (700 files swept by `git stash push -u`) is
# the same risk class.
git add <file-1> <file-2> ...

git commit -m "..."  # follow the commit-commands:commit skill

# HTTP/1.1 fallback: Vercel/GitHub sometimes drops HTTP/2 push streams
# from this network. Caught during D2 — the flag bypasses the issue.
git -c http.version=HTTP/1.1 push \
  https://x-access-token:$TOKEN@github.com/amo-tech-ai/mdeai.git \
  fix/chat-production-hardening
```

## The contract

**Don't say "I'm done" unless gates 1-7 are all green.** This is the single rule that would've saved every "we shipped a bug" cycle in V1 D1-D5.

## Companion skills

- `systematic-debugging` — for any gate failure
- `claude-preview-browser-testing` — gate 6 implementation
- `vitest-component-testing` — gate 2 implementation
- `supabase-edge-functions` — gate 5 implementation
- `supabase` — gate 7 implementation
- `commit-commands:commit-push-pr` — the commit + push step itself
