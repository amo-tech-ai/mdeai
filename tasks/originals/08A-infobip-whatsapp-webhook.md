---
id: 08A
diagram_id: MERM-04
prd_section: "5. AI agent architecture — WhatsApp channel"
title: Configure Infobip WhatsApp Business API
skills:
  - integration
  - mdeai-tasks
epic: E8
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
outcome: O5
---

# E8-001: Configure Infobip WhatsApp Business API

```yaml
---
id: E8-001
diagram_id: MERM-04
prd_section: "5. AI agent architecture — WhatsApp channel"
title: Configure Infobip WhatsApp Business API
skill: integration
phase: ADVANCED
priority: P2
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
