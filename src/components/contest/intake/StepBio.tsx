/**
 * StepBio — Paso 1: nombre, presentación y redes sociales.
 * Solo los campos; la navegación entre pasos la maneja Apply.tsx.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button }   from "@/components/ui/button";
import { StepBioSchema, type StepBioData } from "@/types/contestApply";
import type { ContestApplyDraft } from "@/types/contestApply";

interface StepBioProps {
  draft:    ContestApplyDraft | null;
  saving:   boolean;
  onSubmit: (data: StepBioData) => void;
}

export function StepBio({ draft, saving, onSubmit }: StepBioProps) {
  const form = useForm<StepBioData>({
    resolver: zodResolver(StepBioSchema),
    defaultValues: {
      display_name: draft?.display_name ?? "",
      bio:          draft?.bio ?? "",
      socials: {
        instagram: draft?.socials?.instagram ?? "",
        tiktok:    draft?.socials?.tiktok    ?? "",
        facebook:  draft?.socials?.facebook  ?? "",
      },
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Nombre */}
        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage name or full name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Valentina Restrepo"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Presentación */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Bio{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (min. 50 · max. 800 characters)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell the judges and public who you are, what motivates you, and why you're entering this contest…"
                  rows={6}
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground text-right">
                {field.value?.length ?? 0} / 800
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Redes sociales */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium leading-none">
            Social media{" "}
            <span className="text-xs text-muted-foreground font-normal">
              (at least one required)
            </span>
          </legend>

          <FormField
            control={form.control}
            name="socials.instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-muted-foreground">
                  Instagram
                </FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://instagram.com/your_handle"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socials.tiktok"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-muted-foreground">
                  TikTok
                </FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://tiktok.com/@your_handle"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socials.facebook"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-muted-foreground">
                  Facebook
                </FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://facebook.com/your_page"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Root-level socials refine error */}
          {form.formState.errors.socials?.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.socials.root.message}
            </p>
          )}
        </fieldset>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving} className="min-w-32">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save & continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
