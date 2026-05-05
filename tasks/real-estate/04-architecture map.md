Here is the **mdeai-specific architecture map** showing **which repo powers each feature**, what role it should play, and how the pieces connect.

## Short summary

Use this split:

* **Rentals core:** `ai-real-estate-assistant`
* **CRM / back office:** `realty-central`
* **Lead gen:** `brightdata/ai-lead-generator`
* **Market intelligence:** `brightdata/real-estate-ai-agent`
* **Contract review / tenant support:** `PropertyLoop`
* **Agent workflows / orchestration:** `cre-acquisition-orchestrator`
* **Broader marketplace blueprint:** `ai_real_estate`
* **Recommendation/chat intelligence:** `EstateWise-Chapel-Hill-Chatbot`

---

# mdeai architecture map

```text
                           MDEAI PLATFORM
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: ILM web app / chat / WhatsApp concierge                  │
│                                                                     │
│  Rentals UI   CRM UI   Lead Inbox   Market Dashboard   Agent Desk   │
└─────────────────────────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Core app + orchestration layer                    │
│                                                                     │
│  Search & recommendations   Workflow engine   Approvals   Memory    │
└─────────────────────────────────────────────────────────────────────┘
        │                 │                │               │
        ▼                 ▼                ▼               ▼

 RENTALS            AGENT WORKFLOWS      CONTRACTS        CRM / OPS
 ai-real-estate-    cre-acquisition-     PropertyLoop     realty-central
 assistant          orchestrator

        │
        ▼
 MARKET INTELLIGENCE
 brightdata/real-estate-ai-agent

        │
        ▼
 LEAD GEN
 brightdata/ai-lead-generator

        │
        ▼
 BROADER MARKETPLACE / PMS BLUEPRINT
 ai_real_estate

        │
        ▼
 CHAT / RECOMMENDATION INTELLIGENCE
 EstateWise-Chapel-Hill-Chatbot
```

---

# 1. Rentals

## Repo

