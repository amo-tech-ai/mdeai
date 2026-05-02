# Data Retention Schedule

> **Scope:** All Supabase tables storing PII, financial records, or transient data.
> **Owner:** TBD | **Last updated:** 2026-04-05
> **Jurisdiction:** Colombia (Ley 1581 de 2012 — Habeas Data), with consideration for US/EU users.

---

## Retention Policy by Data Category

| Category | Tables | Retention | Reason | Deletion Method |
|----------|--------|-----------|--------|-----------------|
| **User accounts** | `profiles`, `user_preferences`, `user_roles` | Active + 2 years after last login | Colombian Habeas Data: data must be deleted when purpose ceases | Soft-delete (mark inactive), hard-delete after 2y |
| **Conversations & messages** | `conversations`, `messages` | 90 days | Transient UX data, not legally required | Cron job: DELETE WHERE created_at < now() - 90d |
| **AI runs & cache** | `ai_runs`, `ai_context`, `ai_cache` | 30 days (cache), 1 year (runs) | Cache is ephemeral; runs needed for cost tracking | Cache: TTL-based. Runs: annual archive |
| **Leads** | `leads` | 1 year after status='closed' or 'lost' | Sales pipeline analytics | Archive to cold storage after 1y |
| **Showings** | `showings` | 1 year after showing date | Business records | Archive after 1y |
| **Rental applications** | `rental_applications` | 2 years after decision | May be needed for disputes | Archive after 2y |
| **Bookings** | `bookings` | 5 years after checkout | Financial/tax records (Colombia: 5y for commercial docs) | Archive, never hard-delete |
| **Payments** | `payments` | 7 years | Tax compliance (Colombia: 5y minimum, Stripe recommends 7y) | Archive, never hard-delete |
| **Agent audit log** | `agent_audit_log` | 1 year | Operational monitoring | Archive after 1y |
| **Proactive suggestions** | `proactive_suggestions`, `conflict_resolutions` | 90 days | Transient AI recommendations | Cron job: DELETE WHERE created_at < now() - 90d |
| **WhatsApp messages** | `whatsapp_conversations`, `whatsapp_messages` | 90 days | Transient channel data | Cron job |
| **Saved places & collections** | `saved_places`, `collections` | While account active | User-owned data, deleted with account | CASCADE on profile delete |
| **Trips & trip items** | `trips`, `trip_items` | While account active | User-owned data | CASCADE on profile delete |

---

## Implementation Notes

### Phase 1 (Manual)
- No automated cleanup yet. Focus on not collecting unnecessary data.
- Ensure all tables have `created_at` timestamps (already done).
- Document retention in privacy policy at `/privacy`.

### Phase 2 (Automated)
- Create Supabase cron job or Paperclip heartbeat task for:
  - Monthly: purge expired `ai_cache` rows
  - Monthly: purge conversations older than 90 days
  - Quarterly: archive closed leads older than 1 year
- Use Supabase `pg_cron` extension if available, or Vercel cron + edge function.

### Right to Deletion (User Request)
When a user requests account deletion:
1. Soft-delete `profiles` row (set `deleted_at`, anonymize email/name)
2. CASCADE deletes: saved_places, collections, trips, trip_items, user_preferences
3. Anonymize (don't delete): bookings, payments, rental_applications (replace PII with "DELETED USER")
4. Hard-delete: conversations, messages, ai_context
5. Retain: payments and booking records (legal requirement) with anonymized user reference

### What NOT to Delete
- Payment records (7-year legal hold)
- Booking records (5-year legal hold)
- Any record under active dispute or legal hold
