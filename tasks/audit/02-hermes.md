# Hermes — complete audit (Nous Hermes Agent + mde “Hermes Intelligence”)

**Evidence:** `tasks/progress.md`, `tasks/prompts/05E-agent-infrastructure.md`, `tasks/prompts/06E-hermes-intelligence.md`, `tasks/mermaid/07-agent-architecture.mmd`, `tasks/mermaid/09-edge-function-map.mmd`, `tasks/hermes/links.md`, `.claude/skills/hermes/SKILL.md`, `.claude/skills/hermes/references/setup-final-state.md`.  
**Disambiguation (now in `06E` header):** **Nous Hermes Agent** = Python CLI (`hermes`, `~/.hermes/config.yaml`). **“Hermes Intelligence” (epic 6)** = **Supabase edge** composite ranking / taste / market snapshot — **not** the CLI subprocess.

---

## Overall Score

| Lens | Score (0–100) | Notes |
|------|-----------------|-------|
| **Local Nous Hermes install + tooling** | **72–78** | v0.7.0, OpenRouter/Claude, Firecrawl, browser, delegation, cron per `setup-final-state.md`; messaging **off**; **E5-003 gaps** (`instructionsFilePath`, timeout) per `progress.md`. |
| **mde product integration (Paperclip + Supabase + adapters)** | **22–28** | `hermes_local` **not shipped**; ranking/taste edge fns **not built**; **dual-brain** risk if MERM-07 and `06E` diverge. |
| **Single “are we using Hermes correctly end-to-end?”** | **~31** | **Good** standalone agent; **weak** as the **defined** reasoning layer for mde until config + adapter + **one canonical ranking path** exist. |

**Headline: ~31/100** — installer-level maturity **does not** translate to **production orchestration**.

---

## Core Features Audit

*(Nous Hermes runtime — CLI / `~/.hermes`)*

| Feature | Using? | Correct? | Missing / notes |
|---------|--------|----------|-----------------|
| **Tools** (web_search, browser, terminal, …) | **Yes** | Mostly | Firecrawl errors observed — tune quotas/config; **terminal-heavy** workflows risk unsafe patterns if prompts are sloppy. |
| **Skills** (catalog) | **Yes (637)** | Partial | **Project** `.claude/skills/hermes` is **assistant** docs, not in-engine skills; **no mde-specific** Hermes skill pack for rentals. |
| **Context files / references** | **Partial** | Risk | **AGENTS.md** in repo should hold mde rules; **SOUL.md** must stay generic per Nous — don’t stuff repo paths into `~/.hermes/SOUL.md`. |
| **Personality (SOUL.md)** | **Present** | Unknown | Verify alignment with **bilingual / Colombia** product tone in **AGENTS.md**, not only SOUL. |
| **Hooks** (pre/post) | **Unknown** | — | Not documented in mde runbooks; add if you need **redact secrets** or **block** raw `curl \| bash` from tool output. |

---

## Advanced Features Audit

| Feature | Using? | Notes |
|---------|--------|--------|
| **Memory** (long-term / structured) | **Partial** | Hermes has memory stack; **canonical taste/listing state** should stay **Postgres** (E6-003) — avoid **two** user preference stores without sync. |
| **MCP** | **No / minimal** | Not wired to Supabase MCP in runbook; **optional** for IDE parity — **not** required for deterministic `hermes-ranking` edge. |
| **Delegation** | **Enabled** | Multi-agent behavior on; **Paperclip** must own **which** agent runs when — else duplicate work. |
| **Code execution** | **In catalog** | Use **sandbox/Docker** for untrusted code per Nous tips; **never** pipe curl to python on prod secrets. |
| **Batch processing** | **Unknown** | Use for offline eval of ranking if you add datasets (E6 hypothesis ≥70% top-1). |
| **Browser / web** | **Yes** | Good for **research**; **bad** as SoT for listings — **Supabase** remains authoritative. |
| **Plugins** | **Not emphasized** | Evaluate only if you need custom tools; increases attack surface. |
| **Provider routing** | **OpenRouter + Claude** | Align with **edge Gemini** story: Hermes = **ops/analysis**; app user chat = **edge** — document boundary. |
| **Messaging (WA, email, webhooks)** | **Disabled** | Correct for now — **OpenClaw/Infobip** owns channels per stack choice; avoid **two** WhatsApp stacks. |
| **Honcho / memory providers** | **Not in mde path** | Fine for MVP; if enabled later, **map** to compliance (Ley 1581) for profile data. |

