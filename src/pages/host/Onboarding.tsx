import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/posthog";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";
import { Step1Basics } from "@/components/host/onboarding/Step1Basics";
import { Step2Verification } from "@/components/host/onboarding/Step2Verification";
import { Step3Welcome } from "@/components/host/onboarding/Step3Welcome";
import {
  useOwnLandlordProfile,
  useSubmitStep1Basics,
  useSubmitVerification,
  type Step1BasicsInput,
  type DocKind,
} from "@/hooks/host/useLandlordOnboarding";

/**
 * /host/onboarding — landlord 3-step wizard. Replaces the D2 stub.
 *
 * State machine:
 *   step 1 (basics)        — INSERT/UPDATE landlord_profiles row
 *   step 2 (verification)  — OPTIONAL: upload to identity-docs bucket +
 *                            INSERT verification_requests row
 *   step 3 (welcome)       — fires onboarding_completed PostHog event;
 *                            CTAs to listings/new + dashboard
 *
 * Auth gate (same as D2 stub):
 *   anon       -> /login?returnTo=/host/onboarding
 *   renter     -> /dashboard
 *   landlord   -> wizard
 *
 * Step durations are timed and reported via onboarding_step_completed so
 * we can spot UX friction (per plan §7.2 — durationSec on every step).
 */

type WizardStep = 1 | 2 | 3;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Your basics",
  2: "Verification",
  3: "All set",
};

