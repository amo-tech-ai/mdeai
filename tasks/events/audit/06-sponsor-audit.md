---
audit_id: 06-sponsor-audit
title: Forensic technical audit — sponsor tasks, PRD, and master plan
scope: tasks/events/prompts/sponsor (045–064, 100–104, notes)
repo_verified: 2026-05-04
method: document cross-review + spot-check of supabase/migrations + supabase/functions + App.tsx
---

# Sponsor system — forensic technical audit

## 1. Executive verdict

| Question | Answer |
|---|---|
| **Will it succeed?** | **Partial** — the closed-loop MVP (apply → approve → pay → sign → surface → track → rollup) is largely implementable and much of it is already in the repo; the *product* goals in 100/101/104 (self-serve ROI, AI differentiation, chat acquisition, marketplace) are **not** fully covered by built work + tasks without additional execution. |
| **Confidence** | **72%** — high confidence in data model + edge core; medium confidence in end-to-end revenue until secrets, dashboard, and chat ship; low confidence that Phase 3 automation (062–064) lands on the current calendar without scope cuts. |
| **Biggest risk** | **Operational + integration**: Stripe/Infobip secrets and webhook correctness gate money; **double attribution / weak idempotency** in attribution SQL; **unauthenticated impression/click endpoints** invite fraud and cost; **no sponsor intents in `ai-router`** means inbound demand leaks until Task 067/059 ships. |

---

## 2. Scorecard

| Dimension | Score | Rationale |
|---|---:|---|
| **PRD / strategy alignment (100, 101–103, 104)** | **78%** | Core lifecycle tasks (045–058) align with “first revenue” and stability; marketplace + discovery + Postiz/OpenClaw layers are coherent strategically but depend on large later surface area; 100 Part 10 ROI SQL uses **`application_id` on `sponsor.roi_daily`** which **does not match** deployed schema (`placement_id`, `day`) — doc bug reduces trustworthy alignment. |
| **Technical correctness** | **68%** | Postgres design (separate `sponsor` schema, RLS patterns, rollup, attribution trigger) is sound; several specs contradict shipped naming (`STRIPE_WEBHOOK_SECRET` vs `STRIPE_SPONSOR_WEBHOOK_SECRET` in code); attribution **idempotency** as specified is **incorrect** without a uniqueness rule on `(click_id)` or order FK; dashboard specs assume aggregates (e.g. “by surface”) that **`roi_daily` does not store** (no `surface` column). |
| **Production readiness** | **55%** | Public beacons without strong auth need WAF/rate limits/ bot controls; observability mentions `ai_runs` but no SLOs, dashboards, or alert paths; dispute/freeze semantics touch `applications.dispute_freeze` — must be implemented consistently in DB + RLS; automated tests listed in 104 are largely **aspirational** (not evidenced in audit pass). |
| **Execution feasibility (order + timeline)** | **62%** | 104’s renumbering (065+) clarifies dependencies; **30-day “marketplace live”** in 104 is aggressive vs one team + existing gates; **060–064** are multi-week designs depending on infra (Hermes HTTP bridge, OpenClaw ops, Postiz, enrichment APIs). |

**Will the step plan succeed?** **Yes for a narrowed MVP** (complete 052/054/067, fix payment secrets, fix attribution uniqueness, ship dashboard queries against `roi_daily` + joins). **No**, if taken literally as *all* of 060–064 + marketplace + Hermes + Paperclip within the same quarter without headcount and compliance work — **scope must be staged** as 100 Part 5 and 104 Part 2 already suggest.

---

## 3. Critical failures (top 5)

1. **Attribution idempotency is spec-broken** — `sponsor.attribute_order()` uses `INSERT … ON CONFLICT DO NOTHING` but `sponsor.attributions` is only `id` PK; new UUID rows can duplicate the same conversion on trigger replay unless a **unique** constraint exists (e.g. on `click_id` or `event_order_id`). **Severity: critical** (ROI and billing disputes).

