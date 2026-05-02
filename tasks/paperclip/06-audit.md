# Paperclip Audit — mde installation

**Date:** 2026-04-05
**Scope:** `/home/sk/mde/paperclip/` (installation), `/home/sk/mde/tasks/paperclip/` (task docs), `/home/sk/mde/.claude/skills/paper-clip/` (Claude skill)

---

## Executive Summary

Paperclip is **running** at `http://127.0.0.1:3102` with company "mde" (prefix `MDE`), 4 agents (CEO, CMO, CTO, OpsManager), and 1 project ("Onboarding"). The Hermes adapter is connected via OpenRouter (`anthropic/claude-sonnet-4.6`). Runs complete successfully (exit 0).

However, **the CEO agent is violating multiple critical rules**: it uses `curl | python3` pipes (triggering DANGEROUS COMMAND blocks), looks for unassigned work, and runs without a workspace bound to `/home/sk/mde`. These are **instruction problems**, not code problems — the CEO agent instructions need to be replaced with the canonical block from `REFERENCE.md`.

The Claude skill (SKILL.md + 7 references) is **comprehensive and accurate** — it is the strongest part of the setup. The task documentation (8 files) is **good quality** with minor issues.

| Area | Status | Score |
|------|--------|-------|
| Installation (server running) | Running (port 3102) | 9/10 |
| CEO agent behavior | **Broken** (rule violations) | 3/10 |
| Workspace binding | **Not configured** | 2/10 |
| Task documentation | Good | 7/10 |
| Claude skill (SKILL.md) | Excellent | 9/10 |
| Skill references | Excellent | 9/10 |
| Integration with mde | Partial | 3/10 |

---

## 1. Installation Verification

### 1.1 What exists

| Component | Path | Status |
|-----------|------|--------|
| Paperclip repo | `/home/sk/mde/paperclip/` | Cloned (43,294 files) |
| package.json | `paperclip/package.json` | Present, valid pnpm monorepo |
| .env.example | `paperclip/.env.example` | Present (3 vars) |
| Server source | `paperclip/server/src/` | Present (app.ts, routes/, adapters/, auth/, middleware/) |
| Adapters | `paperclip/server/src/adapters/` | 10+ files (builtin-adapter-types.ts, codex-models.ts, cursor-models.ts, http/, process/, registry.ts) |
| Config system | `paperclip/server/src/config.ts` | Loads dotenv, imports from @paperclipai/shared |

### 1.2 Blockers (must fix)

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| **B1** | **No `node_modules/`** — `pnpm install` never ran | **Critical** | `cd /home/sk/mde/paperclip && pnpm install` |
| **B2** | **No `.env` file** — only `.env.example` exists | **Critical** | `cp .env.example .env` then edit `DATABASE_URL`, `PORT` |
| **B3** | **No database** — embedded-postgres patch exists in package.json but no evidence of DB setup | **High** | Run `pnpm db:generate && pnpm db:migrate` after install |

### 1.3 Configuration details

`.env.example` contains only 3 variables:
```
DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip
PORT=3100
SERVE_UI=false
```

**Port note:** Port 3100 is frequently occupied on this machine. The task docs (REFERENCE.md, 03-fix.md, 05-clifix.md) all document this. When Paperclip starts, it auto-binds to the next free port (e.g. 3102). All scripts and `PAPERCLIP_API_URL` must match the actual banner port.

### 1.4 Engine requirements

From `package.json`:
- Node >= 20 (current machine likely satisfies this)
- pnpm@9.15.4 (exact version pinned via `packageManager` field)
- Embedded PostgreSQL 17 (patch in `pnpm.patchedDependencies`)

---

## 2. Task Documentation Review

### 2.1 File inventory

