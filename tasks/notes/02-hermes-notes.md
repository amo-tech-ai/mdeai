# Hermes — working notes

Working note for **mdeai.co** — two different things share the name “Hermes” in docs. **Full audit:** [`tasks/audit/02-hermes.md`](../audit/02-hermes.md).

| Resource | Link |
|----------|------|
| E5 — Paperclip, adapters | [`05E-agent-infrastructure.md`](../prompts/05E-agent-infrastructure.md) |
| E6 — ranking, taste, snapshots | [`06E-hermes-intelligence.md`](../prompts/06E-hermes-intelligence.md) |
| Diagrams | `tasks/mermaid/07-agent-architecture.mmd`, `tasks/mermaid/09-edge-function-map.mmd` |

---

## At a glance

| Question | Short answer |
|----------|----------------|
| **What are the two “Hermes”s?** | **CLI** = Nous Hermes on a laptop (research, ops). **Edge** = planned `hermes-ranking` + taste in Supabase (product). |
| **Does the renter run Hermes?** | **No.** They use the website. Only **edge + DB** paths affect their experience directly. |
| **What’s the gap?** | Local CLI is fine; **Paperclip → CLI** and **search → rank** on the server are not fully wired. Audit **~31/100** end-to-end. |
| **What helps travelers first?** | After E6: **stable order** + **honest “why #1”** copy tied to server scores — not more CLI features. |

---

## TL;DR

1. **Nous Hermes (CLI)** — `hermes` + `~/.hermes/`. Internal: multi-step research, browser, delegation. **Not** the traveler app.

2. **Hermes Intelligence (E6)** — Supabase Edge (Deno): rank listings, taste profile, market snapshot. **Same** trust model as `p1-crm` — JWT, logs, one codebase path.

3. **Today** — Travelers use **ai-chat** + **ai-search**. Full E6 ranking is **not** live until `hermes-ranking` ships and **`ai-search` → `hermes-ranking`** is implemented together.

**Bottom line:** A good local installer is not the same as **production orchestration**. E5 closes the **internal** loop (instructions + adapter); E6 closes the **product** loop (deterministic rank in Postgres).

---

## How this helps the renter

**User story:** *As a traveler comparing apartments in Medellín, I want results that don’t reshuffle randomly and I want a short, honest reason when something is #1 — so I can trust the app and not feel manipulated.*

| They need | Role of **edge (E6)** | What **doesn’t** help them |
|-----------|------------------------|----------------------------|
| Fair, **repeatable** order | Same ranking rules on every request (neighborhood, budget, saved taste). | Hermes CLI on an engineer’s machine. |
| **“Why is this #1?”** | UI text driven by **one** scoring function + real listing fields — not a one-off chat guess. | A 10-page CLI research dump unless ops turns it into product copy. |
| **Trust (ES/EN)** | Single source of truth in **Postgres**; compliance-aware wording for Colombia. | Two conflicting “brains” (diagram vs code vs chat). |

**Until E6 lands:** Renters still get value from **ai-chat** and **ai-search**; this roadmap is about **the next layer** (rank + explainability), not renaming existing features.

---

## User stories — real world

Short **As a / I want / so that** stories, grounded in how mde actually works (search, chat, CRM, ops). Use them for acceptance criteria, demos, and onboarding.

### Travelers & renters (product — mostly E6 + taste in Postgres)

| Persona | User story | What “done” looks like in the real world |
|---------|------------|------------------------------------------|
| **Digital nomad** | *As a* remote worker *I want* search results that prefer quiet + strong Wi‑Fi in my budget *so that* I don’t waste visits on loud party buildings. | Ranking factors match **listing fields**; order is **stable** when I don’t change prefs. |
| **Couple / family** | *As a* two-person account *I want* the **same** top 5 when we refresh and when we open two phones *so that* we’re not arguing about a list that reshuffled overnight. | Same inputs → **same** edge rank (deterministic server logic). |
| **Spanish-first** | *As a* user *I want* short “why #1” text in **good Spanish** *so that* it matches what the screen shows in English and doesn’t feel translated by guesswork. | Copy comes from **precomputed** factors + real columns — not a one-off chat paraphrase. |
| **Returning visitor** | *As a* user who saved neighborhoods and price band *I want* my **taste** stored in the app *so that* I don’t re-explain everything every session. | Prefs live in **Postgres** (E6-003) — not only in ephemeral chat or CLI memory. |
| **Skeptical clicker** | *As a* traveler *I want* to understand **why** something is #1 in one glance *so that* I trust you’re not paid placement only. | UI shows factors tied to **edge** scores (e.g. neighborhood fit, price band) — honest constraints. |

