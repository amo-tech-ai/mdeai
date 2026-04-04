# CLAUDE.md — I Love Medellin

> Best practices and conventions for AI-assisted development on this codebase.

---

## Project Overview

**I Love Medellin** is a premium travel companion platform for Medellin, Colombia. It features listings (apartments, cars, restaurants, events), a 3-panel explore layout, trip planning with route optimization, AI concierge (Claude-powered), booking wizards, and saved collections.

- **Status:** Production-ready MVP (~88% complete)
- **Stack:** Vite 5 + React 18 + TypeScript 5 + Tailwind 3 + shadcn/ui + Supabase + TanStack Query
- **Dev server:** `npm run dev` (port 8080)

---

## Quick Commands

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (unit tests)
npm run test:watch   # Vitest in watch mode
```

---

## Project Structure

```
src/
  components/       # React components organized by feature domain
    ui/             # shadcn/ui primitives (49 components) — do not modify directly
    explore/        # 3-panel layout system (ThreePanelLayout, RightDetailPanel)
    bookings/       # Multi-step booking wizards
    trips/          # Trip management components
    chat/           # AI concierge UI
    layout/         # App shell (Sidebar, MobileNav, AppLayout)
    {feature}/      # Domain-specific components (apartments, cars, restaurants, events, etc.)
  hooks/            # Custom React hooks — one hook per data domain
  context/          # React contexts (ThreePanelContext, TripContext)
  pages/            # Route-level page components
  types/            # TypeScript type definitions
  lib/              # Utilities (utils.ts, mockData.ts)
  integrations/     # External service clients (supabase/client.ts, supabase/types.ts)
  assets/           # Static images
  test/             # Test setup

supabase/
  functions/        # Edge functions (ai-chat, ai-router, ai-optimize-route, etc.)
  config.toml

rules/              # Enforceable development constraints (rules > prompts)
docs/               # Project documentation, changelog, roadmap
```

---

## Code Conventions

### Imports

Always use the `@/` path alias. Never use deep relative imports.

```tsx
// Correct
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Trip } from "@/types/trip";

