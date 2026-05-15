---
id: AUDIT-MERMAID-03
title: mdeai.co — Architecture Diagrams (Current vs Target)
status: Active
created: 2026-05-15
author: Claude — Senior Systems Architect
scope: Full-stack architecture audit with Mermaid diagrams
references:
  - tasks/mastra/audit/01-places-checklist.md
  - tasks/mastra/audit/02-maps-platform-audit.md
  - CLAUDE.md
  - prd.md
---

# AUDIT-MERMAID-03 — mdeai.co Architecture Diagrams

> 15 production-grade Mermaid diagrams: current (as-is) vs target (to-be).
> Each diagram includes: what it shows · current flaws · red flags · exact fixes.
>
> **Architecture Score: 72/100** (was 68) — Pre-production. Improvements 2026-05-15: 429 backoff added (+3), geocode-missing.ts bug fixed (+1). Remaining ship-blockers: P0 key leak (Vercel dashboard + rotation), events enrichment not yet run, tourist_destinations 78.6%.

---

## Architecture Score Summary

| Domain | Current | Target | Gap |
|--------|---------|--------|-----|
| Frontend/backend boundary | 55/100 | 90/100 | `VITE_GEMINI_API_KEY` leak, ChatMap/MdeMap dual system |
| Places API + Cache | 55/100 | 85/100 | Cache never queried (429 backoff ✅ fixed 2026-05-15) |
| AI / Gemini Grounding | 30/100 | 88/100 | Grounding absent from production |
| Enrichment Pipeline | 62/100 | 85/100 | Events code-ready but not run; td 78.6%; geocode-missing bug fixed |
| Secrets / Security | 45/100 | 92/100 | P0: VITE_GEMINI_API_KEY in bundle |
| Marker System | 70/100 | 88/100 | Duplicate makeContent(), no a11y attrs |
| Deployment / Ops | 72/100 | 88/100 | 21 commits unpushed, no observability |
| **Overall** | **68/100** | **88/100** | |

---

## Diagram 1 — Current System Architecture (As-Is)

> **What it shows:** Every major layer of mdeai.co as it runs today — browser, Supabase edge, Mastra server, databases, external APIs, scripts.
> **Flaws:** Dual map systems (ChatMap + MdeMap), `VITE_GEMINI_API_KEY` leaking into browser bundle, Places cache tables created but never queried, enrichment scripts not run for events, Gemini Maps Grounding absent.

```mermaid
flowchart TB
    classDef browser fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef edge fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef mastra fill:#fef9c3,stroke:#ca8a04,color:#713f12
    classDef db fill:#f3e8ff,stroke:#7c3aed,color:#4c1d95
    classDef external fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef script fill:#ffedd5,stroke:#ea580c,color:#7c2d12
    classDef warning fill:#fef3c7,stroke:#f59e0b,color:#78350f

    subgraph BROWSER["🌐 Browser (Vite + React)"]
        direction TB
        UI["Pages / Components\n(App.tsx, 152 components)"]
        ChatMap["ChatMap.tsx ⚠️\n(active production map)"]
        MdeMap["MdeMap.tsx ⚠️\n(successor — not yet wired)"]
        FloatChat["FloatingChatWidget\n→ ai-chat edge fn"]
        VITE_MAPS["VITE_GOOGLE_MAPS_API_KEY\n(HTTP-referrer restricted ✅)"]
        VITE_GEMINI["⛔ VITE_GEMINI_API_KEY\n(in bundle — P0 leak!)"]
    end

    subgraph EDGE["⚡ Supabase Edge Functions (Deno)"]
        direction TB
        AIChat["ai-chat\n(SSE stream, tool dispatch)"]
        AISearch["ai-search\n(hybrid FTS + pgvector)"]
        AIRouter["ai-router\n(intent classification)"]
        AIEmbed["ai-embed\n(gemini-embedding-001)"]
        GoogleDir["google-directions\n(Routes API)"]
        AITrip["ai-trip-planner"]
        RentalsEF["rentals"]
        AIOptRoute["ai-optimize-route"]
    end

    subgraph MASTRA["🤖 Mastra Server (my-mastra-app)"]
        direction TB
        RouterAgent["router-agent\n(classify → dispatch)"]
        ConciergeAgent["concierge-agent\n(4 tools + memory)"]
        RentalAgent["rental-agent"]
        EventAgent["event-agent"]
        Tools["Tools:\nsearch-rentals\nsearch-events\nsearch-restaurants\nsearch-attractions"]
    end

    subgraph DB["🗄️ Supabase PostgreSQL"]
        direction TB
        Apartments["apartments\n(pgvector ✅)"]
        Restaurants["restaurants\n(enriched 93.9% ✅)"]
        Events["events\n(0% enriched ⚠️)"]
        TouristDest["tourist_destinations\n(78.6% enriched ⚠️)"]
        PlacesCache["places_search_cache\n⚠️ CREATED but NEVER QUERIED"]
        DetailsCache["place_details_cache\n⚠️ CREATED but NEVER QUERIED"]
        AIRuns["ai_runs\n(logging ✅)"]
        Conversations["conversations"]
    end

    subgraph EXTERNAL["🔌 External APIs"]
        MapsJS["Maps JS API\n(Dynamic Library Import ✅)"]
        PlacesAPI["Places API (New)\n(Text Search / Details)"]
        GeminiAPI["Gemini API\n(gemini-3-flash-preview)"]
        RoutesAPI["Routes API (New)"]
        GeminiEmbed["Gemini Embedding\n(gemini-embedding-001)"]
    end

    subgraph SCRIPTS["📜 Offline Scripts (Node.js)"]
        EnrichPlaces["enrich-places.ts\n(restaurants+tourist_dest ✅\nevents ❌ NOT RUN)"]
        CacheAI["cache-ai-summaries.ts\n(restaurants+tourist_dest ✅)"]
        Geocode["geocode-missing.ts\n(2 events ⚠️ NOT RUN)"]
    end

    UI --> ChatMap
    UI --> FloatChat
    FloatChat --> AIChat
    ChatMap --> MapsJS
    MdeMap -.->|"not yet\nconnected"| MapsJS
    AIChat --> GeminiAPI
    AISearch --> GeminiEmbed
    AISearch --> Apartments
    AIChat --> Restaurants & Events & TouristDest & Apartments
    AIRouter --> AIChat
    AIEmbed --> GeminiEmbed
    GoogleDir --> RoutesAPI
    MASTRA --> DB
    EnrichPlaces --> PlacesAPI
    EnrichPlaces --> Restaurants
    EnrichPlaces --> TouristDest
    CacheAI --> GeminiAPI
    VITE_GEMINI -.->|"⛔ exposed\nin bundle"| GeminiAPI
    PlacesCache -.->|"⚠️ never\nread"| EnrichPlaces
    DetailsCache -.->|"⚠️ never\nread"| EnrichPlaces

    class UI,ChatMap,MdeMap,FloatChat,VITE_MAPS browser
    class AIChat,AISearch,AIRouter,AIEmbed,GoogleDir,AITrip,RentalsEF,AIOptRoute edge
    class RouterAgent,ConciergeAgent,RentalAgent,EventAgent,Tools mastra
    class Apartments,Restaurants,Events,TouristDest,PlacesCache,DetailsCache,AIRuns,Conversations db
    class MapsJS,PlacesAPI,GeminiAPI,RoutesAPI,GeminiEmbed external
    class EnrichPlaces,CacheAI,Geocode script
    class VITE_GEMINI,MdeMap,PlacesCache,DetailsCache warning
```

