import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, DollarSign, Heart, MapPin, Calendar } from 'lucide-react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ChatMap, type ViewportSearchPayload } from './ChatMap';
import { ChatContextChips } from './ChatContextChips';
import { EmailGateModal } from './EmailGateModal';
import { ChatLeftNav } from './ChatLeftNav';
import { MobileNav } from '@/components/layout/MobileNav';
import { MapProvider, useMapContext, type MapPin as MapPinData } from '@/context/MapContext';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useAnonSession } from '@/hooks/useAnonSession';
import type { ChatTab } from '@/types/chat';
import { Button } from '@/components/ui/button';
import {
  clearPendingPrompt,
  getPendingPrompt,
  urlSignalsPendingSend,
} from '@/lib/pending-prompt';

/**
 * Known Medellín neighborhoods + lat/lng centroids. Used to resolve a
 * "Search this area" map viewport → nearest neighborhood, which we then
 * inject into the chat as a ChatContextChip + sendMessage call.
 *
 * Hardcoded for MVP; can swap to a Postgres `neighborhoods` lookup later.
 */
const KNOWN_NEIGHBORHOODS: { name: string; lat: number; lng: number }[] = [
  { name: 'El Poblado', lat: 6.21, lng: -75.567 },
  { name: 'Provenza', lat: 6.207, lng: -75.567 },
  { name: 'Laureles', lat: 6.245, lng: -75.59 },
  { name: 'Envigado', lat: 6.166, lng: -75.581 },
  { name: 'Sabaneta', lat: 6.151, lng: -75.616 },
  { name: 'Belén', lat: 6.216, lng: -75.598 },
  { name: 'La Candelaria', lat: 6.247, lng: -75.569 },
  { name: 'Estadio', lat: 6.252, lng: -75.589 },
];

/** Haversine distance in km — sufficient precision for MDE neighborhoods. */
function nearestNeighborhood(lat: number, lng: number): string {
  const R = 6371;
  let best = KNOWN_NEIGHBORHOODS[0];
  let bestDist = Infinity;
  for (const n of KNOWN_NEIGHBORHOODS) {
    const dLat = ((n.lat - lat) * Math.PI) / 180;
    const dLng = ((n.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((n.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const d = 2 * R * Math.asin(Math.sqrt(a));
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best.name;
}

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
  const { user, loading: authLoading } = useAuth();
  // Required by the auto-fire effect below — without it, the effect
  // races useChat's internal sendMessage closure and silent-returns
  // when both `user` and `anonSessionId` are null on first mount after
  // an OAuth round-trip. Calling useAnonSession here is idempotent
  // (sessionStorage is the source of truth).
  const { anonSessionId } = useAnonSession();
  const { setPins, clearPins } = useMapContext();
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [emailGateRetry, setEmailGateRetry] = useState<number | undefined>(undefined);

  const {
    messages,
    conversations,
    currentConversation,
    isLoading,
    isStreaming,
    error,
    pendingActions,
    reasoningPhases,
    chatContext,
    fetchConversations,
    selectConversation,
    archiveConversation,
    newChat,
    sendMessage,
    cancelStream,
    retryLastMessage,
    setPendingActions,
    updateChatContext,
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

  // Auto-fire any pending prompt saved by <HeroChatPrompt> on the marketing
  // homepage. Triggered when the URL is /chat?send=pending.
  //
  // Guards (5 layers, belt-and-suspenders):
  //   1. URL must carry `?send=pending` (so direct /chat visits don't fire)
  //   2. sessionStorage must have a pending prompt
  //   3. **Auth must be settled**: useAuth.loading === false (the Supabase
  //      session check finished) AND we have either a `user` or an
  //      `anonSessionId`. Without this gate, sendMessage's closure inside
  //      useChat silent-returns on the first render after an OAuth
  //      round-trip and the prompt is lost. (Real bug we hit in prod.)
  //   4. Ref-guard `pendingFiredRef` blocks the second StrictMode pass
  //   5. URL is `replace`d to `/chat` immediately after firing — refresh
  //      can never replay the prompt
  //
  // The effect re-runs when authLoading / user / anonSessionId change so
  // the post-OAuth case (auth settling AFTER mount) still fires correctly.
  const location = useLocation();
  const navigate = useNavigate();
  const pendingFiredRef = useRef(false);
  useEffect(() => {
    if (pendingFiredRef.current) return;
    if (!urlSignalsPendingSend(location.search)) return;
    // Wait for auth to settle. Once settled, we MUST have either a real
    // user or an anonSessionId — otherwise sendMessage silent-returns.
    if (authLoading) return;
    if (!user && !anonSessionId) return;

    const prompt = getPendingPrompt();
    if (!prompt) {
      // URL says ?send=pending but storage is empty — clean the URL and
      // bail. Common when the user pasted the URL into a fresh tab OR
      // followed an email-confirmation link in a new tab (sessionStorage
      // is per-tab; the prompt didn't survive).
      pendingFiredRef.current = true;
      navigate('/chat', { replace: true });
      return;
    }
    pendingFiredRef.current = true;
    clearPendingPrompt();
    void sendMessage(prompt);
    // Strip the ?send=pending param so a refresh doesn't replay the prompt.
    navigate('/chat', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, authLoading, user, anonSessionId]);

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

  // Clear pins on conversation switch — opening a different conversation
  // from ChatLeftNav (or selectConversation) should NOT show the previous
  // conversation's pins. Without this, pins bleed across conversations.
  // Note: keying on conversation id (null → new chat also fires this) means
  // the empty-message effect above is partially redundant but harmless.
  useEffect(() => {
    clearPins();
  }, [currentConversation?.id, clearPins]);

  // "Search this area" — ChatMap fires this when the user has panned /
  // zoomed and clicked the floating pill. We:
  //   1. resolve the viewport center to the nearest known neighborhood
  //   2. update the neighborhood chip so the user sees the change
  //   3. fire a sendMessage so Gemini re-runs `rentals_search` for the
  //      new neighborhood (the chip is in the system prompt as
  //      sessionData)
  // Future improvement (60-day plan): add a `bbox` field to sessionData
  // so the search is precisely viewport-bound, not neighborhood-bound.
  const handleViewportSearch = useCallback(
    (payload: ViewportSearchPayload) => {
      const neighborhood = nearestNeighborhood(payload.center.lat, payload.center.lng);
      updateChatContext({ ...chatContext, neighborhood });
      void sendMessage(`Show top rentals in ${neighborhood}`);
    },
    [chatContext, updateChatContext, sendMessage],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: 3-column canvas */}
      <div className="hidden lg:flex h-screen">
        <div className="w-[280px] flex-shrink-0">
          <ChatLeftNav
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={selectConversation}
            onNewChat={newChat}
            onArchiveConversation={archiveConversation}
          />
        </div>
        <main className="flex-1 flex flex-col min-w-0">
          <ChatContextChips value={chatContext} onChange={updateChatContext} />
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
          <ChatMap onViewportSearch={handleViewportSearch} />
        </div>
      </div>

      {/* Tablet: 2-column (no map) */}
      <div className="hidden md:flex lg:hidden h-screen">
        <div className="w-[200px] flex-shrink-0">
          <ChatLeftNav
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={selectConversation}
            onNewChat={newChat}
            onArchiveConversation={archiveConversation}
            compact
          />
        </div>
        <main className="flex-1 flex flex-col min-w-0">
          <ChatContextChips value={chatContext} onChange={updateChatContext} />
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
          <ChatContextChips value={chatContext} onChange={updateChatContext} />
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
