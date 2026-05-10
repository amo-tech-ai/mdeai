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
  message?: string;
  intent?: string;
}

export function useAISearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [lastQuery, setLastQuery] = useState<string>("");

  const search = useCallback(async (query: string, filters?: {
    types?: string[];
    neighborhood?: string;
    dateFrom?: string;
    dateTo?: string;
    maxPrice?: number;
  }): Promise<AISearchResponse> => {
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
          domain: filters?.types?.[0] ?? "all",
          semantic: true,
          filters: {
            neighborhood: filters?.neighborhood,
            priceMax: filters?.maxPrice,
            dateFrom: filters?.dateFrom,
            dateTo: filters?.dateTo,
          },
          limit: 10,
        },
      });

      if (error) throw error;

      const raw: Array<{
        id: string;
        type: AISearchResult["type"];
        title: string;
        description: string | null;
        price: number | null;
        rating: number | null;
        imageUrl: string | null;
        location: string | null;
        relevanceScore: number;
        metadata: Record<string, unknown>;
      }> = data?.results ?? [];

      const searchResults: AISearchResult[] = raw.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        description: r.description ?? undefined,
        price: r.price ?? undefined,
        priceLabel: buildPriceLabel(r.type, r.price),
        rating: r.rating ?? undefined,
        location: r.location ?? undefined,
        imageUrl: r.imageUrl ?? undefined,
        metadata: r.metadata,
      }));

      setResults(searchResults);
      return {
        results: searchResults,
        message: data?.summary,
      };
    } catch (error) {
      console.error("AI search error:", error);
      toast.error("Search failed. Please try again.");
      return { results: [] };
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setLastQuery("");
  }, []);

  return {
    isSearching,
    results,
    lastQuery,
    search,
    clearResults,
  };
}

function buildPriceLabel(type: AISearchResult["type"], price: number | null): string {
  if (price == null) return "";
  if (type === "restaurant") return "$".repeat(Math.min(Math.max(Math.round(price), 1), 4));
  if (type === "apartment") return `$${price}/mo`;
  if (type === "car") return `$${price}/day`;
  if (type === "event") return price === 0 ? "Free" : `From $${price}`;
  return `$${price}`;
}
