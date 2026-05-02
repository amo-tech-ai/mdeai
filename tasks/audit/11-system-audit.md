# FORENSIC AUDIT REPORT

**Scope:** Project planning and product documentation tied to execution: `tasks/prompts/INDEX.md`, `system.md`, `tasks/roadmap.md`, `events/events-prd.md`, and the **events vertical** bundle (`events/index.md`, `events/prompts/INDEX.md`, implied `events/diagrams.md` + prompts `01`–`06`).  
**Cross-check:** `CLAUDE.md` (project baseline), `tasks/audit/09-full-system-audit.md` (prior system state).  
**Auditor stance:** Senior engineer + forensic reviewer; scores are **strict** (see scoring rules in request).  
**Date:** 2026-04-06  

---

## Read this first — plain language

**What this document is:** A cross-check of your **planning docs** (rentals vs events, roadmaps, PRDs, task indexes) against **how the repo actually works** and what **security/data audits** already said. It is **not** a code review; it answers: *“If someone new tried to ship from these docs alone, where would they get lost or build the wrong thing?”*

**Real-world picture:** Imagine a Medellín marketplace team with **two product playbooks** in the same drawer: one optimizes **furnished rentals and lead-to-lease** (`tasks/prompts`, `tasks/roadmap.md`), the other pushes **events discovery on WhatsApp** (`events/events-prd.md`). Both mention AI and messaging, but **neither doc set is the single “we do this first” list**. Meanwhile the **foundation** (database with real rows, JWT on edge functions, tight CORS) is documented as **not production-safe** elsewhere. **Shipping a WhatsApp RSVP or a rental tour flow on top of that** is like opening a second venue before the first has working locks on the doors — the product ideas can be fine; the **order of operations** and **one prioritized backlog** are what this audit says are missing.

**Who this is for:**

| Reader | Takeaway |
|--------|----------|
| **Leadership** | Pick **one** 90-day bet (rentals-heavy vs events wedge) and reflect it in **one** ordered backlog; until security + seed data gates are green, treat new surface area as **spec-only** for prod. |
| **Engineers** | Use `tasks/prompts/INDEX.md` for **rental** work; use `events/prompts/` for **events** — but know they are **not merged**; follow `CLAUDE.md` / audit **blockers** before exposing money or WhatsApp to real users. |
| **AI agents / automation** | `system.md` says tasks come **only** from diagrams; **events** and some prompts **don’t** fully match that rule — don’t assume every task file has a matching `.mmd` without checking. |

**Jargon decoder (so the rest of this report makes sense):**

| Term | Plain meaning |
|------|----------------|
| **Trio (OpenClaw / Hermes / Paperclip)** | Intended **split**: messaging gateway, reasoning/ranking, governance/cost — names in PRDs; **wiring in the app is still mostly aspirational** per earlier audits. |
| **E1–E4 vs EV-01…** | **E*** = epics under `tasks/prompts` (data, pipeline, security…). **EV-*** = events vertical prompts — **different numbering**; don’t merge them in your head without a table. |
| **CORE vs “P1 CORE”** | **CORE** = phase in `system.md`. **P1 CORE** = label in the task index — **similar idea, different words**; easy to confuse in planning. |
| **03E / 09 audit** | **Security hardening** epic and **full-system audit** — the **“fix locks before guests”** gate this report keeps pointing to. |

**Bottom line before you read the scores:** Documentation quality is **mixed but usable in slices**; **whole-system production readiness** is **low** until **security + real data + one strategic priority** are explicit. The sections below spell out **where** each doc helps, **where** it conflicts, and **what to fix first**.

**What actually needs fixing first — the prompts:** Agents and engineers **execute** against **`tasks/prompts/**/*.md`** and **`events/prompts/*.md`**, not against the PRD alone. If the **prompts** disagree (counts, dependencies, security gates, schema field names), work **stalls or duplicates** no matter how polished `events-prd.md` is. **Priority:** align **indexes** (`tasks/prompts/INDEX.md`, `events/prompts/INDEX.md`), then **body text** of individual prompts so each file has **clear acceptance criteria**, **blockers** (e.g. 03E before WA prod), and **traceability** (diagram ID or explicit exception per `system.md`). PRD and roadmap edits **follow** or **mirror** what prompts must say.

---

## Executive Summary

**Overall judgment:** The repo has **two parallel product narratives**—**real-estate / lead-to-lease** (dense `tasks/prompts` tree, `tasks/roadmap.md`, `tasks/prd-real-estate.md` lineage) and **events-first** (`events/events-prd.md`, `events/prompts/01`–`06`). They are **not unified in one index or one master PRD**. Execution maps **contradict** `system.md` (“tasks generated ONLY from diagrams”) because many tasks (including events) are **not** backed by `tasks/mermaid/*.mmd` as the single source of truth. **`CLAUDE.md` and `09-full-system-audit` describe a hollow backend and critical security gaps**; the events PRD **does not** reconcile with that reality—**it is a forward-looking spec**, not a verified current-state baseline.

