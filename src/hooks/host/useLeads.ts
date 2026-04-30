import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOwnLandlordProfile } from "./useLandlordOnboarding";

/**
 * Landlord inbox / leads hook (D9).
 *
 * Authorization: RLS policy `landlord_inbox_select` already gates by
 * `landlord_id IN acting_landlord_ids()`, so we don't need to filter
 * client-side. The query is gated on having a landlord_profile so the
 * useless empty-array fetch never fires for renters.
 *
 * The Supabase nested select (`apartments(title, neighborhood)`) joins
 * the apartment context for chat-channel leads. Form-channel leads
 * already store the same fields in structured_profile (D7.5) — we
 * prefer the joined value when present so a renamed listing reflects
 * everywhere.
 */

export type LeadStatus = "new" | "viewed" | "replied" | "archived";
export type LeadChannel = "form" | "chat" | "whatsapp";

export interface LeadStructuredProfile {
  source?: string;
  move_when?: "now" | "soon" | "later";
  renter_name?: string;
  apartment_title?: string;
  apartment_neighborhood?: string;
  // D8 lead-classify will add: intent, move_date, budget, must_haves
  [key: string]: unknown;
}

export interface InboxLeadRow {
  id: string;
  channel: LeadChannel;
  conversation_id: string | null;
  renter_id: string | null;
  renter_name: string | null;
  renter_phone_e164: string | null;
  renter_email: string | null;
  apartment_id: string | null;
  landlord_id: string;
  raw_message: string;
  structured_profile: LeadStructuredProfile;
  status: LeadStatus;
  viewed_at: string | null;
  first_reply_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  /** Joined from apartments. Null when the apartment was deleted. */
  apartment: { id: string; title: string; neighborhood: string } | null;
}

const QUERY_KEY = ["host_inbox_leads"] as const;

interface UseLeadsResult {
  leads: InboxLeadRow[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  /** Counts of leads by status — drives the nav badge + filter tabs. */
  counts: Record<LeadStatus | "all", number>;
}

export function useLeads(): UseLeadsResult {
  const { data: profile } = useOwnLandlordProfile();
  const query = useQuery({
    queryKey: QUERY_KEY,
    enabled: !!profile,
    queryFn: async (): Promise<InboxLeadRow[]> => {
      const { data, error } = await supabase
        .from("landlord_inbox")
        .select(
          `id, channel, conversation_id, renter_id, renter_name, renter_phone_e164,
           renter_email, apartment_id, landlord_id, raw_message, structured_profile,
           status, viewed_at, first_reply_at, archived_at, created_at, updated_at,
           apartment:apartments(id, title, neighborhood)`,
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data as unknown as InboxLeadRow[]) ?? []);
    },
  });

  const counts = useMemo<Record<LeadStatus | "all", number>>(() => {
    const c: Record<LeadStatus | "all", number> = {
      all: 0,
      new: 0,
      viewed: 0,
      replied: 0,
      archived: 0,
    };
    for (const l of query.data ?? []) {
      c.all += 1;
      c[l.status] = (c[l.status] ?? 0) + 1;
    }
    return c;
  }, [query.data]);

  return {
    leads: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    counts,
  };
}

/**
 * Mark a lead as `viewed`. Idempotent — RLS check, then UPDATE only when
 * status='new' to avoid clobbering replied/archived rows.
 *
 * D10 ships the manual "mark replied" button + archive flow; this hook
 * is the passive "user opened the card" path.
 */
export function useMarkLeadViewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase
        .from("landlord_inbox")
        .update({ status: "viewed", viewed_at: new Date().toISOString() })
        .eq("id", leadId)
        .eq("status", "new")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
