---
id: VOTE-CAST-FLOW
phase: CORE
prd_section: 2.2 Epic E1.1, 4.4 vote-cast endpoint
type: sequence
related: [02-hybrid-scoring-formula, 03-fraud-defense-layers, 04-vote-schema]
---

# 01 — Vote cast end-to-end (sequence)

**What this shows.** From the moment a voter (Camila) taps "Votar" to the leaderboard updating in real time. Includes phone OTP, rate limit, idempotency, fraud signal, and Realtime fan-out.

**Phase.** CORE — required for Phase 1 ("Miss Elegance Colombia 2026" — free voting).

```mermaid
sequenceDiagram
    autonumber
    actor V as Voter (Camila)
    participant FE as Vite/React<br/>/vote/:slug
    participant TS as Cloudflare Turnstile
    participant EF as Edge Fn vote-cast
    participant RL as rate_limit_hits<br/>(Postgres RPC)
    participant DB as vote.votes<br/>(insert)
    participant TR as Postgres trigger<br/>(entity_tally + fraud_signal)
    participant RT as Supabase Realtime
    participant SMS as Twilio SMS

    V->>FE: Open contest page
    FE->>FE: Load nonce JWT (60s TTL)
    V->>FE: Tap Votar
    alt Phone not yet verified
        FE->>SMS: Request OTP
        SMS-->>V: SMS code
        V->>FE: Enter OTP
        FE->>FE: Phone verified for session
    end
    FE->>TS: Solve challenge
    TS-->>FE: Turnstile token
    FE->>EF: POST vote-cast { contest_id, entity_id, nonce, fingerprint, idempotency_key }
    EF->>EF: Verify nonce + Turnstile
    EF->>RL: check_rate_limit(user_id, ip_hash)
    alt Rate limit exceeded
        RL-->>EF: blocked
        EF-->>FE: 429 Too Many Requests
        FE-->>V: Wait a moment
    else Allowed
        RL-->>EF: ok
        EF->>DB: INSERT vote (with idempotency_key UNIQUE)
        alt Duplicate idempotency_key
            DB-->>EF: Conflict (already counted)
            EF-->>FE: 200 OK already_counted
        else New vote
            DB-->>EF: Row inserted
            DB->>TR: After-insert trigger fires
            TR->>TR: Update entity_tally aggregates
            TR->>TR: Run synchronous L4 rule check
            opt L4 flagged
                TR->>TR: Insert fraud_signal row
            end
            TR->>RT: postgres_changes broadcast
            RT-->>FE: Tally update event
            FE->>FE: Re-render leaderboard
            EF-->>FE: 200 OK
            FE-->>V: Vote registered + share modal
        end
    end
```

## Notes

- **Nonce JWT.** Issued at page render, 60-second TTL, single-use. Kills curl scripts that skip the page.
- **Phone OTP.** Cached per-session — voter enters OTP once per device per day, then 1-tap voting until daily quota.
- **Idempotency.** `UNIQUE` constraint on `idempotency_key` makes the INSERT safe to retry.
- **L4 fraud rule.** Synchronous (<30ms) — IP burst, device reuse, country mismatch. L5 (Gemini AI anomaly) runs async.
- **Realtime fan-out.** All viewers of the contest page see the new total within 2 seconds.
