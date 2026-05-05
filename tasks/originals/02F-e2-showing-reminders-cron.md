---
id: 02F
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: E2-010 — T-24h / T-1h showing reminders (cron + notifications)
skills:
  - supabase/supabase-edge-functions
  - mdeai-tasks
epic: E2
phase: CORE
priority: P1
status: Open
owner: Backend
dependencies:
  - E2-002
estimated_effort: M
percent_complete: 0
outcome: O2
---

# E2-010: Showing reminders — scheduled T-24h / T-1h

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — MERM-01 promises **time-sensitive** reminders; **E6-004** cron exists for market snapshots but **showing reminders** had no owning task; relying only on **Paperclip heartbeat** stops if agents are down.  
> **Epic index:** [`02E-lead-to-lease-pipeline.md`](02E-lead-to-lease-pipeline.md)

## Prompt

1. **Scheduler:** Vercel Cron, Supabase `pg_cron`, or edge `schedule` — fires **at least hourly** to find showings in **confirmed** state with `starts_at` in the next **24h** and **1h** windows.

2. **Idempotency:** Reminder sends keyed by `(showing_id, reminder_type)` so retries do not duplicate notifications.

3. **Notifications:** Write to **`notifications`** table (and push/email if wired). Optional: when **[`08B`](08B-openclaw-whatsapp-adapter.md)** exists, enqueue OpenClaw outbound per **08F** ingress — do not block E2-010 on E8.

4. **MERM-03 alignment:** Host WhatsApp ping remains **E5-007 + E8**; this task covers **reliable server-side** reminders first.

## Acceptance criteria

- [ ] Cron or scheduled job documented in `vercel.json` or Supabase dashboard.
- [ ] T-24h and T-1h fires once per showing per window (no spam).
- [ ] Works with **E1** seed showings in staging.
- [ ] **`02E`** epic index lists E2-010 when merged.

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § Suggested additional tasks (E2-010), § Consolidated improvements (6)