**Top 5 risks**

1. **Security and data reality:** Prior audit documents `verify_jwt = false`, wildcard CORS, secrets issues, **0 rows** / broken seed—**any** new feature (events on WhatsApp, RSVP) is **unsafe to ship** until P0 security + seed + RLS are fixed; PRDs rarely mention this dependency explicitly.
2. **Dual execution maps:** Implementers **will not know** whether to prioritize `core/08L-wa-apartment-search` vs `events/prompts/04-ai-router-event-discovery.md`—both claim WhatsApp + AI, different domains, **no single ordered backlog**.
3. **`system.md` vs practice:** Official rule says **tasks only from diagrams**; `tasks/prompts/INDEX.md` and `events/` tasks are **not** traceable to a single diagram registry for events—**process debt** for AI agents and humans.
4. **Hermes / Paperclip / OpenClaw:** `events-prd.md` and `tasks/roadmap` **assume** trio semantics; **09 audit** states agent stack is largely **non-wired**—docs **read as architecture** but **operate as aspiration**—high risk of **wrong abstraction** when coding.
5. **Schema drift:** Events PRD lists `organizations`, `team_members`, `registrations`, `leads`—**not all exist or match** live `public.events` (user confirmed rich `events` table elsewhere). **B1 “draft → review → published”** may **not** map to `is_active` / `is_verified` without an explicit ADR—**implementation mistakes** likely.

**Top 5 strengths**

1. **`tasks/prompts/INDEX.md`** — Phase folders (core/advanced/production), **file counts**, **exit criteria** for CORE—**usable** as a navigation hub for the **rental** vertical.
2. **`events/events-prd.md` §0** — Simplicity guardrails (one pipeline, defer Paperclip, WhatsApp search + RSVP) are **right direction** for reducing scope creep.
3. **`events/prompts/01`** — **Aligns with live `public.events`** (documented in prompt)—**reduces duplicate schema** risk vs generic PRD tables.
4. **`tasks/roadmap.md`** — Explicit **blockers** (empty DB, security, Stripe, pipeline gaps)—**honest** when read alongside implementation.
5. **Cross-reference** — `events/index.md` links PRD, diagrams, prompts—**minimal** but clear.

**Overall recommendation:** Treat documentation as **multiple drafts** until you **merge strategy**: one **master backlog** (Now/Next), one **security/data gate**, and **explicit** “events vs rentals” **priority** for the next 90 days. **Do not** treat `events-prd.md` as build-ready without **gating** on `03E-security-hardening` + seed + schema truth.

**Prompt-first corollary:** Ship **prompt** fixes in lockstep: **`tasks/prompts/INDEX.md`** (counts, links to `events/prompts`, security strip), **`events/prompts/INDEX.md`** (dependencies column, execution order), and **per-prompt** updates wherever a prompt still **contradicts** live schema, §0 simplicity, or the security baseline. The PRD is **context**; **prompts are the executable contract** for `/process-task` and agent loops.

---

## Document-by-Document Audit

### Document A — `tasks/prompts/INDEX.md`

#### 1. Document Summary
**Purpose:** Canonical index for **epic-tracked** task prompts, organized by **phase folders** (core / advanced / production / reference).  
**Clarity:** High for **navigation**; **low** for “single product truth” because it is **rental/real-estate-heavy** and does not index `events/prompts/`.  
**Usefulness:** **High** for anyone working `tasks/prompts/core/*`; **incomplete** for full product.

#### 2. Strengths
- Clear **phase → week** table; **exit criteria** for CORE.
- **Reference** section points to **11A/11B** search stack and **VERIFY** checklist—**good practice**.
- Notes **original flat files** + **phase folder as source of truth**—reduces edit confusion **if** enforced.

#### 3. Errors and Inconsistencies
- **File count drift:** Header says “**19**” CORE files; table “Foundation & Security” lists 4; **chatbot 14A** adds another; bottom says **CORE 20** and **Total 66**—**inconsistent** with “19” in folder row (line 13 vs 158–164).
- **“Every epic-tracked task maps to exactly one prompt file”** — **not** provable from index alone; duplicates in `originals/` mentioned—**risk of double maintenance**.
- **Phase naming:** `P1 CORE` vs `system.md` phases **CORE/MVP/ADVANCED/PRODUCTION**—**not aligned** naming (P1 vs CORE).
- **08L** “no OpenClaw” vs **events PRD** and **advanced/08** OpenClaw files—**different WA integration strategy** by design but **not cross-linked** → **confusion**.

