# CLAUDE.md — mdeai.co

> **Source of truth for product strategy:** [prd.md](./prd.md) (v5.1, 2026-05-05). When this file disagrees with prd.md, prd.md wins.
> **Active work + ordering:** [tasks/todo.md](./tasks/todo.md). Top of file = ship next. When a task ships, move it to [changelog](./changelog) — don't leave `[x]` rows in todo.md.
> **Skills (mandatory check):** browse [.claude/skills/](./.claude/skills/) before non-trivial work. Match request → skill folder → load its `SKILL.md` first.
> **Task writing:** every new task (todo.md row, prompt file, planner output, PR body) follows [.claude/rules/task-writing.md](./.claude/rules/task-writing.md) — Purpose → Goals → Features → Workflows → User journeys → Agents → Integrations → Summary → Definition of Done.
> **Communication:** plain English by default. See [.claude/rules/communication.md](./.claude/rules/communication.md).

## What this is

mdeai.co is an AI-first platform for Medellín built around four pillars (see [prd.md §1](./prd.md)):

1. **Rentals AI Chat** — semantic apartment + rental search with lead capture (Live)
2. **Events + Tickets** — host wizard, ticket buy flow, staff PWA scanner (Phase 1, current)
3. **Contests + Voting** — Miss Elegance Colombia flagship (Phase 2)
4. **Sponsorship Marketplace** — sponsor onboarding, ROI dashboard, AI brand-fit (Phase 3)

Status: ~55% (42/76 tasks), 259/259 tests, build clean (~6s). Live at https://www.mdeai.co (Vercel auto-deploys `main`).

## Tech stack

Vite 5 + React 18 + TS + SWC · shadcn/ui + Tailwind 3 · TanStack Query · react-router v6 · Supabase Postgres + pgvector + 9 edge functions · Google Gemini for all AI · Vitest + Playwright · npm.

`@/` maps to `./src/`. AI = Gemini-only in production (no Anthropic API in the app). Models per agent: see [prd.md §3.1](./prd.md).

## Quick commands

```bash
npm run dev          # Vite dev, port 8080, binds ::
npm run build        # Production build (~6s clean)
npm run lint         # ESLint
npm run test         # Vitest run-once (259/259 today)
npm run test:watch   # Vitest watch
npm run verify:edge  # Deno tests for supabase/functions/*
```

## Floor before any PR

```bash
npm run lint && npm run build && npm run test
```

If touching `supabase/`: also `npm run verify:edge`. Before release: `/deploy-check full`.

## Definition of Done — continuous testing (mandatory)

**A task is not complete until it has been completely tested.** "It compiles" / "I committed it" / "the diff looks right" do not count. Before any task can move from `tasks/todo.md` → `changelog`:

| Layer | Required | Notes |
|---|---|---|
| Lint + types | `npm run lint` clean | zero errors |
| Unit | `npm run test` clean and **count did not regress** | new logic = new tests; bugs = regression test |
| Edge fns (if `supabase/` touched) | `npm run verify:edge` clean | Deno tests pass |
| E2E (if user-facing flow touched) | Playwright spec written + run, or documented manual run with screenshot | applies to ticket buy, scanner, vote, chat, host wizard |
| Live verify (if UI shipped to prod) | Hit the live URL after Vercel deploy and confirm HTTP 200 + visual check | "deployed" without seeing it work = not done |
| Test plan in PR | PR body lists what was tested + result | reviewer reads the plan, not the diff |

If a layer doesn't apply, **say so explicitly in the PR** (e.g. "no UI change → no E2E"). Silence ≠ exemption. When in doubt: write the test. Skill: [`mde-testing`](./.claude/skills/mde-testing/SKILL.md), [`test-driven-development`](./.claude/skills/test-driven-development/).

## Architecture rules (don't violate without discussion)

