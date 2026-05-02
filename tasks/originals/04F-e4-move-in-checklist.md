---
id: 04F
diagram_id: MERM-01
prd_section: "4. Feature inventory — Rental flow"
title: E4-006 — Post-book move-in checklist (static v1)
skills:
  - frontend-design
  - mdeai-tasks
epic: E4
phase: CORE
priority: P2
status: Open
owner: Frontend
dependencies:
  - E2-005
estimated_effort: S
percent_complete: 0
outcome: O1
---

# E4-006: Move-in checklist after booking

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — MERM-01 / PRD mention **post-book** steps; **no owning task** in E2/E4 → journey promises more than prompts own.  
> **Epic index:** [`04E-frontend-rental-flow.md`](04E-frontend-rental-flow.md)

## Prompt

1. **UI:** After **booking confirmed** (`E2-005`), show a **move-in checklist** page or panel (static copy v1 OK): utilities, keys, wifi, emergency contacts, neighborhood tips.

2. **Route:** e.g. `/bookings/:id/checklist` or embedded in **booking detail**.

3. **Data:** No new backend required for v1 — optional `bookings.metadata.checklist_completed` later.

## Acceptance criteria

- [ ] Authenticated renter sees checklist **after** successful booking flow in dev/staging.
- [ ] **04E** epic table updated to list E4-006.
- [ ] **WCAG:** headings + keyboard — align **04E** a11y notes.

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § E4-006 / post-book checklist