### Renters — CRM & trust (today: `p1-crm` + UI; Hermes is not the scorer here)

| Persona | User story | Real-world note |
|---------|------------|-----------------|
| **Active renter** | *As a* signed-in user *I want* to **schedule a showing** from an apartment page *so that* I can visit before I decide. | Flow: CTA → `p1-crm` → row under **My rentals** — already product path; **not** the Hermes CLI. |
| **Support / CX** | *As* support *I want* **one** story for “why is this listing above that one?” *so that* I don’t contradict the app. | After E6: explain from **edge** scores + DB; before E6: chat/search only — **say so** to users. |

### Internal — ops, PM, engineering (E5 CLI + governance)

| Persona | User story | Real-world note |
|---------|------------|-----------------|
| **Ops** | *As* ops *I want* a Paperclip or job to run Hermes with **our** Medellín/rentals instructions *so that* research isn’t “whoever SSH’d last.” | Needs **E5-003** (instructions file) + **E5-004** (adapter) + **timeouts**. |
| **PM / pilot lead** | *As a* PM *I want* a **log** of agent runs *so that* we can audit before a paid pilot or partner demo. | Stdout / E9 / future `agent_audit_log` — not silent laptop runs. |
| **Engineer on call** | *As* on-call *I want* ranking incidents to point to **one** edge function and schema *so that* I’m not diffing mystery CLI output from last night. | **Edge**-only scoring path for production users. |

### Channels (OpenClaw / WhatsApp — not Hermes messaging)

| Persona | User story | Real-world note |
|---------|------------|-----------------|
| **Traveler on WhatsApp** | *As a* user *I want* concierge help on the channel I already use *so that* I don’t install new apps. | **OpenClaw / Infobip** — don’t stand up a **second** WhatsApp stack inside Hermes CLI. |

### Compliance & marketing (Colombia context)

| Persona | User story | Real-world note |
|---------|------------|-----------------|
| **Marketing** | *As* marketing *I want* claims about “best” or “#1” to trace to **data** *so that* we don’t overpromise in ads. | Tie copy to **edge** factors + DB; use **`mde-compliance-colombia`**-style guardrails for Habeas / fair claims. |

---

## CLI vs Edge — read this once

Use this table in PRs and onboarding so nobody wires the **CLI** into Vercel by mistake.

| | **Nous Hermes (CLI)** | **Hermes Intelligence (edge)** |
|--|------------------------|----------------------------------|
| **What it is** | Python CLI: `hermes`, `~/.hermes/config.yaml` | Deno edge function(s): e.g. `hermes-ranking` (planned) |
| **Who uses it** | Engineers, ops, (future) Paperclip jobs | **Every** app request that calls ranking |
| **Where it runs** | Laptop / CI | Supabase, next to `ai-search` |
| **Listings data** | Reads via tools; **does not** replace Supabase as source of truth | Reads Postgres; returns **scores / factors** for UI |
| **If we mix them up** | Someone tries to “embed” the CLI in the web app — **won’t scale**. | MERM-07 and epics disagree → **two ranking stories** (“dual brain”). |

**Rule:** **Truth** for listings = **Supabase**. CLI **explains** or **researches**; **edge** **scores** for users. Don’t keep two unrelated preference systems without a sync story (see E6-003).

---

## Scenarios (walkthrough — three roles)

Narrative versions of some stories above; use for demos and new-hire context.

