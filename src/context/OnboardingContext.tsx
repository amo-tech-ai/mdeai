import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Types
export type UserType = "nomad" | "expat" | "local" | "traveler" | null;
export type StayDuration = "visiting" | "short" | "medium" | "long" | null;
export type BudgetLevel = "budget" | "moderate" | "comfortable" | "luxury" | null;

export interface OnboardingData {
  userType: UserType;
  stayDuration: StayDuration;
  neighborhoods: string[];
  budgetLevel: BudgetLevel;
  monthlyBudget: number | null;
  interests: string[];
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface OnboardingContextType {
  currentStep: OnboardingStep;
  data: OnboardingData;
  totalSteps: number;
  progress: number;
  isLoading: boolean;
  
  // Navigation
  goToStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: boolean;
  canGoBack: boolean;
  
  // Data setters
  setUserType: (type: UserType) => void;
  setStayDuration: (duration: StayDuration) => void;
  toggleNeighborhood: (neighborhood: string) => void;
  setBudgetLevel: (level: BudgetLevel) => void;
  setMonthlyBudget: (budget: number | null) => void;
  toggleInterest: (interest: string) => void;
  
  // Actions
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => void;
}

const defaultData: OnboardingData = {
  userType: null,
  stayDuration: null,
  neighborhoods: [],
  budgetLevel: null,
  monthlyBudget: null,
  interests: [],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  
  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  // Validation for each step
  const isStepValid = useCallback((step: OnboardingStep): boolean => {
    switch (step) {
      case 1: return data.userType !== null;
      case 2: return data.userType === "local" || data.stayDuration !== null;
      case 3: return data.neighborhoods.length >= 1;
      case 4: return data.budgetLevel !== null;
      case 5: return data.interests.length >= 3;
      case 6: return true;
      default: return false;
    }
  }, [data]);

  const canGoNext = isStepValid(currentStep);
  const canGoBack = currentStep > 1;

  // Navigation
  const goToStep = useCallback((step: OnboardingStep) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (canGoNext && currentStep < totalSteps) {
      // Skip step 2 for locals (they don't need stay duration)
      if (currentStep === 1 && data.userType === "local") {
        setCurrentStep(3);
      } else {
        setCurrentStep((prev) => (prev + 1) as OnboardingStep);
      }
    }
  }, [canGoNext, currentStep, data.userType]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      // Skip step 2 when going back for locals
      if (currentStep === 3 && data.userType === "local") {
        setCurrentStep(1);
      } else {
        setCurrentStep((prev) => (prev - 1) as OnboardingStep);
      }
    }
  }, [currentStep, data.userType]);

  // Data setters
  const setUserType = useCallback((type: UserType) => {
    setData((prev) => ({ ...prev, userType: type }));
  }, []);

  const setStayDuration = useCallback((duration: StayDuration) => {
    setData((prev) => ({ ...prev, stayDuration: duration }));
  }, []);

  const toggleNeighborhood = useCallback((neighborhood: string) => {
    setData((prev) => ({
      ...prev,
      neighborhoods: prev.neighborhoods.includes(neighborhood)
        ? prev.neighborhoods.filter((n) => n !== neighborhood)
        : [...prev.neighborhoods, neighborhood],
    }));
  }, []);

  const setBudgetLevel = useCallback((level: BudgetLevel) => {
    const budgetMap: Record<NonNullable<BudgetLevel>, number> = {
      budget: 750,
      moderate: 1500,
      comfortable: 2750,
      luxury: 5000,
    };
    setData((prev) => ({
      ...prev,
      budgetLevel: level,
      monthlyBudget: level ? budgetMap[level] : null,
    }));
  }, []);

  const setMonthlyBudget = useCallback((budget: number | null) => {
    setData((prev) => ({ ...prev, monthlyBudget: budget }));
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Save to localStorage for anonymous users
      localStorage.setItem("onboarding_data", JSON.stringify(data));
      localStorage.setItem("onboarding_completed", "true");

      // Save to database if authenticated
      if (user) {
        // Update user_preferences
        const { error: prefError } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            travel_style: data.userType ? [data.userType] : [],
            adventure_level: data.stayDuration || "medium",
            price_range_preference: data.budgetLevel || "moderate",
            default_budget_per_day: data.monthlyBudget ? Math.round(data.monthlyBudget / 30) : 50,
            event_categories: data.interests,
            ambiance_preferences: data.neighborhoods,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (prefError) {
          console.error("Error saving preferences:", prefError);
        }

        // Update profile onboarding_completed flag
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }

      toast.success("Welcome to mdeai.co!", {
        description: "Your preferences have been saved.",
      });

      navigate("/explore");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [data, user, navigate]);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem("onboarding_skipped", "true");
    navigate("/");
  }, [navigate]);

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        data,
        totalSteps,
        progress,
        isLoading,
        goToStep,
        nextStep,
        prevStep,
        canGoNext,
        canGoBack,
        setUserType,
        setStayDuration,
        toggleNeighborhood,
        setBudgetLevel,
        setMonthlyBudget,
        toggleInterest,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
