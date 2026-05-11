---
task_id: MASTRA-022
title: Mastra Runtime Smoke Script
phase: CORE
priority: P0
status: Complete
status_evidence: my-mastra-app/scripts/smoke-runtime.mjs + `npm run smoke:runtime` script verified 2026-05-10 (notes/06-checklist.md §C.1).
estimated_effort: 1 day
area: mastra-runtime
skill: [mastra, mastra-smoke-test]
subagents: [backend]
edge_function: null
schema_tables: []
depends_on: [MASTRA-002]
blocks: [MASTRA-003, MASTRA-004, MASTRA-005, MASTRA-006, MASTRA-007, MASTRA-008, MASTRA-009, MASTRA-011, MASTRA-012, MASTRA-013, MASTRA-014, MASTRA-015, MASTRA-016, MASTRA-017, MASTRA-018, MASTRA-019]
---

<!-- task-summary -->
> **What:** Add a deterministic local runtime smoke script for the Mastra service.
> **Why:** `bgproc` can report Mastra as running even when `localhost:4111` does not answer. This task prevents false-green runtime claims before agents, workflows, or tools are added.
> **Delivers:** `npm run smoke:runtime`, JSON health proof, Studio/API curl proof, listener proof, stale-process cleanup, and failure logs.
> **Tools/Skills:** `mastra` · `mastra-smoke-test`
> **CORE · P0 · Complete · Effort: 1 day**
> **Depends on:** MASTRA-002

# Mastra Runtime Smoke Script

## Easy Summary

**Purpose:** prove the Mastra runtime is really usable, not merely installed or reported as running by a process manager.

**Goals:** force the correct Node version, validate required env names without printing values, run typecheck/build/health, start Studio, verify `localhost:4111`, verify `/swagger-ui`, and prove a port listener exists.

**Success criteria:** `npm run smoke:runtime` fails when Studio/API are unreachable and passes only when curl and listener checks are green.

**Production-ready checklist:**

- Uses nvm Node 22 before Homebrew Node.
- Does not print secret values.
- Does not trust `bgproc list` alone.
- Stops project-scoped stale dev processes before starting.
- Requires curl proof for Studio and Swagger.
- Requires `ss` listener proof for port `4111`.
- Emits logs when runtime smoke fails.
- Can leave the server running only when explicitly requested.

## Description

Create the runtime smoke layer for `/home/sk/mde/my-mastra-app`. This is the first gate after the scaffold because all downstream Mastra tasks rely on a working local server, Studio UI, and API surface.

The script must catch the exact failure found in audit:

```text
bgproc reports my-mastra-app running
but curl http://localhost:4111 fails
and no listener is visible on port 4111
```

## Rationale

Without this gate, later agents can claim the runtime is green while Mastra is not actually reachable. That makes every later proof unreliable.

## User Stories

| Persona | Goal | Outcome |
| --- | --- | --- |
| Developer | know if Mastra really starts | I can trust later agent/tool tests |
| Operator | avoid fake green status | I see curl/listener proof, not just process output |
| Auditor | inspect failure logs | I can diagnose runtime startup failures without secrets |

## Acceptance Criteria

