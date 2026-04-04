# AI Interaction Patterns

## Core Principle: Propose, Don't Apply

AI is an advisor, not an executor. Every AI suggestion follows:

1. **Preview** — Show the user what AI recommends (visual diff, card, summary)
2. **Apply** — User explicitly confirms the action
3. **Undo** — User can revert within the session

Never auto-apply AI suggestions to bookings, trips, or saved data.

## Intent Router

The `ai-router` edge function classifies every user message into intents:
- `EXPLORE` — Discovery, browsing, "show me"
- `BOOK` — Reservation, booking actions
- `TRIP` — Trip planning, itinerary
- `SEARCH` — Semantic search across listings
- `MEMORY` — Recall past interactions
- `GENERAL` — Chitchat, FAQ, help

Each intent routes to a specialized agent in `ai-chat`.

## Chat Architecture

- `useChat` hook manages conversation state
- `useIntentRouter` classifies messages before sending to AI
- `FloatingChatWidget` is the global entry point (always visible)
- Streaming responses via SSE from `ai-chat` edge function
- Tool-calling: AI can invoke `search_apartments`, `check_availability`, `get_directions`

## Embedding & Search

- `ai-search` uses pgvector for semantic similarity
- Embeddings stored in Supabase with `vector` column type
- Search across: apartments, restaurants, cars, events
- Results ranked by cosine similarity + freshness boost

## AI Component Patterns

```tsx
// AI suggestion card with accept/dismiss
<AIProposalCard
  suggestion={suggestion}
  onAccept={() => applyProposal(suggestion)}
  onDismiss={() => dismissProposal(suggestion.id)}
  onUndo={() => undoProposal(suggestion.id)}
/>
```

## Context Window Management

- Send only relevant context to Claude — not entire conversation history
- Truncate older messages, keep system prompt + last 10 turns
- Include user profile summary for personalization
- Include current page context (what the user is looking at)
