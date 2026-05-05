# Forensic audit #2 — `tasks/events/prompts` (order, gaps, per-task health)

**Role:** Senior software specialist / forensic auditor  
**Scope:** Entire prompt directory (45 `.md` files), with emphasis on **execution order**, **dependency integrity**, **`000-index.md` as control document**, and **cross-checks** against `supabase/migrations/20260404120005_p1_payments.sql` (`public.payments`).  
**Date:** 2026-05-03  
**Prior deliverable:** [`01-events-audit.md`](./01-events-audit.md) — still useful history; **this audit supersedes any claim that “all issues are fixed”** without repo verification.

---

## 1. Are tasks in the “correct order”?

**Filenames (001…044):** Numeric order is **not** intended to be strict build order. **`034` after `010`** is explicitly called out in `000-index.md` — that is acceptable if teams follow **topological** order.

**Verdict on Phase 1 (events + tickets):**  
The **topology in `000-index.md` §Phase 1 build order** is **mostly sane** (001 → parallel 002/004/034 → 005 → 006 → 007/008).  

**However**, several **`depends_on` frontmatter fields do not match the index** (see blockers below). Engineers sorting tasks by number or by `depends_on` alone will **ship in the wrong sequence**.

**Verdict on Phase 2 contests:**  
The **layered table** in `000-index.md` (L1→L4) is **more correct than numeric order** (011 before 015/016 in filenames).  

**But:** `011-vote-cast-edge-fn.md` **does not** list **`020-gemini-photo-moderation`** while the index claims 011 depends on 015+016+**020** — **documentation drift**.

**Verdict on Phase 1.5 vs Phase 2 events:**  
**Task `033` depends on `030`**, while `033` is **Phase 1.5** and `030` is **Phase 2 events**. If “Phase 1.5 ships right after Phase 1,” **`033` is blocked unless `030` runs first** — a **program-level ordering bug**.

---

## 2. Critical blockers (P0)

| ID | Finding | Impact |
|----|---------|--------|
| **B1** | `001` adds `event_orders.payment_id REFERENCES public.payments(id)` but **does not** migrate `public.payments` away from **`booking_id NOT NULL`**. Current ledger rows are **booking-scoped**; event ticket payments **cannot** be inserted legally without either altering `payments`, using a **dummy booking** (smell), or a **separate `event_payments` / generic ledger** table. | Revenue path **broken** or **unsafe** if implemented literally. |
| **B2** | `000-index.md` says **`006` depends on `034`**; **`006-ticket-validate-edge-fn.md`** `depends_on` is only `001`, `005` — **missing `034`**. | Project management and codegen that trust YAML will **under-order** staff-link work; integration risk. |
| **B3** | Index implies dashboard + validate integrate with **034**; **`003-host-event-dashboard.md`** `depends_on` has **no `034`**. | Same as B2 for dashboard/staff-link sequencing. |
| **B4** | **`033-event-photo-moderate-edge-fn.md`** → `depends_on: ['030-event-media-assets-schema']` while **033 = Phase 1.5** and **030 = Phase 2 events**. | **Phase 1.5 cannot execute** on the stated schedule without **reordering phases** or **changing 033’s dependency** (e.g. minimal `event_media_assets` in 001, or make 033 depend only on 001). |
| **B5** | `000-index.md` audit log claims **“all fixed”** vs [`01-events-audit.md`](./01-events-audit.md); **B1** and **B2/B3/B4** show that is **overstated**. | False confidence; audit debt compounds. |

---

## 3. High-severity red flags

- **`011` `phase: CORE`** while index standardizes on **`PHASE-2-CONTESTS`** for the contest pack — automation and reports that filter by `phase` will **miscount**.
- **`event_venues` RLS** in **001** draft: `venues_public_select … USING (true)` — **every venue row world-readable** (names, addresses, organizer linkage via `organizer_id` visible). For a marketplace that may be OK; for **draft/private venues** it is a **data-exposure** risk unless mitigated (e.g. `is_public` flag + policy tightening).
- **Index header** “**001–034** across 4 phases” — **035–044 exist** (venue track); doc is **stale** on scope.
- **Security DEFINER RPCs** in **001**: index acceptance gate demands **GRANT EXECUTE** lockdown — ensure **001** acceptance criteria and migration text **spell out** `REVOKE` from `PUBLIC` / `authenticated` and **grant only to `service_role`** where appropriate (prompt mentions advisor; implementation must match).

