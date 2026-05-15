# CLAUDE.md — mdeai.co

> **Source of truth for product strategy:** [prd.md](./prd.md) (v5.1, 2026-05-05). When CLAUDE.md and prd.md disagree, prd.md wins.

## Project Overview

**mdeai.co** is an AI-first platform for Medellín built around four product pillars (see prd.md §1):

1. **Rentals AI Chat** — semantic apartment + rental search with lead capture (Live)
2. **Events + Tickets** — host wizard, ticket buy flow, staff PWA scanner (Phase 1, current)
3. **Contests + Voting** — Miss Elegance Colombia flagship, hybrid scoring, leaderboard (Phase 2)
4. **Sponsorship Marketplace** — sponsor onboarding, ROI dashboard, AI brand-fit (Phase 3)

**Status:** ~55% overall (42/76 tasks per prd.md). Ship gate: **`npm run floor`** (lint + build + Vitest + `verify:edge` + **`verify:mastra`**) — last verified **2026-05-14**: Vitest **117** tests (**12** files), edge **21** passed (**51** ignored). Build ~7s. Live at https://www.mdeai.co.

**Vercel:** auto-deploys `main` to mdeai.co.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite 5 + React 18 + TypeScript + SWC |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS 3 |
| State | TanStack Query (server) + React Context (client) + Supabase Realtime |
| Routing | react-router-dom v6 |
| Backend | Supabase PostgreSQL + pgvector + 9 Edge Functions |
| Auth | Supabase Auth (email/password + Google OAuth) |
| AI | Google Gemini via Supabase Edge Functions |
| Forms | react-hook-form + Zod validation |
| Design | "Paisa" theme — DM Sans + Playfair Display, emerald/cream/charcoal |
| Testing | Vitest (unit) + Playwright (e2e) |

## Quick Commands

```bash
npm run dev          # Start dev server (port 8080, binds to ::)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
```

Floor before shipping any change: `npm run floor` (lint + build + test + verify:edge + verify:mastra).

## Project Structure

`src/` holds 152+ components, 31 hooks, 3 context providers, and 33 pages. `supabase/` holds 9 edge functions and migrations. Use `glob` or `grep` to discover specific files — don't memorize paths from this doc.

All routes are defined in `src/App.tsx`. Four categories: **public** (explore, listings, concierge), **auth** (login, signup, reset), **protected** (dashboard, trips, bookings), **admin** (`/admin/*`).

`@/` maps to `./src/`. Import order: react → third-party → `@/components` → `@/hooks` → `@/types` → `@/lib`.

## Architecture Rules

### 3-Panel Layout (Mandatory)

Every main page: left (context/filters/nav), main (content/listings), right (map/AI/quick actions). Mobile collapses to single column + bottom nav. See `.claude/rules/style-guide.md`.

### AI Interaction Pattern

AI **proposes only** — never auto-applies changes to bookings, trips, or saved data:
1. **Preview** — Show what AI suggests
2. **Apply** — User confirms action
3. **Undo** — User can revert

See `.claude/rules/ai-interaction-patterns.md` for chat architecture, intent router, and embedding patterns.

### Required States for Data Components

Every data-fetching component must handle all four states:
```tsx
if (isLoading) return <Skeleton />;
if (error) return <ErrorState onRetry={refetch} />;
if (!data?.length) return <EmptyState />;
return <Content data={data} />;
```

### No Client Secrets

Only `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_URL` are safe for client. All private operations go through edge functions. Service role key is for edge functions only.

## Supabase Rules

- **RLS on all tables** — no exceptions; no public writes, user-scoped reads
- Never modify `auth.users` directly — use `profiles` table
- Use `(select auth.uid())` subquery pattern in RLS policies (not direct `auth.uid()`)
- Add indexes for foreign keys and filter columns
- Schema changes require migration files in `supabase/migrations/`

See `.claude/rules/supabase-patterns.md` and the seven Supabase-specific rules in `.claude/rules/supabase-*.md`.

