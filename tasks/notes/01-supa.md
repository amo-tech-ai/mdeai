Edge functions — what exists vs what’s still needed

**In repo (`supabase/functions/`):** ai-chat, ai-router, ai-search, ai-trip-planner, ai-optimize-route, ai-suggest-collections, google-directions, rules-engine, rentals, **p1-crm** — all listed in `supabase/config.toml`. Most use `verify_jwt = false`; **p1-crm** uses `verify_jwt = true`.

**Hosted project:** Deploy `p1-crm` from the repo after `supabase link`:

`supabase functions deploy p1-crm --use-api`

(MCP `deploy_edge_function` also works if you pass the full **`files`** array with source strings.)

**Epic 1 / P1:** `p1-crm` exposes **`create_lead`**, **`record_payment`**, **`schedule_showing`**, **`create_rental_application`** (JWT + Zod + rate limit; service role for writes). `verify_jwt = true` in `config.toml`. Optional: whatsapp-webhook may exist only on the host — not in this repo (see `tasks/audit/07-data-audit.md`).

---

Supabase schema, relationships, indexes, RLS, triggers

| Area | Status |
|------|--------|
| Base schema | `20260404044720_remote_schema.sql` |
| P1 tables | Six migrations: neighborhoods → leads → showings → rental_applications → property_verifications → payments |
| Relationships / indexes / RLS / triggers | Defined in those migration files |

Optional follow-up: pgvector / embeddings (e.g. E1-007).

---

“Agents” in Supabase

Product agents use `agent_type` on conversations / `ai_runs`, not one edge function per agent. Heavy jobs use `agent_jobs` (needs a worker if you rely on that queue).

---

Seed + config

- **`supabase/seed.sql`** exists (neighborhoods, profiles, apartments, P1 rows, bookings, payments). Idempotent `ON CONFLICT`.
- **`[db.seed]`** in `supabase/config.toml` → `sql_paths = ["./seed.sql"]` (runs on `supabase db reset` / after migrations when using local CLI).

---

MCP reminder: **deploy_edge_function**

Required arguments: `name`, `entrypoint_path` (e.g. `index.ts`), `verify_jwt`, **`files`** — array of `{ "name": "index.ts", "content": "<full source>" }`. Include **`../_shared/*.ts`** contents when the function imports them (CLI **`supabase functions deploy`** handles this from disk automatically).

---

**CLI checklist (linked project `zkwcbyxiwklihegjhuql`)**

1. `supabase link --project-ref zkwcbyxiwklihegjhuql`
2. `supabase db push --yes` — apply pending migrations
3. `supabase gen types typescript --linked --schema public --schema graphql_public > src/integrations/supabase/database.types.ts`
4. `supabase db query --linked -f supabase/seed.sql` — load demo data (idempotent)
5. `supabase functions deploy p1-crm --use-api` — ship edge function from disk (or deploy all changed functions after edits)
6. **`npm run verify:edge`** — `deno check` on all `supabase/functions/**/index.ts` + `_shared/*.ts`, then Deno unit tests (`supabase/functions/tests/`)
7. Optional: `supabase db advisors --linked --level info` — triage security/perf hints

---

## Edge functions — production baseline (repo)

**Shared (`supabase/functions/_shared/`):**

| File | Role |
|------|------|
| `http.ts` | `corsHeaders`, `jsonResponse`, `errorBody` — `{ success: false, error: { code, message, details? } }` |
| `rate-limit.ts` | Sliding-window limiter + `clientIp()` |
| `cron.ts` | `requireCronSecret()` when `CRON_SECRET` is set |
| `json.ts` | `safeJsonParse` for tool args / model output |
| `ai-runs.ts` | `insertAiRun()` — valid **`agent_type`** + **`ai_run_status`** enums (`success`, not `completed`) |

**`supabase/functions/deno.json`** — Deno tooling for functions.

**Handlers aligned with `edge-function-patterns.md` + `supabase-edge-functions` skill:**

| Function | Notes |
|----------|--------|
| **P1 / CRM** | **p1-crm** — JWT, Zod, rate limit; **`create_lead`**, **`record_payment`**, **`schedule_showing`**, **`create_rental_application`** |
| **Marketplace** | **rentals** — Zod discriminated `action`, rate limits, structured errors |
| **AI** | **ai-chat**, **ai-router**, **ai-search**, **ai-trip-planner**, **ai-optimize-route** — POST + Zod (where applicable), rate limits (AI 10/min, search 30/min per user/IP), **`insertAiRun`** when authenticated; **ai-chat** uses **`safeJsonParse`** for tool arguments |
| **Proxy / utility** | **google-directions**, **ai-suggest-collections** — Zod, rate limits, structured errors |
| **Ops** | **rules-engine** — POST, optional **`x-cron-secret`**, env check |

