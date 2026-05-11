---
title: Mastra Skills, MCP, And Smoke Audit
status: Active
created: 2026-05-10
scope:
  - /home/sk/mde/tasks/prompts/mastra/tasks
  - /home/sk/mde/tasks/mastra
  - /home/sk/mde/.claude/skills/mastra
  - /home/sk/mde/.agents/skills/mastra-smoke-test
  - /home/sk/mde/.mcp.json
  - /home/sk/mde/my-mastra-app
---

# Mastra Skills, MCP, And Smoke Audit

## 1. Verdict

The Mastra task pack is architecturally sound but still not ready for autonomous execution. The strongest pieces are `001-011` and the source catalogue `23`. The weakest pieces are runtime proof, dependency naming, task status drift, and short-form specs `012-019`.

| Area | Result | Score |
| --- | --- | ---: |
| Mastra skill usage | Pass | 92% |
| Mastra MCP config | Pass | 95% |
| Mastra smoke readiness | Fail | 42% |
| Task pack structure | Mixed | 70% |
| Production readiness | Not yet | 36% |

Operational summary:

```text
MCP is connected.
Typecheck passes.
Build passes.
Runtime smoke fails because Studio/API do not answer on localhost:4111.
Several docs still say Not Started even when work exists.
Do not start vertical Mastra agents yet.
```

## 2. Sources And Skills Used

Used:

- `/home/sk/mde/.claude/skills/mastra/SKILL.md`
- `/home/sk/mde/.claude/skills/mastra/references/cli.md`
- `/home/sk/mde/.agents/skills/mastra-smoke-test/SKILL.md`
- `/home/sk/mde/.agents/skills/mastra-smoke-test/references/tests/setup.md`

MCP verified:

```text
mastra:
  Scope: Project config (shared via .mcp.json)
  Status: Connected
  Type: stdio
  Command: npx
  Args: -y @mastra/mcp-docs-server@latest
```

Important limitation:

- The Mastra MCP docs server is connected for Claude Code.
- In this Codex session, it is verified via `claude mcp get/list`, not exposed as a native callable MCP tool.
- For implementation, still follow the Mastra skill rule: use installed package docs in `node_modules/@mastra/*/dist/docs` first.

## 3. Smoke Evidence

Commands attempted:

```bash
cd /home/sk/mde/my-mastra-app
PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
hash -r
npm run typecheck
npm run health
npm run build
curl http://localhost:4111
curl http://localhost:4111/swagger-ui
claude mcp get mastra
claude mcp list
```

Results:

| Check | Result | Notes |
| --- | --- | --- |
| MCP `mastra` | Pass | Connected from project `.mcp.json`. |
| Node with forced nvm path | Pass | `v22.22.2`. |
| Default shell Node | Fail risk | `which node` resolves to Homebrew Node `v25.9.0`, not nvm Node 22. |
| `npm run typecheck` | Pass | `tsc --noEmit` exited 0. |
| `npm run build` | Pass | `mastra build` completed successfully. |
| `npm run health` | Weak pass | Exited 0 but printed nothing. It is not proof-quality health output. |
| `localhost:4111` | Fail | Curl returned connection refused. |
| `localhost:4111/swagger-ui` | Fail | Curl returned connection refused. |
| `bgproc list` | Misleading | Reported running/port, while `curl`, `lsof`, and `ss` showed nothing listening. |
| Dev server logs | Red flag | Logs claimed "ready" but showed `Failed to restart all active workflow runs: TypeError: fetch failed`. |
| Process cleanup | Done | Orphan local `mastra dev` processes were stopped after audit. |

## 4. Critical Runtime Red Flags

| Red flag | Severity | Why it matters | Fix |
| --- | --- | --- | --- |
| Homebrew Node shadows nvm Node | Critical | Mastra install/build behavior changes by Node version. The earlier install failure was caused by Node path drift. | Put nvm Node 22 before Homebrew in shell startup for this repo, or wrap Mastra commands. |
| `bgproc` can show running while no port listens | Critical | False green status. Agents may report "Studio running" when it is not reachable. | Smoke test must require `curl` + `ss/lsof`, not bgproc alone. |
| `npm run health` prints no JSON | High | Health check cannot prove runtime state. | Change script to print `getHealth()` JSON or create a real `/health` API route. |
| Orphaned `mastra dev` processes appeared | High | Can cause port confusion, CPU waste, stale logs, and bad smoke results. | Add cleanup command to runbook before each dev start. |
| `TypeError: fetch failed` in Mastra dev logs | Medium | Could be harmless workflow restart noise, but it is not production-clean. | Investigate after port/startup is stable; record exact stack if repeated. |
| `.mcp.json` untracked | Medium | Project MCP config may disappear for other machines/agents. | Track `.mcp.json` if the team agrees. |
| `my-mastra-app/` untracked | Medium | Current Mastra runtime scaffold may not survive clone/CI. | Decide whether to track or move to canonical app folder. |

