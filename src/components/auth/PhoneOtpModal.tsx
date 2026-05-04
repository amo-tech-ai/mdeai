import { useState } from "react";
import { Phone, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PhoneOtpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the verified user after successful OTP */
  onVerified: () => void;
  /** Context message shown under the title */
  promptText?: string;
}

type Step = "phone" | "otp";

export function PhoneOtpModal({
  open,
  onOpenChange,
  onVerified,
  promptText = "Verifica tu teléfono para votar",
}: PhoneOtpModalProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedPhone = phone.trim().startsWith("+") ? phone.trim() : `+57${phone.trim()}`;

  const handleSendOtp = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
      if (error) throw error;
      setStep("otp");
      toast.success("Código enviado por SMS");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el código");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: otp.trim(),
        type: "sms",
      });
      if (error) throw error;
      onVerified();
      onOpenChange(false);
      toast.success("¡Verificado!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Código incorrecto — intenta de nuevo");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep("phone");
      setPhone("");
      setOtp("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === "phone" ? (
              <Phone className="w-5 h-5 text-primary" />
            ) : (
              <MessageSquare className="w-5 h-5 text-primary" />
            )}
            <DialogTitle>
              {step === "phone" ? "Verifica tu número" : "Ingresa el código"}
            </DialogTitle>
          </div>
          <DialogDescription>{promptText}</DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-input">Número de teléfono</Label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-muted rounded-md text-sm font-medium border border-input text-muted-foreground">
                  🇨🇴 +57
                </span>
                <Input
                  id="phone-input"
                  type="tel"
                  inputMode="tel"
                  placeholder="300 555 0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  autoFocus
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sin el prefijo +57. Solo Colombia por ahora.
              </p>
            </div>
            <Button onClick={handleSendOtp} disabled={loading || phone.trim().length < 7} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enviar código SMS
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-input">Código de 6 dígitos</Label>
              <Input
                id="otp-input"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                autoFocus
                className="text-center text-xl tracking-[0.5em] font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Código enviado a {normalizedPhone}
              </p>
            </div>
            <Button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="w-full">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Verificar y votar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setStep("phone")}
            >
              Cambiar número
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
