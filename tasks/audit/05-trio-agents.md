# Full AI system audit — Paperclip · Hermes · OpenClaw · Supabase (mde)

**Sources:** `tasks/prd-real-estate.md`, `tasks/roadmap.md`, `tasks/index.md`, `tasks/progress.md`, epics `01E`–`09E`, MERM diagrams; cross-audits `tasks/audit/02-hermes.md`, `03-paperclip..md`, `04-openclaw.md`.  
**Scope:** Design correctness, utilization, production readiness, integration, gaps, and **whether additional tasks are needed** (see Appendix).

---

## Overall System Score (0–100)

| Lens | Score | Notes |
|------|-------|-------|
| **Production readiness** (security + data + pipeline + agents) | **28–34** | **8 critical edge issues**, **0 seed rows**, **no payment loop**, **agent adapters mostly unshipped** (`progress.md`, `roadmap` blockers). |
| **Documented architecture** (PRD + roadmap + diagrams) | **62–68** | Strong **phase discipline**, RICE, journeys, trio story — **execution lags** documentation. |
| **Single headline (honest composite)** | **~32** | **Intent is enterprise-grade; runtime is still a demo shell + local agents.** |

---

## Architecture Assessment

**Responsibility split (target)**

| Layer | Intended role | Actual |
|-------|----------------|--------|
| **Paperclip** | Tasks, approvals, budgets, heartbeats, org | **Process running** (`:3102`); **CEO/workspace broken**; delegation **not** proven end-to-end. |
| **Hermes (Nous)** | Deep reasoning, CLI skills, adapter target for “brain” work | **Installed** (v0.7.0); **`instructionsFilePath` / adapter** open; **ranking product logic** lives in **planned edge** `hermes-ranking`, not CLI. |
| **OpenClaw** | Channels, tools, Gateway, Lobster-class workflows | **Largely planned**; **no** production WhatsApp path; **E5-007** unshipped. |
| **Supabase** | SoT: listings, auth, `ai_runs`, edge AI | **Schema strong**; **empty**; **security posture critical** for prod. |

**Boundaries**

- **Clean on paper:** PRD/roadmap separate **user-facing AI (Gemini edge)** from **ops agents (Paperclip → Hermes/OpenClaw)**.
- **Overlapping in practice:** **Three “brains”** risk — Gemini `ai-chat` / `ai-router`, **Hermes CLI**, **OpenClaw agent** — without a **single routing rule** per channel, users or ops can get **duplicate or conflicting** answers.
- **Coupling:** **Tight** between **Vite app ↔ Supabase** (good). **Loose** between **Paperclip ↔ Hermes ↔ OpenClaw** (good in theory) but **missing wire** = **zero integration** rather than healthy loose coupling.
- **Missing layers:** **Unified observability** (correlation IDs across Paperclip runs, edge `ai_runs`, OpenClaw logs); **integration test harness** for the trio; **explicit feature flags** for “which brain” on a channel.

---

## Paperclip Audit

| Area | Score / status | Notes |
|------|----------------|-------|
| Goals → issues → subtasks | **Weak** | Epics in `tasks/prompts/` are rich; **Paperclip issues** may not mirror them — **dual backlog** risk. |
| Delegation (CEO → CTO/CMO/Ops) | **Planned** | MERM-07; **E5-001** not done; **deterministic** workflow **not** evidenced. |
| Approvals (G1–G7) | **Oversized epic** | **E5-006** too large — **split** per `03-paperclip` audit. |
| Cost / activity | **Narrative** | Budget rules in CEO spec; **no** proven token accounting across Hermes + Gemini. |
| API hygiene | **Gap** | `X-Paperclip-Run-Id`, checkout/409 rules in skill — **not** all in E5 ACs. |

**Verdict:** Control plane **exists**; **governance** is **not** production-trustworthy until **E5-001/002** + **split gates**.

---

## Hermes Audit