**Current flaws:**
| # | Flaw | Impact |
|---|------|--------|
| F1 | `VITE_GEMINI_API_KEY` in browser bundle | P0 — key exposed to all users |
| F2 | ChatMap + MdeMap dual system | Duplicate code, diverging bugs |
| F3 | `places_search_cache` never queried | Wasted schema, paying for every Places call |
| F4 | `events` 0% enriched | Map pins have no Google Maps links |
| F5 | `tourist_destinations` 78.6% | Below 80% target |
| F6 | Gemini Maps Grounding absent | AI answers not grounded in live map data |
| F7 | 21 commits not pushed | Production is behind local main |

---

## Diagram 2 — Target Production Architecture (To-Be)

> **What it shows:** The correct architecture after all blockers are fixed — single map system, cache-first Places queries, Maps Grounding in Gemini, secure secrets, full enrichment, retry logic.

```mermaid
flowchart TB
    classDef browser fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef edge fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef mastra fill:#fef9c3,stroke:#ca8a04,color:#713f12
    classDef db fill:#f3e8ff,stroke:#7c3aed,color:#4c1d95
    classDef external fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef script fill:#ffedd5,stroke:#ea580c,color:#7c2d12
    classDef secure fill:#ecfdf5,stroke:#10b981,color:#065f46

    subgraph BROWSER["🌐 Browser — secure keys only"]
        UI2["Vite + React App"]
        MdeMapOnly["MdeMap.tsx ✅\n(single map component)"]
        ChatWidget["FloatingChatWidget → ai-chat"]
        BrowserKeys["VITE_GOOGLE_MAPS_API_KEY\n(browser, referrer-restricted ✅)\nNo Gemini key in bundle ✅"]
    end

    subgraph EDGE["⚡ Supabase Edge Functions"]
        AIChat2["ai-chat\n(SSE + tool dispatch)"]
        AISearch2["ai-search\n(hybrid FTS + pgvector)"]
        PlacesFn["places-lookup ✅ NEW\n(cache-first → Places API fallback)"]
        GoogleDir2["google-directions"]
        GeminiGround["gemini-grounding ✅ NEW\n(Gemini + Maps Grounding tool)"]
    end

    subgraph MASTRA2["🤖 Mastra — enriched data"]
        ConciergeAgent2["concierge-agent\n(mapsUrl + aiSummary\nin tool responses)"]
        GroundingTool["maps-grounding-tool ✅ NEW\n(Grounding Lite MCP)"]
    end

    subgraph DB2["🗄️ Supabase PostgreSQL"]
        RestaurantsOK["restaurants ✅ 100%+"]
        EventsOK["events ✅ 100%"]
        TouristOK["tourist_destinations ✅ 100%"]
        PlacesCacheUsed["places_search_cache ✅\n(TTL 7d, queried first)"]
        DetailsCacheUsed["place_details_cache ✅\n(TTL 30d, queried first)"]
    end

    subgraph EXTERNAL2["🔌 External APIs"]
        MapsJS2["Maps JS API"]
        PlacesAPI2["Places API (New)"]
        GeminiAPI2["Gemini API\n(server key only)"]
        RoutesAPI2["Routes API"]
        GroundingAPI["Maps Grounding\n(Gemini tools: [{googleMaps:{}}])"]
    end

    subgraph SECRETS["🔐 Secrets — server only"]
        SupabaseSecrets["Supabase Secrets:\nGEMINI_API_KEY ✅\nGOOGLE_MAPS_API_KEY ✅\n(no VITE_ prefix)"]
        VercelSecrets["Vercel Env:\nVITE_GOOGLE_MAPS_API_KEY ✅\n(browser-safe only)"]
    end

    UI2 --> MdeMapOnly
    UI2 --> ChatWidget
    ChatWidget --> AIChat2
    MdeMapOnly --> MapsJS2
    AIChat2 --> GeminiAPI2
    AIChat2 --> PlacesFn
    PlacesFn -->|"cache miss"| PlacesAPI2
    PlacesFn -->|"cache hit"| PlacesCacheUsed
    GeminiGround --> GroundingAPI
    SupabaseSecrets --> AIChat2 & PlacesFn & GeminiGround
    VercelSecrets --> BrowserKeys

    class UI2,MdeMapOnly,ChatWidget,BrowserKeys browser
    class AIChat2,AISearch2,PlacesFn,GoogleDir2,GeminiGround edge
    class ConciergeAgent2,GroundingTool mastra
    class RestaurantsOK,EventsOK,TouristOK,PlacesCacheUsed,DetailsCacheUsed db
    class MapsJS2,PlacesAPI2,GeminiAPI2,RoutesAPI2,GroundingAPI external
    class SupabaseSecrets,VercelSecrets secure
```

---

## Diagram 3 — Secret / Environment Variable Flow

> **What it shows:** Exactly how secrets flow from source (Infisical / Vercel / .env.local) to runtime (browser bundle, Supabase edge, Mastra server).
> **Red flag:** `VITE_GEMINI_API_KEY` has the `VITE_` prefix — Vite inlines ALL `VITE_*` vars into the client bundle at build time, exposing the key to every user.

