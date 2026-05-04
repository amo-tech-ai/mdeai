import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EntityTally } from "./useContest";

interface VoteCastInput {
  contest_id: string;
  entity_id: string;
  fingerprint?: string;
  voter_anon_id?: string;
}

interface VoteCastResponse {
  tally: EntityTally | null;
  already_counted?: boolean;
  fraud_status?: string;
}

export function useVoteCast() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: VoteCastInput): Promise<VoteCastResponse> => {
      const { data, error } = await supabase.functions.invoke("vote-cast", {
        body: {
          ...input,
          idempotency_key: crypto.randomUUID(),
        },
      });
      if (error) throw new Error(error.message ?? "Failed to cast vote");
      if (!data?.success) {
        const err = data?.error;
        const e = new Error(err?.message ?? "Vote failed");
        (e as Error & { code?: string }).code = err?.code;
        throw e;
      }
      return data.data as VoteCastResponse;
    },
    onSuccess: (_data, variables) => {
      // Invalidate tally so the leaderboard refreshes
      qc.invalidateQueries({ queryKey: ["contest-tally", variables.contest_id] });
    },
  });
}