---

## Task Strategy Issues

- **`06E` is not a Hermes CLI checklist** — it builds **Deno edge** functions; strategy is **right** for latency/auditability; **naming** must stay explicit (already in epic header).
- **E5-003/E5-004 still open** — Paperclip → **`hermes chat -q`** adapter is the **execution** bridge; without it, “Hermes for tasks” is **manual CLI**, not **orchestrated**.
- **MERM-07 vs MERM-09:** Diagram puts ranking inside **HermesCore**; **canonical scorer** is **edge** per `06E` — **update diagram** or label “optional CLI explanation only.”
- **Shell reliance:** `setup-final-state` shows terminal + browser path; **risk** = unstructured commands from model — prefer **structured tools** + **edge APIs** for money/listings.
- **Task size:** E6-001 is large (7 factors + JWT + Zod + ai_runs); **acceptable** if **single owner**; **E6-004** needs **defined occupancy** + **scheduler owner** (Paperclip routine vs `pg_cron`).
- **Metrics:** “≥70% top-1” in hypothesis — **no** eval dataset in repo → **theater** until labeled data exists.

---

## Key Problems

- **Two “Hermes” meanings** — mitigated in `06E` text; **still** dangerous for new hires if MERM-07 is stale.
- **Integration readiness ~40%** (`setup-final-state`) — **Supabase** not primary structured store for Hermes tool loop yet.
- **`instructionsFilePath` + timeout missing** (`progress` / E5-003) — CLI runs **without** mde-specific grounding on every invoke.
- **`hermes-paperclip-adapter`** listed in `tasks/hermes/links.md` but **not** committed in E5 — may duplicate hand-rolled `hermes_local`.
- **ai-search vs hermes-ranking** — ordering documented in E6-001 (search → rank); **must** ship both or intermediate UI will **break**.
- **Security:** Edge functions in `progress` still show **verify_jwt false**, wildcard CORS — **Hermes** doesn’t fix that; **blocks** production regardless of agent quality.
- **Unsafe patterns:** Any playbook that suggests **`curl … \| python`** or piping **install scripts** without review belongs in **dev-only** docs with warnings.

---

## Improvements

1. **Finish E5-003** — `instructionsFilePath` to an mde markdown file (Medellín, rental domain, **no** service role keys, **edge-only** mutations).
2. **Ship E5-004 or adopt `hermes-paperclip-adapter`** — one **supported** path from Paperclip to Hermes CLI; **log** invocations (09E / stdout until `agent_audit_log` exists).
3. **Update MERM-07** — box **“Composite ranking”** under **Edge (Deno)** or annotate **“CLI explains; edge scores.”**
4. **Implement E6-001** with **JWT + Zod** — closes the **product** “Hermes Intelligence” loop; keep scores **deterministic**; Gemini only for **optional** blurbs with G1–G5.
5. **E6-004:** Define **occupancy** formula or **drop**; assign **scheduler** (Paperclip routine vs Supabase cron) in AC.
6. **Memory strategy:** User taste → **Postgres** (E6-003); Hermes native memory for **session** only, or **disable** conflicting features — **one** preference SoT.
7. **Hooks:** Add **pre-tool** hook to **block** known bad patterns (e.g. exfil env) if Hermes exposes them.
8. **Offline eval:** Small JSON fixture of apartments + user prefs → **regression test** for `hermes-ranking` **before** claiming accuracy metrics.
9. **`links.md`:** Already excludes **godmode** from onboarding — keep; audit **optional skills** before enabling in prod profiles.

---

## Skills Strategy

