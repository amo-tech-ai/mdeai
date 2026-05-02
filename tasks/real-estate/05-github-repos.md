I did a fresh web review of current GitHub repos and ranked the ones that look most useful for **mdeai** right now. A few are clearly stronger as **production patterns to adapt** than as plug-and-play products. I’m basing this on repo descriptions, architecture notes, recency, visible stack, and workflow depth from the repo pages I could inspect on the web. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))

## Ranked table

|Rank|Repo|URL|Best For|Key Features|Real-World Use Case|Score|
|---|---|---|---|---|---|---|
|1|AleksNeStu / ai-real-estate-assistant|[https://github.com/AleksNeStu/ai-real-estate-assistant](https://github.com/AleksNeStu/ai-real-estate-assistant)|Core mdeai AI property platform|RAG, market analysis, property valuation, intelligent search, FastAPI + Next.js|A renter asks for a 2-month furnished apartment in Laureles and gets ranked matches plus valuation context|91/100 ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))|
|2|azharsaleem18 / ai_real_estate|[https://github.com/azharsaleem18/ai_real_estate](https://github.com/azharsaleem18/ai_real_estate)|Full marketplace + PMS foundation|Buy/sell/rent marketplace, property management, CRM, predictive intelligence, multilingual experience|mdeai expands from rentals into landlord workflows, maintenance, tenant ops, and agency tools|89/100 ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))|
|3|hoangsonww / EstateWise-Chapel-Hill-Chatbot|[https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot](https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot)|Recommendation engine + AI search UX|Agentic AI, RAG, GraphRAG, LangGraph, conversation management, personalized recommendations|A user chats with mdeai and gets neighborhood-aware property suggestions plus conversational follow-up|87/100 ([GitHub](https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot "GitHub - hoangsonww/EstateWise-Chapel-Hill-Chatbot:  An AI real estate app featuring secure auth, conversation management, & personalized property recommendations. Powered by Agentic AI, RAG (w/ Pinecone), GraphRAG (w/ Neo4j), MCP, kNN, K‑Means Clustering, CoT, LangGraph, and a Mixture‑of‑Experts ensemble to deliver accurate, effective, and scalable AI insights. Also features a VS Code extension! · GitHub"))|
|4|ahacker-1 / cre-acquisition-orchestrator|[https://github.com/ahacker-1/cre-acquisition-orchestrator](https://github.com/ahacker-1/cre-acquisition-orchestrator)|Multi-agent deal workflow orchestration|31 agents, 5 deal phases, 8 knowledge skills, real-time dashboard|mdeai runs acquisition-style due diligence, underwriting, and investment review for premium properties|86/100 ([GitHub](https://github.com/topics/due-diligence "due-diligence · GitHub Topics · GitHub"))|
|5|brightdata / real-estate-ai-agent|[https://github.com/brightdata/real-estate-ai-agent](https://github.com/brightdata/real-estate-ai-agent)|Data extraction pipeline|AI agents, MCP, schema-validated JSON extraction from Zillow/Realtor/Redfin-style sources|mdeai ingests competitor listings and price signals into its own ranking engine|85/100 ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))|
|6|tysonthomas9 / realtor-agent|[https://github.com/tysonthomas9/realtor-agent](https://github.com/tysonthomas9/realtor-agent)|Agent-side analysis + contracts|Property analysis, comparables, contract document finalization help|An internal broker assistant prepares comps and transaction docs before sending offers|82/100 ([GitHub](https://github.com/tysonthomas9/realtor-agent "GitHub - tysonthomas9/realtor-agent: Realtor Agent: AI-powered tool for property analysis, running comparables, and assisting with contract document finalization in real estate transactions. · GitHub"))|
|7|Ibrahim-Isah / realty-central|[https://github.com/Ibrahim-Isah/realty-central](https://github.com/Ibrahim-Isah/realty-central)|CRM + lease workflow base|Document management, lease management, CRM, personalized recommendations, Next.js + Prisma|mdeai adds an internal back office for agent communications, lease expirations, and reminders|80/100 ([GitHub](https://github.com/Ibrahim-Isah/realty-central "GitHub - Ibrahim-Isah/realty-central: Realty Central is an all-in-one cloud-based platform designed to assist real estate agents and housing estates in managing their entire workflow efficiently. · GitHub"))|
|8|Kaos599 / PropertyLoop|[https://github.com/Kaos599/PropertyLoop](https://github.com/Kaos599/PropertyLoop)|Rental support / landlord-tenant assistant|Maintenance issue reporting, image analysis, tenancy-law guidance, contract interpretation, memory|A tenant reports mold or appliance damage and mdeai triages it with images and policy guidance|79/100 ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))|
|9|brightdata / ai-lead-generator|[https://github.com/brightdata/ai-lead-generator](https://github.com/brightdata/ai-lead-generator)|Lead capture / qualification|Scraping, AI lead qualification, outreach-ready results, Streamlit UI|mdeai qualifies inbound investor or landlord leads before routing them to concierge or ops|77/100 ([GitHub](https://github.com/brightdata/ai-lead-generator "GitHub - brightdata/ai-lead-generator: AI-powered agent that scrapes leads with Bright Data, qualifies them using OpenAI, and delivers outreach-ready results via an easy Streamlit UI. · GitHub"))|
|10|mariourquia / cre-skills-plugin|[https://github.com/mariourquia/cre-skills-plugin](https://github.com/mariourquia/cre-skills-plugin)|Deep commercial real estate skills|112 CRE skills across sourcing, underwriting, due diligence, leasing, operations|mdeai adds a premium investor mode for high-end commercial or mixed-use opportunities|76/100 ([GitHub](https://github.com/mariourquia/cre-skills-plugin "GitHub - mariourquia/cre-skills-plugin: 100+ institutional-grade CRE skills for Claude Code, Desktop, and Cowork. Deal screening, underwriting, structuring, capital markets, asset management, leasing, investor relations, development, disposition, and daily ops. 50+ expert agents, 12+ Python calculators, 10+ orchestrator pipelines, catalog-driven routing. · GitHub"))|

## Detailed review of the top 10

### 1) ai-real-estate-assistant

**What it does:** This is the strongest general-purpose AI real estate repo I found for **property search + valuation + market analysis**. It is built with Python, FastAPI, and Next.js, which is a practical modern split for mdeai. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))

**Best features:** RAG, intelligent search, valuation, and market analysis. Those are exactly the features you need for rentals and buy/sell discovery. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))

**Strengths:** Best balance of product relevance, AI depth, and stack quality. Good fit for your ILM-style search + reasoning layer. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))

**Weaknesses:** From the public page, I can confirm strong positioning but not full production maturity like deployment docs, ops controls, or enterprise workflow depth. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))

**Ideal role inside mdeai:** Use it as the **reference architecture for your search, recommendations, valuation, and AI assistant layer**.

---

### 2) ai_real_estate

**What it does:** This repo is broader than most. It describes an AI-driven marketplace for **buying, selling, renting**, plus a property management system with lease and tenant management, repairs, accounting, CRM, and market reporting. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))

