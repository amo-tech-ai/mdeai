import { useMemo, useState } from "react";
import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HostShell } from "@/components/host/layout/HostShell";
import { RoleProtectedRoute } from "@/components/host/layout/RoleProtectedRoute";
import { LeadCard } from "@/components/host/leads/LeadCard";
import {
  LeadStatusFilter,
  type LeadFilter,
} from "@/components/host/leads/LeadStatusFilter";
import { useLeads, useMarkLeadViewed } from "@/hooks/host/useLeads";

/**
 * /host/leads — landlord inbox UI (D9).
 *
 * Reads `landlord_inbox` rows + joined apartment context. Default
 * filter is "all" so a landlord opening the page sees everything they
 * have. Clicking a card marks status='new' → 'viewed' (passive,
 * idempotent — UPDATE only fires when row is still 'new').
 *
 * D10 ships /host/leads/:id detail with WhatsApp reply button +
 * manual mark-replied/archive buttons. For D9 the click is just a
 * read-confirm + (later) a navigation target.
 */

export default function HostLeads() {
  return (
    <RoleProtectedRoute>
      <HostShell>
        <LeadsContent />
      </HostShell>
    </RoleProtectedRoute>
  );
}

function LeadsContent() {
  const { leads, isLoading, error, refetch, counts } = useLeads();
  const markViewed = useMarkLeadViewed();
  const [filter, setFilter] = useState<LeadFilter>("all");

  const filtered = useMemo(() => {
    if (!leads) return [];
    if (filter === "all") return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  const handleCardClick = (leadId: string) => {
    // Passive mark-as-viewed. Hook only fires UPDATE when status='new'
    // so re-clicking already-viewed cards is a no-op. D10 will replace
    // this with navigation to the detail page.
    markViewed.mutate(leadId);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="text-xs font-medium text-primary uppercase tracking-wider">
          Inbox
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-foreground">
          Leads
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Renters who messaged you about a listing. Reply on WhatsApp from
          the detail page (D10).
        </p>
      </header>

      <div className="mb-5">
        <LeadStatusFilter
          value={filter}
          onChange={setFilter}
          counts={counts}
        />
      </div>

      {isLoading ? <LeadsLoading /> : null}
      {error ? <LeadsError onRetry={refetch} /> : null}
      {!isLoading && !error && filtered.length === 0 ? (
        <LeadsEmpty filter={filter} totalCount={counts.all} />
      ) : null}
      {!isLoading && !error && filtered.length > 0 ? (
        <ul
          className="space-y-3"
          data-testid="leads-list"
        >
          {filtered.map((lead) => (
            <li key={lead.id}>
              <LeadCard lead={lead} onClick={handleCardClick} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LeadsLoading() {
  return (
    <div
      className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground"
      data-testid="leads-loading"
    >
      <Loader2 className="w-5 h-5 mx-auto animate-spin" aria-hidden="true" />
      <p className="mt-3 text-sm">Loading your inbox…</p>
    </div>
  );
}

function LeadsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      data-testid="leads-error"
    >
      <div className="flex items-center gap-2 text-destructive font-medium">
        <AlertCircle className="w-4 h-4" aria-hidden="true" />
        Couldn&apos;t load your inbox.
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Refresh the page or retry — your leads are safe in the database
        either way.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function LeadsEmpty({
  filter,
  totalCount,
}: {
  filter: LeadFilter;
  totalCount: number;
}) {
  // Two empty states: real empty (no leads at all) vs filtered-out empty.
  const allEmpty = filter === "all" || totalCount === 0;

  return (
    <div
      className="rounded-xl border-2 border-dashed border-border bg-card px-6 py-12 text-center"
      data-testid="leads-empty"
    >
      <Inbox
        className="w-10 h-10 mx-auto text-muted-foreground"
        aria-hidden="true"
      />
      <h3 className="mt-3 text-lg font-semibold text-foreground">
        {allEmpty ? "No leads yet" : `No ${filter} leads`}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        {allEmpty
          ? "Renters who message you about your listings show up here. Share your listing URL to start getting leads."
          : "Try a different filter — your other leads are still there."}
      </p>
    </div>
  );
}
