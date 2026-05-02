---
id: 10B
diagram_id: MERM-08
prd_section: "4. Feature inventory — listing detail, CRM"
title: Apartment CRM CTAs and My rentals pipeline page
skills:
  - mdeai-tasks
  - frontend-design
  - real-estate
  - shadcn
epic: E10
phase: CORE
priority: P0
status: Done
owner: Frontend
dependencies:
  - 10A
estimated_effort: M
percent_complete: 100
outcome: O1
---

| Aspect | Details |
|--------|---------|
| **Diagram** | MERM-08 — components; MERM-03 — pipeline visibility |
| **Components** | `ApartmentRentActions`, `DashboardRentals` |
| **Routes** | `/dashboard/rentals` (protected), nav + dashboard link |
| **Skills** | **mdeai-tasks**; **frontend-design** (dialogs, spacing, states—within **Paisa**: emerald/cream/charcoal, DM Sans, Playfair per `CLAUDE.md`); **real-estate** (domain copy); **shadcn** (Dialog, Button, Tabs) |

## Design note (frontend-design × mdeai brand)

Use **frontend-design** for intentional layout, focus rings, dialog rhythm, and loading affordances. **Do not** replace brand fonts (Playfair / DM Sans) or HSL tokens with generic "distinctive" font stacks—**project design system in `index.css` wins.**

## Description

**The situation:** `p1-crm` existed without in-app CTAs or a renter-facing pipeline view.

**Why it matters:** Renters cannot complete "tour" or "application" without UI; ops cannot demo CRM.

**What already exists:** `useAuth`, `AppLayout`, shadcn primitives, `ThreePanelLayout` on apartment detail.

**The build:** Mutations via `useP1Crm`, reads via `useP1Pipeline` (RLS), apartment right panel + mobile CTAs, tabs for tours/applications/leads, four states on pipeline page.

## Acceptance criteria

- [x] Signed-in user can schedule tour and see row under RLS
- [x] Pipeline page: loading, error (retry), empty, success
- [x] Dialogs: labels, keyboard focus, cancel/confirm
- [x] `npm run build` passes

## Wiring plan

| Layer | File | Action |
|-------|------|--------|
| Hooks | `src/hooks/useP1Crm.ts`, `useP1Pipeline.ts` | Create |
| Component | `src/components/rentals/ApartmentRentActions.tsx` | Create |
| Page | `src/pages/DashboardRentals.tsx` | Create |
| Page | `src/pages/ApartmentDetail.tsx` | Modify |
| App | `src/App.tsx` | Modify |
| Nav | `src/components/layout/LeftPanel.tsx`, `src/pages/Dashboard.tsx` | Modify |
