import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Manual vendor-chunk split for the production build.
 *
 * Goals:
 *   1. Cut initial-paint payload — anonymous landing on `/` shouldn't
 *      pay for Gadget (only `/coffee`), Maps helpers (only `/chat` +
 *      `/trips`), or analytics SDKs until they're actually needed.
 *   2. Cache vendor code separately from app code — most deploys
 *      change `src/`, not `node_modules`. Stable vendor chunks let
 *      returning visitors hit warm cache for ~80% of the bytes.
 *   3. Be conservative — over-chunking creates HTTP/2 connection
 *      pressure on slow LATAM 4G. Group related packages into one
 *      chunk each (all of @radix-ui together, etc.).
 *
 * Tier 1 (entry chunk via "no rule matches"):
 *   react / react-dom / react-router-dom / scheduler — needed before
 *   first paint; splitting costs more than it saves.
 *
 * Tier 2 (always-needed vendor chunks):
 *   • supabase — auth needed first-paint; postgrest/realtime are
 *     transitively imported but heavy. Bundled together to avoid
 *     waterfall.
 *   • radix — every shadcn page uses these primitives.
 *   • tanstack — react-query.
 *   • icons — lucide-react (used everywhere).
 *   • forms — react-hook-form + zod.
 *   • dates — date-fns + react-day-picker.
 *
 * Tier 3 (route-specific):
 *   • maps — @googlemaps/* (only /chat + /trips/:id).
 *   • gadget — @gadgetinc/* (only /coffee).
 *   • posthog — posthog-js (deferred; not critical-path).
 *   • sentry — @sentry/react (deferred).
 *   • charts — recharts + d3-* (only dashboards).
 *   • motion — framer-motion (a few flourishes).
 */
function manualChunks(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;
  // Order matters — first match wins. Specific before generic.
  if (id.includes("@googlemaps/")) return "maps";
  if (id.includes("@gadgetinc/") || id.includes("@gadget-client/")) return "gadget";
  if (id.includes("posthog-js")) return "posthog";
  if (id.includes("@sentry/")) return "sentry";
  if (id.includes("recharts") || id.includes("d3-")) return "charts";
  if (id.includes("@radix-ui/")) return "radix";
  if (id.includes("@supabase/")) return "supabase";
  if (id.includes("@tanstack/")) return "tanstack";
  if (id.includes("react-hook-form") || id.includes("@hookform/") || id.includes("/zod/")) return "forms";
  if (id.includes("date-fns") || id.includes("react-day-picker")) return "dates";
  if (id.includes("framer-motion")) return "motion";
  if (id.includes("lucide-react")) return "icons";
  // Default: entry chunk. Includes react / react-dom / react-router /
  // scheduler / clsx / tailwind-merge / etc.
  return undefined;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = (env.VITE_SITE_URL || "https://www.mdeai.co").replace(/\/$/, "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "html-og-site-url",
        transformIndexHtml(html) {
          return html.replaceAll("%SITE_URL%", siteUrl);
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // After vendor splitting, the entry chunk should comfortably sit
      // under this. The warning still fires on regressions.
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
  };
});
