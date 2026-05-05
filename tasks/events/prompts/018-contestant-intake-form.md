---
task_id: 018-contestant-intake-form
diagram_id: IDENTITY-VERIFY-FLOW
prd_section: 6 Q3 Decision (Phase 1 deltas), 09-prd.md §2.2 E4
title: Contestant intake form /host/contest/:slug/apply with ID + waiver upload
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 2 days
area: full-stack
skill:
  - frontend-design
  - supabase
  - vitest-component-testing
  - mdeai-project-gates
edge_function: null (uses Storage signed URLs directly)
schema_tables:
  - vote.entities
  - storage (identity_docs bucket, listing_photos bucket)
depends_on:
  - 010-vote-schema
  - 020-gemini-photo-moderation
mermaid_diagram: ../diagrams/05-identity-verify-flow.md
---

## Summary

| Aspect | Details |
|---|---|
| **Route** | `/host/contest/:slug/apply` (mobile-first) |
| **Outputs** | Row in `vote.entities` (approved=false, identity_verified_at=null) + Storage uploads |
| **Steps** | bio + 3 photos + socials + ID upload + waiver upload + consent checkbox |
| **Time-to-complete target** | ≤ 10 minutes on phone |
| **Real-world** | "Laura completes profile in 8 minutes during a coffee break" |

## Description

**The situation.** Beauty pageant contests need verified contestants. Per `09-prd.md` §6 Q3, identity verification (ID + waiver) is mandatory for Miss Elegance Colombia 2026. No form exists yet.

**Why it matters.** Without ID verification, anyone can submit fake contestants. Without waiver, legal exposure for organizer + platform.

**What already exists.** mdeai has `identity_docs` Storage bucket (from landlord V1), shadcn forms, react-hook-form + Zod patterns. `useAnonSession` for non-authenticated browsers.

**The build.** A 10-step mobile-first form at `/host/contest/:slug/apply` that collects all required data, uploads to Storage, INSERTs into `vote.entities` with `approved=false`, sends Gemini moderation for instant photo check, and shows a real-time completeness meter.

## Acceptance Criteria

- [ ] Route `/host/contest/:slug/apply` renders only when `vote.contests.kind='pageant'` and accepting submissions.
- [ ] Form steps: (1) display name + bio (≥50 chars) (2) hero photo (3) two extra photos (4) socials (≥1 link) (5) government ID front (6) government ID back (7) waiver PDF download/sign/upload (8) consent checkboxes (Habeas Data Ley 1581/2012 + image rights) (9) review (10) submit.
- [ ] Each photo upload calls Gemini moderation edge fn (task 011) immediately; flagged uploads show inline warning.
- [ ] Storage paths: `identity_docs/<contest>/<entity_id>/{id_front,id_back,waiver}.{ext}`; `listing_photos/<contest>/<entity_id>/{hero,photo2,photo3}.{ext}` (reuses listing_photos bucket).
- [ ] Form auto-saves draft to `vote.entities` (approved=false) with each step blur.
- [ ] Real-time completeness meter shows "70% complete — falta 1 foto + waiver".
- [ ] On submit, mark `entity.submitted_at`. No immediate go-live.
- [ ] Loading states on every upload (shadcn Skeleton + progress bar).
- [ ] Error states: file too big (>10MB), wrong type (not jpg/png/pdf), Storage 5xx → retry.
- [ ] Mobile camera capture supported via `<input type="file" accept="image/*" capture="environment">`.
- [ ] iOS Safari: camera permission prompt handled gracefully.
- [ ] Spanish-Paisa copy throughout (English first as fallback if user prefers).
- [ ] Consent checkboxes are NOT pre-checked (per Habeas Data).
- [ ] On submit success, redirect to `/host/contest/:slug/apply/thanks` with explanation: "Estamos revisando tu información. En 24h te avisamos."

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Page | `src/pages/host/contest/Apply.tsx` | Create |
| Component | `src/components/contest/intake/StepBio.tsx` | Create |
| Component | `src/components/contest/intake/StepPhotos.tsx` | Create |
| Component | `src/components/contest/intake/StepIdDocs.tsx` | Create |
| Component | `src/components/contest/intake/StepWaiver.tsx` | Create |
| Component | `src/components/contest/intake/StepConsent.tsx` | Create |
| Component | `src/components/contest/intake/CompletenessMeter.tsx` | Create |
| Hook | `src/hooks/useContestApply.ts` | Create |
| Schema | `src/types/contestApply.ts` | Create — Zod schemas |
| Storage | Supabase dashboard → identity_docs bucket | Verify exists; add RLS for self-uploads |
| Test | `src/pages/host/contest/Apply.test.tsx` | Create |

