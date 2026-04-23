import { useState, useEffect } from 'react';
import { MessageCircle, X, Sparkles, Maximize2, DollarSign, Heart, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatTabs } from './ChatTabs';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';
import { ChatTab } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const quickActions = [
  { icon: DollarSign, label: 'Under $100' },
  { icon: Heart, label: 'Date Night' },
  { icon: MapPin, label: 'Poblado' },
];

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>('concierge');
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
    setCurrentConversation,
    setMessages,
    setPendingActions,
  } = useChat(activeTab);

  // Fetch conversations when tab changes (only if logged in)
  useEffect(() => {
    if (user && isOpen) {
      fetchConversations();
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [user, activeTab, isOpen, fetchConversations, setCurrentConversation, setMessages]);

  const handleTabChange = (tab: ChatTab) => {
    setActiveTab(tab);
    setMessages([]);
  };

  const handleQuickAction = (label: string) => {
    sendMessage(label);
  };

  return (
    <>
      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[400px] max-h-[600px] bg-background rounded-2xl shadow-2xl border border-border transition-all duration-300 transform origin-bottom-right overflow-hidden flex flex-col",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-background">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">AI Concierge</h2>
                <p className="text-xs text-muted-foreground">Context Aware • Always here</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <ChatTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {messages.length === 0 ? (
            <ScrollArea className="h-[280px]">
              <div className="p-4">
                {/* Welcome Message */}
                <div className="bg-muted/50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-foreground">
                    Welcome to Medellín. I am your personal concierge. Ask me about events, real estate, or planning your trip.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleQuickAction(action.label)}
                    >
                      <action.icon className="w-3.5 h-3.5 mr-1.5" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <ChatMessageList
              messages={messages}
              isStreaming={isStreaming}
              isLoading={isLoading}
              error={error}
              onRetry={retryLastMessage}
              pendingActions={pendingActions}
              onActionDispatched={() => {
                // Close the floating widget after the user accepts an action
                // (e.g. clicks "See all on the map →") so they see the page.
                setIsOpen(false);
                setPendingActions([]);
              }}
            />
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border bg-background">
          <ChatInput
            onSend={sendMessage}
            onCancel={cancelStream}
            isLoading={isLoading}
            isStreaming={isStreaming}
            placeholder="Ask about events, stays, or plans..."
          />
        </div>
      </div>

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          isOpen && "bg-primary hover:bg-primary/90"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>
    </>
  );
}
