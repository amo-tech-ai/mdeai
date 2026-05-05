---
task_id: 020-gemini-photo-moderation
diagram_id: IDENTITY-VERIFY-FLOW
prd_section: 3.1 AI moderation row, 6 §Q3 deltas
title: Gemini photo + asset moderation edge fn
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 1 day
area: backend
skill:
  - gemini
  - supabase-edge-functions
  - mdeai-project-gates
edge_function: moderate-asset
schema_tables:
  - vote.entities (or new ai_moderation_results table)
  - ai_runs
depends_on:
  - 010-vote-schema
mermaid_diagram: ../diagrams/05-identity-verify-flow.md
---

## Summary

| Aspect | Details |
|---|---|
| **Endpoint** | `POST /moderate-asset` |
| **Model** | gemini-3-flash-preview (multimodal — image + bio text) |
| **Purpose** | Reject nudity / minors / brand conflict / illegal content; flag borderline for admin review |
| **Latency** | < 5s p95 per image |
| **Real-world** | "Laura uploads photo; instant feedback if anything flagged; admin reviews edge cases" |

## Description

**The situation.** Contestants upload 3+ photos in task 018. Admin reviews in task 019. Without auto-moderation, every photo lands on Daniela's desk; high-volume contests overwhelm her.

**Why it matters.** Beauty pageants attract trolls; we need to catch obvious violations before admin queue. Tightened threshold (per `08-plan-audit-response.md`) means false-positive cost is "annoyed contestant", false-negative cost is "brand-safety incident".

**What already exists.** mdeai has Gemini integration patterns (`ai-chat`, `ai-search`). `_shared/gemini.ts` already wired.

**The build.** Edge fn that takes an image (or signed URL) + optional context (bio + entity name), calls Gemini multimodal with structured output schema, returns `{label: 'clean'|'flagged'|'rejected', reasons: [], confidence: 0..1}`.

## Acceptance Criteria

- [ ] Edge fn at `supabase/functions/moderate-asset/index.ts`.
- [ ] Accepts `{storage_path: string, bio?: string, entity_id?: uuid}`.
- [ ] Fetches image via signed URL.
- [ ] Calls Gemini Flash multimodal with system prompt enforcing pageant-safe content rules.
- [ ] Structured output JSON: `{label: 'clean'|'flagged'|'rejected', categories_flagged: [], confidence: number, reason: string}`.
- [ ] Categories: `nudity`, `minors`, `brand_conflict`, `multiple_faces`, `low_quality`, `text_overlay`, `other_violation`.
- [ ] Threshold (configurable): confidence > 0.85 → 'rejected'; 0.60–0.85 → 'flagged'; < 0.60 → 'clean'.
- [ ] Updates `vote.entities.ai_moderation_status` (column to add via task 019 migration tweak) with result.
- [ ] Logs to `ai_runs(agent_name='moderate-asset', input_tokens, output_tokens, duration_ms)`.
- [ ] Reject if Gemini returns invalid JSON; don't mark entity (admin sees no flag, but no false-positive).
- [ ] Cost cap: max $0.01/image; alert at $5/day total spend.
- [ ] Eval: 100 hand-labeled images (50 clean / 30 borderline / 20 reject) → ≥ 95% precision on rejects, ≥ 90% recall.

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Edge fn | `supabase/functions/moderate-asset/index.ts` | Create |
| Shared | `supabase/functions/_shared/gemini.ts` | Reuse |
| Migration | `supabase/migrations/<timestamp>_entities_moderation_columns.sql` | Add `ai_moderation_status text`, `ai_moderation_categories text[]`, `ai_moderation_at timestamptz` to `vote.entities` |
| Hook | `src/hooks/useAssetModeration.ts` | Create — frontend call |
| Eval fixtures | `supabase/functions/tests/moderate-asset-eval/` | Create — 100 images + labels |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Image is corrupted | Return `{label: 'rejected', reason: 'image_unreadable'}`; don't crash |
| Gemini returns invalid JSON | Log error; return `{label: 'clean'}` (admin can still flag manually) |
| Image is huge (>10MB) | Resize via Storage transform before sending to Gemini |
| Multiple faces (e.g. group photo) | label='flagged' with category multiple_faces — admin reviews |
| Bio mentions brand name (e.g. "Postobón ambassador") | Don't flag; brand_conflict only triggers for visual brand placement |
| Pageant swimsuit photo (legit) | label='flagged' for nudity_borderline — admin overrides with context |

## Real-World Examples

**Scenario 1 — Laura uploads hero shot.** Studio photo, professional. Gemini classifies: label=clean, confidence=0.92. Storage row updated. Form shows green checkmark. Laura proceeds. **Without moderation,** Daniela manually inspects every photo — 30s × 100 contestants = 50 min/contest of pure photo review.

**Scenario 2 — Troll uploads inappropriate content.** Submission contains explicit content. Gemini classifies: label=rejected, confidence=0.97, categories=[nudity]. Form rejects upload, shows "Esta foto no cumple las reglas — sube otra". Entity creation blocked at this step. **Without moderation,** Daniela sees it — burnout + brand risk.

**Scenario 3 — Borderline swimsuit.** Pageant tradition includes swimsuit category. Gemini sees skin-heavy photo: label=flagged, confidence=0.78. Form shows yellow warning: "Verificación adicional requerida — sigue subiendo". Entity created with ai_moderation_status='flagged'. Admin (Daniela) reviews; sees swimsuit context; overrides to clean. **Without flagging,** admin spends time on every clean photo too.

## Outcomes

| Before | After |
|---|---|
| Daniela manually reviews every photo | Gemini auto-clears clear-cut clean (~80%); admin reviews borderline only |
| Bad-faith uploads reach admin queue | Rejected at upload time; user must replace |
| Photo review takes 30s × N contestants | Reduced to ~5s × flagged-only contestants |
| No moderation cost tracking | `ai_runs` logs every call; daily cost dashboard |

## Verification

- Eval test fixtures: 100 hand-labeled images — precision ≥ 95% on rejects, recall ≥ 90%.
- Cost monitor: `ai_runs.cost_usd_cents` for `agent_name='moderate-asset'` ≤ 500 cents/day at peak.
- Manual: trigger from contestant intake form (task 018); confirm UI flag appears within 5s.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/05-identity-verify-flow.md`](../diagrams/05-identity-verify-flow.md) — async moderation flow
- [`.claude/skills/gemini/`](../../../.claude/skills/gemini/) — multimodal Gemini patterns
- [`tasks/events/01-contests.md`](../01-contests.md) §6 anti-fraud — moderation as L0 (pre-vote check)
