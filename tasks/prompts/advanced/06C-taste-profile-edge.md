---
id: 06C
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Hermes taste profiles"
title: Implement taste profile learning from search history
skills:
  - supabase/supabase-edge-functions
  - mdeai-tasks
epic: E6
phase: MVP
priority: P2
status: Open
owner: Backend
dependencies:
  - E1-002
estimated_effort: L
percent_complete: 0
outcome: O3
---

# E6-003: Implement Taste Profile Learning

```yaml
---
id: E6-003
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Hermes taste profiles"
title: Implement taste profile learning from search history
skill: edge-function
phase: MVP
priority: P2
status: Open
owner: Backend
dependencies:
  - E1-002
estimated_effort: L
percent_complete: 0
epic: E6
outcome: O3
---
```

### Prompt

Build the taste profile system that learns user preferences from search behavior and improves ranking personalization over time.

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — Hermes: Taste Profiles, search history → preferences
- `tasks/mermaid/06-data-model.mmd` — taste_profiles table (P2)
- `supabase/functions/ai-search/index.ts` — existing search tracking
- [`06E-hermes-intelligence.md`](06E-hermes-intelligence.md) — privacy / Habeas Data, G1–G5

**The build:**
- New edge function at `supabase/functions/taste-profile/index.ts`
- Endpoints:
  - `GET` — Retrieve user's taste profile
  - `POST` — Update profile from search/click/save events
- Track signals: search queries, clicked listings, saved places, time spent on listings, applied filters
- **Privacy:** Inform users that search behavior is used for personalization (privacy policy at `/privacy`). Users can request profile deletion per Colombian Habeas Data. See `tasks/best-practices/data-retention.md` for retention schedule (taste_profiles: deleted with account).
- Build profile: preferred neighborhoods, budget range tendency, amenity preferences, property type
- Use exponential decay: recent signals weighted higher than old ones
- Store in `taste_profiles` table (requires E1-002 for P2 tables or create inline)
- Feed profile into hermes-ranking as additional context

**Example:**
Over 2 weeks, Marcus searches for Laureles 8 times, El Poblado 2 times. He clicks apartments with WiFi >100mbps 6 times. He saves 3 apartments in the 3-4M COP range. His taste profile: { neighborhood_preference: { Laureles: 0.8, El_Poblado: 0.2 }, budget_tendency: [3M, 4M], amenity_affinity: { wifi: 0.9, gym: 0.3 } }. Next search, hermes-ranking boosts Laureles apartments with fast WiFi.

### Acceptance Criteria
- [ ] Edge function validates JWT
- [ ] GET returns user's current taste profile
- [ ] POST accepts search/click/save events and updates profile
- [ ] Exponential decay weights recent signals higher
- [ ] Profile includes: neighborhood preferences, budget tendency, amenity affinity
- [ ] Profile feeds into hermes-ranking for personalized scoring
- [ ] Handles new users (no profile yet → neutral/default weights)
- [ ] Zod validates all inputs

**Integrates with:** [`06A-hermes-ranking-edge.md`](06A-hermes-ranking-edge.md).

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Taste profile persists preferences for better ranking over time. |
| **Workflow** | Table/API → update on user actions → decay old prefs. |
| **Proof** | Profile influences rank in eval harness. |
| **Gates** | RLS: user reads own profile only. |
| **Rollout** | Opt-in for travelers. |

---

