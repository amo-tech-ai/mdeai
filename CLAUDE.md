# CLAUDE.md — mdeai.co

> AI-powered marketplace (coffee, stays, experiences) for Medellín. Vite + React + TypeScript on Supabase + 9 edge functions; Shopify + Gadget for commerce; Claude/Gemini for AI.
> Live: https://www.mdeai.co · Repo: github.com/amo-tech-ai/medell-n-connect · Status: 95%+ complete.

For repo layout, route lists, table inventories, env-var details, and Phase 1 priorities, see [.claude/skills/working-with-claude-code/mdeai-setup.md](.claude/skills/working-with-claude-code/mdeai-setup.md).

## Quick commands

```bash
npm run dev          # Vite dev server, port 8080, binds to ::
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest watch
```

Floor before shipping any change: `npm run lint && npm run build && npm run test`. Run `/deploy-check full` for the full security + data-integrity audit.

## Path alias & imports

`@/` maps to `./src/`. Import order: react → third-party → `@/components` → `@/hooks` → `@/types` → `@/lib`. Don't go up more than one level with relative imports.

## Architecture (mandatory)

**3-panel layout** on every main page: left = context/nav/filters, main = content, right = map/AI/quick actions. Mobile collapses to single column + bottom nav.

**AI proposes, never auto-applies.** Every AI suggestion: Preview → user Apply → user Undo. No silent writes to bookings/trips/saved data.

**Four states for every data component**: loading → error+retry → empty → success. No exceptions.

**Database is the source of truth** — not cache, not frontend state. Schema changes via migrations only.

**RLS on every table.** Use `(select auth.uid())` subquery, not direct `auth.uid()`. Service role key = edge functions only. Never modify `auth.users` directly — extend via `profiles`.

## Secrets

