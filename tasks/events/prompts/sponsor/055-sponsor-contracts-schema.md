---
task_id: 055-sponsor-contracts-schema
title: sponsor.contracts — click-wrap contract schema + updated_at trigger + RLS
phase: PHASE-1-SPONSOR-MVP
priority: P1
status: Open
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
  - mdeai-project-gates
edge_function: null
schema_tables:
  - sponsor.contracts   # NEW
depends_on: ['045-sponsor-schema-migration']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-SPONSOR-MVP — no placement goes `active=true` without a signed contract |
| **Schema** | 1 NEW table in `sponsor` schema |
| **Real-world** | Admin approves Postobón's Gold application → `sponsor-contract-generate` edge fn (task 056) creates a `sponsor.contracts` row with `status='sent_for_signature'` + PDF path → Postobón opens `/sponsor/contract/:id`, reads the bilingual PDF, checks the box + types name → `sponsor_signed_at` set → placements flip to `active=true` at `start_at` |

## Description

**The situation.** The `sponsor.placements` activation gate (task 048) checks `invoice.status='paid'`. But there is a second gate: the legal agreement. Without `sponsor.contracts`, placements can go live without a signed document — a compliance and dispute risk.

**Why click-wrap in MVP (not DocuSign).** Colombia Ley 527/1999 recognises electronic signatures — a checkbox acknowledgement + typed name + IP hash + timestamp is legally sufficient for Bronze–Gold tier contracts. DocuSign integration (Phase 2) adds a `signature_request_id` column when Premium sponsors require a PDF co-sign.

**What already exists.** `sponsor.applications`, `sponsor.invoices`, `sponsor.placements` (task 045). The activation logic in task 048 checks invoice paid. This task adds the contract gate to the same activation check.

## The migration

```sql
-- ============================================================
-- Task 055: sponsor.contracts — click-wrap legal agreement
-- ============================================================

CREATE TABLE sponsor.contracts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id        uuid NOT NULL REFERENCES sponsor.applications(id) ON DELETE CASCADE,
  template_version      text NOT NULL DEFAULT 'v1.0',

  -- Parties
  organizer_user_id     uuid NOT NULL REFERENCES auth.users(id),
  sponsor_user_id       uuid NOT NULL REFERENCES auth.users(id),

  -- Financial snapshot (immutable after signing)
  agreed_amount_cents   int NOT NULL,
  agreed_currency       text NOT NULL DEFAULT 'COP',
  agreed_pricing_model  text NOT NULL,
  agreed_deliverables   jsonb NOT NULL DEFAULT '[]',

  -- Terms
  cancellation_window_days  int NOT NULL DEFAULT 7,
  ip_ownership              text NOT NULL DEFAULT 'shared'
    CHECK (ip_ownership IN ('sponsor','platform','shared')),
  exclusivity_scope         text
    CHECK (exclusivity_scope IS NULL OR exclusivity_scope IN ('category','event','platform')),

  -- Signatures (click-wrap MVP; DocuSign in Phase 2)
  pdf_storage_path          text,
  signature_request_id      text UNIQUE,           -- Phase 2: DocuSign/PandaDoc external ID
  organizer_signed_at       timestamptz,           -- auto-set when admin approves (admin = organizer)
  sponsor_signed_at         timestamptz,
  signed_ip_hash            text,                  -- sha256(IP + daily_salt) at signing time
  sponsor_display_name      text,                  -- typed name in the click-wrap form

  -- Dates
  contract_start_at  timestamptz NOT NULL,
  contract_end_at    timestamptz NOT NULL,

  -- Status machine: draft → sent_for_signature → signed → active → expired | cancelled | disputed
  status  text NOT NULL DEFAULT 'draft' CHECK (status IN
    ('draft','sent_for_signature','signed','active','expired','cancelled','disputed')),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (application_id)   -- one contract per application in MVP
);

CREATE INDEX sponsor_contracts_app_idx      ON sponsor.contracts(application_id);
CREATE INDEX sponsor_contracts_sponsor_idx  ON sponsor.contracts(sponsor_user_id);
CREATE INDEX sponsor_contracts_status_idx   ON sponsor.contracts(status)
  WHERE status NOT IN ('expired','cancelled');

ALTER TABLE sponsor.contracts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER sponsor_contracts_updated_at
  BEFORE UPDATE ON sponsor.contracts
  FOR EACH ROW EXECUTE FUNCTION sponsor.set_updated_at();
```

## RLS policies

```sql
-- Sponsor reads own contract; organizer reads all their event contracts
CREATE POLICY sponsor_contracts_sponsor_select ON sponsor.contracts FOR SELECT
  USING (sponsor_user_id = (select auth.uid()));

CREATE POLICY sponsor_contracts_organizer_select ON sponsor.contracts FOR SELECT
  USING (organizer_user_id = (select auth.uid()));

-- Only service_role writes (contract-generate edge fn + contract-sign edge fn)
-- No direct sponsor INSERT/UPDATE — edge fns handle all mutations
```

## Placement activation gate update

```sql
-- Extend the pg_cron activation query from task 048 to require signed contract:
UPDATE sponsor.placements p
   SET active = true
  FROM sponsor.applications a
  JOIN sponsor.invoices  i ON i.application_id = a.id
  JOIN sponsor.contracts c ON c.application_id = a.id
 WHERE p.application_id = a.id
   AND p.active = false
   AND p.start_at <= now()
   AND i.status = 'paid'
   AND c.status IN ('signed','active');    -- ← new gate
```

## Acceptance Criteria

- [ ] `sponsor.contracts` table created with all columns and constraints.
- [ ] UNIQUE on `application_id` enforces one contract per application.
- [ ] `status` CHECK constraint rejects values outside the 7-state machine.
- [ ] Sponsor user can SELECT own contract; cannot SELECT other sponsors' contracts (RLS isolation).
- [ ] `get_advisors(type: "security")` shows RLS enabled; no new error-level issues.
- [ ] `get_advisors(type: "performance")` shows no missing FK indexes.
- [ ] Placement activation cron updated to include `c.status IN ('signed','active')` gate.
- [ ] `npm run verify:edge` passes (no edge fn changes needed for this task).

## See also

- [`045-sponsor-schema-migration.md`](045-sponsor-schema-migration.md) — parent schema
- [`056-sponsor-contract-generate-edge-fn.md`](056-sponsor-contract-generate-edge-fn.md) — creates contract + PDF
- [`057-sponsor-contract-sign-page.md`](057-sponsor-contract-sign-page.md) — sponsor signs here
- [`tasks/events/03-sponsorship-system.md`](03-sponsorship-system.md) §8 — full contract rationale
