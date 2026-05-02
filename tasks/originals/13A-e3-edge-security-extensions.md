---
id: 13A
diagram_id: MERM-09
prd_section: "7. Technical Specs — Security"
title: E3-006–E3-008 — service role ban, admin RBAC, edge timeouts + JWT story
skills:
  - supabase/supabase-edge-functions
  - mdeai-tasks
epic: E3
phase: CORE
priority: P1
status: Open
owner: Backend
dependencies:
  - E3-001
estimated_effort: L
percent_complete: 0
outcome: O9
---

# E3 extensions: service role, RBAC, timeouts, JWT consistency

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) CORE table — **E3-006–008** and **JWT story doc** beyond baseline **03E** tasks.  
> **Epic index:** [`03E-security-hardening.md`](03E-security-hardening.md)

## Prompt

### E3-006 — No user-triggered service role

- Edge functions invoked **by end users** MUST NOT use the Supabase **service role** key for queries that should respect RLS.
- Inter-function calls: **signed** server-to-server (JWT exchange or internal secret) per `.claude/rules/edge-function-patterns.md`.

### E3-007 — Admin RBAC

- **Roles/claims** in JWT or `profiles` table; **server-side** enforcement on admin mutations — not only `useAdminAuth` in Vite.
- Align with moderation / **E4** admin routes when present.

### E3-008 — Timeouts

- **AI calls:** max **~30s**; **DB:** **~10s**; return **504** or structured timeout — prevent runaway Gemini bills and hung workers.

### JWT story doc

- One page: **`verify_jwt` in config** vs **manual JWT in function** — every function lists which pattern; **no** silent mix.

## Acceptance criteria

- [ ] **`03E-security-hardening.md`** gains subsections or linked doc for E3-006–008 with checkboxes.
- [ ] `tasks/docs/` or **`AGENTS.md`** has **JWT story** paragraph.
- [ ] Spot-check: no user-facing edge uses service role for tenant data.

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § Security & API (E3-006–008, JWT story)
