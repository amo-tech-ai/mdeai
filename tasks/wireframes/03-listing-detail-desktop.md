# 03 — Property Listing Detail (Desktop)

Three-panel layout. Left=nav+similar, Main=full listing, Right=map+insights.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  mdeai.co            Explore   Rentals   Coffee   Experiences        [avatar] John  ☰      │
├──────────────────┬──────────────────────────────────────────────┬────────────────────────────┤
│ LEFT PANEL       │ MAIN PANEL                                   │ RIGHT PANEL               │
│ (240px)          │ (flex-1)                                     │ (360px)                   │
│                  │                                              │                           │
│ ◀ Back to Search │ ┌──────────────────────────────────────────┐ │ ┌───────────────────────┐ │
│                  │ │                                          │ │ │                       │ │
│ Rentals ›        │ │                                          │ │ │    GOOGLE MAP         │ │
│  Poblado ›       │ │          IMAGE CAROUSEL                  │ │ │                       │ │
│   Modern Loft    │ │                                          │ │ │         📍            │ │
│                  │ │     ◀  ● ● ○ ○ ○ ○  ▶    1/6           │ │ │    (property pin)     │ │
│ ──────────────── │ │                                          │ │ │                       │ │
│                  │ │                                          │ │ │  [Street View]        │ │
│ SIMILAR          │ └──────────────────────────────────────────┘ │ │  [Directions]         │ │
│ LISTINGS         │                                              │ └───────────────────────┘ │
│                  │ ┌─────────────────────────────────────┐      │                           │
│ ┌──────────────┐ │ │ Modern Loft with City Views         │      │ NEIGHBORHOOD INFO        │
│ │ ┌──────────┐ │ │ │ Poblado, Medellín                   │      │ ┌───────────────────────┐ │
│ │ │  thumb   │ │ │ │                                     │      │ │ Poblado               │ │
│ │ └──────────┘ │ │ │ $800/mo          🟢 Listed 2 days   │      │ │                       │ │
│ │ Cozy Studio  │ │ └─────────────────────────────────────┘      │ │ Walk Score:  82/100   │ │
│ │ $650/mo      │ │                                              │ │ Transit:     75/100   │ │
│ │ Laureles     │ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │ │ Safety:      88/100   │ │
│ └──────────────┘ │ │ 🛏 2    │ │ 🚿 1    │ │ 📐 65m² │ │ 🏢 Fl 8│ │ │                       │ │
│                  │ │Bedrooms│ │  Bath  │ │  Area  │ │ Floor  │ │ │ Nearby:               │ │
│ ┌──────────────┐ │ └────────┘ └────────┘ └────────┘ └────────┘ │ │  ☕ 12 cafés          │ │
│ │ ┌──────────┐ │ │                                              │ │  🛒 3 supermarkets    │ │
│ │ │  thumb   │ │ │ ──────────────────────────────────────────── │ │  🏥 2 clinics         │ │
│ │ └──────────┘ │ │                                              │ │  🚇 Metro 0.4 km     │ │
│ │ Penthouse    │ │ DESCRIPTION                                  │ │  🏋 4 gyms            │ │
│ │ $1,200/mo    │ │ ┌──────────────────────────────────────────┐ │ └───────────────────────┘ │
│ │ Poblado      │ │ │ Stunning modern loft in the heart of     │ │                           │
│ └──────────────┘ │ │ Poblado. Floor-to-ceiling windows with   │ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                  │ │ panoramic city views. Recently renovated  │ │                           │
│ ┌──────────────┐ │ │ kitchen with modern appliances. Building │ │ AI RECOMMENDATION         │
│ │ ┌──────────┐ │ │ │ has 24/7 security, rooftop pool, and    │ │ ┌───────────────────────┐ │
│ │ │  thumb   │ │ │ │ fully equipped gym. Walking distance to  │ │ │ 🤖 Why this matches   │ │
│ │ └──────────┘ │ │ │ restaurants, cafés, and coworking...     │ │ │    you:               │ │
│ │ Spacious 3BR │ │ │                          [Read more ▾]  │ │ │                       │ │
│ │ $950/mo      │ │ └──────────────────────────────────────────┘ │ │ ✓ Within your budget  │ │
│ │ Envigado     │ │                                              │ │   ($800-1200)         │ │
│ └──────────────┘ │ ──────────────────────────────────────────── │ │ ✓ Poblado — your #1   │ │
│                  │                                              │ │   neighborhood pick   │ │
│                  │ AMENITIES                                    │ │ ✓ 120 Mbps WiFi       │ │
│                  │ ┌──────────────────────────────────────────┐ │ │   (you need 50+)      │ │
│                  │ │ ┌────────┐ ┌────────┐ ┌────────┐        │ │ │ ✓ Available June 1    │ │
│                  │ │ │ 📶 WiFi│ │ 🏊 Pool│ │ 🏋 Gym │        │ │ │                       │ │
│                  │ │ │120 Mbps│ │Rooftop │ │24/7    │        │ │ │ ⚠ No in-unit laundry  │ │
│                  │ │ └────────┘ └────────┘ └────────┘        │ │ │   (shared on floor 2) │ │
│                  │ │ ┌────────┐ ┌────────┐ ┌────────┐        │ │ └───────────────────────┘ │
│                  │ │ │ 🅿 Park│ │ 🧺 Lndy│ │ ❄ AC  │        │ │                           │
│                  │ │ │1 spot  │ │Shared  │ │Central │        │ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                  │ │ └────────┘ └────────┘ └────────┘        │ │                           │
│                  │ │ ┌────────┐ ┌────────┐ ┌────────┐        │ │ PRICE COMPARISON          │
│                  │ │ │ 🛡 Sec │ │ 🌅 Balc│ │ 📺 TV │        │ │ ┌───────────────────────┐ │
│                  │ │ │24/7    │ │City vw │ │Smart   │        │ │ │                       │ │
│                  │ │ └────────┘ └────────┘ └────────┘        │ │ │ This:    $800 ████░░  │ │
│                  │ └──────────────────────────────────────────┘ │ │ Poblado  $950 █████░  │ │
│                  │                                              │ │ avg                   │ │
│                  │ ──────────────────────────────────────────── │ │ City     $720 ████░░  │ │
│                  │                                              │ │ avg                   │ │
│                  │ HOST                                         │ │                       │ │
│                  │ ┌──────────────────────────────────────────┐ │ │ 16% below Poblado avg │ │
│                  │ │ ┌────┐  María García                    │ │ └───────────────────────┘ │
│                  │ │ │ 🧑 │  ⭐ 4.8 (23 reviews)            │ │                           │
│                  │ │ └────┘  Responds within 2 hours          │ │                           │
│                  │ │         Member since 2023                │ │                           │
│                  │ │         [View Profile] [Message Host]    │ │                           │
│                  │ └──────────────────────────────────────────┘ │                           │
│                  │                                              │                           │
│                  │ ──────────────────────────────────────────── │                           │
│                  │                                              │                           │
│                  │ AVAILABILITY                                 │                           │
│                  │ ┌──────────────────────────────────────────┐ │                           │
│                  │ │        ◀  June 2026  ▶                   │ │                           │
│                  │ │  Mo  Tu  We  Th  Fr  Sa  Su              │ │                           │
│                  │ │   1   2   3   4   5   6   7              │ │                           │
│                  │ │   8   9  10  11  12  13  14              │ │                           │
│                  │ │  15  16  17  18  19  20  21              │ │                           │
│                  │ │  22  23  24  25  26  27  28              │ │                           │
│                  │ │  29  30                                  │ │                           │
│                  │ │                                          │ │                           │
│                  │ │  🟢 Available  🔴 Booked  ⬜ Past        │ │                           │
│                  │ └──────────────────────────────────────────┘ │                           │
│                  │                                              │                           │
│                  │ ┌───────────────────┐ ┌──────────────────┐   │                           │
│                  │ │  Apply for This   │ │ Schedule Showing │   │                           │
│                  │ │  Rental           │ │                  │   │                           │
│                  │ └───────────────────┘ └──────────────────┘   │                           │
│                  │                                              │                           │
├──────────────────┴──────────────────────────────────────────────┴────────────────────────────┤
│                                                                          ┌────────────────┐ │
│                                                                          │ 💬 Chat        │ │
│                                                                          └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Annotations

