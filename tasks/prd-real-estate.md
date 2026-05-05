# PRD: Medellín Real Estate Vertical (mdeai)

| Field | Value |
|-------|--------|
| **Status** | Draft v2 — expanded with journeys, automations, agent workflows, real-world examples |
| **Product** | mdeai.co — AI-assisted furnished rentals (core); buy/sell and concierge adjacent |
| **Primary market** | Medellín — renters, landlords, property managers; WhatsApp-first region |
| **Date** | April 5, 2026 |
| **Source docs** | `docs/1-trio-real-estate-plan.md`, `docs/2-supabase-strategy.md`, `docs/10-real-estate-tasks.md`, `docs/06-real-estate.md`, `wireframes/*.md` |
| **Agents installed** | Paperclip (`tasks/paperclip/`), Hermes (`tasks/hermes/`) |

---

## 1. Executive summary

### Problem statement

Qualified renters and landlords in Medellín coordinate through fragmented channels — Airbnb (expensive, 15%+ fees), FincaRaiz (Spanish-only, no AI, manual process), WhatsApp groups (unstructured, leads lost), and Facebook groups (no verification, scam risk). No platform combines **AI-powered discovery**, **WhatsApp-native communication**, **bilingual lease transparency**, and **verified listings** at a fair commission.

mdeai must turn **intent into booked, paid stays** without losing leads — while proving that AI-assisted search, trust features, and automated ops justify a 12% service fee vs Airbnb's 15%+ or the 0% (but 100% manual) WhatsApp alternative.

**Current state:** The app has strong schema (28 tables, RLS, pgvector, PostGIS), 6 AI edge functions, and a working rental intake wizard — but **0 listings in production**, **no payment loop**, and **no CRM**. Both Paperclip and Hermes are installed locally.

### Proposed solution

Ship a **rentals-first vertical** in 4 phases:

1. **P1 (MVP):** Seed 20-30 listings, lead capture, showings, booking + payment, basic admin moderation
2. **P2 (Intelligence):** Hermes-backed composite ranking, taste profiles, lease analysis, market snapshots
3. **P3 (Automation):** Paperclip governance, OpenClaw WhatsApp channel, automated workflows
4. **P4 (Expansion):** Buy/sell, investor tools, multi-city

### Success criteria (measurable)

| # | Metric | Target | Phase |
|---|--------|--------|-------|
| 1 | Verified listings live | ≥ 20-30 with real media + pricing | P1 |
| 2 | Lead capture rate | ≥ 80% of rental-intent sessions produce structured lead row | P1 |
| 3 | Lead → showing conversion | ≥ 15% of qualified leads reach showing/application within 14 days | P1 |
| 4 | First booking with payment | At least 1 end-to-end with reconciled commission | P1 |
| 5 | Search performance | p95 < 3s request-to-render | P1 |
| 6 | AI success rate | ≥ 95% of AI calls succeed (excl. user cancel) in `ai_runs` | P1 |
| 7 | Ranking quality | top-1 NDCG on labeled pairs | P2 |
| 8 | Lease review accuracy | ≥ 90% correct extraction on fixture set (bilingual) | P2 |
| 9 | WhatsApp response time | < 5s first AI response via OpenClaw | P3 |
| 10 | Agent budget compliance | 0 overruns with Paperclip enforcement | P3 |

---

## 2. Competitive context

### Medellín rental landscape

| Platform | Strengths | Weaknesses | mdeai advantage |
|----------|-----------|------------|-----------------|
| **Airbnb** | Trust, payments, global reach | 15%+ fees, short-stay bias, no local context | Lower fee (12%), AI concierge, lease clarity, medium-term focus |
| **FincaRaiz** | Largest Colombia inventory | Spanish-only, no AI, manual contact, dated UX | Bilingual AI, instant response, verified listings |
| **Properati** | Clean UX, some AI features | No booking/payment, just lead gen | End-to-end: search → book → pay → move-in |
| **WhatsApp groups** | Free, fast, local trust | Unstructured, no verification, leads lost | Structured search with WhatsApp as channel (via OpenClaw) |
| **Facebook groups** | Large reach, visual | Scam risk, no CRM, no payments | Verification, AI matching, professional process |
| **Local agencies** | Human expertise, relationships | 1-month commission, slow, opaque | AI-augmented speed at lower cost, transparent pricing |

### Differentiation thesis

> "WhatsApp ease + AI intelligence + lease transparency at Airbnb trust levels, for medium-term furnished stays in Medellín, at 12% vs 15%."

---

## 3. User personas and journeys

### Personas

| Persona | Example | Goal | Channel preference | Constraints |
|---------|---------|------|-------------------|-------------|
| **Digital nomad** | Sarah, 32, UX designer from Austin. Moving to Medellín for 3 months. | Find furnished 1BR in Laureles with strong Wi-Fi near coworking, $800-1200/mo | Web + WhatsApp | English primary; needs Wi-Fi > 50Mbps; doesn't know neighborhoods |
| **Expat couple** | Marco & Ana, 40s, from São Paulo. Relocating for work. 6-12 months. | Find 2BR in El Poblado or Envigado, pet-friendly, near international school, $1500-2500/mo | WhatsApp first | Bilingual; need pet policy; care about safety score |
| **Landlord** | Carlos, 55, owns 3 furnished apartments in El Poblado | Fill vacancies, screen tenants, receive timely payouts | WhatsApp + simple dashboard | Low tech tolerance; values clear process over features |
| **Property manager** | Valentina, 35, manages 12 units across Laureles + Envigado | Bulk listing management, unified bookings, payout tracking | Desktop dashboard + WhatsApp alerts | Currently uses Excel + WhatsApp; needs export to accountant |
| **Internal ops** | The mdeai team | Moderate listings, verify identities, handle escalations, track metrics | Admin dashboard | Speed and auditability matter most |

