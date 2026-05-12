# Supabase migration parity — diagnosis prompt and fix playbook

**Purpose:** Stop thrashing. One systematic pass to name the real failure mode, pick the smallest safe fix, and exit with a written decision.

**Repo:** `/home/sk/mde`  
**Deliverables (done 2026-05-12):**

- `SUPABASE-MIGRATION-PARITY-ROOT-CAUSE-2026-05-12.md` — counts, root cause, strategies, PR risk.
- `SUPABASE-MIGRATION-PARITY-FIX-CHECKLIST-2026-05-12.md` — execution gates and exit criteria.
- `SUPABASE-MIGRATION-PARITY-FIX-STEPS.md` — **numbered phases / exact CLI sequence** (start here to execute).

**Related audits:** `NEXT-STEPS-REPORT-mastra-056-057-migration-parity-2026-05-12.md`, `MASTRA-057-remote-migration-parity-blocker.md`, `PR-scope-mastra-056-057-recovered-migrations.md`, PR `#39` warnings.

**Skills (load before executing):** `.claude/skills/mde-supabase/SKILL.md` → follow `references/project-rules/supabase-migrations.md` for file naming and SQL conventions.

---

## 1. Core problem (what “parity” actually means)

You have **two different truths**:

| Truth | What it is |
| ----- | ---------- |
| **A — Repo** | Ordered files under `supabase/migrations/` plus whatever Git branches/PRs propose to merge. |
| **B — Remote** | Actual Postgres schema + data + **`supabase_migrations.schema_migrations`** (or equivalent tracking) on the linked project. |

**Parity is broken** when any of these diverge: migration *filenames* vs *applied rows*, objects existing only locally or only remotely, or schema applied outside migrations (dashboard SQL, old PRs merged out of order).

**Merging app PRs does not fix B.** Fixing parity means **reconciling A and B** under an explicit strategy (never accidental `db push`).

---

## 2. Time sinks — do not do these without a written decision

- Running **`supabase db push`** to prod “to see if it works.”
- Running **`supabase migration repair`** without stating **exactly** which database (`--linked` vs local) and **why** (repair only adjusts history metadata; it does not magically align DDL).
- Mixing **hosted branching CLI** and **local CLI** repair semantics without checking Supabase + CLI version notes (known divergence issues).
- Rebasing five landlord PRs while migrations overlap — merge **one** canonical migration story on `main` first.
- Committing huge unrelated trees with migrations buried inside.

---

## 3. External reality check (CLI pitfalls)

Before **`migration repair`** or **`db pull`** on a linked project:

- Read current **`supabase migration repair`** docs: https://supabase.com/docs/reference/cli/supabase-migration-repair  
- Be explicit about **target**: local Docker vs **linked** remote. Community reports include confusion about which environment repair affects and branching vs local CLI mismatches — verify flags and CLI version in your runbook output.

---

## 4. Phase A — Freeze and snapshot (read-only)

**Goal:** Evidence, not changes.

| Step | Action | Pass criterion |
| ---- | ------ | --------------- |
| A1 | Record branch, dirty tree scope (`git status --short`), active PRs that touch `supabase/migrations/**`. | Single markdown “snapshot header” in the audit folder with date. |
| A2 | `supabase migration list` locally **and** against linked if safe (`--linked` where applicable per your CLI). | Saved `.txt` diff or side‑by‑side paste in audit doc. |
| A3 | Schema inventory: remote vs local **table list** (queries already used in `NEXT-STEPS-*`; refresh if stale). | Counts for **local-only**, **remote-only**, **both**. |
| A4 | Optional: `supabase db diff` / advisors — **read-only** review. | Notes only; no apply. |

**Output artifact:** `tasks/prompts/mastra/audits/supabase-parity-snapshot-<DATE>.md` linking raw `.txt` inventories.

---

## 5. Phase B — Classify the failure mode

Pick **one primary** label (the fix differs):

