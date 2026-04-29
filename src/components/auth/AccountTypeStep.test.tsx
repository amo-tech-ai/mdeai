import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AccountTypeStep, type AccountType } from "./AccountTypeStep";

// AccountTypeStep is the gate at the top of the signup flow. It renders
// before any auth state is involved, so the only contract worth pinning
// down at the unit-test level is:
//   - Both options render (renter + landlord), each surfaced as a radio
//     so the radiogroup is keyboard-navigable.
//   - Clicking either option fires onSelect with the matching string
//     literal so the parent can branch to the email/password form.
//
// Visual layout, copy review, and routing behavior are verified in the
// browser preview workflow — JSDOM is the wrong place for that.

function renderInRouter(onSelect: (t: AccountType) => void) {
  return render(
    <MemoryRouter>
      <AccountTypeStep onSelect={onSelect} />
    </MemoryRouter>,
  );
}

describe("AccountTypeStep", () => {
  it("renders both account-type options as radios", () => {
    renderInRouter(vi.fn());
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);

    const dataAttrs = radios.map((r) => r.getAttribute("data-account-type"));
    expect(dataAttrs).toEqual(expect.arrayContaining(["renter", "landlord"]));
  });

  it("calls onSelect with 'renter' when the renter option is clicked", () => {
    const onSelect = vi.fn();
    renderInRouter(onSelect);
    fireEvent.click(screen.getByRole("radio", { name: /looking for a place/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("renter");
  });

  it("calls onSelect with 'landlord' when the landlord option is clicked", () => {
    const onSelect = vi.fn();
    renderInRouter(onSelect);
    fireEvent.click(screen.getByRole("radio", { name: /landlord or agent/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("landlord");
  });

  it("does NOT call onSelect when nothing is clicked (no auto-fire)", () => {
    const onSelect = vi.fn();
    renderInRouter(onSelect);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