2. **`roi_daily` grain vs dashboard narrative** — Implemented rollup is **per `placement_id` per day**; 052/100 talk about “top surface by CTR” and concierge tools querying `sponsor.roi_daily` by `organization_id` without a join path in the spec. **Severity: critical** for product honesty (queries must join `placements` → `applications`).

3. **Revenue path blocked by configuration** — 100/101/102 state Stripe secrets missing; code expects `STRIPE_SPONSOR_WEBHOOK_SECRET` + `STRIPE_SECRET_KEY`. Until verified end-to-end, **checkout is production-blind**. **Severity: critical**.

4. **Inbound acquisition gap** — Verified: **no `sponsor` strings in `ai-router`**; 100/104 require four intents + `sponsor_concierge`. Without this, PRD goals for 24/7 qualification **do not execute**. **Severity: critical** for adoption.

5. **Self-serve retention gap** — No `/sponsor/dashboard/:applicationId` in `App.tsx` (grep); 052 not shipped blocks sponsors seeing ROI → churn and manual support load. **Severity: high** (critical for retention, not for first payment).

---

## 4. Blockers (must fix before “MVP works” for sponsors)

| Blocker | Why |
|---|---|
| Set and verify **Stripe** secrets (`STRIPE_SECRET_KEY`, `STRIPE_SPONSOR_WEBHOOK_SECRET`, `FRONTEND_URL` if used) | Money path |
| **Fix attribution uniqueness** + define behavior on order updates | Trust in ROI; disputes |
| Ship **052** (dashboard) or equivalent ROI export | Aligns with PRD P0 in 100 Part 11 |
| Add **ai-router + ai-chat** sponsor path (Task 067 / 059) | Aligns with acquisition goals |
| Align **documentation + code** for webhook env var names and `roi_daily` column usage | Prevents mis-deploys |

---

## 5. Hidden risks

| Risk | Detail |
|---|---|
| **Fraud / inflation on impressions** | Public `sponsor-impression` + `sponsor-click` — specs acknowledge rate limits; production needs IP reputation, caps per placement, optional signed beacons. |
| **Cross-doc schema drift** | 045 frontmatter still “Open” while 100 claims built; task YAML **stale** — teams may build wrong migrations. |
| **048 vs 055/057 ordering** | Real flow is pay/sign/activate gates; any cron or webhook that sets `active=true` without both **paid invoice** and **signed contract** is a compliance bug (104 workflow H is the intended guard). |
| **PhantomBuster / LinkedIn** | 104 Part 16 vs 100 Part 7 — “API-only” still carries vendor + account risk; 100 prefers signal-based V1. |
| **064 Cloudinary** | Notes/064 reference Cloudinary; **102** mandates Supabase Storage — creative pipeline can fork if not normalized. |
| **`event_orders` vs other checkout** | Attribution trigger is tied to **`public.event_orders`**; if ticket flow uses another table or path, **attribution is silent**. |
| **Anon → auth buyer** | 051 documents gap; last-click on `viewer_anon_id` then purchase as `buyer_user_id` without linkage **under-attributes**. |
| **RLS + service role** | Impression/click writes must be service-only; any accidental `authenticated` grant = poisoned metrics. |

---

## 6. Failure scenario inventory (top 10)

| # | Scenario | Severity |
|---|-----------|----------|
| 1 | Webhook secret mismatch or rotation → payments accepted in Stripe, **never activated** in DB | Critical |
| 2 | Duplicate attributions on status churn / retries | Critical |
| 3 | Sponsor sees wrong org’s data due to RLS bug on new policies | Critical |
| 4 | Contract signed but placements never activate (cron bug or missing JOIN to invoices/contracts) | High |
| 5 | Refund partially applied (Stripe) but DB invoice/placement state inconsistent | High |
| 6 | Impression flood from botnet → DB bloat + noisy ROI | High |
| 7 | Gemini timeouts on 054 fns → empty insights; sponsors perceive “broken AI” | Medium |
| 8 | `rollup_roi_daily` heavy join pattern at scale → slow cron, lock contention | Medium |
| 9 | OpenClaw/Infobip bulk outreach without templates → **WhatsApp / carrier blocks** | High |
| 10 | Discovery PII without Ley 1581 disclosures → **compliance** exposure | High |

