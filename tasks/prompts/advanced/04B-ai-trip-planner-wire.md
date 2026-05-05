---
id: 04B
diagram_id: MERM-08
prd_section: "4. Feature inventory — Trips"
title: Wire trip planner UI to ai-trip-planner edge function
skills:
  - mdeai-tasks
  - supabase/supabase-edge-functions
  - frontend-design
epic: E4
phase: CORE
priority: P0
status: Open
owner: Frontend
dependencies:
  - E3-001
estimated_effort: M
percent_complete: 0
outcome: O1
---

| Aspect | Details |
|--------|---------|
| **Problem** | `useAITripPlanner` **`generatePlan`** invokes **`ai-chat`** with `planMode` — the dedicated **`ai-trip-planner`** edge function is deployed but unused. |
| **Edge contract** | `supabase/functions/ai-trip-planner/index.ts` — body: `tripPlanBodySchema` (`startDate`, `endDate`, optional `tripId`, `destination`, `interests`, `budget`, `travelStyle`, `preferences`). |
| **Files** | `src/hooks/useAITripPlanner.ts`, `src/components/trips/AITripPlannerButton.tsx` |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Trip planner suggestions use `ai-trip-planner` with preview/apply pattern. |
| **Workflow** | Hook UI → edge → map results to trip items; user confirms apply. |
| **Proof** | Planner returns structured stops; undo path works. |
| **Gates** | JWT on edge; timeout handling for long Gemini calls. |
| **Rollout** | Behind existing trips feature flag if present. |

---

## User story

*As a traveler building an itinerary, I want the **trip planner** edge to generate structured days and items so that proposals are consistent, logged in `ai_runs`, and match the server schema — not only the generic chat path.*

## Description

**The build:**

1. **`generatePlan`** — `supabase.functions.invoke("ai-trip-planner", { body: { ... } })` aligned with **`tripPlanBodySchema`**. Map response `itinerary` / `summary` / `tripTitle` into existing `AITripPlanItem[]` and `AITripPlanResponse`.
2. **`useAIProposal` path** — Ensure `createTripPlanProposal` / apply flow still works; proposal payloads may need adjustment if shape differs from chat output.
3. **Errors** — Structured error envelope; toast on failure; **four states** for the planner UI.
4. Remove or gate **`ai-chat`** `planMode` for production default (optional env `VITE_USE_AI_CHAT_FOR_TRIP=false`).

## Acceptance criteria

- [ ] Primary path invokes **`ai-trip-planner`**, not `ai-chat`, for plan generation (or documented env fallback).
- [ ] Request matches server Zod schema; response mapped to existing trip UI models.
- [ ] `AITripPlannerButton` / trip page still propose → apply → undo per product rules.
- [ ] `npm run build` passes; manual smoke on `/trips/:id` (or equivalent).

## Verification

```bash
npm run build
npm run verify:edge
```

Manual: generate plan — DevTools shows `ai-trip-planner` request; itinerary renders.
