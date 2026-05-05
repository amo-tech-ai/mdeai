/**
 * Service worker for the MDE Staff Check-in PWA.
 *
 * Strategy: network-first for API calls, cache-first for static assets.
 * The SW caches the app shell so the scanner UI loads without network.
 */

const CACHE = "mde-staff-v1";
const SHELL = ["/", "/staff/check-in", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Pass through non-GET and cross-origin (Supabase, Stripe)
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Network-first for edge function calls
  if (url.pathname.startsWith("/functions/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        }),
      ),
    );
    return;
  }

  // Cache-first for everything else (app shell, JS chunks, CSS)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, clone));
        }
        return res;
      });
    }),
  );
});
