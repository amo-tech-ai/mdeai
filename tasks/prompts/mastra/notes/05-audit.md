---
title: Meta-Audit of 04-audit.md
status: Reference
created: 2026-05-10
audits: ./04-audit.md
companions:
  - ./21-mastra-repos-templates.md
  - ./22-mastra-repos-extract-tasks.md
  - ./23-mastra-modules-verified.md
  - ../../../.claude/skills/mastra/links.md
scope: Verify each claim in 04-audit.md against the actual repo state (2026-05-10), separate real bugs from false alarms, and produce a single corrective punch-list.
---

# 05 — Meta-Audit of 04-audit.md

> **Why this doc exists.** [04-audit.md](./04-audit.md) is detailed but mixes confirmed bugs with false alarms (claims about missing files, dead packages, stale state). Implementing every "fix" without verification would burn cycles. This doc grades each 04-claim — **CONFIRMED / DISPUTED / WRONG / NOT VERIFIED** — with evidence, then collapses the verified bugs into one punch-list ordered by ship-impact.

---

## A. Method

Each claim was checked against the live repo state on 2026-05-10:

- File existence via `ls`/Glob
- Frontmatter status via `grep -m1 "^status:"`
- Package state via [my-mastra-app/package.json](../../../my-mastra-app/package.json)
- DB shapes via [supabase/migrations/](../../../supabase/migrations/)
- External claims via official Mastra docs (verified in [23-mastra-modules-verified.md](./23-mastra-modules-verified.md))

Verdict legend:

- ✅ **Confirmed** — the bug is real, fix it
- 🟡 **Partially correct** — the underlying concern exists but the framing is wrong
- ❌ **Wrong** — claim does not survive contact with the repo
- 🔵 **Not verified** — needs runtime/operator action to confirm (Studio running, etc.)

---

## B. Claim-by-claim Grading

### B.1 Section "Hard Blockers" (04-audit §3)

| 04 claim | Verdict | Evidence | Action |
|---|---|---|---|
| `MASTRA-001` and `MASTRA-002` status drift | ✅ Confirmed | `grep status:` shows [001](../tasks/001-mastra-source-inventory.md) + [002](../tasks/002-mastra-core-runtime-scaffold.md) say `Not Started`; [mastra-source-inventory.md](../../../mastra/mastra-source-inventory.md) says `Complete`; [my-mastra-app/](../../../../my-mastra-app/) exists with packages installed. | Fix B+1 below. |
| `MASTRA-012`–`019` are short-form specs | 🟡 Partially correct | Files exist with full YAML + summary + acceptance, but **are shorter than 001–011's purpose/wiring/red-flag sections**. They are executable but lighter. | Optional expansion only when each task is picked up — don't pre-bloat all seven. |
| Dependency IDs mismatch external tasks (`RE-*`, `EVT-071`) | ✅ Confirmed | [008:13](../tasks/008-mastra-restaurants-mvp-discovery.md) references `EVT-071`; actual file is [tasks/prompts/event_prompts/071-restaurant-reservations-schema.md](../../event_prompts/071-restaurant-reservations-schema.md). [04-audit §4](./04-audit.md) already noted this. | Add an alias map in [000-index.md](../tasks/000-index.md), or normalize IDs. |
| VDB local/remote drift | 🟡 Partially correct | Local migration [20260509205216_pgvector_semantic_search.sql](../../../../supabase/migrations/20260509205216_pgvector_semantic_search.sql) creates `semantic_search_*` RPCs. The `hybrid_search_*` names in plan docs are **not in any local migration**. CLAUDE.md asserts "VDB-01 ✅" — likely on remote only. Real drift. | MASTRA-004 wiring must verify which RPC name actually exists at the target Supabase project before coding. |
| Missing Mastra approval bridge task (Paperclip) | ✅ Confirmed | No `MASTRA-020` exists. Plans for risky tools (`MASTRA-006/007/008/018`) assume Paperclip approvals but no task defines the request/result/state-machine contract. | Open `MASTRA-020 Paperclip Approval Bridge` (P0). |
| `@mastra/ai-sdk` missing | ✅ Confirmed | [my-mastra-app/package.json](../../../../my-mastra-app/package.json) has `@mastra/client-js@^1.17.1` but no `@mastra/ai-sdk`. Already tracked in EXTRACT-08 + [22-doc](./22-mastra-repos-extract-tasks.md). | Install during MASTRA-019 wiring, not before. |
| Runtime not running at audit moment | 🔵 Not a code bug | This is a session-time observation, not a defect. | N/A — start Studio when needed. |
| Broken alias links in `/tasks/mastra` stubs | ✅ Confirmed | [tasks/mastra/000-index.md](../../../mastra/000-index.md) frontmatter says `canonical: ../prompts/mastra/000-index.md` (missing `/tasks/`); body link is `prompts/mastra/tasks/000-index.md` (missing one `../`). From `tasks/mastra/`, the correct path is `../prompts/mastra/tasks/000-index.md`. | Fix both lines. |
| Mastra task folders untracked in some checkouts | 🔵 Not verified now | `git status` clean in this worktree. May have been a stale observation. | Skip unless reproduced. |

