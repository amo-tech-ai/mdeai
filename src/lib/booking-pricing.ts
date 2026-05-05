/**
 * Pure pricing engine for apartment booking estimates.
 *
 * The MDEAI booking flow lets a renter pick (start, end) or (start, months)
 * and shows a clear breakdown:
 *
 *   monthly subtotal  = full months × price_monthly
 *   daily prorate     = remainder days × (price_monthly / 30)
 *   cleaning fee      = flat placeholder ($50) until the apartment row carries
 *                       a real value
 *   total estimate    = sum of the above
 *
 * "Estimated" is intentional — host confirmation is the source of truth for
 * the final amount. Use these numbers for the review screen and the
 * `bookings.total_price` value we record on submission.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30;
export const DEFAULT_CLEANING_FEE_USD = 50;

export interface BookingPricingInput {
  /** Apartment monthly price in USD. */
  priceMonthly: number;
  /** ISO date (YYYY-MM-DD). */
  startDate: string;
  /** ISO date (YYYY-MM-DD). */
  endDate: string;
  /** Override default cleaning fee — null/undefined uses default. */
  cleaningFee?: number | null;
}

export interface BookingPricingResult {
  totalDays: number;
  fullMonths: number;
  remainderDays: number;
  monthlySubtotal: number;
  dailyProrate: number;
  cleaningFee: number;
  total: number;
  /** True when input was usable; false → all numeric fields are 0. */
  valid: boolean;
}

const ZERO_RESULT: BookingPricingResult = {
  totalDays: 0,
  fullMonths: 0,
  remainderDays: 0,
  monthlySubtotal: 0,
  dailyProrate: 0,
  cleaningFee: 0,
  total: 0,
  valid: false,
};

/**
 * Days between two ISO date strings (end-exclusive). Negative or invalid
 * inputs return 0 so callers can render `0 days` cleanly without throwing.
 */
export function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(`${start}T00:00:00Z`).getTime();
  const e = new Date(`${end}T00:00:00Z`).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
  const diff = Math.round((e - s) / MS_PER_DAY);
  return diff > 0 ? diff : 0;
}

/**
 * Add `months × 30` days to an ISO date and return the new ISO date.
 * Used by the "stay for N months" picker as a quick-calc affordance.
 * Calendar months differ in length so this is intentionally approximate —
 * the host confirms the exact end date.
 */
export function addMonths(start: string, months: number): string {
  if (!start || !Number.isFinite(months) || months <= 0) return start;
  const s = new Date(`${start}T00:00:00Z`).getTime();
  if (!Number.isFinite(s)) return start;
  const next = new Date(s + months * DAYS_PER_MONTH * MS_PER_DAY);
  return next.toISOString().slice(0, 10);
}

export function calculateBookingPricing(
  input: BookingPricingInput,
): BookingPricingResult {
  const { priceMonthly, startDate, endDate } = input;
  const cleaningFee = Math.max(
    0,
    input.cleaningFee ?? DEFAULT_CLEANING_FEE_USD,
  );

  if (
    !Number.isFinite(priceMonthly) ||
    priceMonthly <= 0 ||
    !startDate ||
    !endDate
  ) {
    return ZERO_RESULT;
  }

  const totalDays = daysBetween(startDate, endDate);
  if (totalDays <= 0) return ZERO_RESULT;

  const fullMonths = Math.floor(totalDays / DAYS_PER_MONTH);
  const remainderDays = totalDays - fullMonths * DAYS_PER_MONTH;
  const monthlySubtotal = fullMonths * priceMonthly;
  const dailyRate = priceMonthly / DAYS_PER_MONTH;
  const dailyProrate = round2(remainderDays * dailyRate);
  const total = round2(monthlySubtotal + dailyProrate + cleaningFee);

  return {
    totalDays,
    fullMonths,
    remainderDays,
    monthlySubtotal: round2(monthlySubtotal),
    dailyProrate,
    cleaningFee: round2(cleaningFee),
    total,
    valid: true,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Format a USD amount as "$1,234" or "$1,234.50" depending on cents. */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  const hasCents = Math.round(n * 100) % 100 !== 0;
  return hasCents
    ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${Math.round(n).toLocaleString('en-US')}`;
}
