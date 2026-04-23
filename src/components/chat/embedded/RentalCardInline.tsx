import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Star, Bed, Bath, Wifi, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RentalInlineListing } from '@/types/chat';
import apartmentPlaceholder from '@/assets/apartment-1.jpg';

interface RentalCardInlineProps {
  listing: RentalInlineListing;
  /** Compact horizontal layout (photo right, content left) like Mindtrip. */
  layout?: 'horizontal' | 'vertical';
  onSave?: (id: string) => void;
  onAddToTrip?: (id: string) => void;
  saved?: boolean;
}

/**
 * Chat-optimized apartment card — compact, horizontal, fits in the chat
 * column (max ~560px). Used inline in the assistant message stream by
 * <EmbeddedListings>. Matches Mindtrip's pattern of photo-right with
 * title+price+rating on the left plus ♥ + ➕ overlay buttons.
 *
 * Save / add-to-trip handlers are wired in Week 2 Tue — no-op today.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Tue.
 */
export function RentalCardInline({
  listing,
  layout = 'horizontal',
  onSave,
  onAddToTrip,
  saved = false,
}: RentalCardInlineProps) {
  const [imgError, setImgError] = useState(false);
  const img = !imgError && listing.images?.[0] ? listing.images[0] : apartmentPlaceholder;

  const price = listing.price_monthly ?? listing.price_daily;
  const priceUnit = listing.price_monthly ? '/mo' : '/night';
  const sourceLabel = getSourceLabel(listing.source_url);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave?.(listing.id);
  };
  const handleAddToTrip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToTrip?.(listing.id);
  };

  return (
    <Link
      to={`/apartments/${listing.id}`}
      className={cn(
        'group relative flex overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-md',
        layout === 'horizontal' ? 'flex-row h-[140px]' : 'flex-col',
      )}
    >
      {/* Content side */}
      <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-semibold leading-tight line-clamp-1">
              {listing.title}
            </h3>
            {listing.verified && (
              <ShieldCheck
                className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5"
                aria-label="Verified listing"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {listing.neighborhood}
            {listing.bedrooms != null && ` · ${listing.bedrooms} BR`}
            {listing.bathrooms != null && ` · ${listing.bathrooms} BA`}
          </p>
          {listing.description && layout === 'vertical' && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {listing.description}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 mt-2">
          <div className="min-w-0">
            {price != null && (
              <div className="text-sm font-semibold">
                ${Number(price).toLocaleString()}
                <span className="text-xs text-muted-foreground font-normal">{priceUnit}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {listing.rating != null && (
                <span className="inline-flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {Number(listing.rating).toFixed(1)}
                </span>
              )}
              {sourceLabel && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  {sourceLabel}
                </Badge>
              )}
            </div>
          </div>
          {listing.source_url && (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Photo side */}
      <div className="relative w-[140px] h-full flex-shrink-0">
        <img
          src={img}
          alt={listing.title}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={handleSave}
            aria-label={saved ? 'Unsave listing' : 'Save listing'}
            className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm backdrop-blur"
          >
            <Heart
              className={cn(
                'w-3.5 h-3.5',
                saved ? 'fill-red-500 text-red-500' : 'text-foreground',
              )}
            />
          </button>
          <button
            type="button"
            onClick={handleAddToTrip}
            aria-label="Add to trip"
            className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm backdrop-blur"
          >
            <Plus className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      </div>
    </Link>
  );
}

/**
 * Map a source URL to a short badge label. Keeps chat-card real estate tight
 * without the full domain.
 */
function getSourceLabel(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('airbnb')) return 'Airbnb';
    if (host.includes('fazwaz')) return 'FazWaz';
    if (host.includes('metrocuadrado')) return 'Metrocuadrado';
    if (host.includes('facebook')) return 'Facebook';
    return host.split('.')[0];
  } catch {
    return null;
  }
}
