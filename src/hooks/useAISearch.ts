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
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: query,
            },
          ],
          tab: "explore",
          context: {
            searchMode: true,
            filters,
          },
        },
      });

      if (error) throw error;

      // Parse results from AI response
      const searchResults: AISearchResult[] = [];
      
      // Extract structured results from AI tool calls if available
      if (data?.toolResults) {
        for (const toolResult of data.toolResults) {
          if (Array.isArray(toolResult.data)) {
            for (const item of toolResult.data) {
              const type = getTypeFromToolName(toolResult.toolName);
              searchResults.push(mapToSearchResult(item, type));
            }
          }
        }
      }

      setResults(searchResults);
      return {
        results: searchResults,
        message: data?.content,
        intent: data?.intent,
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

function getTypeFromToolName(toolName: string): AISearchResult["type"] {
  if (toolName.includes("restaurant")) return "restaurant";
  if (toolName.includes("apartment")) return "apartment";
  if (toolName.includes("car")) return "car";
  if (toolName.includes("event")) return "event";
  return "restaurant";
}

function mapToSearchResult(item: Record<string, unknown>, type: AISearchResult["type"]): AISearchResult {
  const id = (item.id as string) || crypto.randomUUID();
  
  // Determine title based on type
  let title = "";
  if (type === "restaurant") {
    title = (item.name as string) || "Unknown Restaurant";
  } else if (type === "apartment") {
    title = (item.title as string) || "Unknown Apartment";
  } else if (type === "car") {
    title = `${item.make || ""} ${item.model || ""}`.trim() || "Unknown Car";
  } else if (type === "event") {
    title = (item.name as string) || "Unknown Event";
  }

  // Determine price label
  let priceLabel = "";
  let price: number | undefined;
  if (type === "restaurant") {
    const level = item.price_level as number;
    priceLabel = level ? "$".repeat(level) : "";
  } else if (type === "apartment") {
    price = (item.price_monthly as number) || (item.price_daily as number);
    priceLabel = price ? `$${price}/mo` : "";
  } else if (type === "car") {
    price = item.price_daily as number;
    priceLabel = price ? `$${price}/day` : "";
  } else if (type === "event") {
    const minPrice = item.ticket_price_min as number;
    priceLabel = minPrice ? `From $${minPrice}` : "Free";
  }

  // Determine location
  let location = "";
  if (type === "apartment") {
    location = (item.neighborhood as string) || "";
  } else {
    location = (item.address as string) || (item.city as string) || "";
  }

  // Determine image
  let imageUrl = "";
  if (item.primary_image_url) {
    imageUrl = item.primary_image_url as string;
  } else if (Array.isArray(item.images) && item.images.length > 0) {
    imageUrl = item.images[0] as string;
  }

  return {
    id,
    type,
    title,
    description: (item.description as string) || undefined,
    price,
    priceLabel,
    rating: (item.rating as number) || undefined,
    location,
    imageUrl,
    metadata: item,
  };
}
