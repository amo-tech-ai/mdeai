import { Navigate } from "react-router-dom";
import { OnboardingProvider, useOnboarding } from "@/context/OnboardingContext";
import { useAuth } from "@/hooks/useAuth";
import {
  UserTypeStep,
  StayDurationStep,
  NeighborhoodsStep,
  BudgetStep,
  InterestsStep,
  CompleteStep,
} from "@/components/onboarding/steps";

function OnboardingSteps() {
  const { currentStep } = useOnboarding();

  switch (currentStep) {
    case 1:
      return <UserTypeStep />;
    case 2:
      return <StayDurationStep />;
    case 3:
      return <NeighborhoodsStep />;
    case 4:
      return <BudgetStep />;
    case 5:
      return <InterestsStep />;
    case 6:
      return <CompleteStep />;
    default:
      return <UserTypeStep />;
  }
}

export default function Onboarding() {
  // Landlords accidentally land here in two ways:
  //   1. Old links / external bookmarks pointing at /onboarding
  //   2. The post-signup-confirmation flow with no overriding redirect
  // The renter wizard (Digital Nomad / Expat / Local / Traveler) has no
  // bearing on a landlord and silently captures them as a "renter" in
  // analytics. Bounce them to /host/onboarding so they land in the right
  // wizard. (P1 bug found in QA 2026-05-02.)
  //
  // Anonymous users see the renter wizard as a marketing page — no auth
  // gate. Renter signed-in users see it as their proper onboarding flow.
  const { user, loading } = useAuth();

  // Don't redirect while we're still resolving the session — would flicker
  // through the renter wizard before the redirect could take effect.
  if (loading) {
    return null;
  }

  if (user?.user_metadata?.account_type === "landlord") {
    return <Navigate to="/host/onboarding" replace />;
  }

  return (
    <OnboardingProvider>
      <OnboardingSteps />
    </OnboardingProvider>
  );
}
