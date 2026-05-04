/**
 * StepConsent — Paso 5: consentimiento de Habeas Data y uso de imagen.
 * Botón de envío deshabilitado hasta que ambos checkboxes estén marcados.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button }   from "@/components/ui/button";
import { StepConsentSchema, type StepConsentData } from "@/types/contestApply";

interface StepConsentProps {
  submitting: boolean;
  onSubmit:   (data: StepConsentData) => void;
  onBack:     () => void;
}

export function StepConsent({ submitting, onSubmit, onBack }: StepConsentProps) {
  const form = useForm<StepConsentData>({
    resolver: zodResolver(StepConsentSchema),
    defaultValues: {
      // Cast to satisfy TS — the form starts unchecked; Zod validates on submit
      habeas_data:  false as unknown as true,
      image_rights: false as unknown as true,
    },
  });

  const values = form.watch();
  const bothChecked = values.habeas_data === true && values.image_rights === true;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="rounded-lg border bg-card p-5 space-y-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Before submitting your application, we need your explicit consent on the following points.
            </p>
          </div>

          {/* Habeas Data */}
          <FormField
            control={form.control}
            name="habeas_data"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    id="habeas_data"
                    checked={field.value === true}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true ? true : false)
                    }
                    data-testid="consent-habeas-data"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="habeas_data" className="text-sm font-medium cursor-pointer">
                    I accept personal data processing
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Ley 1581 de 2012 (Habeas Data — Colombia). Your data will be used exclusively for contest administration and will not be shared with third parties without your authorization.{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer" className="underline text-primary">
                      View privacy policy
                    </a>
                  </p>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Image rights */}
          <FormField
            control={form.control}
            name="image_rights"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    id="image_rights"
                    checked={field.value === true}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true ? true : false)
                    }
                    data-testid="consent-image-rights"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="image_rights" className="text-sm font-medium cursor-pointer">
                    I authorize use of my image
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    I authorize the contest organizer to use my photos and videos in event promotional materials, social media, and digital platforms related to the contest.
                  </p>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            type="submit"
            disabled={!bothChecked || submitting}
            className="min-w-40"
            data-testid="submit-button"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit application
          </Button>
        </div>
      </form>
    </Form>
  );
}
