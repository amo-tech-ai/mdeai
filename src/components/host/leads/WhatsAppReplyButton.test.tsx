import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WhatsAppReplyButton } from "./WhatsAppReplyButton";

// WhatsAppReplyButton contract (D10):
//   - With renter phone: button label "Responder a <FirstName> en WhatsApp",
//     clicking opens wa.me/<phone> with prefilled Spanish message.
//   - Without renter phone: button label "Abrir WhatsApp", clicking opens
//     bare wa.me/, plus a hint paragraph appears.
//   - onSent callback fires after click (the mark-as-replied trigger).
//   - Disabled prop disables the button.

describe("WhatsAppReplyButton", () => {
  beforeEach(() => {
    vi.spyOn(window, "open").mockReturnValue(null);
  });

  it("with phone — renders 'Responder a <name>' label", () => {
    render(
      <WhatsAppReplyButton
        renterPhone="+573001234567"
        renterName="Sofia Sandoval"
        apartmentTitle="Bright 2-BR"
      />,
    );
    expect(screen.getByTestId("whatsapp-reply-btn")).toHaveTextContent(
      "Responder a Sofia en WhatsApp",
    );
    // No "find in your chats" hint when phone is present
    expect(screen.queryByTestId("whatsapp-reply-hint")).not.toBeInTheDocument();
  });

  it("with phone — opens wa.me/<phone> with Spanish prefilled greeting", () => {
    render(
      <WhatsAppReplyButton
        renterPhone="+573001234567"
        renterName="Sofia"
        apartmentTitle="Bright 2-BR"
      />,
    );
    fireEvent.click(screen.getByTestId("whatsapp-reply-btn"));
    expect(window.open).toHaveBeenCalledTimes(1);
    const url = (window.open as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toMatch(/^https:\/\/wa\.me\/573001234567\?text=/);
    expect(decodeURIComponent(url)).toContain("Hola Sofia 👋");
    expect(decodeURIComponent(url)).toContain('"Bright 2-BR"');
  });

  it("without phone — renders 'Abrir WhatsApp' label + hint paragraph", () => {
    render(
      <WhatsAppReplyButton
        renterPhone={null}
        renterName="Sofia"
        apartmentTitle="Bright 2-BR"
      />,
    );
    expect(screen.getByTestId("whatsapp-reply-btn")).toHaveTextContent(
      "Abrir WhatsApp",
    );
    expect(screen.getByTestId("whatsapp-reply-hint")).toHaveTextContent(
      /Sofia ya te escribió/,
    );
  });

  it("without phone — opens bare wa.me/", () => {
    render(
      <WhatsAppReplyButton
        renterPhone={null}
        renterName="Sofia"
        apartmentTitle="Bright 2-BR"
      />,
    );
    fireEvent.click(screen.getByTestId("whatsapp-reply-btn"));
    expect(window.open).toHaveBeenCalledWith(
      "https://wa.me/",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("treats <8-digit phone as no-phone (validation guard)", () => {
    render(
      <WhatsAppReplyButton
        renterPhone="+12"
        renterName="Sofia"
        apartmentTitle="Bright 2-BR"
      />,
    );
    expect(screen.getByTestId("whatsapp-reply-btn")).toHaveTextContent(
      "Abrir WhatsApp",
    );
    expect(screen.getByTestId("whatsapp-reply-hint")).toBeInTheDocument();
  });

  it("fires onSent callback after click", () => {
    const onSent = vi.fn();
    render(
      <WhatsAppReplyButton
        renterPhone="+573001234567"
        renterName="Sofia"
        apartmentTitle="Bright 2-BR"
        onSent={onSent}
      />,
    );
    fireEvent.click(screen.getByTestId("whatsapp-reply-btn"));
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it("disabled prop disables the button", () => {
    render(
      <WhatsAppReplyButton
        renterPhone="+573001234567"
        renterName="Sofia"
        apartmentTitle="Bright 2-BR"
        disabled
      />,
    );
    const btn = screen.getByTestId("whatsapp-reply-btn") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
