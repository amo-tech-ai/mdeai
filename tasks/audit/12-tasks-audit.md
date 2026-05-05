# Forensic Audit Report — `tasks/prompts/` (Task Prompt Library)

**Auditor stance:** Senior software specialist + forensic reviewer — strict scoring; evidence over optimism.  
**Date:** 2026-04-06  
**Scope:** Entire `tasks/prompts/` tree (INDEX, PROMPT-VERIFICATION, `core/`, `advanced/`, `production/`, `reference/`), cross-check against `system.md`, `tasks/mermaid/INDEX.md`, and **spot verification** of live repo config (`supabase/config.toml`).  
**Out of scope:** Full line-by-line read of all 66 prompt bodies; events vertical (`events/prompts/`).  
**Method:** Inventory counts, automated gap analysis (`diagram_id`, `Acceptance` presence in `core/`), INDEX consistency, process-rule alignment, representative file reads.

<!-- Per-prompt scores: rubric = traceability (`diagram_id` or MERM in prose), structured tasks (YAML/frontmatter), observable AC/verification, dependencies/skills, length; penalties for decision gates, phase mismatch, missing diagram, epic-index thinness, prompts to merge elsewhere. Scores reflect **prompt quality**, not a line-by-line code audit. -->

## Per-prompt score summary (all 66 files)

