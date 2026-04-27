import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTripContext } from '@/context/TripContext';
import {
  ChatMessage,
  Conversation,
  ChatTab,
  ChatAction,
  ChatContext,
  EMPTY_CHAT_CONTEXT,
  hasChatContext,
  tabToAgentType,
} from '@/types/chat';
import type { ReasoningPhase } from '@/components/chat/ChatReasoningTrace';
import { useAnonSession } from './useAnonSession';
import { useRealtimeChannel, RealtimeEvent } from '@/hooks/useRealtimeChannel';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface UseChatOptions {
  /** Called when an anon visitor exhausts their free quota (HTTP 402). */
  onAnonLimitExceeded?: (retryAfterSeconds: number) => void;
}

export function useChat(activeTab: ChatTab, options?: UseChatOptions) {
  const { user } = useAuth();
  const { activeTrip } = useTripContext();
  const { anonSessionId } = useAnonSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Structured actions emitted by tools (e.g. OPEN_RENTALS_RESULTS). The UI
  // renders these as affordances (buttons) under the latest assistant message.
  // Cleared on every new send.
  const [pendingActions, setPendingActions] = useState<ChatAction[]>([]);
  // Reasoning-trace phases streamed from edge function SSE sidecar events.
  // Drives the "Thought for Ns" collapsible — cleared on every new send.
  const [reasoningPhases, setReasoningPhases] = useState<ReasoningPhase[]>([]);
  // Persistent session context — four chips (neighborhood, dates, travelers,
  // budget) that travel with the conversation. Authenticated users mirror
  // this to conversations.session_data.chat_context; anon visitors keep it
  // in-memory only until they sign in. Rendered as ChatContextChips above
  // the message list; flows into every tool call via the ai-chat request
  // body so Gemini inherits chip values without the user re-typing them.
  const [chatContext, setChatContext] = useState<ChatContext>(EMPTY_CHAT_CONTEXT);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFailedMessageRef = useRef<string | null>(null);

  // Realtime subscription handler for message updates
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    const messagePayload = event.payload as Partial<ChatMessage> & { id: string };
    
    switch (event.type) {
      case 'INSERT':
        // Only add if not already in list (avoid duplicating our own sent messages)
        setMessages(prev => {
          if (prev.some(m => m.id === messagePayload.id)) return prev;
          return [...prev, messagePayload as ChatMessage];
        });
        break;
      case 'UPDATE':
        setMessages(prev =>
          prev.map(m => m.id === messagePayload.id ? { ...m, ...messagePayload } : m)
        );
        break;
      case 'DELETE':
        setMessages(prev => prev.filter(m => m.id !== messagePayload.id));
        break;
    }
  }, []);

  // Subscribe to realtime updates for current conversation. We only
  // subscribe for conversations that actually have a backing Postgres
  // row — i.e. authed users whose conversation belongs to them. Anon
  // conversations are pure in-memory (no DB row), so subscribing would
  // produce CHANNEL_ERROR / TIMED_OUT on the realtime broker.
  const isOwnConversation =
    !!user &&
    !!currentConversation?.id &&
    currentConversation.user_id === user.id;
  const realtimeTopic = isOwnConversation
    ? `conversation:${currentConversation!.id}:messages`
    : '';

  useRealtimeChannel({
    topic: realtimeTopic,
    enabled: isOwnConversation,
    onEvent: handleRealtimeEvent,
  });

  // Fetch conversations for the current tab
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const agentType = tabToAgentType[activeTab] as 'booking_assistant' | 'budget_guardian' | 'dining_orchestrator' | 'event_curator' | 'general_concierge' | 'itinerary_optimizer' | 'local_scout';
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_type', agentType)
      .is('deleted_at', null)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    setConversations(data as Conversation[]);
  }, [user, activeTab]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data as ChatMessage[]);
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (title: string = 'New conversation') => {
    if (!user) return null;

    const agentType = tabToAgentType[activeTab] as 'booking_assistant' | 'budget_guardian' | 'dining_orchestrator' | 'event_curator' | 'general_concierge' | 'itinerary_optimizer' | 'local_scout';
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        agent_type: agentType,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }

    const conversation = data as Conversation;
    setConversations(prev => [conversation, ...prev]);
    setCurrentConversation(conversation);
    setMessages([]);
    return conversation;
  }, [user, activeTab]);

  // Select a conversation
  const selectConversation = useCallback(async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    // Hydrate chips from the conversation's persisted session_data. Missing
    // or malformed shapes fall back to an empty context so the chip bar
    // never renders stale junk from an older schema.
    const persisted = (conversation.session_data?.chat_context ?? null) as ChatContext | null;
    setChatContext(persisted && typeof persisted === 'object' ? { ...EMPTY_CHAT_CONTEXT, ...persisted } : EMPTY_CHAT_CONTEXT);
    await fetchMessages(conversation.id);
  }, [fetchMessages]);

  // Update chips + persist to conversations.session_data.chat_context.
  // Authenticated + existing conversation → write-through to Postgres.
  // Anon or no-conversation-yet → in-memory only; will be written on the
  // first sendMessage() that creates the DB row.
  const updateChatContext = useCallback(
    (next: ChatContext) => {
      setChatContext(next);
      if (!user || !currentConversation) return;
      // Fire-and-forget — failure to persist chip state should never block
      // the chat flow. We keep the in-memory copy authoritative for the
      // current session.
      void supabase
        .from('conversations')
        .update({
          session_data: {
            ...(currentConversation.session_data ?? {}),
            chat_context: next,
          },
        })
        .eq('id', currentConversation.id)
        .then(({ error: updErr }) => {
          if (updErr) {
            console.error('Failed to persist chat_context to session_data:', updErr);
          }
        });
      // Mirror into local state so repeated updates send the latest shape
      // (not the stale one loaded at conversation-open time).
      setCurrentConversation({
        ...currentConversation,
        session_data: {
          ...(currentConversation.session_data ?? {}),
          chat_context: next,
        },
      });
    },
    [user, currentConversation],
  );

  // Send a message with streaming. Supports both authenticated users
  // (DB-persisted conversation + messages) and anonymous visitors
  // (in-memory only; server enforces a 3-message/24h quota via
  // X-Anon-Session-Id header).
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    if (!user && !anonSessionId) {
      // Very first render before useAnonSession mounts. Soft-fail silently.
      return;
    }
    setError(null);
    // Clear previous turn's action affordances + reasoning trace —
    // the next tool call will emit its own.
    setPendingActions([]);
    setReasoningPhases([]);

    // Authenticated users get a DB-backed conversation. Anon visitors work
    // in-memory only — conversation is a synthetic placeholder so the rest
    // of the flow can key off conversation.id.
    let conversation = currentConversation;
    if (user) {
      // A conversation only "belongs" to the current user when its
      // user_id matches. Anon conversations carry user_id='anon' (set
      // in the anon path below) — when an anon user signs in, that
      // synthetic conversation is no longer valid for DB writes, so
      // we mint a fresh DB-backed one.
      const belongsToUser = !!conversation && conversation.user_id === user.id;
      if (!belongsToUser) {
        // Drop in-memory anon history so we start clean. The 3-msg
        // quota was already enforced server-side; nothing important
        // is lost here.
        if (conversation) setMessages([]);
        conversation = await createConversation(content.slice(0, 50));
        if (!conversation) return;
        // Carry the pre-conversation chips onto the brand-new DB row so a
        // user who set chips on the welcome screen doesn't lose them when
        // their first message creates the conversation.
        if (hasChatContext(chatContext)) {
          const { error: seedErr } = await supabase
            .from('conversations')
            .update({
              session_data: { chat_context: chatContext },
            })
            .eq('id', conversation.id);
          if (seedErr) {
            console.error('Failed to seed session_data on new conversation:', seedErr);
          } else {
            conversation = {
              ...conversation,
              session_data: { chat_context: chatContext },
            };
            setCurrentConversation(conversation);
          }
        }
      }
    } else {
      // Anon path: synthesize a client-only conversation. The id MUST be
      // a real UUID — older builds used `anon-${sid}` which broke
      // messages.conversation_id (uuid type) and realtime channel subs.
      // The "anon" marker now lives ONLY on user_id (in-memory sentinel,
      // never written to DB) and on a `display_label` if a UI surface
      // wants to show "anon-…" to the user.
      if (!conversation) {
        const conversationId = anonSessionId ?? crypto.randomUUID();
        conversation = {
          id: conversationId,
          user_id: 'anon', // sentinel; never persisted (anon path skips DB writes)
          title: content.slice(0, 50),
          agent_type: tabToAgentType[activeTab],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Conversation;
        setCurrentConversation(conversation);
      }
    }

    // Authenticated users get a DB-backed message row (matches realtime
    // broadcast UUIDs for clean dedup). Anon visitors skip DB — messages
    // are in-memory only and disappear on refresh until the user signs in.
    let userMessage: ChatMessage;
    if (user) {
      const { data: insertedRow, error: userInsertErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content,
        })
        .select('id, created_at')
        .single();

      if (userInsertErr) {
        console.error('Failed to save user message:', userInsertErr);
        toast.error(userInsertErr.message || 'Failed to send message');
        return;
      }

      userMessage = {
        id: insertedRow?.id ?? crypto.randomUUID(),
        conversation_id: conversation.id,
        role: 'user',
        content,
        created_at: insertedRow?.created_at ?? new Date().toISOString(),
      };
    } else {
      userMessage = {
        id: crypto.randomUUID(),
        conversation_id: conversation.id,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
    }
    setMessages(prev => [...prev, userMessage]);

    // Start streaming response
    setIsLoading(true);
    setIsStreaming(true);

    let assistantContent = '';
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      role: 'assistant',
      content: '',
      agent_name: tabToAgentType[activeTab],
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();

      // Use anon key as fallback for unauthenticated users
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const authHeader = session?.access_token 
        ? `Bearer ${session.access_token}` 
        : `Bearer ${anonKey}`;

      // Build the request headers. Anon visitors carry X-Anon-Session-Id so
      // the server can enforce a per-session quota without requiring auth.
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      };
      if (!user && anonSessionId) {
        headers['X-Anon-Session-Id'] = anonSessionId;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          // Send only the current user message for anon (no prior context
          // stored server-side). Authenticated users get full-history
          // (server will load from DB in a future refactor; today we send
          // client state, same as previous behavior).
          messages: user
            ? [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
            : [{ role: 'user', content }],
          tab: activeTab,
          conversationId: user ? conversation.id : null,
          activeTripContext: activeTrip ? {
            id: activeTrip.id,
            title: activeTrip.title,
            start_date: activeTrip.start_date,
            end_date: activeTrip.end_date,
            destination: activeTrip.destination,
          } : null,
          // Persistent chips (neighborhood · dates · travelers · budget).
          // Sent only when at least one chip is set so the payload stays
          // small for empty-context turns.
          sessionData: hasChatContext(chatContext) ? chatContext : null,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again later.');
          throw new Error('Rate limit exceeded');
        }
        // 402 with ANON_LIMIT_EXCEEDED code → trigger the email gate
        // modal via callback. Other 402s (billing-style) still show toast.
        if (response.status === 402) {
          try {
            const j = (await response.clone().json()) as {
              error?: { code?: string; retry_after_seconds?: number };
            };
            if (j?.error?.code === 'ANON_LIMIT_EXCEEDED') {
              options?.onAnonLimitExceeded?.(j.error.retry_after_seconds ?? 0);
              // Remove the optimistic user + assistant placeholders so the
              // user's message isn't stuck as "in flight" in the transcript.
              setMessages(prev =>
                prev.filter(m => m.id !== userMessage.id && m.id !== assistantMessage.id),
              );
              return;
            }
          } catch {
            /* fall through to generic */
          }
          toast.error('AI credits exhausted. Please add credits to continue.');
          throw new Error('Payment required');
        }
        let detail = 'Failed to get AI response';
        try {
          const j = (await response.json()) as {
            error?: string | { code?: string; message?: string };
          };
          if (typeof j?.error === 'object' && j.error?.message) {
            detail = String(j.error.message);
          } else if (typeof j?.error === 'string') {
            detail = j.error;
          }
        } catch {
          /* ignore parse errors */
        }
        toast.error(detail);
        throw new Error(detail);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            // Structured sidecar from edge function: tool emitted action(s)
            if (parsed && Array.isArray(parsed.mdeai_actions)) {
              setPendingActions(prev => [...prev, ...(parsed.mdeai_actions as ChatAction[])]);
            }
            // Reasoning-trace phase event (handoff / thinking / ranking / etc)
            if (parsed && typeof parsed.phase === 'string' && typeof parsed.message === 'string') {
              setReasoningPhases(prev => [...prev, {
                phase: parsed.phase,
                agent_label: parsed.agent_label,
                message: parsed.message,
                ts: Date.now(),
              }]);
            }
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              assistantContent += deltaContent;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessage.id
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            // Incomplete JSON, put back in buffer
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Fallback if the model produced no content (empty tool response, etc.)
      // Never persist empty assistant rows — show a helpful message instead.
      if (!assistantContent.trim()) {
        const fallback = "I couldn't find results for that right now. Try rephrasing, or ask me about a specific neighborhood (El Poblado, Laureles, Envigado).";
        assistantContent = fallback;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id ? { ...m, content: fallback } : m
          )
        );
      }

      // Save assistant message + update conversation metadata — authenticated
      // only. Anon visitors keep history in-memory until they sign in.
      if (user) {
        const { error: insertErr } = await supabase.from('messages').insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: assistantContent,
          agent_name: tabToAgentType[activeTab],
        });
        if (insertErr) {
          console.error('Failed to save assistant message:', insertErr);
          toast.error('Message saved locally only — failed to persist to history');
        }

        await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: (conversation.message_count || 0) + 2,
        })
        .eq('id', conversation.id);
      }

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', err);
        const msg = (err as Error).message || 'Failed to get response';
        setError(msg);
        lastFailedMessageRef.current = content;
        // Remove the empty assistant placeholder so user sees the error inline
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [user, anonSessionId, currentConversation, messages, activeTab, activeTrip, createConversation, options, setCurrentConversation, chatContext]);

  // Cancel streaming
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  // Retry the last failed message
  const retryLastMessage = useCallback(() => {
    if (lastFailedMessageRef.current) {
      const msg = lastFailedMessageRef.current;
      lastFailedMessageRef.current = null;
      setError(null);
      // Remove the user's failed message so sendMessage re-adds it
      setMessages(prev => {
        const lastUserIdx = [...prev].reverse().findIndex(m => m.role === 'user');
        if (lastUserIdx === -1) return prev;
        const idx = prev.length - 1 - lastUserIdx;
        return prev.slice(0, idx);
      });
      sendMessage(msg);
    }
  }, [sendMessage]);

  // Reset to a brand-new chat — clears the active conversation, message
  // stream, pending actions, reasoning trace, and chips. Used by the
  // "New chat" button in ChatLeftNav and whenever the user hits `/` fresh.
  const newChat = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
    setPendingActions([]);
    setReasoningPhases([]);
    setChatContext(EMPTY_CHAT_CONTEXT);
    setError(null);
    lastFailedMessageRef.current = null;
  }, []);

  // Archive a conversation
  const archiveConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      toast.error('Failed to archive conversation');
      return;
    }

    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [currentConversation]);

  return {
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
    createConversation,
    selectConversation,
    sendMessage,
    cancelStream,
    retryLastMessage,
    archiveConversation,
    newChat,
    setCurrentConversation,
    setMessages,
    setPendingActions,
    setReasoningPhases,
    updateChatContext,
  };
}
