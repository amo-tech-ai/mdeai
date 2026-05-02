# Epic 4: Frontend Rental Flow — Task Prompts

### Real world — purpose & outcomes

**In one sentence:** Someone on their phone can browse apartments on a map, open a listing, and plan a trip—UI matches the “Paisa” product and doesn’t break when data is slow or missing.

- **Who it’s for:** Travelers using mdeai on mobile first; landlords later on dashboards named in this epic.
- **Purpose:** Finish the rental discovery and planning surfaces that marketing promises.
- **Goals:** Map, detail, neighborhood, planning/landlord surfaces with four states (loading, error, empty, data) everywhere.
- **Features / deliverables:** Named routes/components; real hooks; accessibility and performance pass per ACs.

> **Lettered prompts:** [`04A-ai-search-wire.md`](04A-ai-search-wire.md) (wire `useAISearch` → **`ai-search`**), [`04B-ai-trip-planner-wire.md`](../advanced/04B-ai-trip-planner-wire.md) (ADVANCED — wire trip planner → **`ai-trip-planner`**), [`04F-e4-move-in-checklist.md`](../advanced/04F-e4-move-in-checklist.md) (ADVANCED — E4-006 post-book checklist).  
> **Diagrams:** MERM-08 (frontend components), MERM-01 (user journeys), MERM-05 (intake wizard)
> **Phase:** CORE | **Outcomes:** O1, O2, O10
> **Hypothesis:** A polished rental search -> detail -> book flow drives the first conversion.
>
> **Component status (verified 2026-04-05):**
> | Component | Exists? | Location | Notes |
> |-----------|---------|----------|-------|
> | RentalsSearchResults | YES | `src/components/rentals/RentalsSearchResults.tsx` | Search/filter UI working |
> | RentalsListingDetail | YES | `src/components/rentals/RentalsListingDetail.tsx` | Partial listing detail |
> | RentalsIntakeWizard | YES | `src/components/rentals/RentalsIntakeWizard.tsx` | Intake flow working |
> | ApartmentDetail | YES | `src/pages/ApartmentDetail.tsx` | Route `/apartments/:id` with rent actions |
> | GoogleMapView | YES | `src/components/explore/GoogleMapView.tsx` | Explore map (not rental-focused) |
> | **MapView (rental)** | **NO** | — | Must be built for rental search with PricePin |
> | **PricePin** | **NO** | — | Must be built (map marker with price) |
> | **NeighborhoodCard** | **NO** | — | Must be built (neighborhood scoring UI) |
> | **LandlordDashboard** | **NO** | — | Must be built (host listing management) |
> | **PlanningDashboard** | **NO** | — | Must be built or merge into existing Dashboard |
>
> **Accessibility:** All components in this epic must meet WCAG 2.1 AA. Key requirements:
> - Keyboard navigable (Tab, Enter, Escape for modals/dialogs)
> - Color contrast ≥4.5:1 for text, ≥3:1 for large text and UI elements
> - All images have meaningful `alt` text (not "image" or empty for decorative)
> - Form inputs have associated `<label>` elements (shadcn/ui handles this by default)
> - Focus indicators visible on all interactive elements
> - Screen reader compatible: use semantic HTML and ARIA where needed

---

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Renters discover listings on map/detail and landlords see pipeline — planning UX matches MERM-08. |
| **Workflow** | Component/route work → connect to real hooks → four states everywhere. |
| **Proof** | Lighthouse/a11y spot check; no blank screens on slow network. |
| **Gates** | CRM routes align with 10B; Map uses real coords from DB. |
| **Rollout** | Progressive enhancement; mobile-first per layout rules. |

---

## E4-001: Build MapView + PricePin Components

```yaml
---
id: E4-001
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Map & Search"
title: Build MapView and PricePin components for rental search
description: "Ships «Build MapView and PricePin components for rental search» for this epic—full scope in § Prompt below."
skill: frontend
phase: CORE
priority: P0
status: Open
owner: Frontend
dependencies:
  - E1-001
estimated_effort: M
percent_complete: 0
epic: E4
outcome: O10
---
```

### Prompt

Build the MapView component (Google Maps integration) with PricePin markers for the rental search right panel.

