# mdeai Roadmap + System Diagrams

*Version 1.0 · Locked: 2026-04-23 · Companion to `tasks/MDEAI-MASTER-PRD.md`*

This document is the single-page visual view of mdeai. It uses two skills:
- **roadmap** — Now / Next / Later + quarterly outcomes, capacity-aware
- **mermaid-diagrams** — all visuals rendered as Mermaid so they live in-repo, diff clean, and update with code

Every diagram here is a live Mermaid block — renders on GitHub, in any IDE markdown preview, and in the Supabase/Vercel dashboards that accept Mermaid.

---

## 1. Now · Next · Later

The roadmap skill's recommended view when you need to say *"what ships when"* without over-committing to dates 6 months out. Everything left of the vertical bar is a commitment; right of the bar is a bet.

| NOW (Week 2–5 · committed) | NEXT (Month 2 · planned) | LATER (Month 3+ · bets) |
|---|---|---|
| Week 2: context chips · save/trip · left-nav · SEO CTA · affiliate attribution | pgvector + embeddings + HNSW index | OpenClaw skills (ingest-*, scam-score, outreach) |
| Week 3: Google Places → restaurants tool + 🍽️ pins | Hermes-style composite ranker RPC | Paperclip governance (budgets, approvals, audit) |
| Week 4: Eventbrite → events tool + 🎉 pins | User taste vectors + personalization re-rank | WhatsApp channel (Infobip) |
| Week 5: Places `tourist_attraction` → attractions tool + 📍 pins | Gemini conversation memory summarization | Native Stripe Connect rental bookings |
| First paying agent + $500 credit pack | Firecrawl ingestion (FazWaz, Metrocuadrado, FincaRaiz) | Landlord SaaS ($29–99/mo) |
| First affiliate click + `outbound_clicks` table | Apify Airbnb + Facebook Groups (accept account risk) | Scam-check API (B2B, $0.10/check) |
| — | `scam_signals` table + price/photo hash detection | Multi-city (Bogotá, Cartagena) |
| — | Lease review AI (PDF → clauses → risk tier) | Verified-agent marketplace |

**Capacity note:** All of NOW is committed against existing Week 1 velocity (1 engineering day ≈ 1 column in the table). NEXT assumes continued solo pace. LATER assumes either more hands or externalizing scrape infra.

---

## 2. 12-month roadmap (Gantt)

```mermaid
gantt
    title mdeai 12-month delivery plan
    dateFormat YYYY-MM-DD
    axisFormat %b %Y

    section Phase 1 — MVP
    Week 1 chat canvas + cards + anon gate      :done, p1w1, 2026-04-21, 5d
    Week 2 hooks + affiliate + SEO CTA          :active, p1w2, after p1w1, 5d

    section Phase 2 — Multi-vertical
    Restaurants (Google Places)                 :p2r, after p1w2, 5d
    Events (Eventbrite)                         :p2e, after p2r, 5d
    Attractions (Places tourist_attraction)     :p2a, after p2e, 5d
    First paying agent milestone                :milestone, after p2a, 0d

    section Phase 3 — Intelligence
    pgvector + embeddings + HNSW                :p3v, after p2a, 7d
    Hermes composite ranker RPC                 :p3r, after p3v, 5d
    Taste vectors + re-rank                     :p3t, after p3r, 5d
    Conversation memory summarization           :p3m, after p3t, 3d
    $5K MRR milestone                           :milestone, mms5k, after p3m, 0d

    section Phase 4 — Automation
    Firecrawl ingestion (FazWaz+MetrC+FincaR)   :p4f, after p3m, 7d
    Apify Airbnb actor + anti-dedup             :p4a, after p4f, 5d
    Apify FB Groups + paste-in fallback         :p4g, after p4a, 5d
    Scam-score pipeline                         :p4s, after p4g, 5d
    WhatsApp webhook (Infobip)                  :p4w, after p4s, 5d
    $15K MRR milestone                          :milestone, mms15k, after p4w, 0d

    section Phase 5 — Scale + B2B
    Native Stripe Connect bookings              :p5s, after p4w, 10d
    Landlord SaaS v1 ($29/mo)                   :p5l, after p5s, 10d
    Scam-check public API (B2B)                 :p5c, after p5l, 7d
    Verified-agent marketplace                  :p5v, after p5c, 10d
    Multi-city Bogotá                           :crit, p5m, after p5v, 21d
    $50K MRR milestone                          :milestone, mms50k, after p5m, 0d
```

