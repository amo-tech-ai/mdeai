---
task_id: MASTRA-009
title: Mastra UI Dojo Chat Frontend — Reference Patterns Only
phase: MVP
priority: P0
status: Not Started
estimated_effort: 2 days
area: mastra-frontend
skill: [mde-task-lifecycle, mastra, ai-chatbot]
subagents: [frontend, backend]
edge_function: ai-chat
schema_tables: [conversations, messages, ai_tool_audit_events]
depends_on: [MASTRA-002, MASTRA-005, MASTRA-019, MASTRA-011]
blocks: []
---

<!-- task-summary -->
> **What:** Read `mastra-ai/ui-dojo` as a **reference-only** pattern source for streaming chat, generative UI, workflows, and HITL — then document which patterns mdeAI adopts inside our existing shadcn/ui frontend.
> **Why:** mdeAI already has a chat canvas + shadcn/ui design system. UI Dojo is the highest-quality streaming-UI pattern reference (and uses Vite, the same bundler), but it is **not** an architectural dependency. Per [23-doc §D2](../notes/23-mastra-modules-verified.md#d2-mvp-allowed-templates-week-1-vs-week-2-vs-skip), we adopt patterns, never components, theme, routing, or pages.
> **Delivers:** A documented pattern checklist (loading / streaming / tool-call / HITL states) inside `tasks/mastra/mastra-streaming-ui-runbook.md` plus a small proof that Mastra responses and approval states render in mdeAI's existing components.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `ai-chatbot`
> **MVP · P0 · Not Started · Effort: 2 days**
> **Depends on:** MASTRA-002, MASTRA-005, MASTRA-019, MASTRA-011

# Mastra UI Dojo Chat Frontend — Reference Patterns Only

## Easy Summary

**Purpose:** lift streaming/HITL **patterns** from `mastra-ai/ui-dojo` and adopt them inside mdeAI's existing shadcn/ui frontend. **Not** a "pick a frontend" task — mdeAI's frontend is already chosen (Vite + React + shadcn/ui).

**Goals:** read UI Dojo's AI SDK / Assistant UI / CopilotKit / generative-UI / HITL examples, then document which loading/streaming/tool-call/approval state patterns mdeAI adopts. Implementation lives in mdeAI's own components.

**Success criteria:** a runbook lists the 3+ adopted patterns with mdeAI component mappings; no `ui-dojo` import appears anywhere under `src/`; streamed responses + tool-call cards + approval-suspend states render correctly inside existing mdeAI surfaces.

**Production-ready checklist:**

- Patterns referenced from `https://github.com/mastra-ai/ui-dojo` are documented in `tasks/mastra/mastra-streaming-ui-runbook.md`.
- No file under `src/` imports anything from a `ui-dojo` package or path.
- No commit in this task vendors UI Dojo source files (`git diff --stat` proof).
- Streaming and tool-result cards render in mdeAI components (e.g., `<RentalCard />`, `<EventCard />`).
- Human approval/suspend states have a documented UI pattern wired to `human_handoffs`.
- Error/loading/retry states are preserved end-to-end.
- No secrets or model keys are exposed to browser code.

## Description

Review the official UI Dojo project and map its frontend examples to mdeAI's existing chat canvas. Choose the least disruptive integration path for Mastra chat, generative cards, and approval states.

## Acceptance Criteria

- [ ] Create `/home/sk/mde/tasks/mastra/mastra-ui-decision.md`.
- [ ] Compare AI SDK, Assistant UI, CopilotKit, client tools, and HITL examples from UI Dojo.
- [ ] Select one default frontend integration path for mdeAI MVP.
- [ ] Document why the other options are not first choice.
- [ ] Build or mock a small proof for Mastra card rendering in the existing chat UI.
- [ ] Verify loading, streaming, error, and retry states.
- [ ] Verify approval-required state can render without executing the action.
- [ ] Add follow-up tasks if the chosen path requires component refactors.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Research | `tasks/mastra/mastra-ui-decision.md` | Create decision note |
| UI | `src/components/chat/**` | Add proof/refactor only if needed |
| Mastra | `my-mastra-app/**` | Use existing chat endpoints from MASTRA-005 |
| Tests | Chat component tests or browser smoke | Verify visible behavior |

## Verification

Run:

```bash
npm run test -- --run
npm run build
test -f /home/sk/mde/tasks/mastra/mastra-ui-decision.md
rg -n "ui-dojo|AI SDK|Assistant UI|CopilotKit|HITL" /home/sk/mde/tasks/mastra/mastra-ui-decision.md
```
