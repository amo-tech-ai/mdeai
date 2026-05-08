---
id: C04
title: Host Listing Intake — Create Rental Listing via Chat Conversation
status: Not Started
priority: P0
effort: 3 days
revenue_impact: Very High — unlocks host SaaS funnel ($99–299/mo per host)
depends_on: listing-create edge fn (exists), apartments table, C03 lead capture
skill:
  - mde-real-estate
  - gemini
  - chatbot-conversation-design
---

<!-- task-summary -->
> **What:** Host Listing Intake — Create Rental Listing via Chat Conversation
> **Why:** When a landlord says "I want to add my rental listing", the current flow shows a button that navigates them to `/host/listings/new` — breaking the chat experience. The 4-step wizard at that URL is fine for a dedicated…
> **Tools/Skills:** `mde-real-estate` · `gemini` · `chatbot-conversation-design`
> **P0 · Not Started · Effort: 3 days**
> **Depends on:** listing-create edge fn (exists), apartments table, C03 lead capture

# C04 — Host Listing Intake via Chat

## Problem

When a landlord says "I want to add my rental listing", the current flow shows a button that navigates them to `/host/listings/new` — breaking the chat experience. The 4-step wizard at that URL is fine for a dedicated form flow, but landlords should be able to create a listing **entirely through conversation** as the primary path.

This is the highest-ROI feature for the host vertical. A landlord who creates a listing through chat is already in our funnel and will upgrade to paid tools (showing management, tenant screening, analytics).

## What to Build

### 1. New `host-listing-intake` edge function
File: `supabase/functions/host-listing-intake/index.ts`

This function handles conversational listing creation in 5 steps. It's stateful — progress saved to `conversations.session_data` and restored on each turn.

```typescript
interface ListingIntakeState {
  step: 1 | 2 | 3 | 4 | 5 | 'complete';
  data: {
    // Step 1: Location
    neighborhood?: string;
    address?: string;
    // Step 2: Details
    bedrooms?: number;
    bathrooms?: number;
    size_sqm?: number;
    furnished?: boolean;
    // Step 3: Price + availability
    price_monthly?: number;
    available_from?: string;
    min_stay_months?: number;
    // Step 4: Amenities + rules
    amenities?: string[];
    pets_allowed?: boolean;
    smoking_allowed?: boolean;
    // Step 5: Photos + description
    description?: string;
    photos?: string[];  // URLs after upload
  };
  listing_id?: string;  // set when draft created
}

// Tool: called by ai-chat with extracted data from conversation
// Returns: next_question (what to ask user next) or listing_id (when complete)
interface ListingIntakeInput {
  user_message: string;
  current_state: ListingIntakeState;
}

interface ListingIntakeOutput {
  state: ListingIntakeState;
  next_question: string | null;
  listing_id: string | null;  // set when listing created
  actions?: ChatAction[];
}
```

Logic per step:
- Step 1: Extract neighborhood + address from user message → save → ask step 2 question
- Step 2: Extract bedrooms/bathrooms/furnished → save → ask step 3 question
- Step 3: Extract price/availability → save → ask step 4 question
- Step 4: Extract amenities/rules → save → ask step 5 question
- Step 5: Generate AI description from collected data → create listing draft → return listing_id

### 2. Add `host_listing_intake` tool to ai-chat

```typescript
{
  type: "function",
  function: {
    name: "host_listing_intake",
    description: "Help a landlord or property owner create a rental listing through conversation. Use this when the user wants to add their property, list their apartment, or become a host.",
    parameters: {
      type: "object",
      properties: {
        user_message: { type: "string" },
        current_state: {
          type: "object",
          description: "Current intake state from conversation.session_data.listing_intake"
        }
      },
      required: ["user_message", "current_state"]
    }
  }
}
```

### 3. Session state persistence

`ai-chat` must read and write `conversations.session_data` for listing intake state:
```typescript
// Before tool call
const sessionData = await db.from('conversations').select('session_data').eq('id', conversationId).single();
const intakeState = sessionData.data?.session_data?.listing_intake ?? { step: 1, data: {} };

// After tool call
await db.from('conversations').update({
  session_data: { ...sessionData.data?.session_data, listing_intake: result.state }
}).eq('id', conversationId);
```

