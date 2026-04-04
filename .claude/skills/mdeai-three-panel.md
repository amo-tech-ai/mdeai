---
name: mdeai-three-panel
description: >
  Enforces the 3-panel layout system used across all main pages.
  Triggers on keywords: panel, layout, sidebar, three-panel, 3-panel, navigation panel,
  intelligence panel, right panel, left panel, main panel, responsive, mobile layout.
  Watches for any page creation or layout modifications.
allowed_tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Three-Panel Layout Skill

## The Layout

Every main page uses `ThreePanelContext` with this structure:

| Panel | Width | Purpose | Mobile |
|-------|-------|---------|--------|
| Left | 280px | Navigation, filters, user context | Hidden (bottom nav) |
| Main | flex-1 | Primary content area | Full width |
| Right | 320px | Intelligence: map, AI, quick actions | Sheet/drawer |

## Implementation

```tsx
import { useThreePanel } from "@/context/ThreePanelContext";

export default function MyPage() {
  return (
    <ThreePanelLayout>
      <LeftPanel>
        <NavigationFilters />
      </LeftPanel>
      <MainPanel>
        <PageContent />
      </MainPanel>
      <RightPanel>
        <MapOrAISuggestions />
      </RightPanel>
    </ThreePanelLayout>
  );
}
```

## Panel Content Guidelines

### Left Panel
- Navigation links (active state highlighting)
- Contextual filters for current view
- User profile summary (when authenticated)
- Collapse to icon-only at narrow widths

### Main Panel
- The primary workspace
- Handles all 4 data states (loading/error/empty/success)
- Scrolls independently from side panels
- Contains breadcrumbs for detail views

### Right Panel
- Map view (Google Maps) for location-aware pages
- AI suggestions panel for discovery pages
- Quick action cards
- On mobile: accessible via sheet/drawer gesture

## Mobile Behavior

- Panels collapse to single column
- Bottom navigation replaces left panel
- Right panel content accessible via floating button or swipe
- `use-mobile.tsx` hook detects breakpoint
