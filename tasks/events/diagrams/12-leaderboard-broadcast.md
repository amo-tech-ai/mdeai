---
id: LEADERBOARD-BROADCAST
phase: CORE
prd_section: 02-openclaw-growth.md §Workflow C, 5.1 Phase 1 ships
type: sequence
related: [01-vote-cast-flow]
---

# 12 — Leaderboard broadcast every 4 hours (sequence)

**What this shows.** OpenClaw's Workflow C — the single OpenClaw automation that ships in Phase 1. Every 4 hours during a live contest, OpenClaw screenshots the leaderboard, writes a Spanish-Paisa caption (English-first AI generation, then localized), and broadcasts to a Medellín WhatsApp Community.

**Phase.** CORE — Phase 1 ships this for Miss Elegance Colombia 2026. Pure outbound; no inbound parsing yet.

```mermaid
sequenceDiagram
    autonumber
    participant CRON as OpenClaw cron<br/>0 every 4h
    participant SUP as Supabase<br/>vote.entity_tally
    participant GM1 as Gemini 3-flash<br/>caption
    participant BR as OpenClaw browser<br/>headless screenshot
    participant ST as Supabase Storage<br/>broadcast_assets
    participant TW as Twilio WA Business
    participant WC as Medellin WA Community<br/>5200 members
    participant PG as pg_cron backstop<br/>same job 5 min later
    participant TR as trio.tool_runs<br/>(Phase 4 only)

    CRON->>SUP: SELECT contests WHERE status=live
    SUP-->>CRON: 1 contest - Miss Elegance Colombia 2026
    CRON->>SUP: SELECT top 5 from entity_tally ORDER BY weighted_total DESC
    SUP-->>CRON: 5 contestants with names + photos + scores

    CRON->>GM1: Compose WA broadcast<br/>en-first then es-CO Paisa-tone<br/><= 300 chars CTA to vote
    GM1-->>CRON: caption JSON with both languages
    Note right of GM1: Reject if invented URL detected

    CRON->>BR: Screenshot mdeai.co/vote/miss-elegance/leaderboard<br/>viewport mobile
    BR-->>CRON: PNG buffer
    CRON->>ST: PUT broadcast_assets/<contest>/<timestamp>.png
    ST-->>CRON: signed URL

    CRON->>TW: Send WA template message<br/>to Community ID
    TW->>WC: Delivered to all members
    WC-->>TW: Read receipts
    TW-->>CRON: 200 OK

    opt Phase 4 trio orchestration enabled
        CRON->>TR: Log run with cost_usd_cents
    end

    Note over CRON,PG: 5 minutes later

    PG->>SUP: SELECT last broadcast for this contest
    SUP-->>PG: timestamp from last run
    alt OpenClaw missed this slot
        Note over PG: Reconciliation - run the same workflow<br/>so contest never has > 4h silence
        PG->>GM1: ...
        PG->>TW: ...
    else OpenClaw delivered
        PG->>PG: Skip - already broadcast within last 4h
    end
```

## Notes

- **Trigger.** Paperclip routine (Phase 4) or simple cron (Phase 1). Same workflow, different orchestrator.
- **Gemini caption rules.** ≤300 chars, English first then Spanish-Paisa, includes vote CTA URL with UTM, rejects any output containing URLs the model invented. Voice quality reviewed weekly by Spanish QA contractor.
- **Why screenshot, not text.** WhatsApp Communities engage 5–8× higher with images. Screenshot shows actual leaderboard rankings — visual social proof.
- **`pg_cron` backstop.** If OpenClaw VPS is down, Supabase pg_cron runs the same job 5 minutes later as reconciliation — never duplicates, never misses a 4h slot.
- **Phase 1 simplification.** Just this one workflow. No outreach (Phase 2). No A6/A7 (Phase 3). No Hermes/Paperclip (Phase 4). The `trio.tool_runs` log is optional in Phase 1 — direct Supabase logging is fine.
