---
task_id: 024-trust-page
diagram_id: HYBRID-SCORING-FORMULA + FRAUD-DEFENSE-LAYERS
prd_section: 09-prd.md §1.2 Solution, §6 Q3 (Trust page mandatory), 08-plan-audit-response.md §A1
title: Trust page at /vote/:slug/how-it-works (Colombian counsel sign-off blocker)
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 2 days
area: full-stack
skill:
  - mde-writing-plans
  - frontend-design
  - supabase
  - mdeai-project-gates
edge_function: null
schema_tables:
  - vote.contests (read scoring_formula)
depends_on:
  - 014-hybrid-scoring-trigger
mermaid_diagram: null (cross-cutting trust artifact, not a single sequence)
---

## Summary

| Aspect | Details |
|---|---|
| **Route** | `/vote/:slug/how-it-works` |
| **Languages** | English first, then Spanish-Paisa (es-CO) |
| **Legal sign-off** | Colombian counsel review mandatory — MUST be on file before any contest opens |
| **Content** | Scoring formula (live from `scoring_formula`), 5-layer fraud, why it isn't a lottery, deletion path |
| **Real-world** | "Camila reads the page in 3 minutes and trusts the platform" |

## Description

**The situation.** Per `09-prd.md` §6 Q3, Trust page is a Phase 1 release blocker. No contest can go live without it. Pageant trust ≠ generic platform trust — needs pageant-specific legal grounding.

**Why it matters.** Buy-vote scandals destroy pageant platforms. The Trust page is the public commitment to fairness. Bad copy here = no platform.

**What already exists.** mdeai has the typography (DM Sans + Playfair), shadcn components, the writing-skill (`mde-writing-plans`). Hybrid scoring formula is in `vote.contests.scoring_formula` JSONB.

**The build.** A static-ish page (one route + content) that:
1. Loads the active contest's `scoring_formula` and renders it in plain Spanish-Paisa
2. Explains hybrid 50/30/20 (or whatever the formula is) with a visual aid
3. Lists 5-layer fraud defense in language a non-engineer voter understands
4. Distinguishes "this is a skill-based competition, not a lottery" per Colombia Ley 643/2001 + 1581/2012
5. Has Habeas Data deletion path (link to `/account/data` or contact form)
6. Lists transparency commitments (post-event audit, deletion SLA, fraud-incident reporting)
7. Footer link from every voter-facing page

## Acceptance Criteria

- [ ] Route `/vote/:slug/how-it-works` rendered for live contests.
- [ ] Page loads contest by slug; falls back to platform-level `/about/how-voting-works` if no slug match.
- [ ] Section 1 — "How your vote counts" — explains the formula in plain Spanish-Paisa with a visual breakdown (e.g. progress-bar split for 50/30/20).
- [ ] Section 2 — "How we prevent fraud" — explains 5 layers in 5 short paragraphs (not technical jargon).
- [ ] Section 3 — "Why this isn't a lottery" — explicitly cites Ley 643/2001 distinction, says the contest is skill-based with public + judge weighting.
- [ ] Section 4 — "Your data + privacy" — Habeas Data Ley 1581/2012 — what we collect, why, how to delete.
- [ ] Section 5 — "What happens if something goes wrong" — incident response: who decides, how shadow-block works publicly, post-event audit commitment.
- [ ] Footer link "¿Cómo funciona la votación?" on `/vote/:slug` (task 012) and every voter-facing surface.
- [ ] **Colombian legal counsel review on file** — link to signed PDF in admin folder; status badge "Reviewed by [counsel name] [date]" visible at bottom.
- [ ] Spanish-Paisa voice quality reviewed by Spanish-native QA contractor (per `09-prd.md` §6 Q2 recommendation).
- [ ] English version available via lang toggle (en first, es-CO second).
- [ ] Mobile-first; reads cleanly on iPhone SE width.
- [ ] Lighthouse a11y = 100; readable at WCAG AA contrast.
- [ ] Page includes a **printable PDF** generation button (for organizers + sponsors who want paper trail).
- [ ] No JavaScript-required content (graceful degradation).

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Page | `src/pages/contest/HowItWorks.tsx` | Create |
| Component | `src/components/contest/trust/FormulaVisualizer.tsx` | Create |
| Component | `src/components/contest/trust/FraudLayersExplainer.tsx` | Create |
| Component | `src/components/contest/trust/LegalDistinctionExplainer.tsx` | Create |
| Component | `src/components/contest/trust/PrivacyPolicy.tsx` | Create |
| Component | `src/components/contest/trust/IncidentResponse.tsx` | Create |
| Component | `src/components/contest/trust/CounselSignoffBadge.tsx` | Create |
| Hook | `src/hooks/useContestFormula.ts` | Create — reads scoring_formula |
| i18n | `src/locales/en/trust.json` + `src/locales/es-CO/trust.json` | Create — bilingual content |
| Router | `src/App.tsx` | Modify — add route |
| Test | `src/pages/contest/HowItWorks.test.tsx` | Create |
| Storage | `legal_artifacts/counsel-signoff-2026-05.pdf` | Upload (admin task) |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Contest has custom formula (e.g. restaurant week 0.7/0.0/0.3) | Page renders the custom formula; copy adapts |
| User toggles language mid-page | Page re-renders in new language; URL preserves slug |
| Counsel sign-off PDF missing | Trust page shows "⚠️ This contest has not yet completed legal review — voting disabled" + admin alert |
| Page accessed without slug | Falls back to platform-wide `/about/how-voting-works` |
| Habeas Data deletion request | Footer form posts to `/account/data` with rate-limit |

