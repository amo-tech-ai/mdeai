---
id: MASTRA-047-LOCALHOST
title: MASTRA-047 localhost browser verification
created: 2026-05-11
method: Playwright headless (Cursor Browser @Browser not available in this agent session)
browser_docs: https://cursor.com/de/docs/agent/tools/browser
---

# MASTRA-047 Localhost Verification Report

## Environment

| Item | Value |
|------|--------|
| **Frontend URL** | `http://127.0.0.1:8081/` (Vite picked **8081** because **8080** was already in use) |
| **Mastra URL** | **Not started** this run — `.env.local` has no `VITE_USE_MASTRA_CHAT` / `VITE_MASTRA_SERVER_URL` entries; Mastra dev script is `cd my-mastra-app && npm run dev` (typically `http://localhost:4111` per CLAUDE.md) |
| **Browser used** | Chromium via **Playwright** (`scripts/mastra-047-browser-smoke.mjs`) |

**Note:** [Cursor Browser tools](https://cursor.com/de/docs/agent/tools/browser) (inline preview, console/network tooling, screenshots in chat) are the recommended interactive path for prompts 3–8; this agent used automated Playwright smoke only.

---

## Startup

**PASS** (with notes)

| Check | Result |
|-------|--------|
| `npm run dev` | **PASS** — Vite ready ~170ms |
| Frontend loads `/chat`, `/concierge` | **PASS** — HTTP 200 |
| Blank screen / React crash | **NONE** — `pageErrors` array empty on both routes |
| `setPins is not a function` | **NONE** |
| Zod / invalid version runtime throws | **NONE** observed in console |

**Startup warnings (Vite log):**

- Port fallback: `8080` → `8081`
- Browserslist age notice
- Tailwind ambiguous class warning (`ease-[cubic-bezier(...)]`)

`npm install` was **not** re-run (existing `node_modules` assumed current).

---

## Multi-tool verification

**NOT EXECUTED (automated)** — **PARTIAL / MANUAL REQUIRED**

Reason: Full multi-tool flows need a **live Mastra or ai-chat stream**, tool outputs, and usually **auth or anon session** completion. Headless smoke only confirmed chat UI shell (textarea present on `/chat`; `/concierge` shows sign-in style gate per body-text heuristic).

**Regression proxy (already green):**

- `src/context/MapContext.test.ts` — events + restaurants coexist; second event replaces only events.
- `src/lib/chat/normalize-tool-output.test.ts` — `version: 1`, gate v2, unwrap, transforms.

**Manual checklist** (use Cursor Browser or signed-in session):

1. `events and restaurants this weekend in Poblado`
2. `restaurants near Laureles`
3. `events in Laureles`
4. `apartments and attractions near Provenza`

---

## Versioning verification

**NOT OBSERVED IN NETWORK (automated)** — **COVERED BY UNIT TESTS**

- SSE / `tool-output-available` payloads were not captured in Playwright smoke.
- **Evidence elsewhere:** `listingToolActionPassesVersionGate` + `normalizeToolOutput` tests assert `version: 1` and v2 skip + warn.

**Manual:** DevTools → Network → filter fetch/stream to Mastra or Supabase `ai-chat`; confirm listing actions include `"version":1` when MASTRA path emits normalized actions.

---

## Pin merge verification

**NOT VISUALLY CONFIRMED** — **UNIT TESTS PASS**

- No assertion in this run that map markers showed multiple categories simultaneously (Maps API / credentials / viewport dependent).

---

## Console / network audit

**PASS with warnings**

| Category | Finding |
|----------|---------|
| **Uncaught exceptions** | None (`pageErrors: []`) |
| **React Router** | v7 future-flag warnings (noise) |
| **ChatContextChips / Radix** | React dev **`Function components cannot be given refs`** on `Chip` inside popovers — **pre-existing**, not MASTRA-047-specific |
| **Failed requests** | `/chat`: several `net::ERR_ABORTED` on Vite dependency chunks — typical **request cancellation** during navigation/HMR, not treated as app failure |

---

## Screenshots captured

| File |
|------|
| `tasks/prompts/mastra/audits/screenshots/mastra-047/chat-smoke.png` |
| `tasks/prompts/mastra/audits/screenshots/mastra-047/concierge-smoke.png` |
| `tasks/prompts/mastra/audits/screenshots/mastra-047/mastra-047-playwright-log.json` |

---

## Automation artifact

Re-run smoke:

```bash
cd /home/sk/mde
BASE_URL=http://127.0.0.1:8081 node scripts/mastra-047-browser-smoke.mjs
```

(Adjust port if Vite prints a different URL.)

---

## Red flags

1. **8080 conflict** — verify single dev server or always read Vite’s printed URL.
2. **Mastra not verified** — multi-tool + `tool-output-available` path needs Mastra (or flag-on) + backend reachability.
3. **`/concierge` gate** — smoke suggests login wall; deep MASTRA-047 map tests may require authenticated session on that route.
4. **Chip ref warnings** — fix separately (accessibility / Radix `forwardRef`), unrelated to pin merge.
5. **Reset behavior** — full reload / new-chat pin clear not exercised in this smoke (ChatCanvas logic verified in code review earlier).

---

## Final verdict

| Question | Answer |
|----------|--------|
| **Ready for PR** | **YES** (same as static/unit verification), **conditional on manual multi-tool map pass** per task DoD |
| **Production-safe** | **LIKELY** — no runtime crashes in smoke; merge/version logic covered by tests |
| **Required follow-ups** | 1) Manual Cursor Browser run with Mastra + signed-in/anon chat. 2) Screenshot mixed-category map for PR body. 3) Optional: start `my-mastra-app` when `VITE_USE_MASTRA_CHAT=true`. |

### Short checklist (047 UI proof)

```txt
047 localhost UI proof complete only if:
✅ App loads (PASS — /chat, /concierge 200)
✅ No hard crash / setPins errors (PASS)
⏳ Multi-tool pins coexist — MANUAL or Mastra e2e
⏳ Network shows version:1 on listing actions — MANUAL
✅ Automated fallback: Vitest merge + version tests (PASS)
```
