# ILM — Preview → Apply → Undo: Generate Prompts

**Document:** Implementation prompts for AI safety: preview changes, approval gate, apply, undo. No code in prompts.  
**Reference:** `tasks/plan/0-progress-tracker.md` (0.5, 9.1–9.6) · `tasks/plan/00-generate-prompts-template.md`  
**Last Updated:** 2026-01-28  

---

## Summary Table

| Dimension | Items |
|-----------|--------|
| **Screens** | TripDetail (Right = Intelligence), Concierge, any screen where AI proposes changes to trip or data. |
| **Features** | Preview patch/diff, approval gate (confirm before apply), apply with transaction, undo with token. |
| **Agents** | ai-orchestrator, ai-trip-planner, ai-optimize-route, ai-suggestions; any agent that proposes writes. |
| **Use cases** | User sees proposed itinerary change before it is applied; user explicitly confirms; user can undo last apply. |
| **Real-world examples** | AI suggests reordering day items → user sees diff in Right panel → user clicks Apply → changes written; user clicks Undo → previous state restored. |

---

## Description

Implement an AI safety pattern: Preview (show proposed change or diff), Apply (execute only after user confirmation), and Undo (revert last apply using a stored state or token). Applies wherever the AI proposes changes to trips, trip items, or other user data. Out of scope: undo across sessions; multi-step undo stack beyond one step for first release.

---

## Rationale

Users must retain control over data. Silent AI writes create trust and safety issues. Preview and explicit Apply reduce errors and increase trust; Undo gives a simple escape. Aligns with product principle: no silent writes, user in control.

---

## User Stories

| Story | Purpose | Goal | Outcome |
|-------|---------|------|---------|
| **Preview** | So the user sees what will change before it happens | User triggers an AI action that would change data and sees a preview or diff | Proposed change is shown in Right panel (or modal); no write yet. |
| **Approval gate** | So the AI cannot write without explicit consent | User must confirm (e.g. Apply button) before any write | No write occurs until user confirms. |
| **Apply** | So the user can accept the proposed change | User clicks Apply after reviewing preview | Change is written in a transaction; UI updates. |
| **Undo** | So the user can revert the last apply | User clicks Undo after an apply | Previous state is restored; user sees confirmation. |

---

## Acceptance Criteria

- Every AI-proposed change to trip or trip items (or other user data) is shown in a preview/diff before write.
- No write occurs without an explicit user action (e.g. Apply button).
- After Apply, the user can trigger Undo once to restore the previous state.
- Preview, Apply, and Undo are available in the Right panel (Intelligence) or in a dedicated modal where the AI proposes changes.
- No code in this doc.

---

## Key Points

- Preview can be a textual summary or a structural diff (e.g. order change, added/removed items).
- Approval gate is mandatory for all AI-originated writes to user data.
- Apply should use a single transaction where possible; rollback on failure.
- Undo stores enough state (e.g. previous trip items snapshot or undo token) to restore one step.

---

## Three-Panel Layout (Core Model)

| Panel | Role | Content |
|-------|------|---------|
| **Left = Context** | Trip list, conversation list | Unchanged. |
| **Main = Work** | Trip detail, itinerary, chat | Current data; after Apply, updates to reflect new state. |
| **Right = Intelligence** | Preview, Approve, Apply, Undo | Preview/diff of proposed change; Apply and Undo buttons; approval gate. |

---

## Frontend / Backend Wiring Plan

| Layer | Responsibility |
|-------|-----------------|
| **Frontend** | When AI returns a proposed change, show it in Right panel (or modal); render Apply and Undo; on Apply call API with confirmation; on Undo call undo API or restore local state. |
| **Backend** | Edge functions that perform writes accept an explicit apply intent; optionally support undo endpoint or return undo token. |
| **Wiring** | UI requests proposal from AI → AI returns proposal (no write) → UI shows preview → User clicks Apply → UI calls apply endpoint → Backend writes in transaction → UI updates; User clicks Undo → UI calls undo or restores state. |

