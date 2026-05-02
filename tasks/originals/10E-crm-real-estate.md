# Epic 10: P1 CRM — Real estate (lead, tour, application)

> **Diagrams:** MERM-03 (rental pipeline), MERM-06 (data model), MERM-09 (edge map)  
> **Phase:** CORE  
> **Depends on:** E1 (P1 tables), E2 (pipeline semantics), E3 (JWT on `p1-crm`)  
> **Related:** [`02E-lead-to-lease-pipeline.md`](02E-lead-to-lease-pipeline.md) (E2)

---

## Subtasks (10A → 10B → 10C)

Each file includes **`skills:`** (mdeai-tasks + domain skills). Execute in order.

| ID | File | Status |
|----|------|--------|
| **10A** | [`10A-crm-api-envelope.md`](10A-crm-api-envelope.md) | Done |
| **10B** | [`10B-crm-ui-pipeline.md`](10B-crm-ui-pipeline.md) | Done |
| **10C** | [`10C-crm-deploy-smoke.md`](10C-crm-deploy-smoke.md) | Open |

---

## Verification

Before closing **10C**, run [`VERIFY-supabase-postgres-edge.md`](VERIFY-supabase-postgres-edge.md) for `p1-crm` + P1 tables.
