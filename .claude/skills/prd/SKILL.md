---
name: prd
description: End-to-end product requirements — interview, strict PRD documents, GitHub-issue-style specs, and PRD-to-implementation plans with tracer-bullet vertical slices. Use whenever the user mentions a PRD, product requirements, requirements doc, feature spec, scope document, "write requirements", "document the feature", breaking a PRD into phases, implementation plan from PRD, tracer bullets, vertical slices, `./plans/`, or turning requirements into engineering work — even if they only say "let's spec this" or "plan the build".
---

# PRD (unified)

One workflow, three reference tracks. Pick the track that matches the deliverable; combine as needed.

## Default flow

1. **Confirm intent** — PRD only, issue-form PRD, plan only, or PRD then plan?
2. **Discovery** — Problem, success metrics, constraints, non-goals. Do not invent stack; use `TBD` or ask.
3. **Ground in repo** — Skim architecture when the spec touches code.
4. **Produce** — Use the reference file below for the chosen shape.
5. **Optional next** — After a PRD, offer `references/prd-to-plan.md` to generate `./plans/<feature>.md`.

## Which reference to load

| Deliverable | Read |
|-------------|------|
| Stakeholder-style PRD (exec summary, personas, risks, AI section) | `references/schema-strict.md` |
| Long PRD as a GitHub issue, module-focused | `references/write-github-issue.md` |
| Phased build plan from an existing PRD | `references/prd-to-plan.md` |

## Rules (all tracks)

- Measurable requirements beat adjectives.
- For AI features: tools, eval strategy, and failure modes.
- **Propose / confirm** for destructive or irreversible product actions when the product policy says so.

After loading a reference, follow it for structure and completeness.