---

## Supabase Schema

| Area | Relevance |
|------|------------|
| **Tables** | trips, trip_items (primary); optionally a table or column for undo state or audit. |
| **RLS** | Unchanged; apply runs as authenticated user. |
| **Triggers / Realtime** | Optional: broadcast after apply so other tabs update. |

---

## Edge Functions

| Function | Role | When invoked |
|----------|------|--------------|
| ai-trip-planner, ai-optimize-route, ai-suggestions | Return proposed change (patch or new order) without writing | User asks for plan or optimize; response is preview only. |
| New or existing apply endpoint | Write trip/trip_items after user confirmation | When user clicks Apply. |
| Undo endpoint or client-side restore | Restore previous state | When user clicks Undo. |

---

## Dependencies

- AI edge functions return structured proposals (e.g. list of changes or new order) instead of writing directly.
- Frontend has a place (Right panel or modal) to show preview and Apply/Undo.
- Optional: undo token or snapshot stored in backend or client for one-step undo.

---

## Gemini 3 / Claude SDK / AI Agents

| Item | Use |
|------|-----|
| **Agents** | ai-orchestrator, ai-trip-planner, ai-optimize-route, ai-suggestions must not write user data directly; they return proposals. |
| **Structured output** | Proposals should be structured (e.g. list of patches or new order) so UI can render preview and send apply payload. |

---

## AI Agents, Automations, Wizards, Workflows

- **Workflows:** Trip planning and optimization become: get proposal → show preview → user applies or rejects → optional undo.
- **Wizards:** Any wizard that uses AI to suggest data changes should use the same preview–apply–undo pattern where it touches user data.

---

## Implementation Prompts (No Code)

Do not add code to this doc.

---

### PAU-P1 — Preview surface in Right panel (or modal)

**Description:** Add a dedicated area for showing AI-proposed changes before apply.

**Prompt:** For I Love Medellín, add a preview surface in the Right panel (Intelligence) or in a modal that appears when the AI proposes a change to trip or trip items. The surface should display a summary or diff of the proposed change (e.g. “Reorder 3 items,” “Add 2 suggestions”). Do not perform any write from the AI response; only show the proposal. Use existing Right panel or modal patterns. Do not paste code into tasks/plan/07-preview-apply-undo-prompts.md.

---

### PAU-P2 — Approval gate and Apply button

**Description:** Ensure no write occurs without explicit user confirmation; add Apply button.

**Prompt:** For I Love Medellín, implement an approval gate: when the AI returns a proposed change, the UI must not write to the database until the user explicitly confirms (e.g. by clicking an Apply or Confirm button). Add an Apply button to the preview surface. On click, the frontend should call an apply endpoint or perform the write with user intent. Do not allow automatic apply without user action. Do not paste code into tasks/plan/07-preview-apply-undo-prompts.md.

---

### PAU-P3 — Apply logic and transaction

**Description:** Backend or frontend apply logic that writes in a single transaction.

**Prompt:** For I Love Medellín, implement the apply step: when the user confirms, apply the proposed change to trips or trip_items in a single transaction where possible. On failure, roll back and show an error. Update the UI after successful apply. Edge functions that currently write directly should be refactored so that write happens only when the client sends an explicit apply request with the approved payload. Do not paste code into tasks/plan/07-preview-apply-undo-prompts.md.

---

### PAU-P4 — Undo (one-step revert)

**Description:** Allow user to revert the last apply once.

**Prompt:** For I Love Medellín, implement one-step Undo after an apply. When the user clicks Undo, restore the previous state of the affected trip or trip items. This can be done by storing a snapshot or undo token before apply and calling an undo endpoint or restoring state locally. Show confirmation after undo. Do not paste code into tasks/plan/07-preview-apply-undo-prompts.md.
