---
id: 02H
diagram_id: MERM-03
prd_section: "6. Automations — Lead-to-lease pipeline"
title: E2 phasing — web-first MVP vs full MERM-03 (WhatsApp + OpenClaw)
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

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — **MERM-03** assumes **WhatsApp + OpenClaw** early; prompts ship **web + E2** first. Stakeholders may think **lead-capture** is “done” while **half** the PRD channel is missing.  
> **Epic index:** [`02E-lead-to-lease-pipeline.md`](02E-lead-to-lease-pipeline.md)

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
