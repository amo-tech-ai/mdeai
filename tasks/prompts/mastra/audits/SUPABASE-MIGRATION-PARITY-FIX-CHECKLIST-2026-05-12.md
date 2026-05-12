# Supabase migration parity — fix checklist

**Companion:** `SUPABASE-MIGRATION-PARITY-ROOT-CAUSE-2026-05-12.md`  
**Goal:** Close parity safely. No accidental prod mutation.

---

## Pre-flight gates

- [ ] Owner named for parity branch + PR series.
- [ ] **Staging / preview** DB available if possible (avoid first experiments on prod).
- [ ] CLI version pinned / noted (`supabase --version`).
- [ ] Current docs skimmed: [migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair), [db pull](https://supabase.com/docs/reference/cli/supabase-db-pull).

---

## Evidence capture

- [ ] **Remote-only** migration list parsed (expect ~95 rows without local files).
- [ ] **Local-only** migration list parsed (expect **15** pending push versions incl. `20260513103000`).
- [ ] **Aligned** pair count recorded (expect **26** after landlord recovery).
- [ ] `supabase db push --dry-run` output saved to `tasks/prompts/mastra/audits/` with date suffix.
- [ ] Table inventories refreshed OR prior `supabase-*-table-inventory-2026-05-12.txt` acknowledged as still authoritative.

---

## Git / worktree recovery

- [ ] Every remote-only version searched in `git log --all --name-only -- supabase/migrations` (TSV: `supabase-remote-only-migration-git-audit.tsv`).
- [ ] Every remote-only version searched under `.claude/worktrees/**/supabase/migrations` (expect **no** hits for ghosts — prior audit).
- [ ] Any newly discovered blobs **checked out** via explicit commit SHA + PR — **no** drive-by copies.

---

## Special cases

- [ ] **`20260120000733`** decision recorded (repair vs restore vs branching baseline) — references commit `2bc87f4…` deletion rationale.
- [ ] Five landlord files confirmed present on disk and aligned on `migration list`.

---

## Schema / code mapping

- [ ] Remote-only **tables** grouped (landlord / Mastra / events / sponsor / ops) per inventory doc.
- [ ] App + edge code searched for references to **remote-only** critical tables (beyond simple grep — include RPC names).
- [ ] Generated Supabase types regeneration planned **after** local migrations match intended prod schema.

---

## Reconciliation execution (human-approved only)

- [ ] **`db pull`** attempted **only after** git recovery exhausted — output reviewed line-by-line (RLS, extensions).
- [ ] No **`migration repair`** until written rationale + second reviewer (if prod).
- [ ] No **`db push`** until **`db push --dry-run`** is clean.
- [ ] No **`DROP` / `TRUNCATE` / destructive DELETE** against linked prod.

---

## PR hygiene

- [ ] Parity work lives on **dedicated** branch; **not** mixed with MASTRA-048 feature scope.
- [ ] Open PRs **#7** / **#8** audited for migration overlap before merge.
- [ ] **#39** merged or superseded intentionally before assuming `main` reflects recovered landlord files.

---

## Exit

- [ ] `supabase migration list`: **remote-only = 0** (or every straggler documented + repaired with rollback note).
- [ ] `supabase db push --dry-run`: **exit 0**.
- [ ] Local-only queue (15) **ordered** for deploy; **`20260513103000`** deployed only after parity green.
- [ ] Final dry-run log **attached** to closing audit PR.

---

## Commands cheat sheet

**Safe (read-only / local):**

```bash
supabase migration list
supabase db push --dry-run
supabase db query --local "select 1"
# Linked SELECT-only when approved:
# supabase db query --linked "select ..."
```

**Forbidden without signed checklist + approval:**

```bash
supabase db push                    # applies migrations
supabase migration repair ...       # mutates migration ledger
supabase db reset --linked          # destructive on linked DB
```
