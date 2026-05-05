import { Link } from "react-router-dom";
import { ImageOff, ExternalLink, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { OwnListingRow } from "@/hooks/host/useListings";

/**
 * ListingCard — one row on the host dashboard (D7).
 *
 * Status precedence (since both `moderation_status` and `status` carry signal):
 *   moderation_status='rejected'                                    → "Rejected"  (red)
 *   moderation_status='archived'                                    → "Archived"  (gray)
 *   moderation_status='pending'                                     → "In review" (amber)
 *   moderation_status='approved' AND status='active'                → "Live"      (green)
 *   moderation_status='approved' AND status='inactive'              → "Hidden"    (gray)
 *   moderation_status='approved' AND status='booked'                → "Booked"    (blue)
 *   else                                                            → "Draft"     (muted)
 *
 * Lead count comes in D9 — for D7 we leave a "—" placeholder so the
 * column structure is final and D9 just fills in numbers.
 */

interface ListingCardProps {
  listing: OwnListingRow;
}

interface StatusPill {
  label: string;
  variant: "live" | "review" | "rejected" | "archived" | "muted" | "booked";
  Icon: typeof CheckCircle2;
  hint?: string;
}

function deriveStatus(listing: OwnListingRow): StatusPill {
  if (listing.moderation_status === "rejected") {
    return { label: "Rejected", variant: "rejected", Icon: AlertCircle, hint: listing.rejection_reason ?? undefined };
  }
  if (listing.moderation_status === "archived") {
    return { label: "Archived", variant: "archived", Icon: ImageOff };
  }
  if (listing.moderation_status === "pending") {
    return { label: "In review", variant: "review", Icon: Clock, hint: "Founder reviews flagged listings within 24 hours" };
  }
  if (listing.moderation_status === "approved" && listing.status === "active") {
    return { label: "Live", variant: "live", Icon: CheckCircle2 };
  }
  if (listing.moderation_status === "approved" && listing.status === "booked") {
    return { label: "Booked", variant: "booked", Icon: CheckCircle2 };
  }
  if (listing.moderation_status === "approved") {
    return { label: "Hidden", variant: "muted", Icon: ImageOff };
  }
  return { label: "Draft", variant: "muted", Icon: Clock };
}

const VARIANT_CLASSES: Record<StatusPill["variant"], string> = {
  live: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  review: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  archived: "bg-muted text-muted-foreground border-border",
  muted: "bg-muted text-muted-foreground border-border",
  booked: "bg-blue-500/10 text-blue-700 border-blue-500/30",
};

function formatPrice(amount: number, currency: "COP" | "USD"): string {
  if (currency === "COP") return `$${amount.toLocaleString("es-CO")} COP`;
  return `$${amount.toLocaleString("en-US")} USD`;
}

export function ListingCard({ listing }: ListingCardProps) {
  const status = deriveStatus(listing);
  const cover = listing.images?.[0];
  const isPubliclyVisible =
    listing.moderation_status === "approved" && listing.status === "active";

  return (
    <article
      className="rounded-xl border border-border bg-card overflow-hidden flex flex-col sm:flex-row"
      data-testid="host-listing-card"
      data-listing-id={listing.id}
    >
      <div className="sm:w-48 sm:shrink-0 aspect-video sm:aspect-auto bg-muted relative">
        {cover ? (
          <img
            src={cover}
            alt={`Cover photo for ${listing.title}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageOff className="w-8 h-8" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight">
            {listing.title}
          </h3>
          <Badge
            className={cn("inline-flex items-center gap-1 border", VARIANT_CLASSES[status.variant])}
            title={status.hint}
            data-testid="host-listing-status"
          >
            <status.Icon className="w-3 h-3" aria-hidden="true" />
            {status.label}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {listing.neighborhood}, {listing.city}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
          <span className="font-semibold">
            {formatPrice(Number(listing.price_monthly), listing.currency)} / mo
          </span>
          <span className="text-muted-foreground">
            {listing.bedrooms} BR · {listing.bathrooms} BA
          </span>
          <span className="text-muted-foreground" data-testid="host-listing-leads">
            — leads
          </span>
        </div>

        {status.variant === "rejected" && listing.rejection_reason ? (
          <p className="text-xs text-destructive mt-1" role="alert">
            {listing.rejection_reason}
          </p>
        ) : null}

        <div className="mt-auto pt-2 flex flex-wrap gap-3 text-sm">
          {isPubliclyVisible ? (
            <Link
              to={`/apartments/${listing.id}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
              data-testid="host-listing-view-public"
            >
              View public page <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </Link>
          ) : null}
          <span
            className="text-muted-foreground/70 cursor-not-allowed"
            title="Edit lands D17"
            data-testid="host-listing-edit"
          >
            Edit (soon)
          </span>
        </div>
      </div>
    </article>
  );
}
