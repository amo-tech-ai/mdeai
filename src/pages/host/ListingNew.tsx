import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { trackEvent } from "@/lib/posthog";
import { cn } from "@/lib/utils";
import { useOwnLandlordProfile } from "@/hooks/host/useLandlordOnboarding";
import { useListingDraft } from "@/hooks/host/useListingDraft";
import { Step1Address } from "@/components/host/listing/ListingForm/Step1Address";
import { Step2Specs } from "@/components/host/listing/ListingForm/Step2Specs";
import { Step3Photos } from "@/components/host/listing/ListingForm/Step3Photos";
import { Step4Description } from "@/components/host/listing/ListingForm/Step4Description";

/**
 * /host/listings/new — 4-step listing wizard.
 *
 * D4 ships steps 1-3 (address + specs + photos). Step 4 (title +
 * description + auto-moderation submit) lands D5 with the
 * `listing-create` edge fn.
 *
 * Auth gate (matches /host/onboarding):
 *   anon              -> /login?returnTo=/host/listings/new
 *   renter            -> /dashboard
 *   landlord (no row) -> /host/onboarding (must finish onboarding first)
 *   landlord          -> wizard
 *
 * Per-step durations are tracked via PostHog (listing_create_step events
 * land in D5 plan — for D4 we fire the existing onboarding_step_completed
 * shape with step values 11/12/13 to clearly distinguish them in PostHog).
 */

type WizardStep = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Address",
  2: "Specs",
  3: "Photos",
  4: "Description",
};

export default function HostListingNew() {
  const { user, loading } = useAuth();
  const {
    data: existingProfile,
    isLoading: profileLoading,
  } = useOwnLandlordProfile();

  const { draftId, draft, updateDraft, clearDraft } = useListingDraft();

  const [step, setStep] = useState<WizardStep>(1);
  const stepStartRef = useRef<number>(Date.now());
  const wizardStartRef = useRef<number>(Date.now());

  useEffect(() => {
    stepStartRef.current = Date.now();
  }, [step]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2
          className="w-6 h-6 animate-spin text-muted-foreground"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?returnTo=%2Fhost%2Flistings%2Fnew" replace />;
  }

  const accountType = user.user_metadata?.account_type;
  if (accountType !== "landlord") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!existingProfile) {
    // Landlord exists but hasn't finished onboarding — bounce them.
    return <Navigate to="/host/onboarding" replace />;
  }

  const advance = (next: WizardStep) => {
    const durationSec = Math.max(
      1,
      Math.round((Date.now() - stepStartRef.current) / 1000),
    );
    trackEvent({
      name: "listing_create_step",
      step,
      durationSec,
    });
    setStep(next);
  };

  const handleStep1Submit = () => advance(2);
  const handleStep2Submit = () => advance(3);
  const handleStep3Submit = () => advance(4);

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10 sm:px-10 sm:py-14">
      <div className="max-w-3xl w-full mx-auto">
        <div className="flex items-center justify-between mb-10">
          <BrandLogo variant="header" />
          {step > 1 && step < 4 ? (
            <button
              type="button"
              onClick={() =>
                setStep((s) => Math.max(1, s - 1) as WizardStep)
              }
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              data-testid="listing-wizard-back"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : null}
        </div>

        <Stepper currentStep={step} />

        <header className="mt-8 mb-6">
          <p className="text-xs font-medium text-primary uppercase tracking-wider">
            Step {step} of 4
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-foreground">
            {step === 1
              ? "Where is your property?"
              : step === 2
                ? "Tell us the specs"
                : step === 3
                  ? "Add photos"
                  : "Title + description"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {step === 1
              ? "Type the address — we'll auto-fill the city + neighborhood + map pin."
              : step === 2
                ? "Bedrooms, price, amenities. Renters filter on these."
                : step === 3
                  ? "5+ photos required. The first one is your cover image."
                  : "One title + a real description. Auto-moderation runs on submit."}
          </p>
        </header>

        {step === 1 ? (
          <Step1Address
            value={{
              address: draft.address,
              city: draft.city,
              neighborhood: draft.neighborhood,
              latitude: draft.latitude,
              longitude: draft.longitude,
            }}
            onChange={(next) => updateDraft(next)}
            onSubmit={handleStep1Submit}
          />
        ) : null}

        {step === 2 ? (
          <Step2Specs
            value={{
              bedrooms: draft.bedrooms,
              bathrooms: draft.bathrooms,
              size_sqm: draft.size_sqm,
              furnished: draft.furnished,
              price_monthly: draft.price_monthly,
              currency: draft.currency,
              minimum_stay_days: draft.minimum_stay_days,
              amenities: draft.amenities,
              building_amenities: draft.building_amenities,
            }}
            onChange={(next) => updateDraft(next)}
            onSubmit={handleStep2Submit}
            onBack={() => setStep(1)}
          />
        ) : null}

        {step === 3 ? (
          <Step3Photos
            draftId={draftId}
            value={draft.images}
            onChange={(images) => updateDraft({ images })}
            onSubmit={handleStep3Submit}
            onBack={() => setStep(2)}
          />
        ) : null}

        {step === 4 ? (
          <Step4Description
            draft={draft}
            onChange={(next) =>
              updateDraft({
                title: next.title,
                description: next.description,
              })
            }
            onBack={() => setStep(3)}
            onSuccess={clearDraft}
          />
        ) : null}

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Drafts are saved locally —{" "}
          <Link to="/dashboard" className="text-primary hover:underline">
            go to dashboard
          </Link>{" "}
          and pick this back up later.
        </p>
      </div>
    </div>
  );
}

function Stepper({ currentStep }: { currentStep: WizardStep }) {
  return (
    <ol
      className="grid grid-cols-4 gap-2"
      aria-label="Listing wizard progress"
      data-testid="listing-wizard-stepper"
    >
      {([1, 2, 3, 4] as const).map((n) => {
        const state =
          currentStep === n
            ? "current"
            : currentStep > n
              ? "complete"
              : "upcoming";
        return (
          <li key={n} className="flex flex-col gap-2" data-step={n}>
            <span
              className={cn(
                "h-1.5 rounded-full",
                state === "complete" && "bg-primary",
                state === "current" && "bg-primary/60",
                state === "upcoming" && "bg-border",
              )}
              aria-current={state === "current" ? "step" : undefined}
            />
            <span
              className={cn(
                "text-xs font-medium",
                state === "upcoming"
                  ? "text-muted-foreground"
                  : "text-foreground",
              )}
            >
              {n}. {STEP_LABELS[n]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