### 4. AI-generated listing description

In step 5, use Gemini to generate the listing description from the collected data:
```typescript
const descriptionPrompt = `Write a compelling rental listing description for:
- Location: ${data.neighborhood}, Medellín
- ${data.bedrooms} bed / ${data.bathrooms} bath, ${data.size_sqm}m²
- ${data.furnished ? 'Fully furnished' : 'Unfurnished'}
- Price: $${data.price_monthly}/month
- Amenities: ${data.amenities?.join(', ')}
- Rules: Pets ${data.pets_allowed ? 'welcome' : 'not allowed'}

Write 3 paragraphs in English, professional and warm tone. Highlight what makes this ideal for digital nomads and medium-term stays (1-3 months).`;
```

### 5. OPEN_LISTING_CREATED action

When listing created successfully, emit:
```json
{
  "type": "OPEN_LISTING_CREATED",
  "payload": {
    "listing_id": "uuid",
    "title": "Modern 2BR in Laureles",
    "edit_url": "/host/listings/uuid/edit"
  }
}
```

ChatActionBar handles this → "Edit your listing →" button and "Add photos →" button.

### 6. Photo upload flow

Step 5 should prompt for photos. Since file upload in chat is complex (future), for MVP:
- AI generates description and creates draft listing without photos
- Shows "Add photos" CTA → navigates to `/host/listings/:id/edit` in a new tab
- "Your listing is live in draft mode. Add photos to publish."

Future (C-future): in-chat photo upload via drag & drop or camera.

### 7. Example conversation

```
User: I want to list my apartment in Laureles
AI: Great! I'll help you create your listing. Let's start with the basics.
    What neighborhood is your apartment in, and what's the approximate address?

User: It's in Laureles, on Circular 73
AI: Perfect, Circular 73 in Laureles — that's a great location!
    How many bedrooms and bathrooms does it have? Is it furnished?

User: 2 bedrooms, 2 bathrooms, fully furnished
AI: Got it — 2BD/2BA furnished. What's your monthly rental price, and when is it available?

User: $950/month, available June 1
AI: $950/month starting June 1. What amenities does it include? (e.g., WiFi, parking, gym, pool, AC)

User: WiFi, AC, parking, and the building has a gym
AI: Almost done! Are pets and/or smoking allowed?

User: No pets, no smoking
AI: I'm creating your listing now...
    [Thinking: generating description, creating draft]
    
    ✅ Your listing "Modern 2BR in Laureles" has been created as a draft!
    Here's what I wrote:
    
    [AI-generated description shown]
    
    [Button: Edit & Add Photos →]
    [Button: Publish Now →]
```

## System Prompt Update

Add to HostAgent system prompt:
```
You are Diego, the mdeai Host Manager. Help property owners create listings through friendly conversation.
When host_listing_intake returns a listing_id, congratulate the host and show the listing summary.
Always maintain the intake state across conversation turns — pick up where you left off if the user pauses.
```

## Acceptance Criteria

- [ ] User says "add my rental" → 5-step conversational intake starts (no navigation away)
- [ ] Progress saved across page refreshes (session_data in DB)
- [ ] After step 5, listing draft created in apartments table
- [ ] AI-generated description is coherent and professional
- [ ] "Edit & Add Photos" CTA appears after creation
- [ ] Incomplete sessions can be resumed ("Let's continue creating your listing")
- [ ] Host receives WhatsApp confirmation that listing is under review

## Files to Touch

- `supabase/functions/host-listing-intake/index.ts` — create
- `supabase/functions/ai-chat/index.ts` — add host_listing_intake tool, session_data r/w
- `src/components/chat/ChatActionBar.tsx` — handle OPEN_LISTING_CREATED
- `supabase/migrations/YYYYMMDD_listing_intake_session.sql` — add session_data JSONB to conversations if not present

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
