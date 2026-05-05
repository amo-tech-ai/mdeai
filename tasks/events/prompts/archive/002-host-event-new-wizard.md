---
task_id: 002-host-event-new-wizard
diagram_id: EVENT-CREATION-WIZARD
prd_section: 15-user-stories.md §2 (S-O-1, S-O-2, S-O-3) + diagrams/10-event-creation-wizard.md
title: /host/event/new — 4-step organizer wizard (Basics → Tickets → Review → Publish)
phase: PHASE-1-EVENTS
priority: P0
status: Done
estimated_effort: 3 days
area: frontend
skill:
  - frontend-design
  - vercel-react-best-practices
  - supabase
  - gemini
  - vitest-component-testing
edge_function: null
schema_tables:
  - public.events
  - public.event_tickets
depends_on: ['001-event-schema-migration']
mermaid_diagram: ../diagrams/10-event-creation-wizard.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-EVENTS — first organizer touchpoint |
| **Route** | `/host/event/new` (protected by `useAuth`) |
| **Steps** | Basics → Tickets → Review → Publish (4 total) |
| **Auto-save** | Draft persists on every step transition; resume via `?draft=:id` |
| **AI** | "✨ Generate description" button → Gemini Flash → 3 variants (propose-only) |
| **Real-world** | Sofía (Miss Elegance organizer) opens it Tuesday 9am, publishes "Reina de Antioquia 2026 Finals" with 4 ticket tiers by 9:25am |

## Description