- **3-panel layout** on every main page: left = nav/filters, main = content, right = map/AI. Mobile collapses to single column + bottom nav. Skill: `mdeai-three-panel`.
- **AI proposes, never auto-applies.** Every suggestion: Preview → user Apply → user Undo. Exception: `rentals_intake` lead capture fires when the user explicitly asks to be contacted (the request *is* the confirmation).
- **Four states for every data component:** loading → error+retry → empty → success.
- **Database is the source of truth** — not cache, not frontend state. Schema changes via migrations only (`supabase/migrations/`).
- **RLS on every table.** Use `(select auth.uid())` subquery, not direct `auth.uid()`. Service-role key = edge functions only. Never modify `auth.users` — extend via `profiles`.
- **Out of scope:** Shopify, Gadget, Hydrogen, any storefront layer. Don't add `SHOPIFY_*` / `GADGET_*` env vars, skills, or scaffolding. Commerce is a far-future phase.

Deeper rules loaded per area: [style-guide](./.claude/rules/style-guide.md) · [supabase-patterns](./.claude/rules/supabase-patterns.md) · [edge-function-patterns](./.claude/rules/edge-function-patterns.md) · [ai-interaction-patterns](./.claude/rules/ai-interaction-patterns.md).

## Imports + file naming

- `@/` path alias only. No `../../` (going up more than one level is a smell).
- Import order: react → third-party → `@/components` → `@/hooks` → `@/types` → `@/lib`.
- Components `PascalCase.tsx`, hooks `useCamelCase.ts`, utils `camelCase.ts`, pages `PascalCase.tsx` matching the route.
- Strict TS, no `any`, prop interfaces explicit (not inline). Functional components only.

## Secrets — Infisical Agent Vault is the only source of truth

All credentials (Stripe, Gemini, Infobip, Supabase service role, staff/QR/cron secrets) live in self-hosted Infisical at `http://localhost:80`. **Never paste a secret into chat, file, `.env`, or commit.**

| Surface | Value |
|---|---|
| Dashboard | http://localhost:80/login |
| Project | `82d12c1d-c7dc-4b0e-82e2-2fca61340102` (org `0efac210-70fc-457b-accc-b56fe6835162`) |
| Launch Claude with secrets injected | `agent-vault run -- claude` |
| One-shot inject | `infisical run --env=prod -- <cmd>` |
| Sync direction | Infisical → Supabase / Vercel (never the reverse) |

`.env` may contain only `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_GOOGLE_MAPS_API_KEY`. Skill: [`mde-infisical`](./.claude/skills/mde-infisical/SKILL.md).

## Hooks (deterministic guards in `.claude/settings.json`)

- Lint runs after `*.ts|*.tsx` edits (warn-only).
- `supabase/migrations/**` writes require explicit approval.
- `.env*` writes blocked (except `.env.example`).

To change: `/hooks` or edit `.claude/settings.json`.

## Skills + agents (where to look)

Owner skills you'll hit most: `mde-task-lifecycle` (5-phase ship workflow), `mde-supabase` (RLS / edge fns / migrations), `mde-vercel`, `mde-stripe`, `mde-whatsapp`, `mde-real-estate`, `mde-testing`, `test-driven-development`, `mde-infisical`, `pgvector`, `mdeai-three-panel`. Subagents (in `.claude/agents/`): `mdeai-planner` (plan, no writes), `mdeai-executor` (implement an approved plan), `security-auditor`, `performance-reviewer`. Slash commands: `/process-task`, `/deploy-check`, `/code-review`.

## Git + shipping

Branch from `main`. Run the floor commands **and** the Definition-of-Done checklist before opening a PR. Vercel auto-deploys on push to `main`. Repo: `github.com/amo-tech-ai/mdeai`. For divergence recovery (cherry-pick, conflict resolution, why test counts vary across branches), see [.claude/rules/shipping-and-divergence.md](./.claude/rules/shipping-and-divergence.md).

## When in doubt

- *"How should I drive Claude on this task?"* → [.claude/skills/working-with-claude-code/](./.claude/skills/working-with-claude-code/)
- *"Is this task done?"* → re-read the **Definition of Done** above. If any row is unchecked, it's not done.
- *"Where does X live in this repo?"* → grep / `ls` / Glob it directly. Don't ask CLAUDE.md to map the codebase.
- *"What changed recently?"* → `git log --oneline -20` and [changelog](./changelog).
- *"What's next?"* → top of [tasks/todo.md](./tasks/todo.md).
