---
title: Mastra Prompt Pack — Forensic Task Audit
status: Delivered
created: 2026-05-10
scope: `/home/sk/mde/tasks/prompts/mastra/*.md`
sources:
  - .claude/skills/mastra/SKILL.md (version 2.0.0 orchestrator)
  - Mastra MCP `user-mastra` (listMastraPackages, mastraDocs)
  - `tasks/prompts/mastra/000-index.md`
  - `tasks/mastra/mastra-prd.md`
verified_runtime: `/home/sk/mde/my-mastra-app` (embedded docs target)
---

# Mastra Tasks Forensic Audit (01)

## Executive verdict

| Question | Answer |
|----------|--------|
| **Will the overall plan succeed?** | **Conditionally yes** — if **external gates** (`VDB-01`/`02`, ticketing edge reconciliation, **`RE-*`/`EVT-*` prompts**) land and **`MASTRA-001`** is executed honestly (no invented state). Pure Mastra-internal DAG is **mostly sound**. |
| **Are steps/commands/deps broadly correct?** | **YAML `depends_on` is acyclic and aligned ~90%+ with intent** — a few **`blocks`** fields + index summary rows omit newer tasks (**012–019**). |
| **Is the pack “100% correct”?** | **No** — see §5. Targets **~79% production-correctness** today (weighted). **100%** requires template hardening + resolved external deps + package pins. |

**Bottom line:** The architecture (**safety foundations → telemetry → UI decision → human handoff → verticals**) matches `mastra-prd.md`. **Highest risk is execution reality** (inventory slippage, vector/ticketing prerequisites, **`@mastra/client-js`** not yet installed anywhere in-repo, Postgres counter hot spots).

---

## 1. Audit methodology

1. **Static review:** all 19 numbered prompts + `000-index.md` frontmatter/`depends_on` extraction (grep-assisted).
2. **DAG check:** directional edges from `depends_on`; **no cycle found** involving MASTRA-001–019.
3. **`mastra` skill compliance:** prompts must mandate **embedded docs First** (`node_modules/@mastra/*`) or **remote** — several tasks cite MCP paths correctly for **019**, but lack explicit **CLI pin / version matrix** discipline the skill emphasizes.
4. **Mastra MCP verification (`user-mastra`):**
   - `listMastraPackages(projectPath=/home/sk/mde/my-mastra-app)` → **six** `@mastra/*` packages with embedded docs; **does not enumerate `@mastra/client-js`** in that app’s manifests.
   - Remote docs confirm **`MastraClient` + workflow client APIs** under `reference/client-js/*` (used to validate task **019** *intent*, not pinned version).

---

## 2. Severity-ranked findings

### Critical / launch blockers

| ID | Finding | Impact | Mitigation |
|----|---------|--------|------------|
| **E1** | **`VDB-01`/`VDB-02` are hard external gates** (`004`, `010`) but live **outside** the mastra prompt folder — schedule slip cascades entire Mastra “search + memory” path. | Search/memory verticals stalled | Make **explicit date/owner linkage** inside **001** inventory output; add **risk register row** per vector prompt ID. |
| **E2** | **`events` ticketing truth** (`007` touches `ticket-checkout`, webhook, QR, staff-link) depends on deterministic backend **outside** Mastra — PRD forbids Mastra owning that state — **risk of task scope creep** unless acceptance tests forbid mutation. | Revenue/compliance regression | Acceptance must include **negative tests**: Mastra responses **never** PATCH ticket/stripe authoritative tables. |
| **E3** | **`restaurant-booking`** edge stub in **008 YAML** (`edge_function`) may **not exist** → **premature coupling** blocks “prompt-truthfulness”. | Phantom dependency | Rename to **`null`** or **` Later: 071/072`** until tasks exist **or** cite exact function name from repo grep in **001**. |
| **E4** | **`@mastra/client-js` absent from `my-mastra-app/package.json`** (MCP app used for verification). **`019` assumes package presence.** | Broken import on day one of SDK task | **`019` acceptance #1**: add **`@mastra/client-js`** (+ lockfile pin) alongside **esbuild/Vite SSR** ingress doc. |

### High-risk (likely pain, not necessarily wrong)