**Best features:** Marketplace engine + PMS + CRM + predictive intelligence in one architecture. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))

**Strengths:** Best end-to-end business coverage. It matches mdeai’s longer-term vision better than a narrow chatbot repo. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))

**Weaknesses:** Because it tries to do a lot, it may be harder to extract a focused MVP from it. Also, broad repos sometimes overstate finished capability relative to actual implemented depth. That risk is real here. This is my inference, not something the repo explicitly states. Supported facts are that it covers marketplace, PMS, CRM, financials, and AI/ML features. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))

**Ideal role inside mdeai:** Use as the **north-star product map** for marketplace + landlord/agency operations.

---

### 3) EstateWise-Chapel-Hill-Chatbot

**What it does:** EstateWise is an AI real estate app with secure auth, conversation management, personalized property recommendations, RAG with Pinecone, GraphRAG with Neo4j, LangGraph, and a mixture-of-experts setup. Its architecture doc also says it uses a microservices-oriented design with distributed data stores and a web-grounding layer. ([GitHub](https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot "GitHub - hoangsonww/EstateWise-Chapel-Hill-Chatbot:  An AI real estate app featuring secure auth, conversation management, & personalized property recommendations. Powered by Agentic AI, RAG (w/ Pinecone), GraphRAG (w/ Neo4j), MCP, kNN, K‑Means Clustering, CoT, LangGraph, and a Mixture‑of‑Experts ensemble to deliver accurate, effective, and scalable AI insights. Also features a VS Code extension! · GitHub"))

