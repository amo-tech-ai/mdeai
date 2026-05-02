# Epic 2: Lead-to-Lease Pipeline — Task Prompts

### Real world — purpose & outcomes

**In one sentence:** A traveler can go from “I’m interested” to a scheduled tour, application, and **confirmed booking**—with every step visible to ops—like a small property manager would run on WhatsApp and the web.

- **Who it’s for:** Renters booking furnished stays; hosts/ops tracking pipeline stages. **Rent and deposits are not collected in-app:** the **landlord or owner** arranges payment (cash, transfer, their own link, etc.) outside mdeai.
- **Purpose:** One coherent lead-to-lease path so nobody loses a lead or double-books on retry.
- **Goals:** Idempotent creates; notifications at key transitions; deduped showings/applications; clear **off-platform payment handoff** copy (no marketplace checkout for rent).
- **Features / deliverables:** Edge + DB behavior for each stage, `notifications` (or equivalent), idempotency keys on mutating creates, ties to CRM UI (10B). **No Stripe PaymentIntent / rental checkout in this epic** — see **E2-005** deferred note.

> **Diagrams:** MERM-03 (rental pipeline), MERM-05 (intake wizard), MERM-09 (edge functions)
> **Phase:** CORE | **Outcomes:** O1, O2, O7, O12, O13
> **Hypothesis:** A complete lead→showing→application→**approval**→**booking confirmation** pipeline enables the first real rental handoff; **money stays between renter and landlord**, not through mdeai checkout.
>
> **Idempotency:** All mutating endpoints (POST) in this epic MUST accept an optional `Idempotency-Key` header. Store keys in a dedicated `idempotency_keys` table: `CREATE TABLE idempotency_keys (key TEXT PRIMARY KEY, response JSONB, created_at TIMESTAMPTZ DEFAULT now())`. Check before insert; return cached response if key exists. TTL: 24h (clean up via cron or pg_cron). Create this table in a migration before implementing E2 edge functions.
>
> **Prerequisite migration (create before any E2 task):**
> ```sql
> -- idempotency_keys table
> CREATE TABLE IF NOT EXISTS idempotency_keys (
>   key TEXT PRIMARY KEY,
>   response JSONB NOT NULL,
>   created_at TIMESTAMPTZ DEFAULT now()
> );
> CREATE INDEX idx_idempotency_keys_created ON idempotency_keys(created_at);
>
> -- notifications table (used by E2-002, E2-003, E2-004)
> CREATE TABLE IF NOT EXISTS notifications (
>   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
>   type TEXT NOT NULL, -- 'showing_request', 'application_received', 'booking_confirmed', etc.
>   title TEXT NOT NULL,
>   body TEXT,
>   metadata JSONB DEFAULT '{}',
>   read BOOLEAN DEFAULT false,
>   created_at TIMESTAMPTZ DEFAULT now()
> );
> ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
> CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
>
> -- Unique constraint for showing dedup
> CREATE UNIQUE INDEX idx_showings_lead_apt_day ON showings(lead_id, apartment_id, (scheduled_at::date));
>
> -- Unique constraint for application dedup
> CREATE UNIQUE INDEX idx_applications_lead_apt ON rental_applications(lead_id, apartment_id) WHERE status != 'withdrawn';
>
> -- Optional: `payments` / Stripe only if you later add **non-rental** platform holds or a different product surface — **not required for rental marketplace handoff** (landlord collects rent off-platform).
> ```
>
> **Gemini integration rules (G1-G5):** Edge functions in this epic that call Gemini must:
> - G1: Use `responseMimeType: "application/json"` + `responseSchema` for structured output
> - G2: Use temperature 1.0 (Gemini default) unless creative output needed
> - G3: Prefer grounding + schema over prompt-only extraction
> - G4: Auth via `x-goog-api-key` header (not Bearer), key from `Deno.env.get("GEMINI_API_KEY")`
> - G5: Persist `groundingChunks` / `citationSources` in ai_runs metadata when grounding is used
>
> **Phasing (web vs WhatsApp):** **Phase 1 = web-only.** WhatsApp lead capture (08C) uses service-role edge-to-edge calls and does NOT require JWT from the WhatsApp user. Web lead capture (E2-001) requires JWT. Both write to the same `leads` table but with different `source` values (`web` vs `whatsapp`). The `source` field must be added to the `leads` table schema if not present. See [`02H-e2-pipeline-phasing-web-vs-whatsapp.md`](02H-e2-pipeline-phasing-web-vs-whatsapp.md) for full discussion — **02H content is merged here; 02H can be archived.**
>
> **Reminders, journey E2E:** **[`02F-e2-showing-reminders-cron.md`](02F-e2-showing-reminders-cron.md)** (E2-010 T-24h/T-1h). **[`02G-e2-merm-journey-e2e-smoke.md`](02G-e2-merm-journey-e2e-smoke.md)** (E2-011). If the product **later** adds platform-held money, use **[`13B-e2-payment-rollback-idempotency.md`](13B-e2-payment-rollback-idempotency.md)** — **not** part of default rental flow.
>
> **Pipeline status (verified 2026-04-05):**
> | Step | DB layer | Edge function | UI component | Status |
> |------|----------|---------------|--------------|--------|
> | Lead creation | `leads` table + `p1_schedule_tour_atomic()` | `p1-crm` (`create_lead`) | `ApartmentRentActions` CTA | **WORKS** |
> | Showing schedule | `showings` table + dedup index | `p1-crm` (`schedule_tour_atomic`) | `ApartmentRentActions` CTA | **WORKS** |
> | Show reminders | `notifications` table exists | No cron function | No notification UI | **NOT BUILT** |
> | Application | `rental_applications` table + atomic fn | `p1-crm` (`start_rental_application_atomic`) | `ApartmentRentActions` CTA | **WORKS** |
> | Booking | `bookings` table exists | **E2-004 NOT BUILT** | No booking UI | **NOT BUILT** |
> | Rent / deposit | **Off-platform** (landlord/owner) | — | Handoff copy / host contact (E2-009) | **NOT BUILT** — **by design: mdeai does not collect rental payments** |
> | Confirmation | — | — | Booking confirmation UI (E2-009) | **NOT BUILT** |

