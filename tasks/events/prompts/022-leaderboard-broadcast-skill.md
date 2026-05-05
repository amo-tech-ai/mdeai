---
task_id: 022-leaderboard-broadcast-skill
diagram_id: LEADERBOARD-BROADCAST
prd_section: 02-openclaw-growth.md §Workflow C, 5.1 Phase 1 ships
title: OpenClaw Workflow C skill (4-hourly leaderboard broadcast to WhatsApp Community)
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 2 days
area: backend
skill:
  - open-claw
  - twilio-whatsapp
  - gemini
  - mdeai-project-gates
edge_function: null
schema_tables:
  - vote.entity_tally
  - vote.contests
  - growth.communications (for logging — task 002 of growth schema, but we can stub the log here)
depends_on:
  - 010-vote-schema
  - 014-hybrid-scoring-trigger
  - 021-openclaw-vps-provision
mermaid_diagram: ../diagrams/12-leaderboard-broadcast.md
---

## Summary

| Aspect | Details |
|---|---|
| **Skill location** | `~/.openclaw/skills/leaderboard-broadcast/SKILL.md` (on VPS from task 012) |
| **Trigger** | OpenClaw cron `0 */4 * * *` (every 4 hours) |
| **Steps** | Read tally → Gemini caption → screenshot → Twilio WA Community broadcast |
| **Disclosure** | "Patrocinado por X" subtitle if sponsor present |
| **Real-world** | "Every 4 hours, Medellín WA Community sees a leaderboard screenshot with hot CTA to vote" |

## Description

**The situation.** OpenClaw VPS exists (task 012). Schema + tally exist (tasks 001 + 005). No broadcast skill yet — VPS is provisioned but idle.

**Why it matters.** This is THE Phase 1 OpenClaw workflow. Without it, contest virality dies after launch day.

**What already exists.** OpenClaw has built-in cron, Gemini provider, Twilio bridge, headless browser. The `02-openclaw-growth.md` doc has the full Workflow C spec.

**The build.** A new OpenClaw skill at `~/.openclaw/skills/leaderboard-broadcast/SKILL.md` that:
1. Reads `vote.contests WHERE status='live'` via Supabase
2. For each, queries top-5 from `vote.entity_tally`
3. Calls Gemini Flash with es-CO Paisa-friendly tone instructions, includes vote URL with UTM
4. Headless-browser screenshots `https://mdeai.co/vote/<slug>/leaderboard?embed=true` viewport mobile
5. Sends to configured WhatsApp Community via Twilio with caption + screenshot
6. Logs to `trio.tool_runs` (or simpler — to a `growth.communications` row)

## Acceptance Criteria

