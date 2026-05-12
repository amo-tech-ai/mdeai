# Local vs linked remote — `public` + `sponsor` table inventory

**Date:** 2026-05-12  
**Method:** Read-only `information_schema.tables` via `supabase db query` (`--local` and `--linked`).  
**Artifacts:**

- Local: `tasks/prompts/mastra/audits/supabase-local-table-inventory-2026-05-12.txt`
- Remote: `tasks/prompts/mastra/audits/supabase-remote-table-inventory-2026-05-12.txt`

---

## Summary counts

| Metric | Count |
| ------ | -----:|
| **Local** `(schema, table)` pairs | 60 |
| **Remote** `(schema, table)` pairs | 125 |
| **In both** | 59 |
| **Local-only** | 1 |
| **Remote-only** | 66 |

`information_schema.tables` includes ordinary tables and views (PostGIS catalog entries appear when applicable).

---

## Local-only

| schema | table_name |
| ------ | ---------- |
| public | **grounding_quota_log** |

**Interpretation:** MASTRA-057 migration exists locally and applies on **`supabase db reset`**; linked production DB **does not** have this table yet (consistent with **`20260513103000`** local-only on `supabase migration list`).

---

## Remote-only (66)

Remote has substantial extra **`public`** surface area not present on this local reset (examples below). Full pair list is derivable from set difference against the raw inventory files.

### `sponsor` schema — remote-only tables

| table_name |
| ---------- |
| attributions |
| clicks |
| impressions |

Local `sponsor` still has the core seven: `applications`, `assets`, `contracts`, `invoices`, `organizations`, `placements`, `roi_daily`.

### `public` — remote-only (grouped by prefix)

High level buckets (63 base relations + sponsor 3 = 66):

- **`agent_*`**: `agent_approvals`, `agent_budgets`, `agent_errors`, `agent_runs`, `agent_tool_calls` (remote); local has `agent_audit_log`, `agent_jobs` only among agent-prefixed rows.
- **`mastra_*`**: full Mastra Studio-style catalog on remote (agents, threads, datasets, MCP servers, scores, workflows, etc.).
- **`landlord_*`**: `landlord_inbox`, `landlord_inbox_events`, `landlord_profiles`, `landlord_profiles_public`, `landlord_response_metrics`.
- **Events / comms / ops**: e.g. `chat_events`, `email_outbox`, `event_media_assets`, `event_order_refunds`, `event_promo_codes`, `event_sponsor_placements`, `event_sponsors`, `event_stakeholders`, `event_vendors`, `event_wait_list`, `event_attendee_profiles`, `delivery_receipts`, `posts_outbox`, `outbox`, `suppression_list`, `verification_requests`, `wa_outbox`, `whatsapp_subscriptions`, `analytics_events_daily`, `approval_decisions`, `approval_requests`, etc.

Exact names: diff the two `.txt` artifacts or run the same SQL in both environments.

---

## In both (59)

Shared core includes `profiles`, `events`, `event_orders`, `listing_embeddings`, `apartments`, `rentals`, WhatsApp core tables, trips, etc. — see overlapping rows in the two inventory files.

---

## Takeaways for MASTRA-056 / MASTRA-057 PR

1. **`grounding_quota_log`** is expected **local-only** until migration parity + reviewed **`db push`**.
2. Remote DB is **much broader** than this repo’s default local migration chain (Mastra + landlord + richer events/sponsor analytics). Schema drift is **not** explained by 056/057 alone — aligns with migration-history parity workstream.
3. No **`supabase db push`**, **`migration repair`**, or remote DDL was executed as part of this inventory capture.
