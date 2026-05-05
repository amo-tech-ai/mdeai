---
id: DIAGRAMS-MERM07
title: Sync MERM-07 with Hermes CLI vs Edge canonical story
skills:
  - mdeai-tasks
  - mermaid-diagrams
epic: none
phase: CORE
priority: P1
status: Open
owner: Tech Writing / Architect
---

# Diagram sync — MERM-07 (Hermes / ranking)

**Why:** [`tasks/audit/02-hermes.md`](../audit/02-hermes.md) flags **MERM-07** vs **06E** divergence: composite ranking must read as **Edge (Deno)** for product truth, not the Nous Hermes **CLI**.

**Read first**

- `tasks/mermaid/07-agent-architecture.mmd`
- [`06E-hermes-intelligence.md`](06E-hermes-intelligence.md) — terminology; subtasks [`06A`](06A-hermes-ranking-edge.md)–[`06D`](06D-market-snapshot-edge.md)
- [`tasks/notes/02-hermes-notes.md`](../notes/02-hermes-notes.md) — CLI vs Edge table

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | MERM-07 Hermes edge vs CLI stays synchronized — no mixed canonical names. |
| **Workflow** | Update diagram + INDEX when edge changes. |
| **Proof** | Diff review in PR when architecture shifts. |
| **Gates** | Coordinate with 06E/05C. |
| **Rollout** | Doc-only. |

---

## User story

*As a new engineer, I want the architecture diagram to show **where ranking runs** so that I don’t wire the Hermes CLI into the web app by mistake.*

## Tasks

- [ ] Open **MERM-07** (or equivalent in `07-agent-architecture.mmd`). Ensure **composite ranking / Hermes Intelligence** sits under **Supabase Edge** (or draw a box “Edge: `hermes-ranking` / `ai-search`”).
- [ ] Add a **label or footnote**: *“Nous Hermes CLI = ops/research; production ranking = edge functions.”*
- [ ] If **Paperclip → Hermes** appears, show it as **internal** path only — not in the browser request path for travelers.
- [ ] Cross-link from diagram caption to [`06E-hermes-intelligence.md`](06E-hermes-intelligence.md) and edge subtasks (e.g. [`06A-hermes-ranking-edge.md`](06A-hermes-ranking-edge.md)).
- [ ] Run a quick **PR review** with another dev: “Where does #1 listing order get computed?”

## Acceptance criteria

- [ ] No single diagram implies **only** the CLI scores listings for mdeai.co users.
- [ ] `09-edge-function-map.mmd` and MERM-07 agree on **search → rank** ordering (when E6 ships).
- [ ] Link from `tasks/prompts/INDEX.md` or epic headers points maintainers here when touching Hermes naming.

## Done when

Diagram + epics + [`02-hermes-notes.md`](../notes/02-hermes-notes.md) tell the **same** story.
