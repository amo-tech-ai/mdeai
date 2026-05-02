Here’s the **exact production-ready architecture** for **ILM / mdeai** using **Paperclip + OpenClaw + Lobster**.

## Short summary

Use:

- **Paperclip** as the **control plane / CEO**
    
- **OpenClaw** as the **assistant + channel runtime**
    
- **Lobster** as the **typed workflow engine with approval gates**
    
- **ILM app** as the **customer-facing product**
    
- **Supabase** as the **system of record**
    
- **Claude + Gemini** exactly as your PRD already defines for routing, booking, search, and contract analysis
    

This is the clean split:

**Paperclip decides**  
**OpenClaw interacts**  
**Lobster executes**  
**ILM displays**  
**Supabase stores**

Paperclip is explicitly designed as the control plane for AI companies, with org structure, goals, budgets, heartbeat monitoring, and governance, while adapters connect external runtimes rather than running agents directly. ([Paperclip](https://docs.paperclip.ing/start/what-is-paperclip "What is Paperclip? - Paperclip"))  
OpenClaw is the always-on assistant layer across channels, and Lobster is the typed, local-first workflow shell with approval gates and resumable pipelines. ([GitHub](https://github.com/openclaw/openclaw "GitHub - openclaw/openclaw: Your own personal AI assistant. Any OS. Any Platform. The lobster way.  · GitHub"))

---

# 1. Final architecture

```text
CUSTOMER CHANNELS
  Web App / Chat / WhatsApp / Telegram / Voice
            ↓
        OpenClaw Gateway
            ↓
      Intent + Channel Adapters
            ↓
   ┌───────────────────────────────┐
   │          Lobster              │
   │ typed workflows + approvals   │
   └───────────────────────────────┘
      ↓              ↓            ↓
 Claude tasks     Gemini tasks   System actions
      ↓              ↓            ↓
   Supabase      Search/Maps     Stripe / Calendar / Messaging
      ↓
   ILM Frontend
      ↓
   Paperclip Control Plane
(goals, org chart, budgets, audit, heartbeat, governance)
```

---

# 2. What each layer does

## A. Paperclip = company brain

Use Paperclip for:

- org chart
    
- goals
    
- budgets
    
- cost tracking
    
- heartbeat scheduling
    
- approvals for sensitive operations
    
- audit trail across departments
    

That matches Paperclip’s documented role as the control plane for autonomous AI companies, including agent registry, org chart, budget tracking, goal hierarchy, heartbeat monitoring, and autonomy governance. ([Paperclip](https://docs.paperclip.ing/start/what-is-paperclip "What is Paperclip? - Paperclip"))

### In your stack

Paperclip should **not** handle customer chat directly.  
It should manage the company.

So Paperclip governs:

- Rental Ops department
    
- Concierge department
    
- Growth department
    
- Compliance department
    
- Finance department
    

---

## B. OpenClaw = customer interaction layer

Use OpenClaw for:

- WhatsApp concierge
    
- web chat assistant
    
- voice / messaging channels
    
- customer-facing conversations
    
- agent tool invocation
    

That fits OpenClaw’s role as a personal AI assistant that operates across many channels from a central gateway. ([GitHub](https://github.com/openclaw/openclaw "GitHub - openclaw/openclaw: Your own personal AI assistant. Any OS. Any Platform. The lobster way.  · GitHub"))

### In your stack

OpenClaw handles:

- “Find me a furnished apartment in El Poblado”
    
- “Book me a viewing tomorrow”
    
- “Show my upcoming rentals”
    
- “Explain this lease”
    

---

## C. Lobster = execution layer

Use Lobster for all repeatable business processes:

- lead intake
    
- property match
    
- showing scheduling
    
- contract review
    
- booking confirmation
    
- move-in orchestration
    
- extension / renewal flow
    

Lobster is specifically built for typed JSON-first pipelines, approval gates, native workflow files, and OpenClaw invocation. ([GitHub](https://github.com/openclaw/lobster "GitHub - openclaw/lobster: Lobster is a Openclaw-native workflow shell: a typed, local-first “macro engine” that turns skills/tools into composable pipelines and safe automations—and lets Openclaw call those workflows in one step. · GitHub"))

### In your stack

Every irreversible action goes through Lobster:

- send message
    
- contact host
    
- submit application
    
- create payment link
    
- confirm booking
    

---

## D. ILM app = customer product

Your PRD already defines the right UI model:

- 3-panel system
    
- left = context
    
- main = work
    
- right = intelligence
    
- preview → apply → undo
    
- Claude for booking workflows
    
- Gemini for search, maps, and recommendations
    

### In your stack

The ILM app should be:

- listing browser
    
- booking dashboard
    
- saved places
    
- trip/rental planner
    
- admin console for internal ops review
    

---

# 3. Exact service layout

## Core services

### 1. `ilm-web`

Frontend app

- React / Vite / Tailwind / shadcn
    
- 3-panel dashboard
    
- customer auth
    
- listings, bookings, contracts, saved places
    

### 2. `supabase`

Backend system of record

- profiles
    
- apartments
    
- bookings
    
- saved_places
    
- conversations
    
- messages
    
- ai_runs
    
- audit_logs
    
- vendor records
    
- payout records
    

Your PRD already defines most of these tables and AI tracking structures.

### 3. `openclaw-gateway`

Channel + assistant runtime

- WhatsApp
    
- web assistant
    
- Telegram later
    
- voice later
    

### 4. `lobster-runner`

Workflow execution service

- runs `.lobster` files
    
- approval gate handling
    
- resumable runs
    
- JSON outputs
    
- invokes OpenClaw tools
    

### 5. `paperclip-control`

Control plane

- departments
    
- budgets
    
- heartbeats
    
- cost caps
    
- goal tracking
    
- executive dashboard
    

### 6. `ilm-ai-router`

Thin orchestration service

- route to Claude or Gemini
    
- normalize outputs
    
- attach citations / reasoning
    
- write logs to Supabase
    

### 7. `integrations-service`

External connectors

- Stripe
    
- Google Maps / search
    
- calendar
    
- email / WhatsApp sender
    
- document parser
    
- property feed connectors
    

---

# 4. Exact agent structure

## Paperclip org chart

### CEO

**Paperclip Core**

- overall goals
    
- departmental budgets
    
- approval rules
    
- heartbeat scheduling
    
- KPI tracking
    

### COO

**Rental Operations Director**

- inventory freshness
    
- host response SLA
    
- showing throughput
    
- booking completion
    

### CMO

**Growth Director**

- content automation
    
- neighborhood reports
    
- retargeting campaigns
    
- referral programs
    

### CFO

**Finance & Payout Director**

- payment reconciliation
    
- commissions
    
- refunds
    
- anomaly detection
    

### CLO / Compliance

**Lease & Trust Director**

- lease review policy
    
- fraud checks
    
- KYC completeness
    
- audit readiness
    

### CIO / Memory

**Hermes / Profile Intelligence**

- user preferences
    
- renter memory
    
- saved searches
    
- repeat customer signals
    

---

## OpenClaw customer agents

### Concierge Agent

For general lifestyle + rental chat

### Rental Search Agent

For listing discovery and filtering

### Showing Coordinator Agent

For calendar and host coordination

### Lease Review Agent

For contract explanation

### Booking Agent

For reservation and payment workflow handoff

### Renewal Agent

For extensions, upsells, and repeat stays

---

## Model mapping

Use the same model split your PRD already established:

- **Claude Sonnet** = routing, fast decisions
    
- **Claude Opus** = booking workflows, contracts, complex actions
    
- **Gemini Pro** = search, ranking, maps, location context, recommendations
    
- **Gemini Flash** = quick checks, conflict detection, fast filters
    

---

# 5. Exact workflow architecture

## Workflow 1 — Lead intake

**Trigger:** WhatsApp, form, chat  
**Owner:** OpenClaw → Lobster  
**Stores:** lead profile in Supabase  
**Paperclip oversight:** cost cap + SLA timer

Flow:

1. OpenClaw receives lead
    
2. Lobster parses structured renter requirements
    
3. Supabase stores profile
    
4. Paperclip heartbeat checks stale uncontacted leads
    

---

## Workflow 2 — Property matching

**Trigger:** renter profile ready  
**Owner:** Lobster  
**Models:** Gemini Pro + internal ranking  
**Paperclip oversight:** shortlist response time KPI

Flow:

1. Search internal listings
    
2. Search partner feeds
    
3. Rank by fit
    
4. Draft shortlist
    
5. Approval if outbound communication is required
    
6. Send via OpenClaw
    

---

## Workflow 3 — Showing orchestration

**Trigger:** renter selects favorites  
**Owner:** Lobster + OpenClaw  
**Paperclip oversight:** no-show rate, host response SLA

Flow:

1. Check listing showing availability
    
2. Build route
    
3. Ask approval before contacting hosts
    
4. Confirm visits
    
5. Add reminders
    
6. Store showing status
    

---

## Workflow 4 — Lease review

**Trigger:** renter wants property / contract uploaded  
**Owner:** Claude Opus via Lobster  
**Paperclip oversight:** risk category reporting

Flow:

1. Parse document
    
2. Extract clauses
    
3. Flag deposit / exit / penalties / utilities
    
4. Generate simple summary
    
5. Show in ILM right panel
    
6. Save audit + risk result
    

---

## Workflow 5 — Booking and move-in

**Trigger:** renter approves selected property  
**Owner:** Lobster + Stripe + OpenClaw  
**Paperclip oversight:** payout correctness, refund anomaly detection

Flow:

1. Validate dates and totals
    
2. Approval gate before payment
    
3. Create payment link / charge
    
4. Store booking
    
5. Send move-in pack
    
6. Trigger day-1 and day-3 follow-up
    

---

# 6. How the UI should map to this

Your PRD’s 3-panel layout is exactly right. Keep it.

## Customer side

### Left panel

- Dashboard
    
- Rentals
    
- Saved
    
- Bookings
    
- Chat
    
- Settings
    

### Main panel

- listings
    
- filters
    
- comparisons
    
- booking forms
    
- lease summary view
    
- trip / move-in checklist
    

### Right panel

- AI shortlist reasoning
    
- neighborhood score
    
- value analysis
    
- lease risks
    
- approval cards
    
- booking timeline
    

---

## Internal ops side

Add a separate internal dashboard:

### Left

- Leads
    
- Showings
    
- Leases
    
- Bookings
    
- Vendors
    
- Payouts
    
- Audit
    
- Heartbeats
    

### Main

- operational queue
    
- approval inbox
    
- exception handling
    
- booking recovery
    
- host management
    

### Right

- Paperclip KPIs
    
- burn rate
    
- stuck workflows
    
- high-risk contracts
    
- vendor freshness alerts
    

---

# 7. Database design additions you should add

Your PRD is strong, but for Paperclip + OpenClaw production ops add these tables:

## `workflow_runs`

- id
    
- workflow_name
    
- source_channel
    
- lead_id
    
- booking_id
    
- status
    
- started_at
    
- ended_at
    
- lobster_run_id
    
- paperclip_goal_id
    

## `workflow_steps`

- workflow_run_id
    
- step_id
    
- step_type
    
- status
    
- input_json
    
- output_json
    
- approval_required
    
- approved_by
    
- approved_at
    

## `agent_heartbeats`

- agent_name
    
- department
    
- last_seen_at
    
- state
    
- current_goal
    
- spend_today
    
- tokens_today
    

## `budget_policies`

- department
    
- daily_limit_usd
    
- monthly_limit_usd
    
- hard_stop
    
- escalation_rule
    

## `approval_queue`

- object_type
    
- object_id
    
- reason
    
- proposed_action
    
- risk_level
    
- requested_by_agent
    
- status
    

## `vendor_compliance`

- vendor_id
    
- listing_freshness
    
- contract_status
    
- payout_status
    
- response_sla
    
- risk_score
    

## `audit_events`

- actor_type
    
- actor_name
    
- action
    
- target_type
    
- target_id
    
- before_json
    
- after_json
    
- created_at
    

These make Paperclip governance real instead of theoretical.

---

# 8. Approval policy

This is critical.

## Automatic

No approval needed for:

- parsing user input
    
- ranking listings
    
- checking availability
    
- summarizing contracts
    
- generating internal drafts
    

## Required approval

Must require approval for:

- sending outbound host messages
    
- submitting rental applications
    
- generating payment links
    
- charging cards
    
- marking booking confirmed
    
- canceling bookings
    
- sending legal/compliance notices
    

This matches both your PRD’s “AI can propose, not commit” pattern and Lobster’s approval-gate design.

---

# 9. Paperclip configuration strategy

## Company

**mdeai / ILM Medellín Rentals**

## Primary goals

- increase qualified rental leads
    
- reduce time-to-shortlist
    
- reduce no-shows
    
- improve booking conversion
    
- keep AI spend within budget
    
- maintain trust / contract safety
    

## Departments

- Concierge
    
- Rental Ops
    
- Finance
    
- Compliance
    
- Growth
    
- Memory / CRM
    

## Heartbeats

Recommended:

- Concierge: every 5 min
    
- Lead SLA monitor: every 10 min
    
- Inventory freshness: every 6 hr
    
- Budget monitor: every 15 min
    
- Booking anomaly scan: every 30 min
    
- Compliance scan: daily
    

## Budget controls

- per-agent daily cap
    
- per-department monthly cap
    
- hard-stop for recursive tasks
    
- escalation to approval queue
    

This directly follows Paperclip’s documented control-cost and budget-enforcement model. ([Paperclip](https://docs.paperclip.ing/start/what-is-paperclip "What is Paperclip? - Paperclip"))

---

# 10. Deployment blueprint

## Production environment

### Public

- `app.mdeai.co` → ILM frontend
    
- `api.mdeai.co` → API / orchestration
    
- `chat.mdeai.co` → optional web assistant endpoint
    

### Internal

- `paperclip.internal`
    
- `lobster-runner.internal`
    
- `openclaw.internal`
    
- `supabase`
    
- `worker queues`
    

## Recommended setup

- Frontend on Vercel or similar
    
- Supabase managed backend
    
- Paperclip + OpenClaw + Lobster in Docker containers on a private VM
    
- Redis or queue for async workflow events
    
- object storage for contracts and listing media
    
- monitoring with logs + alerts
    

---

# 11. Real example: one renter journey

User message:

> “Need a 2-month furnished apartment in Laureles with strong Wi-Fi.”

Flow:

1. OpenClaw receives the request
    
2. Lobster lead-intake workflow extracts renter profile
    
3. Supabase stores lead
    
4. Gemini ranks best apartments
    
5. ILM main panel shows 5 matches
    
6. Right panel explains why each fit
    
7. User picks 2 for showing
    
8. Lobster schedules visits with approval
    
9. Host confirms
    
10. User chooses one
    
11. Claude reviews lease
    
12. Approval gate before payment
    
13. Booking created
    
14. OpenClaw sends move-in pack
    
15. Paperclip tracks KPI, spend, SLA, and audit trail
    

---

# 12. Best implementation order

## Phase 1

- ILM frontend
    
- Supabase core schema
    
- OpenClaw web + WhatsApp
    
- Lobster lead intake
    
- shortlist workflow
    

## Phase 2

- showing workflow
    
- lease review
    
- approval queue
    
- booking workflow
    

## Phase 3

- Paperclip org chart
    
- budgets
    
- heartbeat monitors
    
- KPI dashboards
    

## Phase 4

- renewals
    
- investor mode
    
- vendor scoring
    
- automated market reports
    

---

# Final recommendation

Your best production design is:

- **Paperclip on top** for company governance
    
- **OpenClaw in front** for customer interaction
    
- **Lobster in the middle** for safe workflow execution
    
- **ILM app + Supabase underneath** for product and data
    
- **Claude + Gemini split exactly as already defined in your PRD**
    

The key rule:

**Paperclip should manage the business.  
OpenClaw should talk to the customer.  
Lobster should run the process.**

I can turn this into a **full production folder structure with service names, database schema additions, and example Paperclip org YAML + Lobster workflow files**.