- **Catalog size (637)** is **not** value — **curate** 10–20 for mde: web research, browser, **document** skills, maybe **data** extraction; **disable** reckless toolsets in prod operator profiles.
- **Top 5 custom / priority skills to add or tighten**
  1. **`mde-supabase-read`** — patterns to call **only** public/edge APIs (no raw DB from Hermes unless via approved MCP).
  2. **`mde-ranking-explainer`** — natural-language explanation of **precomputed** edge scores (no re-inventing weights in prose).
  3. **`mde-compliance-colombia`** — Habeas Data + fair housing–style **claims** guardrails for copy.
  4. **`mde-lease-review`** — structured checklist output (dates, deposit, exit clauses) — **advisory**, not legal advice.
  5. **`mde-market-snapshot-qa`** — validate E6-004 outputs against **DB** before treating as KPI.
- **Tool composition:** **Search → fetch → summarize** is fine for **research**; for **user-facing listings**, flow must be **edge/DB → rank → UI**, with Hermes optional for **ops** only.

---

## Recommended Architecture

| Layer | Role | Boundary |
|-------|------|----------|
| **Paperclip** | Tasks, approvals, budgets, heartbeats | **Never** holds listing truth |
| **Hermes (Nous)** | Deep reasoning, multi-step research, optional **explanations** of scores | **No** direct writes to production DB without reviewed tools |
| **OpenClaw** | Channels, messaging, Lobster-style workflows | **No** duplicate ranking SoT |
| **Supabase** | Listings, taste profiles, `hermes-ranking` **edge**, `ai_runs` | **Only** layer user apps trust for **data** |
| **Execution** | `hermes_local` adapter invokes CLI with **timeout** + **structured prompt**; results back to Paperclip issue | **409 / run-id** discipline per Paperclip skill |

**Safe usage pattern:** **Numeric rank** = edge function; **Hermes** = “why this ranked high” + **internal** research; **Gemini** = structured JSON per G1–G5 where used.

---

## Real Estate Use Cases

### Core (aligned with stack)

| Use case | Where it runs | Note |
|----------|----------------|------|
| **Property search + ranking** | **Edge `hermes-ranking`** + `ai-search` recall | Hermes CLI **explains** breakdown; does **not** re-score unless you explicitly duplicate logic. |
| **Listing enrichment** | **Edge / admin** + Gemini | Hermes optional for **batch** draft copy in **ops** workspace — human publish gate. |
| **Lead qualification** | **Edge chat + DB** | Hermes via adapter for **complex** qualification threads under Paperclip **approval** gates. |
| **Conversational concierge** | **ai-chat** edge for users | Keep **one** user-facing brain; Hermes is **secondary** unless product decides otherwise. |
| **Booking assistance** | **Future** edge functions + state machine | Paperclip issues per **booking** epic. |

### Advanced (high governance)

| Use case | Pattern |
|----------|---------|
| **Pricing optimization** | **Offline** Hermes analysis + **human** approval; never auto-write prices without gate. |
| **Landlord onboarding** | **Lobster/OpenClaw** long-running + Paperclip approvals; Hermes for **document** Q&A only. |
| **Contract analysis** | Hermes + **structured** output template; **disclaimer**; escalate to human. |
| **Fraud detection** | **Rules + ML in DB/edge**; Hermes for **investigation** narratives, not **sole** signal. |
| **Supply/demand matching** | **SQL + snapshots** (E6-004); Hermes for **report** generation. |
| **WhatsApp flows** | **OpenClaw** primary; Hermes **only** if bridged **intentionally** — avoid dual bots. |

---

## Appendix — prior link / `06E` findings (condensed)

- **`tasks/hermes/links.md`** — strong official coverage; **godmode** correctly excluded from staff onboarding.
- **E6-001 risks:** missing apartment columns, large `apartment_ids` batches (pagination noted in prompt), **overlap** with `ai-search` ordering — keep **search → rank** contract.
- **E6-002:** WCAG — color + text labels (addressed in AC).
- **E6-003:** Privacy — Habeas Data; cold start documented.
- **Re-fetch** `hermes-agent.nousresearch.com` docs after major releases.

---

*Next audit pass: after E5-003/004 land, first `hermes-ranking` deploy, and MERM-07 diagram sync.*