### Journey 1: Digital nomad renter (Sarah)

**Real-world scenario:** Sarah heard about Medellín from a podcast. She searches "furnished apartment Medellín digital nomad" and finds mdeai.co.

```
Step 1: DISCOVER
├── Sarah lands on mdeai.co/rentals
├── Sees the intake wizard: "Tell us what you're looking for"
├── Types: "I need a furnished 1BR in a safe neighborhood with fast WiFi
│   for 3 months starting May 1. Budget around $1000/month"
├── [Existing: RentalsIntakeWizard.tsx parses via Gemini → FilterJson]
└── System creates `lead` row with structured_profile JSONB

Step 2: SEARCH & COMPARE
├── Wizard returns ranked results with explanations:
│   "Ranked #1 because: WiFi 120Mbps ✓, Laureles walkability 0.85, $950/mo under budget"
├── Sarah clicks between results; right panel shows detail + map
├── [Existing: RentalsSearchResults.tsx + ThreePanelLayout]
├── [New: Map with PostGIS price pins, score breakdown component]
└── She saves 3 favorites to compare

Step 3: DEEP DIVE
├── Sarah opens listing detail for "Studio Laureles - Primer Parque"
├── Sees: gallery, amenities grid, neighborhood scores, host info
├── [Wireframe: wireframes/03-listing-detail-desktop.md]
├── AI sidebar shows: "This is 8% below Laureles average. Host has 4.8★ rating."
└── "Schedule Showing" and "Apply Now" CTAs prominent

Step 4: SCHEDULE SHOWING
├── Clicks "Schedule Showing" → showing scheduler opens
├── Selects available slot: Thursday 2pm
├── [New: ShowingScheduler.tsx per wireframes/05-showing-scheduler.md]
├── Host Carlos gets WhatsApp notification via OpenClaw
├── `showings` row created with status='proposed'
└── Both parties get confirmation + calendar link

Step 5: VISIT & DECIDE
├── After showing, Sarah rates it in-app: ⭐⭐⭐⭐ "Loved the terrace, WiFi was fast"
├── `showings.renter_feedback` updated
├── AI suggests: "Based on your rating, you might also like these 2 similar units"
└── Sarah decides to apply for this apartment

Step 6: APPLY
├── Multi-step application: Personal info → Documents → References → Review
├── [Wireframe: wireframes/06-application-flow.md]
├── AI generates applicant summary for landlord
├── Carlos gets notification with summary + documents
├── `rental_applications` row with status='submitted'
└── [Paperclip approval gate: human review before forwarding to landlord]

Step 7: LEASE REVIEW
├── Carlos sends lease PDF through the platform
├── Hermes extracts terms: rent $950, deposit $1900, 3-month min, 30-day notice
├── Bilingual summary generated (EN/ES) with risk flags
├── "⚠ Cleaning penalty clause is above market standard — consider negotiating"
├── `lease_reviews` row with risk_score='low', flagged_risks JSONB
└── Sarah reviews, accepts terms

Step 8: PAY & BOOK
├── Sarah pays first month + deposit via Stripe ($2,850 total)
├── Idempotent webhook → `payments` row → `bookings` status update
├── Carlos gets payout notification (88% = $2,508 after 12% commission)
├── Both receive booking confirmation with move-in details
└── WhatsApp reminder 2 days before move-in via OpenClaw

Step 9: MOVE IN & SUPPORT
├── Move-in checklist shared via chat
├── AI concierge available: "Where's the nearest grocery store?"
├── Maintenance requests through chat → routed to landlord
└── 30 days before lease end: renewal prompt or new search suggestion
```

### Journey 2: Landlord onboarding (Carlos)

**Real-world scenario:** Carlos owns 3 furnished apartments in El Poblado. He's tired of Airbnb's fees and dealing with flaky short-term guests. He wants 3-6 month tenants.

