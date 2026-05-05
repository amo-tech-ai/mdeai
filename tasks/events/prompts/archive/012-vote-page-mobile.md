---
task_id: 012-vote-page-mobile
diagram_id: VOTE-CAST-FLOW
prd_section: 2.2 Epic E1.1, E1.3
title: Build /vote/:slug mobile-first 1-tap voting page
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 2 days
area: frontend
skill:
  - frontend-design
  - vercel-react-best-practices
  - vitest-component-testing
  - mdeai-project-gates
edge_function: vote-cast
schema_tables:
  - vote.contests
  - vote.entities
  - vote.entity_tally
depends_on:
  - 011-vote-cast-edge-fn
mermaid_diagram: ../diagrams/01-vote-cast-flow.md
---

## Summary

| Aspect | Details |
|---|---|
| **Route** | `/vote/:slug` |
| **Frame** | mdeai Vite/React/shadcn/Tailwind, 3-panel layout collapsed to 1-column on mobile |
| **First Contentful Paint target** | < 1.5s on 3G |
| **Vote target** | 1 tap to cast (after phone OTP done once per device) |
| **Real-world** | "Camila opens TikTok bio link → page loads in 1.2s → taps Votar → vote in 240ms → share modal appears" |

## Description

**The situation.** The `vote-cast` edge fn (task 011) exists but no UI calls it. Camila has nowhere to vote.

**Why it matters.** Phase 1 demos this page. It's the only public surface a voter sees. UX quality here defines viral pickup.

**What already exists.** mdeai has shadcn/ui components, Tailwind, the 3-panel layout (`mdeai-three-panel.md`), DM Sans + Playfair fonts, emerald/cream/charcoal palette. Existing patterns: `src/pages/Apartments.tsx` shows mobile-first list page; `src/components/listings/` shows card patterns; `useAnonSession` is the existing pattern for anonymous voters.

**The build.** A new route `/vote/:slug` with:
- Hero with contest title + countdown to `ends_at`
- Top-3 leaderboard tiles (real-time via task 013)
- Scrollable contestant grid (mobile: 2 cols; desktop: 3-4 cols)
- Each card: hero photo, display_name, rank badge, current vote count, **Votar** button
- Click Votar → if no phone OTP, prompt OTP via Supabase Auth → after OTP, fire `vote-cast`
- Optimistic update on success → share modal opens

**Example.** Camila opens `mdeai.co/vote/miss-elegance-colombia-2026` from her TikTok bio. Page hydrates 1.2s on her 4G. She scrolls past the hero, sees Laura at #4. Taps **Votar**. First time, OTP modal appears — she enters her phone, gets SMS, types code. Vote fires. Laura's count ticks +1, rank shifts to #3. Share modal appears: "Comparte tu voto, gana 3 votos extra mañana".

## Rationale

**Problem.** Without a public voting page, the platform has no front door.
**Solution.** Mobile-first one-tap voting with optimistic updates and share-loop integration.
**Impact.** Phase 1 acceptance gate "1k votes cast" hinges on this page being good.

## User Stories

| As a... | I want to... | So that... |
|---|---|---|
| Voter (Camila) | open the link from TikTok and vote in 2 taps | I support my prima without friction |
| Voter | see the leaderboard update live | I trust the count is real |
| Voter | share my vote and earn bonus votes | I help my friend's friend's daughter win |
| Organizer (Daniela) | preview how the page looks before publishing | I can sign off on UX before launch |

## Goals

1. **Primary:** Voter can complete vote → share within 5 seconds (excluding OTP first-time).
2. **Quality:** Lighthouse mobile performance ≥ 85; FCP <1.5s on 3G.
3. **Accessibility:** Lighthouse a11y = 100; keyboard-navigable; touch target ≥ 44px.

## Acceptance Criteria

