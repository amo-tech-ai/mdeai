import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Loader2, MapPin, Bed, Wifi, ArrowRight, ArrowLeft } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  NotAuthenticatedError,
  useSubmitBooking,
  type BookingRow,
} from '@/hooks/useApartmentBooking';
import {
  addMonths,
  calculateBookingPricing,
  formatUsd,
  type BookingPricingResult,
} from '@/lib/booking-pricing';
import { trackEvent } from '@/lib/posthog';
import type { Apartment } from '@/types/listings';

/**
 * Multi-step apartment booking flow opened from the "Check Availability"
 * CTA on ApartmentDetail.
 *
 * Step 1 — Dates  : start, (end OR # of months), guests, optional message.
 * Step 2 — Review : pricing breakdown + apartment summary, "Submit request"
 * Step 3 — Success: confirmation, links to /bookings + back to apartment.
 *
 * Anon users can fill the form. Submission throws NotAuthenticatedError
 * which we catch and surface as a sign-in CTA — preserving the form data
 * so they can resume after auth.
 *
 * Pricing is "estimated" until host confirms. We persist it on the booking
 * row's `total_price` (and snapshot the breakdown in `metadata.pricing`).
 */

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  apartment: Apartment;
}

type Step = 'dates' | 'review' | 'success';
type EndMode = 'date' | 'months';