```mermaid
flowchart LR
    classDef safe fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef danger fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef neutral fill:#f3f4f6,stroke:#6b7280,color:#374151
    classDef store fill:#dbeafe,stroke:#2563eb,color:#1e3a8a

    subgraph SOURCES["📦 Secret Sources"]
        EnvLocal[".env.local\n(git-ignored ✅)"]
        Infisical["Infisical\n(self-hosted, port 80)"]
        VercelDash["Vercel Dashboard\nEnvironment Variables"]
        SupaDash["Supabase Dashboard\nProject Secrets"]
    end

    subgraph VITE_BUILD["🏗️ Vite Build (vite:define plugin)"]
        ViteInline["vite:define\nInlines ALL VITE_* vars\ninto client bundle"]
        BundleOK["✅ VITE_GOOGLE_MAPS_API_KEY\n→ bundle (safe — referrer-restricted)"]
        BundleBAD["⛔ VITE_GEMINI_API_KEY\n→ bundle (UNSAFE — server key!)"]
        BundleOK2["✅ VITE_SUPABASE_URL\n→ bundle (safe — public)"]
        BundleOK3["✅ VITE_SUPABASE_PUBLISHABLE_KEY\n→ bundle (safe — anon)"]
    end

    subgraph BROWSER_RUNTIME["🌐 Browser Runtime (public)"]
        BrowserBundle["dist/index-[hash].js\n⛔ Contains Gemini API key\nVisible to ALL users via DevTools"]
    end

    subgraph EDGE_RUNTIME["⚡ Supabase Edge (server-only)"]
        DenoEnv["Deno.env.get()\n✅ Server-only\nNot in bundle"]
        GeminiEdge["GEMINI_API_KEY ✅\n(used in ai-chat, ai-search)"]
        MapsEdge["GOOGLE_MAPS_API_KEY ✅\n(used in google-directions)"]
        ServiceRole["SUPABASE_SERVICE_ROLE_KEY ✅\n(admin DB access)"]
    end

    subgraph MASTRA_RUNTIME["🤖 Mastra Server (server-only)"]
        NodeEnv["process.env\n✅ Server-only"]
        MastraGemini["GEMINI_API_KEY ✅\n(bare — no VITE_ prefix)"]
        MastraMaps["GOOGLE_MAPS_API_KEY ✅"]
    end

    EnvLocal -->|"VITE_* keys"| ViteInline
    VercelDash -->|"VITE_* keys"| ViteInline
    ViteInline --> BundleOK & BundleBAD & BundleOK2 & BundleOK3
    BundleOK & BundleBAD & BundleOK2 & BundleOK3 --> BrowserBundle

    Infisical -->|"sync"| SupaDash
    SupaDash --> DenoEnv
    DenoEnv --> GeminiEdge & MapsEdge & ServiceRole

    Infisical -->|"sync"| VercelDash
    VercelDash -->|"server-side env"| NodeEnv
    NodeEnv --> MastraGemini & MastraMaps

    class BundleOK,BundleOK2,BundleOK3,GeminiEdge,MapsEdge,ServiceRole,MastraGemini,MastraMaps safe
    class BundleBAD,BrowserBundle danger
    class EnvLocal,Infisical,VercelDash,SupaDash,ViteInline,DenoEnv,NodeEnv neutral
```

**Fix:**
```
1. Rename VITE_GEMINI_API_KEY → GEMINI_API_KEY in .env.local
2. Remove VITE_ prefix in Vercel dashboard
3. Rotate the key in Google Cloud Console
4. Update mastra-start.sh line 25
5. Run: npm run build && grep -r "AIza" dist/ → must return 0 matches
```

---

## Diagram 4 — Places API Request + Cache Flow (Current vs Target)

> **What it shows:** How a Places API request travels from the enrichment script through the cache layer (or bypasses it) to the API and then to Supabase.
> **Critical gap:** The cache tables (`places_search_cache`, `place_details_cache`) are created and have RLS, but `enrich-places.ts` never queries them — every run hits the live API, incurring cost.

```mermaid
sequenceDiagram
    participant Script as enrich-places.ts
    participant Cache as places_search_cache<br/>(Supabase)
    participant PlacesAPI as Places API (New)<br/>($0.017/req)
    participant SupaDB as restaurants /<br/>tourist_destinations

    Note over Script,SupaDB: ⚠️ CURRENT FLOW — cache never checked

    Script->>SupaDB: SELECT id,name WHERE google_place_id IS NULL
    SupaDB-->>Script: N rows
    loop For each venue
        Script->>PlacesAPI: POST /places:searchText<br/>X-Goog-FieldMask: places.id,places.displayName,<br/>places.googleMapsLinks,places.location
        Note right of PlacesAPI: Billed: Text Search Essentials<br/>$0.017 / request
        PlacesAPI-->>Script: { places[0].id, googleMapsLinks.placeUri }
        Script->>SupaDB: UPDATE SET google_place_id, maps_url
        Note left of Script: sleep(300ms)
    end

    Note over Script,SupaDB: ✅ TARGET FLOW — cache-first

    Script->>Cache: SELECT * WHERE query_hash = hash(textQuery)<br/>AND expires_at > now()
    alt Cache HIT
        Cache-->>Script: cached place result (free ✅)
    else Cache MISS
        Script->>PlacesAPI: POST /places:searchText (billed $0.017)
        PlacesAPI-->>Script: place result
        Script->>Cache: INSERT (query_hash, result, expires_at = now()+7d)
    end
    Script->>SupaDB: UPDATE SET google_place_id, maps_url
```

**Cost impact:**
| Scenario | Requests | Cost |
|----------|----------|------|
| Current (no cache, all venues) | ~350 | ~$6 one-time |
| Current (re-run after partial failure) | up to 350 again | ~$6 again |
| Target (cache-first, re-run) | 0 (cache hit) | $0 |
| Monthly runtime queries (500 users) | ~15,000 | ~$255/mo → $0 with cache |

---

## Diagram 5 — Gemini Maps Grounding Flow (Target — Not Yet Implemented)

> **What it shows:** How a user query flows through Gemini with the Maps Grounding tool enabled, returning AI answers grounded in live Google Maps data.
> **Current state:** Maps Grounding is entirely absent from the production codebase. The `mde-maps` skill and audit document it but no implementation exists.

```mermaid
sequenceDiagram
    participant User as User
    participant Chat as ai-chat<br/>Edge Function
    participant Gemini as Gemini API<br/>(gemini-3-flash-preview)
    participant MapsGround as Maps Grounding<br/>(googleMaps tool)
    participant PlacesAPI as Places API (New)
    participant SupaDB as Supabase DB<br/>(fallback)

    Note over User,SupaDB: ✅ TARGET: Maps Grounding in ai-chat

    User->>Chat: "Best paisa restaurant\nnear El Poblado?"
    Chat->>Gemini: generateContent({<br/>  model: 'gemini-3-flash-preview',<br/>  tools: [{ googleMaps: {} }],<br/>  contents: [userMessage]<br/>})

    alt Maps Grounding triggered
        Gemini->>MapsGround: search("paisa restaurant El Poblado Medellín")
        MapsGround->>PlacesAPI: Text Search (billed)
        PlacesAPI-->>MapsGround: live results with ratings, hours
        MapsGround-->>Gemini: grounded place data + citations
        Gemini-->>Chat: answer with groundingMetadata.webSearchQueries
        Chat-->>User: "Hatoviejo in Laureles is the classic choice…\n[source: Google Maps]"
    else Grounding not triggered
        Gemini-->>Chat: answer (ungrounded — stale data risk)
        Chat->>SupaDB: fallback search-restaurants tool
        SupaDB-->>Chat: DB results (may be stale)
        Chat-->>User: answer from DB only
    end

    Note over User,SupaDB: ⚠️ CURRENT: No Maps Grounding — DB fallback only
    Note over Chat: Implementation needed:<br/>Add tools:[{googleMaps:{}}]<br/>to fetchGemini() call in ai-chat
```

**Missing implementation:**
```typescript
// In supabase/functions/ai-chat/index.ts (fetchGemini call)
// ADD: tools: [{ googleMaps: {} }]
// ADD: groundingMetadata extraction
// ADD: citation rendering in SSE stream
```

---

## Diagram 6 — Enrichment Pipeline (Current Gaps + Target)

