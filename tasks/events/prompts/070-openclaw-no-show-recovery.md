---
task_id: 070-openclaw-no-show-recovery
title: OpenClaw A6 — attendance confirmation + no-show recovery automation
phase: PHASE-2-OPENCLAW
priority: P2
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase
  - gemini
  - mdeai-project-gates
edge_function: openclaw-attendance-reminder
schema_tables:
  - event_attendees
  - event_orders
  - events
  - marketing.openclaw_conversations
  - marketing.delivery_logs
depends_on:
  - '059-marketing-schema-migration'
  - '068-openclaw-whatsapp-concierge'
  - '005-ticket-payment-webhook'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-OPENCLAW (A6 automation from `12-ai-events-features.md`) |
| **Trigger** | pg_cron at T-12h before each event (event.start_time - 12 hours) |
| **What it does** | Sends personalized WhatsApp reminder to ticket holders; classifies their reply (confirm/maybe/cancel); updates `event_attendees.attendance_intent`; sends no-show recovery offer (waitlist invite or refund link) for confirmed no-shows |
| **Real-world** | "Reina de Antioquia 2026" starts Saturday 7pm. At 7am Saturday, every ticket holder gets "¡Hola Camila! Tu entrada VIP para esta noche en el Teatro Metropolitano está lista 🎉. ¿Confirmamos tu asistencia? Responde SÍ/NO". Camila replies "SÍ" → her `attendance_intent='confirmed'`. Andrés replies "No puedo ir" → `attendance_intent='cancelled'`; system offers his seat to the waitlist |

## Prerequisites — schema addition

`event_attendees` needs one new column before this edge fn ships:

```sql
ALTER TABLE event_attendees
  ADD COLUMN IF NOT EXISTS attendance_intent text
    CHECK (attendance_intent IN ('confirmed','cancelled','unknown'))
    DEFAULT NULL;
```

This migration ships as part of this task (include in `supabase/migrations/`).

## Description

**Phase 1 vs Phase 2 scope.**
- **Phase 1 (OpenClaw direct):** cron triggers `openclaw-attendance-reminder`, which dispatches WhatsApp templates via OpenClaw VPS. Replies flow back through `openclaw-concierge-webhook` (task 068) which classifies intent.
- **Phase 4 (trio orchestrated):** Hermes reasons about aggregate attendance patterns; Paperclip governs waitlist offer budget; OpenClaw executes. This task ships the Phase 1 version.

## Edge function spec

```typescript
// POST /functions/v1/openclaw-attendance-reminder
// Triggered by: pg_cron every 15 min, checking for events starting in 12-13h
// Also callable manually: { event_id: string, dry_run?: boolean }
//
// 1. SELECT events WHERE start_time BETWEEN now()+11h AND now()+13h AND status='live'
// 2. For each event:
//    SELECT ea.* FROM event_attendees ea
//    JOIN event_orders eo ON eo.id = ea.order_id
//    WHERE ea.event_id = $event_id
//      AND eo.status = 'paid'
//      AND ea.status = 'active'
//      AND ea.attendance_intent IS NULL
// 3. Build WhatsApp template per attendee (ea.full_name for first name)
// 4. POST jobs to OpenClaw VPS (WhatsApp Business template send)
// 5. INSERT delivery_logs (status='sent')
//
// Classification (via openclaw-concierge-webhook task 068):
// - Reply "SÍ"/"Sí"/"si"/"yes"/"voy" → UPDATE event_attendees SET attendance_intent='confirmed'
// - Reply "NO"/"no"/"no puedo"/"cancel" → UPDATE event_attendees SET attendance_intent='cancelled'
// - No reply after 6h → UPDATE event_attendees SET attendance_intent='unknown'
//
// No-show recovery (runs at T-2h):
// - SELECT ea.* FROM event_attendees ea
//   JOIN event_tickets et ON et.id = ea.ticket_id
//   WHERE ea.event_id = $event_id
//     AND ea.attendance_intent = 'cancelled'
//     AND et.tier_name != 'backstage'
// - SELECT waitlist candidates (future: waitlist table; Phase 1: admins notified via Supabase notification)
// - Send cancellation confirmation + refund link (if within refund window) to attendee
```

## WhatsApp template (pre-approved Business template)

```
¡Hola {{first_name}}! Tu entrada {{ticket_tier}} para {{event_name}} esta noche a las {{start_time}} 
en {{venue_name}} está lista 🎉

¿Confirmamos tu asistencia? Responde:
✅ SÍ — te esperamos
❌ NO — liberar mi lugar

Tu código QR: {{qr_link}}
```

*Templates must be pre-approved by WhatsApp Business API before use. This is an ops step, not a code step.*

## Acceptance Criteria

- [ ] Migration adds `attendance_intent` column to `event_attendees`; advisor clean.
- [ ] pg_cron triggers reminder for events starting in 11–13h window; no double-sends (idempotent).
- [ ] `dry_run=true` returns list of attendees who would receive reminder without sending.
- [ ] WhatsApp job payload dispatched to OpenClaw VPS with HMAC signature.
- [ ] Reply classification via concierge webhook (task 068) updates `event_attendees.attendance_intent`.
- [ ] No-show recovery message sent at T-2h for `attendance_intent='cancelled'` attendees.
- [ ] Logs to `ai_runs` (agent_name='openclaw-attendance-reminder').
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`12-ai-events-features.md`](../12-ai-events-features.md) §4.2 — A6 automation definition
- [`068-openclaw-whatsapp-concierge.md`](./068-openclaw-whatsapp-concierge.md) — reply classification
