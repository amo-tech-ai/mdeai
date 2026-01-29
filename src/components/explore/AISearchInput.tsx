import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Sparkles, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAISearch, type AISearchResult } from "@/hooks/useAISearch";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface AISearchInputProps {
  onResultsChange?: (results: AISearchResult[]) => void;
  onResultSelect?: (result: AISearchResult) => void;
  placeholder?: string;
  neighborhood?: string;
  className?: string;
}

export function AISearchInput({
  onResultsChange,
  onResultSelect,
  placeholder = "Search with AI... try 'romantic dinner in Poblado'",
  neighborhood,
  className,
}: AISearchInputProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { isSearching, results, search, clearResults } = useAISearch();
  const debouncedQuery = useDebounce(query, 500);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      search(debouncedQuery, { neighborhood }).then((response) => {
        onResultsChange?.(response.results);
        if (response.results.length > 0) {
          setShowSuggestions(true);
        }
      });
    } else if (debouncedQuery.length === 0) {
      clearResults();
      onResultsChange?.([]);
    }
  }, [debouncedQuery, neighborhood, search, clearResults, onResultsChange]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    clearResults();
    onResultsChange?.([]);
    setShowSuggestions(false);
  }, [clearResults, onResultsChange]);

  const handleResultClick = useCallback(
    (result: AISearchResult) => {
      onResultSelect?.(result);
      setShowSuggestions(false);
    },
    [onResultSelect]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        search(query, { neighborhood }).then((response) => {
          onResultsChange?.(response.results);
          setShowSuggestions(true);
        });
      }
    },
    [query, neighborhood, search, onResultsChange]
  );

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-primary" />
          )}
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-14 pr-10 h-12 rounded-full bg-card border-border"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </form>

      {/* Quick suggestions dropdown */}
      {showSuggestions && results.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <div className="p-2 border-b border-border bg-muted/50">
            <p className="text-xs text-muted-foreground">
              Found {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {results.slice(0, 6).map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
              >
                {result.imageUrl ? (
                  <img
                    src={result.imageUrl}
                    alt={result.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Search className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {result.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {result.location && <span>{result.location}</span>}
                    {result.priceLabel && (
                      <>
                        <span>•</span>
                        <span>{result.priceLabel}</span>
                      </>
                    )}
                    {result.rating && (
                      <>
                        <span>•</span>
                        <span>★ {result.rating.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {results.length > 6 && (
            <div className="p-2 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                +{results.length - 6} more results
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