> **What it shows:** The full offline enrichment pipeline from raw DB rows → Places API → Gemini summaries → DB write.
> **Current gaps:** Events table (49 rows) never enriched. `geocode-missing.ts` not run for 2 events. No 429 backoff.

```mermaid
flowchart TD
    classDef done fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef gap fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef warning fill:#fef3c7,stroke:#f59e0b,color:#78350f
    classDef neutral fill:#f3f4f6,stroke:#6b7280,color:#374151

    subgraph PHASE1["Phase 1 — Place ID Enrichment (enrich-places.ts)"]
        R_Start["restaurants\n66 rows\n(62 enriched ✅)"]
        TD_Start["tourist_destinations\n28 rows\n(22 enriched ⚠️ 78.6%)"]
        EV_Start["events\n49 rows\n(0 enriched ❌)"]
        PlacesSearch["Places API\n:searchText\n($0.017/req)"]
        StoreID["UPDATE\ngoogle_place_id\nmaps_url\nplace_id_fetched_at"]
    end

    subgraph PHASE2["Phase 2 — AI Summary (cache-ai-summaries.ts)"]
        HasPlaceID{"google_place_id\nIS NOT NULL?"}
        Gemini["Gemini API\ngemini-3-flash-preview\nthinkingBudget:0 ✅"]
        StoreSum["UPDATE\nai_summary"]
    end

    subgraph PHASE3["Phase 3 — Geocoding (geocode-missing.ts)"]
        MissingCoords{"lat/lng\nIS NULL?"}
        GeoAPI["Geocoding API\nor Places location"]
        StoreCoords["UPDATE\nlatitude, longitude"]
    end

    subgraph MISSING["❌ Missing Steps"]
        EventEnrich["enrich-places.ts\nfor events table\n(NOT YET IMPLEMENTED)"]
        Retry429["Exponential backoff\non 429 errors\n(NOT YET IMPLEMENTED)"]
        CacheCheck["Check places_search_cache\nbefore API call\n(NOT YET IMPLEMENTED)"]
    end

    R_Start -->|"WHERE\nplace_id IS NULL"| PlacesSearch
    TD_Start -->|"WHERE\nplace_id IS NULL\n(6 rows remain)"| PlacesSearch
    EV_Start -.->|"❌ never called"| EventEnrich
    PlacesSearch -->|"place found"| StoreID
    PlacesSearch -->|"404/429"| Retry429
    StoreID --> HasPlaceID
    HasPlaceID -->|"yes"| Gemini
    HasPlaceID -->|"no"| MissingCoords
    Gemini --> StoreSum
    MissingCoords -->|"yes (2 events)"| GeoAPI
    GeoAPI --> StoreCoords

    class R_Start done
    class TD_Start warning
    class EV_Start,EventEnrich,Retry429,CacheCheck gap
    class PlacesSearch,Gemini,GeoAPI,HasPlaceID,MissingCoords,StoreID,StoreSum,StoreCoords neutral
```

---

## Diagram 7 — Marker Rendering Lifecycle

> **What it shows:** The full React lifecycle of a map pin — from data fetch through marker creation, clustering, hover sync, click handling, and cleanup.
> **Flaws:** Duplicate `makeContent()` functions in `ChatMap.tsx` and `pinContent.ts`. Single MarkerClusterer in ChatMap vs per-category in MdeMap. No accessibility attributes on pins.

```mermaid
sequenceDiagram
    participant App as React App
    participant MapCtx as MapContext
    participant MdeMap as MdeMap / ChatMap
    participant MdeCluster as MdeMarkerCluster
    participant GMaps as Google Maps JS API
    participant Marker as AdvancedMarkerElement

    App->>MapCtx: setMapPins(pins) [from AI search results]
    MapCtx->>MdeMap: pins updated (useMapContext)
    MdeMap->>GMaps: importLibrary('maps')
    GMaps-->>MdeMap: { Map }
    MdeMap->>GMaps: importLibrary('marker')
    GMaps-->>MdeMap: { AdvancedMarkerElement, PinElement }
    MdeMap->>MdeCluster: render per-category clusterers

    loop For each MapPin in pins
        MdeCluster->>Marker: new AdvancedMarkerElement({<br/>  map, position,<br/>  content: makeContent(pin),<br/>  gmpClickable: true ✅<br/>})
        Note right of Marker: ⚠️ Missing: title=name<br/>role=button, tabIndex=0<br/>(accessibility gap)
        Marker->>GMaps: addEventListener('gmp-click', handler)
    end

    alt User hovers pin
        Marker->>MapCtx: setHighlightedPinId(pin.id)
        MapCtx->>App: highlight synced to sidebar card
    end

    alt User clicks pin
        Marker->>MdeMap: gmp-click event
        MdeMap->>App: navigate to detail OR open InfoWindow
        Note right of App: ChatMap: opens InfoWindow ✅<br/>MdeMap: navigate() ✅
    end

    alt Component unmounts
        MdeCluster->>Marker: marker.map = null (cleanup ✅)
        MdeMap->>GMaps: map.setMap(null)
    end

    Note over App,Marker: ⚠️ CURRENT: ChatMap.tsx makeContent() duplicates pinContent.ts<br/>TARGET: Single pinContent.ts used by both ChatMap + MdeMap
```

**Duplication fix:**
```typescript
// pinContent.ts — single source of truth
export function makeContent(pin: MapPin): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('role', 'button');     // ← ADD a11y
  el.setAttribute('tabindex', '0');      // ← ADD a11y
  el.setAttribute('aria-label', pin.title); // ← ADD a11y
  // ... rest of pin rendering
  return el;
}
// ChatMap.tsx: REMOVE local makeContent(), import from pinContent.ts
```

---

## Diagram 8 — Chat → Map → AI Flow

> **What it shows:** End-to-end user journey from typing a chat message through intent routing, AI tool calls, result rendering in chat cards, and map pin updates.

```mermaid
sequenceDiagram
    participant User as User
    participant React as React App\n(FloatingChatWidget)
    participant EdgeChat as ai-chat\n(Supabase Edge)
    participant GeminiLLM as Gemini API
    participant Tools as Tool Registry\n(search_restaurants etc.)
    participant SupaDB as Supabase DB
    participant MapCtx as MapContext

    User->>React: types "best paisa food in Laureles"
    React->>EdgeChat: POST /ai-chat\n{messages, sessionData}
    Note right of React: auth JWT in header
    EdgeChat->>EdgeChat: rate limit check (10/min/user)
    EdgeChat->>GeminiLLM: generateContent(\n  model: gemini-3-flash-preview,\n  tools: [search_restaurants,...]\n)
    GeminiLLM-->>EdgeChat: functionCall { search_restaurants, {cuisine:'paisa', neighborhood:'Laureles'} }
    EdgeChat->>Tools: dispatchTool('search_restaurants', args)
    Tools->>SupaDB: SELECT ... FROM restaurants\nWHERE neighborhood='Laureles'\nAND cuisine_types @> '{paisa}'
    SupaDB-->>Tools: [5 restaurant rows with\nmapsUrl + aiSummary]
    Tools-->>EdgeChat: { results: [...], total_count: 5 }
    EdgeChat->>GeminiLLM: functionResponse (tool result)
    GeminiLLM-->>EdgeChat: text response + inline card data

    loop SSE stream chunks
        EdgeChat-->>React: data: {type:'token', text:'...'}
    end
    EdgeChat-->>React: data: {type:'cards', cards:[...]}

    React->>React: render RestaurantCardInline\n(mapsUrl link + aiSummary text)
    React->>MapCtx: setMapPins(results.map(→ MapPin))
    MapCtx->>React: MdeMap/ChatMap re-renders\nwith new pins
    React-->>User: Chat cards + map pins synced ✅

    Note over User,MapCtx: ⚠️ Gap: Maps Grounding not active in GeminiLLM call<br/>Cards show DB aiSummary, not live-grounded data
```

