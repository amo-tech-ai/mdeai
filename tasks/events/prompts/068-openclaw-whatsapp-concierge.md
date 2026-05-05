---
task_id: 068-openclaw-whatsapp-concierge
title: OpenClaw WhatsApp AI concierge — voter/attendee support bot
phase: PHASE-2-OPENCLAW
priority: P1
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase
  - gemini
  - mdeai-project-gates
edge_function: openclaw-concierge-webhook
schema_tables:
  - marketing.openclaw_conversations
  - events
  - vote.contests
  - event_tickets (bookings)
depends_on:
  - '059-marketing-schema-migration'
  - '067-openclaw-delivery-webhook'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-OPENCLAW — Phase 1 fast-follow |
| **What it does** | 24/7 WhatsApp bot that answers voter and attendee questions in Colombian Spanish |
| **Route** | `POST /functions/v1/openclaw-concierge-webhook` (OpenClaw VPS calls this for each inbound message) |
| **Real-world** | Camila WhatsApps "¿Ya fue contado mi voto para Luna?" at 11pm. OpenClaw routes the message to `openclaw-concierge-webhook`. Gemini Flash reads her vote record from `vote.ballots` and replies "Sí Camila, tu voto para Luna (candidata #7) fue registrado hoy a las 4:32pm 🎉" — all automated, all in Paisa Spanish |

## Description

**Architecture.** OpenClaw VPS receives inbound WhatsApp messages. For each message matching the concierge trigger (keyword or fallback), it calls `openclaw-concierge-webhook` with the message + contact hash. This fn:
1. Resolves the user (by contact_hash → profiles lookup if they have an account)
2. Fetches event/vote context from DB
3. Calls Gemini Flash to classify intent + generate reply
4. Returns reply text to OpenClaw VPS, which delivers it via WhatsApp Business API

**Intents handled:**
| Intent | Example | Reply |
|---|---|---|
| Vote confirmation | "¿Fue contado mi voto?" | Reads vote.ballots, confirms with timestamp |
| Ticket status | "¿Dónde está mi entrada?" | Reads bookings, resends QR link |
| Leaderboard | "¿Cómo va el concurso?" | Reads top-5 from vote.leaderboard_cache |
| Event info | "¿A qué hora empieza?" | Reads events.start_time, venue, address |
| Opt-out | "Para" / "Stop" / "Cancelar" | Sets influencers.opt_out=true; confirms |
| Unknown | Any other message | Gemini Flash generates helpful fallback |

## Edge function spec

```typescript
// POST /functions/v1/openclaw-concierge-webhook
// Headers: X-OpenClaw-Signature: hmac-sha256=HEX
// Body:
{
  "contact_hash": "sha256...",
  "channel": "whatsapp",
  "message": "¿Ya fue contado mi voto?",
  "event_id": "optional — if OpenClaw knows context",
  "session_id": "openclaw_session_xxx"
}
//
// Response (OpenClaw delivers this):
{
  "reply": "Sí Camila, tu voto para Luna fue registrado hoy a las 4:32pm 🎉",
  "session_id": "..."
}
```

## Gemini integration (G1–G6)

- Model: `gemini-3-flash-preview` (fast + cheap for chat)
- `responseJsonSchema` with `{ reply: string, intent: string }` (G1)
- Default temperature (G2)
- System prompt: Colombian Spanish, Paisa warmth, concise (≤300 chars for WhatsApp)
- Context: event name, contest name, user's vote/ticket status passed as structured context

## Conversation persistence

`marketing.openclaw_conversations`:
- `UPSERT ON CONFLICT (channel, contact_hash)` to maintain session continuity
- `topic_tags` array updated per conversation (for analytics)

## Acceptance Criteria

- [ ] Invalid HMAC signature returns 401.
- [ ] Vote confirmation intent reads `vote.ballots` and returns accurate timestamp.
- [ ] Ticket status intent returns QR link from `bookings`.
- [ ] Opt-out intent sets `marketing.influencers.opt_out=true` immediately.
- [ ] All replies in Colombian Spanish (Gemini prompt enforces this).
- [ ] Reply generated in <3s p95.
- [ ] Conversation state persisted to `marketing.openclaw_conversations`.
- [ ] Logs to `ai_runs` (agent_name='openclaw-concierge').
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`social/02-openclaw-strategy.md`](../social/02-openclaw-strategy.md) §Use case A5 — event-ops bot
- [`067-openclaw-delivery-webhook.md`](./067-openclaw-delivery-webhook.md) — opt-out shared pattern
