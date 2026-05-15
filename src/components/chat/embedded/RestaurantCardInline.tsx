import { useState } from 'react';
import { Star, UtensilsCrossed, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RestaurantInlineListing } from '@/types/chat';

interface RestaurantCardInlineProps {
  restaurant: RestaurantInlineListing;
}

const CUISINE_LABELS: Record<string, string> = {
  colombian: 'Colombian',
  paisa: 'Paisa',
  seafood: 'Seafood',
  steakhouse: 'Steakhouse',
  vegetarian: 'Vegetarian',
  cafe: 'Café',
  international: 'International',
  'street-food': 'Street Food',
};

export function RestaurantCardInline({ restaurant }: RestaurantCardInlineProps) {
  const [imgError, setImgError] = useState(false);
  const cuisineLabel = CUISINE_LABELS[restaurant.cuisine] ?? restaurant.cuisine;

  return (
    <a
      href={restaurant.sourceUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex flex-row h-[120px] overflow-hidden rounded-2xl border border-border bg-card',
        'transition-all hover:shadow-md',
        !restaurant.sourceUrl && 'pointer-events-none',
      )}
    >
      {/* Content */}
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {cuisineLabel}
            </Badge>
            {restaurant.priceTier && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {restaurant.priceTier}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">{restaurant.name}</h3>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{restaurant.neighborhood}</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {restaurant.rating != null && (
                <span className="inline-flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {Number(restaurant.rating).toFixed(1)}
                </span>
              )}
              {restaurant.avgPricePerPerson != null && (
                <span>~${restaurant.avgPricePerPerson}/person</span>
              )}
            </div>
          </div>
          {restaurant.vibe && restaurant.vibe.length > 0 && (
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              {restaurant.vibe.slice(0, 3).join(' · ')}
            </p>
          )}
          {/* MASTRA-048: ai_summary — Gemini-generated venue description */}
          {restaurant.aiSummary && (
            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 italic">
              {restaurant.aiSummary}
            </p>
          )}
          {/* MASTRA-048: Maps deep link — placeUri from Places API (MASTRA-067) */}
          {restaurant.mapsUrl && (
            <a
              href={restaurant.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 hover:text-emerald-900 mt-0.5 font-medium"
            >
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              Open in Maps
            </a>
          )}
        </div>
      </div>

      {/* Photo */}
      <div className="relative w-[110px] h-full flex-shrink-0 bg-muted">
        {!imgError && restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
        {restaurant.sourceUrl && (
          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
            <ExternalLink className="w-3 h-3 text-foreground" />
          </div>
        )}
      </div>
    </a>
  );
}