---

## 3. System architecture (layered flowchart)

```mermaid
flowchart TB
    subgraph UI["Chat layer · Vite + React + TS · Vercel"]
        CC[ChatCanvas]
        CM[ChatMessageList + EmbeddedListings]
        CMAP[ChatMap + MapContext]
        CRT[ChatReasoningTrace]
        CI[ChatInput]
    end

    subgraph EDGE["Edge functions · Deno · Supabase"]
        ACR["ai-chat (TOOLS registry, SSE sidecar)"]
        AR[ai-router]
        REN[rentals]
        SN["search-nearby (P2)"]
        SE["search-events (P2)"]
        ING["ingest-* (P4)"]
        NOR["normalize-dedupe (P3)"]
        SCM["scam-score (P3)"]
        EMB["embed (P3)"]
        WHA["whatsapp-webhook (P4)"]
    end

    subgraph DATA["Data layer · Supabase Postgres 17"]
        APT[apartments + pgvector]
        AS[apartment_sources]
        RES[restaurants]
        EV[events]
        TD[tourist_destinations]
        CONV[conversations + messages]
        RL[rate_limit_hits]
        AR2[ai_runs]
        TR[trips + trip_items]
    end

    subgraph INTEL["Intelligence layer · Phase 3"]
        RANK[Composite ranker RPC]
        SEM[apartments_semantic_search RPC]
        TASTE[user_taste_vectors]
    end

    subgraph EXEC["Execution layer · Phase 4"]
        FC[Firecrawl]
        AP[Apify Airbnb + FB]
        GP[Google Places]
        EB[Eventbrite]
        IB[Infobip WhatsApp]
    end

    subgraph MGMT["Management · Phase 4"]
        PC[Paperclip · budgets + approvals + audit]
        CRON[pg_cron + Trigger.dev]
        PH[PostHog]
        SEN[Sentry]
    end

    UI -- fetch/SSE --> EDGE
    EDGE -- SQL via RLS --> DATA
    EDGE -- RPC --> INTEL
    INTEL -- reads --> DATA
    ING -- HTTP --> FC
    ING -- HTTP --> AP
    SN -- HTTP --> GP
    SE -- HTTP --> EB
    WHA -- HTTP --> IB
    CRON --> ING
    CRON --> NOR
    CRON --> SCM
    CRON --> EMB
    PC -.audit.-> AR2
    PC -.budgets.-> EDGE
```

---

## 4. Current sprint + backlog (Kanban)

```mermaid
kanban
    Done
        [Tool-registry refactor + ChatCanvas at /]@{ priority: 'High' }
        [Inline RentalCardInline + EmbeddedListings]
        [MapContext + ChatMap + reasoning trace]
        [Structured response + Not a Fit table]
        [Anon 3-msg gate + EmailGateModal (curl-proven)]
        [Durable Postgres rate limiter]
        [Seed 43 apartments with hosts+ratings+sources]
        [Vercel build green]

    In Progress (Week 2)
        [Context chips bar + session_data jsonb]@{ priority: 'High' }
        [♥ Save + ➕ Add-to-trip wiring]@{ priority: 'High' }

    Up Next (Week 2 remaining)
        [ChatLeftNav with chat history + saved + trips]
        [/apartments/:id "Ask mdeai about this →" CTA]
        [outbound_clicks table + affiliate tag injection]@{ priority: 'Very High' }

    Phase 2 backlog
        [search-nearby edge fn + Google Places wrapper]
        [Seed 200 Medellin restaurants via Places]
        [RestaurantCardInline + pin]
        [Eventbrite tool + EventCardInline + pin]
        [Attractions tool + pin]
        [First paying agent ($500 credit pack)]@{ priority: 'Very High' }

    Phase 3 backlog
        [pgvector extension + embedding column + HNSW]
        [apartments_semantic_search RPC]
        [Hermes composite ranker]
        [user_taste_vectors + personalization re-rank]
        [Firecrawl FazWaz/Metrocuadrado/FincaRaiz]
```