| ID | Finding | Notes |
|----|---------|-------|
| **H1** | **`014` metering in Postgres only** → hot-row contention under fan-in | Plan **composite keys + batch increments** early; cite in **014**. |
| **H2** | **Dual-write drift** Postgres `workflow_*` ↔ Mastra `runId` | Gateway-only writers + **checksum job** mentioned weakly — strengthen **012/017**. |
| **H3** | **`blocks` stale on `001`/`002`/`003`/`004`/`005`** → omits **012–019, 011** | Lifecycle confusion—not a cycle bug, **docs hygiene**. |
| **H4** | **017** recovery lacks explicit edge to **018** handoff or **016** stream contract | Replay could bypass human SLA — add **depends_on MASTRA-018** soft or playbook cross-link. |
| **H5** | **`010` memory** skips **015** registry alignment for memory tools classification | Potential **unclassified tool** loophole |

### Medium — quality / lifecycle compliance

| ID | Finding |
|----|---------|
| **M1** | **`mde-task-lifecycle` Phase 1 checklist** expects `description:` YAML + fuller template sections (`tasks/tasks-template.md` style) → **mastra prompts are lightweight** (~60–70% compliant). |
| **M2** | **Uneven observable acceptance criteria:** some tasks omit **loading/error/empty** UI states mandated in `CLAUDE.md` for surfaced UI (**009**, **016** partially). |
| **M3** | **`phase` noun drift** (**CORE vs MVP**) across files — tooling sorts may mis-prioritize. |

### Low — documentation nits

| **L1** | `000-index.md` numbering-conflicts table row historically missing closing `|` (rendering glitch) — cosmetic. |

---

## 3. Per-task scorecard (forensic shorthand)

Legend: ✅ sound | ⚠️ risk/gap | ❌ blocker if unaddressed  

| Task | Architectural fit | Depends sanity | MCP/skill hygiene | Prompt completeness |
|------|-------------------|----------------|-------------------|---------------------|
| **001** | ✅ | ⚠️ `blocks` ignores new-graph | ⚠️ must output version pins | ⚠️ light on exit artifact path |
| **002** | ✅ | ✅ | ⚠️ add exact Node/TS module strategy | ⚠️ |
| **003** | ✅ | ✅ critical path | ✅ | ⚠️ gateway auth Zod specifics |
| **004** | ✅ | ⚠️ `VDB-01` | ✅ hybrid pattern | ⚠️ |
| **005** | ✅ | ✅ heavy but coherent | ⚠️ streaming contract split w/016 | ⚠️ |
| **006** | ✅ | ✅ + RE-* externals | ⚠️ | ⚠️ |
| **007** | ✅ intent | ⚠️ ticketing backlog | ⚠️ | ⚠️ |
| **008** | ✅ | ⚠️ `EVT-071` + restaurant edge naming | ⚠️ | ⚠️ |
| **009** | ✅ sequence | ✅ | ✅ UI Dojo citation | ⚠️ |
| **010** | ✅ | ⚠️ `VDB-02`, registry gap | ⚠️ | ⚠️ |
| **011** | ✅ early placement | ✅ | ⚠️ redact PII in traces explicit | ⚠️ |
| **012** | ✅ | ⚠️ write-path ownership drilling | MCP workflow-state docs cross-check OK | ⚠️ |
| **013** | ✅ | ⚠️ backfill migrations scope | ⚠️ | ⚠️ |
| **014** | ✅ design | ⚠️ scale | ⚠️ | ⚠️ |
| **015** | ✅ cornerstone | ⚠️ sync file↔table truth | ⚠️ | ⚠️ |
| **016** | ✅ sequencing | ⚠️ late vs partial handoff UX | ⚠️ | ⚠️ |
| **017** | ✅ | ⚠️ weak link **018**/UI | MCP resume/cancel aligns | ⚠️ |
| **018** | ✅ critical | ✅ enriched deps | ⚠️ Paperclip API task missing | ⚠️ |
| **019** | ✅ | ⚠️ package **not installed** verified | MCP `reference/client-js` OK | ⚠️ BFF pattern choice |

---

## 4. PRD alignment check (`mastra-prd.md`)

| PRD pillar | Mastra prompts cover? | Gap |
|------------|------------------------|-----|
| Mastra orchestration bounded | ✅ **003/015** | Operational **Hermes/OpenClaw** contracts still **thin** prompt-level IDs |
| Supabase SSOT | ✅ **012–014/013** | Not all tables named in **migration ID** placeholders |
| OpenClaw execution-only | ✅ repeated | **Dedicated allowlist ingestion task absent** beyond **015.policy** prose |
| Paperclip approvals | ⚠️ through **018/003** | **No discrete “Paperclip API bridge” Mastra-ID** ↔ risk of orphaned governance |
| LangGraph deferral | ✅ | OK |
| Observability before scale | ✅ **011 repositioned earlier** | OK |

