# Epic 10: P1 CRM — Real estate (lead, tour, application)

> **Short description (this file):** Navigation index for CRM prompts **10A → 10B → 10C**—links and order only; implementation lives in those files, not here.

### Real world — purpose & outcomes

**In one sentence:** This file is the **map** of CRM-related prompts (10A–10C and friends)—so nobody implements the same thing twice or skips a dependency.

- **Who it’s for:** Engineers and agents picking up CRM work.
- **Purpose:** Navigation and ordering: envelope → UI → deploy smoke.
- **Goals:** Links stay current; duplicates removed; order of operations obvious.
- **Features / deliverables:** Index only—no runtime code; update when child prompts change.

> **Diagrams:** MERM-03 (rental pipeline), MERM-06 (data model), MERM-09 (edge map)  
> **Phase:** CORE  
> **Depends on:** E1 (P1 tables), E2 (pipeline semantics), E3 (JWT on `p1-crm`)  
> **Related:** [`02E-lead-to-lease-pipeline.md`](02E-lead-to-lease-pipeline.md) (E2)

---

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
| **Goal** | CRM epic links 10A–10C and dependencies — one entry point for implementers. |
| **Workflow** | Keep INDEX links current; remove duplicates. |
| **Proof** | All child prompts reachable from here. |
| **Gates** | No standalone prod impact. |
| **Rollout** | Doc-only. |

---

## Subtasks (10A → 10B → 10C)

Each file includes **`skills:`** (mdeai-tasks + domain skills). Execute in order.

| ID | File | Status |
|----|------|--------|
| **10A** | [`10A-crm-api-envelope.md`](10A-crm-api-envelope.md) | Done |
| **10B** | [`10B-crm-ui-pipeline.md`](10B-crm-ui-pipeline.md) | Done |
| **10C** | [`10C-crm-deploy-smoke.md`](10C-crm-deploy-smoke.md) | Open |

---

## Verification

Before closing **10C**, run [`VERIFY-supabase-postgres-edge.md`](VERIFY-supabase-postgres-edge.md) for `p1-crm` + P1 tables.