### Traveler

1. Opens `/explore`, asks in Spanish for something like “quiet, Poblado, under $X.”  
2. **Today:** `ai-chat` / `ai-router` / embeddings — **not** the CLI.  
3. **After E6:** Search returns candidates → **`hermes-ranking`** applies fixed weights → **same** user sees **same** order when prefs unchanged — easier to support (“why #1?”).

### Operator (internal)

1. Paperclip task: e.g. “Research 2BR competitor pricing in El Poblado.”  
2. **Target:** Job triggers Hermes CLI with **repo instructions** (Medellín, rentals, no secrets in the file) + **timeout**.  
3. **Gap (E5):** Without `instructionsFilePath`, adapter, and logging, work stays **manual** — hard to audit.

### Engineer

1. Ships ranking in **Edge** with JWT + Zod + `ai_runs` like other functions.  
2. **Win:** Incidents trace to **one** function and **one** schema — not “maybe overnight CLI run differed.”

---

## Audit scores (plain English)

| Score | Meaning |
|-------|---------|
| **~72–78 local** | CLI stack is healthy: tools, Firecrawl, browser; messaging **off** (won’t collide with OpenClaw). |
| **~22–28 integration** | **mde** doesn’t yet ship adapter + edge ranking; diagrams may drift from epics. |
| **~31 end-to-end** | No full path: Paperclip → **documented** Hermes run → logs → optional user-facing explanation. |

---

## Priority follow-ups

**Order:** Stabilize **E5** (instructions + bridge + logs), then **E6** (ranking contract + Postgres taste), then diagram (**MERM-07**).

### E5 — Paperclip ↔ CLI

*Goal:* Replace “works on my machine” with **repeatable, logged** runs.

- [ ] **E5-003:** `instructionsFilePath` → repo markdown; **timeouts** on invoke.  
- [ ] **E5-004:** One bridge (Paperclip → `hermes chat -q` or `hermes-paperclip-adapter`); log invocations (E9 / stdout until `agent_audit_log`).  
- [ ] One naming story: `hermes_local` vs `tasks/hermes/links.md`.

### E6 — Edge intelligence

*Goal:* One **deterministic** ranker for all users; prefs in **Postgres**.

- [ ] **E6-001:** `hermes-ranking` + **`ai-search` → rank** (ship together).  
- [ ] **E6-003:** Taste canonical in DB; Hermes memory only for session / non-conflicting use.  
- [ ] **E6-004:** Occupancy formula or drop; owner: Paperclip vs `pg_cron`.  
- [ ] **Eval:** JSON fixture regression test before claiming accuracy KPIs.

### Docs & security

- [ ] **MERM-07:** Ranking lives under **Edge** or label *CLI explains, edge scores*.  
- [ ] **Hooks:** If used — document (redact secrets, block unsafe shell).  
- [ ] **Edge:** `verify_jwt` / CORS — Hermes doesn’t fix an open API.

---

## Safe layering

| Need | Where |
|------|--------|
| Numbers (rank) | Edge `hermes-ranking` |
| “Why it ranked” | Copy from **precomputed** factors; CLI/Gemini **narrate**, don’t silently change weights |
| Listing rows | **Supabase** only |
| WhatsApp / SMS | **OpenClaw / Infobip** — not a second Hermes messaging layer |

---

## Curated skills (why not 637 tools)

Smaller tool surface → fewer chances of shell exfiltration or destructive runs.

| Skill | Job |
|-------|-----|
| `mde-supabase-read` | Only public / approved APIs from agents |
| `mde-ranking-explainer` | Support/marketing aligned to **edge** scores |
| `mde-compliance-colombia` | Habeas Data–aware copy |
| `mde-lease-review` | Human checklist — not legal advice |
| `mde-market-snapshot-qa` | KPIs vs DB before decks |

---

## Re-audit

When **E5-003 + E5-004** are done, **`hermes-ranking`** is deployed once, and **MERM-07** matches epics — rerun [`02-hermes.md`](../audit/02-hermes.md) and update this file.