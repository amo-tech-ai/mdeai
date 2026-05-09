---
id: C03
title: Lead Capture Tool — Every Chat Session Becomes a Lead
status: Not Started
priority: P0
effort: 1 day
revenue_impact: Very High — $20–50/qualified lead to agent pipeline
depends_on: leads table, lead-from-form edge fn (already exists), WhatsApp notification
skill:
  - frontend-design
  - mde-supabase
  - chatbot-conversation-design
---

<!-- task-summary -->
> **What:** Lead Capture Tool — Every Chat Session Becomes a Lead
> **Why:** Every chat session is anonymous until the email gate fires at message 4. Even authenticated users who express housing/event intent generate zero CRM data. Agents have no pipeline. Ops has no leads.
> **Tools/Skills:** `frontend-design` · `mde-supabase` · `chatbot-conversation-design`
> **P0 · Not Started · Effort: 1 day**
> **Depends on:** leads table, lead-from-form edge fn (already exists), WhatsApp notification

# C03 — Lead Capture Tool

## Problem

Every chat session is anonymous until the email gate fires at message 4. Even authenticated users who express housing/event intent generate zero CRM data. Agents have no pipeline. Ops has no leads.

The `lead-from-form` edge function already exists. We need a `capture_lead` tool in `ai-chat` that fires automatically when:
- User expresses clear intent (housing, event, investment)
- User provides contact info voluntarily
- User reaches turn 3+ in a housing conversation

## What to Build

### 1. New `chat-lead-capture` edge function
File: `supabase/functions/chat-lead-capture/index.ts`

```typescript
// Input from ai-chat tool call
interface LeadCaptureInput {
  user_id: string | null;
  conversation_id: string;
  intent: string;          // 'rental', 'host', 'buyer', 'event_organizer', 'sponsor'
  email?: string;
  phone?: string;
  name?: string;
  entities: {
    neighborhood?: string;
    budget_min?: number;
    budget_max?: number;
    bedrooms?: number;
    move_in_date?: string;
    event_type?: string;
  };
  source: 'chat_auto' | 'chat_explicit';  // auto = intent signal, explicit = user asked
}

// Action
// 1. Upsert to leads table
// 2. Trigger WhatsApp notification to ops via openclaw-outreach
// 3. Return { lead_id, message: "Your details saved. An agent will reach out within 24h." }
```

### 2. Add `capture_lead` tool to ai-chat

In `supabase/functions/ai-chat/index.ts` tools array:
```typescript
{
  type: "function",
  function: {
    name: "capture_lead",
    description: "Capture user contact details and intent when they express strong interest in renting, buying, hosting, or event planning. Use this when the user provides their email/phone OR when they say they want to be contacted.",
    parameters: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          enum: ["rental", "host", "buyer", "event_organizer", "sponsor"],
          description: "What the user is trying to accomplish"
        },
        email: { type: "string", description: "User's email if provided" },
        phone: { type: "string", description: "User's phone if provided" },
        name: { type: "string", description: "User's name if provided" },
        neighborhood: { type: "string" },
        budget_max: { type: "number" },
        move_in_date: { type: "string" }
      },
      required: ["intent"]
    }
  }
}
```

### 3. leads table migration

```sql
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  intent TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  name TEXT,
  entities JSONB DEFAULT '{}',
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'chat',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- Ops/admin can see all leads
CREATE POLICY "admin_all_leads" ON leads FOR ALL
  USING ((SELECT auth.jwt() ->> 'role') = 'service_role');
-- Users can see their own leads
CREATE POLICY "own_leads" ON leads FOR SELECT
  USING (user_id = (SELECT auth.uid()));
```

### 4. System prompt update for auto lead capture

Add to ai-chat system prompt:
```
When a user in a rentals conversation expresses strong interest ("I like this one", "I want to apply", "how do I book this"), call capture_lead automatically with the intent and any context you have.
When a user provides their contact information (email, phone), always call capture_lead immediately.
After capture_lead succeeds, say: "Perfect, I've saved your details. An agent who specializes in Laureles rentals will reach out within 24 hours."
```

### 5. WhatsApp notification to ops

In `chat-lead-capture/index.ts`, after saving the lead:
```typescript
// Notify ops via WhatsApp (OpenClaw outreach)
await fetch(`${supabaseUrl}/functions/v1/openclaw-outreach`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${serviceKey}` },
  body: JSON.stringify({
    to: '+573001234567',  // ops WA number from OUTREACH_OPS_NUMBER env var
    message: `🔥 New lead from chat:\n${intent} in ${neighborhood}\nBudget: $${budget}\nEmail: ${email || 'not provided'}\nConversation: ${conversationId}`
  })
});
```

### 6. OPEN_LEAD_CAPTURED action

Return from chat-lead-capture:
```json
{
  "actions": [
    { "type": "OPEN_LEAD_CAPTURED", "payload": { "lead_id": "...", "message": "Agent notified" } }
  ]
}
```

Add to ChatActionBar: `OPEN_LEAD_CAPTURED` → show a "View your saved searches →" button to `/saved`.

## Acceptance Criteria

- [ ] User says "contact me about this apartment" → capture_lead fires → lead row created
- [ ] User provides email in chat → capture_lead fires automatically
- [ ] Ops team gets WhatsApp notification within 30 seconds
- [ ] AI responds with "Agent will reach out within 24h" confirmation
- [ ] Lead visible in `/admin/leads` (existing admin panel or new page)
- [ ] Authenticated users: `user_id` set on lead record
- [ ] Anonymous users: `user_id = null`, email stored if provided

## Files to Touch

- `supabase/functions/chat-lead-capture/index.ts` — create
- `supabase/functions/ai-chat/index.ts` — add capture_lead tool + system prompt update
- `supabase/migrations/YYYYMMDD_leads_table.sql` — create if not exists
- `src/components/chat/ChatActionBar.tsx` — handle OPEN_LEAD_CAPTURED

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
