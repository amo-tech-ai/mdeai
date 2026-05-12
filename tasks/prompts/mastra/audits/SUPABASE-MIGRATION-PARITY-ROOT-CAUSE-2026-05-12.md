---
audit_id: SUPABASE-PARITY-ROOT-CAUSE
date: 2026-05-12
branch: audit/supabase-migration-parity (captured on fix/mastra-056-057-grounding-prereqs)
status: DIAGNOSIS COMPLETE — awaiting human sign-off before any mutating command
---

# Supabase Migration Parity — Root Cause Audit

## Snapshot header

| Field | Value |
|-------|-------|
| Date | 2026-05-12 |
| Branch at capture | `fix/mastra-056-057-grounding-prereqs` @ `3d6f9ae` |
| Linked project | `zkwcbyxiwklihegjhuql` |
| Tool | `supabase migration list` (linked, live) |
| Forbidden | `db push` (non-dry-run), `migration repair`, `db reset` (linked), destructive SQL |

---

## 1. Live migration state (2026-05-12)

| Bucket | Count | Meaning |
|--------|------:|---------|
| **Aligned** | **25** | Same version local ↔ remote — safe |
| **Remote-only** | **96** | Remote recorded; no matching file in `supabase/migrations/` |
| **Local-only** | **~15** | File exists locally; not yet applied to remote |
| **Total remote records** | **121** | What remote `schema_migrations` thinks ran |

**`db push --dry-run` fails:** "Remote migration versions not found in local migrations directory."

---

## 2. Primary failure mode: B1 (history mismatch) + B2 (DDL drift)

**How parity broke:** During PR #7 and PR #8 development, someone ran `supabase db push` from a local machine that had migration files locally. The CLI applied those files to the linked remote, but the files were **never committed to this git repo**. Remote got the DDL. Git never saw the files.

**Why `db push` refuses:** When the CLI sees remote-recorded version IDs with no corresponding local files, it stops completely. It cannot know whether those remote changes should be kept or rolled back.

**Prior git search result (from recovery audit):** 94 out of 100 remote-only versions had **zero** matches anywhere in git history. The 6 found were the 5 landlord files (now recovered to repo) + `20260120000733` (intentionally deleted in a chain-repair commit).

---

## 3. Remote-only versions — classified by source session

### `20260120000733` — January baseline (1 version)

File exists in git history but was **intentionally removed** in commit `2bc87f4` ("migration chain repair"). Restoring it would contradict a deliberate cleanup. **Mark `--status reverted` — do not restore the file.**

### April–May development sessions (95 versions)