**Best features:** Strong recommendation and conversational discovery architecture. This is very relevant for a concierge-style rental marketplace. ([GitHub](https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot "GitHub - hoangsonww/EstateWise-Chapel-Hill-Chatbot:  An AI real estate app featuring secure auth, conversation management, & personalized property recommendations. Powered by Agentic AI, RAG (w/ Pinecone), GraphRAG (w/ Neo4j), MCP, kNN, K‑Means Clustering, CoT, LangGraph, and a Mixture‑of‑Experts ensemble to deliver accurate, effective, and scalable AI insights. Also features a VS Code extension! · GitHub"))

**Strengths:** Most impressive AI architecture of the group for user-facing recommendations. Good inspiration for your chat + memory + GraphRAG layer. ([GitHub](https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot "GitHub - hoangsonww/EstateWise-Chapel-Hill-Chatbot:  An AI real estate app featuring secure auth, conversation management, & personalized property recommendations. Powered by Agentic AI, RAG (w/ Pinecone), GraphRAG (w/ Neo4j), MCP, kNN, K‑Means Clustering, CoT, LangGraph, and a Mixture‑of‑Experts ensemble to deliver accurate, effective, and scalable AI insights. Also features a VS Code extension! · GitHub"))

**Weaknesses:** Geographic focus is narrow, and some of the AI stack may be heavier than you need for an initial Medellín rental MVP. That is an integration judgment on my side. The confirmed facts are the stack and architecture complexity. ([GitHub](https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot "GitHub - hoangsonww/EstateWise-Chapel-Hill-Chatbot:  An AI real estate app featuring secure auth, conversation management, & personalized property recommendations. Powered by Agentic AI, RAG (w/ Pinecone), GraphRAG (w/ Neo4j), MCP, kNN, K‑Means Clustering, CoT, LangGraph, and a Mixture‑of‑Experts ensemble to deliver accurate, effective, and scalable AI insights. Also features a VS Code extension! · GitHub"))

**Ideal role inside mdeai:** Use for **personalized recommendations, chat architecture, GraphRAG patterns, and conversation memory**.

---

### 4) cre-acquisition-orchestrator

**What it does:** A multi-agent commercial real estate system with **31 agents, 5 deal phases, 8 domain knowledge skills, and a real-time dashboard**. ([GitHub](https://github.com/topics/due-diligence "due-diligence · GitHub Topics · GitHub"))

**Best features:** It is the best workflow orchestration repo in the list for serious real-estate process design. ([GitHub](https://github.com/topics/due-diligence "due-diligence · GitHub Topics · GitHub"))

**Strengths:** Great fit for underwriting, due diligence, investor workflows, and autonomous multi-step ops. ([GitHub](https://github.com/topics/due-diligence "due-diligence · GitHub Topics · GitHub"))

**Weaknesses:** It is commercial-real-estate-heavy, so it is not the cleanest match for a consumer rental marketplace. ([GitHub](https://github.com/topics/due-diligence "due-diligence · GitHub Topics · GitHub"))

**Ideal role inside mdeai:** Use it for **back-office orchestration**, premium property investment review, and **Paperclip/OpenClaw-style agent workflows** rather than consumer search.

---

### 5) brightdata / real-estate-ai-agent

**What it does:** A Python-based extraction system using AI agents and Bright Data MCP to produce structured JSON from multiple real estate sources. The repo explicitly mentions sites like Zillow, Realtor.com, and Redfin, Bright Data proxies, schema validation, CrewAI, and Python 3.9+. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))

**Best features:** Strong ingestion pipeline, anti-bot support, strict JSON output. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))

**Strengths:** Best repo for **data acquisition**, competitor monitoring, and price intelligence. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))

**Weaknesses:** It is not a marketplace or CRM by itself. It is a data pipeline component. It also depends on external Bright Data infrastructure and credentials. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))

