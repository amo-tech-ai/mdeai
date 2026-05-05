---
id: 10B
diagram_id: MERM-08
prd_section: "4. Feature inventory — listing detail, CRM"
title: Apartment CRM CTAs and My rentals pipeline page
description: "Ships «Apartment CRM CTAs and My rentals pipeline page» for this epic—full scope in § Prompt below."
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


### Real world — purpose & outcomes

**In one sentence:** A signed-in traveler can tap **Schedule tour** or **Start application** on an apartment and see progress under **My rentals**—the same pipeline ops can see.

- **Who it’s for:** Renters taking action; ops tracking funnel conversion.
- **Purpose:** CRM isn’t a spreadsheet—it's in the product, with CTAs and a pipeline view.
- **Goals:** Four states on data fetches; actions call `p1-crm` with idempotency where needed.
- **Features / deliverables:** Components, routes, hooks, integration with 02E/10A; dashboard slice per ACs.

| Aspect | Details |
|--------|---------|
| **Diagram** | MERM-08 — components; MERM-03 — pipeline visibility |
| **Components** | `ApartmentRentActions`, `DashboardRentals` |
| **Routes** | `/dashboard/rentals` (protected), nav + dashboard link |
| **Skills** | **mdeai-tasks**; **frontend-design** (dialogs, spacing, states—within **Paisa**: emerald/cream/charcoal, DM Sans, Playfair per `CLAUDE.md`); **real-estate** (domain copy); **shadcn** (Dialog, Button, Tabs) |

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Renters use CRM CTAs and My rentals pipeline with real data. |
| **Workflow** | UI → hooks → `p1-crm` → four states. |
| **Proof** | Tour schedule creates showing row; pipeline lists stages. |
| **Gates** | 10A envelope stable. |
| **Rollout** | Production when 02E data path green. |

---

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
