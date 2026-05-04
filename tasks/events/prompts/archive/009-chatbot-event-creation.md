---
task_id: 009-chatbot-event-creation
title: Extend ai-chat to create events from natural-language conversation
phase: PHASE-1-EVENTS
priority: P1
status: Done
estimated_effort: 2 days
area: ai-agents
wizard_step: null
skill:
  - gemini
  - supabase-edge-functions
  - frontend-design
  - vercel-react-best-practices
subagents:
  - performance-reviewer
  - security-auditor
edge_function: ai-chat
schema_tables:
  - public.events
  - public.event_tickets
  - public.conversations
  - public.messages
depends_on: ['001-event-schema-migration', '002-host-event-new-wizard', '004-ticket-checkout-edge-fn']
mermaid_diagram: ../diagrams/10-event-creation-wizard.md
---

## Summary

| Aspect | Details |
|---|---|
| **Screens** | `FloatingChatWidget` (existing global widget) + new in-chat preview card |
| **Features** | Natural-language event creation; AI proposes, human confirms; deep-link to `/host/event/:slug?draft=true` |
| **Edge Functions** | extend existing `ai-chat` with 3 new tools: `create_event_draft`, `add_ticket_tier`, `finalize_event_draft` |
| **Tables** | reads/writes `events` (status='draft') + `event_tickets`; logs to `messages` + `ai_runs` |
| **Agents** | `ai-chat` (existing, Gemini Flash) extended with event-creation tool-calling |
| **Real-World** | Sofía types "I want to host Reina de Antioquia 2026 finals on Oct 18" → AI extracts fields → returns draft preview → Sofía taps "Open in editor" → lands on `/host/event/new?draft=:id` with all fields pre-filled |

## Description

**The situation.** Phase 1 ships a 4-step `/host/event/new` wizard (task 002) that takes ~25 minutes for Sofía to publish her first event. mdeai already has a deployed `ai-chat` edge function with `useChat` hook, `FloatingChatWidget` (global), and a 7-agent intent router. **None of these touch event creation today** — the chat answers questions about existing events but cannot create one.

**Why it matters.** Most paisa organizers prefer messaging over forms. WhatsApp is their daily tool. A chatbot that says "tell me about your event" and extracts structured data is a 10× lower-friction path than a 4-step form, and shortens Sofía's time-to-published from 25 min → ~5 min for simple events. Per `.claude/rules/ai-interaction-patterns.md`, AI must propose-then-apply (never auto-create). The chatbot drafts; Sofía confirms via the existing wizard.

**What already exists.**
- [`supabase/functions/ai-chat/index.ts`](../../../supabase/functions/ai-chat/index.ts) — multi-agent chat edge function on Gemini Flash with tool-calling primitives.
- [`src/hooks/useChat.ts`](../../../src/hooks/useChat.ts) — chat state hook.
- [`src/components/chat/FloatingChatWidget.tsx`](../../../src/components/chat/FloatingChatWidget.tsx) — global chat surface.
- [`src/components/chat/ChatCanvas.tsx`](../../../src/components/chat/ChatCanvas.tsx) — message renderer.
- [`src/components/chat/embedded/EmbeddedListings.tsx`](../../../src/components/chat/embedded/EmbeddedListings.tsx) — pattern for in-chat embedded action cards.
- Tasks 001, 002, 004 — schema, wizard, and `ticket-checkout` edge fn that this task chains into.

**The build.** Three new tools on the `ai-chat` edge function (Gemini function-calling): `create_event_draft(name, description, start_at, end_at, address, city)` → inserts events row with `status='draft'`; `add_ticket_tier(event_id, name, price_cents, qty_total)` → inserts event_tickets row; `finalize_event_draft(event_id)` → returns the deep-link URL `/host/event/new?draft=:id`. New `EmbeddedEventDraft` component renders inside the chat showing the draft as a preview card with "Open in editor" + "Discard" CTAs. Conversation state stored in existing `conversations` + `messages` tables.