---

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, idempotency, or **off-platform payment messaging**, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | A renter can move from lead → showing → application → booking with traceable rows and messaging hooks; **payment terms are between renter and landlord** (outside mdeai). |
| **Workflow** | Implement stage transitions in order; idempotency keys on mutating creates; verify notifications table; booking confirms intent without processing rent in-app. |
| **Proof** | Each stage has a test row; duplicate submit does not duplicate leads or bookings. |
| **Gates** | 03E for any new edge; **no in-app rental collection** unless ADR explicitly adds it; optional 13B only if platform money paths are introduced later. |
| **Rollout** | Feature-flag new pipeline UI until E2E smoke on staging. |

---

## E2-001: Implement lead-capture Edge Function

```yaml
---
id: E2-001
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: Implement lead-capture edge function
description: "Ships «Implement lead-capture edge function» for this epic—full scope in § Prompt below."
skill: edge-function
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies:
  - E1-002
estimated_effort: M
percent_complete: 0
epic: E2
outcome: O2
---
```

### Prompt

Add `create_lead` action to the **existing** `p1-crm` edge function (not a new function). The `p1-crm` function already handles CRM operations — extend it rather than creating a parallel function.

**Read first:**
- `supabase/functions/p1-crm/index.ts` — **existing** CRM function to extend (already has `create_lead` action)
- `tasks/mermaid/03-rental-pipeline.mmd` — pipeline step: Intake -> Lead Capture
- `.claude/rules/edge-function-patterns.md` — auth, CORS, Zod, response format

**Existing state:** `p1-crm` already has a `create_lead` action with schema: `{ email, phone?, notes?, neighborhood_id? }`. This task extends it with scoring and richer input.

