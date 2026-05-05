---
task_id: 056-sponsor-contract-generate-edge-fn
title: sponsor-contract-generate — PDF contract generation + Storage upload + sponsor email
phase: PHASE-1-SPONSOR-MVP
priority: P1
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase-edge-functions
  - mdeai-project-gates
edge_function: sponsor-contract-generate
schema_tables:
  - sponsor.contracts
  - sponsor.applications
  - sponsor.organizations
depends_on: ['055-sponsor-contracts-schema', '047-sponsor-admin-queue']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-SPONSOR-MVP — contract must exist before sponsor can sign |
| **Trigger** | Called by admin approval action (task 047) immediately after `approve_sponsor_application()` RPC |
| **Edge function** | `POST /functions/v1/sponsor-contract-generate` |
| **Auth** | service_role only (called server-side from admin UI action) |
| **Real-world** | Admin clicks Approve on Postobón's Gold application → `approve_sponsor_application()` runs → admin UI calls `sponsor-contract-generate` → PDF rendered → uploaded to Supabase Storage at `contracts/<contract_id>.pdf` → Postobón contact receives email: "Your contract is ready — sign to activate your placements" |

## Description

**The situation.** After admin approval (task 047), a `sponsor.contracts` row needs to exist with `status='sent_for_signature'` and a PDF the sponsor can read before signing. Without this edge function, the approval action produces no contract and the sponsor has no document to review.

**Why PDF generation in an edge function (not client-side).** The PDF must be generated server-side to: (a) include confidential organizer details not exposed to the browser, (b) be stored in Supabase Storage under service_role (not signed URL), (c) avoid the sponsor seeing unrendered template variables.

**What already exists.** Supabase Storage is live (used by event media assets). Email sending uses the existing Infobip edge function pattern. `sponsor.contracts` table (task 055).

## Implementation approach

MVP uses **HTML-to-text PDF** via `Deno.writeTextFile` + a simple Handlebars-style template rendered as HTML, then converted to PDF using `jsr:@std/crypto` + a lightweight PDF library. If a Deno-native PDF library is unavailable, fall back to generating a styled HTML page and sending the Storage URL directly — the sponsor can print/save as PDF from the browser.

Preferred library: `npm:pdf-lib` (works in Deno via npm specifier).

## Contract PDF template (bilingual ES/EN)

```
CONTRATO DE PATROCINIO / SPONSORSHIP AGREEMENT

Fecha / Date: {{contract_date}}
Partes / Parties:
  Organizador / Organizer: {{organizer_name}}
  Patrocinador / Sponsor: {{legal_name}} (NIT: {{tax_id}})

1. Objeto / Subject
   [ES] El patrocinador aporta {{amount_cop}} COP para la activación tipo {{activation_type}}
   durante el evento "{{event_name}}" ({{event_start}} – {{event_end}}).
   [EN] The sponsor contributes COP {{amount_cop}} for a {{activation_type}} activation
   during "{{event_name}}" ({{event_start}} – {{event_end}}).

2. Contraprestación / Consideration
   Surfaces: {{deliverables_list}}
   Modelo de precio / Pricing model: {{pricing_model}}

3. Exclusividad / Exclusivity
   {{exclusivity_text}}

4. Cancelación / Cancellation
   Ventana de cancelación / Cancellation window: {{cancellation_window_days}} días/days
   Reembolso / Refund: 100% within window; prorated thereafter.

5. Propiedad Intelectual / Intellectual Property
   {{ip_ownership_text}}

6. Ley aplicable / Governing Law
   República de Colombia. Arbitraje / Arbitration: Cámara de Comercio de Medellín.

Firma electrónica / Electronic Signature
  Sponsor: _________________________ Date: _____________
  (Click-wrap accepted per Colombia Ley 527/1999)
```

## Edge function logic

```typescript
// POST /functions/v1/sponsor-contract-generate
// Auth: service_role only
// Body: { application_id: string }

// 1. Load application + organization + event + existing approved_by user (organizer)
// 2. If sponsor.contracts row already exists for this application → return existing contract_id (idempotent)
// 3. Render PDF from template using application data
// 4. Upload PDF to Storage: 'contracts' bucket, path: `<contract_id>.pdf`
// 5. INSERT sponsor.contracts:
//    { application_id, organizer_user_id=approved_by, sponsor_user_id=org.primary_contact_user_id,
//      agreed_amount_cents, agreed_currency, agreed_pricing_model, agreed_deliverables,
//      pdf_storage_path, contract_start_at, contract_end_at,
//      organizer_signed_at=now(),   ← admin approval = organizer signature
//      status='sent_for_signature' }
// 6. Send email to sponsor contact:
//    Subject: "Su contrato de patrocinio está listo / Your sponsorship contract is ready"
//    Body: Link to /sponsor/contract/<contract_id>
//    Via: existing Infobip/email edge fn pattern
// 7. Return { success: true, data: { contract_id, pdf_url } }
```

## Storage bucket

```
Bucket name: 'contracts'
Bucket policy: private (not public)
Access: service_role only for write; sponsor reads via signed URL (1h expiry)
```

## Acceptance Criteria

- [ ] Edge fn creates `sponsor.contracts` row with `status='sent_for_signature'`.
- [ ] `organizer_signed_at` is set on creation (admin approval = organizer sign).
- [ ] PDF uploaded to `contracts/<contract_id>.pdf` in Supabase Storage.
- [ ] Calling the edge fn twice for the same `application_id` returns the existing contract (idempotent; no duplicate rows).
- [ ] Sponsor contact receives email with a link to `/sponsor/contract/<contract_id>`.
- [ ] Sponsor can retrieve a signed URL for the PDF from Storage (1h expiry).
- [ ] Non-service-role calls return 403.
- [ ] Edge fn logs to `ai_runs` (agent_name='sponsor-contract-generate', status='success'|'error').
- [ ] `npm run verify:edge` passes.

## Real-World Examples

**Scenario 1 — Standard flow:** Admin approves → edge fn called → PDF generated with Postobón's NIT, "Reina de Antioquia 2026", Gold tier $5M COP, 2 surfaces (contest_header, leaderboard_footer), 90-day term → uploaded to Storage → Postobón brand manager receives email at brand@postobon.com.co.

**Scenario 2 — Admin re-approves (race condition):** Two admins click Approve within 2 seconds. First call creates the contract; second call detects `application_id` already has a contract row → returns the existing `contract_id`. No duplicate contracts.

## See also

- [`055-sponsor-contracts-schema.md`](055-sponsor-contracts-schema.md) — `sponsor.contracts` table
- [`057-sponsor-contract-sign-page.md`](057-sponsor-contract-sign-page.md) — where the sponsor signs
- [`047-sponsor-admin-queue.md`](047-sponsor-admin-queue.md) — triggers this edge fn on approve
