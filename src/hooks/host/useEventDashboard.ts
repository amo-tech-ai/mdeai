/**
 * useEventDashboard — single-source hook for /host/event/:id (task 003).
 *
 * Reads everything in ONE round-trip via the SECURITY DEFINER RPC
 * `event_dashboard_summary(p_event_id)`. The RPC enforces organizer-only
 * via auth.uid(); non-organizers get NOT_ORGANIZER raised which we surface
 * as `forbidden: true`.
 *
 * Realtime: subscribes to `postgres_changes` on event_orders, event_attendees,
 * event_check_ins (all 3 tables added to supabase_realtime publication by
 * the dashboard's companion migration). On any INSERT/UPDATE/DELETE we
 * invalidate the TanStack Query cache and re-fetch the RPC, so KPIs stay
 * accurate within ~1-2s of any DB change.
 *
 * The RPC return shape lives in `EventDashboardSummary` below.
 */

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventDashboardKpis {
  tickets_sold: number;
  checked_in: number;
  no_shows: number;
}

export interface EventDashboardTier {
  id: string;
  name: string;
  qty_total: number;
  qty_sold: number;
  qty_pending: number;
  remaining: number;
  price_cents: number;
  currency: string;
  tier_revenue_cents: number;
}

export interface EventDashboardCheckIn {
  id: string;
  result: string;
  created_at: string;
  details: Record<string, unknown> | null;
}

export interface EventDashboardSummary {
  event: {
    id: string;
    name: string;
    status: "draft" | "published" | "live" | "closed" | string;
    event_start_time: string | null;
    event_end_time: string | null;
    staff_link_version: number;
    address: string | null;
  };
  kpis: EventDashboardKpis;
  revenue_cents: number;
  tiers: EventDashboardTier[];
  recent_check_ins: EventDashboardCheckIn[];
  /** Latest paid Stripe payment intent id; null when no paid orders or Stripe not wired. */
  latest_stripe_pi: string | null;
}

export interface UseEventDashboardResult {
  data: EventDashboardSummary | undefined;
  isLoading: boolean;
  error: Error | null;
  /** True when the RPC raised NOT_ORGANIZER → friendly 403 page in the UI. */
  forbidden: boolean;
  refetch: () => Promise<unknown>;
}

const QUERY_KEY = (eventId: string) => ["event-dashboard", eventId] as const;

export function useEventDashboard(eventId: string | undefined): UseEventDashboardResult {
  const queryClient = useQueryClient();

  const query = useQuery<EventDashboardSummary>({
    queryKey: eventId ? QUERY_KEY(eventId) : ["event-dashboard", "noop"],
    enabled: !!eventId,
    staleTime: 10_000, // 10s — Realtime invalidates on every change
    queryFn: async () => {
      if (!eventId) throw new Error("eventId required");
      const { data, error } = await supabase.rpc("event_dashboard_summary", {
        p_event_id: eventId,
      });
      if (error) throw error;
      return data as EventDashboardSummary;
    },
  });

  // ---- Realtime: listen for any change on the 3 event tables for this event ----
  useEffect(() => {
    if (!eventId) return;

    const filter = `event_id=eq.${eventId}`;
    const channel = supabase
      .channel(`host-event-dashboard:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_orders", filter },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(eventId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_attendees", filter },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(eventId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_check_ins", filter },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(eventId) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);

  const isForbidden = !!query.error &&
    /NOT_ORGANIZER/i.test(query.error.message ?? "");

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: isForbidden ? null : (query.error as Error | null),
    forbidden: isForbidden,
    refetch: query.refetch,
  };
}
