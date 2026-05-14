# Maps & Grounding Outcome Rubric

**When to run:** Diff touches any of:
- `src/**/Map*.tsx` or `src/**/map*.tsx`
- `@vis.gl/react-google-maps` loader or `<APIProvider>`
- `src/mastra/lib/maps-grounding-client.ts` or `google-places-client.ts`
- `src/mastra/tools/search-grounded-places.ts` (when built)
- Any MCP tool that calls `mapstools.googleapis.com`

**max_iterations:** 5
**Modes:** Fast (criteria 1, 2 only — for marker icon swaps or styling tweaks) · **Full (default — A. Rendering 1–6 + B. Grounding 7–10)** · Locked (Full + criterion 11 real Medellín smoke).
**Prerequisites (external services — fails closed if unreachable):**
- `VITE_GOOGLE_MAPS_API_KEY` in `.env` for criteria 1–6 (Maps JS).
- `GOOGLE_MAPS_API_KEY` server-side with **Maps Grounding Lite API enabled** for criteria 8, 11 — **currently a known blocker** (`H2` in `grounding-runtime-hardening.md`). If the API is not enabled, paste `BLOCKED — Maps Grounding Lite API disabled` and those criteria fail until the GCP project is configured.
- `MASTRA-066` (`<GroundingAttribution>` component) shipped — criterion 7 fails by definition until it lands.

**Forbidden shortcuts:**
- Do NOT pass criterion 2 (renders) by reading JSX code. Require a screenshot from preview or `preview_snapshot` output.
- Do NOT pass criterion 4 (mobile drawer) without a viewport 375×812 screenshot showing the drawer in the open state.
- Do NOT pass criterion 7 (attribution badge) by grep-ing for the component name. Require a screenshot showing the Google logo and "Powered by Google" text are visible on screen adjacent to grounded results.
- Do NOT pass criterion 8 (fallback chain) by reading the tool file. Require a log excerpt or test output showing the fallback was invoked and returned results.
- Do NOT corroborate Places API quota by assumption; require an actual test call and response paste.

**Out of scope (do not grade):**
- Marker icon aesthetics or color choices.
- Tailwind class formatting in non-map components.
- Map features for verticals not included in this PR's scope (e.g., don't check events map if PR only touches rentals map).

---

## Coverage checklist

### A. Maps rendering (applies when `src/**/Map*.tsx` is in the diff)

1. **`<APIProvider>` wraps the map with the correct key.**
   Paste: `grep -n "APIProvider" src/components/<changed-file>.tsx` (or equivalent)
   The key prop must reference `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` — not a hardcoded string.
   Fail if the key is hardcoded or sourced from a server-side env var (would be undefined in the browser).

2. **Map renders at 1440×900 — desktop.**
   Open the route in preview at viewport 1440×900. Take a screenshot. Attach it.
   Paste: browser console output of `document.querySelectorAll('canvas, div[aria-label*="Map"]').length`
   Must be > 0. Fail if the screenshot shows a blank/grey box or loading spinner.

3. **Markers render and count matches data.**
   In the same desktop screenshot: markers (pins) must be visible.
   Paste: `window.__MAP_DEBUG__?.markerCount` and `window.__MAP_DEBUG__?.dataLength`
   (If `__MAP_DEBUG__` is not defined, paste the equivalent: the count returned by `data.length` in the component and the count of `<AdvancedMarker>` elements rendered.)
   Counts must be equal. Fail if markerCount !== dataLength.

4. **Mobile: map renders AND bottom drawer opens at 375×812.**
   Open the route at viewport 375×812. Take screenshot (map visible, no horizontal scroll).
   Click a marker pin. Take a second screenshot showing the drawer/sheet in the open state with a result card visible.
   Attach both screenshots. Fail if either screenshot is missing or shows a blank/broken state.

5. **Card ↔ pin sync: clicking a list card highlights the corresponding pin.**
   At desktop (1440×900), click a card in the list panel.
   Paste screenshot showing the corresponding map pin highlighted (different color/size/z-index).
   Fail if the screenshot shows no visual change on the map after clicking a card.

6. **Error state exists when map fails to load.**
   Set `VITE_GOOGLE_MAPS_API_KEY=INVALID_KEY_FOR_TEST` in the dev environment.
   Open the route. Paste a screenshot showing a non-blank error message (not a grey box, not a silent failure).
   Restore the correct key. Fail if no error UI appears.

### B. Grounding integration (applies when grounding client or tools are in the diff)

7. **`<GroundingAttribution>` badge is visible next to grounded results.**
   Open a route that shows grounded search results (search for "restaurante El Poblado Medellín").
   Take a screenshot. The badge must show:
   - The Google logo (not just the word "Google")
   - Text: "Powered by Google"
   The badge must be visible without scrolling (not hidden behind pagination or drawer chrome).
   Paste the screenshot. Fail if the badge is absent, text-only, or cut off.
   **Note:** If MASTRA-066 (`<GroundingAttribution>`) is not yet built, this criterion FAILS by definition — document this explicitly: "MASTRA-066 not built — criterion fails until MASTRA-066 ships."

8. **Fallback chain executes: MCP → Places SDK → Supabase.**
   Trigger a search that exhausts MCP (set `GOOGLE_MAPS_API_KEY=INVALID` temporarily, or use a test hook).
   Paste the log output or test assertion showing:
   - MCP call attempted → failed / circuit open
   - Places SDK called → returned results OR failed
   - Supabase fallback called → returned results
   Each tier's attempt must be logged. Fail if any tier is silently skipped.

9. **Tool whitelist enforced — no unknown MCP tools dispatched.**
   Run: `node --env-file=.env.local my-mastra-app/scripts/verify-grounding-runtime.mjs`
   Paste the output. Must show "3 expected tools, 0 unknown."
   Fail if any unknown tools appear in `listTools()` output.

10. **No Grounding API key in browser bundle.**
    Run: `npm run build` then
    `grep -r "mde-maps-server\|GOOGLE_MAPS_API_KEY=" dist/assets/*.js | head -3`
    (Replace `mde-maps-server` with the last 6 chars of your actual `GOOGLE_MAPS_API_KEY` value.)
    Server-side key must NOT appear in dist. Browser key (`VITE_GOOGLE_MAPS_API_KEY`) is allowed.
    Paste the grep output. Fail if the server-side key or its tail appears.

11. **Real Medellín smoke — end-to-end grounded result.**
    (Only required if `GOOGLE_MAPS_API_KEY` is a valid, API-enabled key in the test environment.)
    Run: `node --env-file=.env.local my-mastra-app/scripts/verify-grounded-search.mjs`
    Paste the final `N/5 grounded calls succeeded` line.
    Must be `5/5`. Fail if < 5.
    If the API is not enabled in the test environment, paste: "Live smoke skipped — Maps Grounding Lite API not enabled in test project. Blocker: H2 from grounding-runtime-hardening.md."

---

## Output format

Line 1: `Pass N/11. <one-line summary>`

Then, for each FAILED criterion:
`<id> - FAIL. <specific gap>. <what to do>`

Example:
```
Pass 9/11. Rendering and whitelist green; attribution and fallback not verified.
7 - FAIL. <GroundingAttribution> badge is absent from the search results page. MASTRA-066 must ship before grounded UI can go to production.
8 - FAIL. Log output shows MCP → Places SDK but no Supabase fallback attempt. Wire the third tier in search-grounded-places.ts.
```
