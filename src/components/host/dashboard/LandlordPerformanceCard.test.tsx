import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Suppress real-supabase side-effect imports from useLeads (transitively
// imported via the LandlordMetrics type module). The component itself
// is pure on `metrics` props — no Supabase call at runtime.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => Promise.resolve({ data: [] }) }) },
}));

import { LandlordPerformanceCard } from "./LandlordPerformanceCard";
import type { LandlordMetrics } from "@/hooks/host/useLandlordMetrics";

const BASE: LandlordMetrics = {
  total: 12,
  active: 3,
  replied: 7,
  archived: 2,
  newCount: 2,
  replyRatePct: 58,
  medianTtfrMs: 14 * 60 * 1000,
  windowDays: 30,
};

describe("LandlordPerformanceCard", () => {
  it("renders all 4 KPIs with values", () => {
    render(<LandlordPerformanceCard metrics={BASE} />);
    expect(screen.getByTestId("kpi-total-value")).toHaveTextContent("12");
    expect(screen.getByTestId("kpi-active-value")).toHaveTextContent("3");
    expect(screen.getByTestId("kpi-reply-rate-value")).toHaveTextContent("58%");
    expect(screen.getByTestId("kpi-ttfr-value")).toHaveTextContent("14 min");
  });

  it("shows 'X sin ver' sub when newCount > 0", () => {
    render(<LandlordPerformanceCard metrics={BASE} />);
    expect(screen.getByTestId("kpi-total-sub")).toHaveTextContent(/2 sin ver/);
  });

  it("shows 'todos vistos' when newCount === 0", () => {
    render(
      <LandlordPerformanceCard
        metrics={{ ...BASE, newCount: 0 }}
      />,
    );
    expect(screen.getByTestId("kpi-total-sub")).toHaveTextContent("todos vistos");
  });

  it("renders '—' for null reply rate (no leads with replies)", () => {
    render(
      <LandlordPerformanceCard
        metrics={{ ...BASE, replyRatePct: null, medianTtfrMs: null }}
      />,
    );
    expect(screen.getByTestId("kpi-reply-rate-value")).toHaveTextContent("—");
    expect(screen.getByTestId("kpi-ttfr-value")).toHaveTextContent("—");
  });

  it.each([
    [10, /subir a 25/],          // bad
    [30, /meta: 40/],             // ok
    [50, /excelente/],            // good
  ])("reply-rate sub for %s%% says %s", (pct, expected) => {
    render(
      <LandlordPerformanceCard
        metrics={{ ...BASE, replyRatePct: pct }}
      />,
    );
    expect(screen.getByTestId("kpi-reply-rate-sub")).toHaveTextContent(expected);
  });

  it.each([
    [3 * 60 * 60 * 1000, /súper rápido/],    // 3h → stretch
    [10 * 60 * 60 * 1000, /^ok$/],            // 10h → acceptable
    [20 * 60 * 60 * 1000, /más lento/],       // 20h → bad
  ])("ttfr sub for %sms says %s", (ms, expected) => {
    render(
      <LandlordPerformanceCard
        metrics={{ ...BASE, medianTtfrMs: ms }}
      />,
    );
    expect(screen.getByTestId("kpi-ttfr-sub")).toHaveTextContent(expected);
  });
});
