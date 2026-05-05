---
task_id: 047-sponsor-admin-queue
title: /admin/sponsorships — approval queue + application detail + moderation
phase: PHASE-1-SPONSOR-MVP
priority: P1
status: Open
estimated_effort: 1 day
area: frontend
skill:
  - frontend-design
  - supabase
  - mdeai-project-gates
edge_function: null
schema_tables:
  - sponsor.applications
  - sponsor.organizations
  - sponsor.assets
  - sponsor.placements
  - sponsor.invoices
depends_on: ['045-sponsor-schema-migration', '046-sponsor-apply-wizard']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-SPONSOR-MVP — admin must approve before placements go live |
| **Routes** | `/admin/sponsorships` (queue) · `/admin/sponsorships/:id` (detail + approve/reject) |
| **Real-world** | Admin opens the queue at 9am, sees 3 pending applications, clicks through Postobón's Gold application — previews where the logo will appear on the contest page — clicks Approve. `sponsor.applications.status` flips to `approved`; 2 `sponsor.placements` rows are auto-created with `active=false` |
| **Auth** | Admin only (existing `useAdminAuth` guard) |

## Description

**The situation.** Applications land in `sponsor.applications` from task 046 but there is no UI to review or approve them. Without this, every application is stuck at `submitted` and no placement ever goes live.

**Why a dedicated admin route (not inline on the event page).** Sponsorship approval involves asset moderation, placement preview, competitor exclusion checks, and contract generation (task 056). These need a focused UI — not a modal bolted to the event editor.

**What already exists.** `/admin` shell with sidebar navigation exists. Admin auth guard (`useAdminAuth`) works. The `sponsor.*` schema from task 045 holds all the data.

**The build.** Two new pages: a list view with filter/sort and a detail view with approve/reject actions. Approval triggers auto-creation of `sponsor.placements` rows via an RPC.

## Wiring plan

| Layer | File | Action |
|---|---|---|
| Page | `src/pages/admin/AdminSponsorships.tsx` | Create |
| Page | `src/pages/admin/AdminSponsorshipDetail.tsx` | Create |
| Component | `src/components/admin/SponsorApplicationCard.tsx` | Create |
| Component | `src/components/admin/SponsorPlacementPreview.tsx` | Create (shows where logo appears) |
| Hook | `src/hooks/admin/useSponsorApplications.ts` | Create |
| RPC | `public.approve_sponsor_application(p_application_id uuid, p_approved_by uuid)` | Create in migration |
| Route | `src/App.tsx` | Add admin routes |

## Approval RPC

```sql
CREATE OR REPLACE FUNCTION public.approve_sponsor_application(
  p_application_id uuid,
  p_approved_by    uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, sponsor
AS $$
DECLARE
  v_app sponsor.applications%ROWTYPE;
BEGIN
  SELECT * INTO v_app FROM sponsor.applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'APPLICATION_NOT_FOUND'; END IF;
  IF v_app.status NOT IN ('submitted','under_review') THEN
    RAISE EXCEPTION 'APPLICATION_NOT_APPROVABLE: %', v_app.status;
  END IF;

  UPDATE sponsor.applications
     SET status = 'approved', approved_at = now(), approved_by = p_approved_by
   WHERE id = p_application_id;

  -- Auto-create placements based on tier (active=false until contract signed + invoice paid)
  INSERT INTO sponsor.placements (application_id, surface, utm_destination, start_at, end_at, weight)
  SELECT
    p_application_id,
    unnest(ARRAY['contest_header','leaderboard_footer']),
    'https://mdeai.co/sponsor/' || p_application_id,
    now(),
    now() + interval '90 days',
    CASE v_app.tier WHEN 'gold' THEN 150 WHEN 'premium' THEN 200 ELSE 100 END;
END;
$$;
GRANT EXECUTE ON FUNCTION public.approve_sponsor_application(uuid, uuid) TO service_role;
```

## Queue page features

| Feature | Implementation |
|---|---|
| Filter by status | Tabs: All / Pending / Under Review / Approved / Rejected |
| Filter by event | Dropdown of events with open applications |
| Sort | Submitted date (newest first default) |
| Application card | Brand name + tier badge + activation type + submitted date + action buttons |
| Approval SLA badge | Green if within SLA, amber if approaching, red if overdue |

## Detail page sections

1. **Brand details** — Legal name, NIT, website, industry, contact info
2. **Package details** — Event name, activation type, tier, pricing model, amount COP
3. **Asset preview** — Inline logo render + video player (from Supabase Storage signed URL)
4. **AI moderation result** — Status badge from `assets.ai_moderation_status` + flags if any
5. **Placement preview** — `<SponsorPlacementPreview>` shows a mocked contest hero/leaderboard with the uploaded logo in position
6. **Actions** — Approve / Request Changes / Reject (with required reason text)

## Acceptance Criteria

- [ ] `/admin/sponsorships` lists applications filterable by status and event.
- [ ] Each application card shows brand name, tier badge (color-coded), activation type, submitted date, SLA status.
- [ ] `/admin/sponsorships/:id` shows all 6 detail sections.
- [ ] Logo renders from Supabase Storage signed URL (not public URL — assets are private until approved).
- [ ] Approve action calls `approve_sponsor_application()` RPC; success toast; redirects back to queue with status updated.
- [ ] Reject action requires a reason text (min 10 chars); sets `status='rejected'`, `rejection_reason=text`.
- [ ] "Request Changes" sets `status='under_review'`; comment saved to `applications.campaign_goals` JSONB under `admin_notes` key.
- [ ] Non-admin user hitting `/admin/sponsorships` gets redirected to `/dashboard`.
- [ ] Loading + empty states rendered (skeleton cards for list; loading spinner for detail).
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## Real-World Examples

**Scenario 1 — Routine approval:** Admin reviews Postobón's Gold application. Logo renders cleanly; AI moderation shows `clean`; no competitor exclusion conflicts (Coca-Cola is not a Gold sponsor on the same contest). Admin clicks Approve. Two `sponsor.placements` rows created (contest_header, leaderboard_footer), both `active=false` pending payment and contract.

**Scenario 2 — Asset problem:** A Bronze applicant uploads a 48×48 pixel JPEG (too small for the leaderboard). AI moderation returns `flagged` with flag `low_quality`. Admin clicks "Request Changes" with note "Please upload a PNG or SVG ≥ 400×400px." Application flips to `under_review`; sponsor receives email.

## Outcomes

| Before | After |
|---|---|
| Admin manages sponsorships via WhatsApp | Structured queue with SLA tracking |
| No placement preview before approval | Admin sees exactly where the logo will appear |
| No competitor exclusion check | AI moderation pre-screen flags issues before admin review |
| Approval triggers nothing | Approval auto-creates placement rows ready for activation |

## See also

- [`045-sponsor-schema-migration.md`](045-sponsor-schema-migration.md) — schema
- [`046-sponsor-apply-wizard.md`](046-sponsor-apply-wizard.md) — where applications come from
- [`055-sponsor-contracts-schema.md`](055-sponsor-contracts-schema.md) — contract generated after approval
- [`056-sponsor-contract-generate-edge-fn.md`](056-sponsor-contract-generate-edge-fn.md) — edge fn triggered on approval