---

## 7. Audit framework (mandatory) — condensed

### A. Goal alignment

- **First revenue:** Supported by 046–048 + 047; **blocked** until Stripe verified; marketplace (101) **not** required for first deal.
- **Adoption:** **Weak** until chat (067) + optional marketplace browse; 100 explicitly flags ai-router gap.
- **Stability:** Postgres-first design helps; **weak** on abuse handling and attribution correctness.
- **Alignment % with PRD:** ~**78%** (see scorecard).
- **Missing critical capabilities:** Sponsor dashboard (052), five AI fns (054), chat integration (067), attribution hardening, observability pack, marketplace slice (070–075) for two-sided discovery.

### B. Technical correctness

- **Relations:** `sponsor.*` FKs to `events`, `auth.users` are coherent; contracts extension (055) fits.
- **APIs:** Checkout should enforce idempotency keys (Stripe) and idempotent webhook handling — verify in `sponsor-payment-webhook` beyond docs.
- **Concurrency:** `approve_sponsor_application` uses `FOR UPDATE` in 047 — good direction; contract duplicate approve race handled in 056 narrative.
- **Dependencies:** Gemini via existing `_shared/gemini.ts` — consistent with repo patterns.
- **Incorrect / risky:** `ON CONFLICT DO NOTHING` without unique business key; 100 Part 10 SQL wrong table key; env var naming drift in 048 vs implementation.

### C. Production readiness

- **Scale:** Raw impression table grows fast — **partitioning/archival** not in tasks.
- **Observability:** `ai_runs` logging — insufficient alone; need webhook delivery metrics, placement activation lag, rollup duration.
- **Security:** RLS present; public write endpoints are the main attack surface.
- **Testing:** 104 lists tests; treat as **target list** until CI proves them.
- **Readiness %:** ~**55%**.

### D. Execution reality

- **Order:** 053 before 052 is correct; 054 parallel to 052 possible; **chat should follow dashboard** so tools return real ROI.
- **Timeline:** 104’s week-3 marketplace is **heroic** without dedicated FE + migrations; **06–08 week realistic** for MVP+ if scoped.
- **Will it ship?** **MVP core: likely already shipping**; **full vision: partial** without headcount cut to 100 Part 5.

### E. Improvements (high impact)

1. **Add `UNIQUE` constraint** on attributions for idempotency (e.g. `event_order_id` if added, or `click_id` where one conversion per click).
2. **Denormalize `application_id` into `roi_daily`** OR document mandatory joins for all dashboards and AI fns.
3. **Signed placement token** for beacons (short TTL) instead of fully public `placement_id` posts.
4. **Ship 052 + 067 first** — faster path to retention and inbound than 070–075.
5. **Freeze Phase 3** (062–064) until **5 paying sponsors** — matches 100/104 gates; reduces Paperclip/OpenClaw tax.
6. **Single source of truth** doc: fix 100 Part 10 SQL, fix 048 env names, mark task frontmatter statuses to match git.

---

## 8. Repo verification notes (spot-check)

| Check | Result |
|---|---|
| `supabase/migrations/20260504140000_sponsor_schema.sql` | `sponsor.roi_daily` PK `(placement_id, day)` |
| `supabase/migrations/20260504081937_sponsor-attribution-trigger.sql` | Trigger on `event_orders`; adds `buyer_anon_id` if missing; wrapped exception |
| `supabase/migrations/20260504082006_sponsor-roi-rollup-cron.sql` | `rollup_roi_daily()` + pg_cron present |
| `supabase/functions/sponsor-*` | **8** functions; **no** `sponsor-roi-explain`, `sponsor-moderate`, etc. |
| `supabase/functions/ai-router` | **No** sponsor intent patterns found (grep) |
| `src/App.tsx` | **No** `/sponsor/dashboard` route found (grep) |

