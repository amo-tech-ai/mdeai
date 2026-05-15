import { useState } from 'react';
import { ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * React adaptation of grounding-lite-mcp-sample-app/components/source-card.ts
 * (Lit Element SourceCard + SourcesContainer → two React components).
 *
 * Used below grounded chat messages to show Gemini citation sources
 * (groundingChunks[].maps.{uri, title, placeId} from MASTRA-049).
 */

export interface GroundingSource {
  uri: string;
  title?: string;
  placeId?: string;
}

// --- SourceCard ---

interface SourceCardProps {
  source: GroundingSource;
}

function faviconUrl(uri: string): string {
  try {
    const { hostname } = new URL(uri);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
  } catch {
    return '';
  }
}

function publisherLabel(uri: string): string {
  try {
    return new URL(uri).hostname.replace('www.', '');
  } catch {
    return uri;
  }
}

function SourceCard({ source }: SourceCardProps) {
  const isGoogleMaps = source.uri.includes('google.com/maps');
  const favicon = isGoogleMaps ? null : faviconUrl(source.uri);
  const publisher = isGoogleMaps ? 'Google Maps' : publisherLabel(source.uri);
  const title = isGoogleMaps ? 'View on Google Maps' : (source.title || publisherLabel(source.uri));

  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex flex-col justify-between flex-shrink-0',
        'w-48 h-24 rounded-2xl border border-border bg-muted/40',
        'p-3 no-underline text-foreground transition-colors',
        'hover:bg-muted/70',
      )}
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="w-4 h-4 rounded-full object-cover flex-shrink-0"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <Globe className="w-4 h-4 flex-shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className="text-[11px] text-muted-foreground font-medium truncate">{publisher}</span>
      </div>
      <h3 className="text-xs font-semibold text-foreground line-clamp-2 mt-1 leading-tight">
        {title}
      </h3>
    </a>
  );
}

// --- SourcesContainer ---

export interface GroundingSourceCardProps {
  sources: GroundingSource[];
  className?: string;
}

/**
 * Collapsible "Sources (N)" panel with horizontal-scroll source cards.
 * Mirrors SourcesContainer from grounding-lite-mcp-sample-app.
 */
export function GroundingSourceCard({ sources, className }: GroundingSourceCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className={cn('mt-2', className)}>
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium',
          'bg-muted/40 hover:bg-muted/70 text-muted-foreground',
          'px-3 py-1.5 rounded-lg border border-border transition-colors',
        )}
        aria-expanded={expanded}
      >
        <span>Sources ({sources.length})</span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5" aria-hidden />
          : <ChevronDown className="w-3.5 h-3.5" aria-hidden />
        }
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          expanded ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0',
        )}
      >
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none">
          {sources.map((src) => (
            <SourceCard key={src.uri} source={src} />
          ))}
        </div>
      </div>
    </div>
  );
}
