import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Inbox,
  CheckCheck,
  Archive,
  Loader2,
  AlertCircle,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HostShell } from "@/components/host/layout/HostShell";
import { RoleProtectedRoute } from "@/components/host/layout/RoleProtectedRoute";
import { LeadStatusActions } from "@/components/host/leads/LeadStatusActions";
import { WhatsAppReplyButton } from "@/components/host/leads/WhatsAppReplyButton";
import { useLeadDetail } from "@/hooks/host/useLeadDetail";
import {
  useMarkReplied,
} from "@/hooks/host/useLeadActions";
import { cn } from "@/lib/utils";
import type {
  InboxLeadRow,
  LeadStatus,
} from "@/hooks/host/useLeads";

/**
 * /host/leads/:id — single-lead detail page (D10).
 *
 * Layout:
 *   Header: Back link + Status pill
 *   Hero:   Renter name + apartment context + relative time
 *   Body:   Full raw_message (renter's note)
 *   Side:   Structured profile (move-when, channel, contact)
 *   Footer: WhatsApp reply button + LeadStatusActions
 *
 * Reply auto-marks: when the user clicks the WA button, we fire
 * markReplied. This is intentional optimism — we can't observe the
 * actual WA send, but the click is strong intent. They can still
 * un-do via Reopen if they didn't actually reply.
 */

export default function HostLeadDetail() {
  return (
    <RoleProtectedRoute>
      <HostShell>
        <LeadDetailContent />
      </HostShell>
    </RoleProtectedRoute>
  );
}

function LeadDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lead, isLoading, error, refetch } = useLeadDetail(id);
  const markReplied = useMarkReplied();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <button
        type="button"
        onClick={() => navigate("/host/leads")}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        data-testid="lead-detail-back"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al inbox
      </button>

      {isLoading ? <DetailLoading /> : null}
      {error ? <DetailError onRetry={refetch} /> : null}
      {!isLoading && !error && !lead ? <DetailNotFound /> : null}
      {!isLoading && !error && lead ? (
        <DetailBody
          lead={lead}
          onReplyClick={() => {
            // Auto-mark as replied on the click (optimistic). markReplied
            // is idempotent — if already replied this is a no-op UPDATE.
            markReplied.mutate({
              leadId: lead.id,
              fromStatus: lead.status,
              hadReply: !!lead.first_reply_at,
            });
          }}
        />
      ) : null}
    </div>
  );
}

