Here’s the strategic breakdown of all 3 repos and how they relate to your mdeai direction.

---

# 1. mastra-claw-workshop

[mastra-claw-workshop](https://github.com/smthomas/mastra-claw-workshop?utm_source=chatgpt.com)

# What It Is

A workshop/demo project combining:

- [Mastra AI](https://mastra.ai/?utm_source=chatgpt.com)
    
- Claude/OpenAI-style agents
    
- browser automation
    
- “Claw” execution patterns
    

The important idea:

> AI agents that can TAKE ACTIONS, not just chat.

---

# Core Features

## 1. Browser Automation

The AI can:

- open websites
    
- navigate pages
    
- click buttons
    
- fill forms
    
- extract information
    

### Real-world examples

```txt
AI books hotel
AI fills event forms
AI scrapes listings
AI checks prices
AI monitors competitors
```

---

# Why This Matters for mdeai

This is directly aligned with your:

- OpenClaw execution layer
    
- automation workflows
    
- scraping systems
    
- booking agents
    

Your architecture already separates:

- Hermes = brain
    
- OpenClaw = hands
    
- Paperclip = manager
    

This repo validates that direction strongly.

---

# 2. Action-Oriented Agents

Instead of:

```txt
"Here are apartments..."
```

The agent can:

```txt
Open Airbnb
Search Laureles
Filter WiFi
Compare prices
Save results
```

---

# Real-World Use Cases

## Rental Aggregation

```txt
Scraper Agent
 → Airbnb
 → Facebook Groups
 → Metrocuadrado
 → FazWaz
 → normalize data
```

Exactly matches your PRD scraping pipeline direction.

---

## Sponsor Research

```txt
Brand Research Agent
 → searches companies
 → extracts campaigns
 → generates outreach
```

---

## Venue Intelligence

```txt
Venue Agent
 → searches venue sites
 → extracts capacity
 → compares pricing
 → creates recommendations
```

---

# Strengths

## Strongest Value

Execution-oriented AI.

This is where AI becomes:

- operational
    
- autonomous
    
- workflow-driven
    

instead of “just chat.”

---

## Good for:

- scraping
    
- repetitive workflows
    
- research
    
- automation
    
- browser tasks
    

---

# Weaknesses

## Browser automation is fragile

Problems:

- CAPTCHA
    
- anti-bot systems
    
- UI changes
    
- login/session issues
    

This is why your PRDs correctly recommend:

1. official APIs first
    
2. Firecrawl second
    
3. Apify third
    
4. Playwright/browser automation last
    

That is exactly correct architecture.

---

# Best mdeai Uses

## Phase 3+

Use for:

- rental aggregation
    
- sponsor discovery
    
- event extraction
    
- lead enrichment
    
- competitive monitoring
    
- automated outreach
    

NOT for:

- core booking logic
    
- payments
    
- mission-critical workflows
    

---

# 2. mastra-claw

[mastra-claw](https://github.com/p-meier/mastra-claw?utm_source=chatgpt.com)

# What It Is

A more focused implementation of:

- Mastra orchestration
    
- claw/browser execution
    
- AI-controlled automation
    

Think:

> “AI workflow automation engine.”

---

# Main Features

## 1. Tool + Action Integration

The agent combines:

- reasoning
    
- tools
    
- browser execution
    
- workflows
    

Example:

```txt
AI decides:
"I need pricing."

→ opens website
→ extracts pricing
→ summarizes results
```

---

# 2. Autonomous Task Completion

Example:

```txt
Task:
"Find 10 coworking spaces in Medellín."

Agent:
→ searches Google
→ opens sites
→ extracts prices
→ builds structured table
```

---

# Real-World mdeai Examples

## AI Landlord Assistant

```txt
Agent:
→ checks listing quality
→ updates pricing
→ monitors competitors
→ posts to channels
```

---

## AI Event Operations

```txt
Agent:
→ checks ticket sales
→ compares trends
→ updates sponsor metrics
→ sends alerts
```

---

## AI Concierge

```txt
Agent:
→ finds restaurants
→ books reservations
→ generates itineraries
→ schedules tours
```

---

# Strategic Importance

This repo reinforces something important:

## Future AI products will need BOTH:

|Layer|Purpose|
|---|---|
|Reasoning layer|thinking|
|Execution layer|acting|

Your current architecture already reflects this correctly:

- Gemini/Hermes = reasoning
    
- OpenClaw = execution
    
- Paperclip = governance
    

---

# Weaknesses

## Automation cost

Browser execution:

- expensive
    
- slower
    
- operationally fragile
    

Needs:

- retries
    
- queues
    
- observability
    
- proxies
    
- monitoring
    

---

## Can overcomplicate MVPs

Danger:

```txt
building autonomous agents
before revenue/product-market-fit
```

Your roadmap correctly avoids this by prioritizing:

1. events revenue
    
2. rentals
    
3. ticketing
    
4. sponsors
    
5. advanced AI later
    

---

# 3. coworker

[coworker](https://github.com/Array-Ventures/coworker?utm_source=chatgpt.com)

# What It Is

This is the most strategically important repo of the 3.

Coworker is closer to:

- AI employee systems
    
- AI teammates
    
- persistent agents
    
- workflow automation OS
    

Think:

> “AI coworkers that continuously operate for a business.”

---

# Main Features

# 1. Persistent AI Workers

Agents continuously:

- monitor
    
- execute
    
- update
    
- follow up
    
- coordinate
    

Example:

```txt
Sales AI
 → checks leads
 → follows up
 → updates CRM
 → schedules meetings
```

---

# Real-World mdeai Uses

## Sponsor Operations AI

```txt
Sponsor Agent
 → monitors campaigns
 → checks ROI
 → generates reports
 → suggests improvements
 → follows up for renewals
```

---

## Rental Operations AI

```txt
Rental Ops Agent
 → checks stale listings
 → follows up with landlords
 → verifies pricing
 → updates trust scores
```

---

## Event Operations AI

```txt
Event Ops Agent
 → monitors ticket velocity
 → predicts sellouts
 → suggests pricing
 → alerts organizers
```

---

# 2. Long-Running Workflows

Not:

```txt
single chat response
```

Instead:

```txt
workflow lasting hours/days/weeks
```

Example:

```txt
Lead enters system
 → qualification
 → followups
 → reminders
 → booking
 → renewal
```

Very aligned with:

- Paperclip orchestration
    
- heartbeat systems
    
- operational workflows
    

---

# 3. AI Team Structures

This is extremely aligned with your architecture.

Example:

```txt
CEO Agent
 → delegates

Sales Agent
Marketing Agent
Research Agent
Support Agent
```

Very similar to your:

- Paperclip governance
    
- Hermes reasoning
    
- OpenClaw execution
    
- specialized systems
    

---

# Strategic Insight

Coworker validates the move from:

```txt
AI chatbots
```

to:

```txt
AI operational teams
```

That is EXACTLY where your system is heading.

---

# Comparison

|Repo|Core Focus|Best Use|
|---|---|---|
|mastra-claw-workshop|learning/demo|understanding AI execution|
|mastra-claw|browser automation workflows|operational AI tasks|
|coworker|persistent AI employees|business automation systems|

---

# Most Valuable Patterns

# From mastra-claw-workshop

Copy:

- tool execution
    
- browser automation patterns
    
- AI action loops
    

---

# From mastra-claw

Copy:

- autonomous workflows
    
- structured execution
    
- tool orchestration
    

---

# From coworker

Copy:

- persistent workers
    
- operational AI teams
    
- long-running workflows
    
- delegated AI systems
    

---

# Best mdeai Architecture Direction

Your PRDs are already heading toward the strongest architecture:

|Layer|Role|
|---|---|
|React/Vite|UI|
|Supabase|data/auth/realtime|
|Gemini|reasoning|
|Mastra|orchestration|
|Hermes|intelligence/memory|
|OpenClaw|execution|
|Paperclip|governance|
|Trigger.dev|long-running workflows|

---

# Best Practical Strategy

# Phase 1

Simple:

- chat
    
- bookings
    
- events
    
- ticketing
    
- sponsor flows
    

---

# Phase 2

Add:

- workflows
    
- memory
    
- AI routing
    
- automation
    

---

# Phase 3

Add:

- scraping
    
- autonomous workflows
    
- persistent workers
    
- operational AI teams
    

---

# Biggest Risk

The biggest failure point is:

```txt
building autonomous AI infrastructure
before validating revenue loops
```

Your roadmap correctly prioritizes:

- first revenue
    
- ticketing
    
- sponsor monetization
    
- rentals  
    before deep agent autonomy.
    

That is strategically correct.

---

# Final Verdict

## mastra-claw-workshop

Best for:

- learning AI execution patterns
    
- beginner automation architecture
    

---

## mastra-claw

Best for:

- operational browser automation
    
- workflow execution systems
    

---

## coworker

Most strategically valuable:

- AI operational teams
    
- persistent workflows
    
- business automation architecture
    

---

# Most Important Insight

These repos collectively prove:

## The future AI stack is:

```txt
Reasoning
+ Tools
+ Execution
+ Memory
+ Workflows
+ Governance
+ Persistent agents
```

NOT:

```txt
single chatbot wrappers
```

Which strongly validates the architecture direction already defined across your mdeai PRDs.