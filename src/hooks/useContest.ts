import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Contest {
  id: string;
  slug: string;
  kind: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  free_votes_per_user_per_day: number;
}

export interface ContestEntity {
  id: string;
  contest_id: string;
  category_id: string | null;
  slug: string;
  display_name: string;
  bio: string | null;
  hero_url: string | null;
  approved: boolean;
}

export interface EntityTally {
  entity_id: string;
  contest_id: string;
  audience_votes: number;
  paid_votes: number;
  weighted_total: number;
  rank: number | null;
  trend_24h: number;
}

export function useContest(slug: string | undefined) {
  return useQuery({
    queryKey: ["contest", slug],
    queryFn: async () => {
      if (!slug) throw new Error("No slug");
      const { data, error } = await supabase
        .schema("vote" as never)
        .from("contests")
        .select("id, slug, kind, title, description, cover_url, starts_at, ends_at, status, free_votes_per_user_per_day")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as Contest;
    },
    enabled: !!slug,
    retry: false,
  });
}

export function useContestEntities(contestId: string | undefined) {
  return useQuery({
    queryKey: ["contest-entities", contestId],
    queryFn: async () => {
      if (!contestId) throw new Error("No contestId");
      const { data, error } = await supabase
        .schema("vote" as never)
        .from("entities")
        .select("id, contest_id, category_id, slug, display_name, bio, hero_url, approved")
        .eq("contest_id", contestId)
        .eq("approved", true)
        .order("display_name");
      if (error) throw error;
      return (data ?? []) as ContestEntity[];
    },
    enabled: !!contestId,
  });
}

export function useContestTally(contestId: string | undefined) {
  return useQuery({
    queryKey: ["contest-tally", contestId],
    queryFn: async () => {
      if (!contestId) throw new Error("No contestId");
      const { data, error } = await supabase
        .schema("vote" as never)
        .from("entity_tally")
        .select("entity_id, contest_id, audience_votes, paid_votes, weighted_total, rank, trend_24h")
        .eq("contest_id", contestId)
        .order("weighted_total", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EntityTally[];
    },
    enabled: !!contestId,
    refetchInterval: 5000, // poll every 5s until Realtime is wired (task 013)
  });
}
