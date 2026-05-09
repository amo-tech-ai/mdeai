---
id: C07
title: Multilingual EN/ES + Follow-up Suggestions + Agent Personas
status: Not Started
priority: P1
effort: 2 days
revenue_impact: High — 60% more addressable market (Spanish-speaking Colombians)
depends_on: none (standalone)
skill:
  - gemini
  - frontend-design
  - chatbot-conversation-design
---

<!-- task-summary -->
> **What:** Multilingual EN/ES + Follow-up Suggestions + Agent Personas
> **Why:** Three quick wins that dramatically improve the chat UX:
> **Tools/Skills:** `gemini` · `frontend-design` · `chatbot-conversation-design`
> **P1 · Not Started · Effort: 2 days**
> **Depends on:** none (standalone)

# C07 — Multilingual EN/ES + Follow-up Suggestions + Agent Personas

## Problem

Three quick wins that dramatically improve the chat UX:

1. **Multilingual**: mdeai serves Medellín. Colombian landlords, sellers, and event organizers speak Spanish. The chat always responds in English, excluding 60%+ of the supply side of the marketplace.

2. **Follow-up suggestions**: After each AI response, users don't know what to ask next. Perplexity and ChatGPT both show 3 suggested follow-ups. Without them, sessions end prematurely.

3. **Agent personas**: Every response comes from the same generic AI. CHAT-CENTRAL-PLAN §3 specifies named agents (Mia the Rentals Concierge, Carlos the Events Scout, etc.) with themed responses and badges.

## What to Build

### Part A — Multilingual EN/ES

#### A1. Language detection in ai-chat

Detect the user's language from their message:
```typescript
function detectLanguage(message: string): 'es' | 'en' {
  // Spanish keywords and patterns
  const spanishPatterns = [
    /\b(quiero|busco|necesito|tengo|apartamento|arriendo|evento|cómo|qué|dónde|cuánto)\b/i,
    /[áéíóúüñ]/,
    /\b(el|la|los|las|un|una|en|de|por|con|que|para)\b/i
  ];
  const spanishScore = spanishPatterns.filter(p => p.test(message)).length;
  return spanishScore >= 2 ? 'es' : 'en';
}
```

Pass detected language to Gemini system prompt:
```
User is communicating in ${language === 'es' ? 'Spanish' : 'English'}.
Respond entirely in ${language === 'es' ? 'Spanish' : 'English'}.
```

For Spanish responses, use Colombian idioms and warm Medellín register ("parcero", "bacano", "chimba de apartamento" only if user uses informal register; default to formal/neutral Spanish).

#### A2. Language preference persistence

After detection, save to `user_preferences` (key: `language`).
Load on next session → respond in user's language without re-detecting.

#### A3. Bilingual quick actions on welcome screen

ChatWelcome.tsx — show quick actions in both languages or auto-detect from browser locale:
- "Find rentals in Laureles" / "Buscar apartamentos en Laureles"
- "What's happening this weekend?" / "¿Qué hay este fin de semana?"

#### A4. ChatInput placeholder bilingual

```tsx
placeholder={lang === 'es' 
  ? "Pregúntame sobre Medellín..." 
  : "Ask me anything about Medellín..."}
```

---

### Part B — Follow-up Suggestions

#### B1. Follow-up generation in ai-chat

After every response, generate 3 contextual follow-up suggestions using Gemini:
```typescript
// After main response generated
const followUpPrompt = `Based on this conversation context and the response just given, generate exactly 3 short follow-up questions the user might want to ask next. Return as JSON array of strings. Max 8 words each. Relevant to the current topic.`;

const followUps = await callGeminiStructured({
  prompt: followUpPrompt,
  responseJsonSchema: { type: "array", items: { type: "string" } },
  timeoutMs: 3000,
});
```

Emit as `mdeai_actions`:
```json
{
  "type": "FOLLOW_UP_SUGGESTIONS",
  "payload": {
    "suggestions": [
      "Schedule a showing for this apartment",
      "Find pet-friendly options nearby",
      "Compare top 3 listings side by side"
    ]
  }
}
```

#### B2. FollowUpChips component

File: `src/components/chat/FollowUpChips.tsx`

```tsx
interface FollowUpChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}
```

Renders 3 pill buttons below the last AI message:
```
[📅 Schedule a showing] [🐾 Pet-friendly options] [📊 Compare top 3]
```

Clicking a chip calls `sendMessage(suggestion)` → continues the conversation.

Show only after streaming completes. Clear when new message sent.

Wire in `ChatActionBar` or as a separate element below the message list.

#### B3. Handle FOLLOW_UP_SUGGESTIONS in useChat

```typescript
if (parsed.__mdeai_actions__?.[0]?.type === 'FOLLOW_UP_SUGGESTIONS') {
  setFollowUpSuggestions(parsed.__mdeai_actions__[0].payload.suggestions);
}
```

