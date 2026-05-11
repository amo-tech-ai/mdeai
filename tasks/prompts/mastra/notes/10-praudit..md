---
title: Mastra Task Pack — Forensic PR & Plan Audit
role: senior software specialist / forensic auditor
audited: 2026-05-10
sources:
  - ../tasks/mastra-prd.md
  - ../tasks/mastra-roadmap.md
  - ../tasks/mastra-source-inventory.md
  - ../dashboard.md
  - ../tasks/000-index.md
scope: Plan soundness, doc/runtime drift, PR queue risk, dependency correctness, PRD alignment
verified_against:
  - ../../../../.claude/skills/mastra/SKILL.md
  - ../../../../.claude/skills/mastra-smoke-test/SKILL.md
github_pr_verification: 2026-05-10 (gh pr view 7,8,11,21 — amo-tech-ai/mdeai)
---

# Forensic audit — Mastra mega-plan & open PRs

## 1. Executive verdict

| Dimension | Score | Verdict |
| --- | ---: | --- |
| Strategic architecture (PRD + roadmap) | **88%** | Phasing, boundaries (Mastra vs Supabase vs OpenClaw vs Paperclip), and “propose / approve / execute” match product reality and `prd.md` posture. |
| Task dependency graph (`000-index.md`) | **90%** | Ordering is logically sound; 019 vs 010 numbering is explicitly documented. |
| Evidence baseline (`mastra-source-inventory.md`) | **~55% current** | Strong as a 2026-05-10 snapshot procedure; **runtime facts for `my-mastra-app/` are stale** vs ongoing PR work (PostgresStore, `@mastra/pg`, agents). **Refresh MASTRA-001 after PR merge.** |
| Dashboard execution honesty | **82%** | Counts and wave model are transparent; PR numbers (`#2`, `#20`) **diverge from GitHub reality (`#21` in user brief)** — bookkeeping risk only. |
| Open PR queue (GitHub-verified §2b) | **72%** | **#21** clean merge state + green Vercel/CodeRabbit; **Supabase Preview = SKIPPED**. **#7/#8/#11** all **`CONFLICTING`** mergeability — blockers beyond check marks. |

**Will the task plan succeed if followed?**  
**Yes, directionally** — assuming Wave 0→1 foundations land before scaling domain agents, and **local/remote DB parity (VDB-021)** is not ignored. **No guarantee of calendar** — ~30 dev-days serial in dashboard is a lower bound; doc-thin tasks (+5d budget) and infra surprises (pooler TLS, auth) expand risk.

---

## 2. Open PRs (from user table) — audit

| PR | Risk if merged now | Notes |
| --- | --- | --- |
| **#21** feat Mastra MVP primitives | **Low–medium** | Merge state **CLEAN** / **MERGEABLE** on `main` (verified). **Supabase Preview** status is **SKIPPED**, not success — do not treat as “DB integration proved.” CodeRabbit **COMMENTED** (nitpicks: schema duplication, unused `evaluationAgent`, smoke thread IDs, Zod datetime, free-event price). |
| **#11** Vercel Web Analytics | **High until rebased** | **Draft** + `mergeable: CONFLICTING` — **cannot merge** without resolving conflicts. Vercel green ≠ shippable. Review bundle/analytics PII after rebase. |
| **#8** landlord onboarding | **Do not merge** | **`CONFLICTING`**. Failing check: **`Supabase Preview` → FAILURE** (see Supabase integration dashboard link on the run). Other contexts (CodeRabbit, Vercel) SUCCESS. |
| **#7** landlord D5–D14 | **Do not merge** | **`CONFLICTING`**. **Two** failures: **`Playwright (chromium)`** (`e2e` workflow) **FAILURE**; **`Supabase Preview` → FAILURE**. Vercel/CodeRabbit SUCCESS. |

**Follow-up (partially executed):** Failure points are **now named** in §2b. For **#7**, open the Actions job URL from `gh pr checks 7` / `Playwright (chromium)` log. For **#8/#7** Supabase Preview, use the check’s `detailsUrl` in GitHub → fix linked project/config or branch DB mismatch.

---

