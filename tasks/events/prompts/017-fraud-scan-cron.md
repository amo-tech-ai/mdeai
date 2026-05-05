---
task_id: 017-fraud-scan-cron
diagram_id: FRAUD-DEFENSE-LAYERS
prd_section: 3.1 AI capabilities, 5.2 Risks (vote manipulation)
title: fraud-scan cron edge fn (L5 — Gemini anomaly detection on vote bursts)
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 1.5 days
area: backend
skill:
  - gemini
  - supabase-edge-functions
  - mdeai-project-gates
edge_function: fraud-scan
schema_tables:
  - vote.votes
  - vote.fraud_signals
depends_on:
  - 011-vote-cast-edge-fn
  - 014-hybrid-scoring-trigger
mermaid_diagram: ../diagrams/03-fraud-defense-layers.md
---

## Summary

| Aspect | Details |
|---|---|
| **Layer** | L5 — AI anomaly detection (async, every 60s) |
| **Model** | gemini-3-flash-preview (cheap, fast classification) |
| **Trigger** | pg_cron schedule on Supabase, calls edge fn every minute |
| **Output** | UPDATE `vote.fraud_signals.ai_label` with `bot|collusion|clean` + admin Signal alert on confirmed bot |
| **Real-world** | "Coordinated bot ring detected within 60s of first burst → admin one-tap shadow-block in Signal" |

## Description

**The situation.** L1-L4 catch most attacks synchronously. L5 catches the slow-burn ones: bot rings that ramp gradually, collusion across many accounts, statistically improbable patterns. Without L5, sophisticated attacks slip through.

**Why it matters.** L5 is the "smart" layer — pattern recognition that hand-tuned rules can't match. Combined with admin one-tap shadow-block, it closes the loop on coordinated attacks.

**What already exists.** mdeai already has Gemini integration (`supabase/functions/ai-chat`, `ai-fraud-scan` precedents in landlord product). `ai_runs` table for cost tracking.

**The build.** Edge fn at `supabase/functions/fraud-scan/index.ts` that:
1. Cron-triggered via pg_cron every 60s
2. Pulls last 5 minutes of votes from `vote.votes`
3. Builds feature vector per voter (vote velocity, IP entropy, device-reuse, country mismatch, share-of-burst)
4. Calls Gemini Flash with structured output schema → `{label: 'bot'|'collusion'|'clean', confidence: 0..1, reason: string}`
5. UPDATE `vote.fraud_signals` with `ai_label`, `ai_reason`
6. If high-confidence bot detected → POST webhook to OpenClaw `/hooks/fraud-spike` (task 013) which alerts admin

## Acceptance Criteria

- [ ] Edge fn at `supabase/functions/fraud-scan/index.ts`.
- [ ] pg_cron job configured: `SELECT cron.schedule('fraud-scan', '* * * * *', ...)` calls edge fn every minute.
- [ ] Reads last 5 min of `vote.votes` joined with metadata.
- [ ] Computes feature vector per voter: vote_velocity, ip_entropy, device_reuse_count, country_ip_mismatch, share_of_burst.
- [ ] Calls Gemini Flash with JSON-schema structured output ensuring valid response.
- [ ] Updates `vote.fraud_signals` rows with ai_label + ai_reason.
- [ ] If `confidence > 0.8` AND `label='bot'` → POST to OpenClaw webhook (task 013 endpoint).
- [ ] All Gemini calls logged to `ai_runs(agent_name='fraud-scan', ...)`.
- [ ] Cost cap: max 1 Gemini call per cron tick (~$0.001/call); 1440 calls/day × $0.001 = $1.44/day max.
- [ ] Test scenario: synthetic 50-vote burst from 1 IP → fraud-scan classifies as bot in <60s.
- [ ] Test scenario: 50 organic votes from 50 different households → classified as clean.
- [ ] Eval pass rate: ≥85% F1 on 1,000 hand-labeled vote bursts (200 bot / 100 collusion / 700 clean).

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Edge fn | `supabase/functions/fraud-scan/index.ts` | Create |
| Migration | `supabase/migrations/<timestamp>_fraud_scan_cron.sql` | Create — pg_cron schedule |
| Eval | `supabase/functions/tests/fraud-scan-eval.test.ts` | Create — 1,000 sample fixture set |
| Shared | `supabase/functions/_shared/gemini.ts` | Reuse (existing pattern from ai-chat) |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| No new votes in last 5 min | Edge fn returns early; cost ~$0 |
| Gemini API down | Log error to `ai_runs.status='failed'`; retry next tick |
| Hallucinated response (invalid JSON) | Reject; log; don't mark votes as suspicious |
| Borderline confidence (0.5–0.8) | Mark `ai_label` but DON'T trigger admin alert; wait for next tick to re-evaluate |
| Same voter active across 2 contests | Feature vector per (voter, contest) pair, not global |
| Cron runs twice in 1 minute (rare bug) | Use advisory lock so only one instance runs at a time |

## Real-World Examples

**Scenario 1 — Bot ring detected.** At 20:42 finals night, 73 votes/min from one IP cluster. L4 (IP burst rule) fires for first 5 votes; remaining 68 also flagged. Cron tick at 20:43 reads the burst window. Gemini classifies: label=bot, confidence=0.94, reason="73 votes from 4 IPs in same /24 within 60s; user-agent cluster; all targeting one entity". Webhook to OpenClaw fires. Admin receives Signal: "🚨 73 suspicious votes from cluster X. Auto-shadow-blocked. View issue PAP-481". Admin one-taps approve. Shadow-block applied. **Without L5,** the burst would only have L4 hits — no narrative for admin to act on.

**Scenario 2 — Slow-burn collusion.** Over 30 min, 12 accounts each vote once for Laura, then immediately for the same other 4 entities in same order. L4 doesn't catch (no individual burst). Cron picks up the pattern: same 4-entity sequence across 12 unrelated accounts → collusion. Confidence 0.79, label=collusion. NOT auto-blocked (below 0.8) but flagged in admin dashboard. Admin reviews next morning, decides. **Without L5,** the pattern is invisible.

**Scenario 3 — False positive.** A legitimate Whatsapp Community of 50 friends all votes for Laura within 5 min after Camila shares the link. L4 might flag IP burst from the WiFi router. L5 sees: 50 distinct phones, distinct devices, organic rate (~10 votes/min). Confidence label=clean. **Without L5,** only L4 fires → false-positive shadow-block of legitimate friend group → reputation damage.

## Outcomes

| Before | After |
|---|---|
| Synthetic attacks slip past hand-tuned L4 rules | Gemini pattern recognition catches slow-burn + collusion |
| Admin has to manually inspect every L4 flag | High-confidence bot rings auto-alert via Signal |
| L4 over-flags organic friend-group voting | L5 reconciles; clean label overrides L4 IP-burst when context warrants |
| No cost control on AI fraud detection | $1.44/day max; alerts at $5/day |

## Verification

- Eval test fixtures: 1,000 vote bursts hand-labeled (700 clean, 200 bot, 100 collusion). Run fraud-scan offline; F1 score ≥ 0.85.
- Manual: synthetic 50-vote burst from 1 IP → admin Signal alert within 60s.
- Cost monitor: `ai_runs.cost_usd_cents` for `agent_name='fraud-scan'` summed over 24h ≤ 200 cents ($2).
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/03-fraud-defense-layers.md`](../diagrams/03-fraud-defense-layers.md) — L5 in 5-layer stack
- [`tasks/events/01-contests.md`](../01-contests.md) §6 — anti-fraud strategy
- [`.claude/skills/gemini/`](../../../.claude/skills/gemini/) — Gemini patterns