### B.2 Section "Canonical Task Audit" (04-audit §4)

The per-task scoring table is mostly defensible. Confirmed real issues only:

| Task | 04 score / claim | Verdict | Real defect |
|---|---|---|---|
| `000-index` link relative paths | ✅ Confirmed | Rows 4–7, 10, 13, 17–18 of the table use `prompts/mastra/tasks/<n>...` — wrong relative prefix from the index's own location. Already documented in [my prior PR-style fix](#) review. |
| `001` Not Started ↔ inventory Complete | ✅ Confirmed | Same as B.1. |
| `002` weather demo still present | ✅ Confirmed | Verified: [my-mastra-app/src/mastra/agents/weather-agent.ts](../../../../my-mastra-app/src/mastra/agents/weather-agent.ts), `tools/weather-tool.ts`, `workflows/weather-workflow.ts` all exist. |
| `004` VDB drift | 🟡 Same as B.1 — verify RPC names at runtime, don't pre-build a fallback. |
| `008` `EVT-071` alias | ✅ Confirmed | Same as B.1. |
| `009` UI Dojo framed as "decision" | ✅ Confirmed | [009 line 18](../tasks/009-mastra-ui-dojo-chat-frontend.md): "Use the official mastra-ai/ui-dojo repo to choose the frontend integration pattern" — too strong; should say "reference only" per [22-doc](./22-mastra-repos-extract-tasks.md) + [23-doc §D2](./23-mastra-modules-verified.md). |
| `010` cites docs-chatbot for RAG | ✅ Confirmed | [010 line 30](../tasks/010-mastra-memory-rag-mvp.md): "adapt docs-chatbot patterns". Verified in [23-doc §A](./23-mastra-modules-verified.md): docs-chatbot is MCP+JSON, not pgvector RAG. Source must change to Mastra Core `examples/rag-*`. |
| `20-mastra.md` says `@mastra/client-js` missing | ✅ Confirmed stale | Package is installed; doc must be marked "reference only — verified state lives in [23-doc](./23-mastra-modules-verified.md)". |
| `21-mastra-repos-templates.md` partly corrected by 23 | ✅ Confirmed | Already documented in 23-doc §A (mastra-triage and repo-base mis-descriptions). |

### B.3 Section "/tasks/mastra Document Audit" (04-audit §5)

| 04 claim | Verdict | Evidence |
|---|---|---|
| `000-index.md` link wrong | ✅ Confirmed | Verified above. |
| `01-mastra.md` low-quality citations + early-LangGraph push | 🟡 Partially correct | Doc does push LangGraph/n8n. With [23-doc §A0 rule 4](./23-mastra-modules-verified.md) ("No new infra Week 1") this is now a written rule, not a per-doc cleanup; flag the doc but archiving every old strategy note is busywork. |
| `05.2-Mastra-Events.md` messy | 🔵 Not verified | Fine to archive if confirmed messy at next read. |
| `mastra-runtime-runbook.md` `PATH=...$PATH` `hash -r` should be split | 🟡 Pedantic | `PATH=foo hash -r` runs `hash -r` with `PATH` overridden in env — it works. Splitting is clearer but not a bug. Skip unless someone hits a real failure. |

### B.4 Section "Missing Tasks To Add" (04-audit §7)

| Proposed new task | Verdict | Action |
|---|---|---|
| `MASTRA-020 Paperclip Approval Bridge` | ✅ Add | Real gap. P0 before any high-risk tool ships. |
| `MASTRA-021 VDB Local/Remote Reconciliation` | ✅ Add | Real drift. P0 before MASTRA-004 codes against assumed RPC names. |
| `MASTRA-022 Runtime Startup Smoke Test` | ✅ Add | Make startup repeatable. P1 — not blocking. |
| `MASTRA-023 Replace Weather Demo With mdeAI Ping Router` | ✅ Add | Already partial: `agents/ping.ts` exists alongside weather. P1 — finish the swap. |
| `MASTRA-024 Mastra Env And Secret Boundary` | ✅ Add | Vite-bundle leak risk is real. P0. |
| `MASTRA-025 Task Dependency Alias Map` | ✅ Add | Resolves the EVT-071 / RE-* mismatch class. P1. |