**Read first:**
- `tasks/mermaid/08-frontend-components.mmd` — MapView in component hierarchy
- `tasks/wireframes/01-rental-search-desktop.md` — right panel shows map
- `src/components/explore/` — existing explore components for patterns
- `.env` — `VITE_GOOGLE_MAPS_API_KEY` exists

**The build:**
- `src/components/map/MapView.tsx` — Google Maps wrapper with apartment markers
- `src/components/map/PricePin.tsx` — custom marker showing price in COP (e.g., "3.5M")
- `src/hooks/useMapBounds.ts` — track visible bounds, filter apartments by viewport
- Map goes in the right panel of the 3-panel layout
- Clicking a PricePin highlights the corresponding listing card in the main panel
- Map centers on Medellin (6.2442, -75.5812) with zoom level showing city

**Design:**
- PricePin: emerald background, white text, rounded pill shape
- Selected PricePin: darker emerald with scale animation
- Cluster markers for zoomed-out views
- Responsive: hidden on mobile (map toggle button instead)

### Acceptance Criteria
- [ ] MapView renders Google Map centered on Medellin
- [ ] PricePins show apartment prices on the map
- [ ] Clicking PricePin highlights corresponding listing card
- [ ] Map updates when filters change
- [ ] Handles 4 states (loading map/error/no apartments/success)
- [ ] Responsive: toggle button on mobile, always visible on desktop right panel
- [ ] Uses `VITE_GOOGLE_MAPS_API_KEY` from environment
- [ ] WCAG: map has keyboard-accessible alternatives (list view fallback)
- [ ] WCAG: PricePins have sufficient contrast and are not color-only indicators
- [ ] `npm run build` passes

---

## E4-002: Build RentalsListingDetail Page

```yaml
---
id: E4-002
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Listing Detail"
title: Build RentalsListingDetail page with full property information
description: "Ships «Build RentalsListingDetail page with full property information» for this epic—full scope in § Prompt below."
skill: frontend
phase: CORE
priority: P0
status: Open
owner: Frontend
dependencies:
  - E1-001
estimated_effort: M
percent_complete: 0
epic: E4
outcome: O1
---
```

### Prompt

Build the property detail page showing full apartment information, photos, neighborhood context, and action buttons.

**Read first:**
- `tasks/wireframes/03-listing-detail-desktop.md` — full wireframe
- `tasks/mermaid/08-frontend-components.mmd` — ListingDetail in component hierarchy
- `src/pages/Apartments.tsx` — existing apartments page
- `src/components/apartments/` — existing components to extend

**The build:**
- Enhance existing `src/pages/ApartmentDetail.tsx` at `/apartments/:id` (route already exists in App.tsx — do NOT create a new `/rentals/:id` route)
- Photo carousel (use existing image component or build with shadcn)
- Property info section: title, price, beds/baths, amenities, description
- Neighborhood context: safety score, walkability, nomad score, nearby places
- Host info card with response rate
- Action buttons: Schedule Showing, Apply, Save, Share
- Right panel: map showing apartment location + nearby listings
- Route registered in `App.tsx`

**Design:**
- Playfair Display for property title
- Price in COP with period formatting (e.g., "4.500.000 COP/mes")
- Amenity icons as tags
- Neighborhood scores as colored progress bars
- Sticky action bar on scroll

### Acceptance Criteria
- [ ] Page renders at `/apartments/:id` (existing route in App.tsx) with real data from Supabase
- [ ] Photo carousel with swipe/arrow navigation
- [ ] Property details: price, beds, baths, amenities, description
- [ ] Neighborhood section with scores
- [ ] Host info card
- [ ] Action buttons: Schedule Showing, Apply, Save
- [ ] Handles 4 states (loading/error/not found/success)
- [ ] Uses existing `/apartments/:id` route in `App.tsx` (already registered — do NOT add new route)
- [ ] WCAG: photo carousel keyboard navigable (arrow keys) with visible focus
- [ ] WCAG: price and score values not conveyed by color alone
- [ ] `npm run build` passes

---

## E4-003: Build NeighborhoodCard Component

```yaml
---
id: E4-003
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Neighborhoods"
title: Build NeighborhoodCard component
description: "Ships «Build NeighborhoodCard component» for this epic—full scope in § Prompt below."
skill: frontend
phase: CORE
priority: P1
status: Open
owner: Frontend
dependencies:
  - E1-002
estimated_effort: S
percent_complete: 0
epic: E4
outcome: O10
---
```