---

## 9. Recommended fixes (priority ordered)

1. **Verify Stripe** end-to-end (test mode + webhook replay); document exact secret names from code.
2. **Fix attribution**: add business unique key + `ON CONFLICT (…) DO NOTHING` or upsert pattern; add migration test.
3. **Ship Task 052** with queries: `roi_daily` ⋈ `placements` ⋈ `applications` for org ownership.
4. **Ship Task 067** (ai-router + ai-chat tools); tools must use **real table names** (`public.events`, not `sponsor.packages` unless that table exists).
5. **Correct 100-sponsorship-system.md Part 10** ROI SQL to match `(placement_id, day)` or add a view `sponsor.roi_daily_by_application`.
6. **Rate-limit + monitor** impression/click functions; add daily row-count alerts.
7. **Triage 060–064** to Phase 3+ only; merge 059/064 schema conflicts per 104 §6 before building campaigns.
8. **Add E2E gate**: apply → pay → sign → one impression → one rollup row → dashboard tile > 0.

---

## 10. Per-file audit register

Each row set lists **errors** (spec/code mismatches or factual mistakes), **blockers** (prevents launch or misleads implementers), **failure points** (runtime / product break scenarios), **corrections** (what to change). Empty fields mean none flagged beyond global issues above.

Path prefix: `tasks/events/prompts/sponsor/` unless noted.

### 045 — `045-sponsor-schema-migration.md`

| Category | Details |
|---|---|
| **Errors** | Frontmatter `status: Open` conflicts with shipped migration `20260504140000_sponsor_schema.sql`. RLS snippet grants `INSERT` on `sponsor.applications` but **no `UPDATE` policy** for org-owned rows — wizard/admin status changes may require service role or added policy (verify against follow-up migrations). |
| **Blockers** | None if later migrations added `UPDATE` for applications / full policy set; **audit `sponsor-security-rls-fixes.sql`** before trusting this doc alone. |
| **Failure points** | Missing FK indexes on high-traffic cols → slow dashboard queries; `GRANT … ALL TABLES` patterns can accidentally widen scope on new tables. |
| **Corrections** | Sync YAML `status` with repo; add explicit **UPDATE** policies for `sponsor.applications` in doc or cite follow-up migration; document `tier` / `activation_type` enums as single source for 046/047. |

### 046 — `046-sponsor-apply-wizard.md`

| Category | Details |
|---|---|
| **Errors** | Step 4 says **“Proceed to payment” → `sponsor-checkout`**. Code requires `applications.status === 'approved'` (`sponsor-checkout/index.ts`). A linear 4-step wizard **cannot** charge immediately after submit without approval — flow is **submit → admin approve → pay** (or separate “Pay now” deep link after approval). |
| **Blockers** | Mis-implemented UX strands sponsors on checkout error after submit; product copy must split **submit** vs **pay after approval**. |
| **Failure points** | Draft in `sessionStorage` only → lost across devices; unauthenticated draft persistence unclear vs RLS. |
| **Corrections** | Rewrite Step 4: “Submit application” + email; add Step 5 or post-approval route **“Complete payment”** when `status=approved`; align edge contract with real checkout gate. |

### 047 — `047-sponsor-admin-queue.md`

| Category | Details |
|---|---|
| **Errors** | Embedded SQL `GRANT EXECUTE … TO service_role` only; **repo superseded** by migrations granting **`authenticated`** + admin guard (`sponsor-security-rls-fixes.sql`, `sponsor-h2-h3-contracts.sql`). Placement `INSERT` in early spec may omit columns added in H2 migration (activation-aware surfaces). |
| **Blockers** | None if implementers read latest migration, not task snippet alone. |
| **Failure points** | Double-approve races (mitigated if RPC idempotent); **Request Changes** writing to `campaign_goals.admin_notes` — validate JSON merge, not overwrite. |
| **Corrections** | Replace RPC block with **pointer to latest migration file**; document admin auth (`useAdminAuth`) vs RPC `SECURITY DEFINER` expectations. |

