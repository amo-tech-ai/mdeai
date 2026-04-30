import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Mock supabase BEFORE importing modal so the real client's auth init
// doesn't fire. Same pattern as upload-listing-photo.test.ts.
const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

vi.mock("@/hooks/useAnonSession", () => ({
  useAnonSession: () => ({
    anonSessionId: "test-session-abc",
    reset: () => {},
  }),
}));

vi.mock("@/lib/posthog", () => ({
  trackEvent: vi.fn(),
}));

import { WhatsAppContactModal } from "./WhatsAppContactModal";

const APARTMENT = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Bright 2-BR in Provenza",
  neighborhood: "El Poblado",
};

function renderModal(open = true) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onChange = vi.fn();
  const utils = render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <WhatsAppContactModal
          open={open}
          onOpenChange={onChange}
          apartment={APARTMENT}
          hostFirstName="Mario"
        />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return { ...utils, onChange };
}

describe("WhatsAppContactModal", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    // window.open returns null by default in jsdom; spy so we assert on it.
    vi.spyOn(window, "open").mockReturnValue(null);
  });

  it("renders the form step with title, name, when, message, send button", () => {
    renderModal();
    expect(screen.getByText("Contact Mario")).toBeInTheDocument();
    expect(screen.getByText(APARTMENT.title)).toBeInTheDocument();
    expect(screen.getByTestId("contact-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("contact-when-now")).toBeInTheDocument();
    expect(screen.getByTestId("contact-when-soon")).toBeInTheDocument();
    expect(screen.getByTestId("contact-when-later")).toBeInTheDocument();
    expect(screen.getByTestId("contact-message-input")).toBeInTheDocument();
    expect(screen.getByTestId("contact-send-btn")).toBeInTheDocument();
  });

  it("disables the send button until name is filled", () => {
    renderModal();
    const send = screen.getByTestId("contact-send-btn") as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByTestId("contact-name-input"), {
      target: { value: "Sofia" },
    });
    expect(send.disabled).toBe(false);
  });

  it("submits payload with anon_session_id and opens whatsapp on success", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          lead_id: "lead-1",
          whatsapp_e164: "+573001234567",
          landlord_display_name: "Mario T.",
          apartment: {
            id: APARTMENT.id,
            title: APARTMENT.title,
            neighborhood: APARTMENT.neighborhood,
          },
        },
      },
      error: null,
    });

    renderModal();
    fireEvent.change(screen.getByTestId("contact-name-input"), {
      target: { value: "Sofia" },
    });
    fireEvent.click(screen.getByTestId("contact-when-now"));
    fireEvent.change(screen.getByTestId("contact-message-input"), {
      target: { value: "Is parking included?" },
    });
    fireEvent.click(screen.getByTestId("contact-send-btn"));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("lead-from-form", {
        body: expect.objectContaining({
          apartment_id: APARTMENT.id,
          name: "Sofia",
          move_when: "now",
          message: "Is parking included?",
          anon_session_id: "test-session-abc",
        }),
      });
    });

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/wa\.me\/573001234567\?text=/),
        "_blank",
        "noopener,noreferrer",
      );
    });
  });

  it("surfaces the rate-limit error from the edge fn", async () => {
    invokeMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Edge fn returned non-2xx",
        context: {
          json: async () => ({
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Too many inquiries from this network. Wait 15 minutes.",
            },
          }),
        },
      },
    });

    renderModal();
    fireEvent.change(screen.getByTestId("contact-name-input"), {
      target: { value: "Sofia" },
    });
    fireEvent.click(screen.getByTestId("contact-send-btn"));

    await waitFor(() => {
      const err = screen.getByTestId("contact-host-error");
      expect(err).toHaveTextContent(/Too many inquiries/);
    });
  });

  it("ignores submissions where the honeypot is filled (still POSTs but server suppresses)", async () => {
    // Honeypot is hidden visually, but we exercise the field directly.
    // The edge fn returns 200 with suppressed:true; the hook converts to a
    // SUPPRESSED error so the UI doesn't reveal the trap.
    invokeMock.mockResolvedValueOnce({
      data: { success: true, data: { suppressed: true } },
      error: null,
    });

    renderModal();
    fireEvent.change(screen.getByTestId("contact-name-input"), {
      target: { value: "Botty McBotface" },
    });
    fireEvent.change(
      screen.getByLabelText(/Don.?t fill this in/i, { selector: "input" }),
      { target: { value: "http://spam.example" } },
    );
    fireEvent.click(screen.getByTestId("contact-send-btn"));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalled();
    });
    // The error path renders a generic message; window.open should NOT
    // have been called (no real lead → no WhatsApp redirect).
    expect(window.open).not.toHaveBeenCalled();
  });
});