**The build:**
- Extend `p1-crm` `create_lead` action to accept additional fields: `{ email, phone?, name?, budget_min?, budget_max?, neighborhoods?: string[], move_in_date?, stay_length?, source?: 'web' | 'referral', notes? }`
- Add lead quality scoring (0-100) based on profile completeness
- Return `{ lead_id, score, next_step }` where next_step suggests showing or more info
- **MVP is web-only** — WhatsApp source support is Phase 2 (see 02H). Do NOT add anonymous/no-JWT path in this task.

**Example:**
Marcus (remote developer from Austin) completes the intake wizard. His preferences — $3M-5M COP, Laureles or El Poblado, 3-month stay, needs fast wifi — are captured. Lead-capture scores him 85/100 (complete profile, realistic budget) and creates a lead record.

### Acceptance Criteria
- [ ] Extends existing `p1-crm` edge function (do NOT create a new `lead-capture` function)
- [ ] JWT required — extracts user_id (no anonymous access in MVP; WhatsApp is Phase 2)
- [ ] Zod schema validates all input fields (extend existing schema)
- [ ] Creates lead record in `leads` table with correct foreign keys
- [ ] Calculates quality score (0-100) based on profile completeness
- [ ] Returns `{ lead_id, score, next_step }`
- [ ] Checks `idempotency_keys` table before insert (return cached response if key exists)
- [ ] CORS headers set correctly (use shared `_shared/http.ts` — NOT wildcard `*`)

---

## E2-002: Implement showing-create Edge Function

```yaml
---
id: E2-002
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: Implement showing-create edge function
description: "Ships «Implement showing-create edge function» for this epic—full scope in § Prompt below."
skill: edge-function
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies:
  - E2-001
estimated_effort: M
percent_complete: 0
epic: E2
outcome: O2
---
```

### Prompt

Create the `showing-create` edge function that schedules property showings and notifies hosts.

**Read first:**
- `tasks/mermaid/03-rental-pipeline.mmd` — pipeline step: Lead -> Showing
- `tasks/mermaid/09-edge-function-map.mmd` — showing-create I/O spec
- `tasks/wireframes/05-showing-scheduler.md` — UI wireframe for showing scheduling

**The build:**
- New edge function at `supabase/functions/showing-create/index.ts`
- Accept: `{ lead_id, apartment_id, preferred_times: datetime[], message?: string }`
- Verify lead exists and apartment is available
- Create `showings` record with status='requested'
- Insert notification for host in `notifications` table
- Return `{ showing_id, status, confirmed_time? }`

**Example:**
After Marcus is scored as a quality lead, he selects apartment #42 in Laureles and picks 3 available time slots. Showing-create creates the showing request and notifies the host Maria. Maria confirms Tuesday 2PM, and the showing status updates to 'confirmed'.

### Acceptance Criteria
- [ ] Validates JWT — user must own the lead or be the lead's contact
- [ ] Validates apartment exists and is active
- [ ] Creates showing record with lead_id, apartment_id, preferred_times
- [ ] Sends notification to apartment host via `notifications` table
- [ ] Returns showing_id and status
- [ ] Prevents duplicate showings via `idx_showings_lead_apt_day` unique index (see prerequisite migration above)
- [ ] Checks `idempotency_keys` table before insert
- [ ] Zod validates all inputs
- [ ] Handles host availability conflicts (return 409)

---

## E2-003: Implement application-create Edge Function

```yaml
---
id: E2-003
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: Implement application-create edge function
description: "Ships «Implement application-create edge function» for this epic—full scope in § Prompt below."
skill: edge-function
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies:
  - E2-001
estimated_effort: M
percent_complete: 0
epic: E2
outcome: O2
---
```

### Prompt

Create the `application-create` edge function that submits rental applications with optional AI summary.

**Read first:**
- `tasks/mermaid/03-rental-pipeline.mmd` — pipeline step: Showing -> Application
- `tasks/mermaid/09-edge-function-map.mmd` — application-create I/O spec
- `tasks/wireframes/06-application-flow.md` — application wizard wireframe

