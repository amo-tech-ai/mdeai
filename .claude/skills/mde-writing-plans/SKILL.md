---
name: mde-writing-plans
description: Write clear technical docs, READMEs, runbooks, architecture notes, epic/task prompts, and implementation plans for mdeai.co — including real-world examples and easy user stories where they clarify behavior. Use when the user asks to document something, create a README or runbook, write an implementation or rollout plan, draft task specs (tasks/prompts), author or improve a Claude/Cursor skill, structure multi-step work with verification, add acceptance criteria as user stories, or edit markdown for clarity. Also use for "writing-plans", "plan-writing", "documentation", "docs writer", "user story", or "how should we plan this feature" — this is the consolidated mde writing stack.
---

# mde writing & planning (best-of)

Synthesizes **documentation**, **docs-writer-style prose**, **writing-plans** (detailed agentic plans), **plan-writing** (short plans), and **skill-creator** patterns — adapted for **mdeai.co** (Vite/React, Supabase, `tasks/`, `docs/`, `plan/`).

---

## When to use which mode

| Situation | Mode | Where to save |
|-----------|------|----------------|
| User-facing or team docs, API, ADR, onboarding | **Documentation** | `docs/`, root `README.md` |
| Epic/task prompts, audits, notes | **Task spec** | `tasks/prompts/`, `tasks/notes/`, `tasks/audit/` |
| **Another agent / future session** implements with no codebase context | **Detailed plan** (writing-plans style) | `plan/` or `tasks/` — user preference wins |
| **This session**, small feature, &lt; ~10 steps | **Short plan** (plan-writing style) | Project root or `tasks/` short file |
| New `.claude/skills/<name>/SKILL.md` | **Skill authoring** | See [Skill packages](#skill-packages-minimal) |

**Conflict resolution:** `writing-plans` wants exhaustive step-by-step code; `plan-writing` wants ≤1 page and ≤10 tasks. Use **short** for quick alignment; use **detailed** when the user explicitly wants handoff to subagents or zero-context execution.

---

## Shared prose standards (docs + plans + skills)

1. **BLUF / answer first** — What this is, who it’s for, then details. Match `.cursor/rules/clear-descriptions.mdc`.
2. **Active voice, present tense**, address the reader as **you** where appropriate.
3. **One real-world anchor** per abstract idea — mde: travelers, Medellín listings, Supabase edge, Shopify, AI concierge (when it clarifies). See [Real-world examples & user stories](#real-world-examples--user-stories).
4. **Requirements:** distinguish **must** (security, correctness) from **should** / **we recommend**.
5. **Avoid** vague stacks (“robust, seamless”) without one concrete behavior or example.
6. **Internal vs external:** For **user-facing** strings, avoid idioms; for **internal** technical notes, `e.g.` / concise Latin abbreviations are acceptable if the team prefers speed.

---

## Real-world examples & user stories

Use these when the reader could ask **“but what actually happens?”** — multi-step flows, new features, edge vs CLI boundaries, CRM, payments, or anything with **more than one actor** (traveler, host, ops, system).

### When to add them

| Need | What to add |
|------|-------------|
| Abstract architecture | **One short scenario** (3–6 sentences): who does what, in order, on which surface (app, edge, dashboard). |
| Feature / epic / task prompt | **Primary user story** + **acceptance** tied to observable behavior (UI state, API response, DB row). |
| Plan verification steps | Map **Verify:** to the story — e.g. “Traveler completes flow → row appears under RLS,” not only “tests pass.” |
| Internal tools (Hermes, Paperclip) | **Who never sees this** (e.g. renters don’t run the CLI) vs **who does** (ops, engineer). |

### Lightweight formats (pick one; don’t over-formalize)

**Mini story** (fastest):

> **Scenario:** A signed-in traveler schedules a showing from an apartment page. They should see the booking reflected under **My rentals** without reloading forever.

**Role — intent — outcome** (one line each):

- **As a** traveler **I want** to save a listing **so that** I can compare it later on mobile.
- **As an** operator **I need** deploy smoke to pass **so that** we don’t ship a broken `p1-crm` to production.

**Given / When / Then** (good for acceptance and tests):

- **Given** a valid JWT and an apartment with availability, **when** `schedule_showing` runs, **then** a row exists in `showings` and the UI shows success or structured error.

### mde anchors (examples — adapt to the doc)

| Actor | Example angle |
|-------|----------------|
| Traveler | Search, save, book, chat concierge, checkout (Shopify), Spanish/English UI |
| Local / host | Listings, showings, payouts (later Mercur phase) |
| Ops / admin | CRM pipeline, Paperclip tasks, Hermes CLI research (not end-user) |
| System | Supabase RLS, edge JWT, Gadget sync, `ai_runs` logging |

### Weak → strong

| Weak | Stronger |
|------|----------|
| “The feature works.” | “Traveler taps **Schedule tour**, confirms in the dialog, and sees the tour under **My rentals** within one session.” |
| “API is secure.” | “Anonymous `POST` returns 401; same body with `Authorization: Bearer <session>` returns 200 and creates one `leads` row.” |
| “Ranking is correct.” | “Same search repeated twice returns the **same order** for the same user prefs (deterministic edge rank).” |

**Rule:** Stories and examples should be **easy to picture**; stack details come after. For **task prompts** (`tasks/prompts/`), put the story near **Acceptance criteria** so implementers can trace checkboxes to a narrative.

---

## Documentation types (quick)

| Type | Must include |
|------|----------------|
| **README** | What/why, quick start (&lt;5 min), config, link to deeper docs |
| **API** | Auth, errors, rate limits, request/response examples |
| **Runbook** | When to use, prerequisites, steps, rollback, escalation |
| **Architecture** | Goals, diagram or flow, decisions/trade-offs, integrations |
| **Onboarding** | Env setup, key systems, common tasks, who to ask |
| **Feature / PRD slice** | User story or scenario + acceptance criteria + links to epics |

**Principles:** Write for the reader; show commands/code; link instead of duplicating; stale docs are worse than missing docs. Add a **short user story or scenario** when acceptance would otherwise be only buzzwords.

---

## Detailed implementation plan (writing-plans style)

Use when the spec is multi-step and someone **without repo context** might execute it.

**Announce:** e.g. “Using the detailed implementation plan pattern.”

**Before tasks:** Map files to create/modify and responsibilities; follow existing mde patterns (`@/` imports, shadcn, edge function layout).

**Granularity:** Bite-sized steps (roughly one logical action each); include **exact paths** under `src/`, `supabase/`, etc.

**Header template:**

```markdown
# [Feature] — implementation plan

> **Handoff:** For task-by-task execution, prefer checkpoints between tasks.

**Goal:** [one sentence]

**User story (optional but recommended):** [As a … I want … so that …] or a 2–3 sentence scenario — makes verification steps obvious.

**Approach:** [2–3 sentences]

**Stack:** [e.g. Vite, Supabase Edge, Zod]

---
```

**Each task:** Files touched, checkboxes, **no placeholders** — no “TBD”, no “add validation” without specifying what; if code changes, show code or exact interface.

**Self-review:** Spec coverage, placeholder scan, naming consistency across tasks.

**Save location:** Prefer `plan/docs/` or `tasks/` per project convention; `docs/superpowers/plans/` only if using that workflow.

---

## Short plan (plan-writing style)

Use for same-session or small scope.

- **Goal** in one sentence.
- **≤ ~10 tasks**, each with a **verifiable** outcome.
- **Order:** dependencies first; **verification last** when it’s a single rollout.
- Prefer **mde scripts:** `npm run build`, `npm run test`, `npm run verify:edge`, `supabase db push` — not generic placeholders.

**Flexible outline:**

```markdown
# [Task name]

## Goal
...

## User story (if helpful)
One scenario or **As a / I want / so that** — keeps tasks tied to real behavior.

## Tasks
- [ ] ... → Verify: ...
- [ ] ... → Verify: ...

## Done when
- [ ] ...
```

If the plan exceeds one page, split into phases or multiple plans.

---

## Skill packages (minimal)

From **skill-creator** — use when authoring under `.claude/skills/<name>/`:

```
skill-name/
├── SKILL.md          # YAML: name, description (triggering — be specific + “pushy”)
└── references/       # optional deep dives
```

- **description** field: primary trigger signal — include *when* to use, not only *what* it does.
- **Body:** imperative instructions; keep **&lt; ~500 lines** in SKILL.md; move long reference to `references/`.
- **Progressive disclosure:** metadata → SKILL.md → optional files.
- **Explain why**, not only MUST/NEVER — unless safety-critical.
- **Test:** 2–3 realistic user prompts; iterate on failures without overfitting to one phrasing.

Packaging scripts (`package_skill`, eval viewer) are optional; use full **skill-creator** skill when you need eval loops and benchmarks.

---

## Docs-writer carryovers (generic only)

**Do not** treat this repo as “Gemini CLI” or copy Google-internal paths.

**Do** adopt:

- Overview paragraph after each major heading where it helps scanning.
- Numbered lists for **sequences**; bullets for **non-sequential** items; parallel wording across list items.
- **Bold** for UI labels; `code` for paths, commands, API names.
- Descriptive link text (not “click here”).
- When changing headings, **update deep links** from other pages.

Optional: GFM alerts (`> [!NOTE]`, etc.) for important caveats.

---

## mde-specific reminders

- **Three-panel layout**, **propose-only AI**, **four states** for data UI — reference `CLAUDE.md` when documenting frontend.
- **Secrets:** never document service role or private keys; edge-only patterns for public docs.
- **Epic prompts:** map to `tasks/prompts/INDEX.md`; lettered subtasks like `04A-*` / `04B-*` (E4) and `10A-*` … `10C-*` (E10) live beside epic index files.

---

## Don’t

- Paste **entire** Gemini CLI / foreign-repo contribution rules into mde docs.
- Use **plan-writing** “save only in project root” if the team standard is `tasks/` or `plan/` — **mde conventions win**.
- Produce **two** full contradictory plans in one file (detailed + short) — pick one mode per deliverable.