`.env` may only contain `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `VITE_GOOGLE_MAPS_API_KEY`. All other secrets live in `.env.local` (gitignored) or Supabase dashboard / Infisical. Never put a service role key, Shopify admin token, or Gadget secret in any `VITE_` var.

## AI integration shape

Claude (frontend chat) + Gemini (edge functions, see model table in `mdeai-setup.md`). Six edge functions: `ai-chat`, `ai-search`, `ai-router`, `ai-trip-planner`, `ai-optimize-route`, `ai-suggest-collections`. Every AI run logs to `ai_runs` (agent_name, tokens, duration, status). Rate limits: AI 10/min/user, search 30/min/user. Timeouts: 30s AI, 10s DB.

For AI-component patterns (intent router, propose-only cards, embeddings), read [.claude/rules/ai-interaction-patterns.md](.claude/rules/ai-interaction-patterns.md).

## Style & rule files

Loaded on demand when working in the matching area:
- [.claude/rules/style-guide.md](.claude/rules/style-guide.md) — TypeScript, React, file naming, imports, styling
- [.claude/rules/supabase-patterns.md](.claude/rules/supabase-patterns.md) — RLS, client usage, schema, security
- [.claude/rules/edge-function-patterns.md](.claude/rules/edge-function-patterns.md) — Request lifecycle, auth, validation, AI logging
- [.claude/rules/ai-interaction-patterns.md](.claude/rules/ai-interaction-patterns.md) — Propose-only, intent router, embeddings

## Design tokens

Fonts: DM Sans (body), Playfair Display (headings). Palette: emerald primary, cream backgrounds, charcoal text. **All colors via CSS variables in `index.css`/`tailwind.config.ts`** — no hardcoded hex/rgb. Use `cn()` from `@/lib/utils` for conditional classes. Use shadcn/ui primitives — don't rebuild buttons/dialogs.

## Commerce — Shopify + Gadget

| Tool | Notes |
|------|-------|
| Gadget app | `mdeai--development.gadget.app`, CLI `ggt` 3.0.0 |
| Shopify app | `mdeai-development`, scaffolded at `~/mdeai-development/` (separate repo), Shopify CLI 3.93.0 |
| Dev store | `mdeaidev.myshopify.com` |

For Gadget/Shopify specifics, the `.agents/skills/gadget-best-practices` and `shopify-development` skills cover details.

## Skills (orchestrators)

48 active skills. Each domain has **one owner skill**; collisions are resolved with `Do NOT use for…` clauses pointing back to the owner.

**Workflow & meta**
| Topic | Owner skill |
|-------|-------------|
| Working with Claude Code (hooks, slash, agents, MCP) | `working-with-claude-code` |
| Anthropic API tool use (server tools, custom tools, combinations) | `mde-tool-use` |
| Prompt + skill authoring | `mde-prompting` |
| Skill scaffolding (file generators) | `skill-development`, `skill-factory` |
| Slash-command authoring | `command-development` |
| Hook authoring | `hook-development` |
| Subagent authoring (Claude Code + Managed Agents API) | `agent-development`, `mde-agents` |
| Tasks & shipping (5-phase lifecycle) | `mde-task-lifecycle` |
| Writing plans / PRDs | `mde-writing-plans` |
| Roadmap planning | `mde-roadmap` |
| Plan analysis / critique | `plan-analysis` |
| Brainstorming | `brainstorming` |
| Tech-stack research | `tech-stack-research` |
| Parallel agent dispatch | `dispatching-parallel-agents` |
| Superpowers (skill discovery) | `using-superpowers` |
| Systematic debugging | `systematic-debugging` |
| Troubleshooting (general) | `troubleshooting` |

**Domain (mdeai stack)**
| Topic | Owner skill |
|-------|-------------|
| Supabase (DB, RLS, edge fns, migrations) | `mde-supabase` |
| Vercel deploy + React perf | `mde-vercel` |
| GitHub (gh, PRs, Actions) | `mde-github` |
| GitHub Actions workflow specs | `create-github-action-workflow-specification` |
| Secrets (Infisical) | `mde-infisical` |
| Stripe payments | `mde-stripe` |
| WhatsApp (Twilio + Kapso) | `mde-whatsapp` |
| Real-estate marketplace | `mde-real-estate` |
| Social media workflows | `mde-social-media` |
| Web scraping / search (Firecrawl) | `mde-firecrawl` |
| VPS / Docker / Hostinger | `mde-hostinger` |
| Paperclip (commerce ops) | `mde-paperclip` |
| Events / event-prospecting | `events`, `event-prospecting` |
| Testing (Vitest + Playwright + Chrome DevTools MCP) | `mde-testing` |
| Test-driven development discipline | `test-driven-development` |
| Pre-deploy gates / readiness checks | `mdeai-project-gates` |
| Production-stay vendor (`hermes`, `open-claw`) | `hermes`, `open-claw` |

**Specialists (narrow, single-job)**
| Topic | Skill |
|-------|-------|
| Chrome DevTools MCP (testing, debugging, perf) | `chrome-devtools`, `chrome-devtools-cli` |
| LCP / Core Web Vitals tuning | `debug-optimize-lcp` |
| Frontend visual design | `frontend-design` |
| Wireframe → spec → prototype | `wireframe-to-spec`, `wireframe-prototyping` |
| Mermaid diagrams | `mermaid-diagrams` |
| Conventional Commits | `git-commit` |
| Gemini API | `gemini` |
| Stripe Link payment credentials | `create-payment-credential` |

**Trigger files (legacy front-loader docs)**: `mdeai-commerce.md`, `mdeai-freshness.md`, `mdeai-three-panel.md`.

To find or fix a skill that isn't firing: `mde-prompting/skill-creator.md`.

## Subagents

`.claude/agents/`:
- `mdeai-planner` — strategic plans before code (no writes)
- `mdeai-executor` — implements an approved plan
- `security-auditor` — secrets, RLS, auth bypass scans
- `performance-reviewer` — re-render, query, bundle audit

Invoke via `/code-review` (parallel security + perf) or explicitly: *"use mdeai-planner to plan X"*.

## Slash commands

- `/deploy-check [quick|full]` — pre-deploy verification
- `/process-task [ID|latest]` — pull from `tasks/todo.md`, execute end-to-end
- `/code-review` — Writer/Reviewer pattern: parallel security + performance review of current diff

## Hooks (deterministic)

Configured in `.claude/settings.json`. Currently:
- Lint runs after `*.ts|*.tsx` edits (warn-only)
- `supabase/migrations/**` writes require explicit approval
- `.env*` writes blocked (except `.env.example`)

To add: `/hooks` or edit `.claude/settings.json`.

## Git workflow

Branch from `main`. Run `npm run lint && npm run build` before pushing. Vercel auto-deploys on push to main. Repo: `github.com/amo-tech-ai/medell-n-connect`.

## When in doubt

- *"How should I drive Claude Code on this task?"* → [working-with-claude-code/workflows.md](.claude/skills/working-with-claude-code/workflows.md)
- *"Claude keeps doing X despite a rule"* → [working-with-claude-code/anti-patterns.md](.claude/skills/working-with-claude-code/anti-patterns.md)
- *"Skill or hook or subagent here?"* → [working-with-claude-code/decision-rules.md](.claude/skills/working-with-claude-code/decision-rules.md)
- *"Where does X live in this repo?"* → [working-with-claude-code/mdeai-setup.md](.claude/skills/working-with-claude-code/mdeai-setup.md)
