import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SocialEnrichResult {
  accessible:          boolean;
  platform:            string;
  display_name:        string;
  bio:                 string;
  avatar_url:          string;
  followers:           string;
  inaccessible_reason?: string;
}

interface UseContestantSocialEnrichReturn {
  result:   SocialEnrichResult | null;
  isLoading: boolean;
  error:    string | null;
  enrich:   (url: string) => Promise<SocialEnrichResult | null>;
  clear:    () => void;
}

export function useContestantSocialEnrich(): UseContestantSocialEnrichReturn {
  const [result,    setResult]    = useState<SocialEnrichResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const enrich = useCallback(async (url: string): Promise<SocialEnrichResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        "contestant-social-enrich",
        { body: { social_url: url } },
      );
      if (fnErr) throw new Error(fnErr.message ?? "Request failed");
      if (!data?.success) throw new Error(data?.error?.message ?? "Enrichment failed");

      const enriched = data.data as SocialEnrichResult;
      setResult(enriched);
      return enriched;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, enrich, clear };
}
