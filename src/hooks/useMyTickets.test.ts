import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, createElement } from "react";

// Mock supabase BEFORE importing the hook
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

// Mock useAuth so the hook can see a logged-in user
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-123" } }),
}));

import { useMyTickets, getTicketDisplayStatus } from "./useMyTickets";
import type { MyTicket } from "./useMyTickets";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc, children });
}

// ─── getTicketDisplayStatus unit tests ────────────────────────────────────────

const BASE_TICKET: MyTicket = {
  attendeeId: "att-1",
  orderId: "ord-1",
  orderShortId: "MDE-AAAA",
  orderStatus: "paid",
  attendeeName: "Camila Restrepo",
  attendeeEmail: "camila@test.co",
  qrToken: "tok-1",
  qrUsedAt: null,
  attendeeStatus: "active",
  tier: { id: "tier-1", name: "GA", price_cents: 40_000_00, currency: "COP" },
  event: {
    id: "evt-1",
    name: "Reina de Antioquia",
    event_start_time: new Date(Date.now() + 86_400_000).toISOString(), // tomorrow
    event_end_time: null,
    address: "El Poblado, Medellín",
    primary_image_url: null,
  },
  totalCents: 40_000_00,
  currency: "COP",
  createdAt: new Date().toISOString(),
};

describe("getTicketDisplayStatus", () => {
  it("returns 'active' for a paid ticket not yet scanned", () => {
    expect(getTicketDisplayStatus(BASE_TICKET)).toBe("active");
  });

  it("returns 'used' when qrUsedAt is set", () => {
    const t = { ...BASE_TICKET, qrUsedAt: new Date().toISOString() };
    expect(getTicketDisplayStatus(t)).toBe("used");
  });

  it("returns 'expired' when event has ended and ticket not scanned", () => {
    const t: MyTicket = {
      ...BASE_TICKET,
      event: {
        ...BASE_TICKET.event,
        event_start_time: new Date(Date.now() - 172_800_000).toISOString(),
        event_end_time: new Date(Date.now() - 86_400_000).toISOString(), // yesterday
      },
    };
    expect(getTicketDisplayStatus(t)).toBe("expired");
  });

  it("returns 'refunded' when attendeeStatus is refunded", () => {
    const t = { ...BASE_TICKET, attendeeStatus: "refunded" as const };
    expect(getTicketDisplayStatus(t)).toBe("refunded");
  });

  it("returns 'refunded' when orderStatus is refunded", () => {
    const t = { ...BASE_TICKET, orderStatus: "refunded" };
    expect(getTicketDisplayStatus(t)).toBe("refunded");
  });
});

// ─── useMyTickets integration test ────────────────────────────────────────────

const SAMPLE_ORDER = {
  id: "ord-1",
  event_id: "evt-1",
  ticket_id: "tier-1",
  quantity: 1,
  total_cents: 40_000_00,
  currency: "COP",
  status: "paid",
  short_id: "MDE-AAAA",
  created_at: new Date().toISOString(),
  events: {
    id: "evt-1",
    name: "Reina de Antioquia",
    event_start_time: new Date(Date.now() + 86_400_000).toISOString(),
    event_end_time: null,
    address: "El Poblado, Medellín",
    primary_image_url: null,
  },
  event_tickets: { id: "tier-1", name: "GA", price_cents: 40_000_00, currency: "COP" },
  event_attendees: [
    {
      id: "att-1",
      full_name: "Camila Restrepo",
      email: "camila@test.co",
      qr_token: "tok-abc",
      qr_used_at: null,
      status: "active",
    },
  ],
};

describe("useMyTickets", () => {
  beforeEach(() => fromMock.mockReset());

  it("flattens orders into per-attendee ticket rows", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [SAMPLE_ORDER], error: null }),
    };
    fromMock.mockReturnValue(chain);

    const { result } = renderHook(() => useMyTickets(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].attendeeId).toBe("att-1");
    expect(result.current.data![0].qrToken).toBe("tok-abc");
    expect(result.current.data![0].tier.name).toBe("GA");
  });

  it("surfaces a supabase error", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB down" } }),
    };
    fromMock.mockReturnValue(chain);

    const { result } = renderHook(() => useMyTickets(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });
});
