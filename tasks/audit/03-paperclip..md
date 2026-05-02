# Paperclip — complete audit (mde / Medellín real estate marketplace)

**Evidence:** `tasks/progress.md`, `tasks/prompts/05E-agent-infrastructure.md`, `tasks/prompts/06E-hermes-intelligence.md`, `tasks/prompts/09E-production-readiness.md`, `tasks/paperclip/links.md`, `tasks/mermaid/07-agent-architecture.mmd` (referenced in 05E), `.claude/skills/paper-clip/SKILL.md`, `tasks/index.md` (Paperclip status).  
**Note:** Filename is `03-paperclip..md` (double dot); optional rename to `03-paperclip.md` for consistency.

---

## Overall Score

| Lens | Score (0–100) | Notes |
|------|-----------------|-------|
| **Production-grade Paperclip usage** | **26–32** | Server at `:3102`, 4 agents registered; **CEO instructions broken**, **workspace not bound** to repo (`progress.md`). Control plane exists; **governance loop does not**. |
| **Backlog / diagram coherence** | **58–64** | E5 epic + MERM-07 tell a clear story (CEO → adapters → gates); **implementation lags** and **E5-006 is oversized**. |
| **“Using Paperclip correctly?”** | **~28** | Correct **pattern** on paper; **operational reality** is pre-MVP — heartbeats, checkout/run-id discipline, and goals/projects are **not evidenced** as daily practice. |

**Single score (execution truth): ~28/100** — infrastructure **present**, **operating model** not yet **trustworthy**.

---

## Core Usage Audit

| Area | Using? | Correct? | Missing / notes |
|------|--------|----------|-----------------|
| **Companies / projects** | **Partial** | Company `mde` implied; **projects/goals** not evidenced in task prompts as linked IDs | Create **goals** per phase (CORE, MVP, GTM); attach E5 issues to goals; use `projectId` / `goalId` on issues per skill. |
| **Goals and issues (tasks)** | **Yes (locally)** | **Epic 5** maps to issues conceptually; **repo `tasks/*.md` is parallel**, not always synced to Paperclip issues | Risk: **dual task systems** — Cursor `tasks/` vs Paperclip PAP-* — pick **SoT** or sync discipline. |
| **Agents (roles)** | **Yes** | **4 agents** (CEO, CMO, CTO, OpsManager) per `progress` / index | **CEO broken (~3/10)** — instructions still placeholder per audits; roles **undefined in executable form** until E5-001 ships. |
| **Org structure (CEO → …)** | **Diagram only** | MERM-07 describes chain | **Delegation untested** — no proof of CMO/CTO/Ops **checkout → work → complete** cycles. |
| **Dashboard / board workflows** | **Unknown** | N/A from repo | Define **weekly board review** ritual: stale `in_progress`, blocked dedup, budget burn. |
| **Comments / communication** | **Partial** | Skill defines @-mentions, comment batching | Agents must **not** spam blocked tasks (skill: dedup); not in E5 ACs. |
| **Approvals system** | **Planned** | **G1–G7** in E5-006 + MERM | **E5-006 is a mini-product** — payments, listings, AI confidence; **split into phases** or it will stall. |
| **Cost tracking / budgets** | **Narrative** | E5-001 mentions 80%/100% budget | **No evidence** of Paperclip budget API wired to real token spend; **Hermes/OpenRouter** vs **Gemini edge** split obscures **one number**. |

---

## Task Strategy Issues

- **Epic 5 tasks are right direction, wrong granularity:** E5-001/E5-002 are **P0-sized**; E5-006 **bundles seven gates** across DB, notifications, admin, AI — **too large** for one completion event.
- **Subtasks / parent linkage:** Prompts use YAML IDs (E5-001…) but **no requirement** that Paperclip issues use **`parentId`** for decomposition — **flat backlog risk**.
- **Goals/projects gap:** High-level **outcomes** (O3, O6, O7) in 05E headers; **no explicit** `goalId` per issue in acceptance criteria — **weak traceability** from strategy → execution.
- **Delegation consistency:** CEO → Hermes vs CEO → OpenClaw is **specified**; **no** “if adapter fails, escalate to human” **SLA** in tasks.
- **Dependency ordering:** E5-004/E5-005 reference **`agent_audit_log`** (09E) — **ordering conflict** unless you stub logging to stdout/Paperclip activity first.
- **Machine-specific AC:** E5-002 hardcodes `/home/sk/mde` — **fails** for other devs; use **env or Paperclip workspace API** (`cwd` in project workspace per skill).
- **Package manager noise:** E5-002 AC says `pnpm dev` for Paperclip; **mde** app is **npm** — **document** which service uses which PM to avoid false “broken” signals.
- **Dual brains:** 06E composite ranking in **Supabase edge** vs Hermes in **E5-003/004** — **without one paragraph** in AGENTS/PRD, tasks **fight** over the ranking source of truth.

---

## Agent Architecture Issues

