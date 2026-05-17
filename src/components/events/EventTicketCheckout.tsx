import { useMemo, useState } from "react";
import { AlertCircle, Loader2, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Event } from "@/types/event";
import {
  EventTicketTier,
  formatTicketPriceCents,
  getAvailableTicketQuantity,
} from "@/lib/event-ticket-tier";
import { upsertStoredTicketOrder } from "@/lib/event-ticket-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface TicketCheckoutResponse {
  success: boolean;
  data?: {
    stripe_session_url: string;
    order_id: string;
    short_id: string;
    access_token: string;
  };
  error?: {
    message?: string;
    code?: string;
  };
}

interface EventTicketCheckoutProps {
  event: Event;
  tiers: EventTicketTier[];
}

export function EventTicketCheckout({ event, tiers }: EventTicketCheckoutProps) {
  const firstAvailableTier = useMemo(
    () => tiers.find((tier) => getAvailableTicketQuantity(tier) > 0) || tiers[0],
    [tiers],
  );
  const [selectedTierId, setSelectedTierId] = useState(firstAvailableTier?.id || "");
  const selectedTier = tiers.find((tier) => tier.id === selectedTierId) || firstAvailableTier;
  const [quantity, setQuantity] = useState(selectedTier?.min_per_order || 1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  if (!selectedTier) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="h-5 w-5" />
            Tickets unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tickets are not currently available for this event.
          </p>
        </CardContent>
      </Card>
    );
  }

  const availableQuantity = getAvailableTicketQuantity(selectedTier);
  const canPurchase = availableQuantity >= selectedTier.min_per_order;
  const maxQuantity = canPurchase
    ? Math.min(selectedTier.max_per_order, availableQuantity)
    : 0;
  const totalCents = selectedTier.price_cents * quantity;

  const handleTierChange = (tierId: string) => {
    const nextTier = tiers.find((tier) => tier.id === tierId);
    setSelectedTierId(tierId);
    setQuantity(nextTier?.min_per_order || 1);
    setError(null);
  };

  const handleCreateCheckout = async () => {
    setError(null);

    if (!buyerName.trim() || !buyerEmail.trim()) {
      setError("Enter the buyer name and email before checkout.");
      return;
    }
    if (!canPurchase) {
      setError("Not enough tickets are available for the minimum order.");
      return;
    }

    setIsCreatingCheckout(true);
    try {
      const origin = window.location.origin;
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const attendees = Array.from({ length: quantity }, (_, index) => ({
        email: buyerEmail.trim(),
        full_name: index === 0 ? buyerName.trim() : `${buyerName.trim()} Guest ${index + 1}`,
      }));

      const { data, error: invokeError } = await supabase.functions.invoke<TicketCheckoutResponse>(
        "ticket-checkout",
        {
          body: {
            event_id: event.id,
            ticket_id: selectedTier.id,
            quantity,
            buyer_email: buyerEmail.trim(),
            buyer_name: buyerName.trim(),
            attendees,
            idempotency_key: idempotencyKey,
            return_url_success: `${origin}/me/tickets?checkout=success`,
            return_url_cancel: `${origin}/events/${event.id}?checkout=cancelled`,
          },
        },
      );

      if (invokeError) throw new Error(invokeError.message);
      if (!data?.success || !data.data?.stripe_session_url) {
        throw new Error(data?.error?.message || "Checkout could not be created.");
      }

      upsertStoredTicketOrder({
        orderId: data.data.order_id,
        accessToken: data.data.access_token,
        eventId: event.id,
        eventName: event.name,
        shortId: data.data.short_id,
        createdAt: new Date().toISOString(),
      });

      window.location.assign(data.data.stripe_session_url);
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to create checkout. Try again.";
      setError(message);
      setIsCreatingCheckout(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ticket className="h-5 w-5" />
          Buy tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {tiers.map((tier) => {
            const tierAvailable = getAvailableTicketQuantity(tier);
            const selected = tier.id === selectedTier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => handleTierChange(tier.id)}
                className={`w-full rounded-md border p-4 text-left transition ${
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    {tier.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
                    )}
                  </div>
                  <Badge variant={tierAvailable > 0 ? "secondary" : "destructive"}>
                    {tierAvailable > 0 ? `${tierAvailable} left` : "Sold out"}
                  </Badge>
                </div>
                <p className="mt-3 font-semibold">
                  {formatTicketPriceCents(tier.price_cents, tier.currency)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="buyer-name">Buyer name</Label>
            <Input
              id="buyer-name"
              value={buyerName}
              onChange={(event) => setBuyerName(event.target.value)}
              autoComplete="name"
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyer-email">Email</Label>
            <Input
              id="buyer-email"
              value={buyerEmail}
              onChange={(event) => setBuyerEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              type="email"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="ticket-quantity">Quantity</Label>
            <Input
              id="ticket-quantity"
              min={selectedTier.min_per_order}
              max={maxQuantity || selectedTier.min_per_order}
              type="number"
              value={quantity}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!canPurchase) return;
                setQuantity(Math.max(selectedTier.min_per_order, Math.min(maxQuantity, next || 1)));
              }}
            />
          </div>
          <div className="rounded-md bg-muted px-4 py-3">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">
              {formatTicketPriceCents(totalCents, selectedTier.currency)}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          className="w-full"
          disabled={isCreatingCheckout || !canPurchase}
          onClick={handleCreateCheckout}
        >
          {isCreatingCheckout ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating checkout...
            </>
          ) : (
            <>
              <Ticket className="mr-2 h-4 w-4" />
              {canPurchase ? "Buy Ticket" : "Tickets unavailable"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
