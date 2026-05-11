---
title: M22 fix-task pack verification (vs audit docs + mastra/links)
verified: 2026-05-10
inputs:
  - ../fix/README.md
  - ../fix/M22-01.md … M22-09.md
  - ../fix/17-pr-22.md ../fix/18-fixpr-22.md ../fix/15-fix-plan.md
skills_index: ../../../../.claude/skills/mastra/links.md
---

# M22 fix-task pack — verification audit

**Verdict: not 100% correct as-is.** The nine tasks and `README` are **strongly aligned** with [`fix/17-pr-22.md`](../fix/17-pr-22.md) / [`fix/18-fixpr-22.md`](../fix/18-fixpr-22.md) and with canonical URLs in [`.claude/skills/mastra/links.md`](../../../../.claude/skills/mastra/links.md). Blocking issues: **missing skill slug** (`mde-worktree-pr-flow`), **branch/workspace drift** (several target files absent on this checkout), and **minor doc nits** (line numbers, prose paths).

---

## 1. Executive score

| Criterion | Result |
| --- | :---: |
| Maps to forensic §3–§8 FIX FIRST + §7 improvements | **Yes** (see §4 matrix) |
| Mastra doc URLs resolve to [`links.md`](../../../../.claude/skills/mastra/links.md) topics | **Yes** |
| `README` “rejected claims” vs `provider-registry.mjs` | **Verified** (§2) |
| All internal skill paths exist | **No** — `mde-worktree-pr-flow` **missing** (§3) |
| All task file paths exist in **this** `my-mastra-app` tree | **No** — PR-scale app not present (§3) |
| **Overall: “100% correct”** | **No** — fix §3–§6, then re-audit |

---

## 2. `README.md` — rejected / environmental rows

### 2.1 Rejected audit claims *(script-checked 2026-05-10)*

| README row | Verification |
| --- | --- |
| `openai/gpt-5.5` valid | **Pass** — `node .claude/skills/mastra/scripts/provider-registry.mjs --provider openai` lists `gpt-5.5`. |
| `gemini-2.5-flash-lite` current | **Pass** — `--provider google` lists `gemini-2.5-flash-lite`. |
| `gemini-flash-lite-latest` exists | **Pass** — same output lists `gemini-flash-lite-latest`. |
| `start-async` HTTP vs SDK | **Pass** — `my-mastra-app/node_modules/@mastra/server/dist/docs/references/reference-server-routes.md` line 78: ``POST` `/api/workflows/:workflowId/start-async` | Start workflow and await result` — matches README. |

### 2.2 Environmental *(still valid)*

