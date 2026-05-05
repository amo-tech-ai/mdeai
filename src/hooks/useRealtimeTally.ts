import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { EntityTally } from "./useContest";

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

/**
 * Subscribes to postgres_changes on vote.entity_tally for a given contest.
 * On each UPDATE event the TanStack Query cache key ["contest-tally", contestId]
 * is patched in-place — no full refetch needed.
 * On reconnect after a drop, the caller's refetchInterval in useContestTally
 * will naturally reconcile any missed events.
 */
export function useRealtimeTally(contestId: string | undefined): RealtimeStatus {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    if (!contestId) return;

    const channel = supabase
      .channel(`vote:tally:${contestId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "vote",
          table: "entity_tally",
          filter: `contest_id=eq.${contestId}`,
        },
        (payload) => {
          const incoming = payload.new as EntityTally;
          if (!incoming?.entity_id) return;

          // Patch the cached tally array without a full refetch
          queryClient.setQueryData<EntityTally[]>(
            ["contest-tally", contestId],
            (prev) => {
              if (!prev) return [incoming];
              const idx = prev.findIndex((t) => t.entity_id === incoming.entity_id);
              if (idx === -1) return [...prev, incoming];
              const next = [...prev];
              next[idx] = incoming;
              return next.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
            },
          );
        },
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          setStatus("connected");
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          setStatus("disconnected");
        }
      });

    channelRef.current = channel;
    setStatus("connecting");

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [contestId, queryClient]);

  return status;
}
