I searched for real-estate-focused GitHub repos with AI, CRM, workflow, recommendation, market intelligence, and contract-review value, then ranked them for **practical usefulness inside mdeai**. A clear pattern showed up: the strongest repos are not the flashy demo chatbots, but the ones that combine **real estate workflows + usable architecture + reusable backend patterns**. Repos like **RAG Command Center**, **AI Real Estate Assistant**, and **Liberu Real Estate** stand out because they cover more of the actual business loop: listings, leads, CRM, intelligence, and operations. ([GitHub](https://github.com/GareBear99/RG-Command-Center "GitHub - GareBear99/RAG-Command-Center: RAG Command Center — Real estate intelligence platform for the Canadian market. Local-first command center with deal scoring, GPS maps, CRM, pipeline, commission tracking, and multi-source data pipeline. R = Ricki · A = Amit · G = Gary · GitHub"))

## Ranked table

|Rank|Repo|URL|What it does|Best use inside mdeai|Score|
|---|---|---|---|---|--:|
|1|**GareBear99/RAG-Command-Center**|[https://github.com/GareBear99/RAG-Command-Center](https://github.com/GareBear99/RAG-Command-Center)|Full-stack real estate intelligence platform with public listings, internal CRM, lead pipeline, AI signal engine, and commission tracking|Best blueprint for **agent + broker ops + CRM + intelligence hub**|**91**|
|2|**AleksNeStu/ai-real-estate-assistant**|[https://github.com/AleksNeStu/ai-real-estate-assistant](https://github.com/AleksNeStu/ai-real-estate-assistant)|FastAPI + Next.js assistant for buyers/renters with intelligent search, valuation, and market analysis|Best blueprint for **consumer-facing AI property assistant**|**89**|
|3|**liberu-real-estate/real-estate-laravel**|[https://github.com/liberu-real-estate/real-estate-laravel](https://github.com/liberu-real-estate/real-estate-laravel)|Property agency platform handling properties, tenants, landlords, bookings, transactions, AI valuations, and smart-contract rentals|Best for **real operational real-estate backbone**|**87**|
|4|**azharsaleem18/ai_real_estate**|[https://github.com/azharsaleem18/ai_real_estate](https://github.com/azharsaleem18/ai_real_estate)|AI-driven marketplace + property management SaaS with pricing prediction and trend forecasting|Best for **buy/sell/rent marketplace + analytics**|**85**|
|5|**brightdata/real-estate-ai-agent**|[https://github.com/brightdata/real-estate-ai-agent](https://github.com/brightdata/real-estate-ai-agent)|AI agent system for extracting property data from Zillow/Realtor/Redfin into structured JSON|Best for **listing ingestion + enrichment layer**|**84**|
|6|**Urz1/Real-Estate-Contract-Auditor**|[https://github.com/Urz1/Real-Estate-Contract-Auditor](https://github.com/Urz1/Real-Estate-Contract-Auditor)|AI contract auditing with extraction, compliance checks, risk analysis, OCR, and reports|Best for **contract/document review**|**83**|
|7|**Kaos599/PropertyLoop**|[https://github.com/Kaos599/PropertyLoop](https://github.com/Kaos599/PropertyLoop)|Multi-agent assistant for landlords/property managers/tenants with legal guidance and image analysis|Best for **rental support + maintenance + tenancy help**|**80**|
|8|**yug-sinha/Multi-Agentic-Real-Estate-Chatbot**|[https://github.com/yug-sinha/Multi-Agentic-Real-Estate-Chatbot](https://github.com/yug-sinha/Multi-Agentic-Real-Estate-Chatbot)|FastAPI + Next.js multi-agent copilot with property image diagnosis, tenancy help, and RAG|Best for **specialized rental/inspection assistant flows**|**78**|
|9|**astoj/rexcrm-mcp-server**|[https://github.com/astoj/rexcrm-mcp-server](https://github.com/astoj/rexcrm-mcp-server)|MCP server for conversational access to Rex CRM: contacts, properties, leads, workflow automation|Best for **CRM connection layer**|**77**|
|10|**andreassigloch/propstack-mcp**|[https://github.com/andreassigloch/propstack-mcp](https://github.com/andreassigloch/propstack-mcp)|Read-only MCP server for PropStack CRM with privacy filtering and CRM data access|Best for **CRM data read layer / Germany-style broker workflows**|**75**|

My scoring favors repos that help you build a real business system, not just a demo chatbot. That means I weighted **workflow depth, production patterns, and reuse value** more than stars or hype.

---

## Detailed review of the top 10

### 1) RAG Command Center — best overall

**Why it ranks #1:** it already combines the pieces mdeai needs most: a public listing experience plus an internal command center with CRM, pipeline, AI signals, and commission tracking. That is much closer to a real proptech business operating system than a simple search chatbot. ([GitHub](https://github.com/GareBear99/RG-Command-Center "GitHub - GareBear99/RAG-Command-Center: RAG Command Center — Real estate intelligence platform for the Canadian market. Local-first command center with deal scoring, GPS maps, CRM, pipeline, commission tracking, and multi-source data pipeline. R = Ricki · A = Amit · G = Gary · GitHub"))

**Best features**

- Public listing site + internal command center in one platform. ([GitHub](https://github.com/GareBear99/RG-Command-Center "GitHub - GareBear99/RAG-Command-Center: RAG Command Center — Real estate intelligence platform for the Canadian market. Local-first command center with deal scoring, GPS maps, CRM, pipeline, commission tracking, and multi-source data pipeline. R = Ricki · A = Amit · G = Gary · GitHub"))
    
- CRM, lead pipeline, commission tracking. ([GitHub](https://github.com/GareBear99/RG-Command-Center "GitHub - GareBear99/RAG-Command-Center: RAG Command Center — Real estate intelligence platform for the Canadian market. Local-first command center with deal scoring, GPS maps, CRM, pipeline, commission tracking, and multi-source data pipeline. R = Ricki · A = Amit · G = Gary · GitHub"))
    
- AI-powered signal engine for real estate professionals. ([GitHub](https://github.com/GareBear99/RG-Command-Center "GitHub - GareBear99/RAG-Command-Center: RAG Command Center — Real estate intelligence platform for the Canadian market. Local-first command center with deal scoring, GPS maps, CRM, pipeline, commission tracking, and multi-source data pipeline. R = Ricki · A = Amit · G = Gary · GitHub"))
    

**Primary use case**  
Broker team or agency that needs one place to manage inbound property interest, internal sales workflow, and data-driven decision support.

**Real-world example**  
A Medellín broker gets leads from rentals and buy/sell pages, then uses one internal dashboard to track follow-up, prioritize promising leads, and monitor commissions.

**Strengths**  
Very strong workflow realism. Excellent for mdeai’s future “one chat + one ops center” model.

**Weaknesses**  
Appears market-specific and opinionated. You may reuse architecture more than code.

**Ideal role inside mdeai**  
Use it as the **north-star architecture** for your internal broker workspace.

---

### 2) AI Real Estate Assistant — best consumer AI assistant foundation

This repo is one of the cleanest direct fits for mdeai because it is explicitly an **AI-powered assistant for agencies**, built with **FastAPI + Next.js**, and covers **market analysis, property valuation, and intelligent search**. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant?utm_source=chatgpt.com "AleksNeStu/ai-real-estate-assistant"))

**Best features**

- Intelligent property search. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))
    
- Market analysis. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))
    
- Property valuation. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))
    

**Primary use case**  
Buyer/renter assistant that helps users discover properties and understand price/value.

**Real-world example**  
A user says, “Find me a furnished 2BR in Laureles under a budget, and tell me if it’s overpriced.” This repo’s feature direction matches that style well. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))

**Strengths**  
Modern stack, strong direct relevance, useful AI feature set.

**Weaknesses**  
Looks more assistant-centric than operations-centric; CRM depth is not its strongest angle.

**Ideal role inside mdeai**  
Use as the **front-end AI search and recommendation pattern**.

---

### 3) Liberu Real Estate Laravel — best operational real estate core

This is less “cool AI demo” and more “real-estate business engine.” It supports **properties, tenants, landlords, bookings, and transactions**, and also mentions **AI-powered valuations** and **smart-contract rental agreements**. ([GitHub](https://github.com/liberu-real-estate/real-estate-laravel "GitHub - liberu-real-estate/real-estate-laravel: Real Estate / Estate Agent, solution for your Property Agency. Application written in Laravel 12 / PHP 8.5 using Filament 5. Support for Rightmove, Zoopla, OnTheMarket · GitHub"))

**Best features**

- Tenant / landlord / booking / transaction handling. ([GitHub](https://github.com/liberu-real-estate/real-estate-laravel "GitHub - liberu-real-estate/real-estate-laravel: Real Estate / Estate Agent, solution for your Property Agency. Application written in Laravel 12 / PHP 8.5 using Filament 5. Support for Rightmove, Zoopla, OnTheMarket · GitHub"))
    
- AI valuations. ([GitHub](https://github.com/liberu-real-estate/real-estate-laravel "GitHub - liberu-real-estate/real-estate-laravel: Real Estate / Estate Agent, solution for your Property Agency. Application written in Laravel 12 / PHP 8.5 using Filament 5. Support for Rightmove, Zoopla, OnTheMarket · GitHub"))
    
- Smart-contract rental agreements. ([GitHub](https://github.com/liberu-real-estate/real-estate-laravel "GitHub - liberu-real-estate/real-estate-laravel: Real Estate / Estate Agent, solution for your Property Agency. Application written in Laravel 12 / PHP 8.5 using Filament 5. Support for Rightmove, Zoopla, OnTheMarket · GitHub"))
    

**Primary use case**  
Agency operations, rental lifecycle handling, and admin workflows.

**Real-world example**  
A property manager tracks landlords, bookings, and lease workflow from one backend rather than stitching together spreadsheets and WhatsApp.

**Strengths**  
Strong real-estate workflow depth. Very practical.

**Weaknesses**  
Laravel/PHP may not align with your preferred stack, so best used for patterns, schema ideas, and workflow modeling.

**Ideal role inside mdeai**  
Use for **business logic, workflow coverage, and admin feature planning**.

---

### 4) PropVision360 — best broad marketplace + analytics concept

This repo is ambitious: it combines **buying, selling, renting**, a **property management SaaS**, and **AI/ML for pricing prediction and trend forecasting**. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))

**Best features**

- Marketplace for buy/sell/rent. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))
    
- Property management SaaS. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))
    
- Pricing predictions and trend forecasting. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))
    

**Primary use case**  
Multi-sided platform where consumers search properties and agencies/landlords manage inventory.

**Real-world example**  
mdeai could use this pattern for a unified Medellín inventory platform that serves renters, buyers, sellers, and property managers from one data model.

**Strengths**  
Big scope, very aligned to mdeai’s long-term opportunity.

**Weaknesses**  
Often these broad repos are less mature in execution than in vision.

**Ideal role inside mdeai**  
Use for **feature map and domain model planning**.

---

### 5) Bright Data Real Estate AI Agent — best ingestion pipeline

This repo is excellent if you need to **collect listing data from multiple public sources**, normalize it, and feed it into your own product. It uses **AI agents**, **CrewAI**, and outputs **schema-validated JSON** from sites like **Zillow, Realtor.com, and Redfin**. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))

**Best features**

- Multi-source public property extraction. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))
    
- AI-based parsing with schema validation. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))
    
- Designed as a plug-and-play data pipeline. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))
    

