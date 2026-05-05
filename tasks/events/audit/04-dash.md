## Review: `003-host-event-dashboard.md`

Overall the prompt is **coherent** (3-panel layout, KPIs, Realtime, staff JWT + **034**, revoke via `staff_link_version`). **`depends_on` includes 034**, which matches the audit fix. Below are **grounded improvements** from the schema and **`App.tsx`** today.

---

### Critical / product mismatches

1. **Public URL vs real routes**  
   The doc uses `https://mdeai.co/event/:slug`, but routing today is **`/events/:id`** (`EventDetail`), keyed by **id**, not slug.  
   **Improve:** Either define “copy link” as **`/events/{event.id}`** until slug routes exist, or add an explicit task: **redirect `/events/slug-…` → row** (or dedicated `/e/:slug`).

2. **`organizer_id` vs `auth.uid()`**  
   Same as **002**: DB FK is **`profiles(id)`**. State access as “only the profile UUID that owns the event (typically `auth.uid()` when `profiles.id` matches).”

3. **Stripe “Open in Stripe”**  
   You need a **stable link**: e.g. **`event_orders.stripe_payment_intent`**, **`payments.stripe_payment_intent_id`**, or Dashboard deep links to **Customer / PaymentIntent**.  
   **Improve:** One bullet in wiring: “derive URL from `payments` row joined via `event_orders.payment_id` (when present).”

---

### Data / KPI correctness

4. **`event_check_ins` is unused**  
   **001** adds an audit table; the dashboard only talks about **orders/attendees**.  
   **Improve (optional P1):** Small “**Recent check-ins**” or “**Failed scans (24h)**” from `event_check_ins` — differentiates you from a bare admin grid.

5. **Order statuses**  
   If **`partial_refund`** exists, **revenue** and **“tickets sold”** rules should say whether partial refunds **reduce revenue** / **mark attendees** (even if “full spec in 026”).

6. **Per-tier “Sold”**  
   Define sold as **`event_attendees.status = 'active'`** (or `paid`-backed only), consistent with KPI 1, so **pending** lines don’t inflate tiers.

---

### Realtime / Supabase ops

7. **Realtime isn’t “free”**  
   **`postgres_changes`** on **`event_orders` / `event_attendees`** needs **publication** (and often **replica identity FULL** for old→new on UPDATE-heavy paths).  
   **Improve:** Acceptance criterion or wiring step: **“Confirm tables in `supabase_realtime` publication; verify UPDATE on `qr_used_at` delivers payload.”**

8. **Filter shape**  
   Say whether you filter by **`event_id` in the channel filter** or use **RLS-scoped** topics — avoids implementer guesswork.

---

### Performance / scale

9. **“<2s on 4G with 500 rows”**  
   Feasible if the **first paint** is KPIs + **paginated** attendees; loading **500 rows into the client** defeats that.  
   **Improve:** Clarify “**initial load: page 1 only**; total count via `count` query or header aggregate.”

10. **Search “server-side ILIKE”**  
    For growth, note **`pg_trgm` / index** on `(event_id, lower(email))` etc.; **500 rows** is fine without it.

---

### Staff link / security UX

11. **JWT in query string**  
    Still **referrer / log** leakage risk.  
    **Improve (hardening):** Short-lived **mint endpoint** that returns **POST-only** token, or document **“acceptable for P1; tighten in 1.5.”**

12. **Revoke implementation**  
    Migration exposes **`bump_staff_link_version(p_event_id)`** for **authenticated**.  
    **Improve:** Wire plan: **`supabase.rpc('bump_staff_link_version', { p_event_id })`** after verifying **RLS + GRANT** — don’t rely only on a generic “edge fn” if RPC is enough.

---

### Minor doc fixes

13. **`edge_function: null`** but **034** is an edge fn for minting — consider **`edge_function: event-staff-link-generator` (indirect)** or a note in Summary.

14. **`schema_tables`:** add **`event_check_ins`** if you add the audit strip; add **`public.payments`** if Stripe deep-link is in scope.

15. **Wiring:** **`Dashboard.tsx`** is the renter dashboard; **`pages/host/Dashboard.tsx`** is a better analogy for **host** chrome — point implementers there to match **host** layout.

---

### Summary

| Area            | Grade |
|----------------|-------|
| Structure / UX  | Strong |
| Alignment with **001** / **034** | Good |
| Alignment with **current routes** / Stripe | Needs tweaks |
| Realtime / scale clarity | Thin — worth tightening |

**Net:** use **`003` as-is for intent**, but patch **public URL**, **Stripe link**, **Realtime setup**, and **pagination vs 500-row claim** so implementation doesn’t ship wrong links or fragile subscriptions.