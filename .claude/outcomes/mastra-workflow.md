# Mastra Workflow Outcome Rubric

**When to run:** Diff touches any of:
- `my-mastra-app/src/mastra/agents/**`
- `my-mastra-app/src/mastra/workflows/**`
- `my-mastra-app/src/mastra/tools/**`
- `my-mastra-app/src/mastra/storage/**` or `memory/**`
- `my-mastra-app/scripts/{mastra-smoke,verify-*}.{sh,mjs}`
- New Mastra task ships from `tasks/mastra/tasks/`

**max_iterations:** 5
**Modes:** Fast (criteria 1–2 only — typecheck + unit tests, for type/test-only edits) · **Full (default — criteria 1–10)** · Locked (Full + 11 router intent preservation + 12 workflow recovery — required when promoting any task tagged `P0` in `tasks/mastra/tasks/000-index.md`).

**Prerequisites (fails closed if unreachable):**
- Local Supabase running on `127.0.0.1:54322` (workflow state, `ai_runs`, tenant rows).
- `MASTRA_PORT=4111` available (or override).
- `GEMINI_API_KEY` set (every mdeai agent calls Gemini via the OpenAI-compatible endpoint).
- For criterion 11 (router intent): the multi-turn fixture in `mastra-routing` skill is loadable.

**Forbidden shortcuts:**
- Do NOT pass criterion 3 (smoke) by reading `mastra-smoke.sh` — require the actual exit-0 line.
- Do NOT pass criterion 7 (agent DB safety) by reading one agent file — require the grep audit across **all** `agents/*.ts`.
- Do NOT pass criterion 11 (router preservation) by reading `router.ts` — require the multi-turn API call transcript.
- Do NOT pass criterion 12 (recovery) by reading `workflow-state-runtime.md` — require a real kill + restart cycle with a workflow run before and after.

**Out of scope (do not grade):**
- Mastra docs file edits under `my-mastra-app/src/mastra/docs/`.
- README / comment-only diffs in this folder.
- Legacy prompts mirror at `tasks/prompts/mastra/tasks/` (deprecated per `000-index.md` banner).

---

## Coverage checklist

> Criterion tags: `[Fast]` = runs in all three modes · `[Full]` = runs in Full and Locked · `[Locked]` = adds the deep probe in Locked mode.

### A. Code health

1. **[Fast] Typecheck green.**
   ```bash
   cd my-mastra-app && npm run typecheck
   ```
   Paste exit code 0 line. Fail if any TS error appears in files touched by the diff.

2. **[Fast] Unit tests green.**
   ```bash
   cd my-mastra-app && npm test
   ```
   Paste the vitest summary (`Test Files N passed`, `Tests M passed`) + exit code. Fail if any test failed.

### B. Runtime smoke

3. **[Full] `mastra-smoke.sh` green end-to-end.**
   The smoke script starts `mastra dev`, probes the Studio UI, agents, tools, workflows, traces, and memory, and kills the process. From the repo root:
   ```bash
   bash my-mastra-app/scripts/mastra-smoke.sh
   ```
   Paste the last 10 lines of output including the `[mastra-smoke] OK` line and exit 0. Fail if the script returns non-zero or the OK marker is absent.

4. **[Full] Health endpoint returns 200 with `status: "ok"`.**
   While `mastra dev` is running (smoke script can keep it up with `MASTRA_SMOKE_KEEP_RUNNING=1`):
   ```bash
   curl -fsSL http://localhost:4111/api/health
   ```
   Paste the JSON body. Must include `"status":"ok"` or equivalent.

### C. Architecture safety (from `mastra-prd.md` §1 boundary rules)

> *"Agents must NEVER: write DB directly · run unrestricted SQL · mutate Stripe · call OpenClaw directly from LLM tools."*

5. **[Full] Env / secret boundary clean.**
   ```bash
   node my-mastra-app/scripts/verify-env-security.mjs
   ```
   Paste exit code + the summary line. Fail if any secret leaks to the client bundle or any required env var is missing on the server.

6. **[Full] Tool registry whitelist enforced — no unknown MCP / inline tools dispatched.**
   ```bash
   node --env-file=my-mastra-app/.env.local my-mastra-app/scripts/verify-grounding-runtime.mjs
   ```
   Paste the line `"N expected tools, 0 unknown"`. Fail if any unknown tools appear in `listTools()` output, or if the script reports a tool registered outside `src/mastra/tools/registry.ts`.

7. **[Full] Agents never write to the DB directly.**
   ```bash
   grep -nE "supabase\.from\([^)]+\)\.(insert|update|delete|upsert|rpc)" my-mastra-app/src/mastra/agents/
   ```
   Must return empty (no matches). Agents must route writes through typed tools that hit Supabase Edge Functions or the audited gateway. Paste the empty grep output (or the offending lines).
   Fail if any `agents/*.ts` writes to the DB directly.