#### 4. Red Flags
- **Scope explosion:** **41 ADVANCED** files before CORE exit—**execution risk** and **context rot** for AI agents.
- **Fake completeness:** Several lines say **“(done)”** for 10A/10B—**without** linking to CI or commit evidence in the index.
- **WhatsApp:** Two paths (Infobip + later OpenClaw)—**correct** for phasing but **easy to wire wrong** without ADR pointer in index.

#### 5. Failure Points / Blockers
- **Agents** following only this index **miss** `events/` entirely.
- **No** explicit dependency graph—**blockers** (e.g. security) not at top of index.

#### 6. Critical Fixes
- **P0:** Reconcile **file counts**; single source row for CORE file count.
- **P1:** Add **section** “Other verticals” or link **`events/prompts/INDEX.md`**.
- **P2:** Add **global priority** strip: “Security (03E) blocks all prod.”

#### 7. Best Practices Verification
| Category | Mark | Why |
|----------|------|-----|
| Product requirements | PARTIAL | Index is not a PRD—OK—but mixes outcomes with file lists. |
| Technical architecture | PARTIAL | References diagrams but not **machine-checkable** links. |
| Implementation sequencing | PARTIAL | Weeks implied; **dependencies** not in index. |
| Documentation clarity | PASS | Readable tables. |
| Developer handoff | PARTIAL | Good for rentals; **incomplete** for events. |

#### 8. Percent Correct Score
- **Overall:** **72/100**
- **Clarity:** **78/100**
- **Technical correctness:** **70/100** (count inconsistencies, stale “done”)
- **Build readiness:** **68/100** (navigation yes, **not** a build spec)
- **Best-practice alignment:** **71/100**

#### 9. Rewrite Recommendation
**Lightly revised** + **add** cross-links to events + security gate; **split** into “Index” + “Dependency matrix” if team grows.

#### 10. Improved Version Guidance
- Fix **counts**; add **last-verified** date per phase.
- Link **`tasks/audit/09-full-system-audit.md`** at top as **precondition** for prod.
- Add **one paragraph** “Relationship to `events/`”.

---

### Document B — `system.md`

#### 1. Document Summary
**Purpose:** Universal **process law**: PRD → Diagrams → Tasks → Roadmap; **tasks generated ONLY from diagrams**; phases apply to **diagrams**.  
**Clarity:** **Very high**—normative.  
**Usefulness:** **High** if enforced; **harmful** if ignored (current repo **partially** ignores for events).

#### 2. Strengths
- Clear **roll-up**: Tasks → Diagrams → Phase → Milestone.
- **Non-negotiable** rules reduce ambiguity.

#### 3. Errors and Inconsistencies
- **Contradiction with repo practice:** `tasks/prompts/` contains many prompts **not** demonstrably tied to a single `.mmd` per task; **`events/`** uses `diagrams.md` sections as pseudo-IDs, **not** `tasks/mermaid/INDEX.md`—**violates** the letter of `system.md`.
- **PRD “no implementation details”** vs actual PRDs with **tables, edge function names**—**process conflict** across docs.

#### 4. Red Flags
- **Rigid “diagrams only”** can **block** pragmatic work if diagrams lag; **risk** either **process theater** or **silent bypass**—both bad.

#### 5. Failure Points / Blockers
- **AI agents** told to follow `skills/mdeai-tasks` will **generate tasks from diagrams**; events work **does not** fit—**confusion** for agents.

#### 6. Critical Fixes
- **P0:** Add **explicit exception path**: “Vertical slices may use `events/diagrams.md` until migrated to `tasks/mermaid`.”
- **P1:** Define **diagram ID** registry for events.

#### 7. Best Practices Verification
| Category | Mark | Why |
|----------|------|-----|
| Implementation sequencing | PASS | Conceptually sound. |
| Documentation clarity | PASS | Short, clear. |
| **Adherence in repo** | **FAIL** | Not consistently applied. |

#### 8. Percent Correct Score
- **Overall:** **85/100** (as **pure process doc**)
- **Clarity:** **92/100**
- **Technical correctness:** **70/100** (mismatch with repo reality lowers **operational**)
- **Build readiness:** **60/100** (process alone doesn’t ship code)
- **Best-practice alignment:** **80/100**

#### 9. Rewrite Recommendation
**Lightly revised**—add **exceptions** and **migration** path.

#### 10. Improved Version Guidance
- One page **“How events vertical complies”** or **amend** mdeai-tasks skill.

---

### Document C — `tasks/roadmap.md` (Real Estate Strategic Roadmap)

