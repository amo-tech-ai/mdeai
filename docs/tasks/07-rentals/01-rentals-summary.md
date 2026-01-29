# Rentals Feature — Summary

**Purpose:** Single reference for Medellín property search: screens, features, agents, use cases, and real-world examples.  
**Audience:** Product, design, and implementation.

---

## Summary Table

| Dimension | Items |
|-----------|--------|
| **Screens** | Rentals search/wizard, Rentals results (list + map), Rental detail, Saved shortlist, Compare (optional) |
| **Features** | Search wizard (core + advanced), multi-source aggregation, freshness verification badges, filters and map bounds, photo gallery, save to shortlist, contact CTA, compare view |
| **Agents** | Intake Agent, Search Aggregator, Extractor, Verifier, Deduper/Ranker, Map Agent, Page Composer; Orchestrator coordinates all |
| **Use Cases** | Find apartment by criteria, refine with wizard, see verified listings on map, save favorites, compare 2–4 listings, contact landlord |
| **Real-World Examples** | Maya (nomad) finds furnished Poblado 1BR with strong WiFi; Carlos (expat) filters Envigado 3BR with parking; Sarah (traveler) compares monthly Airbnb vs Nomad Barrio |

---

## System Architecture

```mermaid
flowchart TB
    subgraph User["👤 User"]
        U1[Opens Rentals Page]
    end
    
    subgraph Frontend["📱 Frontend"]
        F1[Search Wizard]
        F2[Results Grid]
        F3[Map View]
        F4[Detail Page]
        F5[Saved List]
    end
    
    subgraph EdgeFunc["⚡ Edge Functions"]
        E1[rentals/intake]
        E2[rentals/search]
        E3[rentals/verify]
        E4[rentals/listing/:id]
    end
    
    subgraph AI["🤖 AI Agents - Gemini 3"]
        A1["Intake Agent<br/>(gemini-3-pro-preview)"]
        A2["Search Service<br/>(gemini-3-flash-preview)"]
        A3["Verify Agent<br/>(gemini-3-flash-preview)"]
    end
    
    subgraph DB["💾 Supabase"]
        D1[(apartments)]
        D2[(rental_search_sessions)]
        D3[(rental_freshness_log)]
    end
    
    U1 --> F1
    F1 --> E1 --> A1
    A1 --> E2 --> A2
    A2 --> D1 & D2
    D1 --> F2 & F3
    F2 --> E4 --> F4
    F4 --> E3 --> A3
    A3 --> D3
```

---

## Description

The rentals feature is an AI-powered apartment search flow for Medellín. The user starts from a search box or "Find me an apartment," answers a short wizard of core and optional advanced questions, and receives a unified results page: cards, filters, map with pins and clustering, photo galleries, and "verified freshness" badges.

**Key Components:**
1. **AI Orchestrator** - Coordinates the flow using Gemini 3 Pro
2. **Intake Agent** - Asks questions, normalizes answers, outputs filter_json
3. **Search Aggregator** - Queries apartments table with smart filters
4. **Verifier Agent** - Checks listing URLs for freshness status
5. **Page Composer** - Builds UI-ready payload with map pins

---

## Rationale

- **Single entry point:** One place to express "what I need" and get results
- **Trust:** Freshness verification and "last checked" reduce dead leads
- **Medellín-specific:** Neighborhoods, fiador/contract questions match local demand
- **Scalable:** Source adapters allow adding/removing sites without hardcoding
- **AI-native:** Wizard and orchestration use Gemini 3 with function calling

---

## Purpose and Goals

- **Purpose:** Help users find a Medellín apartment that fits dates, budget, location, and lifestyle
- **Goals:**
  - Collect search criteria via friendly wizard (core + advanced questions)
  - Return unified results with verification badges and map
  - Let users filter, pan/zoom map, save to shortlist, open detail
  - Persist search sessions and cache listings in Supabase

---

## Outcomes

- Users complete wizard and see results from apartments table
- Listings show verification status and last-checked time
- Map shows pins with clustering; pan/zoom updates results
- Detail page shows gallery, map, and contact CTA
- Saved shortlist works on dedicated screen

---

## User Personas

### Maya (Digital Nomad)
```mermaid
journey
    title Maya's Apartment Hunt
    section Need
      Remote worker from NYC: 5: Maya
      Needs 3-month stay: 5: Maya
    section Search
      Opens "Find Apartment": 5: Maya
      Specifies: 1BR, Poblado, WiFi: 4: Maya
      Budget $1200/month: 4: Maya
    section Results
      Sees 8 verified listings: 5: Maya
      Filters by "desk included": 4: Maya
    section Decision
      Saves 2 favorites: 5: Maya
      Contacts landlord: 5: Maya
```

### Carlos (Expat)
```mermaid
journey
    title Carlos's Family Relocation
    section Need
      Moving family from Spain: 4: Carlos
      Long-term lease needed: 4: Carlos
    section Search
      Specifies: 3BR, Envigado: 4: Carlos
      Needs parking + unfurnished: 4: Carlos
    section Results
      Views map of options: 5: Carlos
      Compares 2 apartments: 4: Carlos
    section Decision
      Schedules viewing: 5: Carlos
      Signs 12-month lease: 5: Carlos
```

---

## Key Points

- **3-panel layout:** Left = context; Main = work; Right = intelligence
- **Freshness is first-class:** Active / Unconfirmed / Stale with HTTP/HTML checks
- **Models:** Gemini 3 Pro for Orchestrator/Intake; Gemini 3 Flash for sub-agents
- **Wiring:** Frontend calls Edge Functions; Supabase stores all data
