# Verification prompt — Supabase Postgres + Edge Functions (best practices)

> **Skills:** `.claude/skills/supabase-postgres-best-practices` · `.claude/skills/supabase-edge-functions`  
> **Use when:** Reviewing migrations, RLS, queries, or any `supabase/functions/*/index.ts` before merge or deploy.

---

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Deploy/RLS/edge checklist catches issues before merge. |
| **Workflow** | Reviewer walks § Postgres + § Edge for each PR. |
| **Proof** | Pass/Fail recorded with file refs. |
| **Gates** | Use for migrations + edge PRs. |
| **Rollout** | Process gate. |

---

## How to use

1. Paste this document (or the relevant section) into the agent doing the review.
2. For **schema/migrations**, work through **§ Postgres**.
3. For **Edge Functions**, work through **§ Edge**.
4. Record **Pass / Fail / N/A** with file references.

---

## § Postgres (`supabase-postgres-best-practices`)

| Priority | Rule area | Verify |
|----------|-----------|--------|
| **security** | RLS enabled | `ALTER TABLE … ENABLE ROW LEVEL SECURITY` on user-facing tables. |
| **security** | `auth.uid()` in policies | Prefer `(select auth.uid())` subquery pattern (stable, cache-friendly). |
| **security** | Least privilege | Policies scoped to owner/host/admin; `service_role` only where intended. |
| **schema** | FK indexes | Index columns used in FKs and common filters (`user_id`, `status`, `created_at`). |
| **schema** | Composite indexes | Match query patterns (e.g. `(status, created_at DESC)` for queues). |
| **query** | Hot paths | No sequential scans on large tables in prod-sized data; use `EXPLAIN` for new heavy queries. |
| **data** | Pagination | List endpoints use `limit` + ordered cursor/range, not unbounded `SELECT *`. |
| **conn** | Pooling | Clients use Supabase pooler URL where appropriate for serverless bursts. |
| **monitor** | Advisors | Run `supabase db advisors --linked --level info` after material schema changes. |

### Anti-patterns to flag

- RLS **disabled** on tables with PII or financial data.
- Direct `auth.uid()` repeated in complex policies without subquery (Supabase doc pattern).
- Missing index on FK child columns (`lead_id`, `apartment_id`, etc.).
- `GRANT ALL TO anon` on sensitive tables without RLS (treat as red flag — confirm intent).

---

## § Edge Functions (`supabase-edge-functions` + project rules)

| Topic | Verify |
|-------|--------|
| **HTTP** | `OPTIONS` preflight returns CORS headers; `POST`/`GET` methods explicit. |
| **Auth** | `verify_jwt` in `config.toml` matches actual validation (Bearer JWT checked in handler if `false`). |
| **Secrets** | No `service_role` or provider keys logged or returned to clients. |
| **Validation** | Request body validated (e.g. Zod); reject unknown fields where security matters. |
| **Errors** | Structured shape: `{ success: false, error: { code, message, details? } }`. |
| **Rate limits** | Sensitive/public endpoints have per-user or per-IP limits (document tradeoffs for in-memory). |
| **AI** | Gemini calls logged to `ai_runs` where applicable; timeouts on upstream HTTP. |
| **CORS** | `Access-Control-Allow-Origin` not `*` in production (align with `03E`). |
| **Tests** | `npm run verify:edge` passes (`deno check` + shared unit tests). |

### p1-crm–specific (JWT + service role)

- User identity from **Authorization: Bearer** (not body).
- Service role used **only** server-side for inserts after authz checks (lead ownership, booking ownership).

---

## § Cross-cutting (both layers)

| Check | Question |
|-------|----------|
| **Idempotency** | Duplicate submits (lead, payment) safe or documented as not yet? |
| **Types** | `supabase gen types` run after migration changes; frontend uses generated types. |
| **Docs** | `tasks/notes/01-supa.md` CLI checklist updated if deploy/config changes. |

---

## Output template (reviewer fills)

```markdown
## Review: [branch / PR / date]

### Postgres
- [ ] RLS / policies — files: …
- [ ] Indexes — …

### Edge
- [ ] Auth / Zod / errors — functions: …

### Verdict: APPROVE | CHANGES REQUIRED
Notes: …
```
