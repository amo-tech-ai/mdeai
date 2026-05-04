import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useSponsorsWizard } from "@/hooks/sponsor/useSponsorsWizard";
import { Step1Company }  from "@/components/sponsor/wizard/Step1Company";
import { Step2Package }  from "@/components/sponsor/wizard/Step2Package";
import { Step3Assets }   from "@/components/sponsor/wizard/Step3Assets";
import { Step4Review }   from "@/components/sponsor/wizard/Step4Review";
import type {
  SponsorOrganizationInput,
  SponsorApplicationInput,
  SponsorAssetInput,
} from "@/types/sponsor";

export default function SponsorApply() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wizard   = useSponsorsWizard();

  function handleNext(
    key: "organization" | "application" | "assets",
    data: SponsorOrganizationInput | SponsorApplicationInput | SponsorAssetInput,
  ) {
    wizard.setStepData(key, data);
    wizard.goNext();
  }

  async function handleSubmit() {
    try {
      const result = await wizard.submitApplicationMutation.mutateAsync();
      if (result?.data?.application_id) {
        wizard.clearDraft();
        toast.success("Application submitted! We'll be in touch within 48 hours.");
        navigate(`/sponsor/dashboard/${result.data.application_id}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Submission failed. Please try again.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl font-bold mb-2">Sponsor an Event</h1>
        <p className="text-muted-foreground mb-4">Step {wizard.step} of 4</p>
        <Progress value={wizard.step * 25} className="mb-8" />

        {wizard.step === 1 && (
          <Step1Company
            defaultValues={wizard.draft.organization}
            onNext={(d) =>
              handleNext("organization", d as SponsorOrganizationInput)
            }
          />
        )}

        {wizard.step === 2 && (
          <Step2Package
            defaultValues={wizard.draft.application}
            onNext={(d) =>
              handleNext("application", d as SponsorApplicationInput)
            }
            onBack={wizard.goBack}
          />
        )}

        {wizard.step === 3 && (
          <Step3Assets
            defaultValues={wizard.draft.assets}
            onNext={(d) => handleNext("assets", d as SponsorAssetInput)}
            onBack={wizard.goBack}
          />
        )}

        {wizard.step === 4 && (
          <Step4Review
            draft={wizard.draft}
            onBack={wizard.goBack}
            onSubmit={handleSubmit}
            isSubmitting={wizard.submitApplicationMutation.isPending}
            user={user}
          />
        )}
      </div>
    </div>
  );
}
