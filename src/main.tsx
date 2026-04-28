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