## Edge Function Rules

- Validate auth on every request (401/403 responses)
- Validate all inputs with Zod schemas
- Rate limits: AI 10 req/min/user, Search 30 req/min/user
- Log all AI runs to `ai_runs` table (agent_name, tokens, duration, status)
- Timeouts: 30s for AI calls, 10s for DB queries
- Response shape: `{ success: true, data }` or `{ success: false, error: { code, message } }`

See `.claude/rules/edge-function-patterns.md`.

## Database, AI integration, environment variables

Path-scoped — auto-loads when you open the relevant files:

- **Database tables (24+, pgvector + PostGIS)** — [.claude/skills/mde-supabase/references/tables-overview.md](.claude/skills/mde-supabase/references/tables-overview.md)
- **AI integration (Gemini-only, 9 edge functions)** — [.claude/skills/mde-supabase/references/ai-edge-functions.md](.claude/skills/mde-supabase/references/ai-edge-functions.md)
- **Environment variables (public + edge function secrets, Infisical source of truth)** — [.claude/skills/mde-infisical/references/env-vars-mdeai.md](.claude/skills/mde-infisical/references/env-vars-mdeai.md)

> Commerce / e-commerce is out of scope. Don't add storefront variables, skills, or scaffolding.

## .claude/ Architecture

### Rules (`.claude/rules/`)

Path-scoped — Claude loads them automatically when editing matching files:

| File | Scope | Content |
|------|-------|---------|
| `style-guide.md` | `src/**` | TypeScript, React, file naming, imports |
| `design.md` | `src/**/*.{css,tsx,ts}` | Paisa brand tokens + responsive rules |
| `supabase-patterns.md` | `src/**`, `supabase/**` | RLS, client usage, schema, security |
| `edge-function-patterns.md` | `supabase/functions/**` | Request lifecycle, auth, AI logging |
| `ai-interaction-patterns.md` | `src/**` | Propose-only, intent router, embeddings |
| `supabase-migrations.md` | `supabase/migrations/**` | Migration file conventions |
| `supabase-rls-policies.md` | `supabase/**/*.sql` | RLS policy patterns |
| `supabase-database-functions.md` | `supabase/**/*.sql` | DB function patterns |
| `supabase-edge-functions.md` | `supabase/functions/**/*.ts` | Edge fn Deno patterns |
| `supabase-realtime.md` | `supabase/functions/**`, `src/**` | Broadcast, presence, channels |
| `communication.md` | always | Response style rules |
| `shipping-and-divergence.md` | always | Local vs GitHub vs production |
| `task-writing.md` | always | Task template + §9 Definition of Done |

### Hooks (`.claude/hooks/`)

Configured in `.claude/settings.json`:
- `post-edit-lint` — runs ESLint after `*.ts|*.tsx` edits (warn-only)
- `guard-sensitive-paths` — blocks writes to `supabase/migrations/**` and `.env*` without explicit approval (set `MDEAI_ALLOW_MIGRATION_EDIT=1` to bypass)

### Commands (`.claude/commands/`)
- `/process-task [ID|description|latest]` — Execute a task from backlog end-to-end
- `/deploy-check [quick|full]` — Pre-deployment verification checklist
- `/code-review` — Parallel security + performance review of current diff

### Skills (`.claude/skills/`)

Domain owner skills for active phases:

| Skill | Purpose |
|-------|---------|
| `mde-task-lifecycle` | 5-phase ship workflow (plan → ship → release) |
| `mde-supabase` | RLS, edge fns, migrations |
| `mde-vercel` | Deploy + React perf |
| `mde-github` | `gh`, PRs, Actions |
| `mde-stripe` | Payments (tickets, sponsors) |
| `mde-whatsapp` | Lead replies, OTP |
| `mde-real-estate` | Rentals marketplace |
| `mde-testing` | Vitest + Playwright + Chrome DevTools MCP |
| `systematic-debugging` | Debugging workflows |
| `mde-task-lifecycle` | Task template + Definition of Done |