// Wrong
import { Button } from "../../../components/ui/button";
```

### Component Patterns

- **One component per file.** Max ~300 lines per file; split if larger.
- **Feature components** go in `src/components/{feature}/`. Pages go in `src/pages/`.
- **All main pages use the 3-panel layout** via `ThreePanelLayout` and `ThreePanelContext`.
- **shadcn/ui components** live in `src/components/ui/` and should not be modified directly. Use composition and wrappers instead.

### Data Fetching

- Use **TanStack Query** (`useQuery` / `useMutation`) for all server state. One custom hook per data domain (e.g., `useApartments`, `useTrips`, `useBookings`).
- Every data-fetching component must handle **4 states**: loading (skeleton), empty (helpful message + action), error (message + retry), success (content).

```tsx
if (isLoading) return <Skeleton />;
if (error) return <ErrorState onRetry={refetch} />;
if (!data?.length) return <EmptyState />;
return <Content data={data} />;
```

### Forms

- Use **React Hook Form** + **Zod** for all forms and validation.
- Define Zod schemas in the component or a shared types file, then use `@hookform/resolvers/zod`.

### Styling

- Use **Tailwind CSS** utility classes. Use semantic design tokens from `src/index.css` and `tailwind.config.ts`.
- No hardcoded color values. All colors use HSL design tokens (e.g., `--primary: 160 60% 22%`).
- Use `cn()` from `@/lib/utils` for conditional class merging (powered by `clsx` + `tailwind-merge`).

### TypeScript

- Define shared types in `src/types/`. Database types are auto-generated in `src/integrations/supabase/types.ts`.
- Avoid `any`. Use proper types or `unknown` when the type is genuinely unknown.
- Use `interface` for object shapes, `type` for unions and intersections.

---

## Architecture Rules

These rules are **enforceable constraints**. If a prompt or feature request conflicts with a rule, the rule wins.

### Frontend

1. **3-panel layout is mandatory** for all main pages (Left: navigation/filters, Main: content, Right: detail/intelligence).
2. **AI proposes, never auto-applies.** All AI suggestions require user confirmation (Preview -> Apply -> Undo).
3. **No secrets in client code.** Only public keys (Supabase anon key) may appear in frontend. All private API calls go through edge functions.
4. **Responsive design required.** Desktop (3-panel), Tablet (collapsible left, overlay right), Mobile (single column + bottom nav).

### Backend (Supabase)

1. **Database is the source of truth.** Not cache, not frontend state. Schema changes require migrations.
2. **RLS on every table.** No public writes. Users can only access their own data. Admins manage listings.
3. **Never expose the service role key** in frontend code. Use `anon` key client-side; service role is for edge functions only.
4. **Use the `(select auth.uid())` subquery pattern** in RLS policies for performance.
5. **Paginate list queries** (default limit: 50).

### Edge Functions

1. **Validate auth on every request.** Extract user from JWT; return 401/403 for unauthorized access.
2. **Validate all inputs** with Zod schemas. Reject malformed requests early.
3. **Structured responses:** `{ success: true, data: T }` or `{ success: false, error: { code, message } }`.
4. **Rate limiting:** AI calls max 10/min per user, search max 30/min per user.
5. **Log all AI runs** to `ai_runs` table (agent_name, input_tokens, output_tokens, duration_ms, status).
6. **Timeouts:** 30s for AI calls, 10s for DB queries. Provide graceful fallbacks.

### Idempotency

For bookings and critical writes, use idempotency keys. Check for existing records before creating. Handle duplicate requests gracefully.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component, all route definitions |
| `src/index.css` | Design tokens, global styles |
| `tailwind.config.ts` | Tailwind theme configuration |
| `src/hooks/useAuth.tsx` | Auth provider and hook |
| `src/context/ThreePanelContext.tsx` | 3-panel state management |
| `src/integrations/supabase/client.ts` | Supabase client instance |
| `src/integrations/supabase/types.ts` | Auto-generated DB types |
| `supabase/functions/ai-chat/` | AI concierge edge function |
| `supabase/functions/ai-router/` | Intent classification edge function |
| `rules/` | Development rules (frontend, backend, supabase, edge-functions) |

---

## Routing

27 total pages: 14 public, 6 protected (auth required), 4 auth pages, 6 admin pages.

- **Protected routes** (`/saved`, `/trips`, `/bookings`, `/collections`, `/concierge`) use `<ProtectedRoute>`.
- **Admin routes** (`/admin/*`) require admin auth via `useAdminAuth`.
- **Dynamic routes:** `/apartments/:id`, `/cars/:id`, `/restaurants/:id`, `/events/:id`, `/:type/:id`.

---

## Testing

- **Unit tests:** Vitest + Testing Library. Tests go in `src/**/*.{test,spec}.{ts,tsx}`.
- **E2E tests:** Playwright. Config in `playwright.config.ts`.
- **Test setup:** `src/test/setup.ts` with jsdom environment.
- **Coverage target:** 60% (current coverage is low — prioritize hooks and wizard tests).

Run tests before pushing:
```bash
npm run test         # Unit tests
npm run lint         # Linting
npm run build        # Type-check + build
```

---

## Database

- **24 PostgreSQL tables** on Supabase with PostGIS for geospatial queries.
- **Key tables:** profiles, apartments, car_rentals, restaurants, events, saved_places, collections, trips, trip_items, bookings, conversations, messages, ai_context.
- **RLS enabled** on most tables. Tables still needing RLS: `user_preferences`, `budget_tracking`, `conflict_resolutions`, `proactive_suggestions`.

---

## AI Integration

- **Claude 3.5 Sonnet** powers the AI concierge via Supabase edge functions.
- **Intent router** (`ai-router`) classifies user messages and routes to the appropriate agent.
- **Google Directions API** for route optimization in trip planning.
- All AI calls are proxied through edge functions — the frontend never calls external AI APIs directly.

---

## Known Issues & Priorities

### Critical (Security)
- Enable RLS on remaining tables (`user_preferences`, `budget_tracking`, `conflict_resolutions`, `proactive_suggestions`)
- Add rate limiting to edge functions

### High Priority
- Increase test coverage (target 60%)
- Add React Error Boundaries with fallback UI
- Accessibility audit (skip links, keyboard nav, ARIA labels)

### Medium Priority
- Lazy load admin routes and booking wizards for smaller initial bundle
- Standardize API error handling with retry logic
- Split components exceeding 300 lines

---

## Git Workflow

- Develop on feature branches, merge to `main`.
- Write clear, descriptive commit messages.
- Run `npm run lint && npm run test && npm run build` before pushing.
- Do not commit `.env` files or secrets.