### 048 — `048-sponsor-stripe-checkout.md`

| Category | Details |
|---|---|
| **Errors** | Env var **`STRIPE_WEBHOOK_SECRET`** in doc; production code uses **`STRIPE_SPONSOR_WEBHOOK_SECRET`** (`sponsor-payment-webhook/index.ts`). |
| **Blockers** | Wrong secret name → signature verification disabled or fails → payments not activating. |
| **Failure points** | Webhook retries + partial DB commit; duplicate activation if webhook handler not idempotent; **contract gate** must align with 055/057 (see 104 workflow H). |
| **Corrections** | Replace env section with code-accurate names; add checklist: Stripe Dashboard endpoint URL + signing secret per env; document `FRONTEND_URL` / success URLs. |

### 049 — `049-sponsor-surface-component.md`

| Category | Details |
|---|---|
| **Errors** | `useSponsorPlacements` implies client-side **weighted pick** after fetch — if query returns **all** competing placements, exposes competitive info; prefer server-side rotation or single picked row. |
| **Blockers** | None for MVP if query returns one row or placements are non-sensitive. |
| **Failure points** | Impression **double-fire** on React Strict Mode remount if not guarded; stale cache vs `staleTime` mismatch. |
| **Corrections** | Specify dedupe (`useRef` / once-per-placement-session); consider **edge fn “pick placement”** for weights + privacy. |

### 050 — `050-sponsor-impression-click-edge-fns.md`

| Category | Details |
|---|---|
| **Errors** | “Never return 5xx” on impression conflicts with rate-limit **429** (still client-visible); clarify 429 is intentional. |
| **Blockers** | None. |
| **Failure points** | Public POST → **fraud / cost**; IP hash + rate limits bypassable via distributed bots; **no auth** on clicks → inflated CTR. |
| **Corrections** | Add optional **signed beacon token**; cap per `placement_id`/day; monitor row growth + alert. |

### 051 — `051-sponsor-attribution-trigger.md`

| Category | Details |
|---|---|
| **Errors** | **`ON CONFLICT DO NOTHING`** without a **unique business key** on `sponsor.attributions` — duplicates possible (see §3). |
| **Blockers** | **Trust in ROI** and disputes until fixed. |
| **Failure points** | **`buyer_anon_id`** not propagated from front-end → silent miss; anon→auth upgrade **not implemented** (doc admits gap); trigger on **`event_orders` only** → other payment paths skip attribution. |
| **Corrections** | Add `UNIQUE(event_order_id)` or `UNIQUE(click_id)` (choose one model); backfill test; document ticket funnel must write `buyer_anon_id`; add order-line idempotency. |

### 052 — `052-sponsor-dashboard.md`

| Category | Details |
|---|---|
| **Errors** | Tiles reference **“top surface by CTR”** from `roi_daily` — table has **no `surface`**; must aggregate via **`placements.surface` join**. **Realtime** on `roi_daily` may need `REPLICA IDENTITY` / publication config — not specified. |
| **Blockers** | Route **`/sponsor/dashboard`** not in `App.tsx` (spot-check) → PRD P0 unmet. |
| **Failure points** | 054 **`sponsor-asset-upload`** referenced but not in standard 054 list — dependency mismatch; over-stating “real-time” if cron is 5 min. |
| **Corrections** | Define query shapes explicitly; add `application_id` rollup view optional; verify Realtime enabled on `sponsor.roi_daily`; ship minimal tiles first. |

### 053 — `053-sponsor-roi-rollup-cron.md`