> Removed (do not reference): any `shopify-*`, `gadget-best-practices`, `mdeai-freshness`, `mdeai-commerce`. Commerce is out of scope.

### Agents (`.claude/agents/`)
- `mdeai-planner` — strategic plans before code (read-only)
- `mdeai-executor` — implements an approved plan
- `security-auditor` — exposed secrets, missing RLS, auth bypasses
- `performance-reviewer` — re-renders, query efficiency, bundle size

## Phase 1 Priorities (current — Events + Tickets MVP)

Build is 100% done; **5 gate items block Phase 2**. Source of truth: [tasks/todo.md §1](tasks/todo.md) (Camila E2E · Roberto scan · staff link revocation · 50-buyer load test · Lighthouse a11y ≥ 90).

## Known Issues

- Admin routes lack proper admin auth guards (`useAdminAuth` hook needs audit)
- No Playwright e2e tests written yet (config present, suite empty)
- `bun.lockb` and `package-lock.json` both present — pick one package manager
- `STRIPE_SPONSOR_CHECKOUT_KEY` not yet set in Supabase prod — sponsor checkout will 500 until set

## Communication & Response Style

See `.claude/rules/communication.md` — plain English, lead with what changed, concrete numbers, no jargon without a one-line definition.

## Verification Culture

Prefer proof over claims. Evidence priority: (1) command output, (2) tests, (3) SQL results, (4) **localhost browser screenshot**, (5) logs, (6) code inspection only as fallback. Never call work "verified", "tested", "passed", "deployed", or "production-ready" without an evidence marker in the same message. The `stop-attribution-gate` hook enforces this.

**Localhost is mandatory** — for any task that touches UI, API endpoints, edge functions, or maps, you must start the dev server and capture live browser proof (screenshot + console output) before declaring the task done. `npm run test` passing is not a substitute for the app actually running. See Step 5b below.

## Mandatory Implementation Protocol (every task, no exceptions)

**One task at a time.** Do not start the next task until the current one is 100% verified. Each task follows this checklist in order:

### Step 1 — Read the skill
Check `index-skills.md` → open the matching `SKILL.md` (e.g. `mde-maps`, `mde-supabase`, `testing`). Read before writing any code.

### Step 2 — MCP verification (before writing code)
For every task, call the relevant MCPs to verify official docs:

| Task type | Required MCPs |
|-----------|--------------|
| Google Maps / Grounding / Places | `google-maps-code-assist retrieve-instructions` then `retrieve-google-maps-platform-docs` |
| Gemini / AI | `gemini-api-docs-mcp search_docs` |
| Mastra framework | `mastra searchMastraDocs` or `mastraDocs` |
| Supabase schema / RLS | `mcp__ed3787fc-985d-4fc2-87ac-e09815d3583a__execute_sql` + `search_docs` |
| General developer knowledge | `google-developer-knowledge answer_query` |

**Never implement from offline knowledge alone.** If MCP returns a correction, fix the implementation before proceeding.

### Step 3 — Implement
Code the task. Follow the relevant `SKILL.md` + `CLAUDE.md` architecture rules.

### Step 4 — Tests (required, not optional)
- Write Vitest tests that mechanically prove every requirement (not just "it renders").
- Tests must fail before the fix and pass after.
- Minimum: cover every external contract (ToS attributes, API field masks, schema columns, env vars).

### Step 5 — Run the full suite
```bash
npm run test        # all tests must pass, count must not regress
npm run lint        # 0 errors
npm run build       # exit 0
```
For Mastra changes: also `cd my-mastra-app && npm run test && npm run typecheck`.
For Supabase changes: also `npm run verify:edge` and confirm RLS policies.

### Step 5b — Localhost visual proof (mandatory for any UI, API, or maps change)

**Type-check and tests passing is not enough — exercise the actual runtime path in a live browser.**