| Area | Score / status | Notes |
|------|----------------|-------|
| Reasoning / tools | **Good locally** | Firecrawl, browser, delegation per `setup-final-state.md`. |
| Structured outputs | **Edge-owned for product** | **E6** = deterministic **`hermes-ranking`** + JSON schemas (G1–G5) — **not** Hermes CLI output. |
| Skills | **637 catalog** — **under-curated** for mde | Need **small** custom skill set for rentals + compliance. |
| Memory | **Split risk** | Taste in **Postgres** (E6-003); Hermes memory for **session** — **document** SoT. |
| Safety | **Risk** | Terminal/browser paths — **hooks** + **no** `curl \| bash` on secrets; **edge** must **not** trust agent output without validation. |

**Verdict:** **~31/100** integrated mde score per `02-hermes`; **strong installer**, **weak** product spine until **E5-003/004** + **E6-001**.

---

## OpenClaw Audit

| Area | Score / status | Notes |
|------|----------------|-------|
| Tools / Gateway | **Planned** | **E5-007** adapter TBD vs live API. |
| Channels (WhatsApp) | **Not prod** | **E8** depends on **Infobip + OpenClaw** — **architecture choice** Infobip vs Baileys still **must** be explicit. |
| Workflows / Lobster | **Absent** | **No** persistent workflow engine in backlog as **first-class** (optional **Lobster** tasks). |
| Multi-agent | **Minimal** | Org chart is **Paperclip**, not OpenClaw-native multi-agent. |

**Verdict:** **~22/100** per `04-openclaw` — **strategy OK**, **shipping** not.

---

## Supabase Audit

| Area | Score / status | Notes |
|------|----------------|-------|
| Schema / pgvector / PostGIS | **Strong** | Aligns with PRD search + maps. |
| Data | **Critical gap** | **0 rows** — **blocks** all relevance/O10 demos. |
| Edge functions | **Deployed, immature** | **verify_jwt false**, wildcard CORS, missing Zod — **E3** **before** real users. |
| Realtime | **Available** | Not fully exploited for **lead pipeline** events. |
| Auth | **User auth OK** | **Admin RBAC** weak (`progress`). |
| Agent ↔ DB | **Correct pattern** | Agents should hit **edge functions**, **not** service role on client — **enforce** in reviews. |

**Verdict:** **Data + security** are the **real** P0s for “AI platform”; agents are **ADVANCED** until those pass.

---

## Integration Issues

- **No single “happy path” wired:** **Paperclip** heartbeats do **not** yet drive **Hermes** via **`hermes_local`** + **OpenClaw** via **`openclaw_gateway`** into **Supabase** mutations — **described**, not **integrated**.
- **State fragmentation:** User prefs → **Postgres** (planned); chat → **conversations/messages**; Paperclip → **issues**; OpenClaw → **sessions** — **no** unified **`correlation_id`** across layers.
- **Duplicate ranking risk:** **MERM-07** vs **06E** — **edge `hermes-ranking`** is **canonical** for scores; Hermes CLI **explains** unless you **duplicate** math (forbidden without tests).
- **User-facing AI vs ops AI:** **Gemini** edges serve **www**; **Hermes** serves **Paperclip agents** — **PRD journey** (WhatsApp via OpenClaw) **not** connected to **same** lead row **automatically** until **E2 + E8**.
- **Manual choke points:** CEO broken, **no** 80% ops automation — **O6** unreachable.
- **Observability gap:** **`agent_audit_log` (09E)** vs **E5** logging — **ordering** unclear.
- **Event-driven automation:** **Partial** — cron/heartbeats planned; **no** unified **event bus** (e.g. DB webhook → queue → OpenClaw).

---

## Key Problems

