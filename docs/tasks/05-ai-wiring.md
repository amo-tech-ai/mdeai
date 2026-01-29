# ILM — AI Wiring (ai-search, ai-trip-planner): Generate Prompts

**Document:** Implementation prompts for wiring ai-search and ai-trip-planner to Explore, Concierge, and TripNew/TripWizard. No code in prompts.  
**Reference:** `tasks/plan/0-progress-tracker.md` (4.4–4.12, 7.3, 10.2) · `tasks/plan/00-generate-prompts-template.md`  
**Last Updated:** 2026-01-28  

---

## Summary Table

| Dimension | Items |
|-----------|--------|
| **Screens** | Explore, Concierge, FloatingChatWidget, TripNew, TripWizard. |
| **Features** | Multi-domain search from Explore and Concierge; AI-generated trip draft from TripWizard. |
| **Agents** | ai-search, ai-trip-planner, ai-orchestrator, ai-chat. |
| **Use cases** | User searches “restaurants in Poblado tonight” from Explore or Concierge and sees unified results; user starts a new trip and gets an AI-generated itinerary draft. |
| **Real-world examples** | User types in Explore search bar → ai-search returns events plus restaurants plus rentals → results shown in tabs; user clicks “Plan with AI” in TripWizard → ai-trip-planner returns day-by-day draft → user reviews and applies. |

---

## Description

Wire the existing ai-search edge function to the Explore page and Concierge (or chat) so natural-language and filter-based search returns multi-domain results (events, restaurants, rentals). Wire the ai-trip-planner edge function to TripNew or TripWizard so the user can request an AI-generated itinerary draft (preview only; apply via Preview–Apply–Undo). Out of scope: changing edge function logic in this doc; only wiring and UI integration.

---

## Rationale

ai-search and ai-trip-planner exist but are not invoked from the main UI. Wiring them increases discovery and reduces friction for trip creation. Explore and Concierge are the right entry points for search; TripWizard is the right entry point for “Plan with AI.”

---

## User Stories

| Story | Purpose | Goal | Outcome |
|-------|---------|------|---------|
| **Search from Explore** | So users can search in natural language from one place | User enters a query in Explore (or Concierge) and sees events, restaurants, and rentals | ai-search is invoked; results shown in tabs or unified list. |
| **Search from Concierge** | So chat can answer “find me X” with real results | User asks “find me a restaurant in Poblado tonight” in Concierge | ai-search is called; results returned in chat and optionally in tabs. |
| **Plan with AI in wizard** | So users get a draft itinerary without building from scratch | User starts a new trip and clicks “Plan with AI” or similar | ai-trip-planner is invoked; draft itinerary shown as preview; user can apply or edit. |

---

## Acceptance Criteria

- Explore page (or global search) has a way to trigger ai-search (e.g. search input or “Search with AI”); results are displayed by domain (events, restaurants, rentals) where applicable.
- Concierge (or chat) invokes ai-search when the user intent is search-like; results are shown in chat and optionally in domain tabs.
- TripNew or TripWizard has an entry point (e.g. “Plan with AI”) that calls ai-trip-planner; the draft is shown as preview only; apply follows Preview–Apply–Undo if applicable.
- No code in this doc.

---

## Key Points

- ai-search returns multi-domain results; UI should map them to existing event, restaurant, rental types and display in existing list or card components.
- ai-trip-planner returns a structured draft (e.g. days and items); show in preview surface; do not write to trip_items until user applies.
- Use existing auth and Supabase client; pass user context (e.g. trip id, destination, dates) to ai-trip-planner when available.

---

## Three-Panel Layout (Core Model)

| Panel | Role | Content |
|-------|------|---------|
| **Left = Context** | Nav, filters, trip list | Explore filters; Concierge conversation list; TripWizard steps. |
| **Main = Work** | Search results, chat messages, itinerary | Explore: results list or map; Concierge: chat and result tabs; TripWizard: draft itinerary preview. |
| **Right = Intelligence** | Suggestions, refine query | Optional: related suggestions or “Plan with AI” CTA. |

---

## Frontend / Backend Wiring Plan

