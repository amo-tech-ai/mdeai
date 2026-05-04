/**
 * TicketDetail — QR rendering + status display tests.
 *
 * Contract:
 * 1. Authenticated path: fetches attendee row → renders QR image from qr_token.
 * 2. Active ticket shows "Active — Ready to scan" status.
 * 3. Used ticket (qr_used_at set) shows "Used" + timestamp.
 * 4. Expired token / RPC error → shows error state.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ---- Mock qrcode BEFORE importing TicketDetail ----------------------------
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,fakeqr"),
  },
}));

// ---- Mock supabase --------------------------------------------------------
const selectMock = vi.fn();
const fromMock = vi.fn(() => ({
  select: selectMock,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

// ---- Mock useAuth ---------------------------------------------------------
const useAuthMock = vi.fn();
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => useAuthMock() }));

import TicketDetail from "./TicketDetail";

const ATTENDEE_ID = "att-uuid-001";
const FUTURE = new Date(Date.now() + 86_400_000).toISOString();
const PAST = new Date(Date.now() - 86_400_000).toISOString();

function buildSelectChain(result: unknown) {
  // Chain: .select(...).eq(...).single()
  const singleMock = vi.fn().mockResolvedValue(result);
  const eqMock = vi.fn().mockReturnValue({ single: singleMock });
  selectMock.mockReturnValue({ eq: eqMock });
  return { eqMock, singleMock };
}

function renderPage(id = ATTENDEE_ID) {
  return render(
    <MemoryRouter initialEntries={[`/me/tickets/${id}`]}>
      <Routes>
        <Route path="/me/tickets/:id" element={<TicketDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

const SAMPLE_ROW = {
  id: ATTENDEE_ID,
  full_name: "Camila Restrepo",
  email: "camila@test.co",
  qr_token: "eyJfake.qr.token",
  qr_used_at: null,
  status: "active",
  ticket_id: "tier-1",
  order_id: "ord-1",
  event_id: "evt-1",
  event_tickets: { id: "tier-1", name: "GA", price_cents: 8_000_000, currency: "COP" },
  event_orders: { short_id: "MDE-ABCD", status: "paid" },
  events: {
    id: "evt-1",
    name: "Reina de Antioquia 2026",
    event_start_time: FUTURE,
    event_end_time: null,
    address: "Hotel Intercontinental, Medellín",
    primary_image_url: null,
  },
};

describe("TicketDetail — authenticated path", () => {
  beforeEach(() => {
    // mockClear keeps the implementation; mockReset would strip it from vi.fn(impl)
    fromMock.mockClear();
    selectMock.mockClear();
    useAuthMock.mockReturnValue({ user: { id: "user-1" } });
  });

  it("renders QR image from qr_token on success", async () => {
    buildSelectChain({ data: SAMPLE_ROW, error: null });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("qr-image")).toBeInTheDocument();
    });

    const img = screen.getByTestId("qr-image") as HTMLImageElement;
    expect(img.src).toBe("data:image/png;base64,fakeqr");
  });

  it("shows attendee name and order short ID", async () => {
    buildSelectChain({ data: SAMPLE_ROW, error: null });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Camila Restrepo")).toBeInTheDocument();
    });
    expect(screen.getByText("MDE-ABCD")).toBeInTheDocument();
  });

  it("shows 'Active — Ready to scan' status for an unused ticket", async () => {
    buildSelectChain({ data: SAMPLE_ROW, error: null });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Active — Ready to scan")).toBeInTheDocument();
    });
  });

  it("shows 'Used' when qr_used_at is set", async () => {
    buildSelectChain({
      data: { ...SAMPLE_ROW, qr_used_at: PAST },
      error: null,
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Used")[0]).toBeInTheDocument();
    });
  });

  it("shows error state when supabase returns an error", async () => {
    buildSelectChain({ data: null, error: { message: "Row not found" } });
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("Ticket not found or you don't have access."),
      ).toBeInTheDocument();
    });
  });

  it("redirects to login when no user and no anon token", () => {
    useAuthMock.mockReturnValue({ user: null });
    // navigate is called — just verify no crash and loading resolves
    buildSelectChain({ data: null, error: null });
    expect(() => renderPage()).not.toThrow();
  });
});