All six are reasonable. Open them in the same PR that fixes the punch-list in §C below so the index ships consistent.

---

## C. Verified Punch-List (the only fixes that ship)

Ranked by ship-impact, not by 04-audit order. Anything not on this list is deferred until proven to bite.

| # | Fix | File | Severity |
|---|---|---|---|
| 1 | Status drift: change `status: Not Started` → `In Progress` (or `Complete` if proven) on 001 + 002 | [001-mastra-source-inventory.md:5](../tasks/001-mastra-source-inventory.md), [002-mastra-core-runtime-scaffold.md:5](../tasks/002-mastra-core-runtime-scaffold.md) | High — agents will redo work |
| 2 | Index relative paths: drop the wrong `prompts/mastra/tasks/...` prefix from rows that are in the same folder | [000-index.md](../tasks/000-index.md) lines 42–56 | High — broken navigation |
| 3 | `MASTRA-002` standardize runtime path to `my-mastra-app/` (drop "prefer apps/mastra") | [002-mastra-core-runtime-scaffold.md](../tasks/002-mastra-core-runtime-scaffold.md) lines 64, 77–80, 114 | High — wrong path baked into examples |
| 4 | `MASTRA-002` health command: `npm run mastra:health` → `npm run health` | [002-mastra-core-runtime-scaffold.md:113](../tasks/002-mastra-core-runtime-scaffold.md) | High — verification step would fail |
| 5 | `MASTRA-008` dependency ID: `EVT-071` → reference [`071-restaurant-reservations-schema.md`](../../event_prompts/071-restaurant-reservations-schema.md) | [008-mastra-restaurants-mvp-discovery.md:13,23](../tasks/008-mastra-restaurants-mvp-discovery.md) | Medium — alias confusion |
| 6 | `MASTRA-009` reword "decision" → "reference patterns only" framing | [009-mastra-ui-dojo-chat-frontend.md:18](../tasks/009-mastra-ui-dojo-chat-frontend.md) | Medium — contradicts [23-doc §D2](./23-mastra-modules-verified.md) |
| 7 | `MASTRA-010` swap RAG source from docs-chatbot to Mastra Core `examples/rag-*` + Supabase pgvector | [010-mastra-memory-rag-mvp.md:30](../tasks/010-mastra-memory-rag-mvp.md) | Medium — wrong source baked into spec |
| 8 | `tasks/mastra/000-index.md` alias: fix frontmatter `canonical:` and body link to `../prompts/mastra/tasks/000-index.md` | [tasks/mastra/000-index.md](../../../mastra/000-index.md) | Medium — broken stub |
| 9 | Add `MASTRA-020` (Paperclip bridge), `021` (VDB reconcile), `024` (env boundary) — P0 | new files | High — gap blocks risky tools |
| 10 | Add `MASTRA-022` (smoke test), `023` (weather → ping swap), `025` (alias map) — P1 | new files | Low — polish |
| 11 | Verify hybrid-search RPC names at the live Supabase project before MASTRA-004 codes against `hybrid_search_*` | runtime check, not a file edit | High — pre-commit verification |

> **Not on the punch-list (de-scoped):**
> - Expanding 012–019 to full prompt template — handled when each task is picked up, not as a batch.
> - Splitting `PATH=... hash -r` in the runbook — works fine.
> - Archiving every legacy strategy doc (01-mastra.md, 05.2-Mastra-Events.md, etc.) — tedious; mark "reference only" if/when re-read.
> - Tracking untracked task folders — not reproduced.

---

## D. Errors / Red Flags / Failure Points in 04-audit Itself

Things 04-audit got wrong or asserted with too much confidence, listed so future readers don't compound the error:

1. **"Tasks 011–019 missing"** — stated in earlier (pre-04) audits, repeated as background context. **Wrong.** All 011–019 files exist at [tasks/prompts/mastra/tasks/](../tasks/). Anyone who didn't have the full repo upload should clone before re-grading.
2. **"VDB-01 hard blocker"** — implied throughout. **Misleading.** VDB-01 is shipped (semantic search migration in tree, commit `acc9f69` merged). The real blocker is **RPC name drift**, not "VDB-01 not done." Fix the name verification, not a fallback layer.
3. **"@mastra/ai-sdk needed for MASTRA-016/019"** — correct that it's needed, but framed as a gap. It is **deliberately deferred** to install-time per EXTRACT-08 to avoid version-pinning before the streaming route ships.
4. **Runtime "not running at audit moment"** treated as a defect.** **Not a defect.** Audits should not assume a long-running dev server. A repeatable smoke script (proposed `MASTRA-022`) covers this without making "runtime up" a permanent invariant.
5. **04-audit recommends "do MASTRA-021 (VDB reconcile) first"** — fine, but the actual cheapest first move is a **5-line read-only RPC name check** at the live project, not a new migration. Do the check, *then* decide whether a new migration is needed.
6. **04-audit's per-task percentage scores** look precise (78%, 84%, 86%) but are not reproducible from any rubric. Treat the *prose* in each row as the signal; ignore the numbers.

---

## E. Best Practices Reinforced (from this audit cycle)

These are not new rules — they are restatements of patterns that protected us from acting on bad signals. Keep them visible.

1. **Verify in the repo before fixing in a doc.** Two of the loudest claims in earlier audits (missing tasks, VDB blocker) collapsed under a 5-second `ls` / `grep`.
2. **Authority order, again** ([23-doc §A0 rule 5](./23-mastra-modules-verified.md)): official Mastra docs/repos > template hub > examples > workshops > community > hackathon. When two sources conflict, walk *up* this list.
3. **One canonical name per concept.** `template-deep-search` (not `…research`); `my-mastra-app/` (not `apps/mastra/`); `hybrid_search_*` OR `semantic_search_*` (pick one and migrate). Aliases are how status drift starts.
4. **Status fields are load-bearing.** A `status: Not Started` on a finished task causes rework. Update the field in the same PR that lands the work.
5. **Audits propose; humans accept.** Even a thorough audit (this one included) can mis-grade. The punch-list in §C is the only thing that ships from 04-audit + 05-audit; everything else is reading material.

---

## F. Improvements to the Audit Process Itself

Lightweight changes to make the next audit cycle cheaper:

| Improvement | Where | Why |
|---|---|---|
| Each audit doc must include a "method" section listing exactly which files were `grep`'d / `ls`'d, with timestamps | top of every `0n-audit.md` | Prevents claims based on partial uploads |
| Status drift gate: before tagging a task `Not Started`, run `grep -l "task_id: MASTRA-00X" tasks/mastra/` to check for completion notes | new pre-commit script (P2) | Stops the 001/002 drift class entirely |
| Single source-of-truth pointer at top of each notes file (`Authority: 23-doc when conflict`) | already added in 21/22/23 + this doc | Reader knows which doc wins |
| Per-claim verdict legend (`✅ / 🟡 / ❌ / 🔵`) | applied in this doc | Forces grader to commit to a verdict |
| No percentage scores without a rubric | new rule | Numbers without rubrics anchor wrongly |
| Audit deliverable = punch-list, not narrative | §C of this doc | The narrative is reading; the punch-list is action |

---

## G. Sources Verified (2026-05-10)

Repo state:
- `ls /home/sk/mde/tasks/prompts/mastra/tasks/` → all 000–019 + 20–23 present
- `ls /home/sk/mde/my-mastra-app/src/mastra/{agents,tools,workflows}/` → weather-* still present
- `ls /home/sk/mde/apps/` → does not exist
- `cat /home/sk/mde/my-mastra-app/package.json` → `@mastra/ai-sdk` absent; `health` script present
- `grep status: tasks/prompts/mastra/tasks/00{1,2}-*.md` → `Not Started`
- `grep status: tasks/mastra/mastra-source-inventory.md` → `Complete`
- `ls /home/sk/mde/supabase/migrations/` → only `20260509205216_pgvector_semantic_search.sql` (creates `semantic_search_*`, not `hybrid_search_*`)
- `git log --oneline | grep vdb01` → `acc9f69 Merge pull request #18 from amo-tech-ai/feat/vdb01-audit-migration`

External verifications: see [23-mastra-modules-verified.md §H](./23-mastra-modules-verified.md#h-sources-verified-live-2026-05-10).

---

## H. What to Do With This Doc

- **Engineering:** treat §C as the to-do. Open one PR per fix or one omnibus PR titled "audit follow-ups (05-audit punch-list)".
- **Planning:** read §B + §D before starting any new audit so prior false alarms don't get re-asserted.
- **Skill:** the [Mastra skill links file](../../../.claude/skills/mastra/links.md) is now updated to reflect §A authority order — keep it the one bookmark page; do not duplicate corrections there.
