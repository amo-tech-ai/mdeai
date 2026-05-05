# Epic 6: Hermes Intelligence — index

> **Diagrams:** MERM-07 (agent architecture), MERM-09 (edge functions)  
> **Phase:** MVP | **Outcomes:** O3, O10  
> **Hypothesis:** Composite ranking with 7 weighted factors improves search relevance (target: ≥70% top-1 accuracy, validated against a curated eval dataset — see [`06F-hermes-ranking-eval-dataset.md`](06F-hermes-ranking-eval-dataset.md)).

---

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | E6 subtasks build toward Hermes ranking quality with eval harness. |
| **Workflow** | Order per epic; 06F dataset before tuning 06A. |
| **Proof** | MERM-06 columns match migrations. |
| **Gates** | Gemini costs bounded; see 09E. |
| **Rollout** | Staged rollout of ranking. |

---

## Terminology — “Hermes” disambiguation

- **Nous Hermes Agent** = Python CLI (NousResearch). Configured in E5-003/E5-004 as `hermes_local` adapter.
- **Hermes Intelligence (this epic)** = composite ranking, taste profile, and market snapshot **Supabase Deno edge functions** — deterministic scoring; **not** the Nous CLI.
- MERM-07 shows both systems; MERM-09 shows edge functions (canonical for this epic).
- Sync **MERM-07** with [`DIAGRAMS-sync-merm07-hermes.md`](DIAGRAMS-sync-merm07-hermes.md) so diagrams don’t imply the CLI scores production listings.

---

## Privacy & data retention

Taste profile and market snapshot data fall under Colombian Habeas Data (Ley 1581 de 2012). See `tasks/best-practices/data-retention.md`. Taste profiles delete with the user account. Market snapshots are anonymized aggregates.

---

## Gemini integration (G1–G5)

Edge functions in this epic that call Gemini must follow:

- **G1:** `responseMimeType: "application/json"` + `responseSchema` for structured output  
- **G2:** Temperature 1.0 (Gemini default) for factual ranking; lower (0.3) only for deterministic scoring  
- **G3:** Prefer grounding + schema over prompt-only — ground market data against listing DB  
- **G4:** `x-goog-api-key` from `Deno.env.get("GEMINI_API_KEY")`  
- **G5:** Persist `groundingChunks` / `citationSources` in `ai_runs.metadata` when grounding is used  

---

## Subtasks (execution order)

| ID | File | Task | Status |
|----|------|------|--------|
| **06A** | [`06A-hermes-ranking-edge.md`](06A-hermes-ranking-edge.md) | E6-001 `hermes-ranking` edge | Open |
| **06B** | [`06B-hermes-score-breakdown-ui.md`](06B-hermes-score-breakdown-ui.md) | E6-002 HermesScoreBreakdown UI | Open |
| **06C** | [`06C-taste-profile-edge.md`](06C-taste-profile-edge.md) | E6-003 Taste profile | Open |
| **06D** | [`06D-market-snapshot-edge.md`](06D-market-snapshot-edge.md) | E6-004 Market snapshots | Open |
| **06F** | [`06F-hermes-ranking-eval-dataset.md`](06F-hermes-ranking-eval-dataset.md) | Eval JSON + accuracy run (parallel with 06A) | Open |
| **06G** | [`06G-post-showing-similar-listings.md`](06G-post-showing-similar-listings.md) | E6-006 post-showing similar listings / collections | Open |

**Suggested order:** **06A** (and **06F** eval fixtures) → **06B** → **06C** / **06D** (P2, can parallelize after schema deps) → **06G** (after showing feedback + search wiring).

---

## Verification

Before closing the epic: run [`VERIFY-supabase-postgres-edge.md`](VERIFY-supabase-postgres-edge.md) for new functions; confirm eval metrics meet or documented below hypothesis for **06F**.
