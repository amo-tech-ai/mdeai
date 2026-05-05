---
id: 07B
diagram_id: MERM-09
prd_section: "5. AI agent architecture — Hermes lease analysis"
title: Implement contract-analysis edge function
skills:
  - edge-function
  - mdeai-tasks
epic: E7
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies:
  - E7-001
estimated_effort: L
percent_complete: 0
outcome: O4
---

# E7-002: Implement contract-analysis Edge Function

```yaml
---
id: E7-002
diagram_id: MERM-09
prd_section: "5. AI agent architecture — Hermes lease analysis"
title: Implement contract-analysis edge function
skill: edge-function
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies:
  - E7-001
estimated_effort: L
percent_complete: 0
epic: E7
outcome: O4
---
```

### Prompt

Create the `contract-analysis` edge function that uses Gemini Pro to analyze lease contracts and identify risks for renters.

**Epic index:** [`07E-contract-automation.md`](07E-contract-automation.md)

**Depends on:** [`07A-p2-tables-lease-market-taste.md`](07A-p2-tables-lease-market-taste.md)

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — Hermes: Lease Analysis, PDF → terms → risk
- `tasks/mermaid/09-edge-function-map.mmd` — contract-analysis I/O spec
- `.claude/rules/edge-function-patterns.md` — auth, CORS, Zod, response format

**The build:**
- New edge function at `supabase/functions/contract-analysis/index.ts`
- Accept: `{ document_url: string, apartment_id: string, language?: 'en' | 'es' }` (document in Supabase Storage)
- Fetch document from Supabase Storage
- Send to Gemini Pro with structured analysis prompt
- Extract:
  - Key terms: rent amount, deposit, lease duration, termination clause, utilities included
  - Risk flags: unusual penalties, no termination clause, excessive deposit, missing insurance
  - Colombian law compliance: check against common Ley 820/2003 requirements
  - Language concerns: if contract is in Spanish, provide English summary
- Calculate risk_score (0-100) based on flag count and severity
- Store analysis in `lease_reviews` table
- Return `{ review_id, risk_score, summary, flags[], terms{} }`

**Example:**
Marcus uploads his lease for apartment #42. Contract-analysis fetches the PDF, sends to Gemini Pro: "Analyze this Colombian lease. The contract specifies: 4M COP/month, 2-month deposit (standard), 6-month minimum (OK), but has a clause allowing landlord entry without notice (RED FLAG) and no clear termination process (YELLOW FLAG)." Risk score: 65/100. Marcus sees: "2 concerns found — review the property access and termination clauses before signing."

### Acceptance Criteria
- [ ] Validates JWT — user must be authenticated
- [ ] Fetches document from Supabase Storage URL
- [ ] Sends to Gemini Pro with structured analysis prompt
- [ ] Extracts: key terms, risk flags, compliance checks
- [ ] Calculates risk_score (0-100)
- [ ] Stores analysis in lease_reviews table
- [ ] Returns structured response with review_id, risk_score, summary, flags
- [ ] Handles PDF parse failures gracefully
- [ ] Supports Spanish and English contracts
- [ ] Logs to ai_runs table (model: gemini-pro, tokens, duration)

**Next:** [`07C-lease-review-card.md`](07C-lease-review-card.md) (depends on this task).
