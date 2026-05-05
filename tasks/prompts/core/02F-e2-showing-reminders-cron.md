---
id: 02F
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: E2-010 — T-24h / T-1h showing reminders (cron + notifications)
description: "Ships «E2-010 — T-24h / T-1h showing reminders (cron + notifications)» for this epic—full scope in § Prompt below."
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

### Real world — purpose & outcomes

**In one sentence:** Renters and hosts don’t miss showings because the app (and later WhatsApp) reminds them before the visit—like a calendar nudge, not spam.

- **Who it’s for:** Travelers with upcoming tours; ops who need fewer no-shows.
- **Purpose:** Cut missed showings with timely reminders (e.g. T-24h / T-1h) and a clear audit trail.
- **Goals:** Correct timezone handling; dedupe sends; opt-out or quiet hours if product requires it.
- **Features / deliverables:** Cron or scheduled job, query of upcoming showings, delivery channel (in-app first; WA when 08* is ready), logging.

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — MERM-01 promises **time-sensitive** reminders; **E6-004** cron exists for market snapshots but **showing reminders** had no owning task; relying only on **Paperclip heartbeat** stops if agents are down.  
> **Epic index:** [`02E-lead-to-lease-pipeline.md`](02E-lead-to-lease-pipeline.md)

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
| **Goal** | Renters and ops get timely showing reminders (in-app / WA) without duplicate spam. |
| **Workflow** | Cron or scheduled edge → query upcoming showings → send → log / dedupe. |
| **Proof** | Dry-run shows correct recipients; replay does not resend within window. |
| **Gates** | Infobip/08A stable; rate limits respect Infobip caps. |
| **Rollout** | Shadow-send or staging numbers before production WA. |

---

## Prompt

1. **Scheduler:** Use Supabase `pg_cron` (preferred — runs in-DB, no cold starts). Fires **every 30 minutes** to find showings in **confirmed** status with `scheduled_at` (NOT `starts_at` — that column doesn't exist) in the next **24h** and **1h** windows.

2. **Idempotency:** Reminder sends keyed by `(showing_id, reminder_type)` stored in `notifications` table. Before inserting, check: `SELECT 1 FROM notifications WHERE metadata->>'showing_id' = $1 AND metadata->>'reminder_type' = $2`. Skip if exists.

3. **Notifications:** Write to **`notifications`** table (created in E2 prerequisite migration — see 02E). MVP: in-app notifications only. WhatsApp reminders via Infobip are a separate task in 08A/08L — do NOT block this task on E8.

4. **Column name:** The `showings` table uses `scheduled_at` (TIMESTAMPTZ) — NOT `starts_at`. Verify column name before implementing.

## Acceptance criteria

- [ ] Cron or scheduled job documented in `vercel.json` or Supabase dashboard.
- [ ] T-24h and T-1h fires once per showing per window (no spam).
- [ ] Works with **E1** seed showings in staging.
- [ ] **`02E`** epic index lists E2-010 when merged.

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § Suggested additional tasks (E2-010), § Consolidated improvements (6)
