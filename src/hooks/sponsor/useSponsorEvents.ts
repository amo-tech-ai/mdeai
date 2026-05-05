import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SponsorEventOption {
  id: string;
  title: string;
  slug: string | null;
}

export function useSponsorEvents() {
  return useQuery({
    queryKey: ["sponsor-events"],
    queryFn: async (): Promise<SponsorEventOption[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, slug")
        .in("status", ["published", "live"])
        .order("event_start_time", { ascending: true });

      if (error) throw error;
      return (data ?? []) as SponsorEventOption[];
    },
  });
}
