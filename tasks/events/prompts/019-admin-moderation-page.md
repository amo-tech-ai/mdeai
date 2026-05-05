---
task_id: 019-admin-moderation-page
diagram_id: IDENTITY-VERIFY-FLOW
prd_section: 09-prd.md §2.2 E2.2 (organizer flow), 6 §Q3 (Phase 0 partnership)
title: Admin moderation page /admin/entities (review + approve contestants)
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 1.5 days
area: frontend
skill:
  - frontend-design
  - supabase
  - vitest-component-testing
  - mdeai-project-gates
edge_function: null
schema_tables:
  - vote.entities
  - vote.contests
depends_on:
  - 010-vote-schema
  - 020-gemini-photo-moderation
mermaid_diagram: ../diagrams/05-identity-verify-flow.md
---

## Summary

| Aspect | Details |
|---|---|
| **Route** | `/admin/entities` (admin-gated) |
| **Function** | List pending entities, view ID + waiver, approve or reject |
| **SLA** | Daniela reviews each in ≤ 5 min |
| **Real-world** | "Daniela reviews Laura's submission, opens ID + waiver, approves; Laura's profile goes live within 1 hour" |

## Description

**The situation.** Contestants submit via task 009. Without an admin queue, submissions sit invisible.

**Why it matters.** Phase 1 acceptance gate says all contestants must be ID-verified before public voting opens. Daniela needs a fast queue.

**What already exists.** mdeai has `useAdminAuth` hook (existing), `/admin/*` route shell, shadcn Table/Card components.

**The build.** Admin queue page listing all entities with `approved=false AND submitted_at IS NOT NULL`. Each entity expandable to show ID front/back/waiver via signed Storage URLs. Approve/Reject actions. Reject requires reason → emails contestant.

## Acceptance Criteria

- [ ] Route `/admin/entities` requires `useAdminAuth` (existing); 403 for non-admin.
- [ ] List view: pending entities sorted by `submitted_at ASC` (oldest first).
- [ ] Each row: thumbnail of hero photo, display name, contest, submitted_at, "Pending review" badge, AI moderation status (clean/flagged), expand button.
- [ ] Expand shows: full bio, all 3 photos (full-size), socials with click-to-open, ID front + ID back + waiver PDF (in modal viewer with signed URL).
- [ ] Approve action: UPDATE `entities.approved=true, identity_verified_at=NOW(), reviewed_by=auth.uid()`. Toast "Aprobado". Send WhatsApp + email to contestant: "Tu perfil para Miss Elegance Colombia ya está activo".
- [ ] Reject action: textarea for reason → UPDATE `entities.rejection_reason, reviewed_by, reviewed_at`. Email contestant: "Necesitamos que reenvíes [reason]". Don't delete data.
- [ ] Filter chips: All / AI flagged / Awaiting review / Rejected (resubmittable).
- [ ] Bulk approve: select multiple → confirm → batch update.
- [ ] Audit trail: every approve/reject logged to admin_actions table (or `created_by` cols on entities).
- [ ] Admin can view rejected entities to re-review after contestant resubmits.
- [ ] Mobile-friendly (Daniela uses iPad).

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Page | `src/pages/admin/Entities.tsx` | Create |
| Component | `src/components/admin/EntityRow.tsx` | Create |
| Component | `src/components/admin/EntityDetailModal.tsx` | Create |
| Component | `src/components/admin/RejectReasonForm.tsx` | Create |
| Hook | `src/hooks/useAdminEntities.ts` | Create |
| Hook | `src/hooks/useStorageSignedUrl.ts` | Create (or extend if exists) |
| Notification | `supabase/functions/notify-entity-approved/index.ts` | Create — Twilio WA + SendGrid email |
| Test | `src/pages/admin/Entities.test.tsx` | Create |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| AI moderation flagged photos | Show prominent warning badge; admin can override or reject |
| Contestant resubmits after rejection | Original rejection_reason preserved; new submitted_at; goes back to queue |
| Daniela approves entity but ID is forged (caught later) | UNDO action: reverts approved=false; logs to audit |
| 100+ entities at once (festival) | Pagination + filtering; bulk approve for low-risk submissions |
| Storage signed URL expires mid-review | Auto-refresh URL on view |
| Contestant deletion request (Habeas Data) | Soft-delete: anonymize PII columns, keep entity row for foreign key integrity |

## Real-World Examples

**Scenario 1 — Daniela's daily review.** 9am, Daniela opens `/admin/entities`. Sees 12 pending. Opens first one (Laura). Reviews bio (relevant), 3 photos (good quality), IG link (valid), ID (matches name in entity), waiver (signed clearly). 4 minutes. Approves. Toast confirms. Laura gets WA notification. Moves to next. By 9:48 she's done all 12. **Without this page,** Daniela emails Lauren attachments back-and-forth.

**Scenario 2 — Rejection with reason.** Daniela opens entity 7. ID is blurry, can't read name. Reject with reason "ID is not legible — please re-upload a clearer photo". Email sent. Maria (entity 7) re-submits 2 hours later. Daniela approves on second try. **Without this flow,** maria gives up because "no response from organizer".

**Scenario 3 — AI flagged photo.** Entity 4 has AI moderation flag `nudity_score=0.81`. Daniela opens; verifies it's swimsuit (legit for pageant); overrides flag with note "swimsuit — pageant context". Approves. **Without override,** false positive blocks legitimate submission.

## Outcomes

| Before | After |
|---|---|
| Contestant submissions invisible to organizer | Daniela has a single queue with 5-min/entity workflow |
| Rejection requires email back-and-forth | One-click reject with reason → auto-email contestant |
| AI flags noisy without admin override | Daniela can override false positives with logged reason |
| No audit trail | Every approve/reject logged with admin user + timestamp |

## Verification

- Manual: Daniela persona reviews 12 entities in <60 min.
- Manual: rejection email arrives in WhatsApp + email within 30s.
- Vitest: 5 unit tests covering approve, reject, bulk approve, override, signed URL refresh.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/05-identity-verify-flow.md`](../diagrams/05-identity-verify-flow.md) — full flow
- Existing admin shell: `src/pages/admin/`
