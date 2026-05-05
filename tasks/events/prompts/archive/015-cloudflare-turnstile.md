---
task_id: 015-cloudflare-turnstile
diagram_id: FRAUD-DEFENSE-LAYERS
prd_section: 5.1 Phase 1 ships, 09-prd.md §5.2 Risks
title: Cloudflare Turnstile L1 integration (frontend widget + backend verify)
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 0.5 day
area: full-stack
skill:
  - frontend-design
  - supabase-edge-functions
  - mdeai-project-gates
edge_function: vote-cast (modified, not new)
schema_tables: []
depends_on:
  - 010-vote-schema
mermaid_diagram: ../diagrams/03-fraud-defense-layers.md
---

## Summary

| Aspect | Details |
|---|---|
| **Layer** | L1 — Network edge (datacenter IPs, headless browsers, abuse ranges) |
| **Provider** | Cloudflare Turnstile (free, privacy-respecting alternative to reCAPTCHA) |
| **Frontend** | Widget on `/vote/:slug` page, transparent unless suspicious |
| **Backend** | Token verify via Cloudflare API in `_shared/turnstile.ts` (consumed by vote-cast) |
| **Real-world** | "Datacenter IP attempts → 80% rejected at L1 before vote-cast even runs" |

## Description

**The situation.** vote-cast (task 011) has a Turnstile-verify hook stubbed but no actual integration. Without L1, any script that solves nonce + idempotency can vote at scale.

**Why it matters.** Turnstile rejects 80%+ of bot traffic at the edge before it touches Supabase. Free, fast (<200ms verify), low UX cost.

**What already exists.** Cloudflare account already in use (Vercel front-end, optional CF proxy). Free tier covers our scale.

**The build.** Turnstile site key + secret obtained; widget rendered invisible-by-default in `/vote/:slug`; token attached to vote-cast request body; backend verifies token via Cloudflare API.

## Acceptance Criteria

- [ ] Turnstile site key + secret created and stored: site key in `VITE_TURNSTILE_SITE_KEY`, secret in Supabase secret `TURNSTILE_SECRET_KEY`.
- [ ] React component `<TurnstileWidget>` integrated in vote page, renders invisible by default (`appearance="interaction-only"`).
- [ ] Widget produces token on page load + on Vote button hover; passes token to `useVoteCast` hook.
- [ ] Backend helper `_shared/turnstile.ts` exports `verifyTurnstileToken(token, ip): Promise<boolean>`.
- [ ] vote-cast edge fn calls verifyTurnstileToken before any other check; rejects with 403 + code `turnstile_failed` on invalid token.
- [ ] Manual test: try vote-cast with `token="invalid"` → 403; with valid token → proceeds to L2 check.
- [ ] Bot test: simulate datacenter-IP request → Turnstile fails → 403.
- [ ] Latency budget: Turnstile verify adds <200ms p95 to vote-cast.
- [ ] Privacy: no PII sent to Cloudflare beyond the token + IP (Turnstile is GDPR-compliant by design).

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Component | `src/components/contest/TurnstileWidget.tsx` | Create |
| Hook | `src/hooks/useVoteCast.ts` | Modify — include token in request body |
| Edge shared | `supabase/functions/_shared/turnstile.ts` | Create — verify token via fetch to `https://challenges.cloudflare.com/turnstile/v0/siteverify` |
| Edge fn | `supabase/functions/vote-cast/index.ts` | Modify — call verifyTurnstileToken first |
| Env | `.env.example` | Add `VITE_TURNSTILE_SITE_KEY` |
| Secret | Supabase dashboard | Add `TURNSTILE_SECRET_KEY` |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| User on slow network, Turnstile takes 4s to load | Widget shows spinner; vote button disabled until ready |
| Cloudflare verify endpoint timeout | vote-cast returns 503 with retry suggestion |
| User's browser blocks third-party cookies (Turnstile uses none, but...) | Use Turnstile's "interaction-only" mode which doesn't require cookies |
| Datacenter IP that Turnstile didn't catch | L4 rules + L5 cron handle as backstop |
| Same Turnstile token used twice | Cloudflare rejects; vote-cast returns 403 |

## Real-World Examples

**Scenario 1 — Bot ring on finals night.** 1,200 requests from a single hosting provider's IP range hit `/vote-cast` in 30 seconds. Turnstile recognizes datacenter origins; 1,050 requests fail before the edge fn even calls Supabase. The 150 that pass get caught at L4 (IP burst). **Without L1,** all 1,200 hit Supabase — unnecessary load + log noise.

**Scenario 2 — Camila votes normally.** Camila's iPhone 14 on home WiFi loads `/vote/miss-elegance-colombia-2026`. Turnstile widget loads silently (no challenge shown). Token issued in 180ms. She taps Vote; token attached; backend verify in 90ms. Total Turnstile overhead: ~270ms invisible. **Without Turnstile,** she'd need to solve a CAPTCHA — friction that drops conversion.

## Outcomes

| Before | After |
|---|---|
| L1 stubbed in vote-cast | Real Cloudflare Turnstile verify rejects 80%+ of bot traffic before touching Supabase |
| Bot rings inflate Supabase logs | 80% of bot traffic stopped at network edge |
| Real users see no friction | Turnstile invisible by default; ~270ms overhead total |

## Verification

- Manual: bot detector script (curl with datacenter UA + IP) → 403 from vote-cast.
- Manual: real browser → smooth vote within latency budget.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/03-fraud-defense-layers.md`](../diagrams/03-fraud-defense-layers.md) — L1 in context
- Cloudflare Turnstile docs (https://developers.cloudflare.com/turnstile/)
