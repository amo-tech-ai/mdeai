import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSponsorEvents } from "@/hooks/sponsor/useSponsorEvents";
import {
  TIER_LABELS,
  TIER_PRICES_COP_CENTS,
  type ActivationType,
  type SponsorApplicationInput,
  type SponsorTier,
} from "@/types/sponsor";

const ACTIVATION_OPTIONS: { value: ActivationType; label: string }[] = [
  { value: "title_naming",       label: "Title / Naming Rights" },
  { value: "category_powered_by", label: "Category Powered By" },
  { value: "contestant_sponsor", label: "Contestant Sponsor" },
  { value: "venue_sponsor",      label: "Venue Sponsor" },
  { value: "digital",            label: "Digital" },
];

const TIERS: SponsorTier[] = ["bronze", "silver", "gold", "premium"];

const step2Schema = z.object({
  event_id:        z.string().min(1, "Please select an event"),
  activation_type: z.enum([
    "title_naming",
    "category_powered_by",
    "contestant_sponsor",
    "venue_sponsor",
    "digital",
  ]),
  tier: z.enum(["bronze", "silver", "gold", "premium"]),
});

type Step2FormValues = z.infer<typeof step2Schema>;

interface Step2PackageProps {
  defaultValues: Partial<SponsorApplicationInput>;
  onNext: (data: SponsorApplicationInput) => void;
  onBack: () => void;
}

export function Step2Package({ defaultValues, onNext, onBack }: Step2PackageProps) {
  const { data: events, isLoading: eventsLoading, error: eventsError } = useSponsorEvents();

  const form = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      event_id:        defaultValues.event_id        ?? "",
      activation_type: (defaultValues.activation_type as ActivationType) ?? undefined,
      tier:            (defaultValues.tier as SponsorTier)               ?? undefined,
    },
  });

  function onSubmit(values: Step2FormValues) {
    const selectedEvent = events?.find((e) => e.id === values.event_id);
    const output: SponsorApplicationInput = {
      event_id:         values.event_id,
      event_title:      selectedEvent?.title,
      activation_type:  values.activation_type,
      tier:             values.tier,
      pricing_model:    "flat",
      flat_price_cents: TIER_PRICES_COP_CENTS[values.tier],
    };
    onNext(output);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Event selector */}
        <FormField
          control={form.control}
          name="event_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event *</FormLabel>
              {eventsLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading events…
                </div>
              )}
              {eventsError && (
                <p className="text-sm text-destructive">Failed to load events.</p>
              )}
              {!eventsLoading && !eventsError && (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {events && events.length > 0 ? (
                      events.map((ev) => (
                        <SelectItem key={ev.id} value={ev.id}>
                          {ev.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__none__" disabled>
                        No published events available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Activation type */}
        <FormField
          control={form.control}
          name="activation_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activation Type *</FormLabel>
              <FormControl>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ACTIVATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={cn(
                        "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                        field.value === opt.value
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tier cards */}
        <Controller
          control={form.control}
          name="tier"
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <p className="text-sm font-medium leading-none">Sponsorship Tier *</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TIERS.map((tier) => (
                  <Card
                    key={tier}
                    onClick={() => field.onChange(tier)}
                    className={cn(
                      "cursor-pointer transition-all",
                      field.value === tier
                        ? "ring-2 ring-primary border-primary"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold capitalize text-sm">{tier}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {TIER_LABELS[tier]}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {fieldState.error && (
                <p className="text-sm text-destructive">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Next: Brand Assets
          </Button>
        </div>
      </form>
    </Form>
  );
}
