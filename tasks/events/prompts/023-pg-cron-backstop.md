---
task_id: 023-pg-cron-backstop
diagram_id: LEADERBOARD-BROADCAST
prd_section: 02-openclaw-growth.md §Workflow C resilience
title: pg_cron backstop function for Workflow C broadcast
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
  - mdeai-project-gates
edge_function: null
schema_tables:
  - vote.contests
  - growth.communications (or simpler audit table)
depends_on:
  - 022-leaderboard-broadcast-skill
mermaid_diagram: ../diagrams/12-leaderboard-broadcast.md
---

## Summary

| Aspect | Details |
|---|---|
| **Mechanism** | pg_cron schedule on Supabase calls a Postgres function 5 min after every 4h boundary |
| **Logic** | Check if last broadcast was within 4h; if not, trigger Workflow C via webhook to OpenClaw HTTP endpoint or direct Twilio + Gemini call |
| **Purpose** | Reconciles missed Workflow C runs (OpenClaw VPS down) so contest never has > 4h silence |
| **Real-world** | "OpenClaw crashed; pg_cron noticed missing broadcast; reconciled within 5 min" |

## Description

**The situation.** Workflow C is the OpenClaw side of broadcasting (task 013). If the VPS goes down, no broadcast for hours. PRD says: "Contest never has > 4h silence."

**Why it matters.** Phase 1 acceptance gate requires "OpenClaw broadcasts WA leaderboard every 4h for 7 consecutive days, no missed slots". Backstop is how we hit that.

**What already exists.** Supabase pg_cron extension (commonly enabled). The fraud-scan cron from task 008 sets the pattern.

**The build.** A pg_cron schedule that runs `0,5 */4 * * *` (every 4h boundary AND 5min after) — calls a function that checks "was a broadcast logged in last 4h for this live contest?". If yes, return early. If no, trigger Workflow C inline (via Postgres `http` extension calling Twilio + Gemini directly, OR via webhook to OpenClaw VPS).

## Acceptance Criteria

- [ ] pg_cron extension enabled (verify via `SELECT * FROM pg_extension WHERE extname='pg_cron'`).
- [ ] pg_net or http extension enabled for outbound HTTP from Postgres.
- [ ] Function `vote.broadcast_backstop()` created.
- [ ] Schedule: `cron.schedule('vote-backstop', '5 0,4,8,12,16,20 * * *', 'SELECT vote.broadcast_backstop()')`.
- [ ] Function logic:
  1. SELECT contests WHERE status='live'.
  2. For each, SELECT MAX(created_at) FROM growth.communications WHERE contest_id = $ AND channel='whatsapp_community'.
  3. If MAX < (NOW() - interval '4 hours 10 minutes'): trigger broadcast.
  4. Trigger via either: (a) HTTP POST to OpenClaw VPS endpoint `/hooks/trigger-broadcast`, OR (b) inline Twilio + Gemini calls via supabase-functions.
- [ ] Backstop is idempotent — running twice within 4h does NOT cause double broadcast.
- [ ] Logs to `growth.communications` with `source='pg_cron_backstop'` flag for distinguishability.
- [ ] Failure modes: HTTP timeout, Twilio 5xx, Gemini 5xx → log to `ai_runs.status='failed'`; alert admin via separate channel.
- [ ] Test scenario: stop OpenClaw VPS for 5h → backstop fires once, broadcast goes out, no duplicate.
- [ ] Cost: backstop runs add ~$0.05 per missed-broadcast trigger ($1.50/mo at most).

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Migration | `supabase/migrations/<timestamp>_broadcast_backstop.sql` | Create — function + cron schedule |
| Extension | pg_cron, pg_net | Enable via SQL or dashboard |
| HTTP target | OpenClaw VPS or direct Twilio | Configure `BROADCAST_BACKSTOP_TARGET` |
| Test | pgTAP: simulate stale `last_broadcast` → function fires | Add to migration |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| OpenClaw fired at 18:00, backstop checks at 18:05 | last_broadcast IS recent → skip (no double) |
| OpenClaw VPS down 18:00 → 22:30 | 18:05 backstop fires; 22:05 backstop fires; 22:35 OpenClaw recovers + idempotency check skips |
| Backstop's HTTP call fails (Twilio 503) | Retry with backoff; log final failure; admin alert |
| Two contests live simultaneously | Loop processes each independently |
| pg_cron on shared Supabase instance hits concurrency limit | Schedule uses `5 0,4,8,12,16,20 * * *` (off-peak minute, infrequent) — minimal contention |
| Backstop accidentally runs same minute as OpenClaw | Advisory lock at function entry: `pg_try_advisory_lock(<key>)`; second call skips |

## Real-World Examples

**Scenario 1 — Disaster recovery.** OpenClaw VPS crashes Wednesday 17:30. No broadcast at 18:00. Backstop runs at 18:05, sees last broadcast at 14:00 (>4h ago), triggers via webhook to a fallback Vercel edge endpoint that calls Twilio + Gemini directly. Broadcast goes out at 18:09. Admin gets alert: "Backstop fired due to OpenClaw silence". OpenClaw recovers by 22:00. 22:05 backstop sees last broadcast was 18:09 (within 4h) → skip. **Without backstop,** Wednesday's contest goes 8 hours without an update.

**Scenario 2 — Idempotent normal day.** OpenClaw fires at 18:00:00. Logs to `growth.communications`. Backstop fires at 18:05:00. Reads MAX(created_at) for this contest = 18:00:00, which is within 4h. Returns early. Cost: ~$0 (just one Postgres query). **Without idempotency,** every 4h cycle would have a double broadcast.

**Scenario 3 — Stale schedule.** Contest just went live at 17:30. Backstop runs at 18:05; no prior broadcasts; threshold check says "last_broadcast IS NULL" → first broadcast. **Without first-broadcast handling,** contests would wait until 22:00 for first WA visibility — losing 4.5 hours of momentum.

## Outcomes

| Before | After |
|---|---|
| OpenClaw VPS = single point of failure | pg_cron resilience covers VPS downtime |
| Manual recovery required when VPS crashes | Auto-recovery within 5 min |
| Phase 1 gate "no missed slots" at risk | 7-day soak test passes even with synthetic VPS outages |

## Verification

- pgTAP test: insert stale last_broadcast → backstop function returns "would trigger"; verify trigger path called.
- Manual chaos test: stop OpenClaw VPS for 5 hours; backstop fires twice; broadcast lands; OpenClaw recovers without double-firing.
- 7-day soak: 42 broadcasts total; ≤2 from backstop (acceptable as VPS uptime > 95%).
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/12-leaderboard-broadcast.md`](../diagrams/12-leaderboard-broadcast.md) — backstop in sequence
- [`.claude/skills/supabase-postgres-best-practices/`](../../../.claude/skills/supabase-postgres-best-practices/) — pg_cron + advisory locks
