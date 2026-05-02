# PRD as GitHub issue (deep interview + modules)

Use when the user wants a **long-form PRD** filed as a **GitHub issue**, with relentless clarification and explicit module boundaries.

You may skip steps if unnecessary.

## Steps

1. **Problem dump** — Ask for a long, detailed problem description and solution ideas.

2. **Repo exploration** — Verify assumptions against the codebase; note what exists.

3. **Interview** — Resolve the design tree branch-by-branch until decisions are explicit.

4. **Modules** — Sketch major modules to build or change. Prefer **deep modules**: large capability behind a small, stable interface. Ask which modules get tests.

5. **Write** — Fill the template below. Submit as a GitHub issue (or equivalent tracker).

## Issue template

```markdown
## Problem statement

The problem from the user's perspective.

## Solution

The solution from the user's perspective.

## User stories

A long, numbered list:

1. As an <actor>, I want <feature>, so that <benefit>
2. ...

Cover edge cases and operational stories, not only happy path.

## Implementation decisions

- Modules built or modified (names and responsibilities, not file paths)
- Interfaces that change
- Architecture, schema, API contracts
- Interactions between components

Do **not** paste file paths or code snippets — they go stale.

## Testing decisions

- What a good test looks like (behavior, not internals)
- Which modules are covered
- Prior art in the repo (similar tests)

## Out of scope

Explicit exclusions.

## Further notes

Anything else (rollout, metrics, open questions).
```
