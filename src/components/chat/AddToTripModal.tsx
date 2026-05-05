import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { RentalInlineListing } from '@/types/chat';
import type { ChatActionsApi } from '@/hooks/useChatActions';

/**
 * Week 2 Tue — add-to-trip modal.
 *
 * Opens when the ➕ button on a chat card is clicked (authed users). Two
 * modes:
 *   1. Pick an existing trip — one-click add to trip_items
 *   2. Create a new trip — title + date range, then add the listing as the
 *      first trip_item
 *
 * The trips list is hydrated via `useChatActions.fetchTrips()` on mount.
 * Start/end dates are required by the trips schema (NOT NULL); the modal
 * validates this before submitting.
 */

interface AddToTripModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listing: RentalInlineListing | null;
  actions: ChatActionsApi;
}

export function AddToTripModal({ open, onOpenChange, listing, actions }: AddToTripModalProps) {
  const { trips, addToTrip, createTripAndAdd } = actions;
  const [mode, setMode] = useState<'pick' | 'new'>(trips.length > 0 ? 'pick' : 'new');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmitNew = useMemo(
    () => title.trim().length > 0 && !!startDate && !!endDate && startDate <= endDate,
    [title, startDate, endDate],
  );

  const close = () => {
    onOpenChange(false);
    setSubmitting(false);
    setSelectedTripId(null);
    setTitle('');
    setStartDate('');
    setEndDate('');
    setMode(trips.length > 0 ? 'pick' : 'new');
  };

  const onPick = async () => {
    if (!listing || !selectedTripId) return;
    setSubmitting(true);
    const ok = await addToTrip(listing, selectedTripId);
    setSubmitting(false);
    if (ok) close();
  };

  const onCreate = async () => {
    if (!listing || !canSubmitNew) return;
    setSubmitting(true);
    const trip = await createTripAndAdd(listing, {
      title: title.trim(),
      start_date: startDate,
      end_date: endDate,
      destination: 'Medellín, Colombia',
    });
    setSubmitting(false);
    if (trip) close();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to trip</DialogTitle>
          <DialogDescription>
            {listing ? (
              <>Save <span className="font-medium text-foreground">{listing.title}</span> into one of your Medellín trips.</>
            ) : (
              'Pick a trip to add this listing to.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === 'pick' ? 'default' : 'outline'}
            onClick={() => setMode('pick')}
            disabled={trips.length === 0}
          >
            Existing trip
          </Button>
          <Button
            size="sm"
            variant={mode === 'new' ? 'default' : 'outline'}
            onClick={() => setMode('new')}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New trip
          </Button>
        </div>

        {mode === 'pick' ? (
          <div className="max-h-64 overflow-y-auto space-y-2 mt-2">
            {trips.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                You don't have any trips yet. Create one above.
              </p>
            ) : (
              trips.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTripId(t.id)}
                  className={cn(
                    'w-full text-left rounded-lg border p-3 transition-colors',
                    selectedTripId === t.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t.start_date} → {t.end_date}
                    {t.destination ? ` · ${t.destination}` : ''}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <div>
              <Label htmlFor="trip-title" className="text-xs">
                Trip name
              </Label>
              <Input
                id="trip-title"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="3 months in Medellín"
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="trip-start" className="text-xs">
                  Start
                </Label>
                <Input
                  id="trip-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="trip-end" className="text-xs">
                  End
                </Label>
                <Input
                  id="trip-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>
            {startDate && endDate && startDate > endDate && (
              <p className="text-xs text-destructive">End date must be on or after the start date.</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          {mode === 'pick' ? (
            <Button onClick={onPick} disabled={!selectedTripId || submitting}>
              Add to trip
            </Button>
          ) : (
            <Button onClick={onCreate} disabled={!canSubmitNew || submitting}>
              Create trip &amp; add
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