---

## Diagram 9 — Supabase Data Flow

> **What it shows:** How data enters, is enriched, and flows through the Supabase schema — from seed → enrichment → RLS → edge function reads → frontend renders.

```mermaid
flowchart LR
    classDef table fill:#f3e8ff,stroke:#7c3aed,color:#4c1d95
    classDef fn fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef script fill:#ffedd5,stroke:#ea580c,color:#7c2d12
    classDef ui fill:#dbeafe,stroke:#2563eb,color:#1e3a8a

    subgraph SEED["📥 Data Ingress"]
        SQL["seed SQL / admin inserts"]
        Migrations["supabase/migrations/\n20260514000100..."]
    end

    subgraph TABLES["🗄️ Core Tables (RLS on all)"]
        apartments["apartments\n(pgvector fts_content)"]
        restaurants2["restaurants\n(+google_place_id\n+maps_url, +ai_summary)"]
        tourist2["tourist_destinations\n(same enrichment cols)"]
        events2["events\n(google_place_id col exists\nbut 0 rows filled ⚠️)"]
        placesCache2["places_search_cache\n(TTL 7d)"]
        detailsCache2["place_details_cache\n(TTL 30d)"]
        aiRuns2["ai_runs\n(all AI calls logged)"]
        conversations2["conversations\n(session_data jsonb)"]
        profiles["profiles\n(extends auth.users)"]
    end

    subgraph ENRICHMENT["📜 Offline Enrichment"]
        enrich2["enrich-places.ts\n→ restaurants ✅\n→ tourist_destinations ✅\n→ events ❌"]
        cacheAI2["cache-ai-summaries.ts\n→ ai_summary ✅"]
    end

    subgraph EDGE_READS["⚡ Edge Function Reads"]
        aiChatRead["ai-chat\n(restaurants, events,\napartments)"]
        aiSearchRead["ai-search\n(hybrid_search_apartments\nhybrid_search_events\nhybrid_search_restaurants)"]
    end

    subgraph FRONTEND["🌐 Frontend Renders"]
        mapCards["Map cards\n(mapsUrl → Google Maps link\naiSummary → card text)"]
        chatCards["Chat inline cards\n(RestaurantCardInline\nAttractionCardInline\nEventCardInline)"]
    end

    SQL --> apartments & restaurants2 & tourist2 & events2
    Migrations --> placesCache2 & detailsCache2
    enrich2 -->|"UPDATE"| restaurants2 & tourist2
    enrich2 -.->|"❌ missing"| events2
    cacheAI2 -->|"UPDATE ai_summary"| restaurants2 & tourist2
    restaurants2 & tourist2 --> aiChatRead
    apartments --> aiSearchRead
    aiChatRead --> mapCards & chatCards
    aiSearchRead --> mapCards

    class apartments,restaurants2,tourist2,events2,placesCache2,detailsCache2,aiRuns2,conversations2,profiles table
    class aiChatRead,aiSearchRead fn
    class enrich2,cacheAI2 script
    class mapCards,chatCards ui
```

---

## Diagram 10 — Deployment / Vercel / Edge Topology

> **What it shows:** The full runtime topology — local dev, Vercel CDN, Supabase edge, Mastra server, and how they connect in production vs development.

```mermaid
flowchart TB
    classDef vercel fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef supabase fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef mastra fill:#fef9c3,stroke:#ca8a04,color:#713f12
    classDef user fill:#f3f4f6,stroke:#6b7280,color:#374151
    classDef dns fill:#f3e8ff,stroke:#7c3aed,color:#4c1d95

    subgraph INTERNET["🌍 Public Internet"]
        Users["Users\n(browser)"]
        GoogleAPIs["Google APIs\nMaps JS · Places · Routes · Gemini"]
    end

    subgraph VERCEL["▲ Vercel (auto-deploy on main push)"]
        VercelCDN["CDN Edge\n(static assets, dist/)"]
        VercelFn["Vercel Functions\n(SSR if needed)"]
        VercelEnv["Env Vars:\nVITE_GOOGLE_MAPS_API_KEY ✅\nVITE_SUPABASE_URL ✅\nVITE_SUPABASE_PUBLISHABLE_KEY ✅\n⛔ VITE_GEMINI_API_KEY (REMOVE)"]
    end

    subgraph SUPABASE["🗄️ Supabase Cloud (us-east-1)"]
        SupaAuth["Auth (JWT)"]
        SupaDB2["PostgreSQL\n(zkwcbyxiwklihegjhuql)"]
        SupaEdge["Edge Functions (Deno)\n12 functions\nai-chat · ai-search · google-directions..."]
        SupaSecrets["Secrets:\nGEMINI_API_KEY\nGOOGLE_MAPS_API_KEY\nSUPABASE_SERVICE_ROLE_KEY\nSTRIPE_SECRET_KEY"]
        SupaRealtime["Realtime\n(broadcast, not postgres_changes)"]
    end

    subgraph MASTRA_DEPLOY["🤖 Mastra Server\n(my-mastra-app — local dev only currently)"]
        MastraStudio["Mastra Studio\n:4111"]
        MastraAgents["Agents:\nconcierge · router · rental · event"]
        MastraEnv["Env:\nGEMINI_API_KEY\nGOOGLE_MAPS_API_KEY\nSUPABASE_SERVICE_ROLE_KEY"]
    end

    subgraph LOCAL["💻 Local Dev (:8080)"]
        ViteDev["vite dev\nnpm run dev"]
        MastraDev["mastra dev\nnpm run dev (my-mastra-app)"]
        Scripts["scripts/\nenrich-places.ts\ncache-ai-summaries.ts"]
    end

    Users -->|"HTTPS mdeai.co"| VercelCDN
    VercelCDN -->|"SPA bundle"| Users
    Users -->|"Supabase JS client"| SupaAuth & SupaDB2
    Users -->|"Edge fn calls"| SupaEdge
    SupaEdge -->|"Deno.env.get()"| SupaSecrets
    SupaEdge -->|"SQL queries"| SupaDB2
    SupaEdge -->|"GEMINI_API_KEY"| GoogleAPIs
    SupaRealtime -->|"broadcast"| Users
    VercelEnv -->|"build-time inject"| VercelCDN

    MastraAgents -->|"SUPABASE_SERVICE_ROLE_KEY"| SupaDB2
    MastraDev -.->|"local only\nnot yet deployed"| MASTRA_DEPLOY
    Scripts -->|"offline run"| SupaDB2 & GoogleAPIs

    Note1["⚠️ 21 commits unpushed\nVercel prod is BEHIND local main"]

    class VercelCDN,VercelFn,VercelEnv vercel
    class SupaAuth,SupaDB2,SupaEdge,SupaSecrets,SupaRealtime supabase
    class MastraStudio,MastraAgents,MastraEnv,MastraDev mastra
    class ViteDev,Scripts,MastraDev,LOCAL user
```

