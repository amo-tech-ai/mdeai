# Top 10 AI Rental Chat Startups + Top 10 GitHub Repos

_Scored /100 for relevance to mdeai (Medellín rental meta-search with AI chat)._

---

## 🏢 Top 10 Commercial Startups / SaaS

|#|Name|Score|What they sell|
|---|---|---|---|
|1|**EliseAI**|92|Industry-leading leasing AI for multifamily. Handles tours, renewals, maintenance via chat + voice + SMS|
|2|**Respage**|85|Apartment leasing chatbot since 2017. Just rebuilt on LLMs. Converts prospects → tours|
|3|**Nurture Boss**|83|24/7 apartment chatbot. Lead capture + tour booking via natural conversation|
|4|**RentGPT (Swiftlane)**|82|Multifamily conversational AI. Understands NL, books tours, syncs with CRM|
|5|**Roof AI**|80|Chat widget for real estate agent websites. Qualifies buyers + renters|
|6|**MRI Software Chat**|78|Enterprise leasing chatbot. Plugs into existing PMS/CRM stacks|
|7|**Leasey.AI**|77|Specifically pitches **rental scam protection** + 24/7 auto-response for listings|
|8|**Syntalith**|75|5-second responses across WhatsApp/Messenger/IG/Website. 2–4 week deploy|
|9|**Lofty (Chime)**|74|AI Sales Assistant — qualifies + nurtures leads long-term|
|10|**Crescendo.ai**|72|Real-estate-oriented AI chat+voice+email. Claims 99.8% accuracy, 50+ languages|

### Detailed cards

