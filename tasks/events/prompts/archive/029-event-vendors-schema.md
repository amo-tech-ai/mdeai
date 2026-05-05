---
task_id: 029-event-vendors-schema
title: event_vendors — logistics suppliers (photographer, sound, security, catering)
phase: PHASE-2-EVENTS
priority: P2
status: Open
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
edge_function: null
schema_tables:
  - public.event_vendors  # NEW
depends_on: ['001-event-schema-migration']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-EVENTS — production-ops layer |
| **Schema** | 1 NEW table |
| **Real-world** | Sofía books a photographer, AV company, and security firm for the finals. Tracks each vendor's contract + amount + payment status |

## Description

**The situation.** Real events have N vendors (photographer, AV, security, catering, decor, transport). Tracking them in spreadsheets is the default; mdeai can centralize this so the dashboard shows total event cost, paid vs. due, contact list.

**Why Phase 2.** Vendor management is operational glue, not Phase 1 ticketing. Defer.

**Distinction from `event_stakeholders` (task 028).** Stakeholders are people (with roles). Vendors are companies/services (with contracts + invoices). A photographer could be both a `vendor` (the company) AND a `stakeholder` (the lead photographer's contact info). Two tables, distinct purposes.

## The migration

```sql
CREATE TABLE public.event_vendors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  company_name        text NOT NULL,
  service_type        text NOT NULL CHECK (service_type IN
    ('photographer','videographer','av_sound','security','catering','decor',
     'transport','printing','rental','venue_supplier','other')),
  contact_name        text,
  contact_email       text,
  contact_phone_e164  text,
  contract_amount_cents int CHECK (contract_amount_cents IS NULL OR contract_amount_cents >= 0),
  currency            text NOT NULL DEFAULT 'COP',
  amount_paid_cents   int NOT NULL DEFAULT 0 CHECK (amount_paid_cents >= 0),
  payment_status      text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN
    ('unpaid','partial','paid','overdue','cancelled')),
  contract_url        text,                                        -- Supabase Storage signed URL
  invoice_url         text,                                        -- Supabase Storage signed URL
  notes               text,
  booked_at           timestamptz,
  service_date        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (amount_paid_cents <= COALESCE(contract_amount_cents, 2147483647))
);
CREATE INDEX event_vendors_event_idx        ON public.event_vendors(event_id);
CREATE INDEX event_vendors_service_idx      ON public.event_vendors(event_id, service_type);
CREATE INDEX event_vendors_payment_idx      ON public.event_vendors(event_id, payment_status);
ALTER TABLE  public.event_vendors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_vendors_set_updated_at BEFORE UPDATE ON public.event_vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## RLS policies

```sql
-- Only event organizer (and Phase 2 co-producers via stakeholders) can read/write
CREATE POLICY vendors_organizer_all ON public.event_vendors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_vendors.event_id AND e.organizer_id = (select auth.uid())
  ));
CREATE POLICY vendors_costakeholder_select ON public.event_vendors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_stakeholders s
    WHERE s.event_id = event_vendors.event_id
      AND s.user_id  = (select auth.uid())
      AND s.role IN ('co_producer','planner')
  ));
```

## Acceptance Criteria

- [ ] Table + indexes + trigger + RLS created.
- [ ] `amount_paid_cents <= contract_amount_cents` constraint enforced.
- [ ] Dashboard summary query (`SUM(contract_amount_cents) AS total_budget, SUM(amount_paid_cents) AS paid` per event) is fast (<50ms with covering index).
- [ ] Co-producer stakeholder can SELECT but not modify (Phase 2 stakeholder permissions — task 028 prerequisite).

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md)
- [`028-event-stakeholders-schema.md`](./028-event-stakeholders-schema.md)