**The build:**
- New edge function at `supabase/functions/application-create/index.ts`
- Accept: `{ lead_id, apartment_id, showing_id?, applicant_info: { employment, monthly_income, references?, move_in_date, stay_length }, documents?: string[] }`
- Optionally call Gemini to generate AI summary of applicant profile
- Insert into `rental_applications` table with status='pending'
- Notify host of new application
- Return `{ application_id, status, ai_summary? }`

**Example:**
Marcus visited apartment #42 and loved it. He fills the application: remote developer, $8k USD/month income, references from previous Medellin landlord. Gemini summarizes: "Strong applicant — stable remote income, prior Medellin rental history, 3-month stay aligns with listing minimum." Host Maria receives the application with the AI summary.

### Acceptance Criteria
- [ ] Validates JWT — user must be the applicant
- [ ] Creates rental_applications record with all fields
- [ ] Optionally generates AI summary via Gemini (log to ai_runs)
- [ ] Notifies host via notifications table
- [ ] Returns application_id and status
- [ ] Prevents duplicate applications (same lead + apartment)
- [ ] Accepts optional `Idempotency-Key` header for retry safety
- [ ] AI summary uses G1 (structured JSON schema) and G5 (persist citations if grounding used)
- [ ] Zod validates all input fields
- [ ] Handles 4 states in any consuming component

---

## E2-004: Implement booking-create Edge Function

```yaml
---
id: E2-004
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: Implement booking-create edge function
description: "Ships «Implement booking-create edge function» for this epic—full scope in § Prompt below."
skill: edge-function
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies:
  - E2-003
estimated_effort: M
percent_complete: 0
epic: E2
outcome: O1
---
```

### Prompt

Create the `booking-create` edge function that creates a **booking record** from approved applications. **Do not** initiate in-app payments—**deposit and rent are arranged between renter and landlord** outside mdeai.

**Read first:**
- `tasks/mermaid/03-rental-pipeline.mmd` — pipeline step: Application Approved -> Booking
- `tasks/mermaid/09-edge-function-map.mmd` — booking-create I/O spec
- `.claude/skills/mdeai-tasks/references/task-template.md` — full example for this exact task

**The build:**
- New edge function at `supabase/functions/booking-create/index.ts`
- Accept: `{ application_id }`
- Verify application status is 'approved'
- Create booking record in `bookings` table (dates, `resource_id` / apartment mapping per schema truth in `01E`)
- Set booking status to something explicit (e.g. `pending_landlord_payment` or `agreed`) — **not** “paid via mdeai”
- Return `{ booking_id, confirmation, next_steps }` where `next_steps` includes **copy** that payment is with the host/owner (and optional host contact fields already on listing/profile — no payment processor)
- Notify both renter and host

**Example:**
Host Maria approves Marcus's application for apartment #42. Booking-create fires, creates a booking for Mar 15 - Jun 15. Marcus and Maria both get confirmation that the **stay is agreed**; they arrange deposit/rent **directly** (Nequi, cash, bank transfer, etc.)—not through a Stripe button in mdeai.

### Acceptance Criteria
- [ ] Validates JWT and checks user owns the application (or is host approving)
- [ ] Verifies application status is 'approved' (return 400 if not)
- [ ] Creates booking record with correct foreign keys
- [ ] **Does not** call Stripe or return `payment_client_secret` for rental deposits
- [ ] Returns `{ booking_id, confirmation, next_steps }` with clear off-platform payment messaging
- [ ] Sends notification to both renter and host
- [ ] Idempotent: duplicate calls return existing booking (enforce via `Idempotency-Key` header)
- [ ] No partial booking on downstream failures (transaction or compensating pattern as appropriate)

---

## E2-005: Payment webhook (Stripe) — **deferred / not in scope for rentals**

```yaml
---
id: E2-005
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: "(Deferred) Stripe payment-webhook — only if product adds platform-held money"
description: "Not part of default rental flow — landlords/owners collect rent off-platform. Revive only with ADR + 13B if mdeai ever holds deposits."
skill: edge-function
phase: CORE
priority: P3
status: Deferred
owner: Backend
dependencies:
  - E2-004
estimated_effort: L
percent_complete: 0
epic: E2
outcome: O1
---
```

