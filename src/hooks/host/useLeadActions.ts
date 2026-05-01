import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_DETAIL_QUERY_KEY } from "./useLeadDetail";
import { trackEvent } from "@/lib/posthog";
import type { LeadStatus } from "./useLeads";

/**
 * Lead status mutations — D10 manual transitions.
 *
 * Three actions; all idempotent + invalidate both list + detail caches.
 *
 *   markReplied   status → 'replied', first_reply_at = COALESCE(prev, now())
 *   archive       status → 'archived', archived_at = now()
 *   reopen        (from archived) status → 'viewed', archived_at = null
 *
 * The conditional COALESCE on first_reply_at preserves the original
 * reply timestamp if a landlord toggles replied → archived → reopen
 * → replied (response-time analytics need a stable first-reply mark).
 *
 * RLS policy `landlord_inbox_update` gates these to landlords on rows
 * they own. .eq() filters add belt+braces.
 */

const LIST_QUERY_KEY = ["host_inbox_leads"] as const;

interface ActionContext {
  leadId: string;
  /** Pre-mutation status — used for analytics + the COALESCE trick. */
  fromStatus: LeadStatus;
  /** Whether the lead already has first_reply_at set. */
  hadReply: boolean;
}

function invalidateBoth(qc: ReturnType<typeof useQueryClient>, leadId: string) {
  qc.invalidateQueries({ queryKey: LIST_QUERY_KEY });
  qc.invalidateQueries({ queryKey: LEAD_DETAIL_QUERY_KEY(leadId) });
}

export function useMarkReplied() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ctx: ActionContext) => {
      const updates: Record<string, unknown> = {
        status: "replied",
        updated_at: new Date().toISOString(),
      };
      if (!ctx.hadReply) {
        // Only set on the FIRST mark-replied so response-time metric is
        // stable across later toggles.
        updates.first_reply_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("landlord_inbox")
        .update(updates)
        .eq("id", ctx.leadId);
      if (error) throw error;
    },
    onSuccess: (_data, ctx) => {
      invalidateBoth(qc, ctx.leadId);
      trackEvent({
        name: "lead_marked_replied",
        leadId: ctx.leadId,
        fromStatus: ctx.fromStatus,
      });
    },
  });
}

export function useArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ctx: ActionContext) => {
      const { error } = await supabase
        .from("landlord_inbox")
        .update({
          status: "archived",
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", ctx.leadId);
      if (error) throw error;
    },
    onSuccess: (_data, ctx) => {
      invalidateBoth(qc, ctx.leadId);
      trackEvent({
        name: "lead_archived",
        leadId: ctx.leadId,
        fromStatus: ctx.fromStatus,
      });
    },
  });
}

export function useReopen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ctx: ActionContext) => {
      const { error } = await supabase
        .from("landlord_inbox")
        .update({
          // Send back to 'viewed' rather than 'new' since the landlord
          // has already seen the lead at least once.
          status: "viewed",
          archived_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ctx.leadId);
      if (error) throw error;
    },
    onSuccess: (_data, ctx) => {
      invalidateBoth(qc, ctx.leadId);
      trackEvent({
        name: "lead_reopened",
        leadId: ctx.leadId,
        fromStatus: ctx.fromStatus,
      });
    },
  });
}
