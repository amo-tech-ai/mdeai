import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Step1Basics } from "./Step1Basics";

// Step1 contract:
//   - All four fields render (display_name, kind radios, whatsapp_e164,
//     primary_neighborhood select).
//   - Submit BLOCKS until display_name and whatsapp_e164 pass validation.
//   - WhatsApp must be E.164 (+ + country code + 8-15 digits).
//   - On valid submit, onSubmit fires with the typed payload — neighborhood
//     defaults to null when not picked.
//
// We don't unit-test the network call here — that's covered by the
// integration layer (useLandlordOnboarding). This file only validates the
// form schema + the contract with the parent.

function setup() {
  const onSubmit = vi.fn();
  render(
    <MemoryRouter>
      <Step1Basics onSubmit={onSubmit} />
    </MemoryRouter>,
  );
  return { onSubmit };
}

describe("Step1Basics", () => {
  it("renders display_name, kind radios, whatsapp, and neighborhood fields", () => {
    setup();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByText(/single owner/i)).toBeInTheDocument();
    expect(screen.getByText(/real-estate agent/i)).toBeInTheDocument();
    expect(screen.getByText(/property manager/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/whatsapp number/i)).toBeInTheDocument();
    expect(screen.getByText(/primary neighborhood/i)).toBeInTheDocument();
  });

  it("rejects an invalid WhatsApp number", async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "Maria Hernández" },
    });
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), {
      target: { value: "not-a-number" },
    });
    fireEvent.click(screen.getByTestId("step1-submit"));
    await waitFor(() => {
      expect(screen.getByText(/international format/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects an empty display_name", async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), {
      target: { value: "+573001234567" },
    });
    fireEvent.click(screen.getByTestId("step1-submit"));
    await waitFor(() => {
      expect(
        screen.getByText(/add a name we can show to renters/i),
      ).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with normalised payload when valid", async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "  Maria Hernández  " },
    });
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), {
      target: { value: "+573001234567" },
    });
    fireEvent.click(screen.getByTestId("step1-submit"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const [payload] = onSubmit.mock.calls[0];
    expect(payload).toMatchObject({
      display_name: "Maria Hernández",
      kind: "individual",
      whatsapp_e164: "+573001234567",
      primary_neighborhood: null,
    });
  });

  it("disables submit while isSubmitting=true", () => {
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <Step1Basics onSubmit={onSubmit} isSubmitting />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("step1-submit")).toBeDisabled();
  });

  it("shows the supplied error message in an alert", () => {
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <Step1Basics onSubmit={onSubmit} errorMessage="DB exploded" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("DB exploded");
  });
});
