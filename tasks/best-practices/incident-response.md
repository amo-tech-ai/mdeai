# Incident Response & Rollback — One-Pager

> **Scope:** Payment failures, booking corruption, edge function outages, data integrity issues.
> **Owner:** TBD | **Last updated:** 2026-04-05

---

## Severity Levels

| Level | Definition | Response Time | Examples |
|-------|-----------|---------------|----------|
| **SEV-1** | Payment processing down, data loss, security breach | 15 min | Stripe webhook failing, service role key leaked, DB corruption |
| **SEV-2** | Major feature broken, degraded for all users | 1 hour | AI chat down, search broken, auth failing |
| **SEV-3** | Minor feature broken, workaround exists | 4 hours | One edge function slow, map not loading, styling bug |
| **SEV-4** | Cosmetic, non-blocking | Next business day | Typo, minor UI glitch |

---

## Payment Incident Playbook

### Stripe Webhook Failure
1. **Detect:** Vercel logs show 5xx on `payment-webhook`, or `payments` table shows `status='pending'` for >10 min
2. **Triage:** Check Stripe Dashboard → Developers → Webhooks → Recent deliveries
3. **Fix options:**
   - If code bug: deploy fix, then replay failed events from Stripe Dashboard
   - If Supabase down: wait for recovery — Stripe retries for up to 72h
   - If signature mismatch: verify `STRIPE_WEBHOOK_SECRET` in Supabase dashboard matches Stripe
4. **Recovery:** Stripe re-delivers all failed events automatically. Idempotency keys prevent double-processing.

### Double-Charge Prevention
- All `booking-create` calls use `Idempotency-Key` header
- Stripe PaymentIntents are idempotent by `payment_intent_id`
- If duplicate detected: refund via Stripe Dashboard, update `payments` table manually

### Refund Process
1. Initiate refund in Stripe Dashboard (or via API)
2. `payment-webhook` receives `charge.refunded` event
3. Webhook updates `payments.status` to `refunded` and `bookings.status` to `cancelled`
4. Notifications sent to renter and host

---

## Edge Function Rollback

### Vercel Frontend
```bash
# List recent deployments
vercel ls

# Roll back to previous deployment
vercel rollback

# Or promote a specific deployment
vercel promote <deployment-url>
```

### Supabase Edge Functions
Supabase does not have built-in rollback. Strategy:
1. Keep previous function version in git (tagged releases)
2. Redeploy previous version: `supabase functions deploy <name> --project-ref zkwcbyxiwklihegjhuql`
3. If function is completely broken, set `verify_jwt: true` in `config.toml` to block all traffic while fixing

### Database Rollback
- **Schema:** Supabase migrations are forward-only. Write a reverse migration if needed.
- **Data:** No automatic point-in-time recovery on free tier. For critical data (payments, bookings), log all mutations to enable manual reconstruction.

---

## Communication Template

**Internal (for team):**
```
[SEV-X] {Brief description}
Impact: {Who/what is affected}
Status: {Investigating | Identified | Fixing | Resolved}
ETA: {When we expect resolution}
```

**External (for users, if needed):**
```
We're aware of an issue with {feature}. We're working on a fix and expect resolution by {time}. Your {payment/booking/data} is safe.
```

---

## Post-Incident Review

After every SEV-1 or SEV-2:
1. **Timeline:** What happened, when, in what order
2. **Root cause:** Why it happened (not who)
3. **Impact:** Users affected, revenue impact, data affected
4. **Fix:** What was done to resolve
5. **Prevention:** What changes prevent recurrence (code, monitoring, process)

Store post-incident reviews in `tasks/audit/incidents/`.