| Element | Component | Interaction |
|---------|-----------|-------------|
| Breadcrumb | `<Breadcrumb>` | Navigates back to search with preserved filters |
| Image carousel | Custom carousel or shadcn `<Carousel>` | Swipe/arrow navigation, dot indicators, lightbox on click |
| Key stats row | Four `<Card>` items | Static display, icons from Lucide |
| Description | `<p>` with "Read more" toggle | Truncated at 3 lines, expands on click |
| Amenities grid | Grid of `<Badge>` or mini `<Card>` items | 3-column grid, icon + label + detail |
| Host card | `<Card>` | Avatar, rating, response time. "Message Host" opens chat |
| Availability calendar | `<Calendar>` from shadcn | Read-only view, color-coded dates. Green=available |
| "Apply" button | `<Button variant="default">` (primary) | Navigates to application flow (wireframe 06) |
| "Schedule Showing" button | `<Button variant="outline">` | Opens showing scheduler dialog (wireframe 05) |
| Similar listings | Vertical list of mini `<Card>` items | Thumbnail + title + price. Click navigates to that listing |
| Google Map | Embedded map, single pin | Shows property location, Street View link, directions link |
| Neighborhood info | Custom info panel | Walk/transit/safety scores, nearby POI counts |
| AI recommendation | `<Card>` with green/yellow highlights | Personalized match analysis based on wizard criteria |
| Price comparison | Horizontal bar chart | Compares listing price to neighborhood and city averages |

## Data Sources

- Listing data: `supabase.from('apartments').select('*').eq('id', id).single()`
- Similar listings: `supabase.from('apartments').select('*').eq('neighborhood', listing.neighborhood).neq('id', id).limit(5)`
- Host info: joined from `profiles` table via `host_id`
- AI recommendation: calls `ai-chat` edge function with user criteria + listing data
- Neighborhood stats: pre-computed or from `neighborhoods` table
- Price comparison: aggregate query on `apartments` table grouped by neighborhood
