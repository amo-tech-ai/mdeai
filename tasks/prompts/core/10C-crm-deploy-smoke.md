---
id: 10C
diagram_id: MERM-10
prd_section: "7. Deploy — Supabase functions"
title: Deploy p1-crm and smoke-test CRM flows in hosted project
description: "Ships «Deploy p1-crm and smoke-test CRM flows in hosted project» for this epic—full scope in § Prompt below."
skills:
  - mdeai-tasks
  - supabase/supabase-edge-functions
epic: E10
phase: CORE
priority: P0
status: Open
owner: DevOps
dependencies:
  - 10A
  - 10B
estimated_effort: S
percent_complete: 0
outcome: O1
---


### Real world — purpose & outcomes

**In one sentence:** After deploy, a human can run a short checklist (curl + UI) and **prove** CRM and auth work on the real project—not “it worked on my laptop.”

- **Who it’s for:** Whoever ships; on-call when something breaks post-release.
- **Purpose:** Repeatable smoke: JWT, CRM actions, no 500s on critical paths.
- **Goals:** Evidence captured (screenshot/log); project ref and URLs correct.
- **Features / deliverables:** Documented steps in this prompt; optional script; pass/fail criteria.

| Aspect | Details |
|--------|---------|
| **Diagram** | MERM-10 — Supabase edge deploy |
| **Verify prompt** | `tasks/prompts/VERIFY-supabase-postgres-edge.md` |
| **Skills** | **mdeai-tasks**; **supabase-edge-functions** (deploy, JWT, secrets) |

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
| **Goal** | Deploy smoke proves `p1-crm` + dashboard on target project. |
| **Workflow** | Run documented curl/UI steps; record evidence. |
| **Proof** | Checklist all green; screenshots or logs archived. |
| **Gates** | Service role only on server; project ref correct. |
| **Rollout** | Per-deploy or release candidate. |

---

## Description

**The situation:** CRM UI and client code exist; hosted `p1-crm` must match repo and accept JWT.

**Why it matters:** Local success ≠ production; renters hit 404/401 if function stale.

**The build:** `supabase functions deploy p1-crm`, then browser smoke: login → apartment → schedule tour → `/dashboard/rentals`.

## Acceptance criteria

- [ ] `npm run verify:edge` passes before deploy
- [ ] `p1-crm` deployed to project `zkwcbyxiwklihegjhuql` (or document other ref)
- [ ] 401 without Bearer; 200 with valid session for `create_lead` smoke
- [ ] Dated note in `tasks/notes/01-supa.md` or **`10C-crm-deploy-smoke.md`** when done

## Wiring plan

| Layer | Action |
|-------|--------|
| CLI | `supabase link`, `supabase functions deploy p1-crm` |
| Dashboard | Confirm secrets: `SUPABASE_SERVICE_ROLE_KEY`, etc. |
