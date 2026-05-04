import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Ticket,
  Calendar,
  MapPin,
  ChevronRight,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  ArrowRight,
} from "lucide-react";
import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  useMyTickets,
  getTicketDisplayStatus,
  type MyTicket,
  type TicketDisplayStatus,
} from "@/hooks/useMyTickets";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import eventPlaceholder from "@/assets/event-1.jpg";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TicketDisplayStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  used: {
    label: "Used",
    icon: CheckCircle2,
    className: "bg-muted text-muted-foreground",
  },
  expired: {
    label: "Expired",
    icon: Hourglass,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  refunded: {
    label: "Refunded",
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
};

function StatusBadge({ status }: { status: TicketDisplayStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
        config.className,
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ─── Single ticket row ─────────────────────────────────────────────────────────

function TicketRow({ ticket }: { ticket: MyTicket }) {
  const navigate = useNavigate();
  const status = getTicketDisplayStatus(ticket);

  return (
    <button
      type="button"
      onClick={() => navigate(`/me/tickets/${ticket.attendeeId}`)}
      className="w-full text-left group"
      data-testid={`ticket-row-${ticket.attendeeId}`}
    >
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted">
              <img
                src={ticket.event.primary_image_url || eventPlaceholder}
                alt={ticket.event.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-semibold truncate text-sm">{ticket.event.name}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(ticket.event.event_start_time), "MMM d, yyyy · h:mm a")}
                </span>
                {ticket.event.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{ticket.event.address}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <Badge variant="secondary" className="text-xs py-0">
                  {ticket.tier?.name ?? "Ticket"}
                </Badge>
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
              {status === "active" && <QrCode className="w-4 h-4" />}
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function TicketSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyTicketsState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Ticket className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        When you buy tickets to events in Medellín, they'll appear here with your QR codes.
      </p>
      <Button asChild>
        <Link to="/events">
          Browse upcoming events
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyTickets() {
  const { user } = useAuth();
  const { data: tickets, isLoading, error } = useMyTickets();

  const { upcoming, past } = useMemo(() => {
    if (!tickets) return { upcoming: [] as MyTicket[], past: [] as MyTicket[] };
    const up: MyTicket[] = [];
    const pa: MyTicket[] = [];
    for (const t of tickets) {
      if (isPast(new Date(t.event.event_start_time))) {
        pa.push(t);
      } else {
        up.push(t);
      }
    }
    up.sort(
      (a, b) =>
        new Date(a.event.event_start_time).getTime() -
        new Date(b.event.event_start_time).getTime(),
    );
    return { upcoming: up, past: pa };
  }, [tickets]);

  const activeCount = useMemo(
    () => tickets?.filter((t) => getTicketDisplayStatus(t) === "active").length ?? 0,
    [tickets],
  );

  const uniqueEvents = useMemo(
    () => new Set(tickets?.map((t) => t.event.id)).size,
    [tickets],
  );

  const nextEvent = upcoming[0] ?? null;

  if (!user) {
    return (
      <ThreePanelLayout>
        <div className="p-6 text-center py-16">
          <p className="text-muted-foreground">
            Please{" "}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              sign in
            </Link>{" "}
            to view your tickets.
          </p>
        </div>
      </ThreePanelLayout>
    );
  }

  return (
    <ThreePanelLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold">My Tickets</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your event tickets with QR codes for door entry
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main — ticket list */}
          <div className="lg:col-span-2 space-y-1">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                {[0, 1, 2].map((i) => (
                  <TicketSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                <p className="font-medium">Failed to load tickets</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(error as Error).message}
                </p>
              </div>
            ) : !tickets?.length ? (
              <EmptyTicketsState />
            ) : (
              <div className="space-y-8">
                {upcoming.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                      Upcoming ({upcoming.length})
                    </h2>
                    <div className="space-y-2">
                      {upcoming.map((t) => (
                        <TicketRow key={t.attendeeId} ticket={t} />
                      ))}
                    </div>
                  </section>
                )}

                {past.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                      Past ({past.length})
                    </h2>
                    <div className="space-y-2">
                      {past.map((t) => (
                        <TicketRow key={t.attendeeId} ticket={t} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar — stats + quick actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Your stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </>
                ) : (
                  <>
                    <p className="text-sm">
                      <span className="font-semibold">{tickets?.length ?? 0}</span>{" "}
                      <span className="text-muted-foreground">
                        {tickets?.length === 1 ? "ticket" : "tickets"} across{" "}
                        {uniqueEvents} {uniqueEvents === 1 ? "event" : "events"}
                      </span>
                    </p>
                    {nextEvent && (
                      <p className="text-sm text-muted-foreground">
                        Next:{" "}
                        <span className="font-medium text-foreground">
                          {format(
                            new Date(nextEvent.event.event_start_time),
                            "EEE, MMM d · h:mm a",
                          )}
                        </span>
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Quick actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/events">
                    <Calendar className="w-4 h-4 mr-2" />
                    Browse events
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/saved">
                    <Ticket className="w-4 h-4 mr-2" />
                    Saved places
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {activeCount > 0 && (
              <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      {activeCount} active {activeCount === 1 ? "ticket" : "tickets"} ready to
                      scan
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ThreePanelLayout>
  );
}
