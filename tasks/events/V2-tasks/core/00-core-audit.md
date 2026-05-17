---
doc_id: EVT-CORE-AUDIT
title: CORE tasks (EVT-001–026) — audit summary
date: 2026-05-17
auditor: repo + tests (not human sign-off)
commerce_mvp: scanner deferred — see ../../events-progress.md
---

# CORE phase audit (EVT-001–026)

**Verdict:** **Not complete.** **EVT-001**, **EVT-009**, **EVT-010** **Completed** (2026-05-17). **~12/26** have substantial **code** in repo; **proof gaps** on RLS negatives, load test, email, auth matrix doc, abandoned-cart cron.

**Tests (2026-05-17):** `npm test` **238/238** · EVT-001: 6 · EVT-010: 10 · `verify:edge` 27 pass · **G4 not run** · **EVT-011 not run**

## Summary table

| ID | Task | Real world | Code | Tests | % | Status |
|----|------|------------|------|-------|---|--------|
| 001 | Events RLS | Public only sees published events | `20260517120000_evt001_events_rls_alignment.sql` + hooks | Vitest 6 | 100 | **Completed** |
| 002 | Ticket tiers | GA vs VIP + seat counts | `event_tickets` + CHECKs | None | 80 | In Progress |
| 003 | Orders | Pending → paid order rows | `event_orders` | None | 80 | In Progress |
| 004 | Attendees | One person, one ticket row | `event_attendees` | Smoke path | 85 | In Progress |
| 005 | Check-ins | Door scan log | `event_check_ins` + RPC | None | 75 | In Progress |
| 006 | Venues | Event has an address | `event_venues` + FK | None | 75 | In Progress |
| 007 | AI runs log | See when AI touched tickets | **Gap:** ticket edges don't log `ai_runs` | None | 15 | Open |
| 008 | Auth matrix doc | Written rules per API | `config.toml` comments only | None | 35 | Open |
| 009 | verify_jwt | Pay/scan APIs reachable | Deployed + config | Vitest 5/5 | 92 | **Completed** |
| 010 | RLS review | Security review done | Matrix + phase1 policies | Vitest 10 | 100 | **Completed** |
| 011 | RLS negatives | Hackers can't read others' tickets | Policies exist | **No negative suite** | 10 | Open |
| 012 | ticket-checkout | "Start payment" | `supabase/functions/ticket-checkout` | Smoke 6 tests | 88 | In Progress |
| 013 | Capacity lock | No double-sell while paying | `qty_pending` + RPC | Smoke indirect | 85 | In Progress |
| 014 | ticket-payment-webhook | Stripe says paid → ticket live | Full handler | Smoke | 88 | In Progress |
| 015 | Stripe signature | Reject fake webhooks | `constructEventAsync` | Smoke | 85 | In Progress |
| 016 | Idempotency | Same webhook twice = one ticket | `stripe_${event.id}` + table | Smoke | 82 | In Progress |
| 017 | Order finalize | Flip to paid | `ticket_payment_finalize` RPC | Smoke | 85 | In Progress |
| 018 | Attendee + QR rows | Mint tickets on pay | Checkout + webhook RPC | EVT-069 SQL | 88 | In Progress |
| 019 | Signed QR | Scanner trusts QR | JWT in checkout | Local proof | 85 | In Progress |
| 020 | Email/PDF/ICS | Buyer gets email ticket | **Not implemented** | None | 5 | Open |
| 021 | ticket-validate | Door scan API | Full handler | Config test only | 80 | In Progress |
| 022 | ALREADY_USED | Second scan rejected | RPC semantics | **No dedicated test** | 55 | In Progress |
| 023 | Staff link | Give door staff a link | `event-staff-link-generator` | None | 78 | In Progress |
| 024 | Revoke staff link | Kill leaked link | `bump_staff_link_version` RPC | None | 65 | In Progress |
| 025 | Realtime dashboard | Host sees sales live | Broadcast triggers | No host UI | 70 | In Progress |
| 026 | 50-buyer load | No oversell under rush | `qty_pending` design | **G4 not run** | 0 | Open |

## Commerce MVP critical path (CORE)

| Priority | IDs | Blocker |
|----------|-----|---------|
| P0 | 026, 011, 014+012+013, 008 | Oversell proof, RLS, live webhook |
| P1 | 020 | Email proof (wallet can suffice short-term) |
| Deferred (ops) | 021–024, 022 | Scanner not in commerce MVP |

## Aggregate

| Metric | Value |
|--------|------:|
| YAML `Completed` | **1 / 26** |
| Code ≥80% (estimate) | **~14 / 26** |
| Core phase % (weighted) | **~62%** built · **~38%** verified |

**Next:** Run G4 (026), EVT-011 negatives, document EVT-008 matrix, wire EVT-007 or waive for ticket edges.
