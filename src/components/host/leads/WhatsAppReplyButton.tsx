import { MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildWhatsAppUrl,
} from "@/lib/whatsapp-deeplink";

/**
 * WhatsAppReplyButton — D10 lead detail action.
 *
 * Two modes:
 *   - WITH renter phone (chat-channel leads, future onboarded form
 *     leads) → opens `wa.me/<renter-phone>?text=<prefilled Spanish>`.
 *   - WITHOUT renter phone (form-channel leads from D7.5) → opens
 *     `wa.me/` with no recipient (just opens the WA app on mobile, or
 *     web.whatsapp.com on desktop). Copy explains the renter messaged
 *     from their own phone, so the landlord finds them in their chats.
 *
 * `onSent` fires after the user clicks (it's a leap of faith — we
 * can't observe whether they actually sent — but the LeadDetail page
 * uses it as the trigger to mark the lead as 'replied').
 */

interface WhatsAppReplyButtonProps {
  renterPhone: string | null;
  renterName: string;
  apartmentTitle: string;
  /** Fired right after the wa.me link is opened. */
  onSent?: () => void;
  /** Disable when the parent has a pending status mutation. */
  disabled?: boolean;
}

function buildPrefilled(renterName: string, apartmentTitle: string): string {
  return [
    `Hola ${renterName} 👋`,
    ``,
    `Gracias por tu interés en "${apartmentTitle}".`,
    ``,
  ].join("\n");
}

export function WhatsAppReplyButton({
  renterPhone,
  renterName,
  apartmentTitle,
  onSent,
  disabled,
}: WhatsAppReplyButtonProps) {
  const hasPhone = !!renterPhone && renterPhone.replace(/\D+/g, "").length >= 8;
  const message = buildPrefilled(renterName, apartmentTitle);

  const handleClick = () => {
    let url = "https://wa.me/";
    if (hasPhone && renterPhone) {
      try {
        url = buildWhatsAppUrl(renterPhone, message);
      } catch {
        // Fall back to bare wa.me/ on validation failure.
        url = "https://wa.me/";
      }
    }
    window.open(url, "_blank", "noopener,noreferrer");
    onSent?.();
  };

  return (
    <div className="space-y-2" data-testid="whatsapp-reply-block">
      <Button
        type="button"
        size="lg"
        className="w-full sm:w-auto gap-2"
        onClick={handleClick}
        disabled={disabled}
        data-testid="whatsapp-reply-btn"
      >
        <MessageCircle className="w-4 h-4" />
        {hasPhone
          ? `Responder a ${renterName.split(" ")[0]} en WhatsApp`
          : "Abrir WhatsApp"}
      </Button>
      {!hasPhone ? (
        <p
          className="text-xs text-muted-foreground flex items-start gap-1.5 max-w-md"
          data-testid="whatsapp-reply-hint"
        >
          <Smartphone className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            {renterName.split(" ")[0]} ya te escribió en WhatsApp desde su número.
            Revisa tus chats recientes para responder.
          </span>
        </p>
      ) : null}
    </div>
  );
}
