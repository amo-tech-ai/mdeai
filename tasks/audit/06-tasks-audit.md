# Tasks / prompts audit — `tasks/prompts/` + consolidated backlog (audits 01–05)

**Purpose:** Single place for (1) **what exists** in `tasks/prompts/`, (2) **gaps** vs `progress.md` / layer audits, (3) **additional** tasks & features grouped **CORE** vs **ADVANCED**.

---

## Plain English — read this first

### What is `tasks/prompts/`?

Think of **9 chapters** in a build manual — one file per **epic** (`01E` … `09E`). Inside each chapter are **numbered tasks** (like **E2-005** = “payment webhook”). **48 tasks total** = **48 concrete tickets** you could put on a board. Nothing is “missing” at the chapter level; the **gaps** below are **extra tickets** the audits say you should **add** inside those chapters (mostly **security** and **glue**).

### CORE vs ADVANCED in one breath

| | Simple meaning | Real-world picture |
|---|----------------|-------------------|
| **CORE** | **Safe store + real products + checkout** | A renter can search real apartments, save a lead, pay, and you are not **wide open** to hackers. |
| **ADVANCED** | **Automation + AI ops + WhatsApp** | Your “AI manager” (Paperclip), deep reasoning (Hermes), and messaging robots (OpenClaw) run **without** you babysitting every step. |

**Order matters:** Build **CORE** first. **ADVANCED** agents are like hiring a fancy concierge **before** the building has doors and a cash register — audits say **don’t** rely on them until **data + security + pipeline** exist.

### Who is who? (four-layer story)

| Piece | Plain role | Everyday analogy |
|-------|------------|------------------|
| **Supabase** | Database + auth + edge APIs | **Filing cabinet + bouncer + service window** — one source of truth for listings, users, leads. |
| **Vite / website** | What renters see | **Shop floor** — search, apply, pay. |
| **Paperclip** | Tasks, approvals, budgets for *your* AI team | **Shift manager** — who works on what, spending limits, “boss must approve this payout.” |
| **Hermes** | Heavy reasoning (CLI / skills) | **Senior analyst** — reads leases, compares neighborhoods; not the same as the **scoring formula** in the cloud (`hermes-ranking` edge). |
| **OpenClaw** | Tools + WhatsApp-style channels | **Messenger + toolbox** — sends WhatsApp, runs tools; must be **wired** to your backend, not floating alone. |

### Real-world examples — CORE (why each bucket matters)

1. **Seed data (E1)** — *Problem:* Database has **0 rows** → every page looks empty. *Fixed:* 20–30 Medellín listings so **Sarah** can demo search and you can measure “top result good enough.”
2. **Security hardening (E3 + extras)** — *Problem:* APIs accept **anyone** as admin, CORS wide open → someone could scrape leads or fake payments. *Fixed:* Same as **locking the shop at night** — JWT, rate limits, admin roles only for staff.
3. **Lead → Stripe (E2)** — *Problem:* Renter fills the wizard; **nothing** lands in CRM or bank. *Fixed:* **Sarah’s** intent becomes a **lead row** → showing → **Stripe** charges → booking confirmed — that is **O1** in the roadmap.
4. **Idempotency** — *Problem:* Double-click “Pay” → **two** charges. *Fixed:* Stripe already needs this; **same idea** for “Create lead” so double-submit does not duplicate rows.
5. **Integration contract + correlation IDs** — *Problem:* WhatsApp says “yes” but the **website** shows “no” — nobody knows which system is wrong. *Fixed:* One **request ID** traced from message → edge function → database row — like a **package tracking number**.
6. **Ranking tests (E6-005)** — *Problem:* Marketing says “smart search” but you never **graded** the algorithm. *Fixed:* A small spreadsheet of “user wanted X, we ranked #1 as Y” — **proof**, not vibes.

### Real-world examples — ADVANCED (later phase)

1. **Paperclip CEO fixed (E5-001/002)** — *Like:* The **manager** finally has a real handbook and knows the **shop address** — until then, “agent automation” is mostly talk.
2. **Hermes adapter (E5-003/004)** — *Like:* The analyst can be **paged** from the manager’s task list instead of you SSH’ing by hand.
3. **OpenClaw + WhatsApp (E5-007, E8)** — *Like:* **Carlos** the landlord gets a WhatsApp when someone books a showing — how Medellín actually works. **Not live** until Infobip/OpenClaw path is built **and** secure.
4. **One WhatsApp pipe (ADR)** — *Bad:* Two bots answer the same number → renter gets **duplicate** or **contradictory** messages. **Good:** One **primary** path documented.
5. **Lobster / durable workflows** — *Like:* “Every Sunday, snapshot rent prices” or “Friday payout checklist” — keeps running after a **server restart**; not just a one-off chat.

