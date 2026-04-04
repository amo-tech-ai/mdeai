import { Coffee, MapPin, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FreshnessBadge } from "./FreshnessBadge";
import { cn } from "@/lib/utils";

interface CoffeeCardProps {
  product: {
    id: string;
    title: string;
    handle: string;
    body?: string | null;
    vendor?: string | null;
    // Custom fields (available once added in Gadget)
    roastedAt?: string | null;
    roastLevel?: string | null;
    origin?: string | null;
    tastingNotes?: string[] | null;
    neighborhood?: string | null;
    price?: string;
  };
  isSelected?: boolean;
  onSelect?: () => void;
  onAddToCart?: () => void;
  variant?: "default" | "compact";
}

export function CoffeeCard({
  product,
  isSelected,
  onSelect,
  onAddToCart,
  variant = "default",
}: CoffeeCardProps) {
  const price = product.price
    ? `$${parseFloat(product.price).toLocaleString("es-CO")} COP`
    : null;

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-colors hover:bg-accent/50",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={onSelect}
      >
        <CardContent className="flex gap-3 p-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
            <Coffee className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{product.title}</p>
            {product.vendor && (
              <p className="text-xs text-muted-foreground">{product.vendor}</p>
            )}
            <div className="mt-1 flex items-center gap-2">
              {price && <span className="text-sm font-semibold">{price}</span>}
              <FreshnessBadge roastedAt={product.roastedAt} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      {/* Image placeholder — will use product media once shopifyProductMedia is synced */}
      <div className="relative flex h-48 items-center justify-center bg-muted">
        <Coffee className="h-12 w-12 text-muted-foreground/50" />
        {product.roastedAt && (
          <div className="absolute left-2 top-2">
            <FreshnessBadge roastedAt={product.roastedAt} />
          </div>
        )}
        {product.roastLevel && (
          <Badge variant="secondary" className="absolute right-2 top-2">
            {product.roastLevel}
          </Badge>
        )}
      </div>

      <CardContent className="space-y-2 p-4">
        {/* Title & Vendor */}
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight">
            {product.title}
          </h3>
          {product.vendor && (
            <p className="text-sm text-muted-foreground">{product.vendor}</p>
          )}
        </div>

        {/* Origin & Neighborhood */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {product.origin && <span>{product.origin}</span>}
          {product.neighborhood && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {product.neighborhood}
            </span>
          )}
        </div>

        {/* Tasting Notes */}
        {product.tastingNotes?.length ? (
          <div className="flex flex-wrap gap-1">
            {product.tastingNotes.slice(0, 3).map((note) => (
              <Badge key={note} variant="outline" className="text-xs">
                {note}
              </Badge>
            ))}
          </div>
        ) : null}

        {/* Price & Cart */}
        <div className="flex items-center justify-between pt-1">
          {price && (
            <span className="text-lg font-bold text-primary">{price}</span>
          )}
          {onAddToCart && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
            >
              <ShoppingCart className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