**Topology gaps:**
- Mastra server runs locally only — not deployed to any cloud runtime
- 21 commits mean production (Vercel) is behind local main
- No health check endpoint on Mastra Studio
- No alerting on edge function errors

---

## Diagram 11 — Error Handling + Retry Flow

> **What it shows:** Current error handling in enrichment scripts vs the target retry-with-backoff pattern.
> **Gap:** On 429 (rate limit) or transient network errors, scripts currently log and continue — no retry. This means a Places API quota spike silently drops venues.

```mermaid
flowchart TD
    classDef good fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef bad fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef neutral fill:#f3f4f6,stroke:#6b7280,color:#374151

    subgraph CURRENT_ERR["⚠️ Current Error Handling"]
        C1["API call"]
        C2{HTTP status}
        C3["2xx → parse result\nUPDATE DB ✅"]
        C4["4xx/5xx → throw Error\n(includes 429!)"]
        C5["catch → logError()\nerrors++ · continue\n(LOST VENUE ❌)"]
        C1 --> C2
        C2 -->|"2xx"| C3
        C2 -->|"4xx/5xx"| C4
        C4 --> C5
    end

    subgraph TARGET_ERR["✅ Target: Exponential Backoff"]
        T1["API call"]
        T2{HTTP status}
        T3["2xx → parse\nUPDATE DB ✅"]
        T4{"429\nRate Limit?"}
        T5{"5xx\nServer Error?"}
        T6["4xx non-429 → logError()\nmark as not-found · continue"]
        T7{"retries < 3?"}
        T8["sleep(2^attempt × 1000ms\n+ jitter)"]
        T9["retry call"]
        T10["max retries exceeded\nlogError() · continue"]
        T1 --> T2
        T2 -->|"2xx"| T3
        T2 -->|"429"| T4
        T2 -->|"5xx"| T5
        T2 -->|"4xx other"| T6
        T4 -->|"yes"| T7
        T5 -->|"yes"| T7
        T7 -->|"retries < 3"| T8
        T8 --> T9
        T9 --> T2
        T7 -->|"max"| T10
    end

    class C3,T3,T6 good
    class C4,C5,T10 bad
    class C1,C2,T1,T2,T4,T5,T7,T8,T9 neutral
```

**Implementation:**
```typescript
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err instanceof Error && err.message.includes('429');
      const is5xx = err instanceof Error && err.message.match(/HTTP 5\d\d/);
      if ((is429 || is5xx) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw new Error('unreachable');
}
```

---

## Diagram 12 — Rate Limit + Backoff Flow

> **What it shows:** The rate limiting architecture across all three layers — browser → edge function → external API.
> **Gap:** Edge function rate limits are enforced (10 AI/min, 30 search/min). External API rate limits (Places 429) have no backoff.

```mermaid
flowchart LR
    classDef enforced fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef missing fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef partial fill:#fef3c7,stroke:#f59e0b,color:#78350f

    subgraph BROWSER_RL["🌐 Browser Layer"]
        UX_Throttle["UI debounce 300ms ✅\n(search input)"]
        ReactQuery["TanStack Query\nstaleTime, gcTime ✅"]
    end

    subgraph EDGE_RL["⚡ Edge Function Layer"]
        AILimit["ai-chat:\n10 req/min/user ✅\n(allowRateDurable)"]
        SearchLimit["ai-search:\n30 req/min/user ✅"]
        OtherLimit["other fns:\nno rate limit ⚠️"]
    end

    subgraph SCRIPT_RL["📜 Script Layer"]
        PlacesDelay["DELAY_MS: 300ms\nbetween calls ✅"]
        GeminiDelay["DELAY_MS: 400ms\nbetween calls ✅"]
        No429Retry["429 error → crash ❌\nNo exponential backoff"]
    end

    subgraph EXTERNAL_RL["🔌 External API Quotas"]
        PlacesQuota["Places API:\n60 QPS default\n(Text Search Essentials)"]
        GeminiQuota["Gemini API:\n1500 RPM free tier\n(flash preview)"]
        MapsQuota["Maps JS:\nno hard rate limit"]
    end

    UX_Throttle --> AILimit
    ReactQuery --> SearchLimit
    AILimit -->|"429 → 429 back to client"| PlacesQuota
    SearchLimit --> GeminiQuota
    PlacesDelay -->|"~3 req/sec"| PlacesQuota
    GeminiDelay --> GeminiQuota
    No429Retry -.->|"⚠️ crash on quota\nexceeded"| PlacesQuota

    class UX_Throttle,ReactQuery,AILimit,SearchLimit,PlacesDelay,GeminiDelay enforced
    class No429Retry,OtherLimit missing
    class PlacesQuota,GeminiQuota,MapsQuota partial
```

---

## Diagram 13 — Events Enrichment Flow (Missing → Fixed)

> **What it shows:** The complete enrichment path specifically for the `events` table — which has `google_place_id` column ready but 0 rows enriched.
> **This is a P1 blocker** — event map pins cannot link to Google Maps without `maps_url`.

```mermaid
flowchart TD
    classDef done fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef gap fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef step fill:#f3f4f6,stroke:#6b7280,color:#374151

    subgraph CURRENT_STATE["📊 Current State"]
        EventsTable["events table\n49 rows\ngoogle_place_id: all NULL ❌\nmaps_url: all NULL ❌\nlat/lng: 47 OK, 2 missing ⚠️"]
    end

    subgraph STEP1["Step 1 — Geocode missing coords"]
        HasCoords{"lat/lng NULL?"}
        RunGeocode["scripts/geocode-missing.ts\n(targets events table)\n2 rows to fix"]
        StoreCoords2["UPDATE events\nSET lat, lng"]
        HasCoords -->|"yes (2 rows)"| RunGeocode
        RunGeocode --> StoreCoords2
        HasCoords -->|"no (47 rows)"| STEP2
        StoreCoords2 --> STEP2
    end

    subgraph STEP2["Step 2 — Extend enrich-places.ts for events"]
        ExtendScript["Add to enrich-places.ts:\nenrichTable('events', 'name', 'address')\n\nOR create:\nscripts/enrich-events.ts"]
        BuildQuery["textQuery: '{name} {address} Medellín Colombia'\nlocationBias: circle(6.2442,-75.5812, 30km)"]
        PlacesCall["Places API :searchText\n$0.017 × 49 = ~$0.83 total"]
        ValidateURI["validatePlaceUri()\n(must start https://maps.google.com/)"]
        UpdateEvents["UPDATE events\nSET google_place_id, maps_url"]
    end

    subgraph STEP3["Step 3 — Verify coverage"]
        CheckSQL["SELECT COUNT(*), COUNT(google_place_id)\nFROM events;\n-- target: ≥ 80% (≥40/49)"]
        UpdateChecklist["Update C14 in 01-places-checklist.md\n✅ events: X/49 enriched"]
    end

    EventsTable --> HasCoords
    ExtendScript --> BuildQuery --> PlacesCall --> ValidateURI --> UpdateEvents --> CheckSQL --> UpdateChecklist

    class EventsTable gap
    class HasCoords,RunGeocode,StoreCoords2,ExtendScript,BuildQuery,PlacesCall,ValidateURI,UpdateEvents,CheckSQL,UpdateChecklist step
    class UpdateChecklist done
```

