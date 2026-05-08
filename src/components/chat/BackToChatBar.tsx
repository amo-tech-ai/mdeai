import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackToChatState {
  from?: string;
  conversationId?: string;
}

/**
 * Sticky bar shown at the top of detail pages when the user arrived from /chat.
 * Reads router location.state.from — only renders when from === 'chat'.
 * Back button navigates to /chat with the conversationId in state so useChat
 * can resume the right conversation.
 */
export function BackToChatBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as BackToChatState;

  if (state.from !== 'chat') return null;

  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-2.5 bg-primary text-primary-foreground shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          navigate('/chat', {
            state: state.conversationId ? { conversationId: state.conversationId } : undefined,
          })
        }
        className="h-7 gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to chat
      </Button>
      <div className="flex items-center gap-1.5 text-sm text-primary-foreground/80">
        <MessageCircle className="w-3.5 h-3.5" />
        <span>Your conversation is waiting</span>
      </div>
    </div>
  );
}