**Example.** Sofía opens mdeai.co, taps the floating chat, types: *"Quiero crear un evento para la final de Reina de Antioquia 2026, sábado 18 de octubre 8pm en el Hotel Intercontinental. 4 categorías de boleta: GA $40 mil 1000 cupos, VIP $120 mil 200 cupos, Backstage $400 mil 30 cupos, Frontrow $80 mil 100 cupos."* The AI calls `create_event_draft` (extracted: name, datetime, address); then 4× `add_ticket_tier`; then `finalize_event_draft`. Chat displays a preview card with the 4 tiers. Sofía taps "Abrir en editor" → lands on `/host/event/new?draft=<id>` with all fields pre-filled, just needs to upload the hero photo and publish. Total time elapsed: ~3 minutes.

## Rationale

**Problem.** The 4-step wizard takes 25 minutes minimum for organizers who already know what they want. Many paisa organizers stall mid-wizard because they're not used to filling structured forms — they prefer telling someone what to do.

**Solution.** Add chatbot event-creation as a parallel entry point. The chatbot collects fields conversationally, drafts an event in `status='draft'`, then hands off to the visual wizard for the polish steps (photo upload, share copy, publish). One creation surface for typers, one for clickers.

**Impact.** Sofía's first event ships in ~5 minutes instead of ~25. The wizard becomes the polishing tool, not the data-entry tool. Founders' Phase 1 demo becomes "I created this event by typing a sentence" — strong signal vs. competitors who require form-completion.

## User Stories

| As a... | I want to... | So that... |
|---|---|---|
| Organizer (Sofía) | describe my event in plain Spanish | I don't have to navigate a form |
| Organizer (Sofía) | preview the AI's draft before it saves | I trust the data is right before I publish |
| Organizer (Daniela) | start in chat, finish in the wizard | I get speed AND polish |
| mdeai operator | every AI extraction logged to `ai_runs` | I can audit cost + quality |
| Existing user (Camila) | chat continues to answer questions about existing events | the new tool doesn't break the chat I already use |

## Goals

1. **Primary:** A new organizer publishes an event end-to-end where chat creates the draft and `/host/event/new?draft=:id` finishes it.
2. **Quality:** AI extraction accuracy ≥ 90% on 50 hand-labeled Spanish-Paisa event descriptions (eval set in `tasks/events/evals/chat-event-extraction.json`).
3. **Latency:** First tool-call response within 3s p95 on Gemini Flash.
4. **Safety:** Zero events created without user confirmation (preview card → "Open in editor" or "Discard" required).

## Acceptance Criteria

