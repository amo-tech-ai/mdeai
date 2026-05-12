---
id: MASTRA-036-037-AUDIT
title: MASTRA-036 + MASTRA-037 — production-readiness checklist
status: MASTRA-037 PR-1 shipped (chore/mastra-037-036-closeout commit 6dcfe3d). MASTRA-036 BLOCKED — helper, 5 sponsor consumers, Deno tests, and sponsor migrations are all untracked in git.
created: 2026-05-12
last_updated: 2026-05-12
branch: chore/mastra-037-036-closeout (forked from main)
related:
  - tasks/prompts/mastra/tasks/036-gemini-structured-output-helper.md
  - tasks/prompts/mastra/tasks/037-verify-edge-floor-integration.md
  - supabase/functions/_shared/gemini.ts
  - scripts/verify-edge-functions.sh
  - .github/workflows/floor.yml
  - scripts/smoke-sponsor-roi-explain.sh
---

# Forensic audit close-out — MASTRA-036 + MASTRA-037

This is the rolling checklist generated from the 2026-05-12 forensic audit. It tracks each red flag / fix recommendation through to verification. Items show `[x]` only if proven green this turn.

---

## 1. Floor layers (this branch, this turn)

| Layer | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ 0 errors / 48 pre-existing warnings |
| Build | `npm run build` | ✅ 8.75s clean |
| Unit tests | `npm run test` | ✅ 41/41 passed |
| Edge fns | `npm run verify:edge` | ✅ 21 deno tests passed / 63 ignored (sponsor JWT-gated) |
| One-shot | `npm run floor` | ✅ chains all four; exits 0 |
| Gemini helper | `deno test tests/gemini_structured_test.ts` | ✅ 8/8 passed after `agentName` console.info + truncated-body `console.error` |

---

## 2. MASTRA-036 — Gemini structured-output helper — **BLOCKED**