### 2b. GitHub-verified matrix (errors, red flags, failure points)

Live query: `gh pr view <n> --json mergeable,mergeStateStatus,isDraft,statusCheckRollup` against repo default branch. **Verified: 2026-05-10.**

| PR | Branch | Draft? | Mergeability | Red flags |
| --- | --- | --- | --- | --- |
| **#21** | `claude/mastra-pr2-mde-primitives` | No | **MERGEABLE** · state **CLEAN** | **Supabase Preview: SKIPPED** — no preview DB proof. **CodeRabbit** nitpicks (maintainability, not blockers). |
| **#11** | `vercel/install-vercel-web-analytics-jtuzx6` | **Yes** | **CONFLICTING** | **Cannot merge** until conflicts resolved; draft auto-opened by Vercel app. |
| **#8** | `fix/landlord-launch-blockers` | No | **CONFLICTING** | **Supabase Preview = FAILURE** — integration or branch ↔ project mismatch. Blocks trust for landlord DB workflows. |
| **#7** | `ship/d12-server-side` | No | **CONFLICTING** | **Playwright (chromium)** e2e **FAILURE** + **Supabase Preview FAILURE** — product path not proven; CI broken independent of Vercel. |

**Interpretation**

- **“3✓” on #21** in a human table usually means Vercel + bot checks; **this audit now records** that **Supabase Preview did not run to success** (skipped). That is a **documentation / expectation gap**, not necessarily a merge blocker for Mastra codepaths.
- **Merge conflicts (`CONFLICTING`)** on **#7, #8, #11** are **P0 process blockers** — stricter than a single red X on a check; **rebase onto current `main`** before any further review.
- **#7 vs #8:** Both fail **Supabase Preview** → likely **shared integration** or **stale Supabase link** on those branches; fix once, verify both PRs after rebase.
- **#7-only:** **Playwright** failure → **host/landlord UI or e2e flake**; orthogonal to Mastra **#21** unless shared components were edited on `main` after branch cut.

**Commands to re-verify after updates**

```bash
gh pr view 21 --json mergeable,mergeStateStatus,statusCheckRollup
gh pr checks 7
gh pr checks 8
```

---

## 3. Critical findings (errors, red flags, failure points)

### P0 — Technical / execution

1. **Inventory vs repo drift (MASTRA-001)**  
   Document still states LibSQL-only scaffold, missing `@mastra/pg`, missing `DATABASE_URL` patterns. **Re-run inventory commands** post-#21 merge and replace §4 with current `package.json` + `src/mastra/` tree or **archive** 001 and supersede with dated addendum.

2. **Hybrid search: local ≠ remote (`mastra-source-inventory` §2b)**  
   `hybrid_search_*` on remote only → **local dev cannot mirror production search behavior**. **Blocks honest MASTRA-004 tests** until **MASTRA-021** migration lands locally or CI pins remote test DB (discouraged). **Red flag for “tests green locally = prod safe.”**

3. **Missing Mastra governance tables**  
   `ai_control_events`, `ai_tool_audit_events`, `human_handoffs`, `workflow_runs` reported **absent locally**. **MASTRA-003 / 012 / 018** cannot be “done” without migrations — plan assumes they appear before risky tool paths scale.

4. **Path typos in `000-index.md` source plans**  
   Points to `/home/sk/mde/tasks/mastra/mastra-prd.md`; canonical files live under **`tasks/prompts/mastra/tasks/`**. Breaks copy-paste automation and onboarding scripts.

5. **Roadmap wording: `apps/mastra` vs `my-mastra-app/`**  
   Phase 1 still says preferred `apps/mastra`; repo standard is **`my-mastra-app/`** (CLAUDE.md). **Naming drift** causes wrong scaffolds in future tasks.

### P1 — Process / documentation

6. **Dashboard PR ID drift**  
   References “PR #2 / #20” while user cites **#21**. **Single source:** GitHub `gh pr list` after renumbering; avoid hard-coding PR IDs in long-lived dashboards.

7. **Doc-thin tasks (003, 004, 012, 013, 014, 016, 017)**  
   Dashboard flags **<85% doc completeness** on several P0s — **scheduling implementation before doc completion risks rework** (especially 016 streaming + 017 DLQ).