#### 1. Document Summary
**Purpose:** **Outcome-driven** roadmap for **real-estate vertical** (rental, booking, Hermes, WA, etc.), tied to `tasks/prd-real-estate.md` and **MERM** diagrams.  
**Clarity:** **High** for rentals.  
**Usefulness:** **High** for prioritization; **misleading** if read as **whole-company** roadmap when **events** is a parallel bet.

#### 2. Strengths
- **Explicit blockers** (empty DB, security, Stripe, pipeline gaps)—aligns with **09 audit**.
- **Epics** with tasks and dependencies—**implementation-shaped**.
- **Metrics** (O1–O13)—**measurable** intent.

#### 3. Errors and Inconsistencies
- **“0 rows in all 28 tables”** vs **user’s** `public.events` DDL and **migrations** in flux—**may be stale**; audit docs must **version** DB state.
- **Events-first** strategy in `events/events-prd.md` **not** represented—**strategic** contradiction for **company focus**.
- **CLAUDE.md** says **9 edge functions**; roadmap may imply **more**—**needs** periodic sync.

#### 4. Red Flags
- **Optimistic tooling:** Paperclip/Hermes at 4 agents / 637 skills—**09 audit** says **not wired**—roadmap **assumes** capacity that **doesn’t exist** in app.

#### 5. Failure Points / Blockers
- **Payment loop** missing → **O1** blocked—stated.
- **Events** work **not funded** in this roadmap—**product risk** if leadership thinks it’s in scope.

#### 6. Critical Fixes
- **P0:** Add **banner**: “Real-estate vertical; see `events/` for events wedge.”
- **P1:** **Reconcile** DB row counts / table counts with **current** `supabase/migrations`.

#### 7. Best Practices Verification
| Category | Mark | Why |
|----------|------|-----|
| Product roadmap | PASS | Outcomes + metrics. |
| Technical architecture | PARTIAL | Assumes agents/trio. |
| Risk honesty | PASS | Blockers present. |

#### 8. Percent Correct Score
- **Overall:** **74/100**
- **Clarity:** **82/100**
- **Technical correctness:** **68/100** (stale state risk)
- **Build readiness:** **72/100**
- **Best-practice alignment:** **76/100**

#### 9. Rewrite Recommendation
**Heavily revised** for **multi-vertical** clarity or **split** into `tasks/roadmap-rentals.md` vs `events/roadmap.md` **with** explicit company priority.

#### 10. Improved Version Guidance
- **Top:** “Scope: rentals” + link events.
- **Quarterly** refresh of **current state** blockers.

---

### Document D — `events/events-prd.md`

#### 1. Document Summary
**Purpose:** **Product blueprint** for **events-first** growth (attendee + organizer), **AI** boundaries, **Supabase** data domains, **edge** map, **phase** rollout.  
**Clarity:** **Good** for vision; **mixed** on **implementation** (lists many tables, not all exist).  
**Usefulness:** **Strong** for scoping; **dangerous** if treated as **schema contract** without migrations.

#### 2. Strengths
- **§0 Simplicity** + **MVP architecture** without Paperclip—**aligns** with “don’t over-engineer.”
- **WhatsApp** search + **RSVP** stories (A1b, A1c)—**concrete** acceptance criteria.
- **Security** section mentions RLS, webhook signatures, consent—**right categories**.
- **KPI table**—measurable.

#### 3. Errors and Inconsistencies
- **§3.1 vs §0:** Table says Hermes **must not** execute side effects without Paperclip **or** confirmation where policy requires—but **§0** defers Paperclip—**sentence-level** tension (resolved if **“where policy requires”** = human confirm in-app, not Paperclip—**not spelled out**).
- **§3.2 “six agents”** vs **§0** “defer agents”—**overlap** in headcount.
- **B1** requires **draft → review → published** + **org-scoped RLS**; **live `events`** may use **`is_active` / `is_verified` / `created_by`** only—**no `organization_id`** in user-provided DDL—**PRD not reconciled** with **one** migration ADR.
- **§4.2 FTS** “title/description”** — live table uses **`name` / `description`**—**naming** error.
- **§6 Traceability** “phases E1–E4 alignment”—**events** work is **not** E1–E4 in the same sense as **`tasks/prompts`** epics—**cross-reference confusion**.
- **§5.1 Phase 1** still lists **“OpenClaw + Hermes + Paperclip starter”** while **§0** says MVP discovery **does not** require Paperclip—**contradiction**.

#### 4. Red Flags
- **Large table list** (`workflow_runs`, `campaign_messages`, …)—**reads** like **already designed**—**fake completeness**; **most** migrations **not** done.
- **`hermes-decide`, `ranking-engine`** in §4.3—**microservice sprawl** risk vs **§0** “one handler.”
- **Production readiness** claims (KPIs **85%** router accuracy) **without** dataset ownership—**ungrounded**.