| Category | Details |
|---|---|
| **Errors** | Rollup aggregates **full `CURRENT_DATE`** each run — O(day volume) per placement; fine early, **hot spot** at scale; cron name `'*/5 * * * *'` vs 100 “daily Bogotá” for **AI** — different jobs, easy to confuse. |
| **Blockers** | None for MVP scale. |
| **Failure points** | Long-running txn **locks** `roi_daily`; partial failure mid-batch; clock/timezone **day boundary** vs Bogotá reporting. |
| **Corrections** | Document timezone (`day` UTC vs America/Bogota); add **incremental** rollup migration path; EXPLAIN budget in runbook. |

### 054 — `054-sponsor-ai-edge-fns.md`

| Category | Details |
|---|---|
| **Errors** | **`sponsor-roi-explain` cron** in prose — **no `pg_cron` → HTTP** pattern specified (Secret anon JWT? service role? invoke constraints). Model mix: table says Flash for optimize; earlier lines say Pro for optimize — **inconsistent**. |
| **Blockers** | **Not deployed** in repo (no `sponsor-moderate`, etc. under `supabase/functions/`). |
| **Failure points** | Gemini timeout, URL-context fetch failures, **cost spikes**; `sponsor-moderate` **service_role only** vs sponsor upload UX (who triggers?). |
| **Corrections** | Pick **one** model per fn; add **invocation auth** matrix; implement Phase A (moderate, roi-explain, creative-gen) first; align 052’s asset upload fn name with real implementation. |

### 055 — `055-sponsor-contracts-schema.md`

| Category | Details |
|---|---|
| **Errors** | `approval_gates` / placement cron in 058 references must match **actual** `sponsor-placement-scheduler` or payment webhook — single source for **`active=true`**. |
| **Blockers** | If migration missing, contract gate **never wired**. |
| **Failure points** | **Organizer** `organizer_user_id` = `approved_by` assumption in 056 — wrong if approver isn’t event owner. |
| **Corrections** | Derive organizer from **`events` host** row; document status enum vs app code; migration order: 055 before 056/057. |

### 056 — `056-sponsor-contract-generate-edge-fn.md`

| Category | Details |
|---|---|
| **Errors** | PDF approach vague (“`Deno.writeTextFile` + pdf”) — **not copy-paste ready**; email via Infobip **pattern** not exact. |
| **Blockers** | None once implemented; **bucket `contracts`** policy must exist. |
| **Failure points** | **Duplicate approves** (idempotent return ok); large PDF memory on Deno; PII in logs. |
| **Corrections** | Standardize on **`pdf-lib`** or HTML-only v1; add idempotency test; never log full NIT/email. |

### 057 — `057-sponsor-contract-sign-page.md`

| Category | Details |
|---|---|
| **Errors** | “Links to `/sponsor/dashboard/:appId`” — **dashboard route may not exist** yet. |
| **Blockers** | Broken post-sign CTA until 052 ships. |
| **Failure points** | **iframe** PDF blocked by CSP/X-Frame; signed URL expiry mid-session; double-submit race. |
| **Corrections** | Add blob download fallback; renew signed URL on timer; handle **already signed** UX. |

### 058 — `058-sponsor-dispute-ui.md`

| Category | Details |
|---|---|
| **Errors** | **`dispute_freeze`** exists in repo (`20260504260000_sponsor-applications-dispute-freeze.sql`) — task text predates migration; **rollup** (`053`) and **dashboard** must still **skip or label frozen** periods (not auto-described in task). |
| **Blockers** | Specified freeze behavior **incomplete** vs cron + reporting UX. |
| **Failure points** | **Stripe partial refund** + invoice state machine divergence; sponsor self-serve cancel **JWT** vs admin **service_role** paths. |
| **Corrections** | Document **freeze semantics** in `rollup_roi_daily` + admin UI badges; document refund idempotency keys. |

### 060 — `060-sponsor-discovery-qualification-module.md`

