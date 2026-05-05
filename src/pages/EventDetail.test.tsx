/**
 * EventDetail — ticket CTA branching tests (task 008).
 *
 * Contract:
 * 1. Event WITH internal ticket tiers → "Get Tickets" opens the booking wizard.
 * 2. Event with NO tiers but WITH ticket_url → window.open (external).
 * 3. Event with neither → sonner toast "Tickets coming soon".
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ---- Mock supabase (EventDetail reads events + useIsSaved) ----------------
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

// ---- Mock useEvent (the event data hook) ----------------------------------
const useEventMock = vi.fn();
vi.mock("@/hooks/useEvents", () => ({ useEvent: () => useEventMock() }));

// ---- Mock useEventTickets ------------------------------------------------
const useEventTicketsMock = vi.fn();
vi.mock("@/hooks/useEventTickets", () => ({
  useEventTickets: () => useEventTicketsMock(),
}));

// ---- Mock saved places hooks ---------------------------------------------
vi.mock("@/hooks/useSavedPlaces", () => ({
  useIsSaved: () => ({ data: false }),
  useToggleSave: () => ({ mutate: vi.fn(), isPending: false }),
}));

// ---- Mock useAuth --------------------------------------------------------
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

// ---- Mock EventBookingWizardPremium so we can detect dialog open ---------
vi.mock("@/components/bookings/EventBookingWizardPremium", () => ({
  EventBookingWizardPremium: () => <div data-testid="booking-wizard">Wizard open</div>,
}));

// ---- Mock sonner ---------------------------------------------------------
const toastMock = vi.fn();
vi.mock("sonner", () => ({ toast: (...args: unknown[]) => toastMock(...args) }));

// ---- Mock ThreePanelLayout (just render children) ------------------------
vi.mock("@/components/layout/ThreePanelLayout", () => ({
  ThreePanelLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import EventDetail from "./EventDetail";
import { createElement } from "react";

const BASE_EVENT = {
  id: "evt-1",
  name: "Reina de Antioquia 2026",
  description: "Beauty pageant finals",
  event_type: "culture",
  event_start_time: new Date(Date.now() + 86_400_000).toISOString(),
  event_end_time: null,
  address: "Hotel Intercontinental, Medellín",
  ticket_price_min: 80_000,
  ticket_price_max: 200_000,
  currency: "COP",
  ticket_url: null,
  primary_image_url: null,
  organizer_name: null,
  phone: null,
  email: null,
  website: null,
  status: "published",
};

const SAMPLE_TIER = {
  id: "tier-1",
  name: "GA",
  price_cents: 8_000_000,
  currency: "COP",
  qty_total: 100,
  qty_sold: 40,
  sort_order: 1,
};

function renderPage(eventId = "evt-1") {
  return render(
    <MemoryRouter initialEntries={[`/events/${eventId}`]}>
      <Routes>
        <Route path="/events/:id" element={createElement(EventDetail)} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EventDetail — Get Tickets CTA branching", () => {
  beforeEach(() => {
    toastMock.mockReset();
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("opens internal booking wizard when event has ticket tiers", async () => {
    useEventMock.mockReturnValue({
      data: BASE_EVENT,
      isLoading: false,
      error: null,
    });
    useEventTicketsMock.mockReturnValue({ data: [SAMPLE_TIER] });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Book Tickets")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Book Tickets"));

    await waitFor(() => {
      expect(screen.getByTestId("booking-wizard")).toBeInTheDocument();
    });
  });

  it("opens external URL when event has no tiers but has ticket_url", async () => {
    useEventMock.mockReturnValue({
      data: { ...BASE_EVENT, ticket_url: "https://ticketmaster.com/evt-1" },
      isLoading: false,
      error: null,
    });
    useEventTicketsMock.mockReturnValue({ data: [] });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Book Tickets")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Book Tickets"));

    expect(window.open).toHaveBeenCalledWith(
      "https://ticketmaster.com/evt-1",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("shows 'Tickets coming soon' toast when no tiers and no external URL", async () => {
    useEventMock.mockReturnValue({
      data: { ...BASE_EVENT, ticket_url: null },
      isLoading: false,
      error: null,
    });
    useEventTicketsMock.mockReturnValue({ data: [] });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Book Tickets")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Book Tickets"));

    expect(toastMock).toHaveBeenCalledWith("Tickets coming soon");
  });
});
