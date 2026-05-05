---
id: 08D
diagram_id: MERM-04
prd_section: "5. AI agent architecture — Escalation"
title: Build human handover escalation for low-confidence conversations
skills:
  - full-stack
  - mdeai-tasks
epic: E8
phase: ADVANCED
priority: P3
status: Open
owner: Full-Stack
dependencies:
  - E8-002
estimated_effort: M
percent_complete: 0
outcome: O5
---

# E8-004: Build Human Handover Escalation

```yaml
---
id: E8-004
diagram_id: MERM-04
prd_section: "5. AI agent architecture — Escalation"
title: Build human handover escalation for low-confidence conversations
skill: full-stack
phase: ADVANCED
priority: P3
status: Open
owner: Full-Stack
dependencies:
  - E8-002
estimated_effort: M
percent_complete: 0
epic: E8
outcome: O5
---
```

### Prompt

Implement the human handover system for when AI confidence drops below threshold.

**Epic index:** [`08E-multi-channel.md`](08E-multi-channel.md)

**Depends on:** [`08B-openclaw-whatsapp-adapter.md`](08B-openclaw-whatsapp-adapter.md)

**Read first:**
- `tasks/mermaid/04-chat-flow.mmd` — "Confidence < 0.3 triggers human handover" note
- `src/components/chat/` — existing chat components
- `supabase/functions/ai-chat/index.ts` — confidence scoring in responses

**The build:**
- In `ai-chat` edge function: when response confidence < 0.3, set `escalation: true` flag
- Escalation flow:
  1. AI responds: "Let me connect you with our team for better assistance..."
  2. Flag conversation in DB: `conversations.status = 'escalated'`
  3. Create notification for ops team via `notifications` table
  4. For WhatsApp: send a "human agent will respond shortly" template
  5. For web: show "Connecting to support..." in FloatingChatWidget
- Admin dashboard: show escalated conversations queue
  - `src/components/admin/EscalationQueue.tsx` — list of escalated conversations
  - Show conversation history, user info, original AI confidence
  - "Take over" button assigns conversation to admin user
  - Admin messages go directly to user (bypass AI)
- De-escalation: admin marks resolved, conversation returns to AI mode

**Example:**
A WhatsApp user asks about visa requirements for long-term stays in Colombia. AI confidence: 0.15 (outside rental domain). AI responds: "That's a great question about visas! Let me connect you with our team who can help with that." Conversation flagged, ops team notified. Admin takes over and provides visa guidance, then marks resolved.

### Acceptance Criteria
- [ ] Confidence < 0.3 triggers escalation flag
- [ ] User sees handover message in both web and WhatsApp
- [ ] Conversation status updated to 'escalated' in DB
- [ ] Ops team notified via notifications table
- [ ] EscalationQueue component shows escalated conversations in admin
- [ ] Admin can "take over" and respond directly
- [ ] Conversation can be de-escalated back to AI mode
- [ ] Handles 4 states in EscalationQueue
- [ ] `npm run build` passes
