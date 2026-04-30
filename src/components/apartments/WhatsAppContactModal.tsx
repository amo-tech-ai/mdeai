import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { useContactHost } from "@/hooks/useContactHost";
import { useAnonSession } from "@/hooks/useAnonSession";
import {
  buildWhatsAppDeepLink,
  type MoveWhen,
} from "@/lib/whatsapp-deeplink";
import { trackEvent } from "@/lib/posthog";
import { cn } from "@/lib/utils";

/**
 * WhatsAppContactModal — Landlord V1 D7.5.
 *
 * The "tap-to-WhatsApp" lead capture flow: 3 fields → submit →
 * landlord_inbox row inserted → wa.me opens in a new tab. Then the
 * modal swaps to a "did you send it?" confirmation so we get a clean
 * signal in PostHog.
 *
 * Why this instead of the older `ContactHostDialog` (P1 CRM `leads`
 * table + sign-in gate)? V1 cohort priorities:
 *   - Anon-friendly. Renter shouldn't need to register before messaging.
 *   - WhatsApp-first. Medellín lives there; users already trust + use it.
 *   - Form data captured server-side BEFORE wa.me opens — so even if
 *     the popup is blocked / user closes the tab, the lead is still in
 *     the landlord's inbox.
 *
 * `ContactHostDialog` stays for legacy seeded apartments without a
 * landlord_id; ApartmentDetail picks at render time.
 */

interface WhatsAppContactModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  apartment: {
    id: string;
    title: string;
    neighborhood: string;
  };
  hostFirstName: string;
}

const MOVE_OPTIONS: { value: MoveWhen; label: string; sublabel: string }[] = [
  { value: "now", label: "Now", sublabel: "Within a few weeks" },
  { value: "soon", label: "Soon", sublabel: "1-3 months" },
  { value: "later", label: "Later", sublabel: "Just browsing" },
];

type ModalStep = "form" | "redirecting" | "confirm";

export function WhatsAppContactModal({
  open,
  onOpenChange,
  apartment,
  hostFirstName,
}: WhatsAppContactModalProps) {
  const submit = useContactHost();
  const { anonSessionId } = useAnonSession();
  const [step, setStep] = useState<ModalStep>("form");
  const [name, setName] = useState("");
  const [moveWhen, setMoveWhen] = useState<MoveWhen>("soon");
  const [message, setMessage] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [website, setWebsite] = useState(""); // honeypot

  useEffect(() => {
    if (!open) {
      // Clear after the close animation so re-open is fresh.
      const t = setTimeout(() => {
        setStep("form");
        setName("");
        setMoveWhen("soon");
        setMessage("");
        setWhatsappUrl(null);
        setWebsite("");
        submit.reset();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open, submit]);

  const canSubmit = name.trim().length >= 1 && !submit.isPending;

  const handleSend = async () => {
    try {
      const result = await submit.mutateAsync({
        apartment_id: apartment.id,
        name: name.trim(),
        move_when: moveWhen,
        message: message.trim() || undefined,
        website: website || undefined,
        anon_session_id: anonSessionId ?? undefined,
      });
      const { url } = buildWhatsAppDeepLink(result.whatsapp_e164, {
        renterName: name.trim(),
        apartmentTitle: result.apartment.title,
        apartmentNeighborhood: result.apartment.neighborhood,
        listingUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/apartments/${result.apartment.id}`
            : `https://mdeai.co/apartments/${result.apartment.id}`,
        moveWhen,
        message: message.trim() || undefined,
      });
      setWhatsappUrl(url);
      setStep("redirecting");
      trackEvent({
        name: "contact_host_submitted",
        apartmentId: apartment.id,
        moveWhen,
      });
      // Open WhatsApp in a new tab. We do this on the user's gesture
      // (this click) so the popup isn't blocked.
      window.open(url, "_blank", "noopener,noreferrer");
      // Move to "did you send it?" after a beat so the user has time
      // to switch tabs and start typing.
      setTimeout(() => setStep("confirm"), 1500);
    } catch {
      // Error surfaces via submit.error in the form state below.
    }
  };

  const handleConfirmYes = () => {
    trackEvent({
      name: "contact_host_whatsapp_confirmed",
      apartmentId: apartment.id,
    });
    onOpenChange(false);
  };

  const handleConfirmRetry = () => {
    if (whatsappUrl) {
      trackEvent({
        name: "contact_host_whatsapp_retry",
        apartmentId: apartment.id,
      });
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="whatsapp-contact-modal">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Contact {hostFirstName}</DialogTitle>
              <DialogDescription className="line-clamp-1">
                {apartment.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Your first name</Label>
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sofia"
                  maxLength={60}
                  autoFocus
                  data-testid="contact-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>When are you looking to move?</Label>
                <div
                  className="grid grid-cols-3 gap-2"
                  role="radiogroup"
                  aria-label="When are you looking to move?"
                >
                  {MOVE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={moveWhen === opt.value}
                      onClick={() => setMoveWhen(opt.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left transition-colors",
                        moveWhen === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted",
                      )}
                      data-testid={`contact-when-${opt.value}`}
                    >
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {opt.sublabel}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">
                  Message (optional)
                </Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Anything specific you want to ask?"
                  data-testid="contact-message-input"
                />
              </div>

              {/* Honeypot — visually hidden, kept in DOM. Bots fill it; real users don't see it. */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  height: 0,
                  width: 0,
                  overflow: "hidden",
                }}
              >
                <label htmlFor="contact-website">
                  Don&apos;t fill this in
                  <input
                    id="contact-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
              </div>

              {submit.isError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive flex items-start gap-2"
                  data-testid="contact-host-error"
                >
                  <AlertTriangle
                    className="w-4 h-4 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{submit.error?.message}</span>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submit.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!canSubmit}
                data-testid="contact-send-btn"
                className="gap-2"
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" /> Send via WhatsApp
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {step === "redirecting" ? (
          <div
            className="py-10 text-center space-y-3"
            data-testid="contact-host-redirecting"
          >
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Opening WhatsApp…
            </p>
          </div>
        ) : null}

        {step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle>Did your message send on WhatsApp?</DialogTitle>
              <DialogDescription>
                {hostFirstName} typically replies within a few hours.
              </DialogDescription>
            </DialogHeader>

            <div
              className="space-y-3 py-2"
              data-testid="contact-host-confirm"
            >
              <Button
                size="lg"
                className="w-full justify-start gap-3"
                onClick={handleConfirmYes}
                data-testid="contact-confirm-yes"
              >
                <CheckCircle2 className="w-5 h-5" />
                Yes — I sent it
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleConfirmRetry}
                data-testid="contact-confirm-retry"
              >
                <MessageCircle className="w-5 h-5" />
                Reopen WhatsApp
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-1">
                Your message is already saved for {hostFirstName} either way.
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