---

## 5. User journey — Medellín nomad finds + saves a rental

```mermaid
journey
    title Nomad moving to Medellín — first session to conversion
    section Discover
        Google "rentals Laureles 2 months":  3: Nomad
        Lands on mdeai.co/ chat canvas    :  5: Nomad
        Sees welcome + quick-action chips :  5: Nomad
    section Search
        Types "2BR Laureles, fast wifi, $1200" :  5: Nomad, AI
        Sees Thought-for-Ns reasoning trace    :  5: Nomad
        5 rental cards render inline + pins    :  5: Nomad, AI
        Reads Not-a-Good-Fit reasons           :  4: Nomad
    section Refine
        "cheaper and closer to Parque Lleras"  :  4: Nomad, AI
        Cards + pins update in place           :  5: Nomad, AI
    section Save
        ♥ saves 2 rentals                       :  5: Nomad
        ➕ adds top pick to new trip            :  5: Nomad
    section Upsell
        Sees What's Nearby (restaurants)       :  4: Nomad, AI
        Adds 1 restaurant to trip              :  4: Nomad
        Sees This Week events                  :  3: Nomad, AI
    section Convert
        Clicks "View on Airbnb →" with affiliate tag : 5: Nomad
        mdeai logs outbound_click + earns commission : 5: mdeai
        OR clicks "Contact landlord via mdeai"       : 4: Nomad
        Lead captured, sold to agent $30             : 5: mdeai
```

---

## 6. Sequence — chat tool-call end-to-end

```mermaid
sequenceDiagram
    actor U as User
    participant W as Web (ChatCanvas)
    participant E as ai-chat edge fn
    participant R as Rate limiter (rate_limit_hits)
    participant G as Gemini 3 Flash
    participant T as TOOLS registry
    participant D as Supabase (apartments)

    U->>W: types "top 5 rentals Laureles"
    W->>E: POST /ai-chat + anon session id
    E->>R: check_rate_limit (3/24h anon or 10/min authed)
    R-->>E: allowed
    E->>G: completion w/ tools=[rentals_search, search_apartments, ...]
    G-->>E: assistantMessage with tool_calls
    E->>E: emit SSE phase "handoff · Rentals Concierge"
    E->>T: dispatchTool("search_apartments", params)
    T->>D: select … order by rating limit 10
    D-->>T: rows
    T-->>E: ToolResponse { listings, considered_but_rejected, actions }
    E->>E: emit SSE phase "thinking · Considering 43 matches"
    E->>E: emit SSE sidecar { mdeai_actions: [...] }
    E->>G: final stream call w/ tool result
    G-->>E: SSE content chunks (structured response)
    E-->>W: SSE stream (phases + actions + content)
    W->>W: render reasoning trace, cards, pins, Not-a-Fit, follow-up
    W-->>U: interactive view
```

---

## 7. Data model (ERD)

