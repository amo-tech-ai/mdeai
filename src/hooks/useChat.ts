import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTripContext } from '@/context/TripContext';
import { ChatMessage, Conversation, ChatTab, ChatAction, tabToAgentType } from '@/types/chat';
import type { ReasoningPhase } from '@/components/chat/ChatReasoningTrace';
import { useRealtimeChannel, RealtimeEvent } from '@/hooks/useRealtimeChannel';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export function useChat(activeTab: ChatTab) {
  const { user } = useAuth();
  const { activeTrip } = useTripContext();
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

  // Subscribe to realtime updates for current conversation
  const realtimeTopic = currentConversation?.id 
    ? `conversation:${currentConversation.id}:messages` 
    : '';

  useRealtimeChannel({
    topic: realtimeTopic,
    enabled: !!currentConversation?.id && !!user,
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
    await fetchMessages(conversation.id);
  }, [fetchMessages]);

  // Send a message with streaming
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    if (!user) {
      toast.error('Please sign in to chat');
      return;
    }
    setError(null);
    // Clear previous turn's action affordances + reasoning trace —
    // the next tool call will emit its own.
    setPendingActions([]);
    setReasoningPhases([]);

    // Create conversation if none exists
    let conversation = currentConversation;
    if (!conversation) {
      conversation = await createConversation(content.slice(0, 50));
      if (!conversation) return;
    }

    // Save user message to database FIRST and capture the server-generated UUID.
    // Matching client + server IDs is what lets the realtime subscription dedupe
    // correctly (without this, every message renders twice on broadcast).
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

    const userMessage: ChatMessage = {
      id: insertedRow?.id ?? crypto.randomUUID(),
      conversation_id: conversation.id,
      role: 'user',
      content,
      created_at: insertedRow?.created_at ?? new Date().toISOString(),
    };
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
          // Pass active trip context to AI
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
          throw new Error('Rate limit exceeded');
        }
        if (response.status === 402) {
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

      // Save assistant message to database
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

      // Update conversation
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
  }, [user, currentConversation, messages, activeTab, activeTrip, createConversation]);

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
    fetchConversations,
    createConversation,
    selectConversation,
    sendMessage,
    cancelStream,
    retryLastMessage,
    archiveConversation,
    setCurrentConversation,
    setMessages,
    setPendingActions,
    setReasoningPhases,
  };
}
