import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Index from './Index';

/**
 * Public homepage at `/`.
 *
 * Logged-out users see the marketing landing (`<Index />`) — including the
 * <HeroChatPrompt> primary entry point.
 * Logged-in users get a synchronous declarative redirect to `/chat`. We
 * use react-router's <Navigate replace /> rather than `useEffect + navigate()`
 * so there is NO flash of marketing content for authed visitors.
 *
 * `loading: true` is treated as "render nothing" (one frame max) — better than
 * flashing the marketing page only to redirect a millisecond later.
 *
 * **Lazy-chunk pre-fetch.** ChatCanvas is the most likely next destination
 * regardless of whether the user is currently anon (HeroChatPrompt → auth
 * handoff → /chat) or authed (Navigate above → /chat). Kicking off the
 * chunk download in the background here means the Suspense fallback in
 * <App> almost never paints — by the time React resolves the redirect or
 * the user submits the hero prompt, the chunk is already cached.
 * The promise is intentionally NOT awaited; failures are silent so a
 * pre-fetch hiccup never breaks the visible page.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md + maps audit § revised plan.
 */
export default function Home() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Fire-and-forget pre-fetch. Same import path as the lazy() in App.tsx
    // so Vite recognises and de-duplicates the chunk request.
    void import('@/components/chat/ChatCanvas');
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/chat" replace />;
  return <Index />;
}
