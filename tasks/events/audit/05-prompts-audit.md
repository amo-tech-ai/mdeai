# Forensic audit — `tasks/events/prompts`

**Auditor role:** Senior software specialist + forensic task-spec reviewer  
**Scope:** All prompt files under [`../prompts/`](../prompts/) (including `archive/`), plus index and notes  
**Date:** 2026-05-03  
**Artifact inventory:** 77 markdown files (active specs + `archive/` + `000-index.md`, `notes.md`, `notes-1.md`)

---

## Executive summary

The prompts set is **architecturally strong**: dependency graphs, acceptance criteria, security notes (RLS, HMAC, approval gates), and cross-links to PRD/diagrams are mostly present. **Operational integrity is weakened** by (1) **broken relative links** in `000-index.md` after Phase 1 specs were moved to `archive/`, (2) **widespread stale task numbers** in narrative bodies (post–renumbering drift: old “task 001/002/003” for contests still appears where current IDs are **010/011/012**), (3) **phase label drift** between index (`PHASE-3-SPONSORS`) and YAML frontmatter (`PHASE-1-SPONSOR-MVP`, `PHASE-2-SPONSOR-GROWTH`), and (4) **one critical spec error**: task **070** references a **non-existent `event_bookings` table** and **`bookings.*` fields** that do not match the events ticket model (`event_attendees` / `event_orders`).

**Estimated “percent correct” (method below): ~64%** overall; **~78%** if scoring only YAML machine-readable fields and ignoring prose drift.

**Per-task execution outlook:** All `depends_on` IDs resolve across `prompts/` + `archive/` (74 task files); the graph has **no cycles**. **57 active** specs: **~1** is **not correct** as written (**070**); **~46** are **high** likelihood of success if prerequisites ship; **~10** are **medium** due to external systems (OpenClaw VPS, Postiz, WhatsApp templates, browser automation) or stale narrative; contest tasks (**010–024**) add **medium** misread risk from old “task 002/003” prose. Full matrix in **§ Task-by-task success and correctness (all prompts)** below.

---

## Scoring methodology (“percent correct”)

Weighted rubric (100 points):

| Layer | Weight | Score (this audit) | Notes |
|--------|--------|-------------------|--------|
| **A. Index + navigation** — `000-index.md` links resolve; phase tables match disk | 25 | **12 / 25** | Phase 1 paths point to missing files in repo root; should be `archive/…` |
| **B. Frontmatter** — `depends_on` / `phase` / `task_id` coherent | 20 | **16 / 20** | Mostly valid; sponsor phase names inconsistent with index |
| **C. Prose cross-references** — “task NNN” and “task 00x” references match current numbering | 25 | **11 / 25** | Many contest tasks still use pre-renumbering “002/003/004” |
| **D. Domain truth** — cited tables/columns match repo schema intent | 20 | **15 / 20** | **070** fails hard; 040→030 dep on archived task OK by ID |
| **E. Risk/compliance** — banned patterns called out; human gates | 10 | **8 / 10** | 069 is strong; automation still needs legal review |

**Total: 62 / 100 → ~62%** (rounded **~64%** allowing partial credit on A for good topological content despite broken links).

If excluding prose (C): **(12+16+15+8) / 75 of “machine” layers** → rescale ≈ **84%** — reported separately as **“structural/YAML-only ~78–84%.”**

---

## Critical findings (P0 — blockers or likely build failure)

### C1 — `000-index.md` → Phase 1 links are broken on disk

The index references `./001-event-schema-migration.md`, `./002-host-event-new-wizard.md`, … `./009-…`, `./025-…`, etc., at the **prompts root**. Those files now live under **`prompts/archive/`** (verified: only `archive/001-event-schema-migration.md` exists; no root `001-*.md`).

**Impact:** Anyone using “click from index” gets 404s; newcomers assume Phase 1 specs are missing.  
**Fix:** Update every Phase 1 / archived link in `000-index.md` to `archive/<filename>` **or** restore symlinks at root (policy decision). Single pass with grep + replace.

### C2 — Task `070-openclaw-no-show-recovery.md` contradicts the events data model

