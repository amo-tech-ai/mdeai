---
name: mdeai-commerce
description: >
  Guides Shopify headless + Gadget.dev commerce integration for mdeai.co.
  Triggers on keywords: shopify, gadget, storefront, checkout, cart, product catalog,
  commerce, payment, purchase, buy, order, add to cart.
  References the PRD Phase 1 scope.
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Commerce Integration Skill

## Architecture

```
React App → Gadget.dev API → Shopify Storefront API
                                    ↓
                            Hosted Checkout (Shopify)
                                    ↓
                            Payment → Commission split (88/12)
```

## Phase 1 Scope (MVP)

Only these features — nothing more:

1. **Product display** — `/coffee` route showing 3-5 test products from Gadget
2. **Freshness badge** — "Roasted X hours ago" from metafield
3. **Cart** — Add/remove via Storefront API mutations through Gadget
4. **Checkout** — Redirect to Shopify hosted checkout
5. **AI search** — Extend `ai-chat` with `search_products` tool
6. **Basic vendor view** — Admin page showing orders

## NOT in Phase 1

Multi-vendor payouts, WhatsApp, vendor self-registration, geofencing, courier dispatch, Hydrogen migration, subscriptions.

## Key Packages

- `@gadgetinc/react` — React hooks for Gadget API
- Shopify Storefront API — via Gadget (not direct)

## Metafields for Coffee Products

| Metafield | Type | Purpose |
|-----------|------|---------|
| `roasted_at` | datetime | Freshness calculation |
| `farm_name` | string | Origin story |
| `altitude_masl` | number | Growing altitude |
| `processing_method` | string | Washed/Natural/Honey |
| `tasting_notes` | list.string | Flavor profile |
| `cupping_score` | number | Quality score |
| `neighborhood` | string | Medellín barrio |

## Database Tables (New)

See PRD Section 8 for full schema: `vendors`, `vendor_products`, `orders`, `payouts`, `delivery_zones`, `fulfillment_centers`, `taste_embeddings`, `reorder_predictions`.
