import { useRef, useEffect } from 'react';
import { Sparkles, User, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ChatMessage, ChatAction } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmbeddedListings } from './embedded/EmbeddedListings';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  pendingActions?: ChatAction[];
  onActionDispatched?: () => void;
  reasoningPhases?: unknown[];
}

export function ChatMessageList({
  messages,
  isStreaming,
  isLoading,
  error,
  onRetry,
  pendingActions = [],
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingActions]);

  if (messages.length === 0) {
    return null;
  }

  const lastAssistantIdx = messages.reduce(
    (best, msg, i) => (msg.role === 'assistant' ? i : best),
    -1,
  );

  return (
    <ScrollArea className="flex-1 px-4" ref={scrollRef}>
      <div className="space-y-4 py-4 max-w-3xl mx-auto">
        {messages.map((message, idx) => (
          <div key={message.id}>
            <div
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50',
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                  {isStreaming &&
                    message.role === 'assistant' &&
                    messages[messages.length - 1].id === message.id && (
                      <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
                    )}
                </p>
                {message.role === 'assistant' && message.agent_name && (
                  <p className="text-xs text-muted-foreground mt-2 capitalize">
                    {message.agent_name.replace('_', ' ')}
                  </p>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Inline listing cards appear below the last assistant message,
                only after streaming is complete. */}
            {idx === lastAssistantIdx && !isStreaming && pendingActions.length > 0 && (
              <div className="ml-11 mt-1">
                <EmbeddedListings actions={pendingActions} />
              </div>
            )}
          </div>
        ))}

        {/* Loading skeleton while waiting for first token */}
        {isLoading && !isStreaming && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="bg-muted/50 rounded-2xl px-4 py-3 max-w-[80%]">
              <div className="flex gap-1 items-center h-5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Inline error with retry */}
        {error && !isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl px-4 py-3 max-w-[80%] flex items-center gap-3">
              <p className="text-sm text-destructive">{error}</p>
              {onRetry && (
                <Button size="sm" variant="ghost" onClick={onRetry} className="h-7 px-2 shrink-0">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
