---
id: 08C
diagram_id: MERM-03
prd_section: "6. Automations — Multi-channel lead capture"
title: Implement WhatsApp to lead-capture flow
skills:
  - full-stack
  - mdeai-tasks
epic: E8
phase: ADVANCED
priority: P2
status: Open
owner: Full-Stack
dependencies:
  - E2-001
  - E8-002
estimated_effort: M
percent_complete: 0
outcome: O5
---

# E8-003: Implement WA to Lead-Capture Flow

```yaml
---
id: E8-003
diagram_id: MERM-03
prd_section: "6. Automations — Multi-channel lead capture"
title: Implement WhatsApp to lead-capture flow
skill: full-stack
phase: ADVANCED
priority: P2
status: Open
owner: Full-Stack
dependencies:
  - E2-001
  - E8-002
estimated_effort: M
percent_complete: 0
epic: E8
outcome: O5
---
```

### Prompt

Connect WhatsApp conversations to the lead-capture pipeline so WhatsApp users become tracked leads.

**Epic index:** [`08E-multi-channel.md`](08E-multi-channel.md)

**Depends on:** [`08B-openclaw-whatsapp-adapter.md`](08B-openclaw-whatsapp-adapter.md); pipeline: [`02E-lead-to-lease-pipeline.md`](02E-lead-to-lease-pipeline.md) (E2-001)

**Read first:**
- `tasks/mermaid/03-rental-pipeline.mmd` — Intake → Lead Capture (source: whatsapp)
- `supabase/functions/lead-capture/index.ts` — existing lead-capture edge function
- `tasks/mermaid/04-chat-flow.mmd` — WhatsApp channel flow

**The build:**
- After OpenClaw classifies a WhatsApp message as RENTAL_SEARCH intent:
  1. Extract preferences from conversation (budget, neighborhood, dates — parsed by AI)
  2. Call `lead-capture` edge function with `source: 'whatsapp'`
  3. Lead-capture creates lead record (phone as contact_info, no email required)
  4. Return lead_id to OpenClaw for pipeline tracking
  5. Subsequent messages from same phone number attach to existing lead
- Handle anonymous leads (WhatsApp users have no JWT):
  - lead-capture must accept `source: 'whatsapp'` without JWT auth
  - Track by phone number instead of user_id
  - Optional: prompt user to create web account for full features
- Conversion tracking: if WhatsApp lead later signs up on web, merge lead records

### Acceptance Criteria
- [ ] WhatsApp conversations trigger lead-capture with source='whatsapp'
- [ ] Preferences extracted from conversation context by AI
- [ ] Lead created with phone number as primary contact
- [ ] Subsequent messages attach to existing lead (idempotent by phone)
- [ ] lead_id flows through WhatsApp conversation for pipeline tracking
- [ ] Anonymous leads handled (no JWT required for WhatsApp source)
- [ ] Lead quality score calculated same as web leads
- [ ] Logs to ai_runs if AI extracts preferences
