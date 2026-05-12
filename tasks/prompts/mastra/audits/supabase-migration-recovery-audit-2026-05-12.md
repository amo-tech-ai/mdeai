# Supabase migration file recovery audit (git-first)

**Branch:** `audit/supabase-migration-parity`  
**Repo:** `/home/sk/mde`  
**Snapshot parsed:** `tasks/prompts/mastra/audits/supabase-migration-list-2026-05-12.txt`  
**Rules respected:** no `migration repair`, no `db push`, no `db pull` in this pass except **`db push --dry-run`** after partial recovery.

---

## 1. Parsed migration list (from snapshot)

| Bucket | Count | Meaning |
| ------ | ----- | ------- |
| **Aligned** | 21 | Same version local ↔ remote |
| **Local-only** | 15 | SQL exists locally (or CLI-local tracking); **not** on linked remote yet |
| **Remote-only** | 100 | Recorded on remote; **no matching `YYYYMMDDHHMMSS_*.sql` prefix** in local folder **before** this audit |

**Local-only versions (for parity awareness):**  
`20260404044721`, `20260424120000`, `20260427210000`, `20260503011925`, `20260504005355`, `20260505000100`, `20260505000200`, `20260508000001`, `20260508002300`, `20260509205216`, `20260509240000`, `20260510000000`, `20260512120000`, `20260512140000`, `20260513103000`.

---

## 2. Git search methodology

Per remote-only version `V`:

1. **`origin/main` tree:** `git ls-tree -r origin/main --name-only supabase/migrations` → filename prefix `V_`.
2. **All history:** union of paths from `git log --all --name-only -- supabase/migrations`.
3. **Worktrees:** `find .claude/worktrees … **/supabase/migrations/${V}_*.sql`** (spot-checked batch → **no** hits).

**Result summary:**

| Outcome | Count |
| ------- | ----- |
| On **`origin/main` tip** | **0** / 100 |
| In **git history only** (not on main tip) | **6** / 100 |
| **No matching migration file** in git history | **94** / 100 |

Full row-level table (preflight script output):  
`tasks/prompts/mastra/audits/supabase-remote-only-migration-git-audit.tsv`

---

## 3. Special case — `20260120000733`

| Field | Detail |
| ----- | ------ |
| File | `supabase/migrations/20260120000733_01504dda-7dc9-4204-b3b3-69d990ce877d.sql` |
| Exists in history | **Yes** — retrievable from parent commits **before** `2bc87f4da818983d627ffbd4fd192da5dfe1d715` (example blob checkout: `ca1f1b1`). |
| **Not copied here** | Commit **`2bc87f4`** explicitly **removes** early `202601*` migrations (“migration chain repair”). Restoring the file without team approval risks contradicting an intentional chain reset vs remote rows still listing `20260120000733`. |
| Classification | **Needs human review** — reconcile remote row vs deliberate deletion (**repair** vs selective baseline / **`db pull`**) |

---

## 4. Files recovered in this audit (git checkout content → disk)

Written from **`141a2bbd29ce6111491b7986bfa7c78bcc562a78`** into **`supabase/migrations/`**:

| File |
| ---- |
| `20260430000000_landlord_v1_identity_docs_bucket.sql` |
| `20260430120000_landlord_v1_listing_photos_bucket.sql` |
| `20260430130000_landlord_v1_fk_indexes.sql` |
| `20260501204538_landlord_v1_response_metrics.sql` |
| `20260501204754_landlord_v1_response_metrics_filter_orphans.sql` |

**Before:** 36 `.sql` migrations locally. **After:** **41** (plus any other local-only files unchanged).

---

## 5. Post-recovery remote checks

### `supabase migration list` (after recovery)

**Attempt:** `tasks/prompts/mastra/audits/supabase-migration-list-2026-05-12-after-recovery.txt`

In this environment the command **failed pooler SASL auth** (`cli_login_postgres`). **Re-run locally** after `supabase login` to refresh the parity table.

### `supabase db push --dry-run` (after recovery)

**Captured:** `tasks/prompts/mastra/audits/supabase-db-push-dry-run-after-recovery-2026-05-12.txt`

**Result:** Still **`Remote migration versions not found in local migrations directory`**.

CLI suggests **`migration repair --status reverted`** for **94** remaining versions (long single line in dry-run output). **Do not run automatically.**

Compared to the earlier dry-run transcript, the **`20260430000000` / `20260430120000` / `20260430130000` / `20260501204538` / `20260501204754`** entries are **absent** from the repair hint — consistent with those five filenames now existing locally.

---

## 6. Unrecovered remote-only versions (94)

No `supabase/migrations/<version>_*.sql` with matching prefix appears anywhere in **`git log --all`** for this repo. Typical buckets:

| Classification | Notes |
| -------------- | ----- |
| **`db pull` candidate** | Remote schema matches prod but migration files live only on DB history — baseline via pull **after** team agrees |
| **Squash / alternate remote / manual applies** | Versions applied outside canonical repo tracking |
| **Human review** | Especially dense batches **20260504*** and **20260508*** |

**.claude/worktrees:** Spot searches for representative versions returned **no** matching migration files.

---

## 7. Recommended next steps (ordered)

1. **Commit** the five recovered SQL files on **`audit/supabase-migration-parity`** (or revert if you decide recovery was premature).
2. **`supabase migration list`** on your machine (auth OK) and save a fresh snapshot after recovery.
3. **Decide `20260120000733`:** repair-as-reverted vs restore-from-`ca1f1b1` vs align remote history — **engineering decision**, not silent copy.
4. For the **94** ghost versions: **`supabase db pull`** on a throwaway branch **or** recover SQL from another canonical repo/branch if one exists — **still avoid `migration repair`** until strategy is written down.
5. **Keep MASTRA-048 paused** until **`db push --dry-run`** is clean or drift is explicitly accepted.

---

## 8. Commands executed (audit trail)

```bash
cd /home/sk/mde
git fetch origin
# Parsed snapshot → Python cross-reference vs origin/main tree + git log --all paths
# Recovered 5 files via git show 141a2bbd29ce6111491b7986bfa7c78bcc562a78:supabase/migrations/<file>
supabase db push --dry-run   # output saved next to this doc
# supabase migration list | tee …after-recovery.txt  → SASL failure in agent env; retry locally
```

---

## Related docs

- `tasks/prompts/mastra/audits/MASTRA-057-remote-migration-parity-blocker.md`
- `tasks/prompts/mastra/audits/supabase-migration-list-2026-05-12.txt`
- `tasks/prompts/mastra/audits/supabase-remote-only-migration-git-audit.tsv`
