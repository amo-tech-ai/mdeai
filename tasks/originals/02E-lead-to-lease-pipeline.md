# Epic 2: Lead-to-Lease Pipeline — Task Prompts

> **Diagrams:** MERM-03 (rental pipeline), MERM-05 (intake wizard), MERM-09 (edge functions)
> **Phase:** CORE | **Outcomes:** O1, O2
> **Hypothesis:** A complete lead->showing->application->booking->payment pipeline enables the first real booking.
>
> **Idempotency:** All mutating endpoints (POST) in this epic MUST accept an optional `Idempotency-Key` header. If present, the function checks for a prior result with that key before creating a new record. This prevents double-submissions from network retries, browser re-sends, or webhook replays. Store idempotency keys in the target table's record or a dedicated `idempotency_keys` table with a 24h TTL.
>
> **Gemini integration rules (G1-G5):** Edge functions in this epic that call Gemini must:
> - G1: Use `responseMimeType: "application/json"` + `responseSchema` for structured output
> - G2: Use temperature 1.0 (Gemini default) unless creative output needed
> - G3: Prefer grounding + schema over prompt-only extraction
> - G4: Auth via `x-goog-api-key` header (not Bearer), key from `Deno.env.get("GEMINI_API_KEY")`
> - G5: Persist `groundingChunks` / `citationSources` in ai_runs metadata when grounding is used
>
> **Phasing (web vs WhatsApp), reminders, journey E2E:** **[`02H-e2-pipeline-phasing-web-vs-whatsapp.md`](02H-e2-pipeline-phasing-web-vs-whatsapp.md)** (MVP scope vs MERM-03). **[`02F-e2-showing-reminders-cron.md`](02F-e2-showing-reminders-cron.md)** (E2-010 T-24h/T-1h). **[`02G-e2-merm-journey-e2e-smoke.md`](02G-e2-merm-journey-e2e-smoke.md)** (E2-011). Payments / idempotency hardening: **[`13B-e2-payment-rollback-idempotency.md`](13B-e2-payment-rollback-idempotency.md)**.

---

## E2-001: Implement lead-capture Edge Function

```yaml
---
id: E2-001
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: Implement lead-capture edge function
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

Create the `lead-capture` edge function that receives leads from web intake and WhatsApp, scores them, and stores them in the `leads` table.

**Read first:**
- `tasks/mermaid/03-rental-pipeline.mmd` — pipeline step: Intake -> Lead Capture
- `tasks/mermaid/09-edge-function-map.mmd` — lead-capture I/O spec
- `supabase/functions/rentals/index.ts` — existing rental intake pattern to follow
- `.claude/rules/edge-function-patterns.md` — auth, CORS, Zod, response format

**The build:**
- New edge function at `supabase/functions/lead-capture/index.ts`
- Accept: `{ source: 'web' | 'whatsapp' | 'referral', contact_info: { name, email, phone? }, preferences: { budget_min, budget_max, neighborhoods[], move_in_date, stay_length }, conversation_id? }`
- Score lead quality (0-100) based on completeness of preferences + contact info
- Insert into `leads` table with score, source, status='new'
- Return `{ lead_id, score, next_step }` where next_step suggests showing or more info

**Example:**
Marcus (remote developer from Austin) completes the intake wizard. His preferences — $3M-5M COP, Laureles or El Poblado, 3-month stay, needs fast wifi — are captured. Lead-capture scores him 85/100 (complete profile, realistic budget) and creates a lead record.

### Acceptance Criteria
- [ ] Edge function validates JWT and extracts user_id
- [ ] Zod schema validates all input fields
- [ ] Creates lead record in `leads` table with correct foreign keys
- [ ] Calculates quality score (0-100) based on profile completeness
- [ ] Returns `{ lead_id, score, next_step }`
- [ ] Handles anonymous leads (no JWT) with `source: 'whatsapp'`
- [ ] Idempotent: same contact_info + preferences returns existing lead
- [ ] Accepts optional `Idempotency-Key` header for retry safety
- [ ] Logs to `ai_runs` if AI scoring is involved (with G1-G5 compliance)
- [ ] CORS headers set correctly

---

## E2-002: Implement showing-create Edge Function

```yaml
---
id: E2-002
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: Implement showing-create edge function
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
- [ ] Prevents duplicate showings (same lead + apartment + same day)
- [ ] Accepts optional `Idempotency-Key` header for retry safety
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

Create the `booking-create` edge function that creates bookings from approved applications and initiates Stripe payment.

**Read first:**
- `tasks/mermaid/03-rental-pipeline.mmd` — pipeline step: Application Approved -> Booking
- `tasks/mermaid/09-edge-function-map.mmd` — booking-create I/O spec
- `.claude/skills/mdeai-tasks/references/task-template.md` — full example for this exact task

