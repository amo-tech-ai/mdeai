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
 * See: tasks/CHAT-CENTRAL-PLAN.md + maps audit § revised plan.
 */
export default function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/chat" replace />;
  return <Index />;
}