---

## 4. Failure modes & forensic gaps

| Area | Failure mode |
|------|----------------|
| **Stripe** | Checkout Session vs PaymentIntent **metadata** must stay symmetric across **004/005**; regression if only one path is updated. |
| **Anon buyers** | **001** introduces `access_token` + `get_anonymous_order` — **008** must consistently use that contract; any drift → “paid but can’t see ticket.” |
| **Staff JWT** | **034** + **006**: URL query token leakage (history, referrer, logs). Mitigation should be **short-lived exchange** or **POST** body pattern in hardening pass. |
| **Contest DAG** | **`014` before `011` in layer table** but **`012` depends `011`**, **`013` depends `012`** — good. **`020` not in `011` deps** — if L5 / moderation interacts with vote-cast, gap. |

---

## 5. What is missing (backlog)

1. **`ALTER public.payments`** (or successor design) **explicitly** in **001** or a **linked 001a** migration — **cannot skip**.  
2. **Align `depends_on`** for **003**, **006**with `000-index` topology (add **`034`** where index says so).  
3. **Resolve 033 ↔ 030** phase inversion: either **move 030 earlier**, **split `event_media_assets`**, or **drop 033 from Phase 1.5** until media schema exists.  
4. **Batch-flip** `phase: CORE` → `PHASE-2-CONTESTS` on **011–024** (or whatever convention is final) — **010** already flipped per index.  
5. **Update `000-index.md` scope line** to **001–044** (or “001–034 + 035–044 venue”).  
6. **Reconcile `011` deps** with index (**020**): add to YAML or remove from index.  
7. **Single source of truth**: either **generate** the build-order table from `depends_on` in CI, or **lint** YAML vs index.

---

## 6. Best-practice checklist (against prompts)

| Practice | Status |
|---------|--------|
| Topological build order documented | ✅ `000-index.md` |
| `depends_on` matches documentation | ❌ **003, 006, 011 vs index** |
| Phase labels consistent (`CORE` vs `PHASE-2-*`) | ⚠️ Many contest tasks still `CORE` |
| Money path grounded in real FKs | ❌ **`payments.booking_id` mismatch** |
| RLS + SECURITY DEFINER hygiene | ⚠️ Strong intent; verify **GRANT/REVOKE** in SQL |
| Idempotency + webhook signature called out | ✅ Phase 1 edge prompts |
| Explicit anon/guest auth path | ✅ **001** (access_token / RPC) — must ship with **008** |

---

## 7. Percent correct — by task

**Scale:** **100** = safe to implement as written with normal review; **70–90** = good spec with fixable gaps; **&lt;70** = blocking doc/schema mismatch or dependency bug.

