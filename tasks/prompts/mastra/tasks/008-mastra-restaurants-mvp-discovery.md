---
task_id: MASTRA-008
title: Mastra Restaurants MVP Discovery
phase: MVP
priority: P1
status: Not Started
estimated_effort: 3 days
area: mastra-restaurants
skill: [mde-task-lifecycle, mastra]
subagents: [backend, frontend, supabase-auditor]
edge_function: restaurant-booking
schema_tables: [restaurants, restaurant_reservations, ai_control_events, ai_recommendation_drafts]
depends_on: [MASTRA-003, MASTRA-004, MASTRA-005, MASTRA-011, MASTRA-018, MASTRA-012, MASTRA-013, MASTRA-014, MASTRA-015, MASTRA-019, "071-restaurant-reservations-schema"]
blocks: []
---

<!-- task-summary -->
> **What:** Add restaurant discovery and reservation-assist Mastra agents for Medellin dining.
> **Why:** Restaurants create daily engagement and cross-sell from rentals/events, but Medellin reservations are often WhatsApp/phone/Instagram rather than Resy/OpenTable.
> **Delivers:** Restaurant Discovery, Reservation Assist, and Menu Intelligence draft flows.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra`
> **MVP · P1 · Not Started · Effort: 3 days**
> **Depends on:** MASTRA-003–005, MASTRA-011, MASTRA-018, MASTRA-012–015, MASTRA-019, [`071-restaurant-reservations-schema.md`](../../event_prompts/071-restaurant-reservations-schema.md) (alias: was `EVT-071`)

# Mastra Restaurants MVP Discovery

## Easy Summary

**Purpose:** make restaurants part of the concierge without pretending mdeAI has live reservation inventory.

**Goals:** recommend restaurants, cross-sell near rentals/events, cite menu/context where available, and draft reservation outreach.

**Success criteria:** users get useful restaurant cards and reservation drafts, with no unapproved calls, DMs, or real-money orders.

**Production-ready checklist:**

- Discovery is backed by real restaurant records.
- Availability claims are avoided unless confirmed by source data.
- Sponsored/partner restaurants are labeled.
- Reservation outreach is draft-first.
- Rappi/orders/voice calls stay out of MVP.

## Description

Implement the restaurant MVP as discovery and reservation assistance first. Mastra can search restaurants, explain fit, draft reservation messages, and cross-sell dinner near rentals or events. It must not claim live availability, place paid orders, or call/message restaurants without user confirmation and approved execution.

## Rationale

Restaurant booking in Medellin is fragmented. The best MVP is a concierge assistant that helps users choose and prepare outreach, while the platform gathers partner data for later native booking.

## User Stories

| Persona | Goal | Outcome |
| --- | --- | --- |
| Traveler | find dinner near Provenza | I can choose quickly |
| Renter | find restaurants near my apartment shortlist | I can understand neighborhood lifestyle |
| Operator | approve reservation outreach | I can prevent bad or duplicate messages |

## Acceptance Criteria

- [ ] Add Restaurant Discovery Agent using read-only restaurant search.
- [ ] Add Reservation Assist Agent that creates WhatsApp/phone/Instagram draft messages only.
- [ ] Add Menu Intelligence helper that cites stored menu/source snippets when available.
- [ ] Add cross-sell behavior from rental/event context to nearby restaurants.
- [ ] Add tests for no live availability claim, no unapproved outbound message, and no real-money order.
- [ ] If `restaurant-booking` exists, keep it deterministic and race-safe; Mastra only requests or drafts booking actions.
- [ ] Add smoke proof for "date night sushi near Provenza" returning real restaurant cards or documented seed-data blocker.
- [ ] Mark sponsored/partner restaurants clearly in returned card metadata.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Mastra agents | `my-mastra-app/src/agents/restaurants/**` | Create restaurant agent pack |
| Mastra tools | `my-mastra-app/src/tools/restaurants.ts` | Create discovery and draft tools |
| Supabase | Existing restaurant tables and `restaurant-booking` task outputs | Reuse deterministic backend |
| UI | Chat card components | Render restaurant cards and draft states |
| Tests | Mastra and restaurant tests | Add safety and no-claim assertions |
| Docs | `tasks/mastra/restaurants-mastra-runbook.md` | Document Medellin reservation constraints |

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Restaurant has no live availability data | Say availability must be confirmed |
| User asks to call restaurant | Create approval/execution request, do not call |
| User asks to order Rappi | Refuse real-money automation in MVP |
| Result is sponsored | Label sponsored or partner status |
| No restaurants match | Suggest nearby neighborhoods or relaxed filters |

## Real-World Examples

**Scenario 1 - event cross-sell:** "Where should we eat before the event in Provenza?" returns nearby options and a reservation draft.

**Scenario 2 - rental lifestyle:** "Is this Laureles apartment close to good cafes?" returns restaurant/cafe cards near the listing.

## Outcomes

| Before | After |
| --- | --- |
| Restaurants are not part of AI concierge | Restaurant discovery works in chat |
| Booking assumptions are risky | Reservation outreach is draft-first |
| Cross-sell is manual | Rentals/events can suggest restaurants |

## Verification

Run:

```bash
npm run test -- --run
npm run build
rg -n "Restaurant Discovery Agent|Reservation Assist Agent|restaurant-booking|restaurants" my-mastra-app src supabase tasks/mastra
```
