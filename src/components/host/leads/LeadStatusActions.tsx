import { CheckCheck, Archive, Undo2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useArchive,
  useMarkReplied,
  useReopen,
} from "@/hooks/host/useLeadActions";
import type { LeadStatus } from "@/hooks/host/useLeads";

/**
 * LeadStatusActions — D10 transitions on the detail page.
 *
 * Visibility matrix:
 *
 *   status=new       [Mark replied] [Archive]
 *   status=viewed    [Mark replied] [Archive]
 *   status=replied   [Archive]                       (already replied — no Mark again)
 *   status=archived  [Reopen]                        (back to viewed)
 *
 * The "Mark replied" button is also auto-fired by WhatsAppReplyButton's
 * `onSent` callback on the parent page, so the landlord doesn't HAVE to
 * click it manually — but it's there for the case where they reply via
 * a different channel (phone call, in person, etc).
 */

interface LeadStatusActionsProps {
  leadId: string;
  status: LeadStatus;
  hadReply: boolean;
  /** Imperative mark-replied trigger from the WhatsAppReplyButton. */
  onMarkReplied?: () => void;
}

export function LeadStatusActions({
  leadId,
  status,
  hadReply,
}: LeadStatusActionsProps) {
  const { toast } = useToast();
  const markReplied = useMarkReplied();
  const archive = useArchive();
  const reopen = useReopen();

  const anyPending =
    markReplied.isPending || archive.isPending || reopen.isPending;

  const handleReplied = () => {
    markReplied.mutate(
      { leadId, fromStatus: status, hadReply },
      {
        onError: (err) =>
          toast({
            title: "No se pudo marcar como respondido",
            description: err.message,
            variant: "destructive",
          }),
        onSuccess: () =>
          toast({ title: "Marcado como respondido", description: "Buen trabajo 🎉" }),
      },
    );
  };

  const handleArchive = () => {
    archive.mutate(
      { leadId, fromStatus: status, hadReply },
      {
        onError: (err) =>
          toast({
            title: "No se pudo archivar",
            description: err.message,
            variant: "destructive",
          }),
        onSuccess: () =>
          toast({ title: "Lead archivado", description: "Lo verás en el filtro Archived." }),
      },
    );
  };

  const handleReopen = () => {
    reopen.mutate(
      { leadId, fromStatus: status, hadReply },
      {
        onError: (err) =>
          toast({
            title: "No se pudo reabrir",
            description: err.message,
            variant: "destructive",
          }),
        onSuccess: () =>
          toast({ title: "Lead reabierto", description: "Volvió al inbox." }),
      },
    );
  };

  return (
    <div
      className="flex flex-wrap gap-2"
      data-testid="lead-status-actions"
    >
      {(status === "new" || status === "viewed") && (
        <Button
          variant="outline"
          onClick={handleReplied}
          disabled={anyPending}
          data-testid="lead-action-mark-replied"
        >
          {markReplied.isPending ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <CheckCheck className="w-4 h-4 mr-1.5" />
          )}
          Marcar como respondido
        </Button>
      )}

      {status !== "archived" && (
        <Button
          variant="ghost"
          onClick={handleArchive}
          disabled={anyPending}
          data-testid="lead-action-archive"
        >
          {archive.isPending ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Archive className="w-4 h-4 mr-1.5" />
          )}
          Archivar
        </Button>
      )}

      {status === "archived" && (
        <Button
          variant="outline"
          onClick={handleReopen}
          disabled={anyPending}
          data-testid="lead-action-reopen"
        >
          {reopen.isPending ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Undo2 className="w-4 h-4 mr-1.5" />
          )}
          Reabrir
        </Button>
      )}
    </div>
  );
}
