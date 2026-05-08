# Task Writing Convention

> Every task — whether a row added to [tasks/todo.md](../../tasks/todo.md), a prompt file in [tasks/prompts/](../../tasks/prompts/), a `mdeai-planner` plan, or a PR description — must follow this template. Plain English, non-engineer readable.
>
> **A task is not done until §9 Definition of Done is fully checked.** Continuous testing is mandatory — see [CLAUDE.md → Definition of Done](../../CLAUDE.md). Tasks without a completed §9 do **not** move from `tasks/todo.md` to `changelog`.

## Required sections (in this order)

```markdown
---
id: <ID, e.g. C02 / G3 / V1>
title: <one-line title>
status: Not Started | In Progress | Blocked | Done
priority: P0 | P1 | P2
effort: <n hours / n days>
owner: <person or skill>
depends_on: [<other task ids>]
skill: [<.claude/skills/ owners that apply>]
---

# <ID> — <Title>

## 1. Purpose

One paragraph. Why does this task exist? What problem does it solve for which user / role / revenue path? Plain English — no jargon without a definition.

## 2. Goals

Bullet list of measurable outcomes. Each goal should be checkable after the task ships.

- Goal 1 (with the number / threshold that proves success)
- Goal 2

## 3. Features (what the user gets)

Bullet list of user-visible features. No file paths, no code — what changes on screen, in the inbox, in the dashboard.

- Feature 1
- Feature 2

## 4. Workflows

Step-by-step. Number each step. One sentence per step. If there are branches, show them.

1. Step 1
2. Step 2
3. …

## 5. User journeys

Walk through the journey for **each persona** that touches this task (Camila / Roberto / Miguel / Sofía / Andrés / Patricia — see [prd.md §1.6](../../prd.md)). One short paragraph per persona.

- **<Persona>** — what they do, what they see, what success looks like.

## 6. Agents

Which AI agents (from the [prd.md §3.1](../../prd.md) registry) participate? For each: which model, which tool calls, which propose-only contract.

| Agent | Edge fn | Model | What it does in this task |
|-------|---------|-------|---------------------------|
|       |         |       |                           |

If no AI agents are involved, write "None" and explain why this is a non-AI flow.

## 7. Integrations

External services and internal modules touched. Name each, link to the docs, and note auth direction.

| Integration | Purpose | Auth source |
|-------------|---------|-------------|
| Supabase    | …       | service role via edge fn |
| Stripe      | …       | Infisical → Supabase secret |

## 8. Summary

3 sentences max. (1) what we're building, (2) who it helps, (3) how we'll know it worked. This is the version you'd paste in a Slack update.

## 9. Definition of Done (continuous testing — mandatory)

A task is **not** done until every applicable row below is checked. "Code merged" is not the finish line — **tested + verified live** is.

- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] `npm run test` clean and **count did not regress** (new logic = new tests; bugs = regression test that fails without the fix)
- [ ] `npm run verify:edge` clean *(only if `supabase/` was touched — else write "N/A — no edge-fn change")*
- [ ] E2E covered *(Playwright spec OR documented manual run with screenshot — only if user-facing flow touched; else "N/A")*
- [ ] Live verification on https://www.mdeai.co after Vercel deploy *(only if UI shipped to prod; HTTP 200 + visual check)*
- [ ] PR body lists what was tested + result for each layer

If a layer is N/A, **say so explicitly** in §9 of the task / PR. Silence ≠ exemption. Skill: [`mde-testing`](../../.claude/skills/mde-testing/), [`test-driven-development`](../../.claude/skills/test-driven-development/).
```

## Style rules

- **Lead with what the user can see.** No file paths in §1 / §3 / §8. Save those for §4 / §6 / §7.
- **Define every acronym the first time it appears.** Words like *SSE*, *RLS*, *pgvector*, *TDZ*, *OTP*, *JWT* each get a one-line plain meaning the first time they show up in the task.
- **Use concrete numbers and outcomes.** "30 staff scans/min on a Pixel 4a in airplane mode" beats "fast scanning."
- **One sentence per step.** Walls of prose don't get read.
- **Show the failure mode.** If the task can fail (oversell, double-charge, expired link), say what happens and how the system responds.
- **Flag what's NOT in scope** at the bottom of §1 or §8. "Not in this task: refunds, tax rules" prevents scope creep.
- **No code blocks unless they're API contracts (SSE event shapes, JSON envelopes, SQL signatures).** Implementation notes go in §4 only when they affect what the user sees.

## Where this template gets used

- [tasks/prompts/chat/C*.md](../../tasks/prompts/chat/) — every chat-track prompt.
- [tasks/prompts/core/](../../tasks/prompts/core/) — every core-prompt file.
- New rows added to [tasks/todo.md](../../tasks/todo.md) — the row points at a `tasks/prompts/<area>/<ID>.md` file written in this template.
- Plans produced by `mdeai-planner` agent.
- PR descriptions for any feature work.

## Why this exists

The user manages mdeai but is not a daily coder. Tasks written for engineers (file paths, framework names, library APIs in the first paragraph) cost minutes per task to translate. This template flips the order: **purpose → goals → features → workflow → personas → tech**. The reader knows in 30 seconds whether a task is worth their time, and the engineering details are still there when needed.
