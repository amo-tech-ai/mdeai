import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  type TicketTierInput,
  type TicketsStepInput,
  ticketsStepSchema,
} from "@/types/event-wizard";

interface Step2TicketsProps {
  defaults?: TicketTierInput[];
  saving: boolean;
  onBack: () => void;
  onSubmit: (values: TicketsStepInput) => void;
}

const EMPTY_TIER: TicketTierInput = {
  name: "",
  description: "",
  price_cents: 0,
  qty_total: 50,
  is_active: true,
  position: 0,
  min_per_order: 1,
  max_per_order: 10,
};

/**
 * Step 2 — Tickets. 1-5 tiers. Price stored as COP cents but displayed as
 * pesos in the input for organizer comfort (multiply ×100 on save).
 *
 * Constraints:
 *   - At least 1 tier required to publish
 *   - Phase 1 cap: 5 tiers (Phase 2 raises)
 *   - max_per_order >= min_per_order (Zod refinement)
 */
export function Step2Tickets({
  defaults,
  saving,
  onBack,
  onSubmit,
}: Step2TicketsProps) {
  const form = useForm<TicketsStepInput>({
    resolver: zodResolver(ticketsStepSchema),
    defaultValues: {
      tickets:
        defaults && defaults.length > 0
          ? defaults
          : [{ ...EMPTY_TIER, name: "GA", price_cents: 4_000_000 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tickets",
  });

  const watchedTiers = form.watch("tickets");
  const totalCapacity = (watchedTiers ?? []).reduce(
    (s, t) => s + (Number(t?.qty_total) || 0),
    0,
  );
  const fmtCop = (cents: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Tier {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name={`tickets.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="GA / VIP / Backstage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`tickets.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What this tier includes — perks, seating, access"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name={`tickets.${index}.price_cents`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (COP)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          step={100}
                          placeholder="40000"
                          value={field.value ? String(field.value / 100) : ""}
                          onChange={(e) => {
                            const pesos = Number(e.target.value || 0);
                            field.onChange(Math.round(pesos * 100));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`tickets.${index}.qty_total`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="100"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value || 0))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name={`tickets.${index}.min_per_order`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Min/order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={field.value ?? 1}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value || 1))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`tickets.${index}.max_per_order`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Max/order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={field.value ?? 10}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value || 10))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Live preview:{" "}
                {watchedTiers[index]?.qty_total > 0 &&
                watchedTiers[index]?.price_cents >= 0
                  ? `${watchedTiers[index].qty_total} × ${fmtCop(
                      watchedTiers[index].price_cents,
                    )} = ${fmtCop(
                      watchedTiers[index].qty_total *
                        watchedTiers[index].price_cents,
                    )} max revenue`
                  : "Set price + quantity"}
              </p>
            </div>
          ))}
        </div>

        {fields.length < 5 && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              append({ ...EMPTY_TIER, position: fields.length })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Add tier
          </Button>
        )}

        <div className="rounded-md bg-muted/40 p-3 text-sm">
          <span className="font-medium">Total capacity:</span>{" "}
          {totalCapacity.toLocaleString("es-CO")} tickets across{" "}
          {fields.length} tier{fields.length === 1 ? "" : "s"}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