**The build:**
- New edge function at `supabase/functions/booking-create/index.ts`
- Accept: `{ application_id }`
- Verify application status is 'approved'
- Create booking record in `bookings` table
- Initiate Stripe payment intent for deposit amount
- Return `{ booking_id, confirmation, payment_client_secret }`
- Notify both renter and host

**Example:**
Host Maria approves Marcus's application for apartment #42. Booking-create fires, creates a booking for Mar 15 - Jun 15, initiates a Stripe payment intent for 4M COP deposit. Marcus receives his payment link, Maria gets a booking confirmation.

### Acceptance Criteria
- [ ] Validates JWT and checks user owns the application (or is host approving)
- [ ] Verifies application status is 'approved' (return 400 if not)
- [ ] Creates booking record with correct foreign keys
- [ ] Initiates Stripe payment intent for deposit amount
- [ ] Returns `{ booking_id, confirmation, payment_client_secret }`
- [ ] Sends notification to both renter and host
- [ ] Idempotent: duplicate calls return existing booking (enforce via `Idempotency-Key` header)
- [ ] Handles Stripe API timeout gracefully (503, no partial booking)
- [ ] Uses Stripe's own idempotency key for PaymentIntent creation

---

## E2-005: Implement payment-webhook Edge Function

```yaml
---
id: E2-005
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: Implement payment-webhook edge function for Stripe
skill: edge-function
phase: CORE
priority: P0
status: Open
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

Create the `payment-webhook` edge function that handles Stripe webhook events for payment confirmation.

**Read first:**
- `tasks/mermaid/03-rental-pipeline.mmd` — pipeline step: Payment -> Booking Confirmed
- `tasks/mermaid/09-edge-function-map.mmd` — payment-webhook I/O spec
- `.claude/rules/edge-function-patterns.md` — security patterns

**The build:**
- New edge function at `supabase/functions/payment-webhook/index.ts`
- Verify Stripe webhook signature (CRITICAL — no auth header, use stripe signing secret)
- Handle events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- On success: update `payments` record, update `bookings` status to 'confirmed'
- On failure: update payment status, notify renter
- Return 200 quickly (Stripe retries on timeout)

**Example:**
Marcus completes Stripe checkout for his 4M COP deposit. Stripe fires `payment_intent.succeeded`. The webhook updates the payment record to 'completed', sets booking status to 'confirmed', and sends confirmation notifications to both Marcus and Maria.

### Acceptance Criteria
- [ ] Verifies Stripe webhook signature (NOT JWT — webhook has no auth header)
- [ ] Handles `payment_intent.succeeded` — updates payment + booking status
- [ ] Handles `payment_intent.payment_failed` — updates payment status, notifies renter
- [ ] Handles `charge.refunded` — updates payment status
- [ ] Idempotent: same event ID processed only once (store in payments table)
- [ ] Returns 200 within 5 seconds (Stripe retry timeout)
- [ ] Logs payment events for audit trail
- [ ] No secrets in response body

---

## E2-006: Wire Intake Wizard to Lead Capture

```yaml
---
id: E2-006
diagram_id: MERM-05
prd_section: "3. User Journey Step 1 — Discover"
title: Wire intake wizard to lead-capture edge function and search results
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

## E2-009: Build PaymentButton + BookingConfirmation

```yaml
---
id: E2-009
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Booking & Payment"
title: Build PaymentButton and BookingConfirmation components
skill: frontend
phase: CORE
priority: P0
status: Open
owner: Frontend
dependencies:
  - E2-005
estimated_effort: M
percent_complete: 0
epic: E2
outcome: O1
---
```

### Prompt

Build the PaymentButton (initiates Stripe checkout) and BookingConfirmation (shows booking success) components.

**Read first:**
- `tasks/mermaid/08-frontend-components.mmd` — component hierarchy
- `tasks/mermaid/03-rental-pipeline.mmd` — payment -> confirmed flow

**The build:**
- `src/components/bookings/PaymentButton.tsx` — calls booking-create, then redirects to Stripe
- `src/components/bookings/BookingConfirmation.tsx` — success state after payment
- `src/hooks/useBookings.ts` — extend with createBooking mutation
- PaymentButton: shows deposit amount, calls booking-create, receives payment_client_secret, redirects to Stripe Checkout
- BookingConfirmation: shows booking details, host info, check-in instructions, confetti celebration

### Acceptance Criteria
- [ ] PaymentButton displays deposit amount in COP
- [ ] Calls booking-create edge function on click
- [ ] Redirects to Stripe Checkout with payment_client_secret
- [ ] BookingConfirmation shows after successful payment return
- [ ] Displays booking details: apartment, dates, host, amount
- [ ] Handles payment failure gracefully
- [ ] Both components handle 4 states
- [ ] `npm run build` passes