**Ideal role inside mdeai:** Use for **listing ingestion, price monitoring, market snapshots, and supply intelligence**.

---

### 6) realtor-agent

**What it does:** It focuses on property analysis, comparables, and helping finalize contract documents in real estate transactions. ([GitHub](https://github.com/tysonthomas9/realtor-agent "GitHub - tysonthomas9/realtor-agent: Realtor Agent: AI-powered tool for property analysis, running comparables, and assisting with contract document finalization in real estate transactions. · GitHub"))

**Best features:** Comps + contract assistance is a valuable combination for agent workflows. ([GitHub](https://github.com/tysonthomas9/realtor-agent "GitHub - tysonthomas9/realtor-agent: Realtor Agent: AI-powered tool for property analysis, running comparables, and assisting with contract document finalization in real estate transactions. · GitHub"))

**Strengths:** Good narrow tool for agent-side decision support. ([GitHub](https://github.com/tysonthomas9/realtor-agent "GitHub - tysonthomas9/realtor-agent: Realtor Agent: AI-powered tool for property analysis, running comparables, and assisting with contract document finalization in real estate transactions. · GitHub"))

**Weaknesses:** It looks much smaller than the top-ranked repos and appears more like a focused assistant than a platform. ([GitHub](https://github.com/tysonthomas9/realtor-agent "GitHub - tysonthomas9/realtor-agent: Realtor Agent: AI-powered tool for property analysis, running comparables, and assisting with contract document finalization in real estate transactions. · GitHub"))

**Ideal role inside mdeai:** Use for **internal broker tools**, especially if you want a simple comp-and-contract helper.

---

### 7) realty-central

**What it does:** An all-in-one platform for agents and housing estates with document management, lease management, CRM, recommendations, reminders, and a modern Next.js/Prisma stack. ([GitHub](https://github.com/Ibrahim-Isah/realty-central "GitHub - Ibrahim-Isah/realty-central: Realty Central is an all-in-one cloud-based platform designed to assist real estate agents and housing estates in managing their entire workflow efficiently. · GitHub"))

**Best features:** Lease + CRM + doc management in one place. ([GitHub](https://github.com/Ibrahim-Isah/realty-central "GitHub - Ibrahim-Isah/realty-central: Realty Central is an all-in-one cloud-based platform designed to assist real estate agents and housing estates in managing their entire workflow efficiently. · GitHub"))

**Strengths:** Best practical inspiration for a **clean internal CRM/ops panel** in mdeai. ([GitHub](https://github.com/Ibrahim-Isah/realty-central "GitHub - Ibrahim-Isah/realty-central: Realty Central is an all-in-one cloud-based platform designed to assist real estate agents and housing estates in managing their entire workflow efficiently. · GitHub"))

**Weaknesses:** Lower visible traction and less AI sophistication than the top 5. ([GitHub](https://github.com/Ibrahim-Isah/realty-central "GitHub - Ibrahim-Isah/realty-central: Realty Central is an all-in-one cloud-based platform designed to assist real estate agents and housing estates in managing their entire workflow efficiently. · GitHub"))

**Ideal role inside mdeai:** Use for **ops dashboard patterns**, agent workspace, reminders, and document workflows.

---

### 8) PropertyLoop

**What it does:** A multi-agent property assistant focused on issue reporting, legal/regulatory guidance, contract interpretation, image analysis, and conversation memory. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))

**Best features:** Tenant support, maintenance triage, and lease understanding. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))

**Strengths:** Very useful for **post-booking rental support**, especially landlord-tenant communication and maintenance workflows. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))

**Weaknesses:** Less relevant to lead generation and listing marketplace growth. More of a support layer than a marketplace core. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))

**Ideal role inside mdeai:** Use after booking, not before booking.

---

### 9) brightdata / ai-lead-generator

**What it does:** An AI-powered lead generator that scrapes leads, qualifies them, and outputs outreach-ready results in Streamlit. ([GitHub](https://github.com/brightdata/ai-lead-generator "GitHub - brightdata/ai-lead-generator: AI-powered agent that scrapes leads with Bright Data, qualifies them using OpenAI, and delivers outreach-ready results via an easy Streamlit UI. · GitHub"))

**Best features:** Lead qualification and outreach readiness. ([GitHub](https://github.com/brightdata/ai-lead-generator "GitHub - brightdata/ai-lead-generator: AI-powered agent that scrapes leads with Bright Data, qualifies them using OpenAI, and delivers outreach-ready results via an easy Streamlit UI. · GitHub"))

**Strengths:** Strong fit for landlord acquisition, broker outreach, vendor sourcing, and investor lead triage. ([GitHub](https://github.com/brightdata/ai-lead-generator "GitHub - brightdata/ai-lead-generator: AI-powered agent that scrapes leads with Bright Data, qualifies them using OpenAI, and delivers outreach-ready results via an easy Streamlit UI. · GitHub"))

**Weaknesses:** Not real-estate-specific by design, so you’d need to adapt it to property workflows. ([GitHub](https://github.com/brightdata/ai-lead-generator "GitHub - brightdata/ai-lead-generator: AI-powered agent that scrapes leads with Bright Data, qualifies them using OpenAI, and delivers outreach-ready results via an easy Streamlit UI. · GitHub"))

**Ideal role inside mdeai:** Use for **supply-side growth** rather than the consumer side.

---

### 10) cre-skills-plugin

**What it does:** A Claude plugin with **112 institutional-grade commercial real estate skills** across sourcing, underwriting, due diligence, capital markets, leasing, asset management, disposition, and operations. ([GitHub](https://github.com/mariourquia/cre-skills-plugin "GitHub - mariourquia/cre-skills-plugin: 100+ institutional-grade CRE skills for Claude Code, Desktop, and Cowork. Deal screening, underwriting, structuring, capital markets, asset management, leasing, investor relations, development, disposition, and daily ops. 50+ expert agents, 12+ Python calculators, 10+ orchestrator pipelines, catalog-driven routing. · GitHub"))

**Best features:** Huge skill coverage for CRE workflows. ([GitHub](https://github.com/mariourquia/cre-skills-plugin "GitHub - mariourquia/cre-skills-plugin: 100+ institutional-grade CRE skills for Claude Code, Desktop, and Cowork. Deal screening, underwriting, structuring, capital markets, asset management, leasing, investor relations, development, disposition, and daily ops. 50+ expert agents, 12+ Python calculators, 10+ orchestrator pipelines, catalog-driven routing. · GitHub"))

**Strengths:** Excellent as a **knowledge and workflow library** if mdeai wants an investor or premium commercial expansion layer. ([GitHub](https://github.com/mariourquia/cre-skills-plugin "GitHub - mariourquia/cre-skills-plugin: 100+ institutional-grade CRE skills for Claude Code, Desktop, and Cowork. Deal screening, underwriting, structuring, capital markets, asset management, leasing, investor relations, development, disposition, and daily ops. 50+ expert agents, 12+ Python calculators, 10+ orchestrator pipelines, catalog-driven routing. · GitHub"))

**Weaknesses:** It is more skill/plugin oriented than marketplace oriented, and it is heavily CRE-focused. ([GitHub](https://github.com/mariourquia/cre-skills-plugin "GitHub - mariourquia/cre-skills-plugin: 100+ institutional-grade CRE skills for Claude Code, Desktop, and Cowork. Deal screening, underwriting, structuring, capital markets, asset management, leasing, investor relations, development, disposition, and daily ops. 50+ expert agents, 12+ Python calculators, 10+ orchestrator pipelines, catalog-driven routing. · GitHub"))

**Ideal role inside mdeai:** Use as **advanced analyst tooling**, not as your core consumer product.

## Final architecture recommendation for mdeai

### Best repos to adapt directly

Use these as your main building blocks:

- **ai-real-estate-assistant** for the **AI property discovery core**: search, valuation, market analysis, assistant UX. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))
    
- **ai_real_estate** for the **bigger marketplace + property-management blueprint**: rentals, buy/sell, CRM, maintenance, agency workflows. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))
    
- **EstateWise-Chapel-Hill-Chatbot** for **RAG, GraphRAG, recommendation architecture, and conversational property guidance**. ([GitHub](https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot "GitHub - hoangsonww/EstateWise-Chapel-Hill-Chatbot:  An AI real estate app featuring secure auth, conversation management, & personalized property recommendations. Powered by Agentic AI, RAG (w/ Pinecone), GraphRAG (w/ Neo4j), MCP, kNN, K‑Means Clustering, CoT, LangGraph, and a Mixture‑of‑Experts ensemble to deliver accurate, effective, and scalable AI insights. Also features a VS Code extension! · GitHub"))
    
- **brightdata/real-estate-ai-agent** for **listing ingestion and competitor/market data extraction**. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))
    

### Best repos to combine

Best combined architecture for mdeai:

1. **Frontend + customer workflow**
    
    - Base UX ideas from **ai-real-estate-assistant**
        
    - Recommendation / conversation patterns from **EstateWise** ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))
        
2. **Marketplace + ops**
    
    - Product scope and back-office patterns from **ai_real_estate**
        
    - CRM/lease/doc patterns from **realty-central** ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))
        
3. **Data intelligence**
    
    - Ingestion from **brightdata/real-estate-ai-agent**
        
    - Lead qualification from **brightdata/ai-lead-generator** ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))
        
4. **Advanced orchestration**
    
    - Deal or underwriting workflows from **cre-acquisition-orchestrator**
        
    - Specialist CRE logic from **cre-skills-plugin** if you add investor mode later. ([GitHub](https://github.com/topics/due-diligence "due-diligence · GitHub Topics · GitHub"))
        

### Best repos to learn from only

These are useful, but I would not make them core:

- **realtor-agent** — good narrow tool, not broad enough to anchor mdeai. ([GitHub](https://github.com/tysonthomas9/realtor-agent "GitHub - tysonthomas9/realtor-agent: Realtor Agent: AI-powered tool for property analysis, running comparables, and assisting with contract document finalization in real estate transactions. · GitHub"))
    
- **PropertyLoop** — strong post-booking support pattern, but not a full marketplace base. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))
    
- **realty-central** — helpful internal ops inspiration, but less AI-forward than the top layer. ([GitHub](https://github.com/Ibrahim-Isah/realty-central "GitHub - Ibrahim-Isah/realty-central: Realty Central is an all-in-one cloud-based platform designed to assist real estate agents and housing estates in managing their entire workflow efficiently. · GitHub"))
    

### Best repos to ignore for now

I would deprioritize repos that are too narrow, low-signal, or too geography-specific unless you have a direct use case:

- Argentina-only or local-market-only search assistants unless you need the extraction pattern.
    
- Tiny CRM demos with weak architecture signals.
    
- Generic multi-agent repos that merely include “real estate” as one domain without strong specialized workflows.
    

## Top 5 winners overall

1. **AleksNeStu / ai-real-estate-assistant** — best overall balance for mdeai. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))
    
2. **azharsaleem18 / ai_real_estate** — best broad marketplace + PMS vision. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))
    
3. **hoangsonww / EstateWise-Chapel-Hill-Chatbot** — best AI recommendation/chat architecture. ([GitHub](https://github.com/hoangsonww/EstateWise-Chapel-Hill-Chatbot "GitHub - hoangsonww/EstateWise-Chapel-Hill-Chatbot:  An AI real estate app featuring secure auth, conversation management, & personalized property recommendations. Powered by Agentic AI, RAG (w/ Pinecone), GraphRAG (w/ Neo4j), MCP, kNN, K‑Means Clustering, CoT, LangGraph, and a Mixture‑of‑Experts ensemble to deliver accurate, effective, and scalable AI insights. Also features a VS Code extension! · GitHub"))
    
4. **ahacker-1 / cre-acquisition-orchestrator** — best multi-agent workflow engine in real estate. ([GitHub](https://github.com/topics/due-diligence "due-diligence · GitHub Topics · GitHub"))
    
5. **brightdata / real-estate-ai-agent** — best data ingestion and market intelligence feed layer. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))
    

## Best by category

**Best for rentals:**  
**ai-real-estate-assistant** — strongest direct fit for rental search, AI recommendations, and market-aware discovery. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))

**Best for buy/sell:**  
**ai_real_estate** — explicitly covers buying, selling, and renting in one marketplace/PMS stack. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))

**Best for agents:**  
**realtor-agent** for focused agent-side work, or **realty-central** for broader agent operations. If choosing one, I’d pick **realty-central** for day-to-day internal workflow coverage. ([GitHub](https://github.com/tysonthomas9/realtor-agent "GitHub - tysonthomas9/realtor-agent: Realtor Agent: AI-powered tool for property analysis, running comparables, and assisting with contract document finalization in real estate transactions. · GitHub"))

**Best for CRM:**  
**realty-central** — CRM, lease management, reminders, and document handling are already central to the repo. ([GitHub](https://github.com/Ibrahim-Isah/realty-central "GitHub - Ibrahim-Isah/realty-central: Realty Central is an all-in-one cloud-based platform designed to assist real estate agents and housing estates in managing their entire workflow efficiently. · GitHub"))

**Best for market intelligence:**  
**brightdata / real-estate-ai-agent** — strongest current option for structured property data extraction and competitor monitoring. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))

**Best for contracts:**  
**realtor-agent** for transaction-doc finalization support, and **PropertyLoop** for lease interpretation and tenancy guidance. If you want one pick for mdeai rentals, choose **PropertyLoop** because rental contracts and tenant support are more central to your use case. ([GitHub](https://github.com/tysonthomas9/realtor-agent "GitHub - tysonthomas9/realtor-agent: Realtor Agent: AI-powered tool for property analysis, running comparables, and assisting with contract document finalization in real estate transactions. · GitHub"))

**Best for multi-agent orchestration:**  
**cre-acquisition-orchestrator** — the clearest real-estate-specific multi-agent workflow system in the set. ([GitHub](https://github.com/topics/due-diligence "due-diligence · GitHub Topics · GitHub"))

### Short summary

For **mdeai**, I would build around this stack:

- **Core product base:** ai-real-estate-assistant
    
- **Marketplace/business system:** ai_real_estate
    
- **Recommendation/chat intelligence:** EstateWise
    
- **Data pipeline:** brightdata real-estate-ai-agent
    
- **Ops orchestration:** cre-acquisition-orchestrator
    

That gives you a strong path for:

- rentals now
    
- buy/sell next
    
- agent workflows later
    
- autonomous real estate ops after that
    

I can convert this into a **mdeai-specific architecture map** showing exactly which repo powers each feature: rentals, CRM, lead gen, market intelligence, contract review, and agent workflows.