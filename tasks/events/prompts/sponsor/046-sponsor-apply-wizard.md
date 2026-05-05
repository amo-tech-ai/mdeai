---
task_id: 046-sponsor-apply-wizard
title: /sponsor/apply — 4-step self-serve sponsor application wizard
phase: PHASE-1-SPONSOR-MVP
priority: P1
status: Open
estimated_effort: 2 days
area: frontend
skill:
  - frontend-design
  - supabase
  - mdeai-project-gates
  - vitest-component-testing
edge_function: sponsor-application-create
schema_tables:
  - sponsor.organizations
  - sponsor.applications
  - sponsor.assets
depends_on: ['045-sponsor-schema-migration']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-SPONSOR-MVP — the acquisition funnel entry point |
| **Route** | `/sponsor/apply` (public; auth gate on submit) |
| **Real-world** | Postobón brand manager opens `/sponsor/apply`, fills in 4 steps in 8 minutes, pays via Stripe, and closes the tab. 48h later their logo is live on the contest hero. Zero engineering hand-holding |
| **Edge function** | `POST /functions/v1/sponsor-application-create` — creates draft application + org if new |
| **Pattern** | 3-panel layout; react-hook-form + Zod; draft saved to `sponsor.applications` on each step |

## Description

**The situation.** There is no way for a brand to apply for event sponsorship. Admin manually handles everything via email. This is not scalable past 3 sponsors.

**Why a 4-step wizard (not a single form).** Sponsors need to pick a contest before they can see pricing. Assets (logo/video) only make sense after the tier is chosen. Payment comes last, after everything is confirmed. A single-page form overwhelms; a progressive wizard reduces abandonment.

**What already exists.** The 3-panel layout is established. shadcn/ui form primitives (Input, Select, FileUpload) exist. Supabase Storage is live. The `sponsor.*` schema from task 045 holds the data model.

**The build.**

- `/sponsor/apply` page with 4 step components
- `useSponsorsWizard` hook managing step state + draft persistence
- `sponsor-application-create` edge fn accepting draft payloads and upserting rows
- Auto-save on step transitions (debounced 500ms)
- Auth gate: show steps 1–3 unauthenticated, require login before step 4 submit

## Step structure

```
Step 1: Company            Step 2: Package          Step 3: Assets            Step 4: Review + Submit
──────────────────         ─────────────────         ──────────────────         ──────────────────
Brand name (required)      Pick event               Logo upload (SVG/PNG       Confirm all details
Website URL                Pick activation type     ≤ 5MB, required)           Tier + amount
Industry (dropdown)        Pick tier                Video (MP4 ≤ 50MB,         "Submit Application"
Contact full name          (price shown per tier)   optional)                  → calls POST /sponsor-application-create (step=4)
Contact email              Pick add-ons             3-line tagline             → status = 'submitted'
WhatsApp number (e164)     Review total             UTM destination URL        → admin gets notified
                                                    Brand color (hex)

⚠️ FLOW CORRECTION: Payment (Stripe) happens AFTER admin approval, NOT at wizard step 4.
   Step 4 → "Submit" → status='submitted'
   Admin approves → status='approved' → email/notification sent to sponsor
   Sponsor clicks "Complete Payment" link in email → /sponsor/checkout?appId=X → Stripe redirect
   This matches how sponsor-checkout edge fn works (requires status='approved' to create session)
```

## Wiring plan

| Layer | File | Action |
|---|---|---|
| Page | `src/pages/sponsor/Apply.tsx` | Create |
| Step components | `src/components/sponsor/wizard/Step1Company.tsx` | Create |
| | `src/components/sponsor/wizard/Step2Package.tsx` | Create |
| | `src/components/sponsor/wizard/Step3Assets.tsx` | Create |
| | `src/components/sponsor/wizard/Step4Review.tsx` | Create |
| Hook | `src/hooks/sponsor/useSponsorsWizard.ts` | Create |
| Hook | `src/hooks/sponsor/useSponsorEvents.ts` | Create (loads published events for picker) |
| Edge function | `supabase/functions/sponsor-application-create/index.ts` | Create |
| Route | `src/App.tsx` | Add `/sponsor/apply` public route |
| Types | `src/types/sponsor.ts` | Create |

## Edge function contract