### Prompt

Build the NeighborhoodCard component showing neighborhood scores and quick stats for search results and listing details.

**Read first:**
- `tasks/mermaid/08-frontend-components.mmd` — NeighborhoodCard props
- `src/components/ui/card.tsx` — shadcn card primitive

**The build:**
- `src/components/neighborhoods/NeighborhoodCard.tsx`
- Props: `{ name, safety_score, walkability_score, nomad_score, avg_rent, description?, image? }`
- Show 3 scores as colored bars (green >7, yellow 5-7, red <5)
- Average rent in COP
- Brief description
- Click navigates to filtered search for that neighborhood

### Acceptance Criteria
- [ ] Renders neighborhood name, scores, and average rent
- [ ] Score bars color-coded by value
- [ ] Clickable — filters search by neighborhood
- [ ] Uses shadcn/ui Card component
- [ ] Follows design system (DM Sans, emerald palette)
- [ ] `npm run build` passes

---

## E4-004: Build ModerationQueue (Admin)

```yaml
---
id: E4-004
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Admin"
title: Build ModerationQueue for admin listing management
description: "Ships «Build ModerationQueue for admin listing management» for this epic—full scope in § Prompt below."
skill: frontend
phase: CORE
priority: P1
status: Open
owner: Frontend
dependencies: []
estimated_effort: M
percent_complete: 0
epic: E4
outcome: O9
---
```

### Prompt

Build the admin moderation queue for reviewing and approving/rejecting rental listings.

**Read first:**
- `tasks/wireframes/09-admin-listings.md` — admin wireframe
- `src/pages/admin/` — existing admin pages
- `src/components/admin/` — existing admin components

**The build:**
- `src/components/admin/ModerationQueue.tsx` — list of pending listings
- Filter by status: pending, approved, rejected, flagged
- Each item shows: listing title, host name, submitted date, preview thumbnail
- Actions: Approve, Reject (with reason), Flag for review
- Bulk actions for multiple selections
- Wire to `property_verifications` table

### Acceptance Criteria
- [ ] Displays pending listings in a sortable table
- [ ] Filter by verification status
- [ ] Approve/Reject/Flag actions update `property_verifications` table
- [ ] Bulk selection and actions
- [ ] Admin auth guard (only admin role)
- [ ] Handles 4 states
- [ ] `npm run build` passes

---

## E4-005: Build LandlordDashboard

```yaml
---
id: E4-005
diagram_id: MERM-08
prd_section: "4. Feature Inventory — Host Dashboard"
title: Build LandlordDashboard for hosts to manage properties and bookings
description: "Ships «Build LandlordDashboard for hosts to manage properties and bookings» for this epic—full scope in § Prompt below."
skill: frontend
phase: CORE
priority: P1
status: Open
owner: Frontend
dependencies:
  - E2-004
estimated_effort: L
percent_complete: 0
epic: E4
outcome: O1
---
```

### Prompt

Build the host dashboard where landlords manage their properties, view applications, and track bookings.

**Read first:**
- `tasks/wireframes/04-landlord-dashboard.md` — full wireframe
- `tasks/mermaid/08-frontend-components.mmd` — dashboard components
- `src/pages/Dashboard.tsx` — existing user dashboard for patterns

**The build:**
- `src/pages/LandlordDashboard.tsx` — main dashboard at `/host/dashboard`
- Sections: My Properties, Pending Applications, Active Bookings, Earnings
- Properties: list with occupancy status, edit link, toggle active/inactive
- Applications: pending list with AI summary preview, approve/reject buttons
- Bookings: calendar view of current and upcoming bookings
- Earnings: total earnings, pending payouts, payout history
- Route registered in `App.tsx` (protected, requires host role)

### Acceptance Criteria
- [ ] Dashboard renders at `/host/dashboard`
- [ ] Shows My Properties with occupancy status
- [ ] Shows Pending Applications with approve/reject
- [ ] Shows Active Bookings with calendar view
- [ ] Shows Earnings summary
- [ ] Protected route — requires authenticated host role
- [ ] Handles 4 states per section
- [ ] Responsive layout
- [ ] `npm run build` passes
