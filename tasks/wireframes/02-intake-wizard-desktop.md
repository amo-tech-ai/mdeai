# 02 — Rentals Intake Wizard (Desktop)

Three-panel layout. Left=progress+criteria, Main=conversational UI, Right=map+budget viz.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  mdeai.co            Explore   Rentals   Coffee   Experiences        [avatar] John  ☰      │
├──────────────────┬──────────────────────────────────────────────┬────────────────────────────┤
│ LEFT PANEL       │ MAIN PANEL                                   │ RIGHT PANEL               │
│ (260px)          │ (flex-1)                                     │ (340px)                   │
│                  │                                              │                           │
│ ┌──────────────┐ │                                              │ ┌───────────────────────┐ │
│ │ FIND YOUR    │ │                                              │ │                       │ │
│ │ PERFECT      │ │                                              │ │   NEIGHBORHOOD MAP    │ │
│ │ RENTAL       │ │                                              │ │                       │ │
│ └──────────────┘ │                                              │ │  ┌─────┐              │ │
│                  │                                              │ │  │Laure│  ┌────────┐  │ │
│ PROGRESS         │                                              │ │  │les  │  │Poblado │  │ │
│                  │                                              │ │  └─────┘  │ ██████ │  │ │
│ ● Budget         │  ┌──────────────────────────────────────┐    │ │           └────────┘  │ │
│ ● Neighborhood   │  │  🤖 AI CONCIERGE                     │    │ │                       │ │
│ ○ Size           │  │                                      │    │ │  Highlighted areas    │ │
│ ○ Amenities      │  │  Hey John! I'm your Medellín         │    │ │  match your criteria  │ │
│ ○ Timeline       │  │  rental concierge. Let's find your   │    │ │                       │ │
│ ─ ─ ─ ─ ─ ─ ─   │  │  perfect place. First — what's your  │    │ └───────────────────────┘ │
│ ○ Pets (opt)     │  │  monthly budget range?               │    │                           │
│ ○ Parking (opt)  │  │                                      │    │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ ○ Lifestyle(opt) │  └──────────────────────────────────────┘    │                           │
│                  │                                              │ BUDGET RANGE              │
│ ● = completed    │       ┌──────────┐ ┌──────────┐             │ ┌───────────────────────┐ │
│ ○ = upcoming     │       │ $500-800 │ │ $800-1200│             │ │                       │ │
│                  │       └──────────┘ └──────────┘             │ │  $400  $800    $1500  │ │
│ ──────────────── │       ┌───────────┐ ┌──────────┐            │ │   │     ████████│     │ │
│                  │       │ $1200-1800│ │ $1800+   │            │ │   │     ▲       ▲     │ │
│ COLLECTED        │       └───────────┘ └──────────┘            │ │   min   $800  $1200  │ │
│ CRITERIA         │                                              │ │                       │ │
│                  │  ┌──────────────────────────────────────┐    │ │  Avg in Poblado:      │ │
│ ┌──────────────┐ │  │  👤 YOU                               │    │ │  $950/mo (2BR)        │ │
│ │ (empty —     │ │  │                                      │    │ │                       │ │
│ │  fills as    │ │  │  $800 to $1200 per month             │    │ │  Avg in Laureles:     │ │
│ │  user        │ │  │                                      │    │ │  $720/mo (2BR)        │ │
│ │  answers)    │ │  └──────────────────────────────────────┘    │ └───────────────────────┘ │
│ │              │ │                                              │                           │
│ │ After step 1:│ │  ┌──────────────────────────────────────┐    │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ │              │ │  │  🤖 AI CONCIERGE                     │    │                           │
│ │ ┌──────────┐ │ │  │                                      │    │ MATCHING LISTINGS         │
│ │ │💰$800-1.2k│ │ │  │  Great range! That opens up most    │    │ ┌───────────────────────┐ │
│ │ └──────────┘ │ │  │  neighborhoods. Where would you      │    │ │                       │ │
│ │              │ │  │  like to live? I can help with pros   │    │ │  Updates in real-time  │ │
│ │ After step 2:│ │  │  & cons of each area.                │    │ │  as criteria are       │ │
│ │              │ │  │                                      │    │ │  collected.            │ │
│ │ ┌──────────┐ │ │  └──────────────────────────────────────┘    │ │                       │ │
│ │ │💰$800-1.2k│ │ │                                              │ │  "147 listings match"  │ │
│ │ └──────────┘ │ │       ┌──────────┐ ┌──────────┐             │ │                       │ │
│ │ ┌──────────┐ │ │       │ Poblado  │ │ Laureles │             │ │  → narrows with each   │ │
│ │ │📍Poblado  │ │ │       └──────────┘ └──────────┘             │ │    answer              │ │
│ │ └──────────┘ │ │       ┌──────────┐ ┌──────────┐             │ │                       │ │
│ │              │ │       │ Envigado │ │ Sabaneta │             │ └───────────────────────┘ │
│ │ etc...       │ │       └──────────┘ └──────────┘             │                           │
│ └──────────────┘ │       ┌───────────────────────┐              │                           │
│                  │       │ I don't know — help me│              │                           │
│                  │       └───────────────────────┘              │                           │
│                  │                                              │                           │
│                  │  ─ ─ ─ ─ ─ ─  LATER IN CONVERSATION ─ ─ ─   │                           │
│                  │                                              │                           │
│                  │  ┌──────────────────────────────────────┐    │                           │
│                  │  │  🤖 AI CONCIERGE                     │    │                           │
│                  │  │                                      │    │                           │
│                  │  │  Perfect! Here's what I have so far: │    │                           │
│                  │  │                                      │    │                           │
│                  │  │  ┌────────────────────────────────┐  │    │                           │
│                  │  │  │ 💰 $800-1200/mo                │  │    │                           │
│                  │  │  │ 📍 Poblado or Laureles         │  │    │                           │
│                  │  │  │ 🛏  2 bedrooms                  │  │    │                           │
│                  │  │  │ 📶 50+ Mbps WiFi               │  │    │                           │
│                  │  │  │ 📅 Move-in: June 1             │  │    │                           │
│                  │  │  └────────────────────────────────┘  │    │                           │
│                  │  │                                      │    │                           │
│                  │  │  I found 12 matches! Want to see     │    │                           │
│                  │  │  them, or refine more?               │    │                           │
│                  │  │                                      │    │                           │
│                  │  │  [Show Results]  [Refine More]       │    │                           │
│                  │  └──────────────────────────────────────┘    │                           │
│                  │                                              │                           │
│                  │ ┌──────────────────────────────────────────┐ │                           │
│                  │ │ Type a message...                  [Send]│ │                           │
│                  │ └──────────────────────────────────────────┘ │                           │
├──────────────────┴──────────────────────────────────────────────┴────────────────────────────┤
│                                                                          ┌────────────────┐ │
│                                                                          │ 💬 Chat        │ │
│                                                                          └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Conversation Flow (5 Core Steps)

