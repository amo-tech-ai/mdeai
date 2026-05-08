import { useLocation } from 'react-router-dom';
import { WORKSPACES, type WorkspaceConfig } from '@/config/workspaces';

export function useWorkspace(): WorkspaceConfig | null {
  const { pathname } = useLocation();
  // Skip /chat (too generic). Prefer longer href matches (e.g. /host/listings > /host).
  const match = WORKSPACES.filter(
    (w) => w.href !== '/chat' && pathname.startsWith(w.href),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match ?? null;
}