**Primary use case**  
Data ingestion and normalization.

**Real-world example**  
If mdeai wants a “best available rentals” feed instead of hand-curated listings only, this is the kind of ingestion layer you study first.

**Strengths**  
Very reusable. Great for pipelines.

**Weaknesses**  
Not a full product; more of a data engine. Also depends on Bright Data + external APIs. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))

**Ideal role inside mdeai**  
Use as the **listing acquisition and enrichment layer**.

---

### 6) Real Estate Contract Auditor — best contracts/doc review

This is the strongest repo I found specifically for **real estate contracts**. It handles **field extraction, compliance checks, risk detection, PDF OCR, professional reports, and email drafts**. ([GitHub](https://github.com/Urz1/Real-Estate-Contract-Auditor "GitHub - Urz1/Real-Estate-Contract-Auditor · GitHub"))

**Best features**

- AI extraction from contracts. ([GitHub](https://github.com/Urz1/Real-Estate-Contract-Auditor "GitHub - Urz1/Real-Estate-Contract-Auditor · GitHub"))
    
- Compliance checking. ([GitHub](https://github.com/Urz1/Real-Estate-Contract-Auditor "GitHub - Urz1/Real-Estate-Contract-Auditor · GitHub"))
    
- Risk flags + professional reports + OCR. ([GitHub](https://github.com/Urz1/Real-Estate-Contract-Auditor "GitHub - Urz1/Real-Estate-Contract-Auditor · GitHub"))
    

**Primary use case**  
Reviewing rental agreements, purchase agreements, disclosures, and related PDFs.

**Real-world example**  
A user uploads a lease or sales contract and mdeai highlights missing clauses, risky deposit terms, or unusual obligations before they sign.

**Strengths**  
Direct business value. Easy feature monetization.

**Weaknesses**  
Narrower scope. It is a specialized subsystem, not the whole platform.

**Ideal role inside mdeai**  
Use as the **document intelligence module**.

---

### 7) PropertyLoop — best rental support and tenancy knowledge

PropertyLoop is a more specialized assistant for **landlords, property managers, and tenants**, with **tenancy law guidance**, **maintenance support**, and **smart image analysis**. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))

**Best features**

- Landlord/property manager/tenant support. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))
    
- Tenancy-law guidance. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))
    
- Smart image analysis for property issues. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))
    

