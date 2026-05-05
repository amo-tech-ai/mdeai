# 09 — Admin Listings Panel (Desktop)

Three-panel layout. Left=admin nav, Main=data table with filters, Right=selected listing detail/actions.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  mdeai.co  ADMIN                                                     [avatar] Admin  ☰     │
├──────────────────┬──────────────────────────────────────────────┬────────────────────────────┤
│ LEFT PANEL       │ MAIN PANEL                                   │ RIGHT PANEL               │
│ (220px)          │ (flex-1)                                     │ (340px)                   │
│                  │                                              │                           │
│ ┌──────────────┐ │ ┌──────────────────────────────────────────┐ │ SELECTED LISTING          │
│ │ 🔧 ADMIN     │ │ │  Rental Listings                 [+ Add] │ │ ┌───────────────────────┐ │
│ │   PANEL      │ │ └──────────────────────────────────────────┘ │ │ (Select a listing      │ │
│ └──────────────┘ │                                              │ │  to view details)      │ │
│                  │ BULK ACTIONS TOOLBAR                          │ │                       │ │
│ NAVIGATION       │ ┌──────────────────────────────────────────┐ │ │ ─ ─ after selection: ─ │ │
│ ┌──────────────┐ │ │ ☑ 3 selected  [Approve] [Reject]        │ │ │                       │ │
│ │ 📊 Dashboard │ │ │               [Feature] [Archive] [···] │ │ │ ┌───────────────────┐ │ │
│ │ 🏘 Apartments│◀│ └──────────────────────────────────────────┘ │ │ │                   │ │ │
│ │ 🍽 Restaur.  │ │ (Appears when ≥1 row selected)               │ │ │   LISTING IMAGE   │ │ │
│ │ 🎪 Events    │ │                                              │ │ │                   │ │ │
│ │ 🚗 Cars      │ │ FILTERS                                      │ │ └───────────────────┘ │ │
│ │ 👥 Users     │ │ ┌──────────────────────────────────────────┐ │ │                       │ │
│ │ 📋 Applicat. │ │ │ 🔍 Search listings...                    │ │ │ Modern Loft           │ │
│ │ 💰 Payments  │ │ │                                          │ │ │ Poblado, Medellín     │ │
│ │ 📈 Analytics │ │ │ Status: [All ▾]  Neighborhood: [All ▾]  │ │ │                       │ │
│ │ ⚙ Settings  │ │ │ Host:   [All ▾]  Price: [$0 — $5000]    │ │ │ $800/mo               │ │
│ └──────────────┘ │ └──────────────────────────────────────────┘ │ │ 🛏 2  🚿 1  📐 65m²   │ │
│                  │                                              │ │                       │ │
│ ──────────────── │ ┌──────────────────────────────────────────┐ │ │ Status: 🟢 Active     │ │
│                  │ │                                          │ │ │ Host: María García    │ │
│ QUICK STATS      │ │  ☐ │ Listing      │Neighbor│ Price │Stat│ │ │ Created: May 15, 2026 │ │
│ ┌──────────────┐ │ │  ──┼──────────────┼────────┼───────┼────│ │ │ Views: 234            │ │
│ │              │ │ │  ☑ │ Modern Loft  │Poblado │ $800  │ 🟢 │ │ │ Inquiries: 12         │ │
│ │ Total: 47    │ │ │    │ María G.     │        │ /mo   │    │ │ │ Applications: 3       │ │
│ │ 🟢 Active 38 │ │ │  ──┼──────────────┼────────┼───────┼────│ │ │                       │ │
│ │ 🟡 Pending 6 │ │ │  ☑ │ Cozy Studio  │Laureles│ $650  │ 🟡 │ │ └───────────────────────┘ │
│ │ 🔴 Rejected 2│ │ │    │ Carlos R.    │        │ /mo   │    │ │                           │
│ │ ⬜ Draft 1   │ │ │  ──┼──────────────┼────────┼───────┼────│ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ │              │ │ │  ☑ │ Penthouse    │Poblado │$1,200 │ 🟢 │ │                           │
│ └──────────────┘ │ │    │ María G.     │        │ /mo   │    │ │ ACTIONS                   │
│                  │ │  ──┼──────────────┼────────┼───────┼────│ │ ┌───────────────────────┐ │
│                  │ │  ☐ │ Garden Apt   │Sabaneta│ $550  │ ⬜ │ │ │                       │ │
│                  │ │    │ Luis M.      │        │ /mo   │    │ │ │ [✏ Edit Listing    ] │ │
│                  │ │  ──┼──────────────┼────────┼───────┼────│ │ │                       │ │
│                  │ │  ☐ │ Envigado     │Envigado│ $950  │ 🟢 │ │ │ [✅ Approve         ] │ │
│                  │ │    │ Spacious 3BR │        │ /mo   │    │ │ │                       │ │
│                  │ │  ──┼──────────────┼────────┼───────┼────│ │ │ [❌ Reject          ] │ │
│                  │ │  ☐ │ Rooftop Loft │Poblado │$1,100 │ 🟡 │ │ │                       │ │
│                  │ │    │ Ana P.       │        │ /mo   │    │ │ │ [⭐ Feature          ] │ │
│                  │ │  ──┼──────────────┼────────┼───────┼────│ │ │                       │ │
│                  │ │  ☐ │ Budget Room  │Centro  │ $350  │ 🔴 │ │ │ [📋 View Applicants ] │ │
│                  │ │    │ Diego F.     │        │ /mo   │    │ │ │                       │ │
│                  │ │  ──┼──────────────┼────────┼───────┼────│ │ │ [💬 Message Host    ] │ │
│                  │ │  ☐ │ Luxury Villa │Poblado │$2,500 │ 🟢 │ │ │                       │ │
│                  │ │    │ Catalina S.  │        │ /mo   │    │ │ │ [🗑 Archive          ] │ │
│                  │ │  ──┼──────────────┼────────┼───────┼────│ │ │                       │ │
│                  │ │  ☐ │ Estadio Flat │Estadio │ $480  │ 🟡 │ │ └───────────────────────┘ │
│                  │ │    │ Camilo V.    │        │ /mo   │    │ │                           │
│                  │ │  ──┼──────────────┼────────┼───────┼────│ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                  │ │  ☐ │ Belén Studio │Belén   │ $420  │ 🟢 │ │                           │
│                  │ │    │ Patricia L.  │        │ /mo   │    │ │ LISTING QUALITY           │
│                  │ │                                          │ │ ┌───────────────────────┐ │
│                  │ └──────────────────────────────────────────┘ │ │                       │ │
│                  │                                              │ │ Photos:    6/6  ████  │ │
│                  │  Showing 1-10 of 47     ◀ 1  2  3  4  5  ▶  │ │ Description: 92% ███░ │ │
│                  │                                              │ │ Amenities: 9/12 ███░  │ │
│                  │ ──────────────────────────────────────────── │ │ Price data:  ✅       │ │
│                  │                                              │ │ Host verified: ✅     │ │
│                  │ RECENT ACTIVITY                               │ │ WiFi tested:  ❌     │ │
│                  │ ┌──────────────────────────────────────────┐ │ │                       │ │
│                  │ │ 🟡 14:30  New listing submitted          │ │ │ Quality Score: 87/100 │ │
│                  │ │          Rooftop Loft — Ana P.           │ │ │                       │ │
│                  │ │                                          │ │ │ 🤖 AI: "Good listing. │ │
│                  │ │ 🔴 12:15  Listing rejected               │ │ │  Suggest adding WiFi  │ │
│                  │ │          Budget Room — policy violation   │ │ │  speed test results   │ │
│                  │ │                                          │ │ │  and neighborhood      │ │
│                  │ │ 🟢 10:00  Listing approved                │ │ │  walkability info."   │ │
│                  │ │          Envigado 3BR — auto-approved     │ │ └───────────────────────┘ │
│                  │ │                                          │ │                           │
│                  │ │ ⭐ 09:15  Listing featured               │ │                           │
│                  │ │          Modern Loft — homepage carousel  │ │                           │
│                  │ │                                          │ │                           │
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
| Admin nav | Vertical `<Button variant="ghost">` list | Active item has emerald left border + bold text. Routes to `/admin/*` |
| Quick stats | Colored count badges | Click filters table to that status |
| Search input | `<Input>` | Searches listing title, host name, neighborhood. Debounced 300ms |
| Status filter | `<Select>` | Options: All, Active, Pending, Rejected, Draft, Archived |
| Neighborhood filter | `<Select>` | All neighborhoods from `apartments` table distinct values |
| Host filter | `<Select>` with search | Searchable list of all hosts from `profiles` where `role='landlord'` |
| Price range | Dual `<Input>` or `<Slider>` | Min/max filter on monthly price |
| Data table | `<Table>` from shadcn with `<Checkbox>` per row | Sortable columns (click header). Row click selects for right panel |
| Row checkbox | `<Checkbox>` | Multi-select for bulk actions. Header checkbox selects all visible |
| Status badges | `<Badge>` | Green=Active, Yellow=Pending review, Red=Rejected, Gray=Draft |
| Bulk actions toolbar | Sticky bar, appears on selection | Approve/Reject/Feature/Archive selected listings |
| Approve button | `<Button variant="default">` | Changes status to `active`, notifies host |
| Reject button | `<Button variant="destructive">` | Opens dialog for rejection reason, notifies host |
| Feature button | `<Button variant="outline">` | Promotes listing to homepage carousel + search boost |
| Archive button | `<Button variant="ghost">` | Soft-delete, removes from public search |
| Edit listing | `<Button>` in right panel | Opens listing edit form (same as landlord edit but with admin fields) |
| View Applicants | `<Button>` in right panel | Navigates to `/admin/apartments/:id/applications` |
| Message Host | `<Button>` in right panel | Opens in-app message composer to host |
| Quality score | Custom progress bars | AI-assessed listing completeness. Scores photos, description, data |
| AI suggestion | `<Card>` with emerald border | Hermes agent auto-review of listing quality |
| Pagination | `<Pagination>` | 10 items per page, server-side |
| Activity feed | Timestamped event list | Admin action log. Color-coded by action type |
| "+ Add" button | `<Button variant="default">` | Opens listing creation form (admin can create on behalf of host) |

## Bulk Action Flows

```
APPROVE:
  Selected listings → status = 'active' → Notify each host → Listings appear in search

REJECT:
  Selected listings → Dialog: "Reason for rejection" → status = 'rejected'
  → Notify each host with reason → Listings hidden from search

FEATURE:
  Selected listings → featured = true, featured_until = now + 7 days
  → Appears in homepage carousel + search result boost

ARCHIVE:
  Selected listings → status = 'archived' → Hidden from public
  → Host notified, can reactivate from their dashboard
```

## Access Control

- Route: `/admin/apartments` (protected, requires `role: 'admin'` in profiles)
- Admin uses service role key via edge function for cross-user data access
- All admin actions logged to `admin_audit_log` table (who, what, when, listing_id)
- Two admin tiers: `admin` (full CRUD) and `moderator` (approve/reject only)