8. **Secrets & env operational risk**  
   Mastra dev required pooler URL, SSL `no-verify` or `DATABASE_SSL_REJECT_UNAUTHORIZED`, IPv6 vs IPv4 — **not fully captured in MASTRA-024** until env-boundary script ships. Developers will hit **intermittent “refused” / TLS / DNS** issues unrelated to code quality.

### P2 — Strategic

9. **Score inflation in PRD §1 (“92/100”)**  
   Narrative score is plausible **after** Phase 0–1 gates; **not** a measured metric. Treat as **aspiration**, not KPI.

10. **Sponsor vertical**  
    Edge functions exist; **no sponsor tables** in inventory — **intentionally out of MVP** per inventory; do not route Mastra sponsor tools until DB exists.

---

## 4. Commands & dependencies — verification

| Item | Correct? | Comment |
| --- | :---: | --- |
| `psql postgresql://postgres:postgres@localhost:54322/postgres` (MASTRA-001) | **Conditional** | Valid **only** if `supabase start` (or equivalent) runs on 54322. Document prerequisite. |
| Implementation order `001→002→022→024→023→003→…` | **Yes** | Matches safety-first; 022 smoke before 003 audit tables is coherent. |
| `npm run test && npm run build` as merge gate | **Yes** | Repo standard per CLAUDE.md; Mastra sub-app should add **typecheck + smoke** for `my-mastra-app`. |
| `npx mastra dev` / `-e .env.test` | **Yes** | CLI supports `--env`; matches established pattern. |
| Dependency on VDB-01 hybrid for MASTRA-004 | **Yes but split-brain** | Until 021 reconciles, tools must branch **semantic (local)** vs **hybrid (prod)** — plan acknowledges; **tests must encode both**. |

---

## 5. PRD goal alignment

| PRD theme | Supported by plan? | Gap |
| --- | :---: | --- |
| Mastra as TS AI backend, not ledger | **Yes** | Repeated clearly; guardrails against Stripe/ticket ownership good. |
| Supabase SoT | **Yes** | Tables/RPC inventory aligns. |
| Events ticketing deterministic first | **Yes** | Roadmap Phase 3 defers Mastra “ownership” of revenue paths — matches Phase 1 gate in CLAUDE.md. |
| Rentals-first wedge | **Yes** | Phase 2 ordering matches `prd.md` pillars. |
| Governance / Paperclip / OpenClaw | **Yes** | Sequenced late; **018/020** placement in index is correct. |

**Conclusion:** Tasks **can** achieve PRD intent **if** foundations (003, 012–015, 021 local parity) ship before domain agents claim production traffic.

---

## 6. Recommended improvements (prioritized)

1. **Immediately after #21 merge:** update **MASTRA-001** or publish **MASTRA-001b** delta (packages, agents, workflows, storage).  
2. **Fix `000-index.md`** source paths to the real `tasks/prompts/mastra/tasks/*.md` locations.  
3. **Normalize roadmap** references from `apps/mastra` → `my-mastra-app/`.  
4. **Land MASTRA-021** early or explicitly accept **semantic-only** local tools until then (document in 004).  
5. **Wave 0** per dashboard: fix **022** `status_evidence`, add **env-boundary** script (**024**), rename weather demo (**023**).  
6. **CI investigation** on **#7 / #8** before any landlord merge — prevents masking shared linters.  
7. **Pin dashboard to commit SHA** instead of PR numbers for “verified runtime” rows.

---

## 7. Overall “percent correct” rollup

| Layer | % |
| --- | ---: |
| Architecture & sequencing | **89** |
| Doc ↔ code truth (inventory/dashboard) | **58** |
| Dependency graph | **90** |
| Merge hygiene / open PRs + live GH | **62** | **#7/#8/#11 conflicting** lowers score; **#21** mergeable but Supabase **skipped** |

**Weighted composite (engineering truth-seeking): ~72–74%** — rises toward **~88%** after inventory refresh + local hybrid parity + **rebased landlord PRs** + green Supabase Preview where required.

---

## 8. Sign-off line