```
Step 1: SIGN UP
├── Carlos visits mdeai.co/landlord (or gets invited link)
├── Creates account → fills landlord profile
├── Identity verification: cédula upload + selfie match
├── [New: LandlordOnboarding.tsx, landlord_profiles table]
└── Admin verification queue → approved within 24h

Step 2: LIST PROPERTY
├── Guided listing wizard: address → photos → amenities → pricing → availability
├── AI assists: "Based on El Poblado averages, we suggest $1,200-1,400/mo for this unit"
├── [Hermes: price suggestion based on market_snapshots + neighborhood data]
├── Photos uploaded to Supabase Storage (public bucket)
├── Listing enters moderation queue → admin reviews → approved
└── [Wireframe: wireframes/04-landlord-dashboard.md]

Step 3: RECEIVE INQUIRIES
├── Dashboard shows new leads with quality scores
├── WhatsApp notifications for high-quality leads (score > 0.7)
├── Can respond to inquiries directly or let AI handle first response
└── [OpenClaw: routes inquiry to landlord via preferred channel]

Step 4: MANAGE SHOWINGS
├── Calendar view of scheduled showings
├── Accept/decline/reschedule from dashboard or WhatsApp
├── Post-showing: see renter feedback
└── [Wireframe: wireframes/05-showing-scheduler.md]

Step 5: REVIEW APPLICATIONS
├── Receive AI-summarized applicant profiles
├── See: employment, references, stay duration, budget match
├── Accept/reject with optional message
├── [Paperclip approval gate: high-value bookings flagged for review]
└── Accepted → lease generation triggered

Step 6: RECEIVE PAYOUTS
├── After booking confirmed + payment received
├── 88% payout scheduled (Friday 8 AM weekly cycle)
├── Dashboard shows: pending, scheduled, paid amounts
├── Monthly earnings report with commission breakdown
└── [payments.host_payout_status lifecycle]
```

### Journey 3: WhatsApp-first expat (Marco & Ana)

**Real-world scenario:** Marco finds mdeai's WhatsApp number in an expat Facebook group. He messages in Portuguese (which the AI handles).

```
Marco: "Oi, estamos procurando um apartamento em Medellín para 6 meses.
        2 quartos, que aceite cachorro, perto de escola internacional.
        Orçamento até $2000/mês"

OpenClaw (via Infobip/WhatsApp):
├── Intent: RENTAL_SEARCH (ai-router, Gemini Lite)
├── Language detected: Portuguese → responds in Portuguese + Spanish
├── Extracts: {bedrooms: 2, pet_friendly: true, budget_max: 2000,
│              duration_months: 6, near: "international school"}
├── Creates `lead` row with channel='whatsapp', phone_number=+55...
├── Searches apartments table with PostGIS proximity to schools
└── Returns 3 inline property cards with images

Marco: "O segundo parece bom. Posso visitar quinta?"

OpenClaw:
├── Identifies listing #2, checks host availability
├── Proposes: "Thursday 10am or 3pm available"
├── Marco selects 3pm
├── Creates `showings` row
├── Notifies landlord via WhatsApp
└── Sends calendar invite to both

[Full conversation in wireframes/08-whatsapp-conversation.md]
```

### Journey 4: Sun AI internal ops (automated pipeline)

**Real-world scenario:** The Sun AI team uses Paperclip to orchestrate daily operations without manual intervention.

```
DAILY HEARTBEAT (Paperclip CEO, 15-min cycle):
├── Check: Any leads > 24h without contact? → escalate alert
├── Check: Any showings today? → send reminder via OpenClaw
├── Check: Any payments pending > 48h? → flag for review
├── Check: AI budget consumption → enforce daily caps
│   (OpenClaw: 50K tokens/day, Hermes: 30K, Paperclip: 10K)
└── Log all checks to agent_audit_log

WEEKLY TASKS (Paperclip):
├── Monday: Generate lead pipeline report
├── Wednesday: Trigger listing freshness verification cycle
├── Friday 8AM: Execute host payouts for completed bookings
└── Sunday: Generate market snapshot (Hermes analysis)

AUTOMATED WORKFLOWS:
├── Lead intake → qualification → assignment → follow-up chain
├── Listing submission → AI quality check → moderation queue → publish
├── Booking confirmation → payment capture → receipt → move-in prep
└── Lease expiry -30d → renewal offer → new search if declined
```

---

## 4. Feature inventory

### Existing (working today)

| Feature | Component/File | Status |
|---------|---------------|--------|
| Rental intake wizard | `src/components/rentals/RentalsIntakeWizard.tsx` | ✅ Working |
| Rental search results | `src/components/rentals/RentalsSearchResults.tsx` | ✅ Working |
| Rental listing detail | `src/components/rentals/RentalsListingDetail.tsx` | ✅ Working |
| Three-panel layout | `src/components/explore/ThreePanelLayout.tsx` | ✅ Working |
| AI chat (4 tabs) | `supabase/functions/ai-chat/index.ts` | ✅ Working |
| Intent router | `supabase/functions/ai-router/index.ts` | ✅ Working |
| Semantic search | `supabase/functions/ai-search/index.ts` | ✅ Deployed, untested |
| Rentals edge function | `supabase/functions/rentals/index.ts` | ✅ Working (708 lines) |
| Auth + RLS | 28 tables, all RLS enabled | ✅ Working |
| Admin CRUD | `src/components/admin/` (14 files) | ✅ Working |
| Apartments schema | 55 fields inc. PostGIS, amenities[], freshness | ✅ Complete |
| Bookings schema | Unified across types | ✅ Complete |
| Paperclip | `tasks/paperclip/` — governance, tasks, budgets, heartbeats | ✅ Installed |
| Hermes | `tasks/hermes/` — reasoning, skills, memory, providers | ✅ Installed |

### New features needed

#### P0 — Must have for first booking

