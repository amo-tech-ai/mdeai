---
name: outcomes
description: >
  Verification-first workflow for rubric-based grading. Use when reviewing a PR,
  auditing a Supabase migration, validating a Maps/Grounding diff, or QA-ing
  event/ticket flows against the rubrics in `.claude/outcomes/`. Enforces
  evidence-over-claims. NOT for writing product code, deploying, or wiring the
  Managed Agents API.
paths:
  - ".claude/outcomes/**"
  - ".claude/docs/best-practices/**"
  - "supabase/migrations/**"
  - "supabase/schemas/**"
  - "src/**/*Map*"
  - "src/**/*Grounding*"
  - "src/**/*Ticket*"
  - "src/**/*Scanner*"
  - "tasks/claude-code/**"
---

# outcomes — verification-first grading

## Purpose

Outcomes is the **independent verifier** half of the writer/verifier loop.
A writer produces an artifact (PR diff, migration, map UI, scanner flow); a
verifier grades it against a rubric without trusting the writer's reasoning.
The grader's only job is to find evidence.

Phase 1 today is **manual**: a human or Claude Code reads a rubric from
`.claude/outcomes/`, runs the verification commands, pastes output, and produces
a per-criterion verdict. Phase 2 wires this to the Managed Agents API
([`define-outcomes`](../../docs/claude-code/outcomes.md)) — out of scope for this skill.

## When to use

- Grading a PR against `.claude/outcomes/pr-review.md` before merge.
- Auditing a new `supabase/migrations/*.sql` against `supabase-migration.md`.
- Validating a Maps/Grounding diff (`src/**/*Map*`, places client) against `maps-grounding.md`.
- QA-ing the Events + Tickets flow (Phase 1 gate items) against `events-ticketing.md`.
- Any check where the user types "verify this", "grade this", "is this satisfied", "Definition of Done", or "ready to merge".

## When NOT to use

- Writing product code → `mde-task-lifecycle`, `mdeai-executor`.
- Deploying → `/deploy-check`, `/ship`.
- Authoring a new rubric from scratch → see `references/rubric-selection.md` §"Writing new rubrics" and the meta-rubric in [`tasks/claude-code/01-outcomes-plan.md §9`](../../../tasks/claude-code/01-outcomes-plan.md).
- Auto-running rubrics on a schedule → deferred (Phase 5 of [`tasks/claude-code/01-outcomes-plan.md`](../../../tasks/claude-code/01-outcomes-plan.md)).
- Generic brainstorming, planning, or research.

## Verification culture

Evidence priority (high → low):

1. **command output** with exit code line
2. **tests** — `vitest run` summary, `Test Files N passed`
3. **SQL results** — `pg_policies`, `relrowsecurity`, row counts
4. **screenshots** at the documented viewport (375×812 or 1440×900)
5. **logs / network traces** — HTTP status, request IDs
6. code inspection — **only as fallback**, and only when a binary outcome doesn't apply

Claude must never claim *verified / tested / passed / deployed / fixed / production-ready* without an evidence marker in the same message. The Stop hook `.claude/hooks/stop-attribution-gate.mjs` enforces this — see `references/evidence-rules.md`.

## Canonical workflow

```
1. Writer ships a change.
2. Verifier picks the rubric from .claude/outcomes/<name>.md (see references/rubric-selection.md).
3. Verifier runs every command in the rubric's Evidence checklist; pastes output verbatim.
4. Verifier produces the rubric's Output format: "Pass N/M. <summary>" + bullets per failed criterion.
5. If any criterion fails, the writer revises and resubmits.
6. Loop ends at satisfied (all pass) OR max_iterations.
```

The verifier should **not** read the writer's commit messages, PR description, or chat history for evidence — only the artifact (code, migration, screenshot, command output).

## Supported rubrics

Live files in `.claude/outcomes/`:

| Rubric | Trigger | `max_iterations` |
|---|---|---:|
| `pr-review.md` | Every PR before merge | 3 |
| `supabase-migration.md` | New `supabase/migrations/*.sql` | 5 |
| `maps-grounding.md` | Map / grounding / Places diff | 5 |
| `events-ticketing.md` | Ticket checkout, scanner, events tables; Phase 1 gate | 8 |

Future rubrics (drafted in [`tasks/claude-code/01-outcomes-plan.md §5`](../../../tasks/claude-code/01-outcomes-plan.md), not yet shipped as files):
`edge-function`, `frontend-ui`, `rentals-workflow`, `sponsor-checkout`, `mastra-agent`, `production-deploy`, `phase1-gate`.

## Evidence requirements

| Surface | Required evidence |
|---|---|
| PR | `npm run floor` summary (lint+typecheck+build+test+verify:edge exit codes), `git diff --stat` |
| Migration | `supabase db reset` exit 0 + `SELECT relrowsecurity FROM pg_class WHERE relname='<T>'` rows + `SELECT polname, cmd FROM pg_policies WHERE tablename='<T>'` rows |
| Map UI | Screenshot at 1440×900 + 375×812; marker count = data length (`window.__MAP_DEBUG__`) |
| Tickets | Two-POST idempotency probe + `SELECT count(*) FROM tickets WHERE stripe_event_id=$1` = 1; 50-buyer oversell probe with `quantity_remaining ≥ 0` |
| Edge fn | `npm run verify:edge` summary, CORS preflight response, 401/403 on missing JWT |

Full details in `references/evidence-rules.md`.

## Manual outcomes workflow

Today (no API), paste this prompt to Claude Code:

```
Use the rubric at .claude/outcomes/<name>.md to grade this change.
Run every command in §"Evidence checklist", paste output verbatim, and
format the result as in §"Output format". Do not declare a criterion
satisfied without evidence.
```

See `references/manual-outcomes-workflow.md` for **Fast mode** (single iteration, low-risk PRs) vs **Full mode** (`max_iterations` default, anything Phase-1-blocking).

## Anti-patterns

The grader must reject any of these:

- "looks good", "should work", "probably fixed" — these are claims, not evidence.
- Code inspection in place of running the test (when running the test is possible).
- Migrations marked satisfied without `pg_policies` output.
- Map UI marked satisfied without screenshots at the documented viewports.
- Stripe idempotency marked satisfied by reading the function body.
- Reusing the writer's prior session output as "evidence" — the grader runs commands fresh.
- Auto-deploy on `satisfied` — humans always sign off on the merge.

Full list in `references/anti-patterns.md`.

## Progressive disclosure

`.claude/outcomes/*.md` — rubrics (binary criteria, evidence requirements, output format).
`references/*.md` — operational deep-dives (evidence rules, rubric selection, manual workflow, anti-patterns).
This SKILL.md — routing only.

## Related skills

- `mde-supabase` — RLS / migration / edge function patterns that the migration rubric checks against.
- `mde-maps` — Maps platform doc map; the maps-grounding rubric cites referer restrictions and Places quota.
- `mde-stripe` — payment / webhook / ticket conventions the ticketing rubric grades.
- `testing` — Vitest / Playwright / smoke conventions the PR rubric requires.
- `mde-task-lifecycle` — owns the writer side of the loop (plan → research → implement → test → ship).
- `security-auditor` — paired agent for the security half of the PR rubric.
- `performance-reviewer` — paired agent for the perf half of the PR rubric.

## Hook coverage

Two Stop hooks reinforce this skill's culture without overriding human judgement:

- `.claude/hooks/stop-attribution-gate.mjs` — blocks turn-end when the assistant claims success without an evidence marker. Negation-aware.
- `.claude/hooks/stop-rls-gate.mjs` — blocks turn-end when `supabase/migrations/**` was touched but the final message contains no `pg_policies` / `CREATE POLICY` / `supabase db reset` marker.

If either hook fires, the verifier has skipped a required check. Don't bypass — add the evidence.
