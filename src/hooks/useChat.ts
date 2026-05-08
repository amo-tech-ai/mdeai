import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTripContext } from '@/context/TripContext';
import {
  ChatMessage,
  Conversation,
  ChatTab,
  tabToAgentType,
  ChatAction,
  ChatContext,
  EMPTY_CHAT_CONTEXT,
} from '@/types/chat';
import { useRealtimeChannel, RealtimeEvent } from '@/hooks/useRealtimeChannel';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://zkwcbyxiwklihegjhuql.supabase.co';

export interface IntentResult {
  intent: string;
  targetAgent: ChatTab;
  confidence: number;
  entities: Record<string, unknown>;
  suggestedResponse?: string;
  requiresAuth?: boolean;
  reasoning?: string;
}

interface UseChatOptions {
  onAnonLimitExceeded?: (retry: number | undefined) => void;
}

export function useChat(activeTab: ChatTab, options?: UseChatOptions) {
  const { user } = useAuth();
  const { activeTrip } = useTripContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<IntentResult | null>(null);
  const [pendingActions, setPendingActions] = useState<ChatAction[]>([]);
  const [chatContext, setChatContext] = useState<ChatContext>(EMPTY_CHAT_CONTEXT);
  // reasoningPhases is reserved for future thinking-trace UI
  const reasoningPhases: unknown[] = [];
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateChatContext = useCallback((ctx: ChatContext) => {
    setChatContext(ctx);
  }, []);

  // Realtime subscription handler for message updates
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    const messagePayload = event.payload as Partial<ChatMessage> & { id: string };

    switch (event.type) {
      case 'INSERT':
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

  const realtimeTopic = currentConversation?.id
    ? `conversation:${currentConversation.id}:messages`
    : '';

  useRealtimeChannel({
    topic: realtimeTopic,
    enabled: !!currentConversation?.id && !!user,
    onEvent: handleRealtimeEvent,
  });

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const agentType = tabToAgentType[activeTab] as 'booking_assistant' | 'budget_guardian' | 'dining_orchestrator' | 'event_curator' | 'general_concierge' | 'itinerary_optimizer' | 'local_scout';
    const { data, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_type', agentType)
      .is('deleted_at', null)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (fetchError) {
      console.error('Error fetching conversations:', fetchError);
      return;
    }

    setConversations(data as Conversation[]);
  }, [user, activeTab]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching messages:', fetchError);
      return;
    }

    setMessages(data as ChatMessage[]);
  }, []);

  const createConversation = useCallback(async (title: string = 'New conversation') => {
    if (!user) return null;

    const agentType = tabToAgentType[activeTab] as 'booking_assistant' | 'budget_guardian' | 'dining_orchestrator' | 'event_curator' | 'general_concierge' | 'itinerary_optimizer' | 'local_scout';
    const { data, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        agent_type: agentType,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      toast.error('Failed to create conversation');
      return null;
    }

    const conversation = data as Conversation;
    setConversations(prev => [conversation, ...prev]);
    setCurrentConversation(conversation);
    setMessages([]);
    return conversation;
  }, [user, activeTab]);

  const selectConversation = useCallback(async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setPendingActions([]);
    await fetchMessages(conversation.id);
  }, [fetchMessages]);

  const newChat = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
    setPendingActions([]);
    setError(null);
  }, []);

  // Route message through AI Router for intent classification
  const routeMessage = useCallback(async (content: string): Promise<IntentResult | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-router`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token
            ? `Bearer ${session.access_token}`
            : `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          message: content,
          currentTab: activeTab,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
          userContext: {
            hasActiveTrip: !!activeTrip,
            hasPendingBookings: false,
            currentPage: window.location.pathname,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setLastIntent(result.data);
          return result.data as IntentResult;
        }
      }
      return null;
    } catch (err) {
      console.error('Intent routing error:', err);
      return null;
    }
  }, [activeTab, messages, activeTrip]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim()) return;

    setError(null);

    // Route the message to classify intent, then handle special intents
    routeMessage(content).then(intent => {
      if (intent?.intent === 'landlord_listing_create') {
        setPendingActions([{ type: 'OPEN_HOST_LISTING_FORM', payload: {} }]);
      }
    }).catch(console.error);

    let conversation = currentConversation;
    if (!conversation) {
      conversation = await createConversation(content.slice(0, 50));
      if (!conversation) return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content,
    });

    setIsLoading(true);
    setIsStreaming(true);
    setPendingActions([]);

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

      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const authHeader = session?.access_token
        ? `Bearer ${session.access_token}`
        : `Bearer ${anonKey}`;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          tab: activeTab,
          conversationId: conversation.id,
          activeTripContext: activeTrip ? {
            id: activeTrip.id,
            title: activeTrip.title,
            start_date: activeTrip.start_date,
            end_date: activeTrip.end_date,
            destination: activeTrip.destination,
          } : null,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again later.');
          options?.onAnonLimitExceeded?.(undefined);
          throw new Error('Rate limit exceeded');
        }
        if (response.status === 402) {
          toast.error('AI credits exhausted. Please add credits to continue.');
          throw new Error('Payment required');
        }
        throw new Error('Failed to get AI response');
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
            const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

            // Structured action sidecar — emitted by ai-chat before the text stream
            if (parsed.__mdeai_actions__ && Array.isArray(parsed.__mdeai_actions__)) {
              setPendingActions(parsed.__mdeai_actions__ as ChatAction[]);
              continue;
            }

            const choices = parsed.choices as Array<{ delta?: { content?: string } }> | undefined;
            const deltaContent = choices?.[0]?.delta?.content;
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
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistantContent,
        agent_name: tabToAgentType[activeTab],
      });

      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: (conversation.message_count || 0) + 2,
        })
        .eq('id', conversation.id);

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', err);
        const msg = err instanceof Error ? err.message : 'Failed to get response';
        setError(msg);
        toast.error('Failed to get response');
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [user, currentConversation, messages, activeTab, activeTrip, createConversation, routeMessage, options]);

  const retryLastMessage = useCallback(async () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setMessages(prev => prev.filter(m => m.role !== 'assistant' || m.content.length > 0));
    await sendMessage(lastUser.content);
  }, [messages, sendMessage]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const archiveConversation = useCallback(async (conversationId: string) => {
    const { error: archiveError } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (archiveError) {
      toast.error('Failed to archive conversation');
      return;
    }

    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [currentConversation]);

  // Suppress unused variable warning — kept for future use
  void useEffect;

  return {
    messages,
    conversations,
    currentConversation,
    isLoading,
    isStreaming,
    error,
    lastIntent,
    pendingActions,
    reasoningPhases,
    chatContext,
    fetchConversations,
    createConversation,
    selectConversation,
    newChat,
    sendMessage,
    routeMessage,
    retryLastMessage,
    cancelStream,
    archiveConversation,
    setCurrentConversation,
    setMessages,
    setPendingActions,
    updateChatContext,
  };
}