```typescript
// POST /functions/v1/sponsor-application-create
// Auth: optional (draft); required (submit)
// Body:
{
  step: 1 | 2 | 3 | 4,
  organization: {
    legal_name: string,
    display_name: string,
    website?: string,
    industry?: string,
    tax_id?: string,        // NIT
    contact_full_name: string,
    contact_email: string,
    contact_whatsapp?: string,
  },
  application: {
    event_id: string,
    activation_type: 'title_naming'|'category_powered_by'|'contestant_sponsor'|'venue_sponsor'|'digital',
    tier: 'bronze'|'silver'|'gold'|'premium',
    pricing_model: 'flat',
    flat_price_cents: number,
    campaign_goals?: Record<string, unknown>,
  },
  draft_application_id?: string,   // if resuming
}
// Response: { success: true, data: { application_id: string, organization_id: string } }
```

## Pricing table (rendered in Step 2)

| Tier | COP Price | Surfaces included |
|---|---|---|
| Bronze | $500,000 | Leaderboard footer + 1 social mention |
| Silver | $2,000,000 | + Category co-branding + 3 social mentions + push notif |
| Gold | $5,000,000 | + Contestant sponsor + 10 mentions + every-broadcast logo |
| Premium | $15,000,000+ | + Title naming rights + email blast + co-branded campaign |

Prices are illustrative defaults. Organizer can override via admin UI (Phase 2).

## Acceptance Criteria

- [ ] All 4 steps render; forward/back navigation works.
- [ ] Step 1 form validates (required fields, email format, e164 phone pattern).
- [ ] Step 2 loads published events from Supabase; tier picker shows COP prices.
- [ ] Step 3 logo upload validates file type (SVG/PNG) and size (≤ 5MB); preview renders.
- [ ] Draft persists to `sponsor.applications status='draft'` after step 2 (unauthenticated → stored in sessionStorage until login).
- [ ] Auth gate on step 4: unauthenticated user sees login modal; after login, wizard resumes at step 4.
- [ ] Step 4 "Submit Application" calls `POST /sponsor-application-create` (step=4); sets status='submitted'; shows success state.
- [ ] ⚠️ Step 4 does NOT call sponsor-checkout — checkout happens after admin approval (see task 048).
- [ ] Post-submit: sponsor sees "Application submitted — you'll receive an email when approved."
- [ ] `sponsor-application-create` edge fn upserts without creating duplicates on re-submit.
- [ ] 4 Vitest unit tests: step 1 required-field validation, step 2 tier selection, step 3 file type rejection, step 4 summary display.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## Real-World Examples

**Scenario 1 — First-time Gold sponsor:** Postobón brand manager opens `/sponsor/apply` on a Tuesday morning. Fills Step 1 (legal name, NIT, contact). Step 2: picks "Reina de Antioquia 2026", selects Gold at $5,000,000 COP. Step 3: uploads SVG logo + 30s MP4 brand video. Step 4: reviews and clicks **"Submit Application"** → status='submitted'. Admin approves in `/admin/sponsorships` within 24h → Postobón receives email with payment link → clicks link → Stripe Checkout → pays → logo goes live.

**Scenario 2 — Draft resume:** Mi Sazón owner starts the wizard (Bronze, $500k COP), reaches step 3, and closes the browser. Reopening `/sponsor/apply` detects the existing draft application ID from `sessionStorage` and pre-fills steps 1–2. They pick up at step 3, upload their logo, and proceed.

**Scenario 3 — File rejection:** A sponsor uploads a JPEG instead of SVG/PNG. Step 3 shows an inline error: "Logo must be SVG or PNG — JPEGs don't scale cleanly on all surfaces." No navigation to step 4 until replaced.

## Outcomes

| Before | After |
|---|---|
| Sponsor interest handled via email | Self-serve wizard; brand applies in < 10 minutes |
| No draft saving | Draft persists across sessions; zero lost applications |
| No pricing visibility | COP prices displayed per tier before commitment |
| Organizer manually creates DB rows | Edge fn creates `sponsor.organizations` + `sponsor.applications` atomically |

## See also

- [`045-sponsor-schema-migration.md`](045-sponsor-schema-migration.md) — schema this writes to
- [`048-sponsor-stripe-checkout.md`](048-sponsor-stripe-checkout.md) — payment step this calls
- [`047-sponsor-admin-queue.md`](047-sponsor-admin-queue.md) — where this application lands for approval
