# Rubric selection — which file, which mode

> Companion to [`outcomes/SKILL.md`](../SKILL.md). Pick the rubric → pick the mode → estimate iterations.

## Pick the right rubric

| Situation | Rubric file | Why |
|---|---|---|
| Any PR opened against `main` | [`.claude/outcomes/pr-review.md`](../../../outcomes/pr-review.md) | Floor checks: lint / typecheck / build / test / verify:edge + scope / secrets / Definition-of-Done |
| New file under `supabase/migrations/` or `supabase/schemas/` | [`.claude/outcomes/supabase-migration.md`](../../../outcomes/supabase-migration.md) | RLS coverage, idempotency, indexes, generated types, edge fn impact |
| Map / grounding / Places diff (`src/**/*Map*`, places client, `@vis.gl/react-google-maps`) | [`.claude/outcomes/maps-grounding.md`](../../../outcomes/maps-grounding.md) | Mobile + desktop screenshots, marker count parity, Places quota, key-restriction proof |
| Ticket flow (`events_tickets`, `ticket-payment-*`, scanner PWA) OR the Phase 1 gate | [`.claude/outcomes/events-ticketing.md`](../../../outcomes/events-ticketing.md) | Stripe idempotency probe, oversell probe (50 concurrent), QR single-use, RLS cross-event, host dashboard |
| Mastra agents / workflows / tools (`my-mastra-app/**`) | [`.claude/outcomes/mastra-workflow.md`](../../../outcomes/mastra-workflow.md) | `mastra-smoke.sh` runtime probe, tool registry whitelist, agent-DB-write audit, tenant isolation grep, `ai_runs` observability, Locked: router intent preservation + workflow state recovery |

## Pick the mode

| Mode | When | What changes |
|---|---|---|
| **Fast** | Low-risk PR (docs only, copy edits, dependency bump under 10 lines, isolated test additions). | Run **only criteria 1–4** of the rubric (build / lint / test / typecheck). Skip scope-match deep checks. `max_iterations = 1`. |
| **Full** | Default. Anything user-facing, anything touching `supabase/`, `src/`, edge functions, or Phase 1 gate items. | Run **every** criterion in the rubric's Coverage checklist. Use the `max_iterations` value the rubric file specifies. |
| **Locked** | Phase 1 gate items, sponsor checkout, anything with a documented dollar impact. | Full mode + the grader runs each criterion **twice** (once mid-iteration, once at terminal) to catch flake. Block on any difference. |

Default to Full. Use Fast only when the diff is mechanically trivial and the writer explicitly justifies it in the PR body.

## Iteration recommendations

These mirror [`tasks/claude-code/01-outcomes-plan.md §3`](../../../../tasks/claude-code/01-outcomes-plan.md):

| Rubric | `max_iterations` | Cost expectation |
|---|---:|---|
| `pr-review` | **3** | Build / typecheck / test are deterministic — if it fails 3× the diff is wrong, not the harness. |
| `supabase-migration` | **5** | RLS + index + types may need 2-3 separate revisions. |
| `maps-grounding` | **5** | Mobile drawer / desktop / Places quota are 3 orthogonal failure modes. |
| `events-ticketing` | **8** | Stripe + QR + RLS + load test = ≥ 4 orthogonal axes. |
| `mastra-workflow` | **5** | Smoke + tool registry + agent boundary grep are deterministic; router intent + recovery probes are slower. |

If the loop hits the cap with the **same** issue every time, **stop the loop** and revise the rubric or the description — the writer can't act on the feedback. Don't blindly extend the cap.

## Multi-rubric runs

A PR that touches both `supabase/migrations/` AND `src/**/*Map*` runs **two outcomes in sequence**:

```
1. Run supabase-migration.md to satisfied.
2. Run maps-grounding.md to satisfied.
3. Only after both pass, run pr-review.md as the wrap-up.
```

Do not merge until all three reach `satisfied`. If any reach `max_iterations_reached`, treat as failure — fix and rerun.

## Writing new rubrics

Before adding a new file under `.claude/outcomes/`, verify it satisfies the meta-rubric in [`tasks/claude-code/01-outcomes-plan.md §9`](../../../../tasks/claude-code/01-outcomes-plan.md):

- Every criterion is binary (pass / fail, never "looks good").
- Every criterion requires evidence the grader can fetch fresh.
- An `OUTPUT FORMAT` section is present.
- A "Forbidden shortcuts" block anticipates the known dodges.
- The rubric was tested against one known-good and one known-bad artifact before shipping.

Then update [`.claude/outcomes/README.md`](../../../outcomes/README.md) with the trigger and `max_iterations`.