| Phase | Prompt file | % correct | Comment |
|-------|-------------|-----------|---------|
| core | `core/01E-data-foundation.md` | **98** | traceability + AC + depth |
| core | `core/02E-lead-to-lease-pipeline.md` | **98** | traceability + AC + depth |
| core | `core/02F-e2-showing-reminders-cron.md` | **83** | very short |
| core | `core/02H-e2-pipeline-phasing-web-vs-whatsapp.md` | **75** | very short; absorb into 02E |
| core | `core/03E-security-hardening.md` | **98** | traceability + AC + depth |
| core | `core/04A-ai-search-wire.md` | **93** | traceability + AC + depth |
| core | `core/04E-frontend-rental-flow.md` | **98** | traceability + AC + depth |
| core | `core/08A-infobip-whatsapp-webhook.md` | **93** | traceability + AC + depth |
| core | `core/08C-wa-lead-capture.md` | **93** | traceability + AC + depth |
| core | `core/08L-wa-apartment-search.md` | **57** | no diagram_id; E8 label in CORE |
| core | `core/09E-production-readiness.md` | **93** | INDEX vs YAML phase |
| core | `core/10A-crm-api-envelope.md` | **83** | very short |
| core | `core/10B-crm-ui-pipeline.md` | **93** | traceability + AC + depth |
| core | `core/10C-crm-deploy-smoke.md` | **83** | very short |
| core | `core/10E-crm-real-estate.md` | **54** | mini index; thin AC |
| core | `core/13A-e3-edge-security-extensions.md` | **93** | traceability + AC + depth |
| core | `core/13B-e2-payment-rollback-idempotency.md` | **83** | very short |
| core | `core/13C-docs-hygiene-prd-index-rice-dod.md` | **83** | very short |
| core | `core/13E-gemini-g1g5-edge-acceptance-audit.md` | **93** | traceability + AC + depth |
| core | `core/14A-chatbot-cleanup.md` | **61** | no diagram_id |
| advanced | `advanced/02G-e2-merm-journey-e2e-smoke.md` | **83** | very short |
| advanced | `advanced/04B-ai-trip-planner-wire.md` | **93** | traceability + AC + depth |
| advanced | `advanced/04F-e4-move-in-checklist.md` | **83** | very short |
| advanced | `advanced/05A-paperclip-ceo-instructions.md` | **93** | traceability + AC + depth |
| advanced | `advanced/05B-paperclip-workspace-bind.md` | **93** | traceability + AC + depth |
| advanced | `advanced/05C-hermes-config-instructions-timeout.md` | **93** | traceability + AC + depth |
| advanced | `advanced/05D-hermes-local-adapter.md` | **93** | traceability + AC + depth |
| advanced | `advanced/05E-agent-infrastructure.md` | **60** | epic index + order; 05K blocks dependents |
| advanced | `advanced/05F-paperclip-heartbeat-schedule.md` | **93** | traceability + AC + depth |
| advanced | `advanced/05G-approval-gates.md` | **93** | traceability + AC + depth |
| advanced | `advanced/05H-openclaw-gateway-adapter.md` | **93** | traceability + AC + depth |
| advanced | `advanced/05I-paperclip-api-lifecycle.md` | **83** | very short |
| advanced | `advanced/05J-paperclip-goals-sync.md` | **73** | very short; decision gate |
| advanced | `advanced/05K-paperclip-agent-audit-log-ordering.md` | **73** | very short; decision gate |
| advanced | `advanced/05L-paperclip-approval-gates-phase1.md` | **83** | very short |
| advanced | `advanced/05M-openclaw-gateway-health-stub.md` | **83** | very short |
| advanced | `advanced/05N-paperclip-ceo-human-escalation.md` | **83** | very short |
| advanced | `advanced/06A-hermes-ranking-edge.md` | **93** | traceability + AC + depth |
| advanced | `advanced/06B-hermes-score-breakdown-ui.md` | **93** | traceability + AC + depth |
| advanced | `advanced/06C-taste-profile-edge.md` | **93** | traceability + AC + depth |
| advanced | `advanced/06D-market-snapshot-edge.md` | **93** | traceability + AC + depth |
| advanced | `advanced/06E-hermes-intelligence.md` | **60** | epic index; E6 deps |
| advanced | `advanced/06F-hermes-ranking-eval-dataset.md` | **83** | very short |
| advanced | `advanced/06G-post-showing-similar-listings.md` | **83** | very short |
| advanced | `advanced/07A-p2-tables-lease-market-taste.md` | **95** | traceability + AC + depth |
| advanced | `advanced/07B-contract-analysis-edge.md` | **93** | traceability + AC + depth |
| advanced | `advanced/07C-lease-review-card.md` | **93** | traceability + AC + depth |
| advanced | `advanced/07D-lease-fixtures-validation.md` | **93** | traceability + AC + depth |
| advanced | `advanced/07E-contract-automation.md` | **60** | epic index; E7 deps |
| advanced | `advanced/08B-openclaw-whatsapp-adapter.md` | **93** | traceability + AC + depth |
| advanced | `advanced/08D-human-handover-escalation.md` | **93** | traceability + AC + depth |
| advanced | `advanced/08E-multi-channel.md` | **58** | epic index; E8 gating 08F/08K |
| advanced | `advanced/08F-whatsapp-ingress-architecture.md` | **73** | very short; decision gate |
| advanced | `advanced/08G-openclaw-correlation-observability.md` | **83** | very short |
| advanced | `advanced/08H-openclaw-wa-adapter-phase1.md` | **83** | very short |
| advanced | `advanced/08I-openclaw-mde-skills.md` | **83** | very short |
| advanced | `advanced/08K-openclaw-provider-strategy.md` | **73** | very short; decision gate |
| advanced | `advanced/12A-trio-integration-contract.md` | **83** | very short |
| advanced | `advanced/12B-trio-staging-operations-runbook.md` | **83** | very short |
| advanced | `advanced/12C-trio-ai-routing-feature-flags.md` | **83** | very short |
| advanced | `advanced/13D-landlord-journey-doc.md` | **83** | very short |
| production | `production/08J-lobster-workflows-spike.md` | **83** | very short |
| reference | `reference/11A-real-estate-search-stack.md` | **95** | traceability + AC + depth |
| reference | `reference/11B-real-estate-search-llm-prompts.md` | **100** | traceability + AC + depth |
| reference | `reference/DIAGRAMS-sync-merm07-hermes.md` | **72** | meta sync; keep aligned with MERM-07 |
| reference | `reference/VERIFY-supabase-postgres-edge.md` | **88** | checklist doc; diagram optional by design |
| **Σ** | **66 prompts — arithmetic mean** | **84.8** | individual rows above |