---

**Cross-review sources**

| Audit | Focus |
|-------|--------|
| [`01-audit-plan.md`](01-audit-plan.md) | Planning artifacts, C1–C4 blockers, doc consistency, **skill gaps** (Gemini G1–G5, Paperclip run-id, OpenClaw security, wireframe paths) |
| [`02-hermes.md`](02-hermes.md) | Nous CLI vs edge ranking, E5-003/004, MERM-07 sync, curated skills |
| [`03-paperclip..md`](03-paperclip..md) | CEO/workspace, E5-006 split, routines, `links.md`, API hygiene |
| [`04-openclaw.md`](04-openclaw.md) | Gateway/WhatsApp not shipped, Infobip vs Baileys, Lobster, security audit |
| [`05-trio-agents.md`](05-trio-agents.md) | End-to-end integration, correlation IDs, feature flags, ordering |

---

## One-line summary

- **Epic prompts:** **9 files**, **48 tasks** (`01E`–`09E`) — **complete** at epic level.
- **Execution:** Audits agree — **E1 + E3 + E2** are the real **CORE** path; agent epics (**E5–E8**) are **ADVANCED** until data/security/pipeline land.
- **Extra work:** Dozens of **non-epic** items (below) should become **tasks, ACs, or docs** — not new epics.

---

## Global blockers & failure modes (affects many tasks)

These are **not** optional polish — they **block** or **invalidate** work downstream if ignored (`tasks/progress.md`, `01-audit-plan`).

| Blocker | What it is | What breaks if you ignore it |
|---------|------------|------------------------------|
| **Empty database (E1)** | **0 rows** in listings/leads | Demos, ranking tests, agent heartbeats on “stale leads,” and **any** journey-based QA are **meaningless**. |
| **Open edge APIs (E3)** | `verify_jwt: false`, `*`, no Zod, no rate limits | **PII leaks**, **fake admin** actions, **abuse** of Gemini keys, **no** safe production launch — **payment tasks (E2) are unsafe**. |
| **No payment loop (E2-005)** | Stripe webhook + booking chain not done | PRD **O1** (first paid booking) **never** happens; commission story **unproven**. |
| **agent_audit_log vs E5** | Logging required by **E5-004/005** but table may lag **09E** | Adapters **silently** skip logging or **fail** at runtime; **no** audit trail for gates. |
| **CEO / workspace (E5-001/002)** | Paperclip “manager” broken | **E5-005/006/007** **cannot** run as designed — automation is **manual** or **fake**. |
| **Hermes config (E5-003)** | No `instructionsFilePath` / timeout | Delegation from Paperclip → Hermes **nondeterministic** or **wrong context** for mde. |
| **OpenClaw not wired (E5-007, E8)** | Gateway / WhatsApp path missing | MERM-03 **host WhatsApp** steps **fail**; only **in-app notifications** work. |
| **Diagram vs build order** | MERM shows WA before E8 ships | Teams **assume** omnichannel MVP and **ship** half a journey — **confusion** and **rework**. |

**Typical failure pattern:** Building **E4 UI** or **E6 ranking UI** on **empty data** → pretty screens, **zero** proof of conversion. Building **E2** on **unsecured** edges → **security incident** on first real user.

---

## Inventory (existing prompts)

| File | Epic | Tasks | Phase |
|------|------|-------|--------|
| `01E-data-foundation.md` | E1 | 4 | CORE |
| `02E-lead-to-lease-pipeline.md` | E2 | 9 | CORE |
| `03E-security-hardening.md` | E3 | 5 | CORE |
| `04E-frontend-rental-flow.md` | E4 | 5 | CORE |
| `05E-agent-infrastructure.md` | E5 | 7 | ADVANCED |
| `06E-hermes-intelligence.md` | E6 | 4 | ADVANCED |
| `07E-contract-automation.md` | E7 | 4 | ADVANCED |
| `08E-multi-channel.md` | E8 | 4 | PRODUCTION |
| `09E-production-readiness.md` | E9 | 6 | MVP |
| `10E-crm-real-estate.md` + `10A`/`10B`/`10C` (`tasks/prompts/`) | E10 | 3 (10A/10B done, 10C open) | CORE |
| `VERIFY-supabase-postgres-edge.md` | — | Review checklist | — |
| `INDEX.md` | — | Epic → file registry + backlog mapping | — |

