---
task_id: 021-openclaw-vps-provision
diagram_id: LEADERBOARD-BROADCAST
prd_section: 02-openclaw-growth.md §Phase 1
title: Provision OpenClaw VPS + pair to admin Signal/Telegram
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 0.5 day
area: devops
skill:
  - open-claw
  - mdeai-project-gates
edge_function: null
schema_tables: []
depends_on: []
mermaid_diagram: ../diagrams/12-leaderboard-broadcast.md
---

## Summary

| Aspect | Details |
|---|---|
| **Provider** | Hetzner CX22 ($20/mo) or Hostinger 1-click OpenClaw |
| **OS** | Ubuntu 22.04 LTS or 24.04 LTS |
| **Channel** | Admin paired to Signal (preferred — E2E) or Telegram (fallback) |
| **Setup time** | ~3 hours for first-time install + pairing |
| **Real-world** | "VPS running OpenClaw daemon, admin gets fraud alerts on Signal within 60s of synthetic burst" |

## Description

**The situation.** Phase 1 needs ONE OpenClaw VPS running Workflow C (4-hourly leaderboard broadcast). No infrastructure exists yet.

**Why it matters.** Without OpenClaw, no broadcast = no virality during contest. Phase 1 gate requires 7-day broadcast soak.

**What already exists.** `tasks/openclaw/links.md` has installation links. mdeai's prior research in `tasks/events/02-openclaw-growth.md` documents recommended VPS specs. The `open-claw` skill has full operational reference.

**The build.** Spin up VPS, install OpenClaw, pair admin device to channels (Signal + Telegram), test heartbeat, configure persistent service.

## Acceptance Criteria

- [ ] VPS provisioned: 2 vCPU, 4GB RAM, 50GB SSD, public IP.
- [ ] Ubuntu LTS installed, SSH key access, firewall (ufw) allowing only 22, 80, 443.
- [ ] OpenClaw installed via `curl -fsSL https://openclaw.ai/install.sh | bash`.
- [ ] `openclaw doctor` returns all green.
- [ ] Gateway daemon configured as systemd service: `openclaw gateway install`.
- [ ] Daemon starts on boot, restarts on crash.
- [ ] Admin paired to **Signal** channel (E2E preferred): `openclaw channels add --channel signal`; phone scan QR; verified.
- [ ] Admin paired to **Telegram** channel as fallback: `openclaw channels add --channel telegram --token $BOT_TOKEN`.
- [ ] DM allowlist set: only admin's verified phone number can DM the agent (`openclaw config set channels.signal.allowFrom '["+57..."]'`).
- [ ] `openclaw status` shows gateway running, both channels live, model provider responsive.
- [ ] Send-test: `openclaw agent --message "ping"` returns response within 5s on both channels.
- [ ] Heartbeat configured: every 6h to admin: "✅ OpenClaw VPS healthy, last broadcast $TIME ago".
- [ ] Secrets in `~/.openclaw/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (scoped to `growth.*`), `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `GEMINI_API_KEY`.
- [ ] OpenTelemetry observability piped to Sentry or Grafana Cloud free tier (optional but recommended).
- [ ] Backup: VPS snapshot scheduled weekly (provider-side).
- [ ] DNS: optional `openclaw.mdeai.co` CNAME for dashboard access (Cloudflare proxy).
- [ ] Cost: $20–$40/mo total (VPS + DNS + Twilio token usage tracked separately).

## Wiring Plan

| Layer | What | Action |
|---|---|---|
| Infra | Hetzner / Hostinger | Provision VPS |
| OS | Ubuntu LTS | Install + harden |
| App | OpenClaw via install.sh | Install |
| Channels | Signal + Telegram | Pair + configure |
| Service | systemd | Enable + boot |
| Secrets | ~/.openclaw/.env | Configure |
| Monitoring | OpenTelemetry → Sentry | Optional |
| Docs | `tasks/events/runbooks/openclaw-vps.md` | Create runbook (creation, recovery, rotation) |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| VPS crashes overnight | systemd restart; Workflow C catches up via pg_cron backstop (task 014) |
| Signal pairing breaks (phone reset) | Re-pair; admin alerted via Telegram fallback |
| Twilio account suspended | OpenClaw retries with exponential backoff; alerts admin via Signal |
| OpenClaw version upgrade has breaking change | `openclaw update --dry-run` first; rollback procedure documented in runbook |
| Disk fills up (logs grow) | Logrotate configured; log retention 30 days |
| Service-role JWT leaked | Rotate Supabase service key; update `.env`; restart daemon |

## Real-World Examples

**Scenario 1 — Initial setup.** Engineer SSHs into fresh Hetzner VPS. Runs OpenClaw install (~10 min). Configures Signal pairing — scans QR from phone. Tests with `openclaw agent --message "ping"` from Signal — gets reply. Configures `.env` secrets. Reboots VPS to verify systemd auto-start. Total: 2.5 hours including DNS + monitoring. **Without VPS**, no broadcast = no Phase 1 acceptance.

**Scenario 2 — Recovery from disk full.** Logs filled disk overnight. Daemon stopped. Heartbeat missed at 6am. Admin not alerted (channel down). Admin notices missing broadcast at 11am. SSHs in, frees space, restarts daemon. pg_cron backstop (task 014) had already fired the missed broadcasts. **Without backstop,** 5 hours of silence on Phase 1 demo contest.

**Scenario 3 — Token leak detection.** Internal audit shows OpenClaw service-role JWT was exposed in a forum post. Engineer rotates Supabase service key, updates `.env`, restarts daemon. All channels re-authenticate. **Without rotation,** attacker could impersonate the bot for hours.

## Outcomes

| Before | After |
|---|---|
| No VPS = no broadcast capability | Phase 1 broadcasts can run 24/7 |
| Manual leaderboard updates by community manager | Automated every 4h |
| No monitoring | OpenTelemetry + heartbeat + Signal alerts on issues |
| Single point of failure | pg_cron backstop covers downtime |

## Verification

- `openclaw doctor` returns all green.
- Heartbeat fires every 6h to admin Signal.
- Synthetic test: stop daemon → 6h heartbeat missed → admin gets Telegram fallback alert.
- VPS reboot test: daemon comes up automatically; `openclaw status` shows running within 30s.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/12-leaderboard-broadcast.md`](../diagrams/12-leaderboard-broadcast.md) — Workflow C
- [`tasks/openclaw/links.md`](../../openclaw/links.md) — official docs
- [`.claude/skills/open-claw/`](../../../.claude/skills/open-claw/) — operational reference
