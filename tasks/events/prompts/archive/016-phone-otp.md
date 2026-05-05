---
task_id: 016-phone-otp
diagram_id: FRAUD-DEFENSE-LAYERS
prd_section: 5.1 Phase 1 ships, 6 §Q3 (phone OTP day 1)
title: Phone OTP via Supabase Auth (default voter authentication)
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 1 day
area: auth
skill:
  - better-auth-best-practices
  - supabase
  - frontend-design
  - mdeai-project-gates
edge_function: null
schema_tables: []
depends_on: []
mermaid_diagram: ../diagrams/03-fraud-defense-layers.md
---

## Summary

| Aspect | Details |
|---|---|
| **Provider** | Supabase Auth phone OTP (Twilio under the hood, configured via Supabase dashboard) |
| **UX** | One-tap modal on first vote; remembered per device thereafter |
| **Cost** | ~$0.05/SMS; budget cap 500/day = ~$25/day at peak |
| **Real-world** | "Camila enters phone, gets SMS in 8s, types code, votes — never asked again on this device" |

## Description

**The situation.** vote-cast (task 011) requires `voter_user_id` to enforce daily quota. Without phone OTP, anonymous voters can't be deduplicated → daily quota meaningless → trust narrative collapses.

**Why it matters.** Per `09-prd.md` §6 Q3, phone OTP day 1 is one of 5 mandatory mitigations for the beauty-pageant Phase 1. Bot-account creation cost goes up 10× when each fake voter needs a SIM card.

**What already exists.** Supabase Auth supports phone OTP natively — just enable in dashboard. Twilio account already used for WhatsApp Business.

**The build.** Phone OTP enabled on Supabase project; `<PhoneOtpModal>` component built; `useAuth` hook extended to handle OTP flow; vote-cast checks `voter_user_id IS NOT NULL` before counting.

## Acceptance Criteria

- [ ] Supabase Auth → Phone (SMS) provider enabled in dashboard, Twilio credentials configured.
- [ ] Component `<PhoneOtpModal>` (in `src/components/auth/`) accepts E.164 phone, sends OTP via `supabase.auth.signInWithOtp({phone})`, accepts 6-digit code, calls `supabase.auth.verifyOtp({phone, token, type: 'sms'})`.
- [ ] On success, sets up Supabase session; useAuth hook reflects authenticated user.
- [ ] First-time vote tap on `/vote/:slug` (task 012) triggers modal if not authenticated.
- [ ] After verification, modal closes and vote fires automatically.
- [ ] Subsequent visits on same device: session persists (Supabase localStorage), no modal.
- [ ] iOS Safari: SMS auto-fill works (`autocomplete="one-time-code"`).
- [ ] Rate limit: max 3 OTP requests per phone per hour (Supabase enforces).
- [ ] Error states: invalid number, expired code, too many attempts.
- [ ] `users` table profile auto-created on first OTP success (Supabase handles via trigger).
- [ ] No PII leaked in URLs or logs (phone hashed in `vote.votes.ip_hash` column anyway).
- [ ] Cost cap: alert at 300 OTPs/day, hard-pause at 500/day (Twilio dashboard alerts).

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Supabase config | Auth → Phone provider | Enable in dashboard |
| Twilio config | Twilio account → SMS sending | Verify Colombia (+57) coverage |
| Component | `src/components/auth/PhoneOtpModal.tsx` | Create |
| Hook | `src/hooks/useAuth.tsx` | Modify — add `requirePhoneOtp` helper |
| Page integration | `src/pages/contest/Vote.tsx` (task 012) | Modify — invoke modal on first vote |
| Test | `src/components/auth/PhoneOtpModal.test.tsx` | Create |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| User enters non-Colombia number | Allow but warn — Twilio cost varies by region |
| OTP code expired | Show "código vencido — solicita uno nuevo" |
| Rate limit hit (3 OTPs/hour) | Show retry-after timestamp |
| User changes phone mid-session | Re-OTP required |
| Twilio outage | Show graceful error; don't lose user's vote selection |
| User closes modal without verifying | Return to vote page; vote button stays inactive |

## Real-World Examples

**Scenario 1 — Camila first vote.** Camila is on `/vote/miss-elegance-colombia-2026`. Taps Votar on Laura. Modal opens: "Verifica tu teléfono para votar". She types `300 555 0123`. SMS arrives in 8s. She enters `123456`. Modal closes; vote fires; Laura's count ticks +1. **Without phone OTP,** she could vote anonymously — but so could 10,000 bots.

**Scenario 2 — Camila second vote (next day).** Same device, same phone. She opens link, taps Votar. Session persists; no OTP modal. Vote fires immediately. Daily quota check: 1 vote yesterday in same contest → fresh quota today → vote counts. **Without persistent session,** Camila would re-OTP every day, killing return-vote behavior.

**Scenario 3 — Bot ring tries 200 fake phones.** Attacker buys 200 SIM cards (or uses VOIP service). 200 phones × ~$5/SIM = $1,000 acquisition cost vs paying $0 for fake email accounts. Bot ring economics shift. **Without phone OTP,** attacker uses email → unlimited fake accounts → trust collapses.

## Outcomes

| Before | After |
|---|---|
| Anonymous votes can't be deduped | One vote per phone per day enforced |
| Bot creation cost: $0 | Bot creation cost: $5–$10 per fake voter (10× hurdle) |
| Daily quota meaningless | Daily quota tied to verifiable identity |
| Cost runaway risk on OTPs | Hard cap 500/day, alerts at 300/day |

## Verification

- Manual: Camila persona — first OTP flow on iPhone Safari; SMS auto-fill works.
- Manual: returning visit — no OTP modal.
- Manual: 4 OTP requests/hour from same phone → 4th rate-limited.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/03-fraud-defense-layers.md`](../diagrams/03-fraud-defense-layers.md) — L3 prerequisite
- [`.claude/skills/better-auth-best-practices/`](../../../.claude/skills/better-auth-best-practices/) — auth patterns
- Supabase Auth phone OTP docs (loaded via `supabase` skill)