- [ ] Skill folder + `SKILL.md` at `~/.openclaw/skills/leaderboard-broadcast/`.
- [ ] Cron trigger: `0 */4 * * *` (every 4h).
- [ ] Gates: only run when `vote.contests.status='live'` AND `now() BETWEEN starts_at AND ends_at`.
- [ ] Gemini prompt: en first then es-CO; ≤300 chars; includes vote URL with UTM `?utm_source=wa&utm_medium=community&utm_campaign=<contest_slug>`.
- [ ] Reject Gemini output containing URLs the model invented (regex `https?://` validation against allowlist).
- [ ] Screenshot via OpenClaw browser plugin: viewport 360×640 (mobile), wait for Realtime to settle, capture as PNG.
- [ ] Save screenshot to Supabase Storage `broadcast_assets/<contest>/<timestamp>.png`.
- [ ] Send via Twilio WA template `leaderboard_broadcast_v1` (template approved separately).
- [ ] Configurable target: env vars or skill config: `WA_COMMUNITY_ID`, `CONTEST_SLUG_FILTER` (optional — defaults to all live contests).
- [ ] Send to ONE community per skill instance; for multiple contests run parallel skills.
- [ ] Log every run: timestamp, contest_id, top_5_snapshot, gemini_cost_cents, twilio_cost_cents.
- [ ] On error (Gemini 5xx, Twilio 5xx, screenshot timeout): retry once with exponential backoff; on final fail, alert admin via Signal.
- [ ] No-op if no contests live (don't send blank).
- [ ] 7-day soak test: 42 broadcasts run, ≥ 95% successful (≤2 failures acceptable).
- [ ] Each broadcast costs ≤ $0.05 ($0.005 Gemini + $0.005 Twilio + $0.005 Supabase).

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| OpenClaw skill | `~/.openclaw/skills/leaderboard-broadcast/SKILL.md` | Create on VPS |
| OpenClaw skill | `~/.openclaw/skills/leaderboard-broadcast/scripts/run.sh` | Create — actual workflow logic |
| Supabase | Storage bucket `broadcast_assets` | Create + RLS service-role-only |
| Twilio | WA Business template `leaderboard_broadcast_v1` | Submit + await Meta approval (3-7d) |
| WhatsApp | Create Community + invite admin | Set `WA_COMMUNITY_ID` env |
| Test | Manual `openclaw agent --message "trigger leaderboard-broadcast"` | One-off run |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Cron fires while previous run still in progress | Advisory lock prevents concurrent execution |
| WhatsApp Community has 5,000+ members (Twilio limit varies) | Twilio handles; if rate-limited, retry with backoff |
| Contest has < 5 entities | Show whatever we have; pad with "más candidatas pronto" |
| Gemini hallucinated CTA URL | Reject; fall back to `https://mdeai.co/vote/<slug>` (canonical) |
| Screenshot timeout (browser slow) | 30s timeout; on fail, send text-only broadcast |
| Twilio account flagged as spam | Stop broadcast cron; alert admin |
| pg_cron backstop ALSO fires within 5 min | Workflow C reads "last broadcast" — if recent, skip |

## Real-World Examples

**Scenario 1 — Normal 4-hour cycle.** 18:00 ART. Cron fires. Skill reads `miss-elegance-colombia-2026` is live. Top 5: Laura, María, Ana, Sofia, Camila with current scores. Gemini generates: "🌹 Top 5 con 3 días para cerrar la votación — vota ya: mdeai.co/vote/miss-elegance-2026?utm_source=wa". Screenshot mobile-portrait of leaderboard. Send to Medellín Pageant Community (3,200 members) via WA template. 18:00:42 — broadcast delivered. Log row in `growth.communications`. **Without this workflow,** community manager manually crops + posts every 4h.

**Scenario 2 — pg_cron backstop fires.** OpenClaw VPS crashed at 17:55. Cron didn't fire at 18:00. pg_cron backstop (task 014) fires at 18:05. Same workflow runs from inside Postgres edge fn. Broadcast goes out at 18:08 with "Broadcast delayed slightly due to system maintenance" prefix. **Without backstop,** 4-hour silence breaks viral momentum.

**Scenario 3 — Sponsor logo overlay.** Postobón has Premium event-level sponsorship (Phase 2 future). Skill reads `sponsor.placements WHERE surface='wa_broadcast' AND active=true`. Logo composited bottom-right of screenshot. Caption appended "Patrocinado por Postobón". **Without sponsor support,** brand value of broadcast is unrealized.

## Outcomes

| Before | After |
|---|---|
| No automated broadcast → manual community management | Every 4h auto-broadcast with leaderboard screenshot |
| Caption quality varies, voice drift risk | Gemini en-first es-CO Paisa tone; URL allowlist prevents hallucination |
| No backup if VPS crashes | pg_cron reconciles within 5 min |
| Sponsor exposure invisible | Phase 2 surface ready (logo overlay) |

## Verification

- 7-day soak test: 42 cron firings, ≥ 40 successful broadcasts.
- Manual: trigger one broadcast end-to-end; confirm in WA Community.
- Logs: `growth.communications` row inserted per broadcast.
- Cost analysis: total broadcast cost over 7 days ≤ $1.50.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/12-leaderboard-broadcast.md`](../diagrams/12-leaderboard-broadcast.md) — full sequence
- [`tasks/events/02-openclaw-growth.md`](../02-openclaw-growth.md) §Workflow C
- [`.claude/skills/open-claw/`](../../../.claude/skills/open-claw/) — skill authoring patterns
- [`.claude/skills/twilio-whatsapp/`](../../../.claude/skills/twilio-whatsapp/) — WA template patterns
