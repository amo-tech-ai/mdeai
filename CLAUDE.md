# CLAUDE.md — mdeai.co

## 📑 File index

A live inventory of every file in this repo (excluding `node_modules/`, `.git/`, `dist/`, etc.) lives at **[`/home/sk/mde/index.md`](./index.md)**. It includes:

- Skills health summary (`.claude/skills/` + `.agents/skills/` working vs broken)
- 12 top-level directories with file counts + per-dir tree
- Top-level config files + dotfiles

Re-generate after large changes: see the Python script at the end of any prior CLAUDE conversation that produced it (~70 lines, walks the repo, writes markdown).

---

## 🛡️ Skills protection (added 2026-05-01)

The `.claude/skills/` and `.agents/skills/` directories hold installed Claude Code skills — **do NOT delete, sweep, or move any file inside either path.** Multiple incidents have lost skill content this session:

1. **2026-04-29 sweep**: `git stash push -u` swept `.agents/skills/` (gitignored, untracked) into a stash. Pointers in `.claude/skills/` survived but became "dangling" — pointing to empty addresses. Took weeks to notice, hours to recover.

2. **2026-05-01 branch-switch confusion**: switching to a branch that didn't have the same skill commits made files appear "deleted" from the working tree. They weren't — but the user-visible effect was identical. Trust loss is the same.

### Specific rules for skill directories

- **NEVER** run `rm`, `git clean`, `git stash -u` against `.claude/skills/` or `.agents/skills/`
- **NEVER** delete a skill folder, symlink, or `SKILL.md` file without explicit user confirmation listing the exact path
- **NEVER** restore symlinks via `git checkout` without first verifying their targets exist (broken targets = visible damage to the user)
- **NEVER** assume `.agents/skills/` content is reproducible — `skill-creator` reinstalls take time and may pull a different version than what was working

### Two-part skill install pattern (so the design is documented)

`skill-creator` installs each skill as TWO things:

```
Part 1 (CONTENT)  →  ~/mde/.agents/skills/<name>/    (gitignored — local only)
Part 2 (POINTER)  →  ~/mde/.claude/skills/<name>     (committed symlink)
```

Both must exist for the skill to load. If `.agents/skills/<name>/` is missing, the pointer becomes a broken symlink. Always verify both parts before declaring a restore complete.

### Verification commands (read-only — safe)

```bash
# count working vs broken skills
ls -la /home/sk/mde/.claude/skills/ | grep -c '^l'   # symlink count
find /home/sk/mde/.claude/skills/ -xtype l           # broken symlinks (-xtype l = dangling)
ls /home/sk/mde/.agents/skills/                       # installed content
```

### How to recover a damaged skill

1. **First choice — reinstall via `skill-creator`** (downloads fresh, latest version)
2. **Second choice — `git ls-tree -r <other-branch> -- .claude/skills/`** to find the pointer if it was lost
3. **Last resort — search git's object store** with `git rev-list --objects --all --reflog | grep .agents/skills/<name>`

NEVER recover by deleting and re-adding — recover by adding only.

---

## 🛑 ABSOLUTE RULE — Never delete files, ever (added 2026-05-01)

**Do NOT delete any file, directory, symlink, or git object on this repo. Period.**

This includes — but is not limited to:
- `rm`, `rm -rf`, `rmdir`
- `git clean` (any flags)
- `git rm`, `git rm -r`
- `git stash push -u`, `git stash push --include-untracked`
- `git reset --hard`, `git restore --worktree`, `git checkout -- <path>` against tracked paths
- `git checkout <branch>` when the user has untracked work that doesn't exist on the target branch (silently hides files)
- `git filter-branch`, `git filter-repo`, `git push --force` against any branch the user has work on
- `git branch -D`, `git branch -d` (loses unmerged commits)
- Overwriting files via `Write` / `>` / `>>` without showing the user the new contents first
- `mv` over an existing file
- `truncate`, `: > file`

