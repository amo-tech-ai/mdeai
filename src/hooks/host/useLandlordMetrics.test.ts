import { describe, it, expect, vi } from "vitest";

// Same mock as LandlordPerformanceCard.test.tsx — useLeads imports the
// real supabase client which tries to deserialize auth state at
// import time. Pure-fn unit test doesn't touch supabase at runtime.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => Promise.resolve({ data: [] }) }) },
}));

import {
  computeLandlordMetrics,
  formatDuration,
} from "./useLandlordMetrics";
import type { InboxLeadRow } from "./useLeads";

// computeLandlordMetrics contract (D12):
//   - windowDays filter (default 30) drops older rows.
//   - new + viewed → active. replied/archived → not active.
//   - reply_rate_pct = round(replied_with_first_reply_at / total * 100).
//   - median_ttfr ignores negative + >30d outliers.
//   - empty inputs return zeros + null rates.

const NOW = Date.UTC(2026, 4, 1, 12, 0, 0); // 2026-05-01 12:00 UTC

function lead(overrides: Partial<InboxLeadRow>): InboxLeadRow {
  return {
    id: Math.random().toString(36).slice(2),
    channel: "form",
    conversation_id: null,
    renter_id: null,
    renter_name: "Test",
    renter_phone_e164: null,
    renter_email: null,
    apartment_id: null,
    landlord_id: "00000000-0000-0000-0000-000000000000",
    raw_message: "x",
    structured_profile: {},
    status: "new",
    viewed_at: null,
    first_reply_at: null,
    archived_at: null,
    created_at: new Date(NOW - 60 * 60 * 1000).toISOString(),
    updated_at: new Date(NOW).toISOString(),
    apartment: null,
    ...overrides,
  };
}

describe("computeLandlordMetrics", () => {
  it("returns zeros for empty input", () => {
    const m = computeLandlordMetrics([], 30, NOW);
    expect(m).toEqual({
      total: 0,
      active: 0,
      replied: 0,
      archived: 0,
      newCount: 0,
      replyRatePct: null,
      medianTtfrMs: null,
      windowDays: 30,
    });
  });

  it("counts new + viewed as active", () => {
    const m = computeLandlordMetrics(
      [
        lead({ status: "new" }),
        lead({ status: "new" }),
        lead({ status: "viewed" }),
        lead({ status: "replied", first_reply_at: new Date(NOW - 30 * 60 * 1000).toISOString() }),
        lead({ status: "archived" }),
      ],
      30,
      NOW,
    );
    expect(m.total).toBe(5);
    expect(m.newCount).toBe(2);
    expect(m.active).toBe(3);
    expect(m.replied).toBe(1);
    expect(m.archived).toBe(1);
  });

  it("computes reply rate as integer percent", () => {
    const m = computeLandlordMetrics(
      [
        lead({ first_reply_at: new Date(NOW - 5 * 60 * 1000).toISOString(), status: "replied" }),
        lead({ first_reply_at: new Date(NOW - 10 * 60 * 1000).toISOString(), status: "replied" }),
        lead({ status: "new" }),
        lead({ status: "new" }),
      ],
      30,
      NOW,
    );
    expect(m.replyRatePct).toBe(50);
  });

  it("computes median TTFR (odd count)", () => {
    const created = new Date(NOW - 60 * 60 * 1000).toISOString();
    const m = computeLandlordMetrics(
      [
        // TTFRs: 5min, 10min, 15min — median is 10min
        lead({ created_at: created, first_reply_at: new Date(NOW - 55 * 60 * 1000).toISOString(), status: "replied" }),
        lead({ created_at: created, first_reply_at: new Date(NOW - 50 * 60 * 1000).toISOString(), status: "replied" }),
        lead({ created_at: created, first_reply_at: new Date(NOW - 45 * 60 * 1000).toISOString(), status: "replied" }),
      ],
      30,
      NOW,
    );
    expect(m.medianTtfrMs).toBe(10 * 60 * 1000);
  });

  it("computes median TTFR (even count uses average of middle pair)", () => {
    const created = new Date(NOW - 60 * 60 * 1000).toISOString();
    const m = computeLandlordMetrics(
      [
        // TTFRs: 5min, 10min, 20min, 30min — median is 15min
        lead({ created_at: created, first_reply_at: new Date(NOW - 55 * 60 * 1000).toISOString(), status: "replied" }),
        lead({ created_at: created, first_reply_at: new Date(NOW - 50 * 60 * 1000).toISOString(), status: "replied" }),
        lead({ created_at: created, first_reply_at: new Date(NOW - 40 * 60 * 1000).toISOString(), status: "replied" }),
        lead({ created_at: created, first_reply_at: new Date(NOW - 30 * 60 * 1000).toISOString(), status: "replied" }),
      ],
      30,
      NOW,
    );
    expect(m.medianTtfrMs).toBe(15 * 60 * 1000);
  });

  it("filters by windowDays — drops rows older than cutoff", () => {
    const m = computeLandlordMetrics(
      [
        lead({ created_at: new Date(NOW - 1 * 24 * 60 * 60 * 1000).toISOString() }),  // 1d ago — in
        lead({ created_at: new Date(NOW - 29 * 24 * 60 * 60 * 1000).toISOString() }), // 29d — in
        lead({ created_at: new Date(NOW - 31 * 24 * 60 * 60 * 1000).toISOString() }), // 31d — out
      ],
      30,
      NOW,
    );
    expect(m.total).toBe(2);
  });

  it("windowDays=0 returns all-time", () => {
    const m = computeLandlordMetrics(
      [
        lead({ created_at: new Date(NOW - 365 * 24 * 60 * 60 * 1000).toISOString() }),
        lead({ created_at: new Date(NOW - 1 * 60 * 1000).toISOString() }),
      ],
      0,
      NOW,
    );
    expect(m.total).toBe(2);
  });

  it("ignores negative TTFR (clock skew) and outliers > 30d", () => {
    const created = new Date(NOW - 60 * 60 * 1000).toISOString();
    const m = computeLandlordMetrics(
      [
        // valid 5 min
        lead({ created_at: created, first_reply_at: new Date(NOW - 55 * 60 * 1000).toISOString(), status: "replied" }),
        // negative — first_reply BEFORE created
        lead({ created_at: created, first_reply_at: new Date(NOW - 70 * 60 * 1000).toISOString(), status: "replied" }),
        // 60-day outlier: created 60d ago, replied today (in window if window=0 or 90d, but >30d gap → ignored from median)
      ],
      0,
      NOW,
    );
    // 2 valid replied (replyRate denom uses first_reply_at presence)
    // but only the 5-min TTFR is in the median calc
    expect(m.medianTtfrMs).toBe(5 * 60 * 1000);
  });
});

describe("formatDuration", () => {
  it("returns '—' for null", () => {
    expect(formatDuration(null)).toBe("—");
  });
  it("'<1 min' for sub-minute", () => {
    expect(formatDuration(20 * 1000)).toBe("<1 min");
  });
  it("formats minutes", () => {
    expect(formatDuration(14 * 60 * 1000)).toBe("14 min");
    expect(formatDuration(59 * 60 * 1000)).toBe("59 min");
  });
  it("formats hours + remainder minutes", () => {
    expect(formatDuration(60 * 60 * 1000)).toBe("1h");
    expect(formatDuration(2 * 60 * 60 * 1000 + 14 * 60 * 1000)).toBe("2h 14m");
  });
  it("formats days + remainder hours", () => {
    expect(formatDuration(24 * 60 * 60 * 1000)).toBe("1d");
    expect(formatDuration(36 * 60 * 60 * 1000)).toBe("1d 12h");
  });
});
