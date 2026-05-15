import { useState } from 'react';
import { Calendar, MapPin, Ticket, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EventInlineListing } from '@/types/chat';

interface EventCardInlineProps {
  event: EventInlineListing;
}

const CATEGORY_COLORS: Record<string, string> = {
  music: 'bg-purple-100 text-purple-700',
  food: 'bg-amber-100 text-amber-700',
  culture: 'bg-blue-100 text-blue-700',
  sport: 'bg-green-100 text-green-700',
  nightlife: 'bg-pink-100 text-pink-700',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function EventCardInline({ event }: EventCardInlineProps) {
  const [imgError, setImgError] = useState(false);
  const categoryColor = CATEGORY_COLORS[event.category] ?? 'bg-muted text-muted-foreground';

  return (
    <a
      href={event.sourceUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex flex-row h-[120px] overflow-hidden rounded-2xl border border-border bg-card',
        'transition-all hover:shadow-md',
        !event.sourceUrl && 'pointer-events-none',
      )}
    >
      {/* Content */}
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <Badge className={cn('text-[10px] px-1.5 py-0 h-4 border-0', categoryColor)}>
              {event.category}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">{event.title}</h3>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{event.venue} · {event.neighborhood}</span>
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {formatDate(event.startsAt)}
            </p>
            {event.pricePerTicket != null && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-0.5">
                <Ticket className="w-3 h-3" />
                {event.pricePerTicket === 0 ? 'Free' : `$${event.pricePerTicket}`}
              </span>
            )}
          </div>
          {/* MASTRA-048: Maps deep link — placeUri from Places API (MASTRA-067) */}
          {event.mapsUrl && (
            <a
              href={event.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 hover:text-emerald-900 mt-0.5 font-medium"
            >
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              Open venue in Maps
            </a>
          )}
        </div>
      </div>

      {/* Photo */}
      <div className="relative w-[110px] h-full flex-shrink-0 bg-muted">
        {!imgError && event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
        {event.sourceUrl && (
          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
            <ExternalLink className="w-3 h-3 text-foreground" />
          </div>
        )}
      </div>
    </a>
  );
}