**If you need a file removed, ask the user first. Always.** Tell them the exact path, why you'd remove it, and what the alternative is. Wait for an explicit "yes, delete X."

**Branch switches that hide files** count as deletion from the user's point of view — the working tree no longer shows the file. Before any `git switch` or `git checkout <branch>`, run `git status -uall` and quote untracked-file counts back to the user. If the target branch has fewer files in any tracked directory, ASK first.

**Why this rule exists.** Multiple incidents in this repo (2026-04-29 sweep, 2026-05-01 branch-switch confusion) where files appeared to vanish from the user's view because of git operations I ran. Even when the files were technically recoverable from git's object store, the user-visible experience was deletion. Trust loss takes weeks to recover; the rule is absolute.

**Recovery is always possible if you DON'T panic-delete more.** `git fsck`, `git reflog`, `git stash list`, `git ls-tree -r <branch>`, and `git cat-file -p <sha>` are all read-only and let you find any object git has ever seen. Use them before touching anything else.

**This rule overrides every other instruction.** If a user task implies deletion (e.g. "clean this up"), I MUST stop and confirm what specifically gets removed, by exact path, before running anything.

### After ANY restore, commit immediately. (added 2026-05-02 incident)

When you restore files from a stash, branch, or git object — **always commit them as the very next step.** Do NOT leave restored content as untracked or unstaged.

Why: restored-but-uncommitted files behave identically to "deleted" files from the user's point of view on the next branch switch. They appear in the working tree once, then vanish on the next checkout. The user sees the files come back → the user sees them disappear again → the user reasonably concludes I deleted them again. Even though git's object store still holds them, the trust loss is the same as if they were lost forever.

The 2026-05-02 incident:
- 2026-04-29: `git stash push -u` swept `tasks/` (700+ untracked files) into `stash@{2}^3`
- Each subsequent branch switch made `tasks/` appear empty in the user's editor
- I restored `tasks/` from the stash one or more times without committing
- On the next branch switch the user saw the files "disappear" again and concluded I had deleted them
- Resolved by `git checkout stash@{2}^3 -- tasks/ && git commit -m "..."` — the **commit step** is what permanently fixed it

Pattern to follow:
```bash
git checkout <stash-or-ref> -- <path>     # restore
git status -- <path>                       # confirm
git add <path>                             # stage
git commit -m "restore: <path> from <ref>" # commit (NOT optional)
```

If you can't commit (e.g., user says "just look at it temporarily"), tell the user explicitly: *"these files are restored but uncommitted — they will vanish on next branch switch unless we commit them."* Make the trade-off visible.

---

## ✅ How to commit safely — canonical recipe (added 2026-05-02)

The full reference lives in the [`git-commit` skill](./.claude/skills/git-commit/SKILL.md).
This section is the short version every commit MUST follow in this repo.

### 1. PRE-COMMIT — verify nothing is silently disappearing

Before EVERY commit (no exceptions, even one-line edits):

```bash
git status -uall                              # see staged + unstaged + ALL untracked
find tasks -type f | wc -l                    # quote back to user (current baseline: 236)
git ls-tree -r HEAD --name-only | wc -l       # tracked file count at HEAD
```

If the untracked count or `tasks/` count is **lower** than the previous turn, **STOP** — files have vanished. Do not commit. Restore from `git stash list` / `git fsck --no-reflogs` first, then commit.

### 2. STAGE — by exact path, never `git add .`

```bash
# Good — explicit paths
git add src/pages/Login.tsx src/pages/Signup.tsx supabase/migrations/20260502_*.sql

# Bad — sweeps anything that happens to be modified or untracked
git add -A    # ❌
git add .     # ❌  same risk
git add *     # ❌  shell globs depend on cwd
```

`git add -A` and `git add .` will pull in `.env`, leaked tokens, scratch files, broken symlinks — anything in the working tree. Always name the files.

### 3. WRITE the commit message via heredoc

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject under 70 chars>

