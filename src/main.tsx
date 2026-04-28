import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry, SentryErrorBoundary } from "@/lib/sentry";

// Initialize Sentry FIRST — before React mounts. Idempotent + silent
// if VITE_SENTRY_DSN isn't set (so dev builds don't spam Sentry).
// Also rebinds the maps-telemetry sink so every map event flows as a
// Sentry breadcrumb + every map *_failed event becomes a captured issue.
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
