---
id: C08
title: WhatsApp Continuity — Hand Off Chat Conversation to WhatsApp
status: Not Started
priority: P1
effort: 2 days
revenue_impact: High — LATAM users retain 5x better on WhatsApp; re-engagement channel
depends_on: openclaw-concierge-webhook (exists), OpenClaw WA setup, BRIDGE_SECRET env
skill:
  - mde-whatsapp
  - open-claw
  - sales-chatbot
---

<!-- task-summary -->
> **What:** WhatsApp Continuity — Hand Off Chat Conversation to WhatsApp
> **Why:** LATAM users live on WhatsApp. A chat conversation that can continue on WhatsApp: - Retains users who leave the web app - Enables re-engagement (price drop alerts, new listing notifications, showing reminders) - Extends…
> **Tools/Skills:** `mde-whatsapp` · `open-claw` · `sales-chatbot`
> **P1 · Not Started · Effort: 2 days**
> **Depends on:** openclaw-concierge-webhook (exists), OpenClaw WA setup, BRIDGE_SECRET env

# C08 — WhatsApp Continuity

## Problem

LATAM users live on WhatsApp. A chat conversation that can continue on WhatsApp:
- Retains users who leave the web app
- Enables re-engagement (price drop alerts, new listing notifications, showing reminders)
- Extends the chat funnel to the channel where conversions actually happen

`openclaw-concierge-webhook` exists and handles incoming WA messages. The missing piece is the web chat → WA handoff trigger.

## What to Build

### 1. `initiate_whatsapp_handoff` tool in ai-chat

```typescript
{
  name: "initiate_whatsapp_handoff",
  description: "Offer to continue this conversation on WhatsApp when the user wants to be notified, save their search, or stay in touch. Use this when the user mentions WhatsApp, or when they've expressed strong intent and it's time to transition to a personal follow-up channel.",
  parameters: {
    phone_number: { type: "string", description: "User's phone number if provided" },
    summary: { type: "string", description: "1-sentence summary of what to continue on WhatsApp" }
  }
}
```

Tool execution:
1. If phone_number provided → create WA deep link: `https://wa.me/${phone}?text=Hola%20mdeai!%20Quiero%20continuar%20buscando...`
2. If no phone → prompt user: "What's your WhatsApp number?"
3. Save phone to user_preferences (key: `whatsapp_number`)
4. Notify ops WA via openclaw-outreach: "User {name/email} wants WA follow-up: {summary}"
5. Return `OPEN_WHATSAPP_LINK` action

### 2. OPEN_WHATSAPP_LINK action in ChatActionBar

```tsx
if (action.type === 'OPEN_WHATSAPP_LINK') {
  return (
    <Button
      key={`${action.type}-${i}`}
      size="sm"
      className="rounded-full bg-green-500 hover:bg-green-600 text-white"
      onClick={() => {
        window.open(action.payload.wa_url as string, '_blank', 'noopener');
        onActionDispatched?.(action);
      }}
    >
      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
      Continue on WhatsApp
    </Button>
  );
}
```

### 3. System prompt: when to offer WhatsApp

Add to concierge system prompt:
```
When a user has been chatting for more than 3 turns about a specific apartment or event and expresses intent to move forward (book, apply, schedule), offer WhatsApp continuity: "Want me to follow up on WhatsApp when new listings in Laureles match your budget?"

When the user explicitly mentions WhatsApp, immediately call initiate_whatsapp_handoff.
```

### 4. WhatsApp re-engagement automation

This is a post-handoff automation (not in this task, see C03 for lead capture):
- When `initiate_whatsapp_handoff` fires → lead captured with `source = 'whatsapp_handoff'`
- Triggers OpenClaw WA outreach within 1 hour:
  "¡Hola! Soy el concierge de mdeai. Encontré 3 apartamentos nuevos en Laureles que coinciden con tu búsqueda: [links]"
- Daily: if new listings match saved search → WA notification
- Weekly: "¿Seguís buscando apartamento? Esta semana tenemos X nuevos en Laureles"

### 5. WA number collection in email gate

When email gate fires (message 4), add optional phone field:
```tsx
<Input placeholder="WhatsApp (optional, for follow-ups)" type="tel" />
```

This is the highest-value touchpoint — user is already engaged enough to provide email.

### 6. Quick action: "Stay in touch"

Add to ChatLeftNav bottom section:
```
📱 Get WhatsApp updates
```

Clicking triggers: "What's your WhatsApp number? I'll send you new listings and event alerts matching your preferences."

### 7. Intent patterns for WA

Add to ai-router:
```typescript
{ 
  patterns: [/\b(whatsapp|wa|follow up|stay in touch|contact me|notify me|alert me)\b/i],
  intent: 'whatsapp_handoff',
  confidence: 0.90
}
```

## Acceptance Criteria

- [ ] User says "send me updates on WhatsApp" → AI asks for number → deep link generated → "Continue on WhatsApp" button appears
- [ ] Clicking "Continue on WhatsApp" opens wa.me with pre-filled message
- [ ] Ops team gets WA notification when handoff initiated
- [ ] Phone number saved to user_preferences
- [ ] Email gate includes optional WhatsApp field
- [ ] `whatsapp_handoff` intent classified by router

## Files to Touch

- `supabase/functions/ai-chat/index.ts` — add initiate_whatsapp_handoff tool
- `supabase/functions/ai-router/index.ts` — add whatsapp_handoff intent
- `src/components/chat/ChatActionBar.tsx` — OPEN_WHATSAPP_LINK handler
- `src/components/chat/EmailGateModal.tsx` — add optional phone field
- `src/components/chat/ChatLeftNav.tsx` — "Get WhatsApp updates" quick action

---

## Definition of Done (continuous testing — mandatory)

A task is **not** done until every applicable row is checked. "Code merged" is not the finish line — **tested + verified live** is. See [.claude/rules/task-writing.md §9](../../../.claude/rules/task-writing.md) and [CLAUDE.md → Definition of Done](../../../CLAUDE.md).

- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] `npm run test` clean and **count did not regress** (new logic = new tests; bugs = regression test that fails without the fix)
- [ ] `npm run verify:edge` clean *(only if `supabase/` was touched — else "N/A — no edge-fn change")*
- [ ] E2E covered *(Playwright spec OR documented manual run with screenshot — only if user-facing flow touched; else "N/A")*
- [ ] Live verification on https://www.mdeai.co after Vercel deploy *(only if UI shipped to prod; HTTP 200 + visual check)*
- [ ] PR body lists what was tested + result for each layer

If a layer is N/A, **say so explicitly** in the PR. Silence ≠ exemption.