<body — explain why, not what. Reference bug/PR if applicable.>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Conventional types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `chore`, `ci`, `revert`.

### 4. POST-COMMIT — verify the commit landed AND nothing else was lost

```bash
git log --oneline -1            # confirm new commit on top
git status -sb                   # working tree clean (or expected leftovers)
find tasks -type f | wc -l       # SAME count as pre-commit
git ls-tree -r HEAD -- tasks/ | wc -l   # tracked tasks/ count steady
```

If the file count dropped, **STOP and surface it to the user immediately** — do not push, do not run more commits.

### 5. PUSH — when network behaves

Default `git push` may time out on this machine due to GitHub's HTTP/2 endpoint. The local fix is already applied (`http.version=HTTP/1.1`, `http.postBuffer=524288000`). If push still hangs:

```bash
# verify config still set
git config --get http.version            # should print HTTP/1.1
git config --get http.postBuffer          # should print 524288000

# diagnose without touching repo
curl -fsSL --max-time 8 https://github.com   # should be 200 in <2s
ssh -T -o ConnectTimeout=5 git@github.com    # should print "Permission denied (publickey)" or username

# escape hatches (in order)
GIT_HTTP_LOW_SPEED_LIMIT=1000 GIT_HTTP_LOW_SPEED_TIME=60 git push -u origin <branch>
git push origin <small-commit-sha>:refs/heads/<branch>   # push older commits first
```

**Never** `--force` push to `main`. Force-push to a feature branch is OK only if the user explicitly asks.

### 6. NEVER DO THESE while committing

- `--no-verify` (skips hooks) — only if user explicitly asks
- `--amend` after a hook failure — the failed commit didn't happen, so amend would rewrite the PREVIOUS commit. Make a NEW commit instead.
- Commit `.env`, `.env.local`, anything ending in `.pem` / `.key` / `id_rsa*`, large binaries (`.dmg`, `.iso`, model weights). Even one such commit triggers GitHub's secret-scanning push protection block — and rotation is the only fix.
- `git config --global` anything — settings affect every repo on the machine. Use repo-local `git config` (no `--global`).

---

## 🚨 RULE: Never sweep untracked files (incident 2026-04-29)

**Do NOT run** `git stash push -u`, `git stash push --include-untracked`, `git clean`, `rm -rf` against directories with untracked content, or any command that bulk-removes/hides untracked files **without explicit user confirmation that LISTS the directories about to be touched.**

### What happened
On 2026-04-29 during the D3 kickoff, I ran `git stash push -u -m "pre-D3 unrelated local changes"` to clean the working tree. The `-u` flag sweeps all untracked files into `stash@{0}^3` — which silently moved **700+ files** out of the working tree, including:
- `tasks/audit/`, `tasks/best-practices/`, `tasks/docs/`, `tasks/hermes/`, `tasks/mermaid/`, `tasks/notes/`, `tasks/openclaw/`, `tasks/originals/`, `tasks/paperclip/`, `tasks/prompts/` (66 task prompts), `tasks/real-estate/`, `tasks/wireframes/`, `tasks/plan/01-…07.md` (the planning docs)
- `.agents/skills/` (~30 installed agent skills), parts of `.claude/skills/`, `.claude/rules/env-management.md`, `.claude/rules/library-references.md`
- `supabase/functions/p1-crm/`, `supabase/functions/tests/`, `supabase/seed.sql`
- `src/lib/p1-crm-api.ts`, `p1-crm-envelope.ts/.test.ts`, `src/hooks/useP1Crm.ts`, `useP1Pipeline.ts`, `src/components/rentals/ApartmentRentActions.tsx`, `src/pages/DashboardRentals.tsx`
- `deno.lock`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `AGENTS.md`, `claude.local.md`, root-level `plan/`, `prd.md`, `system.md`, `todo.md`, `screenshots/`, `mdeai-tech-audit.html`, etc.

