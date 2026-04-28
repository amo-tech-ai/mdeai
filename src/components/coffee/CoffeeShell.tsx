import { Provider as GadgetProvider } from '@gadgetinc/react';
import { Outlet } from 'react-router-dom';
import { gadgetApi } from '@/integrations/gadget/client';

/**
 * Route-scoped Gadget context. Wraps every `/coffee*` route so the
 * <Coffee> + <CoffeeDetail> children can call Gadget hooks
 * (`useFindMany`, `useAction`, etc.) without the rest of the app
 * paying for the Gadget client + provider.
 *
 * Why this matters
 * ----------------
 * Gadget's runtime (`@gadgetinc/react` + the project-specific
 * `@gadget-client/mdeai`) is ~24 KB gzip even after vendor chunking.
 * Before this shell, every route paid that cost on first paint —
 * including marketing pages and the chat canvas, neither of which
 * touch commerce. Lazy-loading the shell drops the gadget chunk from
 * 99 % of page loads.
 *
 * Vite's chunking config (`manualChunks` in vite.config.ts) routes
 * everything from `@gadgetinc/` and `@gadget-client/` into the
 * `gadget` chunk. Because this file is the ONLY consumer of those
 * packages outside `gadgetApi` itself, the chunk is now route-gated.
 *
 * Mounted via React Router's parent-route + <Outlet /> pattern in
 * src/App.tsx so React Router handles the lifecycle (mount on
 * `/coffee*` enter, unmount on leave) automatically.
 */
export default function CoffeeShell() {
  return (
    <GadgetProvider api={gadgetApi}>
      <Outlet />
    </GadgetProvider>
  );
}
