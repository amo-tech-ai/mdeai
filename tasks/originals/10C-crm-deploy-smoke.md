---
id: 10C
diagram_id: MERM-10
prd_section: "7. Deploy — Supabase functions"
title: Deploy p1-crm and smoke-test CRM flows in hosted project
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

| Aspect | Details |
|--------|---------|
| **Diagram** | MERM-10 — Supabase edge deploy |
| **Verify prompt** | `tasks/prompts/VERIFY-supabase-postgres-edge.md` |
| **Skills** | **mdeai-tasks**; **supabase-edge-functions** (deploy, JWT, secrets) |

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