Files were technically recoverable from the stash, but the user discovered they were missing 4 days later and had to flag it as urgent recovery. Nothing was *deleted*, but the user-visible effect was identical.

### What to do instead
1. **Always run `git status -uall` first** and quote the file count back to the user.
2. **If untracked count > 5**, treat the situation as "user has working work in progress" — do NOT auto-clean. Ask:
   > "There are N untracked files/dirs (list: …). Safe options: (a) leave them alone — work alongside them, (b) stash a specific path you call out, (c) commit them on a temp branch first. Pick one."
3. **Never use `-u` on `git stash`** unless the user has explicitly said "stash untracked too" *in this turn*. Default is `git stash push -m "..."` (tracked-modifications only).
4. **Never use `git clean -fd`, `git checkout .`, `git reset --hard`** without confirmation listing what would be destroyed.
5. **Selective stash pattern** when only some changes need parking:
   ```bash
   git add -p     # interactively stage just what's needed
   git stash --keep-index  # stash everything else
   ```
   Or skip stash entirely and `git diff --no-index <file>` to inspect without touching state.

### How to recover if it happens again
- `git stash list` — find the stash
- `git ls-tree -r --name-only stash@{0}^3` — list untracked files inside it
- `git checkout stash@{0}^3 -- <path>` — restore specific paths (one at a time or via xargs)
- `git restore --staged <path>` — unstage so they return to untracked state

This rule is enforced by review only — there's no hook today. The hook ticket lives in `tasks/todo.md` under continuous-testing.

---

## Project Overview

**mdeai.co** is an AI-powered marketplace connecting travelers and locals to premium coffee, luxury stays, and experiences in Medellin, Colombia. It's a "Digital Concierge" vendor marketplace with AI discovery, automated payouts, and zero-friction purchasing.

**Status:** 95%+ complete. 25+ features working with real Supabase data. Commerce layer (Shopify + Gadget) integrated. AI chat fully wired (6 edge functions, 7 agents).

**Website:** https://www.mdeai.co/ (live on Vercel: medell-n-connect.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite 5 + React 18 + TypeScript + SWC |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS 3 |
| State | TanStack Query (server) + React Context (client) + Supabase Realtime |
| Routing | react-router-dom v6 |
| Backend | Supabase PostgreSQL + pgvector + 9 Edge Functions |
| Auth | Supabase Auth (email/password + Google OAuth) |
| AI | Claude 3.5 Sonnet via Supabase Edge Functions |
| Forms | react-hook-form + Zod validation |
| Design | "Paisa" theme — DM Sans + Playfair Display, emerald/cream/charcoal palette |
| Testing | Vitest (unit) + Playwright (e2e) |
| Package manager | npm (lockfile present), bun.lockb also present |

