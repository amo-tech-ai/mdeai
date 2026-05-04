import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";

// Mock supabase client BEFORE importing the hook so the import-time singleton
// in `@/integrations/supabase/client` doesn't try to talk to the real server.
const rpcMock = vi.fn();
const channelMock = vi.fn(() => {
  const chain = {
    on: vi.fn(() => chain),
    subscribe: vi.fn(() => chain),
  };
  return chain;
});
const removeChannelMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    channel: (...args: unknown[]) => channelMock(...args),
    removeChannel: (...args: unknown[]) => removeChannelMock(...args),
  },
}));

import { useEventDashboard } from "./useEventDashboard";

function wrapper({ children }: { children: ReactNode }) {
  // Always-fresh client per test → no leaked cached responses across tests.
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: qc, children });
}

describe("useEventDashboard", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    channelMock.mockClear();
    removeChannelMock.mockClear();
  });

  it("returns the RPC payload on success", async () => {
    const sample = {
      event: { id: "evt-1", name: "x", status: "published", staff_link_version: 2 },
      kpis: { tickets_sold: 4, checked_in: 2, no_shows: 0 },
      revenue_cents: 28_000_000,
      tiers: [],
      recent_check_ins: [],
    };
    rpcMock.mockResolvedValueOnce({ data: sample, error: null });

    const { result } = renderHook(() => useEventDashboard("evt-1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(rpcMock).toHaveBeenCalledWith("event_dashboard_summary", { p_event_id: "evt-1" });
    expect(result.current.data?.kpis.tickets_sold).toBe(4);
    expect(result.current.data?.revenue_cents).toBe(28_000_000);
    expect(result.current.forbidden).toBe(false);
  });

  it("flips `forbidden=true` on NOT_ORGANIZER", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "NOT_ORGANIZER", code: "P0001" },
    });

    const { result } = renderHook(() => useEventDashboard("evt-2"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.forbidden).toBe(true);
    // forbidden swallows the error so the page renders the friendly 403 state.
    expect(result.current.error).toBe(null);
  });

  it("surfaces non-NOT_ORGANIZER errors verbatim", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "PostgREST timeout", code: "57014" },
    });

    const { result } = renderHook(() => useEventDashboard("evt-3"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.forbidden).toBe(false);
    expect(result.current.error?.message).toBe("PostgREST timeout");
  });

  it("subscribes to 3 postgres_changes channels for the event", async () => {
    rpcMock.mockResolvedValue({
      data: {
        event: { id: "evt-4" },
        kpis: { tickets_sold: 0, checked_in: 0, no_shows: 0 },
        revenue_cents: 0,
        tiers: [],
        recent_check_ins: [],
      },
      error: null,
    });

    renderHook(() => useEventDashboard("evt-4"), { wrapper });

    // Channel topic must include the event id so subscribers don't cross-subscribe.
    expect(channelMock).toHaveBeenCalledWith("host-event-dashboard:evt-4");
  });

  it("noop when eventId is undefined (does not call RPC)", async () => {
    renderHook(() => useEventDashboard(undefined), { wrapper });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