#### 5. Failure Points / Blockers
- **WhatsApp** Meta templates, **business account** (open question §7)—**legal/ops blocker** for outbound.
- **No** explicit **dependency** on `03E-security-hardening` + **verified JWT** for **edge** used by WA webhook.
- **`leads` / `registrations`** tables **may not exist** as specified—**blocker** for A1c/B2.

#### 6. Critical Fixes
- **P0:** **Single** MVP architecture paragraph: **Paperclip** out of Phase 1 text or **rename** to “optional.”
- **P0:** **Map** B1 lifecycle to **concrete columns** (`status` enum vs `is_active` + `is_verified`).
- **P1:** Fix **FTS** field names; **§6** traceability → link **`events/prompts/EV-`** not E1–E4.
- **P2:** **Reduce** §4.2 to **“target schema”** vs **“exists today.”**

#### 7. Best Practices Verification
| Category | Mark | Why |
|----------|------|-----|
| Product requirements | PARTIAL | Stories good; **schema** overstated. |
| AI system design | PARTIAL | Boundaries good; **agent count** vs simplicity not. |
| Supabase planning | PARTIAL | **Drift** from live `events`. |
| Security | PARTIAL | Mentions RLS; **no** threat model tied to **09 audit**. |
| Implementation sequencing | PARTIAL | Phases OK; **internal** conflicts. |

#### 8. Percent Correct Score
- **Overall:** **63/100**
- **Clarity:** **71/100**
- **Technical correctness:** **58/100** (schema/phase/Paperclip conflicts)
- **Build readiness:** **55/100** (needs ADRs + dependency gates)
- **Best-practice alignment:** **62/100**

#### 9. Rewrite Recommendation
**Heavily revised** for **§4–5** (split **current** vs **target**); **§5.1** Phase 1 text **fixed**; **merge** duplicate AI guidance.

#### 10. Improved Version Guidance
- **Add** “**Current state**” subsection: `public.events` columns + **what’s missing** for MVP.
- **Remove or quarantine** full edge function map behind **“Phase 2+.”**
- **Add** explicit **“Gates”**: security + seed + WA webhook.

---

### Document E — Events vertical bundle (`events/index.md` + `events/prompts/INDEX.md` + prompts `01`–`06`)

#### 1. Document Summary
**Purpose:** **Lightweight** navigation for events PRD, diagrams, and **numbered** implementation prompts (`01`–`06`).  
**Clarity:** **Good** for finding files.  
**Usefulness:** **High** as **starter**; **depends** on prompt files for depth.

#### 2. Strengths
- **Numbered** `01`–`06`—**easy** for humans/agents.
- **EV-04** elevated to **P0** for WA+web search—**priority** visible.
- **§10** diagram reference in `diagrams.md` (**EV-WA-SEARCH**)—**aligns** with simplicity.

#### 3. Errors and Inconsistencies
- **`events/index.md`** says **roadmap** “if present at `plan/events/roadmap.md`”—**path** ambiguity (`events/roadmap.md` vs `plan/events/`)—**broken link risk**.
- **`diagram_id`** in INDEX mixes **EV-LAYERS + EV-ER** for one file—**not** one ID per `system.md` diagram discipline.
- **EV-03** depends on **web** path while **WA RSVP** needs **EV-04** first—**sequencing** explained in prompt body but **not** in INDEX (dependency column missing).

#### 4. Red Flags
- **Prompts** are **not** in `tasks/prompts/`—**risk** they **never** get picked up by **global** sprint planning.
- **06** “ADVANCED” **campaigns** still **large**—**scope** creep if someone starts there early.

#### 5. Failure Points / Blockers
- **No** automated check that **`events/prompts`** tasks stay in sync with **`events/events-prd.md`**.

#### 6. Critical Fixes
- **P1:** **Single** canonical roadmap path; fix **index** link.
- **P1:** Add **dependencies** column to INDEX (EV-02 → EV-04 → EV-03 partial).
- **P2:** **Mirror** or **link** from `tasks/prompts/INDEX.md`.

#### 7. Best Practices Verification
| Category | Mark | Why |
|----------|------|-----|
| Developer handoff | PARTIAL | Good entry; **orphan** from main tasks. |
| Traceability | PARTIAL | **diagram_id** informal. |

#### 8. Percent Correct Score
- **Overall:** **70/100**
- **Clarity:** **80/100**
- **Technical correctness:** **70/100**
- **Build readiness:** **65/100**
- **Best-practice alignment:** **68/100**

#### 9. Rewrite Recommendation
**Lightly revised** + **integrate** into main task index.

#### 10. Improved Version Guidance
- **Resolve** roadmap path.
- Add **“Execution order”** strip: 01 → 02 → 04 → 03 → 05/06.

