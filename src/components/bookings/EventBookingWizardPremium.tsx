import { useState } from "react";
import {
  Ticket, Check, ArrowRight, ArrowLeft, Loader2, Minus, Plus,
  Calendar, MapPin, Sparkles, Clock, User, Mail,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { EventTicketTier } from "@/hooks/useEventTickets";

interface EventBookingWizardPremiumProps {
  event: {
    id: string;
    name: string;
    event_start_time: string;
    event_end_time?: string;
    address?: string;
    venue_name?: string;
    primary_image_url?: string;
    category?: string;
  };
  tickets: EventTicketTier[];
  user: SupabaseUser | null;
  onComplete?: () => void;
  onCancel?: () => void;
}

type WizardStep = "tickets" | "quantity" | "info" | "review";

const steps: { id: WizardStep; title: string }[] = [
  { id: "tickets", title: "Select Tickets" },
  { id: "quantity", title: "How Many?" },
  { id: "info", title: "Your Info" },
  { id: "review", title: "Review" },
];

function formatCents(cents: number, currency: string) {
  return `${currency} $${(cents / 100).toLocaleString("es-CO")}`;
}

export function EventBookingWizardPremium({
  event,
  tickets,
  user,
  onCancel,
}: EventBookingWizardPremiumProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("tickets");
  const [ticketId, setTicketId] = useState<string>(tickets[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState(user?.user_metadata?.full_name ?? "");
  const [buyerEmail, setBuyerEmail] = useState(user?.email ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const selectedTier = tickets.find((t) => t.id === ticketId) ?? tickets[0];
  const totalCents = selectedTier ? selectedTier.price_cents * quantity : 0;
  const eventDate = new Date(event.event_start_time);

  const minQty = selectedTier?.min_per_order ?? 1;
  const maxQty = selectedTier?.max_per_order ?? 10;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "tickets": return !!ticketId;
      case "quantity": return quantity >= minQty && quantity <= maxQty;
      case "info":
        return buyerName.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail);
      case "review": return true;
      default: return false;
    }
  };

  const handlePurchase = async () => {
    if (!selectedTier) return;
    setIsSubmitting(true);
    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.functions.invoke("ticket-checkout", {
        body: {
          event_id: event.id,
          ticket_id: selectedTier.id,
          quantity,
          buyer_email: buyerEmail.trim(),
          buyer_name: buyerName.trim(),
          attendees: Array.from({ length: quantity }, () => ({
            email: buyerEmail.trim(),
            full_name: buyerName.trim(),
          })),
          idempotency_key: crypto.randomUUID(),
          return_url_success: `${origin}/me/tickets`,
          return_url_cancel: `${origin}/events/${event.id}`,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error?.message ?? "Checkout failed");

      window.location.href = data.data.stripe_session_url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === "review") {
      await handlePurchase();
      return;
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) setCurrentStep(steps[prevIndex].id);
  };

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(minQty, Math.min(maxQty, prev + delta)));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: 3-panel layout */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr_320px] min-h-screen">
        {/* Left Panel */}
        <aside className="border-r bg-muted/30 p-6 flex flex-col">
          <div className="mb-8">
            <Button variant="ghost" size="sm" onClick={onCancel} className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event
            </Button>
            {event.primary_image_url && (
              <div className="aspect-video rounded-xl overflow-hidden mb-4">
                <img src={event.primary_image_url} alt={event.name} className="w-full h-full object-cover" />
              </div>
            )}
            <h2 className="font-display text-xl font-semibold mb-2">{event.name}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{format(eventDate, "EEEE, MMM d")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{format(eventDate, "h:mm a")}</span>
              </div>
              {event.venue_name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venue_name}</span>
                </div>
              )}
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  index === currentStepIndex && "bg-primary/10 text-primary",
                  index < currentStepIndex && "text-muted-foreground",
                  index > currentStepIndex && "text-muted-foreground/50",
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
                  index === currentStepIndex && "bg-primary text-primary-foreground",
                  index < currentStepIndex && "bg-primary/20 text-primary",
                  index > currentStepIndex && "bg-muted text-muted-foreground",
                )}>
                  {index < currentStepIndex ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className={cn("font-medium", index === currentStepIndex && "text-foreground")}>
                  {step.title}
                </span>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Panel */}
        <main className="p-8 overflow-y-auto">
          <div className="max-w-lg mx-auto">
            <h1 className="font-display text-2xl font-bold mb-2">{steps[currentStepIndex].title}</h1>
            <p className="text-muted-foreground mb-8">
              {currentStep === "tickets" && "Choose your ticket type"}
              {currentStep === "quantity" && "Select the number of tickets you need"}
              {currentStep === "info" && "Tell us who's attending"}
              {currentStep === "review" && "Review your order before paying"}
            </p>

            {currentStep === "tickets" && (
              <div className="space-y-4">
                <RadioGroup value={ticketId} onValueChange={setTicketId}>
                  {tickets.map((tier) => {
                    const available = tier.qty_total - tier.qty_sold - tier.qty_pending;
                    return (
                      <div
                        key={tier.id}
                        className={cn(
                          "relative p-5 rounded-xl border-2 cursor-pointer transition-all",
                          ticketId === tier.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                        )}
                        onClick={() => setTicketId(tier.id)}
                      >
                        <div className="flex items-start gap-4">
                          <RadioGroupItem value={tier.id} id={tier.id} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Ticket className="w-4 h-4 text-muted-foreground" />
                              <label htmlFor={tier.id} className="font-semibold cursor-pointer">{tier.name}</label>
                            </div>
                            {tier.description && (
                              <p className="text-sm text-muted-foreground mb-2">{tier.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {available > 0 ? `${available} remaining` : "Sold out"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{formatCents(tier.price_cents, tier.currency)}</p>
                            <p className="text-xs text-muted-foreground">per ticket</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {currentStep === "quantity" && selectedTier && (
              <div className="space-y-8">
                <div className="text-center">
                  <Label className="text-base font-medium mb-6 block">Number of Tickets</Label>
                  <div className="flex items-center justify-center gap-6 py-6">
                    <Button
                      variant="outline" size="lg" className="w-14 h-14 rounded-full"
                      onClick={() => adjustQuantity(-1)}
                      disabled={quantity <= minQty}
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <div className="w-24 text-center">
                      <span className="text-6xl font-bold">{quantity}</span>
                    </div>
                    <Button
                      variant="outline" size="lg" className="w-14 h-14 rounded-full"
                      onClick={() => adjustQuantity(1)}
                      disabled={quantity >= maxQty}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Max {maxQty} tickets per order</p>
                </div>
                <div className="p-6 rounded-xl bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Ticket className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{quantity} × {selectedTier.name}</span>
                  </div>
                  <p className="text-4xl font-bold">{formatCents(totalCents, selectedTier.currency)}</p>
                </div>
              </div>
            )}

            {currentStep === "info" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="buyer-name"
                        placeholder="Your full name"
                        className="pl-10"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyer-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="buyer-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Your tickets and QR codes will be sent here</p>
                  </div>
                </div>
                {quantity > 1 && (
                  <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    Buying {quantity} tickets? All attendees will be registered under your name and email.
                    Each ticket gets a unique QR code.
                  </div>
                )}
              </div>
            )}

            {currentStep === "review" && selectedTier && (
              <div className="space-y-6">
                <div className="p-5 rounded-xl border bg-card">
                  <h3 className="font-semibold mb-4">Order Summary</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Event</dt>
                      <dd className="font-medium text-right max-w-[200px]">{event.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Date</dt>
                      <dd>{format(eventDate, "EEEE, MMM d, yyyy")}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Time</dt>
                      <dd>{format(eventDate, "h:mm a")}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ticket</dt>
                      <dd>{selectedTier.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Quantity</dt>
                      <dd>{quantity} ticket{quantity > 1 ? "s" : ""}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd>{buyerName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="truncate max-w-[180px]">{buyerEmail}</dd>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-lg font-bold">
                      <dt>Total</dt>
                      <dd className="text-primary">{formatCents(totalCents, selectedTier.currency)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  You'll be redirected to Stripe to complete payment. Your QR-coded tickets will appear
                  in <strong>My Tickets</strong> once payment is confirmed.
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" size="lg" onClick={currentStepIndex === 0 ? onCancel : handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStepIndex === 0 ? "Cancel" : "Back"}
              </Button>
              <Button size="lg" onClick={handleNext} disabled={!canProceed() || isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {currentStep === "review" ? "Pay with Stripe" : "Continue"}
                {currentStep !== "review" && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </main>

        {/* Right Panel */}
        <aside className="border-l bg-muted/30 p-6">
          <div className="sticky top-6">
            <h3 className="font-semibold mb-4">Order Total</h3>
            {selectedTier && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {quantity} × {selectedTier.name}
                  </span>
                  <span>{formatCents(selectedTier.price_cents * quantity, selectedTier.currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCents(totalCents, selectedTier.currency)}</span>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Ticket className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">Instant delivery</p>
                  <p className="text-xs text-muted-foreground">QR tickets in your account after payment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">Verified tickets</p>
                  <p className="text-xs text-muted-foreground">100% authentic, scanned at entry</p>
                </div>
              </div>
              {selectedTier && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Secure payment</p>
                    <p className="text-xs text-muted-foreground">Powered by Stripe</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={currentStepIndex === 0 ? onCancel : handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStepIndex === 0 ? "Cancel" : "Back"}
            </Button>
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </header>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-4">
            <h1 className="font-display text-xl font-bold">{steps[currentStepIndex].title}</h1>

            {currentStep === "tickets" && (
              <RadioGroup value={ticketId} onValueChange={setTicketId} className="space-y-3">
                {tickets.map((tier) => (
                  <div
                    key={tier.id}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all",
                      ticketId === tier.id ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={tier.id} id={`m-${tier.id}`} className="mt-1" />
                      <label htmlFor={`m-${tier.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold">{tier.name}</span>
                          <span className="text-lg font-bold">{formatCents(tier.price_cents, tier.currency)}</span>
                        </div>
                        {tier.description && (
                          <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentStep === "quantity" && selectedTier && (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-6 py-8">
                  <Button variant="outline" size="lg" className="w-12 h-12 rounded-full" onClick={() => adjustQuantity(-1)} disabled={quantity <= minQty}>
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="text-5xl font-bold w-16 text-center">{quantity}</span>
                  <Button variant="outline" size="lg" className="w-12 h-12 rounded-full" onClick={() => adjustQuantity(1)} disabled={quantity >= maxQty}>
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">{quantity} × {selectedTier.name}</p>
                  <p className="text-3xl font-bold mt-1">{formatCents(totalCents, selectedTier.currency)}</p>
                </div>
              </div>
            )}

            {currentStep === "info" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="m-buyer-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="m-buyer-name"
                      placeholder="Your full name"
                      className="pl-10"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-buyer-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="m-buyer-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === "review" && selectedTier && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border">
                  <h3 className="font-semibold mb-3">{event.name}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Date</dt>
                      <dd>{format(eventDate, "MMM d, yyyy")}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tickets</dt>
                      <dd>{quantity} × {selectedTier.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd>{buyerName}</dd>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <dt>Total</dt>
                      <dd className="text-primary">{formatCents(totalCents, selectedTier.currency)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">
              {selectedTier ? formatCents(totalCents, selectedTier.currency) : "—"}
            </p>
          </div>
          <Button size="lg" onClick={handleNext} disabled={!canProceed() || isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {currentStep === "review" ? "Pay with Stripe" : "Continue"}
            {currentStep !== "review" && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </footer>
      </div>
    </div>
  );
}
