import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InboxLeadRow } from "./useLeads";

/**
 * Fetch a single lead by id — D10 detail page.
 *
 * RLS policy `landlord_inbox_select` already gates by
 * `landlord_id IN acting_landlord_ids()`. Returns null for any id the
 * caller doesn't own (page renders "not found"); never throws on RLS.
 *
 * Cache key is parameterised by id; useLeadActions invalidates this
 * key plus the list cache (`host_inbox_leads`) so both stay in sync.
 */

export const LEAD_DETAIL_QUERY_KEY = (id: string | undefined) =>
  ["host_inbox_lead", id ?? ""] as const;

export function useLeadDetail(leadId: string | undefined) {
  return useQuery({
    queryKey: LEAD_DETAIL_QUERY_KEY(leadId),
    enabled: !!leadId,
    queryFn: async (): Promise<InboxLeadRow | null> => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from("landlord_inbox")
        .select(
          `id, channel, conversation_id, renter_id, renter_name, renter_phone_e164,
           renter_email, apartment_id, landlord_id, raw_message, structured_profile,
           status, viewed_at, first_reply_at, archived_at, created_at, updated_at,
           apartment:apartments(id, title, neighborhood)`,
        )
        .eq("id", leadId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as InboxLeadRow | null) ?? null;
    },
  });
}
