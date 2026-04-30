import { useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/posthog";
import {
  useListingCreate,
  type ListingCreateOutcome,
} from "@/hooks/host/useListingCreate";
import type { ListingDraft } from "@/hooks/host/useListingDraft";

/**
 * Step 4 — Title + description + submit.
 *
 * Auto-moderation rules (server-side, pure fn at
 * supabase/functions/listing-create/auto-moderation.ts):
 *   1. ≥5 photos
 *   2. lat/lng inside Medellín metro bbox (or fallback if 0,0)
 *   3. No phone/email in description
 *   4. Price 200k-15M COP / 50-5000 USD
 *   5. Description ≥80 chars
 *
 * 0 violations → auto_approved (live immediately)
 * 1 violation  → needs_review (live optimistically; founder reviews)
 * 2+ violations → rejected (NOT inserted; UI lists reasons)
 *
 * On success, redirects to /dashboard with the verdict in toast.
 */

interface Step4DescriptionProps {
  draft: ListingDraft;
  onChange: (next: { title: string; description: string }) => void;
  onBack: () => void;
  onSuccess: () => void;
}

const MIN_TITLE = 8;
const MAX_TITLE = 100;
const MIN_DESCRIPTION = 80;
const MAX_DESCRIPTION = 4000;

export function Step4Description({
  draft,
  onChange,
  onBack,
  onSuccess,
}: Step4DescriptionProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rejection, setRejection] = useState<{
    reasons: string[];
  } | null>(null);

  const submitMutation = useListingCreate();

  const titleLen = draft.title.length;
  const descLen = draft.description.length;
  const titleValid = titleLen >= MIN_TITLE && titleLen <= MAX_TITLE;
  const descValid = descLen >= MIN_DESCRIPTION && descLen <= MAX_DESCRIPTION;
  const submitDisabled =
    !titleValid || !descValid || submitMutation.isPending;

  const handleSubmit = () => {
    setRejection(null);
    submitMutation.mutate(draft, {
      onSuccess: (outcome: ListingCreateOutcome) => {
        if (!outcome.ok) {
          setRejection({ reasons: outcome.rejection.reasons });
          trackEvent({
            name: "listing_create_step",
            step: 4,
            durationSec: 1,
          });
          return;
        }
        trackEvent({
          name: "listing_create_step",
          step: 4,
          durationSec: 1,
        });
        toast({
          title:
            outcome.data.verdict === "auto_approved"
              ? "Listing live!"
              : "Listing submitted for review",
          description:
            outcome.data.verdict === "auto_approved"
              ? "Renters can find it on /apartments now."
              : `Founder reviews flagged listings within 24 hours. Reason: ${outcome.data.reasons.join(", ")}.`,
        });
        onSuccess();
        navigate("/dashboard", { replace: true });
      },
      onError: (err) => {
        toast({
          title: "Couldn't submit listing",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6" data-testid="step4-description-form">
      <div className="space-y-2">
        <Label htmlFor="listing-title">Title</Label>
        <Input
          id="listing-title"
          value={draft.title}
          onChange={(e) =>
            onChange({ title: e.target.value, description: draft.description })
          }
          placeholder="Bright 2-BR in El Poblado, walking distance to Provenza"
          maxLength={MAX_TITLE}
          data-testid="step4-title-input"
        />
        <p
          className={`text-xs ${titleValid ? "text-muted-foreground" : "text-destructive"}`}
        >
          {titleLen} / {MAX_TITLE} chars
          {!titleValid && titleLen > 0 ? ` · need at least ${MIN_TITLE}` : null}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="listing-description">Description</Label>
        <Textarea
          id="listing-description"
          value={draft.description}
          onChange={(e) =>
            onChange({ title: draft.title, description: e.target.value })
          }
          placeholder="Sunny apartment with mountain views. 10-min walk to Parque Lleras..."
          rows={8}
          maxLength={MAX_DESCRIPTION}
          data-testid="step4-description-input"
        />
        <p
          className={`text-xs ${descValid ? "text-muted-foreground" : "text-destructive"}`}
        >
          {descLen} / {MAX_DESCRIPTION} chars
          {!descValid && descLen > 0
            ? ` · need at least ${MIN_DESCRIPTION}`
            : null}
        </p>
        <p className="text-xs text-muted-foreground">
          Tip: don&rsquo;t include your phone or email — renters reach you via
          mdeai chat.
        </p>
      </div>

      {rejection ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4 space-y-2"
          data-testid="step4-rejection"
        >
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="w-4 h-4" />
            Listing rejected by automated review
          </div>
          <ul className="text-sm text-foreground list-disc pl-5 space-y-1">
            {rejection.reasons.map((reason) => (
              <li key={reason}>{prettyReason(reason)}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground pt-2">
            Fix the items above and click Submit again.
          </p>
        </div>
      ) : null}

      {submitMutation.error && !rejection ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {submitMutation.error.message}
        </div>
      ) : null}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="flex-1"
          onClick={onBack}
          disabled={submitMutation.isPending}
          data-testid="step4-back"
        >
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          onClick={handleSubmit}
          disabled={submitDisabled}
          data-testid="step4-submit"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Submit listing
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

const REASON_COPY: Record<string, string> = {
  photos_lt_5: "Add at least 5 photos.",
  outside_medellin_metro:
    "We currently only list properties inside Medellín metro.",
  contact_info_in_description:
    "Remove phone numbers or email from the description (renters reach you via chat).",
  price_out_of_range_cop: "Monthly price must be 200,000–15,000,000 COP.",
  price_out_of_range_usd: "Monthly price must be 50–5,000 USD.",
  description_too_short: `Make the description at least ${MIN_DESCRIPTION} characters.`,
};

function prettyReason(code: string): string {
  return REASON_COPY[code] ?? code;
}