**Rule (2026-04):** Every epic **E1–E10** has a prompt file; DB/edge reviews use **`VERIFY-supabase-postgres-edge.md`** (skills: `supabase-postgres-best-practices`, `supabase-edge-functions`).

---

## CORE — additional tasks, features & docs (ship before / with MVP)

*Aligned with `01-audit-plan` C1–C4, `05-trio` blockers, `06` prompt gaps.*

> **How to read:** Each row is **extra** work **on top of** the existing `03E`/`06E` text. **Blocker** = what **must** be true before this item is useful. **Failure mode** = what goes wrong if you skip it.

### Security & API (`03E` extensions + AC tightening)

| Item | Description (what to do) | Blocker | Failure mode if skipped |
|------|----------------------------|---------|-------------------------|
| **E3-006** | Stop using **service role** for calls triggered by end users; use **user JWT** or **signed server-to-server** pattern between functions. | **E3-001** JWT story started | Attackers or bugs **act as admin**; inter-function calls **bypass** RLS intent. |
| **E3-007** | Real **admin RBAC** (roles/claims), not only a frontend hook; align with **E4-004** moderation. | Auth model decided | **Anyone** with a token might open **admin** routes; moderation queue is **theater**. |
| **E3-008** | **Timeouts** on every edge fn (e.g. **30s** AI, **10s** DB) so runaway Gemini or DB **cannot** hang workers. | None | Bills spike; **cold users** wait forever; **cascading** failures under load. |
| **Idempotency (lead/showing)** | Same as Stripe: **`Idempotency-Key`** on **lead-capture** and **showing-create** POSTs. | Tables exist (**E1-002**) | Double-clicks create **duplicate** leads/showings; support **cannot** reconcile. |
| **JWT story doc** | One written rule: **`verify_jwt: true`** **or** documented manual JWT in **every** function — not both **silently**. | Security review | Auditors **confused**; some routes **open**, some **closed** — **inconsistent** risk. |

### Data & money

| Item | Description | Blocker | Failure mode if skipped |
|------|-------------|---------|-------------------------|
| **E1-001 seed** | Realistic apartments, neighborhoods, profiles for Medellín. | Migrations applied | All **E2/E4/E6** demos show **empty** UI; metrics **undefined**. |
| **Stripe / E2-005 + rollback doc** | Lock PSP, webhook shape, **idempotent** booking updates; one-page **rollback** if payment stuck. | Stripe test mode | **Double charge** or **lost** booking state; **no** playbook when webhook fails. |

### Planning / traceability

| Item | Description | Blocker | Failure mode if skipped |
|------|-------------|---------|-------------------------|
| **PRD path fixes** | Point PRD to **`tasks/wireframes/`**, **`tasks/mermaid/`** — not wrong folders. | None | Engineers open **wrong files**; **traceability** breaks for audits. |
| **Roadmap RICE** | Sort by score **or** rename column so “priority” ≠ misleading. | None | Wrong **execution order**; stakeholders **trust** a broken table. |
| **`index.md` dead links** | Remove or fix broken references. | None | **404** in onboarding; **trust** in docs drops. |
| **Definition of Done** | Per-epic checklist: **security + test + metric** before “done.” | None | “Done” means **shipped broken**; regressions **repeat**. |

### AI edge (Gemini) & diagrams

| Item | Description | Blocker | Failure mode if skipped |
|------|-------------|---------|-------------------------|
| **G1–G5 in ACs** | Every edge path that returns JSON or uses Search Grounding **names** G1–G5 in **acceptance criteria** (not only `06E`). | None | **Parse errors**, **key leaks** in logs, **no citations** for user-facing answers — **support** nightmares. |
| **MERM-07 sync** | Label **hermes-ranking** edge as **canonical** score; Hermes CLI = **ops/explain** only. | **E6-001** spec read | Two teams implement **two** rankers; **numbers disagree** in prod. |

