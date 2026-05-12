import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChatMap } from "@/components/chat/ChatMap";
import { MapProvider, mergePinsByCategory, useMapContext, type MapPin as MapPinData } from "@/context/MapContext";
import type { OpenEventResultsAction, OpenRestaurantResultsAction, OpenAttractionResultsAction } from "@/types/chat";
import { Sparkles, MessageCircle, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useTripContext } from "@/context/TripContext";
import { ChatTabs } from "@/components/chat/ChatTabs";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import type { ChatTab } from "@/types/chat";
import { formatDistanceToNow } from "date-fns";


function ConciergeInner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  useTripContext();
  const [activeTab, setActiveTab] = useState<ChatTab>("concierge");
  const { setPins } = useMapContext();

  const {
    messages,
    conversations,
    currentConversation,
    isLoading,
    isStreaming,
    fetchConversations,
    sendMessage,
    cancelStream,
    selectConversation,
    setCurrentConversation,
    setMessages,
    pendingActions,
  } = useChat(activeTab);

  // Sync pending tool results → map pins (per-category merge; latest action wins per type — MASTRA-047)
  useEffect(() => {
    const action = [...pendingActions].reverse().find((a) => a.type === 'OPEN_RENTALS_RESULTS');
    const listings = action?.payload.listings;
    if (!listings?.length) return;
    const newPins = listings.map((l) => ({
      id: l.id, category: 'rental' as const, title: l.title,
      latitude: l.latitude ?? null, longitude: l.longitude ?? null,
      label: l.price_daily != null ? `$${l.price_daily}/mo` : undefined,
      meta: { image: l.images?.[0] ?? null, neighborhood: l.neighborhood },
    } satisfies MapPinData));
    setPins((prev) => mergePinsByCategory(prev, 'rental', newPins));
  }, [pendingActions, setPins]);

  useEffect(() => {
    const action = [...pendingActions].reverse().find((a) => a.type === 'OPEN_EVENT_RESULTS') as OpenEventResultsAction | undefined;
    const listings = action?.payload.listings;
    if (!listings?.length) return;
    const newPins = listings.map((e) => ({
      id: e.id, category: 'event' as const, title: e.title,
      latitude: e.latitude ?? null, longitude: e.longitude ?? null,
      label: e.pricePerTicket != null ? `$${e.pricePerTicket}` : undefined,
      meta: { source_url: e.sourceUrl, neighborhood: e.neighborhood, venue: e.venue },
    } satisfies MapPinData));
    setPins((prev) => mergePinsByCategory(prev, 'event', newPins));
  }, [pendingActions, setPins]);

  useEffect(() => {
    const action = [...pendingActions].reverse().find((a) => a.type === 'OPEN_RESTAURANT_RESULTS') as OpenRestaurantResultsAction | undefined;
    const listings = action?.payload.listings;
    if (!listings?.length) return;
    const newPins = listings.map((r) => ({
      id: r.id, category: 'restaurant' as const, title: r.name,
      latitude: r.latitude ?? null, longitude: r.longitude ?? null,
      label: r.priceTier ?? undefined,
      meta: { source_url: r.sourceUrl, neighborhood: r.neighborhood, rating: r.rating },
    } satisfies MapPinData));
    setPins((prev) => mergePinsByCategory(prev, 'restaurant', newPins));
  }, [pendingActions, setPins]);

  useEffect(() => {
    const action = [...pendingActions].reverse().find((a) => a.type === 'OPEN_ATTRACTION_RESULTS') as OpenAttractionResultsAction | undefined;
    const listings = action?.payload.listings;
    if (!listings?.length) return;
    const newPins = listings.map((a) => ({
      id: a.id, category: 'attraction' as const, title: a.name,
      latitude: a.latitude ?? null, longitude: a.longitude ?? null,
      label: a.priceUsd === 0 ? 'Free' : a.priceUsd != null ? `$${a.priceUsd}` : undefined,
      meta: { source_url: a.sourceUrl, neighborhood: a.neighborhood, rating: a.rating },
    } satisfies MapPinData));
    setPins((prev) => mergePinsByCategory(prev, 'attraction', newPins));
  }, [pendingActions, setPins]);

  // Fetch conversations on mount and tab change
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, activeTab, fetchConversations]);

  const handleTabChange = (tab: ChatTab) => {
    setActiveTab(tab);
    setCurrentConversation(null);
    setMessages([]);
  };

  const handleNewChat = useCallback(async () => {
    setCurrentConversation(null);
    setMessages([]);
  }, [setCurrentConversation, setMessages]);

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };


  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
            AI Concierge
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in to access your personal AI assistant for exploring Medellín.
          </p>
          <Button size="lg" onClick={() => navigate("/login")}>
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop 3-Panel Layout */}
      <div className="hidden lg:grid lg:grid-cols-[320px_1fr_380px] min-h-screen">
        {/* LEFT PANEL: Context */}
        <aside className="border-r border-border bg-secondary/30 flex flex-col h-screen">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold text-foreground">AI Concierge</h1>
                <p className="text-xs text-muted-foreground">Your personal Medellín guide</p>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <ChatTabs activeTab={activeTab} onTabChange={handleTabChange} />
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              <Button 
                onClick={handleNewChat}
                className="w-full justify-start gap-2 mb-4"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </Button>
              
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all",
                        currentConversation?.id === conv.id
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-card border border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <p className="font-medium text-sm text-foreground line-clamp-1">
                        {conv.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conv.last_message_at 
                          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
                          : "New conversation"
                        }
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Back Link */}
          <div className="p-4 border-t border-border">
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/")}>
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
              Back to Home
            </Button>
          </div>
        </aside>

        {/* CENTER PANEL: Work */}
        <main className="flex flex-col h-screen">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {messages.length === 0 ? (
              <ChatWelcome activeTab={activeTab} onSuggestionClick={handleSuggestionClick} />
            ) : (
              <ChatMessageList messages={messages} isStreaming={isStreaming} />
            )}
          </div>

          {/* Input */}
          <div className="p-6 border-t border-border bg-background">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                onSend={sendMessage}
                onCancel={cancelStream}
                isLoading={isLoading}
                isStreaming={isStreaming}
                placeholder="Ask me anything about Medellín..."
              />
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: Map */}
        <div className="h-screen overflow-hidden">
          <ChatMap />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col pb-20">
        {/* Header */}
        <header className="p-4 border-b border-border bg-background sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="font-semibold text-foreground">AI Concierge</h1>
            </div>
          </div>
          <ChatTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </header>

        {/* Chat Area */}
        <div className="flex-1 min-h-0">
          {messages.length === 0 ? (
            <div className="p-4">
              <ChatWelcome activeTab={activeTab} onSuggestionClick={handleSuggestionClick} />
            </div>
          ) : (
            <ChatMessageList messages={messages} isStreaming={isStreaming} />
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
          <ChatInput
            onSend={sendMessage}
            onCancel={cancelStream}
            isLoading={isLoading}
            isStreaming={isStreaming}
            placeholder="Ask me anything..."
          />
        </div>
      </div>
    </div>
  );
}

export default function Concierge() {
  return (
    <MapProvider>
      <ConciergeInner />
    </MapProvider>
  );
}
