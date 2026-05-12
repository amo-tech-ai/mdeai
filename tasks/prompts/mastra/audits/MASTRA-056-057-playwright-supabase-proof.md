# MASTRA-056/057 Playwright + Supabase Proof Report

**Run date:** 2026-05-12 (host local)  
**Repo:** `/home/sk/mde`  
**Verifier:** automated shell + Playwright smoke + `supabase db reset` + local SQL

**Update (post–`supabase login` / `supabase link`):** CLI auth fixed; **`supabase db push --dry-run`** completes but reports **remote migration versions missing locally** (parity blocker). Detail: `tasks/prompts/mastra/audits/MASTRA-057-remote-migration-parity-blocker.md`.

## Verdict

**PARTIAL**

Technical checks for MASTRA-056 (frontend + tests + `/chat` smoke) and MASTRA-057 (local migration + RLS + atomic increment) **PASS**. The branch/worktree is **not PR-ready as-is**: enormous unrelated dirty/untracked files, and **remote** verification is incomplete (`supabase db push --dry-run` failed on pooler auth; `migration list` already showed local/remote drift including **`20260513103000` absent on Remote**).

---

## Scope proof

| Check | Status | Evidence |
| ----- | ------ | -------- |
| Git diff limited to 056/057/checklists only | **FAIL** | `git status --short` shows **many** modified/untracked paths (`.claude/**`, `tasks/**`, `my-mastra-app/**`, `src/components/chat/**`, seeds, etc.). Tracked diffs for `MapContext*` match MASTRA-056; `supabase/migrations/20260513103000_grounding_quota_log.sql` is **untracked** (`??`). |
| No unintended MCP/feature creep in grep scope | **PASS** | `searchGroundedPlacesTool` / `maps-mcp-client` not found under `src` / `my-mastra-app`; `grounding_quota_log` only under `supabase/migrations` (+ SQL comments). |

---

## MASTRA-056 proof

| Check | Status | Evidence |
| ----- | ------ | -------- |
| `grounded` type exists | **PASS** | `rg` on `src/context/MapContext.tsx`: `MapPinCategory` includes `'grounded'`. |
| `grounded` config exists | **PASS** | `PIN_CATEGORY_CONFIG.grounded` emoji/color `#6B7280`, label `Place`. |
| Exhaustive config consumers | **PASS** | `PIN_CATEGORY_CONFIG[pin.category]` in `ChatMap.tsx`, `MdeMap.tsx`, `pinContent.ts`. |
| `npm run lint` (errors) | **PASS** | **0 errors**, **102 warnings** (repo-wide; includes `.claude/worktrees/...` and many pre-existing rules). |
| `npm run build` | **PASS** | `vite build` OK (~6.6s). |
| `MapContext.test.ts` | **PASS** | Vitest: **6** tests passed. |
| Full Vitest suite | **PASS** | **9** files, **76** tests passed (stderr lines from intentional telemetry/map tests only). |

---

## Browser proof

| Check | Status | Evidence |
| ----- | ------ | -------- |
| `/chat` HTTP | **PASS** | `curl`: **HTTP 200** `http://127.0.0.1:8080/chat`. |
| `/chat` loads (Playwright) | **PASS** | `npx playwright test tests/smoke/mastra-056-057-localhost.spec.ts --config playwright.smoke.config.ts` → **1 passed**; expects “Pins appear here…” + **zero** `pageerror`. |
| Console clean | **PASS** | Smoke test asserts no uncaught `pageerror`; no runtime assertions added beyond spec. |
| Map shell renders | **PASS** | Same spec + screenshot artifact below. |
| Grounded runtime injection | **SKIPPED** | Runtime injection not performed; **compile-time** `Record<MapPinCategory, …>` + unit tests + smoke are proof. |

**Artifacts**

- Screenshot: `tasks/prompts/mastra/audits/screenshots/mastra-056-chat-1280x720.png`
- URL: `http://127.0.0.1:8080/chat`
- Viewport: **1280×720** (Playwright `screenshot` CLI)

---

## MASTRA-057 proof

| Check | Status | Evidence |
| ----- | ------ | -------- |
| Migration file present | **PASS** | `supabase/migrations/20260513103000_grounding_quota_log.sql` (table + RLS + `service_role_write`). |
| `supabase db reset` | **PASS** | Exit **0**; log includes `Applying migration ...20260513103000_grounding_quota_log.sql...`; ends `Finished supabase db reset`. |
| Atomic increment → 1, 2, 3 | **PASS** | Three× `supabase db query --local --agent=no -o table` with `INSERT ... ON CONFLICT ... RETURNING count` → **1**, **2**, **3**. |
| Anon read blocked (no visible rows) | **PASS** | `SET ROLE anon; SELECT count(*) FROM public.grounding_quota_log;` → **0**. |
| Anon insert blocked | **PASS** | `ERROR: new row violates row-level security policy for table "grounding_quota_log"`. |

---

## Remote safety

