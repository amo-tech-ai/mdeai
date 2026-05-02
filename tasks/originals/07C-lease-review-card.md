---
id: 07C
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Lease Review"
title: Build LeaseReviewCard component
skills:
  - frontend
  - mdeai-tasks
epic: E7
phase: ADVANCED
priority: P2
status: Open
owner: Frontend
dependencies:
  - E7-002
estimated_effort: M
percent_complete: 0
outcome: O4
---

# E7-003: Build LeaseReviewCard Component

```yaml
---
id: E7-003
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Lease Review"
title: Build LeaseReviewCard component
skill: frontend
phase: ADVANCED
priority: P2
status: Open
owner: Frontend
dependencies:
  - E7-002
estimated_effort: M
percent_complete: 0
epic: E7
outcome: O4
---
```

### Prompt

Build the LeaseReviewCard component that displays AI lease analysis results with risk flags and key terms.

**Epic index:** [`07E-contract-automation.md`](07E-contract-automation.md)

**Depends on:** [`07B-contract-analysis-edge.md`](07B-contract-analysis-edge.md)

**Read first:**
- `tasks/mermaid/08-frontend-components.mmd` — LeaseReviewCard in component hierarchy
- `src/components/ui/card.tsx` — shadcn card primitive
- `src/components/ui/badge.tsx` — for risk flag badges
- `.claude/rules/style-guide.md` — design system

**The build:**
- `src/components/leases/LeaseReviewCard.tsx`
- `src/hooks/useLeaseReview.ts` — hook calling contract-analysis edge function
- Props: `{ reviewId, riskScore, summary, flags[], terms{}, status }`
- Display:
  - Risk score gauge/badge (green <30, yellow 30-70, red >70)
  - Summary paragraph
  - Flag list with severity badges (red=critical, yellow=warning, green=ok)
  - Key terms table (rent, deposit, duration, utilities, termination)
  - Upload button to trigger new analysis
  - Status indicator (pending/analyzed/reviewed)
- AI propose-only pattern: show results, user decides to proceed or not

**Design:**
- Risk score as a large colored circle badge
- Flags as colored badges with icons (warning triangle, check, x)
- Terms in a clean 2-column table
- Playfair Display for "Lease Review" heading
- DM Sans for content
- Follow propose-only pattern: "Review these findings before signing"

### Acceptance Criteria
- [ ] Renders risk score with color-coded gauge
- [ ] Shows AI summary paragraph
- [ ] Displays risk flags with severity badges
- [ ] Key terms displayed in readable table format
- [ ] Upload button triggers contract-analysis
- [ ] Handles 4 states (loading/error/no review/success)
- [ ] Follows propose-only AI pattern
- [ ] Uses shadcn/ui components
- [ ] `npm run build` passes
