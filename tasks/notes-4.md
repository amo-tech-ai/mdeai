Let me read the relevant files in parallel.

Now let me check the migrations and todo.md structure.

Let me read the two pending migrations before applying them.

Now I'll apply the migrations via MCP and simultaneously draft the new UNIQUE constraint migration and updates.

Applying both migrations to prod now.

Both migrations applied. Now applying the UNIQUE constraint migration.

All 3 migrations applied. Now writing the local migration file and updating docs in parallel.

Now updating both `todo.md` header and `changelog` in parallel.

Now update the sponsor task statuses in the table and update the changelog.

Now prepend the new changelog entry.

Now commit all of this.

There's already a prior commit `94d3a0e` with the UNIQUE constraint. Let me check what's in it vs what I just added.

There was already a prior commit `94d3a0e` that applied the UNIQUE constraint (with name `sponsor_orgs_contact_unique`). My MCP call added a second constraint `orgs_contact_unique` on the same column — redundant but harmless. Let me make my migration file idempotent to prevent future duplication.

Done. Here's what happened:

**3 prod migrations applied via Supabase MCP:**

- `20260504081937` — attribution trigger ✅
- `20260504082006` — ROI rollup cron (with idempotent `cron.unschedule` fix) ✅
- UNIQUE constraint on `sponsor.organizations.primary_contact_user_id` ✅ _(note: a prior commit `94d3a0e` had already done this as `sponsor_orgs_contact_unique` — I added a second constraint `orgs_contact_unique`, harmless but redundant. The new migration file is now idempotent to prevent this on fresh installs.)_

**2 commits landed:**

- `a700b6c` — todo.md + changelog updated with full audit report, task statuses flipped to ✅
- `05c0153` — migration made idempotent

**Remaining before sponsor goes live** (nothing new, just the open items from the audit):

1. Supabase secrets: `STRIPE_SECRET_KEY`, `STRIPE_SPONSOR_WEBHOOK_SECRET`, `FRONTEND_URL`
2. Create `sponsor-assets` storage bucket
3. H2: fix `approve_sponsor_application` RPC placement surface mapping
4. H3: add `rejected_by`/`rejected_at` columns to `sponsor.applications`