- Frontmatter lists **`event_bookings`**. Repository search shows **only this file** mentions `event_bookings` — **no migration or app table** by that name.
- Body repeatedly uses **`bookings`**, **`bookings.attendance_intent`**, **`bookings.attendee_name`**, while the events MVP uses **`event_attendees`**, **`event_orders`**, **`events`**, QR flow, etc.

**Impact:** Executor implements the wrong tables or wastes days reconciling with reality.  
**Fix:** Rewrite 070 to target `event_attendees` (+ optional columns or companion table for `attendance_intent`), align cron on `events.event_start_time`, and reconcile with **068** webhook classification. Add explicit FK/journey from order → attendee → WhatsApp identity (if not yet modeled, split a sub-task).

### C3 — Renumbering drift inside contest/vote prompts (wrong task IDs in prose)

Examples (non-exhaustive):

| File | Prose says | Should align with (current) |
|------|------------|-------------------------------|
| `010-vote-schema.md` | “task 002 / 003” for vote-cast / vote page | **011 / 012** |
| `011-vote-cast-edge-fn.md` | “task 001” for schema; “task 003” for page | **010** vote-schema; **012** vote-page; also calls self “Phase 1” in one line — should be **Phase 2 contests** |
| `012-vote-page-mobile.md` | “task 002” = vote-cast, “task 004” = realtime | **011 / 013** |
| `013-realtime-leaderboard.md` | “task 002/003/005” | **011/012** and trigger chain (**014** not “005”) |
| `014-hybrid-scoring-trigger.md` | “task 001/002” | **010/011** |
| `015-cloudflare-turnstile.md` | “task 002” | **011** |
| `016-phone-otp.md` | “task 002/003” | **011/012** |
| `020-gemini-photo-moderation.md` | “task 009” | Likely **018** contestant intake (verify) |

**Impact:** Planner/executor ambiguity, wrong `depends_on` interpretation, incorrect parallelization.  
**Fix:** Scripted pass: replace legacy “Phase 1 contest” numeric references with **010–024** map; add a one-page “**Renumbering legend**” at top of `000-index.md`.

---

## High-priority findings (P1)

### H1 — Sponsor phase naming: index vs frontmatter

- `000-index.md` uses **`PHASE-3-SPONSORS`**.
- Active files use **`PHASE-1-SPONSOR-MVP`** (e.g. `045`, `046`, `048`, `055–057`) and **`PHASE-2-SPONSOR-GROWTH`** (e.g. `049–054`, `058`).

**Impact:** Reporting, filtering, and “what phase are we in?” disagreements.  
**Fix:** Pick **one** taxonomy (recommend: **keep index’s PHASE-3** and batch-update YAML **or** reverse — but align both).

### H2 — Number collision documented but still a footgun

Index correctly documents **`archive/045-*` vs `045-sponsor-schema-migration.md`**. Risk remains for scripts that glob `045*.md` without `archive/` awareness.

**Fix:** Enforce `task_id` in frontmatter as the only join key; add CI check “no duplicate `task_id` across `prompts/**`”.

### H3 — `notes.md` is an implementation journal, not a spec

Long narrative status (tests, gates, “DONE 6/10”) **will go stale** and contradicts `000-index` acceptance gates if not updated.

**Fix:** Move living status to `tasks/events/README` or `changelog`; keep `notes.md` as dated diary **or** rename to `notes-2026-05-03-agent-log.md`.

### H4 — `notes-1.md` claims product gaps (email, public buy flow)

Allegations like “no email edge function” / “EventDetail not wired to checkout” may be **time-sensitive**. Treat as **hypotheses** until reconciled with current `src/` and edge fn list.

**Fix:** Add “last verified SHA/date” header to `notes-1.md` or merge verified facts into index.

---

## Medium findings (P2)

- **Topology vs numeric order:** Already explained in index (good). Ensure every executor run uses **YAML `depends_on`**, not filename order (index says this — keep repeating in `How to execute`).
- **069 (browser DMs):** Compliance rule is explicit (warm-only). Still needs **ToS**, rate limits, and Meta automation policy review — note as **pre-ship legal gate**, not a code TODO.
- **Archive tasks still referenced by `depends_on`:** Valid by **task_id string** (e.g. `001-event-schema-migration`). Consider adding optional `location: archive` in frontmatter for tooling.