**PRD conformance estimate:** **88%** at planning depth (drops if implementation ignores **001** evidence).

---

## 5. Weighted correctness score

| Dimension | Weight | Score | Contribution |
|-----------|-------|-------|---------------|
| Architecture & sequencing (`000-index`) | 30% | **92** | **27.6** |
| Dependency graph integrity (`depends_on` acyclic / intent) | 25% | **88** | **22** |
| Task spec completeness (lifecycle template + AC observability) | 20% | **58** | **11.6** |
| External dependency clarity (`VDB`, ticketing, RE/EVT IDs) | 15% | **68** | **10.2** |
| MCP/skill-aligned implementation guardrails | 10% | **72** | **7.2** |
| **Total** | **100%** | — | **~78.6%** ⇒ **round → 79%** |

**Interpretation:** **Strong strategy / moderate execution readiness.**

---

## 6. MCP + skill-derived best-practice confirmations

Applied from **`.claude/skills/mastra`**:

| Practice | Prompt pack status |
|----------|-------------------|
| **Never trust stale API recall** — consult embedded docs or remote | ⚠️ **Partially baked** → `019` cites MCP refs but **tasks lack version pin table** |
| **`"provider/model"` format** router usage | ⚠️ **Insufficiently specified** inside numbered prompts (**005/006**) beyond PRD prose |
| **ES2022 module requirement** | ❌ Not repeated per-task (**002 only implicit**) |
| **Studio loop** (`mastra dev` / local 4111) | ⚠️ Mentioned episodically, not gated in AC matrix |

Applied from **MCP `listMastraPackages`** (@ `my-mastra-app`):

- Confirms **`@mastra/memory`, `@mastra/evals`, `@mastra/server` ecosystem** aligns with roadmap themes (**010/011**).
- Highlights gap: **`@mastra/client-js` not installed locally** ⇒ **implementers must bootstrap per skill priority order**.

---

## 7. Commands / reproducibility sanity

| Checkpoint | Guidance | Status |
|------------|----------|--------|
| Fresh clone verify graph | Not automated | ❌ Recommend **tiny script**: parse YAML `depends_on` → topo sort |
| `rg '@mastra/' package.json packages/**` during **001** | Should be inventory output | ⚠️ Procedural only |
| `npm ls @mastra/client-js` after **019** | Must pass | ⚠️ add explicit AC |

---

## 8. Recommended critical fixes (next doc edits — not necessarily code yet)

Priority order:

1. **001 output template:** Mandatory **risk register** referencing **`VDB-*`**, ticketing functions, **`@mastra/client-js` install plan**.
2. **008 YAML:** Normalize **`edge_function`** to reality or **`null`**.
3. **`blocks` fields** (`001`,`002`,`003`,`004`): append **architecture pack IDs** (`012–019`, `018`, `011`) **or drop `blocks`** to avoid contradiction.
4. **010 `depends_on`:** Add **`015`** (+ optionally **`019`**) for typed tool surfacing parity.
5. **017 linkage:** Explicit cross-ref **018**/operator UX + deterministic replay forbids conflicting open handoffs.
6. **Global AC injection:** Align top **five** bullets per prompt with **`mde-task-lifecycle`** validation (**≤10 observable ACs**, loading/error paths on UI-facing tasks).

Optional follow-on audit (**02**) after **001** merges: regenerate scores + flip status table.

---

## 9. Conclusion — will it succeed?

**Yes, if:**
- **`MASTRA-001` discovers no silent schema drift**, ticketing stack is deterministic, **`VDB-01`** lands for hybrid search timelines, **`@mastra/client-js` + Mastra deploy ingress** solved with secrets hygiene, Postgres quota strategy load-tested (**014**).

**Likely stalls if:**
- External vector/ticketing work ignored while Mastra milestones are marked “started”, **`restaurant-booking` assumed deployed**, **`019` merges without pinning client package**, **`017` resumes** fire without **`018`** state reconciliation.

---

**Auditor stance:** Architectural ordering is production-grade (**~93% directional correctness**); **overall pack weighted ~79%** due to lifecycle template incompleteness + external prerequisites + Minor package pinning gaps—not because the strategy is wrong.

---

*Audit generated via repository static analysis + Mastra MCP (`user-mastra`) + Mastra SKILL.md policies. Numbers are heuristic engineering judgement, not a formal proof.*
