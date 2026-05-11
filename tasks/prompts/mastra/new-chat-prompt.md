# New Chat Prompt — mdeai Mastra Implementation Session

> Copy everything below this line into a new Claude Code chat.

---

## Project context

You are working on **mdeai.co** — a chat-first AI concierge for Medellín built on Vite 5 + React 18 + TypeScript + Supabase (PostgreSQL + pgvector + Edge Functions) + Google Gemini. The repo is at `/home/sk/mde`.

**We have just added Mastra as the AI application runtime.** This session picks up that work.

## What has already been done (do NOT redo)

- **VDB-01 ✅** — Hybrid FTS + semantic search live in production (`ai-search` v47). `fts_content` columns + GIN indexes + 3 `hybrid_search_*` RPCs. Merged to `main` as PR #17 + #18.
- **C14 ✅** — `ai-embed` edge function (Gemini `gemini-embedding-001`, 768-dim pgvector pipeline) merged as PR #16.
- **C01 ✅** — Inline rental cards in chat stream.
- **C02 + C03 ✅** — Reasoning trace UX + lead capture tool.
- **PR #19 ✅** — ResizeObserver polyfill + 25U payments RLS fix. `main` is clean, 41/41 tests pass, `supabase db reset` exits 0.
- **`my-mastra-app/` ✅** — Mastra 1.x dev server running at `localhost:4111` with `@mastra/core`, `@mastra/memory`, `@mastra/observability`, LibSQLStore + DuckDBStore composite storage. Currently has only weather agent/workflow (placeholder).
- **19 Mastra task prompts ✅** — `tasks/prompts/mastra/MASTRA-001` through `MASTRA-019` — the full implementation ladder.
- **Architecture plan ✅** — `tasks/mastra/20-mastra.md` — 24-section production architecture doc researched from official Mastra docs.

## Key docs to read at session start

Before doing anything, read these files in order:

1. `/home/sk/mde/tasks/mastra/20-mastra.md` — production architecture plan (24 sections, ~1400 lines)
2. `/home/sk/mde/tasks/prompts/mastra/000-index.md` — execution order + DAG for all 19 tasks
3. `/home/sk/mde/tasks/prompts/mastra/001-mastra-source-inventory.md` — MASTRA-001 prompt
4. `/home/sk/mde/tasks/prompts/mastra/002-mastra-core-runtime-scaffold.md` — MASTRA-002 prompt
5. `/home/sk/mde/my-mastra-app/src/mastra/index.ts` — current Mastra singleton
6. `/home/sk/mde/my-mastra-app/package.json` — installed packages
7. `/home/sk/mde/tasks/todo.md` — full open task list (§2B = Mastra section)

## Critical architecture decisions locked in (do not revisit)

From `20-mastra.md` §5 and the 19 task prompts:

| Decision | Rationale |
|----------|-----------|
| **Replace LibSQL with `@mastra/pg`** | `file:./mastra.db` is ephemeral on any server restart or deployment |
| **Mastra server = dedicated service, NOT Vercel Functions** | Long workflows + SSE streaming exceed 30s Vercel limit |
| **All tools go through `withAudit()` wrapper** | Every tool call logs to `ai_tool_audit_events` before/after |
| **`openclaw_allowed: false` by default on every tool** | OpenClaw = approved execution only, never direct from LLM |
| **Hermes = advisory ranking only** — never executes | Input to agent scoring tools, no side effects |
| **Paperclip = workflow suspend/resume trigger** | Approval gates via `human_handoffs` rows in Supabase |
| **RouterAgent model: `google/gemini-2.0-flash-lite`** | Intent classification only, minimal tokens |
| **ConciergeAgent model: `google/gemini-2.5-pro`** | Complex coordination, full context |
| **Specialist agents: `google/gemini-2.0-flash`** | Vertical tasks, balanced cost/capability |
| **`mastra.*` schema is separate from `public.*`** | Storage tables never touch app tables directly |

## Architecture boundaries (never violate)

```
Agents → typed tools only → Supabase RPCs (not raw .from() writes)
                         → edge functions (not direct Stripe mutations)
                         → Hermes VPS (read-only advisory)
                         → OpenClaw VPS (only with Paperclip approval)
                         → Infobip (WhatsApp send, only via approved workflow step)
```

## Missing packages that MUST be installed in MASTRA-002

```bash
cd /home/sk/mde/my-mastra-app
npm install @mastra/pg @mastra/client-js
```

These are hard blockers:
- `@mastra/pg` — production PostgreSQL storage (replaces LibSQL)
- `@mastra/client-js` — browser SDK (blocks MASTRA-019 + frontend streaming)

## Mastra dev server commands

```bash
# Check status
cd /home/sk/mde/my-mastra-app && npx bgproc list

# Start cleanly
PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" hash -r
MASTRA_DEV_NO_CACHE=1 npx bgproc start -n my-mastra-app -w -- npm run dev

# Studio UI → http://localhost:4111
# Stop
npx bgproc stop my-mastra-app
```