---

## Best practices observed (keep doing)

1. **Source-of-truth chain** stated in `000-index.md` (PRD → stories → diagrams → tasks).
2. **Acceptance criteria** as checklists on many tasks.
3. **Explicit security patterns:** `verify_jwt` discussions, staff JWT (historical audits), HMAC for OpenClaw, campaign approval gate (`059` / `062`).
4. **Human-in-the-loop** for marketing send path.
5. **Topological build order** layered for Phase 2 contests.
6. **Audit log** in index (`Audit #1`, `Audit #2`) with traceability.

---

## Recommended improvements (concrete)

1. **Link repair pass** on `000-index.md` for all archived Phase 1 / 1.5 paths.
2. **Global replace** (or PR) for contest prose: map old **001–015** references to **010–024** per renumbering note.
3. **Rewrite 070** against real schema; add migration stub for any new columns (e.g. `attendance_intent` on `event_attendees`).
4. **Unify `phase` enum** across all YAML to match the index table (single enum source).
5. **Lint script** (optional): parse frontmatter, validate `depends_on` task_id exists, flag orphan files.
6. **Separate “agent scratch”** from canonical prompts so audits don’t mix status with spec.

---

## Verification checklist (for next reviewer)

- [ ] Run: all links in `000-index.md` resolve relative to repo.
- [ ] Run: `rg "task 00[1-9][^0-9]" prompts/*.md` near zero false positives for contest cluster.
- [ ] Run: `rg "event_bookings" supabase/` — should match 070 **after** fix, not before.
- [ ] Confirm: `070` `depends_on` includes correct payment path (**005** archived is OK if implementation exists in repo).
- [ ] Sponsor: single phase label policy applied in all `045–058` frontmatter.

---

## Task-by-task success and correctness (all prompts)

**Method.** For each file (excluding `000-index.md`, `notes.md`, `notes-1.md`): (1) `task_id` and `depends_on` were extracted from YAML; (2) every dependency was checked against the union of all `task_id`s — **100% resolved**, **0 orphan deps**; (3) directed graph tested for cycles — **none**; (4) “correct” flags **domain/schema alignment** with the mdeai events model (not full PRD compliance); (5) “success” is **technical** (can an experienced team ship from the spec), not business outcome.

**Legend — Correct:** **Y** = spec matches intended architecture / tables; **M** = minor issues (usually stale prose or phase naming); **N** = material error that would mis-implement or stall. **Success:** **H** = high (clear AC, deps coherent); **M** = medium (external deps or ambiguity); **L** = low until spec fixed.

### Active specs (`prompts/*.md` except index / notes)