| Check | Status | Evidence |
| ----- | ------ | -------- |
| `supabase migration list` inspected | **PASS** | CLI connected; table printed. **`20260513103000` local-only**; many rows **remote-only** vs this checkout. |
| `supabase db push --dry-run` | **FAIL (parity)** | After **`supabase login`**: dry-run runs, exits with **“Remote migration versions not found in local migrations directory”** + long version list; suggests **`db pull`** / **`migration repair`** — **do not run repair** without audit (see `MASTRA-057-remote-migration-parity-blocker.md`). Earlier SASL failure is superseded. |
| No remote mutation | **PASS** | Only `migration list` + **`db push --dry-run`**; **no** real **`db push`**, **no** **`migration repair`**. |

---

## Commands run (exact)

```bash
cd /home/sk/mde
git status --short
git diff --stat
git diff -- src/context/MapContext.tsx src/context/MapContext.test.ts
git diff -- supabase/migrations/20260513103000_grounding_quota_log.sql   # empty: file untracked vs HEAD

npm run lint
npm run build
npm run test -- --run src/context/MapContext.test.ts
npm run test -- --run

rg "type MapPinCategory|grounded|PIN_CATEGORY_CONFIG" src/context/MapContext.tsx
rg "PIN_CATEGORY_CONFIG\[pin\.category\]" src/components/chat/ChatMap.tsx src/components/map/pinContent.ts src/components/map/MdeMap.tsx
rg "searchGroundedPlacesTool|maps-mcp-client|grounding_quota_log" src my-mastra-app supabase/migrations

ls supabase/migrations/*grounding_quota*
supabase db reset

# Atomic increments (×3)
supabase db query --local --agent=no -o table "INSERT INTO public.grounding_quota_log (date, count) VALUES (CURRENT_DATE, 1) ON CONFLICT (date) DO UPDATE SET count = public.grounding_quota_log.count + 1 RETURNING count;"

PGPASSWORD=postgres psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -c "SET ROLE anon; SELECT count(*) FROM public.grounding_quota_log;"
PGPASSWORD=postgres psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -c "SET ROLE anon; INSERT INTO public.grounding_quota_log (date, count) VALUES (CURRENT_DATE + 1, 1);"

supabase migration list
supabase db push --dry-run    # initial run: SASL failure; after supabase login: parity error (remote versions missing locally)

# Browser (dev server: npm run dev)
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8080/chat
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test tests/smoke/mastra-056-057-localhost.spec.ts --config playwright.smoke.config.ts
npx playwright screenshot --viewport-size=1280,720 http://127.0.0.1:8080/chat tasks/prompts/mastra/audits/screenshots/mastra-056-chat-1280x720.png --timeout 45000
```

---

## Screenshots / artifacts

| Artifact | Path |
| -------- | ---- |
| `/chat` screenshot | `tasks/prompts/mastra/audits/screenshots/mastra-056-chat-1280x720.png` |

---

## Red flags

1. **Worktree hygiene:** Far beyond MASTRA-056/057 scope — PR must come from a **clean branch** with only intended files.
2. **Migration file tracking:** `20260513103000_grounding_quota_log.sql` is **`??`** — ensure it is **committed** on the real PR branch.
3. **Remote migration parity:** Many **remote-only** versions vs this repo; **`db push --dry-run`** fails until reconciled (restore missing SQL from canonical branch vs **`db pull`** vs last-resort **`migration repair`**). See **`MASTRA-057-remote-migration-parity-blocker.md`**.
4. **`20260513103000`:** Still **local-only** until push succeeds **after** parity fix.
5. **Lint:** Zero errors but **many warnings** (some under `.claude/worktrees/…` picked up by ESLint) — confirm `eslint` ignore patterns for CI if that path should not lint.

---

## Final decision

| Question | Answer |
| -------- | ------ |
| **056 ready for PR** | **YES** (implementation + tests + `/chat` smoke), **NO** for **current worktree** (needs isolate + commit hygiene). |
| **057 ready for PR** | **YES** locally; **NO** for remote until **migration parity** resolved + **`db push --dry-run`** clean. |
| **Production deploy ready** | **NO** — parity blocker + branch hygiene + `20260513103000` not on remote. |
| **Required next action** | (1) **Clean PR branch** (056/057 + audits only). **`git add`** migration file. (2) **Parity audit** branch; restore missing migration files or intentional **`db pull`** (see blocker doc). **Avoid `migration repair`** until last resort. (3) Re-run **`db push --dry-run`** after parity. |

---

## Success criteria mapping

**MASTRA-056**

- ✅ Type/config/tests pass  
- ✅ `/chat` loads without failing smoke (`pageerror` gate)  
- ✅ No MCP / frontend feature scope creep in `rg` scope  

**MASTRA-057**

- ✅ Migration applies on `db reset`  
- ✅ Atomic increment returns **1 → 2 → 3**  
- ✅ Anon cannot read rows / cannot insert  
- ✅ App floor: lint **0 errors**, build OK, Vitest **76/76** passed  

**Production**

- ⚠️ **`supabase db push --dry-run`**: after login, **fails on parity** (“remote migration versions not found locally”) — **auth fixed**, reconcile migrations next  
- ⚠️ **`20260513103000`** still **local-only** on **`migration list`** until push succeeds post-parity  
