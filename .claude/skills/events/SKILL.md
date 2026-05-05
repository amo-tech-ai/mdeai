---
name: events
description: End-to-end event production — brief, plan, market, host, and measure. Use when running, organizing, or marketing any event (conference, webinar, pageant, festival, meetup, workshop, restaurant week, demo night, fireside chat). Covers brief frameworks, 12mo→day-of logistics timelines, marketing playbooks (EPIC checklist, ROI attribution), Luma/Eventbrite hosting tactics, Google Workspace ops (calendar/gmail/drive/chat/sheets), vendor coordination, AV checklists, run-of-show templates, attendee comms, and post-event evaluation. Triggers on "host an event", "run a conference", "plan a meetup", "event brief", "event budget", "event ROI", "event vendor", "Luma event", "webinar", "trade show", "pageant", "festival", "field marketing", "speaker prep", "post-event survey", "event coordinator", "schedule event", "send invitations", or any "I have an event coming up" prompt. Replaces the prior split into event-briefs / event-hosting / event-marketer / event-planner / persona-event-coordinator. Use event-prospecting (separate) for B2B sales lead-gen at conferences — that's a different workflow.
---

# Events — full lifecycle

End-to-end event production: from kickoff brief through post-event ROI. Four phases, four reference files, one entry point.

## When to use

- Founder hosting a meetup, demo night, workshop, fireside chat, or community event
- Producing a flagship event (conference, festival, pageant) for clients or organization
- Running a webinar, virtual summit, or hybrid event
- Sponsoring or attending a trade show, user conference, or industry event
- Building event marketing campaigns (registration, attendance, follow-up, ROI)
- Coordinating vendors (venue, catering, AV, photography, transport, security)
- Planning multi-event series or recurring formats

## When NOT to use

- **B2B sales prep at someone else's event** → use `event-prospecting` instead (Browserbase scrapes speaker lists, ICP-fits the companies, builds a target list — completely different workflow)
- **Pure marketing strategy unrelated to events** → use `marketing-strategy` (if installed) or general PRD/roadmap skills
- **Pure logistics for non-event projects (offsites, retreats with no public attendees)** → adjust the planner reference but skip the marketing parts

## Four phases — pick where you are

Each phase has its own reference file with deep content. Load only the one you need:

| Phase | Goal | Read |
|---|---|---|
| **1. Brief** | Align stakeholders on goal, audience, tier, narrative, measurement before you spend a peso | [`references/briefs.md`](references/briefs.md) |
| **2. Plan** | Build the timeline (12mo → day-of), book vendors, design the run-of-show, manage attendees · also includes Google Workspace ops mapping | [`references/planner.md`](references/planner.md) |
| **3. Market** | Fill seats, drive engagement, capture leads, build the post-event ROI narrative | [`references/marketer.md`](references/marketer.md) |
| **4. Host** | Tactical Luma/Eventbrite execution for small founder-led events (≤200 people) | [`references/hosting.md`](references/hosting.md) |

**Skills this consolidates** — the prior 5 separate event-* skills folded into this one:

| Old skill | New location |
|---|---|
| `event-briefs` | [`references/briefs.md`](references/briefs.md) |
| `event-planner` | [`references/planner.md`](references/planner.md) |
| `event-marketer` | [`references/marketer.md`](references/marketer.md) |
| `event-hosting` | [`references/hosting.md`](references/hosting.md) |
| `persona-event-coordinator` (Google Workspace shim) | [`references/planner.md`](references/planner.md) §Tool integrations |

`event-prospecting` stays separate — different actor (B2B sales rep), different workflow (Browserbase + bb CLI for ICP-fit speaker scraping).

For mdeai-specific event work (events that host contests + sponsors), see [`tasks/events/09-prd.md`](../../../tasks/events/09-prd.md) and [`tasks/events/diagrams/`](../../../tasks/events/diagrams/) — the platform's events module.

## The single most important question

Before phase 1, the founder/organizer must answer in one sentence:

> **What does success for this event look like, in observable terms, by [date]?**

Examples that pass:
- "200 paid GA tickets sold + ≥75% show-rate at the door."
- "12 booked sales meetings with target ICP companies."
- "MQL-to-SQL pipeline value of $500k attributed to this event."
- "Reina de Antioquia 2026 reaches 25k votes with 0 fraud incidents."

Examples that fail (too vague to plan against):
- "Build community."
- "Get the brand out there."
- "Make it memorable."

If the answer is fuzzy, stop and resolve in [`references/briefs.md`](references/briefs.md) before moving on.

## Universal phase rule

> Each phase outputs ONE concrete artifact. Don't enter the next phase without it.

| Phase | Output artifact |
|---|---|
| Brief | A 1-page brief PDF with goal + audience + measurement plan |
| Plan | A 12-month timeline + a vendor tracker + a day-of run sheet |
| Market | A promotion timeline + a registration page + a follow-up sequence |
| Host | A live event with a recap (PDF + 3 social posts) within 7 days |

## Quick frameworks (the ones used most)

### Event type selection (see planner.md for full matrix)

