import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  LandlordKind,
  Step1BasicsInput,
} from "@/hooks/host/useLandlordOnboarding";

// Common Medellín neighborhoods (manual curated list). "Other" lets the
// user type a custom value at the next iteration; for V1 we accept blank.
const NEIGHBORHOODS = [
  "El Poblado",
  "Laureles",
  "Provenza",
  "Envigado",
  "Sabaneta",
  "Estadio",
  "Belén",
  "El Centro",
  "Ciudad del Río",
  "Manila",
  "Astorga",
] as const;

// E.164 with explicit + and 8-15 digits. Colombian numbers are +57 + 10
// digits = 13 chars; we accept the wider range so future expansion to
// other LATAM markets doesn't require a schema change.
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

const schema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "Add a name we can show to renters")
    .max(80, "Keep it under 80 characters"),
  kind: z.enum(["individual", "agent", "property_manager"]),
  whatsapp_e164: z
    .string()
    .trim()
    .regex(
      E164_REGEX,
      "Use international format with + and country code, e.g. +573001234567",
    ),
  primary_neighborhood: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Step1BasicsProps {
  initialValues?: Partial<Step1BasicsInput>;
  onSubmit: (values: Step1BasicsInput) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function Step1Basics({
  initialValues,
  onSubmit,
  isSubmitting,
  errorMessage,
}: Step1BasicsProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: initialValues?.display_name ?? "",
      kind: (initialValues?.kind as LandlordKind | undefined) ?? "individual",
      whatsapp_e164: initialValues?.whatsapp_e164 ?? "+57",
      primary_neighborhood: initialValues?.primary_neighborhood ?? "",
    },
  });

  const handle = (values: FormValues) => {
    onSubmit({
      display_name: values.display_name,
      kind: values.kind,
      whatsapp_e164: values.whatsapp_e164,
      primary_neighborhood: values.primary_neighborhood
        ? values.primary_neighborhood
        : null,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handle)}
        className="space-y-6"
        noValidate
        data-testid="step1-form"
      >
        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Maria Hernández, or Hernández Inmobiliaria"
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                What renters will see on your public host profile.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>I am a…</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid gap-2 sm:grid-cols-3"
                >
                  {(
                    [
                      ["individual", "Single owner"],
                      ["agent", "Real-estate agent"],
                      ["property_manager", "Property manager"],
                    ] as const
                  ).map(([value, label]) => (
                    <div
                      key={value}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    >
                      <RadioGroupItem
                        value={value}
                        id={`kind-${value}`}
                      />
                      <Label
                        htmlFor={`kind-${value}`}
                        className="cursor-pointer font-normal"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="whatsapp_e164"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+573001234567"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Renter inquiries land here as &ldquo;Reply on WhatsApp&rdquo;
                links. Include the country code.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primary_neighborhood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Primary neighborhood{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  (optional)
                </span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a neighborhood" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {NEIGHBORHOODS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Helps renters discover you in neighborhood searches. You can
                still list properties anywhere.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
          data-testid="step1-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving…
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </Form>
  );
}
