import { useEffect, useState } from 'react';
import { Sparkles, DollarSign, Heart, MapPin, Calendar } from 'lucide-react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ChatMap } from './ChatMap';
import { EmailGateModal } from './EmailGateModal';
import { LeftPanel } from '@/components/layout/LeftPanel';
import { MobileNav } from '@/components/layout/MobileNav';
import { MapProvider, useMapContext, type MapPin as MapPinData } from '@/context/MapContext';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import type { ChatTab } from '@/types/chat';
import { Button } from '@/components/ui/button';

/**
 * Mindtrip-style chat-as-app canvas.
 *
 * Three columns on desktop:
 *   LEFT (280px) — navigation, chat history
 *   CENTER (flex-1) — conversation with embedded cards + reasoning trace
 *   RIGHT (420px) — live map with pins synced to the latest tool response
 *
 * Unlike internal pages this route does NOT use ThreePanelLayout's slide-in
 * right panel — chat needs the map visible at all times. Tablet collapses
 * the map; mobile stacks to one column with a map toggle (follow-up).
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Mon + Wed.
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
  defaultTab?: ChatTab;
}

function ChatCanvasInner({ defaultTab = 'concierge' }: ChatCanvasProps) {
  const [activeTab] = useState<ChatTab>(defaultTab);
  const { user } = useAuth();
  const { setPins, clearPins } = useMapContext();
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [emailGateRetry, setEmailGateRetry] = useState<number | undefined>(undefined);

  const {
    messages,
    isLoading,
    isStreaming,
    error,
    pendingActions,
    reasoningPhases,
    fetchConversations,
    sendMessage,
    cancelStream,
    retryLastMessage,
    setPendingActions,
  } = useChat(activeTab, {
    onAnonLimitExceeded: (retry) => {
      setEmailGateRetry(retry);
      setEmailGateOpen(true);
    },
  });

  useEffect(() => {
    if (user) fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Populate map pins whenever actions deliver new listings. Uses
  // latitude/longitude from the inline payload; falls back to a "title-only"
  // pin (still renders in the list even without coords).
  useEffect(() => {
    const rentalAction = pendingActions.find(
      (a) => a.type === 'OPEN_RENTALS_RESULTS',
    );
    const listings = rentalAction?.payload.listings;
    if (!listings || listings.length === 0) return;
    const nextPins: MapPinData[] = listings.map((l) => ({
      id: l.id,
      category: 'rental',
      title: l.title,
      latitude: l.latitude ?? null,
      longitude: l.longitude ?? null,
      label: l.price_monthly ? `$${l.price_monthly}/mo` : undefined,
      meta: { source_url: l.source_url, neighborhood: l.neighborhood },
    }));
    setPins(nextPins);
    return () => {
      // Keep pins across turns — only clear on explicit new chat.
      // clearPins() removed intentionally.
    };
  }, [pendingActions, setPins]);

  // Clear pins when the user clears the message list (e.g. new chat).
  useEffect(() => {
    if (messages.length === 0) clearPins();
  }, [messages.length, clearPins]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: 3-column canvas */}
      <div className="hidden lg:flex h-screen">
        <div className="w-[280px] flex-shrink-0 border-r border-border">
          <LeftPanel />
        </div>
        <main className="flex-1 flex flex-col min-w-0">
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
                reasoningPhases={reasoningPhases}
              />
            )}
          </div>
          <div className="border-t border-border bg-background/80 backdrop-blur p-4">
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
        </main>
        <div className="w-[420px] flex-shrink-0">
          <ChatMap />
        </div>
      </div>

      {/* Tablet: 2-column (no map) */}
      <div className="hidden md:flex lg:hidden h-screen">
        <div className="w-[200px] flex-shrink-0 border-r border-border">
          <LeftPanel />
        </div>
        <main className="flex-1 flex flex-col min-w-0">
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
                reasoningPhases={reasoningPhases}
              />
            )}
          </div>
          <div className="border-t border-border bg-background/80 backdrop-blur p-4">
            <ChatInput
              onSend={sendMessage}
              onCancel={cancelStream}
              isLoading={isLoading}
              isStreaming={isStreaming}
              placeholder="Ask about rentals, neighborhoods, or plans..."
            />
          </div>
        </main>
      </div>

      {/* Mobile: single column, chat only (map toggle is a follow-up) */}
      <div className="md:hidden flex flex-col min-h-screen pb-20">
        <main className="flex-1 flex flex-col min-w-0">
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
                reasoningPhases={reasoningPhases}
              />
            )}
          </div>
          <div className="border-t border-border bg-background p-3">
            <ChatInput
              onSend={sendMessage}
              onCancel={cancelStream}
              isLoading={isLoading}
              isStreaming={isStreaming}
              placeholder="Ask anything..."
            />
          </div>
        </main>
        <MobileNav />
      </div>

      {/* Anonymous-quota email gate — opens when the edge function returns
          402 ANON_LIMIT_EXCEEDED. Magic-link sign-in resumes the session. */}
      <EmailGateModal
        open={emailGateOpen}
        onOpenChange={setEmailGateOpen}
        retryAfterSeconds={emailGateRetry}
      />
    </div>
  );
}

export function ChatCanvas(props: ChatCanvasProps) {
  return (
    <MapProvider>
      <ChatCanvasInner {...props} />
    </MapProvider>
  );
}
