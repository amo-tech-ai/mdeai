import { useNavigate } from 'react-router-dom';
import { Map, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatAction } from '@/types/chat';

interface ChatActionBarProps {
  actions: ChatAction[];
  /** Called after the user clicks an action — lets parent close the chat widget, etc. */
  onActionDispatched?: (action: ChatAction) => void;
}

/**
 * Renders affordances under the latest assistant message for structured
 * actions that arrived via the ai-chat SSE sidecar (`mdeai_actions`).
 *
 * Currently handles OPEN_RENTALS_RESULTS — navigates to /apartments with
 * filters encoded in a `?q=` URL param so the page can hydrate the same
 * search the chat just performed.
 */
export function ChatActionBar({ actions, onActionDispatched }: ChatActionBarProps) {
  const navigate = useNavigate();

  if (!actions || actions.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {actions.map((action, i) => {
        if (action.type === 'OPEN_RENTALS_RESULTS') {
          const count = action.payload.listing_ids?.length ?? 0;
          return (
            <Button
              key={`${action.type}-${i}`}
              size="sm"
              onClick={() => {
                const q = encodeURIComponent(JSON.stringify(action.payload.filters ?? {}));
                navigate(`/apartments?q=${q}`);
                onActionDispatched?.(action);
              }}
              className="rounded-full"
            >
              <Map className="w-3.5 h-3.5 mr-1.5" />
              See {count > 0 ? `all ${count}` : 'all'} on the map
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          );
        }
        return null;
      })}
    </div>
  );
}
