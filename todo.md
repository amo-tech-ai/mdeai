# mdeai.co — TODO

> Last updated: April 3, 2026
> Priority: P0 = do this week, P1 = do this month, P2 = next month, P3 = someday

---

## Deploy Latest Changes

App is live and working at www.mdeai.co (Vercel: medell-n-connect.vercel.app).
Homepage, explore, apartments, concierge, etc. all load correctly.
Need to push latest session changes (coffee route, Gadget, branding fixes).

- [ ] **P0** — Push latest code to GitHub (triggers Vercel auto-redeploy)
- [ ] **P0** — Add VITE_SHOPIFY_STORE_DOMAIN + VITE_SHOPIFY_STOREFRONT_TOKEN to Vercel env vars
- [ ] **P0** — Verify /coffee route loads on live site after deploy
- [ ] **P1** — Verify Supabase Auth redirect URLs include www.mdeai.co

---

## Gadget + Coffee Setup (Unblocks Commerce)

- [ ] **P0** — Add 3-5 test coffee products in Shopify admin (mdeaidev.myshopify.com)
  - Set productType = "Coffee", add images, prices in COP
  - Add metafields: roasted_at, farm_name, altitude, processing_method, tasting_notes, cupping_score
- [ ] **P0** — In Gadget dashboard, grant Unauthenticated role read access to `shopifyProduct`
- [ ] **P0** — In Gadget dashboard, add custom fields to shopifyProduct model (roastLevel, origin, flavorNotes, etc.)
- [ ] **P0** — In Gadget dashboard, map Shopify metafields to those Gadget fields
- [ ] **P0** — Trigger "Sync all data" from Gadget Settings > Plugins > Shopify > Installs
- [ ] **P0** — Run `npm run dev`, go to `localhost:8080/coffee`, verify products appear

---

## Phase 1: First Sale (Weeks 1-4)

### Commerce
- [ ] **P0** — Replace CoffeeCard image placeholder with real product media (needs shopifyProductMedia model enabled in Gadget)
- [ ] **P0** — Wire "Add to Cart" button on CoffeeDetail to actual variant ID
- [ ] **P0** — Test full checkout flow: browse > add to cart > Shopify checkout > test payment
- [ ] **P1** — Add cart icon to header showing item count
- [ ] **P1** — Add cart drawer/sheet showing cart contents
- [ ] **P1** — Freshness badge: verify roasted_at metafield syncs and badge displays correctly

### Store Setup
- [ ] **P0** — Fill in Shopify Storefront API metafield definitions for coffee products
- [ ] **P1** — Add 10+ real coffee products from Medellin roasters (Pergamino, Rituales, Cafe Velvet, etc.)
- [ ] **P1** — Set up Shopify test payment gateway for checkout testing
- [ ] **P2** — Configure commission split logic (88% vendor / 12% mdeai) — needs Stripe Connect or Wompi

### Deployment
- [x] Vercel project exists: medell-n-connect.vercel.app (connected to GitHub repo)
- [x] Domain linked: www.mdeai.co
- [ ] **P0** — Push code to GitHub to trigger redeploy with vercel.json fix
- [ ] **P0** — Add Shopify env vars to Vercel dashboard (VITE_SHOPIFY_STORE_DOMAIN, VITE_SHOPIFY_STOREFRONT_TOKEN)
- [ ] **P1** — Verify Gadget webhooks work in production (Shopify > Gadget > synced data)

---

## Phase 1: Polish & Security