## Schema (RLS for storage)

```sql
-- New RLS policy on identity_docs bucket
CREATE POLICY "Contestants upload own ID + waiver"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'identity_docs' AND
  (storage.foldername(name))[1] = (SELECT slug FROM vote.contests WHERE id = ?) AND
  -- entity_id in path must match a draft entity created by this user
  EXISTS (
    SELECT 1 FROM vote.entities
    WHERE id::text = (storage.foldername(name))[2]
      AND created_by_user_id = (select auth.uid())
      AND approved = false
  )
);
```

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| User starts form, closes browser mid-step | Draft persisted; resumable from any step |
| Gemini moderation flags photo | Inline warning + replace prompt; user can re-submit photo |
| Same person submits twice (refresh) | Draft deduplicated by `created_by_user_id`; resumes existing draft |
| Mobile data slow, large photos timeout | Compress client-side to ≤2MB before upload |
| Consent unchecked on submit | Form shows error per checkbox; don't submit |
| User abandons after step 5 | Draft visible to admin queue but `submitted_at IS NULL` — exclude from review queue until submitted |

## Real-World Examples

**Scenario 1 — Laura completes intake (happy path).** Laura opens `/host/contest/miss-elegance-colombia-2026/apply` from a friend's WhatsApp message. Fills bio in 2 min. Uploads 3 photos (Gemini moderates each instantly — all clean). Adds IG + TikTok links. Snaps ID front + back via phone camera. Downloads waiver PDF, signs it on paper, uploads photo of signed waiver. Checks 2 consent boxes. Total time: 8 min. Submits. Sees "Estamos revisando…" page. Next day Daniela approves; profile goes live. **Without this form,** Laura would have to email Daniela 6 attachments.

**Scenario 2 — Photo flagged.** Laura uploads a photo that includes another person without consent. Gemini moderation flags `multiple_faces=true`. Inline warning: "Esta foto incluye a otra persona — necesitamos consentimiento o foto solo de ti". Laura swaps photo. Re-moderation passes. **Without this check,** Daniela would catch this much later, after waiting on full submission.

**Scenario 3 — Resume after interruption.** Laura starts form on phone, gets called away after step 4. Returns 3 hours later. Draft auto-saved. Form opens at step 5. Completes. Submits. **Without auto-save,** she'd start over.

## Outcomes

| Before | After |
|---|---|
| No way for contestants to submit | Mobile-first form completes in 8–10 min |
| Photo issues caught only at admin moderation | Gemini moderation flags inline at upload time |
| No legal protection for organizer | Waiver + Habeas Data consent captured before review |
| Draft lost on browser close | Auto-save resumable from any step |

## Verification

- Manual: Laura persona on real iPhone — complete form end-to-end in <10 min.
- Manual: upload flagged content (e.g. nudity test image) — inline warning, can replace.
- Vitest: 6 unit tests on Step components + completeness meter logic.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/05-identity-verify-flow.md`](../diagrams/05-identity-verify-flow.md) — full sequence
- [`.claude/rules/style-guide.md`](../../../.claude/rules/style-guide.md) — form patterns
- [Existing `landlord/onboarding`](../../../src/pages/host/) — analogous flow to read first
