---
task_id: MASTRA-006
title: Mastra Real Estate MVP Agents
phase: MVP
priority: P0
status: Not Started
estimated_effort: 4 days
area: mastra-real-estate
skill: [mde-task-lifecycle, mastra, mde-real-estate]
subagents: [backend, frontend, supabase-auditor]
edge_function: ai-chat
schema_tables: [leads, apartments, showings, conversations, messages, ai_control_events, ai_recommendation_drafts]
depends_on: [MASTRA-003, MASTRA-004, MASTRA-005, MASTRA-011, MASTRA-018, MASTRA-012, MASTRA-013, MASTRA-015, MASTRA-019, RE-001, RE-002, RE-004, RE-005, RE-008]
blocks: []
---

<!-- task-summary -->
> **What:** Add the first real estate Mastra agents for rentals search, lead qualification, showing requests, and WhatsApp draft handoff.
> **Why:** Real estate is the highest-intent MVP wedge and already has the strongest repo/planning surface.
> **Delivers:** Rentals Concierge, Lead Qualification, Showing Scheduler, and CRM Follow-Up draft flows.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `mde-real-estate`
> **MVP · P0 · Not Started · Effort: 4 days**
> **Depends on:** MASTRA-003–005, MASTRA-011, MASTRA-018, MASTRA-012–015, MASTRA-019, RE-001–RE-008

# Mastra Real Estate MVP Agents

## Easy Summary

**Purpose:** launch the first revenue-focused Mastra vertical for Medellin rentals.

**Goals:** help renters search, qualify leads, request showings, and prepare WhatsApp follow-up drafts safely.

**Success criteria:** a renter can move from chat search to qualified lead/showing request without duplicate leads or unapproved outbound sends.

**Production-ready checklist:**

- Lead creation requires consent and idempotency.
- Showing requests are draft/safe-action based.
- WhatsApp handoff is draft-first.
- Lease/legal questions escalate to humans.
- Listing trust/scam notes use stored evidence only.

## Description

Implement the first vertical Mastra agent pack for Medellin rentals. The agents should help users search listings, qualify needs, create safe lead records, draft showing requests, and prepare WhatsApp follow-ups without autonomous sends.

## Rationale

Rentals can produce qualified leads quickly, but the AI boundary must stay safe: Supabase owns truth, Mastra orchestrates, OpenClaw sends only after approval or explicit safe rule.

## User Stories

| Persona | Goal | Outcome |
| --- | --- | --- |
| Digital nomad | find a furnished 3-month rental | I can shortlist without forms |
| Expat couple | qualify pet-friendly long-term options | I get relevant leads and showings |
| Operator | review AI-created showing requests | I can prevent bad bookings |

## Acceptance Criteria

- [ ] Add Rentals Search Agent that uses MASTRA-004 search tools.
- [ ] Add Lead Qualification Agent that extracts budget, dates, beds, pets, neighborhood, urgency, and contact consent.
- [ ] Add `create_or_update_lead` tool with idempotency and RLS-safe backend boundary.
- [ ] Add Showing Scheduler Agent that creates showing request drafts or safe requests, depending on existing schema support.
- [ ] Add CRM Follow-Up Agent that creates WhatsApp/email drafts only.
- [ ] Add Property Trust response logic using verified listing fields where available.
- [ ] Add tests for no duplicate lead, invalid listing ID, no consent, and showing request draft.
- [ ] Add browser/chat proof for a Laureles rental query that returns real cards and creates no outbound send.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Mastra agents | `my-mastra-app/src/agents/real-estate/**` | Create real estate agent pack |
| Mastra tools | `my-mastra-app/src/tools/real-estate.ts` | Create lead/showing/draft tools |
| Backend | Existing lead/showing APIs or edge functions | Reuse or add constrained endpoints |
| UI | `src/components/chat/**` | Render rental cards and lead capture states |
| Tests | `my-mastra-app/**`, relevant edge/function tests | Add idempotency and safety tests |
| Docs | `tasks/mastra/real-estate-mastra-runbook.md` | Document safe operator flow |

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| User gives no contact consent | Do not create lead; ask permission |
| Same user repeats same request | Update or return existing lead by idempotency |
| Listing is unavailable | Explain and suggest alternatives |
| User asks for legal lease advice | Summarize limitations and route to human review |
| User asks to message landlord | Create draft, not direct send |

## Real-World Examples

**Scenario 1 - digital nomad:** "I need a furnished 1BR in Laureles for three months under $1,500" returns real cards, asks move-in date, and can create a lead after consent.

**Scenario 2 - showing:** "Can I see this tomorrow?" creates a showing request draft linked to the listing and lead.

## Outcomes

| Before | After |
| --- | --- |
| Rentals AI is a plan | Rentals agents can run through chat |
| Lead creation can duplicate | Lead writes are idempotent |
| WhatsApp handoff is unsafe | Follow-ups are draft-first |

## Verification

Run:

```bash
npm run test -- --run
npm run build
rg -n "Rentals Search Agent|Lead Qualification Agent|Showing Scheduler Agent|create_or_update_lead" my-mastra-app src supabase
```
