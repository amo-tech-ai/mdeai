---
id: 06A
diagram_id: MERM-09
prd_section: "5. AI agent architecture — Hermes ranking"
title: Implement hermes-ranking edge function
skills:
  - supabase/supabase-edge-functions
  - mdeai-tasks
epic: E6
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies:
  - E1-001
  - E5-003
estimated_effort: L
percent_complete: 0
outcome: O10
---

# E6-001: Implement hermes-ranking edge function

```yaml
---
id: E6-001
diagram_id: MERM-09
prd_section: "5. AI agent architecture — Hermes ranking"
title: Implement hermes-ranking edge function
skill: edge-function
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies:
  - E1-001
  - E5-003
estimated_effort: L
percent_complete: 0
epic: E6
outcome: O10
---
```

### Prompt

Create the `hermes-ranking` edge function that scores and ranks apartments using a 7-factor weighted composite score.

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — Hermes: Composite Ranking, 7-factor weighted score
- `tasks/mermaid/09-edge-function-map.mmd` — hermes-ranking I/O spec
- `supabase/functions/ai-search/index.ts` — existing search patterns
- `.claude/rules/edge-function-patterns.md` — auth, CORS, Zod, response format
- [`06E-hermes-intelligence.md`](06E-hermes-intelligence.md) — G1–G5 Gemini rules and terminology

**The build:**
- New edge function at `supabase/functions/hermes-ranking/index.ts`
- Accept: `{ apartment_ids: string[], user_preferences: { budget_min, budget_max, neighborhoods[], wifi_min?, stay_length?, amenities[] }, user_id? }`
- **Pagination:** If `apartment_ids` exceeds 100, paginate DB fetches in batches of 100 to avoid query timeouts. Return all scored results in a single response.
- **Ordering relationship with ai-search:** `ai-search` returns keyword/semantic matches (recall); `hermes-ranking` re-ranks those results by composite score (precision). Frontend calls `ai-search` first, then passes results to `hermes-ranking`.
- Fetch apartment data + neighborhood scores from DB
- **Schema dependency:** Requires `apartments` table to have `wifi_speed`, `host_rating`, and `min_stay`/`max_stay` columns. Verify against E1-001 migration. If columns are missing, add them in E1-001 or create a supplementary migration.
- Calculate 7-factor weighted score per apartment:
  - Budget fit (0.25) — how well price matches budget range
  - Neighborhood match (0.20) — requested vs. actual neighborhood + scores
  - WiFi quality (0.15) — meets minimum threshold
  - Stay length fit (0.15) — listing min/max vs. requested duration
  - Amenity match (0.10) — intersection of requested vs. available
  - Host rating (0.10) — host response rate + reviews
  - Freshness (0.05) — listing age penalty (newer = better)
- Return sorted array: `{ apartment_id, total_score, breakdown: { factor: score }[] }`
- Log to `ai_runs` table

**Example:**
Marcus searches for apartments: budget 3-5M COP, Laureles preferred, needs wifi >50mbps, 3-month stay. hermes-ranking scores apartment #42 at 87/100: budget fit 23/25, neighborhood 18/20, wifi 15/15, stay_length 12/15, amenity 7/10, host 9/10, freshness 3/5.

### Acceptance Criteria
- [ ] Edge function validates JWT and extracts user_id
- [ ] Zod schema validates input (apartment_ids, user_preferences)
- [ ] Calculates all 7 weighted factors per apartment
- [ ] Returns sorted apartments with total_score and per-factor breakdown
- [ ] Weights sum to 1.0 (0.25 + 0.20 + 0.15 + 0.15 + 0.10 + 0.10 + 0.05)
- [ ] Handles missing data gracefully (no wifi data → neutral score, not penalty)
- [ ] Logs to ai_runs table (include G5 grounding metadata if applicable)
- [ ] Uses G1 structured JSON schema for score output (not free-text parsing)
- [ ] CORS headers set correctly

**Next:** [`06B-hermes-score-breakdown-ui.md`](06B-hermes-score-breakdown-ui.md) (UI). Build eval dataset in parallel: [`06F-hermes-ranking-eval-dataset.md`](06F-hermes-ranking-eval-dataset.md).

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Hermes ranking returns explainable scores for apartments — travelers see “why this listing.” |
| **Workflow** | Edge function → factors from DB → JSON breakdown → UI optional. |
| **Proof** | Same input → deterministic rank; latency within budget. |
| **Gates** | Columns in prompt exist in DB or migration added. |
| **Rollout** | Shadow rank before default sort. |

---