### Integration & quality

| Item | Description | Blocker | Failure mode if skipped |
|------|-------------|---------|-------------------------|
| **Integration contract** | One page: request flow + **`correlation_id`** across Paperclip, edge, OpenClaw, DB. | None | Incidents **untraceable**; “it worked in chat” **cannot** map to a **row**. |
| **agent_audit_log order** | Ship **09E E9-004** **or** stub logging **before** **E5-004/005** require the table. | Team agreement | Adapter **throws** or **skips** logging; **compliance** gap. |
| **E6-005 eval** | Small **fixture set** + test that ranking output matches **expected** order/scores. | **E1** seed + **E6-001** | You claim **O3/O10** with **no** evidence; ranking **regresses** silently. |
| **E2E smoke timing** | Run **Playwright** on money paths **only after** **E3** minimum on those routes. | **E3** partial | E2E **passes** in dev, **fails** in prod under attack — **false confidence**. |

---

## ADVANCED — additional tasks, features & ops (after CORE stable)

*From `02`–`04`, `05`, `01` medium / skill sections.*

> **Plain English:** Automation + WhatsApp + AI ops at scale. **Blocker** here usually = **CORE** (data/security/pipeline) **done**; **failure mode** = wasted effort or **unsafe** channels.

### Paperclip

| Item | Description | Blocker | Failure mode if skipped |
|------|-------------|---------|-------------------------|
| **Split E5-006** | Break **G1–G7** into **separate** issues with own ACs — not one mega-task. | **E5-001** CEO scope | Gates **half-built**; **nobody** knows which gate shipped; **audit** fails. |
| **API automation hygiene** | Any script hitting Paperclip API: **`X-Paperclip-Run-Id`**, **checkout** before edit, **never retry 409**. | Automation scripts exist | **Orphan** actions; **two agents** fight same issue; **no** audit trail. |
| **Routines vs cron** | Use **Paperclip routines** for complex schedules instead of fragile **manual** crons only. | Heartbeats defined | Missed **wakeups**; **drift** between docs and behavior. |
| **Extend `paperclip/links.md`** | Add adapters, CLI, heartbeat protocol, OpenAPI — onboarding **one URL list**. | None | Integrators **guess** endpoints; **slow** Paperclip adoption. |

### Hermes

| Item | Description | Blocker | Failure mode if skipped |
|------|-------------|---------|-------------------------|
| **E5-003 / E5-004** | `instructionsFilePath`, timeout, **`hermes_local`** (or official **hermes-paperclip-adapter**). | Hermes installed | Delegation **wrong context** or **timeout chaos**; CEO **cannot** offload work. |
| **Curated skills (10–20)** | Disable/ignore irrelevant **637** skills for prod operator profiles. | Skill policy | Wrong tool invoked; **cost** and **risk** spike. |
| **OpenClaw migrate note** | When both gateways exist, document **`hermes claw migrate`** so config **doesn’t drift**. | OpenClaw + Hermes both used | **Duplicate** or **conflicting** channel config. |

### OpenClaw & channels

| Item | Description | Blocker | Failure mode if skipped |
|------|-------------|---------|-------------------------|
| **E5-007 stub → full** | Smallest **working** Gateway call, then expand — not big-bang. | Gateway running locally | **Blocked** for months; **no** incremental test. |
| **E8 ADR** | **One** WhatsApp ingress: Infobip bridge **vs** OpenClaw Baileys — **documented** decision. | **E8-001** started | **Double** bots; **duplicate** messages; **angry** users. |
| **Pre-prod security** | `openclaw security audit`, `channels status --probe`, pairing/allowlists before campaigns. | Channels configured | **Spam**, **impersonation**, **open** DMs in Medellín market. |
| **Lobster / durable flows** | Optional: lead qualify, payout week, listing publish — **resumable** workflows. | CORE stable | Ops relies on **chat** only; **long** processes **die** on restart. |
| **Feature flags** | Per-channel **which model/agent** answers (Gemini vs Hermes vs OpenClaw). | Multiple brains wired | **Contradictory** answers to same user. |
| **E8 milestones** | echo → router → **same** lead row as web → handover — **in order**. | **E2-001** | WA leads **orphan**; CRM **incomplete**. |
| **Realtime pattern** | Prefer **broadcast** + **private** channels for live updates (`supabase-realtime` skill). | Realtime feature | **Scale** issues; **leaky** subscriptions. |

