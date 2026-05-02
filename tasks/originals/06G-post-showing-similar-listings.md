---
id: 06G
diagram_id: MERM-01
prd_section: "5. AI agent architecture — Hermes / discovery"
title: E6-006 — Post-showing similar listings & collections
skills:
  - supabase/supabase-edge-functions
  - mdeai-tasks
epic: E6
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies:
  - E6-001
  - E2-002
estimated_effort: M
percent_complete: 0
outcome: O10
---

# E6-006: After showing — similar suggestions (ai-search / collections)

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — MERM-01 **“similar listings post-showing”** had no owning task; product feels flat after high-intent visit.  
> **Epic index:** [`06E-hermes-intelligence.md`](06E-hermes-intelligence.md)

## Prompt

1. **Trigger:** On `showings.renter_feedback` saved (or status → `completed`), invoke **`ai-search`** or **`ai-suggest-collections`** with context from the showing’s listing + neighborhoods.

2. **UX:** Return 3–6 cards (in-app notification or email stub); **no** auto-booking.

3. **Ranking:** Optional **`hermes-ranking`** if user prefs exist — canonical scores from **06A** edge only.

## Acceptance criteria

- [ ] Documented API or edge hook from showing completion → suggestion payload.
- [ ] **06E** index lists E6-006.
- [ ] **MERM-01** step mapped in `tasks/mermaid/01-user-journeys.mmd` comment or **12A** integration contract.

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § E6-006, § Similar listings gap
