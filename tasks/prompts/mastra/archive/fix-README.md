# PR #22 follow-up tasks — verified audit findings

> Generated 2026-05-10. Each task corresponds to one **verified** finding from the PR #22 forensic audit.
> Bugs were confirmed by reading `origin/main` source code directly — not inferred.
> **Audit result:** 9 real bugs → 9 tasks. 2 audit claims rejected (model IDs valid). 3 are environmental only.

---

## Master status table

> Legend: 🟢 Ready to start (unblocked) · 🟡 In Progress or needs attention · 🔴 Blocked (dependency unmet)

| ID | Title | Priority | Status | Bug verified on main | Unblocked? | % Complete (before enrichment) |
|---|---|---|---|---|---|---|
| [M22-01](M22-01.md) | Smoke env file — always use mktemp | P1 | 🟡 In Progress (PR #23 open) | ✅ line 121-126 before fix | ✅ Yes | 90% → 100% |
| [M22-02](M22-02.md) | Weather fetch timeouts | P1 | 🟢 Not Started | ✅ lines 45+56: bare `fetch()` | ✅ Yes | 70% → 100% |
| [M22-03](M22-03.md) | Concierge memory enum gaps | P2 | 🟢 Not Started | ✅ enum missing `restaurant_search` / `attraction_search` | ✅ Yes | 70% → 100% |
| [M22-04](M22-04.md) | Wire `freeOnly` through routing workflow | P2 | 🔴 Blocked | ✅ `concierge-routing-workflow.ts` not on main | ❌ PR #22 must merge first | 65% → 100% |
| [M22-05](M22-05.md) | Positive number constraints in working memory | P3 | 🟢 Not Started | ✅ `z.number().optional()` without `.positive()` | ✅ Yes | 70% → 100% |
| [M22-06](M22-06.md) | Vitest unit tests for classifier | P2 | 🔴 Blocked | ✅ `npm test` exits 1 "no test specified" | ❌ PR #22 + M22-04 first | 65% → 100% |
| [M22-07](M22-07.md) | Track planning docs in git | P3 | 🟢 Not Started | ✅ `tasks/prompts/mastra/` is `??` untracked | ✅ Yes | 75% → 100% |
| [M22-08](M22-08.md) | `sourceUrl` vs `source_url` mismatch | P1 | 🟢 Not Started | ✅ concierge.ts:102 snake_case vs cardSchema camelCase | ✅ Yes | 70% → 100% |
| [M22-09](M22-09.md) | `bedrooms` in cardSchema; stop regex on subline | P2 | 🟢 Not Started | ✅ cardSchema missing `bedrooms`; line 196 regexes subline | ✅ Yes | 70% → 100% |

### What "% complete" means

The percentage reflects task file completeness before the 2026-05-10 enrichment:
- **Before:** §1–9 template + verified bug description. Missing: §10 Success Criteria, §11 Production-Ready Checklist, §12 Testing Strategy, and 2 tasks had wrong `depends_on`.
- **After:** All 12 sections present, deps corrected, exact commands included.

---

## Production-ready checklist (applies to every task)

Run these before opening any PR in this set:

```bash
npm --prefix my-mastra-app run typecheck   # 0 errors
npm --prefix my-mastra-app run build       # clean
infisical run -- npm --prefix my-mastra-app run smoke:runtime  # exits 0
curl -fsS http://127.0.0.1:4111/api/agents | jq 'keys'         # 7 agents
curl -fsS http://127.0.0.1:4111/api/tools | jq 'keys'          # expected tools
curl -fsS http://127.0.0.1:4111/api/workflows | jq 'keys'      # expected workflows
git diff --staged | grep -Ei "KEY|SECRET|TOKEN"                 # empty
```

---

## Ship order

```
M22-01 (PR #23, already open)
  → M22-02 (weather timeouts)
    → M22-08 (sourceUrl mismatch)
      → M22-03 (concierge enum)
        → M22-09 (bedrooms schema)
          → M22-05 (positive numbers)
            → M22-07 (track docs)
              *** WAIT: PR #22 merge ***
                → M22-04 (freeOnly routing)
                  → M22-06 (Vitest tests)
```

**Rule:** one focused PR per task. Do not bundle. Each PR must be green on CodeRabbit + CI before merge.

---

## Context documents (not task files)

| File | What it is | Relationship to M22 tasks |
|---|---|---|
| [09-fix.md](09-fix.md) | IPv6/DATABASE_URL root-cause notes from prior session | Background context; led to env strategy used in M22-01 |
| [15-fix-plan.md](15-fix-plan.md) | PR #21 merge status + repo gate results + typecheck strategy | Records what landed before M22 tasks were written |
| [17-pr-22.md](17-pr-22.md) | Original PR #22 audit (raw, unverified claims) | Source audit that generated the M22 tasks |
| [18-fixpr-22.md](18-fixpr-22.md) | Verified fix plan for PR #22 (phases A–G) | Phases map to M22 tasks: B→M22-01, C→M22-02, D→M22-03/04/05, G→M22-06/07 |

---

## Task-level element verification

Each M22 task has been checked against:

| Check | Verified by |
|---|---|
| Bug exists on `origin/main` | `git show origin/main:<file>` + `grep` |
| Correct `depends_on` field | Cross-referenced against `git show origin/main:my-mastra-app/src/mastra/workflows/` tree |
| Model IDs valid | `node .claude/skills/mastra/scripts/provider-registry.mjs --provider openai/google` |
| Official doc links active | Referenced from embedded `node_modules/@mastra/` docs + mastra.ai |
| §10 Success Criteria | Added 2026-05-10 — measurable, before/after table |
| §11 Production Checklist | Added 2026-05-10 — gate commands + PR scope rule |
| §12 Testing Strategy | Added 2026-05-10 — exact shell commands, expected output |

---

## Audit claims rejected (do not implement)

| Audit claim | Why rejected | Evidence |
|---|---|---|
| `openai/gpt-5.5` invalid | Model exists in registry | `provider-registry.mjs --provider openai` |
| `google/gemini-2.5-flash-lite` stale | Model exists in registry | `provider-registry.mjs --provider google` |
| `google/gemini-flash-lite-latest` not found | Model exists in registry | Same |
| `start-async` returns only `{ runId }` | HTTP endpoint awaits result | `node_modules/@mastra/server/dist/docs/references/reference-server-routes.md` line 78 |

## Environmental issues (not code blockers)

- `OPENAI_API_KEY not found` — fix Infisical project mapping locally (project ID `82d12c1d-...`)
- Root `npm run lint` ~993 findings — separate backlog; most are `@typescript-eslint/no-explicit-any` in `src/`

---

## Skills used in this task set

| Skill | Purpose | Path |
|---|---|---|
| `mastra` | Agent/workflow/tool patterns | [`.claude/skills/mastra/SKILL.md`](../../../../.claude/skills/mastra/SKILL.md) |
| `mastra-smoke-test` | Smoke test matrix + setup | [`.claude/skills/mastra-smoke-test/SKILL.md`](../../../../.claude/skills/mastra-smoke-test/SKILL.md) |
| `mde-worktree-pr-flow` | One-task-per-branch discipline | [`.claude/skills/mde-worktree-pr-flow/SKILL.md`](../../../../.claude/skills/mde-worktree-pr-flow/SKILL.md) |
| `mde-testing` | Vitest + Playwright patterns | [`.claude/skills/mde-testing/SKILL.md`](../../../../.claude/skills/mde-testing/SKILL.md) |
| `mde-task-lifecycle` | Task template + DoD | [`.claude/skills/mde-task-lifecycle/SKILL.md`](../../../../.claude/skills/mde-task-lifecycle/SKILL.md) |
| `mde-infisical` | Secret management | [`.claude/skills/mde-infisical/SKILL.md`](../../../../.claude/skills/mde-infisical/SKILL.md) |

## Official docs references

- Mastra Agents overview — https://mastra.ai/docs/agents/overview
- Mastra Memory overview — https://mastra.ai/docs/memory/overview
- Mastra Working memory — https://mastra.ai/docs/memory/working-memory
- Mastra Workflows overview — https://mastra.ai/docs/workflows/overview
- Mastra Tools — creating tools — https://mastra.ai/docs/tools/creating-tools
- Mastra Studio — https://mastra.ai/docs/studio/overview
- Mastra Server routes reference — https://mastra.ai/reference (server section)
- Mastra Workflow error handling — https://mastra.ai/docs/workflows/error-handling
- Provider registry script — [`.claude/skills/mastra/scripts/provider-registry.mjs`](../../../../.claude/skills/mastra/scripts/provider-registry.mjs)
- Mastra link index — [`.claude/skills/mastra/links.md`](../../../../.claude/skills/mastra/links.md)
- Upstream Mastra issues — https://github.com/mastra-ai/mastra/issues
- Vitest docs — https://vitest.dev
- MDN AbortSignal.timeout — https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