**How:**
1. Start the dev server if not already running: `npm run dev` (port 8080)
2. Use **Claude Preview MCP** (`preview_start` → `preview_screenshot` → `preview_console_logs`) **or** **Chrome DevTools MCP** (`take_screenshot`, `list_console_messages`) to capture live proof
3. Capture at minimum: (a) a screenshot of the feature rendered, and (b) console output at warn/error level

**What to prove per change type:**

| Change type | What to show |
|-------------|-------------|
| UI component | Screenshot of the rendered component on the correct route |
| Public page | HTTP 200, page loads, no red console errors |
| API / edge function | `preview_eval` fetch call with response body shown |
| Maps / Map ID | Browser console shows `[mdeai/maps]` warn or the env-var path; screenshot of map panel |
| Auth-gated page | Navigate to route → verify auth gate renders (not a blank screen or crash) |
| Module logic | `import('/src/lib/module.ts')` in `preview_eval` → call the function, show return value |
| Supabase RLS | SQL query output via Supabase MCP or `supabase db reset` exit 0 |

**Evidence required in the task's final message:**
- At least one browser screenshot from the running localhost
- Console log snippet (warn/error level) — no unexpected crashes or 4xx/5xx
- `preview_eval` result if the feature is behind auth or not yet wired to a public route

### Step 6 — Update trackers
Every completed task updates all three files in the same session:
1. **Task YAML** — `status: Completed`, `completed_at`, DoD checkboxes filled with evidence
2. **`tasks/mastra/tasks/000-index.md`** — add to Completed table with evidence column
3. **`tasks/todo.md`** — update "Last updated" line + next-five list
4. **`changelog`** — prepend entry with evidence table

### Step 7 — Score the task
Provide a production-readiness score (0–100) with breakdown:
- Architecture alignment
- Official docs compliance (MCP-verified)
- Test coverage
- Production readiness

**Only suggest the next task after Step 7 is complete.**

## Canonical Superskill Convention

`mde-*` skills are the canonical orchestration entrypoints for mdeai work. Legacy / vendor / generic skills must redirect to the relevant superskill, not compete with it. Maps → `mde-maps`. Supabase → `mde-supabase`. Stripe → `mde-stripe`. Tasks → `mde-task-lifecycle`. Vercel → `mde-vercel`. Secrets → `mde-infisical`.

## Progressive Disclosure Rule

`SKILL.md` holds only: when to use, when not to use, quick routing, links to references, safety rules. Large operational content goes under `references/`. Never paste long docs directly into a SKILL.md body.

## Git Workflow & Shipping

Branch from `main`. Run `npm run lint && npm run build && npm run test` before pushing. Vercel auto-deploys on push to `main`. Repo: github.com/amo-tech-ai/medell-n-connect.

For how local/GitHub/production stay in sync and how to recover from divergence, see `.claude/rules/shipping-and-divergence.md`.

## One worktree, one PR, one testing cycle (hard rule)

Operate on **one worktree at a time** and **one focused PR at a time**. Finish, verify, and merge the current change before starting the next. Scattered worktrees with hidden uncommitted work are the single largest source of lost work and broken merges in this repo.

Before any new worktree or PR, run the six-step cycle: **Locate → Preflight → Research → Code → Verify → Ship**. Type-check passing is *not* a feature working — always exercise the runtime path (curl the endpoint, click the UI, scan the QR) before declaring done.

If a PR's diff grows beyond ~300 lines or mixes intents, **split before merging** (see the playbook). Never close a reviewed PR to "open a cleaner one" — push fixes to the existing PR instead.

- Skill: [`.claude/skills/mde-worktree-pr-flow/`](./.claude/skills/mde-worktree-pr-flow/) — six-step cycle, splitting playbook, `verify-clean.sh`, `list-worktrees.sh`.
- Rule: [`.claude/rules/worktree-discipline.md`](./.claude/rules/worktree-discipline.md) — short-form rule loaded into every conversation.