## Real-World Examples

**Scenario 1 — Camila reads before voting.** Camila opens `/vote/miss-elegance-colombia-2026`. Curious about how voting works — taps footer link. Page loads in 1.2s. She reads section 1 (50% public, 30% judges, 20% engagement) in 30s. Reads section 2 (fraud defense) in 60s. Confidence: high. Returns to vote page; votes for Laura. **Without Trust page,** Camila might mistrust the count + not vote.

**Scenario 2 — Journalist asks about a buy-vote rumor.** Newspaper journalist heard rumor that Postobón's sponsorship "buys" Laura the win. Reads section 1 (sponsorship doesn't affect vote weighting); section 5 (post-event audit publishes vote-weight distribution); section 3 (skill-based competition). Journalist publishes neutral article. **Without Trust page,** journalist publishes "Mdeai unclear on how votes work" → reputation damage.

**Scenario 3 — Fraud incident handled.** Synthetic 200-vote bot ring on finals night; admin shadow-blocks; Trust page section 5 says "shadow-blocks reported in post-event audit". Day after finals, mdeai publishes audit report listing block events. Public + sponsors see transparency. **Without commitment,** trust degrades quietly.

## Outcomes

| Before | After |
|---|---|
| Voters guess how scoring works | Page explains formula + fraud defense in plain language |
| No legal grounding | Counsel sign-off + Ley 643/2001 + 1581/2012 explicit |
| Buy-vote rumors metastasize | Public commitment to audit closes the narrative gap |
| Habeas Data path opaque | One-click deletion + clear retention policy |

## Verification

- Manual: Camila persona reads start to end in <3 min; comprehension test ("describe how voting works") passes for 5 of 5 testers.
- Legal: counsel signs off PDF; PDF accessible from admin folder.
- Spanish QA: contractor reviews voice; passes Paisa-specific phrasing checks.
- Lighthouse: a11y = 100; performance ≥ 90 on mobile.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/02-hybrid-scoring-formula.md`](../diagrams/02-hybrid-scoring-formula.md) — formula source
- [`tasks/events/diagrams/03-fraud-defense-layers.md`](../diagrams/03-fraud-defense-layers.md) — fraud-layer source
- [`09-prd.md`](../09-prd.md) §1.2 + §6 Q3 — Trust page rationale
- [`08-plan-audit-response.md`](../08-plan-audit-response.md) §A1 — task A1 (counsel sign-off)
- [`.claude/skills/mde-writing-plans/`](../../../.claude/skills/mde-writing-plans/) — copy patterns