---

## Diagram 14 — Security Boundary Diagram

> **What it shows:** The hard boundary between client-safe and server-only secrets, and every crossing point where that boundary is currently violated.
> **P0:** `VITE_GEMINI_API_KEY` crosses from server-only into the browser bundle.

```mermaid
flowchart TB
    classDef safe fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef danger fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef boundary fill:#fef3c7,stroke:#f59e0b,color:#78350f,stroke-width:3px,stroke-dasharray:8 4

    subgraph CLIENT_ZONE["🌐 PUBLIC CLIENT ZONE\n(visible to all users)"]
        direction TB
        ViteMapsKey["VITE_GOOGLE_MAPS_API_KEY\n✅ Safe — HTTP referrer restricted\nOnly works from mdeai.co domain"]
        ViteSupaURL["VITE_SUPABASE_URL\n✅ Safe — public endpoint"]
        ViteSupaAnon["VITE_SUPABASE_PUBLISHABLE_KEY\n✅ Safe — anon key, RLS enforced"]
        GeminiLEAK["⛔ VITE_GEMINI_API_KEY\nIN BUNDLE — P0 VIOLATION\nNo restrictions — usable by anyone\nfrom any domain or curl command"]
    end

    BOUNDARY["═══════ SECURITY BOUNDARY ═══════\nAnything above = public\nAnything below = server-only"]

    subgraph SERVER_ZONE["🔒 SERVER-ONLY ZONE\n(Supabase Edge / Mastra / Scripts)"]
        direction TB
        GeminiServer["GEMINI_API_KEY ✅\n(Deno.env / process.env)\nShould be here ONLY"]
        MapsServer["GOOGLE_MAPS_API_KEY ✅\n(HTTP unrestricted — server use)"]
        ServiceRole["SUPABASE_SERVICE_ROLE_KEY ✅\n(admin access — server only)"]
        StripeKey["STRIPE_SECRET_KEY ✅"]
        QRSign["QR_SIGNING_SECRET ✅"]
    end

    subgraph VIOLATIONS["⛔ Active Security Violations"]
        V1["VIOLATION: VITE_GEMINI_API_KEY\nCrossed boundary at build time\nVite vite:define inlined it\ninto dist/index-[hash].js\nVerifiable: grep 'AIza' dist/"]
    end

    GeminiLEAK -.->|"⛔ should be in\nSERVER_ZONE only"| V1
    GeminiServer -.->|"correct location"| SERVER_ZONE

    class ViteMapsKey,ViteSupaURL,ViteSupaAnon safe
    class GeminiLEAK,V1 danger
    class BOUNDARY boundary
    class GeminiServer,MapsServer,ServiceRole,StripeKey,QRSign safe
```

**Verification commands (run after fix):**
```bash
# Before fix: finds Gemini AIza token
grep -r "AIza" dist/ | grep -v "GOOGLE_MAPS"

# After rename + rebuild: must return EMPTY
VITE_GEMINI_API_KEY → GEMINI_API_KEY in .env.local + Vercel
npm run build
grep -r "AIza" dist/  # → 0 results ✅
```

---

## Diagram 15 — Cost / Billing Hotspot Diagram

> **What it shows:** Every billable API call in the system, its SKU, cost per call, and the current monthly estimate at 500 active users.
> **Hotspots:** Places API Text Search at $0.017/req accumulates fast without caching. Gemini requests scale with active users. No caching on Places = paying on every enrichment re-run.

```mermaid
flowchart TD
    classDef expensive fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef moderate fill:#fef3c7,stroke:#f59e0b,color:#78350f
    classDef cheap fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef free fill:#f3f4f6,stroke:#6b7280,color:#374151

    subgraph MAPS_BILLING["🗺️ Google Maps Platform"]
        MapsLoad["Maps JS Load\n$0.007 / 1000 loads\nSKU: Dynamic Maps\n~500 users × 3 loads = $0.01/day ✅"]
        PlacesText["Places Text Search\n$0.017 / request\nSKU: Text Search Essentials\n⚠️ NO CACHE = paid every run"]
        PlacesDetails["Place Details (if added)\n$0.017–$0.032 / request\nSKU: Details Essentials/Advanced"]
        RoutesAPI2["Routes API\n$0.005 / element\nSKU: Routes Basic\n(directions feature)"]
        GeocodingAPI["Geocoding API\n$0.005 / request\n(2 missing events)"]
    end

    subgraph GEMINI_BILLING["🤖 Gemini API"]
        GeminiFlash["gemini-3-flash-preview\n$0.15/1M input, $0.60/1M output\nai-chat: ~1500 tokens/conversation\n~$0.001/conversation"]
        GeminiEmbed["gemini-embedding-001\n$0.00001/request (nearly free ✅)\nai-search: 1 embed/search"]
        GeminiSummary["AI Summary generation\ngemini-3-flash-preview\n350 venues × $0.001 = $0.35 once ✅"]
        GeminiGround2["Maps Grounding (when implemented)\n$0.035/1000 grounding calls\nNear-free at current scale ✅"]
    end

    subgraph MONTHLY_EST["📊 Monthly Estimate @ 500 active users"]
        MonthlyCost["Maps JS: $0.30\nRoutes API: $2.00\nPlaces (enrichment, once): $6.00\nPlaces (if runtime, no cache): $255.00\nGemini chat: $30.00\nGemini embed: $1.50\nTotal (with cache): ~$40/month\nTotal (no cache, runtime): ~$295/month"]
    end

    PlacesText -->|"no cache = full cost"| MonthlyCost
    PlacesText -.->|"with cache = free"| MonthlyCost
    GeminiFlash --> MonthlyCost
    MapsLoad --> MonthlyCost
    RoutesAPI2 --> MonthlyCost

    class PlacesText,PlacesDetails expensive
    class GeminiFlash,RoutesAPI2 moderate
    class MapsLoad,GeminiEmbed,GeminiSummary,GeocodingAPI,GeminiGround2 cheap
```

