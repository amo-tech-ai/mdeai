# Forensic audit — `tasks/events/prompts`

**Auditor role:** Senior software specialist / forensic documentation QA  
**Scope:** All 25 files under `tasks/events/prompts/` (000-index + 001–024), cross-checked against `000-index.md`, `supabase/migrations/20260404044720_remote_schema.sql` (`public.events`), and repo edge-function reality.  
**Audit date:** 2026-05-03  
**Prior state of this file:** empty (this document is the verified audit artifact).

---

## Executive summary

The prompt pack is **strong on product narrative, acceptance criteria, and traceability** (PRD → diagrams → tasks). It is **not yet safe to implement verbatim** without resolving **schema gaps**, **Stripe/webhook data-path bugs**, **auth mis-modeling for staff JWT**, **stale cross-references** after renumbering, and **Phase 2 dependency ordering** contradictions.

**Overall score — “implementation-ready / internally correct”:** **~68%**  
(Weighted: technical correctness of critical paths 55%, consistency 52%, structure/governance 88%, security posture 70%.)

---

## What is correct (keep)

- **Phase 1 split** in `000-index.md` aligns with the May 2 “events + tickets first” decision; critical path diagram is clear.
- **001** correctly treats `public.events` as existing and additive; columns referenced in downstream SQL (`event_start_time`, `event_end_time`, `address`) **exist** in current migrations.
- **Concurrency story** for oversell (advisory lock + `FOR UPDATE` in checkout RPC, single-use QR via `UPDATE … WHERE qr_used_at IS NULL`) is directionally right.
- **Idempotency** called out for Stripe webhooks and checkout (`idempotency_keys`) matches production Stripe behavior.
- **RLS-first framing** and service-role-only writes for money paths match repo conventions.
- **`verify_jwt = false`** called out for Stripe webhooks in **005** is correct; many teams miss this.
- **007** honestly documents the offline JWT limitation (HS256 vs asymmetric) — good risk disclosure.

---

## Critical blockers (fix before coding)

### B1 — Stripe Checkout metadata vs webhook pseudo-code (005 + 004)

**004** puts `attendees` on **Checkout Session** `metadata`, and only `order_id` on `payment_intent_data.metadata`.

**005** reads `pi.metadata.attendees` and `pi.metadata.buyer_email` from the **PaymentIntent**.

Unless you also copy session metadata onto the PaymentIntent at completion time, **`attendees` and possibly buyer email will be missing** on `payment_intent.succeeded`. That breaks attendee row creation and email delivery.

**Fix:** In checkout session creation, put all webhook-needed fields on `payment_intent_data.metadata` (and/or load `order_id` in webhook and read attendees from DB if stored at checkout time). Reconcile with Stripe’s metadata size limits.

### B2 — `ticket_payment_finalize` picks the wrong ticket (005 SQL)

The draft SQL selects “first ticket by `position`” instead of the **ticket actually purchased** (`event_orders` has no `ticket_id`; checkout knows `ticket_id`).

**Fix:** Persist `ticket_id` (and quantity) on `event_orders` at pending-create time, or pass `ticket_id` into the finalize RPC from verified PI metadata.

### B3 — Schema drift: columns referenced but not in 001 migration

- **005** updates `event_orders.stripe_payment_intent` — **not defined** in **001**’s `event_orders` DDL (`stripe_session_id` only).
- **003** “Revoke staff link” needs **`staff_link_version`** (or equivalent) on `public.events` — **not in 001**.

**Fix:** Extend **001** (or a tight follow-up migration) before treating **005** / **003** as buildable.

### B4 — Staff JWT + `verify_jwt = true` on `ticket-validate` (006)

**006** wiring plan says `verify_jwt = true` in `config.toml`. Supabase’s JWT verification expects a **Supabase-issued** user JWT, not a **custom** `HS256` staff token from the dashboard.

**Fix:** Set **`verify_jwt = false`** for `ticket-validate` and validate the staff token in-function (or use a Supabase-custom-claims pattern that matches platform auth). Do **not** conflate “Bearer token present” with built-in gateway verification.

### B5 — Phase 2 task order vs `depends_on` (011)

**011** lists `depends_on: [010, 015, 016]` while **000-index** presents **015** and **016** *after* **011** in the task table.

That is a **schedule contradiction**: you cannot merge “vote-cast complete” before Turnstile + phone OTP unless you stub those layers.

**Fix:** Reorder the Phase 2 task table to a **topological** order, or split **011** into “scaffold” vs “production-hardened” milestones with explicit feature flags.

---

## High-severity issues (red flags)

### R1 — Stale task IDs after renumbering (throughout)

Examples:

| Location | Says | Should be |
|----------|------|-----------|
| **001** Summary | “tasks 101–107” | **001–009** (or remove) |
| **003** Description | “schema in task 100” | **001** |
| **004** Description | “webhook (task 104)” | **005** |
| **006** | “dashboard task 102”, “jwt task 104”, “PWA task 106” | **003**, **005**, **007** |
| **009** | “task 101”, “Tasks 100, 101, 103” | **002**, **001**, **004** |

**Risk:** Engineers wire wrong prompts, skip dependencies, or trust wrong “source of truth” paragraph.

### R2 — Phase labeling stale in Phase 2 prompts (010–024)

**000-index** admits `phase: CORE` should be `PHASE-2-CONTESTS`. **010** text still claims **“Phase 1 release blocker”** and **“mdeai has 28 tables”** / **no voting** — conflicting with the locked **Phase 1 = tickets MVP** story.

**010** also references **`event.events`** / Phase 3 FK language that does not match this repo’s **`public.events`**.

### R3 — RLS + “anonymous orders” story incomplete (001 + 008)

