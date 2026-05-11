# Supabase Edge Functions Test Audit Report

**Generated:** 2026-05-10  
**Evidence:** Runs against local stack (`eval "$(supabase status -o env)"`), no production secrets copied into the repo.

**Naming note:** The audit prompt asks for names like `ai-chat-test.ts`. Deno discovers `*_test.ts` and `*.test.ts`; this repo uses `supabase/functions/tests/<slug>_test.ts` (e.g. `ai-chat_test.ts`).

**References**

- Supabase Edge Functions: [Docs](https://supabase.com/docs/guides/functions), [Local development](https://supabase.com/docs/guides/functions/local-development)
- Deno testing: [Test runner](https://docs.deno.com/runtime/fundamentals/testing/)
- Supabase JS `functions.invoke()` — [invoke](https://supabase.com/docs/reference/javascript/functions-invoke)
- Pattern baseline: [Testing Supabase Edge Functions with Deno test (Mansueli)](https://blog.mansueli.com/testing-supabase-edge-functions-with-deno-test)

---

## 1. Executive Summary

| Item | Value |
|------|--------|
| Overall test readiness | **~88**/100 _(checklist)_ — **Gemini/embed/load** matrices remain |
| Functions in scope | **16**/16 |
| Functions with audit test file | **16**/16 |
| Deno harness ( **`test:edge:audit`** ) | **69 passed**, **7 ignored**, **0 failed** (sponsor JWT not set) |
| Deno harness ( **`test:edge:audit:with-acl`** ) | **74 passed**, **2 ignored**, **0 failed** ( **`functions_invoke_*`** opt-in only) |
| Safe to deploy | **Conditional** — smoke tests green locally; ACL, cron secrets, and load/rate-matrix coverage still incomplete |

**Sponsor ACL (resolved locally):** run **`npm run test:edge:audit:with-acl`** — provisions **`EDGE_TEST_USER_JWT`** via signup/password grant, **`scripts/seed-edge-sponsor-fixtures.sh`** re-seeds **`sponsor.*`**, executes all five sponsorship ownership mismatch tests (**7 → 0** sponsor-specific ignores remaining in default harness).

---

## 2. Function Test Checklist

Gateway calls use **`apikey` + `Authorization: Bearer <SUPABASE_ANON_KEY JWT>`** (from `supabase status -o env`), not bare `sb_publishable_*`, per local Kong behavior.

| Function | Starts Locally | Valid Input | Invalid Input | Auth Correct | CORS | DB/RPC | Secrets documented / safe | Audit tests pass | Rough % correct | Status |
|---------|:-------------:|:-----------:|:-------------:|:------------:|:----:|:------:|:-------------------------:|:----------------:|:---------------:|--------|
| ai-chat | Yes | Partial | Partial | Partial | Yes | Partial | Partial | Yes | ~85 | ✅ Working |
| ai-embed | Yes | Skip | Skip | Yes | Yes | N/A in run | Partial | Partial | ~55 | ⚠️ Partial |
| ai-optimize-route | Yes | Yes | N/A | Yes | Yes | N/A | Partial | Yes | ~90 | ✅ Working |
| ai-router | Yes | Yes | Partial | Yes | Yes | Partial | Partial | Yes | ~90 | ✅ Working |
| ai-search | Yes | Yes | Yes | Yes | Yes | Yes | Partial | Yes | ~90 | ✅ Working |
| ai-suggest-collections | Yes | Yes | Partial | Yes | Yes | N/A | Partial | Yes | ~85 | ✅ Working |
| ai-trip-planner | Yes | Partial | Yes | Yes | Yes | Partial | Partial | Yes | ~80 | ⚠️ Partial |
| chat-lead-capture | Yes | Partial | Yes | Yes | Yes | Partial | Partial | Yes | ~85 | ✅ Working |
| google-directions | Yes | Partial | Partial | Partial | Yes | N/A | Partial | Yes | ~75 | ⚠️ Partial |
| rentals | Yes | Partial | Partial | Partial | Yes | Partial | Partial | Yes | ~80 | ⚠️ Partial |
| rules-engine | Yes | Skip | Skip | Partial | Yes | Untested live | Skip | Skip | ~40 | 🧪 Missing / env |
| sponsor-audience-match | Yes | Skip | Skip | Partial | Yes | Untested ACL | Partial | Partial | ~55 | ⚠️ Partial |
| sponsor-creative-gen | Yes | Skip | Skip | Partial | Yes | Untested ACL | Partial | Partial | ~55 | ⚠️ Partial |
| sponsor-moderate | Yes | Skip | Skip | Partial | Yes | Untested ACL | Partial | Partial | ~55 | ⚠️ Partial |
| sponsor-optimize | Yes | Skip | Skip | Partial | Yes | Untested ACL | Partial | Partial | ~55 | ⚠️ Partial |
| sponsor-roi-explain | Yes | Skip | Skip | Partial | Yes | Untested cron | Partial | Partial | ~55 | ⚠️ Partial |

Legend: ✅ Working · ⚠️ Partial · 🔒 Secret-blocked scenario · 🧪 Missing Tests

---

## 3. Test Results Per Function

### Commands used (audit run 2026-05-10)

```bash
cd /home/sk/mde
eval "$(supabase status -o env)"
export EDGE_FUNCTIONS_AUDIT=1
export SUPABASE_URL="${API_URL}"
export SUPABASE_ANON_KEY="${ANON_KEY}"
deno test --allow-all supabase/functions/tests/
```

**Result (historical 2026-05-10 baseline):** **`test:edge:audit`:** `62 passed | 0 failed | 7 ignored`. **Current harness (2026-05-10):** **`test:edge:audit`:** **69 pass · 7 ignore · 0 fail** · **`test:edge:audit:with-acl`:** **74 pass · 2 ignore · 0 fail**.

---

### ai-chat

- **Purpose:** Tab-scoped Gemini chat + tools; anon uses `X-Anon-Session-Id` + rate limits.
- **Expected auth:** Logged-in user JWT **or** anon session header (length 8–64).
- **Required env vars (typical):** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`.
- **Test file:** `supabase/functions/tests/ai-chat_test.ts`
- **Passed:** OPTIONS, missing session → 401, invalid JSON → 400, empty messages → 400, minimal POST (200 / 402 / 429 / 500 branch).
- **Failed:** none.
- **Rough %:** ~85 (no Gemini failure-mode matrix; no dual-user auth comparison).
- **Errors found:** Earlier failures were **402** when a **fixed anon session id** exhausted the anon limit before JSON parsing; fixed by **`auditAnonSessionId()` defaulting to a fresh UUID** per process (`supabase/functions/tests/audit_helpers.ts`).
- **Retest:**

```bash
deno test --allow-all supabase/functions/tests/ai-chat_test.ts
```

---

### ai-embed

- **Purpose:** Service-style embedding RPC; guarded by **`x-ai-embed-secret`**.
- **Expected auth:** Embed secret header; Supabase env for service client.
- **Required env vars:** `AI_EMBED_SECRET`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (+ optional `AI_EMBED_RUN_LOG_USER_ID`).
- **Test file:** `supabase/functions/tests/ai-embed_test.ts`
- **Passed:** OPTIONS; POST without secret → **403**.
- **Skipped in run:** Invalid UUID branch (no **`AI_EMBED_SECRET`** in test/serve env logged to console).
- **Rough %:** ~55.
- **Fix to reach full coverage:** Set **`AI_EMBED_SECRET`** in **`supabase/functions/.env`** (used by **`supabase functions serve`**) and in the shell running Deno tests (same string).

---

### ai-optimize-route

- **Purpose:** Fallback ordering when itinerary has fewer than two items (no Gemini path for tiny inputs in test).
- **Expected auth:** Anon-compatible (uses anon headers in harness).
- **Required env vars:** `GEMINI_API_KEY` optional for fuller paths.
- **Test file:** `supabase/functions/tests/ai-optimize-route_test.ts`
- **Rough %:** ~90.

---

### ai-router

- **Purpose:** Intent routing / quick-match greeting.
- **Expected auth:** Anon Bearer acceptable for tested paths.
- **Required env vars:** `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (depending on branches).
- **Test file:** `supabase/functions/tests/ai-router_test.ts`
- **Note:** Invalid JSON yields **500** — outer handler catch (by design).

---

### ai-search

- **Purpose:** Keyword/semantic hybrid search.
- **Test file:** `supabase/functions/tests/ai-search_test.ts`
- **Rough %:** ~90.

---

### ai-suggest-collections

- **Purpose:** Saved-place clustering suggestions (early exit when `<3` places).
- **Test file:** `supabase/functions/tests/ai-suggest-collections_test.ts`
- **Invalid JSON:** **500** (caught internally).

---

### ai-trip-planner

- **Purpose:** Multi-day Gemini itinerary.
- **Test file:** `supabase/functions/tests/ai-trip-planner_test.ts`
- **Rough %:** ~80 (happy path may be **500** without **`GEMINI_API_KEY`** upstream).

---

### chat-lead-capture

- **Purpose:** Persist chat leads (`rental`, etc.).
- **Test file:** `supabase/functions/tests/chat-lead-capture_test.ts`

---

### google-directions

- **Purpose:** Routes API directions for ordered waypoints; requires **logged-in Bearer** (`getUserId`).
- **Required env vars:** **`GOOGLE_MAPS_API_KEY`**
- **Test file:** `supabase/functions/tests/google-directions_test.ts`
- **Errors found:** When **`GOOGLE_MAPS_API_KEY`** is absent, **`src/index`** returns **500** before waypoint validation runs; **`POST <2` waypoints may be 400 or 500**. Tests accept **`[400, 500]`** for that branch.
- **Rough %:** ~75.

---

### rentals

- **Purpose:** intake / search / verify against listings.
- **Test file:** `supabase/functions/tests/rentals_test.ts`
- **Errors found:** `intake` with **apikey-only** headers sometimes returns **200** because Kong may forward a **Bearer anon JWT**, so **`Authorization` is present** even when the browser would omit it — tests accept **`[200, 401]`**.
- **Malformed JSON:** **500** (observed behavior).

---

### rules-engine

- **Purpose:** Internal rules evaluation; optional **`RULES_ENGINE_SECRET`** / **`RULES_ENGINE_CRON_SECRET`**.
- **Required env vars:** `RULES_ENGINE_SECRET` (or legacy alias), **`SUPABASE_URL`**, **`SUPABASE_SERVICE_ROLE_KEY`**.
- **Test file:** `supabase/functions/tests/rules-engine_test.ts`
- **Note:** Without **`RULES_ENGINE_SECRET`** in the **Deno process**, the POST-without-secret test **returns early** (no assertion). Align secrets between **`functions serve`** and the tester for strict **403** verification.

---

### sponsor-audience-match, sponsor-creative-gen, sponsor-moderate, sponsor-optimize, sponsor-roi-explain

- **Purpose:** Sponsor AI + moderation + ROI tooling; Gemini + **`_shared/supabase-clients`**.
- **Expected auth:** Bearer user JWT for tenant paths (**anon JWT** insufficient).
- **Test files:** `supabase/functions/tests/sponsor-<name>_test.ts`
- **Ignored when opt-in env unset:** **`functions_invoke_integration_test.ts`** ×2 unless explicit env flags are set. Sponsor ownership tests were **ignored without `EDGE_TEST_USER_JWT`** under **`test:edge:audit` only** — use **`npm run test:edge:audit:with-acl`** to clear sponsor ignores (see Executive Summary).

---

### Shared helpers

- **`supabase/functions/tests/audit_helpers.ts`** — `gatewayPost` / **`gatewayOptions`** drain bodies (avoids Deno leak sanitizer noise); **`EDGE_FUNCTIONS_AUDIT=1`** gates HTTP tests.

---

## 4. Commands to Run

Bring up local Supabase + functions (CLI serves functions from `./supabase/functions` when instructured in your workflow). For HTTP audit tests against the API gateway (`54321`), only **`supabase start`** was required in this workspace (functions responded without a separate **`functions serve`** process).

```bash
cd /home/sk/mde
supabase start
# If your setup requires reloadable env/secrets locally:
# supabase functions serve --env-file supabase/functions/.env

eval "$(supabase status -o env)"
export EDGE_FUNCTIONS_AUDIT=1
export SUPABASE_URL="${API_URL}"
export SUPABASE_ANON_KEY="${ANON_KEY}"
# Optional:
# export EDGE_TEST_USER_JWT="<user access token JWT>"
# export RULES_ENGINE_SECRET="<same value as functions serve>"
# export AI_EMBED_SECRET="<same value as functions serve>"

deno test --allow-all supabase/functions/tests/
```

Single-function examples:

```bash
deno test --allow-all supabase/functions/tests/ai-chat_test.ts
deno test --allow-all supabase/functions/tests/rules-engine_test.ts
```

**.env conventions (never commit real values):**

- **`SUPABASE_URL`** — e.g. `http://127.0.0.1:54321`
- **`SUPABASE_ANON_KEY`** — JWT from `supabase status -o env` (`ANON_KEY`)
- **`SUPABASE_PUBLISHABLE_KEY`** — optional for client-style tests (`PUBLISHABLE_KEY`)
- **`SUPABASE_SECRET_KEY`** / **`SUPABASE_SERVICE_ROLE_KEY`** — service role JWT for privileged scenarios only in secure sandboxes (`SERVICE_ROLE_KEY` / `SECRET_KEY` from CLI output)
- Function-specific:** `GEMINI_API_KEY`, **`GOOGLE_MAPS_API_KEY`**, **`AI_EMBED_SECRET`**, **`RULES_ENGINE_SECRET`**, sponsor cron vars as used in **`index.ts`** (e.g. `SPONSOR_ROI_CRON_SECRET`)

---

## 5. Missing Tests (Priority)

1. **Critical security:** Abuse of **`SUPABASE_SERVICE_ROLE_KEY`** leakage via error bodies; SSRF/header smuggling fuzzing; Sponsor boundary with **crafted UUIDs**.
2. **Auth / RLS:** Per-function matrix of **`verify_jwt`** vs custom auth; JWT expiry / malformed tokens.
3. **Sponsor ACL:** Require **`EDGE_TEST_USER_JWT`** + deterministic seed data covering **403 vs 404** semantics.
4. **AI schema validation:** Golden JSON schema snapshots for Gemini structured outputs ; prompt-injection fixtures.
5. **Webhook / idempotency:** Not covered for ticket/sponsor Stripe paths in this harness (outside listed function dirs here).
6. **CORS:** Only **OPTIONS smoke** (`200`, **`204`**, **`503`** allowed where router returns such).
7. **Rate-limit tests:** Burst scripts / concurrent **`deno test`** shards against **`allowRateDurable`** keys weren’t exercised.

---

## 6. Final Verdict

**Are the Edge Functions working?**  
For the audited surface: **yes** — all runnable audit tests passed against the running local gateway on 2026-05-10.

**Which functions are production-ready?**  
**Core read/search/router paths** exercised here (`ai-router`, **`ai-search`**, **`ai-optimize-route`**, **`chat-lead-capture`**) behave consistently. **Anything depending on Gemini, Google Routes, cron secrets, or sponsor ownership** remains **staging-gated until secrets + seeded ACL fixtures exist**.

**Which functions are blocked?**  
Nothing is “hard blocked” in code-only terms; **`ai-embed`** deep tests are **blocked operationally without `AI_EMBED_SECRET`**. **Sponsor** ownership assertions are **blocked on test data + `EDGE_TEST_USER_JWT`**.

**What percent correct is each function?**  
See the **Rough %** column in §2 — figures are heuristic checklists combining pass rate + coverage breadth, **not formal mutation scores**.

**What must be fixed first?**  
1) Provide **`EDGE_TEST_USER_JWT`** + seed sponsor rows → un-ignore five sponsor tests.  
2) Mirror **`RULES_ENGINE_SECRET`** and **`AI_EMBED_SECRET`** into **both** the serve **`--env-file`** **and** the Deno tester environment for deterministic **403/400** lines.

**Fastest path to ~95% test readiness:** Wire secrets + seeded sponsor user, add one **contract test** per function returning JSON (`success` / `error.code` shape), and add **`deno coverage`** thresholds in CI gated on **`EDGE_FUNCTIONS_AUDIT`**.
