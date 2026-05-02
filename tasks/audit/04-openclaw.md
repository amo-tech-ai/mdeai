# OpenClaw — complete audit (mde / Medellín real estate marketplace)

**Scope:** Repo prompts (`tasks/prompts/*`), PRD (`tasks/prd-real-estate.md`), `tasks/progress.md`, `tasks/roadmap.md`, `tasks/openclaw/links.md`, MERM diagrams referenced in epics.  
**Method:** Evidence-based — what is **implemented in code** vs **specified in backlog** vs **documented aspiration**.

---

## Overall Score

| Lens | Score (0–100) | Rationale |
|------|-----------------|-----------|
| **Production OpenClaw integration** | **18–24** | No `openclaw_gateway` wiring, no E8 WhatsApp↔OpenClaw path shipped; Gateway not evidenced as driving live mde traffic. |
| **Strategic alignment (docs + epics)** | **52–58** | Trio story (Paperclip → Hermes / OpenClaw) is coherent; tasks exist (`05E` E5-007, `08E`) but **blocked** by earlier epics and Phase gating. |
| **Holistic “are we using OpenClaw correctly?”** | **~22** | You are **not yet using** OpenClaw as a runtime for mde — mostly **planned**. Correctness cannot be scored until one vertical slice ships. |

**Single number (execution reality): ~22/100** — strong **intent**, minimal **shipping**.

---

## Core Usage Audit

