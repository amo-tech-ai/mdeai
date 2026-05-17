import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry, SentryErrorBoundary } from "@/lib/sentry";
import { initPostHog } from "@/lib/posthog";

// Initialize observability FIRST — before React mounts so we catch
// early-mount errors. Both calls are idempotent and silent when their
// env vars are empty (so dev/preview builds don't spam telemetry).
//
// Order matters: initPostHog before initSentry. The Sentry init replaces
// the maps-telemetry sink with one that forwards to BOTH Sentry AND
// PostHog — so PostHog must already be ready to receive forwards.
initPostHog();
initSentry();

// Stale-chunk recovery. When a new deploy rolls out, the browser may still
// have the old `index.html` cached and try to lazy-load chunk hashes that
// no longer exist. The asset URL now correctly 404s (vercel.json excludes
// /assets/* from the SPA fallback), which surfaces as `vite:preloadError`.
// Force a hard reload once so the browser fetches the new index.html with
// the current chunk hashes. The sessionStorage guard prevents an infinite
// reload loop if the failure is for a different reason (e.g. real 5xx).
window.addEventListener("vite:preloadError", (event) => {
  const RELOAD_FLAG = "mdeai:chunk-reload-attempted";
  if (sessionStorage.getItem(RELOAD_FLAG) === "1") {
    // Already tried reloading once; let the error propagate to the boundary.
    return;
  }
  event.preventDefault();
  sessionStorage.setItem(RELOAD_FLAG, "1");
  window.location.reload();
});
// Clear the flag on successful load so a future stale-chunk error can recover.
window.addEventListener("load", () => {
  sessionStorage.removeItem("mdeai:chunk-reload-attempted");
});

createRoot(document.getElementById("root")!).render(
  <SentryErrorBoundary
    fallback={({ error, resetError }) => (
      <div
        role="alert"
        style={{
          padding: "2rem",
          maxWidth: 480,
          margin: "4rem auto",
          fontFamily: "system-ui, sans-serif",
          color: "#1f2937",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8 }}>
          Something broke
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 16, fontSize: "0.95rem" }}>
          We&apos;ve been notified. Try reloading — if it keeps happening, ping us.
        </p>
        <pre
          style={{
            fontSize: 12,
            color: "#991b1b",
            background: "#fef2f2",
            padding: 12,
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            marginBottom: 16,
          }}
        >
          {(error as Error)?.message ?? "Unknown error"}
        </pre>
        <button
          type="button"
          onClick={resetError}
          style={{
            background: "#10b981",
            color: "white",
            border: 0,
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Try again
        </button>
      </div>
    )}
  >
    <App />
  </SentryErrorBoundary>,
);
