Below is a **step-by-step Lobster workflow set** for **Medellín rentals** using:

- **OpenClaw** = agent execution
    
- **Lobster** = workflow shell with approvals
    
- **ILM / mdeai** = your marketplace UI + database
    

Lobster is designed as an OpenClaw-native workflow shell for composable pipelines and safe automations, and its tool mode plus approval/resume flow are part of the intended usage. ([GitHub](https://github.com/openclaw/lobster "GitHub - openclaw/lobster: Lobster is a Openclaw-native workflow shell: a typed, local-first “macro engine” that turns skills/tools into composable pipelines and safe automations—and lets Openclaw call those workflows in one step. · GitHub"))

## Short summary

Build the rental flow as **5 linked workflows**:

1. **Lead intake**
    
2. **Property matching**
    
3. **Showing scheduling**
    
4. **Application + contract review**
    
5. **Booking / move-in orchestration**
    

Best practice: keep each workflow small, return structured JSON, and require approval before anything irreversible like sending messages, booking, charging, or signing. Lobster explicitly treats approval as a hard stop and supports resumable workflows. ([GitHub](https://github.com/openclaw/lobster/blob/main/AGENTS.md "lobster/AGENTS.md at main · openclaw/lobster · GitHub"))

---

# 1. The full rental lifecycle

## Workflow A — Lead Intake

**Goal:** turn a WhatsApp or website inquiry into a clean renter profile.

### Inputs

- User message
    
- Contact info
    
- Desired dates
    
- Budget
    
- Neighborhood preference
    
- Stay length
    
- Furnished/unfurnished
    
- Must-haves
    

### Steps

1. **Capture inquiry**
    
    - Source: WhatsApp, form, chat
        
    - Store raw lead
        
2. **Normalize the request**
    
    - Extract:
        
        - budget
            
        - check-in date
            
        - duration
            
        - neighborhoods
            
        - bedrooms
            
        - amenities
            
        - pet policy
            
        - Wi-Fi need
            
3. **Lead quality score**
    
    - Seriousness
        
    - Budget realism
        
    - Completeness
        
    - Urgency
        
4. **Ask only missing essentials**
    
    - Example:
        
        - “What is your monthly budget?”
            
        - “Do you need furnished?”
            
        - “How many months?”
            
5. **Create renter profile JSON**
    
    - This becomes reusable for the rest of the pipeline
        

### Real-world Medellín example

A nomad says:

> “Need 1BR in Poblado or Laureles, 2 months, strong Wi-Fi, under $1,500.”

The workflow turns that into a structured profile, ready for search and ranking.

---

## Workflow B — Property Matching

**Goal:** find and rank the best rental options.

### Steps

1. **Load renter profile**
    
2. **Search listings**
    
    - Internal inventory first
        
    - Then partner feeds / scraped sources
        
3. **Filter hard constraints**
    
    - budget ceiling
        
    - dates
        
    - furnished
        
    - minimum stay
        
4. **Score each listing**
    
    - neighborhood fit
        
    - Wi-Fi fit
        
    - price/value
        
    - walkability
        
    - safety fit
        
    - host quality
        
5. **Generate top 3–7 shortlist**
    
6. **Explain why each was selected**
    
7. **Approval gate before outbound message**
    
    - Human approves before AI sends shortlist
        

### Real-world Medellín example

For a remote worker:

- Listing A wins because it is near coworking, has verified fast Wi-Fi, and monthly pricing fits.
    
- Listing B loses because minimum stay is 6 months.
    

This matches your ILM concept where AI proposes ranked housing results and explains the reasons.

---

## Workflow C — Showing Scheduling

**Goal:** convert shortlisted listings into confirmed viewings.

### Steps

1. **Take shortlisted property IDs**
    
2. **Check availability for showing**
    
3. **Match renter schedule**
    
4. **Draft showing plan**
    
    - property 1 at 11:00
        
    - property 2 at 1:00
        
    - property 3 virtual fallback
        
5. **Approval gate**
    
    - before contacting host/agent
        
6. **Send showing requests**
    
7. **Wait for confirmations**
    
8. **Update calendar**
    
9. **Send renter itinerary**
    
10. **Create no-show reminders**
    
    - 24h
        
    - 3h
        
    - 30m
        

### Real-world Medellín example

A renter wants 3 apartments in El Poblado on Saturday.  
The workflow batches them into one efficient route instead of random back-and-forth.

---

## Workflow D — Application + Contract Review

**Goal:** help the renter apply safely and understand the lease.

### Steps

1. **Select target property**
    
2. **Collect application docs**
    
    - passport / cedula
        
    - proof of funds
        
    - references
        
3. **Pre-check completeness**
    
4. **Submit application**
    
    - approval required
        
5. **Receive lease / booking terms**
    
6. **Run contract analysis**
    
    - deposit
        
    - utilities
        
    - exit clause
        
    - damage terms
        
    - house rules
        
7. **Generate plain-language summary**
    
8. **Flag unusual risk**
    
9. **Ask renter for approval**
    
10. **Proceed to payment / signature**
    

### Real-world Medellín example

The system flags:

- unusually high deposit
    
- unclear refund condition
    
- hidden cleaning charge
    

This directly fits your ILM contract-review feature and booking workflow.

---

## Workflow E — Booking + Move-In Orchestration

**Goal:** finish the rental and reduce post-booking confusion.

### Steps

1. **Confirm accepted listing**
    
2. **Validate dates and totals**
    
3. **Generate payment summary**
    
4. **Approval gate**
    
    - before payment link or charge
        
5. **Record booking**
    
6. **Trigger move-in checklist**
    
    - address
        
    - contact person
        
    - check-in time
        
    - key handoff
        
    - Wi-Fi password
        
    - utilities
        
7. **Send welcome pack**
    
8. **Schedule follow-up**
    
    - day 1 check-in
        
    - day 3 issue check
        
    - week 2 upsell / extension offer
        

### Real-world Medellín example

After booking, the renter automatically receives:

- building entry instructions
    
- local neighborhood tips
    
- airport pickup option
    
- nearby cafés with strong Wi-Fi
    

---

# 2. Best structure for Lobster

Lobster supports file-based workflows, machine-readable tool output, approval/resume, and newer sub-workflow composition through nested `.lobster` steps with `args` and optional `loop`, which makes it a good fit for breaking the rental journey into small reusable parts. ([GitHub](https://github.com/openclaw/lobster/blob/main/AGENTS.md "lobster/AGENTS.md at main · openclaw/lobster · GitHub"))

## Recommended file layout

```text
/workflows/rentals/
  00_lead_intake.lobster
  01_property_match.lobster
  02_schedule_showings.lobster
  03_application_review.lobster
  04_booking_movein.lobster
  shared/
    extract_profile.lobster
    score_listing.lobster
    approval_send_message.lobster
    contract_summary.lobster
```

---

# 3. Suggested Lobster workflow design

## A. Lead Intake workflow skeleton

```yaml
steps:
  - id: parse_lead
    command: >
      openclaw.invoke --tools llm_task
      --input "$LOBSTER_ARG_MESSAGE"
      --prompt "Extract renter requirements as JSON:
      budget, duration_months, neighborhoods, furnished, bedrooms, wifi_need, move_in_date, pets, notes"

  - id: validate_profile
    command: >
      ./scripts/validate_renter_profile.sh '$parse_lead.json'

  - id: save_lead
    command: >
      ./scripts/save_lead.sh '$validate_profile.json'

  - id: ask_missing
    condition: "$validate_profile.json.missing_required == true"
    approval: required
    command: >
      ./scripts/draft_followup_questions.sh '$validate_profile.json'
```

### What it does

- extracts structure
    
- validates required fields
    
- saves the lead
    
- pauses before messaging the prospect
    

---

## B. Property Match workflow skeleton

```yaml
steps:
  - id: load_profile
    command: ./scripts/load_lead_profile.sh "$LOBSTER_ARG_LEAD_ID"

  - id: search_inventory
    command: ./scripts/search_listings.sh '$load_profile.json'

  - id: rank_results
    lobster: ./shared/score_listing.lobster
    args:
      listings: $search_inventory.json
      renter: $load_profile.json

  - id: shortlist
    command: ./scripts/top_matches.sh '$rank_results.json'

  - id: draft_shortlist_message
    command: ./scripts/draft_listing_message.sh '$shortlist.json'

  - id: send_shortlist
    approval: required
    command: ./scripts/send_whatsapp.sh '$draft_shortlist_message.stdout'
```

### What it does

- gets matching rentals
    
- ranks them
    
- drafts a clean message
    
- waits for approval before sending
    

---

## C. Showing Scheduling workflow skeleton

```yaml
steps:
  - id: load_selected_listings
    command: ./scripts/load_selected_listings.sh "$LOBSTER_ARG_LEAD_ID"

  - id: check_host_slots
    command: ./scripts/check_showing_availability.sh '$load_selected_listings.json'

  - id: build_route
    command: ./scripts/build_showing_route.sh '$check_host_slots.json'

  - id: draft_showing_requests
    command: ./scripts/draft_showing_requests.sh '$build_route.json'

  - id: confirm_outreach
    approval: required
    command: ./scripts/send_showing_requests.sh '$draft_showing_requests.json'
```

### What it does

- gets host times
    
- builds the best route
    
- pauses before contacting hosts
    

---

## D. Contract Review workflow skeleton

```yaml
steps:
  - id: ingest_contract
    command: ./scripts/read_contract.sh "$LOBSTER_ARG_CONTRACT_PATH"

  - id: summarize_terms
    lobster: ./shared/contract_summary.lobster
    args:
      contract: $ingest_contract.stdout

  - id: detect_risks
    command: ./scripts/flag_rental_risks.sh '$summarize_terms.json'

  - id: renter_summary
    command: ./scripts/render_plain_language_summary.sh '$detect_risks.json'

  - id: send_summary
    approval: required
    command: ./scripts/send_contract_summary.sh '$renter_summary.stdout'
```

---

## E. Booking + Move-In workflow skeleton

```yaml
steps:
  - id: load_acceptance
    command: ./scripts/load_accepted_listing.sh "$LOBSTER_ARG_LEAD_ID"

  - id: payment_breakdown
    command: ./scripts/build_payment_breakdown.sh '$load_acceptance.json'

  - id: approve_payment
    approval: required
    command: ./scripts/create_payment_link.sh '$payment_breakdown.json'

  - id: create_booking
    command: ./scripts/save_booking.sh '$approve_payment.json'

  - id: movein_pack
    command: ./scripts/generate_movein_pack.sh '$create_booking.json'

  - id: send_movein_pack
    approval: required
    command: ./scripts/send_movein_pack.sh '$movein_pack.stdout'
```

---

# 4. Best reusable sub-workflows

Lobster’s newer sub-workflow support is useful here because you can keep repeated logic modular instead of building one giant file. ([GitHub](https://github.com/openclaw/lobster/pull/20 "feat: introduces \"Sub-lobsters\": nested lobster workflows with optional loop by ggondim · Pull Request #20 · openclaw/lobster · GitHub"))

## Use these shared building blocks

### `extract_profile.lobster`

Use for:

- WhatsApp leads
    
- website forms
    
- DM inquiries
    

### `score_listing.lobster`

Use for:

- monthly rentals
    
- luxury rentals
    
- short-term stays
    

### `approval_send_message.lobster`

Use for:

- renter updates
    
- host messages
    
- booking confirmations
    

### `contract_summary.lobster`

Use for:

- lease review
    
- booking terms
    
- extension offers
    

---

# 5. Recommended scoring model for Medellín rentals

Use a simple weighted score first.

## Listing score

- Budget fit: **25%**
    
- Neighborhood fit: **20%**
    
- Wi-Fi / remote-work fit: **15%**
    
- Stay-length fit: **15%**
    
- Amenity match: **10%**
    
- Host quality: **10%**
    
- Transportation / walkability: **5%**
    

### Example

A digital nomad searching for 2 months in Laureles:

- great Wi-Fi
    
- furnished
    
- walkable cafés
    
- under budget
    

That listing should outrank a prettier apartment with bad internet.

---

# 6. Approval points you should require

Lobster’s approval model is one of its core strengths, so use it aggressively around side effects. ([GitHub](https://github.com/openclaw/lobster/blob/main/AGENTS.md "lobster/AGENTS.md at main · openclaw/lobster · GitHub"))

Require approval before:

- sending outbound WhatsApp
    
- contacting hosts
    
- scheduling showings
    
- generating payment links
    
- submitting applications
    
- sending contracts
    
- confirming booking
    
- canceling or modifying reservations
    

Do **not** require approval for:

- parsing text
    
- scoring listings
    
- checking internal availability
    
- generating draft summaries
    
- route optimization
    

---

# 7. Operational workflow map

## Full chain

```text
Lead Intake
→ Profile Extracted
→ Listings Ranked
→ Shortlist Sent
→ Showing Scheduled
→ Property Chosen
→ Application Submitted
→ Contract Reviewed
→ Payment Approved
→ Booking Created
→ Move-In Pack Sent
→ Follow-Up / Renewal
```

This fits your ILM model where the platform handles apartment search, booking, contract review, and personalized assistance in one system.

---

# 8. Best first 3 workflows to launch

Start with only these:

## Workflow 1

**Lead Intake + Profile Extraction**  
Reason: all later automation depends on clean inputs.

## Workflow 2

**Property Matching + Shortlist Send**  
Reason: fastest visible value.

## Workflow 3

**Showing Scheduling**  
Reason: highest conversion lift.

Then add:

- contract review
    
- booking
    
- move-in automation
    

---

# 9. Practical launch plan

## Week 1

Build:

- lead intake
    
- structured renter profile
    
- listing search adapter
    

## Week 2

Build:

- ranking
    
- shortlist message
    
- approval send
    

## Week 3

Build:

- showing workflow
    
- reminders
    
- host coordination
    

## Week 4

Build:

- contract review
    
- booking
    
- move-in pack
    

---

# 10. Final recommendation

For Medellín rentals, the **best Lobster design** is:

- **small workflows**
    
- **shared sub-workflows**
    
- **approval before side effects**
    
- **structured JSON outputs**
    
- **human review on money and contracts**
    

That approach matches Lobster’s official design as a local-first, composable workflow shell with safe automations and explicit approval/resume handling. ([GitHub](https://github.com/openclaw/lobster "GitHub - openclaw/lobster: Lobster is a Openclaw-native workflow shell: a typed, local-first “macro engine” that turns skills/tools into composable pipelines and safe automations—and lets Openclaw call those workflows in one step. · GitHub"))

I can turn this into a **real folder structure with 5 complete `.lobster` files and sample JSON schemas**.