The Mastra plan is **sound and PRD-aligned**; primary failure mode is **execution drift** (stale inventory, env/DB mismatch, skipping Waves 0–1). Treat **#21** as the correct merge candidate for Mastra momentum; treat **#7/#8** as **separate quality gates** before shipping landlord scope.

---

## 9. Cross-check — `.claude/skills/mastra` (SKILL.md)

| Skill rule | Audit verdict | Action for Mastra task pack |
| --- | --- | --- |
| **Do not trust memory** — always verify against **embedded** (`node_modules/@mastra/*/dist/docs`) or **remote** (`mastra.ai/llms.txt`) docs for the **installed** version | **Aligns** with §3 finding “inventory/stale docs” | Task prompts that specify APIs (Agent, Workflow, `getAgentById`, Editor) must include a **version pin** or “verify in `node_modules/@mastra/core/dist/docs`” step — same discipline as the skill. |
| **TypeScript: ES2022 modules** — CommonJS fails | **Verify** `my-mastra-app/tsconfig.json` on each MASTRA-002+ PR | Add explicit gate: `"module": "ES2022"` / `"moduleResolution": "bundler"` (or project equivalent) in smoke/typecheck. |
| **Models: `provider/model-name`** — use provider-registry script; **do not guess** slugs | **Partial risk** — mega-plan uses concrete Gemini strings; OK if smoke proves them | Extend **MASTRA-022** evidence: model string matches **installed** `@mastra/core` model router (or document override in task YAML). |
| **Studio URL `http://localhost:4111`** in skill examples | **Conditional mismatch** — Mastra CLI often prints **4112+** when 4111 is busy | **Skill + audit agree:** always use **the URL from the running `mastra dev` stdout**, then `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:<port>/api` (see smoke-test skill). Do not encode a fixed port in dashboards or runbooks. |
| **Errors = often outdated knowledge** — check `common-errors`, embedded docs | Supports **§3 P1 doc-thin tasks** | When implementation fails, default to **doc refresh** before rewriting architecture. |

**Net:** The mega-plan is **compatible** with the Mastra skill if implementers treat task markdown as **provisional** until checked against embedded docs each milestone — otherwise the same “stale doc” failure mode hits **both** `mastra-prd.md` and agent knowledge.

---

## 10. Cross-check — `.claude/skills/mastra-smoke-test` (SKILL.md)

The official smoke skill defines a **mandatory** matrix (Setup → Agents → Tools → Workflows → Traces → Scorers → Memory → MCP → Errors; plus Studio/Server for cloud). mdeAI uses **`my-mastra-app/scripts/mastra-smoke.sh`** (MASTRA-022) as the **local** gate.

