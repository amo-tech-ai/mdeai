---
task_id: 011-vote-cast-edge-fn
diagram_id: VOTE-CAST-FLOW
prd_section: 2.2 Epic E1.1, 4.4 vote-cast endpoint
title: Implement vote-cast edge function (Turnstile + nonce + rate limit + idempotency + L4 sync rules)
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 2 days
area: backend
skill:
  - supabase-edge-functions
  - gemini
  - mdeai-project-gates
edge_function: vote-cast
schema_tables:
  - vote.votes
  - vote.entity_tally
  - vote.fraud_signals
  - rate_limit_hits
depends_on:
  - 010-vote-schema
  - 015-cloudflare-turnstile
  - 016-phone-otp
mermaid_diagram: ../diagrams/01-vote-cast-flow.md
---

## Summary

| Aspect | Details |
|---|---|
| **Endpoint** | `POST /vote-cast` |
| **Layers integrated** | L1 (Turnstile), L2 (nonce JWT), L3 (DB constraints), L4 (sync behavioral rules), L5 (queued for fraud-scan cron) |
| **Latency budget** | < 300ms for clean votes, < 500ms p95 |
| **Output** | `{success: true, data: {tally_snapshot}}` or `{success: false, error: {code, message}}` |
| **Real-world** | "Camila taps Vote — vote registers in <300ms, leaderboard ticks via Realtime within 2s" |

## Description

**The situation.** The `vote.*` schema exists (task 010), but no API endpoint accepts votes. The `/vote/:slug` page (task 012) needs an edge function to call. Without `vote-cast`, voting is impossible.

**Why it matters.** This is the most critical edge function in Phase 1 — every voter hits it, every fraud attempt hits it, every Realtime tick depends on it. Performance, correctness, and security here define platform trust.

**What already exists.** mdeai has the `_shared/cors.ts` and rate-limit patterns from existing edge fns (e.g. `supabase/functions/lead-from-form/`, `supabase/functions/p1-crm/`). The durable rate limiter from `20260423120000_durable_rate_limiter.sql` is exactly what L4 needs. The pattern from `_shared/rate-limit.ts` shows how to call `check_rate_limit` RPC.

**The build.** One Deno edge function at `supabase/functions/vote-cast/index.ts` that:
1. Verifies CORS preflight
2. Verifies Turnstile token (L1) — calls Cloudflare verify endpoint
3. Verifies nonce JWT (L2) — signed at page render, 60s TTL, single-use
4. Calls `check_rate_limit` RPC (L4 part 1) — IP burst, user quota
5. Validates body via Zod schema
6. Synchronous L4 rules — IP entropy, device hash repeat, country mismatch (<30ms)
7. INSERT vote with `idempotency_key UNIQUE` — Postgres handles dedup
8. Trigger fires entity_tally update + L5 fraud signal queueing
9. Returns success with current tally for frontend to display optimistically

**Example.** Camila taps Vote on Laura's contestant card. Frontend POSTs `{contest_id, entity_id, nonce, fingerprint, idempotency_key}`. Edge fn verifies Turnstile, validates nonce, checks 1/day quota, runs L4 rules (clean), INSERTs vote, returns `{success: true, data: {entity_tally: {audience_votes: 18, weighted_total: 0.63, rank: 3}}}`. Realtime channel broadcasts the tally update; Camila's leaderboard ticks Laura from #4 to #3.

## Rationale

**Problem.** Voting needs an endpoint that's fast, secure, and idempotent. Direct DB INSERT from frontend would expose service role and skip fraud checks.
**Solution.** Single edge function with 5-layer fraud enforcement, idempotent INSERT, and atomic tally update via trigger.
**Impact.** Voters experience 1-tap voting; fraud attempts get rejected; Realtime ticks the leaderboard within 2s of every clean vote.

## User Stories

| As a... | I want to... | So that... |
|---|---|---|
| Voter (Camila) | tap Vote and see immediate confirmation | I trust the platform |
| Voter | retry a failed vote and not double-count | reliability matters even on bad networks |
| Fraud actor | NOT be able to bypass any layer | platform credibility survives |
| Engineer | observe every vote's L4/L5 status in `vote.fraud_signals` | I can debug fraud incidents |

## Goals

1. **Primary:** Voter can cast a free vote in <300ms p50.
2. **Security:** All 5 layers enforced; no path bypasses any layer.
3. **Idempotency:** Same `idempotency_key` returns 200 OK without duplicate count.

## Acceptance Criteria