**Frontend:** `useChat` parses structured `{ error: { message } }` on non-stream failures; `useGoogleDirections` parses structured direction errors.

---

## Verify / test (proof)

Run locally (exit code **0** = pass):

```bash
npm run verify:edge    # deno check all functions + _shared; deno test supabase/functions/tests/
npm run build          # Vite production build
```

Expected: **Deno tests** — 7 passed (http/rate/cron/json); **build** — succeeds.

---

## Next steps — edge functions (real estate MVP)

**Reality check (vs generic audit):**

| Claim | Actual in this repo |
|-------|---------------------|
| “No pipeline tables” | **Done** — `leads`, `showings`, `rental_applications`, `payments`, etc. |
| “No seed / search empty” | **Partial** — `seed.sql` loads apartments + P1 demo rows; restaurants/cars/events still thin. |
| “lead-capture missing” | **MVP exists** — **p1-crm** (leads, showings, applications, payments). |
| `rentals-search` | **`rentals`** = intake + search + map pins — document or split later. |

**Done in repo (no longer “to harden”):** Zod + rate limits + structured errors + **`ai_runs`** logging on the main AI functions; **ai-router** / **trip planner** use valid DB enums via **`insertAiRun`**.

**Suggested order (what’s next):**

1. **Deploy** — Push functions that import `_shared` from disk: e.g.  
   `supabase functions deploy p1-crm rentals ai-chat ai-router ai-search ai-trip-planner ai-optimize-route google-directions ai-suggest-collections rules-engine --project-ref zkwcbyxiwklihegjhuql`  
   Run **`npm run verify:edge`** before deploy.
2. **Cron** — If **`CRON_SECRET`** is set, schedulers must send **`x-cron-secret`**. If unset, unchanged.
3. **Wire ai-search in UI** — when embeddings / product priority (E1-007); API is ready.
4. **`booking-create`** — validate availability, insert **`bookings`** + optional idempotency key.
5. **`payment-intent`** + Stripe webhook — **`payments`** + **`bookings.payment_status`**.
6. **`whatsapp-webhook`** — host download or new function: verify Infobip/Twilio → chat intake.

**Defer:** `lead-score`, heavy **`agent_jobs`** automation, pgvector-only work until E1-007 lands.

**Infra:** **`agent_jobs`** worker only if you commit to queue-based processing; else **pg_cron** / scheduled Edge Functions.

**Docs:** [Supabase CLI](https://supabase.com/docs/reference/cli/introduction), [Edge Functions](https://supabase.com/docs/guides/functions), local stack [getting started](https://supabase.com/docs/guides/local-development/cli/getting-started).

---

## Cross-project progress tracker

For a **full** task matrix (frontend, commerce, QA, % complete, gaps): see **[`tasks/notes/progress-tracker.md`](progress-tracker.md)** — includes verification steps and next actions beyond edge functions only.

---

## P1 real-estate CRM — frontend (production path)

| Piece | Location |
|-------|----------|
| Edge API | `supabase/functions/p1-crm/index.ts` |
| Typed client + flows | `src/lib/p1-crm-api.ts`, `src/lib/p1-crm-envelope.ts` |
| Mutations / pipeline read | `src/hooks/useP1Crm.ts`, `src/hooks/useP1Pipeline.ts` |
| Apartment CTAs | `src/components/rentals/ApartmentRentActions.tsx` (detail + mobile) |
| Pipeline UI | `/dashboard/rentals` — `src/pages/DashboardRentals.tsx` |

**Deploy:** `supabase functions deploy p1-crm` (JWT + service role on server). **Verify:** `npm run test` (envelope tests), `npm run build`, `npm run verify:edge`.

**Best-practice review prompt:** `tasks/prompts/VERIFY-supabase-postgres-edge.md` (Postgres RLS/indexes + Edge JWT/Zod/errors). **Epic 10:** `tasks/prompts/10E-crm-real-estate.md` → **`10A` / `10B` / `10C`** prompts in same folder. **Registry:** `tasks/prompts/INDEX.md`.
