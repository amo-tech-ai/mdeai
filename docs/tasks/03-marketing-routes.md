# ILM — Marketing Routes: Generate Prompts

**Document:** Implementation prompts for marketing and legal routes. No code in prompts.  
**Reference:** `tasks/plan/0-progress-tracker.md` (2.2, 5.2, 5.3–5.5) · `tasks/plan/00-generate-prompts-template.md`  
**Last Updated:** 2026-01-28  

---

## Summary Table

| Dimension | Items |
|-----------|--------|
| **Screens** | Index (home), How it works, Pricing, Privacy policy, Terms of service. |
| **Features** | Public marketing pages, legal pages, footer links, sitemap. |
| **Agents** | None (static content). |
| **Use cases** | User learns how ILM works; user sees pricing; user reads privacy/terms before signup. |
| **Real-world examples** | Visitor clicks “How it works” in footer → sees step-by-step; visitor opens Pricing → sees plans; visitor reads Privacy before creating account. |

---

## Description

Add public marketing and legal routes to I Love Medellín: How it works (user journey and steps), Pricing (plans or placeholder), Privacy policy, and Terms of service. All are static or CMS-style content; no AI or authenticated-only logic. Out of scope: dynamic pricing, checkout, or legal document versioning.

---

## Rationale

Marketing and legal pages are required for trust, SEO, and compliance. Homepage and onboarding exist; missing routes block conversion and can create legal risk. Static pages are sufficient for first release; pricing can be placeholder until monetization is defined.

---

## User Stories

| Story | Purpose | Goal | Outcome |
|-------|---------|------|---------|
| **How it works** | So visitors understand the product before signup | User opens How it works and sees a clear step-by-step journey | Page explains discover → plan → book → concierge in simple steps. |
| **Pricing** | So visitors see what they pay | User opens Pricing and sees plans or “Coming soon” | Page shows pricing tiers or placeholder. |
| **Privacy** | So users can read data practices before signing up | User opens Privacy policy and reads how data is used | Page describes collection, use, storage, and rights. |
| **Terms** | So users agree to terms before using the app | User opens Terms of service and reads rules | Page describes acceptable use, liability, and termination. |

---

## Acceptance Criteria

- Route slash how-it-works exists and renders a How it works page.
- Route slash pricing exists and renders a Pricing page (content or placeholder).
- Route slash privacy exists and renders a Privacy policy page.
- Route slash terms exists and renders a Terms of service page.
- Footer or global nav links to these routes where appropriate.
- Pages are readable on mobile and desktop; no auth required.
- No code in this doc.

---

## Key Points

- All pages are public; no protected route.
- Content lives in Main panel (full-width or within existing layout).
- Left and Right panels can be minimal or collapsed on marketing pages.
- Use existing design tokens and typography; no new design system.

---

## Three-Panel Layout (Core Model)

| Panel | Role | Content |
|-------|------|---------|
| **Left = Context** | Optional on marketing; can show simple nav or logo | Minimal or hide on how-it-works, pricing, privacy, terms. |
| **Main = Work** | Primary content | How it works steps, pricing table, privacy text, terms text. |
| **Right = Intelligence** | Not used on these pages | Hide or empty. |

---

## Frontend / Backend Wiring Plan

| Layer | Responsibility |
|-------|-----------------|
| **Frontend** | New page components for How it works, Pricing, Privacy, Terms; add routes in app router; add links in footer or header. |
| **Backend** | None; static content. Optional: CMS or markdown later. |
| **Wiring** | User clicks link → router navigates → page renders. No API calls required for first version. |

---

## Supabase Schema

| Area | Relevance |
|------|------------|
| **Tables** | None for static pages. |
| **RLS** | N/A. |
| **Triggers / Realtime** | None. |

---

## Edge Functions

| Function | Role | When invoked |
|----------|------|--------------|
| None | — | — |

---

## Dependencies

- App router and layout in place (existing).
- Footer or global nav component to add links (existing or create).
- Copy for How it works, Pricing, Privacy, Terms (draft or placeholder).

---

## Gemini 3 / Claude SDK / AI Agents

Not used for these pages. Content is static.

---

## AI Agents, Automations, Wizards, Dashboards, Workflows

Not used. Marketing and legal pages are non-AI.

---

## Implementation Prompts (No Code)

Use these prompts for Lovable, Cursor, or other codegen. Do not add code to this doc.

---

### MR-P1 — Add routes for How it works, Pricing, Privacy, Terms

**Description:** Register four public routes and render a page for each.

**Prompt:** For I Love Medellín, add four public routes: slash how-it-works, slash pricing, slash privacy, slash terms. Each route must render a dedicated page component. Pages can be placeholder content (heading and short paragraph) for now. Use the existing app router and layout. Do not require authentication for these routes. Add links to these routes in the footer or in the main navigation where it makes sense for a marketing site. Follow the project structure: pages in the pages directory, routes declared in the app router. Do not paste code into tasks/plan/06-marketing-routes-prompts.md.

---

### MR-P2 — How it works page content and structure

**Description:** Define and implement the How it works page structure and content.

**Prompt:** For I Love Medellín, implement the How it works page so it explains the user journey in clear steps: for example discover (explore events, restaurants, rentals), plan (create trip, add items, optimize route), book (reserve tables, rentals, events), and use the concierge (chat for suggestions). Use the Main area for content; keep Left and Right panels minimal or hidden on this page. Use existing design tokens and typography. Content can be short bullets or numbered steps. Ensure the page is responsive and readable. Do not paste code into tasks/plan/06-marketing-routes-prompts.md.

---

### MR-P3 — Pricing page content and structure

**Description:** Define and implement the Pricing page (plans or placeholder).

**Prompt:** For I Love Medellín, implement the Pricing page. If pricing tiers are not yet defined, show a “Coming soon” or “Contact us” message and a short value proposition. If plans exist, show them in a simple table or cards (name, price, features). Use the Main area; keep layout consistent with How it works. Do not implement checkout or payment; this is informational only. Do not paste code into tasks/plan/06-marketing-routes-prompts.md.

---

### MR-P4 — Privacy policy and Terms of service pages

**Description:** Add Privacy policy and Terms of service pages with structure and placeholder or draft copy.

**Prompt:** For I Love Medellín, implement the Privacy policy and Terms of service pages. Each page should have a clear heading and sections (e.g. data collection, use, storage, rights for Privacy; acceptable use, liability, termination for Terms). Use long-form text area in the Main panel; consider scroll and readability. Copy can be placeholder or draft; ensure structure is in place for legal review later. Do not paste code into tasks/plan/06-marketing-routes-prompts.md.