- [ ] User types an event description in chat → AI calls `create_event_draft` and returns extracted fields.
- [ ] Multiple ticket tiers in one message → AI calls `add_ticket_tier` once per tier.
- [ ] Preview card renders with all fields + tier breakdown + total capacity + "Open in editor" + "Discard" CTAs.
- [ ] "Open in editor" deep-links to `/host/event/new?draft=:id` with fields pre-filled.
- [ ] "Discard" deletes the draft (`UPDATE events SET status='archived' WHERE id = :id` — soft delete, not hard).
- [ ] Anonymous user (not logged in) → chat prompts login before creating draft (uses existing auth gate).
- [ ] Authenticated user → `events.organizer_id = auth.uid()` set automatically.
- [ ] AI cannot publish on its own — `events.status` only ever 'draft' from chat path; only the wizard's Step 4 can publish.
- [ ] Bilingual: AI replies in same language user typed (en or es-CO).
- [ ] All AI calls logged to `ai_runs(agent_name='ai-chat', tool='create_event_draft', input_tokens, output_tokens, duration_ms, status)`.
- [ ] Eval pass-rate ≥ 90% on the labeled set.
- [ ] Zero AI hallucinated URLs or numbers (regex `https?://` check + price sanity check 0 ≤ price_cents ≤ 100M).
- [ ] Loading + error + empty states handled per `style-guide.md`.

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Edge fn | `supabase/functions/ai-chat/tools/create_event_draft.ts` | Create — Zod schema + RLS-aware insert |
| Edge fn | `supabase/functions/ai-chat/tools/add_ticket_tier.ts` | Create |
| Edge fn | `supabase/functions/ai-chat/tools/finalize_event_draft.ts` | Create — returns deep-link URL |
| Edge fn | `supabase/functions/ai-chat/index.ts` | Modify — register the 3 new tools in the Gemini tool list |
| Edge fn | `supabase/functions/ai-chat/system-prompts/event-creator.md` | Create — Spanish-Paisa system prompt with extraction examples |
| Component | `src/components/chat/embedded/EmbeddedEventDraft.tsx` | Create — preview card |
| Component | `src/components/chat/ChatCanvas.tsx` | Modify — render `EmbeddedEventDraft` when message has `tool_result.event_draft` payload |
| Hook | `src/hooks/useChat.ts` | Modify — add `event_draft` to message payload type |
| Page | `src/pages/host/HostEventNew.tsx` | Modify (from task 002) — read `?draft=:id` query param and load fields |
| Eval | `tasks/events/evals/chat-event-extraction.json` | Create — 50 labeled inputs for accuracy measurement |
| Eval | `tasks/events/evals/run-event-extraction-eval.ts` | Create — runner that hits the edge fn against the labeled set |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| User describes 6+ ticket tiers (over our 5-tier P1 limit) | AI replies "Phase 1 supports up to 5 tiers — let me consolidate the smaller ones" and proposes a merged set; user confirms or rejects |
| User says "free event, no tickets" | Tool creates 1 ticket tier with `price_cents=0`, `qty_total=user-stated-or-default-100`, `name='RSVP'` |
| User omits date | AI asks one follow-up: "When is the event?" — does NOT guess |
| User pastes a competitor Eventbrite URL | AI replies "I can't import from Eventbrite directly in P1, but I can extract from your description — paste the event details here." (Eventbrite import = P3) |
| User describes an event that conflicts with another draft they own | AI asks "You already have a draft 'X' from yesterday — start fresh or continue that one?" |
| Anonymous user mid-conversation | At the moment `create_event_draft` is called, AI returns a "Sign in to save your event" message and pauses; on signin, conversation resumes with stored extraction |
| User sends a 5,000-char wall of text | Truncate to first 2,000 chars before Gemini call; warn user "I'll work with the first part — paste the rest if I miss anything" |
| Gemini timeout (>10s) | Show "Taking longer than usual..." → retry once → if still failing, fall back to "Try the wizard at /host/event/new" |
| Tool call fails RLS (e.g. trying to set organizer_id ≠ auth.uid()) | 403 → AI tells user "I can't create events for someone else — sign in to your own account first" |

## Real-World Examples

**Scenario 1 — Spanish-Paisa fast path:** Sofía (Miss Elegance Colombia organizer) types in es-CO: *"Final de Reina de Antioquia 18 de octubre 8pm Hotel Intercontinental. GA 40 mil 1000, VIP 120 mil 200, Backstage 400 mil 30."* Today: she'd open `/host/event/new` and tab through 4 steps × 6-8 fields = ~25 min including thinking time. **With this implementation,** AI extracts in ~3s, returns a preview card; Sofía taps "Abrir en editor"; wizard opens at Step 1 with name + date + venue + 3 tiers pre-filled; she uploads the hero photo + reviews + taps Publish. Total time: ~5 min. **Why it matters:** founder demo on day 1 of Phase 1 launch becomes "I made this event by typing one sentence."