### Security Fixes
- [ ] **P0** — Audit admin routes (/admin/*) — currently no proper role guard
- [ ] **P1** — Verify all Supabase tables have RLS enabled (some may be missing)
- [ ] **P1** — Remove .env from git history (contains only public keys but shouldn't be tracked)
- [ ] **P2** — Add rate limiting to edge functions (currently documented but not enforced)

### Missing Features
- [ ] **P1** — Add Google Maps API key (VITE_GOOGLE_MAPS_API_KEY is empty — maps don't work)
- [ ] **P1** — Add "Coffee" link to sidebar navigation (LeftPanel component)
- [ ] **P1** — Add coffee type to RightDetailPanel for 3-panel click-to-detail
- [ ] **P1** — Extend ai-chat edge function with search_products tool (queries Gadget for coffee)
- [ ] **P2** — Add coffee to the Explore page category tabs

### Code Quality
- [ ] **P1** — Fix 41 pre-existing ESLint errors (mostly no-explicit-any)
- [ ] **P1** — Pick one package manager: delete bun.lockb or package-lock.json
- [ ] **P1** — Add .nvmrc file pinning Node version
- [ ] **P2** — Write first Vitest tests for coffee hooks and freshness utility
- [ ] **P2** — Write first Playwright e2e test (navigate to /coffee, verify page loads)

---

## Phase 2: Multi-Vendor Growth (Months 3-5)

### Vendor Portal
- [ ] **P1** — Build vendor self-service registration page
- [ ] **P1** — Build vendor dashboard (orders, products, earnings)
- [ ] **P2** — Vendor product management (add/edit/delete via Gadget actions)
- [ ] **P2** — Vendor payout tracking page

### Payments
- [ ] **P1** — Stripe Connect integration (vendor payouts)
- [ ] **P1** — Wompi integration for COP domestic payments
- [ ] **P2** — Automated weekly payout logic (Friday 8 AM)
- [ ] **P3** — DIAN electronic invoicing (Colombian tax compliance)

### Customers
- [ ] **P1** — Customer order history page
- [ ] **P1** — One-tap reorder from past purchases
- [ ] **P2** — Customer taste profile (vector embeddings from orders)
- [ ] **P2** — "Welcome back" AI memory for returning visitors

### WhatsApp
- [ ] **P2** — WhatsApp Business API setup via Twilio
- [ ] **P2** — Chat-based ordering flow (message > AI > payment link)
- [ ] **P3** — Voice note processing (transcribe + act)

### Multi-Category
- [ ] **P2** — Extend commerce to tours/experiences
- [ ] **P2** — Extend commerce to restaurant reservations with payment
- [ ] **P3** — Subscription model for monthly coffee delivery

---

## Phase 3: Autonomous Operations (Months 6-12)

### Fulfillment
- [ ] **P2** — Courier dispatch automation (payment > GPS pickup/delivery)
- [ ] **P3** — Traffic-aware ETAs using Google Directions + Medellin traffic data
- [ ] **P3** — Real-time courier tracking in chat

### AI Enhancements
- [ ] **P2** — Product auto-categorization (Product Tagger pattern from Gadget templates)
- [ ] **P2** — AI flavor matching (semantic search on taste embeddings)
- [ ] **P3** — Predictive reorder (day 12 of 11-day coffee cycle > reach out)
- [ ] **P3** — Snap-to-Shop vision (photo > identify product > offer to deliver)
- [ ] **P3** — Weather-mood matching (rainy Medellin afternoon > chocolatey brew suggestion)

### Infrastructure
- [ ] **P2** — Neighborhood geofencing (PostGIS delivery zones)
- [ ] **P2** — Product quiz (interactive discovery for new customers, use Gadget template)
- [ ] **P3** — Hydrogen migration evaluation (if performance demands it)

---

## Known Bugs

- [ ] Google Maps empty — VITE_GOOGLE_MAPS_API_KEY is blank
- [ ] Admin routes have no admin role verification
- [ ] Dual lockfiles: bun.lockb + package-lock.json both present
- [ ] NEXT-STEPS.md is outdated — shows Phase 2 tasks as "Todo" that are already complete

---

## Done (April 2026)

- [x] Fixed index.html — changed "Lovable App" to "mdeai.co — Medellín's Digital Concierge"
- [x] Created vercel.json with SPA rewrite rule (fixes 404 on all routes)
- [x] Full codebase audit: confirmed 25+ features WORKING with real Supabase data
- [x] Shopify dev store created and connected to Gadget
- [x] Gadget app deployed (mdeai.gadget.app)
- [x] Shopify CLI app scaffolded (~/mdeai-development/)
- [x] App installed on mdeaidev store
- [x] /coffee route built with Gadget useFindMany hooks
- [x] /coffee/:handle detail page with knowledge graph
- [x] FreshnessBadge component (green/yellow/red)
- [x] useShopifyCart hook (Storefront API)
- [x] CoffeeCard + CoffeeFilters components
- [x] GadgetProvider wired into App.tsx
- [x] CLAUDE.md + .claude/ architecture (rules, commands, skills, agents)
- [x] docs/gadget-best-practices.md (1,500+ lines)
- [x] .gitignore updated for .env files
- [x] .env.local cleaned up and documented
- [x] Node v25 + ggt 3.0.0 + Shopify CLI 3.93.0 installed
