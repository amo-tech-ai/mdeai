import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type SponsorApplicationStatus =
  | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'live' | 'closed';

export interface AdminSponsorApplication {
  id: string;
  organization_id: string;
  event_id: string;
  activation_type: string;
  tier: string;
  pricing_model: string;
  flat_price_cents: number | null;
  status: SponsorApplicationStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  // joined
  org_display_name: string;
  org_legal_name: string;
  org_website: string | null;
  event_title: string;
}

const QUERY_KEY = ['admin-sponsor-applications'] as const;

// Supabase JS doesn't have first-class types for custom schemas yet;
// cast through unknown to access the schema() method.
type SchemaClient = { schema: (s: string) => typeof supabase };

export function useSponsorApplications(status?: SponsorApplicationStatus) {
  return useQuery({
    queryKey: [...QUERY_KEY, status],
    queryFn: async (): Promise<AdminSponsorApplication[]> => {
      // 1. Fetch applications
      let appsQuery = (supabase as unknown as SchemaClient)
        .schema('sponsor')
        .from('applications')
        .select('id, organization_id, event_id, activation_type, tier, pricing_model, flat_price_cents, status, rejection_reason, submitted_at, approved_at, created_at')
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .limit(50);

      if (status) {
        appsQuery = appsQuery.eq('status', status) as typeof appsQuery;
      }

      const { data: apps, error: appsErr } = await appsQuery;
      if (appsErr) throw new Error(appsErr.message);
      if (!apps?.length) return [];

      // 2. Fetch orgs
      const orgIds = [...new Set(apps.map((a) => a.organization_id))];
      const { data: orgs, error: orgsErr } = await (supabase as unknown as SchemaClient)
        .schema('sponsor')
        .from('organizations')
        .select('id, display_name, legal_name, website')
        .in('id', orgIds);
      if (orgsErr) throw new Error(orgsErr.message);

      // 3. Fetch events
      const eventIds = [...new Set(apps.map((a) => a.event_id))];
      const { data: events, error: eventsErr } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);
      if (eventsErr) throw new Error(eventsErr.message);

      const orgMap = Object.fromEntries((orgs ?? []).map((o) => [o.id, o]));
      const eventMap = Object.fromEntries((events ?? []).map((e) => [e.id, e]));

      return apps.map((a) => ({
        ...a,
        org_display_name: orgMap[a.organization_id]?.display_name ?? 'Unknown Brand',
        org_legal_name: orgMap[a.organization_id]?.legal_name ?? '',
        org_website: orgMap[a.organization_id]?.website ?? null,
        event_title: eventMap[a.event_id]?.title ?? 'Unknown Event',
      }));
    },
  });
}

export function useApproveSponsorApplication() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase.rpc('approve_sponsor_application', {
        p_application_id: applicationId,
        p_approved_by: user?.id ?? '',
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: 'Application approved', description: 'Placements created (pending payment).' });
    },
    onError: (e: Error) => {
      toast({ title: 'Approval failed', description: e.message, variant: 'destructive' });
    },
  });
}

export function useRejectSponsorApplication() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason: string }) => {
      const { error } = await (supabase as unknown as SchemaClient)
        .schema('sponsor')
        .from('applications')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          approved_by: user?.id ?? null,
          approved_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: 'Application rejected.' });
    },
    onError: (e: Error) => {
      toast({ title: 'Rejection failed', description: e.message, variant: 'destructive' });
    },
  });
}