### Prompt

**Product rule:** mdeai **does not** collect rental payments; the **landlord or owner** handles deposit and rent outside the app.

**Do not implement** a Stripe `payment-webhook` for the rental pipeline unless an explicit **ADR** adds platform-held deposits (then pair with **[`13B-e2-payment-rollback-idempotency.md`](13B-e2-payment-rollback-idempotency.md)** and separate tasks).

**If revived later,** a webhook would verify Stripe signatures, dedupe events, and update optional `payments` rows — still **not** the default Medellín rental journey documented here.

### Acceptance Criteria
- [ ] N/A for current rental marketplace scope — task remains **Deferred** until product requests in-app collection

---

## E2-006: Wire Intake Wizard to Lead Capture

```yaml
---
id: E2-006
diagram_id: MERM-05
prd_section: "3. User Journey Step 1 — Discover"
title: Wire intake wizard to lead-capture edge function and search results
description: "Ships «Wire intake wizard to lead-capture edge function and search results» for this epic—full scope in § Prompt below."
skill: full-stack
phase: CORE
priority: P0
status: Open
owner: Full-Stack
dependencies:
  - E2-001
estimated_effort: M
percent_complete: 0
epic: E2
outcome: O2
---
```

### Prompt

Connect the existing intake wizard UI to the new lead-capture edge function so completed wizard submissions create leads and trigger search.

**Read first:**
- `tasks/mermaid/05-intake-wizard-flow.mmd` — wizard flow: NL input -> parse -> badges -> search
- `supabase/functions/rentals/index.ts` — existing rental intake conversation
- `src/components/rentals/` — existing rental components
- `src/hooks/useChat.ts` — existing chat integration

**The build:**
- Modify the intake wizard completion handler to call `lead-capture` edge function
- Pass wizard responses (budget, neighborhoods, dates, requirements) as lead preferences
- On lead creation success, trigger apartment search with extracted criteria
- Show search results with the lead_id attached for pipeline tracking
- Create `src/hooks/useLeadCapture.ts` hook for the API call

### Acceptance Criteria
- [ ] Wizard completion calls lead-capture edge function
- [ ] Lead preferences extracted from wizard answers
- [ ] Search results displayed after lead creation
- [ ] lead_id flows through to showing/application steps
- [ ] Error state shown if lead-capture fails
- [ ] Loading state during API call
- [ ] `npm run build` passes

---

## E2-007: Build ShowingScheduler Component

```yaml
---
id: E2-007
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Showing Scheduler"
title: Build ShowingScheduler component
description: "Ships «Build ShowingScheduler component» for this epic—full scope in § Prompt below."
skill: frontend
phase: CORE
priority: P0
status: Open
owner: Frontend
dependencies:
  - E2-002
estimated_effort: M
percent_complete: 0
epic: E2
outcome: O2
---
```

### Prompt

Build the ShowingScheduler component that lets renters pick time slots and request property showings.

**Read first:**
- `tasks/wireframes/05-showing-scheduler.md` — full wireframe
- `tasks/mermaid/08-frontend-components.mmd` — component hierarchy
- `src/components/apartments/` — existing apartment components for patterns
- `.claude/rules/style-guide.md` — component patterns

**The build:**
- `src/components/showings/ShowingScheduler.tsx` — main component
- `src/hooks/useShowings.ts` — hook calling showing-create edge function
- Calendar date picker (use shadcn/ui DatePicker or similar)
- Time slot selector (morning, afternoon, evening)
- Optional message field
- Confirmation dialog before submitting

**Design:**
- Follow 3-panel layout (scheduler in main panel)
- DM Sans body, Playfair Display headings
- Emerald primary for selected dates/times
- 4 states: loading skeleton, error with retry, empty (no slots), success (confirmation)