- **core/** average **85.2%** (20 files) · **advanced/** **84.2%** (41) · **production/** **83.0%** (1) · **reference/** **88.8%** (4)

---

## Executive summary

**Overall judgment:** The task prompt library is **strong as a navigation and execution aid** for the rental vertical: phased folders, epic naming, YAML subtasks in many files, and **[`PROMPT-VERIFICATION.md`](../prompts/PROMPT-VERIFICATION.md)** (including §6 product success) are **above average** for agent-led repos. It is **not** fully aligned with **`system.md`** (“tasks generated **only** from diagrams”), and the **INDEX** still has **count/label drift**. **ADVANCED** is large and **dependency-heavy** (E5/E8 design gates) — execution risk is high if treated as a flat backlog.

**Two “percent correct” measures:** (1) **Per-prompt mean ≈ 84.8%** — typical file is well-structured (see table above). (2) **Holistic library / process score ≈ 68/100** — INDEX inconsistency, `originals/` duplication, ADR gates, and backlog risk drag the **system** below the average **prompt** quality. See [§9 Scorecard](#9-percent-correct--scorecard).

---

## 1. Inventory (verified)

| Location | `.md` files | Notes |
|----------|-------------|--------|
| `tasks/prompts/core/` | **20** | Listed in INDEX “CORE” section |
| `tasks/prompts/advanced/` | **41** | |
| `tasks/prompts/production/` | **1** | |
| `tasks/prompts/reference/` | **4** | |
| **Epic prompts subtotal** | **66** | Matches INDEX “Total **66**” |
| `tasks/prompts/originals/` | **62** | Parallel copies — drift risk |
| Meta | `INDEX.md`, `PROMPT-VERIFICATION.md` | Not counted in 66 |

**Repo spot-check:** `supabase/config.toml` defines **10** edge function sections, all with `verify_jwt = true` (lines sampled 2026-04-06). Task/diagram text that still claims “JWT off everywhere” is **stale** unless qualified by date.

---

## 2. Strengths

1. **INDEX.md** — Phase → week → file table; **exit criteria** for CORE/ADVANCED; link to **PROMPT-VERIFICATION** and **§6** (goal/journey/proof/gates).
2. **PROMPT-VERIFICATION.md** — Actionable loop (structure, diagram traceability, dependencies, observable ACs, skills, repo reality); **§6 product success** closes the gap between “mergeable” and “shippable feature.”
3. **`tasks/mermaid/INDEX.md`** — Diagram registry (MERM-01 … MERM-10) with phase and traceability table — supports prompts that cite `diagram_id`.
4. **YAML subtasks** — Many prompts use fenced `yaml` blocks with `id`, `diagram_id`, `phase`, `dependencies` — good for `/process-task` and agents.
5. **Reference pack** — `reference/11A`, `11B`, `VERIFY-supabase-postgres-edge.md` centralize search stack and deploy checks; reduces duplicate epic noise.
6. **CORE breadth** — Data (01E), security (03E), pipeline (02E), CRM (10\*), frontend (04E), WA v1 (08\*), production readiness (09E) — covers the critical path **on paper**.

---

## 3. Errors & inconsistencies

| ID | Issue | Evidence / impact |
|----|--------|-------------------|
| **E1** | **CORE file count mismatch** in INDEX | Phase table (line 15) says `core/` has **19** files; “CORE (19 files)” heading (line 22); file counts table (line 162) says CORE **20**. Actual `find core -name '*.md'`: **20**. **Fix:** set **20** everywhere in the header/table. |
| **E2** | **09E listed under CORE in INDEX** but YAML/epic says **PRODUCTION** | [`core/09E-production-readiness.md`](../prompts/core/09E-production-readiness.md) header: `Phase:** PRODUCTION`, `epic: E9`. INDEX lists it under “Frontend & Planning (Weeks 5-6)” CORE. **Impact:** Wrong sequencing expectations (CORE exit vs prod-hardening work). |
| **E3** | **`system.md` vs practice** | `system.md`: “Tasks are generated **ONLY** from diagrams.” Many prompts exist without a single `diagram_id` or with **exceptions** not always labeled. **Impact:** Agents cannot rely on a single mechanical rule; requires `PROMPT-VERIFICATION` exception clause. |
| **E4** | **Testing & Ops row in INDEX** | Section says “**5 files**” but lists **4** rows (`02G`, `04B`, `04F`, `13D`). **Impact:** Trust erosion in INDEX arithmetic. |
| **E5** | **`originals/` vs phase folders** | INDEX: phase folder is source of truth; **62** files under `originals/`. **Impact:** Duplicate maintenance, silent drift. |
| **E6** | **MERM-09 vs live edge count** | `tasks/mermaid/INDEX.md` MERM-09: “**16** edge functions”. Live `config.toml`: **10** `[functions.*]` entries. **Impact:** Diagram/prompt assumptions about surface area may be wrong until updated. |
| **E7** | **Phase naming** | INDEX uses **P1 CORE / P2 ADVANCED / P3 PRODUCTION**; `system.md` uses **CORE / MVP / ADVANCED / PRODUCTION** without P1/P2. **Impact:** Onboarding confusion only if not documented once. |

---

## 4. Red flags (execution risk)

| Flag | Why it matters |
|------|----------------|
| **ADVANCED = 63% of prompts (41/66)** | Context rot for agents; many tasks assume trio/Hermes/OpenClaw **wiring** that audits describe as **aspirational**. |
| **E5 circular dependency (05K)** | Multiple E5 tasks assume `agent_audit_log` or ordering; **05K** is a **decision** task. Building without resolving **05K** yields throwaway work. |
| **E8v2 design gates (08F, 08K)** | OpenClaw/WhatsApp strategy not locked; **08B** cannot be “implemented” as a single slice without ADR closure. |
| **“(done)” in INDEX without proof** | **10A**, **10B** marked “(done)” with **no PR/commit/checklist link** in INDEX — violates PROMPT-VERIFICATION §5. |
| **CORE prompts without `diagram_id`** | In `core/`, files **missing** `diagram_id` grep: **`08L-wa-apartment-search.md`**, **`10E-crm-real-estate.md`**, **`14A-chatbot-cleanup.md`**. Breaks strict §2.B traceability unless each has an explicit **exception** note. |
| **08L epic vs folder** | [`08L`](../prompts/core/08L-wa-apartment-search.md) frontmatter: `epic: E8`, `phase: CORE` — cross-epic labeling; easy to mis-prioritize vs INDEX “WhatsApp v1.” |

---

## 5. Failure points & blockers

| Area | Failure mode | Mitigation |
|------|--------------|------------|
| **Dependencies** | Tasks reference `dependencies: [08A]` etc.; **no machine-readable DAG** in INDEX — impossible orders slip through. | Add a small **dependency matrix** (or Mermaid) for CORE-only first. |
| **Acceptance criteria** | PROMPT-VERIFICATION requires **observable** ACs; not all prompts were audited line-by-line — risk of **manual “works in browser”** only. | Per-prompt pass using §2.D + §6 (**Proof**). |
| **Security gates** | WA/Infobip/Stripe prompts **must** cite **03E** + seed/data reality before prod. | Blocker strip at top of INDEX (“**03E + seed** before prod WA / real money”). |
| **Schema drift** | Prompts name tables/columns; migrations move. | Link each data task to **current** `supabase/migrations/` or generated types in **Read first**. |
| **Duplicate `originals/`** | Edits land in wrong copy. | Delete `originals/` or one-way sync script; until then, **grep in CI** for divergence. |

---

## 6. Critical fixes (prioritized)

| Priority | Fix | Owner |
|----------|-----|--------|
| **P0** | Reconcile **INDEX** counts: **20** CORE in all rows; fix **Testing & Ops** file count (**4** or add missing fifth file). | Docs |
| **P0** | Resolve **09E** placement: either move to `production/` **or** relabel epic/phase consistently and fix INDEX section. | Docs + PM |
| **P1** | Add **`diagram_id`** or explicit **“Exception to system.md §tasks-from-diagrams”** to **08L**, **10E**, **14A**. | Prompt authors |
| **P1** | **Evidence links** for **10A/10B** “done” (PR, tag, or checklist) or remove “(done)”. | Eng |
| **P1** | **MERM-09** / prompts: align “**N edge functions**” with **deployed** inventory (`config.toml` + `supabase/functions/`). | Arch |
| **P2** | **05K** decision + propagate to **05D/05F/05G** ACs before large E5 implementation. | Tech lead |
| **P2** | **08F + 08K** ADR closure before funding **08B** build. | Tech lead |
| **P2** | **Remove or automate `originals/`** to stop dual maintenance. | Repo hygiene |

---

## 7. Suggested improvements

1. **Single backlog view** — Export INDEX to **Now / Next / Later** with **hard gates** (03E, seed, 05K, 08F/08K) so ADVANCED is not picked up as “next ticket” by accident.
2. **Prompt template** — For new files: mandatory **Goal**, **Proof**, **Blockers**, **diagram_id or Exception**.
3. **Lightweight CI** — `rg 'diagram_id' tasks/prompts/core` fail only if combined with allowlist file for exceptions; optional link check on `Read first` paths.
4. **Epic index files** — **05E**, **06E**, **07E**, **08E** should list **blocking** child tasks upfront (already partially there — keep as source of truth for agents).
5. **Quarterly prompt audit** — Re-run this checklist after major migrations or edge adds.

---

## 8. Best practices verification

| Practice | Status | Notes |
|----------|--------|--------|
| One canonical path per prompt (`core/` not `originals/`) | **PARTIAL** | Duplicates exist |
| Observable acceptance criteria | **STRONG** in reference + many CORE files; **UNEVEN** in ADVANCED |
| Diagram / MERM traceability | **STRONG** where `diagram_id` present; **GAPS** in 3 CORE files |
| Security/data gates on sensitive paths | **PARTIAL** | Relies on reader knowing 03E/seed; not in INDEX header |
| Product success (goal, proof, rollout) | **PROCESS READY** | PROMPT-VERIFICATION §6 — adoption per-file TBD |
| Index arithmetic & phase consistency | **FAIL** | 19 vs 20; 09E CORE vs PRODUCTION; Testing 5 vs 4 |
| Dependency clarity (no circular epic work) | **AT RISK** | E5/E8 known circularities |
| Honest “done” labeling | **PARTIAL** | Done without links |

---

## 9. Percent correct — scorecard

**Per-file mean (66 prompts):** **84.8%** — see the [per-prompt table](#per-prompt-score-summary-all-66-files) and HTML comment under **Method** for the rubric. Lowest individual scores: **`08L`** (57), **`10E`** (54), **`08E`** (58), epic indices **05E/06E/07E** (60), **`14A`** (61). Highest: **`reference/11B`** (100).

**Holistic library score (process + INDEX + dependencies, not averaged per file):**

| Category | Score | Rationale |
|----------|-------|-----------|
| **Structural organization** (folders, INDEX, counts) | **62/100** | Drift: 19/20, 5/4, 09E phase |
| **Traceability** (diagrams, MERM, YAML ids) | **72/100** | Strong where used; gaps + system.md tension |
| **Executability** (ACs, skills, Read first) | **74/100** | PROMPT-VERIFICATION + good CORE patterns |
| **Risk management** (deps, gates, ADVANCED realism) | **58/100** | E5/E8 blockers; trio assumptions |
| **Hygiene** (originals, done labels, doc/repo alignment) | **60/100** | Duplicates; stale MERM-09 count vs config |
| **Product outcome alignment** (§6 adoption) | **65/100** | Framework exists; not enforced file-by-file |

**Weighted overall (holistic):** **~68/100** — **usable and improvable**; not “wrong,” but **not safe** to treat INDEX + prompts as the only source of truth without **gates** and **dependency resolution** above. *Interpretation:* individual prompts score **~85%** on average; the **library as a system** scores **~68%** until INDEX and gates are fixed.

---

## 10. Verdict

**The `tasks/prompts` library is fit for purpose as an execution map** when paired with **[`PROMPT-VERIFICATION.md`](../prompts/PROMPT-VERIFICATION.md)**, **`tasks/mermaid/INDEX.md`**, and **current repo audits**. It will **misroute effort** if: (1) INDEX inconsistencies are trusted blindly, (2) ADVANCED is started before CORE exit + design closures, or (3) **`originals/`** diverges from **`core/`**.

**Recommended next step:** Apply **§6 Critical fixes P0–P1**, then schedule a **90-minute** pass to add **diagram_id or Exception** to the three CORE gaps and refresh **MERM-09** edge inventory.

---

*End of report — `tasks/audit/12-tasks-audit.md`*
