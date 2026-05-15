# Next Steps — mdeai.co

> **How this file works**
> - Ordered top → bottom by **implementation order**. Top = ship next. Bottom = later.
> - Only **open** tasks live here. The moment a task ships (merged to `main` + verified live), **move it to [/home/sk/mde/changelog](../changelog)** with the date and PR link. Do **not** keep `[x]` rows in this file.
> - Before starting any task, check [.claude/skills/](../.claude/skills/) for a matching owner skill and follow its instructions. Common owners: `mde-task-lifecycle`, `mde-supabase`, `mde-vercel`, `mde-stripe`, `mde-whatsapp`, `mde-testing`.
> - **Mastra implementation prompts** (`tasks/mastra/tasks/mvp/`, `advanced/`, `maps/`): each `*.md` declares `skill: […]` in YAML. The rolled-up **task → skill paths** table is [`mastra/tasks/SKILL-REFERENCE.md`](./mastra/tasks/SKILL-REFERENCE.md) (also linked from `tasks/mastra/tasks/000-index.md` and `TASK-CITATION-TEMPLATE.md`).
> - **Prompt packs** live at **`tasks/`** root: [`chat/`](./chat/), [`vector/`](./vector/), [`events/`](./events/), [`data/`](./data/), [`real-estate/`](./real-estate/), [`openclaw/`](./openclaw/), [`paperclip/`](./paperclip/), [`postiz/`](./postiz/), [`whatsapp/`](./whatsapp/), etc. Full counts: [`tasks/progress-tracker.md`](./progress-tracker.md). **`tasks/prompts/`** now holds **only** [`prompts/mastra/`](./prompts/mastra/) (audits + legacy pack). **Legacy** Mastra numbered pack: [`prompts/mastra/tasks/000-index.md`](./prompts/mastra/tasks/000-index.md) (deprecated — use [`mastra/tasks/`](./mastra/tasks/) for execution).
> - **Maps + Mastra file inventory:** every on-disk maps doc and Mastra task path is listed in [§6B](#maps-mastra-backlog) below (links only — not each row a separate ship gate).
> - **PRD v2 diagram task spine (EVT-DIAG-*):** [`events/events-diagram-index.md`](./events/events-diagram-index.md) · [`events/events-diagram-roadmap.md`](./events/events-diagram-roadmap.md) · [`events/events-milestones.md`](./events/events-milestones.md) · [`events/events-progress.md`](./events/events-progress.md) · [`events/V2-tasks/README.md`](./events/V2-tasks/README.md) — generated task files under [`events/V2-tasks/`](./events/V2-tasks/) (regenerate via `python3 scripts/gen-events-diagram-tasks.py` when diagram nodes change).
> - **Ticket edge functions in this repo:** there is **no** `ticket-payment-webhook` (etc.) under `supabase/functions/` in this tree. Track the gap in [`mastra/tasks/103-ticket-payment-edge-functions-repo-gap.md`](./mastra/tasks/advanced/103-ticket-payment-edge-functions-repo-gap.md); archived event/ticket specs live under [`tasks/archive/`](./archive/) (e.g. numbered `00x`–`034`); active event index: [`events/000-index.md`](./events/000-index.md). **Revised cross-stack plan:** [`events/events-prd-v2-mastra-maps-automation.md`](./events/events-prd-v2-mastra-maps-automation.md).
> - **When you write a new task** (here or under `tasks/<vertical>/`), follow [.claude/rules/task-writing.md](../.claude/rules/task-writing.md): Purpose → Goals → Features → Workflows → User journeys → Agents → Integrations → Summary. Plain English. Lead with what the user can see, not file paths.
> - Source of truth for *why* each task matters: [prd.md](../prd.md) v5.1.
> - Floor before any PR: `npm run lint && npm run build && npm run test`.

**Last updated:** 2026-05-15 · **167/167** root Vitest (15 files) + **56/56** `my-mastra-app` Vitest + **`npm run build` exit 0** + **`npm run lint` 0 errors** · Mastra/maps tracker: [`tasks/mastra/progress-mastra.md`](./mastra/progress-mastra.md) §1c · live at https://www.mdeai.co · **Maps audit complete** (geocode-missing.ts column fix, MdeMarker/ChatMap `title` + accessibility, 15 compliance regression tests, production readiness checklist [`tasks/mastra/audit/04-production-readiness-checklist.md`](./mastra/audit/04-production-readiness-checklist.md) — score 61/100, P0: push + VITE_GEMINI key removal)

> **Migration chain fixed 2026-05-10** — `supabase db reset` now exits 0 on a clean clone. Removed 5 out-of-order `202601*` files, renamed restaurant seed to run after `remote_schema`, added missing `event_phase1` base migration, guarded `vote.entity_tally` trigger, changed pgvector operator to `operator(extensions.<=>)` for local compatibility.
>
> **VDB-01 shipped 2026-05-10** — Hybrid FTS + semantic search live in production (`ai-search` v47). `fts_content` generated columns on apartments/events/restaurants, GIN indexes, 3 `hybrid_search_*` RPCs (RRF). Verified: `mode: hybrid`, El Poblado FTS boost score=1.000, 5/5 acceptance tests pass.

---

## 🟥 1. Phase 1 gate — Events + Tickets MVP (P0, blocks Phase 2)

> **What these are:** The Events + Tickets feature is fully built. These five items are **QA runs**, not new features — they verify the built thing actually works end-to-end before we call Phase 1 done. Think of them as the sign-off checklist before a product ships to real users.

Build is 100% done per [prd.md §5.2](../prd.md). These five gate items are **the only thing standing between Phase 1 → Phase 2**.

- [ ] **G1 — Camila E2E (buyer)** — A real person buys a ticket on mdeai.co → confirms the confirmation email arrived in their inbox → QR code displays on their phone screen. Tests: Stripe charge, email delivery (Infobip), QR generation, mobile rendering. Skill: `mde-testing`, `mde-stripe`.
- [ ] **G2 — Roberto E2E (staff)** — A real person clicks a staff magic link → opens the scanner PWA → scans a valid QR → sees green ✓ → scans the same QR again → sees `ALREADY_USED`. Tests: staff auth, scan RPC, idempotency. Skill: `mde-testing`.
- [ ] **G3 — Staff link revocation** — A host revokes a staff link in the dashboard; within 60 seconds the scanner with that link must be denied entry. Tests: revocation propagation latency. Skill: `mde-testing`, `mde-supabase`.
- [ ] **G4 — Load test** — A script fires 50 simultaneous checkout requests at a 30-seat event. Result must be: exactly 30 tickets sold, 20 rejected, zero oversell. Tests: `ticket-payment-webhook` idempotency under concurrency. Skill: `mde-testing`.
- [ ] **G5 — Lighthouse a11y ≥ 90** — Run Google Lighthouse on event listing page, ticket buy page, staff scanner PWA, and host dashboard. Each must score ≥ 90 on accessibility. Skill: `mde-testing`, `debug-optimize-lcp`.

**Exit criteria:** all 5 green → unlock §3 (Phase 2 contests).

---

## 🟧 2. Chat track — revenue-critical UX (P0, parallel to §1)

> **Context:** C01, C02, C03 are implemented and committed — not yet merged to `main`. Merge them first before picking up C14.

**Implemented, pending merge to main:**
- **C01 — Inline rental cards** — rentals search results appear as cards inside the chat stream (done)
- **C02 — Reasoning Trace UX** — collapsible "Thought for Ns" panel shows above AI reply (done)
- **C03 — Lead Capture Tool** — every chat session writes a row to `leads`; `chat-lead-capture` edge fn live (done)

**Open — implement in order:**

- [ ] **C04 — Host Listing Intake via Chat** (3d) — host describes their property in chat; AI extracts structured listing data. Unblocks the host SaaS funnel ($99–299/mo). Depends on **C03**. Prompt: [C04-host-listing-intake.md](./chat/C04-host-listing-intake.md).
- [ ] **C05 — Events Chat Flows** (4d) — discovery + ticket purchase + event creation all happen inside chat. 5–8% commission per ticket. Depends on `events` table + `ticket-checkout` edge fn. Prompt: [C05-events-chat-flows.md](./chat/C05-events-chat-flows.md).

---

## 🟧 2A. Vector track — semantic intelligence (P0, all depend on C14)

> **What this is:** A five-step pipeline that turns the database into a "meaning-aware" search engine. Each step builds on the last. C14 is the foundation; VDB-01 through VDB-05 compound the value. All five prompt files are in [`tasks/vector/`](./vector/).
>
> **Why it matters:** Right now a user who types "quiet apartment good for remote work" gets zero results — no column in the database says "quiet" or "remote work". After this track, the search understands *meaning*, not just keywords. Users who search by vibe convert at 2–3× the rate of keyword searchers.

- [ ] **VDB-02 — User memory pipeline** (3d) — remembers what each user told the concierge across sessions. "Camila said pet-friendly under $800 in Laureles" persists. Depends on **C14, VDB-01**. Prompt: [VDB-02-user-memory-pipeline.md](./vector/VDB-02-user-memory-pipeline.md).
- [ ] **VDB-03 — Semantic query cache** (1d) — "apartamento Laureles" and "apartamento en Laureles" are the same query; cache the embedding so we don't call Gemini twice. Saves ~150ms latency per cached hit. Depends on **C14, VDB-01**. Prompt: [VDB-03-query-semantic-cache.md](./vector/VDB-03-query-semantic-cache.md).
- [ ] **VDB-04 — Personalization** (2d) — "For You" section in chat surfaces listings based on the user's browsing + preference history. Depends on **VDB-02**. Prompt: [VDB-04-personalization-recommendations.md](./vector/VDB-04-personalization-recommendations.md).
- [ ] **VDB-05 — Gemini Embedding 2 upgrade** (1d) — swap `gemini-embedding-001` → `gemini-embedding-2-002` across all embedding calls. Better multilingual quality, lower latency. Depends on **VDB-01–04** (run last). Prompt: [VDB-05-gemini-embedding-2-upgrade.md](./vector/VDB-05-gemini-embedding-2-upgrade.md).

---

## 🟨 3. Phase 2 — Contest engine (Miss Elegance Colombia)

Schema + admin + vote page already shipped. These items finish the loop. **Blocked on §1 gate.** See [prd.md §5.2 Phase 2](../prd.md).

- [ ] **V1 — Phone OTP via Infobip** — voter verification. Skill: `mde-whatsapp`.
- [ ] **V2 — Cloudflare Turnstile bot guard** on vote page.
- [ ] **V3 — `vote-cast` edge function** — tally + idempotency + nonce burn.
- [ ] **V4 — Gemini photo moderation** for contestant intake.
- [ ] **V5 — Leaderboard broadcast skill** — `vote:tally:{contestId}` realtime channel under load.
- [ ] **V6 — Trust page + Colombian legal sign-off** (Ley 1581/2012, Ley 643/2001).
- [ ] **V7 — OpenClaw VPS provision** (task 021 in legacy backlog).
- [ ] **V8 — Supabase Pro tier upgrade** — required before contest launch (1k+ leaderboard subscribers > Free 200 cap).

**Exit criteria:** $1K MRR · 5 paying agents · 1 contest with 1k+ votes · 0% confirmed fraud · first sponsor contract.

---

## 🟩 4. Phase 1.5 — Events hardening (parallel to Phase 2)

Per [prd.md §5.2 Phase 1.5](../prd.md). Pick up between blockers.

- [ ] **H1 — Native Gemini SDK migration** (`@google/genai@^1.0.0`) — task 045, currently 85%.
- [ ] **H2 — `event_media_assets` schema** — multi-image gallery for events.
- [ ] **H3 — `event_promo_codes` schema** + apply flow at checkout.
- [ ] **H4 — Order refunds + Stripe refund API** in `ticket-payment-webhook`. Skill: `mde-stripe`.
- [ ] **H5 — Taxes / IVA 19%** at checkout.
- [ ] **H6 — `listing-moderate` photo moderation edge fn**.

---

## 🟦 5. Phase 3 — Sponsorship marketplace + intelligence

Sponsorship core (14/14 tasks) done. `STRIPE_SPONSOR_CHECKOUT_KEY` is now set in prod. Marketplace + intelligence layer is 0%. Top items:

- [ ] **S1 — Sponsor chat concierge** — 3 intents in `ai-router` + `ai-chat`.
- [ ] **S2 — `find_sponsor_match` tool** — wire `ai-audience-match` into chat tool registry.
- [ ] **S3 — Sponsor onboarding wizard** — application → contract → first impression.
- [ ] **S4 — `ai-roi-explain` daily insight card** in sponsor dashboard.
- [ ] **S5 — `ai-creative-gen` brief → ad copy + image prompts**.
- [ ] **S6 — Stripe Connect payouts** to event organizers (per-event split).
- [ ] **S7 — Scam-score pipeline** for inbound listings (S1–S6 signals per [prd.md §4.5](../prd.md)).

---

## 🟪 6. Chat track — retention + reach (P1)

After C04–C05 land. These compound the chat surface.

- [ ] **C06 — Chat memory + personalization** (3d) — returning users 3× conversion. Depends on `user_preferences` + Hermes. Prompt: [C06-chat-memory-personalization.md](./chat/C06-chat-memory-personalization.md).
- [ ] **C07 — Multilingual EN/ES + personas** (2d) — 60% addressable-market lift. Standalone. Prompt: [C07-multilingual-follow-up.md](./chat/C07-multilingual-follow-up.md).
- [ ] **C08 — WhatsApp continuity** (2d) — LATAM 5× retention. Depends on `openclaw-concierge-webhook`. Skill: `mde-whatsapp`. Prompt: [C08-whatsapp-continuity.md](./chat/C08-whatsapp-continuity.md).
- [ ] **C15 — Booking confirmation flow** (2d) — closes booking revenue loop. Depends on existing `create_booking_preview` tool. Prompt: [C15-booking-confirmation-flow.md](./chat/C15-booking-confirmation-flow.md).
- [ ] **C16 — Multi-vertical inline cards** (2d) — restaurants/events/cars parity with rentals. Prompt: [C16-multi-vertical-inline-cards.md](./chat/C16-multi-vertical-inline-cards.md).
- [ ] **C09 — CRM + sponsor + buyer/seller flows** (5d, P2) — sponsor deals $500–5K each. Depends on **C03 + C06**. Prompt: [C09-chat-crm-sponsor-buyer-flows.md](./chat/C09-chat-crm-sponsor-buyer-flows.md).

---

<a id="maps-mastra-backlog"></a>

## 6B. Maps + Mastra — full backlog links

> **Purpose:** One place in `todo.md` that lists **every** active maps markdown under [`tasks/maps/`](./maps/) and **every** Mastra markdown under [`tasks/mastra/tasks/`](./mastra/tasks/). These are **documentation / task spec pointers**, not each an independent checkbox gate — sequencing and priority still come from [`mastra/tasks/000-index.md`](./mastra/tasks/000-index.md), [`maps/maps-prd-v2.md`](./maps/maps-prd-v2.md), [`maps/07-mapsv2-tasks.md`](./maps/07-mapsv2-tasks.md), and [`maps/MAPS-DOCS-CITATIONS.md`](./maps/MAPS-DOCS-CITATIONS.md). Before implementation: [`mastra/tasks/SKILL-REFERENCE.md`](./mastra/tasks/SKILL-REFERENCE.md) and skill **`mde-maps`**.

### Maps — `tasks/maps/` (root)

| Doc | Path |
| --- | --- |
| Prompt + Maps | [`01-prompt-maps.md`](./maps/01-prompt-maps.md) |
| Google + Mastra | [`02-google-mastra.md`](./maps/02-google-mastra.md) |
| Maps + Mastra | [`03-maps-mastra.md`](./maps/03-maps-mastra.md) |
| Audit (pass 1) | [`04-maps-audit.md`](./maps/04-maps-audit.md) |
| Audit (pass 2) | [`05-maps-audit.md`](./maps/05-maps-audit.md) |
| New plan | [`06-maps-new-plan.md`](./maps/06-maps-new-plan.md) |
| Maps v2 task audit | [`07-mapsv2-tasks.md`](./maps/07-mapsv2-tasks.md) |
| Repos | [`08-maps-repos.md`](./maps/08-maps-repos.md) |
| Checklist | [`maps-checklist.md`](./maps/maps-checklist.md) |
| Diagrams | [`maps-diagrams.md`](./maps/maps-diagrams.md) |
| Citation hub | [`MAPS-DOCS-CITATIONS.md`](./maps/MAPS-DOCS-CITATIONS.md) |
| PRD v1 (legacy) | [`maps-prd.md`](./maps/maps-prd.md) |
| PRD v2 (active) | [`maps-prd-v2.md`](./maps/maps-prd-v2.md) |
| Places API (New) audit | [`places-api-new-audit.md`](./maps/places-api-new-audit.md) |

**Archive:** [`tasks/maps/archive/`](./maps/archive/) — older fix plans, Agent Studio drafts (`026`–`030`, `022`, etc.); keep for history, not default execution paths.

### Mastra — `tasks/mastra/tasks/` (meta + prompts)

**Meta / index**

| File | Path |
| --- | --- |
| Task index + execution table | [`000-index.md`](./mastra/tasks/000-index.md) |
| Skills ↔ tasks | [`SKILL-REFERENCE.md`](./mastra/tasks/SKILL-REFERENCE.md) |
| Citation template | [`TASK-CITATION-TEMPLATE.md`](./mastra/tasks/TASK-CITATION-TEMPLATE.md) |
| Forensic checklist | [`102-MASTRA-TASK-FORENSIC-CHECKLIST.md`](./mastra/tasks/102-MASTRA-TASK-FORENSIC-CHECKLIST.md) |
| Mastra PRD | [`mastra-prd.md`](./mastra/mastra-prd.md) |
| Mastra roadmap | [`mastra-roadmap.md`](./mastra/mastra-roadmap.md) |
| Source inventory | [`mastra-source-inventory.md`](./mastra/tasks/mastra-source-inventory.md) |

**Implementation / audit task specs**

| File | Path |
| --- | --- |
| `003`–`021`, `024`–`025` | [`003-mastra-tool-audit-control-events.md`](./mastra/tasks/core/003-mastra-tool-audit-control-events.md) · [`004-mastra-hybrid-search-tools.md`](./mastra/tasks/core/004-mastra-hybrid-search-tools.md) · [`005-mastra-chat-router-concierge.md`](./mastra/tasks/mvp/005-mastra-chat-router-concierge.md) · [`006-mastra-real-estate-mvp-agents.md`](./mastra/tasks/mvp/006-mastra-real-estate-mvp-agents.md) · [`007-mastra-events-mvp-runtime.md`](./mastra/tasks/mvp/007-mastra-events-mvp-runtime.md) · [`008-mastra-restaurants-mvp-discovery.md`](./mastra/tasks/mvp/008-mastra-restaurants-mvp-discovery.md) · [`009-mastra-ui-dojo-chat-frontend.md`](./mastra/tasks/mvp/009-mastra-ui-dojo-chat-frontend.md) · [`010-mastra-memory-rag-mvp.md`](./mastra/tasks/mvp/010-mastra-memory-rag-mvp.md) · [`011-mastra-observability-evals-guardrails.md`](./mastra/tasks/mvp/011-mastra-observability-evals-guardrails.md) · [`012-mastra-workflow-state-runtime.md`](./mastra/tasks/core/012-mastra-workflow-state-runtime.md) · [`013-mastra-tenant-isolation.md`](./mastra/tasks/core/013-mastra-tenant-isolation.md) · [`014-mastra-ai-rate-limits.md`](./mastra/tasks/core/014-mastra-ai-rate-limits.md) · [`015-mastra-tool-registry-system.md`](./mastra/tasks/core/015-mastra-tool-registry-system.md) · [`016-mastra-streaming-ui-state.md`](./mastra/tasks/mvp/016-mastra-streaming-ui-state.md) · [`017-mastra-workflow-recovery.md`](./mastra/tasks/mvp/017-mastra-workflow-recovery.md) · [`018-mastra-human-handoff-runtime.md`](./mastra/tasks/mvp/018-mastra-human-handoff-runtime.md) · [`019-mastra-client-sdk-integration.md`](./mastra/tasks/mvp/019-mastra-client-sdk-integration.md) · [`020-mastra-paperclip-approval-bridge.md`](./mastra/tasks/mvp/020-mastra-paperclip-approval-bridge.md) · [`021-mastra-vdb-local-remote-reconciliation.md`](./mastra/tasks/core/021-mastra-vdb-local-remote-reconciliation.md) · [`024-mastra-env-secret-boundary.md`](./mastra/tasks/core/024-mastra-env-secret-boundary.md) · [`025-mastra-dependency-alias-map.md`](./mastra/tasks/core/025-mastra-dependency-alias-map.md) |
| `20`–`23` (narrative) | [`20-mastra.md`](./mastra/tasks/20-mastra.md) · [`21-mastra-repos-templates.md`](./mastra/tasks/21-mastra-repos-templates.md) · [`22-mastra-repos-extract-tasks.md`](./mastra/tasks/22-mastra-repos-extract-tasks.md) · [`23-mastra-modules-verified.md`](./mastra/tasks/23-mastra-modules-verified.md) |
| `031`–`042` | [`031-mastra-editor-prompt-architecture.md`](./mastra/tasks/advanced/031-mastra-editor-prompt-architecture.md) · [`032-mastra-editor-prompt-block-library.md`](./mastra/tasks/advanced/032-mastra-editor-prompt-block-library.md) · [`033-mastra-editor-seeding-and-versioning.md`](./mastra/tasks/advanced/033-mastra-editor-seeding-and-versioning.md) · [`034-mastra-editor-runtime-preview-and-context.md`](./mastra/tasks/advanced/034-mastra-editor-runtime-preview-and-context.md) · [`035-mastra-editor-prompt-qa-studio-workflow.md`](./mastra/tasks/advanced/035-mastra-editor-prompt-qa-studio-workflow.md) · [`036-gemini-structured-output-helper.md`](./mastra/tasks/advanced/036-gemini-structured-output-helper.md) · [`037-verify-edge-floor-integration.md`](./mastra/tasks/advanced/037-verify-edge-floor-integration.md) · [`038-mastra-chat-live-smoke-timezone.md`](./mastra/tasks/advanced/038-mastra-chat-live-smoke-timezone.md) · [`039-mastra-chat-production-rollout.md`](./mastra/tasks/advanced/039-mastra-chat-production-rollout.md) · [`040-mastra-ai-runs-logging.md`](./mastra/tasks/advanced/040-mastra-ai-runs-logging.md) · [`041-mastra-search-events-supabase.md`](./mastra/tasks/advanced/041-mastra-search-events-supabase.md) · [`042-sponsor-gemini-structured-functions.md`](./mastra/tasks/advanced/042-sponsor-gemini-structured-functions.md) |
| `043`–`062` (geo / maps / routes) | [`043-mastra-geo-production-plan.md`](./mastra/tasks/maps/043-mastra-geo-production-plan.md) · [`044-mastra-deploy-verification.md`](./mastra/tasks/advanced/044-mastra-deploy-verification.md) · [`045-mastra-smoke-hardening.md`](./mastra/tasks/advanced/045-mastra-smoke-hardening.md) · [`046-mastra-action-schema-validation.md`](./mastra/tasks/maps/046-mastra-action-schema-validation.md) · [`047-mastra-map-pin-merge-versioning.md`](./mastra/tasks/maps/047-mastra-map-pin-merge-versioning.md) · [`048-mastra-maps-enrichment-phase2.md`](./mastra/tasks/maps/048-mastra-maps-enrichment-phase2.md) · [`049-mastra-geo-grounding-phase3.md`](./mastra/tasks/maps/049-mastra-geo-grounding-phase3.md) · [`050-mastra-canonical-models-constants.md`](./mastra/tasks/maps/050-mastra-canonical-models-constants.md) · [`053-mastra-wire-search-restaurants.md`](./mastra/tasks/maps/053-mastra-wire-search-restaurants.md) · [`054-mastra-wire-search-attractions.md`](./mastra/tasks/maps/054-mastra-wire-search-attractions.md) · [`056-mastra-grounded-mappincategory.md`](./mastra/tasks/maps/056-mastra-grounded-mappincategory.md) · [`057-mastra-grounding-quota-log-migration.md`](./mastra/tasks/maps/057-mastra-grounding-quota-log-migration.md) · [`059-mastra-google-search-grounding.md`](./mastra/tasks/maps/059-mastra-google-search-grounding.md) · [`060-mastra-code-execution-budget-agent.md`](./mastra/tasks/advanced/060-mastra-code-execution-budget-agent.md) · [`061-mastra-retire-concierge-route.md`](./mastra/tasks/maps/061-mastra-retire-concierge-route.md) · [`062-mastra-wire-route-display.md`](./mastra/tasks/maps/062-mastra-wire-route-display.md) |
| `063`–`069` | [`063-mastra-sponsor-schema-foundation.md`](./mastra/tasks/advanced/063-mastra-sponsor-schema-foundation.md) · [`064-mastra-sponsor-gemini-edge-functions.md`](./mastra/tasks/advanced/064-mastra-sponsor-gemini-edge-functions.md) · [`065-mastra-grounded-pins-lite.md`](./mastra/tasks/maps/065-mastra-grounded-pins-lite.md) · [`066-mastra-grounding-attribution-component.md`](./mastra/tasks/maps/066-mastra-grounding-attribution-component.md) · [`067-mastra-places-field-mask-placeuri.md`](./mastra/tasks/maps/067-mastra-places-field-mask-placeuri.md) · [`068-mastra-production-map-id.md`](./mastra/tasks/maps/068-mastra-production-map-id.md) · [`069-mastra-grounding-lite-telemetry.md`](./mastra/tasks/maps/069-mastra-grounding-lite-telemetry.md) |
| `070`–`083` | [`070-mastra-contextual-view-defer-ga.md`](./mastra/tasks/maps/070-mastra-contextual-view-defer-ga.md) · [`071-mastra-google-cloud-api-key-ip-restrictions.md`](./mastra/tasks/maps/071-mastra-google-cloud-api-key-ip-restrictions.md) · [`072-mastra-grounding-lite-weather-cache.md`](./mastra/tasks/maps/072-mastra-grounding-lite-weather-cache.md) · [`073-mastra-places-field-masks-cost-audit.md`](./mastra/tasks/maps/073-mastra-places-field-masks-cost-audit.md) · [`074-mastra-places-cache-schema-ttl.md`](./mastra/tasks/maps/074-mastra-places-cache-schema-ttl.md) · [`075-mastra-places-nearby-rental-show-nearby.md`](./mastra/tasks/maps/075-mastra-places-nearby-rental-show-nearby.md) · [`076-mastra-places-details-cache-enrichment.md`](./mastra/tasks/maps/076-mastra-places-details-cache-enrichment.md) · [`077-mastra-places-photos-cards.md`](./mastra/tasks/maps/077-mastra-places-photos-cards.md) · [`078-mastra-places-autocomplete-host-venue.md`](./mastra/tasks/maps/078-mastra-places-autocomplete-host-venue.md) · [`079-mastra-geocoding-address-fallback.md`](./mastra/tasks/maps/079-mastra-geocoding-address-fallback.md) · [`080-mastra-places-security-quota-controls.md`](./mastra/tasks/maps/080-mastra-places-security-quota-controls.md) · [`081-mastra-places-test-fixtures-mocks.md`](./mastra/tasks/maps/081-mastra-places-test-fixtures-mocks.md) · [`083-mastra-search-restaurants-integration-tests.md`](./mastra/tasks/advanced/083-mastra-search-restaurants-integration-tests.md) |
| `103` (repo gap) | [`103-ticket-payment-edge-functions-repo-gap.md`](./mastra/tasks/advanced/103-ticket-payment-edge-functions-repo-gap.md) |

**Note:** Early-step inventory / scaffold / smoke specs **`001`**, **`002`**, **`022`**, **`023`**, **`026`–`030`** live under [`tasks/maps/archive/`](./maps/archive/) (also linked from [`mastra/tasks/000-index.md`](./mastra/tasks/000-index.md) execution table). **Gaps:** there are **no** `051` / `052` / `055` / `058` task files under `tasks/mastra/tasks/mvp/`, `tasks/mastra/tasks/advanced/`, or `tasks/mastra/tasks/maps/` — if PRD or audits cite those IDs, add stubs or renumber references.

### 6C. Mastra + Maps — rolled-up progress (tables)

**Single tracker (status · % · evidence · next action + §1c scores):** [`tasks/mastra/progress-mastra.md`](./mastra/progress-mastra.md) — refreshed **2026-05-15**; §2 YAML/dots synced (**047/050/054/073**); evidence: **`npm run floor` exit 0** (2026-05-15), root **`npm run test`** **79**/79, **`npm run verify:mastra` OK**, `my-mastra-app` **`typecheck` + `test`** **24**/24. **Forensic companion:** [`tasks/audit/33-mde-audit.md`](./audit/33-mde-audit.md).

**Completed (maps + chat action gate — YAML):** MASTRA-046 · MASTRA-047 · MASTRA-050 · MASTRA-053 · MASTRA-054 · MASTRA-056 · MASTRA-057 · MASTRA-066 · MASTRA-068 · MASTRA-073 (see tracker **§1c** for 0–100 implementation scores).

**Next five (Mastra / Maps only):** (1) **MASTRA-074** — verify Places cache schema (`supabase db reset`; fix `FOR ALL` → 4 separate policies). (2) **MASTRA-067** — `enrich-places.ts` field mask + placeUri. (3) **MASTRA-048** — enrichment phase 2 (depends on 074/067). (4) **MASTRA-049** — MCP grounding agent tool + quota. (5) **Human step** — create real Map ID in GCP Console + set `VITE_GOOGLE_MAPS_MAP_ID` in Vercel.

---

## ⬜ 7. Tech-debt cleanup (anytime, low priority)

- [ ] **Merge `chore/claude-audit-tools` → `main`** — contains C14 fixes, VDB-01 hybrid search, deps (qrcode, jsqr, @testing-library/dom, fake-indexeddb). Before merging: update `20260509230000_fix_embedding_indexes_and_rpcs.sql` to use `operator(extensions.<=>)` (local schema) to match the `20260509205216` fix already on `main`. Otherwise `supabase db reset` will fail on the merged chain.
- [ ] Add proper admin auth guards on `/admin/*` routes (`useAdminAuth` hook audit).
- [ ] Write Playwright e2e suite (config exists, suite empty). Skill: `mde-testing`.
- [ ] Pick one package manager — drop either `bun.lockb` or `package-lock.json`.
- [ ] Tighten `Conversation.user_id` type (`string` → `uuid | 'anon'`).
- [ ] Factor `useMarkerLayer` hook between `ChatMap` and `GoogleMapView`.
- [ ] Custom Cloud Console MapID — Mindtrip-muted palette.
- [ ] Cloud Console quota + budget alarm on Maps key.
- [ ] Lift `MapContext` to root or migrate to Zustand (prereq for `MapShell`).
- [ ] **Regenerate `tasks/mastra/tasks/SKILL-REFERENCE.md`** — add a script (Node or shell) that reads each task’s `skill:` YAML and rewrites the table so it cannot drift when tasks change.

---

## ⬜ 8. Phase 4 — Trio (OpenClaw / Hermes / Paperclip) — internal only

- [ ] Paperclip CEO fix + workspace binding (E5).
- [ ] Hermes intelligence scoring (E6).
- [ ] Contract automation — lease PDF analysis (E7).
- [ ] WhatsApp v2 — AI routing via OpenClaw (E8v2).

---

## ⬜ 9. Phase 5 — Native rental booking + landlord SaaS (later)

Not yet planned in detail. Tracked here so it doesn't get lost. Starts after Phase 3 hits exit criteria.

- [ ] Native rental booking (12% commission).
- [ ] Landlord SaaS — listing manager, leads inbox, calendar.
- [ ] Application review pipeline (host approve / reject / request-info).
- [ ] In-app messaging (renter ↔ landlord per application).
- [ ] Showing reminders via pg_cron T-24h + T-1h.

---

## Open product decisions

| # | Decision | Options | Due |
|---|----------|---------|-----|
| 1 | Primary PSP for COP | Stripe-only vs Wompi/local | Phase 2 |
| 2 | Showing availability model | Calendar integration vs manual slots | Phase 5 |
| 3 | Service fee % on native bookings | 12% flat vs tiered | Phase 5 |

---

## Testing gates (run continuously)

| Gate | When | Command | Pass |
|------|------|---------|------|
| 1. Build + Lint | Every PR | `npm run lint && npm run build` | Zero errors |
| 2. Unit tests | Every PR | `npm run test` | All pass |
| 3. Edge verify | PRs touching `supabase/` | `npm run verify:edge` | Deno tests pass |
| 4. Functional smoke | Weekly | Manual browser test | No CORS / 401 |
| 5. Pre-deploy | Before release | `/deploy-check full` | Security + data integrity green |
