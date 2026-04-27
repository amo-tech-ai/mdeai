// This file used to host the original 3-panel layout. The implementation
// moved to `src/components/explore/ThreePanelLayout.tsx` and the context
// moved to `src/context/ThreePanelContext.tsx`.
//
// This shim only re-exports the modern API. The previous `usePanelContext`
// alias used CommonJS `require()` which doesn't exist in Vite/ESM browser
// builds and threw `ReferenceError: require is not defined` at runtime —
// causing a blank page on /apartments/:id when chat-map clicks landed there.
// Removed; callers should import `useThreePanelContext` directly.
export {
  ThreePanelLayout,
  useThreePanelContext,
  usePanel,
} from "@/components/explore/ThreePanelLayout";