## 5. Task Pack Findings

### 5.1 Structure Summary

| Range | Status | Finding |
| --- | --- | --- |
| `001-003` | Strong | Good safety-first foundations, but statuses are stale. |
| `004-005` | Good | Correct first useful product surface, blocked by VDB and safety layers. |
| `006-008` | Too early | Vertical agents should wait until core safety and handoff are real. |
| `009-011` | Good but incomplete | Correct UI/observability/memory direction, but missing some sections and package dependency clarity. |
| `012-019` | Not execution-ready | Important specs, but not full task lifecycle prompts. |
| `20-23` | Reference only | Useful, but must not be treated as implementation tasks. |

### 5.2 Per-Task Status

| File | Percent correct | Main blocker |
| --- | ---: | --- |
| `000-index.md` | 80% | Broken relative links to `prompts/mastra/tasks/...` from inside the same folder. |
| `001-mastra-source-inventory.md` | 92% | Status says Not Started, but inventory doc says Complete. |
| `002-mastra-core-runtime-scaffold.md` | 82% | Runtime exists but smoke fails; status stale. |
| `003-mastra-tool-audit-control-events.md` | 90% | Correct, but must be implemented before any risky tool. |
| `004-mastra-hybrid-search-tools.md` | 78% | VDB local/remote drift; search must have deterministic fallback. |
| `005-mastra-chat-router-concierge.md` | 84% | Good, but depends on safety/runtime tasks that are not green. |
| `006-mastra-real-estate-mvp-agents.md` | 72% | Depends on `RE-*` IDs that do not match exact task filenames. |
| `007-mastra-events-mvp-runtime.md` | 76% | Needs deterministic ticketing and check-in proof before AI runtime. |
| `008-mastra-restaurants-mvp-discovery.md` | 70% | `EVT-071` alias mismatch; booking must stay out of MVP. |
| `009-mastra-ui-dojo-chat-frontend.md` | 78% | Needs exact SDK/BFF route decision and smoke route proof. |
| `010-mastra-memory-rag-mvp.md` | 72% | Must wait for tenant isolation, retention rules, VDB-02. |
| `011-mastra-observability-evals-guardrails.md` | 82% | Good, but needs exact scorer thresholds and trace proof. |
| `012-mastra-workflow-state-runtime.md` | 64% | Important but short-form; expand to full prompt template. |
| `013-mastra-tenant-isolation.md` | 66% | Needs concrete JWT/request-context/RLS test matrix. |
| `014-mastra-ai-rate-limits.md` | 68% | Needs budget dimensions, failure behavior, and rate-limit headers. |
| `015-mastra-tool-registry-system.md` | 72% | Needs registry schema and wrapper tests. |
| `016-mastra-streaming-ui-state.md` | 62% | Premature until a real agent/workflow stream exists. |
| `017-mastra-workflow-recovery.md` | 58% | Valuable later; too advanced for first MVP. |
| `018-mastra-human-handoff-runtime.md` | 70% | Essential but needs Paperclip/operator state machine. |
| `019-mastra-client-sdk-integration.md` | 72% | `@mastra/client-js` installed, but `@mastra/ai-sdk` missing and route architecture unresolved. |
| `20-mastra.md` | 70% | Delivered reference doc, but partly stale. |
| `21-mastra-repos-templates.md` | 74% | Useful, but defer to corrections in `23`. |
| `22-mastra-repos-extract-tasks.md` | 78% | Good extract plan, not canonical implementation tasks. |
| `23-mastra-modules-verified.md` | 92% | Strongest source catalogue; keep as authority for external repos/templates. |

## 6. Blockers Before Implementation

P0 blockers:

