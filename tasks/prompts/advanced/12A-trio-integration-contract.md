---
id: 12A
diagram_id: MERM-02
prd_section: "Cross-cutting — Paperclip · Hermes · OpenClaw · Supabase"
title: Trio integration contract — sequences, idempotency, correlation, rollback
skills:
  - mdeai-tasks
epic: cross-cutting
phase: Reference
priority: P1
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
outcome: O6
---

# Trio integration contract (Paperclip · Hermes · OpenClaw · Supabase)

> **Why:** [`tasks/audit/05-trio-agents.md`](../../audit/05-trio-agents.md) Appendix A #1 — **no single happy path** wired; need a **one-page contract** per flow.  
> **Related prompts:** [`08G-openclaw-correlation-observability.md`](08G-openclaw-correlation-observability.md) (#4), [`05I-paperclip-api-lifecycle.md`](05I-paperclip-api-lifecycle.md), [`11A-real-estate-search-stack.md`](11A-real-estate-search-stack.md).

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Trio integration contract defines OpenClaw ↔ Hermes ↔ Paperclip boundaries. |
| **Workflow** | Review contract → align code paths → sign-off. |
| **Proof** | Contract tests or checklist green. |
| **Gates** | Staging credentials only. |
| **Rollout** | Internal alignment gate. |

---

## Prompt

Create **`tasks/architecture/integration-contract.md`** (or `docs/architecture/integration-contract.md` if you prefer `docs/` — pick one and link from [`tasks/index.md`](../../index.md)).

For each **critical flow**, document in a **table or subsection**:

| Field | Description |
|-------|-------------|
| **Flow name** | e.g. inbound WA lead, Paperclip heartbeat → edge job, Hermes adapter run |
| **Owner system** | Which layer is SoT for state (Supabase vs Paperclip issue vs OpenClaw session) |
| **Entry trigger** | Webhook, cron, user action |
| **Idempotency key** | Header/body field name and where generated |
| **Correlation ID** | Propagation: Infobip/OpenClaw → edge → `ai_runs` → optional Paperclip comment (**08G**) |
| **Rollback / failure** | Who retries; **no 409 blind retry** (**05I**) |
| **Secrets path** | Edge only; no service role on client |

**Minimum flows (v1):** (1) Web user → Gemini edge → `ai_runs`, (2) WA → **08F** ingress → lead row (**E2**), (3) Paperclip checkout → Hermes/OpenClaw adapter → edge (if any).

**Diagrams:** Point to MERM-07 sync — **[`DIAGRAMS-sync-merm07-hermes.md`](DIAGRAMS-sync-merm07-hermes.md)** (Appendix A #2); **canonical ranking** = **edge `hermes-ranking`** (**06E**), Hermes CLI = explain/analysis only (**05-trio** § Integration Issues).

**Offline eval:** O3/O10 metrics — implement via **[`06F-hermes-ranking-eval-dataset.md`](06F-hermes-ranking-eval-dataset.md)** (Appendix A #3), not hand-wavy scores.

## Acceptance criteria

- [ ] `integration-contract.md` exists with at least **three** flows filled in.
- [ ] Document references **08G** for correlation and **05I** for Paperclip mutations.
- [ ] **Duplicate ranking risk** explicitly states: product scores from **06A** edge, not duplicated Hermes CLI math without tests.

## References

- [`tasks/audit/05-trio-agents.md`](../../audit/05-trio-agents.md) § Improvements (2), Appendix A #1–#3
