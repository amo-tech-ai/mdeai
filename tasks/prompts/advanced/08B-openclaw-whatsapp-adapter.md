---
id: 08B
diagram_id: MERM-04
prd_section: "5. AI agent architecture — OpenClaw channels"
title: Wire OpenClaw WhatsApp channel adapter
skills:
  - integration
  - mdeai-tasks
epic: E8
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies:
  - E5-007
  - E8-001
estimated_effort: L
percent_complete: 0
outcome: O5
---

# E8-002: Wire OpenClaw WhatsApp Channel Adapter

> **Scope:** Per [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md), this task is **large**. Complete **[`08F-whatsapp-ingress-architecture.md`](08F-whatsapp-ingress-architecture.md)** (E8-005), **[`08K-openclaw-provider-strategy.md`](08K-openclaw-provider-strategy.md)** (E8-010), and **[`08H-openclaw-wa-adapter-phase1.md`](08H-openclaw-wa-adapter-phase1.md)** (E8-007) before treating **E8-002** as done. **[`05M-openclaw-gateway-health-stub.md`](05M-openclaw-gateway-health-stub.md)** gates public WA.

```yaml
---
id: E8-002
diagram_id: MERM-04
prd_section: "5. AI agent architecture — OpenClaw channels"
title: Wire OpenClaw WhatsApp channel adapter
skill: integration
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies:
  - E5-007
  - E8-001
estimated_effort: L
percent_complete: 0
epic: E8
outcome: O5
---
```

### Prompt

Connect the WhatsApp channel to the OpenClaw gateway so AI chat works over WhatsApp with the same intelligence as web.

**Epic index:** [`08E-multi-channel.md`](08E-multi-channel.md)

**Depends on:** [`05H-openclaw-gateway-adapter.md`](05H-openclaw-gateway-adapter.md) (E5-007), [`08A-infobip-whatsapp-webhook.md`](08A-infobip-whatsapp-webhook.md)

**Read first:**
- `tasks/mermaid/04-chat-flow.mmd` — WhatsApp Channel Flow: OpenClaw → Router → Chat → format for WA
- `tasks/mermaid/07-agent-architecture.mmd` — OpenClaw Gateway with WAChannel
- `.claude/skills/open-claw/` — OpenClaw configuration reference

**The build:**
- Register WhatsApp channel adapter in OpenClaw configuration
- WhatsApp message flow:
  1. Infobip webhook → `whatsapp-webhook` edge function
  2. Edge function → OpenClaw gateway (HTTP call with channel='whatsapp')
  3. OpenClaw → `ai-router` for intent classification
  4. OpenClaw → `ai-chat` for response generation
  5. OpenClaw → format response for WhatsApp (text + quick replies + carousels)
  6. OpenClaw → Infobip API → WhatsApp
- Format conversions:
  - Property cards → WhatsApp image carousel with buttons
  - Action buttons → WhatsApp quick reply options
  - Long text → truncated with "View more on mdeai.co" link
- Conversation state maintained per phone number
- Language detection: route Spanish messages to Spanish response mode

**Example:**
A WhatsApp user sends "Busco apartamento en Laureles, presupuesto 3 millones." OpenClaw routes to ai-router (intent: RENTAL_SEARCH, language: es), then ai-chat responds with 3 matching apartments formatted as a WhatsApp carousel with images and "Ver detalles" buttons.

### Acceptance Criteria
- [ ] WhatsApp messages route through OpenClaw to ai-router and ai-chat
- [ ] Responses formatted for WhatsApp (text + buttons + carousels)
- [ ] Property cards rendered as WhatsApp image carousels
- [ ] Conversation state maintained per phone number
- [ ] Language detection works (Spanish/English)
- [ ] Quick reply buttons for common actions (schedule showing, see more)
- [ ] Handles media attachments (photos from potential renters)
- [ ] Error responses are user-friendly in WhatsApp format

**Next:** [`08C-wa-lead-capture.md`](08C-wa-lead-capture.md), [`08D-human-handover-escalation.md`](08D-human-handover-escalation.md).

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | OpenClaw drives WhatsApp AI routing with guardrails and escalation. |
| **Workflow** | Adapter + routing policy → test conversations → metrics. |
| **Proof** | Handoff to human works; cost tracked. |
| **Gates** | 08F/08K/05M decisions applied. |
| **Rollout** | Canary traffic. |

---

