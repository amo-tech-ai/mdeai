# I Love Medellín — Realtime Frontend Plan

**Document:** Frontend changes for Supabase Realtime (chat, trip, job subscriptions). Lovable/codegen prompts, progress tracker, user stories, journeys.  
**References:** `tasks/plan/03-ai-realtime.md` · `tasks/plan/04-realtime-prompts.md` · `.cursor/rules/supabase/ai-realtime.md`  
**Last Updated:** 2026-01-28  

---

## 1. Frontend Changes Summary

| Area | What to add | Where |
|------|-------------|--------|
| **Chat** | Subscribe to `conversation:{conversationId}:messages` when a conversation is open; on INSERT/UPDATE/DELETE, update message list or refetch; cleanup on unmount or conversation change | `useChat` hook and/or Concierge + FloatingChatWidget |
| **Trip** | Subscribe to `trip:{tripId}:items` and `trip:{tripId}:meta` when viewing a trip; on events, refetch trip or merge into state; cleanup on unmount or tripId change | TripDetail (and optionally Trips list) |
| **Job progress** | When a job is started (job id returned), subscribe to `job:{jobId}:status`; on `job_status_changed`, update progress UI; unsubscribe on done/fail or unmount | Job modal/panel (wherever heavy AI jobs are started) |

**Key files**

- **Hooks:** `src/hooks/useChat.ts` (conversation + messages); `src/hooks/useTrips.ts` / `src/hooks/useTripItems.ts` (trip data); new or existing job hook for agent_jobs.
- **Pages:** `src/pages/Concierge.tsx`, `src/pages/TripDetail.tsx`.
- **Components:** `src/components/chat/FloatingChatWidget.tsx`, `src/components/chat/ChatMessageList.tsx`; trip itinerary components used in TripDetail.
- **Client:** `src/integrations/supabase/client.ts` (existing; use for `supabase.realtime.setAuth()` and `supabase.channel()`).

**Rules**

- One channel per open conversation / trip / job; `config: { private: true }`; call `await supabase.realtime.setAuth()` before subscribing.
- Hold channel in a ref; check state before subscribing to avoid duplicates; unsubscribe and remove channel on unmount or when id changes.
- Backend events: messages/trip_items/trips use **INSERT | UPDATE | DELETE**; agent_jobs use **job_status_changed** with payload `{ id, status, progress, current_step, total_steps }`.

---

## 2. User Stories — Purpose, Goals, Outcomes

| Story | Purpose | Goal | Outcome |
|-------|---------|------|---------|
| **Chat live** | Concierge and FloatingChatWidget feel instant | User sees new messages without refresh or polling | Subscribe to `conversation:{id}:messages`; on INSERT/UPDATE/DELETE, update message list or refetch; new messages appear in real time |
| **Trip live** | Itinerary stays in sync across tabs and collaborators | User sees trip and trip_items changes as they happen | Subscribe to `trip:{id}:items` and `trip:{id}:meta`; on events, refetch trip or merge; itinerary and header update live |
| **Job progress** | Heavy AI flows (trip wizard, deep research) show progress | User sees job status and progress without polling | Subscribe to `job:{id}:status` when job starts; on `job_status_changed`, update progress UI; unsubscribe on done/fail or leave |

---

## 3. User Journeys

### Journey 1: Live chat (Concierge / FloatingChatWidget)

1. User opens Concierge or expands FloatingChatWidget and selects or starts a conversation.
2. **Frontend:** When `currentConversation.id` is set, subscribe to private channel `conversation:{currentConversation.id}:messages` (after `setAuth()`).
3. User sends a message; assistant reply is written to `messages` by the backend.
4. **Backend:** Trigger on `messages` broadcasts INSERT (and optionally UPDATE/DELETE) to that topic.
5. **Frontend:** Handler receives broadcast; appends/updates message in list (or refetches messages); UI updates without refresh.
6. User switches conversation or closes chat → unsubscribe and remove channel; subscribe to new conversation if any.