### Governance, compliance, scope

| Item | Description | Blocker | Failure mode if skipped |
|------|-------------|---------|-------------------------|
| **Legal owner + dates** | Colombia lease / **Ley 1581** open questions **owned** with deadlines. | PRD open items | **Wrong** copy in prod; **fines** or **rework**. |
| **SLO/SLA in 09E** | Alerting on **error rate** + **latency** — not only “deployed.” | Logs shipping | Outages **silent** until users **scream**. |
| **Gemini cost budget** | Monthly cap + alert (`gemini-cost-budget.md`). | `ai_runs` or billing visibility | **Runaway** API bill. |
| **Shopify vs rental** | Explicit **non-goal** or separate epic for **coffee** track. | Team size small | **Context switch**; **neither** vertical ships. |
| **Real-estate skill paths** | Wireframe paths in **skill** match **`tasks/wireframes/`**. | None | Agents **edit wrong files**; **wasted** PRs. |

---

## User journeys, workflows & agents — gaps (`tasks/prompts` vs MERM / PRD)

**Sources:** `tasks/mermaid/01-user-journeys.mmd` (renter), `03-rental-pipeline.mmd`, `07-agent-architecture.mmd`, `tasks/prompts/02E`–`08E`, PRD §3 journeys.

### Renter journey (Sarah) — step → prompts → who acts

| Journey stage (MERM-01) | Covered by prompts? | Agent / automation role | Gap / risk |
|---------------------------|----------------------|---------------------------|------------|
| Discover → intake → **lead row** | **E2-001**, **E4** wizard | Edge + Gemini | **E2-001** mentions web + WhatsApp; **real WA** needs **E8** — until then document **web-only** MVP or stub. |
| Search & compare + **scores** | **E6-001/002**, `ai-search` | Edge **`hermes-ranking`** = SoT; Hermes CLI = optional via **E5-004** | Marketing copy must not imply **CLI** scores users in prod (`02-hermes`). |
| Schedule showing | **E2-002**, **E2-007** | `notifications`; MERM-03 adds **OpenClaw → host WhatsApp** | **Host WA ping** = **E5-007 + E8**, not E2 alone — diagram is **ahead** of build order. |
| Host confirms + **T-24h / T-1h reminders** | **E5-005** mentions reminder queries | Heartbeat **or** cron | **No dedicated E2 cron task** for reminders — if Paperclip stops, reminders may stop. → **E2-010** below. |
| Apply + AI summary | **E2-003**, **E2-008** | Gemini; **G4** in **E5-006** | Gate bundle still huge — split. |
| Lease review | **E7** | `contract-analysis` | OK. |
| Pay & book | **E2-004/005**, **E2-009** | Stripe; **G1** in **E5-006** | Needs **E3** first for real money. |
| **Move-in checklist**, post-book | PRD / MERM-01 | OpenClaw concierge in narrative | **No owning task** in E2/E4 — **journey promises** more than prompts **own**. |

### Landlord / host paths

| Need | Prompts | Gap |
|------|---------|-----|
| Host dashboard | **E4-005** | OK |
| Applications, showings | **E2**, **E4** | **WhatsApp-first host** in MERM-03 needs **E8**; **`MERM-01`** is mostly **renter** — **landlord journey** under-documented vs PRD personas. |
| Payouts (Fri 8AM) | Roadmap / PRD | **Not** an E2 task — future ops |

### Agent workflow gaps

| Gap | What’s wrong | Blocker | Failure mode |
|-----|----------------|---------|--------------|
| **G7 stale leads** | **E5-005** queries `leads` for >24h untouched | **E2-001** + **E1-002** must ship first | Heartbeat runs; **nothing** to query — **false** “automation working” or **errors**. |
| **G2 low-confidence host message** | Confidence score **not** in **E2** edge ACs end-to-end | AI returns confidence in **ai-chat** path | Low-quality WA **auto-sent** to host **or** gate **never** fires. |
| **E8-004 ↔ CEO** | Handover rules **not** in **E5-001** | **E5-008** | User **stuck** with bot; **no** escalation path — **support** overload. |
| **Similar listings post-showing** | MERM-01 step **not** in prompts | **E6-006** + wiring | **Missed** engagement after **high-intent** showing. |
| **Reminder scheduler** | **E6-004** has cron story; showing reminders **don’t** | **E2-010** | **Asymmetric** reliability: market snapshot **runs**, reminders **don’t**. |