| Task | Score | Rationale (abbrev.) |
|------|-------|---------------------|
| **000-index** | 72 | Strong topology; **stale “001–034”**; **overclaims “all fixed”**; **006/003/011 vs YAML drift** |
| **001** | 62 | Rich schema **+** RPCs **+** check-ins; **`payment_id → payments` without `payments` migration** = blocker; **`event_venues` world-SELECT** risk |
| **002** | 78 | Solid wizard; tie **033** timeline to **030** fix |
| **003** | 74 | Missing **`034` in `depends_on`** vs index |
| **004** | 80 | Concurrency/idempotency sound; verify Stripe metadata with **005** |
| **005** | 76 | Depends on **004** + **001** RPCs; validate single-RPC finalize pattern in file body |
| **006** | 82 | **verify_jwt false** documented; add **`034`** to deps for integrity |
| **007** | 80 | PWA/offline honest; perf audit as noted in prior review |
| **008** | 78 | Must match **001** anon contract end-to-end |
| **009** | 75 | P1 in phase — OK; tool-calling complexity |
| **010** | 78 | Schema foundation; verify **`public.events`** linkage vs old `event.events` text |
| **011** | 68 | **phase: CORE**; **missing `020` in deps** if index is right |
| **012** | 82 | Depends **011** — consistent |
| **013** | 84 | Depends **012** — consistent |
| **014** | 85 | Depends **010** only — OK if tally schema stable |
| **015** | 83 | Infra task — standard |
| **016** | 83 | Infra task — standard |
| **017** | 80 | `depends_on`: **011**, **014** — aligns with fraud path after vote-cast + tally |
| **018** | 78 | **010**, **020** — intake after schema + moderation |
| **019** | 78 | **010**, **020** — admin UI after schema + Gemini moderation |
| **020** | 80 | Gemini moderation — align with **011** dep claim in index |
| **021** | 75 | Parallel infra; ops-heavy |
| **022** | 82 | **010**, **014**, **021** — OpenClaw + schema + scoring |
| **023** | 80 | **022** — serial after broadcast skill (matches index intent) |
| **024** | 76 | **014** only — may under-spec inputs from **010/011** for live copy |
| **025** | 80 | Promo — needs **001/004** |
| **026** | 78 | Refunds — needs paid path live |
| **027** | 76 | Tax — needs checkout arithmetic clarity |
| **028** | 82 | Schema-only on **001** |
| **029** | 82 | Schema-only on **001** |
| **030** | 82 | Schema-only on **001** |
| **031** | 80 | Sponsor bridge — Phase 3 alignment |
| **032** | 82 | Attendee profiles |
| **033** | 55 | **Phase inversion with 030**; otherwise well-scoped |
| **034** | 85 | Small edge fn; ensure **003/006** list it as dep |
| **035** | 80 | Depends **001/002** — OK |
| **036** | 82 | Venue track |
| **037** | 83 | Depends **028** — OK |
| **038** | 82 | Availability |
| **039** | 78 | Heavy UI; many schema deps |
| **040** | 80 | Layouts |
| **041** | 82 | Booking + gist exclude |
| **042** | 78 | Analytics — depends **041/036/037** |
| **043** | 72 | AI — depends heavy prereqs |
| **044** | 78 | AI layout — depends **040** |

---

## 8. Aggregate scores

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| **Documentation / index coherence** | 25% | 68% | Topological good; YAML/index/scope drift |
| **Dependency DAG integrity** | 25% | 63% | **006/003/011/033** issues |
| **Schema & ledger correctness** | 30% | 60% | **`payments` blocker** dominates |
| **Security & RLS realism** | 20% | 74% | venue `SELECT true`, staff token UX |

**Weighted composite (repo readiness): ~66%**

---

## 9. Critical fixes (prioritized)

1. **Design `event_orders` ↔ ledger**: **`ALTER payments`** (nullable `booking_id` + `order_kind` / FK to `event_orders`) **or** new table — **document in** **001**.  
2. **`depends_on` patch**: **006** + **003** add **`034-event-staff-link-generator-edge-fn`**.  
3. **Fix 033 scheduling**: decouple from **030** or **move 030** before Phase 1.5.  
4. **011**: set **`phase: PHASE-2-CONTESTS`**; add **`020`** to `depends_on` **or** remove **020** from index.  
5. **Retire “all fixed”** language in **000-index** until a **CI checklist** passes (payments migration, dep lint).

---

## 10. Verification commands (read-only)

```bash
# Dependency lint idea — compare index to YAML (manual until scripted)
rg '^depends_on:' /home/sk/mde/tasks/events/prompts/*.md

# Payments reality check
rg -n 'booking_id' /home/sk/mde/supabase/migrations/20260404120005_p1_payments.sql
```

---

## 11. Sign-off for audit #3

Close **02** when: **`payments`** story is consistent in **001** + migrations; **003/006/011/033** YAML matches **000-index**; **000-index** header includes **035–044**; **`phase: CORE`** normalized for contest tasks.
