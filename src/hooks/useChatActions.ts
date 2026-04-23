import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { RentalInlineListing } from '@/types/chat';

/**
 * Week 2 Tue — chat card actions.
 *
 *  - `toggleSave(listing)` → insert/delete saved_places row (location_type=apartment)
 *  - `addToTrip(listing, tripId)` → insert trip_items row (item_type=apartment)
 *  - `createTripAndAdd(listing, {title, startDate, endDate})` → create a new
 *    trip (required NOT NULL dates) and drop the listing in as the first item
 *  - `saveCounts` → Map<apartmentId, number> populated via the
 *    apartment_save_counts RPC for "Saved by N nomads" social proof
 *
 * Anonymous users see a friendly toast prompting sign-in — the Save/Add
 * buttons stay clickable so we can measure intent even when locked out.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 2 Tue.
 */

export interface TripSummary {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  destination: string | null;
  status: string;
}

export interface CreateTripInput {
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  destination?: string | null;
}

function trackIds(listings: RentalInlineListing[]): string[] {
  return listings
    .map((l) => l.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function useChatActions() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [saveCounts, setSaveCounts] = useState<Map<string, number>>(new Map());
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const countsInFlight = useRef<Set<string>>(new Set());

  // Hydrate the user's existing saved apartment IDs once so ♥ renders in
  // the correct initial state when cards show up. Anon users skip this.
  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('saved_places')
        .select('location_id')
        .eq('user_id', user.id)
        .eq('location_type', 'apartment');
      if (cancelled) return;
      if (error) {
        console.error('Failed to load saved_places:', error);
        return;
      }
      setSavedIds(new Set((data ?? []).map((r) => r.location_id as string)));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Load the user's upcoming/active trips once for the add-to-trip picker.
  // Excludes soft-deleted rows.
  const fetchTrips = useCallback(async () => {
    if (!user) {
      setTrips([]);
      return;
    }
    const { data, error } = await supabase
      .from('trips')
      .select('id, title, start_date, end_date, destination, status')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('start_date', { ascending: true })
      .limit(20);
    if (error) {
      console.error('Failed to load trips:', error);
      return;
    }
    setTrips((data ?? []) as TripSummary[]);
  }, [user]);

  useEffect(() => {
    void fetchTrips();
  }, [fetchTrips]);

  // Batch-fetch save counts for a set of listing IDs. Uses the
  // `apartment_save_counts` RPC (SECURITY DEFINER) so anon users can see
  // the same social proof without leaking saved_places rows.
  const fetchSaveCounts = useCallback(async (listings: RentalInlineListing[]) => {
    const ids = trackIds(listings);
    if (ids.length === 0) return;
    const pending = ids.filter((id) => !countsInFlight.current.has(id));
    if (pending.length === 0) return;
    for (const id of pending) countsInFlight.current.add(id);
    try {
      const { data, error } = await supabase.rpc('apartment_save_counts', {
        apartment_ids: pending,
      });
      if (error) {
        console.error('apartment_save_counts rpc failed:', error);
        return;
      }
      setSaveCounts((prev) => {
        const next = new Map(prev);
        for (const id of pending) {
          if (!next.has(id)) next.set(id, 0);
        }
        for (const row of (data ?? []) as Array<{
          apartment_id: string;
          save_count: number;
        }>) {
          next.set(row.apartment_id, Number(row.save_count) || 0);
        }
        return next;
      });
    } finally {
      for (const id of pending) countsInFlight.current.delete(id);
    }
  }, []);

  // Toggle heart — insert or delete a saved_places row. Optimistic UI with
  // rollback on error. Anon users get a toast + a no-op so we can count
  // intent without breaking RLS.
  const toggleSave = useCallback(
    async (listing: RentalInlineListing) => {
      if (!user) {
        toast.info('Sign in to save listings', {
          description: 'Your heart icon will sync as soon as you sign in.',
        });
        return;
      }
      const id = listing.id;
      const wasSaved = savedIds.has(id);
      // Optimistic
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(id);
        else next.add(id);
        return next;
      });
      setSaveCounts((prev) => {
        const next = new Map(prev);
        const current = next.get(id) ?? 0;
        next.set(id, Math.max(0, current + (wasSaved ? -1 : 1)));
        return next;
      });

      if (wasSaved) {
        const { error } = await supabase
          .from('saved_places')
          .delete()
          .eq('user_id', user.id)
          .eq('location_type', 'apartment')
          .eq('location_id', id);
        if (error) {
          console.error('Failed to unsave:', error);
          // rollback
          setSavedIds((prev) => new Set(prev).add(id));
          setSaveCounts((prev) => {
            const next = new Map(prev);
            next.set(id, (next.get(id) ?? 0) + 1);
            return next;
          });
          toast.error('Could not remove from saved. Please retry.');
          return;
        }
        toast.success('Removed from saved');
      } else {
        const { error } = await supabase.from('saved_places').insert({
          user_id: user.id,
          location_type: 'apartment',
          location_id: id,
          is_favorite: true,
        });
        if (error) {
          console.error('Failed to save:', error);
          // rollback
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          setSaveCounts((prev) => {
            const next = new Map(prev);
            next.set(id, Math.max(0, (next.get(id) ?? 1) - 1));
            return next;
          });
          toast.error('Could not save. Please retry.');
          return;
        }
        toast.success('Saved', { description: listing.title });
      }
    },
    [user, savedIds],
  );

  const addToTrip = useCallback(
    async (listing: RentalInlineListing, tripId: string) => {
      if (!user) {
        toast.info('Sign in to build a trip');
        return false;
      }
      const { error } = await supabase.from('trip_items').insert({
        trip_id: tripId,
        item_type: 'apartment',
        source_id: listing.id,
        title: listing.title,
        description: listing.description ?? null,
        location_name: listing.neighborhood ?? null,
        latitude: listing.latitude ?? null,
        longitude: listing.longitude ?? null,
        metadata: {
          price_monthly: listing.price_monthly ?? null,
          price_daily: listing.price_daily ?? null,
          bedrooms: listing.bedrooms ?? null,
          bathrooms: listing.bathrooms ?? null,
          source_url: listing.source_url ?? null,
        },
        created_by: user.id,
      });
      if (error) {
        console.error('Failed to add trip item:', error);
        toast.error('Could not add to trip. Please retry.');
        return false;
      }
      toast.success('Added to trip', { description: listing.title });
      return true;
    },
    [user],
  );

  const createTripAndAdd = useCallback(
    async (listing: RentalInlineListing, input: CreateTripInput) => {
      if (!user) {
        toast.info('Sign in to build a trip');
        return null;
      }
      const { data: tripRow, error: tripErr } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: input.title,
          start_date: input.start_date,
          end_date: input.end_date,
          destination: input.destination ?? 'Medellín, Colombia',
          status: 'planning',
        })
        .select('id, title, start_date, end_date, destination, status')
        .single();
      if (tripErr || !tripRow) {
        console.error('Failed to create trip:', tripErr);
        toast.error('Could not create trip. Please retry.');
        return null;
      }
      const created = tripRow as TripSummary;
      setTrips((prev) => [created, ...prev]);
      const ok = await addToTrip(listing, created.id);
      return ok ? created : null;
    },
    [user, addToTrip],
  );

  const value = useMemo(
    () => ({
      savedIds,
      saveCounts,
      trips,
      fetchSaveCounts,
      fetchTrips,
      toggleSave,
      addToTrip,
      createTripAndAdd,
    }),
    [savedIds, saveCounts, trips, fetchSaveCounts, fetchTrips, toggleSave, addToTrip, createTripAndAdd],
  );

  return value;
}

export type ChatActionsApi = ReturnType<typeof useChatActions>;
