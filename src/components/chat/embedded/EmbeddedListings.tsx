import { useEffect, useMemo, useState } from 'react';
import type { ChatAction, RentalInlineListing } from '@/types/chat';
import { RentalCardInline } from './RentalCardInline';
import { useChatActions } from '@/hooks/useChatActions';
import { AddToTripModal } from '../AddToTripModal';

interface EmbeddedListingsProps {
  actions: ChatAction[];
}

/**
 * Renders inline listing cards extracted from an assistant turn's pending
 * actions. Today handles OPEN_RENTALS_RESULTS → RentalCardInline.
 * Additional vertical types (restaurants, events, attractions) plug in here
 * as new branches — card component + pin color, nothing else.
 *
 * Owns the Save / Add-to-trip / social-proof pipeline via useChatActions.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Tue + Week 2 Tue.
 */
export function EmbeddedListings({ actions }: EmbeddedListingsProps) {
  const chatActions = useChatActions();
  const { savedIds, saveCounts, toggleSave, fetchSaveCounts } = chatActions;
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [tripTarget, setTripTarget] = useState<RentalInlineListing | null>(null);

  // Flatten rental listings from all OPEN_RENTALS_RESULTS actions on this turn.
  // (Usually there's exactly one, but the protocol allows multiple.)
  const rentals = useMemo<RentalInlineListing[]>(() => {
    const out: RentalInlineListing[] = [];
    for (const a of actions) {
      if (a.type === 'OPEN_RENTALS_RESULTS' && a.payload.listings) {
        out.push(...a.payload.listings);
      }
    }
    return out;
  }, [actions]);

  // Fire save-count RPC when new listings arrive. Safe to call repeatedly;
  // the hook internally dedupes by listing id.
  useEffect(() => {
    if (rentals.length === 0) return;
    void fetchSaveCounts(rentals);
  }, [rentals, fetchSaveCounts]);

  if (rentals.length === 0) return null;

  const openTripModal = (listing: RentalInlineListing) => {
    setTripTarget(listing);
    setTripModalOpen(true);
  };

  return (
    <>
      <div className="mt-3 space-y-2">
        {rentals.map((l) => (
          <RentalCardInline
            key={l.id}
            listing={l}
            onSave={() => toggleSave(l)}
            onAddToTrip={() => openTripModal(l)}
            saved={savedIds.has(l.id)}
            saveCount={saveCounts.get(l.id) ?? 0}
          />
        ))}
      </div>
      <AddToTripModal
        open={tripModalOpen}
        onOpenChange={setTripModalOpen}
        listing={tripTarget}
        actions={chatActions}
      />
    </>
  );
}
