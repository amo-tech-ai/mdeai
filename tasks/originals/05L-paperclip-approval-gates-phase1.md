---
id: 05L
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Approval gates (phased)"
title: Approval gates — Phase 1 (notification + Paperclip approval API)
skills:
  - paperclip
  - mdeai-tasks
epic: E5
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies:
  - E5-001
  - E5-010
estimated_effort: M
percent_complete: 0
outcome: O8
---

# E5-011: Approval gates — Phase 1 (split from E5-006)

> **Why:** [`tasks/audit/03-paperclip..md`](../../audit/03-paperclip..md) — **05G** bundles **G1–G7** across DB, notifications, admin, AI — **too large** for one completion event. Ship a **vertical slice** first.  
> **Full scope remains:** [`05G-approval-gates.md`](05G-approval-gates.md) — complete after Phase 1 proves wiring.

## Prompt

**Phase 1 scope (choose minimal set that proves the loop):**

1. **Wire Paperclip Approvals API** (or equivalent) for **one** human-review path — e.g. **G5 only** (budget soft warning at 80%) **or** **G7 only** (stale lead alert) — **without** blocking payments or listing publish if those tables aren’t ready.
2. **Notifications:** Gate trigger creates a **notification** row (or email stub) per existing patterns.
3. **Logging:** Per **`05K`** decision — `agent_audit_log` **or** Paperclip activity **or** stderr structured log — **not** silent failure.
4. **Do not** implement all seven gates in this prompt; **close Phase 1** when one gate is **end-to-end** (trigger → visible queue → resolution).

**Phase 2+:** Iterate **G1, G2, G3** (mutations / money / publish) per product readiness; merge into **05G** checklist.

## Acceptance criteria

- [ ] One gate (G5 or G7 recommended) works end-to-end with **human-visible** outcome.
- [ ] Paperclip approval or notification pipeline is **invoked** from app or edge (not only diagrammed).
- [ ] **`05G`** updated: Phase 1 checked; remaining gates listed as follow-ups.
- [ ] No dependency on **full** `agent_audit_log` unless **05K** path A is done.

## Verification

Manual: trigger threshold → item appears in admin or Paperclip → mark resolved → no 409 loop (**05I**).

## References

- [`tasks/audit/03-paperclip..md`](../../audit/03-paperclip..md) § Improvements (2), § Advanced Features (Approvals workflow)
- [`05G-approval-gates.md`](05G-approval-gates.md)
- [`05K-paperclip-agent-audit-log-ordering.md`](05K-paperclip-agent-audit-log-ordering.md)
