import { useEffect, useState } from 'react';
import { Sparkles, DollarSign, Heart, MapPin, Calendar } from 'lucide-react';
import { ThreePanelLayout } from '@/components/explore/ThreePanelLayout';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import type { ChatTab } from '@/types/chat';
import { Button } from '@/components/ui/button';

/**
 * Mindtrip-style chat-as-app canvas.
 *
 * Wraps the existing `ThreePanelLayout` (left nav · center · right panel) and
 * puts the conversation in the center column — no floating widget. The map
 * in the right panel is wired in Wed's work (ChatMap.tsx); for Day 1 it
 * remains the existing RightDetailPanel.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Mon.
 */

const QUICK_ACTIONS = [
  { icon: MapPin, label: 'Top rentals in Laureles', query: 'top 5 rentals in Laureles' },
  { icon: DollarSign, label: 'Under $1,000', query: 'apartments in Medellín under $1000' },
  { icon: Heart, label: 'Pet-friendly El Poblado', query: 'pet-friendly rentals in El Poblado' },
  { icon: Calendar, label: 'Monthly stay, fast WiFi', query: 'monthly stay with fast WiFi in Laureles' },
];

function WelcomeState({ onQuery }: { onQuery: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
        What are you looking for in Medellín?
      </h1>
      <p className="text-muted-foreground mb-8 text-lg">
        Rentals, neighborhoods, things to do — ask anything. Your AI concierge
        will search verified listings and show them on the map.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="rounded-full"
            onClick={() => onQuery(action.query)}
          >
            <action.icon className="w-3.5 h-3.5 mr-2" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface ChatCanvasProps {
  /** Seed tab for conversations. Rentals-focused app defaults to 'concierge'. */
  defaultTab?: ChatTab;
}

function ChatCanvasInner({ defaultTab = 'concierge' }: ChatCanvasProps) {
  const [activeTab] = useState<ChatTab>(defaultTab);
  const { user } = useAuth();

  const {
    messages,
    isLoading,
    isStreaming,
    error,
    pendingActions,
    fetchConversations,
    sendMessage,
    cancelStream,
    retryLastMessage,
    setPendingActions,
  } = useChat(activeTab);

  useEffect(() => {
    if (user) fetchConversations();
    // Intentional: re-fetch when the user identity changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen">
      {/* Messages area — fills available height, scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {messages.length === 0 ? (
          <WelcomeState onQuery={sendMessage} />
        ) : (
          <ChatMessageList
            messages={messages}
            isStreaming={isStreaming}
            isLoading={isLoading}
            error={error}
            onRetry={retryLastMessage}
            pendingActions={pendingActions}
            onActionDispatched={() => setPendingActions([])}
          />
        )}
      </div>

      {/* Composer pinned to bottom */}
      <div className="border-t border-border bg-background/80 backdrop-blur p-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            onCancel={cancelStream}
            isLoading={isLoading}
            isStreaming={isStreaming}
            placeholder="Ask about rentals, neighborhoods, or plans..."
          />
        </div>
      </div>
    </div>
  );
}

export function ChatCanvas(props: ChatCanvasProps) {
  return (
    <ThreePanelLayout>
      <ChatCanvasInner {...props} />
    </ThreePanelLayout>
  );
}