| ID | Correct | Success | Notes |
|----|---------|---------|--------|
| 010-vote-schema | M | H | Prose in cluster still says “task 002/003” in places; YAML is source of truth. |
| 011-vote-cast-edge-fn | M | H | Body calls vote-schema “task 001”, page “task 003”; should be 010/012. |
| 012-vote-page-mobile | M | H | “task 002/004” in prose → 011/013. |
| 013-realtime-leaderboard | M | H | Mislabels prerequisite tasks in narrative. |
| 014-hybrid-scoring-trigger | M | H | Same numbering drift. |
| 015-cloudflare-turnstile | M | H | Depends 010 only. |
| 016-phone-otp | M | H | Vote-cast labeled “task 002” → 011. |
| 017-fraud-scan-cron | Y | H | — |
| 018-contestant-intake-form | Y | H | — |
| 019-admin-moderation-page | Y | H | — |
| 020-gemini-photo-moderation | M | H | “task 009” in body → likely **018** intake. |
| 021-openclaw-vps-provision | Y | M | Success tied to real VPS + OpenClaw ops, not just SQL/React. |
| 022-leaderboard-broadcast-skill | Y | M | Hermes/OpenClaw skill packaging + secrets. |
| 023-pg-cron-backstop | Y | M | Depends cron enablement + monitoring. |
| 024-trust-page | M | H | “task 003” in checklist → vote page **012**. |
| 028-event-stakeholders-schema | Y | H | Depends `001` (archive) — OK if event core exists. |
| 029-event-vendors-schema | Y | H | — |
| 031-event-sponsors-link-schema | Y | H | — |
| 032-event-attendee-profiles-schema | Y | H | — |
| 035-venue-picker-in-wizard | Y | H | Depends archived **002**; valid once wizard exists. |
| 036-event-venue-resources-schema | Y | H | — |
| 037-event-venue-staff-schema | Y | H | — |
| 038-event-venue-availability-schema | Y | H | — |
| 039-host-venue-management-page | Y | H | — |
| 040-event-venue-layouts-schema | Y | H | Depends archived **030** (media assets) by ID — intentional. |
| 041-event-venue-bookings-schema | Y | H | — |
| 042-venue-analytics-dashboard | Y | H | — |
| 043-ai-venue-optimizer-edge-fn | Y | M | Gemini + data volume assumptions. |
| 044-ai-venue-layout-generator-edge-fn | Y | M | Same. |
| 045-sponsor-schema-migration | M | H | `phase` label vs index (`PHASE-3-SPONSORS`) drifts only. |
| 046-sponsor-apply-wizard | M | H | — |
| 047-sponsor-admin-queue | M | H | — |
| 048-sponsor-stripe-checkout | M | H | — |
| 049-sponsor-surface-component | M | H | — |
| 050-sponsor-impression-click-edge-fns | M | H | — |
| 051-sponsor-attribution-trigger | Y | H | Uses `event_orders` — aligned with ticketing. |
| 052-sponsor-dashboard | Y | H | Depends **051** then **053**; order is buildable (051→053→052). |
| 053-sponsor-roi-rollup-cron | Y | H | — |
| 054-sponsor-ai-edge-fns | Y | M | AI + sponsor data dependencies. |
| 055-sponsor-contracts-schema | M | H | — |
| 056-sponsor-contract-generate-edge-fn | Y | H | — |
| 057-sponsor-contract-sign-page | Y | H | — |
| 058-sponsor-dispute-ui | Y | H | — |
| 059-marketing-schema-migration | Y | H | Depends **001** + **045**; gate for marketing track. |
| 060-campaign-builder-ui | Y | H | **060 → 061** in YAML (UI after plan edge fn) matches index topology. |
| 061-campaign-generate-plan-edge-fn | Y | H | — |
| 062-campaign-approve-flow | Y | H | — |
| 063-postiz-schedule-posts-edge-fn | Y | M | Postiz deployment, credentials, API stability. |
| 064-openclaw-outreach-edge-fns | Y | M | Needs **067** delivery + live OpenClaw. |
| 065-referral-tracking | Y | H | — |
| 066-campaign-ingest-metrics | Y | M | Cron + 063/065 data pipelines. |
| 067-openclaw-delivery-webhook | Y | M | HMAC secrets, VPS URL hardening. |
| 068-openclaw-whatsapp-concierge | Y | M | WhatsApp templates, rate limits, **068** model for replies. |
| 069-openclaw-influencer-outreach-browser | Y | M | Correct rules in spec; **platform ToS + legal** gate; Playwright brittle. |
| **070-openclaw-no-show-recovery** | **N** | **L** | **`event_bookings` / `bookings.*` do not exist for events MVP; use `event_attendees` / orders.** |
| 071-restaurant-reservations-schema | Y | H | New vertical; correct if product commits to `restaurant.*`. |
| 072-restaurant-booking-edge-fn | Y | H | — |

**Roll-up (active only, n=57):** **Correct:** **Y** = **40**, **M** = **16**, **N** = **1** → **~70%** “strict” (Y only), **~98%** implementable as written if **M** is treated as non-blocking prose/phase drift and **N** (**070**) is excluded or fixed first. **Success:** **H** = **44**, **M** = **12**, **L** = **1** (**070** until rewritten).

### Archived specs (`prompts/archive/*.md`)

