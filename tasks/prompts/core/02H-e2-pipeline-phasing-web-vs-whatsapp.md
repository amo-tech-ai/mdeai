---
id: 02H
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: E2 phasing — web-first MVP vs full MERM-03 (WhatsApp + OpenClaw)
description: "Ships «E2 phasing — web-first MVP vs full MERM-03 (WhatsApp + OpenClaw)» for this epic—full scope in § Prompt below."
skills:
  - mdeai-tasks
epic: E2
phase: CORE
priority: P0
status: Open
owner: Product
dependencies: []
estimated_effort: S
percent_complete: 0
outcome: O2
---

# E2 pipeline phasing — explicit channel scope

### Real world — purpose & outcomes

**In one sentence:** The team agrees whether anonymous WhatsApp leads or web-only JWT flows ship first—so engineers don’t build two conflicting “sources of truth” for the same pipeline.

- **Who it’s for:** Product, backend, and anyone implementing 02E + 08C.
- **Purpose:** Document phasing: web-first vs WA-first, and how anonymous leads align with security (03E).
- **Goals:** Single narrative merged into 02E over time; no contradictory ACs between epics.
- **Features / deliverables:** Short ADR-style clarity; pointers, not duplicate implementation specs.

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — **MERM-03** assumes **WhatsApp + OpenClaw** early; prompts ship **web + E2** first. Stakeholders may think **lead-capture** is “done” while **half** the PRD channel is missing.  
> **Epic index:** [`02E-lead-to-lease-pipeline.md`](02E-lead-to-lease-pipeline.md)

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Web vs WA phasing is explicit so engineers don’t build contradictory auth paths. |
| **Workflow** | Treat as merge-into-02E: align anonymous WA vs JWT web in one pipeline doc. |
| **Proof** | Single source of truth in 02E; this file deprecated or reduced to a pointer. |
| **Gates** | Resolve conflict with 08C/E2-001 before implementing WA capture. |
| **Rollout** | Doc-only change; no prod rollout until 02E updated. |

---

## Prompt

1. **Add a “Phasing” subsection** at the top of **`02E-lead-to-lease-pipeline.md`** (after the epic header block):

   - **Phase 1 (MVP):** Web intake → `lead-capture` → DB notifications; **no** production host WA until **E8-003** + **08F** ADR complete.
   - **Phase 2:** WhatsApp lead source + OpenClaw outbound per **08E** / **08B**.

2. **E2-001 AC amendment:** In **`02E`** E2-001 acceptance criteria, add explicit bullet: **“Web leads = MVP scope; WhatsApp-sourced leads in prod = complete when E8-003 and lead-capture WA path are verified.”**

3. **PRD / roadmap:** One sentence cross-link so **RICE** order does not imply omnichannel before **E8**.

## Acceptance criteria

- [ ] **`02E-lead-to-lease-pipeline.md`** contains **Phase 1 / Phase 2** paragraph.
- [ ] **E2-001** section lists web vs WA scope as above.
- [ ] **[`tasks/roadmap.md`](../../roadmap.md)** or PRD notes **web-first** if not already.

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § E2-001 AC, § Process tweaks (02E phased header), § Verdict (diagrams vs prompts)
