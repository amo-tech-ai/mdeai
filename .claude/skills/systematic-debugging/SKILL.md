---
name: systematic-debugging
description: "Use BEFORE diagnosing any bug. Forces a hypothesis-then-evidence loop instead of trial-and-error. Trigger: any failing test, error in logs, unexpected behavior, or 'why is X happening' question. Source: skills.sh — adapted for mdeai.co with bug case studies from V1 D1-D5."
metadata:
  source: https://skills.sh/
  installed: 2026-04-29
  version: "0.1.0"
  origin: external + mdeai.co adaptations
---

# Systematic debugging — mdeai.co

Trial-and-error costs us hours per bug. This skill forces a 5-step loop that front-loads the schema/state inspection that almost always finds the answer in <10 minutes.

## When to invoke

- Any failing test (Vitest, Deno, Playwright)
- Any console error in the dev preview
- Any "why is X behaving wrong" investigation
- Any HTTP non-2xx from an edge function
- Any RLS policy violation
- Any auth failure ("Database error querying schema")

## The 5-step loop

### 1. Restate the bug as a falsifiable claim

Bad: "auth is broken"
Good: "POST /auth/v1/token with valid credentials for `qa-landlord@mdeai.co` returns HTTP 500 with body `{ "error": "Database error querying schema" }`"

The restatement forces you to write down the exact symptom. If you can't, you don't yet know what you're debugging.

### 2. Form a hypothesis BEFORE running anything

Write 1–3 candidate causes ranked by likelihood. Each must be testable with one query/command.

Example (D5 GoTrue auth bug):
- H1 (60%): Our hand-crafted auth.users row is missing fields GoTrue's signin path queries
- H2 (30%): Our auth.identities row's identity_data is missing `email_verified`
- H3 (10%): The encrypted_password column expects a different bcrypt format

### 3. Inspect schema/state, NOT code first

For each hypothesis, the cheapest test is a SQL query, not a code-grep. Run it.

Example (H1):
```sql
SELECT to_jsonb(qa.*) - 'encrypted_password' AS qa,
       to_jsonb(real.*) - 'encrypted_password' AS real
FROM auth.users qa, auth.users real
WHERE qa.email='qa-landlord@mdeai.co' AND real.email='ai@sunai.one';
```

Diff the two. If H1 is right, you'll see specific NULL fields on the QA row that are `''` on the real one. **This was the actual D5 bug** — `confirmation_token` / `recovery_token` / `email_change` / `email_change_token_new` were NULL when GoTrue expects empty strings.

### 4. ONE-line fix + verify with the original symptom test

Don't add error handling, refactor the surrounding code, or "while we're here" cleanup. Fix the exact field/line/value and re-run step 1's test.

```sql
UPDATE auth.users SET confirmation_token = '', recovery_token = '',
                       email_change = '', email_change_token_new = ''
WHERE email='qa-landlord@mdeai.co';
```

Re-run the symptom: `signInWithPassword(...)` → succeeds.

### 5. Backport the fix to the source

The bug existed because the migration omitted those defaults. Patch the migration so re-runs are correct on the first try:

```sql
-- In migration 20260501000000_landlord_v1_qa_user_seed.sql
INSERT INTO auth.users (
  ..., confirmation_token, recovery_token, email_change, email_change_token_new, ...
) VALUES (
  ..., '', '', '', '', ...
);
```

Otherwise the bug returns next time the migration runs locally.

## mdeai.co bug case studies (run through the loop on each)

| Bug | Where | What restating it would have surfaced |
|---|---|---|
| **D3 Rules-of-Hooks crash** | `pages/host/Onboarding.tsx` | "useRef called at line N is conditional on render path; React detects hook order change between renders" — would've sent us to the React docs hook-order rule, not to console-log debugging |
| **D4 missing FK indexes** | `landlord_inbox_events.actor_user_id` + `verification_requests.reviewed_by` | The `information_schema.table_constraints` JOIN against `pg_indexes` is the canonical FK-index check. Running it once during D1 would've caught it. |
| **D4 `clearDraft` re-overwrites sessionStorage** | `useListingDraft.ts` | "After clearDraft sets state to EMPTY_DRAFT, the persist useEffect runs again with EMPTY_DRAFT as a NEW dep value, re-writing the storage key" — pure data-flow inspection, no debugger needed |
| **D5 GoTrue NULL vs empty-string** | `20260501000000_landlord_v1_qa_user_seed.sql` | The diff-against-real-user query above. |

## Anti-patterns

- "Let me add a console.log to see what happens" — usually wastes 30 minutes. Inspect the schema/state directly.
- "Let me restart the server" — masks state-shape bugs. Won't fix migrations or RLS or hook order.
- "Let me try a different approach" — abandoning step 2's hypothesis without testing it. The hypothesis was probably right; you just haven't done step 3 yet.

## Companion skills

- `supabase` — for SQL inspection patterns
- `vitest-component-testing` — for Vitest debug patterns (`screen.debug()`, `getByRole` over `getByTestId`)
- `claude-preview-browser-testing` — for browser-state inspection via `preview_eval`
- `verification-before-completion` (skills.sh) — pairs with this for the "did I actually fix it" gate