- [ ] Add `/home/sk/mde/my-mastra-app/scripts/mastra-smoke.sh`.
- [ ] Add `smoke:runtime` script to `/home/sk/mde/my-mastra-app/package.json`.
- [ ] Update `npm run health` so it prints JSON containing `"ok":true`.
- [ ] Smoke script forces `/home/sk/.nvm/versions/node/v22.22.2/bin` ahead of Homebrew Node when present.
- [ ] Smoke script verifies required package names: `@mastra/core`, `@mastra/pg`, `@mastra/client-js`, and `mastra`.
- [ ] Smoke script verifies required env names exist without printing values.
- [ ] Smoke script uses the local Supabase smoke database when available, so remote IPv6 Postgres reachability does not create false local failures.
- [ ] Smoke script runs typecheck, build, and health before starting dev server.
- [ ] Smoke script stops/cleans project-scoped stale Mastra dev processes.
- [ ] Smoke script starts Mastra dev server with `MASTRA_DEV_NO_CACHE=1`.
- [ ] Smoke script fails if `curl http://localhost:4111` fails.
- [ ] Smoke script fails if `curl http://localhost:4111/swagger-ui` fails.
- [ ] Smoke script fails if `ss` cannot prove a listener on port `4111`.
- [ ] Smoke script prints `bgproc logs` tail on failure.
- [ ] `MASTRA_SMOKE_KEEP_RUNNING=1 npm run smoke:runtime` leaves Studio running for manual browser proof.
- [ ] `npm run smoke:stop` stops the process, clears the temp smoke env file, and proves port `4111` is free.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Runtime scripts | `my-mastra-app/scripts/mastra-smoke.sh` | Create deterministic smoke script |
| Package scripts | `my-mastra-app/package.json` | Add `smoke:runtime`; fix `health` proof |
| Docs | `tasks/prompts/mastra/tasks/022-mastra-runtime-smoke-script.md` | Add execution task |
| Index | `tasks/prompts/mastra/tasks/000-index.md` | Add MASTRA-022 before risky downstream work |
| Runbook | `tasks/mastra/mastra-runtime-runbook.md` | Reference smoke command after script is green |

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Homebrew Node is first in PATH | Script prepends nvm Node 22 and prints the resulting `node -v`. |
| `.env` is missing a required key | Script fails with key name only, never value. |
| Remote Supabase direct Postgres resolves to unreachable IPv6 | Script uses local Supabase smoke DB when `127.0.0.1:54322` is available. |
| `bgproc` says running but no port listens | Script fails because curl/listener checks fail. |
| A stale project-scoped Mastra dev process exists | Script terminates only matching project Mastra dev process. |
| Port `4111` is already occupied | Script fails before starting a new server. |
| Developer wants Studio left running | Use `MASTRA_SMOKE_KEEP_RUNNING=1`. |

## Real-World Examples

**Scenario 1 - false green caught:** `bgproc list` shows a process, but `curl` fails. The script exits non-zero and prints logs.

**Scenario 2 - usable runtime:** `typecheck`, `build`, `health`, Studio curl, Swagger curl, and `ss` listener proof all pass.

## Outcomes

| Before | After |
| --- | --- |
| Runtime status relied on process manager output | Runtime status requires HTTP and listener proof |
| Health script printed nothing | Health script prints JSON |
| Stale dev processes confused audits | Smoke script cleans project-scoped stale processes |
| Later tasks could start on a dead runtime | Later tasks are blocked until smoke is green |

## Verification

Run:

```bash
cd /home/sk/mde/my-mastra-app
PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
hash -r
npm run smoke:runtime
```

For manual Studio proof:

```bash
MASTRA_SMOKE_KEEP_RUNNING=1 npm run smoke:runtime
curl -I http://localhost:4111
curl -I http://localhost:4111/swagger-ui
npm run smoke:stop
```

Secret scan:

```bash
rg -n "(API_KEY|TOKEN|SECRET|SERVICE_ROLE)=['\"]?[^ '\"|]+" \
  /home/sk/mde/my-mastra-app/scripts/mastra-smoke.sh \
  /home/sk/mde/tasks/prompts/mastra/tasks/022-mastra-runtime-smoke-script.md || true
```

## Current Verification Result

Last checked: 2026-05-10

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run health --silent` | PASS, prints `{"ok":true,...,"storage":"postgres",...}` |
| Env presence check | PASS for required names, values not printed |
| Secret scan | PASS, no literal secret values found |
| `curl http://localhost:4111` | PASS during smoke |
| `curl http://localhost:4111/swagger-ui` | PASS during smoke |
| Orphan cleanup after failure | PASS, no project Mastra dev process and no `4111` listener remained |
| Orphan cleanup after success | PASS, no project Mastra dev process and no `4111` listener remained |

Root cause fixed:

```text
The .env DATABASE_URL points at db.zkwcbyxiwklihegjhuql.supabase.co:5432.
On this machine, @mastra/pg attempted an IPv6 connection and failed with ENETUNREACH.
The smoke script now starts Mastra with --env /tmp/mdeai-mastra-smoke-env.*.
That temporary file preserves provider keys but replaces DATABASE_URL with local Supabase at 127.0.0.1:54322.
```

Verified passing command:

```bash
cd /home/sk/mde/my-mastra-app
PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
hash -r
npm run smoke:runtime
```
