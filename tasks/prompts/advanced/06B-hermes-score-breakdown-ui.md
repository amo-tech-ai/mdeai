---
id: 06B
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Search Results"
title: Build HermesScoreBreakdown component
skills:
  - frontend-design
  - shadcn
  - mdeai-tasks
epic: E6
phase: MVP
priority: P1
status: Open
owner: Frontend
dependencies:
  - E6-001
estimated_effort: M
percent_complete: 0
outcome: O10
---

# E6-002: Build HermesScoreBreakdown Component

```yaml
---
id: E6-002
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Search Results"
title: Build HermesScoreBreakdown component
skill: frontend
phase: MVP
priority: P1
status: Open
owner: Frontend
dependencies:
  - E6-001
estimated_effort: M
percent_complete: 0
epic: E6
outcome: O10
---
```

### Prompt

Build the HermesScoreBreakdown component that displays the 7-factor ranking breakdown for each apartment in search results.

**Depends on:** [`06A-hermes-ranking-edge.md`](06A-hermes-ranking-edge.md) (`hermes-ranking` response shape).

**Read first:**
- `tasks/mermaid/08-frontend-components.mmd` — HermesScoreBreakdown props
- `src/components/apartments/` — existing apartment card components
- `src/components/ui/progress.tsx` — shadcn progress bar
- `.claude/rules/style-guide.md` — design system

**The build:**
- `src/components/rankings/HermesScoreBreakdown.tsx`
- Props: `{ totalScore: number, breakdown: { factor: string, score: number, maxScore: number, label: string }[] }`
- Show total score as a large number with color coding (green >80, yellow 60-80, red <60)
- **WCAG 2.1 AA:** Color-coded scores must include a text label or icon alongside color (e.g., "Excellent" / "Good" / "Fair" or checkmark/warning/alert icons). Do not rely on color alone to convey score quality — this fails WCAG 1.4.1 Use of Color.
- Show each factor as a labeled progress bar with score/max
- Collapsible by default on listing cards, expanded on detail page
- Tooltip explaining each factor on hover
- Progress bars must have `aria-label` and `aria-valuenow`/`aria-valuemax` attributes

**Design:**
- Total score: large bold number in a circle/badge with text label (e.g., "87 — Excellent")
- Factor bars: horizontal, colored by performance (green/yellow/red) **plus** text label per bar
- Font: DM Sans, emerald palette for good scores
- Compact mode for listing cards (just total score + top 3 factors)
- Expanded mode for detail page (all 7 factors with labels)

### Acceptance Criteria
- [ ] Renders total score with color coding **and** text label (WCAG 1.4.1 — not color-only)
- [ ] Shows 7 factor bars with labels and scores
- [ ] Progress bars have `aria-label`, `aria-valuenow`, `aria-valuemax` (WCAG 4.1.2)
- [ ] Compact and expanded modes
- [ ] Tooltips explain each factor (keyboard-accessible, not hover-only)
- [ ] Uses shadcn/ui Progress component
- [ ] Follows design system (DM Sans, emerald palette)
- [ ] Sufficient contrast ratio (>=4.5:1) on score text against badge background
- [ ] `npm run build` passes

**Next (optional ranking stack):** [`06C-taste-profile-edge.md`](06C-taste-profile-edge.md), [`06D-market-snapshot-edge.md`](06D-market-snapshot-edge.md).

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Score breakdown UI matches edge output — no fake numbers. |
| **Workflow** | Bind UI to 06A response shape; loading/error states. |
| **Proof** | Visual match to API; accessibility for values. |
| **Gates** | 06A deployed. |
| **Rollout** | Feature flag UI. |

---

