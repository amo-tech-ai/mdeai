# 10 — AI Agent Strategy Dashboard (Sun AI)

Dashboard for monitoring the trio of AI agents: OpenClaw, Hermes, Paperclip.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  mdeai.co  ADMIN                                                     [avatar] Admin  ☰     │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌──────────────┐                                                                          │
│  │ ADMIN NAV    │  ☀ Sun AI — Real Estate Operations                                      │
│  │              │                                                                          │
│  │ 📊 Dashboard │  Monitoring the agent trio powering mdeai.co rental intelligence         │
│  │ 🏠 Apartments│                                                                          │
│  │ 🍽 Restaurants│  ┌─────────────────┐┌─────────────────┐┌────────────────┐┌─────────────┐ │
│  │ 🎉 Events    │  │ ACTIVE AGENTS   ││ TASKS TODAY     ││ BUDGET USED   ││ LEADS       │ │
│  │ 🚗 Cars      │  │                 ││                 ││               ││ GENERATED   │ │
│  │ 👥 Users     │  │    3 / 3        ││     47          ││  $12.40       ││    18       │ │
│  │              │  │                 ││                 ││               ││             │ │
│  │ ─────────── │  │  🟢 All Online   ││  ▲ 12 vs yday  ││  of $50/day   ││  ▲ 6 today  │ │
│  │ ☀ Sun AI    │◀ │                 ││                 ││  ████████░░   ││             │ │
│  │ ⚙ Settings  │  └─────────────────┘└─────────────────┘└────────────────┘└─────────────┘ │
│  └──────────────┘                                                                          │
│                    ──────────────────────────────────────────────────────────────────────── │
│                                                                                             │
│                    AGENT STATUS                                                             │
│                    ┌──────────────────────────────────────────────────────────────────────┐ │
│                    │                                                                      │ │
│                    │  NAME        │ ROLE          │ ADAPTER  │STATUS│ HEARTBEAT │ BUDGET   │ │
│                    │  ────────────┼───────────────┼──────────┼──────┼───────────┼────────  │ │
│                    │              │               │          │      │           │          │ │
│                    │  🦅 OpenClaw  │ Customer AI   │ Gemini   │ 🟢   │ 12s ago   │          │ │
│                    │              │ (Chat, Search │ Flash    │ ON   │           │ $4.20    │ │
│                    │              │  Discovery)   │          │      │           │ ████░░░  │ │
│                    │              │               │          │      │           │ 42%      │ │
│                    │  ────────────┼───────────────┼──────────┼──────┼───────────┼────────  │ │
│                    │              │               │          │      │           │          │ │
│                    │  🪶 Hermes    │ Operations AI │ Gemini   │ 🟢   │ 8s ago    │          │ │
│                    │              │ (Listings,    │ Pro      │ ON   │           │ $6.80    │ │
│                    │              │  Matching,    │          │      │           │ ██████░  │ │
│                    │              │  Pricing)     │          │      │           │ 68%      │ │
│                    │  ────────────┼───────────────┼──────────┼──────┼───────────┼────────  │ │
│                    │              │               │          │      │           │          │ │
│                    │  📎 Paperclip│ CEO / Orchestr│ Gemini   │ 🟢   │ 30s ago   │          │ │
│                    │              │ (Governance,  │ Pro      │ ON   │           │ $1.40    │ │
│                    │              │  Budget, QA)  │          │      │           │ █░░░░░░  │ │
│                    │              │               │          │      │           │ 14%      │ │
│                    │              │               │          │      │           │          │ │
│                    └──────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
│                    ──────────────────────────────────────────────────────────────────────── │
│                                                                                             │
│                    ┌───────────────────────────────────┬──────────────────────────────────┐ │
│                    │ TASK BOARD                        │ COST CHART (7 DAYS)              │ │
│                    │                                   │                                  │ │
│                    │ Backlog │ In Prog │ Review │ Done │ │                                  │ │
│                    │         │         │        │      │ │  $15 │                            │ │
│                    │ ┌─────┐ │ ┌─────┐ │ ┌────┐ │┌───┐│ │       │       ┌─┐                │ │
│                    │ │Match│ │ │Index│ │ │Pric│ ││Upd││ │  $12 │    ┌─┐│ │                │ │
│                    │ │new  │ │ │list-│ │ │ing │ ││ate││ │       │    │ ││ │   ┌─┐         │ │
│                    │ │list-│ │ │ings │ │ │anal│ ││SEO││ │  $9  │ ┌─┐│ ││ │┌─┐│ │         │ │
│                    │ │ings │ │ │for  │ │ │ysis│ ││   ││ │       │ │ ││ ││ ││ ││ │┌─┐      │ │
│                    │ │to   │ │ │sear-│ │ │for │ ││   ││ │  $6  │ │ ││ ││ ││ ││ ││ │      │ │
│                    │ │users│ │ │ch   │ │ │Pobl│ ││   ││ │       │ │ ││ ││ ││ ││ ││ │      │ │
│                    │ │     │ │ │     │ │ │ado │ ││   ││ │  $3  │ │ ││ ││ ││ ││ ││ │      │ │
│                    │ │ 🪶  │ │ │ 🪶  │ │ │ 🪶 │ ││ 🪶││ │       ├─┴─┴┴─┴┴─┴┴─┴┴─┴┴─┴──── │ │
│                    │ └─────┘ │ └─────┘ │ └────┘ │└───┘│ │       Mon Tue Wed Thu Fri Sat   │ │
│                    │         │         │        │      │ │                         Sun     │ │
│                    │ ┌─────┐ │ ┌─────┐ │        │┌───┐│ │                                  │ │
│                    │ │Send │ │ │Sched│ │        ││Pro-││ │  Legend:                         │ │
│                    │ │remi-│ │ │ule  │ │        ││cess││ │  ███ OpenClaw                    │ │
│                    │ │nder │ │ │show-│ │        ││app-││ │  ░░░ Hermes                      │ │
│                    │ │WhApp│ │ │ings │ │        ││lica││ │  ─── Paperclip                   │ │
│                    │ │     │ │ │     │ │        ││tion││ │                                  │ │
│                    │ │ 🦅  │ │ │ 🦅  │ │        ││ 📎││ │                                  │ │
│                    │ └─────┘ │ └─────┘ │        │└───┘│ │                                  │ │
│                    │         │         │        │      │ │                                  │ │
│                    │ ┌─────┐ │         │        │┌───┐│ │                                  │ │
│                    │ │Audit│ │         │        ││Reso││ │                                  │ │
│                    │ │budg-│ │         │        ││lve ││ │                                  │ │
│                    │ │et   │ │         │        ││dup ││ │                                  │ │
│                    │ │usage│ │         │        ││list││ │                                  │ │
│                    │ │     │ │         │        ││    ││ │                                  │ │
│                    │ │ 📎  │ │         │        ││ 🪶 ││ │                                  │ │
│                    │ └─────┘ │         │        │└───┘│ │                                  │ │
│                    │         │         │        │      │ │                                  │ │
│                    └───────────────────────────────────┴──────────────────────────────────┘ │
│                                                                                             │
│                    ──────────────────────────────────────────────────────────────────────── │
│                                                                                             │
│                    RECENT ACTIVITY                                                          │
│                    ┌──────────────────────────────────────────────────────────────────────┐ │
│                    │                                                                      │ │
│                    │  TIME      │ AGENT      │ ACTION                        │ STATUS     │ │
│                    │  ──────────┼────────────┼───────────────────────────────┼──────────  │ │
│                    │  14:32:10  │ 🦅 OpenClaw │ Processed rental inquiry      │ ✅ Success │ │
│                    │            │            │ from WhatsApp (John D.)       │ 0.8s      │ │
│                    │  14:31:45  │ 🪶 Hermes   │ Indexed 3 new listings        │ ✅ Success │ │
│                    │            │            │ (Poblado, Laureles)           │ 2.1s      │ │
│                    │  14:30:22  │ 📎 Paperclip│ Budget check — 24.8% of      │ ✅ Pass    │ │
│                    │            │            │ daily limit used              │ 0.2s      │ │
│                    │  14:28:15  │ 🦅 OpenClaw │ Matched user criteria to      │ ✅ Success │ │
│                    │            │            │ 12 listings (Ana R.)          │ 1.4s      │ │
│                    │  14:25:00  │ 🪶 Hermes   │ Generated price comparison    │ ✅ Success │ │
│                    │            │            │ for Poblado 2BR market        │ 3.2s      │ │
│                    │  14:20:33  │ 📎 Paperclip│ Approved Hermes task:         │ ✅ Approved│ │
│                    │            │            │ "pricing analysis Envigado"   │ 0.1s      │ │
│                    │  14:15:10  │ 🦅 OpenClaw │ Showing scheduled via chat    │ ✅ Success │ │
│                    │            │            │ (Modern Loft, Thu 2PM)        │ 1.1s      │ │
│                    │  14:10:00  │ 🪶 Hermes   │ Detected duplicate listing    │ ⚠ Warning │ │
│                    │            │            │ (IDs: 42, 87) — flagged       │ 0.5s      │ │
│                    │                                                                      │ │
│                    │  [Load More ▾]                                                       │ │
│                    └──────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Agent Trio Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     📎 PAPERCLIP (CEO)                       │
│                     Orchestrator / Governor                   │
│                     Budget enforcement, QA,                   │
│                     task approval, auditing                   │
│                          │                                    │
│              ┌───────────┴───────────┐                       │
│              │                       │                        │
│        🦅 OPENCLAW              🪶 HERMES                    │
│        Customer-facing          Operations                    │
│        Chat, search,            Listings, matching,           │
│        discovery,               pricing, indexing,            │
│        WhatsApp, showings       dedup, SEO                   │
└──────────────────────────────────────────────────────────────┘
```

## Annotations

| Element | Component | Interaction |
|---------|-----------|-------------|
| KPI cards | Four `<Card>` components | Active agents, tasks completed, budget spent, leads generated |
| Agent status table | `<Table>` | Name, role, adapter (model), status indicator, heartbeat timer, budget bar |
| Heartbeat timer | Live counter | Shows seconds since last heartbeat. Turns yellow >60s, red >300s |
| Budget bar | `<Progress>` | Per-agent daily budget usage. Color changes at thresholds |
| Task board | Kanban-style columns | Backlog, In Progress, In Review, Done. Cards show task + agent icon |
| Task cards | Draggable `<Card>` items | Shows task title, assigned agent icon. Click opens task detail |
| Cost chart | Stacked bar chart (recharts) | Daily spend broken down by agent. 7-day rolling window |
| Activity feed | `<Table>` with timestamps | Real-time feed of agent actions. Status icons for success/warning/error |
| "Load More" | `<Button variant="ghost">` | Loads older activity entries (paginated) |

## Data Sources

- Agent status: `ai_runs` table, grouped by `agent_name`, latest heartbeat from most recent run
- Task board: `agent_jobs` table with status column (backlog, in_progress, in_review, done)
- Cost tracking: `ai_runs` table, `input_tokens` + `output_tokens` converted to cost per model
- Activity feed: `ai_runs` table, ordered by `created_at` DESC
- Budget limits: configured per agent in `ai_context` table or env vars

## Cost Calculation

```
Gemini Flash:  $0.10 / 1M input tokens,  $0.40 / 1M output tokens
Gemini Pro:    $1.25 / 1M input tokens,  $5.00 / 1M output tokens
Gemini Lite:   $0.075/ 1M input tokens,  $0.30 / 1M output tokens

Daily budget default: $50 total ($20 OpenClaw, $20 Hermes, $10 Paperclip)
```

## Real-time Updates

- Agent heartbeats via Supabase Realtime subscription on `ai_runs` table
- Task board updates via Realtime on `agent_jobs` table
- Activity feed auto-refreshes via polling (every 10s) or Realtime
- Budget bars recalculate on each new `ai_runs` insert