```mermaid
erDiagram
    profiles ||--o{ conversations : "owns"
    conversations ||--o{ messages : "contains"
    conversations ||--o{ ai_runs : "tracks"
    profiles ||--o{ saved_places : "saves"
    profiles ||--o{ trips : "plans"
    trips ||--o{ trip_items : "includes"
    profiles ||--o{ leads : "generates"
    leads ||--o{ showings : "schedules"
    leads ||--o{ rental_applications : "submits"
    apartments ||--o{ saved_places : "saved as"
    apartments ||--o{ showings : "visited via"
    apartments ||--o{ property_verifications : "verified by"
    apartments ||--o{ trip_items : "added to trip"
    apartments ||--o{ apartment_sources : "aggregated from (P3)"
    apartments ||--o{ scam_signals : "flagged by (P3)"
    neighborhoods ||--o{ apartments : "located in"
    profiles ||--o{ user_taste_vectors : "profiles (P3)"
    profiles ||--o{ outbound_clicks : "clicks (P2)"
    apartments ||--o{ outbound_clicks : "referred to (P2)"
    rate_limit_hits }o--|| profiles : "keyed by user_id or anon sid"

    profiles {
        uuid id PK
        text email
        text full_name
        timestamptz created_at
    }
    apartments {
        uuid id PK
        text title
        text neighborhood
        numeric price_monthly
        int bedrooms
        int wifi_speed
        text[] amenities
        text[] images
        numeric rating
        text host_name
        bool verified
        text source_url
        vector description_embedding "P3 · 1536-dim"
        numeric trust_score "P3"
        text scam_risk "P3 · low|medium|high"
        geography location "PostGIS"
    }
    apartment_sources {
        uuid id PK
        uuid canonical_apartment_id FK
        text source "airbnb | fazwaz | facebook | direct"
        text source_url
        jsonb raw_jsonb
        text[] photo_hashes
        timestamptz scraped_at
    }
    conversations {
        uuid id PK
        uuid user_id FK
        text title
        jsonb session_data "P2 · context chips persistence"
        timestamptz last_message_at
    }
    messages {
        uuid id PK
        uuid conversation_id FK
        text role
        text content
        int total_tokens
    }
    trips {
        uuid id PK
        uuid user_id FK
        text name
        date start_date
        date end_date
    }
    leads {
        uuid id PK
        uuid user_id FK
        text status
        uuid assigned_agent_id FK
        text idempotency_key
    }
    outbound_clicks {
        uuid id PK
        uuid user_id FK
        uuid apartment_id FK
        text source_host
        text affiliate_tag
        timestamptz created_at
    }
    user_taste_vectors {
        uuid user_id PK
        vector rental_preferences "P3 · 1536-dim"
        vector restaurant_preferences "P3"
    }
    scam_signals {
        uuid id PK
        uuid apartment_id FK
        text signal_type
        numeric score
        jsonb evidence
    }
    rate_limit_hits {
        text bucket_key PK
        timestamptz window_start PK
        int count
    }
```

---

## 8. Scraping pipeline — decision tree

```mermaid
flowchart TD
    Start([New data source needed]) --> API{Official API exists?}
    API -- Yes --> USE_API[Use API · Google Places / Eventbrite / Viator]
    API -- No --> TOS{Public data + permissive TOS?}

    TOS -- Yes --> FC[Firecrawl extract w/ Zod schema]
    TOS -- No --> ACTOR{Battle-tested Apify Actor?}

    ACTOR -- Yes --> APIFY[Apify run · accept community-maintenance risk]
    ACTOR -- No --> LAST[Playwright/Browserbase w/ residential proxies OR skip source]

    USE_API --> STAGE
    FC --> STAGE
    APIFY --> STAGE
    LAST --> STAGE

    STAGE[staging_listings table] --> GEM[Gemini extract → Zod validate]
    GEM --> EMBED[Generate pgvector embedding]
    EMBED --> DEDUP[pgvector cosine &gt; 0.92 OR<br/>PostGIS &lt; 50m OR<br/>photo pHash match]
    DEDUP -- duplicate --> MERGE[Merge into existing apartment · append to sources array]
    DEDUP -- new --> INSERT[Insert into apartments]
    MERGE --> SCORE
    INSERT --> SCORE
    SCORE[Scam score + freshness check]
    SCORE --> READY([Listing ready for chat search])

    classDef warn fill:#fee,stroke:#c00
    class LAST warn
```

