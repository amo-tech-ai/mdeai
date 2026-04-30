import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ListingCard } from "./ListingCard";
import type { OwnListingRow } from "@/hooks/host/useListings";

// ListingCard contract (D7):
//   - Status pill reflects (moderation_status × status) with the right label.
//   - "View public page" link only renders when listing is publicly visible
//     (moderation_status='approved' AND status='active').
//   - Rejection reason copy shows for rejected listings.
//   - Price formatter uses es-CO for COP, en-US for USD.

const BASE: OwnListingRow = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Bright 2-BR in El Poblado",
  neighborhood: "El Poblado",
  city: "Medellín",
  price_monthly: 4500000,
  currency: "COP",
  bedrooms: 2,
  bathrooms: 2,
  images: ["https://example.com/p1.jpg"],
  moderation_status: "approved",
  status: "active",
  rejection_reason: null,
  created_at: "2026-04-30T00:00:00Z",
  updated_at: "2026-04-30T00:00:00Z",
};

function renderCard(overrides: Partial<OwnListingRow>) {
  return render(
    <MemoryRouter>
      <ListingCard listing={{ ...BASE, ...overrides }} />
    </MemoryRouter>,
  );
}

describe("ListingCard", () => {
  it("renders Live status + public link for approved+active listings", () => {
    renderCard({});
    const status = screen.getByTestId("host-listing-status");
    expect(status).toHaveTextContent("Live");
    const publicLink = screen.getByTestId("host-listing-view-public");
    expect(publicLink).toHaveAttribute(
      "href",
      `/apartments/${BASE.id}`,
    );
  });

  it("shows In review pill for moderation_status='pending'", () => {
    renderCard({ moderation_status: "pending", status: "active" });
    expect(screen.getByTestId("host-listing-status")).toHaveTextContent(
      "In review",
    );
    // public link hidden
    expect(
      screen.queryByTestId("host-listing-view-public"),
    ).not.toBeInTheDocument();
  });

  it("shows Rejected pill + reason for moderation_status='rejected'", () => {
    renderCard({
      moderation_status: "rejected",
      status: "inactive",
      rejection_reason: "Photos look fake",
    });
    expect(screen.getByTestId("host-listing-status")).toHaveTextContent(
      "Rejected",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Photos look fake");
  });

  it("shows Booked pill when approved+booked", () => {
    renderCard({ moderation_status: "approved", status: "booked" });
    expect(screen.getByTestId("host-listing-status")).toHaveTextContent(
      "Booked",
    );
  });

  it("shows Hidden pill when approved+inactive", () => {
    renderCard({ moderation_status: "approved", status: "inactive" });
    expect(screen.getByTestId("host-listing-status")).toHaveTextContent(
      "Hidden",
    );
    expect(
      screen.queryByTestId("host-listing-view-public"),
    ).not.toBeInTheDocument();
  });

  it("formats COP price with es-CO dot-thousands separator", () => {
    renderCard({});
    // COP 4,500,000 → es-CO formats with dots: $4.500.000 COP
    expect(screen.getByText(/\$4\.500\.000 COP \/ mo/)).toBeInTheDocument();
  });

  it("formats USD price with en-US comma-thousands separator", () => {
    renderCard({ currency: "USD", price_monthly: 1500 });
    expect(screen.getByText(/\$1,500 USD \/ mo/)).toBeInTheDocument();
  });

  it("renders broken-image placeholder when images[] is empty", () => {
    renderCard({ images: [] });
    // No <img> rendered; status still shows
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("host-listing-status")).toBeInTheDocument();
  });

  it("renders D9 leads placeholder", () => {
    renderCard({});
    expect(screen.getByTestId("host-listing-leads")).toHaveTextContent(
      "— leads",
    );
  });
});