1. Fix Node path drift.
2. Fix local dev smoke so `curl http://localhost:4111` and `/swagger-ui` return 200.
3. Make `npm run health` print JSON proof.
4. Update `MASTRA-001` and `MASTRA-002` statuses to match reality.
5. Expand `012-019` into full task lifecycle format.
6. Add missing `MASTRA-020 Paperclip Approval Bridge`.
7. Add missing `MASTRA-021 VDB Local/Remote Reconciliation`.
8. Add missing `MASTRA-022 Mastra Runtime Smoke Script`.
9. Fix broken relative links in `000-index.md` and `/tasks/mastra/012-019` stubs.
10. Decide whether `.mcp.json`, `my-mastra-app/`, and task docs should be tracked.

P1 blockers:

1. Install `@mastra/ai-sdk` only after verifying current docs and locking route strategy.
2. Replace weather demo artifacts with mdeAI ping/router artifacts.
3. Add one browser/Studio smoke pass using the smoke-test skill once localhost works.
4. Add CI or local script for Mastra package sanity, typecheck, build, Studio curl, Swagger curl.

## 7. Critical Fix Plan

### Fix 1: Normalize Node

Create a repo-local wrapper:

```bash
#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
hash -r
exec "$@"
```

Use it for all Mastra commands until shell startup is fixed.

### Fix 2: Make health proof real

Current script:

```json
"health": "node --experimental-strip-types src/mastra/public/health.ts"
```

Problem: it imports/executes the file but prints nothing.

Better script:

```json
"health": "node --experimental-strip-types -e \"import('./src/mastra/public/health.ts').then(m=>console.log(JSON.stringify(m.getHealth())))\""
```

### Fix 3: Make smoke test deterministic

Add `scripts/mastra-smoke.sh`:

```bash
set -euo pipefail
cd /home/sk/mde/my-mastra-app
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
hash -r
npm run typecheck
npm run build
npm run health
npx --yes bgproc stop my-mastra-app || true
MASTRA_DEV_NO_CACHE=1 npx --yes bgproc start -n my-mastra-app -- npm run dev
for i in $(seq 1 30); do
  if curl -fsS http://localhost:4111 >/dev/null; then break; fi
  sleep 1
done
curl -fsS http://localhost:4111 >/dev/null
curl -fsS http://localhost:4111/swagger-ui >/dev/null
ss -tulpn | grep 4111
```

### Fix 4: Add missing tasks

Create:

- `020-mastra-paperclip-approval-bridge.md`
- `021-mastra-vdb-local-remote-reconciliation.md`
- `022-mastra-runtime-smoke-script.md`
- `023-mastra-replace-weather-demo.md`
- `024-mastra-env-secret-boundary.md`
- `025-mastra-dependency-alias-map.md`

### Fix 5: Put vertical agents behind proof gates

Do not run `006`, `007`, or `008` until these are green:

```text
002 runtime smoke
003 audit/control events
012 workflow state
013 tenant isolation
014 AI rate limits
015 tool registry
018 human handoff
019 client/server integration
020 Paperclip approval bridge
021 VDB reconciliation
022 smoke script
```

## 8. Best Practices To Add To Tasks

Every executable Mastra task should include:

- Exact installed-doc lookup command before coding.
- Exact package/version check.
- Node path check.
- Explicit `DATABASE_URL` requirement if runtime imports PostgresStore.
- Typecheck, build, health, Studio curl, Swagger curl.
- Secret scan.
- `ss/lsof` proof for local server.
- No browser/client service-role tokens.
- No direct `.from()` writes from agent code unless wrapped in audited server tool.
- No OpenClaw direct calls from LLM tools.
- No Paperclip approval URL/token in browser output.
- A rollback/cleanup step for bgproc and orphan processes.

## 9. Recommended Next Action

Do this next:

```text
Create MASTRA-022 Runtime Smoke Script first.
```

Reason:

- It proves the install is actually usable.
- It catches the current bgproc false-positive problem.
- It prevents every later task from claiming green on a dead Studio/API.

Then fix:

```text
Node path -> health JSON -> smoke script -> doc/status drift -> missing P0 tasks -> MASTRA-003.
```

## 10. Final Answer

The task strategy is good, but the current Mastra setup is not yet operationally trustworthy. The most dangerous false assumption is that `bgproc running` means Mastra is available. Today it did not: `curl` failed and no listener was visible on `4111`.

Treat the runtime as:

```text
installed: yes
typecheck: yes
build: yes
MCP docs: yes
Studio/API smoke: failing
production-ready: no
```