---

### Document F — `CLAUDE.md` (project baseline — sampled)

#### 1. Document Summary
**Purpose:** **Onboarding** + **stack** + **rules** for the repo.  
**Clarity:** High.  
**Usefulness:** High—**if** engineers read blockers.

#### 2. Strengths
- Honest **~35%** status, **8 security vulnerabilities**, **0 rows**—**matches** 09 audit theme.
- **Concrete** routes, env vars, commands.

#### 3. Errors and Inconsistencies
- **Table count** “28 tables” vs **migrations** adding **P1 CRM** tables—**may drift**; **not** a fatal doc error.
- **Agents** “live in edge functions”** **vs** **09** “vapor”—**wording** in CLAUDE could be sharper: **“target architecture.”**

#### 4. Red Flags
- **None** specific to CLAUDE beyond **staleness** as DB changes.

#### 5. Critical Fixes
- **P2:** Periodic **sync** with `tasks/audit` + **migration** count.

#### 6. Best Practices Verification
| Category | Mark | Why |
|----------|------|-----|
| Developer handoff | PASS | |

#### 7. Percent Correct Score
- **Overall:** **78/100** (stale risk)
- **Clarity:** **85/100**
- **Technical correctness:** **72/100**
- **Build readiness:** **75/100**
- **Best-practice alignment:** **80/100**

#### 9. Rewrite Recommendation
**Lightly revised**—add **“Events vertical”** pointer.

---

## Cross-Document Audit

### A. Cross-Document Contradictions
| Topic | Doc A | Doc B | Issue |
|-------|--------|--------|--------|
| **Company priority** | `tasks/roadmap` + index → **rentals** | `events/events-prd` → **events-first** | **Strategic fork**—not resolved at exec level in docs. |
| **WhatsApp** | `08L` apartment search, **no OpenClaw** | Events WA search + RSVP via **OpenClaw/webhook** | **Different integration** choices—**both** valid; **must** be labeled or teams **double-build**. |
| **“Tasks from diagrams only”** | `system.md` | `events/` + many `tasks/prompts` | **Process** violation. |
| **Paperclip** | Advanced epic | **events-prd §5.1** Phase 1 text | **Included** vs **§0** defer—**contradiction**. |
| **DB state** | 09 audit: **0 rows** | User: rich **`events`** DDL | **09** may be **stale**—**re-audit** or **date-stamp** state. |
| **Phase vocabulary** | `P1 CORE` in index | `CORE/MVP/ADVANCED` in `system.md` | **Mapping** not documented. |

### B. Missing System Links
- **PRD → migrations:** No **single** `schema diff` doc for events.
- **PRD → `tasks/prompts`:** `events` prompts **not** in **`tasks/prompts/INDEX.md`**.
- **Security tasks → events PRD:** **No** hard link **“do not ship WA without 03E.”**
- **AI actions → `ai_runs`:** PRD mentions logging; **not** all edges **compliant** (per historical audits).
- **Booking/payment:** Events PRD **defers** payment; **rental** roadmap **requires** Stripe—**shared** billing story **absent**.

### C. Execution Risk
**Verdict:** **Partially buildable**, **high-risk / fragmented**.  
You can build **isolated** slices (e.g. **events list UI** + **seed**), but **WhatsApp + RSVP + AI** touches **security + identity + schema + channel**—**without** security gate, **fragmented**.

### D. Architecture Risk
- **Trio** (OpenClaw/Hermes/Paperclip) **documented** as operational **> **actual**—**risk** of **building** wrong layer first.
- **Two WA** strategies (Infobip vs OpenClaw) **without** **single ADR** for “**events** replies.”

### E. Product Risk
- **Events-first** vs **rentals** epic investment—**no** single **Now/Next** doc—**political** and **execution** risk.

---

## Priority Fix Plan

**Execution order:** **Prompts and indexes first** (so every task file matches reality), then PRD/ADR alignment. Below, **(prompts)** marks work that belongs in **`tasks/prompts/`** or **`events/prompts/`** markdown.

### Immediate fixes (P0)
1. **Reconcile** `events-prd §5.1` Phase 1 with **§0** (remove **Paperclip** from “core” MVP sentence or qualify). **(prompts)** Sweep **`events/prompts/01`–`06`** for copied Phase 1 / Paperclip language; add a **one-line guard** in each: “MVP discovery does not require Paperclip per §0.”
2. **Fix** `events-prd` **FTS** naming (`name` not `title`). **(prompts)** Update **`events/prompts/01`** (and any prompt that references `title` for FTS on `events`) so **acceptance criteria** use **`name` / `description`** to match live DDL.
3. **Link** `events/` from **`tasks/prompts/INDEX.md`** — or **one** master backlog. **(prompts)** Edit **`tasks/prompts/INDEX.md`** only: new subsection **“Events vertical”** → `events/prompts/INDEX.md`; reconcile **CORE file counts** in the same file.
4. **Gate** any **WA** production path on **security** checklist from **`03E`** / **`09`** (rotate secrets, JWT, CORS). **(prompts)** Add a **non-negotiable** strip to **`tasks/prompts/INDEX.md`** top *and* to **`events/prompts/04`** (or WA-facing prompt): “No production WA until 03E + JWT + CORS resolved.”