| Layer | Responsibility |
|-------|-----------------|
| **Frontend** | Explore: call ai-search when user submits search; render results in existing grid/tabs. Concierge: when intent is search, call ai-search; show results in chat and tabs. TripWizard: add “Plan with AI”; call ai-trip-planner; show draft in preview. |
| **Backend** | ai-search and ai-trip-planner already exist; ensure they are invokable with correct payload (query, filters, trip context). |
| **Wiring** | UI sends request to edge function (auth header, body); edge function returns results or draft; UI maps response to state and renders. |

---

## Supabase Schema

| Area | Relevance |
|------|------------|
| **Tables** | events, restaurants, rentals (or apartments, car_rentals) for ai-search results; trips, trip_items for ai-trip-planner draft (write only on apply). |
| **RLS** | Unchanged; search can read public listings; trip draft write only after user apply. |
| **Triggers / Realtime** | Not required for wiring. |

---

## Edge Functions

| Function | Role | When invoked |
|----------|------|--------------|
| ai-search | Multi-domain search (events, restaurants, rentals) by query and filters | From Explore search bar or Concierge when user asks for places. |
| ai-trip-planner | Generate itinerary draft (days, items) for destination and dates | From TripWizard “Plan with AI” or equivalent. |
| ai-orchestrator / ai-chat | Route user message to ai-search when intent is search | From Concierge when user says “find me…” |

---

## Dependencies

- ai-search and ai-trip-planner deployed and documented (payload and response shape).
- Explore and Concierge have a way to send query and display results.
- TripWizard or TripNew has a step or button for “Plan with AI.”
- Preview–Apply–Undo pattern for trip draft (see 07-preview-apply-undo-prompts.md) if we do not want auto-write.

---

## Gemini 3 / Claude SDK / AI Agents

| Item | Use |
|------|-----|
| **Gemini** | ai-search and ai-trip-planner may use Gemini for intent or generation; wiring is independent of model. |
| **Agents** | ai-orchestrator routes to ai-search; ai-trip-planner is the trip planning agent. |

---

## AI Agents, Automations, Wizards, Workflows

- **Wizards:** TripWizard gains “Plan with AI” step that calls ai-trip-planner and shows draft.
- **Workflows:** Discovery workflow includes “search from Explore” and “ask Concierge to find X” both backed by ai-search.

---

## Implementation Prompts (No Code)

Do not add code to this doc.

---

### AIW-P1 — Wire ai-search to Explore

**Description:** Invoke ai-search from Explore and display multi-domain results.

**Prompt:** For I Love Medellín, wire the existing ai-search edge function to the Explore page. When the user submits a search (e.g. via search input or “Search with AI”), call the ai-search function with the query and any filters (date, area, type). Map the response to events, restaurants, and rentals (or apartments and cars) and display results using existing list or card components. Use existing auth to pass the user token. Handle loading and error states. Do not paste code into tasks/plan/08-ai-wiring-prompts.md.

---

### AIW-P2 — Wire ai-search to Concierge

**Description:** When user asks for places in chat, invoke ai-search and show results.

**Prompt:** For I Love Medellín, when the user asks a search-like question in Concierge (e.g. “find me a restaurant in Poblado tonight”), invoke the ai-search edge function with the query derived from the message. Show the results in the chat (e.g. as cards or links) and optionally in the existing domain tabs (events, restaurants, rentals). Use ai-orchestrator or ai-chat to detect search intent and call ai-search. Do not paste code into tasks/plan/08-ai-wiring-prompts.md.

---

### AIW-P3 — Wire ai-trip-planner to TripWizard

**Description:** Add “Plan with AI” to TripWizard and show draft as preview.

**Prompt:** For I Love Medellín, add an entry point in TripNew or TripWizard (e.g. “Plan with AI” or “Generate itinerary”) that calls the ai-trip-planner edge function with destination and dates (and any other context). Show the returned draft itinerary in a preview area (e.g. day-by-day list). Do not write to trip_items automatically; let the user review and then apply using the Preview–Apply–Undo pattern if implemented, or add an explicit “Use this plan” step that writes to the trip. Do not paste code into tasks/plan/08-ai-wiring-prompts.md.
