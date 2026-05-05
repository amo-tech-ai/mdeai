# GitHub repos — real-estate AI search (ranked for mdeai)

> **Goal:** Build a **rental mega-search** / intelligent search engine you can **use directly** (patterns, code) or **model** for **mdeai** (Medellín furnished rentals, Supabase SoT, Hermes ranking, Gap 1 multi-site).  
> **Related:** [`03-realestate-search.md`](03-realestate-search.md) (portals & APIs), [`06-search.md`](06-search.md) (strategy), [`tasks/prompts/11A-real-estate-search-stack.md`](../prompts/11A-real-estate-search-stack.md) (Hermes · OpenClaw · data flow).

---

## Scoring methodology (Score /100)

Weighted for **mdeai**:

| Criterion | Weight (intent) |
|-----------|-----------------|
| Search quality & retrieval architecture | High |
| Real-estate workflow depth (rental / showing / lead) | High |
| Usefulness for **meta-search** or **unified index** | High |
| Production-readiness signals (tests, docs, deploy) | Medium |
| Reusability with **Vite + React + Supabase + pgvector + Gemini edges** | Medium |

Scores are **comparative**, not absolute benchmarks. Use them to **prioritize reading order**, not to claim “91% complete.”

---

## Top 10 repositories

| Rank | Repository                                                                                                                                        |  Score | Best use                          | Why it matters                                                                                                                                                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -----: | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | [AleksNeStu/ai-real-estate-assistant](https://github.com/AleksNeStu/ai-real-estate-assistant)                                                     | **91** | Overall product model             | **RAG + LLMs + intelligent search + market analysis + valuation**; **Python, FastAPI, Next.js**. Strongest **end-to-end** “assistant + search” foundation to study—not only a toy demo.                                                                            |
| 2    | [ISL270/multi-agent-ai-realtor](https://github.com/ISL270/multi-agent-ai-realtor)                                                                 | **89** | Multi-agent search + booking      | **Property finder agent**, **Supabase via RPC**, **appointment booking**, **LangGraph / LangChain / LangSmith / LangMem**, **chat-first UI**. Closest workflow story to **search → action** (aligns with mdeai CRM / showings).                                    |
| 3    | [retroryan/real_estate_ai_search](https://github.com/retroryan/real_estate_ai_search)                                                             | **87** | Retrieval + pipeline architecture | **RAG vs GraphRAG**, **DuckDB medallion**, **Elasticsearch + Neo4j patterns**, hybrid scoring docs. Best **search-core** reference for a serious **aggregated index** behind meta-search. **Local clone:** `external/real_estate_ai_search` (read-only reference). |
| 4    | [brightdata/real-estate-ai-agent](https://github.com/brightdata/real-estate-ai-agent)                                                             | **84** | Multi-source extraction           | **AI agents + MCP** for structured JSON from messy sources. Models **ingestion / normalization**—not your full storefront; pairs with **Gap 1** (Firecrawl) in [`03-realestate-search.md`](03-realestate-search.md).                                               |
| 5    | [ISL270/nawy-ai-flutter-app](https://github.com/ISL270/nawy-ai-flutter-app)                                                                       | **82** | Mobile / NL search UX             | **Flutter**, **Firebase AI & Gemini**, NL property search, filtering, favorites. *Also referenced as `real-estate-ai-flutter-app`.* Use for **UX and function-calling** ideas; mdeai web stays **Vite + React**.                                                   |
| 6    | [GRKdev/Real-State-AI](https://github.com/GRKdev/Real-State-AI)                                                                                   | **80** | Lightweight search app            | **Next.js + PostgreSQL + GPT-4o-mini + Whisper + Clerk**; practical **ship-fast** search UI—not deep platform architecture.                                                                                                                                        |
| 7    | [AI-ANK/AI-Real-Estate-Search-Qdrant](https://github.com/AI-ANK/AI-Real-Estate-Search-Qdrant)                                                     | **78** | Vector search starter             | **Qdrant + OpenAI + Streamlit**—prototype patterns; map concepts to **Supabase `pgvector`** + **`ai-search`** edge, not a second vector DB unless justified.                                                                                                       |
| 8    | [tysonthomas9/realtor-agent](https://github.com/tysonthomas9/realtor-agent)                                                                       | **76** | Comps + analysis                  | **Comparables**, **document processing**, **multi-agent**—strong **phase 2** after core search (investor/broker workflows).                                                                                                                                        |
| 9    | [Ashish-Patnaik/Realty-Sensay-AI-Real-Estate-Assistant](https://github.com/Ashish-Patnaik/Realty-Sensay-AI-Real-Estate-Assistant)                 | **72** | Conversational search demo        | **React + Vite**—lightweight **chat search** UX; stack affinity with mdeai; lighter on backend retrieval depth.                                                                                                                                                    |
| 10   | [Emmrich/AI-Real-Estate-Recommendation-Assistant-Agent-ARERAA-](https://github.com/Emmrich/AI-Real-Estate-Recommendation-Assistant-Agent-ARERAA-) | **69** | Lead-gen / assistant              | **Voiceflow + OpenAI**—recommendation + booking flows; **conversion after search**, not core search engine.                                                                                                                                                        |

---

## By category

### Architecture models (core search brain)

- [AleksNeStu/ai-real-estate-assistant](https://github.com/AleksNeStu/ai-real-estate-assistant)
- [retroryan/real_estate_ai_search](https://github.com/retroryan/real_estate_ai_search)
- [ISL270/multi-agent-ai-realtor](https://github.com/ISL270/multi-agent-ai-realtor)

### UX patterns (NL search, filters, chat)

- [ISL270/nawy-ai-flutter-app](https://github.com/ISL270/nawy-ai-flutter-app) (mobile)
- [GRKdev/Real-State-AI](https://github.com/GRKdev/Real-State-AI) (web)
- [Ashish-Patnaik/Realty-Sensay-AI-Real-Estate-Assistant](https://github.com/Ashish-Patnaik/Realty-Sensay-AI-Real-Estate-Assistant) (Vite/React)

### Ingestion / enrichment

- [brightdata/real-estate-ai-agent](https://github.com/brightdata/real-estate-ai-agent)
- [AI-ANK/AI-Real-Estate-Search-Qdrant](https://github.com/AI-ANK/AI-Real-Estate-Search-Qdrant) (vector patterns → map to pgvector)

### Phase 2+ (comps, qualification, conversion)

- [tysonthomas9/realtor-agent](https://github.com/tysonthomas9/realtor-agent)
- [Emmrich/AI-Real-Estate-Recommendation-Assistant-Agent-ARERAA-](https://github.com/Emmrich/AI-Real-Estate-Recommendation-Assistant-Agent-ARERAA-)
- [ISL270/multi-agent-ai-realtor](https://github.com/ISL270/multi-agent-ai-realtor) (booking)

---

## Map to mdeai (what to actually copy vs invent)

| mdeai layer | Borrow from | Notes |
|-------------|-------------|--------|
| **Canonical listing + embeddings** | retroryan (pipeline mindset), AI-ANK (vector ideas) | SoT stays **Supabase**; **no** duplicate Neo4j/ES in MVP unless product requires it. |
| **Ranking / explainability** | retroryan hybrid docs, AleksNeStu product depth | **Hermes / `hermes-ranking` edge** = product ranker; see [`11A`](../prompts/11A-real-estate-search-stack.md). |
| **Chat + tools + showings** | ISL270 multi-agent | Align tools with **edge functions**, not raw service role on client. |
| **Ingestion from many portals** | brightdata, Gap 1 | Compliance + **ToS** first ([`03-realestate-search.md`](03-realestate-search.md)). |
| **Web UX** | GRKdev, Realty-Sensay, **mdeai wireframes** | **04E** + shadcn; Hermes breakdown **06B**. |
| **Mobile later** | ISL270 Flutter | Optional; not blocking web MVP. |

---

## Recommended hybrid (single stack does not exist)

Combine:

1. **retroryan** — retrieval / index / hybrid scoring **ideas** (read `HYBRID_SEARCH_INTERNALS.md`, pipeline layout).
2. **AleksNeStu** — product shape: search + insights + assistant depth.
3. **brightdata** — structured **extraction** patterns for external listings (governed).
4. **ISL270 multi-agent** — **search → book showing** orchestration patterns (LangGraph ↔ your **Paperclip / edges** story).

**One repo to read first (breadth):** **AleksNeStu/ai-real-estate-assistant**.  
**One repo for search-core patterns:** **retroryan/real_estate_ai_search** (local: `external/real_estate_ai_search`).  
**One repo closest to “Supabase + agents + UI”:** **ISL270/multi-agent-ai-realtor**.

---

## Real-world examples (how each helps mdeai)

| Repo | Example use |
|------|----------------|
| AleksNeStu | Model **search + valuation + market narrative** features for concierge. |
| retroryan | Model **semantic + keyword + graph-style relationships** concepts; adapt to **Postgres + pgvector**. |
| ISL270 multi-agent | Model **NL → RPC → results → schedule showing**; wire to **`p1-crm`**, `showing-create` (when shipped). |
| brightdata | Model **normalize messy listing HTML → JSON** for comp feeds (legal review). |
| ISL270 Flutter | Model **NL query + filters** UX patterns on web analogs. |
| GRKdev | Model **fast search-first UI** and prompt design. |
| AI-ANK | Model **embedding + similarity** experiments against **your** listing rows. |
| realtor-agent | Model **comps + doc analysis** after search MVP. |
| Realty-Sensay | Model **simple chat search** entry points. |
| ARERAA | Model **lead + booking** follow-up, not core indexer. |

---

## Verdict

- **Do not** fork one repo as “mdeai search”—**stack and geography** differ (Colombia rentals, Shopify/Gadget, Supabase-only SoT).
- **Do** mine patterns: retrieval layering, hybrid scores, agent boundaries, ingestion guards.
- **Track implementation** with existing epics: **E4** UI, **E6** ranking, **Gap 1** ingestion, **`11A`/`11B`** prompts.

---

*Last updated: 2026-04-04*
