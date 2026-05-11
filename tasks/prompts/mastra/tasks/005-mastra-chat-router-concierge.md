---
task_id: MASTRA-005
title: Mastra Chat Router And Concierge MVP
phase: MVP
priority: P0
status: Not Started
estimated_effort: 3 days
area: mastra-chat
skill: [mde-task-lifecycle, mastra, ai-chatbot]
subagents: [backend, frontend]
edge_function: ai-chat
schema_tables: [conversations, messages, ai_tool_audit_events]
depends_on: [MASTRA-002, MASTRA-003, MASTRA-004, MASTRA-012, MASTRA-013, MASTRA-014, MASTRA-015]
blocks: [MASTRA-006, MASTRA-007, MASTRA-008]
---

<!-- task-summary -->
> **What:** Route web chat intents through Mastra Router and Concierge agents while preserving existing chat UI behavior.
> **Why:** Chat is the main mdeAI surface. The first Mastra user experience should answer with real cards, safe tools, and clear handoff behavior.
> **Delivers:** Router Agent, Concierge Agent, web chat integration, and smoke tests for rentals/events/restaurants.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `ai-chatbot`
> **MVP · P0 · Not Started · Effort: 3 days**
> **Depends on:** MASTRA-002–004, MASTRA-012–015

# Mastra Chat Router And Concierge MVP

## Easy Summary

**Purpose:** make Mastra the brain behind the main mdeAI chat experience.

**Goals:** route user intent, call safe tools, return structured cards, and create drafts/hand-offs for risky requests.

**Success criteria:** users can ask one chat about rentals, events, restaurants, sponsors, or support and get real, audited responses.

**Production-ready checklist:**

- Router covers rentals, events, restaurants, sponsors, support, and unknown.
- Concierge uses typed tools, not direct database access.
- Streaming/loading/error UI still works.
- Risky asks become drafts or handoffs.
- Browser/component proof shows cards render in chat.

## Description

Connect the existing mdeAI chat experience to Mastra. Start with a Router Agent and Concierge Agent that can classify intent, call read-only search tools, render structured card actions, and create drafts or handoff requests for risky actions.

## Rationale

The highest-leverage Mastra entry point is chat because it can serve rentals, events, restaurants, sponsors, and support through one user surface.

## User Stories

| Persona | Goal | Outcome |
| --- | --- | --- |
| Visitor | ask one chat for rentals, events, and restaurants | I do not need to navigate the app manually |
| Operator | see AI tool calls audited | I can trust the assistant |
| Developer | keep existing chat cards working | Mastra does not regress the UI |

## Acceptance Criteria

- [ ] Add Router Agent with intents for rentals, events, restaurants, sponsors, support, and unknown.
- [ ] Add Concierge Agent that calls only approved read-only tools and draft/approval tools.
- [ ] Preserve existing chat streaming/loading/error behavior.
- [ ] Render structured rental/event/restaurant cards from Mastra tool results.
- [ ] Unknown or risky requests produce a clarification or human-handoff draft.
- [ ] Every Mastra chat turn writes audit events.
- [ ] Add tests for rental search, event search, restaurant search, unknown intent, and risky action request.
- [ ] Add a browser or component smoke proof that inline cards still render.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Mastra agents | `my-mastra-app/src/agents/router.ts` | Create Router Agent |
| Mastra agents | `my-mastra-app/src/agents/concierge.ts` | Create Concierge Agent |
| Chat API | `supabase/functions/ai-chat/index.ts` or backend route | Route to Mastra while preserving contract |
| UI | `src/components/chat/**` | Preserve existing card/action rendering |
| Tests | `my-mastra-app/**`, `src/components/chat/**` | Add agent and UI smoke tests |
| Docs | `tasks/mastra/mastra-chat-runbook.md` | Document supported intents and fallbacks |

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| User asks to send WhatsApp | Create outbound draft or approval request, not a send |
| User asks for refund or ticket override | Refuse direct action and route to operator approval |
| Search returns no results | Ask one useful follow-up and suggest nearby alternatives |
| User switches domains mid-chat | Router updates intent without losing thread context |
| Mastra runtime unavailable | Existing chat returns safe error and retry path |

## Real-World Examples

**Scenario 1 - cross-domain:** "I need a 3-month apartment in Laureles and a dinner spot Friday" returns rental cards and restaurant cards in one chat thread.

**Scenario 2 - risky:** "Message this landlord now" creates a WhatsApp draft and asks for confirmation.

## Outcomes

| Before | After |
| --- | --- |
| Chat logic is scattered across existing functions | Mastra becomes the AI routing layer |
| Cards may depend on old actions only | Cards are fed by typed tools |
| Risky actions are ambiguous | Draft/approval flow is explicit |

## Verification

Run:

```bash
npm run test -- --run
npm run build
rg -n "Router Agent|Concierge Agent|route_intent|OPEN_RENTALS_RESULTS" my-mastra-app src supabase
```