8. **[Full] No raw SQL from agent code.**
   ```bash
   grep -nE "\.rpc\(['\"](exec_sql|execute_sql|raw)" my-mastra-app/src/mastra/agents/ my-mastra-app/src/mastra/workflows/
   ```
   Must return empty. Fail if any agent or workflow calls a raw-SQL RPC.

9. **[Full] Tenant isolation — multi-tenant queries always include `org_id` or `user_id`.**
   ```bash
   grep -nE "\.from\(['\"](apartments|events|tickets|bookings|conversations|messages)['\"][^)]*\)\.select" my-mastra-app/src/mastra/ \
     | grep -vE "(\.eq\(['\"](org_id|user_id|buyer_id|owner_user_id))"
   ```
   Must return empty — every query against a tenanted table must filter by `org_id` / `user_id`. Paste output; fail if any line is returned.

### D. Observability + safety nets

10. **[Full] Every agent run logs to `ai_runs`.**
    Trigger one workflow (e.g. concierge router via the `mastra-smoke.sh` test prompt). Then:
    ```sql
    SELECT agent_name, status, duration_ms, started_at
    FROM ai_runs
    ORDER BY started_at DESC
    LIMIT 5;
    ```
    Paste the row(s). Fail if the just-fired workflow did not produce a row, or if `agent_name` does not match an entry in `src/mastra/agents/`.

### E. Locked mode (Phase-1-gate-equivalent probes)

11. **[Locked] Router intent preservation — multi-turn context survives follow-ups.**
    Reference: `.claude/skills/mastra-routing/SKILL.md` — the canonical rule is that follow-ups like "when can I view?" stay in `rental_search`, not chitchat.
    Send a 2-turn conversation to `/api/agents/router/generate`:
    ```bash
    # Turn 1
    curl -fsSL -X POST http://localhost:4111/api/agents/router/generate \
      -H "content-type: application/json" \
      -d '{"messages":[{"role":"user","content":"show me 2-bedroom rentals in El Poblado under 3M COP"}]}' | jq '.intent // .text' | tee /tmp/mt1.json
    # Turn 2 (same threadId)
    curl -fsSL -X POST http://localhost:4111/api/agents/router/generate \
      -H "content-type: application/json" \
      -d '{"threadId":"<from-turn-1>","messages":[{"role":"user","content":"when can I view?"}]}' | jq '.intent // .text' | tee /tmp/mt2.json
    ```
    Paste both intent values. Turn 1 must classify as `rental_search`. Turn 2 must remain `rental_search` (NOT fall back to `chitchat` or restart classification).
    Fail if Turn 2 drops the rental context.

12. **[Locked] Workflow state recovery — workflow resumes after process kill.**
    Start a long-running workflow (e.g. `event-discovery-workflow` with a multi-page Medellín event search). After step 1 completes:
    ```bash
    pkill -f "mastra dev"
    sleep 2
    cd my-mastra-app && npm run dev &
    # Poll the workflow run status
    curl -fsSL http://localhost:4111/api/workflows/event-discovery-workflow/runs/<runId>
    ```
    Paste the run status before and after kill. The workflow must resume from the last checkpoint (state restored from Supabase `workflow_state` table per task 012), not restart from step 0.
    Fail if the run is lost, or restarts from the beginning, or returns 404 after restart.

---

## Output format

Line 1: `Mode: <Fast|Full|Locked>. Pass N/<10|12>. <one-line summary>`

For Locked-mode runs gating a Phase 1 / P0 task: `Phase 1 gate (Mastra): PASS/FAIL — N/12 criteria met.`

Then, for each FAILED criterion:
`<id> - FAIL. <specific gap and what to fix>`

Example:
```
Mode: Full. Pass 8/10. Smoke and registry green; two safety issues.
7 - FAIL. my-mastra-app/src/mastra/agents/event-agent.ts:142 does supabase.from('events').insert(...). Route the write through a typed tool that hits the events-create edge function.
9 - FAIL. my-mastra-app/src/mastra/agents/rental-agent.ts:88 does .from('apartments').select('*') without an org_id filter. Add .eq('org_id', ctx.orgId) or route through the rental_search tool.
```

For Locked mode:
```
Mode: Locked. Phase 1 gate (Mastra): FAIL — 10/12 criteria met.
11 - FAIL. Turn 2 classified as "chitchat" instead of "rental_search". Router lost the active intent — check mastra-routing skill §"Preserve active intent across follow-ups".
12 - FAIL. After mastra dev restart, workflow run-xyz returned 404. Workflow state was not persisted to Supabase; ship task 012 (workflow-state-runtime) first.
```
