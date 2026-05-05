---
task_id: 013-realtime-leaderboard
diagram_id: VOTE-CAST-FLOW
prd_section: 2.2 E1.1 (Realtime <2s requirement)
title: Realtime leaderboard subscription wiring (postgres_changes → frontend)
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 1 day
area: frontend
skill:
  - supabase
  - frontend-design
  - mdeai-project-gates
edge_function: null
schema_tables:
  - vote.entity_tally
depends_on:
  - 012-vote-page-mobile
mermaid_diagram: ../diagrams/01-vote-cast-flow.md
---

## Summary

| Aspect | Details |
|---|---|
| **Trigger** | Postgres trigger on `vote.entity_tally` UPDATE → Supabase Realtime broadcast |
| **Subscription** | `useRealtimeTally(contest_id)` hook in `/vote/:slug` page |
| **Latency target** | UI tick within 2s of vote landing in DB |
| **Real-world** | "Camila votes; Laura's prima sees the +1 within 2 seconds without refreshing" |

## Description

**The situation.** Vote-cast (task 011) writes to `vote.votes`; trigger updates `vote.entity_tally`. The frontend (task 012) reads tally on first paint but doesn't see updates without page refresh.

**Why it matters.** "Live leaderboard" is in the PRD as a P0 differentiator. Without it, the platform feels static; voters refresh manually; viral momentum stalls.

**What already exists.** mdeai has `src/hooks/useRealtimeChannel.ts` (existing pattern). Supabase Realtime is enabled. The trigger from task 014 already broadcasts on `entity_tally` UPDATE.

**The build.** A new hook `useRealtimeTally(contest_id)` that subscribes to `postgres_changes` on `vote.entity_tally` filtered by contest_id, parses incoming payloads, and updates a Map keyed by entity_id in TanStack Query cache. The hook is consumed by `/vote/:slug` page (task 012) and any leaderboard component.

**Example.** Camila votes for Laura. Trigger fires; entity_tally row UPDATEs (audience_votes 287→288, rank 4→3). Realtime publishes to channel `vote:contest:{contest_id}`. All open browsers subscribed see the event in <2s and re-render the affected rows.

## Rationale

**Problem.** Static leaderboards undermine "live" platform claim.
**Solution.** Real-time UPDATE broadcast with optimistic-update reconciliation.
**Impact.** Voters see their vote land within 2s; share-loop momentum builds organically.

## User Stories

| As a... | I want to... | So that... |
|---|---|---|
| Voter | see my vote land on the public leaderboard | I trust the count is real |
| Voter watching with friends | see their votes too without refreshing | the moment feels social |
| Engineer | not have to write polling loops | code stays simple |

## Goals

1. **Primary:** Tally update visible in UI within 2s of vote-cast 200 response.
2. **Quality:** Reconnects automatically on network drop.
3. **Efficiency:** One subscription per contest_id, regardless of how many components read.

## Acceptance Criteria

- [ ] Hook `src/hooks/useRealtimeTally.ts` subscribes to `postgres_changes` event=UPDATE on schema=vote table=entity_tally with filter `contest_id=eq.{id}`.
- [ ] Hook updates TanStack Query cache key `['contest-tally', contest_id]` on each event.
- [ ] Multiple components reading the same contest get one shared subscription (idempotent via Query cache or single channel manager).
- [ ] Subscription is created on mount, torn down on unmount, with no zombie listeners.
- [ ] Reconnection on network drop is automatic (Supabase JS client handles).
- [ ] Visible reconnect indicator if disconnected > 5s.
- [ ] After reconnect, fetch latest tally to reconcile any missed events.
- [ ] Optimistic update from `useVoteCast` is reconciled with Realtime event when it arrives (no double-count in UI).
- [ ] Verified manually: open page in 2 browsers, vote in browser A, see browser B tick within 2s.

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Hook | `src/hooks/useRealtimeTally.ts` | Create |
| Page integration | `src/pages/contest/Vote.tsx` | Modify — wire hook |
| Existing pattern | `src/hooks/useRealtimeChannel.ts` | Read — reuse pattern |
| Test | `src/hooks/useRealtimeTally.test.tsx` | Create |

## Schema dependencies

- `vote.entity_tally` (task 010)
- Trigger on `vote.votes` insert that updates `entity_tally` (task 014)

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Network drops mid-session | Show reconnecting badge; auto-reconnect; re-fetch on reconnect |
| Voter's optimistic update arrives before Realtime event | Reconcile by entity_id key (latest server value wins) |
| Voter's optimistic update arrives AFTER Realtime tick (already counted) | Detect via UNIQUE idempotency_key; skip optimistic +1 |
| Massive surge (100 votes/sec at finals) | Realtime queues + delivers; UI batches updates per 100ms; no individual jitter |
| Page open in background tab | Realtime continues; tab focus triggers full re-fetch to recover any missed events |
| User switches contests | Old channel closed before new channel opened |

## Real-World Examples

**Scenario 1 — Camila + her primas.** Camila opens `/vote/miss-elegance-colombia-2026` on her phone. She sends the link to her WhatsApp group "Las Primas". Her cousin Sofia opens the link 30 seconds later. Both browsers are on the page. Camila votes for Laura — Sofia's screen ticks Laura's count from 287→288 in 1.4s. **Without Realtime,** Sofia sees stale data; the moment is broken.

**Scenario 2 — Finals night surge.** 9pm local, 3,400 votes per minute peak. Each entity_tally UPDATE broadcasts. UI batches to render every 100ms. Counters tick smoothly without flicker. **Without Realtime,** users would refresh constantly, hammering the server.

**Scenario 3 — Network blip on mobile.** Camila's WiFi drops for 8s while she's on the page. Realtime client emits CHANNEL_ERROR. UI shows "Reconectando…" badge. After 5s reconnect attempt succeeds. Hook re-fetches tally to recover any missed updates. **Without auto-reconnect,** Camila sees zero updates after blip and concludes "the page is broken".

## Outcomes

| Before | After |
|---|---|
| Static leaderboard, requires manual refresh | Live updates within 2s of any vote |
| Voters refresh constantly, hammering server | One Realtime subscription, server load steady |
| Friends watching together feel disconnected | Shared moment — votes land in everyone's view |
| Optimistic + actual updates double-count in UI | Reconciliation via entity_id key, single source of truth |

## Verification

- Manual: 2-browser test (Camila + Sofia personas) — vote in A, observe B tick within 2s.
- Browser DevTools Network tab: confirm WebSocket frames for `postgres_changes` events.
- Vitest: hook test with mocked Supabase client; verify subscribe/unsubscribe lifecycle, reconcile logic.
- `mdeai-project-gates` skill clean.

## See also

- [`src/hooks/useRealtimeChannel.ts`](../../../src/hooks/useRealtimeChannel.ts) — existing pattern
- [`tasks/events/diagrams/01-vote-cast-flow.md`](../diagrams/01-vote-cast-flow.md) — full sequence
- Supabase Realtime docs (loaded via `supabase` skill)
