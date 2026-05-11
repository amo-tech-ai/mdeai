---
title: Mastra Task Audit
status: Active
created: 2026-05-10
scope:
  - /home/sk/mde/tasks/mastra
  - /home/sk/mde/tasks/prompts/mastra
auditor: Codex
---

# Mastra Task Audit

## 1. Executive Verdict

The Mastra plan is directionally correct, but the task pack is not yet uniformly execution-ready.

| Area | Score | Meaning |
| --- | ---: | --- |
| Architecture correctness | 84% | The core split is right: Mastra orchestrates, Supabase owns truth, OpenClaw executes only, Paperclip governs. |
| Prompt/task quality | 72% | Tasks `001-011` are mostly production-shaped; `012-019` are shorter specs and need full lifecycle sections before assignment. |
| Current implementation readiness | 49% | `my-mastra-app` exists and uses PostgresStore config, but domain agents/tools, audit tables, workflow tables, and frontend integration are not wired. |
| Production readiness | 34% | Safe architecture is planned, but approvals, rate limits, tenant isolation, audit DB writes, and observability must be implemented before real users. |

Bottom line:

```text
Correct strategy, incomplete execution pack.
Do not start real estate/events/restaurants agents until MASTRA-003, 012, 013, 014, 015, 018, and 019 are made executable and verified.
```

## 2. Evidence Checked

Read and verified:

- `/home/sk/mde/.claude/skills/mastra/SKILL.md`
- `/home/sk/mde/.claude/skills/mastra/references/cli.md`
- `/home/sk/mde/tasks/mastra/*.md`
- `/home/sk/mde/tasks/prompts/mastra/tasks/*.md`
- `/home/sk/mde/tasks/prompts/real-estate/*.md`
- `/home/sk/mde/tasks/prompts/event_prompts/*.md`
- `/home/sk/mde/tasks/prompts/vector/*.md`
- `/home/sk/mde/my-mastra-app/package.json`
- `/home/sk/mde/my-mastra-app/src/mastra/**`

Proof from local checks:

| Check | Result |
| --- | --- |
| Mastra app folder | `/home/sk/mde/my-mastra-app` exists |
| OpenAI env file | `/home/sk/mde/my-mastra-app/.env` contains `OPENAI_API_KEY=` without printing the value |
| Installed Mastra packages | `@mastra/core`, `@mastra/memory`, `@mastra/observability`, `@mastra/client-js`, `@mastra/pg`, `mastra` installed |
| Missing Mastra package | `@mastra/ai-sdk` is not installed |
| Storage config | `createPostgresStore()` reads `DATABASE_URL` and uses `@mastra/pg` |
| Runtime at audit moment | `http://localhost:4111` returned connection refused; dev server was not running during this audit |
| Source inventory status | `/home/sk/mde/tasks/mastra/mastra-source-inventory.md` says `MASTRA-001` is Complete |
| Prompt status drift | `/home/sk/mde/tasks/prompts/mastra/tasks/001-mastra-source-inventory.md` still says Not Started |
| Git tracking | `git status --short` reports `tasks/mastra/`, `tasks/prompts/mastra/tasks/`, and this audit doc as untracked in this checkout |

## 3. Hard Blockers