- [ ] Route `/vote/:slug` rendered via React Router with code-split chunk (lazy-loaded).
- [ ] Page reads `vote.contests` by slug; 404 if not found or `status != 'live'`.
- [ ] Hero shows: title, kind badge, "Vota antes de" + countdown using user's local timezone.
- [ ] Top-3 leaderboard tiles render from `vote.entity_tally` JOIN `vote.entities`.
- [ ] Contestant grid: mobile 2 cols (≤640px), tablet 3 cols, desktop 4 cols. CSS Grid or shadcn equivalent.
- [ ] Each card: hero_url with lazy-loading, display_name, rank badge, audience_votes count, **Votar** button.
- [ ] **Votar** button is min 44×44px, focus-visible, screen-reader-labeled `Votar por {display_name}`.
- [ ] First Vote tap triggers phone-OTP flow (modal) if not already verified for this device.
- [ ] After OTP, vote fires immediately. Optimistic UI: counter ticks +1, rank may shift.
- [ ] On vote-cast 200 success: confirmation toast + share modal opens.
- [ ] On vote-cast 429: toast "Espera un momento" + disable button 30s.
- [ ] On vote-cast 409 (daily quota): toast "Ya votaste hoy. Comparte para ganar votos extra mañana" + share modal.
- [ ] Realtime channel subscription updates `entity_tally` cells live (task 013 wiring).
- [ ] Loading: shadcn Skeleton on first paint; not blank.
- [ ] Empty state: "Esta competencia aún no tiene candidatas. Vuelve pronto." (es-CO)
- [ ] Error state: retry button on network failure.
- [ ] Footer: "¿Cómo funciona la votación?" link to `/vote/:slug/how-it-works` (task 015).
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility = 100, Best Practices ≥ 95.
- [ ] `npm run test` for the new component passes.

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Page | `src/pages/contest/Vote.tsx` | Create |
| Component | `src/components/contest/ContestHero.tsx` | Create |
| Component | `src/components/contest/LeaderboardTopThree.tsx` | Create |
| Component | `src/components/contest/EntityCard.tsx` | Create |
| Component | `src/components/contest/VoteButton.tsx` | Create |
| Component | `src/components/contest/ShareModal.tsx` | Create |
| Component | `src/components/contest/PhoneOtpModal.tsx` | Create (or reuse if Auth task 016 already shipped) |
| Hook | `src/hooks/useContest.ts` | Create — TanStack Query for contest + entities + tally |
| Hook | `src/hooks/useVoteCast.ts` | Create — wraps task 011 edge fn |
| Hook | `src/hooks/useRealtimeTally.ts` | Create — Supabase Realtime subscription (task 013) |
| Router | `src/App.tsx` | Modify — add route |
| Test | `src/pages/contest/Vote.test.tsx` | Create |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Slug not found | 404 page with "Volver al inicio" CTA |
| Contest in `draft` | 404 (don't leak draft status) |
| Contest in `closed` | Read-only view of final leaderboard, no Votar buttons |
| User on iOS Safari with autofill | OTP input must accept paste from SMS autofill (`autocomplete="one-time-code"`) |
| User backs out of OTP modal | Vote button reverts to inactive; can retry tap later |
| Realtime disconnects | UI continues to work with stale data; reconnect badge shown |
| User has already voted today | Vote button shows "Ya votaste — Comparte" + opens share modal directly |
| User scrolls fast on mobile | Cards lazy-load images; first 6 above fold load eagerly |

## Real-World Examples

**Scenario 1 — Camila first vote.** Camila opens link from TikTok bio. Page paints in 1.2s. She sees Laura at #4 with 287 votes. Taps Votar. Phone-OTP modal opens (first vote on this device). Enters +57 300 555 0123, gets SMS in 8s, types code. Vote fires; Laura's count ticks 287→288, rank shifts #4→#3. Share modal: "Comparte tu voto, gana 3 votos extra mañana." She taps WhatsApp, sends to her primas group. **Without this page,** voting is impossible — TikTok bio link goes to a 404.

**Scenario 2 — Returning voter (Camila day 2).** Next day, she opens the same link. Phone OTP cached, no modal. Taps Votar — vote in 240ms. Bonus-vote counter shows "+3 votos extra (de tus primas que votaron)". Toast: "+1 voto + 3 bonus votes used today. Limite alcanzado." **Without this page,** the share-loop is decoupled from voting and Camila's bonus is invisible.

**Scenario 3 — Daniela preview.** Daniela opens `/vote/miss-elegance-colombia-2026` on her laptop before publishing. She sees the desktop 4-column layout. Top-3 tiles, hero, countdown. She rotates her phone simulator to verify mobile 2-col. **Without preview-mode parity,** she'd ship and discover a layout bug at finals.

## Outcomes

| Before | After |
|---|---|
| No public voting page | `/vote/:slug` is the front door for the contest |
| TikTok bio link goes to 404 | Camila sees Laura, votes, shares in 5s |
| Layout broken on mobile | Mobile-first 2-col grid, 44px touch targets, FCP <1.5s |
| Realtime updates absent | Counters tick live as friends vote |
| Phone OTP friction unclear | One-time prompt per device; cached after |

## Verification

- Manual: walk through Camila scenario on real iPhone 12 + Pixel 6 on 4G.
- Lighthouse: mobile run scores ≥ 85 / 100 / 95 / 90 (perf / a11y / BP / SEO).
- Vitest: 8 unit tests covering happy path, OTP flow, quota exceeded, 429 backoff, network error, share modal, Realtime tick, empty state.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/01-vote-cast-flow.md`](../diagrams/01-vote-cast-flow.md) — sequence
- [`.claude/skills/mdeai-three-panel.md`](../../../.claude/skills/mdeai-three-panel.md) — layout
- [`.claude/rules/style-guide.md`](../../../.claude/rules/style-guide.md) — TypeScript + React patterns
- [`.claude/skills/vercel-react-best-practices/`](../../../.claude/skills/vercel-react-best-practices/) — Vite/React perf