**Primary use case**  
After-listing support: damage questions, legal FAQs, maintenance triage.

**Real-world example**  
A tenant uploads a photo of mold or a wall crack and asks whether it is cosmetic, urgent, or a landlord responsibility.

**Strengths**  
Very practical for rentals.

**Weaknesses**  
Less useful for buy/sell marketplace or brokerage CRM.

**Ideal role inside mdeai**  
Use for **post-match rental support workflows**.

---

### 8) Multi-Agentic Real Estate Copilot — best small multi-agent pattern

This repo uses **FastAPI + Next.js** and supports **image-based diagnosis**, **tenancy Q&A**, and **RAG-based contextual responses**. ([GitHub](https://github.com/yug-sinha/Multi-Agentic-Real-Estate-Chatbot "GitHub - yug-sinha/Multi-Agentic-Real-Estate-Chatbot: This multi-agent real estate chatbot uses AI to analyze property images and address user queries on damages and tenancy. Built with FastAPI and Next.js, the system leverages Google's GEMINI API for image-driven diagnostics, RAG, and context-rich, practical solutions to diverse property-related ississues and complexities worldwide. · GitHub"))

**Best features**

- Property damage image diagnosis. ([GitHub](https://github.com/yug-sinha/Multi-Agentic-Real-Estate-Chatbot "GitHub - yug-sinha/Multi-Agentic-Real-Estate-Chatbot: This multi-agent real estate chatbot uses AI to analyze property images and address user queries on damages and tenancy. Built with FastAPI and Next.js, the system leverages Google's GEMINI API for image-driven diagnostics, RAG, and context-rich, practical solutions to diverse property-related ississues and complexities worldwide. · GitHub"))
    
- Tenancy agent. ([GitHub](https://github.com/yug-sinha/Multi-Agentic-Real-Estate-Chatbot "GitHub - yug-sinha/Multi-Agentic-Real-Estate-Chatbot: This multi-agent real estate chatbot uses AI to analyze property images and address user queries on damages and tenancy. Built with FastAPI and Next.js, the system leverages Google's GEMINI API for image-driven diagnostics, RAG, and context-rich, practical solutions to diverse property-related ississues and complexities worldwide. · GitHub"))
    
- Multi-agent routing and RAG example. ([GitHub](https://github.com/yug-sinha/Multi-Agentic-Real-Estate-Chatbot "GitHub - yug-sinha/Multi-Agentic-Real-Estate-Chatbot: This multi-agent real estate chatbot uses AI to analyze property images and address user queries on damages and tenancy. Built with FastAPI and Next.js, the system leverages Google's GEMINI API for image-driven diagnostics, RAG, and context-rich, practical solutions to diverse property-related ississues and complexities worldwide. · GitHub"))
    

**Primary use case**  
Focused assistant for property issue triage and rental questions.

**Real-world example**  
A renter asks, “Is this crack serious?” and uploads an image; the backend routes to a property agent. Without image, it routes to tenancy help. ([GitHub](https://github.com/yug-sinha/Multi-Agentic-Real-Estate-Chatbot "GitHub - yug-sinha/Multi-Agentic-Real-Estate-Chatbot: This multi-agent real estate chatbot uses AI to analyze property images and address user queries on damages and tenancy. Built with FastAPI and Next.js, the system leverages Google's GEMINI API for image-driven diagnostics, RAG, and context-rich, practical solutions to diverse property-related ississues and complexities worldwide. · GitHub"))

**Strengths**  
Good for understanding small, understandable multi-agent design.

**Weaknesses**  
Feature depth is narrower than higher-ranked repos.

**Ideal role inside mdeai**  
Use as a **simple agent-routing reference**.

---

### 9) Rex CRM MCP Server — best CRM connection for agent workflows

This repo is not a full platform, but it is very useful if you want conversational AI to plug into a real estate CRM. It supports **search contacts, manage properties, track leads, and automate workflows** via Rex CRM. ([GitHub](https://github.com/astoj/rexcrm-mcp-server "GitHub - astoj/rexcrm-mcp-server: Rex CRM MCP Server · GitHub"))

**Best features**

- Conversational access to CRM entities. ([GitHub](https://github.com/astoj/rexcrm-mcp-server "GitHub - astoj/rexcrm-mcp-server: Rex CRM MCP Server · GitHub"))
    
- Lead tracking. ([GitHub](https://github.com/astoj/rexcrm-mcp-server "GitHub - astoj/rexcrm-mcp-server: Rex CRM MCP Server · GitHub"))
    
- Workflow automation. ([GitHub](https://github.com/astoj/rexcrm-mcp-server "GitHub - astoj/rexcrm-mcp-server: Rex CRM MCP Server · GitHub"))
    

**Primary use case**  
Connecting AI assistants to brokerage workflows.

**Real-world example**  
An agent asks, “Show all hot leads looking for 2BR rentals this week,” and the assistant queries CRM data instead of using a separate dashboard.

**Strengths**  
High integration value.

**Weaknesses**  
Depends on Rex CRM ecosystem.

**Ideal role inside mdeai**  
Use as the **pattern for CRM adapters**.

---

### 10) PropStack MCP — best lightweight CRM data bridge

PropStack MCP is a smart example of a **read-only CRM bridge** with privacy protections. It provides **PropStack real estate API integration**, rounds GPS precision, and filters broker contact data. It also has a visible recent update signal: **updated Mar 2, 2026** on GitHub topic/search results. ([GitHub](https://github.com/andreassigloch/propstack-mcp?utm_source=chatgpt.com "MCP Server for Propstack CRM access"))

**Best features**

- Real-estate CRM integration through MCP. ([GitHub](https://github.com/andreassigloch/propstack-mcp?utm_source=chatgpt.com "MCP Server for Propstack CRM access"))
    
- Privacy-aware response shaping. ([GitHub](https://github.com/andreassigloch/propstack-mcp?utm_source=chatgpt.com "MCP Server for Propstack CRM access"))
    
- Recent maintenance signal. ([GitHub](https://github.com/topics/real-estate-crm-integration?utm_source=chatgpt.com "real-estate-crm-integration"))
    

**Primary use case**  
Read-only broker intelligence and CRM lookup.

**Real-world example**  
An AI assistant checks contact history and listing data before suggesting who a broker should call first.

**Strengths**  
Very practical adapter pattern. Good for safe AI access to CRM data.

**Weaknesses**  
Read-only; not a full workflow engine. ([GitHub](https://github.com/andreassigloch/propstack-mcp?utm_source=chatgpt.com "MCP Server for Propstack CRM access"))

**Ideal role inside mdeai**  
Use as the **template for CRM connector design**.

---

## Final architecture recommendation for mdeai

### Best repos to adapt

Use **RAG Command Center** as the main product architecture reference because it already blends **public listings + CRM + lead pipeline + AI intelligence** in one system. Pair it with **AI Real Estate Assistant** for the buyer/renter conversational layer and **Bright Data Real Estate AI Agent** for ingestion and listing enrichment. Add **Real Estate Contract Auditor** as a specialized document-review service. ([GitHub](https://github.com/GareBear99/RG-Command-Center "GitHub - GareBear99/RAG-Command-Center: RAG Command Center — Real estate intelligence platform for the Canadian market. Local-first command center with deal scoring, GPS maps, CRM, pipeline, commission tracking, and multi-source data pipeline. R = Ricki · A = Amit · G = Gary · GitHub"))

### Best repos to combine

A strong mdeai stack would be:

- **RAG Command Center** for broker/backoffice structure. ([GitHub](https://github.com/GareBear99/RG-Command-Center "GitHub - GareBear99/RAG-Command-Center: RAG Command Center — Real estate intelligence platform for the Canadian market. Local-first command center with deal scoring, GPS maps, CRM, pipeline, commission tracking, and multi-source data pipeline. R = Ricki · A = Amit · G = Gary · GitHub"))
    
- **AI Real Estate Assistant** for AI search, valuation, and recommendation UX. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))
    
- **Bright Data Real Estate AI Agent** for ingestion pipelines. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))
    
- **Contract Auditor** for lease and purchase-document review. ([GitHub](https://github.com/Urz1/Real-Estate-Contract-Auditor "GitHub - Urz1/Real-Estate-Contract-Auditor · GitHub"))
    
- **Rex CRM MCP** or **PropStack MCP** as the design pattern for broker CRM adapters. ([GitHub](https://github.com/astoj/rexcrm-mcp-server "GitHub - astoj/rexcrm-mcp-server: Rex CRM MCP Server · GitHub"))
    

That gives you a clean 5-layer system:

1. **Ingestion**
    
2. **Canonical property database**
    
3. **Consumer AI assistant**
    
4. **Broker CRM / lead workflow layer**
    
5. **Document intelligence**
    

### Best repos to ignore

I would be careful about building directly on repos that are interesting but too narrow, too demo-oriented, or too ecosystem-specific:

- **PropertyLoop** and **Multi-Agentic Real Estate Copilot** are useful pattern libraries, but they are not strong enough to be your main platform foundation. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))
    
- **PropStack MCP** is useful as a connector idea, not as a core product base. ([GitHub](https://github.com/andreassigloch/propstack-mcp?utm_source=chatgpt.com "MCP Server for Propstack CRM access"))
    
- Commission-only automation repos like **Real-Estate-Revenue-Commission-Automation-Engine** are too narrow for the core platform, though they can inspire later agent workflows. ([GitHub](https://github.com/khaliqnoor/Real-Estate-Revenue-Commission-Automation-Engine "GitHub - khaliqnoor/Real-Estate-Revenue-Commission-Automation-Engine: AI-powered real estate commission automation workflow that tracks deals, calculates agent splits, prevents errors, and streamlines approvals and payouts in real time using n8n and webhook-based architecture. · GitHub"))
    

---

## Practical build strategy for mdeai

For **phase 1**, build a single AI concierge that covers rentals + buy/sell search, backed by a normalized listing model and saved lead profiles. Base the front-end interaction on **AI Real Estate Assistant** patterns and the backend ops model on **RAG Command Center**. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))

For **phase 2**, add ingestion and intelligence: use **Bright Data Real Estate AI Agent** ideas to gather listings and structure them consistently, then introduce ranking, market pricing hints, and recommendation logic. ([GitHub](https://github.com/brightdata/real-estate-ai-agent "GitHub - brightdata/real-estate-ai-agent: Intelligent Python system that extracts real estate property data as structured JSON using AI agents, Nebius Qwen LLM, and Bright Data MCP. · GitHub"))

For **phase 3**, add broker power features: CRM sync, showing scheduling, follow-up reminders, lead scoring, contract review, and automated document/risk checks using the contract-auditor pattern. ([GitHub](https://github.com/astoj/rexcrm-mcp-server "GitHub - astoj/rexcrm-mcp-server: Rex CRM MCP Server · GitHub"))

---

## Top 5 winners overall

1. **RAG Command Center**
    
2. **AI Real Estate Assistant**
    
3. **Liberu Real Estate Laravel**
    
4. **PropVision360**
    
5. **Bright Data Real Estate AI Agent**
    

## Best for rentals

**Liberu Real Estate Laravel** for workflow depth, with **PropertyLoop** as the best rental-support specialist. ([GitHub](https://github.com/liberu-real-estate/real-estate-laravel "GitHub - liberu-real-estate/real-estate-laravel: Real Estate / Estate Agent, solution for your Property Agency. Application written in Laravel 12 / PHP 8.5 using Filament 5. Support for Rightmove, Zoopla, OnTheMarket · GitHub"))

## Best for buy/sell

**PropVision360** for broad marketplace scope, with **AI Real Estate Assistant** for the AI discovery layer. ([GitHub](https://github.com/azharsaleem18/ai_real_estate "GitHub - azharsaleem18/ai_real_estate: Enterprise SaaS platform with embedded AI/ML/DL for predictive intelligence, automation & insight. · GitHub"))

## Best for agents

**RAG Command Center**. It is the closest to a real agent/broker operating system. ([GitHub](https://github.com/GareBear99/RG-Command-Center "GitHub - GareBear99/RAG-Command-Center: RAG Command Center — Real estate intelligence platform for the Canadian market. Local-first command center with deal scoring, GPS maps, CRM, pipeline, commission tracking, and multi-source data pipeline. R = Ricki · A = Amit · G = Gary · GitHub"))

## Best for CRM

**Rex CRM MCP Server** for workflow usefulness; **PropStack MCP** for lightweight connector design. ([GitHub](https://github.com/astoj/rexcrm-mcp-server "GitHub - astoj/rexcrm-mcp-server: Rex CRM MCP Server · GitHub"))

## Best for market intelligence

**AI Real Estate Assistant** and **PropVision360** because both explicitly emphasize valuation, market analysis, and forecasting. ([GitHub](https://github.com/AleksNeStu/ai-real-estate-assistant "GitHub - AleksNeStu/ai-real-estate-assistant: Advanced AI Real Estate Assistant using RAG, LLMs, and Python. Features market analysis, property valuation, and intelligent search. · GitHub"))

## Best for contracts

**Real Estate Contract Auditor** by a wide margin. ([GitHub](https://github.com/Urz1/Real-Estate-Contract-Auditor "GitHub - Urz1/Real-Estate-Contract-Auditor · GitHub"))

## Best for multi-agent orchestration

Among the real-estate repos, **PropertyLoop** and **Multi-Agentic Real Estate Copilot** are the clearest multi-agent examples. For a broader self-hosted orchestration layer outside real estate specialization, **Atom** is the strongest complement I found. ([GitHub](https://github.com/Kaos599/PropertyLoop "GitHub - Kaos599/PropertyLoop: PropertyLoop Real Estate Assistant: An AI-powered chatbot with multi-agent architecture that helps landlords, property managers, and tenants with property issues, tenancy law, and maintenance through smart image analysis and regional-specific guidance. · GitHub"))

If you want, I can turn this into a **mdeai implementation map** next: exact repo-by-repo feature extraction, what to copy, what to ignore, and how to combine them into one production architecture.

https://github.com/AleksNeStu/ai-real-estate-assistant

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