import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Ticket } from "lucide-react";
import { format } from "date-fns";
import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { BackToChatBar } from "@/components/chat/BackToChatBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  readStoredTicketOrders,
  storedTicketOrderFromSearchParams,
  upsertStoredTicketOrder,
} from "@/lib/event-ticket-storage";
import { fetchAnonymousTicketOrder } from "@/lib/ticket-orders";
import type { StoredTicketOrder } from "@/lib/event-ticket-storage";

function safeFormatDate(raw: string, pattern: string) {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "TBD";
  return format(parsed, pattern);
}

export default function MyTickets() {
  const [searchParams] = useSearchParams();
  const [storedOrders, setStoredOrders] = useState<StoredTicketOrder[]>([]);

  useEffect(() => {
    const fromUrl = storedTicketOrderFromSearchParams(searchParams);
    if (fromUrl) upsertStoredTicketOrder(fromUrl);
    setStoredOrders(readStoredTicketOrders());
  }, [searchParams]);

  const orderKey = useMemo(
    () => storedOrders.map((order) => `${order.orderId}:${order.accessToken}`).join("|"),
    [storedOrders],
  );

  const { data: ticketOrders = [], isLoading, error, refetch } = useQuery({
    queryKey: ["my-ticket-orders", orderKey],
    queryFn: () => Promise.all(storedOrders.map(fetchAnonymousTicketOrder)),
    enabled: storedOrders.length > 0,
  });

  const checkoutSucceeded = searchParams.get("checkout") === "success";

  return (
    <ThreePanelLayout>
      <div className="p-6">
        <BackToChatBar />
        <div className="mx-auto mt-6 max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-display font-bold">My Tickets</h1>
            <p className="mt-2 text-muted-foreground">
              Paid event tickets linked to this browser or secure ticket email link.
            </p>
          </div>

          {checkoutSucceeded && (
            <Card className="border-green-500/40 bg-green-500/10">
              <CardContent className="pt-6">
                <p className="font-medium text-green-700 dark:text-green-300">
                  Checkout returned successfully. Paid tickets appear after the Stripe webhook
                  finalizes the order.
                </p>
              </CardContent>
            </Card>
          )}

          {storedOrders.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No tickets found</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Buy a ticket from an event page or open the secure link from your ticket email.
                </p>
                <Button asChild>
                  <Link to="/events">Browse events</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle>Failed to load tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Unable to fetch your tickets. Please try again.
                </p>
                <Button onClick={() => void refetch()}>Retry</Button>
              </CardContent>
            </Card>
          )}

          {isLoading && storedOrders.length > 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading tickets...
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {ticketOrders.map(({ stored, payload, error }) => {
              if (!payload) {
                return (
                  <Card key={stored.orderId}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Ticket className="h-5 w-5" />
                        {stored.eventName || "Ticket order"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Badge variant="secondary">Processing</Badge>
                      <p className="text-sm text-muted-foreground">
                        {error ||
                          "This order is not paid yet or the payment webhook has not finalized it."}
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return payload.attendees.map((attendee) => (
                <Card key={attendee.id}>
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{payload.event.name}</h2>
                        <Badge variant={attendee.status === "active" ? "secondary" : "outline"}>
                          {attendee.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {safeFormatDate(payload.event.event_start_time, "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {safeFormatDate(payload.event.event_start_time, "h:mm a")}
                        </span>
                      </div>
                      {attendee.full_name && (
                        <p className="text-sm text-muted-foreground">{attendee.full_name}</p>
                      )}
                    </div>
                    <Button asChild>
                      <Link
                        to={`/me/tickets/${attendee.id}?order=${stored.orderId}`}
                      >
                        Open QR
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ));
            })}
          </div>
        </div>
      </div>
    </ThreePanelLayout>
  );
}