### Suggested **additional** tasks & improvements (journeys + agents)

| Suggestion | Epic | Description | Blocker | Failure mode if skipped |
|------------|------|-------------|---------|-------------------------|
| **E2-010** | E2 | Cron/Vercel fires **T-24h / T-1h** reminders; writes **notifications**; optional OpenClaw send when **E8** exists. | **E2-002** showings table + **confirmed** status logic | Hosts/renters **miss** showings; **only** Paperclip heartbeat = reminders **stop** if agent down. |
| **E2-011** | E2/E9 | Checklist or Playwright: **MERM-01** steps ↔ **working** UI/API. | **E1** seed, **E3** on public routes | **Ship** “done” journey that **nobody** has walked end-to-end. |
| **E4-006** / AC | E4 | Post-book **move-in checklist** screen (static v1 OK). | **E2-005** booking exists | PRD/MERM promise **checklist**; users get **nothing** → **trust** drops. |
| **E5-008** | E5 | CEO markdown **names** when to **escalate to human**; matches **E8-004** triggers. | **E5-001** real instructions | Bot **never** hands off; **bad** WA convos **burn** brand. |
| **E6-006** | E6 | After `showings.renter_feedback`, call **ai-search** / **ai-suggest-collections**. | Feedback field + **E6-001** ranking optional | MERM-01 “similar suggestions” **orphan** — product **feels** dumb after visit. |
| **Landlord journey doc** | PRD / mermaid | Same depth as renter **MERM-01** for **Carlos**-style host. | Stakeholder time | Host **work** split across files; **no** single **review** of host UX. |
| **E2-001 AC** | E2 | Explicit: **Web** leads = MVP scope; **WA** leads = **complete when E8-003** done. | None | Stakeholders think **lead-capture** is **done** while **half** the PRD channel is **missing**. |

**Process tweaks (no new epic):**

| Tweak | Description | Failure mode if skipped |
|-------|-------------|-------------------------|
| **02E phased header** | Phase 1 = web + DB notifications; Phase 2 = OpenClaw host WA. | Engineers build **E2** assuming **WA** works **day one**. |
| **E9-005 journey AC** | E2E tags cover **MERM-01** through booking (or subset). | **Green** CI, **broken** journey in prod. |
| **02E dependency strip** | `E1-002 → E2` before **E5** queries `leads`/`showings`. | Heartbeats **error** or **no-op**; G7 **meaningless**. |

---

## Features / use cases — coverage vs prompts

| Area | Prompt epic | Notes |
|------|-------------|--------|
| Seed, P1 tables, RLS | E1 | — |
| Lead → book → pay | E2 | **+ E2-010/011**, post-book, **E2-001** WA dependency |
| JWT, Zod, CORS, rate, Stripe sig | E3 | **Extend** with items in CORE table |
| Rental UI | E4 | WCAG in **E6-002**; **04E** a11y; **landlord journey** doc |
| Paperclip / Hermes / OpenClaw | E5 | **Split** E5-006; **E5-008**; run-id if API scripts |
| Ranking, taste, market | E6 | **E6-005** eval; **E6-006** post-showing suggestions |
| Lease / contract | E7 | — |
| WhatsApp / Infobip | E8 | **ADR**; **E2** full MERM-03 needs **E8** |
| Analytics, logs, e2e, alerts | E9 | **Correlation ID**; **journey-based** e2e |

---

## Easy navigation

- **Epic index:** `tasks/index.md`
- **Execution order:** `tasks/roadmap.md` §5 (deps > raw RICE)
- **Heavy prompts:** `E5-006`, `E2-005`, `E8-002`
- **Journeys (diagrams):** `tasks/mermaid/01-user-journeys.mmd`, `03-rental-pipeline.mmd`, `07-agent-architecture.mmd`
- **System view:** `tasks/audit/05-trio-agents.md`
- **Planning quality:** `tasks/audit/01-audit-plan.md`

---

## Consolidated improvements (priority order)

