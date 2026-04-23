import { useRef, useEffect } from 'react';
import { Sparkles, User, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { ChatMessage, ChatAction } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChatActionBar } from './ChatActionBar';
import { EmbeddedListings } from './embedded/EmbeddedListings';
import { ChatReasoningTrace, type ReasoningPhase } from './ChatReasoningTrace';
import { NotAFitTable } from './NotAFitTable';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  pendingActions?: ChatAction[];
  onActionDispatched?: (action: ChatAction) => void;
  /** Reasoning-trace phases for the "Thought for Ns" collapsible. */
  reasoningPhases?: ReasoningPhase[];
}

export function ChatMessageList({
  messages,
  isStreaming,
  isLoading,
  error,
  onRetry,
  pendingActions,
  onActionDispatched,
  reasoningPhases,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or streaming updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-4 py-4 max-w-3xl mx-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
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
                  : 'bg-muted/50'
              )}
            >
              {/* Reasoning trace renders above the latest assistant message's
                  content so the user sees "Handing off to Rentals Concierge…"
                  → "Considering 43 matches…" BEFORE the final text arrives. */}
              {message.role === 'assistant' &&
                messages[messages.length - 1].id === message.id &&
                reasoningPhases && reasoningPhases.length > 0 && (
                  <ChatReasoningTrace
                    phases={reasoningPhases}
                    isActive={isStreaming || isLoading}
                  />
                )}
              {message.role === 'assistant' ? (
                <div className="text-sm leading-relaxed prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h3]:font-semibold">
                  <Markdown>{message.content}</Markdown>
                  {isStreaming && messages[messages.length - 1].id === message.id && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
                  )}
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              )}
              {message.role === 'assistant' && message.agent_name && (
                <p className="text-xs text-muted-foreground mt-2 capitalize">
                  {message.agent_name.replace(/_/g, ' ')}
                </p>
              )}
              {/* Inline listing cards + rejection-transparency table +
                  structured action affordances (e.g. "See all on the map →")
                  render under the latest assistant message once the stream
                  ends. Cards come from the tool response payload; the
                  button navigates to /apartments?q=… */}
              {message.role === 'assistant' &&
                !isStreaming &&
                messages[messages.length - 1].id === message.id &&
                pendingActions && pendingActions.length > 0 && (
                  <>
                    <EmbeddedListings actions={pendingActions} />
                    {/* Rejection-transparency: render a "Not a Good Fit"
                        table whenever any action carried rejected rows. */}
                    {pendingActions
                      .flatMap((a) =>
                        a.type === 'OPEN_RENTALS_RESULTS' && a.payload.considered_but_rejected
                          ? [a.payload.considered_but_rejected]
                          : [],
                      )
                      .flatMap((rows, i) => (
                        <NotAFitTable key={i} rows={rows} />
                      ))}
                    <ChatActionBar
                      actions={pendingActions}
                      onActionDispatched={onActionDispatched}
                    />
                  </>
                )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator — shows between send and first stream chunk */}
        {isLoading && !isStreaming && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted/50 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        {/* Error state with retry */}
        {error && !isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl px-4 py-3 max-w-[80%]">
              <p className="text-sm text-destructive font-medium">Failed to get response</p>
              <p className="text-xs text-muted-foreground mt-1">The AI service is temporarily unavailable. Please try again.</p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={onRetry}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