| Category | Details |
|---|---|
| **Errors** | Large **new schema** overlaps **104 Part 6** (`sponsor_discovery.*`) with **different column names** (`website` vs `website_url`, float vs int scores) — merge required before build. |
| **Blockers** | **Depends on 052 + 054** — discovery before sponsor ROI maturity is **priority inversion** for V1. |
| **Failure points** | **UNIQUE(website)** + bad data → ingestion failures; LinkedIn/IG **TOS**; PII retention vs Ley 1581. |
| **Corrections** | Align with **104 Task 076** schema; ship **manual CSV prospect** first; defer auto-enrichment until 5+ sponsors. |

### 061 — `061-sponsor-activations-plan.md`

| Category | Details |
|---|---|
| **Errors** | References **n8n** / complex orchestration — **104** says prefer **pg_cron + edge**; treat as product catalog, not implementation checklist. |
| **Blockers** | None (design reference). |
| **Failure points** | **Scope creep** if engineering chases 34 types before revenue. |
| **Corrections** | Tag sections **Phase 3+**; map each activation to **one** measurable column (`surface` / UTM) before building. |

### 062 — `062-openclaw-hermes-paperclip-sponsorship-system.md`

| Category | Details |
|---|---|
| **Errors** | Positions OpenClaw as **browser scrape + orchestration**; **100** corrects to **messaging-only** + Firecrawl standalone — docs **contradict**. **n8n** / three-layer **24/7** ops unrealistic for current team without SRE. |
| **Blockers** | **Paperclip + Hermes + OpenClaw** all required in doc — **no mvp path** without local gateways. |
| **Failure points** | Single laptop off → **pipeline dead**; secret sprawl; **wrong legal entity** for outbound WA. |
| **Corrections** | Reconcile with **100 Part 2**; replace with **human approval + Infobip** for V1; keep 062 as **Phase 6** vision only. |

### 063 — `063-openclaw-sponsor-discovery-engine.md`

| Category | Details |
|---|---|
| **Errors** | **LinkedIn / login scraping**, PhantomBuster volume — **100 Part 7** says avoid; **104** says API-only — still **vendor risk**. |
| **Blockers** | None for design-only; **execution** blocked by compliance review. |
| **Failure points** | Account bans; **stale** Apify actors; cost **overruns** (`enrichment_jobs.cost_usd`). |
| **Corrections** | Default to **public signal** pipeline (event sponsor pages, news); gate LinkedIn behind legal sign-off. |

### 064 — `064-postiz-openclaw-campaign-system.md`

| Category | Details |
|---|---|
| **Errors** | **`Cloudinary`** for assets — **102** says **Supabase Storage** only; **Composio** adds third-party dependency not in core repo. |
| **Blockers** | Schema **`marketing.*` vs Task 059/064** naming — **104 §6** merge required before coding. |
| **Failure points** | Postiz **API drift**; auto-publish without human gate → brand/legal incidents. |
| **Corrections** | Swap Cloudinary → **Storage**; enforce **human approve** before schedule; implement **070 unified migration** first. |

### 100 — `100-sponsorship-system.md`

| Category | Details |
|---|---|
| **Errors** | **Part 10 ROI SQL**: `sponsor.roi_daily (application_id, …)` / joins to `bookings` — **not** deployed shape (**`placement_id`, `day`**, attributions keyed by placement). **Chat tools**: `.from('sponsor.packages')` — **table doesn’t exist**; use **`events` + applications** or real packages table. |
| **Blockers** | Engineers copying Part 10 SQL **break production queries**. |
| **Failure points** | Stale task table **045–058** toggles confuse PMs. |
| **Corrections** | Rewrite Part 10 against **`20260504140000_sponsor_schema.sql`**; fix tool examples to **`public.events`**; add “last verified against commit …”. |

### 101 — `101-marketplace-strategy.md`

