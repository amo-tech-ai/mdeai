---
task_id: 057-sponsor-contract-sign-page
title: /sponsor/contract/:contractId — inline PDF viewer + click-wrap signature flow
phase: PHASE-1-SPONSOR-MVP
priority: P1
status: Open
estimated_effort: 1 day
area: frontend
skill:
  - frontend-design
  - supabase-edge-functions
  - mdeai-project-gates
  - vitest-component-testing
edge_function: sponsor-contract-sign
schema_tables:
  - sponsor.contracts
  - sponsor.placements
depends_on: ['055-sponsor-contracts-schema', '056-sponsor-contract-generate-edge-fn']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-SPONSOR-MVP — sponsor must sign before placements activate |
| **Route** | `/sponsor/contract/:contractId` (auth required) |
| **Edge function** | `POST /functions/v1/sponsor-contract-sign` |
| **Real-world** | Postobón brand manager clicks the email link, lands on the contract page, reads the bilingual PDF in the inline viewer, checks "I have read and agree to the terms", types their name, clicks Sign → `sponsor_signed_at` set → placements flip to `active=true` → a toast "Your placements are now live!" |

## Description

**The situation.** `sponsor.contracts` has `status='sent_for_signature'` and a PDF in Storage. The sponsor has received an email link. They need a clean UI to read, agree to, and sign the contract without leaving the platform.

**Why click-wrap (not DocuSign in MVP).** DocuSign adds $30+/month and requires OAuth integration. Click-wrap (checkbox + typed name + server-side IP hash + timestamp) is legally sufficient under Colombia Ley 527/1999 for Bronze–Gold tier contracts. The `signed_ip_hash` + `sponsor_signed_at` + `sponsor_display_name` combination is the legal record.

**What already exists.** `sponsor.contracts` table + PDF in Storage (task 055-056). Supabase Auth guards work. Storage signed URLs for private buckets.

## Page layout

```
/sponsor/contract/:contractId
─────────────────────────────────────
[Header] Contract for "Reina de Antioquia 2026" — Gold Tier — $5,000,000 COP

[Left 55%] Inline PDF viewer (iframe from signed Storage URL, 1h expiry)
           ↑ Sponsor reads bilingual contract here

[Right 45%]
  Contract summary:
    Event: Reina de Antioquia 2026
    Tier: Gold
    Amount: $5,000,000 COP
    Surfaces: contest_header, leaderboard_footer
    Term: May 10 – Aug 10, 2026

  ┌─────────────────────────────────────┐
  │ ☐ I have read and agree to the      │
  │   terms of this agreement           │
  └─────────────────────────────────────┘

  Full name (as it appears on your ID):
  ┌──────────────────────────────────┐
  │ [text input]                     │
  └──────────────────────────────────┘

  [Sign Contract]    (disabled until checkbox checked + name ≥ 3 chars)

  ─────────────────────────────────
  Already signed? [View placements →] (links to /sponsor/dashboard/:appId)
```

## sponsor-contract-sign edge function

```typescript
// POST /functions/v1/sponsor-contract-sign
// Auth: Bearer JWT required (must be sponsor_user_id on the contract)
// Body: { contract_id: string, display_name: string }

// 1. Load contract; verify status='sent_for_signature'
// 2. Verify auth.uid() === contract.sponsor_user_id (403 otherwise)
// 3. Hash IP: sha256(request_ip + DATE())
// 4. UPDATE sponsor.contracts SET
//      sponsor_signed_at = now(),
//      signed_ip_hash = ip_hash,
//      sponsor_display_name = display_name,
//      status = 'signed'
//    WHERE id = contract_id AND status = 'sent_for_signature'
// 5. If invoice already paid → trigger placement activation:
//    UPDATE sponsor.placements SET active=true
//    WHERE application_id = contract.application_id AND start_at <= now()
// 6. Return { success: true, data: { contract_id, placements_activated: number } }
```

## Wiring plan

| Layer | File | Action |
|---|---|---|
| Page | `src/pages/sponsor/ContractSign.tsx` | Create |
| Component | `src/components/sponsor/ContractViewer.tsx` | Create (iframe + signed URL fetch) |
| Component | `src/components/sponsor/SignatureForm.tsx` | Create (checkbox + name input + button) |
| Hook | `src/hooks/sponsor/useContractSign.ts` | Create |
| Edge function | `supabase/functions/sponsor-contract-sign/index.ts` | Create |
| Route | `src/App.tsx` | Add `/sponsor/contract/:contractId` protected route |

## Acceptance Criteria

- [ ] Page loads for authenticated sponsor user who owns the contract.
- [ ] Non-owner (wrong user or unauthenticated) gets 403 redirect to `/login`.
- [ ] PDF renders in iframe from a fresh signed Storage URL (1h expiry; auto-refresh on expiry).
- [ ] "Sign Contract" button disabled until checkbox checked AND name input ≥ 3 characters.
- [ ] On submit: edge fn sets `sponsor_signed_at`, `signed_ip_hash`, `sponsor_display_name`, `status='signed'`.
- [ ] If invoice already paid at sign time: placements with `start_at <= now()` flip to `active=true`; toast "Your placements are now live!"
- [ ] If invoice not yet paid: toast "Contract signed! Pay to activate your placements." with link to checkout.
- [ ] Submitting twice (already signed) returns 400 with "CONTRACT_ALREADY_SIGNED" — no duplicate signature rows.
- [ ] Edge fn logs to `ai_runs`.
- [ ] Vitest: 4 tests — button disabled (pre-checkbox), button disabled (no name), sign success flow (mocked edge fn), already-signed state.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## Real-World Examples

**Scenario 1 — Sign then pay:** Mi Sazón signs the Bronze contract before paying. Toast: "Contract signed! Complete payment to activate your placements." They're redirected to `/sponsor/apply?draft=<applicationId>` step 4. They pay. Webhook fires → placement activates.

**Scenario 2 — Pay then sign:** Postobón paid immediately via Stripe Checkout (unusual but possible). Contract page shows the summary, they sign → `sponsor-contract-sign` detects `invoice.status='paid'` → immediately sets `placements.active=true` → "Your placements are now live!"

**Scenario 3 — Shared contract link:** A brand manager forwards the email link to a colleague who is not the `sponsor_user_id`. The page returns 403: "This contract belongs to a different account. Please log in with the original applicant's credentials."

## Outcomes

| Before | After |
|---|---|
| No legal record of agreement | Click-wrap signed record with IP hash + timestamp |
| Placements activate on payment only | Two-gate: invoice paid AND contract signed |
| Sponsor has no doc to reference | Inline PDF viewer; signed copy in Storage permanently |

## See also

- [`056-sponsor-contract-generate-edge-fn.md`](056-sponsor-contract-generate-edge-fn.md) — generates the PDF
- [`058-sponsor-dispute-ui.md`](058-sponsor-dispute-ui.md) — cancellation/dispute after signing
- [`048-sponsor-stripe-checkout.md`](048-sponsor-stripe-checkout.md) — payment gate