**Purpose:** Feel instant, no manual refresh.  
**Goal:** New messages visible in real time.  
**Output:** Message list stays in sync with DB for the open conversation.

### Journey 2: Live trip (TripDetail)

1. User opens a trip (TripDetail) by id.
2. **Frontend:** When `tripId` is set, subscribe to private channels `trip:{tripId}:items` and `trip:{tripId}:meta` (after `setAuth()`).
3. User (or another tab) adds/edits/removes a trip item or updates trip meta.
4. **Backend:** Triggers on `trip_items` and `trips` broadcast to those topics.
5. **Frontend:** Handler receives broadcast; refetches trip data or merges change into state; itinerary and trip header update.
6. User navigates away → unsubscribe and remove channels.

**Purpose:** Itinerary always in sync.  
**Goal:** Trip and items update live.  
**Output:** Trip detail view reflects DB changes in real time.

### Journey 3: Live job progress

1. User starts a heavy AI job (e.g. trip wizard, deep research); backend returns `jobId`.
2. **Frontend:** Subscribe to private channel `job:{jobId}:status` (after `setAuth()`).
3. Worker/edge updates `agent_jobs` (status, progress, current_step).
4. **Backend:** Trigger on `agent_jobs` sends `job_status_changed` with safe payload to that topic.
5. **Frontend:** Handler updates progress bar / status text; on completed/failed, show result and unsubscribe.
6. User closes modal or navigates away → unsubscribe and remove channel.

**Purpose:** No polling, clear progress.  
**Goal:** User sees progress until completion.  
**Output:** Progress UI updates in real time; user knows when job is done.

---

## 4. Progress Tracker — Tasks Table

| Task ID | Task name | Description | Status | % | ✅ Done | ⚠️ Blocked / Missing | 💡 Next action |
|---------|-----------|-------------|--------|---|---------|------------------------|----------------|
| **FE-RT-1** | Chat Realtime subscription | Concierge + FloatingChatWidget: subscribe to `conversation:{id}:messages` when conversation open; handle INSERT/UPDATE/DELETE; ref/auth + cleanup | 🔴 Not started | 0% | — | No subscription in app | Use Lovable prompt FE-P1 below |
| **FE-RT-2** | Trip Realtime subscription | TripDetail: subscribe to `trip:{tripId}:items` and `trip:{tripId}:meta`; on events refetch/merge; cleanup on unmount or tripId change | 🔴 Not started | 0% | — | No subscription in app | Use Lovable prompt FE-P2 below |
| **FE-RT-3** | Job progress Realtime subscription | When job starts, subscribe to `job:{jobId}:status`; on `job_status_changed` update UI; unsubscribe on done/fail or unmount | 🔴 Not started | 0% | — | Job UI may not exist yet | Use Lovable prompt FE-P3 below |
| **FE-RT-4** | Shared Realtime hook (optional) | Optional: `useRealtimeChannel(topic, handlers)` to centralize setAuth, subscribe, cleanup | 🔴 Not started | 0% | — | — | After FE-RT-1–FE-RT-3 if desired |
| **FE-RT-5** | Verification | Verify chat, trip, job flows with two tabs or devices; document steps | 🔴 Not started | 0% | — | — | After FE-RT-1–FE-RT-3 |

---

## 5. Lovable Generate Prompts

Use these as copy-paste prompts for Lovable (or similar) to generate the frontend Realtime code. Backend triggers and RLS are already deployed.

---

### FE-P1 — Chat: Realtime subscription for Concierge and FloatingChatWidget

**Lovable prompt:**