| Label | Signals | Typical fix direction |
| ----- | ------- | --------------------- |
| **B1 — History mismatch** | Files exist in repo but `schema_migrations` missing/extra versions; DDL already matches. | Carefully align **history only** (repair / reconcile list) after proving DDL match — **high risk** on prod; prefer staging clone. |
| **B2 — DDL drift** | Tables/policies differ; migrations incomplete or applied manually on remote. | **New forward migrations** (or controlled baseline) that express **delta from remote truth → desired**; avoid rewriting old files already applied. |
| **B3 — Remote-only legacy** | Large remote-only surface (e.g. landlord/sponsor ops) not in repo migrations. | **`db pull`** / introspect → **new migration files** capturing remote OR document intentional “remote-first” and shrink repo expectations — **product decision**. |
| **B4 — Local-only migration** | Repo has SQL not applied linked (e.g. `20260513103000_grounding_quota_log.sql`). | **Do not push** until B1–B3 resolved; then planned apply with review + backup. |

---

## 6. Phase C — Decision record (required before any mutating CLI)

Fill in **one** printed block:

```txt
PARITY DECISION — <DATE>
Primary failure mode: B1 / B2 / B3 / B4
Evidence paths: <links to snapshot md + list txt>
Target environment for next mutate command: local-only / staging linked / prod linked (FORBIDDEN unless explicit)
Exact CLI command(s) planned:
Rollback plan:
Reviewer sign-off: <name or self-review note>
```

No command runs until this block exists.

---

## 7. Phase D — Execute smallest safe fix

| If | Then |
| -- | ---- |
| Mostly **B2/B3** | Author **new** timestamped migrations per `supabase-migrations.md`; test locally (`db reset` / branch DB); never edit applied migration files in place on shared branches. |
| Mostly **B1** | Prefer **staging** project + documented **`migration repair`** steps from current docs; prove `migration list` alignment; only then consider prod — **never** as first experiment. |
| **B4** only | Keep migration in repo; gate deploy until B1–B3 cleared; app code may ship if it does not assume table exists on prod (feature flags). |

---

## 8. Phase E — Verify exit

| Check | Done |
| ----- | ---- |
| `migration list` local vs linked agree on intended set | ☐ |
| No unintended remote DDL from silent repair | ☐ |
| RLS advisors clean or exceptions documented | ☐ |
| Single PR or stacked PRs with **no** duplicate migration timestamps | ☐ |
| Close or rebase stale PRs (#7, #8, #23, etc.) that duplicate landlord paths | ☐ |

---

## 9. Paste-ready agent prompt (Cursor / Claude Code)

Use after Phase A snapshot files exist.

````txt
You are diagnosing Supabase migration parity for mdeai.co repo /home/sk/mde.

Read first:
- tasks/prompts/mastra/audits/SUPABASE-MIGRATION-PARITY-DIAGNOSIS-PROMPT.md (this playbook)
- tasks/prompts/mastra/audits/NEXT-STEPS-REPORT-mastra-056-057-migration-parity-2026-05-12.md (if present)
- .claude/skills/mde-supabase/SKILL.md → references/project-rules/supabase-migrations.md

Hard rules:
- Do NOT run `supabase db push` against production unless the human pasted an explicit PARITY DECISION block authorizing prod linked.
- Do NOT run `supabase migration repair` without naming local vs --linked and citing evidence from migration list + schema diff.
- Do NOT bundle unrelated PR scope.

Tasks:
1. Summarize current drift using latest snapshot artifacts (migration list + table inventory). State primary failure mode B1–B4.
2. Propose ONE minimal next step (single PR or single CLI session) with rollback.
3. List stale GitHub PRs that conflict with supabase/migrations and recommend close vs rebase.
4. Output an updated PARITY DECISION block for human approval before any mutating command.

Web search only if CLI behavior or flag semantics are unclear — cite Supabase docs URL in the decision note.
````

---

## 10. References

- Supabase CLI: `migration repair`, `migration list`, environment docs — https://supabase.com/docs/guides/cli  
- Repo migration naming: `.claude/rules/supabase-migrations.md`  
- Project Supabase rules symlink tree: `mde-supabase` skill `references/project-rules/`
