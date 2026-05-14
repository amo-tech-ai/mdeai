# Events & Ticketing Outcome Rubric

**When to run:** Diff touches any of:
- `supabase/migrations/*events*` or `*tickets*`
- `supabase/functions/ticket-payment-*`
- `src/components/*Scanner*`, `*QR*`, `*Ticket*`, `*Event*`
- The Phase 1 gate (run this rubric in full before unblocking Phase 2)

**max_iterations:** 8
**Modes:** Fast (criteria 1, 2 only — for non-payment edits like UI tweaks on event detail page) · **Full (default — criteria 1–10)** · Locked (Full + criteria 11, 12, 13 — Camila / Roberto / Lighthouse — required for Phase 1 gate).
**Prerequisites (external services — fails closed if unreachable):**
- Stripe **test mode**: `STRIPE_SECRET_KEY` (test) + either the `stripe` CLI (`stripe trigger checkout.session.completed`) OR a documented test-mode env (`STRIPE_WEBHOOK_VERIFY=false`) that bypasses signature verification for criterion 3's concurrent probe.
- Infobip sandbox: `INFOBIP_API_KEY` + a reachable test email/phone.
- Local Supabase: `supabase start` (criterion 9 RLS check).
- Preview build + dev server (criteria 11, 12 — Camila / Roberto E2E).

**Forbidden shortcuts:**
- Do NOT pass criterion 2 (webhook idempotency) by reading the function body. Require two real POSTs with the same `stripe_event_id` and a DB row count proving deduplication.
- Do NOT pass criterion 3 (atomic oversell guard) by reading a `SELECT FOR UPDATE` clause. Require the 50-concurrent-buyer probe output — a timestamp log showing concurrent attempts and the final `quantity_remaining` row.
- Do NOT pass criterion 5 (QR single-use) by reading code. Require two scan API calls with the same QR value and the response pair.
- Do NOT pass criterion 7 (Camila email) by reading the email-trigger logic. Require the Infobip request ID or equivalent delivery confirmation.

**Out of scope (do not grade):**
- Email template copy or visual design.
- Receipt PDF layout.
- Refund flows (separate rubric when built).
- Scanner PWA offline queue — deferred until explicitly in scope.

---

## Coverage checklist

### Stripe checkout

1. **Checkout creates a Stripe session.**
   Trigger the buy-ticket flow in preview for a test event.
   Run: `stripe sessions list --limit 1` (or paste the Stripe Dashboard session row).
   Paste JSON showing: `id` (starts with `cs_`), `amount_total` (matches event price in cents), `status: "open"` or `"complete"`.
   Fail if no session is created or the amount does not match.

2. **Webhook is idempotent — duplicate `stripe_event_id` creates exactly one ticket.**
   POST the same `stripe_event_id` to `/ticket-payment-webhook` twice (second POST ≥ 1s after the first).
   Paste:
   - First response: HTTP 200, body includes `{"success": true}`
   - Second response: HTTP 200, body includes `{"deduped": true}` or equivalent (not a 4xx)
   - `SELECT count(*) FROM tickets WHERE stripe_event_id='<id>'` → must return exactly `1`
   Fail if the count is > 1 or the second POST returns a 4xx/5xx.

