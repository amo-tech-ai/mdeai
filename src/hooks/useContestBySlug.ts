/**
 * useContestBySlug — fetches a single vote.contests row by its slug.
 * Includes scoring_formula jsonb so the HowItWorks page can render
 * the formula as visual progress bars.
 *
 * Extends the base Contest type from useContest.ts with the full field set.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The default scoring formula stored in vote.contests.scoring_formula:
 *   {"audience": 0.5, "judges": 0.3, "engagement": 0.2}
 *
 * Values are fractions (0–1) that sum to 1.0.
 */
export interface ScoringFormula {
  audience: number;
  judges: number;
  engagement: number;
  [key: string]: number;
}

export interface ContestFull {
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
  paid_votes_enabled: boolean;
  judge_weight_pct: number;
  scoring_formula: ScoringFormula;
  created_at: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContestBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["contest-full", slug],
    queryFn: async (): Promise<ContestFull> => {
      if (!slug) throw new Error("No slug provided");

      const { data, error } = await supabase
        .schema("vote" as never)
        .from("contests")
        .select(
          `id, slug, kind, title, description, cover_url,
           starts_at, ends_at, status,
           free_votes_per_user_per_day, paid_votes_enabled,
           judge_weight_pct, scoring_formula, created_at`,
        )
        .eq("slug", slug)
        .single();

      if (error) throw error;

      const row = data as unknown as Omit<ContestFull, "scoring_formula"> & {
        scoring_formula: unknown;
      };

      // Normalise scoring_formula: ensure it's a plain object with numeric values
      let formula: ScoringFormula = { audience: 0.5, judges: 0.3, engagement: 0.2 };
      if (
        typeof row.scoring_formula === "object" &&
        row.scoring_formula !== null &&
        !Array.isArray(row.scoring_formula)
      ) {
        formula = row.scoring_formula as ScoringFormula;
      }

      return {
        ...row,
        scoring_formula: formula,
      };
    },
    enabled: !!slug,
    retry: false,
    staleTime: 60_000,
  });
}