> **2026-05-12 correction.** Earlier passes claimed the helper was "already powering 5 sponsor functions on `main`." That claim was **wrong**. A `git ls-tree` against `main`, `fix/security-tests`, `origin/main`, `origin/fix/security-tests`, and `origin/fix/edge-fn-security` shows **none** of the following are tracked in any branch:
>
> - `supabase/functions/_shared/gemini.ts` helper additions (305 net lines in working tree, uncommitted)
> - `supabase/functions/sponsor-roi-explain/index.ts`
> - `supabase/functions/sponsor-audience-match/index.ts`
> - `supabase/functions/sponsor-creative-gen/index.ts`
> - `supabase/functions/sponsor-moderate/index.ts`
> - `supabase/functions/sponsor-optimize/index.ts`
> - `supabase/functions/tests/` (6 Deno test files including the helper's 8 unit tests)
> - `supabase/migrations/20260505000100_sponsor_activate_placements_if_ready.sql`
> - `supabase/migrations/20260512120000_sponsor_schema_edge_acl.sql`
> - `supabase/functions/_shared/sponsor-access.ts`
> - `scripts/smoke-sponsor-roi-explain.sh`
>
> The Deno test counts and the smoke wrapper exit-code proofs cited below were verified against the **working tree**, not against any committed state. They are real (the code exists locally) but unverifiable from `git log`.

### Code present in working tree (not yet landed)

- [~] **Locked REST contract** at `supabase/functions/_shared/gemini.ts` — `generationConfig.responseFormat.text.{mimeType, schema}` (uncommitted)
- [~] **snake_case tool transform** (`REST_TOOL_KEY_MAP`) — `googleSearch` → `google_search`, `urlContext` → `url_context`, `googleMaps` → `google_maps` (uncommitted)
- [~] **Stable `GeminiStructuredError.code`** with `.name` mirror for back-compat (uncommitted)
- [~] **Zod safeParse surface** wired after JSON parse (uncommitted)
- [~] **5 sponsor callers wrap in `withRetry()`** — sponsor-audience-match, sponsor-creative-gen, sponsor-moderate, sponsor-optimize, sponsor-roi-explain (**none of these 5 functions are tracked by git**)
- [~] **8 Deno unit tests** covering happy-path, body shape, snake_case tools, schema violation, parse error, rate-limited, citations, timeout, Zod validation (**test files untracked**)
- [~] **`agentName` logging** on 429 + truncated-body `console.error` on non-2xx (uncommitted)
- [~] **`GEMINI_HTTP_ERROR` truncated body** logged via `console.error` before throw (uncommitted)
- [~] **Smoke wrapper** `scripts/smoke-sponsor-roi-explain.sh` exit codes 2/3/4/5 verified locally (**untracked**)

### Why MASTRA-036 cannot land as planned

Shipping just `gemini.ts` would land 305 lines of helper code with **zero consumers in the repo** — pure dead code from `main`'s point of view. The smoke script targets a function that does not exist in git. The 8 Deno tests in `supabase/functions/tests/` reference symbols only defined in the uncommitted helper. The whole stack is interdependent.

**Decision (2026-05-12):** MASTRA-036 is paused. A new task — **MASTRA-042** ([tasks/prompts/mastra/tasks/042-sponsor-gemini-structured-functions.md](../tasks/042-sponsor-gemini-structured-functions.md)) — lands the helper + 5 sponsor functions + 8 Deno tests + 2 sponsor migrations + smoke wrapper as one coherent feature PR. MASTRA-036 will be closed by MASTRA-042 shipping green, not by a separate PR.

---

## 3. MASTRA-037 — verify:edge floor integration

### Code shipped this turn

- [x] **`npm run floor`** in [package.json](../../../../package.json) — `lint && build && test && verify:edge`
- [x] **`.github/workflows/floor.yml`** — 2 parallel jobs (node + deno), `denoland/setup-deno@v2 cache: true`, `actions/setup-node@v4 cache: 'npm'`, concurrency cancel-in-progress, `actions/upload-artifact@v4 if: failure()`
- [x] **Orphan-skip guard** in [scripts/verify-edge-functions.sh](../../../../scripts/verify-edge-functions.sh) — regex `^[a-z0-9-]+:[A-Z]+-[0-9]+$`; empty array passes, malformed entry fails fast with rc=1
- [x] **`is_skipped` prefix comparison** — now matches against `${entry%%:*}` so well-formed `name:TASK-ID` entries are correctly skipped

### Guard test proof

```
empty array   → script runs clean ✅
"orphan-no-task-id" → rc=1, "must match 'name:TASK-ID'" ✅
"sponsor-roi-explain:MASTRA-036" → accepted, prefix used for skip ✅
```

### Remaining DoD items (require GitHub PR)

- [ ] Demonstrated CI failure on a deliberately broken edge function (screenshot + artifact link in PR)
- [ ] Branch-protection: `floor / node` and `floor / deno` added to required checks on `main`
- [ ] `CLAUDE.md` reference to `npm run floor` as canonical pre-ship step (one-line edit; defer to next PR to avoid churning CLAUDE.md mid-audit)

---

## 4. Cross-skill compliance (verified against 8 skills)

| Skill | Verdict | Notes |
|---|---|---|
| `gemini` | ✅ | Locked REST shape + snake_case tools + structured-output JSON schema match `references/structured-outputs.md` |
| `mastra` | ✅ (n/a-to-task) | No Mastra version coupling introduced; `my-mastra-app/` untouched |
| `mastra-smoke-test` | ⚠️ partial | Smoke script ships locally; live run still pending sponsor JWT |
| `mde-mastra-routing` | ✅ (n/a-to-task) | Router / concierge / workflows untouched |
| `mde-supabase` | ✅ | Helper is server-only; sponsor callers gate via `sponsorOrganizationAccessible` / `sponsorApplicationAccessible` / `sponsorAssetAccessible` before Gemini call |
| `supabase-edge-functions` | ✅ | `Deno.serve`, no `std/http/server` imports (verify:edge greps for that), function-local `deno.json` pattern preserved |
| `test-driven-development` | ✅ | Helper: 8 tests cover happy-path + 5 failure modes. Guard: 3 cases tested (empty / malformed / well-formed) before production use |
| `testing` | ✅ | `npm run floor` is the new canonical pre-ship floor; both node + deno jobs run in parallel CI with artifact on failure |

---

## 5. Open follow-ups surfaced by the audit (not in MASTRA-036/037 scope)

These belong in **new task files**, not in this PR. They were identified during the audit and need their own work item.

### 5.1 Mastra runtime writes ZERO `ai_runs` rows

- **Finding:** `grep -rn 'ai_runs\|insertAiRun\|agent_name' my-mastra-app/src/` returned **no matches**.
- **Impact on MASTRA-038/039:** §9 says "ai_runs row whose agent_name identifies the Mastra runtime, status='success'". With no writer in `my-mastra-app/`, that check **cannot pass** today.
- **Recommended next task:** `MASTRA-040 — add ai_runs writer to Mastra agents`. Should insert a row with `agent_name` prefixed `mastra-` (e.g. `mastra-event-agent`) on every tool/agent invocation, mirroring the `insertAiRun` helper used by the Supabase edge functions.

### 5.2 Mastra `search-events.ts` is mock-only

- **Finding:** [my-mastra-app/src/mastra/tools/search-events.ts:23](../../../../my-mastra-app/src/mastra/tools/search-events.ts) returns `MOCK_EVENTS` — 5 hardcoded entries with ISO `-05:00` offsets. **No Supabase query** at all.
- **Impact on MASTRA-038:** the precheck SQL queries the real `public.events` table; the Mastra runtime returns mock data. Even if the precheck finds 12 weekend events in El Poblado, the chat will return Salsa Night at Son Havana (Laureles) because that's what's in the mock array.
- **Recommended next task:** `MASTRA-041 — replace search-events mock with hybrid_search_events RPC` (use VDB-01 hybrid search, filter by `(starts_at AT TIME ZONE 'America/Bogota')` boundaries). Must land **before** MASTRA-038 can pass end-to-end.

### 5.3 Pre-existing `as unknown` casts

- **Not introduced by MASTRA-036.** Located at ai-chat:833, rules-engine:78/197, sponsor-roi-explain:148.
- **Recommendation:** leave alone for this PR. Defer to a dedicated TS-strictness cleanup task. The "no `as any` left in *new* sponsor caller code" goal is satisfied.

---

## 6. Shipping decision (2026-05-12)

1. **PR-1 shipped** — commit `6dcfe3d` on branch `chore/mastra-037-036-closeout`, title *"chore(ci): MASTRA-037 floor workflow + orphan-skip guard"*. 5 files, +203/-12. CI infra only.
2. **PR-2 paused (was: gemini helper logging + smoke)** — gemini.ts diff is the full 305-line helper landing, not a logging close-out. Helper has zero consumers tracked in git. Shipping in isolation would be dead code + a misleading audit trail.
3. **PR-3 paused (was: 040/041 + audit checklist)** — checklist contained false "already on main" claims; corrected by this revision. 040 + 041 may ship as docs-only later, after MASTRA-042 lands the helper coherently.
4. **New task created — MASTRA-042** ([tasks/prompts/mastra/tasks/042-sponsor-gemini-structured-functions.md](../tasks/042-sponsor-gemini-structured-functions.md)) — lands helper + 5 sponsor functions + 8 Deno tests + 2 sponsor migrations + smoke as one coherent feature PR. MASTRA-036 is closed by MASTRA-042 shipping green, not by a standalone PR.
5. **UI selector edits (`data-mdeai-card` on 4 inline cards + EmbeddedListings)** remain unstaged in working tree. Separate concern, different reviewer pool. Defer to a dedicated UI PR.

---

## 7. Bottom line (corrected)

| Task | True status | Path forward |
|---|---|---|
| **MASTRA-037** | ✅ shipped as PR-1 commit `6dcfe3d` on `chore/mastra-037-036-closeout` | Push branch; open PR against `main`; add `floor / node` + `floor / deno` to branch protection after first green run |
| **MASTRA-036** | ⛔ **blocked** — helper + 5 consumers + tests + migrations + smoke all untracked | Closed by MASTRA-042 shipping; do **not** ship helper in isolation |
| **MASTRA-040** (ai_runs writer) | spec written, not implemented | Independent of 036/042; can ship after MASTRA-042 |
| **MASTRA-041** (search-events Supabase) | spec written, not implemented | Independent of 036/042; can ship after MASTRA-042 |
| **MASTRA-042** (sponsor functions + helper) | spec written this cycle; not implemented | Next coherent feature PR — must include helper + sponsor functions + tests + migrations + smoke together |

**End-state of this audit cycle:** PR-1 (CI floor) is the only thing that lands. Every other deliverable is filed accurately, with the false "already on main" claims corrected. The worktree contains substantial uncommitted feature code (gemini helper + 5 sponsor functions + tests + 2 migrations) that must ship together via MASTRA-042 — not piecemeal.