**Billing optimization priority:**
| Action | Savings | Effort |
|--------|---------|--------|
| Wire `places_search_cache` (TTL 7d) | $0–$250/month | Medium |
| Add TTL cleanup cron | Prevents DB bloat | Low |
| Pin `Places Essentials` not `Advanced` field mask | No extra cost | Low |
| Maps Grounding ($0.035/1000) | Negligible | High (new feature) |

---

## Architecture Problems — Top 15

| # | Problem | Severity | Diagram |
|---|---------|----------|---------|
| 1 | `VITE_GEMINI_API_KEY` in production bundle — server key exposed | 🔴 P0 | D3, D14 |
| 2 | ChatMap + MdeMap dual system — duplicate code, diverging behavior | 🔴 HIGH | D1, D7 |
| 3 | `places_search_cache` created but never queried | 🔴 HIGH | D4, D15 |
| 4 | Events table 0/49 enriched — map links broken for all events | 🔴 HIGH | D6, D13 |
| 5 | `tourist_destinations` 78.6% — below ≥80% target | 🟠 P1 | D6, D9 |
| 6 | Gemini Maps Grounding entirely absent | 🟠 P1 | D5 |
| 7 | No 429 exponential backoff in enrichment scripts | 🟠 P1 | D11, D12 |
| 8 | Mastra server local-only — not deployed to production runtime | 🟠 P1 | D10 |
| 9 | 21 local commits not pushed to `origin/main` | 🟠 P1 | D10 |
| 10 | `pinContent.makeContent()` duplicated in ChatMap.tsx | 🟡 MEDIUM | D7 |
| 11 | No accessibility attributes on marker HTML (`title`, `role`, `tabIndex`) | 🟡 MEDIUM | D7 |
| 12 | No TTL cleanup cron for cache tables | 🟡 MEDIUM | D4, D15 |
| 13 | No `thinkingBudget: 0` regression test | 🟡 MEDIUM | D6 |
| 14 | 2 events with missing lat/lng — geocode-missing.ts not run | 🟡 MEDIUM | D13 |
| 15 | No health check or observability on edge functions or Mastra | 🟡 MEDIUM | D10 |

---

## Fix Priority Order — Updated 2026-05-15

### Must-fix before production push (P0/P1)

```
1. VITE_GEMINI_API_KEY → GEMINI_API_KEY   ✅ PARTIAL (code done; Vercel dashboard + key rotation = user action)
   - .env.local: already GEMINI_API_KEY ✅
   - Local bundle: verified clean (1 AIza prefix = Maps key only) ✅
   - mastra-start.sh: updated in both copies ✅
   - Vercel dashboard: must remove VITE_GEMINI_API_KEY, add GEMINI_API_KEY ⚠️ USER ACTION
   - Key rotation: rotate in Google Cloud Console ⚠️ USER ACTION

2. git push origin main (21+ commits — unblock Vercel deploy)              ⚠️ OPEN

3. Enrich events (enrich-places.ts extended for events table)               ✅ PARTIAL (code done, not yet run)
   - Script now calls enrichTable('events', 'name', 'address') ✅
   - Run: cd /home/sk/mde && npx ts-node --esm scripts/enrich-places.ts

4. Enrich 1 more tourist_destination (23/28 → 80%+)                       ⚠️ OPEN (run with step 3)

5. Run geocode-missing.ts for 2 events with missing lat/lng                 ✅ PARTIAL (column bug fixed, not yet run)
   - Bug fixed: venue/neighborhood → name/address ✅
   - Run: cd /home/sk/mde && npx ts-node --esm scripts/geocode-missing.ts
   - Note: one event has address "TBD" — may not resolve

6. Add 429 exponential backoff to enrichment scripts                        ✅ FIXED 2026-05-15
   - withRetry<T>(fn, maxRetries=3) in enrich-places.ts ✅
   - withRetry<T>(fn, maxRetries=3) in cache-ai-summaries.ts ✅
```

### Architecture cleanup (post-deploy)

```
7. Wire places_search_cache in enrich-places.ts (check cache before API call)
8. Consolidate ChatMap.tsx → MdeMap.tsx (single map component)
9. Move makeContent() to pinContent.ts (single source of truth)
10. Add marker a11y: title, role=button, tabIndex=0, aria-label
```

### Feature additions (Phase 2)

```
11. Implement Gemini Maps Grounding in ai-chat edge function
12. Add TTL cleanup cron (DELETE FROM places_*_cache WHERE expires_at < now())
13. Add thinkingBudget:0 regression test
14. Deploy Mastra to cloud runtime (not local-only)
15. Add /health endpoint + edge function error alerting
```

---

## Improved Folder Structure

```
src/
  components/
    map/
      MdeMap.tsx          ← KEEP (canonical map component)
      MdeMarker.tsx       ← KEEP
      MdeMarkerCluster.tsx← KEEP
      MdeInfoWindow.tsx   ← KEEP
      pinContent.ts       ← SINGLE source for makeContent()
    chat/
      ChatMap.tsx         ← DEPRECATE → migrate to MdeMap
      embedded/
        RestaurantCardInline.tsx
        AttractionCardInline.tsx
        EventCardInline.tsx

scripts/
  enrich-places.ts       ← extend for events table
  cache-ai-summaries.ts
  geocode-missing.ts
  enrich-events.ts       ← NEW (or extend enrich-places.ts)
  refresh-stale-ids.ts   ← NEW (12-month refresh)
  cleanup-cache.ts       ← NEW (TTL pruning)

supabase/functions/
  ai-chat/               ← ADD Maps Grounding tool
  places-lookup/         ← NEW (cache-first Places proxy)
  _shared/
    places-cache.ts      ← NEW (cache read/write helpers)
```

---

## Verification Checklist — Updated 2026-05-15

After implementing fixes, verify these in order:

- [x] `grep -r "AIza" dist/` → 1 result only (Maps key, not Gemini) ✅ Verified 2026-05-15
- [x] `npm run build` → exit 0 ✅ 4.42s, 2026-05-15
- [x] `npm run test` → count not regressed ✅ 152/152 root + 56/56 Mastra, 2026-05-15
- [ ] `git log origin/main..HEAD` → 0 commits ahead (pushed) ⚠️ 21+ commits pending
- [ ] `SELECT COUNT(*) FROM events WHERE google_place_id IS NOT NULL` → ≥ 40 ⚠️ script not yet run
- [ ] `SELECT COUNT(*) FROM tourist_destinations WHERE google_place_id IS NOT NULL` → ≥ 23 ⚠️ script not yet run
- [x] `SELECT COUNT(*) FROM restaurants WHERE google_place_id IS NOT NULL` → ≥ 53 ✅ 62/66 (93.9%)
- [ ] `SELECT COUNT(*) FROM places_search_cache` → rows being written on cache miss ⚠️ future phase
- [ ] Browser: event map card → "Open in Maps" link → valid Google Maps URL ⚠️ pending enrichment run
- [x] Console: 0 red errors on `/explore` and chat routes ✅ Verified 2026-05-14

---
