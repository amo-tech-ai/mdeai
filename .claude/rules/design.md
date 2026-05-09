---
paths:
  - "src/**/*.css"
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# Design System — "Paisa" Brand

mdeai.co uses a warm luxury aesthetic inspired by Medellín's Paisa culture: natural warmth, quiet confidence, and understated elegance. Not flashy. Not cold tech. Think boutique hotel in El Poblado, not Silicon Valley SaaS.

---

## Color Tokens

All colors are CSS custom properties in `src/index.css` and aliased in `tailwind.config.ts`. **Never hardcode hex or rgb — always use CSS variables or Tailwind tokens.**

```yaml
colors:
  emerald-deep:   "hsl(160 60% 22%)"   # #1a5c42 — primary CTA, nav active
  emerald-light:  "hsl(160 40% 40%)"   # #3d8c6b — hover states, icons
  cream:          "hsl(40 25% 97%)"    # #f9f7f3 — page background (light)
  cream-dark:     "hsl(40 18% 92%)"   # #ede8e0 — card backgrounds, inputs
  charcoal:       "hsl(220 20% 20%)"  # #282f3d — primary text
  charcoal-light: "hsl(220 15% 35%)"  # #495667 — secondary text, labels
  gold:           "hsl(42 80% 48%)"   # #d4821a — awards, premium badges only
  gold-muted:     "hsl(42 40% 70%)"   # #c9a87c — subtle gold accents
  border:         "hsl(40 15% 88%)"   # #e2dcd3 — dividers, input borders
  muted:          "hsl(40 15% 92%)"   # #eae5de — subtle section fills

dark_mode:
  background:  "hsl(220 20% 8%)"   # near-black charcoal
  foreground:  "hsl(40 20% 95%)"   # warm white
  primary:     "hsl(160 45% 45%)"  # lighter emerald for contrast
```

