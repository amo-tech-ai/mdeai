import { ReactNode } from "react";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/OnboardingContext";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

interface OnboardingLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  stepTitle: string;
  stepDescription: string;
}

const stepLabels = [
  "User Type",
  "Stay Duration",
  "Neighborhoods",
  "Budget",
  "Interests",
  "Complete",
];

export function OnboardingLayout({
  children,
  rightPanel,
  stepTitle,
  stepDescription,
}: OnboardingLayoutProps) {
  const {
    currentStep,
    totalSteps,
    progress,
    canGoNext,
    canGoBack,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    isLoading,
    data,
  } = useOnboarding();

  // Calculate remaining time (rough estimate)
  const remainingSteps = totalSteps - currentStep;
  const remainingMinutes = Math.max(1, Math.ceil(remainingSteps * 0.5));

  // Determine actual step number displayed (accounting for skipped steps)
  const displayStep = data.userType === "local" && currentStep >= 3 
    ? currentStep - 1 
    : currentStep;
  const displayTotal = data.userType === "local" ? totalSteps - 1 : totalSteps;

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: 3-Panel Layout */}
      <div className="hidden lg:grid lg:grid-cols-[320px_1fr_380px] min-h-screen">
        {/* LEFT PANEL: Context */}
        <aside className="border-r border-border bg-secondary/30 p-8 flex flex-col">
          <div className="mb-12 space-y-3">
            <BrandLogo variant="sidebar" className="max-w-[300px]" />
            <p className="text-sm text-muted-foreground">Your personal concierge</p>
          </div>

          {/* Progress */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {displayStep}
                </div>
                <span className="text-sm font-medium text-foreground">
                  of {displayTotal} steps
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                {stepLabels[currentStep - 1]}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{stepDescription}</p>
            </div>

            {/* Step indicators */}
            <div className="space-y-2">
              {stepLabels.map((label, index) => {
                const stepNum = index + 1;
                // Skip step 2 display for locals
                if (data.userType === "local" && stepNum === 2) return null;
                
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                
                return (
                  <div
                    key={label}
                    className={cn(
                      "flex items-center gap-3 text-sm transition-colors",
                      isCompleted && "text-primary",
                      isCurrent && "text-foreground font-medium",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        isCompleted && "bg-primary",
                        isCurrent && "bg-primary ring-4 ring-primary/20",
                        !isCompleted && !isCurrent && "bg-muted-foreground/30"
                      )}
                    />
                    {label}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>~{remainingMinutes} minute{remainingMinutes !== 1 ? "s" : ""} remaining</span>
            </div>
          </div>

          <div className="mt-auto">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={skipOnboarding}
            >
              Skip for now
            </Button>
          </div>
        </aside>

        {/* CENTER PANEL: Work */}
        <main className="p-12 flex flex-col">
          <div className="max-w-2xl mx-auto w-full flex-1">
            <h1 className="font-display text-4xl font-semibold text-foreground mb-2">
              {stepTitle}
            </h1>
            <p className="text-lg text-muted-foreground mb-10">{stepDescription}</p>

            {children}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-border max-w-2xl mx-auto w-full">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={!canGoBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            {isLastStep ? (
              <Button
                onClick={completeOnboarding}
                disabled={isLoading}
                className="gap-2 px-8"
              >
                {isLoading ? "Saving..." : "Get Started"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canGoNext}
                className="gap-2 px-8"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </main>

        {/* RIGHT PANEL: Intelligence */}
        <aside className="border-l border-border bg-secondary/30 p-8">
          {rightPanel}
        </aside>
      </div>

      {/* Tablet & Mobile: Single Column */}
      <div className="lg:hidden min-h-screen flex flex-col">
        <header className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-lg font-semibold">
              Step {displayStep} of {displayTotal}
            </h1>
            <span className="text-sm text-muted-foreground">
              {stepLabels[currentStep - 1]}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <main className="flex-1 p-6">
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            {stepTitle}
          </h1>
          <p className="text-muted-foreground mb-6">{stepDescription}</p>
          {children}
        </main>

        <footer className="p-4 border-t border-border bg-card safe-area-inset-bottom">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={prevStep}
              disabled={!canGoBack}
            >
              Back
            </Button>
            {isLastStep ? (
              <Button
                className="flex-1"
                onClick={completeOnboarding}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Get Started"}
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={nextStep}
                disabled={!canGoNext}
              >
                Continue
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
