# 04 — Landlord Dashboard (Desktop)

Three-panel layout. Left=nav, Main=overview+properties, Right=actions+charts.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  mdeai.co            Explore   Rentals   Coffee   Experiences        [avatar] María  ☰     │
├──────────────────┬──────────────────────────────────────────────┬────────────────────────────┤
│ LEFT PANEL       │ MAIN PANEL                                   │ RIGHT PANEL               │
│ (240px)          │ (flex-1)                                     │ (340px)                   │
│                  │                                              │                           │
│ ┌──────────────┐ │ ┌──────────────────────────────────────────┐ │ QUICK ACTIONS             │
│ │ 🏠 LANDLORD  │ │ │  Welcome back, María                    │ │ ┌───────────────────────┐ │
│ │   PORTAL     │ │ └──────────────────────────────────────────┘ │ │                       │ │
│ └──────────────┘ │                                              │ │ [+ Add Property     ] │ │
│                  │ ┌──────────┐┌──────────┐┌──────────┐┌──────┐ │ │                       │ │
│ NAVIGATION       │ │ Total    ││ Occupancy││ Monthly  ││Pend. │ │ │ [📋 Review Applicat.] │ │
│                  │ │Properties││ Rate     ││ Revenue  ││Apps  │ │ │                       │ │
│ ┌──────────────┐ │ │          ││          ││          ││      │ │ │ [💬 Message Tenant ] │ │
│ │ 📊 Overview  │◀│ │    8     ││   75%    ││ $6,400   ││  3   │ │ │                       │ │
│ │ 🏘 Properties│ │ │          ││          ││          ││      │ │ │ [📊 Export Report  ] │ │
│ │ 📋 Applicat. │ │ │ +1 new   ││ ▲ 5%    ││ ▲ $400  ││ ● 3  │ │ └───────────────────────┘ │
│ │ 💬 Messages  │ │ └──────────┘└──────────┘└──────────┘└──────┘ │                           │
│ │ 💰 Payments  │ │                                              │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ │ ⚙ Settings  │ │ ──────────────────────────────────────────── │                           │
│ └──────────────┘ │                                              │ REVENUE (LAST 6 MONTHS)   │
│                  │ MY PROPERTIES                                │ ┌───────────────────────┐ │
│ ──────────────── │ ┌──────────────────────────────────────────┐ │ │                       │ │
│                  │ │  Search properties...        [+ Add New] │ │ │ $7k │       ┌─┐      │ │
│ ACCOUNT          │ └──────────────────────────────────────────┘ │ │      │    ┌─┐│ │      │ │
│ ┌──────────────┐ │                                              │ │ $6k │ ┌─┐│ ││ │┌─┐   │ │
│ │ ┌────┐       │ │ ┌──────────────────────────────────────────┐ │ │      │ │ ││ ││ ││ │   │ │
│ │ │ 🧑 │ María │ │ │ IMG │ Modern Loft        │ Poblado      │ │ │ $5k │ │ ││ ││ ││ │   │ │
│ │ └────┘       │ │ │     │ $800/mo            │ 🟢 Occupied  │ │ │      │ │ ││ ││ ││ │   │ │
│ │ Host since   │ │ │     │ Tenant: John D.    │ Until Dec 26 │ │ │ $4k │ │ ││ ││ ││ │   │ │
│ │ 2023         │ │ │     │                    │ [Edit] [···] │ │ │      ├─┴─┴┴─┴┴─┴┴─┴─  │ │
│ │              │ │ ├─────┼────────────────────┼──────────────┤ │ │      Nov Dec Jan Feb   │ │
│ │ ⭐ 4.8       │ │ │ IMG │ Cozy Studio        │ Laureles     │ │ │         Mar Apr        │ │
│ │ 23 reviews   │ │ │     │ $650/mo            │ 🟡 Vacant    │ │ └───────────────────────┘ │
│ └──────────────┘ │ │     │ Listed 5 days ago  │ 3 applicants │ │                           │
│                  │ │     │                    │ [Edit] [···] │ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                  │ ├─────┼────────────────────┼──────────────┤ │                           │
│                  │ │ IMG │ Penthouse Suite     │ Poblado      │ │ NOTIFICATIONS             │
│                  │ │     │ $1,200/mo          │ 🟢 Occupied  │ │ ┌───────────────────────┐ │
│                  │ │     │ Tenant: Sarah M.   │ Until Mar 27 │ │ │                       │ │
│                  │ │     │                    │ [Edit] [···] │ │ │ 🔴 New application    │ │
│                  │ ├─────┼────────────────────┼──────────────┤ │ │    for Cozy Studio    │ │
│                  │ │ IMG │ Spacious 3BR       │ Envigado     │ │ │    2 hours ago        │ │
│                  │ │     │ $950/mo            │ 🟢 Occupied  │ │ │                       │ │
│                  │ │     │ Tenant: Mike T.    │ Until Sep 26 │ │ │ 🟡 Rent payment       │ │
│                  │ │     │                    │ [Edit] [···] │ │ │    received — Loft     │ │
│                  │ ├─────┼────────────────────┼──────────────┤ │ │    Yesterday          │ │
│                  │ │ IMG │ Garden Apartment   │ Sabaneta     │ │ │                       │ │
│                  │ │     │ $550/mo            │ 🔴 Inactive  │ │ │ 🟢 Showing confirmed  │ │
│                  │ │     │ Needs photos       │ Draft        │ │ │    Garden Apt — Thu   │ │
│                  │ │     │                    │ [Edit] [···] │ │ │    3 days ago         │ │
│                  │ └──────────────────────────────────────────┘ │ │                       │ │
│                  │                                              │ │ [View All →]          │ │
│                  │ Showing 5 of 8        ◀ 1  2  ▶              │ └───────────────────────┘ │
│                  │                                              │                           │
│                  │ ──────────────────────────────────────────── │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                  │                                              │                           │
│                  │ RECENT ACTIVITY                               │ OCCUPANCY BREAKDOWN       │
│                  │ ┌──────────────────────────────────────────┐ │ ┌───────────────────────┐ │
│                  │ │                                          │ │ │                       │ │
│                  │ │ 🟢 14:30  Payment $800 received         │ │ │    ┌──────────┐       │ │
│                  │ │          Modern Loft — John D.           │ │ │    │ 75%      │       │ │
│                  │ │                                          │ │ │    │ Occupied  │       │ │
│                  │ │ 📋 12:15  New application received       │ │ │    │          │       │ │
│                  │ │          Cozy Studio — Ana P.            │ │ │    └──────────┘       │ │
│                  │ │                                          │ │ │                       │ │
│                  │ │ 👁 10:00  Showing completed              │ │ │ 🟢 6 Occupied         │ │
│                  │ │          Garden Apt — Carlos R.          │ │ │ 🟡 1 Vacant           │ │
│                  │ │                                          │ │ │ 🔴 1 Inactive         │ │
│                  │ │ 💬 Yesterday  Message from tenant        │ │ └───────────────────────┘ │
│                  │ │              Penthouse — Sarah M.        │ │                           │
│                  │ │                                          │ │                           │
│                  │ │ [View All Activity →]                    │ │                           │
│                  │ └──────────────────────────────────────────┘ │                           │
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
| Overview cards | Four `<Card>` components | Show KPI with trend indicator. Click navigates to relevant section |
| Properties table | `<Table>` from shadcn | Sortable columns. Row click opens property detail |
| Status badges | `<Badge>` | Green=Occupied, Yellow=Vacant, Red=Inactive |
| Edit button | `<Button variant="ghost" size="sm">` | Opens inline edit or navigates to edit page |
| `[···]` menu | `<DropdownMenu>` | Options: View, Edit, Deactivate, Delete, View Applicants |
| "+ Add New" button | `<Button variant="default">` | Opens add property form/wizard |
| Revenue chart | Bar chart (recharts or similar) | 6-month revenue history, hover shows exact amounts |
| Occupancy donut | Donut/pie chart | Breakdown of property statuses |
| Activity feed | Custom list with icons | Timestamped events. Click navigates to relevant item |
| Notification list | `<Card>` with colored dots | Red=action needed, Yellow=info, Green=positive |
| Navigation items | Vertical `<Button variant="ghost">` list | Active state highlighted with emerald left border |
| Search properties | `<Input>` | Filters the properties table in real-time |
| Pagination | `<Pagination>` | 5 properties per page |

## Access Control

- Route: `/dashboard/landlord` (protected, requires `role: 'landlord'` in profiles)
- Data scoped by `host_id = auth.uid()` via RLS
- Landlord can only see their own properties, applications, payments
- Admin can see all landlords via `/admin` routes