| Category | Details |
|---|---|
| **Errors** | MVP checklist marks items ✅ **“done”** — depends on **branch/deploy truth**; **dashboard ❌** still accurate; some ✅ may be optimistic without E2E proof. |
| **Blockers** | None for strategy doc; **execution** blocked by 052/070–075. |
| **Failure points** | **Cold start** — no events/brands listed → empty marketplace. |
| **Corrections** | Add **verification column** (link to test or PR); seed **5 Medellín events** per 104. |

### 102 — `102-marketplace-corrections.md`

| Category | Details |
|---|---|
| **Errors** | None material — acts as **authority** on Anvara/Covent and **Supabase not Cloudinary**. |
| **Blockers** | None. |
| **Failure points** | Teams still reading **101 first draft** in old notes. |
| **Corrections** | Link **102** from 064/notes-sponsor-outreach headers as **“corrections supersede”**. |

### 103 — `103-sponsorflo-feature-analysis.md`

| Category | Details |
|---|---|
| **Errors** | Competitive **feature matrix → mdeai** is Roadmap-heavy; some cells **speculative** (“✅ planned”). |
| **Blockers** | None. |
| **Failure points** | **Scope envy** — building SponsorFlo parity before revenue. |
| **Corrections** | Tag each feature with **task ID + status**; use 103 for **ideas**, not sprint commitments. |

### 104 — `104-master-implementation-plan.md`

| Category | Details |
|---|---|
| **Errors** | **Task renumbering 065+** vs README still **052/054** — dual numbering confuses grep. **phantom tasks** 065–096 not files yet. Some **Flash vs Pro** for AI fns differ from **054/100**. |
| **Blockers** | **Marketing schema merge (059 vs 064)** must happen before campaign build. |
| **Failure points** | **30-day marketplace** slip cascades; **Hermes HTTP** dependency undefined in prod. |
| **Corrections** | Single **task register** table in README with **one** ID scheme; add **dependency graph** image link; downscope Week 3 if FE capacity < 1 FTE. |

### `notes-activation-types.md`

| Category | Details |
|---|---|
| **Errors** | None — **reference** list; duplicates **061** themes. |
| **Blockers** | None. |
| **Failure points** | Used as **implementation checklist** by mistake. |
| **Corrections** | Header: **“Ideas only — see 061 + surface enum in 045.”** |

### `notes-Sponsor Discovery Engine.md`

| Category | Details |
|---|---|
| **Errors** | **LinkedIn login / browser automation** prominence conflicts **100 Part 7** “no LinkedIn scraping.” |
| **Blockers** | Legal review before any automation. |
| **Failure points** | **Paperclip-style orchestrator** not built — doc reads executable but isn’t. |
| **Corrections** | Mark **superseded by 063 + 100 Part 7**; strikethrough browser-login paths or move to **R&D**. |

### `notes-sponsor-outreach.md`

| Category | Details |
|---|---|
| **Errors** | **Cloudinary** + OpenClaw as **proposal author** — **102** says Storage; **100** says Hermes writes, OpenClaw sends. |
| **Blockers** | None if treated as draft narrative. |
| **Failure points** | **WA template** compliance (STOP, identidad) — doc partial vs **100 Part 8**. |
| **Corrections** | Replace Cloudinary → **Supabase Storage**; add **Ley 1581** boilerplate from 100. |

### `notes-sponsor-research.md`

| Category | Details |
|---|---|
| **Errors** | Comparison table: **“Impressions / clicks / CTR dashboard ✅”** for mdeai — **dashboard UI** not shipped; **partial** at best (data layer exists). |
| **Blockers** | Mis-prioritization if exec reads only this file. |
| **Failure points** | URLs / features **age** quickly (competitor sites change). |
| **Corrections** | Footnote: **data ✅ / sponsor-facing dashboard ❌**; point to **101/102** for corrected tables. |

---

*End of audit. Update this file when Task 052/067/054 ship, when attribution uniqueness migration lands, and when per-file YAML statuses match the repo.*
