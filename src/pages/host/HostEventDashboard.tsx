/**
 * /host/event/:id — organizer dashboard (task 003).
 *
 * 3-panel layout per CLAUDE.md:
 *   - Left:  event card (status, address, public URL, edit)
 *   - Main:  4 KPI cards + tier breakdown + attendees table
 *   - Right: staff-link panel + recent activity + share + Stripe deep-link
 *
 * Reads via the `event_dashboard_summary(p_event_id)` RPC; updates live via
 * 3 postgres_changes channels (event_orders, event_attendees, event_check_ins).
 * Non-organizers get a friendly 403 page (RPC raises NOT_ORGANIZER).
 */

import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Copy,
  Edit3,
  ExternalLink,
  Loader2,
  Share2,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HostShell } from "@/components/host/layout/HostShell";
import { RoleProtectedRoute } from "@/components/host/layout/RoleProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { useEventDashboard, type EventDashboardSummary } from "@/hooks/host/useEventDashboard";
import { KpiCard } from "@/components/host/event-dashboard/KpiCard";
import { TierTable } from "@/components/host/event-dashboard/TierTable";
import { AttendeeTable } from "@/components/host/event-dashboard/AttendeeTable";
import { RecentActivityStrip } from "@/components/host/event-dashboard/RecentActivityStrip";
import { StaffLinkPanel } from "@/components/host/event-dashboard/StaffLinkPanel";
import { StripeDeepLink } from "@/components/host/event-dashboard/StripeDeepLink";

const PUBLIC_URL_BASE =
  typeof window !== "undefined" ? window.location.origin : "https://mdeai.co";

function formatCop(cents: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "TBA";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateFmt.format(s)} · ${timeFmt.format(s)}${
    e ? ` → ${timeFmt.format(e)}` : ""
  }`;
}

function StatusBadge({ status }: { status: string }) {
  const variant: Record<string, string> = {
    draft: "bg-amber-100 text-amber-800 ring-amber-300",
    published: "bg-emerald-100 text-emerald-800 ring-emerald-300",
    live: "bg-sky-100 text-sky-800 ring-sky-300",
    closed: "bg-slate-100 text-slate-700 ring-slate-300",
  };
  const cls = variant[status] ?? variant.closed;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
      data-testid="event-status-badge"
    >
      ● {status.toUpperCase()}
    </span>
  );
}

export default function HostEventDashboard() {
  return (
    <RoleProtectedRoute>
      <HostShell>
        <DashboardContent />
      </HostShell>
    </RoleProtectedRoute>
  );
}

function DashboardContent() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, forbidden, refetch } = useEventDashboard(id);

  if (forbidden) return <ForbiddenState />;
  if (isLoading) return <LoadingState />;
  if (error)     return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data)     return <EmptyState />;

  return <DashboardLayout data={data} onMutated={refetch} />;
}

interface DashboardLayoutProps {
  data: EventDashboardSummary;
  onMutated: () => void;
}

function DashboardLayout({ data, onMutated }: DashboardLayoutProps) {
  const { event, kpis, revenue_cents, tiers, recent_check_ins, latest_stripe_pi } = data;
  const { toast } = useToast();
  const publicUrl = `${PUBLIC_URL_BASE}/events/${event.id}`;

  const eventEnded = useMemo(() => {
    if (!event.event_end_time) return false;
    return new Date(event.event_end_time).getTime() < Date.now();
  }, [event.event_end_time]);

  async function copyPublicUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({ title: "Public URL copied" });
    } catch {
      toast({ title: "Clipboard unavailable", variant: "destructive" });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <Link
          to="/host/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to events
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{event.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge status={event.status} />
              <span>{formatDateRange(event.event_start_time, event.event_end_time)}</span>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" data-testid="edit-event">
            <Link to={`/host/event/new?eventId=${event.id}`}>
              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit event
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT — Event card */}
        <aside className="lg:col-span-3" aria-label="Event summary">
          <Card>
            <CardContent className="space-y-3 p-5">
              {event.address ? (
                <p className="text-sm text-muted-foreground">📍 {event.address}</p>
              ) : null}
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Public URL
                </p>
                <div className="mt-1 flex items-start gap-2">
                  <p className="flex-1 truncate text-xs font-mono">{publicUrl}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyPublicUrl}
                    aria-label="Copy public URL"
                    data-testid="copy-public-url"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="mt-1 -ml-2 h-7 px-2 text-xs"
                >
                  <a href={publicUrl} target="_blank" rel="noreferrer">
                    Open in new tab <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* MAIN — KPIs + tiers + attendees */}
        <main className="lg:col-span-6 space-y-6" aria-label="KPIs and attendees">
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
            data-testid="kpi-grid"
          >
            <KpiCard
              label="Tickets sold"
              value={kpis.tickets_sold}
              icon={<Ticket className="h-4 w-4" />}
              data-testid="kpi-tickets-sold"
            />
            <KpiCard
              label="Revenue (COP)"
              value={formatCop(revenue_cents)}
              icon={<TrendingUp className="h-4 w-4" />}
              data-testid="kpi-revenue"
            />
            <KpiCard
              label="Checked in"
              value={kpis.checked_in}
              icon={<Users className="h-4 w-4" />}
              data-testid="kpi-checked-in"
            />
            <KpiCard
              label="No-shows"
              value={eventEnded ? kpis.no_shows : "—"}
              hint={eventEnded ? undefined : "After event ends"}
              data-testid="kpi-no-shows"
            />
          </div>

          <TierTable tiers={tiers} />

          <AttendeeTable eventId={event.id} eventName={event.name} />
        </main>

        {/* RIGHT — Staff link + activity + share */}
        <aside className="lg:col-span-3 space-y-6" aria-label="Staff link and share">
          <StaffLinkPanel
            eventId={event.id}
            staffLinkVersion={event.staff_link_version}
            onRevoked={onMutated}
          />
          <RecentActivityStrip checkIns={recent_check_ins} />
          <StripeDeepLink latestStripePi={latest_stripe_pi} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Share2 className="h-4 w-4" /> Share event
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
                data-testid="share-whatsapp"
              >
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${event.name} — ${publicUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={copyPublicUrl}
              >
                Copy URL
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 4 states (per `.claude/rules/style-guide.md`)
// --------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center" role="status">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">Loading event dashboard…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <p className="text-muted-foreground">Event not found.</p>
      <Button asChild variant="link" className="mt-2">
        <Link to="/host/dashboard">Back to your events</Link>
      </Button>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => unknown }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center" data-testid="error-state">
      <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
      <p className="mt-3 text-sm font-medium">Couldn't load this event</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      <Button onClick={() => onRetry()} variant="outline" size="sm" className="mt-4">
        Try again
      </Button>
    </div>
  );
}

function ForbiddenState() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center" data-testid="forbidden-state">
      <Badge variant="destructive">403</Badge>
      <h2 className="mt-3 font-display text-xl">Not your event</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Only the event organizer can view this dashboard.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link to="/host/dashboard">Back to your events</Link>
      </Button>
    </div>
  );
}