| Feature | Type | Wireframe | New components | New tables/functions |
|---------|------|-----------|---------------|---------------------|
| **Seed listing data** | Data | — | — | 20-30 rows in `apartments` with real photos |
| **Lead capture** | Backend | — | — | `leads` table + `lead-capture` edge function |
| **Showing scheduler** | Full-stack | `wireframes/05` | ShowingScheduler, ShowingCard, AvailabilityGrid | `showings` table |
| **Rental application flow** | Full-stack | `wireframes/06` | ApplicationWizard (4 steps) | `rental_applications` table |
| **Payment integration** | Backend | — | PaymentButton, ReceiptView | `payments` table + `payment-webhook` edge function |
| **Booking creation** | Backend | — | BookingConfirmation | `booking-create` edge function |
| **Map view with pins** | Frontend | `wireframes/01` | MapView, PricePin | — (PostGIS queries exist) |
| **Admin listing moderation** | Full-stack | `wireframes/09` | ModerationQueue, VerificationBadge | `property_verifications` table |
| **Neighborhoods reference** | Data | — | NeighborhoodCard, NeighborhoodScores | `neighborhoods` table + seed data |
| **Admin auth fix** | Security | — | — | Fix useAdminAuth guards on all /admin/* routes |

#### P1 — Intelligence and supply-side

| Feature | Type | Wireframe | Agent |
|---------|------|-----------|-------|
| **Landlord dashboard** | Full-stack | `wireframes/04` | — |
| **Landlord onboarding** | Full-stack | — | — |
| **Hermes composite ranking** | AI | — | Hermes |
| **Lease review (bilingual)** | AI | — | Hermes |
| **Taste profiles** | AI | — | Hermes |
| **Notification system** | Full-stack | — | OpenClaw |
| **Property comparison** | Frontend | — | — |
| **Mobile search** | Frontend | `wireframes/07` | — |

#### P2 — Automation and channels

| Feature | Type | Wireframe | Agent |
|---------|------|-----------|-------|
| **WhatsApp channel** | Integration | `wireframes/08` | OpenClaw |
| **Paperclip governance** | Backend | `wireframes/10` | Paperclip |
| **Market intelligence** | AI | — | Hermes |
| **Automated lead follow-up** | Workflow | — | Paperclip + OpenClaw |
| **Property manager bulk ops** | Full-stack | — | — |
| **Investor tools** | Full-stack | — | Hermes |

---

## 5. AI agent architecture

### Agent roles (trio mapping)

```
                    CUSTOMER CHANNELS
┌─────────────────────────────────────────────────────┐
│  mdeai.co (Web)  │  WhatsApp (Infobip)  │  Voice   │
└────────┬─────────┴──────────┬───────────┴────┬─────┘
         │                    │                │
         ▼                    ▼                ▼
┌─────────────────────────────────────────────────────┐
│              OPENCLAW — The Mouth                    │
│                                                      │
│  • Intent routing (Gemini Lite → ai-router)         │
│  • Conversation state machine                        │
│  • Channel adapters (web SSE, WhatsApp, Telegram)   │
│  • Human handover (confidence < 0.3)                │
│  • Property card rendering per channel              │
│  Installed: tasks/paperclip/ (openclaw_gateway      │
│             adapter confirmed)                       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│               HERMES — The Brain                     │
│                                                      │
│  • Composite ranking (formula below)                │
│  • Listing embeddings (pgvector 1536-dim)           │
│  • Customer taste profiles                           │
│  • Market snapshots & price intelligence            │
│  • Lease analysis (bilingual extraction + risk)     │
│  • Skill registry (637 skills available)            │
│  Installed: tasks/hermes/ (hermes_local adapter)    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│             PAPERCLIP — The CEO                      │
│                                                      │
│  • Task orchestration (issue lifecycle)             │
│  • Budget enforcement (per-agent daily caps)        │
│  • Approval gates (payments, outbound messages)     │
│  • Heartbeat monitoring (15-min cycle)              │
│  • Audit trail (every agent action logged)          │
│  • Payout scheduling (weekly Friday 8 AM)           │
│  Installed: tasks/paperclip/ (pnpm dev → :3102)    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                  SUPABASE — The Ground               │
│                                                      │
│  28 existing + 6 P1 + 6 P2 + 8 P3 tables           │
│  Edge Functions (9 existing + 7 new)                │
│  pgvector + PostGIS + RLS + Realtime                │
│  Auth + Storage (public images, private contracts)  │
└─────────────────────────────────────────────────────┘
```

### Hermes ranking formula

Applied when a renter searches — produces a 0-1 composite score with plain-language explanation:

```
score = (budget_fit      × 0.25)   // How well price matches budget
      + (neighborhood_fit × 0.20)   // Safety, walkability, nomad score
      + (wifi_quality     × 0.15)   // Critical for digital nomads (Mbps threshold)
      + (stay_length_fit  × 0.15)   // Min-stay alignment
      + (amenity_match    × 0.10)   // Pet-friendly, parking, gym, etc.
      + (host_quality     × 0.10)   // Rating, response time, verification status
      + (freshness        × 0.05)   // Penalize stale/unverified listings
```

**Real-world example:**
> Sarah searches: "$1000/mo, Laureles, 3 months, WiFi, furnished"
>
> Listing "Studio Laureles - Primer Parque" ($950/mo):
> - budget_fit: 0.95 (5% under budget)
> - neighborhood_fit: 0.88 (Laureles walkability 0.85, safety 0.82)
> - wifi_quality: 0.92 (120 Mbps fiber)
> - stay_length_fit: 1.0 (min stay 1 month, max 12)
> - amenity_match: 0.80 (furnished ✓, no gym)
> - host_quality: 0.85 (4.8★, verified, < 2h response)
> - freshness: 0.90 (verified 5 days ago)
>
> **Total: 0.89** — "Ranked #1: Strong WiFi (120Mbps), walkable Laureles location, 5% under your budget"

### Paperclip governance rules

| Gate | Trigger | Action | Phase |
|------|---------|--------|-------|
| **Payment approval** | amount > $500 or first booking with host | Require human review before processing | P1 |
| **Outbound host message** | AI-generated message to landlord | Queue for review if confidence < 0.7 | P2 |
| **Listing publication** | New listing submitted | Moderation queue → admin approval | P1 |
| **Application forwarding** | Renter submits application | AI summary + human spot-check | P1 |
| **Budget enforcement** | Token usage approaches daily cap | Soft warn at 80%, hard stop at 100% | P3 |
| **Escalation** | Lead untouched > 24h | Alert ops team | P1 |
| **Payout execution** | Weekly payout cycle | Paperclip reviews amounts, triggers Stripe | P2 |

### OpenClaw conversation flows

**Rental search (WhatsApp):**
```
State: GREETING → CRITERIA_COLLECTION → SEARCH → RESULTS → DETAIL → SHOWING → APPLICATION
                                                                              ↓
                                                                        HUMAN_HANDOVER
                                                                    (if confidence < 0.3)
```

**Tool dispatch:**
| Intent (from ai-router) | Tool | Edge function |
|--------------------------|------|---------------|
| `RENTAL_SEARCH` | `search_apartments` | `rentals` (action: search) |
| `SHOW_LISTING` | `get_listing_detail` | `rentals` (action: listing) |
| `SCHEDULE_SHOWING` | `create_showing` | NEW: `showing-create` |
| `SUBMIT_APPLICATION` | `create_application` | NEW: `application-create` |
| `CHECK_AVAILABILITY` | `check_dates` | `rentals` (action: search with dates) |
| `GET_DIRECTIONS` | `get_directions` | `google-directions` (existing) |
| `GENERAL` | `chat_response` | `ai-chat` (existing) |

---

## 6. Automations and workflows

### Automated pipelines (Paperclip-orchestrated)

#### 1. Lead intake pipeline

```
TRIGGER: New inquiry (web chat, WhatsApp, form)
  │
  ├─ STEP 1: Extract structured profile (Gemini Flash)
  │   Input: raw_message → Output: {budget, dates, neighborhoods, bedrooms, amenities}
  │
  ├─ STEP 2: Create/update lead row
  │   INSERT INTO leads (channel, raw_message, structured_profile, status='new')
  │
  ├─ STEP 3: Quality scoring (Hermes, P2)
  │   score = completeness × intent_strength × budget_realism
  │   P1 fallback: score = NULL (manual qualification)
  │
  ├─ STEP 4: Auto-assign
  │   score > 0.7 → fast-track (auto-search + results)
  │   score 0.4-0.7 → standard queue
  │   score < 0.4 → clarification request via OpenClaw
  │
  └─ STEP 5: First response
      High-quality: instant search results with top 3 matches
      Standard: "Thanks! A few clarifying questions..."
      Low: "Can you tell us more about what you're looking for?"
```

**Real-world example:**
> WhatsApp message: "need apartment Poblado 2 months"
> → Gemini extracts: {neighborhood: "El Poblado", duration: 2, bedrooms: null, budget: null}
> → Score: 0.5 (missing budget + bedrooms)
> → OpenClaw responds: "Great choice! El Poblado is popular. To find the best match: What's your monthly budget? And how many bedrooms do you need?"

#### 2. Showing coordination pipeline

```
TRIGGER: Renter requests showing
  │
  ├─ STEP 1: Check host availability (calendar or manual slots)
  │
  ├─ STEP 2: Propose time slots to renter (max 3 options)
  │
  ├─ STEP 3: Renter selects → create showings row (status='proposed')
  │
  ├─ STEP 4: Notify host (WhatsApp or email via OpenClaw)
  │   ⚠ APPROVAL GATE: Paperclip queues if AI confidence < 0.7
  │
  ├─ STEP 5: Host confirms → status='confirmed'
  │
  ├─ STEP 6: Reminders
  │   T-24h: Both parties get reminder
  │   T-1h: "Your showing is in 1 hour at [address]" + Google Maps link
  │
  ├─ STEP 7: Post-showing feedback (renter rates 1-5, notes)
  │
  └─ STEP 8: AI follow-up
      Rating ≥ 4: "Would you like to apply for this apartment?"
      Rating 2-3: "Here are 2 similar listings you might prefer"
      Rating 1: "Sorry about that. Let's refine your search."
```

#### 3. Booking + payment pipeline

```
TRIGGER: Application accepted by landlord
  │
  ├─ STEP 1: Generate lease summary (Hermes)
  │   PDF → extracted_terms JSON → risk_score → bilingual summary
  │   ⚠ Disclaimer: "This is an AI summary, not legal advice"
  │
  ├─ STEP 2: Renter reviews terms + accepts
  │
  ├─ STEP 3: Payment intent created (Stripe)
  │   amount = first_month + deposit
  │   ⚠ APPROVAL GATE: Paperclip reviews if amount > $500 or new host
  │
  ├─ STEP 4: Renter pays → webhook → payment row → booking status='confirmed'
  │   Idempotency: stripe_payment_intent_id UNIQUE constraint
  │
  ├─ STEP 5: Commission split
  │   12% mdeai ($342 on $2,850)
  │   88% host ($2,508)
  │   host_payout_status = 'pending'
  │
  ├─ STEP 6: Confirmation to both parties (email + WhatsApp)
  │   Renter: Booking confirmation + move-in checklist
  │   Host: Booking details + payout schedule
  │
  └─ STEP 7: Move-in prep (T-2 days)
      Key exchange instructions, emergency contacts, WiFi info
```

#### 4. Listing freshness verification (automated)

```
TRIGGER: Paperclip weekly heartbeat (Wednesday)
  │
  ├─ STEP 1: Query all listings where last_verified > 30 days ago
  │
  ├─ STEP 2: For each listing:
  │   ├─ HTTP check on source_url (existing rental_freshness_log)
  │   ├─ Compare price to neighborhood average (Hermes)
  │   └─ Flag if: 404, price change > 20%, photos appear reused
  │
  ├─ STEP 3: Update property_verifications table
  │   status = 'verified' | 'needs_update' | 'rejected'
  │
  └─ STEP 4: Notify affected landlords if action needed
      "Your listing for [address] needs updated photos — it hasn't been
       verified in 45 days. Update now to stay visible in search."
```

#### 5. Market intelligence snapshot (P2)

```
TRIGGER: Paperclip Sunday heartbeat
  │
  ├─ STEP 1: Aggregate current listing data by neighborhood
  │   avg_price, median_price, count, vacancy_rate
  │
  ├─ STEP 2: Compare to previous snapshot (week-over-week)
  │
  ├─ STEP 3: Hermes generates insights
  │   "Laureles: +3% avg price, 12 new listings, high demand for 2BR"
  │   "El Poblado: -2% avg price, 5 delisted, oversupply in studios"
  │
  ├─ STEP 4: Store in market_snapshots table
  │
  └─ STEP 5: Use in:
      - Landlord pricing suggestions ("Your price is 15% above area average")
      - Renter search explanations ("Good deal: 8% below El Poblado average")
      - Internal ops dashboard metrics
```

---

## 7. Technical specifications

### Architecture overview

**Frontend:** Vite 5 + React 18 + TypeScript + shadcn/ui + Tailwind. Three-panel layout for all rental pages. Routes per task plan.

**Backend:** Supabase Postgres + Edge Functions. Existing 9 functions extended + 7 new functions.

**Agents:** Paperclip (governance, `tasks/paperclip/`), Hermes (reasoning, `tasks/hermes/`), OpenClaw (channels, via Paperclip's `openclaw_gateway` adapter).

**Deploy:** Vercel (frontend), Supabase (backend + edge functions), Docker/VPS (agents).

### New edge functions

| Function | Method | Auth | Purpose | Phase |
|----------|--------|------|---------|-------|
| `lead-capture` | POST | Optional (anon WhatsApp allowed) | Create/update lead from any channel | P1 |
| `booking-create` | POST | Required | Create booking from accepted application | P1 |
| `payment-webhook` | POST | Stripe signature verify | Handle Stripe payment events | P1 |
| `showing-create` | POST | Required | Schedule showing + notify host | P1 |
| `application-create` | POST | Required | Submit rental application + AI summary | P1 |
| `hermes-ranking` | POST | Required | Composite score + explanation for results | P2 |
| `contract-analysis` | POST | Required | PDF upload → terms extraction → risk tier | P2 |

### New database tables (Phase 1)

Per `docs/2-supabase-strategy.md` — exact DDL there. Summary:

| Table | Purpose | Key columns | RLS |
|-------|---------|-------------|-----|
| `leads` | CRM foundation — every inquiry | channel, structured_profile (JSONB), quality_score, status | User sees own; admins see all |
| `showings` | Property viewing coordination | lead_id, apartment_id, scheduled_at, status, renter_feedback (JSONB) | Renter sees own; admins see all |
| `payments` | Financial transactions | stripe_payment_intent_id (UNIQUE), amount_cents, commission, host_payout_status | User sees own; service role for webhooks |
| `lease_reviews` | AI-analyzed contracts | extracted_terms (JSONB), flagged_risks (JSONB), risk_score, summary_en/es | User sees own; service role for AI writes |
| `property_verifications` | Listing verification status | verification_type, status, expires_at | Admins only |
| `neighborhoods` | Reference data with PostGIS | boundary (Polygon), scores (walkability, safety, nomad), avg_price | Public read |

### Storage buckets

| Bucket | Access | Content | Max size |
|--------|--------|---------|----------|
| `property-images` | Public | Listing photos, neighborhood images | 10MB/file |
| `contracts` | Private (RLS) | Lease PDFs, ID documents | 25MB/file |
| `applications` | Private (RLS) | Application documents, references | 10MB/file |

### Integration points

| System | Use | Auth | Phase |
|--------|-----|------|-------|
| Supabase Auth | Renters + landlords + admins | JWT | P1 |
| Stripe | Payments + commission splits | API key + webhook signing | P1 |
| Google Maps | Map UI + directions | VITE_GOOGLE_MAPS_API_KEY | P1 |
| Infobip | WhatsApp via OpenClaw | API key + webhook | P2 |
| Paperclip API | Task orchestration + budgets | Bearer JWT | P2 |
| Hermes CLI | Reasoning + skills | hermes_local adapter via Paperclip | P2 |

### Security and privacy

- **RLS on all new tables** — no exceptions. Service role only in edge functions.
- **PII and documents:** Private buckets with signed URLs. 90-day retention for ID uploads.
- **Admin routes:** Fix `useAdminAuth` guards on all `/admin/*` routes (known gap — P0).
- **Payment data:** Never store full card numbers. Stripe handles PCI compliance.
- **Lease AI disclaimer:** Always marked as "AI assistant summary, not legal advice."
- **Colombian compliance:** Partner legal review for lease templates, marketing claims, data processing (Ley 1581 de 2012).

---

## 8. Notification strategy

| Event | Renter channel | Landlord channel | Internal channel |
|-------|---------------|-----------------|-----------------|
| New lead from search | — | — | Admin dashboard + Slack |
| Showing proposed | Email + push | WhatsApp (OpenClaw) | — |
| Showing confirmed | Email + push + calendar | WhatsApp + calendar | — |
| Showing reminder (T-24h, T-1h) | Push + WhatsApp | WhatsApp | — |
| Application submitted | Email confirmation | WhatsApp + dashboard | — |
| Application approved/rejected | Email + push | — | — |
| Payment received | Email receipt | WhatsApp + dashboard | — |
| Payout scheduled | — | Email + dashboard | — |
| Move-in reminder (T-2d) | Email + WhatsApp | WhatsApp | — |
| Listing needs update | — | WhatsApp + email | Admin dashboard |
| Lead stale > 24h | — | — | Paperclip escalation alert |

---

## 9. Risks and mitigations

### Technical risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Empty DB blocks all learning | Critical | Seed 20-30 listings before any marketing. Block "launch" without listings. |
| WhatsApp/PSP complexity | High | Start with ONE channel proven (web); feature-flag WhatsApp. |
| AI cost overrun | High | Rate limits (10 AI/min/user). Paperclip daily budgets in P3. Router confidence fast-path. |
| Paperclip deadlock bug (#2516) | High | Monitor with heartbeat timeout. Implement manual override. |
| Hermes CLI-only (no HTTP API) | Medium | Use hermes-paperclip-adapter to spawn `hermes chat -q` per heartbeat. |
| Scraping legal exposure | Medium | Legal review first. Prefer partnerships over scraping. |
| Stripe COP limitations | Medium | Evaluate Wompi as backup PSP for Colombian pesos. |

### Business risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Competes with Airbnb/portals | High | Position on: fair price + lease clarity + WhatsApp + medium-term focus |
| Landlord acquisition | High | Personal outreach in El Poblado/Laureles. Free first 3 months. |
| Ops overload before automation | Medium | Approval queues + phased automation. Don't automate what isn't manual-proven. |
| Over-engineering before revenue | Medium | "Build business first" — trio agents enabled only after manual process works. |

---

## 10. Phased roadmap

### Phase 1 — MVP Revenue Path (Weeks 1-6)

| Week | Focus | Deliverables |
|------|-------|-------------|
| 1-2 | **Data + infrastructure** | Seed 20-30 listings; `neighborhoods` table + seed; fix admin auth; `leads` + `showings` + `payments` tables with RLS |
| 3-4 | **Core flows** | Lead capture edge function; showing scheduler UI; application flow; map view with price pins |
| 5-6 | **Payment + booking** | Stripe integration; `payment-webhook` + `booking-create` edge functions; booking confirmation flow; admin moderation queue |

**Exit criteria:** One end-to-end booking with payment, recorded in DB with commission line item.

### Phase 2 — Intelligence (Weeks 7-14)

| Week | Focus | Deliverables |
|------|-------|-------------|
| 7-8 | **Hermes integration** | Composite ranking edge function; listing embeddings; taste profiles from search history |
| 9-10 | **Trust features** | Lease review (PDF → bilingual summary + risk); property verification workflow; neighborhood guides |
| 11-12 | **Supply side** | Landlord dashboard; landlord onboarding; pricing suggestions from market data |
| 13-14 | **CRM + follow-up** | Lead quality scoring; automated follow-up sequences; conversion analytics |

**Exit criteria:** Hermes ranking demonstrably improves top-1 accuracy on labeled test set. Lease review passes 90% fixture set.

### Phase 3 — Automation (Weeks 15-22)

| Week | Focus | Deliverables |
|------|-------|-------------|
| 15-16 | **OpenClaw WhatsApp** | Infobip integration; WhatsApp conversation flows; inline property cards |
| 17-18 | **Paperclip governance** | Budget enforcement; approval gates; heartbeat monitoring; agent audit dashboard |
| 19-20 | **Automated workflows** | Lead pipeline automation; showing reminders; payout scheduling; freshness verification |
| 21-22 | **Scale prep** | Property manager bulk ops; multi-property dashboard; reporting exports |

**Exit criteria:** WhatsApp leads convert at ≥ 10%. Paperclip handles ≥ 80% of routine ops tasks without manual intervention.

### Phase 4 — Expansion (Weeks 23+)

- Buy/sell vertical
- Investor tools and portfolio analysis
- Multi-city (Bogotá, Cartagena)
- Mercur vendor marketplace engine

---

## 11. Wireframes and diagrams

### Wireframes (`wireframes/`)

| File | View | Key elements |
|------|------|-------------|
| `01-rental-search-desktop.md` | Three-panel search | Filters (left), result cards with scores (main), map + detail (right) |
| `02-intake-wizard-desktop.md` | Conversational wizard | Chat-like AI intake, collected criteria badges, neighborhood map |
| `03-listing-detail-desktop.md` | Property detail | Gallery, amenities, scores, host info, "Schedule Showing" CTA |
| `04-landlord-dashboard.md` | Landlord portal | KPI cards, listings table, booking requests, AI pricing |
| `05-showing-scheduler.md` | Showing calendar | Weekly calendar, time slots, property detail, booking form |
| `06-application-flow.md` | Multi-step application | 4 steps: personal → documents → references → review |
| `07-mobile-rental-search.md` | Mobile search | Bottom nav, card list, filter chips, map toggle FAB |
| `08-whatsapp-conversation.md` | WhatsApp chat | Message bubbles, property cards, quick replies, state machine |
| `09-admin-listings.md` | Admin moderation | Data table, bulk actions, status badges, edit dialog |
| `10-ai-strategy-dashboard.md` | Agent monitoring | Agent status, task Kanban, budget bars, activity feed |

### Mermaid diagrams (in `plan/mermaid/`)

| File | Type | Content |
|------|------|---------|
| `01-user-journeys.mmd` | journey | Renter satisfaction scores per step |
| `02-system-architecture.mmd` | C4Container | Full system: frontend → backend → agents → data |
| `03-rental-pipeline.mmd` | flowchart | Lead-to-lease pipeline, color-coded by system |
| `04-chat-flow.mmd` | sequence | Message lifecycle: user → router → chat → Gemini → SSE |
| `05-intake-wizard-flow.mmd` | flowchart | Wizard steps with Gemini parsing |
| `06-data-model.mmd` | erDiagram | All tables + new Phase 1-3 tables |
| `07-agent-architecture.mmd` | flowchart | Paperclip org chart + adapters + task lifecycle |
| `08-frontend-components.mmd` | classDiagram | Component hierarchy with props/methods |
| `09-edge-function-map.mmd` | flowchart | All edge functions with I/O specs |
| `10-deployment-architecture.mmd` | flowchart | Production topology: Vercel + Supabase + agents |

---

## 12. Open decisions (TBD)

Record owner + date when resolved.

| # | Decision | Options | Impact | Owner |
|---|----------|---------|--------|-------|
| 1 | **Primary PSP for COP** | Stripe-only vs Wompi/local | Checkout UX, webhook implementation, COP handling | Finance |
| 2 | **E-signature** | Click-to-sign MVP vs DocuSign integration | Legal threshold for lease binding | Legal |
| 3 | **Showing availability** | Landlord calendar integration vs manual slots | UX complexity, host adoption friction | Product |
| 4 | **Service fee %** | 12% vs tiered (10% for long stays) | Revenue, competitive positioning | Finance |
| 5 | **Host payout schedule** | Weekly (Friday) vs biweekly vs on-demand | Cash flow for hosts, operational overhead | Finance |
| 6 | **OpenClaw self-hosted vs SaaS** | Self-host on VPS vs managed OpenClaw cloud | Cost, maintenance, uptime guarantees | Engineering |
| 7 | **Hermes model provider** | Anthropic direct vs OpenRouter vs Gemini | Cost, quality, latency tradeoffs | Engineering |
| 8 | **Multi-language support** | EN/ES/PT vs EN/ES only in P1 | Brazilian expat market (significant in Medellín) | Product |

---

## 13. Traceability

| This PRD section | Detailed breakdown |
|------------------|-------------------|
| Trio behavior, roles, interaction model | `docs/1-trio-real-estate-plan.md` |
| Tables, RLS, edge function DDL | `docs/2-supabase-strategy.md` |
| Task IDs, sprints, file tree, priority matrix | `docs/10-real-estate-tasks.md` |
| External repo patterns and architecture | `docs/06-real-estate.md`, `docs/04-architecture map.md` |
| GitHub repo rankings for real estate AI | `docs/07-Top 10 AI Real Estate Repositories.md` |
| OpenClaw gateway architecture | `docs/01-open-claw.md`, `docs/02-openclaw.md` |
| Lobster workflow patterns | `docs/03-lobster.md` |
| UI wireframes (10 views) | `tasks/wireframes/*.md` |
| Mermaid architecture diagrams (10) | `tasks/mermaid/*.mmd` (indexed in `tasks/mermaid/INDEX.md`) |
| Paperclip setup, errors, CLI | `tasks/paperclip/REFERENCE.md`, `tasks/paperclip/01-errors.md` |
| Hermes setup, models, adapter | `tasks/hermes/REFERENCE.md`, `tasks/hermes/setup.md` |

---

*End of PRD v2.*
