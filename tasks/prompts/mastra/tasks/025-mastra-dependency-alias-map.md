---
task_id: MASTRA-025
title: Mastra Dependency Alias Map
phase: CORE
priority: P1
status: Not Started
estimated_effort: 1 day
area: mastra-planning
skill: [mde-task-lifecycle]
subagents: [docs]
edge_function: null
schema_tables: []
depends_on: [MASTRA-001]
blocks: [MASTRA-006, MASTRA-007, MASTRA-008]
---

<!-- task-summary -->
> **What:** Build an authoritative alias map from external dependency IDs (`RE-*`, `EVT-*`, `VDB-*`, `PAPERCLIP-*`, `OPENCLAW-*`, `HERMES-*`) to exact file paths and current status.
> **Why:** Mastra task `depends_on` lists currently mix bare IDs with file paths. Bare IDs make it impossible to verify a dependency exists or has shipped before downstream work starts.
> **Delivers:** Markdown alias table, `test -f` verification command, and rewrites of `depends_on` in MASTRA-006/007/008 to resolvable paths or canonical IDs.
> **Tools/Skills:** `mde-task-lifecycle`
> **CORE · P1 · Not Started · Effort: 1 day**
> **Depends on:** MASTRA-001

# Mastra Dependency Alias Map

## Easy Summary

**Purpose:** stop tasks from referencing ambiguous dependency IDs like `RE-001` and `EVT-071`.

**Goals:** map every external dependency alias to an exact file path and current status.

**Success criteria:** vertical Mastra tasks list resolvable dependencies only.

## Acceptance Criteria

- [ ] Create a dependency map table for `RE-*`, `EVT-*`, `VDB-*`, `PAPERCLIP-*`, `OPENCLAW-*`, and `HERMES-*`.
- [ ] Update `MASTRA-006`, `MASTRA-007`, and `MASTRA-008` dependencies to exact file paths or canonical IDs.
- [ ] Mark missing dependencies as blockers rather than assumptions.
- [ ] Add verification command using `test -f` for every referenced file.

## Verification

```bash
cd /home/sk/mde
rg -n "RE-[0-9]|EVT-[0-9]|VDB-[0-9]|PAPERCLIP|OPENCLAW|HERMES" tasks/prompts/mastra/tasks
```

