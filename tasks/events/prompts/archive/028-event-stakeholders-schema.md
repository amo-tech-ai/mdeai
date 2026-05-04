---
task_id: 028-event-stakeholders-schema
title: event_stakeholders — planners, hosts, judges, sponsor contacts attached to an event
phase: PHASE-2-EVENTS
priority: P2
status: Open
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
  - mdeai-project-gates
edge_function: null
schema_tables:
  - public.event_stakeholders  # NEW
depends_on: ['001-event-schema-migration']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-EVENTS — production-ops layer |
| **Schema** | 1 NEW table |
| **Real-world** | Sofía adds 5 stakeholders to "Reina de Antioquia 2026 Finals": her co-producer (planner), the MC (host), 3 judges, Postobón's brand contact (sponsor_contact). Each gets role-scoped notifications |

## Description

**The situation.** Phase 1 ships with one role per event — the organizer (`events.organizer_id`). Real events have many people involved: co-producer, MC, security lead, sponsor account-manager, photographer coordinator, etc. Tracking them in one table enables: role-scoped emails, run-of-show distribution, finance reconciliation by stakeholder.

**Why a generic stakeholders table (not separate planner/host/judge tables).** Roles overlap (a co-producer might also be a judge). One table with a `role` enum + `is_primary` flag handles every shape without an explosion of tables.

**Why Phase 2 not Phase 1.** Single-organizer model works for Phase 1 ticketing. Stakeholder roles only matter once events get bigger (>1 day, >5 people on the production team). Defer per founder May 3 directive.

## The migration

```sql
CREATE TABLE public.event_stakeholders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id),                 -- nullable: external contact w/o account
  full_name       text NOT NULL,
  email           text NOT NULL,
  phone_e164      text,
  role            text NOT NULL CHECK (role IN
    ('organizer','planner','co_producer','mc','host','judge',
     'sponsor_contact','vendor_lead','security_lead','photographer','other')),
  organization    text,                                            -- "Postobón", "Studio X"
  is_primary      boolean NOT NULL DEFAULT false,                  -- the go-to person for this role
  notes           text,
  invited_by      uuid REFERENCES auth.users(id),
  invited_at      timestamptz NOT NULL DEFAULT now(),
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, email, role)
);
CREATE INDEX event_stakeholders_event_idx ON public.event_stakeholders(event_id);
CREATE INDEX event_stakeholders_user_idx  ON public.event_stakeholders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX event_stakeholders_role_idx  ON public.event_stakeholders(event_id, role);
ALTER TABLE  public.event_stakeholders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_stakeholders_set_updated_at BEFORE UPDATE ON public.event_stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## RLS policies

```sql
-- Organizer manages all; stakeholder sees own row; both see other roles' rows on their event
CREATE POLICY stakeholders_organizer_all ON public.event_stakeholders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_stakeholders.event_id AND e.organizer_id = (select auth.uid())
  ));
CREATE POLICY stakeholders_self_select ON public.event_stakeholders FOR SELECT
  USING (user_id = (select auth.uid()));
CREATE POLICY stakeholders_peer_select ON public.event_stakeholders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_stakeholders peer
    WHERE peer.event_id = event_stakeholders.event_id
      AND peer.user_id = (select auth.uid())
  ));
```

## Acceptance Criteria

- [ ] Table + indexes + trigger + RLS created.
- [ ] UNIQUE on `(event_id, email, role)` prevents duplicate invites.
- [ ] Organizer adds, removes, and updates stakeholders via UI (Phase 2 task — separate frontend prompt).
- [ ] Stakeholder receives invite email on INSERT (Phase 2 trigger or edge fn — out of scope here).
- [ ] Self-RLS works: a judge can SELECT their own row + peer rows on the same event but not other events.

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md)
- [`100-events-prd.md`](../100-events-prd.md) §2.1 personas (Juan the judge)