| Blocker | Severity | Why it blocks | Fix |
| --- | --- | --- | --- |
| `MASTRA-001` and `MASTRA-002` status drift | High | Task prompts say Not Started while source inventory/runtime scaffold work exists. Agents may repeat or overwrite work. | Update statuses to `Complete` or `In Progress` with evidence. |
| `MASTRA-012` through `MASTRA-019` are short-form specs | High | They do not consistently match the full prompt template used by `001-011`. | Expand each with Purpose, Goals, Success Criteria, Wiring Plan, Verification, Red Flags, Rollback. |
| Dependency IDs mismatch external tasks | High | `MASTRA-006` references `RE-001`, but real files use `001-wire-public-contact-loop.md` style. `MASTRA-008` references `EVT-071`, but real file is `071-restaurant-reservations-schema.md`. | Add a dependency alias map or update task IDs to exact canonical IDs. |
| VDB local/remote drift | High | Inventory says `hybrid_search_*` exists on remote but not local. Mastra search tests can pass in one environment and fail in another. | Create/apply local migration or make MASTRA-004 explicitly support semantic fallback locally. |
| Missing Mastra approval bridge task | High | Plans rely on Paperclip approvals, but there is no dedicated Mastra task that defines Paperclip approval request/approval result integration. | Add `MASTRA-020 Paperclip Approval Bridge`. |
| `@mastra/ai-sdk` missing | Medium | `MASTRA-016`/`019` and AI SDK UI guide patterns may need this package. | Install only when implementing the AI SDK route layer, after checking installed docs. |
| Runtime not running at audit moment | Medium | Setup is not continuously available for proof. | Start with `MASTRA_DEV_NO_CACHE=1 npm run dev` via bgproc, then check `http://localhost:4111` and `/swagger-ui`. |
| Broken alias links in `/tasks/mastra` stubs | Medium | Operators clicking from docs land on wrong paths. | Fix links to `../prompts/mastra/tasks/...`. |
| Mastra task folders untracked | Medium | The generated plans/tasks can disappear from future clones/agents if not added intentionally. | Decide whether to track them, then stage only the approved task/docs files. |

## 4. Canonical Task Audit

