import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'job_status_changed';
  payload: Record<string, unknown>;
}

export interface UseRealtimeChannelOptions {
  topic: string;
  enabled?: boolean;
  onEvent: (event: RealtimeEvent) => void;
}

/**
 * Shared Realtime hook for private channel subscriptions.
 * Handles setAuth, subscribe, and cleanup automatically.
 * 
 * Topics follow the pattern:
 * - conversation:{id}:messages
 * - trip:{id}:items
 * - trip:{id}:meta
 * - job:{id}:status
 * - user:{id}:notifications
 */
export function useRealtimeChannel({ topic, enabled = true, onEvent }: UseRealtimeChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !topic) {
      cleanup();
      return;
    }

    // Avoid duplicate subscriptions
    if (isSubscribedRef.current && channelRef.current) {
      return;
    }

    const subscribe = async () => {
      try {
        // Set auth token for private channels
        await supabase.realtime.setAuth();

        // Create private channel
        const channel = supabase.channel(topic, {
          config: { private: true },
        });

        // Listen for broadcast events
        channel.on('broadcast', { event: '*' }, (payload) => {
          const eventType = payload.event as RealtimeEvent['type'];
          onEvent({
            type: eventType,
            payload: payload.payload as Record<string, unknown>,
          });
        });

        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Realtime channel ${topic} error:`, status);
            isSubscribedRef.current = false;
          }
        });

        channelRef.current = channel;
      } catch (error) {
        console.error(`Failed to subscribe to ${topic}:`, error);
      }
    };

    subscribe();

    return cleanup;
  }, [topic, enabled, onEvent, cleanup]);

  return { cleanup };
}
