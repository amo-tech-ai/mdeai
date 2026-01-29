# I Love Medellín — Realtime Implementation Prompts

**Document:** Prompts to implement Supabase Realtime (Broadcast, private channels, triggers, RLS). No code in this doc.  
**References:** [Realtime Overview](https://supabase.com/docs/guides/realtime) · [Getting Started](https://supabase.com/docs/guides/realtime/getting_started) · [Broadcast](https://supabase.com/docs/guides/realtime/broadcast) · [Presence](https://supabase.com/docs/guides/realtime/presence) · [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) · [Settings](https://supabase.com/docs/guides/realtime/settings) · [Authorization](https://supabase.com/docs/guides/realtime/authorization) · [Reports](https://supabase.com/docs/guides/realtime/reports) · [Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)  
**Strategy:** `tasks/plan/03-ai-realtime.md` · **Rules:** `.cursor/rules/supabase/ai-realtime.md`  
**Last Updated:** 2026-01-28  

---

## Key Points (Top of Doc)

- **Use Broadcast only** for database change notifications; avoid Postgres Changes for scale. Use database triggers with `realtime.broadcast_changes` (or `realtime.send` for custom payloads).
- **Private channels only** in production; RLS on `realtime.messages` controls who can subscribe and (if needed) send.
- **Topic naming:** scope:entity:id (e.g. conversation:uuid:messages, trip:uuid:items, job:uuid:status, user:uuid:notifications).
- **Event naming:** snake_case, descriptive (message_created, trip_item_updated, job_status_changed).
- **Frontend:** One channel per open conversation, trip, or job; call setAuth before subscribing; cleanup on unmount or context change.
- **Screens impacted:** Concierge, FloatingChatWidget, TripDetail, Trips list, Bookings (optional), future job-progress UI; no change to edge function logic beyond existing DB writes.
- **Schema:** New migrations for trigger functions, triggers on messages, trip_items, trips, agent_jobs; RLS and indexes on realtime.messages.
- **Agents / workflows:** No new agent logic; existing writes to messages, trip_items, trips, agent_jobs drive broadcasts via triggers.

---

## Summary Table

| Dimension | Items |
|-----------|--------|
| **Screens** | Concierge, FloatingChatWidget, TripDetail, Trips (list), Bookings (optional), future job-progress modal or panel |
| **Features** | Live chat messages, live trip/itinerary updates, live AI job progress, optional live notifications (suggestions, booking status) |
| **Agents** | ai-chat (writes messages), trip/booking flows (write trip_items/trips), worker/edge (write agent_jobs); no agent code changes for Realtime |
| **Use cases** | New message appears without refresh; itinerary updates when another tab or collaborator edits; job progress without polling; new suggestion or booking update in real time |
| **Real-world examples** | User A sends message in Concierge → User B (same conversation) sees it instantly; user adds event to trip in one tab → TripDetail in another tab updates; user starts “Plan my trip” job → progress bar updates live until completion |

---

## Description

Supabase Realtime provides Broadcast, Presence, and Postgres Changes. For I Love Medellín, the strategy is **Broadcast only** for all database-driven real-time updates: chat messages, trip and trip_items changes, AI job status, and optionally user notifications. Messages are sent from the database via triggers (using `realtime.broadcast_changes` or `realtime.send`), and the frontend subscribes to private channels whose access is controlled by RLS on `realtime.messages`. Presence is out of scope for the first release but can be added later for typing indicators or “who’s online” in chat. Postgres Changes is not used so the app can scale and stay aligned with Supabase’s recommendation to prefer Broadcast with triggers for database change notifications.

---

## Rationale

- **Broadcast over Postgres Changes:** Broadcast with database triggers scales better and allows custom topics and payloads; Postgres Changes is single-threaded and can become a bottleneck. See [Realtime Overview](https://supabase.com/docs/guides/realtime) and [Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes).
- **Private channels:** Authorization via RLS on `realtime.messages` ensures only conversation participants, trip owners/collaborators, and job owners receive the right events. See [Authorization](https://supabase.com/docs/guides/realtime/authorization) and [Getting Started](https://supabase.com/docs/guides/realtime/getting_started).
- **Scoped topics:** One topic per conversation, trip, or job keeps traffic and RLS simple; see [Broadcast](https://supabase.com/docs/guides/realtime/broadcast) and project rule ai-realtime.md.
- **No code in agents:** Edge functions and workers already write to public tables; triggers turn those writes into broadcasts. No change to workflow or agent logic.

---

## User Stories: Purpose, Goals, Outcomes

| Story | Purpose | Goal | Outcome |
|-------|---------|------|---------|
| **Chat live** | So Concierge and FloatingChatWidget feel instant | User sees new messages without refreshing or polling | Subscriptions to conversation:{id}:messages; UI updates on message_created/updated/deleted |
| **Trip live** | So itinerary is always in sync across tabs and collaborators | User sees trip and trip_items changes as they happen | Subscriptions to trip:{id}:items and trip:{id}:meta; refetch or merge on trip_item_* and trip_updated |
| **Job progress** | So heavy AI flows (trip wizard, deep research) show progress | User sees job status and progress without polling | Subscription to job:{id}:status when job starts; UI shows progress; unsubscribe on done or leave |
| **Notifications (optional)** | So suggestions and booking updates are timely | User sees new suggestions or booking changes in real time | Optional subscription to user:{id}:notifications; trigger on proactive_suggestions/bookings |

---

## Screens Impacted

| Screen / Area | Impact | Realtime role |
|----------------|--------|----------------|
| **Concierge** | Chat messages update live | Subscribe to conversation:{currentConversationId}:messages when a conversation is open |
| **FloatingChatWidget** | Same as Concierge when expanded with a conversation | Same subscription as Concierge when conversation context is shared |
| **TripDetail** | Itinerary and trip header update live | Subscribe to trip:{tripId}:items and trip:{tripId}:meta |
| **Trips (list)** | Optional: trip card updates (e.g. status) if viewing list while another tab edits | Optional: subscribe per visible trip or single “user trips” topic; prefer TripDetail-first |
| **Bookings** | Optional: booking status updates live | Optional: subscribe to user:{userId}:notifications or booking-scoped topic |
| **Job progress UI** | Progress and status for heavy AI jobs | Subscribe to job:{jobId}:status when a job is started; show in modal or panel |
| **Dashboards** | No Realtime in first release | — |
| **Admin** | No Realtime in first release | — |

---

## Content, Data, Schema, Edge Functions, Workflows

| Layer | Impact |
|-------|--------|
| **Content / data** | messages, trip_items, trips, agent_jobs (and optionally proactive_suggestions, bookings) remain the source of truth; Realtime only pushes change events to subscribed clients. |
| **Schema** | New migration(s): trigger functions calling realtime.broadcast_changes (or realtime.send) for messages, trip_items, trips, agent_jobs; triggers attached to those tables; RLS and indexes on realtime.messages. No new app tables. |
| **Edge functions** | ai-chat and any function that inserts into messages get live behavior via trigger; no changes to function code. Same for any edge/worker writing trip_items, trips, or agent_jobs. |
| **Workflows / logic** | No change to business logic; only addition of triggers and client subscriptions. Job workflow continues to update agent_jobs; UI subscribes to job topic to show progress. |
| **AI agents** | No new agents; existing agents that write to the above tables implicitly drive Realtime via triggers. |

---

## Implementation Prompts (No Code)

Use these prompts to implement; keep this doc code-free. Implement in order where dependencies exist.

---

### REALTIME-P1 — Enable Realtime and configure settings

**Description:** Enable Supabase Realtime for the I Love Medellín project and align settings with a broadcast-only, private-channel strategy.

**Prompt:** Using the Supabase Dashboard and the official Realtime docs ([Realtime](https://supabase.com/docs/guides/realtime), [Getting Started](https://supabase.com/docs/guides/realtime/getting_started), [Settings](https://supabase.com/docs/guides/realtime/settings)): enable the Realtime service for the project if it is not already enabled. In Realtime Settings, set channel restrictions so that only private channels are allowed (clients must authenticate and pass RLS on realtime.messages). Review and, if needed, set database connection pool size for Realtime authorization. Document the steps or links so a maintainer can verify. Do not add code to this doc.

---

### REALTIME-P2 — Migration: Broadcast trigger for messages (chat)

**Description:** Add a database migration so that inserts, updates, and deletes on the messages table broadcast to a conversation-scoped topic.

**Prompt:** Add a Supabase migration for the I Love Medellín project. Create a trigger function that runs AFTER INSERT OR UPDATE OR DELETE on public.messages. The function must call realtime.broadcast_changes (see [Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) and [Broadcast](https://supabase.com/docs/guides/realtime/broadcast)) with a topic built from the row’s conversation_id in the form conversation:{conversation_id}:messages. Use TG_OP for the event/operation, and pass table name, schema, NEW, and OLD as required by realtime.broadcast_changes. The function must be SECURITY DEFINER and return the appropriate row. Attach the trigger to the messages table. Follow the project’s ai-realtime rule (snake_case events optional for broadcast_changes; topic pattern scope:entity:id). Do not paste code into tasks/plan/04-realtime-prompts.md.

---

### REALTIME-P3 — Migration: Broadcast triggers for trip_items and trips

**Description:** Add a migration so that changes to trip_items and trips broadcast to trip-scoped topics.

**Prompt:** Add a Supabase migration. For trip_items: create a trigger function AFTER INSERT OR UPDATE OR DELETE that calls realtime.broadcast_changes with topic trip:{trip_id}:items (derive trip_id from the row). For trips: create a trigger function AFTER UPDATE (and optionally INSERT/DELETE) that calls realtime.broadcast_changes with topic trip:{trip_id}:meta. Use TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD. SECURITY DEFINER; attach triggers to trip_items and trips. Follow the project’s ai-realtime rule and [Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes). Do not add code to 04-realtime-prompts.md.

---

### REALTIME-P4 — Migration: Broadcast trigger for agent_jobs

**Description:** Add a migration so that inserts and updates on agent_jobs broadcast to a job-scoped topic for progress and status.

**Prompt:** Add a Supabase migration. Create a trigger function AFTER INSERT OR UPDATE on public.agent_jobs that calls realtime.broadcast_changes (or realtime.send if you need a custom payload) with topic job:{job_id}:status. Emit an event name such as job_status_changed or job_progress. Ensure the payload does not expose secrets. SECURITY DEFINER; attach the trigger to agent_jobs. Follow ai-realtime rule and [Broadcast](https://supabase.com/docs/guides/realtime/broadcast). Do not add code to 04-realtime-prompts.md.

---

### REALTIME-P5 — Migration: realtime.messages RLS and indexes

**Description:** Add RLS policies on realtime.messages so only authorized users can subscribe (and optionally send) to conversation, trip, job, and user topics.

**Prompt:** Add a Supabase migration that defines RLS on realtime.messages for I Love Medellín. SELECT: allow authenticated users to SELECT only when the topic corresponds to a resource they can access—conversation:* (user is participant of that conversation, using conversations table), trip:* (user owns or is collaborator on that trip), job:* (user is the job owner per agent_jobs), user:* (topic is user:{auth.uid()}:*). Use realtime.topic() or equivalent and existing tables; keep predicates index-friendly. INSERT: if the app will send client-originated broadcasts (e.g. typing), allow INSERT for the same conversation and trip topics the user can read. Add indexes on columns used in these policies. Follow [Authorization](https://supabase.com/docs/guides/realtime/authorization). Do not add code to 04-realtime-prompts.md.

---

### REALTIME-P6 — Frontend: Chat Realtime subscription (Concierge, FloatingChatWidget)

**Description:** Subscribe to the active conversation’s channel and update the chat UI when new messages arrive.

**Prompt:** Implement a Realtime subscription for the Concierge and FloatingChatWidget chat in I Love Medellín. When the user has a current conversation open, subscribe to a private channel with topic conversation:{conversationId}:messages and config private true. Call setAuth before subscribing as in [Getting Started](https://supabase.com/docs/guides/realtime/getting_started) and [Authorization](https://supabase.com/docs/guides/realtime/authorization). Listen for broadcast events (INSERT/UPDATE/DELETE or message_created/updated/deleted per your trigger) and update the message list or refetch so new messages appear without refresh. Use a ref to hold the channel; avoid duplicate subscriptions; unsubscribe and remove the channel on unmount or when conversationId changes. Follow the project’s React and Supabase patterns and ai-realtime rule. Do not add code to 04-realtime-prompts.md.

---

### REALTIME-P7 — Frontend: Trip Realtime subscription (TripDetail, optional Trips list)

**Description:** Subscribe to the open trip’s channels and refresh itinerary and trip header when trip_items or trip meta change.

**Prompt:** Implement a Realtime subscription for the trip detail screen (and optionally the trips list) in I Love Medellín. When the user is viewing a trip, subscribe to private channels trip:{tripId}:items and optionally trip:{tripId}:meta with config private true. Call setAuth before subscribing. On broadcast events for trip_item and trip changes, refresh trip data or merge the change into local state so the itinerary and trip header update in real time. Use a ref for the channel; avoid duplicate subscriptions; unsubscribe and remove channels on unmount or when tripId changes. Follow [Broadcast](https://supabase.com/docs/guides/realtime/broadcast) and ai-realtime rule. Do not add code to 04-realtime-prompts.md.

---

### REALTIME-P8 — Frontend: AI job progress Realtime subscription

**Description:** When a heavy AI job is started, subscribe to its job topic and show progress until completion or leave.

**Prompt:** Implement a Realtime subscription for heavy AI jobs (e.g. trip wizard, deep research) in I Love Medellín. When the app starts such a job and receives a job id, subscribe to the private channel job:{jobId}:status with config private true. Call setAuth before subscribing. On job_status_changed or job_progress events, update the UI to show progress or completion. Unsubscribe and remove the channel when the job completes, fails, or the user navigates away. Use a ref and cleanup on unmount. Follow [Broadcast](https://supabase.com/docs/guides/realtime/broadcast) and ai-realtime rule. Do not add code to 04-realtime-prompts.md.

---

### REALTIME-P9 — Optional: User notifications channel (proactive_suggestions, bookings)

**Description:** Optional user-scoped Realtime channel for new suggestions and booking updates.

**Prompt:** (Optional.) Add Realtime for user-scoped notifications in I Love Medellín. In the database, add a trigger on proactive_suggestions (and optionally bookings) that broadcasts to topic user:{user_id}:notifications with events such as suggestion_created and booking_status_changed. Add RLS on realtime.messages so users can SELECT only for topic user:{auth.uid()}:*. In the frontend, on a dashboard or notifications page, subscribe to user:{userId}:notifications and show new suggestions or booking updates in real time. Use private channel, setAuth, and cleanup on unmount. Follow [Authorization](https://supabase.com/docs/guides/realtime/authorization) and ai-realtime rule. Do not add code to 04-realtime-prompts.md.

---

### REALTIME-P10 — Verification and reports

**Description:** Verify subscriptions and use Supabase Realtime reports to monitor usage.

**Prompt:** Document a short verification flow for I Love Medellín Realtime: send a message in Concierge and confirm it appears in another client or tab without refresh; update a trip item and confirm TripDetail updates; run a heavy job and confirm progress updates. Reference [Realtime Reports](https://supabase.com/docs/guides/realtime/reports) and list which reports to check (connected clients, broadcast events, RLS execution time if using private channels). Do not add code to 04-realtime-prompts.md.

---

## Dashboards, Chatbots, Content, Agents, Workflows — Summary

| Area | Realtime role | Prompt(s) |
|------|----------------|-----------|
| **Dashboards** | No Realtime in first release | — |
| **Chatbots (Concierge, FloatingChat)** | Live messages; optional typing later via Presence | REALTIME-P2, REALTIME-P5, REALTIME-P6 |
| **Content / data** | messages, trip_items, trips, agent_jobs drive broadcasts via triggers | REALTIME-P2–P5 |
| **AI agents / edge functions** | No code change; existing writes trigger broadcasts | — |
| **Workflows / logic** | No change; triggers and subscriptions only | REALTIME-P6–P8 |
| **Schema** | New trigger functions, triggers, realtime.messages RLS + indexes | REALTIME-P2–P5 |

---

## References (Links Only)

- [Realtime Overview](https://supabase.com/docs/guides/realtime)
- [Getting Started with Realtime](https://supabase.com/docs/guides/realtime/getting_started)
- [Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Presence](https://supabase.com/docs/guides/realtime/presence)
- [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Settings](https://supabase.com/docs/guides/realtime/settings)
- [Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Realtime Reports](https://supabase.com/docs/guides/realtime/reports)
- [Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)

Project strategy: `tasks/plan/03-ai-realtime.md`.  
Project rule: `.cursor/rules/supabase/ai-realtime.md`.