| Task | File | Correct | Execution-ready | Main issue | Required fix |
| --- | --- | ---: | ---: | --- | --- |
| Index | `tasks/prompts/mastra/tasks/000-index.md` | 82% | 70% | Good ordering, but several links point to `prompts/mastra/tasks/...` from the wrong relative location. | Fix relative links and dependency aliases. |
| `MASTRA-001` | `001-mastra-source-inventory.md` | 92% | 96% | Prompt says Not Started, but output doc says Complete. | Mark complete with proof, do not rerun unless inventory is stale. |
| `MASTRA-002` | `002-mastra-core-runtime-scaffold.md` | 86% | 72% | App exists, but prompt says Not Started; runtime currently not running; weather demo still present. | Mark In Progress or Complete after Studio/build proof; replace weather placeholder later. |
| `MASTRA-003` | `003-mastra-tool-audit-control-events.md` | 90% | 78% | Correct safety foundation, but depends on missing tables. | Implement before any vertical agent. |
| `MASTRA-004` | `004-mastra-hybrid-search-tools.md` | 82% | 64% | Blocked by local/remote VDB drift. | Add local migration or semantic fallback and tests. |
| `MASTRA-005` | `005-mastra-chat-router-concierge.md` | 86% | 70% | Correct product surface, but depends on search, audit, tenant context, rate limits, and registry. | Do after `003/012/013/014/015`. |
| `MASTRA-006` | `006-mastra-real-estate-mvp-agents.md` | 78% | 58% | Too many external dependencies, and `RE-*` IDs do not match actual filenames. | Normalize RE dependency IDs; split into smaller agent/tool phases. |
| `MASTRA-007` | `007-mastra-events-mvp-runtime.md` | 80% | 60% | Correct gates, but event ticketing remote/local readiness must be proven first. | Add deterministic ticketing proof checklist before Mastra orchestration. |
| `MASTRA-008` | `008-mastra-restaurants-mvp-discovery.md` | 76% | 55% | `EVT-071` dependency alias is wrong and native booking should stay later. | Use exact `071-restaurant-reservations-schema.md`; keep discovery-only MVP. |
| `MASTRA-009` | `009-mastra-ui-dojo-chat-frontend.md` | 84% | 66% | Correct reference, but frontend route strategy depends on `019` and maybe `@mastra/ai-sdk`. | Decide SDK vs BFF path before UI work. |
| `MASTRA-010` | `010-mastra-memory-rag-mvp.md` | 78% | 56% | Good post-MVP feature, but VDB-02/user-memory pipeline is not ready. | Delay until tenant-safe memory and PII rules exist. |
| `MASTRA-011` | `011-mastra-observability-evals-guardrails.md` | 88% | 72% | Correct production prerequisite. | Implement before high-stakes vertical agents; define scorer pass/fail thresholds. |
| `MASTRA-012` | `012-mastra-workflow-state-runtime.md` | 82% | 52% | Good design, but short-form task; acceptance is not as detailed as `001-011`. | Expand to full task format and add migration/RLS/test details. |
| `MASTRA-013` | `013-mastra-tenant-isolation.md` | 84% | 54% | Essential, but needs concrete JWT/request context mapping. | Add exact header/context contract and RLS test matrix. |
| `MASTRA-014` | `014-mastra-ai-rate-limits.md` | 82% | 56% | Correct but needs concrete budget dimensions and failure behavior. | Define per-user/org/model/tool quotas and `retry-after` behavior. |
| `MASTRA-015` | `015-mastra-tool-registry-system.md` | 86% | 60% | Correct safety layer, but must align with existing tool registry code. | Generate registry schema, risk enum, and wrapper tests. |
| `MASTRA-016` | `016-mastra-streaming-ui-state.md` | 76% | 48% | Useful, but premature before `005/009/019/018`. | Delay until one real streamed workflow exists. |
| `MASTRA-017` | `017-mastra-workflow-recovery.md` | 74% | 45% | Correct later reliability slice, but too advanced before workflow volume. | Keep Phase 2; add minimal retry only in `012/014`. |
| `MASTRA-018` | `018-mastra-human-handoff-runtime.md` | 86% | 58% | Essential before real estate/events, but not full prompt format. | Expand and define Paperclip/operator handoff states. |
| `MASTRA-019` | `019-mastra-client-sdk-integration.md` | 84% | 62% | Correct need; client package installed, but route/server strategy unresolved. | Choose `@mastra/client-js` plus BFF or `@mastra/ai-sdk` route helper path. |
| `20-mastra.md` | `tasks/prompts/mastra/tasks/20-mastra.md` | 76% | 40% | Good plan doc, but stale: says `@mastra/client-js` is missing, now installed. | Mark reference-only and update stale blockers. |
| `21-mastra-repos-templates.md` | `21-mastra-repos-templates.md` | 78% | 35% | Useful source review, but some repo claims are corrected by `23`. | Treat `23` as authoritative correction. |
| `22-mastra-repos-extract-tasks.md` | `22-mastra-repos-extract-tasks.md` | 80% | 45% | Useful extraction plan, but not a canonical implementation task pack. | Pull only the approved extracts into `MASTRA-*` tasks. |
| `23-mastra-modules-verified.md` | `23-mastra-modules-verified.md` | 92% | 70% | Strong source catalogue and corrections. | Keep as source-of-truth reference; refresh quarterly. |

## 5. `/tasks/mastra` Document Audit

