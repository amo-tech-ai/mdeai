---
id: 08A
diagram_id: MERM-04
prd_section: "5. AI agent architecture — WhatsApp channel"
title: Configure Infobip WhatsApp Business API
description: "Ships «Configure Infobip WhatsApp Business API» for this epic—full scope in § Prompt below."
skills:
  - integration
  - mdeai-tasks
epic: E8
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
outcome: O5
---

# E8-001: Configure Infobip WhatsApp Business API

### Real world — purpose & outcomes

**In one sentence:** When a traveler texts your Infobip number, Infobip hits your edge with a **verified** webhook—so only real Infobip traffic becomes leads, not spoofed POSTs.

- **Who it’s for:** Travelers on WhatsApp; ops receiving inbound messages in CRM.
- **Purpose:** Trust the channel: signature verification, structured logging, safe routing to downstream handlers.
- **Goals:** Reject bad signatures; idempotent handling of retries; secrets only on server.
- **Features / deliverables:** Webhook URL config in Infobip, edge handler, env secrets, dispatcher story for 08C/08L.

```yaml
---
id: E8-001
diagram_id: MERM-04
prd_section: "5. AI agent architecture — WhatsApp channel"
title: Configure Infobip WhatsApp Business API
description: "Ships «Configure Infobip WhatsApp Business API» for this epic—full scope in § Prompt below."
skill: integration
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
epic: E8
outcome: O5
---
```

### Prompt

Set up the Infobip WhatsApp Business API integration for receiving and sending WhatsApp messages.

**Epic index:** [`08E-multi-channel.md`](08E-multi-channel.md)

**Read first:**
- `tasks/mermaid/04-chat-flow.mmd` — WhatsApp Channel Flow section
- `tasks/mermaid/10-deployment-architecture.mmd` — Infobip API integration
- Edge function secrets: `INFOBIP_API_KEY`, `INFOBIP_BASE_URL`, `INFOBIP_PHONE_NUMBER` (already in Supabase dashboard)

**The build:**
- Create `supabase/functions/whatsapp-webhook/index.ts` — receives Infobip webhooks
- Webhook receives inbound WhatsApp messages from Infobip
- Verify Infobip webhook signature for security
- Parse message: extract sender phone, message text, media attachments
- Create `src/integrations/infobip/client.ts` — Infobip API wrapper for sending messages
- Send function: text messages, quick reply buttons, image carousels (for property cards)
- Handle delivery status callbacks (sent, delivered, read, failed)

**Message format for Infobip:**
```typescript
// Inbound webhook payload (from Infobip)
{ results: [{ from: string, to: string, message: { text: string }, receivedAt: string }] }

// Outbound message (to Infobip)
{ from: INFOBIP_PHONE_NUMBER, to: recipient, content: { text: string } }
```

### Acceptance Criteria
- [ ] Webhook edge function receives Infobip inbound messages
- [ ] Webhook signature verified (reject unsigned requests)
- [ ] Inbound messages parsed: sender, text, media
- [ ] Outbound message function sends text, quick replies, images
- [ ] Delivery status callbacks tracked
- [ ] Secrets used from Supabase dashboard (INFOBIP_API_KEY, etc.)
- [ ] CORS configured (Infobip webhook — no browser CORS needed, but structured response)
- [ ] Handles Infobip API errors gracefully (retry on 5xx, log on 4xx)

**Next:** [`08B-openclaw-whatsapp-adapter.md`](08B-openclaw-whatsapp-adapter.md) (depends on [`05H-openclaw-gateway-adapter.md`](05H-openclaw-gateway-adapter.md) + this task).

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
| **Goal** | Infobip webhook verifies signatures and enqueues WA messages safely. |
| **Workflow** | Configure webhook URL → verify signature → route to handler. |
| **Proof** | Invalid signature rejected; valid creates trace id. |
| **Gates** | Secrets in Supabase secrets; 03E before prod. |
| **Rollout** | Sandbox Infobip first. |

---

