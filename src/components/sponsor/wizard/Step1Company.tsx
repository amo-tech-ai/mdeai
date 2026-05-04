import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SponsorOrganizationInput } from "@/types/sponsor";

const INDUSTRY_OPTIONS = [
  "Beverages",
  "Food & Restaurant",
  "Fashion",
  "Technology",
  "Finance",
  "Retail",
  "Healthcare",
  "Entertainment",
  "Other",
] as const;

const step1Schema = z.object({
  legal_name:        z.string().min(2, "Legal name must be at least 2 characters"),
  display_name:      z.string().min(2, "Display name must be at least 2 characters"),
  website:           z.string().url("Enter a valid URL").optional().or(z.literal("")),
  industry:          z.string().optional(),
  tax_id:            z.string().optional(),
  contact_full_name: z.string().min(2, "Contact name must be at least 2 characters"),
  contact_email:     z.string().email("Enter a valid email address"),
  contact_whatsapp:  z
    .string()
    .regex(/^\+\d{8,15}$/, "Use E.164 format (+573001234567)")
    .optional()
    .or(z.literal("")),
});

type Step1FormValues = z.infer<typeof step1Schema>;

interface Step1CompanyProps {
  defaultValues: Partial<SponsorOrganizationInput>;
  onNext: (data: SponsorOrganizationInput) => void;
}

export function Step1Company({ defaultValues, onNext }: Step1CompanyProps) {
  const form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      legal_name:        defaultValues.legal_name        ?? "",
      display_name:      defaultValues.display_name      ?? "",
      website:           defaultValues.website            ?? "",
      industry:          defaultValues.industry           ?? "",
      tax_id:            defaultValues.tax_id             ?? "",
      contact_full_name: defaultValues.contact_full_name ?? "",
      contact_email:     defaultValues.contact_email      ?? "",
      contact_whatsapp:  defaultValues.contact_whatsapp   ?? "",
    },
  });

  function onSubmit(values: Step1FormValues) {
    const cleaned: SponsorOrganizationInput = {
      legal_name:        values.legal_name,
      display_name:      values.display_name,
      contact_full_name: values.contact_full_name,
      contact_email:     values.contact_email,
      ...(values.website           ? { website: values.website }                   : {}),
      ...(values.industry          ? { industry: values.industry }                 : {}),
      ...(values.tax_id            ? { tax_id: values.tax_id }                     : {}),
      ...(values.contact_whatsapp  ? { contact_whatsapp: values.contact_whatsapp } : {}),
    };
    onNext(cleaned);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Company Information</h2>

          <FormField
            control={form.control}
            name="legal_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Acme S.A.S." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand / Display Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Acme" {...field} />
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
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://acme.com" type="url" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
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
            name="tax_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax ID / NIT</FormLabel>
                <FormControl>
                  <Input placeholder="900.123.456-7" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 pt-2">
          <h2 className="font-display text-lg font-semibold">Primary Contact</h2>

          <FormField
            control={form.control}
            name="contact_full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="María García" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="maria@acme.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="+573001234567" type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">
          Next: Select Package
        </Button>
      </form>
    </Form>
  );
}
