import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, UserRound, X, AlertTriangle } from "lucide-react";
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
import { useContestantSocialEnrich } from "@/hooks/useContestantSocialEnrich";
import type { SocialEnrichResult } from "@/hooks/useContestantSocialEnrich";

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

  const { result, isLoading: enrichLoading, error: enrichError, enrich, clear } =
    useContestantSocialEnrich();

  // Try to enrich from whichever social URL the user has filled in
  const handleEnrich = async () => {
    const vals = form.getValues();
    const url =
      vals.socials.instagram ||
      vals.socials.tiktok    ||
      vals.socials.facebook  ||
      "";
    if (!url) return;
    await enrich(url);
  };

  // Apply the enrichment result into the form fields
  const applyResult = (r: SocialEnrichResult) => {
    if (r.display_name && !form.getValues("display_name")) {
      form.setValue("display_name", r.display_name, { shouldValidate: true });
    }
    if (r.bio && !form.getValues("bio")) {
      form.setValue("bio", r.bio, { shouldValidate: true });
    }
    clear();
  };

  const hasSocialUrl =
    !!form.watch("socials.instagram") ||
    !!form.watch("socials.tiktok")    ||
    !!form.watch("socials.facebook");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>

        {/* ── Social import banner ─────────────────────────────────────── */}
        {!result && (
          <div className="rounded-xl border border-dashed bg-muted/30 p-4 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Auto-fill from your social profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter your Instagram, TikTok, or Facebook URL below, then click Import.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!hasSocialUrl || enrichLoading}
              onClick={handleEnrich}
              className="shrink-0"
            >
              {enrichLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />}
              <span className="ml-1.5">{enrichLoading ? "Importing…" : "Import"}</span>
            </Button>
          </div>
        )}

        {/* ── Enrich error ─────────────────────────────────────────────── */}
        {enrichError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Couldn't read that profile — please fill in manually.
          </div>
        )}

        {/* ── Enrich preview card ───────────────────────────────────────── */}
        {result && (
          <EnrichPreviewCard
            result={result}
            onApply={() => applyResult(result)}
            onDismiss={clear}
          />
        )}

        {/* ── Display name ─────────────────────────────────────────────── */}
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

        {/* ── Bio ──────────────────────────────────────────────────────── */}
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

        {/* ── Social media ─────────────────────────────────────────────── */}
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

// ─── EnrichPreviewCard ────────────────────────────────────────────────────────

interface EnrichPreviewCardProps {
  result:    SocialEnrichResult;
  onApply:   () => void;
  onDismiss: () => void;
}

function EnrichPreviewCard({ result, onApply, onDismiss }: EnrichPreviewCardProps) {
  if (!result.accessible) {
    return (
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-medium text-amber-800">Couldn't read that profile</p>
          <p className="text-xs text-amber-700 mt-0.5">
            The profile may be private or require login. Please fill in your details manually.
          </p>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss">
          <X className="w-4 h-4 text-amber-600 hover:text-amber-800" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {result.avatar_url ? (
            <img
              src={result.avatar_url}
              alt={result.display_name}
              className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <UserRound className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {result.display_name || "Profile found"}
            </p>
            {result.followers && (
              <p className="text-xs text-muted-foreground">{result.followers} followers</p>
            )}
          </div>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss">
          <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {result.bio && (
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {result.bio}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          onClick={onApply}
          className="flex-1"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Use this
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDismiss}
          className="flex-1"
        >
          Fill in manually
        </Button>
      </div>
    </div>
  );
}
