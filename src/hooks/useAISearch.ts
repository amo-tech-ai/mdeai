import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AISearchResult {
  id: string;
  type: "restaurant" | "apartment" | "car" | "event";
  title: string;
  description?: string;
  price?: number;
  priceLabel?: string;
  rating?: number;
  location?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

interface AISearchResponse {
  results: AISearchResult[];
  summary?: string;
  mode?: string;
}

export function useAISearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [lastQuery, setLastQuery] = useState<string>("");

  const search = useCallback(
    async (
      query: string,
      options?: {
        semantic?: boolean;
        domain?: "all" | "apartments" | "cars" | "restaurants" | "events";
        neighborhood?: string;
        dateFrom?: string;
        dateTo?: string;
        maxPrice?: number;
      }
    ): Promise<AISearchResponse> => {
      if (!query.trim()) {
        setResults([]);
        return { results: [] };
      }

      setIsSearching(true);
      setLastQuery(query);

      try {
        const { data, error } = await supabase.functions.invoke("ai-search", {
          body: {
            query,
            semantic: options?.semantic ?? true,
            domain: options?.domain ?? "all",
            filters: {
              neighborhood: options?.neighborhood,
              dateFrom: options?.dateFrom,
              dateTo: options?.dateTo,
              priceMax: options?.maxPrice,
            },
            limit: 12,
          },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Search failed");

        const searchResults: AISearchResult[] = (data.results || []).map(
          (r: Record<string, unknown>) => mapSearchResult(r)
        );

        setResults(searchResults);
        return {
          results: searchResults,
          summary: data.summary,
          mode: data.meta?.mode,
        };
      } catch (error) {
        console.error("AI search error:", error);
        toast.error("Search failed. Please try again.");
        return { results: [] };
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setLastQuery("");
  }, []);

  return { isSearching, results, lastQuery, search, clearResults };
}

function mapSearchResult(r: Record<string, unknown>): AISearchResult {
  const type = r.type as AISearchResult["type"];
  const price = r.price as number | undefined;

  let priceLabel = "";
  if (type === "restaurant" && price) {
    priceLabel = "$".repeat(Math.min(price, 4));
  } else if (type === "apartment" && price) {
    priceLabel = `$${price}/mo`;
  } else if (type === "car" && price) {
    priceLabel = `$${price}/day`;
  } else if (type === "event") {
    priceLabel = price ? `From $${price}` : "Free";
  }

  return {
    id: r.id as string,
    type,
    title: r.title as string,
    description: (r.description as string) || undefined,
    price: price || undefined,
    priceLabel,
    rating: (r.rating as number) || undefined,
    location: (r.location as string) || undefined,
    imageUrl: (r.imageUrl as string) || undefined,
    metadata: (r.metadata as Record<string, unknown>) || undefined,
  };
}