**Scenario 2 — English checker for ambiguity:** Daniela (Laureles bar owner) types in English: *"Best DJ Wednesday tomorrow."* AI replies "I need a few more details: what time tomorrow? Where's the venue? Free or ticketed?" Today: a form would let her submit incomplete data and bounce her back with red error states. **With this implementation,** the AI's conversational follow-up keeps her in the flow; she replies "9pm Club Mansión, free RSVP 80 cupos"; AI calls `create_event_draft` + `add_ticket_tier`; preview shows. **Why it matters:** form-shy organizers don't churn on validation errors.

**Scenario 3 — Hallucination guard:** A test user types: *"Concierto de Carlos Vives, vendido en taquilla.com.co — copia los datos de allí."* Today there is no chatbot creation, so this scenario is N/A. **With this implementation,** the AI replies "I can only work from what you tell me here — paste the event details and I'll create the draft." It does NOT fetch external URLs, does NOT invent prices or venues. **Why it matters:** prevents the failure mode where AI invents Stripe prices that organizer never approved.

## Outcomes

| Before | After |
|---|---|
| Event creation = 25 min wizard, organizer must know all fields up front | Conversational draft in 3 min; wizard becomes the polish layer |
| FloatingChatWidget answers questions but cannot create anything | Chat is now the fastest creation surface for typers |
| AI extraction quality ungoverned (no eval set) | 90%+ accuracy on a 50-input Spanish-Paisa eval set, gated as Phase 1 acceptance |
| Mobile-first organizers (paisa default) bounce off the wizard | Chat works on any phone keyboard; wizard finishes the job |
| `ai_runs` shows zero event-creation tool-calls | Every chat extraction logged with token counts + latency |

## Gemini integration (per task 045 + tool-combination preview)

Function calling for chat-driven event creation. Gemini 3 supports built-in tools + custom function calling **together** as of 2026-04-28 docs (the installed skill says otherwise; task 046 patches that).

| Setting | Value | Source |
|---|---|---|
| Endpoint | native `:generateContent` (NOT OpenAI compat — needed for thought signatures) | skill G4 |
| Model | `gemini-3-flash-preview` | task spec |
| `thinkingLevel` | `medium` (multi-step extraction) | skill §"Thinking Levels" |
| `functionCallingConfig.mode` | **`ANY`** | live docs § Function calling |
| `allowedFunctionNames` | `["create_event_draft","add_ticket_tier","finalize_event_draft"]` | forces tool use, no free-chat |
| Custom + built-in combo | `function_declarations: [...3 tools...]` + `tools: [{ googleSearch: {} }]` | live docs § Tool combination |
| `include_server_side_tool_invocations` | `true` (required when combining) | live docs § Tool combination |
| Thought signatures | preserve `thoughtSignature` + `id` + `tool_type` on every part across all turns | skill rule (400 error otherwise) |
| `responseJsonSchema` | NOT used here — function calling supplies the structure | per Gemini contract |
| Citations | persist `groundingChunks` from Google Search to `ai_runs.metadata.citations` | skill G5 |

**Why `ANY` mode + Google Search combo matters:** Sofía can say *"create event for the next Reina de Antioquia"* — AI uses Google Search to find the date, then calls our tools to build the draft. Without `ANY`, it might just chat. Without Google Search, it would hallucinate the date.

**SDK strongly recommended:** `npm:@google/genai@^1.0.0` automatically manages thought signatures across turns. Rolling our own signature handling is fragile and the skill explicitly warns against it.

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md) — schema this task writes to
- [`002-host-event-new-wizard.md`](./002-host-event-new-wizard.md) — the visual wizard the chat hands off to (read `?draft=:id` query)
- [`004-ticket-checkout-edge-fn.md`](./004-ticket-checkout-edge-fn.md) — what shipping events use after publish
- [`../15-user-stories.md`](../15-user-stories.md) §2 (S-O-1, S-O-2)
- `.claude/rules/ai-interaction-patterns.md` — propose-only contract
- `supabase/functions/ai-chat/index.ts` — existing edge fn this task extends
- `src/components/chat/embedded/EmbeddedListings.tsx` — pattern for in-chat action cards
