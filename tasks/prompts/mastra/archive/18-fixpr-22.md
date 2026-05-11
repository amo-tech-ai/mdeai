---
title: PR #22 — verified fix plan (post-audit)
type: context-plan
pr: https://github.com/amo-tech-ai/mdeai/pull/22
parent_audit: ./17-pr-22.md
date: 2026-05-10
status: Superseded by M22 tasks — phases map directly to task files
relates_to: [M22-01, M22-02, M22-03, M22-04, M22-05, M22-06, M22-07]
skills:
  - ../../../../.claude/skills/mastra/SKILL.md
  - ../../../../.claude/skills/mastra-smoke-test/SKILL.md
  - ../../../../.claude/skills/mastra/links.md
  - ../../../../.claude/skills/mde-infisical/SKILL.md
---

# PR #22 — fix plan *(verified against `17-pr-22.md` + skills)*

> **Purpose:** Detailed, phase-by-phase plan for resolving PR #22 production gaps. Each phase maps to one or more M22 task files. Use this document for context on the *why* behind each task.
>
> **Summary:**
> - PR #22 is open (`fix/mastra-pr21-coderabbit-findings`), not yet on `origin/main`
> - Phases A–C are P1 (must pass before merge); D–G are strongly recommended
> - Phase A → [mde-infisical skill](../../../../.claude/skills/mde-infisical/SKILL.md) + environmental fix
> - Phase B → [M22-01](M22-01.md) (smoke env file, already in PR #23)
> - Phase C → [M22-02](M22-02.md) (weather fetch timeouts)
> - Phase D → [M22-03](M22-03.md) (memory enum) + [M22-04](M22-04.md) (freeOnly) + [M22-05](M22-05.md) (positive numbers)
> - Phase G → [M22-06](M22-06.md) (vitest) + [M22-07](M22-07.md) (track docs)
>
> **Current status of phases:**
>
> | Phase | Title | M22 Task | Status |
> |---|---|---|---|
> | A | Secrets & Infisical | Environmental (not code) | 🔴 Local only — Infisical project membership issue |
> | B | Smoke env coherence | [M22-01](M22-01.md) | 🟡 In Progress (PR #23) |
> | C | Weather resilience | [M22-02](M22-02.md) | 🟢 Not Started |
> | D | Memory & schema alignment | [M22-03](M22-03.md), [M22-04](M22-04.md), [M22-05](M22-05.md) | 🟢/🔴 Mixed |
> | E | Smoke parity & Studio | All tasks | 🟡 Partially done (Studio verified 7 agents) |
> | F | Model IDs & docs | Not a separate task (model IDs verified valid) | ✅ No action needed |
> | G | Repo hygiene | [M22-06](M22-06.md), [M22-07](M22-07.md) | 🔴 Blocked / 🟢 Ready |
>
> **Key skills:** [mastra](../../../../.claude/skills/mastra/SKILL.md) · [mastra-smoke-test](../../../../.claude/skills/mastra-smoke-test/SKILL.md) · [mde-infisical](../../../../.claude/skills/mde-infisical/SKILL.md)

This plan closes the **production-gate gaps** listed in **`17-pr-22.md`** §§3–7. **Git mergeability alone is not exit criteria.**

**Doc index:** [`mastra/links.md`](../../../../.claude/skills/mastra/links.md) (canonical Mastra URLs; [llms.txt](https://mastra.ai/llms.txt)). **`17-pr-22.md`** maps the same gaps in **§3a · §4a · §5 proof · §6 proof · §7a · §8a** plus Studio proof after **§8 NEXT COMMANDS**. Below, **every phase** ends with **Proof (exact)** lines (HTTPS doc + repo skill path §).

---

## Phase A — Secrets & Infisical (unblocks smoke)

| Step | Action | Done |
| --- | --- | --- |
| A1 | Fix **machine identity / project**: resolve `Project with ID … not found` — correct **Infisical project**, **environment**, `.infisical.json` / `.env.infisical` per [mde-infisical SKILL](../../../../.claude/skills/mde-infisical/SKILL.md). | ☐ |
| A2 | Ensure **`OPENAI_API_KEY`** and **`GOOGLE_GENERATIVE_AI_API_KEY`** resolve under `infisical run` (or document **OpenAI-only** path if Gemini dropped for Mastra). | ☐ |
| A3 | **`DATABASE_URL`**: reachable from smoke host (**local `:54322`** pooler smoke URL or `.env`). | ☐ |
| DoD | `infisical run -- npm --prefix my-mastra-app run smoke:runtime` **OR** `.env` with all keys + `npm run smoke:runtime` **exits 0**. | |

**Proof (exact — web + skill §):**

- **A1:** [Infisical CLI usage](https://infisical.com/docs/cli/usage) · [`mde-infisical/SKILL.md` § Repo-specific pointers (mdeai.co)](../../../../.claude/skills/mde-infisical/SKILL.md#repo-specific-pointers-mdeaico) · [`mde-infisical/SKILL.md` § Decision rule](../../../../.claude/skills/mde-infisical/SKILL.md#decision-rule) → load [`agent.md`](../../../../.claude/skills/mde-infisical/agent.md) / [`api.md`](../../../../.claude/skills/mde-infisical/api.md) as listed in the intent table  
- **A2:** [Mastra — agents overview](https://mastra.ai/docs/agents/overview) · [Models — OpenAI](https://mastra.ai/models/providers/openai) · [`mastra/SKILL.md` § Scripts → `provider-registry.mjs`](../../../../.claude/skills/mastra/SKILL.md)  
- **A3:** [`mastra-smoke-test/references/tests/setup.md`](../../../../.claude/skills/mastra-smoke-test/references/tests/setup.md) *(see § **Storage Backend (\`--db\`)**)* · [Mastra — memory storage](https://mastra.ai/docs/memory/storage)

---

## Phase B — `mastra-smoke.sh` env coherence *(CodeRabbit P1)*

| Step | Action | Done |
| --- | --- | --- |
| B1 | **Never** assume `SMOKE_ENV_FILE=.env` is correct when **`DATABASE_URL` / keys** come from **process env** only. | ☐ |
| B2 | **Preferred:** when Postgres fallback inactive, **`mktemp` env file** and write **`OPENAI_*`**, **`GOOGLE_*`**, **`DATABASE_URL`** from **`env_value`/process** (mirror the pg-ready branch logic). Pass **`--env`** to that temp file. | ☐ |
| B3 | Log **`SMOKE_ENV_FILE` source** explicitly (`temp-assembled` vs `.env` vs `local-smoke-db`). | ☐ |
| DoD | Smoke passes with **secrets only in process env** (no `.env` file present). Matches **Setup** honesty in **[mastra-smoke-test](../../../../.claude/skills/mastra-smoke-test/SKILL.md)**. | |

**Proof (exact — web + skill §):**

- **B1–B3:** [Mastra — project structure](https://mastra.ai/docs/getting-started/project-structure) · [`mastra-smoke-test/SKILL.md` § Mandatory Test Checklist](../../../../.claude/skills/mastra-smoke-test/SKILL.md#-mandatory-test-checklist) → **Setup** → [`references/tests/setup.md`](../../../../.claude/skills/mastra-smoke-test/references/tests/setup.md) *(§ **Multi-Environment Config**; § **Storage Backend (\`--db\`)**)*  
- **Index:** [`mastra/links.md` § Getting started](../../../../.claude/skills/mastra/links.md#getting-started)

---

## Phase C — `weather-tool.ts` resilience

| Step | Action | Done |
| --- | --- | --- |
| C1 | Wrap **geocode** + **forecast** `fetch` with **`AbortSignal.timeout(T)`** or equivalent (e.g. 8–15s). | ☐ |
| C2 | Map **abort** vs **HTTP non-OK** to clear tool errors (no silent hang). | ☐ |
| DoD | Forced hang test: tool returns failure within **`T`** seconds. | |

**Proof (exact — web + skill §):**

- **C1–C2:** [Mastra — agents using tools](https://mastra.ai/docs/agents/using-tools) · [Mastra — workflow error handling](https://mastra.ai/docs/workflows/error-handling) · [MDN — `AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) · [Mastra — creating tools](https://mastra.ai/docs/tools/creating-tools) · [`mastra/references/common-errors.md`](../../../../.claude/skills/mastra/references/common-errors.md) · [`mastra/links.md` § Tools (docs section)](../../../../.claude/skills/mastra/links.md#tools-docs-section)

---

## Phase D — Memory & schema alignment *(intent drift)*

| Step | Action | Done |
| --- | --- | --- |
| D1 | Update **`concierge.ts`** working memory / intent enums to include **`restaurant_search`** and **`attraction_search`** *(or successor names matching routing workflow)* — align with **[Memory overview](https://mastra.ai/docs/memory/overview)** usage. | ☐ |
| D2 | **`event-agent.ts`**: **`maxPricePerTicket`** `.nonnegative()` or `.positive()` to match **`search-events` / workflows**. | ☐ |
| D3 | **`concierge-routing-workflow.ts`**: classify + forward **`freeOnly`** into attraction search payload. Add regression string “free museums”. | ☐ |
| DoD | Manual or unit checks: concierge follow-ups stay on correct vertical after restaurants/attractions turns. | |

**Proof (exact — web + skill §):**

- **D1:** [Mastra — memory overview](https://mastra.ai/docs/memory/overview) · [Working memory](https://mastra.ai/docs/memory/working-memory) · [`mastra/links.md` § Memory](../../../../.claude/skills/mastra/links.md#memory)  
- **D2:** [Mastra — creating tools](https://mastra.ai/docs/tools/creating-tools) (tool/agent input schemas) · [`mastra/links.md` § Tools](../../../../.claude/skills/mastra/links.md#tools-docs-section)  
- **D3:** [Mastra — workflows overview](https://mastra.ai/docs/workflows/overview) · [Workflow state](https://mastra.ai/docs/workflows/workflow-state) · [Agents & tools in workflows](https://mastra.ai/docs/workflows/agents-and-tools) · [`mastra/links.md` § Workflows](../../../../.claude/skills/mastra/links.md#workflows)

---

## Phase E — Smoke parity & Studio *(skill matrix)*

| Step | Action | Done |
| --- | --- | --- |
| E1 | Add **curl probes** for **conciergeRoutingWorkflow** (or slug used in API) + **one agent** expanded in #22 *(rental/event as minimum)* once stable **API paths** known. Reference **[mastra Studio](https://mastra.ai/docs/studio/overview)** for manual matrix. | ☐ |
| E2 | **Release-grade** (recommended): browser pass on **`http://127.0.0.1:<printed-port>`** `/agents`, `/workflows`, `/tools` — **[Local Studio Browser Smoke](../../../../.claude/skills/mastra-smoke-test/SKILL.md)**. | ☐ |
| E3 | Document **which** checklist rows `#11-step` smoke **explicitly skips** (*traces/scorers/memory/MCP*) until staffed. | ☐ |
| DoD | Maintainer sign-off checklist in PR body with timestamps / screenshots optional. | |

**Proof (exact — web + skill §):**

- **E1:** [Mastra Studio overview](https://mastra.ai/docs/studio/overview) · [Mastra server](https://mastra.ai/docs/server/mastra-server) · [Custom API routes](https://mastra.ai/docs/server/custom-api-routes) · [`mastra/links.md` § Studio](../../../../.claude/skills/mastra/links.md#studio) · § [Server & client](../../../../.claude/skills/mastra/links.md#server--client)  
- **E2:** [`mastra-smoke-test/SKILL.md` § Local Studio Browser Smoke](../../../../.claude/skills/mastra-smoke-test/SKILL.md#local-studio-browser-smoke) (route table `/agents`, `/workflows`, `/tools`, `/observability`, …)  
- **E3:** [`mastra-smoke-test/SKILL.md` § Mandatory Test Checklist](../../../../.claude/skills/mastra-smoke-test/SKILL.md#-mandatory-test-checklist) (rows **Traces / Scorers / Memory / MCP** point to [`references/tests/`](../../../../.claude/skills/mastra-smoke-test/references/tests/))

---

## Phase F — Model IDs & docs truth

| Step | Action | Done |
| --- | --- | --- |
| F1 | Run **`my-mastra-app/scripts/provider-registry.mjs`** (per **[mastra SKILL](../../../../.claude/skills/mastra/SKILL.md)**) and paste **verbatim** IDs into PR § “Model table”. | ☐ |
| F2 | Reconcile **`google/gemini-flash-lite-latest`** vs **`openai/gpt-5.4-mini`** between **commit messages**, **CodeRabbit**, and **`HEAD`** — one source of truth. | ☐ |
| DoD | No contradictory “pinned to Gemini” text if code uses **`openai/…`**. | |

**Proof (exact — web + skill §):**

- **F1–F2:** [Models hub](https://mastra.ai/models) · [OpenAI provider](https://mastra.ai/models/providers/openai) · [`my-mastra-app/scripts/provider-registry.mjs`](../../../../my-mastra-app/scripts/provider-registry.mjs) · [`mastra/SKILL.md` § Scripts](../../../../.claude/skills/mastra/SKILL.md) · [`mastra/links.md` § Models](../../../../.claude/skills/mastra/links.md#models)

---

## Phase G — Repo hygiene *(audit red flags)*

| Step | Action | Done |
| --- | --- | --- |
| G1 | **Track** `tasks/prompts/mastra/notes/` (and prompts you cite in PRs) **in git** if they are contractual. | ☐ |
| G2 | Update **PR #22 description** stats → **17 files**, **~+1023** (live API). | ☐ |
| G3 | Optional: **`vitest`** in `my-mastra-app` for **`classifyDeterministic`** regressions (**`17-pr-22.md`** §7). | ☐ |
| DoD | `git diff` free of stray `.mastra` artifacts if pre-commit lint runs repo-wide | |

**Proof (exact — web + skill §):**

- **G1:** [Git documentation](https://git-scm.com/doc) · **`17-pr-22.md` §7a** Git hygiene row  
- **G2:** [GitHub CLI — `gh pr edit`](https://cli.github.com/manual/gh_pr_edit) *(update PR body)*  
- **G3:** [Mastra — running evals in CI](https://mastra.ai/docs/evals/running-in-ci) · [Vitest guide](https://vitest.dev/guide/) · **`17-pr-22.md` §7a** Classifier tests row  
- **`.mastra` / lint:** [`mastra/links.md` § This skill (local files)](../../../../.claude/skills/mastra/links.md#this-skill-local-files) *(embedded docs / codegen expectations)*  

---

## Gate commands *(re-run before merge claim)*

```bash
npm --prefix my-mastra-app run typecheck
npm --prefix my-mastra-app run build
npm --prefix my-mastra-app run test    # exits 0 today = shim — note in PR until real tests land
npm --prefix my-mastra-app run smoke:runtime    # keys + Phase B fixes
npm run lint    # root — track debt separately
```

**Proof (gate commands — web + skill §):** [`mastra/SKILL.md` § Priority order for writing code](../../../../.claude/skills/mastra/SKILL.md#priority-order-for-writing-code) · [`mastra-smoke-test/SKILL.md` § Mandatory Test Checklist](../../../../.claude/skills/mastra-smoke-test/SKILL.md#-mandatory-test-checklist) · [Studio overview](https://mastra.ai/docs/studio/overview) · **`17-pr-22.md`** §5 proof table

---

## Verified against `17-pr-22.md`

| Audit § | Planned phase |
| --- | --- |
| §3 blockers **1–2** | A, B |
| §3 blocker **4** | C |
| §4 concierge memory | D1 |
| §4 **maxPricePerTicket** | D2 |
| §4 **`freeOnly`** | D3 |
| §7 smoke/browser | E |
| §5 provider/registry | F |
| §4 untracked docs / stale body | G |

**No contradictions:** this plan assumes **MERGE FIRST / PROD GATE** wording in `17-pr-22.md` — ship only after phases **A–C** minimum; **D–G** strongly recommended same PR or immediate follow-up.
