import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, MapPin, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateVenue,
  useVenues,
  venueCreateSchema,
  type VenueCreateInput,
} from "@/hooks/useVenues";

interface VenuePickerProps {
  value: string | null | undefined;
  onChange: (
    venueId: string | null,
    fields: { name: string; address: string; city: string } | null,
  ) => void;
  /** Compact rendering inside a tight Step 1 form */
  className?: string;
}

/**
 * Phase 1 events MVP — venue picker (task 035 lite).
 *
 * UX:
 *   - Select dropdown of saved venues (organizer-scoped)
 *   - "Add new venue" inline dialog → creates row + auto-selects it
 *   - On selection, calls `onChange(venueId, denormalizedFields)` so the
 *     wizard's basics form populates `address` + `city` automatically.
 */
export function VenuePicker({ value, onChange, className }: VenuePickerProps) {
  const { data: venues, isLoading, error, refetch } = useVenues();
  const [dialogOpen, setDialogOpen] = useState(false);
  const createVenue = useCreateVenue();
  const { toast } = useToast();

  const form = useForm<VenueCreateInput>({
    resolver: zodResolver(venueCreateSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "Medellín",
      capacity: undefined,
      postal_code: "",
    },
  });

  const onCreate = (input: VenueCreateInput) => {
    createVenue.mutate(input, {
      onSuccess: (venue) => {
        toast({ title: "Venue created", description: venue.name });
        form.reset();
        setDialogOpen(false);
        onChange(venue.id, {
          name: venue.name,
          address: venue.address,
          city: venue.city,
        });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Couldn't create venue",
          description: err.message,
        });
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <Label>Venue</Label>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" aria-label="Loading venues" />
          Loading venues…
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <Label>Venue</Label>
        <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="text-destructive">Couldn't load venues.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const list = venues ?? [];

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <Label htmlFor="venue-select">Venue</Label>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2">
              <Plus className="w-3.5 h-3.5" /> New venue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a new venue</DialogTitle>
              <DialogDescription>
                Saved venues can be reused across events.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onCreate)}
                className="space-y-3"
                noValidate
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Hotel Intercontinental — Salón Real"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
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
                <div className="grid grid-cols-2 gap-3">
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
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              field.onChange(v === "" ? undefined : Number(v));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createVenue.isPending}>
                    {createVenue.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Create venue
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-2">
        {list.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mx-auto mb-1 opacity-60" />
            No venues yet — add your first venue.
          </div>
        ) : (
          <Select
            value={value ?? ""}
            onValueChange={(v) => {
              if (!v) {
                onChange(null, null);
                return;
              }
              const found = list.find((x) => x.id === v);
              if (found) {
                onChange(v, {
                  name: found.name,
                  address: found.address,
                  city: found.city,
                });
              } else {
                onChange(v, null);
              }
            }}
          >
            <SelectTrigger id="venue-select">
              <SelectValue placeholder="Pick a saved venue" />
            </SelectTrigger>
            <SelectContent>
              {list.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} · {v.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