3. **Atomic quantity guard — 50 concurrent buyers cannot oversell.**
   The `stripe-signature` header is signed by Stripe; you **cannot** fake it as `<test-sig>` — production webhook verification will reject every request. Pick one of these two paths:

   **Path A (preferred) — `stripe` CLI generates valid signatures:**
   ```bash
   # Requires `stripe` CLI logged in to test mode + STRIPE_WEBHOOK_SECRET set
   for i in $(seq 1 50); do
     stripe trigger checkout.session.completed \
       --add 'checkout_session:metadata.event_id=<test-event-id>' \
       --add "checkout_session:id=evt_concurrent_test_$i" &
   done; wait
   ```

   **Path B — test-mode bypass env (local stack only, never production):**
   ```bash
   # In supabase/functions/ticket-payment-webhook/index.ts, the function must honor
   # `Deno.env.get("STRIPE_WEBHOOK_VERIFY") === "false"` and skip signature check.
   # Confirm the bypass is active before running:
   curl -s http://localhost:54321/functions/v1/ticket-payment-webhook/_diag
   # Then fire the 50-request probe — signature header can be anything.
   for i in $(seq 1 50); do
     curl -s -X POST http://localhost:54321/functions/v1/ticket-payment-webhook \
       -H "stripe-signature: t=0,v1=test" \
       -d '{"type":"checkout.session.completed","data":{"object":{"id":"evt_concurrent_test_'$i'","metadata":{"event_id":"<test-event-id>"}}}}' &
   done; wait
   ```
   **Document which path you used** in your evidence paste.

   After all 50 complete, paste:
   - `SELECT quantity_remaining FROM events_tickets WHERE id='<test-event-id>';` → must be `≥ 0`
   - `SELECT count(*) FROM tickets WHERE event_id='<test-event-id>';` → must be `≤ 10`

   Fail if `quantity_remaining < 0`, ticket count > 10, OR if you used unsigned curl without the documented bypass (all 50 will return 400; that's not the test).

### QR and scanner

4. **QR token is signed and has the expected fields.**
   Trigger ticket generation for a test buyer. Decode the QR JWT (do not verify sig — just decode header/payload).
   Paste: header + payload (redact the signature portion).
   Payload must include: `event_id`, `ticket_id`, `iss` (project identifier), `exp` (expiry timestamp).
   Fail if any of these fields are absent.

5. **QR validation is single-use — second scan returns ALREADY_USED.**
   Call the QR-scan RPC / edge function twice with the same QR value:
   - First call paste: `{"success": true}` (or equivalent)
   - Second call paste: `{"error_code": "ALREADY_USED"}` (or equivalent)
   Also paste: `SELECT count(*) FROM qr_scans WHERE qr_id='<id>'` → must return exactly `1` row with `valid = true`
   Fail if the second call also returns success or if the row count ≠ 1.

6. **Staff link revocation — scanner denied within 60 seconds.**
   Generate a staff link. Open the scanner PWA with that link (confirm scan works).
   Revoke the link (from host dashboard or Supabase row delete).
   Within 60 seconds, attempt a scan.
   Paste the scan attempt response → must return `{"error_code": "STAFF_LINK_REVOKED"}` or equivalent 401/403.
   Fail if the scan succeeds after revocation, or if the denial takes > 60 seconds.

### Emails and notifications

7. **Buyer receives ticket email after purchase.**
   Complete the Camila test buyer flow (use a real email address that can be checked, or Mailtrap / Infobip sandbox).
   Paste: Infobip delivery API response with `messageId` and `status: "DELIVERED_TO_HANDSET"` (or equivalent for the configured provider).
   OR paste: a screenshot of the received email in the test inbox showing the event name and QR code.
   Fail if no delivery confirmation is available.

8. **Host dashboard shows updated ticket count and revenue after purchase.**
   After completing the test purchase, open the host dashboard for the test event.
   Paste a screenshot showing:
   - Ticket count incremented by 1
   - Revenue line updated by the ticket price
   The update must appear within 60 seconds of the purchase (realtime or polling).
   Fail if screenshot shows the pre-purchase values or is missing.

### Data access

9. **RLS prevents cross-event ticket access.**
   Log in as staff user X (assigned to event A).
   Run: `SELECT * FROM tickets WHERE event_id='<event-B-id>'` where event B belongs to a different organizer.
   Paste the result. Must return 0 rows.
   Fail if any rows are returned.

10. **Load test plan is documented.**
    The PR body or a linked doc must contain all four of:
    - Target RPS or concurrent-buyer count
    - Ramp-up schedule
    - Success criteria (e.g., `quantity_remaining ≥ 0`, no 5xx, p99 < 2s)
    - Tool used (k6, Artillery, Locust, etc.)
    Paste the section or paste the URL.
    Fail if any of the four elements are absent.

### Phase 1 gate items (run these when gating Phase 2)

11. **Camila E2E — buy ticket → QR displayed.**
    Walk the full Camila flow: browse event → click buy → Stripe checkout → return to site.
    Paste a screenshot of the post-purchase confirmation page showing the QR code rendered.
    Fail if the QR code is absent or checkout fails.

12. **Roberto E2E — valid scan + rescan returns ALREADY_USED.**
    Same as criteria 5 (single-use QR) but done end-to-end via the PWA scanner UI, not the API directly.
    Paste two scanner screenshots: first showing "Valid — admit guest," second showing "Already used."
    Fail if either state is not shown correctly in the UI.

13. **Lighthouse accessibility ≥ 90.**
    Run Lighthouse on each of:
    - `/events` (event listing page)
    - The ticket buy flow page (while a Stripe session is active)
    - The scanner PWA
    - The host dashboard
    Paste the a11y score for each. All four must be ≥ 90.
    Fail if any score is < 90.

---

## Output format

Line 1: `Pass N/13. <one-line summary>`

For Phase 1 gate use: `Phase 1 gate: PASS/FAIL — N/13 criteria met.`

Then, for each FAILED criterion:
`<id> - FAIL. <specific gap and what to fix>`

Example:
```
Phase 1 gate: FAIL — 10/13 criteria met.
3 - FAIL. Oversell probe: quantity_remaining = -2 after 50 concurrent buyers. The SELECT FOR UPDATE in ticket-payment-webhook is not acquiring the lock before the quantity check. Fix: move the lock acquisition before the read.
7 - FAIL. No Infobip delivery confirmation. Paste the delivery API response or a received-email screenshot.
13 - FAIL. Scanner PWA a11y = 74. Fix: all icon-only buttons need aria-label; QR result modal needs role="alertdialog".
```
