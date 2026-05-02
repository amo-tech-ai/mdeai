# Forensic audit — planning artifacts (mde real estate vertical)

| Field | Value |
|-------|--------|
| **Auditor role** | Senior software specialist + forensic auditor |
| **Scope** | `tasks/prompts/*`, `tasks/wireframes/*`, `tasks/prd-real-estate.md`, `tasks/progress.md`, `tasks/roadmap.md`, `tasks/todo.md`, `tasks/index.md` |
| **Date** | 2026-04-05 |
| **Method** | Cross-document consistency, dependency sanity, security vs claims, execution readiness, industry best-practice gap analysis |

---

## Executive summary

The planning stack is **strong on narrative and structure** (PRD, epics, prompts with YAML, wireframes, roadmap sequencing). **Execution reality** in `progress.md` (~35% complete, **8 critical security findings**) is **not yet reconciled** with the PRD’s “ship MVP in 6 weeks” tone. Treat **security + seed data + Stripe** as **hard gates** before any production or paid pilot.

| Dimension | Score | Notes |
|-----------|-------|--------|
| **Plan coherence** (docs agree with each other) | **72%** | Several path naming and RICE-ranking inconsistencies (below). |
| **Best-practice coverage** (tests, security, observability, traceability) | **58%** | Documented in progress; most items **not done**. |
| **Execution readiness** (what can ship) | **~35%** | Aligns with `progress.md` overall; **not** a judgment on PRD quality alone. |
| **Weighted “plan correctness”** | **~68%** | Strong content, undermined by inconsistencies and unaddressed blockers. |

**Bottom line:** The **artifacts are usable** as a backlog if you fix **critical security** and **data** first; **do not** treat the PRD timeline as committed until blockers in §3 are owned with dates.

---

## Critical — errors, red flags, blockers

### C1 — Security posture vs “MVP” claims (`progress.md` §11)

**Finding:** All **9** edge functions called out with **`verify_jwt: false`**, **wildcard CORS**, **no Zod**, **no rate limits**, **admin RBAC broken** — **8 CRITICAL**-class issues.

**Impact:** Any **payment**, **PII**, or **production** traffic is **unsafe**. PRD §6–7 assumes RLS + hardened functions; **current deployment does not match**.

**Required fix:** Treat **`03E-security-hardening.md`** as **P0 before** public booking — not parallel “nice to have.”

---

### C2 — Zero data vs all success metrics (`progress.md` E1)

**Finding:** **0 rows** in production tables; PRD success criteria (≥20–30 listings, lead capture %, etc.) are **unmeasurable**.

**Impact:** Frontend and agent demos **cannot** validate O1–O10.

**Required fix:** **`E1-001` seed script** (or equivalent) is the **root dependency** for almost every epic (roadmap dependency map is correct here).

---

### C3 — No payment loop (`progress.md` E2, E7; PRD §5–6)

**Finding:** **Stripe / `payment-webhook` / `booking-create`** not built; commerce checklist shows checkout **untested**.

**Impact:** PRD **“first booking with payment”** exit criterion **cannot** be met without this chain.

