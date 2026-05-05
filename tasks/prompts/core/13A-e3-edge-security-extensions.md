---
id: 13A
diagram_id: MERM-09
prd_section: "7. Technical Specs — Security"
title: E3-006–E3-008 — service role ban, admin RBAC, edge timeouts + JWT story
description: "Ships «E3-006–E3-008 — service role ban, admin RBAC, edge timeouts + JWT story» for this epic—full scope in § Prompt below."
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

### Real world — purpose & outcomes

**In one sentence:** Admin-only tools (if any) require **role** checks and timeouts—so a normal user can’t escalate to “delete everything” by guessing routes.

- **Who it’s for:** Travelers (must stay safe); ops/admin; auditors.
- **Purpose:** Extend 03E: RBAC story, timeouts, documented JWT usage for privileged paths.
- **Goals:** Deny-by-default; explicit admin roles in DB; no hung requests forever.
- **Features / deliverables:** Policies or middleware pattern, `user_roles` (or agreed table), runbook snippet.

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) CORE table — **E3-006–008** and **JWT story doc** beyond baseline **03E** tasks.  
> **Epic index:** [`03E-security-hardening.md`](03E-security-hardening.md)

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
| **Goal** | Edge security extensions: RBAC, timeouts, JWT story for admin paths. |
| **Workflow** | Implement RBAC check → timeout wrapper → document. |
| **Proof** | Admin routes reject non-admin; 504 bounded. |
| **Gates** | `user_roles` or equivalent exists in migrations. |
| **Rollout** | Admin staging users first. |

---

## Prompt

### E3-006 — No user-triggered service role

- Edge functions invoked **by end users** MUST NOT use the Supabase **service role** key for queries that should respect RLS.
- Inter-function calls: **signed** server-to-server (JWT exchange or internal secret) per `.claude/rules/edge-function-patterns.md`.

### E3-007 — Admin RBAC

- Admin role stored in `user_roles` table (**verified 2026-04-05:** exists in `20260404044720_remote_schema.sql` with columns: `id`, `user_id`, `role` enum (`admin`, `super_admin`, `moderator`), plus RLS policies for super_admin CRUD and indexes on `user_id` and `role`)
- See existing hook: `src/hooks/useAdminAuth.ts` — queries `user_roles` table, checks expiration (frontend guard only)
- **Server-side enforcement (NOT YET IMPLEMENTED — verified 2026-04-05):** No edge function currently checks `user_roles`. Every admin edge function must check:
  ```typescript
  const { data: role } = await supabase.from('user_roles')
    .select('role').eq('user_id', userId).single();
  if (!role || !['admin', 'super_admin'].includes(role.role)) {
    return jsonResponse(errorBody('FORBIDDEN', 'Admin access required'), 403);
  }
  ```
- Admin routes in App.tsx (`/admin/*`) already use `useAdminAuth` — but backend must also enforce

### E3-008 — Timeouts

- **AI calls:** max **30s** (hard limit, not "~30s"); **DB:** **10s**; return **504** with structured error
- Implementation: `AbortController` with `setTimeout` on every `fetch()` to Gemini API
- Every edge function must have timeout — no exceptions

### JWT story doc

- One page: **`verify_jwt` in config** vs **manual JWT in function** — every function lists which pattern; **no** silent mix.

## Acceptance criteria

- [ ] **E3-006:** `grep -r "SUPABASE_SERVICE_ROLE_KEY" supabase/functions/` → only found in `p1-crm` (needs service role for admin ops) and `rules-engine` (cron). All others use anon key + user JWT. **Current violation (verified 2026-04-05):** `ai-chat` uses `SUPABASE_SERVICE_ROLE_KEY` for user-triggered requests — must be replaced with anon key + user JWT for RLS-respecting queries.
- [ ] **E3-007:** At least one admin edge function (e.g., apartment CRUD) checks `user_roles` table for admin role before proceeding. Return 403 if not admin.
- [ ] **E3-008:** Every AI edge function has `AbortController` with 30s timeout on Gemini fetch. Every DB query has 10s timeout via Supabase client config.
- [ ] **JWT story:** Create `tasks/docs/jwt-verification-matrix.md` with a table: function name | `verify_jwt` config value | manual auth check (yes/no) | rationale
- [ ] `npm run build` passes after changes

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § Security & API (E3-006–008, JWT story)
