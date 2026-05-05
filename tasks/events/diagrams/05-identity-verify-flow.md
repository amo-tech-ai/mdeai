---
id: IDENTITY-VERIFY-FLOW
phase: CORE
prd_section: 6 Q3 Decision (Phase 1 deltas), 5.1 Phase 1 ships
type: sequence
related: [04-vote-schema]
---

# 05 — Contestant identity verification (sequence)

**What this shows.** New for Phase 1 because we chose a beauty pageant ([Miss Elegance Colombia 2026](https://misseleganceco.com/)) as the flagship. Each contestant uploads a government-ID photo + signed waiver. Admin moderates. Profile activates only after both pass.

**Phase.** CORE — release blocker for Phase 1 voting open.

```mermaid
sequenceDiagram
    autonumber
    actor C as Contestant (Laura)
    participant FE as /host/contest/:slug/apply
    participant ST as Supabase Storage<br/>identity_docs bucket
    participant DB as vote.entities
    participant GM as Gemini moderation
    participant ADM as Admin (Daniela)
    participant ADP as /admin/entities

    C->>FE: Start application
    FE-->>C: Show 10-step mobile-first form
    C->>FE: Bio + 3 photos + socials
    C->>FE: Upload government ID (front + back)
    FE->>ST: Signed PUT to identity_docs bucket
    ST-->>FE: Storage path
    C->>FE: Sign + upload waiver PDF
    FE->>ST: Signed PUT
    ST-->>FE: Storage path
    FE->>DB: INSERT entities (approved=false, identity_verified_at=null)

    par Async moderation
        FE->>GM: Photo moderation request
        GM-->>FE: clean | flagged | rejected
        opt Flagged or rejected
            FE->>DB: Mark entity moderation_flag
        end
    and
        FE-->>C: 70% complete — wait for review
    end

    Note over ADM,ADP: Admin daily review

    ADP->>DB: SELECT entities WHERE approved=false AND identity_docs_uploaded
    DB-->>ADP: Pending list with moderation flags
    ADM->>ADP: Open contestant
    ADP->>ST: Get signed URL for ID + waiver
    ST-->>ADP: Display documents
    ADM->>ADM: Verify identity + waiver match
    alt Approved
        ADM->>ADP: Click Approve
        ADP->>DB: UPDATE entities SET approved=true, identity_verified_at=NOW
        ADP-->>C: Email/WA: profile is live
    else Reject (mismatched docs, unsigned waiver, etc.)
        ADM->>ADP: Click Reject with reason
        ADP->>DB: UPDATE entities SET rejection_reason
        ADP-->>C: Email/WA: please re-upload {reason}
    end

    Note right of ADP: Profile only appears on /vote/:slug<br/>once approved=true AND identity_verified_at NOT NULL
```

## Notes

- **Storage bucket reuse.** `identity_docs` bucket already exists in mdeai (from landlord V1). Reused with new RLS policy for contest contestants.
- **Retention.** Identity docs retained 12 months post-contest-close per Habeas Data §6 Q6 default; voter PII separately handled.
- **Why Phase 0 partnership matters.** Miss Elegance Colombia organizers must agree to the moderation flow — who arbitrates a rejection dispute, what evidence rises to "reject", how appeals work. Documented in the partnership agreement.
- **AI moderation is a pre-check, not a decision.** Gemini flags; admin decides. False positives are recoverable; false negatives are brand-safety incidents.