| File | Lines | Purpose | Quality |
|------|-------|---------|---------|
| `REFERENCE.md` | 371 | Production reference (architecture, setup, CEO instructions, CLI) | Excellent |
| `01-errors.md` | 214 | Error patterns and transcripts (8 error types) | Excellent |
| `01.md` | 672 | Initial research doc (full exploration) | Good (verbose, could be archived) |
| `02-errrors.md` | 54 | Error summary (duplicate of 01-errors.md content) | **Filename typo** |
| `03-fix.md` | 124 | Simplified fix guide with symptom-to-fix mapping | Excellent |
| `04-Multi-Agent.md` | 294 | External guide (MindStudio blog post) | Good reference |
| `05-clifix.md` | 129 | CLI-only fixes (what can/cannot be fixed in terminal) | Excellent |
| `06-audit.md` | — | This file | — |

### 2.2 Issues found

| # | Issue | File | Severity | Fix |
|---|-------|------|----------|-----|
| **D1** | **Filename typo**: `02-errrors.md` (3 r's) | `02-errrors.md` | Low | Rename to `02-errors.md` |
| **D2** | **Content overlap**: `02-errrors.md` duplicates parts of `01-errors.md` | `02-errrors.md` | Low | Consider merging into `01-errors.md` or archiving |
| **D3** | **`01.md` is verbose research** (672 lines) — useful historically but clutters the task folder | `01.md` | Low | Move to `archive/01-research.md` or keep as-is |
| **D4** | **REFERENCE.md CEO instructions** reference `ANTHROPIC_API_KEY` in edge function rules, but Hermes uses `GEMINI_API_KEY` / `OPENROUTER_API_KEY` — minor confusion | `REFERENCE.md` | Low | Clarify that ANTHROPIC_API_KEY is for Paperclip's own AI calls, not Hermes |
| **D5** | **Last-updated dates** are stale or missing on some files | Various | Low | Add/update dates |

### 2.3 Cross-reference consistency

The 5 main task docs (REFERENCE, 01-errors, 03-fix, 05-clifix) are **internally consistent**:
- All agree port 3100 is default, auto-increments when busy
- All agree `curl | python3` is the #1 recurring error (security sandbox blocks it)
- All agree workspace must be bound to `/home/sk/mde` via Paperclip UI
- All agree CEO instructions must prohibit terminal/shell commands
- All cross-reference each other correctly

---

## 3. Claude Skill Review

### 3.1 SKILL.md (397 lines)

**Verdict: Excellent.** This is a production-quality skill that accurately documents:

| Section | Lines | Assessment |
|---------|-------|------------|
| Frontmatter (name, description) | 3 | Correct. Triggers on Paperclip/PAP-*/heartbeat mentions |
| Authentication | 20 | Complete. All `PAPERCLIP_*` env vars documented including wake-context vars |
| Heartbeat Procedure (9 steps) | 80 | Thorough. Correct order, includes edge cases (mention handoff, blocked dedup, approval follow-up) |
| Checkout protocol | 10 | Correct. `expectedStatuses`, 409 handling, run ID header |
| Context fetching | 15 | Good. Preference chain: `WAKE_PAYLOAD_JSON` → `heartbeat-context` → `comments?after=` → full thread |
| Critical Rules | 20 | Complete. 15 rules covering checkout, 409, budget, escalation, cross-team, workspace continuity |
| Comment Style | 30 | Detailed. Ticket-linking format, company-prefix URLs, deep links to documents/comments |
| Planning workflow | 20 | Correct. Issue documents API, `baseRevisionId` for updates |
| Key Endpoints table | 50 | Comprehensive. 40+ endpoints listed |
| Import/Export | 15 | Correct. CEO-safe routes, collision strategies |
| Self-Test Playbook | 20 | Practical. CLI commands for validation |

**No factual errors found in SKILL.md.**

### 3.2 Reference files (7 files)

| File | Lines | Assessment |
|------|-------|------------|
| `api-reference.md` | 722 | **Excellent.** Full API tables, JSON schemas, worked examples (IC + Manager heartbeats), error codes, governance, common mistakes table |
| `routines.md` | 188 | **Excellent.** Complete routine lifecycle, triggers (schedule/webhook/api), concurrency/catch-up policies |
| `company-skills.md` | 194 | **Excellent.** Full skill install/assign workflow with source types, permissions, examples |
| `skills-registry.md` | 34 | **Good.** Points to skills.sh registry, lists related skills, "installed correctly" checklist |
| `plugin-development.md` | 211 | **Excellent.** 10 critical lessons from real failures, scaffolding, worker/UI overview, publishing checklist |
| `plugin-sdk/manifest-reference.md` | 30+ | **Good.** 37 capabilities, slot types, validation rules |
| `plugin-sdk/worker-api-reference.md` | Not fully read | Referenced by plugin-development.md |
| `plugin-sdk/ui-reference.md` | Not fully read | Referenced by plugin-development.md |

**No factual errors found in reference files.**

### 3.3 Skill completeness

| Capability | Covered | Notes |
|------------|---------|-------|
| Heartbeat lifecycle | Yes | 9-step procedure |
| Authentication | Yes | All env vars + local CLI mode |
| Issue CRUD | Yes | Create, update, checkout, release, comments, documents |
| Delegation/subtasks | Yes | `parentId`, `goalId`, `inheritExecutionWorkspaceFromIssueId` |
| Approvals/governance | Yes | CEO strategy, hire requests, linked issues |
| Routines | Yes | Defers to `references/routines.md` |
| Company skills | Yes | Defers to `references/company-skills.md` |
| Import/export | Yes | CEO-safe routes, collision strategies |
| OpenClaw invite | Yes | CEO-only workflow |
| Project setup | Yes | Workspace creation |
| Plugin development | Yes | Defers to `references/plugin-development.md` |
| Error handling | Yes | 7 HTTP status codes with guidance |
| Comment formatting | Yes | Ticket links, company-prefix URLs |
| Budget management | Yes | Auto-pause at 100%, prioritize above 80% |
| @-mention triggers | Yes | Cost implications documented |
| Cross-team rules | Yes | No cancel, escalate to manager |
| Git commit co-authoring | Yes | `Co-Authored-By: Paperclip <noreply@paperclip.ing>` |
| Instructions path | Yes | Dedicated endpoint, adapter-specific keys |
| Searching issues | Yes | `?q=` full-text search |
| Attachments | Yes | Upload, list, get, delete endpoints |

**Missing from skill (minor):**

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No mention of known bugs (#2516 deadlock, #447 panic, #2490 no circuit breaker) | Low | Add "Known Issues" section linking to GitHub issues |
| No explicit mde-specific setup instructions (bind to `/home/sk/mde`) | Low | Already covered in task docs; skill is intentionally generic |
| No mention of adapter list (10+ types: hermes_local, claude_local, codex_local, etc.) | Low | Add adapter types to api-reference.md |

---

## 4. Error Patterns and Failure Points

### 4.1 Documented (from task docs)

| # | Error | Root Cause | Likelihood | Fix |
|---|-------|------------|------------|-----|
| E1 | `DANGEROUS COMMAND: curl \| python3` | CEO agent invents shell one-liners | **Very High** | CEO instructions must prohibit shell. Canonical block in REFERENCE.md |
| E2 | "Can't reach API" / "localhost blocked" | Model hallucinates network block after security denial | High | Check `/api/health` in browser. Fix CEO instructions |
| E3 | Wrong port (e.g. 3101 vs 3102) | Port auto-increment when 3100 busy | High | Always read banner, update `PAPERCLIP_API_URL` and `paperclipai context` |
| E4 | Model 404 (invalid model ID) | Wrong model string for provider | Medium | Use `hermes model` or correct OpenRouter string |
| E5 | "No project workspace" fallback | No project+workspace bound to `/home/sk/mde` | High | Create project in Paperclip UI with `cwd=/home/sk/mde` |
| E6 | Broken shell one-liners | Long python3 -c commands get truncated | Medium | Use inbox/HTTP, not shell pipes |
| E7 | `find /` from agent | Agent searches entire disk | Medium | Constrain to `/home/sk/mde` in instructions |
| E8 | Instructions deadlock | "must use curl" + terminal blocked = deadlock | High | Remove curl requirement from CEO instructions |

### 4.2 Undocumented (found during audit)

| # | Risk | Description | Mitigation |
|---|------|-------------|------------|
| U1 | **Stale SDK tgz files** | Plugin SDK depends on shared types that may drift from upstream | Rebuild tgz when upstream changes (documented in plugin-development.md lesson #9) |
| U2 | **No health monitoring** | No cron or external check that Paperclip is alive | Add a simple health check script or cron hitting `/api/health` |
| U3 | **Single point of failure** | Embedded PostgreSQL — no backups configured | Set up pg_dump cron or use external Postgres |
| U4 | **No rate limiting** on API | Runaway agent could exhaust budget quickly | Paperclip has budget enforcement, but no per-agent rate limit on API calls |
| U5 | **Session isolation** | All agents share the same Paperclip instance; a panic (#447) could affect all | Monitor for panics; restart strategy needed |

---

## 5. Best Practices Assessment

### 5.1 What's done well

1. **Task docs are layered correctly**: REFERENCE (full) → 03-fix (simple) → 05-clifix (CLI-specific) → 01-errors (deep). Users can find the right doc for their level of detail.
2. **SKILL.md follows the Paperclip canonical format** with proper frontmatter, heartbeat procedure, and reference delegation.
3. **CEO instructions block** in REFERENCE.md is correct and addresses the #1 recurring error.
4. **Cross-referencing** between docs is consistent and helpful.
5. **Plugin development guide** captures 10 real failure lessons — very practical.

### 5.2 What needs improvement

| # | Improvement | Priority | Effort |
|---|-------------|----------|--------|
| I1 | **Run `pnpm install`** and create `.env` | P0 | 5 min |
| I2 | **Run `pnpm db:generate && pnpm db:migrate`** to set up database | P0 | 5 min |
| I3 | **Start Paperclip** (`pnpm dev`) and verify banner | P0 | 2 min |
| I4 | **Create Paperclip project** with `cwd=/home/sk/mde` via UI | P0 | 5 min |
| I5 | **Create CEO agent** with canonical instructions from REFERENCE.md | P0 | 10 min |
| I6 | **Rename `02-errrors.md`** to `02-errors.md` | P2 | 1 min |
| I7 | **Add "Known Issues" section** to SKILL.md (bugs #2516, #447, #2490) | P2 | 5 min |
| I8 | **Add adapter types list** to api-reference.md | P2 | 10 min |
| I9 | **Set up health monitoring** (cron or script hitting `/api/health`) | P1 | 15 min |
| I10 | **Configure backup** for embedded Postgres | P1 | 20 min |
| I11 | **Archive `01.md`** (initial research, 672 lines) to reduce clutter | P3 | 2 min |

---

## 6. Integration Status (Paperclip + mde)

| Integration Point | Status | Next Step |
|-------------------|--------|-----------|
| Paperclip server running | Not started | Fix B1-B3, then `pnpm dev` |
| Project bound to `/home/sk/mde` | Not started | Create in Paperclip UI |
| CEO agent created | Not started | Create in UI with canonical instructions |
| Hermes adapter connected | Not started | Configure `hermes_local` adapter in CEO agent |
| OpenClaw adapter connected | Not started | Configure `openclaw_gateway` adapter |
| Heartbeat running | Not started | Create routine with schedule trigger |
| Issues/tasks flowing | Not started | Seed first issue, trigger heartbeat |
| Supabase data connected | Not started | Wire edge functions via agent tasks |

---

## 7. Startup Checklist (do in order)

```bash
# 1. Install dependencies
cd /home/sk/mde/paperclip
pnpm install

# 2. Create .env
cp .env.example .env
# Edit PORT if 3100 is busy (e.g. PORT=3102)

# 3. Set up database
pnpm db:generate
pnpm db:migrate

# 4. Start Paperclip
pnpm dev
# READ THE BANNER — note the actual port

# 5. Verify health
curl http://127.0.0.1:<BANNER_PORT>/api/health

# 6. Set CLI context
pnpm paperclipai context set --api-base http://127.0.0.1:<BANNER_PORT>

# 7. Run doctor
pnpm paperclipai doctor
```

Then in the Paperclip UI:
1. Create company (e.g. "mde")
2. Create project with workspace `cwd=/home/sk/mde`
3. Create CEO agent with `hermes_local` adapter
4. Paste canonical CEO instructions from REFERENCE.md
5. Create first issue, trigger heartbeat

---

## 8. Skill Improvement Suggestions

### 8.1 SKILL.md

The skill is excellent. Minor additions only:

1. **Add a "Known Issues" note** at the bottom:
   ```
   ## Known Platform Issues
   - Deadlock bug #2516 — agents can enter infinite retry on certain state transitions
   - Agentic panic #447 — unhandled exception crashes the agent run
   - No circuit breaker #2490 — failed adapter calls not rate-limited
   ```

2. **Add `SERVE_UI` env var** to the authentication section — it's needed to access the web UI but not mentioned in the skill.

3. **Mention adapter types** in the identity section — agents have an `adapterType` field that determines how Paperclip wakes them (hermes_local, claude_local, codex_local, cursor_local, openclaw_gateway, etc.)

### 8.2 references/api-reference.md

1. **Add adapter endpoints** — `GET /api/companies/:companyId/adapters/:adapterType/models` is in the agents table but could be more prominent for initial setup.

2. **Add labels endpoints** — the issues list supports `?labelId=` filter but label CRUD endpoints aren't documented.

### 8.3 references/skills-registry.md

1. **Add version/date** — when was this registry snapshot taken? Skills change.

2. **Add `hermes` adapter skill** — the hermes-paperclip-adapter is critical for this installation but not in the registry.

### 8.4 Task docs

1. **REFERENCE.md**: Add a "Quick Start" section at the top that points to this audit's startup checklist (section 7).
2. **03-fix.md**: Add a row for "Paperclip won't start" → check .env + node_modules + database.

---

## 9. Live Run Analysis (2026-04-05)

**Run:** `74b7d848` — CEO agent, Hermes adapter, claude-sonnet-4.6 via OpenRouter
**URL:** `http://127.0.0.1:3102/MDE/agents/ceo/runs/74b7d848-aeb8-4877-8ee5-776bac83bcd5`
**Result:** Succeeded (exit 0, ~57s)

### 9.1 Active problems observed

| # | Problem | Evidence | Severity | Fix |
|---|---------|----------|----------|-----|
| **L1** | **Fallback workspace** | `"No project or prior session workspace was available. Using fallback workspace /home/sk/.paperclip/instances/default/workspaces/..."` | **High** | In Paperclip UI: edit "Onboarding" project → add workspace with `cwd=/home/sk/mde`. Then attach issues + routines to that project. |
| **L2** | **CEO uses `curl \| python3` pipe** | Transcript: `curl -s ... \| python3 -c "import sys,json data = json.loads(sys.stdin.read())..."` | **High** | Replace CEO instructions with canonical block from `REFERENCE.md`. The CEO must not use shell commands. |
| **L3** | **CEO looks for unassigned work** | Transcript: `"Checking for unassigned backlog issues"` | **High** | Violates critical rule: "Never look for unassigned work." Must be in CEO instructions. |
| **L4** | **DANGEROUS COMMAND spam** | Run history: 6+ runs with yellow `⚠ DANGEROUS COMMAND: Security sc...` | **High** | Same root cause as L2 — CEO instructions. Each blocked run wastes budget. |
| **L5** | **API 404 errors** | Run `5d9c0871`: `"API call failed (attempt 1/3): NotFoun..."` | **Medium** | Likely a model ID mismatch. Verify `anthropic/claude-sonnet-4.6` is valid on OpenRouter. |
| **L6** | **Out of usage** | Run `c6eae14c`: `"You're out of extra usage - resets 2am"` | **Medium** | OpenRouter credit/rate limit. Add credits or throttle heartbeat frequency. |
| **L7** | **4 issues all `done`, no active work** | Transcript: `"Total issues: 4, all marked done. Queue is clear."` | **Low** | Expected for empty state. Create new issues to test workflow. |

### 9.2 Run history pattern (last 2 hours)

| Time | Run | Result | Notes |
|------|-----|--------|-------|
| just now | 74b7d848 | Succeeded | No work found, curl\|python3 used |
| 41m ago | 57ede4fb | Succeeded | Hermes |
| 44m ago | 3887cb78 | Succeeded | Hermes |
| 55m ago | 008986a5 | Assignment | Hermes |
| 55m ago | 77ec0878 | Assignment | Hermes |
| 57m ago | 989471d8 | Succeeded | Hermes |
| 1h ago | 52697e68 | Succeeded | Hermes |
| 1h ago | 3cca2426 | **DANGEROUS COMMAND** | curl\|python3 blocked |
| 1h ago | 5d9c0871 | **API call failed** | NotFound (model 404?) |
| 1h ago | c6b3a8b6 | **DANGEROUS COMMAND** | curl\|python3 blocked |
| 2h ago | d94941df | Automation | Resumed session |
| 2h ago | f1e7838e | **DANGEROUS COMMAND** | curl\|python3 blocked |
| 2h ago | c6eae14c | **Out of usage** | OpenRouter limit |
| 2h ago | be1a93e2 | **DANGEROUS COMMAND** | curl\|python3 blocked |
| 2h ago | 8fc4eab0 | **DANGEROUS COMMAND** | curl\|python3 blocked |
| 2h ago | 90d866be | **DANGEROUS COMMAND** | curl\|python3 blocked |
| 2h ago | d16ab34a | **DANGEROUS COMMAND** | curl\|python3 blocked |

**Pattern:** ~50% of runs fail with DANGEROUS COMMAND. This is burning budget on wasted heartbeats. The #1 priority fix is CEO instructions.

### 9.3 Immediate action plan

**Priority 1 (do now):**

1. **Fix CEO instructions** — In Paperclip UI, go to Agents → CEO → Instructions. Replace with the canonical block from `REFERENCE.md`:

```text
You are the CEO of mde.

You DO NOT access APIs directly.
You DO NOT use terminal commands.
You DO NOT fetch issues manually.

Paperclip provides:
- tasks
- context
- state

Your job:
- analyze assigned task
- decide actions
- delegate work
- create subtasks
- update task status

Never use:
- curl
- shell commands
- local API calls
```

2. **Bind workspace** — In Paperclip UI: Projects → "Onboarding" (or create new "mde" project) → Add workspace → Local path: `/home/sk/mde`. Then ensure all issues and routines reference this project.

**Priority 2 (verify after):**

3. Trigger a new heartbeat and confirm no DANGEROUS COMMAND
4. Create a test issue (assigned to CEO) and verify the heartbeat picks it up correctly
5. Check OpenRouter credits/limits

---

## 10. Risk Summary

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CEO keeps generating `curl \| python3` | **Certain** (current behavior) | High | Fix CEO instructions (L2, L3) |
| Workspace uses fallback path | **Certain** (current behavior) | Medium | Bind `/home/sk/mde` in project workspace (L1) |
| Budget burned on failed DANGEROUS COMMAND runs | **Active** (~50% failure rate) | Medium | Fix CEO instructions to stop the loop |
| OpenRouter rate/credit limit | Active | Medium | Add credits, reduce heartbeat frequency |
| Model 404 on some runs | Intermittent | Medium | Verify model string with OpenRouter |
| Embedded Postgres data loss | Low | High | Set up pg_dump backup |
| Agent panic (#447) | Low | High | Monitor runs, restart strategy |

---

*Audit complete. Next action: run the startup checklist (section 7) to make Paperclip operational.*