**The situation.** Today, organizers cannot create events on mdeai — `/events` is a discovery catalog seeded from Google Places + Ticketmaster + manual. Phase 1 unlocks self-serve event creation so any organizer (Sofía, Daniela, Andrés running a Laureles bar's DJ Wednesday, etc.) can publish in 25 minutes from a phone or laptop.

**Why 4 steps, not 6.** The PRD §2.2 E2.1 mentioned 6 steps (basics → venue → tickets → schedule → contests → sponsors). Per founder May 2 reset (no over-engineering): venue collapses to inline address text, schedule deferred to P2, contests deferred to P2, sponsors deferred to P2. **4 steps is the minimum that ships a paid event.**

**Why propose-only AI.** Per `.claude/rules/ai-interaction-patterns.md`, AI suggests, human applies. The description generator returns 3 variants; organizer picks one or rejects all. Never auto-fills.

## Steps

### Step 1 — Basics
**Fields:** event name, description (with "✨ Generate description" Gemini button), hero photo upload, start datetime, end datetime, timezone (default `America/Bogota`), address (free-text — venue picker is P2), city, optional website, optional age restriction (e.g. "18+").

**AI:** Description button → calls Gemini Flash via existing `ai-chat` edge fn pattern → returns 3 variants ≤200 chars each → user picks one or "Keep mine."

**Photo:** Upload to Supabase Storage `event-photos/` bucket → run through existing photo-moderation edge fn → reject nudity/minors/text-heavy. Use a generic event-photo-moderate edge fn (task 033) — `listing-moderate` is landlord-specific, do not import.

### Step 2 — Tickets
**Fields per tier** (1-5 tiers): name, optional description, price in COP cents (0 allowed = free), quantity (`qty_total > 0`).

**Constraints:** at least 1 ticket type required to publish. Currency locked to COP for P1.

**Live preview:** "1,000 GA × $40,000 COP = $40M COP capacity if sold out."

### Step 3 — Review
Read-only summary of all fields. Edit-this-section pencil icon per block returns to that step.

### Step 4 — Publish
- Generates unique `slug` from name (e.g. "Reina de Antioquia 2026 Finals" → "reina-de-antioquia-2026-finals"). On collision append `-2`, `-3`.
- Sets `events.status='published'` and `events.organizer_id = auth.uid()`.
- Inserts all `event_tickets` rows in same transaction.
- Shows public URL `https://mdeai.co/event/:slug` with one-click copy.
- "Share" panel with prefilled WhatsApp + IG copy (English-first, Spanish-Paisa toggle).

## Auto-save

- On every step transition (Next/Back), upsert `events` row with `status='draft'`.
- URL becomes `/host/event/new?draft=:event_id` after first save.
- Re-opening the URL loads existing draft; un-saved fields restored from a TanStack Query cache + Zod-validated.
- Draft auto-deleted after 30 days of inactivity (Phase 2 cron — not built in P1).

## Acceptance Criteria

- [ ] Sofía publishes a 4-tier event in ≤ 25 minutes (measured with stopwatch in dogfood).
- [ ] Browser refresh during step 2 → step 2 fields restored exactly.
- [ ] Slug generation handles: accents (`á → a`), spaces (`→ -`), collisions (`-2`, `-3`), max 80 chars.
- [ ] Cannot reduce `qty_total` below `qty_sold` once sold (DB CHECK enforces; UI validates).
- [ ] Photo moderation runs on upload; rejected photo shows reason banner.
- [ ] All 4 data states handled per `style-guide.md` (loading skeleton, error retry, empty, success).
- [ ] AI description button generates 3 variants in en + es-CO; user can pick one or "keep my own".
- [ ] Lighthouse a11y ≥ 90 on `/host/event/new`.
- [ ] Mobile: 360px viewport — no horizontal scroll, all CTAs tappable.

## Failure handling

- Photo upload fails → inline error, allow retry without losing other fields.
- Gemini timeout (>5s) → "Generation taking longer than usual" message, allow user to keep waiting or cancel.
- Slug collision after publish click → silently retry with `-2` suffix; if 5 retries fail, show "Try a different name."
- Network drop on publish → idempotency via `idempotency_keys` table; retry succeeds without duplicate event.

## Wiring plan

1. Read existing `src/pages/host/HostOnboardingWizard.tsx` (landlord wizard pattern) — copy 4-step shell.
2. Read `src/components/ui/{stepper,form,input,textarea,select}.tsx` for shadcn primitives.
3. Read `.claude/rules/ai-interaction-patterns.md` for the propose-only contract.
4. Create `src/pages/host/HostEventNew.tsx` (the page).
5. Create `src/components/host/event-wizard/{Step1Basics,Step2Tickets,Step3Review,Step4Publish}.tsx`.
6. Create `src/hooks/useEventDraft.ts` for autosave + restore.
7. Add Zod schemas in `src/types/event.ts`.
8. Wire the route in `src/App.tsx` under protected routes.
9. Vitest: 1 unit test per step component + 1 integration test for the full flow.

## Gemini integration (per task 045 + `.claude/skills/gemini`)

The "✨ Generate description" button must use the native Gemini API (not OpenAI-compat) so we get guaranteed-valid JSON for the 3 variants.

| Setting | Value | Source |
|---|---|---|
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent` | skill G4 |
| Auth | `x-goog-api-key` header | skill G4 |
| Model | `gemini-3-flash-preview` | current |
| `thinkingLevel` | `low` (creative task; not reasoning-heavy) | skill §"Thinking Levels" |
| `temperature` | omit (default 1.0; lower causes degraded output on Gemini 3) | skill G2 |
| `responseMimeType` | `application/json` | skill G1 |
| `responseJsonSchema` | `{ type:"object", properties:{ variants:{ type:"array", minItems:3, maxItems:3, items:{ type:"object", required:["en","es_co"], properties:{ en:{type:"string", maxLength:200}, es_co:{type:"string", maxLength:200} } } } }, required:["variants"] }` | skill G1 |
| Logged to `ai_runs` | `agent_name='event-description-generator'`, input/output tokens, duration_ms | repo convention |
| Retry | exponential backoff on 429/5xx (3 attempts) | skill §"Error Handling" |

UI behavior on response: render 3 cards (en + es-CO toggles), "Pick this one" button per card, "Keep my own" link to dismiss. Per `.claude/rules/ai-interaction-patterns.md` — propose only.

## See also

- [`../diagrams/10-event-creation-wizard.md`](../diagrams/10-event-creation-wizard.md) — flow diagram
- [`../15-user-stories.md`](../15-user-stories.md) §2 (S-O-1, S-O-2, S-O-3) — testable acceptance per story
- `.claude/rules/style-guide.md` — TypeScript / React conventions
- `.claude/rules/ai-interaction-patterns.md` — propose-only AI rail