## Quick Commands

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
npm run preview      # Preview production build
```

Dev server binds to `::` (all interfaces) on port 8080.

## Project Structure

```
src/
├── App.tsx              # Root: providers + all routes
├── components/          # 152+ React components
│   ├── ui/              # 40+ shadcn/ui primitives (button, card, dialog, etc.)
│   ├── layout/          # 3-panel layout system, navigation
│   ├── chat/            # FloatingChatWidget, message components
│   ├── ai/              # AI proposal/suggestion components
│   ├── admin/           # Admin dashboard components
│   ├── apartments/      # Apartment listings & details
│   ├── rentals/         # Unified rentals (apartments + cars)
│   ├── cars/            # Car listings & details
│   ├── restaurants/     # Restaurant listings & details
│   ├── events/          # Event listings & details
│   ├── bookings/        # Booking management
│   ├── trips/           # Trip planning
│   ├── collections/     # Curated collections
│   ├── explore/         # Discovery/explore features
│   ├── saved/           # Saved places
│   ├── auth/            # ProtectedRoute, login forms
│   ├── onboarding/      # New user onboarding
│   ├── notifications/   # Notification components
│   ├── panels/          # Panel-specific components
│   ├── places/          # Generic place components
│   ├── listings/        # Shared listing components
│   └── home/            # Homepage components
├── hooks/               # 31 custom hooks
│   ├── useAuth.tsx      # Auth context + hook (provider lives here)
│   ├── useChat.ts       # AI chat integration
│   ├── useAISearch.ts   # Semantic search
│   ├── useAITripPlanner.ts
│   ├── useIntentRouter.ts
│   ├── useApartments.ts / useCars.ts / useRestaurants.ts / useEvents.ts
│   ├── useBookings.ts / useTrips.ts / useTripItems.ts
│   ├── useCollections.ts / useSavedPlaces.ts
│   ├── useGoogleDirections.ts / useRouteOptimization.ts
│   ├── useRealtimeChannel.ts
│   └── useNotifications.ts
├── context/             # React Context providers
│   ├── TripContext.tsx
│   ├── ThreePanelContext.tsx
│   └── OnboardingContext.tsx
├── pages/               # 33 page components (see Routing section)
├── types/               # TypeScript type definitions
│   ├── listings.ts      # Apartments, cars
│   ├── trip.ts / booking.ts / chat.ts / event.ts / restaurant.ts
│   ├── explore.ts / saved.ts
├── integrations/supabase/  # Supabase client config
├── lib/
│   ├── utils.ts         # cn() utility (clsx + tailwind-merge)
│   ├── mockData.ts      # Development mock data
│   └── confetti.ts      # Celebration effects
supabase/
├── functions/           # 9 Edge Functions
│   ├── ai-chat/         # Multi-agent chat (concierge, trips, explore, bookings)
│   ├── ai-search/       # Semantic search across all listing types
│   ├── ai-router/       # Intent classification
│   ├── ai-trip-planner/ # AI trip planning
│   ├── ai-optimize-route/  # Route optimization
│   ├── ai-suggest-collections/  # Collection suggestions
│   ├── google-directions/  # Google Directions API proxy
│   ├── rentals/         # Rentals API
│   └── rules-engine/    # Business rules engine
├── migrations/          # 5 SQL migrations
rules/                   # Governance docs (frontend, backend, supabase, edge-functions)
docs/                    # Architecture, changelogs, audits, prompts, tasks
plan/                    # Planning documents and PRD drafts
```

## Path Alias

All imports use `@/` which maps to `./src/`:
```tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
```

## Architecture Rules

### 3-Panel Layout (Mandatory)

All main pages follow this layout:

| Panel | Purpose | Content |
|-------|---------|---------|
| Left | Context | Navigation, filters, user info |
| Main | Work | Primary content, listings, details |
| Right | Intelligence | Map, AI suggestions, quick actions |

Mobile: panels collapse to single column with bottom navigation.

### AI Interaction Pattern

AI **proposes only** — never auto-applies changes:
1. **Preview** — Show what AI suggests
2. **Apply** — User confirms action
3. **Undo** — User can revert

### Required States for Data Components

Every data-fetching component must handle all four states:
```tsx
if (isLoading) return <Skeleton />;
if (error) return <ErrorState onRetry={refetch} />;
if (!data?.length) return <EmptyState />;
return <Content data={data} />;
```

### No Client Secrets

- Never store API keys in frontend code
- Only `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_URL` are safe for client
- All private operations go through edge functions
- Service role key is for edge functions only

## Routing

### Public Routes
`/` `/explore` `/apartments` `/apartments/:id` `/rentals` `/cars` `/cars/:id` `/restaurants` `/restaurants/:id` `/events` `/events/:id` `/:type/:id` `/concierge` `/how-it-works` `/pricing` `/privacy` `/terms` `/sitemap` `/onboarding`

### Auth Routes
`/login` `/signup` `/forgot-password` `/reset-password`

### Protected Routes (require auth)
`/dashboard` `/saved` `/collections` `/trips` `/trips/new` `/trips/:id` `/bookings` `/notifications`

### Admin Routes
`/admin` `/admin/apartments` `/admin/restaurants` `/admin/events` `/admin/cars` `/admin/users`

## Design System

- **Fonts:** DM Sans (body), Playfair Display (headings/display)
- **Palette:** Emerald primary, cream backgrounds, charcoal text (HSL tokens in `index.css`)
- **All colors via CSS variables** — no hardcoded hex/rgb values
- **Dark mode:** supported via `class` strategy on `<html>`
- Use `cn()` from `@/lib/utils` for conditional classes
- Use shadcn/ui components — don't rebuild primitives

## Backend Rules

- **Database is source of truth** — not cache, not frontend state
- Schema changes require migrations
- All external API calls go through edge functions
- Consistent response shape: `{ success: true, data }` or `{ success: false, error: { code, message } }`
- Idempotency keys for payment/booking operations
- Pagination default: 50 items

## Supabase Rules

- **RLS on all tables** — no public writes, user-scoped reads
- Never modify `auth.users` directly — use `profiles` table
- Never expose service role key in frontend
- Use `(select auth.uid())` subquery pattern in RLS policies (not direct `auth.uid()`)
- Add indexes for foreign keys and filter columns

## Edge Function Rules

- Validate auth on every request (401/403 responses)
- Validate all inputs with Zod schemas
- Structured responses (success/error format)
- Rate limits: AI 10 req/min/user, Search 30 req/min/user
- Log all AI runs to `ai_runs` table (agent_name, tokens, duration, status)
- Timeouts: 30s for AI calls, 10s for DB queries
- Graceful fallbacks on timeout

## Database

24+ tables in Supabase PostgreSQL with pgvector:

**Core:** `profiles`, `apartments`, `cars`, `restaurants`, `events`, `collections`
**Bookings:** `bookings`, `saved_places`
**Trips:** `trips`, `trip_items`
**AI:** `conversations`, `messages`, `agent_jobs`, `ai_context`, `ai_runs`
**System:** `notifications`

PostGIS enabled for geospatial queries. pgvector for semantic search embeddings.

## AI Integration

Claude 3.5 Sonnet powers 6 AI edge functions:
- `ai-chat` — Multi-agent chat with tool-calling and streaming
- `ai-search` — Semantic search across apartments, restaurants, cars, events
- `ai-router` — Intent classification (routes to correct agent)
- `ai-trip-planner` — AI-assisted trip planning
- `ai-optimize-route` — Route optimization for trips
- `ai-suggest-collections` — Curated collection suggestions

Google Directions API proxied through `google-directions` edge function.

## Environment Variables

### Public (safe for frontend — in `.env`)
```
VITE_SUPABASE_PROJECT_ID       # Supabase project ID
VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase anon key
VITE_SUPABASE_URL              # Supabase API URL
VITE_GOOGLE_MAPS_API_KEY       # Google Maps (currently empty)
```

### Private (in `.env.local` — git-ignored via `*.local`)
```
SHOPIFY_CATALOG_API_KEY              # Shopify catalog access
SHOPIFY_DEV_DASHBOARD_ID             # Shopify partner dashboard
SHOPIFY_CLI_TOKEN                    # Shopify CLI auth (CRITICAL — never commit)
SHOPIFY_CLI_ORGANIZATION_ID          # Shopify org ID
PUBLIC_STORE_DOMAIN                  # mdeaidev.myshopify.com
PUBLIC_STOREFRONT_API_TOKEN          # Storefront API (read-only, public)
PRIVATE_ADMIN_API_ACCESS_TOKEN       # Admin API (CRITICAL — never commit)
PUBLIC_STOREFRONT_API_VERSION        # API version (2026-01)
GADGET_API_KEY                       # Gadget public key
GADGET_API_SECRET                    # Gadget secret (CRITICAL — never commit)
```

Edge function secrets configured in Supabase dashboard:
`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_ROUTES_API_KEY`, `INFOBIP_API_KEY`, `INFOBIP_BASE_URL`, `INFOBIP_PHONE_NUMBER`

## Commerce Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| Gadget CLI (`ggt`) | 3.0.0 | Sync Gadget app locally |
| Shopify CLI | 3.93.0 | Manage Shopify app + extensions |
| Shopify app | `mdeai-development` | Scaffolded at `~/mdeai-development/`, connected to Gadget |
| Dev store | `mdeaidev.myshopify.com` | Headless Shopify dev store |

### Shopify App Location
The Shopify React Router app lives at `~/mdeai-development/` (separate repo from this one). It connects to Gadget at `mdeai--development.gadget.app`.

## AI Models (Edge Functions)

All edge functions call Google Gemini directly via OpenAI-compatible endpoint:
`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`

| Edge Function | Model | Purpose |
|--------------|-------|---------|
| ai-chat (x3 calls) | `gemini-3-flash-preview` | Main conversational AI |
| ai-search (x2) | `gemini-3-flash-preview` | Semantic search parsing |
| ai-router | `gemini-3.1-flash-lite-preview` | Intent classification (cheapest) |
| ai-trip-planner | `gemini-3.1-pro-preview` | Complex trip generation |
| ai-optimize-route | `gemini-3-flash-preview` | Route optimization |
| rentals | `gemini-3.1-pro-preview` | Rental intake conversation |

Auth: `GEMINI_API_KEY` secret in Supabase dashboard.

## .claude/ Architecture

### Rules (`.claude/rules/`)
- `style-guide.md` — TypeScript, React, file naming, imports, styling
- `supabase-patterns.md` — RLS, client usage, schema, security
- `edge-function-patterns.md` — Request lifecycle, auth, validation, AI logging
- `ai-interaction-patterns.md` — Propose-only, intent router, chat, embeddings

### Commands (`.claude/commands/`)
- `/process-task [ID|description|latest]` — Execute a task from backlog
- `/deploy-check [quick|full]` — Pre-deployment verification checklist

### Skills (`.claude/skills/`)
- `mdeai-freshness` — Triggers on: freshness, roasted, badge, coffee age
- `mdeai-commerce` — Triggers on: shopify, gadget, cart, checkout, buy, order
- `mdeai-three-panel` — Triggers on: panel, layout, sidebar, responsive

### Agents (`.claude/agents/`)
- `security-auditor` — Scans for exposed secrets, missing RLS, auth bypasses (haiku)
- `performance-reviewer` — Checks re-renders, query efficiency, bundle size (haiku)

### Installed Skills (`.agents/skills/`)
- `gadget-best-practices` — Gadget models, actions, routes, Shopify integration
- `shopify-development` — GraphQL Admin API, CLI, Polaris, Liquid
- `shopify-apps` — Modern Shopify app template with React Router
- `shopify-hydrogen` — Hydrogen + Oxygen storefront
- `shopify-app-deployment` — Deployment strategies for Shopify apps

## Phase 1 Priorities

Commerce integration (IN PROGRESS):
1. ~~Connect Shopify headless dev store via Gadget.dev~~ DONE
2. ~~Build `/coffee` route displaying products from Gadget~~ DONE
3. ~~Cart via Storefront API mutations~~ DONE (useShopifyCart hook)
4. Test full checkout flow (needs test products in Shopify)
5. Extend `ai-chat` to search real Shopify products
6. ~~Deploy to mdeai.co via Vercel~~ DONE (live at www.mdeai.co)

## Known Issues

- Admin routes lack proper admin auth guards (useAdminAuth hook needs audit)
- No e2e tests written yet (Playwright configured but empty)
- Unit test coverage is minimal
- `bun.lockb` and `package-lock.json` both present — pick one package manager
- Need test coffee products in Shopify dev store + Gadget sync

## Git Workflow

- Branch from `main` for features
- Run `npm run lint && npm run build` before pushing
- Repo: github.com/amo-tech-ai/medell-n-connect
- Vercel auto-deploys on push to main
