---
id: 13C
diagram_id: —
prd_section: "Meta — Documentation"
title: Docs hygiene — PRD paths, tasks/index links, RICE clarity, Definition of Done
description: "Ships «Docs hygiene — PRD paths, tasks/index links, RICE clarity, Definition of Done» for this epic—full scope in § Prompt below."
skills:
  - documentation
  - mdeai-tasks
epic: cross-cutting
phase: CORE
priority: P2
status: Open
owner: Product
dependencies: []
estimated_effort: S
percent_complete: 0
outcome: O9
---

# Docs hygiene (06-tasks-audit CORE)

### Real world — purpose & outcomes

**In one sentence:** Planning docs (PRD, roadmap, INDEX) stay **sortable and linkable**—so RICE prioritization and “definition of done” aren’t a different folder than `tasks/`.

- **Who it’s for:** PM and engineers planning sprints.
- **Purpose:** Docs hygiene: fix broken links, align RICE/DoD templates with repo layout.
- **Goals:** One place to read priorities; fewer 404s.
- **Features / deliverables:** Edits to listed files; optional link checker; no product runtime change.

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — **PRD path fixes**, **`index.md` dead links**, **RICE** column clarity, **Definition of Done** template per epic.

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
| **Goal** | Docs hygiene: links, RICE, DoD templates match `tasks/` layout. |
| **Workflow** | Link check → sort → template fix. |
| **Proof** | No broken links in INDEX scope. |
| **Gates** | N/A. |
| **Rollout** | Merge anytime. |

---

## Prompt

| Item | Action |
|------|--------|
| **PRD paths** | [`tasks/prd-real-estate.md`](../prd-real-estate.md) points to **`tasks/wireframes/`**, **`tasks/mermaid/`** — not obsolete folders. |
| **`tasks/index.md`** | Fix or remove **404** references; run link check. |
| **Roadmap RICE** | Sort by score **or** rename column so “priority” is not misleading ([`tasks/roadmap.md`](../roadmap.md) §5). |
| **Definition of Done** | Add short **DoD** block to epic indexes or `tasks/best-practices/definition-of-done.md`: security + test + metric before “done.” |

## Acceptance criteria

- [ ] Audit checklist in this file’s PR is satisfied or issues filed per broken link.
- [ ] **DoD** template exists and is cited by **09E** or **progress-tracker**.

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § Planning / traceability, § Consolidated improvements (8)
