Both repos are good examples of how developers are combining [Mastra AI](https://mastra.ai/?utm_source=chatgpt.com) + [Google Gemini](https://ai.google.dev/?utm_source=chatgpt.com) to build AI booking assistants.

They are especially relevant to your mdeai direction because your platform is already:

- chat-first
    
- tool-based
    
- multi-agent oriented
    
- booking + concierge focused
    
- WhatsApp + event + rental driven
    

# 1. Repo: Sol Basic Hotel Booking Assistant

[Sol Basic Hotel Booking Assistant (Mastra + Gemini)](https://github.com/KishorNaik/Sol_Basic_Hotel_Booking_Assistant_Mastra_AI_Google_Gemini?utm_source=chatgpt.com)

## What it is

A lightweight hotel booking AI assistant using:

- Mastra agents
    
- Gemini models
    
- conversational booking flow
    
- tool calling
    
- structured hotel search
    

Think of it like:

> “ChatGPT for hotel reservations.”

---

# Main Features

## 1. Conversational booking

User says:

> “I need a hotel in Medellín for 3 nights under $120.”

Agent extracts:

- city
    
- dates
    
- budget
    
- guest count
    

### Real-world use case

Perfect for:

- travel assistants
    
- WhatsApp concierge bots
    
- booking intake systems
    

For mdeai:

- apartment search
    
- event ticket concierge
    
- venue finder
    
- landlord onboarding
    

---

## 2. Tool calling

The agent uses tools instead of hallucinating.

Example:

```ts
tools: {
 searchHotels,
 checkAvailability,
 createBooking
}
```

This matches your architecture direction extremely well because your PRDs already use:

- tool registries
    
- edge functions
    
- AI dispatching
    
- structured actions
    

### Real-world analogy

Like a hotel receptionist:

- checks inventory
    
- confirms dates
    
- processes reservation
    

instead of “guessing.”

---

## 3. Structured outputs

Gemini extracts structured booking data.

Example:

```json
{
 "city": "Medellin",
 "checkIn": "2026-05-20",
 "guests": 2
}
```

This is critical for:

- reliability
    
- automation
    
- workflows
    
- DB writes
    

Very important for mdeai because your entire system depends on:

- structured filters
    
- tool responses
    
- lead routing
    
- event creation
    

---

## 4. Mastra agent workflow

Uses Mastra as:

- orchestration layer
    
- tool execution layer
    
- conversation manager
    

Good beginner example of:

- agents
    
- tools
    
- memory flow
    
- execution chains
    

---

# What’s Good

## Strengths

### Beginner friendly

Easy to understand.

Good for learning:

- Mastra architecture
    
- Gemini tools
    
- agent loops
    

### Clean AI pattern

Shows:

1. user intent
    
2. extraction
    
3. tool call
    
4. response generation
    

Very production-aligned.

### Good Gemini integration

Uses Gemini for:

- extraction
    
- reasoning
    
- conversational flow
    

---

# Weaknesses

## Very MVP/basic

Missing:

- auth
    
- payments
    
- retries
    
- memory
    
- realtime
    
- vector search
    
- multi-agent orchestration
    
- approval gates
    
- analytics
    
- RLS/security
    

So:

> good architecture starter,  
> not enterprise-ready.

---

# Best mdeai Learnings

You should reuse this pattern for:

|mdeai feature|Similar pattern|
|---|---|
|Apartment booking|hotel booking|
|Event ticketing|reservation flow|
|Sponsor onboarding|structured intake|
|Venue booking|availability tools|
|WhatsApp concierge|conversational intake|
|Landlord onboarding|AI-guided forms|

---

# 2. Repo: mastra-hotel-booking-ai-agent

[mastra-hotel-booking-ai-agent](https://github.com/Calinemesef/mastra-hotel-booking-ai-agent?utm_source=chatgpt.com)

This repo is more:

- polished
    
- workflow-oriented
    
- “AI travel assistant” style
    

Less raw demo.  
More “assistant product.”

---

# Main Features

## 1. Multi-step booking workflow

Flow:

1. gather requirements
    
2. search hotels
    
3. compare options
    
4. confirm booking
    
5. finalize reservation
    

This aligns strongly with your:

- rentals flow
    
- event booking flow
    
- sponsor onboarding flow
    
- lead qualification flows
    

---

## 2. Agent memory/context

The assistant remembers:

- preferences
    
- previous answers
    
- booking state
    

Example:

> “Still want pet-friendly places?”

Important for:

- conversational UX
    
- long sessions
    
- WhatsApp agents
    

Very aligned with your:

- context chips
    
- saved conversations
    
- persistent filters
    

---

## 3. Better UX architecture

More “assistant platform” feeling.

Usually includes:

- better prompts
    
- cleaner orchestration
    
- state handling
    
- reusable flows
    

Closer to production thinking.

---

# Real-World Examples

## Example 1 — mdeai Rentals

User:

> “Need a 2BR in Laureles near coworking under $1400.”

Mastra agent flow:

```txt
extractFilters()
→ searchApartments()
→ rankResults()
→ searchNearbyRestaurants()
→ suggestEvents()
→ createLead()
```

Exactly matches your chat-central architecture vision.

---

## Example 2 — Event Concierge

User:

> “Find EDM events this weekend with VIP tickets.”

Agent:

```txt
searchEvents()
→ filterVIP()
→ comparePrices()
→ checkout()
```

---

## Example 3 — WhatsApp AI Agent

User on WhatsApp:

> “Need venue for fashion launch event.”

Agent:

```txt
extractRequirements()
→ searchVenues()
→ calculateCapacity()
→ generateProposal()
→ scheduleTour()
```

This becomes extremely powerful once combined with:

- OpenClaw
    
- Gemini tools
    
- Maps grounding
    
- Mastra workflows
    
- Supabase DB
    

---

# Architecture Comparison

|Capability|Sol Basic|mastra-hotel-agent|mdeai target|
|---|---|---|---|
|Conversational AI|✅|✅|✅|
|Tool calling|✅|✅|✅|
|Structured extraction|✅|✅|✅|
|Multi-step workflows|Basic|Better|Advanced|
|Persistent memory|Minimal|Better|Advanced|
|Multi-agent orchestration|❌|❌|✅|
|Realtime DB|❌|❌|✅|
|Vector search|❌|❌|✅|
|WhatsApp|❌|❌|✅|
|Maps grounding|❌|❌|✅|
|Sponsor/event systems|❌|❌|✅|
|Governance/budgets|❌|❌|✅|

---

# Most Important Strategic Insight

These repos confirm something important:

## Mastra is best used as:

- orchestration
    
- agent workflows
    
- tool execution
    
- conversation coordination
    

NOT:

- full backend replacement
    
- full DB layer
    
- auth layer
    
- business logic replacement
    

Your architecture direction is already correct:

|Layer|Best Tool|
|---|---|
|UI|React/Vite|
|DB/Auth|Supabase|
|AI orchestration|Mastra|
|Reasoning|Gemini|
|Automation|OpenClaw|
|Governance|Paperclip|
|Ranking/memory|Hermes|

Which matches your existing PRDs almost perfectly.

---

# Recommended mdeai Mastra Use Cases

## Phase 1

Use Mastra for:

- conversational workflows
    
- booking orchestration
    
- AI routing
    
- tool execution
    
- event creation assistants
    

---

## Phase 2

Add:

- memory
    
- workflow chains
    
- retries
    
- agent state
    
- evaluation/testing
    

---

## Phase 3

Add:

- multi-agent systems
    
- OpenClaw integration
    
- sponsor workflows
    
- landlord pipelines
    
- WhatsApp orchestration
    
- Hermes ranking tools
    

---

# Best Features to Copy Immediately

## From Sol Basic

Copy:

- structured extraction
    
- clean tool architecture
    
- simple booking flow
    

---

## From mastra-hotel-agent

Copy:

- workflow orchestration
    
- memory/state
    
- conversational continuity
    
- multi-step assistant UX
    

---

# Summary

## Sol Basic Hotel Assistant

Best for:

- learning Mastra
    
- understanding Gemini tool flow
    
- basic AI booking architecture
    

---

## mastra-hotel-booking-ai-agent

Best for:

- assistant UX patterns
    
- workflow orchestration
    
- conversational state management
    

---

# Best Direction for mdeai

Combine:

- Mastra workflows
    
- Gemini tools + grounding
    
- Supabase realtime
    
- Hermes ranking
    
- OpenClaw automation
    
- chat-first UI
    

to create:

> “AI operating system for Medellín rentals, events, contests, and sponsors.”

Which is already the direction defined in your PRDs.