```
STEP 1: BUDGET
┌──────────────────────────────────────┐
│ 🤖 What's your monthly budget?       │
│                                      │
│  [<$500] [$500-800] [$800-1200]      │
│  [$1200-1800] [$1800+]              │
│                                      │
│  Or type a custom range...           │
└──────────────────────────────────────┘

STEP 2: NEIGHBORHOOD
┌──────────────────────────────────────┐
│ 🤖 Where would you like to live?     │
│                                      │
│  [Poblado] [Laureles] [Envigado]     │
│  [Sabaneta] [Belén] [Estadio]       │
│  [I don't know — help me]           │
│                                      │
│  If "help me" → AI explains each     │
│  neighborhood with pros/cons         │
└──────────────────────────────────────┘

STEP 3: SIZE
┌──────────────────────────────────────┐
│ 🤖 How many bedrooms do you need?    │
│                                      │
│  [Studio] [1 BR] [2 BR] [3+ BR]     │
│                                      │
│  Any preference on minimum size?     │
└──────────────────────────────────────┘

STEP 4: AMENITIES
┌──────────────────────────────────────┐
│ 🤖 Must-have amenities?              │
│                                      │
│  ☑ Fast WiFi (50+ Mbps)             │
│  ☐ Pool                             │
│  ☐ Gym                              │
│  ☐ In-unit laundry                  │
│  ☐ AC                               │
│  ☐ Balcony                          │
│  ☐ Doorman / Security               │
│                                      │
│  [These are good] [Add more...]     │
└──────────────────────────────────────┘

STEP 5: TIMELINE
┌──────────────────────────────────────┐
│ 🤖 When do you want to move in?      │
│                                      │
│  [ASAP] [This month] [Next month]    │
│  [Specific date →]  📅               │
│                                      │
│  How long do you plan to stay?       │
│  [1-3 months] [3-6 months]           │
│  [6-12 months] [1+ year]            │
└──────────────────────────────────────┘

OPTIONAL STEPS (AI offers if relevant):
- Pets: "Will you have any pets?"
- Parking: "Need parking?"
- Lifestyle: "Remote worker? Night owl? Gym rat?"
```

## Annotations

| Element | Component | Interaction |
|---------|-----------|-------------|
| Progress indicator | Custom stepper with `●`/`○` icons | Steps light up green as completed |
| Criteria badges | `<Badge>` from shadcn | Appear in left panel as answers are given. Clickable to edit |
| Quick-select buttons | `<Button variant="outline">` | Pre-built common answers, one click to answer |
| AI messages | Custom chat bubble (left-aligned) | Streamed from `rentals` edge function via SSE |
| User messages | Custom chat bubble (right-aligned) | Sent on enter or button click |
| Free-text input | `<Input>` + send `<Button>` | User can type anything, AI interprets intent |
| Neighborhood map | Google Map with polygon overlays | Highlights neighborhoods as user selects them |
| Budget visualization | Custom bar chart | Shows user's range vs neighborhood averages |
| Matching count | Real-time counter | Supabase query with collected filters, count updates live |
| "Show Results" button | `<Button variant="default">` | Navigates to `/rentals?filters=...` with wizard criteria |
| "Refine More" button | `<Button variant="outline">` | Continues conversation with optional steps |
| Summary card | `<Card>` inside AI message | AI-generated recap of all collected criteria |

## State Management

- Wizard state stored in `TripContext` (or new `RentalWizardContext`)
- Each step answer updates a `criteria` object: `{ budget, neighborhood, bedrooms, amenities, moveIn, duration }`
- Criteria persisted to `localStorage` so user can resume
- On "Show Results", criteria converted to URL search params and navigated to rental search
- Conversation history logged to `conversations` + `messages` tables in Supabase