### Acceptance Criteria
- [ ] ShowingScheduler renders with date picker and time slots
- [ ] Calls showing-create edge function on submit
- [ ] Shows confirmation dialog before submitting
- [ ] Handles all 4 states (loading/error/empty/success)
- [ ] Uses react-hook-form + Zod for validation
- [ ] Uses shadcn/ui primitives (no custom form elements)
- [ ] Responsive: works in both desktop and mobile layouts
- [ ] `npm run build` passes

---

## E2-008: Build ApplicationWizard Component

```yaml
---
id: E2-008
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Application Flow"
title: Build ApplicationWizard component
description: "Ships «Build ApplicationWizard component» for this epic—full scope in § Prompt below."
skill: frontend
phase: CORE
priority: P0
status: Open
owner: Frontend
dependencies:
  - E2-003
estimated_effort: M
percent_complete: 0
epic: E2
outcome: O2
---
```

### Prompt

Build the ApplicationWizard component — a multi-step form for submitting rental applications.

**Read first:**
- `tasks/wireframes/06-application-flow.md` — full wireframe
- `tasks/mermaid/08-frontend-components.mmd` — component hierarchy
- `src/components/rentals/RentalIntakeWizard.tsx` — existing wizard pattern to follow

**The build:**
- `src/components/applications/ApplicationWizard.tsx` — multi-step form
- `src/hooks/useApplications.ts` — hook calling application-create edge function
- Steps: 1) Personal info, 2) Employment/income, 3) References, 4) Move-in details, 5) Review & submit
- Each step has Zod validation before proceeding
- Review step shows AI summary preview (propose-only pattern)
- Submit calls application-create edge function

### Acceptance Criteria
- [ ] Multi-step wizard with progress indicator
- [ ] Each step validates with Zod before allowing next
- [ ] Review step displays all entered data for confirmation
- [ ] AI summary shown as proposal (user can edit or dismiss)
- [ ] Calls application-create on final submit
- [ ] Handles 4 states (loading/error/empty/success)
- [ ] Uses react-hook-form + Zod
- [ ] Uses shadcn/ui components
- [ ] `npm run build` passes

---

## E2-009: Build BookingConfirmation + landlord payment handoff

```yaml
---
id: E2-009
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Booking & confirmation"
title: BookingConfirmation and off-platform payment handoff (no in-app rent collection)
description: "Ships «Booking confirmation UI» — rent/deposit arranged with landlord/owner outside mdeai; no Stripe checkout for rentals."
skill: frontend
phase: CORE
priority: P0
status: Open
owner: Frontend
dependencies:
  - E2-004
estimated_effort: M
percent_complete: 0
epic: E2
outcome: O1
---
```

### Prompt

Build **BookingConfirmation** (and any thin **booking-create** trigger) so renters see a **confirmed booking** and clear copy that **payment is between them and the host**—**no** in-app Stripe checkout for rent.

**Read first:**
- `tasks/mermaid/08-frontend-components.mmd` — component hierarchy
- `tasks/mermaid/03-rental-pipeline.mmd` — approval -> booking -> handoff

**The build:**
- Flow that calls `booking-create` after approval (or navigates from CRM) **without** payment processor redirects
- `src/components/bookings/BookingConfirmation.tsx` — success state: booking details, dates, apartment, **host name / contact** (from existing listing or profile), **short legal-style disclaimer** that mdeai does not process rent
- Optional: prominent **“Contact host about deposit”** (WhatsApp deep link, copy phone, etc.) — whatever the product already exposes
- `src/hooks/useBookings.ts` — extend with createBooking mutation as needed
- **Do not** add `PaymentButton.tsx` that sends users to Stripe for rental deposits unless ADR overrides this epic

### Acceptance Criteria
- [ ] After booking-create succeeds, user sees confirmation with dates + listing + host context
- [ ] **Explicit UX copy** that deposit/rent is agreed **with the landlord/owner**, not charged by mdeai
- [ ] No redirect to Stripe Checkout for rental flow
- [ ] Optional host contact / WhatsApp handoff works when data exists
- [ ] Handles errors from booking-create (4 states)
- [ ] `npm run build` passes
