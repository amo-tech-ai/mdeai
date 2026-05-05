import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

import { useEventTickets } from "./useEventTickets";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc, children });
}

const SAMPLE_TIER = {
  id: "tier-1",
  name: "GA",
  description: "General Admission",
  price_cents: 40_000_00,
  currency: "COP",
  qty_total: 300,
  qty_sold: 1,
  qty_pending: 2,
  is_active: true,
  position: 0,
  min_per_order: 1,
  max_per_order: 10,
  sale_starts_at: null,
  sale_ends_at: null,
};

describe("useEventTickets", () => {
  beforeEach(() => fromMock.mockReset());

  it("returns tiers for an event", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [SAMPLE_TIER], error: null }),
    };
    fromMock.mockReturnValue(chain);

    const { result } = renderHook(() => useEventTickets("evt-1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe("GA");
    expect(result.current.data![0].qty_pending).toBe(2);
  });

  it("is disabled when eventId is undefined", () => {
    fromMock.mockReturnValue({ select: vi.fn().mockReturnThis() });
    const { result } = renderHook(() => useEventTickets(undefined), { wrapper });
    // Should be pending (not loading) when disabled
    expect(result.current.isPending).toBe(true);
    expect(result.current.isFetching).toBe(false);
  });

  it("surfaces errors", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: "RLS denied" } }),
    };
    fromMock.mockReturnValue(chain);

    const { result } = renderHook(() => useEventTickets("evt-1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeTruthy();
  });
});