## Floor checks before any PR

```bash
# Main repo
cd /home/sk/mde && npm run lint && npm run build && npm run test

# Mastra app
cd /home/sk/mde/my-mastra-app && npm run build
```

## Recommended folder structure for `my-mastra-app/src/mastra/`

```
src/mastra/
├── index.ts                    # Mastra singleton — register all agents/workflows
├── agents/
│   ├── router.ts               # RouterAgent: intent classification
│   ├── concierge.ts            # ConciergeAgent: coordinator + memory
│   ├── real-estate.ts          # RealEstateAgent
│   ├── events.ts               # EventsAgent
│   ├── restaurants.ts          # RestaurantsAgent
│   ├── sponsor.ts              # SponsorAgent
│   └── whatsapp.ts             # WhatsAppAgent: message segmentation
├── tools/
│   ├── index.ts                # Aggregates all tools
│   ├── registry.ts             # Declarative catalogue with risk metadata
│   ├── audit-wrapper.ts        # Pre/post hooks: audit row, timing, sanitized args
│   ├── risk-levels.ts          # Enum: low | medium | high | critical
│   ├── search/                 # search_rentals, search_events, search_restaurants
│   ├── memory/                 # memory_recall, memory_store
│   ├── approval/               # request_approval, check_approval_status
│   └── integration/            # hermes_rank, openclaw_submit (policy-gated)
├── workflows/
│   ├── rental-inquiry.ts       # Full rental lead workflow with suspend/resume
│   ├── ticket-purchase.ts      # Event ticket workflow
│   └── whatsapp-inbound.ts     # WhatsApp → segment → send workflow
├── memory/
│   └── config.ts               # Mastra Memory configured for @mastra/pg
├── storage/
│   └── config.ts               # PostgresStore replacing LibSQL
├── scorers/
│   ├── intent-accuracy.ts      # RouterAgent classification quality
│   ├── proposal-quality.ts     # Concierge response quality
│   └── tool-appropriateness.ts # Reused weather scorer pattern
└── types/
    ├── intents.ts              # RENTAL | EVENT | RESTAURANT | SPONSOR | SUPPORT | GENERAL
    ├── tool-context.ts         # TenantContext: org_id, user_id, jwt_claims
    └── workflow-state.ts       # WorkflowRun, WorkflowStep interfaces
```

## What to work on in this session

**Start with MASTRA-001** (source inventory — read-only, 1 day):

The goal of MASTRA-001 is to produce `/home/sk/mde/tasks/mastra/mastra-source-inventory.md` — a verified evidence pack that confirms:
- What Supabase tables/RPCs/edge functions actually exist (vs what the plan assumes)
- Which MASTRA-004 search tool prerequisites are confirmed (VDB-01 ✅, VDB-02 ❌)
- Which MASTRA-006/007/008 vertical prerequisites exist (events schema ✅, restaurant edge fn ❌)
- Any secret/security hygiene issues
- Updated P0 blockers list for the Mastra ladder

**Then move to MASTRA-002** (core runtime scaffold — 2 days):
- Install `@mastra/pg` + `@mastra/client-js`
- Replace LibSQLStore with PostgresStore (Supabase connection string from vault)
- Wire the recommended folder structure (agents/, tools/, workflows/, etc.)
- Health endpoint returning `{ ok: true, version, storage: 'postgres' }`
- Build must stay green

## Skill to use

Before writing any Mastra code, always check embedded docs:
```bash
cd /home/sk/mde/my-mastra-app
# Check current API
grep -r "Agent" node_modules/@mastra/core/dist/docs/references/ 2>/dev/null | head -20
# Or check source map
cat node_modules/@mastra/core/dist/docs/assets/SOURCE_MAP.json | python3 -m json.tool | grep Agent
```

Skill: `.claude/skills/mastra/` — follow its doc-first workflow exactly. APIs change fast.
MCP: `mastra` MCP server configured in `/home/sk/mde/.mcp.json` — use for live API lookups.

## What NOT to do in this session

- Do not touch Phase 1 gate items (G1-G5) — those are QA runs on existing code, not Mastra
- Do not add Phase 3 schemas (paperclip/hermes/openclaw) — they stay deferred
- Do not put Mastra code inside `src/` (the Vite app) — Mastra lives in `my-mastra-app/`
- Do not use LibSQL or DuckDB for any new domain — PostgreSQL only from MASTRA-002 onward
- Do not call OpenClaw directly from any tool without Paperclip approval gate
- Do not merge anything to main without: `npm run lint && npm run build && npm run test` all green

## Current main branch state

- Branch: `main` (clean, all PRs merged)
- Tests: 41/41 pass
- Build: clean
- `supabase db reset`: exits 0
- Live at: https://www.mdeai.co
