import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StripeDeepLinkProps {
  latestStripePi: string | null | undefined;
}

function stripeDashboardUrl(piId: string): string {
  const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
  const prefix = pk.startsWith("pk_test_") ? "/test" : "";
  return `https://dashboard.stripe.com${prefix}/payments/${piId}`;
}

export function StripeDeepLink({ latestStripePi }: StripeDeepLinkProps) {
  if (!latestStripePi) return null;
  return (
    <Card data-testid="stripe-deep-link">
      <CardContent className="p-4">
        <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
          <a href={stripeDashboardUrl(latestStripePi)} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Stripe
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
