# PRD → implementation plan (tracer bullets)

Use when the user has (or will paste) a PRD and wants a **phased plan** as a local Markdown file, usually `./plans/<feature>.md`.

## Process

### 1. Confirm the PRD is in context

If missing, ask for paste or file path.

### 2. Explore the codebase

Understand architecture, patterns, and integration layers unless already known.

### 3. Durable architectural decisions

Capture decisions that should not churn every phase:

- Routes / URL patterns
- DB schema shape
- Key data models
- Auth / authz
- Third-party boundaries

Put these in the **plan header** so every phase can reference them.

### 4. Vertical slices (tracer bullets)

Each phase is a **thin vertical slice**: end-to-end through all layers — **not** a horizontal layer-only milestone.

- Delivers a narrow but **complete** path (schema, API, UI, tests as appropriate)
- Demoable or verifiable on its own
- Prefer many thin slices over few fat ones
- **Do not** bake in fragile file/function names
- **Do** include durable decisions: routes, schema shapes, model names

### 5. Quiz the user

Present a numbered breakdown. Per phase show **title** and **user stories covered**. Ask: granularity OK? merge/split? Iterate until approved.

### 6. Write the plan file

Create `./plans/` if needed. Name the file after the feature (e.g. `./plans/user-onboarding.md`).

## Plan file template

```markdown
# Plan: <Feature Name>

> Source PRD: <identifier or link>

## Architectural decisions

- **Routes**: ...
- **Schema**: ...
- **Key models**: ...
- (add/remove as needed)

---

## Phase 1: <Title>

**User stories**: <from PRD>

### What to build

End-to-end behavior of this slice (not layer-by-layer trivia).

### Acceptance criteria

- [ ] ...
- [ ] ...

---

## Phase 2: <Title>

...
```
