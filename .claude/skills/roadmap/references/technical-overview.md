# Technical roadmap planning

Use for **engineering-led** roadmaps: architecture, platforms, reliability, migrations, and infra—aligned to product/business goals but time-scoped in quarters/years.

## When to use

- Multi-quarter technology planning or modernization
- Platform scaling, reliability, security, or debt reduction
- Legacy migration or stack standardization
- Innovation or R&D investment slots

## Quick start template

```yaml
Technical Roadmap (excerpt):

Organization: [Team]
Planning Period: [e.g. 2026–2027]
Owner: [CTO / VP Eng / Principal]

Vision: |
  [One paragraph: what “good” looks like in 18–24 months]

Strategic goals:
  - [Measurable outcome 1]
  - [Measurable outcome 2]

---

## Q1 [year]: [Theme]

Milestones:
  - [ ] ...
Success criteria:
  - ...
Risks:
  - ...
```

## Deep dives

Bundled under `references/technical/`:

| File | Topic |
|------|--------|
| [dependency-mapping.md](technical/dependency-mapping.md) | Dependency graphs, critical path |
| [technology-evaluation.md](technical/technology-evaluation.md) | Weighted criteria for tech choices |
| [execution-planning.md](technical/execution-planning.md) | Phased rollout example |

## Practices

- Align technical bets to business outcomes; avoid trend-chasing.
- Reserve capacity for debt, incidents, and learning—not 100% feature utilization.
- Review quarterly; major bets need explicit risk and rollback.
- Document **why** a technology was chosen or deferred.