---

## 9. Anonymous-to-authed session lifecycle

```mermaid
stateDiagram-v2
    [*] --> AnonNoSession: first page load
    AnonNoSession --> AnonWithSession: localStorage ID generated
    AnonWithSession --> AnonMessage1: first message sent
    AnonMessage1 --> AnonMessage2: response received
    AnonMessage2 --> AnonMessage3: still within quota
    AnonMessage3 --> AnonLimitHit: 4th message attempt
    AnonLimitHit --> EmailGateShown: 402 ANON_LIMIT_EXCEEDED
    EmailGateShown --> EmailSent: user submits email
    EmailSent --> WaitingMagicLink: Supabase sends OTP
    WaitingMagicLink --> Authenticated: user clicks link
    WaitingMagicLink --> AnonLimitHit: user waits out the 24h quota
    Authenticated --> [*]: normal flow, 10/min rate limit, DB-backed history
    AnonWithSession --> Authenticated: user signs in explicitly before limit
```

---

## 10. Scam detection signals (flowchart)

```mermaid
flowchart LR
    subgraph INPUT[Listing ingested]
        L[New apartment_source row]
    end

    subgraph SIG[Detection signals]
        S1[Price z-score vs neighborhood median]
        S2[Perceptual hash<br/>of photos]
        S3[Text classifier:<br/>wire transfer, abroad,<br/>Western Union]
        S4[Source count<br/>across platforms]
        S5[Host response time]
        S6[Freshness - last seen]
    end

    subgraph RULES[Rules]
        R1[z &lt; -2σ = HIGH RISK]
        R2[pHash match ≥ 3 sources = HIGH]
        R3[Scam keyword hit = HIGH]
        R4[Seen on 1 source = MEDIUM]
        R5[Verified ≥ 2 sources<br/>+ price within 1σ<br/>+ host &lt; 4h response = LOW RISK]
    end

    subgraph ACTION[Action]
        A1[⚠️ Banner on card]
        A2[Exclude from top-5<br/>Surface in Not-a-Fit with reason]
        A3[Green ✓ Verified badge]
        A4[Write trust_score + scam_risk to apartments]
        A5[Log rows to scam_signals]
    end

    L --> S1 --> R1 --> A1
    L --> S2 --> R2 --> A2
    L --> S3 --> R3 --> A2
    L --> S4 --> R4 --> A4
    L --> S5 --> R5 --> A3
    L --> S6 --> R5

    R1 --> A5
    R2 --> A5
    R3 --> A5
```

---

## 11. Revenue mix projections

```mermaid
pie showData
    title Revenue mix by $5K MRR (Month 2 target)
    "Agent lead credits ($20-50/lead)" : 45
    "Airbnb + Booking affiliate" : 25
    "Eventbrite + tour affiliates" : 12
    "Restaurant reservation affiliate" : 8
    "Scam-check API (B2B trials)" : 6
    "Other / misc" : 4
```

```mermaid
pie showData
    title Revenue mix by $50K MRR (Month 6 target)
    "Landlord SaaS ($29-99/mo)" : 35
    "Native rentals 12% commission" : 22
    "Agent lead credits" : 15
    "Affiliate (Airbnb + Booking + Eventbrite + Viator)" : 12
    "Scam-check API + B2B feed" : 9
    "Premium concierge ($29/mo)" : 5
    "Other" : 2
```

---

## 12. Tool-registry extension pattern (how new verticals plug in)

