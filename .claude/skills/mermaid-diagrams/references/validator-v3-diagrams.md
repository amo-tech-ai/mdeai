# Validator v3 — Mermaid Diagram Reference

5 diagrams for the separated agent architecture. SVGs in `lean/prompts/data/diagrams/`.

## Diagram Index

| # | Type | File | Purpose |
|---|------|------|---------|
| 1 | Flowchart | `01-agent-architecture.svg` | 8 edge functions + DB + frontend connections |
| 2 | Sequence | `02-agent-sequence.svg` | Full pipeline timeline with parallel agents |
| 3 | ERD | `03-database-erd.svg` | validator_sessions, agent_runs, reports relationships |
| 4 | Flowchart | `04-state-machines.svg` | Agent, session, and retry state transitions |
| 5 | Gantt | `05-timeline-gantt.svg` | ~93s typical execution timeline |

## Source

Full Mermaid syntax embedded in `lean/prompts/data/validator-v3-strategy.md` (Mermaid Sources section).

## Key Patterns Used

- **Flowchart subgraphs** for grouping (Frontend, Agents, DB)
- **Sequence diagram `par` blocks** for parallel Research + Competitors
- **ERD with cardinality** for DB relationships
- **Gantt chart** for timeline visualization
- **Conditional styling** (green=ok, red=failed, yellow=degraded)
