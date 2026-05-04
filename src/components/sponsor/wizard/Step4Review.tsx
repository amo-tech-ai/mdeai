import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIER_LABELS } from "@/types/sponsor";
import type { WizardDraft } from "@/types/sponsor";

interface AuthUser {
  id: string;
}

interface Step4ReviewProps {
  draft:        WizardDraft;
  onBack:       () => void;
  onSubmit:     () => void;
  isSubmitting: boolean;
  user:         AuthUser | null;
}

const ACTIVATION_LABELS: Record<string, string> = {
  title_naming:        "Title / Naming Rights",
  category_powered_by: "Category Powered By",
  contestant_sponsor:  "Contestant Sponsor",
  venue_sponsor:       "Venue Sponsor",
  digital:             "Digital",
};

export function Step4Review({
  draft,
  onBack,
  onSubmit,
  isSubmitting,
  user,
}: Step4ReviewProps) {
  const { organization, application } = draft;

  // ── Not signed in ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4 text-center">
          <p className="font-medium">Sign in to submit your application</p>
          <p className="text-sm text-muted-foreground">
            Create an account or sign in to submit your sponsorship application.
            Your progress has been saved.
          </p>
          <Button asChild className="w-full">
            <Link to="/login?redirect=/sponsor/apply">Sign In</Link>
          </Button>
          <Button variant="outline" onClick={onBack} className="w-full">
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Review summary ───────────────────────────────────────────────────────────
  const rows: { label: string; value: string | undefined }[] = [
    { label: "Organization",    value: organization.display_name },
    { label: "Legal Name",      value: organization.legal_name },
    { label: "Contact",         value: organization.contact_full_name },
    { label: "Email",           value: organization.contact_email },
    { label: "Event",           value: application.event_title },
    { label: "Activation Type", value: application.activation_type ? ACTIVATION_LABELS[application.activation_type] : undefined },
    {
      label: "Sponsorship Tier",
      value: application.tier
        ? `${application.tier.charAt(0).toUpperCase() + application.tier.slice(1)} — ${TIER_LABELS[application.tier as keyof typeof TIER_LABELS]}`
        : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex justify-between py-3 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-right max-w-[60%] truncate">
                  {value ?? <span className="text-muted-foreground italic">—</span>}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        By proceeding, you confirm the information above is accurate and agree to
        our sponsorship terms. Payment instructions will be sent after review.
      </p>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting…
            </>
          ) : (
            "Proceed to Payment"
          )}
        </Button>
      </div>
    </div>
  );
}
