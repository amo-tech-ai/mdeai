---
id: 08C
diagram_id: MERM-03
prd_section: "6. Automations — Multi-channel lead capture"
title: Implement WhatsApp to lead-capture flow
description: "Ships «Implement WhatsApp to lead-capture flow» for this epic—full scope in § Prompt below."
skills:
  - full-stack
  - mdeai-tasks
epic: E8
phase: CORE
priority: P0
status: Open
owner: Full-Stack
dependencies:
  - E8-001
estimated_effort: M
percent_complete: 0
outcome: O5
---

# E8-003: Implement WA to Lead-Capture Flow

### Real world — purpose & outcomes

**In one sentence:** A traveler can start a WhatsApp conversation and become a **lead** in your CRM—same fields as web—without duplicate rows if Infobip retries the webhook.

- **Who it’s for:** Travelers messaging first; sales/ops following up in the dashboard.
- **Purpose:** Capture demand where Medellín users actually are (WhatsApp), wired to `leads` / pipeline.
- **Goals:** Text-only MVP first; phone → lead mapping; align with 02E phasing (02H).
- **Features / deliverables:** Edge path from 08A payload to DB; idempotency; source=`whatsapp` (or agreed field); no PII in logs.

```yaml
---
id: E8-003
diagram_id: MERM-03
prd_section: "6. Automations — Multi-channel lead capture"
title: Implement WhatsApp to lead-capture flow
description: "Ships «Implement WhatsApp to lead-capture flow» for this epic—full scope in § Prompt below."
skill: full-stack
phase: CORE
priority: P0
status: Open
owner: Full-Stack
dependencies:
  - E8-001
estimated_effort: M
percent_complete: 0
epic: E8
outcome: O5
---
```

### Prompt

Connect WhatsApp conversations to the lead-capture pipeline so WhatsApp users become tracked leads.

**Epic index:** [`08E-multi-channel.md`](08E-multi-channel.md)

**Depends on:** 08A (Infobip webhook); `p1-crm` edge function (existing — has `create_lead` action)

**Read first:**
- `supabase/functions/p1-crm/index.ts` — existing CRM function with `create_lead` action (NOT `lead-capture` — that function doesn't exist)
- `tasks/mermaid/03-rental-pipeline.mmd` — Intake → Lead Capture (source: whatsapp)

**The build (CORE v1 — no OpenClaw, no AI routing):**
- New thin edge function `wa-lead-capture` that:
  1. Receives forwarded WA message from 08A Infobip webhook dispatcher
  2. Extracts basic preferences from message text using simple regex/parsing (NOT AI — keep it simple for v1)
  3. Calls `p1-crm` with `action: 'create_lead'` and `source: 'whatsapp'`, phone number, parsed preferences. **NOTE (2026-04-05):** The `source` field must be added to the `leads` table if not already present — check `20260404120001_p1_leads.sql`. If missing, add `ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';` in a new migration before implementing this task.
  4. Returns lead_id
  5. Subsequent messages from same phone number attach to existing lead (lookup by phone)
- Handle anonymous leads (WhatsApp users have no JWT):
  - wa-lead-capture uses service role to call p1-crm (internal edge-to-edge)
  - Track by phone number instead of user_id
- **v2 (ADVANCED):** AI preference extraction via OpenClaw replaces regex parsing

### Acceptance Criteria
- [ ] WhatsApp conversations trigger lead-capture with source='whatsapp'
- [ ] Preferences extracted from conversation context by AI
- [ ] Lead created with phone number as primary contact
- [ ] Subsequent messages attach to existing lead (idempotent by phone)
- [ ] lead_id flows through WhatsApp conversation for pipeline tracking
- [ ] Anonymous leads handled (no JWT required for WhatsApp source)
- [ ] Lead quality score calculated same as web leads
- [ ] Logs to ai_runs if AI extracts preferences

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | WA text creates or updates leads without duplicate spam on retry. |
| **Workflow** | Webhook → normalize → `p1-crm` or dedicated function → idempotency. |
| **Proof** | Same message id → same lead; errors logged. |
| **Gates** | Align with 02E anonymous policy; 03E on edges. |
| **Rollout** | Sandbox numbers. |

---

