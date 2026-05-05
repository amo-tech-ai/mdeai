import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";

const rpcMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}));

import { useEventAttendees } from "./useEventAttendees";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc, children });
}

const SAMPLE: import("./useEventAttendees").AttendeeRow = {
  id: "att-1",
  full_name: "Camila Restrepo",
  email: "camila@test.co",
  status: "active",
  qr_used_at: null,
  tier_name: "GA",
  purchase_time: new Date().toISOString(),
  order_short_id: "MDE-AAAA",
  stripe_payment_intent: null,
};

describe("useEventAttendees", () => {
  beforeEach(() => rpcMock.mockReset());

  it("returns paginated rows on success", async () => {
    rpcMock.mockResolvedValue({ data: { total: 1, rows: [SAMPLE] }, error: null });
    const { result } = renderHook(() => useEventAttendees("evt-1", "", 0), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.rows[0].full_name).toBe("Camila Restrepo");
  });

  it("passes search + pagination params to the RPC", async () => {
    rpcMock.mockResolvedValue({ data: { total: 0, rows: [] }, error: null });
    renderHook(() => useEventAttendees("evt-1", "camila", 2, 25), { wrapper });
    await waitFor(() => rpcMock.mock.calls.length > 0);
    expect(rpcMock).toHaveBeenCalledWith("event_attendees_paginated", {
      p_event_id: "evt-1",
      p_search: "camila",
      p_limit: 25,
      p_offset: 50,
    });
  });

  it("is disabled when eventId is undefined", () => {
    renderHook(() => useEventAttendees(undefined, "", 0), { wrapper });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("surfaces supabase errors", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "DB error" } });
    const { result } = renderHook(() => useEventAttendees("evt-1", "", 0), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });
});
