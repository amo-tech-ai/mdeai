---
name: roadmap
description: Product and technical roadmaps — strategic planning (inputs → epics → prioritize → sequence → communicate), incremental updates (add/reprioritize/slip timelines, Now/Next/Later), and technical roadmaps (architecture, infra, migrations, reliability). Use for quarterly planning, exec narratives, RICE/ICE/MoSCoW, dependency and capacity tradeoffs, or when the user mentions roadmap, backlog vs strategy, themes, or “what ships when.” Use even if they do not say “roadmap skill.”
---

# Roadmap skills (hub)

Pick one path; then open the matching reference. This keeps the default context small (**progressive disclosure**).

| User intent | Read first |
|-------------|------------|
| Build or refresh a **strategic** roadmap from goals + discovery (multi-day process) | `references/strategic-planning.md` |
| **Change** an existing roadmap: new initiative, reprioritize, slips, status review | `references/update-reprioritize.md` |
| **Engineering** roadmap: platform, scale, migrations, tech debt | `references/technical-overview.md` → `references/technical/*.md` |

## Principles

- Roadmaps communicate **outcomes and bets**, not guaranteed Gantt contracts.
- Every “add” should consider **capacity**: what moves, slips, or is cut.
- Dependencies and **single-threaded** risks belong on the same page as priorities.

## Repo-specific pointers (mdeai)

- High-level product/tech plan: `plan/docs/25-master-plan.md`, `docs/roadmap.md`, `tasks/real-estate/docs/` when the work is vertical-specific.
- Do not confuse **Phase labels** in master plans with sprint tasks—link epics to measurable outcomes.

## References

| File | Contents |
|------|----------|
| `references/strategic-planning.md` | Full 5-phase strategic workflow |
| `references/update-reprioritize.md` | Frameworks (Now/Next/Later, quarterly themes, OKR), RICE/ICE/MoSCoW, dependencies, capacity |
| `references/technical-overview.md` | Technical roadmap entry + links |
| `references/technical/` | Dependency mapping, technology evaluation, execution planning (legacy detailed examples) |
