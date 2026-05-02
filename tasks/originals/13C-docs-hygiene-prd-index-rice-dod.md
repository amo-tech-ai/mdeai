---
id: 13C
diagram_id: —
prd_section: "Meta — Documentation"
title: Docs hygiene — PRD paths, tasks/index links, RICE clarity, Definition of Done
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

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — **PRD path fixes**, **`index.md` dead links**, **RICE** column clarity, **Definition of Done** template per epic.

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
