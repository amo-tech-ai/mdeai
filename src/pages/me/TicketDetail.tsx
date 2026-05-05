/**
 * /me/tickets/:id — fullscreen QR view (task 008).
 *
 * Two access paths:
 *   1. Authenticated  → :id is an attendee_id; reads from event_attendees via RLS.
 *   2. Anonymous      → :id is an order_id + ?token=<access_token>; calls
 *                       get_anonymous_order(order_id, token) SECURITY DEFINER RPC.
 *
 * The QR is generated client-side from event_attendees.qr_token using the
 * `qrcode` library (MIT, ~10KB). Dark navy background + white QR for max
 * contrast at door scanning distance.
 */

import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Download,
  MapPin,
  Sun,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  Hourglass,
  Loader2,
} from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketDetailData {
  attendeeId: string;
  attendeeName: string;
  attendeeEmail: string;
  qrToken: string;
  qrUsedAt: string | null;
  attendeeStatus: string;
  tier: { id: string; name: string; price_cents: number; currency: string };
  event: {
    id: string;
    name: string;
    event_start_time: string;
    event_end_time: string | null;
    address: string | null;
    primary_image_url: string | null;
  };
  orderShortId: string;
  orderStatus: string;
}

// ─── Status display ───────────────────────────────────────────────────────────

type VisualStatus = "active" | "used" | "expired" | "refunded" | "pending";

function deriveStatus(data: TicketDetailData): VisualStatus {
  if (data.attendeeStatus === "refunded" || data.orderStatus === "refunded") return "refunded";
  if (data.attendeeStatus === "pending") return "pending";
  if (data.attendeeStatus === "cancelled") return "refunded";
  if (data.qrUsedAt) return "used";
  if (
    data.event.event_end_time &&
    new Date(data.event.event_end_time) < new Date()
  )
    return "expired";
  return "active";
}

const STATUS_LABEL: Record<VisualStatus, { label: string; icon: typeof CheckCircle2; color: string }> =
  {
    active: { label: "Active — Ready to scan", icon: CheckCircle2, color: "text-emerald-400" },
    used: { label: "Used", icon: CheckCircle2, color: "text-gray-400" },
    expired: { label: "Expired", icon: Hourglass, color: "text-amber-400" },
    refunded: { label: "Refunded", icon: XCircle, color: "text-red-400" },
    pending: { label: "Payment pending", icon: Clock, color: "text-blue-400" },
  };

// ─── Calendar download (.ics) ─────────────────────────────────────────────────