**001** RLS for `event_orders` SELECT is `buyer_user_id = uid()` OR organizer. **Anonymous** buyers have `buyer_user_id` NULL — they **do not** see their order via normal RLS unless you add **email-based hash**, **magic link claim**, or **server-only reads**.

**008** assumes magic-link JWT for attendees — good — but **dashboard reconciliation** (“my orders”) must not assume anon RLS works without extra design.

### R4 — Dual path: finalize RPC vs JS attendee insert (005)

Pseudo-code calls `ticket_payment_finalize` then `insert(attendeeRows)` in JS. If finalize increments `qty_sold` but insert fails, you are **inconsistent** unless wrapped in one DB transaction (edge fn cannot easily hold that without DB chaining).

**Fix:** Single **SECURITY DEFINER** RPC: finalize payment + insert attendees + return minted IDs; or insert attendees inside finalize.

### R5 — Refund snippet references nonexistent Stripe fields (005)

`charge.payment_intent_metadata` is not a real Stripe API shape for retrieving `order_id`.

**Fix:** Use `payment_intent` expansion / `metadata` on the PI or lookup order by stored Stripe IDs.

### R6 — QR JWT payload vs DB (005)

`signJWT({ attendee_id: crypto.randomUUID(), ... })` generates an **ad-hoc** ID not equal to `event_attendees.id`. **006** consumes `qr_token` string and looks up by DB column — OK — but PDF/email and audit trails must not assume `attendee_id` in JWT matches row UUID unless you align them.

**Fix:** Mint attendee rows first (in DB), then sign JWT including **`attendee.id`**.

### R7 — `pg_advisory_xact_lock(hashtext(uuid))` (004)

Rare hash collisions could theoretically serialize unrelated events together. Low probability but worth documenting; alternative: 64-bit lock keys from `uuid` bytes.

---

## Medium issues

- **002** “photo moderation via `listing-moderate`”: that function exists but is **landlord/listing-oriented**; scope creep risk unless you generalize or add `event-photos` moderation contract.
- **003** staff link signed with **Supabase JWT secret**: works but couples door-staff compromise surface to **project auth secret**; prefer dedicated secret + short TTL + rotation story.
- **006** returns `invalid_signature` when **no DB row** for token — wrong semantic for operators (should distinguish “unknown token” vs “bad sig”).
- **007** assumes **Lighthouse PWA ≥ 90**; camera + fullscreen scanner UIs often fight PWA audits — treat as **aspirational** or narrow to “installable + offline shell”.
- **009** priority **P1** while Phase 1 index lists it in the 9 tasks — clarify whether it is **launch-gated** or **fast-follow**.

---

## Best-practice checklist (verified against prompts)

| Practice | Status |
|---------|--------|
| Explicit acceptance criteria | ✅ Strong |
| Dependency graph | ⚠️ Phase 2 table order wrong vs **011** `depends_on` |
| Idempotency (Stripe + checkout) | ✅ Called out; **metadata path must be fixed** |
| RLS default-deny for money tables | ✅ Intent good; **anon buyer read path incomplete** |
| Single-transaction inventory + payment state | ⚠️ Split across fn + RPC; needs one-DB-transaction pattern |
| Webhook signature verification | ✅ |
| No secret in client | ⚠️ Staff JWT in URL query — XSS/history leakage; prefer POST + short-lived cookie or one-time exchange |
| Align prompts after renumbering | ❌ Many stale refs |

---

## Critical fixes (prioritized backlog)

1. **Unify Stripe metadata contract** between **004** and **005**; add missing `event_orders` columns (**B3** + `ticket_id`).
2. **Rewrite `ticket_payment_finalize`** to use persisted `ticket_id` / line items (**B2**).
3. **Collapse finalize + attendee insert** into one transactional RPC (**R4** + **R6**).
4. **Fix `ticket-validate` JWT verification strategy** (**B4**).
5. **Reorder or restate Phase 2 dependencies** (**B5**).
6. **Batch-replace stale task numbers** (**R1**) and run a link check on `See also` paths.
7. **Align **010** narrative** with Phase 2 + `public.events` naming (**R2**).
8. **Specify anon ticket visibility** (RLS or server-only) (**R3**).

---

## Percent correct — how scored

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Traceability & structure | 25% | 90% | Index, diagrams, ACs Excellent |
| Cross-doc consistency | 20% | 50% | Renumbering + Phase language drift |
| Transactional correctness | 25% | 55% | Webhook + finalize + ticket join gaps |
| Security & auth modeling | 20% | 65% | Staff JWT / verify_jwt / URL token leakage |
| Operability (monitoring, rollback) | 10% | 75% | Good failure notes; email failure table TBD |

**Weighted composite:** **~68%** — **strong planning artifact**, **needs engineering hardening** on payment path and auth before implementation.

---

## Sign-off criteria (re-audit)

Re-run this audit after:

- [ ] Single end-to-end trace: **checkout session fields → PI metadata → webhook handler → DB state** documented in one subsection of **005**.
- [ ] `event_orders` DDL includes `ticket_id`, `stripe_payment_intent` (or equivalent), and optional `line_items jsonb`.
- [ ] `ticket-validate` auth approach matches `config.toml` reality.
- [ ] Phase 2 index sorted by DAG; **011** `depends_on` matches table order.
- [ ] Grep passes for obsolete strings: `101–107`, `task 100`, `task 101`, `task 102`, `task 103`, `task 104`, `task 106`, `Phase 1 release blocker` inside **010**.

---

## References (repo paths)

- Prompt index: `tasks/events/prompts/000-index.md`
- Existing `public.events` shape: `supabase/migrations/20260404044720_remote_schema.sql` (~L1472)
- Landlord moderation (generic reuse risk): `supabase/functions/listing-moderate/index.ts`
