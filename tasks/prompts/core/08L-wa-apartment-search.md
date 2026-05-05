---
id: E8-012
title: WhatsApp apartment search (ai-search bridge)
description: "Ships «WhatsApp apartment search (ai-search bridge)» for this epic—full scope in § Prompt below."
epic: E8
phase: CORE
priority: P0
effort: M
status: Open
percent_complete: 0
dependencies: [08A]
outcomes: [O5, O10]
---

# E8-012 — WhatsApp Apartment Search via ai-search Bridge

### Real world — purpose & outcomes

**In one sentence:** Someone texts “2BR Laureles under 3M COP” on WhatsApp and gets **real** top listings back from `ai-search`—not a static blurb—without waiting for OpenClaw.

- **Who it’s for:** Travelers searching from WhatsApp; you, proving AI search works outside the web app.
- **Purpose:** Thin bridge: Infobip → edge → `ai-search` → format reply → outbound message.
- **Goals:** Spanish/English friendly shortlist; errors as human-readable text; rate limits respected.
- **Features / deliverables:** Bridge function (or handler), Infobip outbound, formatting of top N results, depends on 08A + 04A + seed data.

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Traveler gets top apartment matches in WhatsApp via `ai-search` — no OpenClaw required. |
| **Workflow** | 08A → bridge fn → `ai-search` → format reply → Infobip outbound. |
| **Proof** | Query “2BR Laureles” returns 3 cards; error returns friendly text. |
| **Gates** | 04A wired; 03E on all edges; seed data for non-empty results. |
| **Rollout** | Staging WA number until copy + latency validated. |

---

## Context

Users in Medellin expect to find apartments via WhatsApp. Rather than waiting for OpenClaw AI routing (ADVANCED phase), this task wires WhatsApp messages directly to the existing `ai-search` edge function.

**Flow:**
```
User sends WA: "2BR Laureles under 3M"
  → Infobip webhook (08A) receives message
  → wa-apartment-search edge function
  → Calls ai-search edge function (already deployed, wired in 04A)
  → Formats top 3 results as WA text
  → Sends response via Infobip outbound API
```

No OpenClaw. No agent orchestration. Just a thin bridge function.

## Scope

### New edge function: `wa-apartment-search`

**Input:** Infobip webhook payload (from 08A dispatcher)
```typescript
{
  phone: string,        // sender phone number
  message: string,      // user's text message
  messageId: string,    // Infobip message ID
  timestamp: string     // ISO timestamp
}
```

**Logic:**
1. Extract search query from message text (pass raw text to ai-search)
2. Call `ai-search` edge function directly (edge-to-edge via `fetch`, using service role — the function exists and is deployed, even if 04A frontend wiring isn't done yet)
3. Format results as WhatsApp-friendly text:
   ```
   Found 3 apartments matching "2BR Laureles under 3M":

   1. Bright 2BR in Laureles - 2.8M COP/month
      Wifi: 100Mbps | Furnished | Min 3 months
      Photos: ${SITE_URL}/apartments/abc123  <!-- Use env var, not hardcoded domain -->

   2. Modern Studio near Primer Parque - 2.5M COP/month
      Wifi: 50Mbps | Unfurnished | Min 6 months
      Photos: ${SITE_URL}/apartments/def456  <!-- Use env var -->

   3. Cozy 2BR near UPB - 3.0M COP/month
      Wifi: 80Mbps | Furnished | Min 1 month
      Photos: ${SITE_URL}/apartments/ghi789  <!-- Use env var -->

   Reply with a number to schedule a tour, or describe what you're looking for.
   ```
4. Send response via Infobip outbound API
5. If user replies "1", "2", or "3" → trigger showing-create flow (link to 08C lead capture)
6. Log to `ai_runs` table with agent_name: "wa-apartment-search"

**Language handling:**
- Pass user message as-is to ai-search (Gemini handles Spanish/English)
- Format response in the same language as the user's message
- Simple heuristic: if message contains Spanish words → respond in Spanish

**Error handling:**
- No results → "No encontré apartamentos con esos criterios. Intenta con otro barrio o presupuesto."
- ai-search down → "Nuestro buscador está temporalmente fuera de servicio. Visita mdeai.co para buscar."
- Rate limit → "Demasiadas búsquedas. Espera un minuto e intenta de nuevo."

### Auth

- No user JWT (WhatsApp users are anonymous)
- Authenticate via Infobip webhook signature (from 08A)
- Use service role for ai-search call (internal edge-to-edge)
- Rate limit by phone number (5 searches/hour)

## Acceptance Criteria

- [ ] Edge function `wa-apartment-search` deployed
- [ ] Receives message from 08A webhook dispatcher
- [ ] Calls ai-search and formats top 3 results as WA text
- [ ] Sends response via Infobip outbound API
- [ ] Spanish message → Spanish response; English → English
- [ ] "1"/"2"/"3" reply triggers lead capture (08C)
- [ ] Rate limited by phone number (5/hour)
- [ ] Logs to ai_runs table
- [ ] Error responses are user-friendly (not stack traces)
- [ ] Works with E1 seed data in staging

## What This Is NOT

- NOT AI routing (no intent classification, no OpenClaw)
- NOT multi-turn conversation (single query → results → optional tour booking)
- NOT a chatbot (no conversation state beyond "last search results")
- OpenClaw-powered conversational search is E8v2 (ADVANCED phase)