```mermaid
flowchart LR
    subgraph NEW[Add a new vertical = 3 files]
        direction TB
        TOOL["1\. supabase/functions/ai-chat/TOOLS entry<br/>{ definition, execute }"]
        CARD["2\. src/components/chat/embedded/<br/>XCardInline.tsx"]
        PIN["3\. src/context/MapContext.tsx<br/>PIN_CATEGORY_CONFIG row"]
    end

    subgraph UNCHANGED[Zero changes needed]
        direction TB
        PIPE[Chat SSE pipeline]
        EMB[EmbeddedListings dispatcher]
        ACT[ChatActionBar]
        MAP[ChatMap pin renderer]
        NOT[NotAFitTable]
        CHIPS[ContextChips]
        TRACE[ChatReasoningTrace]
    end

    NEW -- registers --> UNCHANGED

    subgraph VERTICALS[Verticals unlocked in turn]
        direction TB
        R1["Rentals · shipped"]:::done
        R2["Restaurants · Week 3"]:::next
        R3["Events · Week 4"]:::next
        R4["Attractions · Week 5"]:::next
        R5["Cars · Q3 if needed"]:::later
    end

    UNCHANGED --> VERTICALS

    classDef done fill:#dcfce7,stroke:#15803d
    classDef next fill:#dbeafe,stroke:#1d4ed8
    classDef later fill:#f3f4f6,stroke:#6b7280
```

---

## 13. Phase transitions — gates to advance

```mermaid
flowchart TB
    subgraph P1[Phase 1 · Weeks 1-2 · MVP]
        G1{Week 2 done AND<br/>first affiliate click captured?}
    end
    subgraph P2[Phase 2 · Weeks 3-5 · Multi-vertical]
        G2{"$1K MRR?<br/>5 agents on credits?<br/>200 active users?"}
    end
    subgraph P3[Phase 3 · Month 2 · Intelligence]
        G3{"$5K MRR?<br/>Chat used >2000 turns/week?<br/>Listings > 150 with embeddings?"}
    end
    subgraph P4[Phase 4 · Month 3+ · Automation]
        G4{"$15K MRR?<br/>3+ autonomous cron processes?<br/>WhatsApp proven via pilot?"}
    end
    subgraph P5[Phase 5 · Q3+ · Scale + B2B]
        G5{"$50K MRR sustained 2 months?<br/>Supply-side (landlord SaaS)<br/>product validated?"}
    end

    P1 --> G1 -->|pass| P2
    G1 -.->|fail| P1Retry[Extend Week 2 · debug funnel]
    P2 --> G2 -->|pass| P3
    G2 -.->|fail| P2Retry[Prioritize agent outreach + SEO]
    P3 --> G3 -->|pass| P4
    G3 -.->|fail| P3Retry[Don't install scraping frameworks yet]
    P4 --> G4 -->|pass| P5
    G4 -.->|fail| P4Retry[Fix data quality before governance layer]
    P5 --> G5

    classDef retry fill:#fef3c7,stroke:#a16207,stroke-dasharray:5 3
    class P1Retry,P2Retry,P3Retry,P4Retry retry
```

---

## 14. Appendix — where each diagram lives in the PRD

| Diagram | PRD section | Use case |
|---|---|---|
| Now/Next/Later | New (top of this doc) | Exec briefing |
| 12-month Gantt | Appendix A | Quarterly planning |
| System architecture | §3.2 | Onboarding engineers |
| Kanban | — | Standup / sprint review |
| User journey | §11.1 | Marketing narrative |
| Sequence (chat) | §3.3 | Debugging |
| ERD | §15 | Migration planning |
| Scraping flowchart | §9.1 | Data engineering |
| Anon session state | §11.4 | Auth debugging |
| Scam detection | §9.5 | Trust & safety |
| Revenue mix pie | §10.1 | Investor deck |
| Tool-registry pattern | §3.3 | Adding a vertical |
| Phase gates | §4 | Promoting phases |

---

## 15. How to keep this document alive

- **Update the Gantt + Kanban** when a week ships or a phase gate is met (both live in this single file)
- **Bump version** in the PRD header when a phase transitions
- **Never add a diagram without removing a stale one** — keep the total ≤ 14 so the doc stays navigable
- Mermaid renders on GitHub + Vercel + most IDEs, so diagrams travel with the code

---

*End of roadmap v1.0. Update on phase transitions or quarterly reviews.*