| File | Correct | Red flag | Recommendation |
| --- | ---: | --- | --- |
| `000-index.md` | 55% | Canonical path/link is wrong. It references `../prompts/mastra/000-index.md`, but actual index is `../prompts/mastra/tasks/000-index.md`. | Fix link immediately. |
| `01-mastra.md` | 40% | Contains low-quality citation artifacts like `github+1`, `supabase+1`, and pushes LangGraph/OpenClaw/n8n too early. | Archive or mark reference-only. Do not execute from this doc. |
| `02-mastra.md` | 70% | Better high-level plan, but still not execution-grade. | Keep as beginner summary only. |
| `03-real-estate-plan.md` | 88% | Strong domain plan, but very broad. | Keep as product plan; execution should happen through `MASTRA-006` after blockers. |
| `03-real-estate.md` | 74% | Useful review, not an implementation plan. | Reference only. |
| `03.1-realestate-prompt.md` | 72% | Prompt text, not a task. | Reference only. |
| `04-openclaw.md` | 82% | Correct execution-only boundary; not a Mastra task. | Keep as architecture reference. |
| `05-events-mastra-plan.md` | 86% | Strong plan, but events must stay deterministic around ticketing/payment/check-in. | Use as source for `MASTRA-007`, not direct execution. |
| `05.1-events-mastra.md` | 72% | Likely strategy/reference text. | Reference only. |
| `05.2-Mastra-Events.md` | 52% | Messy external/source formatting and broad claims. | Archive or consolidate into `05-events-mastra-plan.md`. |
| `05.3-events-mastra.md` | 72% | Strategy text, not executable. | Reference only. |
| `012-019` stubs | 45% | Links are wrong from this folder. | Fix links to `../prompts/mastra/tasks/<file>.md`. |
| `mastra-prd.md` | 86% | Good central PRD, but must point to current implementation state. | Keep; update after audit fixes. |
| `mastra-roadmap.md` | 88% | Good phased strategy. | Keep; add MASTRA-020 and status fixes. |
| `mastra-runtime-runbook.md` | 84% | Useful, but `PATH="$HOME/.../bin:$PATH" hash -r` should be split into two commands. | Fix command syntax and add `curl /swagger-ui` proof. |
| `mastra-source-inventory.md` | 92% | Strong evidence pack. | Use as status authority for MASTRA-001. |
| `mastra-task-review.md` | 76% | Partly stale because later tasks and package state changed. | Update after this audit. |

## 6. Red Flags And Failure Points

### Red Flags

- The plan has multiple "source of truth" docs. Use this order:

```text
1. tasks/prompts/mastra/tasks/*.md
2. tasks/mastra/mastra-roadmap.md
3. tasks/mastra/mastra-prd.md
4. tasks/mastra/domain plans
5. older research docs
```

- `MASTRA-001` is already complete, but the prompt still says Not Started.
- `my-mastra-app` is scaffolded, but the task still says Not Started.
- External dependency IDs are human-readable but not machine-resolvable.
- `MASTRA-006/007/008` are too tempting to start before the safety substrate is built.
- `MASTRA-010` memory/RAG can leak PII if implemented before tenant isolation and retention rules.
- Paperclip approvals are assumed but not yet represented as a concrete Mastra integration task.
- Runtime proof is currently manual and fragile; Studio was not running during this audit.

### Failure Points

| Failure point | Likely symptom | Prevention |
| --- | --- | --- |
| Starting vertical agents too early | AI says "done" without audited writes or approvals | Do `003/012/013/014/015/018/019` first |
| Search tool environment drift | Local tests fail or production behavior differs | Reconcile VDB local/remote migration |
| Browser direct-to-Mastra secrets | Service tokens leak to Vite bundle | BFF or short-lived Supabase JWT only |
| OpenClaw direct execution | Duplicate or unsafe WhatsApp/social actions | OpenClaw only through approved jobs |
| Paperclip missing approval path | High-risk tool returns vague "approval needed" | Add approval bridge task with state machine |
| Weather scaffold remains | Domain smoke tests accidentally test demo behavior | Replace with mdeAI ping/router smoke tests |
| Running build while dev server owns `.mastra/output` | Studio 500 / missing static assets | Stop dev before build, restart dev after build |

## 7. Missing Tasks To Add

| New task | Priority | Why |
| --- | --- | --- |
| `MASTRA-020 Paperclip Approval Bridge` | P0 | Convert approval assumptions into concrete API/tool/workflow states. |
| `MASTRA-021 VDB Local/Remote Reconciliation` | P0 | Make hybrid search deterministic in local and production. |
| `MASTRA-022 Runtime Startup Smoke Test` | P0 | One repeatable proof script for Studio, Swagger, health, build, and package sanity. |
| `MASTRA-023 Replace Weather Demo With mdeAI Ping Router` | P0 | Remove template drift and prove the runtime is mdeAI-shaped. |
| `MASTRA-024 Mastra Env And Secret Boundary` | P0 | Formalize `.env`, Vite env denylist, BFF/JWT ingress, and log redaction. |
| `MASTRA-025 Task Dependency Alias Map` | P1 | Map `RE-*`, `EVT-*`, `VDB-*`, `PAPERCLIP-*` to exact file paths. |