const today = () => new Date().toISOString().slice(0, 10);
const isoToHuman = (iso: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export function BookingDialog({ open, onOpenChange, apartment }: BookingDialogProps) {
  const { user } = useAuth();
  const submitBooking = useSubmitBooking();

  const minStay = apartment.minimum_stay_days ?? 1;
  const availableFrom = apartment.available_from ?? null;
  const availableTo = apartment.available_to ?? null;
  const priceMonthly = apartment.price_monthly ?? 0;

  const [step, setStep] = useState<Step>('dates');
  const [startDate, setStartDate] = useState<string>('');
  const [endMode, setEndMode] = useState<EndMode>('date');
  const [endDate, setEndDate] = useState<string>('');
  const [months, setMonths] = useState<number>(Math.max(1, Math.ceil(minStay / 30)));
  const [guests, setGuests] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [bookingRow, setBookingRow] = useState<BookingRow | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);

  // Reset form when dialog opens — but keep prior submission visible if
  // still on success step (user may want to re-open to view again).
  useEffect(() => {
    if (!open) return;
    setAuthError(false);
    submitBooking.reset();
    if (step !== 'success') {
      setStartDate((s) => s || availableFrom || today());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // When user picks "# of months", derive end_date from start + months.
  const effectiveEnd = useMemo(() => {
    if (endMode === 'date') return endDate;
    if (!startDate || months <= 0) return '';
    return addMonths(startDate, months);
  }, [endMode, startDate, endDate, months]);

  const pricing = useMemo<BookingPricingResult>(
    () =>
      calculateBookingPricing({
        priceMonthly,
        startDate,
        endDate: effectiveEnd,
      }),
    [priceMonthly, startDate, effectiveEnd],
  );

  const stayTooShort = pricing.valid && pricing.totalDays > 0 && pricing.totalDays < minStay;
  const startBeforeAvailable =
    !!startDate && !!availableFrom && startDate < availableFrom;
  const endAfterAvailable =
    !!effectiveEnd && !!availableTo && effectiveEnd > availableTo;

  const datesError = (() => {
    if (!startDate) return 'Pick a move-in date.';
    if (endMode === 'date' && !endDate) return 'Pick a move-out date.';
    if (endMode === 'months' && (!Number.isFinite(months) || months <= 0))
      return 'Pick how many months you plan to stay.';
    if (!pricing.valid) return 'Move-out date must be after move-in.';
    if (stayTooShort) return `This place requires a minimum ${minStay}-day stay.`;
    if (startBeforeAvailable) return `Available from ${isoToHuman(availableFrom!)}.`;
    if (endAfterAvailable) return `Available through ${isoToHuman(availableTo!)}.`;
    if (priceMonthly <= 0) return 'No price on this listing — contact host instead.';
    return null;
  })();

  const goNext = () => setStep('review');
  const goBack = () => setStep('dates');

  const handleSubmit = async () => {
    if (!startDate || !effectiveEnd || !pricing.valid) return;
    setAuthError(false);
    try {
      const row = await submitBooking.mutateAsync({
        apartment,
        startDate,
        endDate: effectiveEnd,
        guests,
        message,
        estimatedTotal: pricing.total,
        pricing: {
          fullMonths: pricing.fullMonths,
          remainderDays: pricing.remainderDays,
          monthlySubtotal: pricing.monthlySubtotal,
          dailyProrate: pricing.dailyProrate,
          cleaningFee: pricing.cleaningFee,
          totalDays: pricing.totalDays,
        },
      });
      setBookingRow(row);
      setStep('success');
      trackEvent({
        name: 'booking_submitted',
        apartmentId: apartment.id,
        estimatedTotal: pricing.total,
        nights: pricing.totalDays,
      });
    } catch (err) {
      if (err instanceof NotAuthenticatedError) {
        setAuthError(true);
        return;
      }
      // Other errors fall through to the mutation's error state, which we
      // render below the submit button.
    }
  };

  const closeAndReset = () => {
    onOpenChange(false);
    // After a short delay (so we don't visibly nuke the success screen
    // mid-close-animation) reset all step state.
    setTimeout(() => {
      if (step === 'success') {
        setStep('dates');
        setBookingRow(null);
        setStartDate('');
        setEndDate('');
        setMonths(Math.max(1, Math.ceil(minStay / 30)));
        setGuests(1);
        setMessage('');
      }
    }, 200);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : closeAndReset())}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'success' ? 'Request sent' : 'Check availability'}
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            {apartment.title} · {apartment.neighborhood}
          </DialogDescription>
        </DialogHeader>

        {step === 'dates' && (
          <div className="space-y-4">
            <ApartmentMiniSummary apartment={apartment} minStay={minStay} />

            {/* Move-in */}
            <div>
              <Label htmlFor="bk-start" className="text-xs">Move-in date</Label>
              <Input
                id="bk-start"
                type="date"
                value={startDate}
                min={availableFrom ?? today()}
                max={availableTo ?? undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 h-9 text-sm"
              />
            </div>

            {/* Move-out — date OR months */}
            <Tabs value={endMode} onValueChange={(v) => setEndMode(v as EndMode)}>
              <TabsList className="grid grid-cols-2 w-full h-8">
                <TabsTrigger value="date" className="text-xs">Move-out date</TabsTrigger>
                <TabsTrigger value="months" className="text-xs">Number of months</TabsTrigger>
              </TabsList>
              <TabsContent value="date" className="mt-2">
                <Input
                  type="date"
                  value={endDate}
                  min={startDate || availableFrom || today()}
                  max={availableTo ?? undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </TabsContent>
              <TabsContent value="months" className="mt-2 space-y-1">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={24}
                  value={months}
                  onChange={(e) => setMonths(Number.parseInt(e.target.value, 10) || 0)}
                  className="h-9 text-sm"
                />
                {effectiveEnd && (
                  <p className="text-[11px] text-muted-foreground">
                    Estimated move-out: {isoToHuman(effectiveEnd)} ·{' '}
                    {pricing.totalDays} days
                  </p>
                )}
              </TabsContent>
            </Tabs>

            {/* Guests */}
            <div>
              <Label htmlFor="bk-guests" className="text-xs">Guests</Label>
              <Input
                id="bk-guests"
                type="number"
                inputMode="numeric"
                min={1}
                max={16}
                value={guests}
                onChange={(e) => setGuests(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
                className="mt-1 h-9 text-sm"
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="bk-msg" className="text-xs">Message to host (optional)</Label>
              <Textarea
                id="bk-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Anything the host should know? (work hours, pets, parking…)"
                rows={3}
                className="mt-1 text-sm"
              />
            </div>

            {/* Live pricing peek */}
            {pricing.valid && !datesError && (
              <PricingPeek pricing={pricing} priceMonthly={priceMonthly} />
            )}
            {datesError && (
              <p className="text-xs text-destructive">{datesError}</p>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <ApartmentMiniSummary apartment={apartment} minStay={minStay} />

            <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm">
              <Row label="Move-in" value={isoToHuman(startDate)} />
              <Row label="Move-out" value={isoToHuman(effectiveEnd)} />
              <Row label="Stay" value={`${pricing.totalDays} days`} />
              <Row label="Guests" value={String(guests)} />
            </div>

            <PricingBreakdown pricing={pricing} priceMonthly={priceMonthly} />

            {message.trim() && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                  Message to host
                </p>
                <p className="text-sm whitespace-pre-wrap">{message.trim()}</p>
              </div>
            )}

            {authError && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Sign in to confirm
                </p>
                <p className="text-amber-800/80 dark:text-amber-300/80 text-xs mt-0.5 mb-2">
                  Your request is ready — we just need an account so the host can reach you.
                </p>
                <Button asChild size="sm" variant="default">
                  <Link to={`/login?returnTo=/apartments/${apartment.id}`}>
                    Sign in &amp; submit
                  </Link>
                </Button>
              </div>
            )}

            {submitBooking.isError && !authError && (
              <p className="text-xs text-destructive">
                {submitBooking.error instanceof Error
                  ? submitBooking.error.message
                  : 'Something went wrong. Please try again.'}
              </p>
            )}

            <p className="text-[11px] text-muted-foreground">
              Submitting sends a request to the host. No charge — payment is arranged
              with the landlord directly. The amount is an estimate until confirmed.
            </p>
          </div>
        )}

        {step === 'success' && bookingRow && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center text-center gap-2 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold">Booking request sent</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                The host will review and reply with confirmation. Track status in
                your bookings.
              </p>
            </div>

            <Separator />

            <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm">
              <Row label="Apartment" value={bookingRow.resource_title} />
              <Row label="Status" value={
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  Pending host confirmation
                </span>
              } />
              <Row label="Move-in" value={isoToHuman(bookingRow.start_date)} />
              <Row
                label="Move-out"
                value={bookingRow.end_date ? isoToHuman(bookingRow.end_date) : '—'}
              />
              <Row
                label="Estimated total"
                value={
                  bookingRow.total_price != null
                    ? formatUsd(Number(bookingRow.total_price))
                    : '—'
                }
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              Booking ID: <span className="font-mono">{bookingRow.id.slice(0, 8)}…</span>
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step === 'dates' && (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={goNext}
                disabled={!!datesError || !pricing.valid}
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </>
          )}
          {step === 'review' && (
            <>
              <Button variant="ghost" onClick={goBack} disabled={submitBooking.isPending}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
              {!user ? (
                <Button asChild>
                  <Link to={`/login?returnTo=/apartments/${apartment.id}`}>
                    Sign in to submit
                  </Link>
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitBooking.isPending}>
                  {submitBooking.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    'Submit booking request'
                  )}
                </Button>
              )}
            </>
          )}
          {step === 'success' && bookingRow && (
            <>
              <Button variant="ghost" onClick={closeAndReset}>
                Back to apartment
              </Button>
              <Button asChild>
                <Link to="/bookings">View booking</Link>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApartmentMiniSummary({
  apartment,
  minStay,
}: {
  apartment: Apartment;
  minStay: number;
}) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-1.5">
      <div className="flex items-start gap-2 text-sm">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <span className="line-clamp-1">{apartment.neighborhood}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Bed className="w-3 h-3" />
          {apartment.bedrooms ?? 1} BR · {apartment.bathrooms ?? 1} BA
        </span>
        {apartment.wifi_speed && (
          <span className="inline-flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            {apartment.wifi_speed} Mbps
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {minStay}d min
        </span>
      </div>
      {apartment.host_name && (
        <p className="text-xs text-muted-foreground">
          Host: <span className="text-foreground">{apartment.host_name}</span>
        </p>
      )}
    </div>
  );
}

function PricingPeek({
  pricing,
  priceMonthly,
}: {
  pricing: BookingPricingResult;
  priceMonthly: number;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-sm">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>{pricing.totalDays} days @ {formatUsd(priceMonthly)}/mo</span>
        <span>Estimated</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-base font-semibold">{formatUsd(pricing.total)}</span>
        <span className="text-xs text-muted-foreground">total</span>
      </div>
    </div>
  );
}

function PricingBreakdown({
  pricing,
  priceMonthly,
}: {
  pricing: BookingPricingResult;
  priceMonthly: number;
}) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-1 text-sm">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Estimated total</span>
        <span>{pricing.totalDays} days</span>
      </div>

      {pricing.fullMonths > 0 && (
        <Row
          label={`${pricing.fullMonths} × ${formatUsd(priceMonthly)}/mo`}
          value={formatUsd(pricing.monthlySubtotal)}
        />
      )}
      {pricing.remainderDays > 0 && (
        <Row
          label={`${pricing.remainderDays} day${pricing.remainderDays === 1 ? '' : 's'} prorate`}
          value={formatUsd(pricing.dailyProrate)}
        />
      )}
      <Row label="Cleaning fee" value={formatUsd(pricing.cleaningFee)} />
      <Separator className="my-1.5" />
      <Row
        label={<span className="font-semibold">Total estimated</span>}
        value={<span className="font-semibold">{formatUsd(pricing.total)}</span>}
      />
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}