- Missing `OPENAI_API_KEY` / Infisical project errors: **operational**, not disputed by Mastra docs — aligns with [`17-pr-22.md`](../fix/17-pr-22.md) §3 and [`links.md`](../../../../.claude/skills/mastra/links.md) entry points plus [Infisical CLI usage](https://infisical.com/docs/cli/usage).

### 2.3 README nits

- **Provider registry path (display):** link target `../../../../.claude/skills/mastra/scripts/provider-registry.mjs` is **correct**; the **Markdown label** `\`/.claude/skills/...\`` reads like a filesystem root — prefer repo-relative label ``.claude/skills/mastra/scripts/provider-registry.mjs``.
- **`mastra reference (server)`:** [`https://mastra.ai/reference`](https://mastra.ai/reference) is correct hub; optional deep link: [Mastra server doc](https://mastra.ai/docs/server/mastra-server) per [`links.md` § Server & client](../../../../.claude/skills/mastra/links.md#server--client).

---

## 3. Blockers to “100% correct”

### 3.1 Missing skill: `mde-worktree-pr-flow`

`README.md`, `M22-01.md`, and `M22-07.md` reference **`.claude/skills/mde-worktree-pr-flow/`** — **no such directory** under `/home/sk/mde/.claude/skills/` (glob search 2026-05-10).

**Fix:** Point to an existing skill (e.g. [`.claude/skills/mde-github/SKILL.md`](../../../../.claude/skills/mde-github/SKILL.md) for `gh` + branch discipline, [`.claude/skills/mde-task-lifecycle/SKILL.md`](../../../../.claude/skills/mde-task-lifecycle/SKILL.md) for ship phases) or add the missing skill and re-link.

### 3.2 Workspace / branch drift (PR #22 vs local `my-mastra-app`)

On `/home/sk/mde` at verification time, `my-mastra-app/src/mastra/` contained **only** weather/ping/registry-style files — **no** `concierge.ts`, `concierge-routing-workflow.ts`, `rental-search-workflow.ts`, `search-attractions.ts`.

[`15-fix-plan.md`](../fix/15-fix-plan.md) notes **PR #21 merged** and “pull `main` locally” for router/concierge/tools. Tasks **M22-03 … M22-09** are **logically consistent** with the forensic audit descriptions but **cannot be line-verified** on this sparse tree until the branch matches the PR stack.

### 3.3 `tasks/prompts/mastra/` still untracked

`git ls-files tasks/prompts/mastra/` → **empty** — **M22-07 remains necessary** and is **factually accurate**.

[`links.md` § mdeai repository](../../../../.claude/skills/mastra/links.md#mdeai-repository) points at `tasks/prompts/mastra/tasks/mastra-prd.md` and `dashboard.md`; it does **not** mention `fix/` — **M22-07** should scope “track **`tasks/prompts/mastra/**`**” (already does) rather than implying `links.md` links to every subfolder.

### 3.4 Line-number drift (`M22-02`)

- **Task:** “lines 45 and 59”.
- **Current file:** [`weather-tool.ts`](../../../../my-mastra-app/src/mastra/tools/weather-tool.ts): first `fetch` ~**45**, second ~**56** (not 59).

**Fix:** Word as “both `fetch` calls in `getWeather`” or re-number after edits.

### 3.5 `M22-05` vs forensic wording

Audit ([`17-pr-22.md`](../fix/17-pr-22.md) §4) allowed **`.positive()` / `.nonnegative()`** for `maxPricePerTicket`. **M22-05** standardizes on **`.positive()`** everywhere — **fine** unless product needs **explicit zero caps** (“free”; “max $0”). If zero is legal, prefer **`.nonnegative()`** for those fields only.

---

## 4. Coverage matrix — M22 ↔ `17-pr-22.md` §8 / §7

| Audit target | Task | Match |
| --- | --- | --- |
| `mastra-smoke.sh` `.env` / process env | **M22-01** | **Full** |
| `weather-tool` unbounded fetch | **M22-02** | **Full** |
| Concierge memory enum drift | **M22-03** | **Full** |
| `freeOnly` routing | **M22-04** | **Full** |
| Negative / junk price persistence | **M22-05** | **Full** *(covers event-agent concierge rental paths per task text)* |
| `classifyDeterministic` regressions | **M22-06** | **Full** |
| Untracked planning docs | **M22-07** | **Full** |
| — | **M22-08** / **M22-09** | **Extra** vs original §8 list — **reasonable** hardening *(schema/prompt parity, rerank robustness)* |

### `18-fixpr-22.md` phase parity

| Phase | Tasks |
| --- | --- |
| A–B (secrets + smoke env) | M22-01 (+ env README row) |
| C (weather) | M22-02 |
| D (memory + prices + freeOnly) | M22-03, M22-04, M22-05 |
| E–F (smoke/Studio/registry) | Partially procedural in 18; M22-06 strengthens CI |
| G (git hygiene) | M22-07 |
| — | M22-08, M22-09 align with “polish” / CodeRabbit-class UX |

---

## 5. Per-task quick pass

| ID | Accuracy | Notes |
| --- | --- | --- |
| **M22-01** | **High** | Matches `mastra-smoke.sh` **L121–L122** `SMOKE_ENV_FILE=".env"` branch; refs [Studio](https://mastra.ai/docs/studio/overview), [deployment overview](https://mastra.ai/docs/deployment/overview) — both in [`links.md`](../../../../.claude/skills/mastra/links.md). Replace dead **mde-worktree-pr-flow**. |
| **M22-02** | **High** | Matches unbounded `fetch`; fix line **~56** citation; refs match [`links.md`](../../../../.claude/skills/mastra/links.md) *Tools*, *Workflows → error handling*. |
| **M22-03** | **Assume branch** | Refs [`memory/overview`](https://mastra.ai/docs/memory/overview), [`working-memory`](https://mastra.ai/docs/memory/working-memory) ✓ |
| **M22-04** | **Assume branch** | Refs workflows sections ✓; depends on tool already having `freeOnly` (as stated). |
| **M22-05** | **High** | Zod `.positive()` choice vs “nonnegative” edge case — document if $0 caps matter. |
| **M22-06** | **High** | `depends_on: [M22-04]` correct for **free museums** case; other cases can land before M22-04 if tests skip that assert until merged. |
| **M22-07** | **High** | Untracked state **confirmed**; fix skill link. |
| **M22-08** | **Assume branch** | Refs [structured output](https://mastra.ai/docs/agents/structured-output) ✓ |
| **M22-09** | **Assume branch** | Refs [workflows overview](https://mastra.ai/docs/workflows/overview), [control flow](https://mastra.ai/docs/workflows/control-flow) ✓ |

---

## 6. Companion docs

- [`09-fix.md`](../fix/09-fix.md) — **different thread** (network / `DATABASE_URL` / IPv6); does not contradict M22 pack; keep cross-links optional.
- [`15-fix-plan.md`](../fix/15-fix-plan.md) — **explains** why concierge workflows may be missing locally; **should be cited** from `README` when onboarding.

---

## 7. Re-audit checklist (to reach “100%”)

1. Replace or add **mde-worktree-pr-flow** references.
2. Reconcile **M22-02** line numbers (or drop exact numbers).
3. Pull / checkout tree that contains **PR #22** file set; re-validate **M22-03 … M22-09** line references (`concierge.ts`, workflows, `search-attractions.ts`).
4. Run **M22-07** so `git ls-files tasks/prompts/mastra/` is non-empty; update [`dashboard.md`](../../../../tasks/prompts/mastra/dashboard.md) if present.
5. Optionally align **M22-05** numeric policy with product (`.positive()` vs `.nonnegative()` for specific fields).

---

## Sources

- [`.claude/skills/mastra/links.md`](../../../../.claude/skills/mastra/links.md)
- [`.claude/skills/mastra/SKILL.md`](../../../../.claude/skills/mastra/SKILL.md) § References / Scripts
- [`fix/README.md`](../fix/README.md), [`fix/M22-01.md`](../fix/M22-01.md)–[`M22-09.md`](../fix/M22-09.md)
- [`fix/17-pr-22.md`](../fix/17-pr-22.md), [`fix/18-fixpr-22.md`](../fix/18-fixpr-22.md)
- Local checks: `provider-registry.mjs --provider openai|google`, `@mastra/server` `reference-server-routes.md`, `git ls-files`
