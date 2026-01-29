# ILM — Automations & Rules Engine: Generate Prompts

**Document:** Implementation prompts for rules engine, notifications, and notification center. No code in prompts.  
**Reference:** `tasks/plan/0-progress-tracker.md` (12.1–12.10) · `tasks/plan/00-generate-prompts-template.md`  
**Last Updated:** 2026-01-28  

---

## Summary Table

| Dimension | Items |
|-----------|--------|
| **Screens** | Dashboard (optional), Notification center (inbox), TripDetail, Bookings. |
| **Features** | Rules engine (time/condition/event triggers), trip/empty-day/budget/event alerts, notification center. |
| **Agents** | Edge functions or cron jobs that evaluate rules and write proactive_suggestions; optional ai-suggestions. |
| **Use cases** | System suggests “You have an empty day” when trip has a day with no items; user sees new suggestions in notification center. |
| **Real-world examples** | User has a trip with day 2 empty → rule runs → proactive_suggestions row created → user sees “Fill day 2” in notification center. |

---

## Description

Implement a rules engine (or equivalent) that evaluates time-based, condition-based, or event-based rules and creates proactive_suggestions (or similar) for the user. Expose notifications in a notification center (inbox) so the user can see and act on suggestions. Rules can include: empty day in trip, budget threshold, event reminder, booking status change. Out of scope: complex workflow engine; first release can be cron plus edge function that evaluates rules and inserts into proactive_suggestions.

---

## Rationale

proactive_suggestions table exists but there is no job or UI that populates or displays it. A rules engine (or simple cron + edge function) increases engagement and helps users complete trips. Notification center gives a single place to see suggestions and booking updates.

---

## User Stories

| Story | Purpose | Goal | Outcome |
|-------|---------|------|---------|
| **Rules evaluation** | So the system can suggest actions based on data | A scheduled job or trigger evaluates rules (e.g. empty day, budget) and creates suggestions | Rows in proactive_suggestions (or equivalent) for the user. |
| **Notification center** | So the user sees suggestions and updates in one place | User opens notification center and sees new suggestions and booking updates | List of notifications with links to trip or booking. |
| **Trip/empty-day alert** | So the user is prompted to fill gaps | When a trip has a day with no items, a suggestion is created | User sees “You have an empty day” and can open trip. |
| **Booking status** | So the user sees booking confirmations or changes | When a booking is confirmed or updated, user sees it in notification center | Notification links to booking or trip. |

---

## Acceptance Criteria

- A job or edge function runs on a schedule (or on event) and evaluates at least one rule (e.g. empty day in trip); it creates rows in proactive_suggestions (or equivalent) for the affected user.
- Notification center (or inbox) exists and lists the user’s recent suggestions and optionally booking updates.
- User can open a notification and navigate to the related trip or booking.
- No code in this doc.

---

## Key Points

- Rules engine can be minimal: one edge function invoked by cron (Supabase cron or external) that queries trips/trip_items/bookings and inserts into proactive_suggestions.
- Notification center can be a new page or a panel in the dashboard; it reads proactive_suggestions (and optionally bookings) for the current user.
- Realtime on user topic (user:uuid:notifications) can push new notifications; optional for first release.

---

## Three-Panel Layout (Core Model)

| Panel | Role | Content |
|-------|------|---------|
| **Left = Context** | Nav, filters | Sidebar; optional filter by type (suggestions, bookings). |
| **Main = Work** | Notification list | List of notifications with title, summary, link to trip or booking. |
| **Right = Intelligence** | Optional: quick action | Optional: “Add to trip” or “Dismiss” from notification. |

---

## Frontend / Backend Wiring Plan

| Layer | Responsibility |
|-------|-----------------|
| **Frontend** | Notification center page or panel: fetch proactive_suggestions (and optionally bookings) for user; render list; link to trip or booking. |
| **Backend** | Edge function (or cron-triggered function) that evaluates rules, queries trips/trip_items/bookings, and inserts into proactive_suggestions. |
| **Wiring** | Cron invokes edge function → function evaluates rules → inserts suggestions; user opens notification center → frontend fetches suggestions → displays list. |

---

## Supabase Schema

| Area | Relevance |
|------|------------|
| **Tables** | proactive_suggestions (primary for suggestions); trips, trip_items, bookings for rule input. |
| **RLS** | User can read only their own proactive_suggestions; rule job runs as service role or with elevated context. |
| **Triggers / Realtime** | Optional: trigger on proactive_suggestions that broadcasts to user:uuid:notifications for live notification center. |

---

## Edge Functions

| Function | Role | When invoked |
|----------|------|--------------|
| New or existing rules/suggestions function | Evaluate rules (empty day, budget, etc.) and insert proactive_suggestions | Cron (e.g. daily or on schedule). |
| Optional: webhook or trigger | Evaluate on event (e.g. booking created) | On booking insert or update. |

---

## Dependencies

- proactive_suggestions table exists and has user_id, type, trip_id or booking_id, message, read flag.
- Cron or scheduler (Supabase cron or external) to invoke the rules function.
- Auth so notification center fetches only current user’s suggestions.

---

## Gemini 3 / Claude SDK / AI Agents

| Item | Use |
|------|-----|
| **Agents** | Optional: ai-suggestions can generate richer suggestion text; rules engine can call it or use static messages first. |

---

## AI Agents, Automations, Wizards, Workflows

- **Automations:** Rules engine is the automation; it runs on schedule or event and creates suggestions.
- **Workflows:** User sees suggestion → clicks → lands on trip or booking; optional “Dismiss” or “Add to trip.”

---

## Implementation Prompts (No Code)

Do not add code to this doc.

---

### AUT-P1 — Rules evaluation job (edge function + cron)

**Description:** Implement a job that evaluates rules and creates proactive_suggestions.

**Prompt:** For I Love Medellín, implement an edge function (or use an existing one) that evaluates at least one rule: for example, find trips that have at least one day with no trip_items and create a row in proactive_suggestions for the trip owner with a message like “You have an empty day in [trip title]” and a link to the trip. The function should be invokable by a cron job (Supabase cron or external scheduler). It should run with sufficient privileges to read trips and trip_items and insert into proactive_suggestions. Do not paste code into tasks/plan/09-automations-prompts.md.

---

### AUT-P2 — Notification center page

**Description:** Add a notification center (inbox) that lists the user’s suggestions.

**Prompt:** For I Love Medellín, add a notification center page or panel that fetches the current user’s proactive_suggestions (and optionally recent booking updates). Display them in a list with title, summary, and a link to the related trip or booking. Use existing auth so only the current user’s suggestions are shown. Add a route (e.g. slash notifications or slash inbox) and a link in the sidebar or header. Do not paste code into tasks/plan/09-automations-prompts.md.

---

### AUT-P3 — Optional: Realtime for new notifications

**Description:** Optional: push new notifications to the user via Realtime.

**Prompt:** (Optional.) For I Love Medellín, if Realtime user topic (user:uuid:notifications) is implemented, subscribe to it in the notification center (or in the app shell). When a new suggestion is created for the user, broadcast to that topic so the notification center can update in real time without refresh. Follow the project’s Realtime rules (private channel, setAuth, cleanup). Do not paste code into tasks/plan/09-automations-prompts.md.