- **CEO cannot delegate reliably** until E5-001 fixes instructions — **single point of failure** for the whole “agent company.”
- **Role boundaries** (CMO vs CTO vs Ops) are **not** codified as **non-overlapping issue templates** — risk of **two agents** editing same surface without 409 handling discipline.
- **Missing roles (optional):** No **Compliance/Legal** agent for G4/G7-style gates; no **Support** agent for renter disputes — may be **human** for now, but **escalation path** should be explicit.
- **Separation of concerns:** **Paperclip** = tasks + approvals + heartbeats; **Supabase** = data — good. **Bad** if agents **curl production** without runbooks — push **edge functions** as the only mutation path for app data.
- **Escalation:** Skill defines **blocked** + comment; **no** mde-specific rule for **when CEO must page a human** (e.g. payout >$X, legal keyword).
- **“Agents doing work they shouldn’t”:** Without adapters, agents may **simulate** ops in chat instead of **checkout/issue updates** — **theater** vs **control plane**.

---

## Advanced Features Gap

| Feature | In use? | Gap / action |
|---------|---------|----------------|
| **Approvals workflow** | Planned (G1–G7) | **Split** E5-006; wire **Paperclip approvals API** to real gates one at a time. |
| **Cost reporting + budgets** | Weak | Unify **OpenRouter + Gemini** reporting in one dashboard narrative; set **Paperclip budget** to match. |
| **Activity / dashboard** | Partial | Use **activity API** for weekly ops review; link **`tasks/progress.md`** updates to a **single** ritual (human or agent). |
| **Secrets management** | Not in mde prompts | Use **Paperclip secrets API** for adapter keys where supported — avoid keys in repo. |
| **Storage / attachments** | Not specified | Use **issue attachments** for screenshots of Paperclip dashboard / failed heartbeats. |
| **Env / deploy modes** | Local only | Document **prod** Paperclip (if any): DB, auth, **non-localhost** API URL. |
| **Company skills** | Not used | **Import** or author **mde** skill pack (rental lexicon, Medellín neighborhoods, gate definitions). |
| **Task lifecycle (checkout → complete)** | **Gap in E5 ACs** | Add explicit: **`X-Paperclip-Run-Id`**, **never retry 409**, **`heartbeat-context` before thread replay** — per `.claude/skills/paper-clip/SKILL.md`. |
| **Routines** (cron/webhook heartbeats) | Underused in prompts | E5-005 says “schedule”; prefer **routines** for complex schedules vs ad-hoc cron. |
| **Issue document `plan`** | Missing | Large plans should live in **`plan` document** (`PUT .../documents/plan`), not only description. |
| **Adapters (HTTP/process)** | Planned | **E5-004/007** must match [creating an adapter](https://docs.paperclip.ing/adapters/creating-an-adapter.md); validate against **Nous `hermes-paperclip-adapter`** if not hand-rolling. |
| **CLI (`paperclipai`)** | Not in `tasks/paperclip/links.md` | Add CLI + **OpenAPI JSON** + **heartbeat-protocol** to links (see prior gap list in appendix). |

---

## Key Problems

- **CEO + workspace are blockers** — automation story is **blocked** until E5-001/E5-002 complete (`progress.md`).
- **Control plane vs documentation** — Rich **markdown epics** in-repo; **Paperclip issues** may not mirror them → **no single board** for the team.
- **E5-006 scope explosion** — “Implement G1–G7” touches product surface area comparable to **months** of app work.
- **agent_audit_log dependency** — E5-004/005 assume table from **09E**; **undefined ordering** → **silent drops** or **blocked** adapters.
- **No metrics loop** — No AC for **heartbeat success rate**, **time-to-done**, **409 rate**, or **budget vs throughput**.
- **Manual reliance** — “Running locally” without **routines** + **inbox-lite** discipline = **fancy cron + chat**, not **orchestration**.
- **API hygiene** — Mutations without **`X-Paperclip-Run-Id`** break **audit trail** — **forbidden** by skill, **omitted** from E5.

---

## Improvements

1. **Ship E5-001 + E5-002 in one sprint** — measurable CEO score **≥7/10**, workspace **`cwd`** verified with `ls` from agent context.
2. **Split E5-006** into **G1-only**, **G2-only**, … or **phase A** (read-only approvals) → **phase B** (mutations).
3. **Add to 05E acceptance criteria:** `X-Paperclip-Run-Id` on all mutating calls; checkout before work; **no 409 retry**; optional **`GET .../heartbeat-context`** before full comment load.
4. **Resolve 09E vs E5:** Either **09E first** (stub `agent_audit_log`) or **adapter logs to stderr + Paperclip activity** until table exists.
5. **One task system:** Either export **`tasks/prompts` → Paperclip issues** via script or declare **Paperclip SoT** for agent work and keep `tasks/` as **human docs**.
6. **Enrich `tasks/paperclip/links.md`:** adapters, CLI, heartbeat protocol, OpenAPI — gaps already listed in internal notes.
7. **Hermes vs edge ranking:** Add **one** `docs/` or `AGENTS.md` paragraph: **canonical rank** = edge **or** Hermes, not both without **explicit** fallback.
8. **Routines for heartbeats** — Replace vague “15 min” with **routine** definitions where schedules are non-trivial.
9. **Environment-agnostic workspace** — Replace hardcoded paths with **Paperclip workspace API** or `$MDE_ROOT`.

---

## Recommended Architecture

**Agent hierarchy (Paperclip)**

| Role | Primary responsibility | Adapter / tool |
|------|------------------------|----------------|
| **CEO** | Budget, gates, delegation, escalations | Creates subtasks; triggers approvals |
| **CTO** | Code, infra, edge functions, security epics | Hermes + repo tools |
| **CMO** | Growth, content, campaigns, lead follow-up copy | Hermes + OpenClaw (messaging) |
| **OpsManager** | Listings freshness, host comms, scheduling | OpenClaw + Supabase-facing tools |

**Task flow**

1. **Goal** per release (e.g. “MVP rental pipeline”) → **projects** under company `mde`.
2. **Epics** = parent issues; **E5-00x** = children with **`parentId`**.
3. **Heartbeat:** inbox-lite → pick → checkout → context → work → comment + status → delegate or complete.
4. **Gates:** **Paperclip approval** created → linked issues → resolution wakes CEO per skill.

**Execution loops**

- **Daily:** short heartbeat — stale `in_progress`, blocked dedup, budget check.
- **Weekly:** market snapshot trigger (06E) **or** CTO review of security epics.
- **Event:** comment @mention → wake → **never** duplicate blocked comments.

**Ideal end state:** Paperclip is **SoT for agent work**; Supabase is **SoT for product data**; Hermes/OpenClaw are **workers** behind adapters — **not** parallel command hierarchies.

---

## Real Estate Use Cases

### Core (map to issues + goals)

| Use case | Paperclip pattern |
|----------|-------------------|
| **Property ingestion** | CTO: issues per source; **subtasks** for scrape → validate → admin publish; **approval** for first publish (gate). |
| **Listing management** | Ops: recurring **routine** “stale listing review”; issues per listing cluster. |
| **Lead capture + CRM** | CMO: issues per campaign; **goal** “conversion rate”; link to **edge functions** once E2 tables exist. |
| **Booking / showing** | Ops: **approval** for first-time host; subtasks for calendar sync + reminders. |
| **Showing scheduling** | Issues per showing series; **blocked** state when host unresponsive. |
| **Landlord onboarding** | Multi-step **parent issue**; **G3/G4**-style approvals for identity + payout setup. |

### Advanced (higher risk — gate heavily)

| Use case | Paperclip pattern |
|----------|-------------------|
| **Pricing optimization** | **Advisory only** — CTO issue → Hermes analysis → **CEO approval** before any **user-facing** price change. |
| **AI listing scoring** | Same; separate **goal** “ranking quality”; don’t mix with **live** ranking edge without architecture note. |
| **Lead qualification** | CMO agent + **subtasks**; low confidence → **approval** or human queue. |
| **Contract analysis** | Hermes-heavy; **mandatory approval** before legal claims to users. |
| **Supply/demand balancing** | CEO **weekly** heartbeat + **dashboard** metrics issue — not ad-hoc agent guesses. |
| **WhatsApp / chat follow-ups** | **After E8** — OpenClaw adapter; **Paperclip** owns **when** to send (issue-driven), not copy-paste spam. |

---

## Appendix — Epic 5 task index (from `05E`)

| ID | Task | Priority |
|----|------|----------|
| E5-001 | CEO instructions | P0 |
| E5-002 | Bind workspace `:3102` | P0 |
| E5-003 | Hermes config | P0 |
| E5-004 | `hermes_local` adapter | P1 |
| E5-005 | Heartbeat + jobs | P1 |
| E5-006 | G1–G7 gates | P1 (split recommended) |
| E5-007 | `openclaw_gateway` adapter | P2 |
| **E5-008** | **API lifecycle** (`X-Paperclip-Run-Id`, 409, heartbeat-context) — **[`05I-paperclip-api-lifecycle.md`](../prompts/05I-paperclip-api-lifecycle.md)** | P1 |
| **E5-009** | **Goals + repo↔Paperclip SoT** — **[`05J-paperclip-goals-sync.md`](../prompts/05J-paperclip-goals-sync.md)** | P2 |
| **E5-010** | **`agent_audit_log` ordering** (09E vs stub) — **[`05K-paperclip-agent-audit-log-ordering.md`](../prompts/05K-paperclip-agent-audit-log-ordering.md)** | P1 |
| **E5-011** | **Approval gates Phase 1** (one gate E2E) — **[`05L-paperclip-approval-gates-phase1.md`](../prompts/05L-paperclip-approval-gates-phase1.md)** | P1 |

---

## Appendix — `tasks/paperclip/links.md` gaps (doc hygiene)

Canonical `docs.paperclip.ing/llms.txt` includes **adapters**, **CLI**, **heartbeat-protocol**, **Docker**, **quickstart**, **OpenAPI** — extend `links.md` when someone has bandwidth.

---

*Re-audit after E5-001/002 merge, first successful adapter run, and first Paperclip approval closed in production.*