function downloadICS(
  eventName: string,
  startISO: string,
  endISO: string | null,
  location: string | null,
) {
  const toICSDate = (iso: string) =>
    iso.replace(/[-:]/g, "").split(".")[0] + "Z";

  const start = toICSDate(startISO);
  const end = endISO ? toICSDate(endISO) : toICSDate(startISO);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mdeai.co//Ticket//EN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${eventName}`,
    location ? `LOCATION:${location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${eventName.replace(/[^a-z0-9]/gi, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── QR image ─────────────────────────────────────────────────────────────────

function QRDisplay({ token }: { token: string }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(token, {
      width: 400,
      margin: 2,
      color: { dark: "#0d0d0d", light: "#ffffff" },
      errorCorrectionLevel: "H",
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [token]);

  if (!dataUrl) {
    return (
      <div className="w-64 h-64 flex items-center justify-center bg-white/5 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Event ticket QR code"
      className="w-64 h-64 rounded-xl"
      data-testid="qr-image"
    />
  );
}

// ─── Brightness boost ─────────────────────────────────────────────────────────

function BrightnessBoostButton() {
  const [boosted, setBoosted] = useState(false);

  const handleBoost = async () => {
    try {
      // Screen Brightness API (Chrome Android)
      const screen = window.screen as unknown as {
        brightness?: { set: (v: number) => Promise<void> };
      };
      await screen.brightness?.set(1.0);
      setBoosted(true);
    } catch {
      // Fallback: show instructions (iOS)
      setBoosted(true);
    }
  };

  return boosted ? (
    <p className="text-xs text-white/50 text-center max-w-xs">
      On iOS: swipe up Control Centre → drag brightness to max.
    </p>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBoost}
      className="text-white/60 hover:text-white hover:bg-white/10"
    >
      <Sun className="w-4 h-4 mr-2" />
      Boost brightness
    </Button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const anonToken = searchParams.get("token");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<TicketDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setErrorMsg("Invalid ticket URL.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const load = async () => {
      try {
        if (anonToken) {
          // Anonymous path: get_anonymous_order(order_id, access_token)
          const { data: rpcData, error: rpcErr } = await supabase.rpc(
            "get_anonymous_order",
            { p_order_id: id, p_access_token: anonToken },
          );

          if (rpcErr || !rpcData) {
            setErrorMsg("Link expired or invalid. Sign in to view your tickets.");
            return;
          }

          const parsed = rpcData as {
            order: {
              id: string;
              short_id: string;
              status: string;
              event_id: string;
            };
            event: {
              id: string;
              name: string;
              event_start_time: string;
              event_end_time: string | null;
              address: string | null;
              primary_image_url: string | null;
            };
            attendees: {
              id: string;
              full_name: string;
              email: string;
              qr_token: string;
              qr_used_at: string | null;
              status: string;
              ticket_id: string;
            }[];
          };

          // Show the first attendee on load for anon orders
          const firstAttendee = parsed.attendees?.[0];
          if (!firstAttendee) {
            setErrorMsg("No tickets found in this order.");
            return;
          }

          // Fetch the tier info
          const { data: tierRow } = await supabase
            .from("event_tickets")
            .select("id, name, price_cents, currency")
            .eq("id", firstAttendee.ticket_id)
            .single();

          setData({
            attendeeId: firstAttendee.id,
            attendeeName: firstAttendee.full_name,
            attendeeEmail: firstAttendee.email,
            qrToken: firstAttendee.qr_token,
            qrUsedAt: firstAttendee.qr_used_at,
            attendeeStatus: firstAttendee.status,
            tier: tierRow ?? { id: "", name: "Ticket", price_cents: 0, currency: "COP" },
            event: parsed.event,
            orderShortId: parsed.order.short_id,
            orderStatus: parsed.order.status,
          });
        } else {
          // Authenticated path: load from event_attendees via RLS
          if (!user) {
            navigate(`/login?next=/me/tickets/${id}`, { replace: true });
            return;
          }

          const { data: attendeeRow, error: aErr } = await supabase
            .from("event_attendees")
            .select(
              `
              id,
              full_name,
              email,
              qr_token,
              qr_used_at,
              status,
              ticket_id,
              order_id,
              event_id,
              event_tickets!ticket_id(id, name, price_cents, currency),
              event_orders!order_id(short_id, status),
              events!event_id(id, name, event_start_time, event_end_time, address, primary_image_url)
            `,
            )
            .eq("id", id)
            .single();

          if (aErr || !attendeeRow) {
            setErrorMsg("Ticket not found or you don't have access.");
            return;
          }

          const tier = attendeeRow.event_tickets as unknown as {
            id: string;
            name: string;
            price_cents: number;
            currency: string;
          };
          const order = attendeeRow.event_orders as unknown as {
            short_id: string;
            status: string;
          };
          const event = attendeeRow.events as unknown as {
            id: string;
            name: string;
            event_start_time: string;
            event_end_time: string | null;
            address: string | null;
            primary_image_url: string | null;
          };

          setData({
            attendeeId: attendeeRow.id,
            attendeeName: attendeeRow.full_name,
            attendeeEmail: attendeeRow.email,
            qrToken: attendeeRow.qr_token,
            qrUsedAt: attendeeRow.qr_used_at,
            attendeeStatus: attendeeRow.status,
            tier,
            event,
            orderShortId: order.short_id,
            orderStatus: order.status,
          });
        }
      } catch (err) {
        setErrorMsg((err as Error).message ?? "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, anonToken, user, navigate]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  // ── Error ──
  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <XCircle className="w-12 h-12 text-red-400" />
        <div>
          <p className="text-white font-semibold text-lg">{errorMsg ?? "Ticket not found"}</p>
          {!user && (
            <p className="text-white/60 text-sm mt-2">
              Have an account?{" "}
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
        <Button
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
          onClick={() => navigate("/me/tickets")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to tickets
        </Button>
      </div>
    );
  }

  const status = deriveStatus(data);
  const statusInfo = STATUS_LABEL[status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/me/tickets")}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>
        <div className="flex items-center gap-1.5 text-white/40 text-xs">
          <Ticket className="w-3.5 h-3.5" />
          <span className="font-mono">{data.orderShortId}</span>
        </div>
      </div>

      {/* Main content — centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 max-w-sm mx-auto w-full">
        {/* Event name + date */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-display font-bold text-white leading-tight">
            {data.event.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-white/60 text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(data.event.event_start_time), "EEE, MMM d · h:mm a")}
            </span>
            {data.event.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="max-w-[160px] truncate">{data.event.address}</span>
              </span>
            )}
          </div>
        </div>

        {/* QR code */}
        <div className="relative">
          <div
            className={cn(
              "p-4 rounded-2xl",
              status === "active" ? "bg-white" : "bg-white/60 grayscale",
            )}
          >
            <QRDisplay token={data.qrToken} />
          </div>
          {status !== "active" && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
              <Badge
                variant="secondary"
                className="bg-black/80 text-white border-white/20 text-sm px-4 py-1"
              >
                {statusInfo.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Attendee info */}
        <div className="text-center space-y-0.5">
          <p className="text-white font-semibold">{data.attendeeName}</p>
          <p className="text-white/50 text-sm">{data.tier?.name ?? "Ticket"}</p>
        </div>

        {/* Status indicator */}
        <div className={cn("flex items-center gap-2 text-sm font-medium", statusInfo.color)}>
          <StatusIcon className="w-4 h-4" />
          {statusInfo.label}
          {status === "used" && data.qrUsedAt && (
            <span className="text-white/40 font-normal ml-1">
              · {format(new Date(data.qrUsedAt), "MMM d, h:mm a")}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 w-full">
          <BrightnessBoostButton />
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadICS(
                data.event.name,
                data.event.event_start_time,
                data.event.event_end_time,
                data.event.address,
              )
            }
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Add to calendar
          </Button>
        </div>
      </div>
    </div>
  );
}
