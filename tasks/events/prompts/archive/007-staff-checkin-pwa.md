---
task_id: 007-staff-checkin-pwa
diagram_id: EVENT-TICKET-PURCHASE
prd_section: 15-user-stories.md §4 (S-D-1, S-D-2, S-D-3)
title: /staff/check-in/:event — installable PWA scanner with offline queue
phase: PHASE-1-EVENTS
priority: P0
status: Done
estimated_effort: 1.5 days
area: frontend
skill:
  - frontend-design
  - vercel-react-best-practices
  - vitest-component-testing
edge_function: null
schema_tables: []
depends_on: ['006-ticket-validate-edge-fn']
mermaid_diagram: ../diagrams/09-event-ticket-purchase.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-EVENTS |
| **Route** | `/staff/check-in/:event_id?token=<staff_jwt>` |
| **Auth** | Staff JWT (no Supabase login) — passed in URL, persisted to sessionStorage |
| **Camera** | `getUserMedia` + `jsQR` library (~25KB) |
| **Offline** | Service worker + IndexedDB queue for failed scans |
| **Real-world** | Andrés opens link on Android, taps Allow Camera, scans 240 QRs in 90 min — green ✓ on success, red ✗ + reason on fail |

## Description

**The page.** A focused single-purpose scanner. Fullscreen camera view. Detected QR debounced 5s (same code can't fire twice). Each scan calls `/functions/v1/ticket-validate`. Visual + audio feedback. Counter at top shows attended/sold from a Realtime channel.

**Why PWA (not native).** Phase 1 doesn't need an App Store presence. PWA gets installed via "Add to Home Screen" with a manifest + icons. Equivalent UX for door staff. Native deferred to Phase 4+.

**Why offline matters.** Venue WiFi is unreliable. Per `15-user-stories.md` S-D-3, scans queue in IndexedDB when network drops; flush on reconnect.

## Layout

```
┌─────────────────────────────────────┐
│ 🔵 Reina de Antioquia — Finals      │  ← header (event name)
│ Attended: 240 / 1230  ·  🟢 Online   │  ← live counter + connection state
├─────────────────────────────────────┤
│                                     │
│        [ camera viewfinder ]        │  ← fullscreen video
│             with crosshair          │
│                                     │
├─────────────────────────────────────┤
│  Last: ✅ Camila Restrepo — GA      │  ← last-scan banner (auto-clears 3s)
│  ([Manual entry] [Mute sound])      │  ← fallback CTA
└─────────────────────────────────────┘
```

## Scan flow (happy path)

1. `jsQR` decodes camera frame → QR string detected.
2. Same string scanned in last 5s → ignored (debounce).
3. Optimistic UI: brief "scanning..." flash.
4. Calls `POST /functions/v1/ticket-validate` with `qr_token` + `scanner_event_id`.
5. **On success:** green flash full-screen 1.5s + ✓ + attendee name + ticket tier; scan-counter increments; scanner returns to viewfinder.
6. **On error:** red flash full-screen 2s + ✗ + reason ("Already used at 8:42 PM" / "Wrong event" / "Refunded" / "Counterfeit"); scanner returns.
7. Optional sound: `[chime]` for success, `[buzz]` for error (mutable).

## Offline mode

- On `navigator.onLine === false` OR fetch fails → scan stored in IndexedDB queue.
- Banner: "🔴 Offline · 4 pending"
- Local JWT signature pre-check (cached public key — actually HS256 secret in shared CDN-cached config; HS256 needs the secret, so for true offline we'd need an asymmetric key — **P1 trade-off: we accept that offline mode shows yellow ⏸ "needs sync" instead of green ✓**).
- Scan UI shows yellow ⏸ for queued scans; counter doesn't increment until synced.
- On `online` event: flush queue; counter catches up.

## Realtime counter

- Subscribe to `event_attendees` Realtime channel filtered by `event_id`.
- Counter = `count(*) WHERE qr_used_at IS NOT NULL`.
- Total = `event_tickets.qty_sold` summed.
- Updates from any other scanner (concurrent door staff) reflected within 2s.

## Manual entry fallback

If camera fails (broken / denied / poor light):
- "Enter code manually" button → opens text input for the QR string OR the order short_id.
- Same `/ticket-validate` call.

## Acceptance Criteria

- [ ] PWA installable: manifest + service worker + icons (192px + 512px).
- [ ] Scanning: 240 successful scans in 90 minutes without crash.
- [ ] Round-trip latency on 4G: <500ms p95 (matches edge fn target).
- [ ] Concurrent scanners: 2 staff scanning the same QR simultaneously → exactly 1 sees ✓, 1 sees "already used."
- [ ] Camera permission denied → manual-entry fallback works.
- [ ] Offline: 5 scans while offline → all queued; reconnect → all sync within 30s.
- [ ] Wrong event: organizer's staff link for event A used at event B (paste mismatch) → "Wrong event" error, no DB write.
- [ ] Sound mute toggle persists across reloads (localStorage).
- [ ] Manifest + service worker installable + offline shell verified manually (Lighthouse PWA audit score is aspirational — camera + fullscreen UIs often fight PWA audits).
- [ ] Lighthouse a11y score ≥ 90.

## Failure handling

- Camera API not supported (older browsers) → manual-entry only mode.
- jsQR memory leak after 100s of scans → reset video stream every 60s.
- Scanner JWT expired (24h) → "Ask organizer for new link" full-screen state.

## Wiring plan

1. Read `src/components/onboarding/CameraCapture.tsx` (existing camera pattern).
2. Install: `npm install jsqr` (~25KB, MIT).
3. Read `vite.config.ts` for the existing PWA plugin pattern (or install `vite-plugin-pwa`).
4. Create `src/pages/staff/StaffCheckIn.tsx`.
5. Create `src/components/staff/{Scanner,ResultBanner,OfflineQueue}.tsx`.
6. Create `src/hooks/useScanner.ts` (camera lifecycle + jsQR loop + debounce).
7. Create `src/lib/scanQueue.ts` (IndexedDB wrapper).
8. Add `public/manifest.webmanifest` + service worker registration.
9. Add the route to `src/App.tsx` — public (no Supabase login required; staff JWT is the auth).
10. Vitest: 1 unit test for debounce + 1 integration test for offline queue flush.

## See also

- [`006-ticket-validate-edge-fn.md`](./006-ticket-validate-edge-fn.md) — backend
- [`003-host-event-dashboard.md`](./003-host-event-dashboard.md) — where the staff link is generated
- [`../15-user-stories.md`](../15-user-stories.md) §4 (S-D-1 through S-D-3)
- `src/components/onboarding/CameraCapture.tsx` — existing camera shell pattern
