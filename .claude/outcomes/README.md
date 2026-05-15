# .claude/outcomes — Grader Rubric Library

Rubrics for the Claude Managed Agents **Outcomes** system. Each file is a markdown checklist the independent grader reads to score an artifact. The grader cannot see the writer's reasoning — it must find evidence on its own.

## Modes — pick before you start

Every rubric supports three modes. Default is **Full**. Use Fast only for trivial diffs; use Locked only when money or the Phase 1 gate is on the line.

| Mode | When to use | Iterations | Criteria run |
|---|---|---:|---|
| **Fast** | Copy/doc edit, dependency bump under 10 lines, isolated test addition, formatter-only PR | **1** | Only criteria marked `[Fast]` (typically: build / lint / test / typecheck) |
| **Full** | **Default.** Any feature, bugfix, edge-function change, or new migration | rubric default (3 / 5 / 5 / 8) | Every criterion not marked `[Locked-only]` |
| **Locked** | Phase 1 gate items, sponsor checkout (Miss Elegance Colombia), anything that affects money, RLS, or production credentials | rubric default + the grader runs each criterion **twice** to catch flake | **Every** criterion including `[Locked-only]` (Lighthouse, Camila E2E, Roberto scan, oversell probe, real Infobip delivery) |

If you cannot decide, pick Full. Document the mode in the first line of your verifier response: `Mode: Fast | Full | Locked`.

## Universal N/A rule

A criterion can be skipped with `N/A — <one-sentence reason>` only if the diff genuinely cannot exercise it (example: "N/A — PR adds no new tables, so RLS check does not apply"). Silence ≠ exemption.

Three things that are **never** N/A:

- Build, lint, test, typecheck — the floor always runs.
- Secret scan in the diff — always runs, even on doc PRs.
- §9 Definition of Done filled in — always required.

## Accepted evidence — examples by class

The grader rejects "looks fine" but **accepts** the following with these exact shapes:

| Class | Acceptable evidence |
|---|---|
| Command output | Last 3–5 lines including the line that contains `exit code` OR the line `✓ built in …` / `Tests N passed` / `✖ N problems`. No need for full stdout. |
| HTTP check | `curl -fsSL -o /dev/null -w "http=%{http_code}\n" <url>` → e.g. `http=200`. One line is enough. |
| SQL row | The SELECT statement + the returned row(s). For RLS: `relname | relrowsecurity` table with the value. |
| Screenshot | Path on disk (`./outcomes-evidence/<date>-<surface>-<viewport>.png`) and explicit viewport dimensions in caption. Never paste base64. |
| Test summary | `Test Files N passed` + `Tests M passed` line from vitest output. |
| Log excerpt | 3–10 lines around the relevant event, with timestamps. |
| Lighthouse | The four metric scores (Performance / Accessibility / Best Practices / SEO) as a JSON snippet or the `lhci` summary line. |
| Stripe session | `cs_…` ID, `amount_total`, `status` from `stripe sessions list` OR a Stripe Dashboard screenshot. |
| Email delivery | Infobip `messageId` + `status: DELIVERED_TO_HANDSET` OR a screenshot of the received email in a test inbox. |

If the evidence shape isn't in this table, paste the command + output anyway; the grader accepts unfamiliar evidence as long as it's concrete.

## External-service blockers

These rubrics depend on external services. If the service is unreachable during grading, the criterion **fails for 100 % certification** (cannot be silently skipped):

| Service | Used by | Blocker call-out |
|---|---|---|
| Stripe (test mode) | `events-ticketing.md` criteria 1, 2, 3, 11 | Requires `STRIPE_SECRET_KEY` (test) + either the `stripe` CLI (for signed-webhook simulation) OR a documented test-mode env that bypasses signature verification |
| Infobip | `events-ticketing.md` criterion 7 | Requires `INFOBIP_API_KEY` + a sandbox-capable phone/email |
| Google Maps Grounding Lite | `maps-grounding.md` criteria 8, 11 | Requires `GOOGLE_MAPS_API_KEY` with `mapstools.googleapis.com` enabled — currently a known blocker (`H2` from `grounding-runtime-hardening.md`) |
| Supabase local stack | `supabase-migration.md` criteria 1, 4, 6, 7 | Requires `supabase` CLI + running local stack on port 54321 |

If a blocker is hit, paste: `BLOCKED — <criterion id> — <service> unreachable. Reason: <one sentence>.` The verifier loop continues; the criterion fails until the blocker is resolved.

## How to use today (Phase 1 — manual, no API required)

Pick the right rubric for your task. Paste this prompt to Claude Code:

```
Use the rubric at .claude/outcomes/<name>.md to grade this change.
Run every command listed under "Coverage checklist", paste the output,
and format the result as described under "Output format".
Do not declare a criterion satisfied without evidence.
```

Replace `<name>` with:

| What you changed | Rubric |
|---|---|
| Any PR about to merge | `pr-review.md` |
| New `supabase/migrations/*.sql` file | `supabase-migration.md` |
| Map components, grounding client, Places SDK | `maps-grounding.md` |
| Ticket checkout, scanner, events tables | `events-ticketing.md` |
| Mastra agents / workflows / tools (`my-mastra-app/**`) | `mastra-workflow.md` |

## Available rubrics

| File | `max_iterations` | Trigger |
|---|---|---|
| `pr-review.md` | 3 | Every PR before merge |
| `supabase-migration.md` | 5 | Any new migration file |
| `mastra-workflow.md` | 5 | Any change under `my-mastra-app/src/mastra/**` |
| `maps-grounding.md` | 5 | Map or grounding diff |
| `events-ticketing.md` | 8 | Events / ticket / scanner diff; Phase 1 gate |

## Phase 2 (API wiring — not yet built)

When `scripts/outcomes/run-outcome.ts` is ready:

```bash
npx tsx scripts/outcomes/run-outcome.ts \
  --rubric .claude/outcomes/supabase-migration.md \
  --description "Audit supabase/migrations/20260514_grounding_quota.sql" \
  --max-iterations 5
```

## Rules for writing new rubrics

Before adding a new file here, verify it satisfies the meta-rubric in
`.claude/docs/best-practices/01-outcomes-plan.md §9`:

- Every criterion is binary (pass / fail, not "looks good")
- Every criterion requires evidence the grader can retrieve
- `OUTPUT FORMAT` section is present
- "Forbidden shortcuts" block anticipates the known dodges
- Tested against one known-good and one known-bad artifact
