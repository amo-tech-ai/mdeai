import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Coffee, MapPin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FreshnessBadge } from "@/components/coffee/FreshnessBadge";
import { useCoffeeByHandle } from "@/hooks/useCoffee";
import { useShopifyCart } from "@/hooks/useShopifyCart";
import {
  ThreePanelLayout,
} from "@/components/explore/ThreePanelLayout";

function CoffeeDetailContent() {
  const { handle } = useParams<{ handle: string }>();
  const [{ data: product, fetching, error }] = useCoffeeByHandle(handle || "");
  const { addToCart, loading: cartLoading, goToCheckout, itemCount } =
    useShopifyCart();

  if (fetching) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Coffee className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-display font-bold">Coffee not found</h2>
        <p className="text-muted-foreground mt-2">
          This product may no longer be available.
        </p>
        <Button asChild className="mt-4">
          <Link to="/coffee">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Coffee
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/coffee">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All Coffee
        </Link>
      </Button>

      {/* Hero image placeholder */}
      <div className="relative flex h-72 items-center justify-center rounded-xl bg-muted">
        <Coffee className="h-16 w-16 text-muted-foreground/30" />
        {product.roastedAt && (
          <div className="absolute left-4 top-4">
            <FreshnessBadge
              roastedAt={product.roastedAt as string}
              className="text-sm px-3 py-1"
            />
          </div>
        )}
      </div>

      {/* Title & Vendor */}
      <div>
        <h1 className="text-3xl font-display font-bold">{product.title}</h1>
        {product.vendor && (
          <p className="text-lg text-muted-foreground mt-1">
            by {product.vendor}
          </p>
        )}
      </div>

      {/* Quick info badges */}
      <div className="flex flex-wrap gap-2">
        {product.roastLevel && (
          <Badge variant="secondary">{product.roastLevel} Roast</Badge>
        )}
        {product.origin && <Badge variant="outline">{product.origin}</Badge>}
        {product.processingMethod && (
          <Badge variant="outline">{product.processingMethod}</Badge>
        )}
        {product.neighborhood && (
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {product.neighborhood}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Product Knowledge Graph */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {product.farmName && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Farm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{product.farmName}</p>
            </CardContent>
          </Card>
        )}
        {product.altitude && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Altitude
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{product.altitude}m MASL</p>
            </CardContent>
          </Card>
        )}
        {product.cuppingScore && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Cupping Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{product.cuppingScore}/100</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tasting Notes */}
      {product.tastingNotes?.length ? (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Tasting Notes
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.tastingNotes.map((note: string) => (
              <Badge key={note} variant="secondary" className="text-sm">
                {note}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {/* Description */}
      {product.body && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            About
          </h3>
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: product.body }}
          />
        </div>
      )}

      <Separator />

      {/* Purchase Actions */}
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          disabled={cartLoading}
          onClick={() => {
            // Use first variant ID once variants are synced
            // For now this is a placeholder
          }}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {cartLoading ? "Adding..." : "Add to Cart"}
        </Button>
        {itemCount > 0 && (
          <Button variant="outline" size="lg" onClick={goToCheckout}>
            Checkout ({itemCount})
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CoffeeDetail() {
  return (
    <ThreePanelLayout>
      <CoffeeDetailContent />
    </ThreePanelLayout>
  );
}