Add Supabase Realtime for live chat in the Concierge page and FloatingChatWidget. When the user has a current conversation open (currentConversation.id is set), subscribe to a **private** Realtime channel with topic `conversation:{conversationId}:messages` and `config: { private: true }`. Before subscribing, call `await supabase.realtime.setAuth()`. Listen for broadcast events with event type **INSERT**, **UPDATE**, and **DELETE** (these are the TG_OP values from the backend trigger). On INSERT, add the new message to the message list (or refetch messages); on UPDATE/DELETE, update or remove the message in state (or refetch). Use a ref to hold the channel; if the channel is already subscribed, do not subscribe again. On unmount or when conversationId changes, unsubscribe and remove the channel with `supabase.removeChannel(channel)`. Integrate this in the existing useChat hook or in the Concierge and FloatingChatWidget components so that both use the same conversation-scoped subscription when a conversation is selected. Stack: React, TypeScript, Supabase client from `@/integrations/supabase/client`, existing useChat and message list state.

---

### FE-P2 — Trip: Realtime subscription for TripDetail

**Lovable prompt:**

Add Supabase Realtime for live trip updates on the TripDetail page. When the user is viewing a trip (tripId from route params is set), subscribe to two **private** Realtime channels: `trip:{tripId}:items` and `trip:{tripId}:meta`, both with `config: { private: true }`. Before subscribing, call `await supabase.realtime.setAuth()`. For `trip:{tripId}:items`, listen for broadcast events **INSERT**, **UPDATE**, **DELETE** (trip_items changes); for `trip:{tripId}:meta`, listen for **INSERT**, **UPDATE**, **DELETE** (trip meta changes). On any event, refetch the trip data (e.g. invalidate the trip query or call the existing trip fetch) so the itinerary and trip header update in real time. Use refs to hold the channels; avoid duplicate subscriptions. On unmount or when tripId changes, unsubscribe and remove both channels with `supabase.removeChannel(channel)`. Integrate in TripDetail (e.g. in the component that uses useTrip(id) or in a small effect). Stack: React, TypeScript, Supabase client from `@/integrations/supabase/client`, existing useTrip/useTrips and trip state.

---

### FE-P3 — Job progress: Realtime subscription for heavy AI jobs

**Lovable prompt:**

Add Supabase Realtime for live AI job progress. When the app starts a heavy AI job and receives a job id (e.g. from an API that enqueues a job and returns `{ id }`), subscribe to a **private** Realtime channel with topic `job:{jobId}:status` and `config: { private: true }`. Before subscribing, call `await supabase.realtime.setAuth()`. Listen for the broadcast event **job_status_changed**. The payload is an object with `id`, `status`, `progress`, `current_step`, `total_steps`. Update the job progress UI (progress bar, status text, current step) from this payload. When status is `completed` or `failed`, show the result or error and unsubscribe; remove the channel with `supabase.removeChannel(channel)`. On unmount (user closes the modal or navigates away), unsubscribe and remove the channel. Use a ref to hold the channel. If there is no job progress modal/panel yet, create a minimal one that shows progress and status and subscribes when given a jobId. Stack: React, TypeScript, Supabase client from `@/integrations/supabase/client`.

---

## 6. Summary Table

| Item | Content |
|------|---------|
| **Screens** | Concierge, FloatingChatWidget, TripDetail, (future) Job progress modal/panel |
| **User stories** | Chat live, Trip live, Job progress (purpose / goal / outcome above) |
| **Journeys** | Live chat (subscribe → receive INSERT/UPDATE/DELETE → update list); Live trip (subscribe items + meta → refetch/merge); Live job (subscribe → job_status_changed → progress UI → unsubscribe on done) |
| **Tasks** | FE-RT-1 (chat), FE-RT-2 (trip), FE-RT-3 (job), FE-RT-4 (optional hook), FE-RT-5 (verification) |
| **Lovable prompts** | FE-P1 (chat), FE-P2 (trip), FE-P3 (job) |

---

**References:** Strategy and backend prompts in `tasks/plan/03-ai-realtime.md` and `tasks/plan/04-realtime-prompts.md`.  
**Rule:** `.cursor/rules/supabase/ai-realtime.md` (private channels, setAuth, cleanup, no postgres_changes).