**AleksNeStu / ai-real-estate-assistant**
[https://github.com/AleksNeStu/ai-real-estate-assistant](https://github.com/AleksNeStu/ai-real-estate-assistant)

## Role inside mdeai

This should power the **customer-facing rentals intelligence layer**:

* rental search
* recommendation ranking
* property valuation context
* AI property assistant
* search + explanation UI

## Best use inside mdeai

A user says:

> “Need a furnished 2-month apartment in Laureles with strong Wi-Fi.”

mdeai uses this repo’s patterns for:

* search
* filtering
* ranking
* valuation context
* AI explanation of why listing A beats listing B

## Why it fits

It is the strongest overall fit for AI property discovery and market-aware search, with a practical FastAPI + Next.js style architecture.

---

# 2. CRM

## Repo

**Ibrahim-Isah / realty-central**
[https://github.com/Ibrahim-Isah/realty-central](https://github.com/Ibrahim-Isah/realty-central)

## Role inside mdeai

This should power the **internal operations workspace**:

* lead records
* follow-up reminders
* lease tracking
* document management
* agent notes
* renewal reminders

## Best use inside mdeai

After a renter asks about a property:

* the lead gets created
* agent notes are stored
* next follow-up is scheduled
* lease expiry can trigger renewal outreach

## Why it fits

It is the best repo in the list for day-to-day CRM and back-office real estate workflows.

---

# 3. Lead generation

## Repo

**brightdata / ai-lead-generator**
[https://github.com/brightdata/ai-lead-generator](https://github.com/brightdata/ai-lead-generator)

## Role inside mdeai

This should power the **supply-side lead engine**:

* landlord lead generation
* broker lead generation
* investor list building
* outreach qualification

## Best use inside mdeai

Examples:

* find Medellín landlords with multiple furnished rentals
* find boutique agencies in El Poblado
* identify brokers likely to onboard to mdeai

## Why it fits

It is better for **finding and qualifying leads** than for running the marketplace itself.

---

# 4. Market intelligence

## Repo

**brightdata / real-estate-ai-agent**
[https://github.com/brightdata/real-estate-ai-agent](https://github.com/brightdata/real-estate-ai-agent)

## Role inside mdeai

This should power the **data ingestion + market monitoring layer**:

* competitor listing extraction
* price tracking
* market snapshots
* supply monitoring
* structured JSON feeds for your own ranking engine

## Best use inside mdeai

Examples:

* monitor luxury furnished rentals in El Poblado
* detect weekly price drops
* compare mdeai inventory vs competitors
* identify underpriced listings for promotion

## Why it fits

This is the strongest repo for structured property data extraction and intelligence feeds.

---

# 5. Contract review

## Repo

**Kaos599 / PropertyLoop**
[https://github.com/Kaos599/PropertyLoop](https://github.com/Kaos599/PropertyLoop)

## Role inside mdeai

This should power the **rental contract + tenant support layer**:

* lease interpretation
* policy explanation
* maintenance issue support
* landlord-tenant guidance
* document understanding for rental problems

## Best use inside mdeai

Examples:

* explain deposit clause in plain language
* flag unclear cleaning penalties
* help a renter report maintenance with photos
* explain house rules and repair responsibilities

## Why it fits

It is the best fit for rental-specific support and lease interpretation rather than marketplace search.

---

# 6. Agent workflows

## Repo

**ahacker-1 / cre-acquisition-orchestrator**
[https://github.com/ahacker-1/cre-acquisition-orchestrator](https://github.com/ahacker-1/cre-acquisition-orchestrator)

## Role inside mdeai

This should power the **multi-step agent workflow layer**:

* deal workflows
* due diligence style reviews
* multi-agent coordination
* internal approval chains
* premium property analysis

## Best use inside mdeai

Examples:

* rental acquisition review for premium listings
* investor workflow for high-end buildings
* orchestrated agent tasks:

  * search
  * compare
  * analyze
  * draft summary
  * hand off to ops

## Why it fits

This is the strongest real-estate-specific multi-agent workflow repo in the group.

---

# 7. Bigger marketplace blueprint

## Repo

**azharsaleem18 / ai_real_estate**
[https://github.com/azharsaleem18/ai_real_estate](https://github.com/azharsaleem18/ai_real_estate)

## Role inside mdeai

This should be your **product blueprint**, not your direct core engine:

* buy / sell / rent structure
* property management direction
* tenant + landlord operations
* CRM + maintenance + accounting ideas

## Best use inside mdeai

Use it to shape the future roadmap:

* rentals now
* buy/sell later
* PMS later
* landlord dashboard later

## Why it fits

It covers the broadest business scope, which makes it ideal as a strategic reference architecture.

---

# 8. Chat + recommendation intelligence

## Repo

**hoangsonww / EstateWise-Chapel-Hill-Chatbot**
[https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot](https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot)

## Role inside mdeai

This should power the **personalization and AI chat patterns**:

* conversational search
* GraphRAG / recommendation logic
* memory patterns
* neighborhood-aware assistance

## Best use inside mdeai

Examples:

* “Show me apartments similar to the one I liked last week”
* “Which areas are best for digital nomads?”
* “Recommend 3 options near coworking and cafés”

## Why it fits

It has the strongest recommendation and conversational architecture among the repos reviewed.

---

# Exact feature-to-repo map

| mdeai Feature                | Best Repo                                                     | Role                                   |
| ---------------------------- | ------------------------------------------------------------- | -------------------------------------- |
| Rentals search & ranking     | `ai-real-estate-assistant`                                    | Main rentals engine                    |
| Rental recommendations       | `EstateWise-Chapel-Hill-Chatbot` + `ai-real-estate-assistant` | Chat + ranking intelligence            |
| CRM / lead tracking          | `realty-central`                                              | Internal agent workspace               |
| Lead generation              | `brightdata/ai-lead-generator`                                | Landlord / broker / investor sourcing  |
| Market intelligence          | `brightdata/real-estate-ai-agent`                             | Competitor listings + price monitoring |
| Contract / lease review      | `PropertyLoop`                                                | Lease interpretation + tenant support  |
| Agent workflow orchestration | `cre-acquisition-orchestrator`                                | Multi-agent process engine             |
| Future buy/sell expansion    | `ai_real_estate`                                              | Broader marketplace / PMS blueprint    |

---

# Best way to combine them in mdeai

## Use directly

These are the most useful to adapt into the live system:

* `ai-real-estate-assistant`
* `realty-central`
* `brightdata/real-estate-ai-agent`
* `PropertyLoop`

## Use as architecture patterns

These are stronger as inspiration / subsystem patterns:

* `EstateWise-Chapel-Hill-Chatbot`
* `cre-acquisition-orchestrator`
* `ai_real_estate`

## Use carefully

* `brightdata/ai-lead-generator` is useful, but mostly for growth ops, not customer UX.

---

# Recommended final mdeai stack

## Customer side

* **Search + rentals UI:** `ai-real-estate-assistant`
* **AI chat + personalization:** `EstateWise-Chapel-Hill-Chatbot`

## Internal ops

* **CRM + lease ops:** `realty-central`
* **Contract help:** `PropertyLoop`

## Intelligence

* **Competitor and market data:** `brightdata/real-estate-ai-agent`

## Growth

* **Lead sourcing:** `brightdata/ai-lead-generator`

## Advanced orchestration

* **Internal multi-agent workflows:** `cre-acquisition-orchestrator`

## Long-term expansion

* **Marketplace + PMS direction:** `ai_real_estate`

---

## Final recommendation

For **mdeai**, the cleanest setup is:

* **Rentals brain:** `ai-real-estate-assistant`
* **Chat brain:** `EstateWise`
* **Ops brain:** `realty-central`
* **Data brain:** `brightdata/real-estate-ai-agent`
* **Contract brain:** `PropertyLoop`
* **Workflow brain:** `cre-acquisition-orchestrator`

That gives you:

* rentals now
* CRM + ops immediately
* market intelligence built in
* contract support for trust
* agent workflows for scale

I can next turn this into a **visual 3-layer system diagram for mdeai** with:
**Frontend → AI services → data/ops layer**.