| Smoke dimension | Official skill expectation | mdeAI today (dashboard / MASTRA-022) | Gap / recommendation |
| --- | --- | --- | --- |
| **Setup** | Env, dev server up, correct port | Smoke script + `npm run health` | **Align** — keep requiring **`DATABASE_URL`** and API keys from `.env` or `infisical run` (skill: LLM key required). |
| **Agents** | UI or API exercise | Probes `agent.generate` (ping, router, concierge, …) | **Strong** — extend only when new agents ship (post-#21). |
| **Tools** | Tools UI / execution | Indirectly via agent tool calls | **Optional gap** — add explicit **tools registry** HTTP probe if tools become callable outside agents. |
| **Workflows** | Run workflow to **success** | `weather-workflow`, `rental-search-workflow`, `event-discovery-workflow` per dashboard | **Strong** — update probe list when **023** renames weather → mde ping. |
| **Traces / Scorers** | Observability pages | May be covered indirectly | **Gap** — skill expects **traces UI/API** proof; add `/api` trace list or document “CLI-only smoke” exception in **MASTRA-022** `status_evidence`. |
| **Memory** | Conversation persistence | Concierge multi-turn in smoke | **Monitor** — when Mastra Memory + Supabase threads diverge, add a memory-specific probe (skill `references/tests/memory.md` pattern). |
| **MCP** | `/mcps` page; empty state OK | Not default in `mastra-smoke.sh` | **Low priority** until MCP servers are registered for mdeAI. |
| **Errors** | Deliberate failure paths | Not explicit in bash smoke | Add **one** negative test (bad input → graceful error) when **011** guardrails land. |
| **Browser Studio** | **Both** curl **and** browser for local release-grade smoke | Repo smoke is **curl/script-first** | For **release** or **PR merge gate**, adopt skill rule: **API + Studio browser** pass on the **printed port** — closes “localhost refused” operator errors. |
| **Storage / migration** | `references/storage-provider-migration-smoke.md` when provider/schema changes | PostgresStore + pooler TLS issues seen in the wild | On **MASTRA-003/012/021** migrations, run a **storage migration smoke** slice (init tables + one read/write path) before marking Complete. |

**Commands the skill mandates (adapt to mde path):**

```bash
# Before claiming Studio “reachable”, replace PORT with CLI output (4111, 4112, …)
curl -s -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:PORT/api"
# Optional: ss -ltnp | grep PORT   (Linux)
```

**Net:** **MASTRA-022** is **directionally aligned** with the smoke-test skill but **narrower** than the full 11-step matrix. **Recommendation:** add a short **“parity appendix”** to `022-mastra-runtime-smoke-script.md`: which skill checklist rows are covered by `mastra-smoke.sh`, which are **explicitly out of scope** until staffing (browser MCP, cloud deploy).

---

## 11. Updated composite (with skill alignment)

| Layer | % | Δ from §7 |
| --- | ---: | --- |
| Architecture & sequencing | **89** | — |
| Doc ↔ code truth | **58** | — |
| Dependency graph | **90** | — |
| Merge hygiene / open PRs + live GH | **62** | **Δ §7** — **CONFLICTING** on #7/#8/#11; named check failures |
| **Mastra skill doc discipline** (embedded docs, ES2022, port agility) | **82** | **New** — plan does not yet *encode* the skill as enforceable checklist items |
| **Smoke parity vs mastra-smoke-test** | **68** | **New** — strong bash/API path; browser + full matrix deferred |

**Revised weighted composite: ~71–75%** (merge conflicts + skipped Supabase on #21 scored honestly) → **~85–88%** after: MASTRA-001 refresh, MASTRA-022↔skill parity doc, optional browser gate for releases, **landlord PRs rebased and Supabase Preview + e2e green**.

---

*End of audit. Re-run after: PR #21 merge, MASTRA-001 update, any migration adding audit/workflow tables, or changes to `.claude/skills/mastra*` / `mastra-smoke.sh`.*

---

## 12. Addendum (2026-05-10) — MCP docs, embedded docs, scoring

### 12a. Installed Mastra packages vs MCP doc coverage

`node_modules/@mastra/` may list **10+** packages (e.g. `client-js`, `core`, `duckdb`, `editor`, `evals`, `libsql`, `loggers`, `memory`, `observability`, `pg`). The Mastra MCP `listMastraPackages` path only surfaces packages that ship **embedded** prose under `dist/docs`. For **pg / observability / libsql / duckdb / client-js**, **fall back** to `node_modules/@mastra/<pkg>/dist` sources or `getMastraExports` — **do not assume MCP lists everything**.

### 12b. Embedded docs are necessary but not sufficient

Verifying only `node_modules/@mastra/core/dist/docs` can miss **provider/model strings**, **PostgresStore** construction details, and other APIs. Combine: **embedded docs + TypeScript exports + smoke** — **do not guess** model IDs or storage constructors from memory.

### 12c. One merge-hygiene score

§1 “Open PR queue (~72%)” and §7/§11 “Merge hygiene (~62%)” describe overlapping ideas. **Keep one column** in future audits (e.g. “merge queue + conflict state”) to avoid double-counting.

### 12d. Live verification snapshot (2026-05-10)

- **PR #7** Playwright failure on run `25240769698`: GitHub annotation — **billing lockout** (job never started); not a Playwright assertion failure.
- **PR #21** Supabase Preview: **SKIPPED** — still not a pass.
- **Local** `npm run smoke:runtime` can fail with **`ENOTEMPTY`** under `.mastra/output/` — clean output dir before smoke if it recurs.
