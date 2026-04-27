import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import {
  NotAuthenticatedError,
  useSubmitInquiry,
} from '@/hooks/useApartmentBooking';
import type { Apartment } from '@/types/listings';

/**
 * "Contact Host" modal — opens from the Contact Host CTA on
 * ApartmentDetail and creates a row on `leads` (source='apartment_inquiry').
 *
 * Pre-fills a friendly message including the apartment title (and optional
 * move-in date). Anon users can draft the message; submission redirects
 * them to /login with a returnTo back to the apartment.
 *
 * The leads table is the existing P1-CRM inquiry pipeline (real-estate
 * agents work directly off `status='new'` rows). Carrying inquiries here
 * means they ride the same dashboard as renter-side leads from the chat.
 */

interface ContactHostDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  apartment: Apartment;
  /** Optional move-in date the user already picked (e.g. from BookingDialog). */
  startDate?: string | null;
  /** Optional move-out date the user already picked. */
  endDate?: string | null;
}

const isoToHuman = (iso: string | null | undefined): string =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

function buildPrefilledMessage(
  apartment: Apartment,
  startDate?: string | null,
): string {
  const title = apartment.title || 'this apartment';
  if (startDate) {
    return `Hi! I'm interested in ${title} and would love to know if it's available from ${isoToHuman(startDate)}. A few details about me would help — happy to share. Thanks!`;
  }
  return `Hi! I'm interested in ${title} in ${apartment.neighborhood}. Could you share availability and any details I should know before booking? Thanks!`;
}

export function ContactHostDialog({
  open,
  onOpenChange,
  apartment,
  startDate,
  endDate,
}: ContactHostDialogProps) {
  const { user } = useAuth();
  const submitInquiry = useSubmitInquiry();
  const [message, setMessage] = useState<string>(() =>
    buildPrefilledMessage(apartment, startDate),
  );
  const [authError, setAuthError] = useState(false);
  const [success, setSuccess] = useState(false);

  // Re-prefill if dialog opens with a different start date.
  useEffect(() => {
    if (open) {
      setMessage(buildPrefilledMessage(apartment, startDate));
      setAuthError(false);
      setSuccess(false);
      submitInquiry.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, apartment.id, startDate]);

  const handleSubmit = async () => {
    setAuthError(false);
    try {
      await submitInquiry.mutateAsync({
        apartment,
        message,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof NotAuthenticatedError) {
        setAuthError(true);
        return;
      }
    }
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSuccess(false);
      setAuthError(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{success ? 'Message sent' : 'Contact host'}</DialogTitle>
          <DialogDescription className="line-clamp-1">
            {apartment.host_name ? `${apartment.host_name} · ` : ''}
            {apartment.title}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold">We&apos;ll connect you with the host</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your inquiry is logged. The mdeai team routes inquiries to hosts
              and follows up by email within 24 hours.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="ch-msg" className="text-xs">
                Your message
              </Label>
              <Textarea
                id="ch-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="mt-1 text-sm"
                placeholder="Tell the host about yourself, your move-in date, and any questions."
              />
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                Pre-filled — edit before sending.
              </div>
            </div>

            {authError && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Sign in to send
                </p>
                <p className="text-amber-800/80 dark:text-amber-300/80 text-xs mt-0.5 mb-2">
                  Hosts only respond to verified accounts. We&apos;ll bring you
                  back to this listing after sign-in.
                </p>
                <Button asChild size="sm" variant="default">
                  <Link to={`/login?returnTo=/apartments/${apartment.id}`}>
                    Sign in &amp; send
                  </Link>
                </Button>
              </div>
            )}

            {submitInquiry.isError && !authError && (
              <p className="text-xs text-destructive">
                {submitInquiry.error instanceof Error
                  ? submitInquiry.error.message
                  : 'Could not send. Please try again.'}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {success ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close} disabled={submitInquiry.isPending}>
                Cancel
              </Button>
              {!user ? (
                <Button asChild>
                  <Link to={`/login?returnTo=/apartments/${apartment.id}`}>
                    Sign in to send
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitInquiry.isPending}
                >
                  {submitInquiry.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send message'
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
