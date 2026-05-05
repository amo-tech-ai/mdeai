import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LeadCard } from "./LeadCard";
import type { InboxLeadRow } from "@/hooks/host/useLeads";

// LeadCard contract (D9):
//   - Status pill matches the row's status (new / viewed / replied / archived).
//   - Channel pill labels chat/form/whatsapp.
//   - move_when tag renders only when present in structured_profile.
//   - Apartment context falls back to structured_profile when join is null
//     (form-channel leads from D7.5).
//   - Click + Enter + Space all fire onClick.

const BASE: InboxLeadRow = {
  id: "11111111-1111-1111-1111-111111111111",
  channel: "form",
  conversation_id: null,
  renter_id: null,
  renter_name: "Sofia",
  renter_phone_e164: null,
  renter_email: null,
  apartment_id: "22222222-2222-2222-2222-222222222222",
  landlord_id: "33333333-3333-3333-3333-333333333333",
  raw_message: "Is parking included? Also looking for pet-friendly buildings.",
  structured_profile: {
    source: "contact-host-form",
    move_when: "now",
    renter_name: "Sofia",
    apartment_title: "Bright 2-BR",
    apartment_neighborhood: "El Poblado",
  },
  status: "new",
  viewed_at: null,
  first_reply_at: null,
  archived_at: null,
  created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  apartment: {
    id: "22222222-2222-2222-2222-222222222222",
    title: "Bright 2-BR in Provenza",
    neighborhood: "El Poblado",
  },
};

function renderCard(overrides: Partial<InboxLeadRow> = {}, onClick?: (id: string) => void) {
  return render(<LeadCard lead={{ ...BASE, ...overrides }} onClick={onClick} />);
}

describe("LeadCard", () => {
  it("renders New pill + primary accent for status='new'", () => {
    renderCard();
    expect(screen.getByTestId("lead-status-pill")).toHaveTextContent("New");
    const card = screen.getByTestId("lead-card");
    expect(card).toHaveAttribute("data-lead-status", "new");
  });

  it.each([
    ["viewed", "Viewed"],
    ["replied", "Replied"],
    ["archived", "Archived"],
  ] as const)("renders %s status pill correctly", (status, label) => {
    renderCard({ status });
    expect(screen.getByTestId("lead-status-pill")).toHaveTextContent(label);
  });

  it("shows joined apartment title when present", () => {
    renderCard();
    expect(screen.getByTestId("lead-apartment")).toHaveTextContent(
      "Bright 2-BR in Provenza · El Poblado",
    );
  });

  it("falls back to structured_profile when apartment join is null", () => {
    renderCard({ apartment: null });
    expect(screen.getByTestId("lead-apartment")).toHaveTextContent(
      "Bright 2-BR · El Poblado",
    );
  });

  it("falls back to '(unknown listing)' when neither join nor structured_profile has the title", () => {
    renderCard({
      apartment: null,
      structured_profile: { source: "x" },
    });
    expect(screen.getByTestId("lead-apartment")).toHaveTextContent(
      "(unknown listing)",
    );
  });

  it("shows Anonymous when renter_name is null", () => {
    renderCard({ renter_name: null, structured_profile: {} });
    expect(screen.getByTestId("lead-renter-name")).toHaveTextContent(
      "Anonymous",
    );
  });

  it.each([
    ["form", "Form"],
    ["chat", "Chat"],
    ["whatsapp", "WhatsApp"],
  ] as const)("renders channel=%s label %s", (channel, label) => {
    renderCard({ channel });
    expect(screen.getByTestId("lead-channel")).toHaveTextContent(label);
  });

  it("renders move_when pill when present in structured_profile", () => {
    renderCard();
    expect(screen.getByTestId("lead-move-when")).toHaveTextContent("Moving Now");
  });

  it("hides move_when pill when not in structured_profile", () => {
    renderCard({ structured_profile: { source: "x" } });
    expect(screen.queryByTestId("lead-move-when")).not.toBeInTheDocument();
  });

  it("truncates raw_message > 140 chars with ellipsis", () => {
    const long = "x".repeat(200);
    renderCard({ raw_message: long });
    const snippet = screen.getByTestId("lead-message-snippet").textContent ?? "";
    expect(snippet.endsWith("…")).toBe(true);
    expect(snippet.length).toBeLessThan(200);
  });

  it("renders relative time stamp", () => {
    renderCard();
    expect(screen.getByTestId("lead-timestamp")).toHaveTextContent(/m ago/);
  });

  it("fires onClick when card is clicked", () => {
    const cb = vi.fn();
    renderCard({}, cb);
    fireEvent.click(screen.getByTestId("lead-card"));
    expect(cb).toHaveBeenCalledWith(BASE.id);
  });

  it("fires onClick on Enter + Space keys", () => {
    const cb = vi.fn();
    renderCard({}, cb);
    const card = screen.getByTestId("lead-card");
    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyDown(card, { key: " " });
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("is not interactive when onClick is omitted", () => {
    renderCard();
    const card = screen.getByTestId("lead-card");
    expect(card).not.toHaveAttribute("role", "button");
    expect(card).not.toHaveAttribute("tabindex");
  });
});
