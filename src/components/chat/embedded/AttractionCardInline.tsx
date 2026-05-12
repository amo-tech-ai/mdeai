import { useState } from 'react';
import { Star, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AttractionInlineListing } from '@/types/chat';

interface AttractionCardInlineProps {
  attraction: AttractionInlineListing;
}

const CATEGORY_LABELS: Record<string, string> = {
  park: 'Park',
  museum: 'Museum',
  viewpoint: 'Viewpoint',
  tour: 'Tour',
  landmark: 'Landmark',
  'neighborhood-walk': 'Walk',
  'day-trip': 'Day Trip',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function AttractionCardInline({ attraction }: AttractionCardInlineProps) {
  const [imgError, setImgError] = useState(false);
  const categoryLabel = CATEGORY_LABELS[attraction.category] ?? attraction.category;
  const isFree = attraction.priceUsd === 0;

  return (
    <a
      href={attraction.sourceUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex flex-row h-[120px] overflow-hidden rounded-2xl border border-border bg-card',
        'transition-all hover:shadow-md',
        !attraction.sourceUrl && 'pointer-events-none',
      )}
    >
      {/* Content */}
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {categoryLabel}
            </Badge>
            {isFree && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border-0">
                Free
              </Badge>
            )}
          </div>
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">{attraction.name}</h3>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {attraction.neighborhood}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {attraction.rating != null && (
              <span className="inline-flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                {Number(attraction.rating).toFixed(1)}
              </span>
            )}
            {attraction.durationMinutes != null && (
              <span className="inline-flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {formatDuration(attraction.durationMinutes)}
              </span>
            )}
            {!isFree && attraction.priceUsd != null && (
              <span className="font-medium text-foreground">${attraction.priceUsd}</span>
            )}
          </div>
        </div>
      </div>

      {/* Photo */}
      <div className="relative w-[110px] h-full flex-shrink-0 bg-muted">
        {!imgError && attraction.imageUrl ? (
          <img
            src={attraction.imageUrl}
            alt={attraction.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
        {attraction.sourceUrl && (
          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
            <ExternalLink className="w-3 h-3 text-foreground" />
          </div>
        )}
      </div>
    </a>
  );
}
