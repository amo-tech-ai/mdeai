---
name: mdeai-freshness
description: >
  Calculates and displays coffee freshness badges ("Roasted X hours ago") from roast timestamps.
  Triggers on keywords: freshness, roasted, roast time, hours ago, badge, coffee age.
  Watches for any work on product display components or coffee listing pages.
allowed_tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Coffee Freshness Badge Skill

## What This Does

Implements the "Roasted X Hours Ago" freshness badge — a core differentiator for mdeai.co. Every coffee product displays how recently it was roasted, calculated from the `roasted_at` timestamp metafield.

## Logic

```typescript
function getFreshnessBadge(roastedAt: Date): { label: string; color: 'green' | 'yellow' | 'red' } {
  const hoursAgo = Math.floor((Date.now() - roastedAt.getTime()) / (1000 * 60 * 60));

  if (hoursAgo < 12) return { label: `Roasted ${hoursAgo}h ago`, color: 'green' };
  if (hoursAgo < 48) return { label: `Roasted ${hoursAgo}h ago`, color: 'yellow' };
  return { label: `Roasted ${Math.floor(hoursAgo / 24)}d ago`, color: 'red' };
}
```

## Badge Display Rules

- **Green** (< 12h): "Peak freshness" — prominent badge
- **Yellow** (12-48h): "Fresh" — standard badge
- **Red** (> 48h): "Aging" — subdued badge with note

## Where It Applies

- `/coffee` route product cards (Phase 1)
- Product detail pages
- AI chat recommendations (include freshness in response)
- Search result cards

## Data Source

The `roasted_at` timestamp comes from Shopify product metafields via Gadget.dev sync. Until commerce is connected, use mock data with `new Date(Date.now() - hours * 3600000)`.
