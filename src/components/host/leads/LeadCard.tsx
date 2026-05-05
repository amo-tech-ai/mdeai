import { Clock, MessageCircle, Inbox, CheckCheck, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  InboxLeadRow,
  LeadStatus,
} from "@/hooks/host/useLeads";

/**
 * One row in the host inbox (D9). Shows enough context for the
 * landlord to decide whether to click through (D10 detail page).
 *
 * Two visual variants:
 *   - status="new" → bold name, primary accent on the side, "New" pill
 *   - else        → de-emphasised, muted accent, status pill matches state
 *
 * Channel icon (form vs chat vs whatsapp) is small + leading so the
 * landlord can scan: "where did this lead come from?".
 */

interface LeadCardProps {
  lead: InboxLeadRow;
  onClick?: (leadId: string) => void;
}

interface StatusVisual {
  label: string;
  Icon: typeof Inbox;
  color: string;
}

const STATUS_VISUAL: Record<LeadStatus, StatusVisual> = {
  new: { label: "New", Icon: Inbox, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  viewed: { label: "Viewed", Icon: Clock, color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  replied: { label: "Replied", Icon: CheckCheck, color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  archived: { label: "Archived", Icon: Archive, color: "bg-muted text-muted-foreground border-border" },
};

const CHANNEL_LABEL: Record<InboxLeadRow["channel"], string> = {
  form: "Form",
  chat: "Chat",
  whatsapp: "WhatsApp",
};

const MOVE_WHEN_LABEL: Record<"now" | "soon" | "later", string> = {
  now: "Now",
  soon: "Soon",
  later: "Later",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = (Date.now() - then) / 1000;
  if (diffSec < 60) return "just now";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const visual = STATUS_VISUAL[lead.status];
  const isNew = lead.status === "new";
  const moveWhen = lead.structured_profile?.move_when;
  const apartmentTitle =
    lead.apartment?.title ??
    lead.structured_profile?.apartment_title ??
    "(unknown listing)";
  const apartmentNeighborhood =
    lead.apartment?.neighborhood ??
    lead.structured_profile?.apartment_neighborhood ??
    null;
  const renterName =
    lead.renter_name ??
    lead.structured_profile?.renter_name ??
    "Anonymous";
  const messageSnippet =
    lead.raw_message.length > 140
      ? `${lead.raw_message.slice(0, 140).trim()}…`
      : lead.raw_message;

  return (
    <article
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? () => onClick(lead.id) : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(lead.id);
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-colors",
        isNew ? "border-primary/30" : "border-border",
        onClick && "cursor-pointer hover:bg-muted/40",
      )}
      data-testid="lead-card"
      data-lead-id={lead.id}
      data-lead-status={lead.status}
    >
      <div className="p-4 flex gap-3">
        <div
          className={cn(
            "w-1 self-stretch rounded-full",
            isNew ? "bg-primary" : "bg-transparent",
          )}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={cn(
                  "leading-tight truncate",
                  isNew ? "font-semibold text-foreground" : "font-medium text-foreground/90",
                )}
                data-testid="lead-renter-name"
              >
                {renterName}
              </h3>
              <p
                className="text-sm text-muted-foreground truncate"
                data-testid="lead-apartment"
              >
                {apartmentTitle}
                {apartmentNeighborhood ? ` · ${apartmentNeighborhood}` : null}
              </p>
            </div>
            <Badge
              className={cn(
                "inline-flex items-center gap-1 border shrink-0",
                visual.color,
              )}
              data-testid="lead-status-pill"
            >
              <visual.Icon className="w-3 h-3" aria-hidden="true" />
              {visual.label}
            </Badge>
          </div>

          <p
            className="text-sm text-foreground line-clamp-2"
            data-testid="lead-message-snippet"
          >
            {messageSnippet}
          </p>

          <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
            <span
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5"
              data-testid="lead-channel"
            >
              <MessageCircle className="w-3 h-3" aria-hidden="true" />
              {CHANNEL_LABEL[lead.channel] ?? lead.channel}
            </span>
            {moveWhen ? (
              <span
                className="inline-flex items-center rounded-full border border-border px-2 py-0.5"
                data-testid="lead-move-when"
              >
                Moving {MOVE_WHEN_LABEL[moveWhen]}
              </span>
            ) : null}
            <span className="ml-auto" data-testid="lead-timestamp">
              {relativeTime(lead.created_at)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