| Date | Count | Almost certainly from |
|------|------:|----------------------|
| 2026-04-28 | 2 | Unknown session |
| 2026-04-29 | 2 | Unknown session |
| 2026-04-30 | 1 | Landlord work |
| 2026-05-01 | 2 | Landlord work |
| 2026-05-02 | 1 | Unknown |
| 2026-05-03 | 5 | Event/landlord iteration |
| **2026-05-04** | **23** | **PR #7 dev session** (Landlord V1 D5–D14) |
| **2026-05-05** | **12** | **PR #7 continued** |
| **2026-05-08** | **41** | **PR #8 dev session** (landlord launch blockers) |
| 2026-05-10 | 5 | Post-PR #8 fixes |
| **2026-05-13** | **1** | **`20260513100000` — TODAY, remote-only** (dashboard SQL or another machine's push) |

**`20260513100000` needs investigation** — it's a fresh remote-only migration from today. Check Supabase dashboard "SQL Editor" history before marking reverted.

---

## 4. Local-only migrations — conflict risk when pushed

| Version | Feature | Conflict risk |
|---------|---------|---------------|
| `20260404044721` | restaurant seed | Low — insert is idempotent if written with `ON CONFLICT DO NOTHING` |
| `20260424120000` | apartment save counts RPC | Medium — function may already exist on remote |
| `20260427210000` | outbound clicks | Medium — table may exist from remote-only sessions |
| `20260503011925` | event_phase1 tables | **HIGH** — event tables definitely on remote |
| `20260504005355` | event taxes/fees | **HIGH** — columns likely already on remote |
| `20260505000100` | sponsor placements trigger | Medium |
| `20260505000200` | realtime broadcast | Low — no-op if already configured |
| `20260508000001` | leads chat columns | **HIGH** — May-8 cluster almost certainly includes these |
| `20260508002300` | 25u payments RLS | Medium — RLS policies may already exist |
| `20260509205216` | pgvector setup | Low — extension install is idempotent |
| `20260509240000` | embedding RLS fix | Low — RLS upsert is idempotent |
| `20260510000000` | VDB-01 hybrid FTS | Medium — GIN indexes may already exist |
| `20260512120000` | sponsor ACL | Medium |
| `20260512140000` | sponsor schema | **HIGH** — sponsor tables exist on remote |
| **`20260513103000`** | **grounding_quota_log** | **SAFE — table confirmed NOT on remote** |

**Only `20260513103000_grounding_quota_log.sql` is clean to push without conflict risk.**

---

## 5. PR risk table

| PR | Age | Migrations in diff | Recommendation |
|----|-----|--------------------|----------------|
| **#39** | Hours | 5 recovered (now aligned) + `grounding_quota_log` | **Merge now** — scoped, clean |
| **#23** | 2 days | None | **Merge second** |
| **#8** | 2 weeks | None (+128k lines code) | **Audit first** — its schema depends on the May-8 remote-only cluster |
| **#7** | 2 weeks | None (+61k lines code) | **Do not merge** — forensic split required |

PR #7 and #8 have ZERO migration files in their diffs. Their code depends on schema that exists on remote via the remote-only migration clusters. Merging either PR without first fixing parity risks deploying code that expects tables that don't exist on a fresh `db reset`.

---

## 6. Fix playbook

### What NOT to do
- `supabase db reset` on linked remote — destroys data
- `supabase db push` without dry-run passing first
- Merging PR #7 as-is — too large, no migration paper trail

### Recommended path: Option A (repair + guard)

**Step 1 — Generate all 96 repair commands (read-only, generates script only):**
```bash
supabase migration list 2>&1 | \
  grep -E "^\s+\|\s+[0-9]{14}" | \
  awk '{print $2}' | \
  while read v; do echo "supabase migration repair --status reverted $v"; done \
  > tasks/prompts/mastra/audits/repair-commands-2026-05-12.sh
```

**Step 2 — Review `20260513100000` specifically** before including in repair.
Check Supabase dashboard → SQL Editor → Recent queries to understand what it contains.

**Step 3 — Human sign-off on PARITY DECISION block (below).**

**Step 4 — Run repair on LOCAL environment first:**
```bash
supabase start
bash tasks/prompts/mastra/audits/repair-commands-2026-05-12.sh
supabase db push --dry-run
```
Capture dry-run output. Identify which local-only migrations fail with "already exists" errors.

**Step 5 — Add `IF NOT EXISTS` guards** to HIGH-risk local-only migrations.
Example:
```sql
-- Before:
CREATE TABLE outbound_clicks (...);

-- After:
CREATE TABLE IF NOT EXISTS outbound_clicks (...);
```
For RLS policies: `DROP POLICY IF EXISTS ... ; CREATE POLICY ...;`
For functions: `CREATE OR REPLACE FUNCTION ...`

**Step 6 — Re-run `supabase db push --dry-run`** until clean.

**Step 7 — Human sign-off to push to linked remote.**

**Step 8 — `supabase db push` against linked remote.** Verify `grounding_quota_log` table exists.

---

## 7. PARITY DECISION BLOCK (sign before executing)

```txt
PARITY DECISION — 2026-05-12
Primary failure mode: B1 (history mismatch) + B2 (DDL drift)
Evidence:
  tasks/prompts/mastra/audits/SUPABASE-MIGRATION-PARITY-ROOT-CAUSE-2026-05-12.md
  tasks/prompts/mastra/audits/MASTRA-057-remote-migration-parity-blocker.md
  tasks/prompts/mastra/audits/supabase-migration-recovery-audit-2026-05-12.md

Target for mutating commands:
  [  ] LOCAL only (supabase start → repair → dry-run → no push)
  [  ] LINKED REMOTE (requires explicit approval below)

Repair scope: All 96 remote-only versions marked --status reverted
Special case 20260513100000: [  ] include  [  ] investigate first

Approved for LOCAL repair + dry-run:  _________________ (sign here)
Approved for LINKED push:             _________________ (sign here — separate approval)

Rollback: migration repair only adjusts history table, not DDL. Rollback = repair --status applied.
```

---

## 8. Recommended next 3 actions

```
ACTION 1 (now): Merge PR #39 — MapContext.tsx + 5 recovered migration files +
                grounding_quota_log file committed to git.
                The migration won't be APPLIED to remote until parity is fixed.

ACTION 2 (next): Merge PR #23 — no migrations, safe.

ACTION 3 (scheduled): Parity repair session.
  a. Generate repair-commands-2026-05-12.sh (read-only)
  b. Sign PARITY DECISION block
  c. Run on local supabase instance + dry-run
  d. Fix IF NOT EXISTS conflicts in local-only migrations
  e. Get approval for linked remote push
  f. Push → verify grounding_quota_log live
```

After parity is clean:
- PR #8: Audit whether its code changes still apply cleanly (schema already on remote, just verify)
- PR #7: Forensic split — extract safe code chunks, discard or rewrite conflicting parts

---

## 9. What `20260513100000` (remote-only, TODAY) might be

This migration was applied to remote **after** our last commit. Candidates:
- Dashboard SQL run during this audit session
- Another engineer's local push
- Supabase automatic migration (e.g. from enabling a Supabase product feature)

**Before marking it reverted:** check Supabase dashboard → Database → Migrations or SQL Editor logs. If it's a product-managed migration (PostgREST config, Auth config, etc.), mark it reverted safely — Supabase manages those separately. If it's app DDL, we need the SQL content first.

---

## 10. Executive decision — one fast path that works (binary)

**Goal:** `supabase db push --dry-run` exits **0** on **linked**, then one controlled **`db push`** applies **`20260513103000`** (and any other local-only you still need).

### Path A — Repair ledger + idempotent local-only (fastest when it works)

**Mechanism:** Remote DDL already matches “what prod should be.” Phantom rows are **only** missing SQL files in git. You remove phantom rows from **`schema_migrations`** via **`migration repair --status reverted`** (metadata only — **does not drop tables**). Then CLI applies **local-only** migrations; those statements **must not fail** on objects that already exist.

| Step | Action |
|------|--------|
| 1 | Identify **`20260513100000`** (dashboard / migration log). Decide: revert ledger row vs recover SQL into repo. Do **not** bulk-revert blindly until this row is classified. |
| 2 | **`supabase start`** — prove the full sequence on **local** first (`repair` flags for **local** DB per CLI docs). |
| 3 | **`migration repair --status reverted`** for **every** remote-only version that has **no** local file (same list CLI prints). |
| 4 | **`supabase db push --dry-run`** (local). If it lists conflicts, **stop**. |
| 5 | Edit **every HIGH/MEDIUM local-only migration** (section 4): `IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS` / recreate — until dry-run apply phase is clean on local. |
| 6 | Repeat dry-run on **linked** — human sign-off — **`db push`** linked once. |

**This path WORKS if:** After revert, applying local-only migrations is either no-op or succeeds with guards; **no** remote-only DDL remains that is **not** represented by any migration you keep.

**This path FAILS if:** Push errors (`already exists`, dependency failures) remain after guards → stop Path A.

### Path B — Stop repairing; pull schema truth (correct fallback)

**Trigger:** Path A still fails after guarded migrations.

**Mechanism:** Remote schema is source of truth but ledger/files are wrong. Use **`supabase db pull`** (linked) on a throwaway branch to generate migration(s) that describe remote → review → reconcile ledger with **`migration repair`** only **after** engineering agrees — see CLI docs.

**This path WORKS if:** You accept one larger reviewed migration (or split deltas) and align history deliberately.

### Binary summary

| Question | Answer |
|----------|--------|
| Will mass **`repair --status reverted`** alone fix prod schema? | **No.** It only fixes the **CLI blocker**. |
| Will **repair + guarded local-only push** fix it? | **Yes**, if remote DDL matches those migrations when made idempotent. |
| If not? | **`db pull`** + review — Path B. |

There is **no** third magic option: either ledger matches files + migrations apply cleanly, or you **pull/reconcile** schema into the repo.
