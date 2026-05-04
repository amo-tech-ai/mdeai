import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  type EventBasicsInput,
  eventBasicsSchema,
} from "@/types/event-wizard";
import { VenuePicker } from "./VenuePicker";

interface Step1BasicsProps {
  defaults?: Partial<EventBasicsInput>;
  saving: boolean;
  onSubmit: (values: EventBasicsInput) => void;
}

const EVENT_TYPES: Array<{ value: EventBasicsInput["event_type"]; label: string }> = [
  { value: "pageant", label: "Beauty pageant / gala" },
  { value: "concert", label: "Concert / music" },
  { value: "workshop", label: "Workshop / class" },
  { value: "networking", label: "Networking / business" },
  { value: "fashion_show", label: "Fashion show" },
  { value: "festival", label: "Festival" },
  { value: "other", label: "Other" },
];

const AGE_OPTIONS = [
  { value: "", label: "All ages" },
  { value: "13+", label: "13 +" },
  { value: "16+", label: "16 +" },
  { value: "18+", label: "18 +" },
  { value: "21+", label: "21 +" },
];

/**
 * Step 1 — Basics. Captures name, description, event type, datetime window,
 * venue (via VenuePicker), website, age restriction.
 *
 * Per `.claude/rules/ai-interaction-patterns.md`: the AI description button
 * is propose-only. Phase 1 wires it to a stub that toasts "coming with task
 * 009". The button stays in the UI so the propose→apply rail is testable
 * end-to-end once 009 ships.
 */
export function Step1Basics({ defaults, saving, onSubmit }: Step1BasicsProps) {
  const { toast } = useToast();
  const form = useForm<EventBasicsInput>({
    resolver: zodResolver(eventBasicsSchema),
    defaultValues: {
      name: "",
      description: "",
      event_type: "other",
      event_start_time: "",
      event_end_time: "",
      timezone: "America/Bogota",
      venue_id: null,
      address: "",
      city: "Medellín",
      website: "",
      age_restriction: "",
      primary_image_url: "",
      ...defaults,
    },
  });

  // Re-sync defaults when the parent's draft data finishes loading
  useEffect(() => {
    if (!defaults) return;
    form.reset({ ...form.getValues(), ...defaults });
    // intentionally exclude `form` from deps — react-hook-form's `form` ref is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults?.name, defaults?.event_start_time, defaults?.venue_id]);

  const handleGenerate = () => {
    // TODO(task 009): wire to ai-chat edge fn → returns 3 variants ≤200 chars.
    // Per ai-interaction-patterns: propose 3 options; user picks one or "keep mine".
    toast({
      title: "AI description generator",
      description:
        "Propose-only AI ships with task 009. For now, write your own description (or paste a draft).",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Reina de Antioquia 2026 Finals"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Description</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs"
                  onClick={handleGenerate}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate
                </Button>
              </div>
              <FormControl>
                <Textarea
                  placeholder="One paragraph that makes someone want to come — what they'll see, why it matters, what makes it special."
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Up to 2,000 characters. Plain text only — no markdown.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="event_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? "other"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age_restriction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age restriction</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="All ages" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AGE_OPTIONS.map((a) => (
                      <SelectItem key={a.value || "any"} value={a.value || "any"}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="event_start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start (date + time)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="event_end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End (date + time)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="venue_id"
          render={({ field }) => (
            <FormItem>
              <VenuePicker
                value={field.value}
                onChange={(venueId, fields) => {
                  field.onChange(venueId);
                  if (fields) {
                    form.setValue("address", fields.address);
                    form.setValue("city", fields.city);
                  }
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (auto-filled from venue)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Calle 16 #28-51, El Poblado"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Medellín" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://misseleganceco.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