### Before implementation (P1)
1. **ADR:** `events` **lifecycle** (`draft/published` vs `is_active`/`is_verified`) + **`organization_id`**. **(prompts)** Add **“Current vs target schema”** box to **`events/prompts/01`** (or 02) so implementers don’t guess from PRD tables alone.
2. **ADR:** **WhatsApp** ingress for **events** (reuse **Infobip** webhook vs **OpenClaw**)—**one** choice for MVP. **(prompts)** **`events/prompts/04`** must state the **chosen** path and point to ADR; remove ambiguous dual-path instructions.
3. **Reconcile** `system.md` with **events** diagrams (register in `tasks/mermaid` or **explicit** exception). **(prompts)** Add **`diagram_id` / exception** line to **`events/prompts/INDEX.md`** and each **`events/prompts/0x`** header per `system.md` rule.
4. **Dependency column** in **`events/prompts/INDEX.md`** (01→02→04→03). **(prompts)** **`events/prompts/INDEX.md`** only.

### Before production (P2)
1. **Shrink** `events-prd §4.3** edge map** to **what ships** vs **later**. **(prompts)** Optional: add **“Out of scope for MVP”** bullets to **`events/prompts/05`–`06`** so advanced prompts don’t read as P0.
2. **Automate** **verify** checklist on **PR** (RLS, Zod, JWT). **(prompts)** Reference the same checklist from **`tasks/prompts`** security prompts (`03E` lineage) — **code** lives in CI; **prompts** must **link** expected behavior.
3. **Resolve** **`tasks/roadmap`** vs **`events`**—**portfolio** roadmap. **(prompts)** **`tasks/prompts/INDEX.md`** banner + **`events/prompts/INDEX.md`** “Relationship to `tasks/roadmap.md`” one paragraph.

### Prompt files — quick checklist

| Area | File(s) to fix |
|------|----------------|
| Rental epic index + counts | `tasks/prompts/INDEX.md` |
| Events index + deps + order | `events/prompts/INDEX.md` |
| Schema / FTS / live `events` | `events/prompts/01` (and any prompt citing wrong columns) |
| WA + AI router scope | `events/prompts/04`, `events/prompts/03` |
| Security gate language | Top of `tasks/prompts/INDEX.md`, WA prompts in `events/prompts/` |
| Diagram / `system.md` traceability | Header blocks in `events/prompts/01`–`06` |

---

## Skills mapping — verify each fix (`.agents/skills`)

**Default artifact:** Most rows below land as edits to **`tasks/prompts/*.md`** and **`events/prompts/*.md`** (plus PRDs only where prompts should not duplicate policy). Use these **`SKILL.md` paths** when **authoring**, **reviewing**, or **testing** that a fix matches project practice. Skills are **rubrics + procedures**, not test runners — still run `npm run build`, migrations, and manual/curl checks as appropriate.

### P0 — immediate fixes

| # | Fix | Primary skills | Also useful |
|---|-----|----------------|-------------|
| 1 | Reconcile `events-prd` §5.1 Phase 1 with §0 (Paperclip / MVP scope) | `.agents/skills/documentation/SKILL.md`, `.agents/skills/docs-writer/SKILL.md` | `.agents/skills/roadmap-planning/SKILL.md` (scope vs phases), `.agents/skills/paperclip/SKILL.md` (only if you must name Paperclip accurately in prose) |
| 2 | Fix FTS field naming (`name` vs `title`) in `events-prd` | `.agents/skills/documentation/SKILL.md` | `.agents/skills/supabase-postgres-best-practices/SKILL.md` (indexes / FTS alignment with real columns) |
| 3 | Link `events/` from `tasks/prompts/INDEX.md` (or one master backlog) | `.agents/skills/documentation/SKILL.md`, `.agents/skills/task-management/SKILL.md` | `.agents/skills/next-task/SKILL.md` (if backlog feeds “next task” workflows) |
| 4 | Gate WA production on **`03E` / `09`** security checklist (JWT, CORS, secrets) | `.agents/skills/supabase-edge-functions/SKILL.md` | `.agents/skills/supabase-auth/SKILL.md`, `.agents/skills/openclaw/SKILL.md` or `.agents/skills/openclaw-expert/SKILL.md` (WhatsApp / gateway narrative — **after** edge auth is real) |

### P1 — before implementation

| # | Fix | Primary skills | Also useful |
|---|-----|----------------|-------------|
| 1 | ADR: `events` lifecycle + `organization_id` vs flags | `.agents/skills/documentation/SKILL.md` | `.agents/skills/supabase-postgres-best-practices/SKILL.md` (schema + RLS implications) |
| 2 | ADR: WhatsApp ingress (Infobip vs OpenClaw) for MVP | `.agents/skills/openclaw/SKILL.md`, `.agents/skills/openclaw-expert/SKILL.md` | `.agents/skills/openclaw-setup-assistant/SKILL.md` (first-time channel setup context) |
| 3 | Reconcile `system.md` with `events` diagrams (registry or explicit exception) | `.agents/skills/writing-plans/SKILL.md`, `.agents/skills/plan-writing/SKILL.md` | `.agents/skills/tasks-plan/SKILL.md` (implementation sequencing); diagram syntax: `.claude/skills/mermaid-diagrams` (not under `.agents/skills`) |
| 4 | Add **dependency column** to `events/prompts/INDEX.md` | `.agents/skills/documentation/SKILL.md` | `.agents/skills/tasks-generator/SKILL.md` (dependency thinking across prompts) |

### P2 — before production

| # | Fix | Primary skills | Also useful |
|---|-----|----------------|-------------|
| 1 | Shrink `events-prd` §4.3 edge map to shipped vs later | `.agents/skills/documentation/SKILL.md` | `.agents/skills/supabase-edge-functions/SKILL.md` (what belongs in edge vs deferred) |
| 2 | Automate PR verify (RLS, Zod, JWT) | `.agents/skills/supabase-postgres-best-practices/SKILL.md`, `.agents/skills/supabase-edge-functions/SKILL.md` | `.agents/skills/vercel-react-best-practices/SKILL.md` if checks touch frontend bundles too |
| 3 | Resolve `tasks/roadmap` vs `events` — portfolio roadmap | `.agents/skills/roadmap-planning/SKILL.md`, `.agents/skills/roadmap-update/SKILL.md` | `.agents/skills/technical-roadmap-planning/SKILL.md` |

### Cross-audit themes (from sections above, not numbered P0–P2)

| Theme | Skills |
|-------|--------|
| **Rentals / CRM / listings** copy or data model | `.agents/skills/real-estate-expert/SKILL.md`, `.agents/skills/real-estate-workflows/SKILL.md` |
| **Shopify / Gadget / coffee** commerce docs | `.agents/skills/gadget-best-practices/SKILL.md`, `.agents/skills/shopify-development/SKILL.md` |
| **UI work** tied to roadmap fixes | `.agents/skills/frontend-design/SKILL.md`, `.agents/skills/shadcn/SKILL.md` |
| **New or updated agent skill** | `.agents/skills/skill-creator/SKILL.md` |

**Note:** Repo also has **`.claude/skills/`** (e.g. `mdeai-tasks`, `mermaid-diagrams`, `supabase/*`) — use those when the fix is **mde-specific** or **diagram-first**; this table lists **`.agents/skills`** only as requested.

---

## Final Scorecard

| Dimension | Score /100 |
|-----------|------------|
| **Product definition readiness** | **62** |
| **Technical architecture readiness** | **58** |
| **Documentation quality** | **68** |
| **Best-practice alignment** | **64** |
| **Build readiness** | **56** |
| **Production readiness** | **42** (security + data + channel reality **not** closed in these docs) |
| **Overall project readiness** | **58** |

---

## Final Verdict

**Buildable with major corrections** — **not** “safe to build” **as a whole system**, and **not** “not ready” for **all** work.

**Plain English:** The **rental** side has a **dense, mostly coherent** task index and roadmap, but it **doesn’t** include the **events** wedge. The **events PRD** is **directionally right** but **internally inconsistent** on **Paperclip**, **schema**, and **traceability** to **E1–E4**. **`system.md`** is **clean** but **not** how the repo **always** works. **Nothing** here is **production-safe** until **security** and **data** match **`09-full-system-audit`** (or a **fresh** audit) — **that** is the **real** gate, not the PRD prose.

**Next step:** **Fix the prompts first** — **`tasks/prompts/INDEX.md`** and **`events/prompts/INDEX.md`**, then **`events/prompts/01`–`06`** for schema wording, dependencies, and security gates; **mirror** PRD fixes into prompts so agents don’t see two truths. Then pick **one** vertical for **Next 90 days**, add **one** WhatsApp ADR if still ambiguous, and **implement** behind **03E** / security tasks.

---

*End of report — `tasks/audit/11-system-audit.md`*
