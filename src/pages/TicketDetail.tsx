import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { ArrowLeft, Calendar, Clock, Ticket } from "lucide-react";
import { format } from "date-fns";
import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { BackToChatBar } from "@/components/chat/BackToChatBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  findStoredTicketOrder,
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

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = storedTicketOrderFromSearchParams(searchParams);
    if (fromUrl) {
      upsertStoredTicketOrder(fromUrl);
    }
  }, [searchParams]);

  const storedOrder = useMemo<StoredTicketOrder | null>(() => {
    const fromUrl = storedTicketOrderFromSearchParams(searchParams);
    if (fromUrl) return fromUrl;

    const orderId = searchParams.get("order");
    if (orderId) return findStoredTicketOrder(orderId) || null;
    return id ? findStoredTicketOrder(id) || null : null;
  }, [id, searchParams]);

  const { data: result, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["ticket-detail", storedOrder?.orderId, storedOrder?.accessToken],
    queryFn: () => {
      if (!storedOrder) throw new Error("No ticket access token found.");
      return fetchAnonymousTicketOrder(storedOrder);
    },
    enabled: !!storedOrder,
  });

  const attendee = result?.payload?.attendees.find((item) => item.id === id);
  const orderMatchesRoute = result?.payload?.order.id === id;
  const visibleAttendee = attendee || (orderMatchesRoute ? result?.payload?.attendees[0] : null);
  const isActiveQr =
    result?.payload?.order.status === "paid" &&
    visibleAttendee?.status === "active" &&
    !!visibleAttendee.qr_token;

  useEffect(() => {
    let mounted = true;
    setQrDataUrl(null);

    if (!isActiveQr || !visibleAttendee?.qr_token) return;

    QRCode.toDataURL(visibleAttendee.qr_token, {
      margin: 2,
      width: 280,
      errorCorrectionLevel: "M",
    })
      .then((dataUrl) => {
        if (mounted) setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error("QR code generation failed:", err);
        if (mounted) setQrDataUrl(null);
      });

    return () => {
      mounted = false;
    };
  }, [isActiveQr, visibleAttendee?.qr_token]);

  return (
    <ThreePanelLayout>
      <div className="p-6">
        <BackToChatBar />
        <div className="mx-auto mt-6 max-w-3xl space-y-6">
          <Button variant="ghost" asChild>
            <Link to="/me/tickets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to tickets
            </Link>
          </Button>

          {isLoading && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading ticket...
              </CardContent>
            </Card>
          )}

          {isError && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle>Failed to load ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Unable to fetch this ticket."}
                </p>
                <Button onClick={() => void refetch()}>Retry</Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && !isError && (!storedOrder || !result?.payload || !visibleAttendee) && (
            <Card>
              <CardHeader>
                <CardTitle>Ticket unavailable</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This ticket link is invalid, expired, unpaid, or not linked to this browser.
                </p>
                <Button asChild>
                  <Link to="/events">Browse events</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {result?.payload && visibleAttendee && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  {result.payload.event.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={isActiveQr ? "secondary" : "outline"}>
                    Order {result.payload.order.status}
                  </Badge>
                  <Badge variant={visibleAttendee.status === "active" ? "secondary" : "outline"}>
                    Ticket {visibleAttendee.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {safeFormatDate(result.payload.event.event_start_time, "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {safeFormatDate(result.payload.event.event_start_time, "h:mm a")}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Attendee</p>
                  <p className="font-medium">
                    {visibleAttendee.full_name || result.payload.order.buyer_name || "Guest"}
                  </p>
                </div>

                {isActiveQr && qrDataUrl ? (
                  <div className="flex justify-center rounded-lg border bg-white p-5">
                    <img src={qrDataUrl} alt="Ticket QR code" className="h-72 w-72" />
                  </div>
                ) : (
                  <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">
                    QR code is only available for paid, active tickets.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ThreePanelLayout>
  );
}
