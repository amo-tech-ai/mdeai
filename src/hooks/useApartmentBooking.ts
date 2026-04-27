import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Apartment } from '@/types/listings';

/**
 * Apartment booking + host-inquiry mutations.
 *
 *  - `submitBooking()` → INSERT into `bookings` with booking_type='apartment',
 *    status='pending', payment_status='pending'. Requires auth (RLS policy
 *    `authenticated_users_can_create_bookings` enforces user_id = auth.uid()).
 *  - `submitInquiry()` → INSERT into `leads` with source='apartment_inquiry'.
 *    Same RLS shape (`leads_insert_own_user`). Inquiry text lives in `notes`;
 *    apartment context lives in `metadata` jsonb.
 *
 * Both raise a clear sign-in error when called by anon users — the calling
 * dialog catches and routes to /login with a returnTo back to the apartment
 * detail page.
 */

export interface SubmitBookingInput {
  apartment: Pick<Apartment, 'id' | 'title' | 'price_monthly' | 'currency'>;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  guests: number;
  message?: string | null;
  estimatedTotal: number;
  /** Internal — pricing breakdown for the metadata trail. */
  pricing?: Record<string, unknown>;
  tripId?: string | null;
}

export interface SubmitInquiryInput {
  apartment: Pick<Apartment, 'id' | 'title' | 'neighborhood' | 'price_monthly'>;
  message: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface BookingRow {
  id: string;
  status: string;
  payment_status: string | null;
  start_date: string;
  end_date: string | null;
  total_price: number | null;
  resource_title: string;
  confirmation_code: string | null;
}

export class NotAuthenticatedError extends Error {
  constructor() {
    super('You need to sign in to submit this request.');
    this.name = 'NotAuthenticatedError';
  }
}

export function useSubmitBooking() {
  const { user } = useAuth();

  return useMutation<BookingRow, Error, SubmitBookingInput>({
    mutationKey: ['submit-booking'],
    mutationFn: async (input) => {
      if (!user) throw new NotAuthenticatedError();
      const { apartment, startDate, endDate, guests, message, estimatedTotal, pricing, tripId } =
        input;
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          booking_type: 'apartment',
          resource_id: apartment.id,
          resource_title: apartment.title,
          start_date: startDate,
          end_date: endDate,
          party_size: guests,
          quantity: 1,
          unit_price: apartment.price_monthly ?? null,
          total_price: estimatedTotal,
          currency: apartment.currency ?? 'USD',
          status: 'pending',
          payment_status: 'pending',
          special_requests: message?.trim() ? message.trim() : null,
          trip_id: tripId ?? null,
          metadata: {
            source: 'apartment_detail_check_availability',
            pricing: pricing ?? null,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          },
        })
        .select(
          'id, status, payment_status, start_date, end_date, total_price, resource_title, confirmation_code',
        )
        .single();
      if (error) throw error;
      return data as BookingRow;
    },
  });
}

export function useSubmitInquiry() {
  const { user } = useAuth();

  return useMutation<{ id: string }, Error, SubmitInquiryInput>({
    mutationKey: ['submit-inquiry'],
    mutationFn: async (input) => {
      if (!user) throw new NotAuthenticatedError();
      const { apartment, message, startDate, endDate } = input;
      const { data, error } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          source: 'apartment_inquiry',
          status: 'new',
          notes: message.trim(),
          metadata: {
            apartment_id: apartment.id,
            apartment_title: apartment.title,
            neighborhood: apartment.neighborhood,
            price_monthly: apartment.price_monthly,
            requested_start_date: startDate ?? null,
            requested_end_date: endDate ?? null,
            channel: 'web',
          },
        })
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
  });
}

/**
 * Helper: produce a returnTo path so the sign-in flow can bring the user
 * back to where they started — the apartment detail page they were
 * trying to book.
 */
export function useReturnToApartment(apartmentId: string | undefined) {
  return useCallback(() => {
    if (!apartmentId) return '/';
    return `/apartments/${apartmentId}`;
  }, [apartmentId]);
}
