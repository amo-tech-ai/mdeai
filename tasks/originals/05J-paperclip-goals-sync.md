---
id: 05J
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Goals & task system"
title: Paperclip goals, projects & repo↔control-plane sync
skills:
  - paperclip
  - mdeai-tasks
epic: E5
phase: MVP
priority: P2
status: Open
owner: Product
dependencies:
  - E5-001
estimated_effort: M
percent_complete: 0
outcome: O6
---

# E5-009: Goals, projects & dual task-system resolution

> **Why:** [`tasks/audit/03-paperclip..md`](../../audit/03-paperclip..md) — **goals/projects** not evidenced in prompts; **repo `tasks/`** vs **Paperclip issues** risk **dual brains**.  
> **Epic index:** [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md)

## Prompt

1. **Declare source of truth (pick one):**
   - **Option A — Paperclip SoT for agent-executable work:** Issues, checkouts, approvals live in Paperclip; `tasks/prompts/*.md` are **specs** that map to issue IDs in YAML or a small `tasks/paperclip/issue-map.yaml`.
   - **Option B — Repo SoT:** Keep prompts canonical; **export** or **mirror** to Paperclip via script on release (document command in `tasks/paperclip/README.md`).

2. **Goals & projects:** For company `mde`, create **goals** aligned to phases (e.g. CORE, MVP, GTM) and attach **E5** work to **`goalId`** / **`projectId`** where the API allows. Update **05E** epic table or each 05x frontmatter with optional `paperclip_goal:` when IDs exist.

3. **Parent linkage:** Large epics use **`parentId`** so E5 children are not a **flat** backlog — mirror MERM-07 hierarchy (CEO → delegates).

4. **Weekly ritual (human):** Document **15 min** board review: stale `in_progress`, blocked dedup, budget line — link from `tasks/notes/progress-tracker.md` or `tasks/progress.md`.

## Acceptance criteria

- [ ] One paragraph in **`tasks/paperclip/README.md`** (create if missing) states **SoT** choice (A or B) and update cadence.
- [ ] At least **one** goal ID documented for **E5** pilot (or explicit “pending” with ticket to create goals).
- [ ] **05E** or index lists **parent epic** pattern for subtasks.
- [ ] No requirement that every dev use `/home/sk/...` — workspace paths use **env** (`MDE_ROOT`) or Paperclip workspace API (**05B**).

## References

- [`tasks/audit/03-paperclip..md`](../../audit/03-paperclip..md) § Task Strategy Issues, § Improvements (5)
