# Next Steps Report — MASTRA-056/057 + Migration Parity

**Repo:** `/home/sk/mde`  
**Date:** 2026-05-12  
**Safety:** Read-only linked SQL only for inventory. No `supabase db push`, no `migration repair`, no remote DDL, no linked `db reset`.

---

## Remote table inventory

**PASS** — `supabase db query --linked …` succeeded; output saved to:

`tasks/prompts/mastra/audits/supabase-remote-table-inventory-2026-05-12.txt`

---

## Local table inventory

**PASS** — Local query saved to:

`tasks/prompts/mastra/audits/supabase-local-table-inventory-2026-05-12.txt`

---

## Local vs remote table comparison

**Summary** (see full narrative + grouping in `supabase-local-vs-remote-table-inventory-2026-05-12.md`):

| Bucket | Count | Notes |
| ------ | -----:| ----- |
| **In both** | 59 | Shared core app tables |
| **Local-only** | **1** | **`public.grounding_quota_log`** only |
| **Remote-only** | **66** | Large remote surface (Mastra catalog, landlord, richer events/sponsor/ops, etc.) |

### Sponsor schema

| | Local | Remote |
| --- | --- | --- |
| **Tables** | 7 | 10 |
| **Remote-only** | — | `attributions`, `clicks`, `impressions` |

### `grounding_quota_log`

| Environment | Present |
| ----------- | -------- |
| **Local** | Yes |
| **Linked remote** | **No** |

Matches **`20260513103000`** being **local-only** on migration list until parity + reviewed push.

---

## PR scope classification

Git snapshot (`git status --short` / `diff`) shows a **very dirty** tree (92+ tracked files in diff stat, massive untracked dirs). Below is **intent** for the focused PR — **do not** merge the whole working tree.

### A — Include in MASTRA-056 / MASTRA-057 + prereqs PR

| Path | Role |
| ---- | ---- |
| `src/context/MapContext.tsx` | MASTRA-056 |
| `src/context/MapContext.test.ts` | MASTRA-056 tests |
| `supabase/migrations/20260513103000_grounding_quota_log.sql` | MASTRA-057 |
| `supabase/migrations/20260430000000_landlord_v1_identity_docs_bucket.sql` | Recovered (parity) |
| `supabase/migrations/20260430120000_landlord_v1_listing_photos_bucket.sql` | Recovered |
| `supabase/migrations/20260430130000_landlord_v1_fk_indexes.sql` | Recovered |
| `supabase/migrations/20260501204538_landlord_v1_response_metrics.sql` | Recovered |
| `supabase/migrations/20260501204754_landlord_v1_response_metrics_filter_orphans.sql` | Recovered |
| Audits / PR notes (pick concise set) | e.g. `tasks/prompts/mastra/audits/PR-scope-mastra-056-057-recovered-migrations.md`, `MASTRA-056-057-playwright-supabase-proof.md`, `supabase-migration-recovery-audit-2026-05-12.md`, migration list / dry-run snapshots as needed |

Optional **if** part of same vertical: `tests/smoke/mastra-056-057-localhost.spec.ts`, `playwright.smoke.config.ts` (only if you want CI/smoke in this PR).

### B — Exclude / stash / separate PR

| Area | Examples from current tree |
| ---- | -------------------------- |
| Unrelated app UI | `src/components/chat/ChatCanvas.tsx`, embedded cards, `src/components/map/**` unless strictly required for 056 |
| Mastra app churn | `my-mastra-app/**` |
| Seed / unrelated migrations | `supabase/migrations/20260513100000_*` edits unless explicitly in scope; other `??` migrations (sponsor ACL, event taxes, etc.) → **separate** parity/deploy PR |
| `.claude/**`, `.cursor/**`, `.agents/**`, `scripts/**`, `tasks/**` bulk deletes/edits | Stash or other branches |
| `tests/smoke/mastra-chat-events-weekend.spec.ts` | Unless intentionally bundled |

**Action:** Reset/clean branch from **`origin/main`**, then add **only** group **A** (or cherry-pick commits if history is clean enough).

---

## Clean branch plan (do not run blindly — review dirty tree first)

```bash
cd /home/sk/mde
git stash push -u -m "wip: off-scope changes before 056/057 PR"   # optional if you need to save everything
git checkout main
git pull origin main
git checkout -b fix/mastra-056-057-grounding-prereqs
```

Then either:

- **`git checkout <dirty-branch> -- path path …`** for exact files from your audit branch, or  
- **Cherry-pick** if you already have isolated commits.

Verify:

```bash
git status --short
git diff --stat
```

---

## PR checklist

**Title**

```txt
feat(maps): add grounded pin category and quota migration prereqs
```

**Must include in PR body**

```txt
Remote deployment remains blocked by existing Supabase migration parity drift.
This PR does not run or require production db push.
```

**Supabase note block** (paste)

```txt
Supabase note:
Local reset and SQL validation pass. Remote migration list now confirms five recovered migration files are aligned, but additional remote-only/local-only drift remains. `20260513103000_grounding_quota_log.sql` is local-only and must not be pushed until migration parity is fully resolved and reviewed.
```

---

## Safety gates (confirmed for this session)

| Gate | Status |
| ---- | ------ |
| Real **`supabase db push`** | **Not run** |
| **`supabase migration repair`** | **Not run** |
| Remote DDL / data mutation | **Not run** (SELECT only) |
| Linked **`db reset`** | **Not run** |

---

## Blockers

1. **Remote migration parity** — history vs repo still inconsistent beyond recovered landlord files; **`db push --dry-run`** remains parity-blocked until resolved.
2. **Dirty working tree** — must not open PR from current mixed diff.
3. **Secrets hygiene** — revoke any Supabase CLI token/session exposed in chat/logs.

---

## Final decision

| Question | Answer |
| -------- | ------ |
| **Open PR now** | **NO** until branch is cleaned and only group **A** is committed. After that: **YES** for **code review**, still **not** deploy. |
| **Continue parity audit** | **YES** — separate from this feature PR. |
| **Start MASTRA-048** | **NO** until migration parity allows meaningful **`db push --dry-run`** (team gate). |

---

## Decision lock (confirmed)

**Do not start MASTRA-048 yet.**

```txt
Open PR now: NO, not until clean branch
Next action: clean branch + scoped commit
Parity audit: continue separately
Remote DB push/repair: still NO
```

**What the inventory proves**

```txt
grounding_quota_log: local-only ✅ expected
remote has 66 extra relations ⚠️ important
sponsor remote has extra attributions/clicks/impressions ⚠️ likely real production tables
```

So **`migration repair` / blanket reset parity fixes** remain unsafe without an explicit strategy.

**Next exact action**

Use **Group A** from this doc, then:

```bash
cd /home/sk/mde
git stash push -u -m "wip-before-056-057-clean-pr"
git checkout main
git pull
git checkout -b fix/mastra-056-057-grounding-prereqs
```

Restore only Group A paths (`git checkout <prior-branch> -- path …`), then:

```bash
npm run lint
npm run build
npm run test -- --run
```

**Final rule**

```txt
056/057 PR first.
Migration parity continues separately.
No 048 until PR scope is clean and migration strategy is reviewed.
```

---

## Reference docs

- `tasks/prompts/mastra/audits/supabase-local-vs-remote-table-inventory-2026-05-12.md`
- `tasks/prompts/mastra/audits/PR-scope-mastra-056-057-recovered-migrations.md`
- `tasks/prompts/mastra/audits/MASTRA-057-remote-migration-parity-blocker.md`
