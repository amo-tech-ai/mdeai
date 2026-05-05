import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  SponsorApplication,
  SponsorOrganization,
  SponsorInvoice,
  SponsorPlacement,
  SponsorRoiDaily,
} from '@/types/sponsor';

export interface DashboardData {
  application: SponsorApplication;
  organization: SponsorOrganization;
  invoice: SponsorInvoice | null;
  placements: SponsorPlacement[];
  roi: SponsorRoiDaily[];
  eventName: string;
}

export function useSponsorDashboard(applicationId: string) {
  return useQuery({
    queryKey: ['sponsor-dashboard', applicationId],
    queryFn: async (): Promise<DashboardData> => {
      // Load application
      const { data: app, error: appErr } = await supabase
        .schema('sponsor' as never)
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      if (appErr) throw appErr;

      // Load organization
      const { data: org, error: orgErr } = await supabase
        .schema('sponsor' as never)
        .from('organizations')
        .select('*')
        .eq('id', (app as { organization_id: string }).organization_id)
        .single();
      if (orgErr) throw orgErr;

      // Load invoice (may not exist yet)
      const { data: invoice } = await supabase
        .schema('sponsor' as never)
        .from('invoices')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();

      // Load placements
      const { data: placements } = await supabase
        .schema('sponsor' as never)
        .from('placements')
        .select('id, application_id, surface, active, start_at, end_at')
        .eq('application_id', applicationId);

      // Load ROI last 7 days
      const placementIds = ((placements ?? []) as Array<{ id: string }>).map(p => p.id);
      let roi: SponsorRoiDaily[] = [];
      if (placementIds.length > 0) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        const { data: roiData } = await supabase
          .schema('sponsor' as never)
          .from('roi_daily')
          .select('*')
          .in('placement_id', placementIds)
          .gte('day', sevenDaysAgo)
          .order('day');
        roi = (roiData ?? []) as SponsorRoiDaily[];
      }

      // Load event name
      const { data: event } = await supabase
        .from('events')
        .select('name')
        .eq('id', (app as { event_id: string }).event_id)
        .maybeSingle();

      return {
        application: app as SponsorApplication,
        organization: org as SponsorOrganization,
        invoice: (invoice ?? null) as SponsorInvoice | null,
        placements: (placements ?? []) as unknown as SponsorPlacement[],
        roi,
        eventName: (event as { name?: string } | null)?.name ?? 'Unknown Event',
      };
    },
    enabled: !!applicationId,
    staleTime: 60_000,
  });
}