1. **Security (E3)** blocks **any** “production-ready” claim — auth, CORS, Zod, rate limits, admin RBAC.
2. **Empty DB (E1)** blocks **ranking, demos, AI search quality**, and **pipeline** metrics.
3. **No payment loop (E2)** blocks **O1** and **commission story**.
4. **Trio not wired** — **Paperclip/Hermes/OpenClaw** are **sidecars** to a **web+Supabase** app, not an **orchestrated** system yet.
5. **Epic scope:** **E5-006** (gates) and **E8** (WhatsApp) are **too coarse** without **milestones**.
6. **Metrics without measurement:** **O3/O10** need **offline eval** — not in backlog as **concrete task**.
7. **WhatsApp path ambiguity** — **Infobip edge → OpenClaw** vs **native channel** — **must** be one **primary** ingress.

---

## Improvements

1. **Execute roadmap order:** **E1 + E3** in parallel early; **E2** pipeline; **then** **E6** ranking UI; **E5** agent wiring **in parallel** only after **CEO/workspace** unblocked — **not** before security/data.
2. **Publish a one-page “integration contract”:** For each flow (lead, showing, payment), list **owner system**, **idempotency key**, **correlation ID**, **rollback**.
3. **Sync MERM-07** with **06E** — ranking box under **edge**, not only under HermesCore.
4. **Split E5-006** into **gate-by-gate** issues; **split E8** into **echo → router → lead row → handover**.
5. **Mandatory `correlation_id`** from **Infobip/OpenClaw → edge → `ai_runs` → optional Paperclip comment.
6. **Feature flag:** “User chat brain = Gemini edge only” until **Hermes** is **explicitly** routed for **that** channel.
7. **Hermes:** Ship **E5-003** before **claiming** intelligent ops; **curate** 10–20 skills, not 637.
8. **OpenClaw:** **Stub E5-007** (health + one test message) before **E8** full build.
9. **Supabase:** **Seed** + **RLS review** on **new P1 tables** before lead capture prod.
10. **Observability:** Land **09E** **`ai_runs` everywhere** + **`agent_audit_log`** **or** explicit **stub** contract for E5.

---

## Recommended Architecture

**Ideal layering**

1. **User traffic:** **Vercel** → **Supabase edge** (Gemini) for **latency + audit**; **JWT** + **Zod** + **rate limits**.
2. **Data:** **Supabase Postgres** = **only** listing/booking/lead SoT; **Realtime** for **in-app** notifications.
3. **Paperclip:** **Issues** for **human+agent** work; **approvals** for **money/legal**; **heartbeats** for **stale lead / weekly snapshot** triggers (calling **edge** endpoints with **service** credentials **server-side** only).
4. **Hermes:** **Offline analysis**, **lease Q&A**, **complex reasoning** — invoked via **`hermes_local`** adapter, **not** on **every** user keystroke.
5. **OpenClaw:** **WhatsApp + messaging**; **tools** minimal profile for **prod**; **Lobster** (if adopted) for **long-running** KYC/payout **workflows**.
6. **Execution loop (weekly):** Paperclip CEO heartbeat → **inbox-lite** → **edge** `market-snapshot` / stale-lead report → **issues** for humans → **optional** Hermes summary **on demand**.

**Agent hierarchy (target):** CEO → CTO (code/edge) / CMO (growth) / Ops (listings) — **unchanged** from MERM-07; **enforce** with **issue assignment** + **approval** types.

---

## Real Estate Use Cases

### Core (map to epics)

| Workflow | Primary layer | Epic ref |
|----------|----------------|----------|
| Property ingestion | Supabase + admin UI | E1, E4 |
| Listing enrichment | Edge + Gemini / Hermes **ops** | E6, E7 |
| Search + ranking | `ai-search` → **`hermes-ranking`** | E6 |
| Lead capture | **`lead-capture`** edge | E2 |
| Booking / payment | Stripe webhook + bookings | E2, E3 |
| Showing schedule | **`showing-create`** + UI | E2, E4 |

### Advanced

| Workflow | Layers |
|----------|--------|
| Dynamic pricing | **Batch** analytics + **human** approval — not auto-write |
| WhatsApp concierge | **OpenClaw** + **E8** + **lead-capture** |
| Landlord onboarding | **Paperclip approvals** + **wizard** + optional **Lobster** |
| Contract analysis | **E7** `contract-analysis` + Hermes **optional** deep dive |
| Fraud / trust | **Rules** + **admin** + **audit** — agents assist, **don’t** auto-judge money |
| Supply/demand | **market-snapshot** + dashboards; **Paperclip** weekly review issue |