**Required fix:** Lock **PSP + webhook design** (PRD §12 open decision #1) early — **Week 1**, not Week 5.

---

### C4 — Internal document inconsistencies (traceability breaks)

| Issue | Where | Fix |
|-------|--------|-----|
| PRD §11 lists wireframes as `wireframes/*.md` | `prd-real-estate.md` | Canonical path is **`tasks/wireframes/`** — update PRD traceability or add symlink note. |
| PRD §11 references `plan/mermaid/*.mmd` | `prd-real-estate.md` | Actual diagrams live under **`tasks/mermaid/*.mmd`** (see `tasks/mermaid/INDEX.md`). |
| **RICE rank order** does not sort by RICE score | `roadmap.md` §4 | Example: **E4 RICE 96** vs **E2 RICE 80**, but **E2 ranked 3** and **E4 ranked 4**. Re-rank or relabel column as “priority” not pure RICE. |
| **OpenClaw “installed”** in architecture diagram | `prd-real-estate.md` §4 | **WhatsApp / OpenClaw** is **E8 / Phase 3** in `progress.md`. Clarify: **Paperclip** installed; **OpenClaw channel** not equivalent to “production WhatsApp.” |
| **`index.md`** references `tasks/paperclip/01.md`, `06-audit.md` | `tasks/index.md` | Verify files exist or **update index** to avoid dead links. |

---

## High — failure points (likely slips / rework)

### H1 — Epic ID drift (E1–E9 vs 01E–09E)

**Finding:** `prompts/01E-data-foundation.md` maps to **E1**; `progress.md` uses **E1–E10**-style sections. Naming is learnable but **error-prone** for automation and `/process-task`.

**Fix:** One **canonical epic table** in `tasks/index.md`: `01E` ↔ `E1` ↔ name.

---

### H2 — Agent narrative vs `progress.md`

**Finding:** `progress.md` says Paperclip orchestration **0%** and Hermes intelligence **0%**; **roadmap** still says “CEO broken 3/10” class issues. Recent work (CEO sessions, `tasks/hermes/REFERENCE.md`) may **not** be reflected.

**Fix:** **Re-baseline** agent rows after each milestone; avoid **stale “broken”** blocking morale without a **dated** retest.

---

### H3 — JWT narrative conflict (`index.md` vs `progress.md`)

**Finding:** `tasks/index.md` says **“JWT verification: Disabled in config.toml (auth validated inside each function)”** while `progress.md` asserts **verify_jwt false = auth bypass**.

**Fix:** Reconcile: either **document** per-function auth pattern + audit, or **enable verify_jwt** and pass user JWT — **pick one story** for auditors.

---

### H4 — Testing strategy absent from execution path

**Finding:** `progress.md` §10 — **0%** tests; **todo** pushes E2E to Week 4 while **security** is still critical Week 1.

**Fix:** **Smoke E2E** only after **E3 minimum** (auth + CORS + validation on **payment-adjacent** routes); full suite after pipeline stable.

---

## Medium — gaps and improvements

| ID | Gap | Suggestion |
|----|-----|------------|
| M1 | **SLO/SLA** for edge functions in PRD vs no **monitoring** in prod | Add **error rate + latency** gates in `09E` before “PRODUCTION” phase. |
| M2 | **Legal / Colombia** in PRD §6–7 — no **owner** on open decisions | Assign **Legal** owner + target date for lease templates and **Ley 1581** processing. |
| M3 | **Idempotency** mentioned for Stripe; **not** repeated for **lead-capture** / **showing** | Document **idempotency keys** for all mutating public endpoints. |
| M4 | **Wireframes** strong on UX; **accessibility** not explicit | Add **WCAG** acceptance to `04E` prompts for rental flows. |
| M5 | **Rental applications** table naming: PRD uses `rental_applications`; progress says “applications” | Align **migration names** with PRD glossary. |

---

## Best practices — checklist

| Practice | In docs? | Done? | Evidence |
|----------|----------|-------|----------|
| Single source of truth for paths | Partial | No | PRD vs `tasks/` prefix mismatch |
| Security requirements in Definition of Done | Yes (`progress`, prompts) | No | verify_jwt / CORS / Zod |
| Test pyramid (unit + e2e) | Yes (`todo`, `09E`) | No | 0% tests |
| Observability (ai_runs, analytics) | Yes | Partial | Table exists; logging not wired |
| Feature flags for risky channels (WhatsApp) | PRD risk section | N/A | Good intent |
| RBAC for admin | Called out | No | useAdminAuth gap |
| Secrets not in repo | Implied | OK | Assumed; not audited in this pass |
| Dependency order (seed → pipeline → pay) | Yes (`roadmap` §6) | Partial | Correct logic |

**Missing from plan set (recommended):**

1. **Incident response / rollback** one-pager for payments.
2. **Data retention** schedule for leads/contracts (GDPR-style table).
3. **Load / cost budget** for Gemini (monthly cap + alert).
4. **Definition of Done** template: **security + test + metric** per epic.

---

## Wireframes & prompts — evaluation

| Area | Assessment |
|------|------------|
| **Coverage** | 10 wireframes map to PRD journeys; **04–06, 10** correctly marked **not built** in `progress.md`. |
| **Prompts (`01E`–`09E`)** | Strong: YAML frontmatter, diagram IDs, acceptance criteria, skill hints. **Executable by an agent.** |
| **Gap** | Prompts assume **migrations** for new tables; ensure **one migration ordering** doc to avoid FK drift. |

---

## Percent correct — how we scored

| Component | Weight | Score | Rationale |
|-----------|--------|-------|-----------|
| PRD completeness | 20% | 86% | Excellent personas, pipelines, risks; path refs wrong |
| Roadmap / sequencing | 20% | 74% | Good epics; RICE table inconsistent; deps sound |
| Progress accuracy | 25% | 88% | Credible; drives real priorities |
| Prompts executability | 20% | 82% | Structured; depends on unbuilt schema |
| Todo / weekly plan | 10% | 80% | Sensible order; security sequencing could be stricter |
| Wireframes | 5% | 90% | Clear, aligned |

**Weighted “plan quality” ≈ 82% × 0.2 + 74% × 0.2 + 88% × 0.25 + 82% × 0.2 + 80% × 0.1 + 90% × 0.05 ≈ 82.3%** — then **−15 points** for **document contradictions** (paths, JWT story, OpenClaw wording) → **~67–68%** **holistic correctness**.

**Execution readiness** remains **~35%** per `progress.md` — **do not conflate** with document quality.

---

## Recommended actions (priority order)

1. **Fix `prd-real-estate.md` traceability** — `tasks/wireframes/`, `tasks/mermaid/`, remove or qualify **OpenClaw installed**.
2. **Repair `roadmap.md` RICE table** — sort by score **or** rename column.
3. **Sync `tasks/index.md`** — remove or add missing file references (`paperclip/01.md`, etc.).
4. **Run security epic** per `03E` **before** exposing new pipeline endpoints.
5. **Seed data** (`E1-001`) **before** heavy frontend polish.
6. **Stripe decision** + **webhook** spike in **Week 1** parallel to schema work.
7. **Retest agent rows** in `roadmap.md` / `progress.md` after Paperclip/Hermes doc updates.

---

## Verdict

| Question | Answer |
|----------|--------|
| **Will the plan tasks “work” as written?** | **Yes** as a **backlog**, if blockers are cleared **in dependency order**. |
| **Biggest audit risk?** | **Shipping features on an unsecured API** while PRD claims production-grade security. |
| **Is anything “missing”?** | **Incident/cost/retention** playbooks; **reconciled** JWT/auth story; **corrected** cross-links. |

---

## Skill alignment (best-practice verification)

Cross-check of `tasks/` artifacts (PRD, prompts, roadmap, progress, wireframes) against **`.claude/skills`** for OpenClaw, Paperclip, Hermes, Gemini, real-estate, and Supabase. Purpose: flag **gaps** where tasks should explicitly encode platform rules, and **mismatches** where a skill does not apply to this repo as written.

### OpenClaw (`.claude/skills/open-claw`)

| Practice (skill) | Task alignment | Gap / action |
|------------------|----------------|--------------|
| Security before channels prod (`openclaw security audit`, non-loopback bind needs auth) | P3 / WhatsApp / “installed” language in PRD | **Tighten:** security epic (`03E`) should call out **audit + probe** (`channels status --probe`) before claiming channel readiness; avoid “OpenClaw installed” as proxy for production. |
| Pairing / allowlists / DM policy | PRD P3 WhatsApp | **Add** acceptance: verify pairing list + allowFrom / mention gating match Medellín ops. |
| Heartbeat, memory, tool profiles | Trio narrative | **Optional:** if agents run on OpenClaw for rentals, reference **heartbeat** + **tool profile** (`minimal` vs `full`) in runbooks — not in current PRD AC. |
| `openclaw tasks` (not deprecated ClawFlow) | N/A | No task references deprecated flows — OK. |

### Paperclip (`.claude/skills/paper-clip`)

| Practice (skill) | Task alignment | Gap / action |
|------------------|----------------|--------------|
| Mutations: `Authorization: Bearer` + **`X-Paperclip-Run-Id`** on checkout / PATCH / comments | Agent-operated Paperclip issues | **Add** to any prompt that automates Paperclip API: require run-id header on all mutating calls (traceability). |
| Checkout before work; **never retry 409** | Task prompts | Repo prompts focus on **code**; if heartbeats automate issues, **embed** checkout + 409 rule in `tasks/paperclip/` or agent AGENTS. |
| Plans in issue document `plan` (`PUT .../documents/plan`), not description only | Planning tasks | **Align:** “plan” deliverables that sync to Paperclip should use **document API**, not long issue descriptions — mention in governance / CEO workflows if those tasks are created. |
| Comment style: linked ticket IDs, company-prefixed paths | Internal Paperclip comments | **N/A** to `tasks/*.md` unless issues are filed; keep for agent runbooks. |
| Budget / @-mention cost | Roadmap agent rows | **Note:** heavy @-mention automation **increases** wake cost — roadmap “agents” row should assume **budget** discipline per skill. |

### Hermes (`.claude/skills/hermes`)

| Practice (skill) | Task alignment | Gap / action |
|------------------|----------------|--------------|
| **SOUL.md** (global) vs **AGENTS.md** (project); no stack dump in SOUL | `AGENTS.md`, roadmap Hermes | **Aligned** with Nous guidance; roadmap Hermes install is OK. |
| `hermes claw migrate` from OpenClaw | Trio / migration | **Optional one-liner** in technical notes when both gateways are in scope — avoids duplicate config drift. |
| Official docs over third-party blogs | All prompts | **Good** default for `01E`–`09E`; add explicit “prefer hermes-agent.nousresearch.com” if Hermes-specific tasks multiply. |
| Firecrawl / web_search quota | Real-estate pipeline docs | **Already** flagged in real-estate skill; tasks should not assume unlimited search. |

### Gemini (`.claude/skills/gemini`)

| Rule ID | Requirement | Task / PRD check |
|---------|-------------|-------------------|
| **G1** | Structured JSON: `responseJsonSchema` + `responseMimeType: "application/json"` | **Gap:** PRD/prompts for `rentals` / AI edge work should **name** G1 in acceptance criteria for any JSON-from-model path (avoids parse crashes). |
| **G2** | Default **temperature 1.0** for Gemini 3 (avoid turning it down unless justified) | **Gap:** prompts that say “tune temperature” should **default to 1.0** for Gemini 3. |
| **G3** | Combine structured output with Google Search when grounding | **Gap:** search-grounded features (`ai-search`, listings enrichment) should require schema + grounding metadata handling. |
| **G4** | API key via **`x-goog-api-key`** header, not `?key=` | **Must** appear in any new edge-function spec (security + logs). |
| **G5** | Persist **`groundingChunks` / citations** for user-visible answers | **Gap:** concierge / search UX tasks should include “show sources” where grounded. |
| **G6** | `googleSearch` vs `google_search` — prefer camelCase in new code | Minor consistency for new Deno handlers. |

### Real-estate (`.claude/skills/real-estate`)

| Practice (skill) | Task alignment | Gap / action |
|------------------|----------------|--------------|
| Canonical paths: `tasks/real-estate/docs/…`, `tasks/real-estate/wireframes/*.md` | Repo has **`tasks/wireframes/`** at top level and **`tasks/real-estate/docs/`** | **Mismatch:** skill still points at `tasks/real-estate/wireframes/` — **either** move/copy wireframes under `tasks/real-estate/wireframes/` **or** update skill to `tasks/wireframes/` to match PRD. |
| Four UI states (loading / error / empty / success) | PRD + prompts | **Aligned** with CLAUDE.md; keep in frontend prompts (`04E`–`06E`). |
| Shopify ≠ leases | PRD | **Aligned** — skill warns not to assume one checkout model. |
| Avoid huge Python dumps; TS/Deno + Supabase | Prompts | **Aligned.** |

### Supabase

| Source | Applicability | Notes |
|--------|----------------|-------|
| **`.claude/skills/supabase/supabase-edge-functions/SKILL.md`** | **Low direct fit** | Content is **another project’s** pattern (single Hono `server`, Sun AI routes). **Do not** treat **C1 “one mega function”** as mde’s rule — this repo uses **multiple** functions under `supabase/functions/` per `CLAUDE.md`. |
| **Project rules** | **Authoritative for mde** | Use **`CLAUDE.md`** + **`.claude/rules/supabase-patterns.md`** + **`.claude/rules/edge-function-patterns.md`**: JWT validation, Zod, `ai_runs` logging, rate limits, consistent `{ success, data \| error }` shape. |
| **`.claude/skills/supabase/supabase-realtime`** | **Medium** (when realtime ships) | Prefer **`broadcast`** + **`private: true`** + `setAuth()` before subscribe; **avoid** new reliance on **`postgres_changes`** at scale. Rental/co-editing tasks should cite this when adding live updates. |

### Summary — skill audit

| Skill | Verdict |
|-------|---------|
| OpenClaw | Tasks understate **security audit + channel probe** vs marketing language (“installed”). |
| Paperclip | **Run-id header** and **checkout/409** rules missing from repo task prompts (only relevant if API automation is in scope). |
| Hermes | **Aligned**; optional migration note for OpenClaw users. |
| Gemini | **Largest concrete gap:** prompts/PRD should **encode G1–G5** for edge/AI work. |
| Real-estate | **Path drift** between skill and actual `tasks/wireframes/` layout. |
| Supabase edge skill | **Not** mde architecture; use **project** edge-function docs instead. |
| Supabase Realtime | Ready for **future** live features; PRD realtime rows should match **broadcast** pattern. |

---

*This audit does not re-verify runtime state of Supabase or Vercel; it assesses **documentation and stated progress** only. Re-run after major merges.*