### Usage rules
- `emerald-deep` / `primary` — buttons, active nav, key accents. Use sparingly.
- `cream` / `background` — page canvas. Never use white (#ffffff) for large backgrounds.
- `gold` — awards, "Premium" labels, contest podiums only. Never for UI chrome.
- Destructive / error — `hsl(0 70% 55%)` (Tailwind `destructive`). Never use raw red.

---

## Typography

```yaml
fonts:
  body:    "DM Sans"          # font-sans — all body copy, UI labels, buttons
  display: "Playfair Display" # font-display — h1–h6, hero text, section headings

type_scale:
  display-2xl: "3.75rem / 1.1 / tracking-tight"   # hero headlines
  display-xl:  "3rem / 1.15 / tracking-tight"      # page titles
  display-lg:  "2.25rem / 1.2 / tracking-tight"    # section headings
  body-xl:     "1.25rem / 1.6 / tracking-normal"   # lead paragraphs
  body-lg:     "1.125rem / 1.65 / tracking-normal" # default body
  body-md:     "1rem / 1.6 / tracking-normal"      # secondary copy
  body-sm:     "0.875rem / 1.5 / tracking-normal"  # captions, labels
  body-xs:     "0.75rem / 1.4 / tracking-wide"     # badges, overlines

utility_classes:
  text-display: "font-display tracking-tight"
  text-body:    "font-sans tracking-normal leading-relaxed"
```

### Usage rules
- `font-display` (Playfair) — headings only. Never for body copy, buttons, or nav.
- `font-sans` (DM Sans) — everything else. Labels, buttons, nav, body.
- Headings (`h1`–`h6`) automatically get `font-display tracking-tight` via global base styles.
- Use `text-balance` for headline wrapping on short display text.

---

## Spacing & Layout

```yaml
spacing:
  base_unit:  "4px"   # Tailwind default — all spacing is multiples of 4px
  content_padding:
    mobile:  "16px (p-4)"
    tablet:  "24px (p-6)"
    desktop: "32px (p-8)"

breakpoints:
  sm:  "640px"   # small phone landscape / large phone
  md:  "768px"   # tablet portrait — panels begin collapsing here
  lg:  "1024px"  # tablet landscape / small laptop — 3-panel layout active
  xl:  "1280px"  # desktop
  2xl: "1400px"  # wide desktop — container max-width

container:
  max_width: "1400px"
  padding:   "32px (p-8)"
  centered:  true

three_panel_widths:
  left:  "w-80 (320px)"    # context / filters
  main:  "flex-1"          # primary content
  right: "w-96 (384px)"    # map / AI / quick actions
```

---

## Border Radius

```yaml
radius:
  base: "0.75rem (12px)"  # --radius — cards, inputs, dialogs
  sm:   "0.5rem (8px)"    # calc(--radius - 4px)
  md:   "0.625rem (10px)" # calc(--radius - 2px)
  lg:   "0.75rem (12px)"  # var(--radius) — same as base
  xl:   "1rem (16px)"     # calc(--radius + 4px)
  2xl:  "1.25rem (20px)"  # calc(--radius + 8px)
  3xl:  "1.5rem (24px)"   # fully rounded panels
  full: "9999px"          # pills, avatar badges
```

---

## Shadows & Elevation

```yaml
shadows:
  soft:     "0 1px 3px hsl(220 20% 20% / 4%), 0 4px 16px hsl(220 20% 20% / 4%)"
  card:     "0 1px 2px hsl(220 20% 20% / 4%), 0 2px 8px hsl(220 20% 20% / 6%)"
  elevated: "0 4px 12px hsl(220 20% 20% / 8%), 0 16px 48px hsl(220 20% 20% / 12%)"

elevation_map:
  0 - flat:     "no shadow — table rows, list items"
  1 - card:     "shadow-card — listing cards, form panels"
  2 - elevated: "shadow-elevated — modals, dropdowns, hover state"
  hover:        "shadow-elevated + -translate-y-0.5 (use .hover-lift class)"
```

---

## Motion & Animation

```yaml
animations:
  fade-in:        "0.4s ease-out — page section entry"
  fade-in-up:     "0.5s ease-out — hero and above-fold content"
  slide-in-right: "0.35s ease-out — right panel / drawer open"
  slide-in-left:  "0.35s ease-out — left panel / sidebar open"
  scale-in:       "0.25s ease-out — modal / popover appear"
  pulse-soft:     "2s ease-in-out infinite — loading indicators"
```

### Usage rules
- Prefer `fade-in` / `fade-in-up` for content reveals.
- Never animate layout-shifting properties (width, height, top, left) — use transform only.
- Respect `prefers-reduced-motion` — all animations must degrade gracefully.

---

## Component Patterns

### Cards
```tsx
// Standard listing card
<div className="bg-card rounded-xl shadow-card hover-lift border border-border p-4">
  ...
</div>

// Featured / elevated card
<div className="bg-card rounded-2xl shadow-elevated border border-border p-6">
  ...
</div>
```

### Buttons
Use shadcn/ui `<Button>`. Variants:
- `default` → emerald fill (primary CTA — one per screen section)
- `secondary` → cream fill with charcoal text
- `outline` → transparent with border
- `ghost` → no background (nav actions, icon buttons)
- `destructive` → red fill (irreversible actions only)

### Gradients
```tsx
// Hero backgrounds — use utility class, not inline style
<div className="gradient-hero text-primary-foreground">...</div>

// Subtle section separators
<div className="gradient-subtle">...</div>
```

---

## Responsive Behavior

| Breakpoint | Layout | Panels |
|-----------|--------|--------|
| < md (767px) | Single column | All panels stacked; bottom nav replaces sidebar |
| md–lg (768–1023px) | Two column | Left panel hidden in drawer; right panel below main |
| ≥ lg (1024px) | Three column | All three panels visible simultaneously |

### Mobile rules
- Minimum tap target: `44px × 44px`
- Bottom nav height: `64px` + `safe-area-inset-bottom`
- Floating chat widget: fixed bottom-right, above bottom nav
- Map in right panel collapses to full-screen overlay on mobile

---

## Explicit Don'ts

- **No hardcoded hex/rgb/hsl** — always use CSS variables or Tailwind tokens
- **No #ffffff white backgrounds** — use `bg-cream` / `bg-background`
- **No Playfair Display for body copy** — `font-display` is headings only
- **No gold for UI chrome** — gold is for awards/prizes/podiums exclusively
- **No rebuilding shadcn primitives** — use `<Button>`, `<Dialog>`, `<Select>`, etc.
- **No mixing font families in a single UI block** — heading then body only
- **No layout-property animations** — transform + opacity only
- **No dark backgrounds in light mode** — except intentional hero sections
- **No inline `style=` color values** — always Tailwind class or CSS variable

---

## Brand Philosophy

**Paisa warmth, not Silicon Valley cold.** Medellín's transformation story is one of warmth, resilience, and quiet pride — the design reflects this. Colours are organic (emerald from the Andes, cream from stucco walls, gold from afternoon light). Typography is elegant but readable. Interactions feel considered, not rushed.

The product is a concierge, not a search engine. Whitespace is generous. CTAs are confident but never aggressive. Trust is built through clarity and calm — not urgency patterns or dark UI.

**When in doubt:** quieter, warmer, slower.
