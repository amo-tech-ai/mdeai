import { describe, it, expect } from 'vitest';
import {
  addMonths,
  calculateBookingPricing,
  daysBetween,
  formatUsd,
  DEFAULT_CLEANING_FEE_USD,
} from './booking-pricing';

describe('daysBetween', () => {
  it('returns the correct day count for whole-month range', () => {
    expect(daysBetween('2026-05-01', '2026-05-31')).toBe(30);
  });

  it('returns 0 for invalid input', () => {
    expect(daysBetween('', '2026-05-31')).toBe(0);
    expect(daysBetween('2026-05-01', '')).toBe(0);
    expect(daysBetween('2026-05-31', '2026-05-01')).toBe(0); // reversed
    expect(daysBetween('not-a-date', '2026-05-31')).toBe(0);
  });
});

describe('addMonths', () => {
  it('adds 30 days per month', () => {
    expect(addMonths('2026-05-01', 1)).toBe('2026-05-31');
    expect(addMonths('2026-05-01', 3)).toBe('2026-07-30');
  });

  it('returns input unchanged for invalid args', () => {
    expect(addMonths('', 3)).toBe('');
    expect(addMonths('2026-05-01', 0)).toBe('2026-05-01');
    expect(addMonths('2026-05-01', -1)).toBe('2026-05-01');
  });
});

describe('calculateBookingPricing', () => {
  it('computes a clean 1-month rental', () => {
    const r = calculateBookingPricing({
      priceMonthly: 1000,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    });
    expect(r.valid).toBe(true);
    expect(r.totalDays).toBe(30);
    expect(r.fullMonths).toBe(1);
    expect(r.remainderDays).toBe(0);
    expect(r.monthlySubtotal).toBe(1000);
    expect(r.dailyProrate).toBe(0);
    expect(r.cleaningFee).toBe(DEFAULT_CLEANING_FEE_USD);
    expect(r.total).toBe(1000 + DEFAULT_CLEANING_FEE_USD);
  });

  it('prorates partial month with daily rate', () => {
    // 35 days = 1 month + 5 days; daily = 1000/30 ≈ 33.33; 5 * 33.33 = 166.67
    const r = calculateBookingPricing({
      priceMonthly: 1000,
      startDate: '2026-05-01',
      endDate: '2026-06-05',
    });
    expect(r.valid).toBe(true);
    expect(r.totalDays).toBe(35);
    expect(r.fullMonths).toBe(1);
    expect(r.remainderDays).toBe(5);
    expect(r.monthlySubtotal).toBe(1000);
    // 5 * (1000/30) = 166.6666… → rounds to 166.67
    expect(r.dailyProrate).toBeCloseTo(166.67, 2);
    expect(r.total).toBeCloseTo(1000 + 166.67 + DEFAULT_CLEANING_FEE_USD, 2);
  });

  it('handles 3 months exactly', () => {
    const r = calculateBookingPricing({
      priceMonthly: 1500,
      startDate: '2026-05-01',
      endDate: addMonths('2026-05-01', 3),
    });
    expect(r.fullMonths).toBe(3);
    expect(r.remainderDays).toBe(0);
    expect(r.monthlySubtotal).toBe(4500);
    expect(r.total).toBe(4500 + DEFAULT_CLEANING_FEE_USD);
  });

  it('treats invalid input as not-yet-fillable (zero result)', () => {
    expect(calculateBookingPricing({ priceMonthly: 0, startDate: '2026-05-01', endDate: '2026-05-31' }).valid).toBe(false);
    expect(calculateBookingPricing({ priceMonthly: 1000, startDate: '', endDate: '2026-05-31' }).valid).toBe(false);
    expect(calculateBookingPricing({ priceMonthly: 1000, startDate: '2026-05-31', endDate: '2026-05-01' }).valid).toBe(false);
  });

  it('respects an explicit cleaningFee override (including 0)', () => {
    const r = calculateBookingPricing({
      priceMonthly: 1000,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      cleaningFee: 0,
    });
    expect(r.cleaningFee).toBe(0);
    expect(r.total).toBe(1000);
  });
});

describe('formatUsd', () => {
  it('omits decimals for whole dollars', () => {
    expect(formatUsd(1000)).toBe('$1,000');
    expect(formatUsd(0)).toBe('$0');
  });

  it('shows two decimals when there are cents', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50');
    expect(formatUsd(99.99)).toBe('$99.99');
  });

  it('handles non-finite gracefully', () => {
    expect(formatUsd(NaN)).toBe('$0');
    expect(formatUsd(Infinity)).toBe('$0');
  });
});