Add `followUpSuggestions` and `setFollowUpSuggestions` to `useChat` return.
Render `<FollowUpChips>` in ChatCanvas when `followUpSuggestions.length > 0`.

---

### Part C — Agent Personas

#### C1. Agent labels in system prompt per intent

Map intent → agent persona:
```typescript
const AGENT_PERSONAS: Record<string, { name: string; label: string; emoji: string; systemBlurb: string }> = {
  housing_search: {
    name: 'Mia',
    label: 'Rentals Concierge',
    emoji: '🏠',
    systemBlurb: 'You are Mia, the mdeai Rentals Concierge. You specialize in medium-term rentals (1-3 months) in Medellín for digital nomads and expats. Be warm, direct, and expert.'
  },
  event_discover: {
    name: 'Carlos',
    label: 'Events Scout',
    emoji: '🎉',
    systemBlurb: 'You are Carlos, the mdeai Events Scout. You know every concert, festival, nightlife venue, and cultural event in Medellín. Be enthusiastic and specific.'
  },
  restaurant_discovery: {
    name: 'Ana',
    label: 'Food Scout',
    emoji: '🍽️',
    systemBlurb: 'You are Ana, the mdeai Food Scout. You know the best restaurants, cafés, and food experiences in Medellín by neighborhood, vibe, and cuisine.'
  },
  trip_planning: {
    name: 'Sofia',
    label: 'Tour Guide',
    emoji: '🗺️',
    systemBlurb: 'You are Sofia, the mdeai Tour Guide. You help visitors and new arrivals plan their first days in Medellín — itineraries, must-sees, local tips.'
  },
  landlord_listing: {
    name: 'Diego',
    label: 'Host Manager',
    emoji: '🔑',
    systemBlurb: 'You are Diego, the mdeai Host Manager. You help property owners list and manage their rentals.'
  },
  general_question: {
    name: 'Lina',
    label: 'Concierge',
    emoji: '✨',
    systemBlurb: 'You are Lina, the mdeai AI Concierge for Medellín. Help users navigate the city, find what they need, and connect with the right services.'
  },
};
```

#### C2. Agent badge in chat

Emit `agent_label` in SSE phase events:
```json
{ "phase": "handoff", "agent_label": "Rentals Concierge", "agent_emoji": "🏠", "agent_name": "Mia" }
```

Render in ChatReasoningTrace header: `🏠 Mia · Rentals Concierge`

#### C3. Agent selector logic in ai-chat

```typescript
// At request start, determine agent from intent
const intent = routerResult?.intent ?? 'general_question';
const persona = AGENT_PERSONAS[intent] ?? AGENT_PERSONAS.general_question;

const systemPrompt = `${persona.systemBlurb}

Current user context: ${contextSummary}
Conversation history: ${conversationSummary}

Always respond in ${language}. Be concise and action-oriented. If recommending something, explain why it fits this specific user.`;
```

## Acceptance Criteria

- [ ] Spanish query → full Spanish response (correct Colombian register)
- [ ] English query → English response
- [ ] Language preference saved after 1st message, applied on return
- [ ] 3 follow-up suggestion chips appear below every AI response
- [ ] Clicking a chip sends that message immediately
- [ ] Agent persona (Mia/Carlos/Ana/Sofia/Diego) shown in reasoning trace header
- [ ] Correct persona selected based on intent classification

## Files to Touch

- `supabase/functions/ai-chat/index.ts` — language detection, follow-up generation, agent persona
- `supabase/functions/ai-router/index.ts` — return agent_label in response
- `src/hooks/useChat.ts` — add followUpSuggestions state + FOLLOW_UP_SUGGESTIONS handling
- `src/components/chat/FollowUpChips.tsx` — create
- `src/components/chat/ChatCanvas.tsx` — render FollowUpChips below message list
- `src/components/chat/ChatWelcome.tsx` — bilingual quick actions
- `src/components/chat/ChatInput.tsx` — bilingual placeholder

---

## Definition of Done (continuous testing — mandatory)

A task is **not** done until every applicable row is checked. "Code merged" is not the finish line — **tested + verified live** is. See [.claude/rules/task-writing.md §9](../../../.claude/rules/task-writing.md) and [CLAUDE.md → Definition of Done](../../../CLAUDE.md).

- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] `npm run test` clean and **count did not regress** (new logic = new tests; bugs = regression test that fails without the fix)
- [ ] `npm run verify:edge` clean *(only if `supabase/` was touched — else "N/A — no edge-fn change")*
- [ ] E2E covered *(Playwright spec OR documented manual run with screenshot — only if user-facing flow touched; else "N/A")*
- [ ] Live verification on https://www.mdeai.co after Vercel deploy *(only if UI shipped to prod; HTTP 200 + visual check)*
- [ ] PR body lists what was tested + result for each layer

If a layer is N/A, **say so explicitly** in the PR. Silence ≠ exemption.