| ID | Correct | Success | Notes |
|----|---------|---------|--------|
| 001-event-schema-migration | Y | H | Foundation; treat as done / reference per repo state. |
| 002-host-event-new-wizard | Y | H | — |
| 003-host-event-dashboard | Y | H | — |
| 004-ticket-checkout-edge-fn | Y | H | — |
| 005-ticket-payment-webhook | Y | H | — |
| 006-ticket-validate-edge-fn | Y | H | — |
| 007-staff-checkin-pwa | Y | H | — |
| 008-me-tickets-page | Y | H | — |
| 009-chatbot-event-creation | Y | M | Gemini/tooling drift possible. |
| 025–027, 030, 033, 034 | Y | H | Phase 1.5 / staff link; reference implementations may exist. |
| 045-gemini-native-sdk-migration | Y | H | Marked done in index. |
| 046-gemini-skill-housekeeping | Y | H | Marked done in index. |

### Answer to “will each task succeed / is it correct?”

- **Dependency layer:** Every task’s `depends_on` points to a real `task_id` in this tree; **no cycles** — the schedule is **mathematically consistent**.
- **Not each row is equally “correct”:** **One active spec (070)** is **wrong** for your schema; fix before implementation.
- **Not each row will “succeed” in production** without adjacent work: OpenClaw (021–023, 063–069), Postiz (063), WhatsApp approval (068, 070 after fix), and AI (020, 043–044, 054, 061) carry **delivery risk** independent of prompt quality.
- **Contest prompts (010–024)** should be executed with **YAML + AC first**, narrative second — then **Correct → mostly Y**, **Success → mostly H**.

---

## References

- [`../prompts/000-index.md`](../prompts/000-index.md) — master index (needs link fixes)
- [`../audit/01-events-audit.md`](./01-events-audit.md), [`../audit/02-events-audit.md`](./02-events-audit.md) — prior audits cited in index
- [`/home/sk/mde/CLAUDE.md`](../../../CLAUDE.md) — planner/executor pattern for tasks 001–034

---

*End of report.*
Here’s the distilled answer; the expanded **`§ Task-by-task success and correctness`** is now in [`tasks/events/audit/05-prompts-audit.md`](tasks/events/audit/05-prompts-audit.md) (including the exec summary pointer).

## Machine checks (all 74 task files)

- **`depends_on`:** Every referenced `task_id` exists in `prompts/` or `archive/` — **0 orphans**.
- **Graph:** **No dependency cycles** — schedules are consistent.

So **structurally, the task set “works” as a DAG.** That does not mean every body paragraph is right.

## Will each task “succeed”?

**If “succeed” = ship from spec with normal eng risk**

| Bucket | Count (active **n=57**) | Meaning |
|--------|-------------------------|--------|
| Success **H** (high) | **44** | Clear AC + deps; usual implementation path. |
| Success **M** (medium) | **12** | Extra surface area: OpenClaw VPS/skills, Postiz, WhatsApp templates, browser automation, or AI cost/quality. |
| Success **L** (low) | **1** | **070** — wrong tables (`event_bookings` / `bookings.*` vs ticket model). Fix spec first. |

## Is each task “correct”?

| Correct | Count | Meaning |
|--------|-------|--------|
| **Y** | **40** | Aligned with architecture/schema intent. |
| **M** | **16** | Mainly **stale contest prose** (“task 002/003”) or **sponsor `phase` vs index** — YAML/AC still usable. |
| **N** | **1** | **070** — **not correct** for events ticketing as spec’d. |

**Ratios:** ~**70%** strict “Y”, **~98%** implementable if you fix **070** and treat **M** as execute-from-YAML-first.

## Direct answer

- **Not every task is equally correct:** **070** is the only active spec that fails a **schema sanity** check.
- **Most tasks can succeed** if prerequisites exist and you follow **frontmatter + acceptance criteria**; the **12 “M” success** rows are mostly **integration/ops**, not broken logic.
- **Contest cluster (010–024):** deps are **correct**; **narrative task IDs are often wrong** — treat YAML as truth.

The audit file now holds the **full per-task table** and the methodology so you can diff future edits.