- [ ] Edge fn at `supabase/functions/vote-cast/index.ts` with Deno entry point.
- [ ] Verifies CORS preflight.
- [ ] Validates body with Zod schema: `{contest_id: uuid, entity_id: uuid, nonce: string, fingerprint: string, idempotency_key: uuid}`.
- [ ] Verifies Turnstile token via Cloudflare verify endpoint (passes with valid token, 403 with invalid).
- [ ] Verifies nonce JWT — signed by service role, 60s TTL, contains `contest_id` claim. Reject if expired, mismatched, or replayed.
- [ ] Calls `check_rate_limit` RPC with bucket key `vote-cast:{user_id_or_anon_id}`. Returns 429 if exceeded.
- [ ] Daily-quota check: SELECT COUNT(*) FROM vote.votes WHERE voter_user_id=$1 AND contest_id=$2 AND created_at > today_start. If >= contest.free_votes_per_user_per_day, return 409.
- [ ] Synchronous L4 rules: IP burst (<5/min/IP), device hash uniqueness (<3 distinct accounts/device/24h), country/IP mismatch via cf-ipcountry header.
- [ ] On L4 flag, INSERT vote with `fraud_status='suspicious'` + INSERT fraud_signals row with `rules_hit` array. Vote still counted but `weight` set by trigger.
- [ ] INSERT vote with `idempotency_key`. On UNIQUE conflict, return 200 with `already_counted: true`.
- [ ] Returns `{success: true, data: {tally: <updated entity_tally>}}` for clean votes.
- [ ] Returns structured error for all failure modes per `edge-function-patterns.md`.
- [ ] Logs every call to `ai_runs` for L5 fraud-scan auditability (agent_name='vote-cast').
- [ ] Latency budget verified: p50 <300ms, p95 <500ms across 1,000 synthetic clean votes.

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Edge fn | `supabase/functions/vote-cast/index.ts` | Create |
| Shared | `supabase/functions/_shared/cors.ts` | Reuse |
| Shared | `supabase/functions/_shared/rate-limit.ts` | Reuse (calls check_rate_limit RPC) |
| Shared | `supabase/functions/_shared/turnstile.ts` | Create (Cloudflare verify wrapper) |
| Shared | `supabase/functions/_shared/nonce.ts` | Create (JWT issue + verify with service-role secret) |
| Hook | `src/hooks/useVoteCast.ts` | Create (frontend wrapper, fetch wrapper with idempotency_key generation) |
| Test | `supabase/functions/tests/vote-cast.test.ts` | Create — 12 test cases below |

## Schema dependencies

Reuses these tables from task 010:
- `vote.votes` — INSERT target
- `vote.entity_tally` — read for response payload
- `vote.fraud_signals` — INSERT on L4 flag
- `vote.contests` — read `free_votes_per_user_per_day`, `status='live'`
- `rate_limit_hits` — via `check_rate_limit` RPC

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Same idempotency_key replayed within 24h | Return 200 OK with `already_counted: true`; do NOT increment tally |
| Voter passes Turnstile + nonce but is on rate-limited IP | Return 429 with retry-after header |
| Phone OTP not verified yet | Return 401 with code `phone_otp_required` |
| Contest is `status='closed'` | Return 410 with code `contest_closed` |
| Contest is `status='draft'` | Return 404 with code `contest_not_found` (don't leak draft status) |
| Suspicious vote (L4 flagged) | Vote still INSERTed but with `weight=0` via trigger; row in `fraud_signals` |
| Network drops mid-INSERT but client retries with same key | Postgres UNIQUE handles dedup; return 200 with same tally |
| Voter's daily quota exhausted | Return 409 with code `daily_quota_exceeded`, suggest share-bonus path |
| Frontend sends invalid UUID for entity_id | Zod rejects with 400, no DB query |

## Real-World Examples

**Scenario 1 — Camila votes successfully.** Camila is verified (phone OTP from task 016), lands on `/vote/miss-elegance-colombia-2026`, taps Vote on Laura's card. Frontend has nonce JWT issued at page render. POSTs to vote-cast. Turnstile valid; nonce valid; daily quota fresh; L4 rules clean. INSERT succeeds. Trigger updates `entity_tally`. Response in 240ms. Realtime broadcasts. Leaderboard updates. **Without this edge fn,** voting is impossible.

**Scenario 2 — Bot ring attacks finals night.** A coordinated bot ring tries 5,000 votes from 12 IPs within 60 seconds. L1 (Turnstile) catches 80% — datacenter IPs. The remaining 1,000 reach L2 (nonce verify) — 90% rejected because they didn't render the page. The 100 that pass L2 trigger L4 IP-burst rules — `fraud_signals.rules_hit=['ip_burst']`, `weight=0`, vote stored but tally unaffected. **Without this edge fn,** the bot ring inflates Laura's count and triggers public scandal.

**Scenario 3 — Bad network, retry storm.** Camila's WiFi drops. Frontend retries 3 times with same `idempotency_key`. Each retry hits the UNIQUE index, returns 200 already_counted. **Without idempotency,** Camila's vote counts 3 times and Daniela has to manually clean up post-event.

## Outcomes

| Before | After |
|---|---|
| No way to cast a vote | Voters cast in <300ms with full 5-layer fraud defense |
| Frontend would expose service role | Edge fn enforces all auth + L1-L4 server-side |
| Network flakiness causes double-votes | Idempotency_key UNIQUE prevents all dupes |
| Fraud attempts inflate tally | L4 flagged votes have weight=0; tally stays clean |

## Verification

- 1,000 synthetic clean votes: all pass with p50 <300ms.
- 100 synthetic Turnstile-failing votes: all return 403.
- 100 synthetic replays of one idempotency_key: 1 INSERT, 99 already_counted.
- 50 synthetic IP-burst from same IP within 60s: first 5 clean, next 45 flagged.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/01-vote-cast-flow.md`](../diagrams/01-vote-cast-flow.md) — sequence diagram
- [`tasks/events/diagrams/03-fraud-defense-layers.md`](../diagrams/03-fraud-defense-layers.md) — L1-L5 reference
- [`.claude/rules/edge-function-patterns.md`](../../../.claude/rules/edge-function-patterns.md) — request lifecycle
- [`supabase/migrations/20260423120000_durable_rate_limiter.sql`](../../../supabase/migrations/20260423120000_durable_rate_limiter.sql) — rate limit RPC
