import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Ticket, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ChatAction, EventDraftPayload } from '@/types/chat';

interface EmbeddedEventDraftProps {
  actions: ChatAction[];
  onDiscard?: () => void;
}

function formatCOP(cents: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function EmbeddedEventDraft({ actions, onDiscard }: EmbeddedEventDraftProps) {
  const navigate = useNavigate();
  const [discarding, setDiscarding] = useState(false);
  const [discarded, setDiscarded] = useState(false);

  const draftAction = actions.find((a) => a.type === 'SHOW_EVENT_DRAFT');
  if (!draftAction || draftAction.type !== 'SHOW_EVENT_DRAFT') return null;
  if (discarded) return null;

  const draft = draftAction.payload as EventDraftPayload;
  const totalCapacity = draft.tiers.reduce((sum, t) => sum + t.qty_total, 0);

  const handleDiscard = async () => {
    setDiscarding(true);
    const { error } = await supabase
      .from('events')
      .update({ status: 'archived' })
      .eq('id', draft.event_id);

    if (error) {
      toast.error('Failed to discard draft');
      setDiscarding(false);
      return;
    }
    toast.success('Draft discarded');
    setDiscarded(true);
    onDiscard?.();
  };

  return (
    <div
      className="mt-3 rounded-xl border border-border bg-card overflow-hidden shadow-sm"
      data-testid="event-draft-card"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-primary/5 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm leading-snug" data-testid="draft-name">
              {draft.name}
            </p>
            <Badge variant="secondary" className="mt-1.5 text-xs">
              Draft
            </Badge>
          </div>
          <Ticket className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        {draft.start_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span data-testid="draft-date">{formatDate(draft.start_at)}</span>
          </div>
        )}
        {draft.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span data-testid="draft-address">{draft.address}</span>
          </div>
        )}

        {/* Ticket tiers */}
        {draft.tiers.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {draft.tiers.length} tier{draft.tiers.length !== 1 ? 's' : ''} —{' '}
              {totalCapacity.toLocaleString('es-CO')} capacity
            </p>
            <div className="space-y-0.5">
              {draft.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
                  data-testid="draft-tier"
                >
                  <span className="font-medium">{tier.name}</span>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="text-xs">{tier.qty_total.toLocaleString('es-CO')} cupos</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {tier.price_cents === 0 ? 'Gratis' : formatCOP(tier.price_cents, tier.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="px-4 py-3 border-t border-border flex gap-2">
        <Button
          className="flex-1 gap-2"
          onClick={() => navigate(draft.deep_link)}
          data-testid="open-in-editor-btn"
        >
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          Open in editor
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDiscard}
          disabled={discarding}
          aria-label="Discard draft"
          data-testid="discard-btn"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
