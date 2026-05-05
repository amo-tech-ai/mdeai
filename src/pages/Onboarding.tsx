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
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.user_metadata?.account_type === "landlord") {
    return <Navigate to="/host/onboarding" replace />;
  }

  return (
    <OnboardingProvider>
      <OnboardingSteps />
    </OnboardingProvider>
  );
}
