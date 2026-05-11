---
title: MASTRA-022 Runtime Smoke Implementation Proof
status: Complete
created: 2026-05-10
scope:
  - /home/sk/mde/my-mastra-app
  - /home/sk/mde/tasks/prompts/mastra/tasks
---

# MASTRA-022 Runtime Smoke Implementation Proof

## Summary

`MASTRA-022` is implemented and verified. The false-green runtime problem is fixed by requiring real HTTP and listener proof, not only `bgproc` status.

Root cause fixed:

```text
Mastra loaded .env and used the remote Supabase direct DATABASE_URL.
That host resolved to an unreachable IPv6 address on this machine.
The smoke script now starts Mastra with --env /tmp/mdeai-mastra-smoke-env.*,
preserving provider keys while overriding DATABASE_URL to local Supabase 127.0.0.1:54322.
```

## Files Created Or Changed

| File | Change |
| --- | --- |
| `/home/sk/mde/my-mastra-app/scripts/mastra-smoke.sh` | New deterministic runtime smoke script |
| `/home/sk/mde/my-mastra-app/scripts/mastra-stop.sh` | New cleanup script for keep-running/manual proof mode |
| `/home/sk/mde/my-mastra-app/package.json` | Added `smoke:runtime`, `smoke:stop`, and JSON health output |
| `/home/sk/mde/tasks/prompts/mastra/tasks/022-mastra-runtime-smoke-script.md` | New executable task, marked Complete |
| `/home/sk/mde/tasks/prompts/mastra/tasks/020-mastra-paperclip-approval-bridge.md` | New next P0 governance task |
| `/home/sk/mde/tasks/prompts/mastra/tasks/021-mastra-vdb-local-remote-reconciliation.md` | New next P0 search consistency task |
| `/home/sk/mde/tasks/prompts/mastra/tasks/023-mastra-replace-weather-demo.md` | New next P0 demo-removal task |
| `/home/sk/mde/tasks/prompts/mastra/tasks/024-mastra-env-secret-boundary.md` | New next P0 security task |
| `/home/sk/mde/tasks/prompts/mastra/tasks/025-mastra-dependency-alias-map.md` | New dependency cleanup task |
| `/home/sk/mde/tasks/prompts/mastra/tasks/000-index.md` | Updated execution order and dependencies |
| `/home/sk/mde/tasks/mastra/mastra-runtime-runbook.md` | Added runtime smoke and stop commands |

## Verification Tests

| # | Test | Result | Proof |
| ---: | --- | --- | --- |
| 1 | Node/version gate | PASS | Smoke printed `node=v22.22.2`, `npm=10.9.7`. |
| 2 | Env presence without secrets | PASS | Smoke printed required env names as `present`, no values. |
| 3 | TypeScript | PASS | `npm run typecheck` exited 0 inside smoke. |
| 4 | Production build | PASS | `npm run build` completed with `Build successful`. |
| 5 | JSON health | PASS | `npm run health --silent` printed `{"ok":true,"version":"1.0.0","storage":"postgres",...}`. |
| 6 | Runtime smoke | PASS | `npm run smoke:runtime` passed with listener proof on `*:4111`. |
| 7 | Manual HTTP proof | PASS | With `MASTRA_SMOKE_KEEP_RUNNING=1`, root returned `200`, `/swagger-ui` returned `200`, `/api` returned `200`. |
| 8 | Cleanup | PASS | `npm run smoke:stop` printed `[mastra-stop] stopped`; follow-up checks showed no `4111` listener. |
| 9 | Mastra MCP | PASS | `claude mcp get mastra` reported `Status: Connected`. |
| 10 | New task files/index | PASS | `020` through `025` task files exist and are referenced in `000-index.md`. |
| 11 | Secret scan | PASS | Secret-value regex returned no matches for new scripts/tasks. |

## Commands Used

```bash
cd /home/sk/mde/my-mastra-app
PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
hash -r
npm run smoke:runtime

MASTRA_SMOKE_KEEP_RUNNING=1 npm run smoke:runtime
curl -sS -o /tmp/mastra-root-proof.html -w 'root=%{http_code}\n' http://localhost:4111
curl -sS -o /tmp/mastra-swagger-proof.html -w 'swagger=%{http_code}\n' http://localhost:4111/swagger-ui
curl -sS -o /tmp/mastra-api-proof.txt -w 'api=%{http_code}\n' http://localhost:4111/api
npm run smoke:stop
```

## Current Best Next Step

Run `MASTRA-024 Env And Secret Boundary` next, then `MASTRA-023 Replace Weather Demo`, then `MASTRA-003 Tool Audit And Control Events`.

Reason:

```text
The runtime is now testable.
Before building real tools, lock secret boundaries and remove template weather/demo drift.
Then build audit/control events so every future tool call is traceable.
```