| Area | Using? | Correct? | Missing / notes |
|------|--------|------------|-----------------|
| **CLI workflows** (`openclaw onboard`, `gateway`, `channels`, `doctor`) | **Unknown / dev-only** | No repo automation (scripts/CI) invoking OpenClaw CLI for mde | Add runbook: install, `openclaw security audit`, `channels status --probe` before claiming WhatsApp prod. |
| **Channels** (WhatsApp, WebChat, etc.) | **No (prod)** | N/A — not wired | **E8-001** Infobip webhook + **E8-002** OpenClaw adapter **not built** (`progress`: 0%). PRD assumes OpenClaw → WA; app today is web-first + Supabase AI. |
| **Agents** (multi-agent routing, workspaces) | **Partially conceptual** | Diagrams (MERM-07) describe CEO/CMO/CTO/Ops — **Paperclip agents**, not OpenClaw `agents add` | OpenClaw multi-agent is **unused** unless you explicitly configure OpenClaw agents + bindings for ops vs concierge. |
| **Tools** (exec, browser, web_search, message, …) | **Not applied to mde product surface** | N/A | No mde-specific skills in OpenClaw workspace; no ClawHub skills pinned for “rental concierge.” |
| **Providers** (Gemini, OpenRouter, …) | **In Supabase edge** | **Split brain:** app AI = **Gemini via edge functions**; OpenClaw would use **its own** provider config | Decide: OpenClaw as **channel shell** only (delegate reasoning to Supabase) vs full agent in OpenClaw — E8-002 mixes both (OpenClaw → `ai-router`/`ai-chat`). |
| **Gateway** (WS, HTTP, auth, pairing) | **Planned only** | **E5-007** says “HTTP to OpenClaw” — must match real Gateway API ([Gateway runbook](https://docs.openclaw.ai/gateway), token/pairing) | **Red flag:** Example payload `{ channel, recipient_id, message }` is **not** a substitute for protocol-compliant client calls; verify against OpenAPI / WS contract. |
| **Skills** (workspace + ClawHub) | **No** | N/A | Add skills: `mde-rentals` (neighborhoods, fee rules), `mde-whatsapp-copy` (templates), optional Firecrawl for listing enrichment — align with `.claude/skills/open-claw/` (maintenance + gateway patterns). |

---

## Advanced Features Audit

| Feature | Using? | Notes |
|---------|--------|--------|
| **Multi-agent coordination** | **Minimal** | Paperclip org chart is the real coordination story; OpenClaw multi-agent **not evidenced**. |
| **Persistent workflows (Lobster)** | **No** | Not referenced in prompts; no `lobster` workflows in repo. |
| **Task memory + state** | **Supabase + sessions (web)** | OpenClaw session memory **not** unified with rental `leads` / WhatsApp thread state — risk of **split state** when E8 lands. |
| **Event-driven automation** | **Partial** | Edge webhooks, future Infobip; OpenClaw **cron / hooks** not tied to mde DB events. |
| **Tool chaining / composition** | **Edge pipelines** | Chaining is in **Supabase functions**, not OpenClaw tool graph. |
| **External integrations (WhatsApp, APIs)** | **Infobip planned** | **Two paths risk:** raw Infobip edge vs OpenClaw channel — must be **one** primary ingress to avoid duplicate bots. |
| **Real-time execution loops** | **Web chat + Realtime** | OpenClaw Gateway loop **not** in production path for mde users. |
| **Observability / logging** | **ai_runs (Supabase)** | OpenClaw Gateway logs + `agent_audit_log` (09E) **not** unified — add correlation IDs across Infobip ↔ OpenClaw ↔ edge. |
| **Error handling + retries** | **Edge patterns** | OpenClaw: document **idempotency** for `send`/`agent` ([architecture](https://docs.openclaw.ai/concepts/architecture)); Infobip: retries in E8-001 AC. |
| **Security / sandboxing** | **PRD + 03E** | OpenClaw: DM pairing, allowlists, `openclaw security audit` — **not** in task ACs for E8 | Add **before** public WhatsApp. |

---

## Key Problems

- **OpenClaw is mostly a diagram, not a system.** `progress.md` and epics describe adapters; **no shipped** `openclaw_gateway` or E8 pipeline.
- **Split brain (AI):** Supabase **Gemini** edge functions vs OpenClaw **provider** stack — E8-002’s “OpenClaw → ai-router → ai-chat” is a **custom integration** that must be explicitly engineered (auth, latency, streaming), not assumed from channel config.
- **Infobip vs OpenClaw WhatsApp:** OpenClaw’s [WhatsApp channel](https://docs.openclaw.ai/channels/whatsapp) (Baileys) and **Infobip Cloud API** are different stacks — **E8 must state one**: e.g. Infobip only → bridge into Gateway as HTTP, or native Baileys in OpenClaw (drops Infobip for that path). Mixing without a contract = **double-send / lost replies**.
- **Paperclip dependency:** E5-007 depends on Paperclip CEO/workspace (**03 audit**: blockers). OpenClaw automation **waits** on governance layer health.
- **No Lobster:** Long-running, resumable workflows (applications, KYC, payout approval) are **better** candidates for Lobster than ad-hoc agent turns — currently **absent**.
- **Tasks too high-level:** E5-007 and E8-002 are **multi-week** integration epics without intermediate **vertical slices** (e.g. “Gateway up + single test message to one allowlisted WA number”).
- **Weak operational closure:** No AC for `openclaw doctor`, `gateway status`, `channels status --probe`, or rollback if Gateway dies.

---

## Improvements (actionable)

1. **Pick the WhatsApp architecture explicitly** — Document one sequence: *(A)* Infobip webhook → edge → **forward to OpenClaw HTTP/WS** → response → Infobip outbound, or *(B)* OpenClaw owns Baileys and Infobip is legacy — **not both** without a bridge spec.
2. **Ship E5-007 stub first** — Paperclip → `openclaw message send` or documented Gateway RPC with **health check** and **idempotency key**; block production on **security audit** ([install](https://docs.openclaw.ai/install) + [gateway](https://docs.openclaw.ai/gateway)).
3. **Unify observability** — One trace ID from WhatsApp inbound through edge, OpenClaw (if used), and `ai_runs`.
4. **Add OpenClaw skills** — Minimal `SKILL.md` for mde: tone (bilingual), forbidden claims (legal), handoff to human, link to Supabase listing IDs.
5. **Decompose E8-002** — Phase 1: inbound text echo + allowlist; Phase 2: intent routing; Phase 3: carousel cards; Phase 4: Paperclip delegation.
6. **Evaluate Lobster** for deterministic pipelines (see below) — **before** claiming “fully autonomous.”
7. **Clarify provider strategy** — If all reasoning stays in Gemini edge functions, OpenClaw is a **transport + session** layer; configure tools **`minimal`** / **`messaging`** profile to reduce surprise exec ([tools](https://docs.openclaw.ai/tools)).

---

## Recommended Architecture

1. **Control plane:** Paperclip (issues, budgets, heartbeats) — **fix CEO + workspace** first (`05E` E5-001/E5-002).
2. **Reasoning layer:** Hermes for heavy CLI/agent turns **or** keep **Supabase Gemini** as canonical — **pick one primary** for ranking/lease copy; document in AGENTS.
3. **Channel layer:** OpenClaw Gateway as **single** messaging brain for WhatsApp/WebChat **once** E8 is designed; enforce **pairing/allowlists** ([channels](https://docs.openclaw.ai/channels)).
4. **Data plane:** Supabase remains SoT; OpenClaw tools call **edge functions** (never service role on client).
5. **Workflows:** Lobster (or OpenClaw cron + DB polling) for **scheduled** market snapshots, stale-lead nudges, showing reminders — **idempotent** steps writing to Supabase.
6. **Observability:** `ai_runs` + Gateway logs + optional `agent_audit_log` (09E) with shared `correlation_id`.

---

## Real Estate Use Cases

### Core (high ROI, align with P1–P2)

| Use case | OpenClaw role | Supabase / other |
|----------|---------------|------------------|
| **Property ingestion** | Optional: `web_fetch` / browser tool to pull host URLs; **mostly** ETL + admin | Tables + edge enrichment |
| **Listing enrichment** | Skills + LLM via **edge** (already Gemini) | Store drafts; human publish gate |
| **Ranking / scoring** | **Not** OpenClaw-core — **hermes-ranking** edge (06E) | OpenClaw can *explain* rankings to user on WA |
| **Recommendations** | Session-aware follow-ups on WhatsApp (“still interested in Laureles?”) | Taste profile (`06E`), `saved_places` |
| **Lead capture + qualification** | WhatsApp thread → structured `lead` row via router | `rentals` / lead tables |
| **Showing scheduling** | Reminder messages; host notifications | `showings` + Paperclip heartbeat |
| **Pricing optimization** | Narrative alerts (“+2% vs last snapshot”) | `market_snapshots` (06E) |

### Advanced (P3+)

| Use case | OpenClaw / Lobster angle |
|----------|---------------------------|
| **Landlord onboarding** | Lobster workflow: collect docs → approval step → `property_verifications` |
| **Dynamic pricing agents** | **Caution:** compliance; use **advisory** copy only + admin approval |
| **Conversational booking** | OpenClaw session + tool calls to `showing-create` / `application-create` edge functions |
| **Contract analysis** | Hermes or edge `contract-analysis`; OpenClaw delivers **summary** to WA |
| **WhatsApp automation** | Full E8; pairing, templates, rate limits |
| **Supply–demand matching** | Batch jobs + ranking; OpenClaw for **notifications**, not scoring source |
| **Fraud / scam signals** | Edge rules + low-confidence → Paperclip approval gate; OpenClaw **never** auto-commits money |

---

## Lobster Workflows

**Current use:** **None** in repo.

**Should you use it?** **Yes, selectively** — for **typed, resumable, human-gated** flows where pure chat is fragile (money, legal, identity).

| # | Workflow | Description |
|---|----------|-------------|
| 1 | **`lead.qualify`** | Inbound WA/web lead → extract structured prefs → write `lead` → if incomplete → ask follow-ups → escalate to human if stuck (approval gate). |
| 2 | **`showing.book`** | Slot selection → host availability → create `showing` → reminders (T-24h/T-1h) → post-showing feedback → link to application. |
| 3 | **`application.review`** | Renter docs → AI summary → **human approval** (Paperclip G4) → forward to landlord. |
| 4 | **`payout.week`** | Weekly cron → reconcile Stripe/bookings → generate payout lines → CEO/board approval → mark paid. |
| 5 | **`listing.publish`** | Draft → media checks → compliance checklist → admin approval (G3) → `published` + notify OpenClaw for **announcement** message (optional). |

Implementation note: Lobster integrates with OpenClaw via tools like `llm_task` / gateway ([lobster](https://github.com/openclaw/lobster), [docs](https://docs.openclaw.ai/tools/lobster)); keep **payments** in Stripe/Supabase, not inside Lobster shell commands without audit.

---

## Task Strategy Evaluation

| Question | Assessment |
|----------|------------|
| **Too high-level?** | **Yes** — E5-007, E8-002 bundle transport + AI + formatting + i18n; need **milestones** with demoable checkpoints. |
| **Decomposition?** | **Insufficient** — No explicit task for “Gateway production config” (bind, auth, Tailscale if remote). |
| **Delegation structure?** | **Clear on paper** (Hermes vs OpenClaw in MERM-07); **not executable** until adapters exist. |
| **Deterministic vs chaotic?** | **Chaotic risk** when OpenClaw and edge both generate replies — need **single orchestrator** per channel. |

**Bottlenecks:** Paperclip health → E5 → E8; schema/seed data → realistic tests; **architecture decision** Infobip path vs Baileys.

---

## Errors / Red Flags / Failure Points (summary)

| Severity | Issue |
|----------|--------|
| **P0** | Claiming “OpenClaw installed” while **0%** WhatsApp/OpenClaw adapter in `progress.md` misleads stakeholders. |
| **P0** | Unauthenticated or unpaired WhatsApp in Medellín = spam/scam surface — **pairing + allowlist** before campaigns. |
| **P1** | Dual AI paths (OpenClaw agent vs edge Gemini) without **routing rules** → duplicate or contradictory answers. |
| **P1** | E8-002 chain **latency** (webhook → OpenClaw → edge → back) may violate PRD “&lt; 5s first response” without caching/streaming design. |
| **P2** | No Lobster = **non-reproducible** ops playbooks for money/legal steps. |

---

## Appendix — Source prompts (OpenClaw-touching)

| File | Relevance |
|------|-----------|
| `tasks/prompts/05E-agent-infrastructure.md` | E5-007 `openclaw_gateway`, **E5-012** [`05M-openclaw-gateway-health-stub.md`](../prompts/05M-openclaw-gateway-health-stub.md) (health / idempotency / security audit) |
| `tasks/prompts/08E-multi-channel.md` | E8 Infobip + OpenClaw WhatsApp |
| **[`08F-whatsapp-ingress-architecture.md`](../prompts/08F-whatsapp-ingress-architecture.md)** | E8-005 — single WA ingress (Infobip vs Baileys) |
| **[`08G-openclaw-correlation-observability.md`](../prompts/08G-openclaw-correlation-observability.md)** | E8-006 — `correlation_id` → `ai_runs` |
| **[`08H-openclaw-wa-adapter-phase1.md`](../prompts/08H-openclaw-wa-adapter-phase1.md)** | E8-007 — phase-1 slice before full **08B** |
| **[`08I-openclaw-mde-skills.md`](../prompts/08I-openclaw-mde-skills.md)** | E8-008 — mde `SKILL.md` pack |
| **[`08J-lobster-workflows-spike.md`](../prompts/08J-lobster-workflows-spike.md)** | E8-009 — Lobster spike (P3) |
| **[`08K-openclaw-provider-strategy.md`](../prompts/08K-openclaw-provider-strategy.md)** | E8-010 — Gemini edge vs OpenClaw provider |
| `tasks/prompts/09E-production-readiness.md` | `agent_audit_log`, agent names |
| `tasks/prd-real-estate.md` | OpenClaw WhatsApp, metrics, journeys |
| `tasks/openclaw/links.md` | Official doc map |

---

*Audit reflects repo state as of task authoring; re-run after E5/E8 merges or Gateway production cutover.*
