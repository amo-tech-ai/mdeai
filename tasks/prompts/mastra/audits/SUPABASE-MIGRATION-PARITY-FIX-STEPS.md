# Supabase migration parity — exact fix steps

**Repo:** `/home/sk/mde`  
**Why:** Live DB remembers migrations Git doesn’t have files for → `db push` is blocked.  
**Reads first:** `SUPABASE-MIGRATION-PARITY-ROOT-CAUSE-2026-05-12.md`  
**Checkboxes:** `SUPABASE-MIGRATION-PARITY-FIX-CHECKLIST-2026-05-12.md`

**Do not run on linked prod until steps marked LINKED say so.**

Official refs:

- [Managing environments](https://supabase.com/docs/guides/cli/managing-environments) (`db pull`)
- [`migration repair`](https://supabase.com/docs/reference/cli/supabase-migration-repair)

Before anything mutating, run:

```bash
supabase migration repair --help
supabase db pull --help
supabase db push --help
```

Confirm whether your CLI uses `--linked`, `--local`, or defaults — flags change by version.

---

## Phase 0 — Freeze and capture (safe)

**Step 0.1** — Working branch only for parity work (example):

```bash
cd /home/sk/mde
git checkout main
git pull origin main
git checkout -b fix/supabase-migration-parity
```

**Step 0.2** — Save evidence files:

```bash
supabase migration list 2>&1 | tee tasks/prompts/mastra/audits/supabase-migration-list-before-fix-$(date +%Y-%m-%d).txt
supabase db push --dry-run 2>&1 | tee tasks/prompts/mastra/audits/supabase-db-push-dry-run-before-fix-$(date +%Y-%m-%d).txt
```

**Step 0.3** — Decide **`20260513100000`** (remote-only “today” row):

- Dashboard → Database → Migration list / SQL history.
- Record what it was. Do **not** bulk-repair until this row is classified (keep or revert in ledger).

**Step 0.4** — Confirm **`20260120000733`** policy with team (repo removed it in `2bc87f4…`; remote may still list it → repair-as-reverted is usual intent; confirm).

---

## Phase A — Prove repair + push locally (Docker)

Goal: same migration **files** + **`repair`** sequence works on **`supabase start`** before touching linked prod.

**Step A.1** — Start local stack:

```bash
supabase start
```

**Step A.2** — List versions:

```bash
supabase migration list
```

**Step A.3** — On **local DB only**, mark remote-only / phantom ledger rows as **reverted** — **one version per command** (or batched only after testing one):

Use the exact version IDs from your saved `migration list` where **Local** is blank and **Remote** has a number — **except** any row you’re deliberately restoring via a new file instead.

Example shape (replace `<VERSION>` and flags per `repair --help`):

```bash
supabase migration repair --status reverted <VERSION>
```

Repeat for **every** remote-only version you intend to clear from the ledger **on this environment**.

**Important:** `repair --status reverted` changes **the migration history table**, **not** table data. Local DB schema should be rebuilt from files via reset when testing:

**Step A.4** — After repairs on local, reset local from migrations (optional but strong check):

```bash
supabase db reset
```

**Step A.5** — Dry-run push locally if your CLI supports it against local; otherwise rely on `db reset` success + `migration list` alignment:

```bash
supabase migration list
```

---

## Phase B — Make local-only migrations safe to apply when prod already has objects

Remote already has much of this DDL. When ledger is repaired and you push, Postgres may say **“already exists”.**

**Step B.1** — Open each **local-only** migration listed in `ROOT CAUSE` §4 (HIGH/MEDIUM first).

**Step B.2** — Change DDL to be **repeatable**:

- Tables: `CREATE TABLE IF NOT EXISTS …`
- Indexes: `CREATE INDEX IF NOT EXISTS …`
- Policies: `DROP POLICY IF EXISTS … ON …;` then `CREATE POLICY …`
- Functions: `CREATE OR REPLACE FUNCTION …`

**Step B.3** — Known safe alone for net-new remote table: **`20260513103000_grounding_quota_log.sql`** — still only push **after** dry-run is clean.

**Step B.4** — Commit guard edits on the parity branch:

```bash
git add supabase/migrations/
git commit -m "fix(db): make local-only migrations idempotent for parity push"
```

---

## Phase C — Linked dry-run (still no apply)

**Step C.1** — Login + link (if needed):

```bash
supabase login
supabase link --project-ref zkwcbyxiwklihegjhuql
```

**Step C.2** — Capture linked list:

```bash
supabase migration list 2>&1 | tee tasks/prompts/mastra/audits/supabase-migration-list-linked-$(date +%Y-%m-%d).txt
```

**Step C.3** — Linked dry-run:

```bash
supabase db push --dry-run 2>&1 | tee tasks/prompts/mastra/audits/supabase-db-push-dry-run-linked-$(date +%Y-%m-%d).txt
```

- If this **still** fails on “remote versions not found …”, you have **not** repaired **linked** ledger yet — Phase D.

---

## Phase D — Repair linked ledger (human sign-off)

**Stop:** Second person review for production.

**Step D.1** — Write and sign the **PARITY DECISION** block in `SUPABASE-MIGRATION-PARITY-ROOT-CAUSE-2026-05-12.md` (or paste into PR).

**Step D.2** — For **linked** remote, run **`migration repair --status reverted`** for **each** remote-only version ID that has **no** local file — **using the flags your CLI requires for linked** (often `--linked`; verify `--help`).

Example shape:

```bash
supabase migration repair --status reverted <VERSION>
```

**Step D.3** — Re-run:

```bash
supabase migration list
supabase db push --dry-run
```

Repeat repair / guard edits until **`db push --dry-run` exits 0**.

---

## Phase E — Apply (linked)

**Step E.1** — Final backup note: confirm backups / snapshot policy per team.

**Step E.2** — Push migrations:

```bash
supabase db push
```

**Step E.3** — Verify:

```bash
supabase migration list
```

Confirm **`20260513103000`** appears on **both** Local and Remote columns.

**Step E.4** — Smoke test app + critical queries; regenerate types if you use `supabase gen types`.

---

## Phase F — If Phase D/E keeps failing (fallback path)

**Step F.1** — Stop wholesale repair.

**Step F.2** — On a **throwaway branch**, run **`supabase db pull`** per docs — capture remote schema into **new** migration file(s).

**Step F.3** — Human review RLS, grants, extensions — merge only after review.

**Step F.4** — Reconcile ledger with **`migration repair`** only under a written plan (docs + issue thread).

Docs: [Managing environments](https://supabase.com/docs/guides/cli/managing-environments), [`db pull` reference](https://supabase.com/docs/reference/cli/supabase-db-pull).

---

## Verified notes — official docs vs community hacks vs `mde-supabase`

Use when judging multiple “exact step” writeups.

### What matches **official Supabase docs**

| Idea | Source |
|------|--------|
| Dashboard / existing project drift → **`supabase db pull`** before repo is canonical | [Managing environments](https://supabase.com/docs/guides/cli/managing-environments) |
| **`supabase migration repair`** to align history | [migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair) |
| Backup with **`supabase db dump --linked -f <path>`** | [db dump](https://supabase.com/docs/reference/cli/supabase-db-dump) |
| **`db push --dry-run`** before apply | [db push](https://supabase.com/docs/reference/cli/supabase-db-push) |

### **`mde-supabase`** (`/home/sk/mde/.claude/skills/mde-supabase/SKILL.md`)

- Migrations live in **`supabase/migrations/`** (timestamp naming — `references/project-rules/supabase-migrations.md`).
- Workflow: **`supabase db advisors`** → **`supabase db pull`** → **`supabase migration list`**; no “drop tables to fix parity.”
- Do not **`apply_migration`** for scratch iteration (breaks clean history).

### GitHub Discussion **#40721** (migration history mismatch)

- Correct URL: **`https://github.com/supabase/supabase/discussions/40721`** (`/orgs/supabase/discussions/40721` resolves to the org hub, not the thread).
- Describes the **same** blocker: remote history vs missing local files; suggests **`db dump`** baseline in comments.
- **`DELETE FROM supabase_migrations.schema_migrations;`** appears as a **community** comment — **not** official first-line guidance. Use only as **disaster-recovery** with backups + explicit approval.

### Pitfalls in pasted automation

1. **`grep | awk` on `migration list`** — often **wrong**: remote-only rows have a **blank Local** column; grepping “lines that start with `|` + digits” misses or mis-parses. Build repair lists from explicit columns or hand-verify IDs.
2. **“Repair local first”** — batch scripts must use whatever flag targets **local** vs **linked** for **your** CLI (`supabase migration repair --help`). After **`supabase link`**, bare **`repair`** may hit **production**.
3. **`db dump --file`** — docs standardize **`-f` / `--file`**; confirm both work on your CLI.

---

## Commands that stay forbidden until deliberately approved

- `supabase db reset --linked` (destroys linked DB data)
- **`DELETE FROM supabase_migrations.schema_migrations`** (wipes **all** migration history on that DB) unless explicit disaster-recovery sign-off + backups
- Raw `DELETE` / `TRUNCATE` on prod **app data** to “fix parity”
- `supabase db push` before `db push --dry-run` is clean

---

## Done criteria

1. `supabase migration list` — no orphan remote-only rows **without** a team-approved plan.
2. `supabase db push --dry-run` — **exit code 0** on linked.
3. `supabase db push` — completed once; `grounding_quota_log` exists if MASTRA-057 was in scope.
4. Audit folder contains before/after list + dry-run logs.
