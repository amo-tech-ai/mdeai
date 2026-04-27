import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  MessageCircle,
  Heart,
  Plane,
  Compass,
  Sparkles,
  LogOut,
  User,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { useAuth } from '@/hooks/useAuth';
import { useChatActions } from '@/hooks/useChatActions';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat';

/**
 * Chat-canvas left panel — Mindtrip-style.
 *
 * Sections (top → bottom):
 *  1. Logo
 *  2. "+ New chat" button (calls useChat.newChat — clears messages, chips,
 *     reasoning trace, pendingActions)
 *  3. Recent chats (authed only) — title from first user msg, sorted by
 *     last_message_at; click → selectConversation hydrates messages + chips
 *  4. ❤ Saved (N) → /saved   ✈ My Trips (N) → /trips
 *  5. Quick links — Explore · Concierge
 *  6. User pill (avatar + sign out) or "Sign in" CTA
 *
 * Anon users see the structure but the conversation list says "Sign in to
 * save your chat history" — keeps the layout stable across auth states.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 2 Wed.
 */

interface ChatLeftNavProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (c: Conversation) => void;
  onNewChat: () => void;
  onArchiveConversation?: (id: string) => void;
  /** Compact width for tablet breakpoint. */
  compact?: boolean;
}

const MAX_VISIBLE_CONVERSATIONS = 8;

function conversationTitle(c: Conversation): string {
  // Conversations are seeded with a title from the first user message
  // (slice(0,50)). Fall back to "Untitled chat" for older rows that
  // landed without one.
  const t = (c.title ?? '').trim();
  return t.length > 0 ? t : 'Untitled chat';
}

function ConversationRow({
  conversation,
  isActive,
  onSelect,
  onArchive,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onArchive?: () => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
        isActive ? 'bg-sidebar-accent text-sidebar-foreground' : 'hover:bg-sidebar-accent/40',
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <MessageCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="flex-1 min-w-0 text-sm truncate">{conversationTitle(conversation)}</span>
      {onArchive && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
              aria-label="Conversation menu"
            >
              <span className="block w-5 h-5 leading-none text-base text-center select-none">
                ⋯
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function CountRow({
  to,
  icon: Icon,
  label,
  count,
  iconClassName,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number | null;
  iconClassName?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent/40 transition-colors"
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', iconClassName)} />
      <span className="flex-1 text-sm">{label}</span>
      {count != null && count > 0 && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </Link>
  );
}

export function ChatLeftNav({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewChat,
  onArchiveConversation,
  compact = false,
}: ChatLeftNavProps) {
  const { user, signOut } = useAuth();
  const { savedIds, trips, fetchTrips } = useChatActions();

  // Refresh trips count whenever auth state flips. Saved count is
  // hydrated by useChatActions itself on user change, no manual call.
  useEffect(() => {
    void fetchTrips();
  }, [fetchTrips, user?.id]);

  const visibleConversations = useMemo(
    () => conversations.slice(0, MAX_VISIBLE_CONVERSATIONS),
    [conversations],
  );
  const overflowCount = Math.max(0, conversations.length - MAX_VISIBLE_CONVERSATIONS);

  return (
    <aside className="flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className={cn('px-4 pt-5 pb-3', compact && 'px-3')}>
        <Link
          to="/"
          onClick={onNewChat}
          aria-label="mdeai.co — start new chat"
          className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <BrandLogo variant={compact ? 'sidebarCollapsed' : 'sidebar'} />
        </Link>
      </div>

      {/* New chat */}
      <div className={cn('px-3 pb-3', compact && 'px-2')}>
        <Button
          onClick={onNewChat}
          variant="default"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <Plus className="w-4 h-4" />
          {!compact && 'New chat'}
        </Button>
      </div>

      {/* Conversations */}
      <div className="flex-1 min-h-0 px-2 pb-2 overflow-hidden flex flex-col">
        <div className="px-2 mb-1.5 mt-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Chats {conversations.length > 0 && `(${conversations.length})`}
        </div>
        <ScrollArea className="flex-1 min-h-0">
          {!user ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              Sign in to keep your chat history.
            </p>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              Your chats appear here once you start one.
            </p>
          ) : (
            <div className="space-y-0.5">
              {visibleConversations.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  isActive={currentConversation?.id === c.id}
                  onSelect={() => onSelectConversation(c)}
                  onArchive={
                    onArchiveConversation ? () => onArchiveConversation(c.id) : undefined
                  }
                />
              ))}
              {overflowCount > 0 && (
                <p className="px-2 py-1.5 text-[11px] text-muted-foreground">
                  +{overflowCount} more
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Saved + Trips */}
      <div className="px-2 py-2 border-t border-sidebar-border space-y-0.5">
        <CountRow
          to="/saved"
          icon={Heart}
          label="Saved"
          count={user ? savedIds.size : null}
          iconClassName="text-rose-500"
        />
        <CountRow
          to="/trips"
          icon={Plane}
          label="My Trips"
          count={user ? trips.length : null}
          iconClassName="text-blue-500"
        />
      </div>

      {/* Quick links */}
      <div className="px-2 py-2 border-t border-sidebar-border space-y-0.5">
        <CountRow to="/explore" icon={Compass} label="Explore" count={null} />
        <CountRow to="/concierge" icon={Sparkles} label="Concierge" count={null} />
      </div>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="w-full justify-start gap-2 h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </Button>
          </div>
        ) : (
          <Link to="/login">
            <div className="flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-sidebar-accent/40 transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">Sign in</p>
                <p className="text-[10px] text-muted-foreground">to save chats &amp; trips</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