function DetailBody({
  lead,
  onReplyClick,
}: {
  lead: InboxLeadRow;
  onReplyClick: () => void;
}) {
  const renter = lead.renter_name ?? "Anonymous";
  const apartmentTitle = lead.apartment?.title ?? "(unknown listing)";
  const apartmentNeighborhood = lead.apartment?.neighborhood;
  const moveWhen = lead.structured_profile?.move_when;

  return (
    <article className="space-y-6" data-testid="lead-detail">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-primary uppercase tracking-wider">
            Lead
          </p>
          <StatusPill status={lead.status} />
        </div>
        <h1
          className="font-display text-3xl sm:text-4xl font-bold text-foreground"
          data-testid="lead-detail-renter"
        >
          {renter}
        </h1>
        <p
          className="text-muted-foreground"
          data-testid="lead-detail-apartment"
        >
          consulta sobre <strong>{apartmentTitle}</strong>
          {apartmentNeighborhood ? ` (${apartmentNeighborhood})` : null}
          {" · "}
          <span title={lead.created_at}>{relativeTime(lead.created_at)}</span>
        </p>
      </header>

      <section
        className="rounded-xl border border-border bg-card p-5"
        aria-labelledby="message-heading"
      >
        <h2
          id="message-heading"
          className="text-sm font-semibold text-muted-foreground mb-2"
        >
          Mensaje
        </h2>
        <p
          className="text-foreground whitespace-pre-wrap"
          data-testid="lead-detail-message"
        >
          {lead.raw_message}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <DetailFact
          icon={MessageCircle}
          label="Canal"
          value={
            { form: "Formulario web", chat: "Chat AI", whatsapp: "WhatsApp" }[
              lead.channel
            ] ?? lead.channel
          }
        />
        {moveWhen ? (
          <DetailFact
            icon={Clock}
            label="Quiere mudarse"
            value={
              { now: "Ahora (próximas semanas)", soon: "Pronto (1-3 meses)", later: "Más adelante" }[
                moveWhen as "now" | "soon" | "later"
              ]
            }
          />
        ) : null}
        {lead.renter_phone_e164 ? (
          <DetailFact
            icon={Phone}
            label="Teléfono"
            value={lead.renter_phone_e164}
          />
        ) : null}
        {lead.renter_email ? (
          <DetailFact icon={Mail} label="Email" value={lead.renter_email} />
        ) : null}
      </section>

      <section
        className="rounded-xl border border-border bg-card p-5 space-y-4"
        aria-labelledby="actions-heading"
      >
        <h2 id="actions-heading" className="text-sm font-semibold text-muted-foreground">
          Responder
        </h2>
        <WhatsAppReplyButton
          renterPhone={lead.renter_phone_e164}
          renterName={renter}
          apartmentTitle={apartmentTitle}
          onSent={onReplyClick}
        />
        <div className="border-t border-border pt-4">
          <LeadStatusActions
            leadId={lead.id}
            status={lead.status}
            hadReply={!!lead.first_reply_at}
          />
        </div>
      </section>

      {lead.apartment ? (
        <p className="text-sm">
          <Link
            to={`/apartments/${lead.apartment.id}`}
            className="inline-flex items-center gap-1 text-primary hover:underline"
            data-testid="lead-detail-listing-link"
          >
            Ver el anuncio público <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </Link>
        </p>
      ) : null}
    </article>
  );
}

function DetailFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

interface StatusVisual {
  label: string;
  Icon: typeof Inbox;
  color: string;
}

const STATUS_VISUAL: Record<LeadStatus, StatusVisual> = {
  new: {
    label: "Nuevo",
    Icon: Inbox,
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  },
  viewed: {
    label: "Visto",
    Icon: Clock,
    color: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  },
  replied: {
    label: "Respondido",
    Icon: CheckCheck,
    color: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  },
  archived: {
    label: "Archivado",
    Icon: Archive,
    color: "bg-muted text-muted-foreground border-border",
  },
};

function StatusPill({ status }: { status: LeadStatus }) {
  const v = STATUS_VISUAL[status];
  return (
    <Badge
      className={cn("inline-flex items-center gap-1 border", v.color)}
      data-testid="lead-detail-status"
    >
      <v.Icon className="w-3 h-3" aria-hidden="true" />
      {v.label}
    </Badge>
  );
}

function DetailLoading() {
  return (
    <div
      className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground"
      data-testid="lead-detail-loading"
    >
      <Loader2 className="w-5 h-5 mx-auto animate-spin" aria-hidden="true" />
      <p className="mt-3 text-sm">Cargando lead…</p>
    </div>
  );
}

function DetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      data-testid="lead-detail-error"
    >
      <div className="flex items-center gap-2 text-destructive font-medium">
        <AlertCircle className="w-4 h-4" aria-hidden="true" />
        No pudimos cargar este lead.
      </div>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

function DetailNotFound() {
  return (
    <div
      className="rounded-xl border-2 border-dashed border-border bg-card px-6 py-12 text-center"
      data-testid="lead-detail-not-found"
    >
      <h3 className="text-lg font-semibold text-foreground">
        Lead no encontrado
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        El lead fue archivado, eliminado, o nunca existió. Vuelve al inbox y
        elige otro.
      </p>
      <Button asChild variant="outline" size="lg" className="mt-5">
        <Link to="/host/leads">Volver al inbox</Link>
      </Button>
    </div>
  );
}

function relativeTime(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr}h`;
  const day = Math.round(hr / 24);
  if (day < 30) return `hace ${day} días`;
  return new Date(iso).toLocaleDateString("es-CO");
}