**1. EliseAI — [https://eliseai.com](https://eliseai.com/)** — Score: **92/100**

- **Features:** Multi-channel (email/SMS/chat/voice), tour scheduling, renewal automation, maintenance request triage, CRM integrations
- **Use case:** Greystar and other large property managers use EliseAI to respond to thousands of rental inquiries autonomously
- **Steal for mdeai:** Multi-channel orchestration, tour-scheduling conversation flow
- **Gap for you:** Enterprise-priced, US-focused, single-landlord model (not aggregator)

**2. Respage — [https://respage.com/our-solutions/chatbot/](https://respage.com/our-solutions/chatbot/)** — Score: **85/100**

- **Features:** Natural-language leasing bot, WhatsApp integration, tour booking, rebuilt 2024 on LLM
- **Use case:** Mid-size property managers use it to handle after-hours inquiries
- **Steal:** Their tour-booking dialogue tree — proven for 7 years

**3. Nurture Boss — [https://nurtureboss.io/apartment-chatbot/](https://nurtureboss.io/apartment-chatbot/)** — Score: **83/100**

- **Features:** Always-on conversational AI, lead scoring, appointment booking
- **Use case:** Property manager pastes chatbot on site → captures 3× more leads overnight
- **Steal:** Lead-qualification question sequence

**4. RentGPT (Swiftlane) — [https://www.swiftlane.com](https://www.swiftlane.com/)** — Score: **82/100**

- **Features:** LLM chatbot, NL understanding, property info Q&A, tour booking
- **Use case:** Mentioned across multifamily publications as a reference implementation
- **Steal:** Intent classification patterns for rental inquiries

**5. Roof AI — [https://roof-ai.com](https://roof-ai.com/)** — Score: **80/100**

- **Features:** Website chat widget, conversational property Q&A, CRM handoff
- **Use case:** Agent sites that need a 24/7 response layer without human staff

**6. MRI Software Chat — [https://www.mrisoftware.com/products/chat/](https://www.mrisoftware.com/products/chat/)** — Score: **78/100**

- **Features:** Enterprise PMS integrations, multilingual, compliance-ready
- **Use case:** Large property management firms with legacy systems
- **Steal:** Compliance patterns (fair housing, anti-discrimination)

**7. Leasey.AI — [https://www.leasey.ai/ai-chatbot/](https://www.leasey.ai/ai-chatbot/)** — Score: **77/100**

- **Features:** **Rental scam detection**, AI pre-screening of leads, 24/7 response
- **Use case:** Landlords posting on Facebook Marketplace get scam-filtering layer
- **Steal:** **This is the most directly relevant to your mdeai scam-filter wedge** — study their scam signals

**8. Syntalith — [https://syntalith.ai/en/blog/ai-chatbot-property-management-rental-2026](https://syntalith.ai/en/blog/ai-chatbot-property-management-rental-2026)** — Score: **75/100**

- **Features:** WhatsApp + Messenger + IG + web, 5s response, sub-4-week deploy
- **Use case:** Property managers in Europe, LATAM
- **Steal:** WhatsApp-first conversation flow (very mdeai-relevant)

**9. Lofty (formerly Chime) — [https://lofty.com](https://lofty.com/)** — Score: **74/100**

- **Features:** AI sales assistant, nurture campaigns, appointment setting
- **Use case:** Agent teams running inbound lead funnels

**10. Crescendo.ai — [https://www.crescendo.ai/blog/best-real-estate-chatbots-with-ai](https://www.crescendo.ai/blog/best-real-estate-chatbots-with-ai)** — Score: **72/100**

- **Features:** Chat + voice + email + SMS, 50+ languages, claims 99.8% accuracy
- **Use case:** Multi-location brokerages

---

## 💻 Top 10 GitHub Repos

|#|Repo|Score|What to take|
|---|---|---|---|
|1|**zillow/compliant-real-estate-chatbot**|94|Fair-housing compliance patterns — this is a research paper with code|
|2|**AleksNeStu/ai-real-estate-assistant**|91|RAG + LLM property search — full stack blueprint|
|3|**brightdata/real-estate-ai-agent**|84|Multi-source scraping with anti-bot bypass|
|4|**Shubhamsaboo/awesome-llm-apps**|82|100+ AI agent reference implementations including real estate|
|5|**KimathiNewton/realestate-chat-assistant**|80|pgvector + semantic recommendation based on user prefs|
|6|**GRKdev/Real-State-AI**|75|GPT-4o-mini system-prompt search engine (Andorra market)|
|7|**Shopify/shop-chat-agent**|74|MCP client + SSE streaming + tool routing pattern (commerce, but applicable)|
|8|**heyayushhere/Real-Estate-Chatbot**|62|Small GPT-3.5 investment Q&A bot|
|9|**paperclipai/paperclip**|60|Orchestration framework (useful later, not now)|
|10|**Urz1/Real-Estate-Contract-Auditor**|58|Lease clause risk scoring — Phase 2 for mdeai|

### Detailed cards

**1. zillow/compliant-real-estate-chatbot — [https://github.com/zillow/compliant-real-estate-chatbot](https://github.com/zillow/compliant-real-estate-chatbot)** — Score: **94/100**

- **What it is:** Published Zillow research paper + code. Fine-tunes Llama3-8B to avoid discriminatory answers in rental contexts
- **Features:** Fair-housing-law-compliant response generation, bias mitigation, evaluation harness
- **Real-world:** Zillow uses derivatives of this internally for their chat
- **Steal for mdeai:** Their system prompts + eval questions — this is **the only repo addressing legal risk for AI rental advice** (critical for Colombia's habeas data law too)

**2. AleksNeStu/ai-real-estate-assistant — [https://github.com/AleksNeStu/ai-real-estate-assistant](https://github.com/AleksNeStu/ai-real-estate-assistant)** — Score: **91/100**

- **What it is:** Advanced RAG + LLM real estate assistant, Python, FastAPI + Next.js
- **Features:** Market analysis, property valuation, intelligent semantic search, user preference learning
- **Real-world:** Individual developer's portfolio project, but production-grade architecture
- **Steal:** The full RAG pipeline pattern. Closest match to what you're building

**3. brightdata/real-estate-ai-agent — [https://github.com/brightdata/real-estate-ai-agent](https://github.com/brightdata/real-estate-ai-agent)** — Score: **84/100**

- **What it is:** Python + CrewAI + Bright Data MCP for scraping real estate sites
- **Features:** Multi-agent extraction, proxy rotation, CAPTCHA bypass, Nebius Qwen LLM
- **Real-world:** Tutorial for Bright Data customers; replicated by agencies
- **Steal:** The Zod schemas for normalizing listings. **Skip the framework — just use Firecrawl instead** (see previous recommendation)

**4. Shubhamsaboo/awesome-llm-apps — [https://github.com/Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps)** — Score: **82/100**

- **What it is:** 100+ runnable LLM agent apps including real estate and RAG chat examples
- **Features:** Copy-pasteable reference implementations across agent frameworks
- **Steal:** Faster to learn patterns from here than from a framework doc. Check their "real estate" and "RAG" folders

**5. KimathiNewton/realestate-chat-assistant — [https://github.com/KimathiNewton/realestate-chat-assistant](https://github.com/KimathiNewton/realestate-chat-assistant)** — Score: **80/100**

- **What it is:** LLM chatbot that recommends homes by user preferences
- **Features:** Semantic search + vector DB + context-aware recommendations
- **Real-world:** Personal project; architecture transferable to mdeai
- **Steal:** Preference-extraction prompt patterns

**6. GRKdev/Real-State-AI — [https://github.com/GRKdev/Real-State-AI](https://github.com/GRKdev/Real-State-AI)** — Score: **75/100**

- **What it is:** GPT-4o-mini with crafted system prompts for Andorran property market
- **Features:** Single-market search, prompt-engineered precision
- **Real-world:** Live search engine for Andorra — similar to your Medellín focus
- **Steal:** Their system prompt crafting approach for a specific city. **Highly relevant template** for mdeai

**7. Shopify/shop-chat-agent — [https://github.com/Shopify/shop-chat-agent](https://github.com/Shopify/shop-chat-agent)** — Score: **74/100**

- **What it is:** Shopify's reference MCP-based chat agent
- **Features:** MCP client, SSE streaming, tool routing, prompt versioning
- **Real-world:** Production Shopify shopping assistant
- **Steal:** MCP + SSE pattern (you already do SSE — check their tool-routing)

**8. heyayushhere/Real-Estate-Chatbot — [https://github.com/heyayushhere/Real-Estate-Chatbot](https://github.com/heyayushhere/Real-Estate-Chatbot)** — Score: **62/100**

- **What it is:** Simple GPT-3.5 real estate investment Q&A bot
- **Use case:** Teaching example only, limited depth

**9. paperclipai/paperclip — [https://github.com/paperclipai/paperclip](https://github.com/paperclipai/paperclip)** — Score: **60/100**

- **What it is:** Multi-agent orchestration framework (57k stars, MIT)
- **Use case:** Month 4+ when you have multiple agents. Not now.

**10. Urz1/Real-Estate-Contract-Auditor — [https://github.com/Urz1/Real-Estate-Contract-Auditor](https://github.com/Urz1/Real-Estate-Contract-Auditor)** — Score: **58/100**

- **What it is:** AI-powered lease clause analyzer with risk scoring
- **Use case:** Phase 2 for mdeai — bilingual lease review is in your PRD

---

## What to actually steal (ranked by ROI for mdeai)

|Source|What|Why|
|---|---|---|
|🔥 **Leasey.AI**|Scam detection approach|Direct match to your Facebook-rentals moat|
|🔥 **GRKdev/Real-State-AI**|Single-city system prompts|Template for Medellín-specific prompt|
|🔥 **zillow/compliant-real-estate-chatbot**|Fair-housing guardrails|Legal safety when you scale|
|⭐ **AleksNeStu/ai-real-estate-assistant**|RAG architecture|Closest full-stack blueprint|
|⭐ **Syntalith**|WhatsApp-first UX|Your future primary channel|
|⭐ **EliseAI**|Multi-channel orchestration|When you add voice + SMS|
|⭐ **Shop-chat-agent**|MCP + tool routing|You've already got SSE — level up with MCP|
|⚠️ **Nurture Boss / Respage**|Lead qualification sequences|Copy their question flow|
|⚠️ **Brightdata repo**|Zod normalization schemas|Cherry-pick schemas, skip framework|

---

## The real lesson from this list

Every successful player has **ONE channel + ONE customer type**:

- EliseAI → email/SMS → large property managers
- Respage → web chat → apartment leasing teams
- Leasey.AI → scam-detection → landlords on Facebook
- Syntalith → WhatsApp → LATAM/EU property managers

**None try to be a consumer meta-search.** That's a moat — if you focus on renters + WhatsApp + scam-filtering + Medellín, you have no direct competitor in the top 10.

Your wedge is: **"The only chatbot that aggregates Airbnb + FazWaz + Facebook into one search with scam-filtering, in Spanish and English, via WhatsApp, for Medellín."** No one above does that.

**Sources:**

- [EliseAI](https://eliseai.com/)
- [AI Chatbot for Property Management — Syntalith](https://syntalith.ai/en/blog/ai-chatbot-property-management-rental-2026)
- [Respage Apartment Chatbot](https://respage.com/our-solutions/chatbot/)
- [Smarter Rentals — Tripalink](https://tripalink.com/blog/smarter-rentals-ai-tools-for-apartment-searches)
- [MRI Software Leasing Chatbot](https://www.mrisoftware.com/products/chat/)
- [Nurture Boss Apartment Chatbot](https://nurtureboss.io/apartment-chatbot/)
- [Multifamily AI — Ascendix](https://ascendixtech.com/multifamily-ai-chatbot/)
- [Leasey.AI Chatbot](https://www.leasey.ai/ai-chatbot/)
- [7 Best Real Estate Chatbots with AI — Crescendo](https://www.crescendo.ai/blog/best-real-estate-chatbots-with-ai)
- [Conversational AI for Real Estate — Crescendo](https://www.crescendo.ai/blog/conversational-ai-for-real-estate)
- [AleksNeStu/ai-real-estate-assistant — GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant)
- [brightdata/real-estate-ai-agent — GitHub](https://github.com/brightdata/real-estate-ai-agent)
- [zillow/compliant-real-estate-chatbot — GitHub](https://github.com/zillow/compliant-real-estate-chatbot)
- [Shubhamsaboo/awesome-llm-apps — GitHub](https://github.com/Shubhamsaboo/awesome-llm-apps)
- [KimathiNewton/realestate-chat-assistant — GitHub](https://github.com/KimathiNewton/realestate-chat-assistant)
- [GRKdev/Real-State-AI — GitHub](https://github.com/GRKdev/Real-State-AI)
- [heyayushhere/Real-Estate-Chatbot — GitHub](https://github.com/heyayushhere/Real-Estate-Chatbot)
- [paperclipai/paperclip — GitHub](https://github.com/paperclipai/paperclip)
- [real-estate topic — GitHub](https://github.com/topics/real-estate?l=python)