| Format | Best for | Cost | Time |
|---|---|---|---|
| Fireside chat | Thought leadership | Low | Low |
| Workshop | Lead gen + product education | Low–Med | Med |
| Demo night | Product community | Med | Med |
| Hackathon | Developer engagement | Med–High | High |
| Conference (sponsor) | Brand + pipeline | $50k–500k | 3–6mo |
| User conference | Retention + expansion | $100k–1M+ | 6–12mo |
| Pageant / contest | Audience + sponsor revenue | Med–High | 1–3mo |
| Restaurant week | Local market activation | Low | 1mo |
| Field dinner | Executive ABM | Med | 1mo |

### EPIC marketing checklist (see marketer.md)

- **E** — Execute pre-event (promotion, registration, nurture)
- **P** — Perform at event (staff, capture, engagement)
- **I** — Implement follow-up (scoring, sequences, meetings)
- **C** — Calculate ROI (attribution, pipeline, learnings)

### Day-of run sheet header (see planner.md)

```
TIME    | ACTIVITY    | OWNER    | LOCATION    | NOTES
06:00   | Setup       | Mgr      | Main Hall   |
07:00   | AV check    | AV Lead  | Stage       |
…
```

### The 40% rule (see hosting.md)

Free events: expect **40–60% of RSVPs to attend**. Paid events: 80–90%. Plan capacity accordingly (overbook free events, hold close to plan for paid).

## Working with mdeai's events platform

When the event is being built INTO mdeai.co (events host contests host sponsors), use this skill alongside:

- [`real-estate-mdeai`](../real-estate-mdeai/SKILL.md) — domain context if the event is venue-based
- [`mde-writing-plans`](../mde-writing-plans/SKILL.md) — for the public Trust page + organizer brief
- [`twilio-whatsapp`](../twilio-whatsapp/SKILL.md) — for ticket-confirmation + event-day attendance pings
- [`mermaid-diagrams`](../mermaid-diagrams/SKILL.md) — for the run-of-show diagram and ticket-flow sequences
- [`prd`](../prd/SKILL.md) — for the per-event scope doc

For Phase 1 of mdeai's events platform (Miss Elegance Colombia 2026, free voting), the brief and planner phases use this skill; marketing is deferred to Phase 2 (per `tasks/events/08-plan-audit-response.md`).

## Output format

Always produce **one of these four** as the deliverable:

| Phase | Deliverable shape |
|---|---|
| Brief | Markdown event brief (overview / narrative / experience / promotion / operations / measurement) |
| Plan | Timeline checklist + vendor tracker + run sheet (markdown tables) |
| Market | Promotion timeline + email sequence drafts + ROI dashboard spec |
| Host | Luma event page copy + run-of-show + follow-up plan |

Don't return raw bullet lists without one of these four containers.

## Anti-patterns

- **Skipping phase 1** — going straight to logistics without a brief. Result: vendor decisions made against the wrong audience.
- **Treating marketing as an afterthought** — promotion plan written 2 weeks before the event. Result: empty seats, blamed venue.
- **Spray-and-pray sponsorship** — sponsoring every event without ICP alignment. Result: high CAC, low pipeline.
- **Badge-scanning obsession** — measuring attendance instead of pipeline. Result: vanity metrics in the recap.
- **No follow-up** — leads die in a spreadsheet. The event ends when the deal closes, not when the doors close.
- **Same booth everywhere** — not adapting presence to event audience. Result: brand fatigue.
- **One-and-done** — missing the compound effect of consistent presence. Series > one-offs.

## Examples

**Prompt:** "Help me create a Luma event for a monthly AI founders meetup in SF for 50 attendees."

**Right move:** Load `references/hosting.md` (Luma-specific). Output: event page copy + run-of-show + promotion plan + follow-up template. Skip the conference-scale marketer.md.

**Prompt:** "We're sponsoring a $80k booth at SaaStr next quarter. Plan our presence."

**Right move:** Load `references/marketer.md` (conference sponsorship budget split, EPIC checklist) + `references/planner.md` (vendor + AV checklist). Output: budget allocation + booth plan + speaker prep + follow-up sequence + ROI dashboard.

**Prompt:** "Run a beauty pageant on mdeai.co with 30 contestants and 5 judges."

**Right move:** Load `references/briefs.md` first (the goal + audience + measurement question is critical for pageants given fraud risk). Then `references/planner.md` for contestant intake + judge logistics. Cross-link to mdeai's `tasks/events/01-contests.md` for the platform-side voting engine.

**Prompt:** "Plan a 3-day music festival with 10k attendees and 4 embedded contests."

**Right move:** Load all four references in sequence. This is the largest scope — full lifecycle. Output is multi-doc: brief, master plan, marketing campaign, day-of run sheets per stage.

## See also

- [`event-prospecting`](../event-prospecting/SKILL.md) — B2B sales prep at conferences (different actor, different workflow — kept separate)
- [`prd`](../prd/SKILL.md) — for per-event PRDs
- [`mermaid-diagrams`](../mermaid-diagrams/SKILL.md) — for run-of-show + flow diagrams
- [`tasks/events/`](../../../tasks/events/) — mdeai's events platform implementation
