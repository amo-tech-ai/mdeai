---
id: A6-ATTENDANCE-CONFIRMATION
phase: ADVANCED
prd_section: 07-ai-event-research.md A6, 06-trio-integration.md
type: sequence
related: [13-trio-architecture]
---

# 14 — A6 attendance confirmation (sequence)

**What this shows.** Ported from EventMobi's pattern. T-12 hours before any event with `status='live'`, OpenClaw sends a WhatsApp template asking "¿Confirmas asistencia mañana?" Replies route to Hermes for sentiment classification; results update `event.bookings.attendance_intent`. Resolves "ghost attendees" — paid + no-show — that break venue capacity planning.

**Phase.** ADVANCED — Phase 3 ships this as plain OpenClaw + pg_cron; Phase 4 re-orchestrates via Paperclip + Hermes for budget + audit.

```mermaid
sequenceDiagram
    autonumber
    participant PC as Paperclip routine<br/>attendance-confirm
    participant SB as Supabase<br/>event.events + bookings
    participant HM as Hermes brain
    participant OC as OpenClaw
    participant TW as Twilio WA Business
    actor T as Ticket holder

    Note over PC: Cron fires T-12h before event.starts_at

    PC->>SB: SELECT event_id WHERE status=live AND starts_at - 12h within 5 min
    SB-->>PC: 1 event - Estereo Picnic 2026

    PC->>HM: Wake with PAPERCLIP_TASK_ID
    HM->>SB: SELECT bookings WHERE event_id AND status=paid AND qr_used_at IS NULL
    SB-->>HM: 4200 unattended bookings
    HM->>HM: Group by user - dedupe multi-ticket buyers

    loop For each unique user
        HM->>OC: MCP openclaw_message_send<br/>WA template asistencia_pre_evento
        OC->>TW: Send template message
        TW-->>T: WhatsApp - Confirmas asistencia manana? Responde SI - NO - TAL VEZ
    end

    Note over T: Voters reply over next 12 hours

    T->>TW: Reply text - SI claro
    TW->>OC: Inbound webhook
    OC->>HM: MCP route inbound<br/>classify intent
    HM->>HM: Gemini 3-flash classify<br/>confirmed - declined - maybe - unclear
    HM->>SB: UPDATE booking SET attendance_intent
    HM->>SB: trio.tool_runs INSERT cost log

    Note over PC: 12 hours later - rollup

    PC->>HM: Wake with summary task
    HM->>SB: COUNT bookings GROUP BY attendance_intent
    SB-->>HM: confirmed=3140 declined=210 maybe=380 no_response=470
    HM->>PC: Post issue comment with rollup
    alt declined or no_response > 15%
        PC->>PC: Escalate to admin priority=high
        PC->>OC: Ping admin via Signal
    else healthy ratio
        PC->>PC: Auto-close routine issue
    end
```

## Acceptance criteria

| Metric | Target |
|---|---|
| Confirmation rate | ≥ 70% (vs ~50% baseline without prompt) |
| Reply classification F1 | ≥ 90% on the 4-label set |
| Cost per event | ≤ $25 (Twilio template + Gemini inference) |
| Time to deliver all prompts | ≤ 15 min from cron fire |

## Notes

- **Why WhatsApp, not phone calls.** Original EventMobi pattern uses voice calls; in Colombia, WhatsApp is dominant and 10× cheaper.
- **Gemini classifier eval.** 200 hand-labeled real Spanish replies tested before production. Ambiguous replies fall back to admin queue.
- **Phase 3 vs Phase 4.** Phase 3 ships the workflow as a single OpenClaw skill + pg_cron, no Hermes/Paperclip. Phase 4 re-orchestrates for governance — Paperclip enforces budget cap, Hermes does sub-agent fan-out for parallel classification.
- **ROI math.** A 5,000-attendee festival saves ~750 confirmed seats from no-show baseline at $25 cost. Per-event ROI is the single best argument for the trio investment.
