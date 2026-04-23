import { MapPin as MapPinIcon } from 'lucide-react';
import { useMapContext, PIN_CATEGORY_CONFIG } from '@/context/MapContext';
import { cn } from '@/lib/utils';

/**
 * Right-panel map for the chat canvas.
 *
 * Day 3 lands the data contract (MapContext subscription, pin list, highlight
 * sync). Actual Google Maps render is blocked on VITE_GOOGLE_MAPS_API_KEY —
 * today we render a clean vertical pin list that looks good and reveals
 * the full data flow. When the API key is configured, swap the inner render
 * for GoogleMapView (already in the codebase) — the MapContext data shape is
 * deliberately compatible.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Wed.
 */
export function ChatMap() {
  const { pins, highlightedPinId, setHighlightedPinId } = useMapContext();
  const hasMapsKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (pins.length === 0) {
    return (
      <aside className="h-full flex items-center justify-center text-center p-8 bg-muted/20 border-l border-border">
        <div className="max-w-xs">
          <MapPinIcon className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Pins appear here as you chat.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try "top rentals in Laureles" →
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full overflow-y-auto bg-muted/10 border-l border-border">
      <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border px-4 py-3 z-10">
        <h2 className="text-sm font-semibold">
          {pins.length} on the map
        </h2>
        {!hasMapsKey && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Interactive map pending Google Maps key
          </p>
        )}
      </div>
      <ul className="divide-y divide-border">
        {pins.map((pin) => {
          const cfg = PIN_CATEGORY_CONFIG[pin.category];
          const isHot = pin.id === highlightedPinId;
          return (
            <li
              key={pin.id}
              onMouseEnter={() => setHighlightedPinId(pin.id)}
              onMouseLeave={() => setHighlightedPinId(null)}
              className={cn(
                'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                isHot ? 'bg-accent' : 'hover:bg-accent/40',
              )}
            >
              <span
                aria-hidden
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm flex-shrink-0"
                style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
              >
                {cfg.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-1">{pin.title}</p>
                {pin.label && (
                  <p className="text-xs text-muted-foreground mt-0.5">{pin.label}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