export default function HostOnboarding() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { data: existingProfile, isLoading: profileLoading } =
    useOwnLandlordProfile();

  // ALL HOOKS MUST RUN ON EVERY RENDER — no conditional early returns above
  // this block. Auth-gated rendering happens via the JSX returned later.
  const [step, setStep] = useState<WizardStep>(1);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  // Wall-clock timestamps for the duration metrics. Refs so re-renders
  // don't reset them; the start timestamp is set when each step is shown.
  const stepStartRef = useRef<number>(Date.now());
  const wizardStartRef = useRef<number>(Date.now());
  // Fire onboarding_completed exactly once when the user reaches Step 3.
  const completedFiredRef = useRef(false);

  const submitStep1 = useSubmitStep1Basics();
  const submitVerification = useSubmitVerification();

  // Reset stepStart when the visible step changes — drives the per-step
  // durationSec metric (time from when the user saw the step to when they
  // submitted it). The wizardStart timestamp only resets when the wizard
  // mounts.
  useEffect(() => {
    stepStartRef.current = Date.now();
  }, [step]);

  // useEffect dependency on `step` covers both natural progression
  // (step 2 -> 3) and rare manual jumps (browser back/forward).
  useEffect(() => {
    if (step !== 3 || completedFiredRef.current) return;
    completedFiredRef.current = true;
    const totalDurationSec = Math.max(
      1,
      Math.round((Date.now() - wizardStartRef.current) / 1000),
    );
    trackEvent({ name: "onboarding_completed", totalDurationSec });
    const durationSec = Math.max(
      1,
      Math.round((Date.now() - stepStartRef.current) / 1000),
    );
    trackEvent({
      name: "onboarding_step_completed",
      step: 3,
      durationSec,
    });
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
    return <Navigate to="/login?returnTo=%2Fhost%2Fonboarding" replace />;
  }

  const accountType = user.user_metadata?.account_type;
  if (accountType !== "landlord") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleStep1Submit = (values: Step1BasicsInput) => {
    submitStep1.mutate(values, {
      onSuccess: () => {
        const durationSec = Math.max(
          1,
          Math.round((Date.now() - stepStartRef.current) / 1000),
        );
        trackEvent({
          name: "onboarding_step_completed",
          step: 1,
          durationSec,
        });
        toast({
          title: "Profile saved",
          description: "Two more steps to go.",
        });
        setStep(2);
      },
      onError: (err) => {
        toast({
          title: "Couldn't save your profile",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      },
    });
  };

  const handleStep2Submit = (input: { docKind: DocKind; file: File }) => {
    if (!existingProfile && !submitStep1.data) {
      toast({
        title: "Finish step 1 first",
        description: "We need your basics before we can attach a document.",
        variant: "destructive",
      });
      return;
    }
    const landlord_id =
      submitStep1.data?.id ?? existingProfile?.id;
    if (!landlord_id) return;
    submitVerification.mutate(
      { doc_kind: input.docKind, file: input.file, landlord_id },
      {
        onSuccess: () => {
          const durationSec = Math.max(
            1,
            Math.round((Date.now() - stepStartRef.current) / 1000),
          );
          trackEvent({
            name: "onboarding_step_completed",
            step: 2,
            durationSec,
          });
          setVerificationSubmitted(true);
          toast({
            title: "Document received",
            description: "Founder typically reviews within 24 hours.",
          });
          setStep(3);
        },
        onError: (err) => {
          toast({
            title: "Upload failed",
            description: err instanceof Error ? err.message : String(err),
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleStep2Skip = () => {
    const durationSec = Math.max(
      1,
      Math.round((Date.now() - stepStartRef.current) / 1000),
    );
    trackEvent({
      name: "onboarding_step_completed",
      step: 2,
      durationSec,
    });
    setStep(3);
  };

  const profile = submitStep1.data ?? existingProfile;
  const displayName = profile?.display_name ?? "host";

  const step1Defaults: Partial<Step1BasicsInput> | undefined = existingProfile
    ? {
        display_name: existingProfile.display_name,
        kind: existingProfile.kind,
        whatsapp_e164: existingProfile.whatsapp_e164 ?? "+57",
        primary_neighborhood: existingProfile.primary_neighborhood,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-10 sm:px-10 sm:py-14">
      <div className="max-w-2xl w-full mx-auto">
        <div className="flex items-center justify-between mb-10">
          <BrandLogo variant="header" />
          {step > 1 && step < 3 ? (
            <button
              type="button"
              onClick={() =>
                setStep((s) => (s === 2 ? 1 : (s - 1)) as WizardStep)
              }
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : null}
        </div>

        <Stepper currentStep={step} />

        <header className="mt-8 mb-6">
          <p className="text-xs font-medium text-primary uppercase tracking-wider">
            Step {step} of 3
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-foreground">
            {step === 1
              ? "Tell us about you"
              : step === 2
                ? "Verify (optional)"
                : "You're in."}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {step === 1
              ? "Two minutes — we'll show this on your public host profile."
              : step === 2
                ? "Earn the verified badge with one document. Skippable."
                : "Welcome to the Founding Beta."}
          </p>
        </header>

        {step === 1 ? (
          <Step1Basics
            initialValues={step1Defaults}
            onSubmit={handleStep1Submit}
            isSubmitting={submitStep1.isPending}
            errorMessage={
              submitStep1.error instanceof Error
                ? submitStep1.error.message
                : null
            }
          />
        ) : null}
        {step === 2 ? (
          <Step2Verification
            onSubmit={handleStep2Submit}
            onSkip={handleStep2Skip}
            isSubmitting={submitVerification.isPending}
            errorMessage={
              submitVerification.error instanceof Error
                ? submitVerification.error.message
                : null
            }
          />
        ) : null}
        {step === 3 ? (
          <Step3Welcome
            displayName={displayName}
            verificationSubmitted={verificationSubmitted}
          />
        ) : null}

        <p className="mt-12 text-center text-xs text-muted-foreground">
          You can always{" "}
          <Link to="/dashboard" className="text-primary hover:underline">
            go to dashboard
          </Link>{" "}
          and finish later.
        </p>
      </div>
    </div>
  );
}

interface StepperProps {
  currentStep: WizardStep;
}

function Stepper({ currentStep }: StepperProps) {
  return (
    <ol
      className="grid grid-cols-3 gap-2"
      aria-label="Onboarding progress"
      data-testid="wizard-stepper"
    >
      {([1, 2, 3] as const).map((n) => {
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