1. **Unblock data + security** — **E1-001** + **E3** (including **E3-006–008** and JWT story) before scaling users or agents. *Why:* everything else **rests** on trustworthy rows and APIs (**global blockers** table).
2. **Close logging dependency** — **09E `agent_audit_log`** **or** explicit stub **before** enforcing **E5-004/005** logging ACs. *Why:* avoids **broken** adapter deploys.
3. **Phase the journey** — Document **web-first** MVP vs **full MERM-03** (WA + OpenClaw); add **E2-001 AC** and **02E** header. *Why:* stops **false “done”** on omnichannel.
4. **Split oversized prompts** — **E5-006** (gates), consider **E2-005** complexity. *Why:* reduces **stall** and **partial** implementations.
5. **MERM-07 + Hermes** — One **canonical** ranker (**edge**). *Why:* prevents **two** ranking implementations.
6. **Add E2-010** (reminders) + **E2-011** (journey smoke). *Why:* MERM promises **time-sensitive** and **testable** journeys.
7. **E8 ADR + OpenClaw pre-prod audit** before WhatsApp marketing. *Why:* **spam** and **duplicate** bots are **reputation** failures.
8. **Docs hygiene** — PRD paths, `index.md`, RICE table, DoD template. *Why:* cuts **onboarding** time and **audit** friction.

---

## Verdict

| Question | Answer |
|----------|--------|
| Missing **epic** prompt files? | **No** — E1–E9 complete. |
| Missing **tasks** inside epics? | **Yes** — **E3** extensions, **E6-005**, **integration doc**, **MERM-07**, **E8 ADR**, plus **journey gaps**: scheduled reminders (**E2-010**), post-book checklist, **MERM-01** e2e, landlord journey doc, **E5-008** escalation. |
| **CORE vs ADVANCED** | **CORE** = data + security + pipeline + doc fixes + eval + integration contract. **ADVANCED** = full trio wiring, WA prod, Lobster, flags, SLO, legal owners, skill/path cleanup. |
| **Journeys vs diagrams** | **MERM-03** assumes **WhatsApp + OpenClaw** early; **prompts** ship **web + E2** first — **phase** the journey or **stub** channel explicitly. |

**In one sentence:** You already wrote the **recipe book** (9 epics); **CORE** work is **stock the store and lock the door**; **ADVANCED** is **hire the robot staff** — audits say **stock + locks** first. **Diagrams** still **outrun** **tasks** on host WA, reminders, and post-book — add the **journey** section tasks above.

---

## Appendix — Prompt files for Appendix A / journey gaps (`tasks/prompts/`)

| Audit theme | Prompt file(s) |
|-------------|------------------|
| E2-010 reminders, E2-011 E2E, phasing web vs WA, payment rollback | [`02F-e2-showing-reminders-cron.md`](../prompts/02F-e2-showing-reminders-cron.md), [`02G-e2-merm-journey-e2e-smoke.md`](../prompts/02G-e2-merm-journey-e2e-smoke.md), [`02H-e2-pipeline-phasing-web-vs-whatsapp.md`](../prompts/02H-e2-pipeline-phasing-web-vs-whatsapp.md), [`13B-e2-payment-rollback-idempotency.md`](../prompts/13B-e2-payment-rollback-idempotency.md) |
| E3-006–008, JWT story | [`13A-e3-edge-security-extensions.md`](../prompts/13A-e3-edge-security-extensions.md) |
| E4-006 move-in checklist | [`04F-e4-move-in-checklist.md`](../prompts/04F-e4-move-in-checklist.md) |
| E5-008 CEO escalation | [`05N-paperclip-ceo-human-escalation.md`](../prompts/05N-paperclip-ceo-human-escalation.md) |
| E6-006 post-showing similar | [`06G-post-showing-similar-listings.md`](../prompts/06G-post-showing-similar-listings.md) |
| Docs hygiene, landlord journey, G1–G5 matrix | [`13C-docs-hygiene-prd-index-rice-dod.md`](../prompts/13C-docs-hygiene-prd-index-rice-dod.md), [`13D-landlord-journey-doc.md`](../prompts/13D-landlord-journey-doc.md), [`13E-gemini-g1g5-edge-acceptance-audit.md`](../prompts/13E-gemini-g1g5-edge-acceptance-audit.md) |

**Registry:** [`tasks/prompts/INDEX.md`](../prompts/INDEX.md) § Tasks / prompts audit (**13A**–**13E**).

---

*Last updated: expanded descriptions, blockers/failure modes, consolidated improvements. Re-run after formalizing new task IDs in prompts.*