## 8. Startup Core Checklist

Use this before any new Mastra implementation session:

```bash
cd /home/sk/mde
git status --short

cd /home/sk/mde/my-mastra-app
PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
hash -r

node -v
npm -v
npm ls --depth=0 @mastra/core @mastra/pg @mastra/client-js @mastra/ai-sdk mastra || true

test -f .env && grep -q '^OPENAI_API_KEY=' .env && echo "OPENAI_API_KEY present"
test -n "$DATABASE_URL" || echo "DATABASE_URL must be loaded before runtime boot"

# Start dev server
MASTRA_DEV_NO_CACHE=1 npx --yes bgproc start -n my-mastra-app -w -- npm run dev
npx --yes bgproc list

# Proof checks
curl -I http://localhost:4111
curl -I http://localhost:4111/swagger-ui
npm run build
```

Important:

- If `npm run build` runs while dev is active and Studio breaks, stop bgproc, rebuild, then restart dev.
- Do not add domain tools until `DATABASE_URL`, audit tables, tenant context, and rate limits are verified.
- Use installed docs first:

```bash
ls node_modules/@mastra/
find node_modules/@mastra -path '*dist/docs*' -type f | head
```

## 9. Mastra Skill Improvement

Applied now:

- Added `/home/sk/mde/.claude/skills/mastra/references/cli.md` to `/home/sk/mde/.claude/skills/mastra/SKILL.md` so future Mastra setup/debugging can find the CLI reference directly.

Still recommended:

- Add a dedicated `references/mdeai-startup-checklist.md` to the Mastra skill or keep this audit checklist as the canonical project checklist.
- Add a warning to the skill: do not trust Homebrew `node` when `nvm` is expected; verify `which node` and `node -v`.
- Add a warning to stop `mastra dev` before production build checks when Studio output is being regenerated.

## 10. Corrected Execution Order

Use this order from here:

| Order | Work | Reason |
| ---: | --- | --- |
| 1 | Fix doc link/status drift | Stops agents from following stale tasks. |
| 2 | `MASTRA-021` VDB reconciliation | Search must behave the same locally and remotely. |
| 3 | `MASTRA-022` startup smoke test | Gives repeatable proof before coding. |
| 4 | Finish `MASTRA-002` proof | Runtime must be green before tools. |
| 5 | Implement `MASTRA-003` audit/control events | Required before any risky tool. |
| 6 | Expand and implement `MASTRA-012` workflow state | Durable-enough run tracking before workflows. |
| 7 | Expand and implement `MASTRA-013/014/015` | Tenant, budget, registry safety. |
| 8 | Add `MASTRA-020` Paperclip approval bridge | Required before OpenClaw/WhatsApp/payments. |
| 9 | Implement `MASTRA-004` hybrid search | First useful read-only tool layer. |
| 10 | Implement `MASTRA-005` concierge/router | First user-visible Mastra surface. |
| 11 | Implement `MASTRA-019` and `009` | Frontend integration after stable agent contract. |
| 12 | Implement `MASTRA-011` | Observability/evals before vertical agents. |
| 13 | Start `MASTRA-006` real estate MVP | First revenue wedge. |
| 14 | Start `MASTRA-007` events MVP | After deterministic ticketing proof. |
| 15 | Start `MASTRA-008` restaurants discovery | P1, discovery first, booking later. |

## 11. Final Pass/Fail

| Category | Result |
| --- | --- |
| Are the tasks conceptually correct? | Pass with corrections |
| Are all tasks ready for an agent to execute? | Fail |
| Is the current Mastra app installed? | Pass |
| Is the current Mastra app running during audit? | Fail |
| Are all safety prerequisites present? | Fail |
| Should vertical agents start now? | No |
| Should core runtime/safety tasks continue now? | Yes |

Recommended next action:

```text
Fix status/link drift, create MASTRA-020/021/022/023/024/025, then complete MASTRA-002 proof and MASTRA-003 safety tables before any rentals/events/restaurants agent work.
```
