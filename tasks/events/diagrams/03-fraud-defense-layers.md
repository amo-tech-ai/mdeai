---
id: FRAUD-DEFENSE-LAYERS
phase: CORE
prd_section: 2.2 Epic E1, 5.1 Trust page, 5.2 Risks (vote manipulation)
type: flowchart
related: [01-vote-cast-flow]
---

# 03 — Five-layer fraud defense (flowchart)

**What this shows.** Defense in depth — a vote attempt has to pass five independent checks before it counts as valid. Each layer catches different attack classes. Inspired by [01-contests.md §6 anti-fraud strategy].

**Phase.** CORE — all five layers must be live before Phase 1 voting opens (mandatory release blocker for Miss Elegance Colombia 2026).

```mermaid
flowchart LR
    classDef l1 fill:#fee2e2,stroke:#991b1b,color:#000
    classDef l2 fill:#fed7aa,stroke:#9a3412,color:#000
    classDef l3 fill:#fef3c7,stroke:#854d0e,color:#000
    classDef l4 fill:#dbeafe,stroke:#1e40af,color:#000
    classDef l5 fill:#e9d5ff,stroke:#6b21a8,color:#000
    classDef pass fill:#dcfce7,stroke:#166534,color:#000
    classDef block fill:#1f2937,color:#fff,stroke:#000

    V[Vote attempt] --> L1

    subgraph L1[L1 Network edge]
        direction TB
        L1A[Vercel WAF +<br/>Cloudflare Turnstile]:::l1
        L1B{Datacenter IP?<br/>Headless browser?<br/>Known abuse range?}
        L1A --> L1B
    end

    L1B -->|Block| BLOCKED[Drop request<br/>403]:::block
    L1B -->|Pass| L2

    subgraph L2[L2 Token nonce]
        direction TB
        L2A[Verify 60s JWT<br/>signed at page render]:::l2
        L2B{Nonce valid?<br/>Single-use?}
        L2A --> L2B
    end

    L2B -->|Reject| BLOCKED
    L2B -->|Pass| L3

    subgraph L3[L3 Hard DB rules]
        direction TB
        L3A[Postgres constraints]:::l3
        L3B{Daily quota OK?<br/>Idempotency key new?<br/>Phone OTP verified?}
        L3A --> L3B
    end

    L3B -->|Conflict| BLOCKED
    L3B -->|Pass| L4

    subgraph L4[L4 Behavioral rules]
        direction TB
        L4A[Sync rules <30ms]:::l4
        L4B{IP burst <5/min?<br/>Device hash unique?<br/>Country/IP match?}
        L4A --> L4B
    end

    L4B -->|Flag suspicious| L5
    L4B -->|Clean| COUNTED[Vote counts<br/>weight=1.0]:::pass

    subgraph L5[L5 AI anomaly async]
        direction TB
        L5A[Gemini fraud-scan cron<br/>every 60s]:::l5
        L5B{Pattern looks like<br/>bot ring or collusion?}
        L5A --> L5B
    end

    L5B -->|Clean| COUNTED
    L5B -->|Suspicious| SHADOW[Shadow-block<br/>weight=0<br/>row stays in DB]:::block
    L5B -->|Confirmed bot| ADMIN[Open admin issue<br/>via Paperclip/Signal]:::block
```

## Layer responsibilities

| Layer | Catches | Speed | Where it runs |
|---|---|---|---|
| **L1 — Network** | DDoS, headless browsers, datacenter IPs | <10ms | Vercel + Cloudflare |
| **L2 — Token nonce** | curl scripts that skip page render | <5ms | Edge fn |
| **L3 — Hard DB rules** | Replay, daily quota breach, unverified phone | <20ms | Postgres constraints |
| **L4 — Behavioral** | IP burst, device-reuse rings, country mismatch | <30ms | Edge fn (sync) |
| **L5 — AI anomaly** | Coordinated bot rings, slow-burn collusion | ~60s lag | Cron + Gemini |

## Notes

- **Shadow-block** is critical for the buy-votes scenario: confirmed-fraud votes stay in `vote.votes` with `weight=0` so the attacker doesn't realize they've been caught and rotate to a new account.
- **Honeypot** field on the form — populated by bots, never by humans — instantly classifies as L4 fraud.
- **Daily IP-hash salt rotation** keeps device fingerprinting privacy-preserving (we don't store raw IPs).
