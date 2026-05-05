# 05 — Showing Scheduler (Dialog/Modal)

Overlay dialog triggered from listing detail or search results.

```
┌─── Background (dimmed page) ────────────────────────────────────────────────────────────────┐
│                                                                                             │
│        ┌────────────────────────────────────────────────────────────────────────┐            │
│        │                                                              [✕]      │            │
│        │  Schedule a Showing                                                   │            │
│        │                                                                       │            │
│        │  ┌─────────────────────────────────┬────────────────────────────────┐  │            │
│        │  │ PROPERTY                        │ YOUR CRITERIA                  │  │            │
│        │  │                                 │                                │  │            │
│        │  │ ┌───────────┐                   │ ┌────────────────────────────┐ │  │            │
│        │  │ │           │  Modern Loft      │ │ Budget: $800-1200/mo      │ │  │            │
│        │  │ │   PHOTO   │  Poblado          │ │ Beds:   2 BR              │ │  │            │
│        │  │ │           │                   │ │ WiFi:   50+ Mbps          │ │  │            │
│        │  │ └───────────┘  $800/mo          │ │ Move-in: June 1           │ │  │            │
│        │  │               🛏 2 bed 🚿 1 bath │ │ Duration: 6-12 months     │ │  │            │
│        │  │               65 m² · Floor 8   │ └────────────────────────────┘ │  │            │
│        │  └─────────────────────────────────┴────────────────────────────────┘  │            │
│        │                                                                       │            │
│        │  ─────────────────────────────────────────────────────────────────     │            │
│        │                                                                       │            │
│        │  SELECT A DATE                                                        │            │
│        │  ┌────────────────────────────────────────────────────────────────┐    │            │
│        │  │              ◀  June 2026  ▶                                  │    │            │
│        │  │                                                              │    │            │
│        │  │   Mo    Tu    We    Th    Fr    Sa    Su                      │    │            │
│        │  │                                                              │    │            │
│        │  │    1     2     3     4     5     6     7                      │    │            │
│        │  │   ░░    ░░    ░░   ░░    ░░    ░░                            │    │            │
│        │  │                                                              │    │            │
│        │  │    8     9    10    11    12    13    14                      │    │            │
│        │  │   ░░    ░░   ░░    ██    ░░    ░░                            │    │            │
│        │  │                    ▲▲                                        │    │            │
│        │  │               (selected)                                     │    │            │
│        │  │                                                              │    │            │
│        │  │   15    16    17    18    19    20    21                      │    │            │
│        │  │   ░░    ░░   ░░    ░░    ░░    ░░                            │    │            │
│        │  │                                                              │    │            │
│        │  │   22    23    24    25    26    27    28                      │    │            │
│        │  │   ░░    ░░   ░░    ░░    ░░                                  │    │            │
│        │  │                                                              │    │            │
│        │  │   29    30                                                   │    │            │
│        │  │   ░░    ░░                                                   │    │            │
│        │  │                                                              │    │            │
│        │  │   ░░ = Available    ██ = Selected    (blank) = Unavailable   │    │            │
│        │  └────────────────────────────────────────────────────────────────┘    │            │
│        │                                                                       │            │
│        │  SELECT A TIME              (shows after date is picked)              │            │
│        │  ┌──────────────────────────────────────────────────────────────┐      │            │
│        │  │                                                            │      │            │
│        │  │  [ 9:00 AM ]  [10:00 AM]  [11:00 AM]  [12:00 PM]          │      │            │
│        │  │                                                            │      │            │
│        │  │  [ 1:00 PM ]  [ 2:00 PM]  [██3:00 PM]  [ 4:00 PM]         │      │            │
│        │  │                             ▲▲                             │      │            │
│        │  │                        (selected)                          │      │            │
│        │  │  [ 5:00 PM ]                                               │      │            │
│        │  │                                                            │      │            │
│        │  │  Greyed-out slots = already booked                         │      │            │
│        │  └──────────────────────────────────────────────────────────────┘      │            │
│        │                                                                       │            │
│        │  ADD A NOTE (optional)                                                │            │
│        │  ┌──────────────────────────────────────────────────────────────┐      │            │
│        │  │ I'd like to see the rooftop and check WiFi speed...         │      │            │
│        │  └──────────────────────────────────────────────────────────────┘      │            │
│        │                                                                       │            │
│        │         ┌──────────────────────────────────────────────┐               │            │
│        │         │          Confirm Showing                     │               │            │
│        │         │    Thu, June 11 at 3:00 PM                   │               │            │
│        │         └──────────────────────────────────────────────┘               │            │
│        │                                                                       │            │
│        └────────────────────────────────────────────────────────────────────────┘            │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

CONFIRMATION STATE (after clicking "Confirm Showing"):

┌────────────────────────────────────────────────────────────────────────┐
│                                                              [✕]      │
│                                                                       │
│                         ✅ Showing Confirmed!                         │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                                                                │    │
│  │  📍 Modern Loft in Poblado                                    │    │
│  │     Calle 10 #43-12, El Poblado, Medellín                    │    │
│  │                                                                │    │
│  │  📅 Thursday, June 11, 2026                                   │    │
│  │  🕐 3:00 PM (Colombia Time, GMT-5)                            │    │
│  │                                                                │    │
│  │  👤 Host: María García                                        │    │
│  │  📱 +57 300 123 4567                                          │    │
│  │  📧 maria@example.com                                         │    │
│  │                                                                │    │
│  │  📝 Your note: "I'd like to see the rooftop and check         │    │
│  │     WiFi speed"                                               │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  You'll receive a confirmation email and WhatsApp message shortly.    │
│                                                                       │
│  ┌────────────────────┐  ┌─────────────────────┐                      │
│  │ Add to Calendar 📅 │  │ Get Directions 🗺   │                      │
│  └────────────────────┘  └─────────────────────┘                      │
│                                                                       │
│                    [Close]                                             │
│                                                                       │
└────────────────────────────────────────────────────────────────────────┘
```

## Annotations

| Element | Component | Interaction |
|---------|-----------|-------------|
| Dialog | `<Dialog>` from shadcn | Modal overlay, closes on X or outside click |
| Property summary | `<Card>` with image | Read-only recap of the listing |
| Criteria summary | `<Card>` | Shows renter's wizard criteria for host context |
| Calendar | `<Calendar>` from shadcn | Only shows available dates (from host's schedule). Click selects |
| Time slots | Grid of `<Button variant="outline">` | Available times for selected date. Click selects, selected=primary |
| Note textarea | `<Textarea>` | Optional, max 500 chars |
| Confirm button | `<Button variant="default">` size="lg" | Shows selected date+time. Disabled until both are picked |
| Confirmation card | Success state `<Card>` | Shows address, date, time, host contact. Confetti animation |
| "Add to Calendar" | `<Button variant="outline">` | Generates .ics file download or Google Calendar link |
| "Get Directions" | `<Button variant="outline">` | Opens Google Maps with property coordinates |

## Backend Flow

1. Available dates fetched from `showing_availability` table (host sets weekly schedule)
2. On confirm: `INSERT INTO showings (listing_id, renter_id, host_id, date, time, note, status)`
3. Triggers notification to host (in-app + email + WhatsApp via Infobip)
4. Triggers confirmation to renter (email + WhatsApp)
5. Showing appears in both landlord dashboard and renter's bookings