---

## Appendix A — Additional tasks & backlog gaps

**Question:** *Is anything missing? Do we need additional tasks?*

**Yes — add or sharpen these** (several are **implicit** in epics but **not** tracked as discrete, testable work):

| # | Suggested task | Why |
|---|----------------|-----|
| 1 | **Integration contract doc** (`docs/` or `tasks/architecture/integration-contract.md`) | Single **sequence** + **idempotency** for Paperclip ↔ Hermes ↔ OpenClaw ↔ Supabase. |
| 2 | **MERM-07 diagram update** | Align **composite ranking** with **edge** (06E); avoid **onboarding bugs**. |
| 3 | **Offline ranking eval harness** | JSON fixtures + tests for **O3/O10**; else metrics are **hand-wavy**. |
| 4 | **Correlation ID standard** | One header/prop across **Infobip, OpenClaw, edge, ai_runs, Paperclip** comments. |
| 5 | **WhatsApp architecture ADR** | **Infobip-only bridge** vs **OpenClaw Baileys** — **one** primary; document **failure** modes. |
| 6 | **E5-006 decomposed** | Replace monolith with **G1…G7** issues or **phases** — already recommended in **03-paperclip** audit. |
| 7 | **Staging / agent runbook** | Ports **3102**, Gateway bind, **Paperclip** auth, **OpenClaw** pairing — **one** runbook for **on-call**. |
| 8 | **Feature flags** | “Routing brain” per channel — **kill switch** if Hermes or OpenClaw **misbehaves**. |
| 9 | **Lobster or durable workflow epic** (optional) | **Lead qualification**, **payout approval**, **listing publish** — **3–5** workflows (see **04-openclaw** audit). |
| 10 | **E-commerce vs rental priority** | CLAUDE.md **coffee/Shopify** path still competes for focus — **explicit** **vertical priority** in **roadmap** if team is small. |
| 11 | **Playwright e2e** (E9) | Already in roadmap — **depends on seed**; treat as **blocked** until **E1** minimum seed. |
| 12 | **Paperclip `links.md` extensions** | Adapters, CLI, OpenAPI, heartbeat protocol — **doc debt** from **03-paperclip**. |

**Prompts added for Appendix A (cross-cutting):**

| # | Prompt file |
|---|----------------|
| 1–3 (contract + diagram pointer + eval pointer) | [`tasks/prompts/12A-trio-integration-contract.md`](../prompts/12A-trio-integration-contract.md) |
| 7 + 12 (runbook + links) | [`tasks/prompts/12B-trio-staging-operations-runbook.md`](../prompts/12B-trio-staging-operations-runbook.md) |
| 8 + 10 (flags + vertical priority) | [`tasks/prompts/12C-trio-ai-routing-feature-flags.md`](../prompts/12C-trio-ai-routing-feature-flags.md) |

Items **4–6, 9–11** map to existing prompts (**08G**, **08F**, **05L/05G**, **08J**, **09E**) — see [`tasks/prompts/INDEX.md`](../prompts/INDEX.md) § Trio system audit.

**Not missing (already covered well):** Epic **coverage** E1–E9, **RICE**, **security epic**, **PRD journeys**, **best-practices** files (`data-retention`, `gemini-cost-budget`, `definition-of-done`). **Gap is execution + decomposition**, not **lack of epics**.

---

## Appendix B — Cross-audit scores (reference)

| Audit | File | Approx. score |
|-------|------|----------------|
| Hermes | `tasks/audit/02-hermes.md` | ~31 |
| Paperclip | `tasks/audit/03-paperclip..md` | ~28 |
| OpenClaw | `tasks/audit/04-openclaw.md` | ~22 |

---

*Re-run this system audit after: E1 seed + E3 critical fixes + first E2 function deployed + E5-001/002 complete.*
